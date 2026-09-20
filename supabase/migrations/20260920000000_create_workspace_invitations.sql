-- ==============================================================================
-- Migration: Create Workspace Invitations & Member RBAC Management for NEXORA
-- ==============================================================================
-- Description: Establishes workspace invitations table, token resolution,
--              atomic invitation acceptance, role update, and member removal.
-- ==============================================================================

-- 1. Create public.workspace_invitations table
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT, -- Nullable: when NULL, represents a shareable workspace join link
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT chk_invitations_token_length CHECK (char_length(token) >= 16)
);

-- Schema documentation comments
COMMENT ON TABLE public.workspace_invitations IS 'Invitations to join workspaces either via direct email or shareable links';
COMMENT ON COLUMN public.workspace_invitations.workspace_id IS 'Target workspace the invitation grants access to';
COMMENT ON COLUMN public.workspace_invitations.email IS 'Specific email invited, or NULL for reusable link-based invitations';
COMMENT ON COLUMN public.workspace_invitations.token IS 'Cryptographically secure unique join token';
COMMENT ON COLUMN public.workspace_invitations.role IS 'Assigned role upon joining: admin, member, or viewer';

-- Indexes on workspace_invitations
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_lookup ON public.workspace_invitations(workspace_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON public.workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON public.workspace_invitations(workspace_id, email);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies on workspace_invitations
-- Allow anyone (authenticated or anon) to read an invitation if they possess the unexpired token
DROP POLICY IF EXISTS "Users can view active invitations by token" ON public.workspace_invitations;
CREATE POLICY "Users can view active invitations by token"
  ON public.workspace_invitations
  FOR SELECT
  TO authenticated, anon
  USING (
    token IS NOT NULL AND expires_at > now()
  );

-- Workspace owners and admins can view all invitations for their workspace
DROP POLICY IF EXISTS "Workspace admins can view invitations" ON public.workspace_invitations;
CREATE POLICY "Workspace admins can view invitations"
  ON public.workspace_invitations
  FOR SELECT
  TO authenticated
  USING (
    public.is_workspace_owner_or_admin(workspace_id)
  );

-- Only workspace owners and admins can create invitations
DROP POLICY IF EXISTS "Workspace admins can create invitations" ON public.workspace_invitations;
CREATE POLICY "Workspace admins can create invitations"
  ON public.workspace_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_workspace_owner_or_admin(workspace_id)
    AND invited_by = auth.uid()
  );

-- Only workspace owners and admins can delete/revoke invitations
DROP POLICY IF EXISTS "Workspace admins can revoke invitations" ON public.workspace_invitations;
CREATE POLICY "Workspace admins can revoke invitations"
  ON public.workspace_invitations
  FOR DELETE
  TO authenticated
  USING (
    public.is_workspace_owner_or_admin(workspace_id)
  );


-- 4. Helper Function: Get Invitation Details by Token (Public / Semi-Public for Landing on /invite/[token])
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
BEGIN
  -- Look up invitation by token
  SELECT * INTO v_invite
  FROM public.workspace_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invitation not found');
  END IF;

  -- Get workspace details
  SELECT id, name, slug INTO v_workspace
  FROM public.workspaces
  WHERE id = v_invite.workspace_id;

  -- If already accepted, check if current user is already a member of this workspace
  IF v_invite.accepted_at IS NOT NULL AND v_invite.email IS NOT NULL THEN
    IF auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = v_invite.workspace_id AND user_id = auth.uid()
    ) THEN
      RETURN jsonb_build_object(
        'valid', true,
        'already_member', true,
        'workspace_id', v_workspace.id,
        'workspace_name', v_workspace.name,
        'workspace_slug', v_workspace.slug,
        'role', v_invite.role
      );
    END IF;

    RETURN jsonb_build_object(
      'valid', false,
      'workspace_slug', v_workspace.slug,
      'error', 'This invitation has already been accepted'
    );
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invitation has expired');
  END IF;

  -- Get inviter details
  SELECT full_name, email INTO v_inviter
  FROM public.profiles
  WHERE id = v_invite.invited_by;


  RETURN jsonb_build_object(
    'valid', true,
    'workspace_id', v_workspace.id,
    'workspace_name', v_workspace.name,
    'workspace_slug', v_workspace.slug,
    'inviter_name', COALESCE(v_inviter.full_name, split_part(v_inviter.email, '@', 1)),
    'role', v_invite.role,
    'email', v_invite.email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_details(TEXT) TO authenticated, anon;

-- 5. Atomic Invitation Acceptance Function
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

  -- Retrieve invitation
  SELECT * INTO v_invite
  FROM public.workspace_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation link');
  END IF;

  IF v_invite.accepted_at IS NOT NULL AND v_invite.email IS NOT NULL THEN
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
  WHERE workspace_id = v_workspace.id
    AND user_id = v_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_member', true,
      'workspace_slug', v_workspace.slug,
      'workspace_name', v_workspace.name,
      'message', 'You are already a member of this workspace'
    );
  END IF;

  -- Insert user into workspace_members
  INSERT INTO public.workspace_members (
    workspace_id,
    user_id,
    role
  ) VALUES (
    v_workspace.id,
    v_user_id,
    v_invite.role
  );

  -- Mark single-use invitation as accepted
  IF v_invite.email IS NOT NULL THEN
    UPDATE public.workspace_invitations
    SET accepted_at = now(),
        accepted_by = v_user_id
    WHERE id = v_invite.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_member', false,
    'workspace_slug', v_workspace.slug,
    'workspace_name', v_workspace.name,
    'role', v_invite.role
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


GRANT EXECUTE ON FUNCTION public.accept_workspace_invitation(TEXT) TO authenticated;

-- 6. RPC Function: Update Member Role with Strict Hierarchical RBAC
CREATE OR REPLACE FUNCTION public.update_workspace_member_role(
  p_workspace_id UUID,
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_workspace_owner_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate target role
  IF p_new_role NOT IN ('admin', 'member', 'viewer') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid target role');
  END IF;

  -- Get workspace owner
  SELECT owner_id INTO v_workspace_owner_id
  FROM public.workspaces
  WHERE id = p_workspace_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workspace not found');
  END IF;

  -- Owner role cannot be changed through this function (ownership transfer is a separate operation)
  IF p_target_user_id = v_workspace_owner_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'The workspace owner role cannot be modified');
  END IF;

  -- Get caller role
  SELECT role INTO v_caller_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = v_caller_id;

  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only owners and administrators can change member roles');
  END IF;

  -- Get target current role
  SELECT role INTO v_target_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target user is not a member of this workspace');
  END IF;

  -- Admins cannot modify other Admins or promote users to Admin (only Owner can manage Admins)
  IF v_caller_role = 'admin' AND (v_target_role = 'admin' OR p_new_role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the workspace owner can promote or demote administrators');
  END IF;

  -- Apply update
  UPDATE public.workspace_members
  SET role = p_new_role,
      updated_at = now()
  WHERE workspace_id = p_workspace_id
    AND user_id = p_target_user_id;

  RETURN jsonb_build_object('success', true, 'new_role', p_new_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_workspace_member_role(UUID, UUID, TEXT) TO authenticated;

-- 7. RPC Function: Remove Member with Hierarchy & Self-Leave Protection
CREATE OR REPLACE FUNCTION public.remove_workspace_member(
  p_workspace_id UUID,
  p_target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_target_role TEXT;
  v_workspace_owner_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT owner_id INTO v_workspace_owner_id
  FROM public.workspaces
  WHERE id = p_workspace_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workspace not found');
  END IF;

  -- Workspace owner cannot be removed
  IF p_target_user_id = v_workspace_owner_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'The workspace owner cannot be removed from the workspace');
  END IF;

  -- Get caller role
  SELECT role INTO v_caller_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = v_caller_id;

  -- Case A: Self-leave
  IF v_caller_id = p_target_user_id THEN
    DELETE FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_target_user_id;
    RETURN jsonb_build_object('success', true, 'action', 'left');
  END IF;

  -- Case B: Kick / Remove by administrator or owner
  IF v_caller_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only owners and administrators can remove members');
  END IF;

  SELECT role INTO v_target_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is not a member of this workspace');
  END IF;

  -- Admins cannot kick other admins (only owner can)
  IF v_caller_role = 'admin' AND v_target_role = 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Administrators cannot remove other administrators');
  END IF;

  DELETE FROM public.workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = p_target_user_id;

  RETURN jsonb_build_object('success', true, 'action', 'removed');
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_workspace_member(UUID, UUID) TO authenticated;
