-- ==============================================================================
-- Migration: Multi-Assignee Tasks & Invitation Security Hardening
-- ==============================================================================
-- Description:
-- 1. Creates junction table public.task_assignees for multi-assignee task support
-- 2. Backfills existing task assignees from public.tasks.assignee_id
-- 3. Implements RLS policies on task_assignees
-- 4. Hardens public.workspace_invitations RLS (strictly admin/owner for list access)
-- 5. Adds is_single_use column to public.workspace_invitations
-- 6. Updates get_invitation_details and accept_workspace_invitation RPCs
-- ==============================================================================

-- 1. Create public.task_assignees table
CREATE TABLE IF NOT EXISTS public.task_assignees (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (task_id, user_id)
);

-- Schema documentation comments
COMMENT ON TABLE public.task_assignees IS 'Junction table supporting multiple member assignments per task';
COMMENT ON COLUMN public.task_assignees.task_id IS 'Assigned task reference';
COMMENT ON COLUMN public.task_assignees.user_id IS 'Assigned member profile reference';

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON public.task_assignees(user_id);

-- 2. Backfill existing task assignees from tasks.assignee_id
INSERT INTO public.task_assignees (task_id, user_id)
SELECT id, assignee_id
FROM public.tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 3. Enable RLS on task_assignees
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Select policy: Workspace members can view task assignees
DROP POLICY IF EXISTS "Workspace members can view task assignees" ON public.task_assignees;
CREATE POLICY "Workspace members can view task assignees"
  ON public.task_assignees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_assignees.task_id
        AND wm.user_id = auth.uid()
    )
  );

-- Insert/Update/Delete policy: Workspace members (owner, admin, member) can manage task assignees
DROP POLICY IF EXISTS "Workspace members can manage task assignees" ON public.task_assignees;
CREATE POLICY "Workspace members can manage task assignees"
  ON public.task_assignees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_assignees.task_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );

-- 4. Invitation Security Hardening:
-- Add is_single_use column to workspace_invitations
ALTER TABLE public.workspace_invitations
ADD COLUMN IF NOT EXISTS is_single_use BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.workspace_invitations.is_single_use IS 'When true, link expires immediately after first acceptance';

-- Restrict SELECT on workspace_invitations table directly to workspace owners and admins only
-- This prevents members and viewers from enumerating or viewing pending invitation tokens in settings
DROP POLICY IF EXISTS "Users can view active invitations by token" ON public.workspace_invitations;
DROP POLICY IF EXISTS "Workspace admins can view invitations" ON public.workspace_invitations;

CREATE POLICY "Workspace admins can view invitations"
  ON public.workspace_invitations
  FOR SELECT
  TO authenticated
  USING (
    public.is_workspace_owner_or_admin(workspace_id)
  );

-- 5. Update get_invitation_details to enforce is_single_use check
CREATE OR REPLACE FUNCTION public.get_invitation_details(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_workspace RECORD;
  v_inviter RECORD;
  v_user_id UUID;
  v_already_member BOOLEAN := false;
BEGIN
  -- Look up invitation by token
  SELECT * INTO v_invite
  FROM public.workspace_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invitation not found');
  END IF;

  -- Check expiration
  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invitation has expired');
  END IF;

  -- Check if already accepted and single-use or direct email
  IF v_invite.accepted_at IS NOT NULL AND (v_invite.email IS NOT NULL OR v_invite.is_single_use = true) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invitation has already been accepted');
  END IF;

  -- Look up workspace details
  SELECT id, name, slug INTO v_workspace
  FROM public.workspaces
  WHERE id = v_invite.workspace_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Workspace no longer exists');
  END IF;

  -- Look up inviter profile
  SELECT full_name, email INTO v_inviter
  FROM public.profiles
  WHERE id = v_invite.invited_by;

  -- Check if current authenticated user is already a member
  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = v_invite.workspace_id AND user_id = v_user_id
    ) INTO v_already_member;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'workspace_id', v_workspace.id,
    'workspace_name', v_workspace.name,
    'workspace_slug', v_workspace.slug,
    'inviter_name', COALESCE(v_inviter.full_name, split_part(v_inviter.email, '@', 1)),
    'role', v_invite.role,
    'email', v_invite.email,
    'is_single_use', v_invite.is_single_use,
    'already_member', v_already_member
  );
END;
$$;

-- 6. Update atomic invitation acceptance to enforce is_single_use
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_invite RECORD;
  v_workspace RECORD;
  v_existing_member RECORD;
BEGIN
  -- Ensure caller is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be signed in to accept an invitation');
  END IF;

  -- Get caller profile / auth email safely
  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  -- Retrieve invitation with lock
  SELECT * INTO v_invite
  FROM public.workspace_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation link');
  END IF;

  IF v_invite.accepted_at IS NOT NULL AND (v_invite.email IS NOT NULL OR v_invite.is_single_use = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has already been accepted');
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has expired');
  END IF;

  -- If specific email was targeted, ensure caller email matches
  IF v_invite.email IS NOT NULL AND lower(v_invite.email) <> lower(COALESCE(v_user_email, '')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was sent to a different email address (' || v_invite.email || ')');
  END IF;

  -- Check workspace existence
  SELECT id, slug, name INTO v_workspace
  FROM public.workspaces
  WHERE id = v_invite.workspace_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workspace no longer exists');
  END IF;

  -- Check if user is already a member
  SELECT id, role INTO v_existing_member
  FROM public.workspace_members
  WHERE workspace_id = v_invite.workspace_id
    AND user_id = v_user_id;

  IF FOUND THEN
    -- Update existing invitation record if needed
    UPDATE public.workspace_invitations
    SET accepted_at = now(),
        accepted_by = v_user_id
    WHERE id = v_invite.id;

    RETURN jsonb_build_object(
      'success', true,
      'workspace_slug', v_workspace.slug,
      'message', 'You are already a member of ' || v_workspace.name,
      'already_member', true
    );
  END IF;

  -- Insert new workspace membership
  INSERT INTO public.workspace_members (
    workspace_id,
    user_id,
    role
  ) VALUES (
    v_invite.workspace_id,
    v_user_id,
    v_invite.role
  );

  -- Record acceptance
  UPDATE public.workspace_invitations
  SET accepted_at = now(),
      accepted_by = v_user_id
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'workspace_slug', v_workspace.slug,
    'role', v_invite.role,
    'workspace_name', v_workspace.name,
    'message', 'Successfully joined ' || v_workspace.name
  );
END;
$$;
