-- ==============================================================================
-- Migration: Create Workspaces & Workspace Members for NEXORA (Multi-Tenancy)
-- ==============================================================================
-- Description: Establishes multi-tenant workspaces, membership roles, RLS policies,
--              atomic workspace creation, and owner protection triggers.
-- ==============================================================================

-- 1. Create public.workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_workspaces_name_length CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 50),
  CONSTRAINT chk_workspaces_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) >= 2 AND char_length(slug) <= 60)
);

-- Schema documentation comments
COMMENT ON TABLE public.workspaces IS 'Multi-tenant workspaces isolating organizations, projects, and data';
COMMENT ON COLUMN public.workspaces.id IS 'Unique workspace identifier';
COMMENT ON COLUMN public.workspaces.name IS 'Display name of the workspace';
COMMENT ON COLUMN public.workspaces.slug IS 'Unique URL slug for workspace-aware routing';
COMMENT ON COLUMN public.workspaces.owner_id IS 'References the workspace creator/owner profile';

-- Indexes on workspaces
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);

-- 2. Create public.workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_workspace_members_workspace_user UNIQUE (workspace_id, user_id)
);

-- Schema documentation comments
COMMENT ON TABLE public.workspace_members IS 'Membership association connecting users to workspaces with specific roles';
COMMENT ON COLUMN public.workspace_members.role IS 'User role: owner, admin, member, or viewer';

-- Indexes on workspace_members
CREATE INDEX IF NOT EXISTS idx_workspace_members_lookup ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);

-- 3. Security Definer Helper Functions (Fast & Prevents RLS Recursion)
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner_or_admin(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner_or_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner(UUID) TO authenticated;

-- 4. Row Level Security (RLS) on workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can only read workspaces they belong to
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(id));

-- UPDATE: Only owners and admins can update workspace details
CREATE POLICY "Owners and admins can update their workspaces"
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner_or_admin(id))
  WITH CHECK (public.is_workspace_owner_or_admin(id));

-- DELETE: Only owners can delete a workspace
CREATE POLICY "Only owners can delete their workspaces"
  ON public.workspaces
  FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(id));

-- 5. Row Level Security (RLS) on workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view member list of workspaces they belong to
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- INSERT: Only owners and admins can add new members
CREATE POLICY "Owners and admins can add members"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner_or_admin(workspace_id));

-- UPDATE: Only owners and admins can modify member roles
CREATE POLICY "Owners and admins can update member roles"
  ON public.workspace_members
  FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner_or_admin(workspace_id))
  WITH CHECK (public.is_workspace_owner_or_admin(workspace_id));

-- DELETE: Owners/admins can remove members, or members can remove themselves (leave)
CREATE POLICY "Owners, admins, or leaving members can delete memberships"
  ON public.workspace_members
  FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner_or_admin(workspace_id) OR user_id = auth.uid());

-- 6. Atomic Workspace Creation Function
-- Creates workspace and initial owner membership within a single atomic transaction
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  p_name TEXT,
  p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_workspace public.workspaces%ROWTYPE;
  v_member public.workspace_members%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate input length
  IF char_length(trim(p_name)) < 2 OR char_length(trim(p_name)) > 50 THEN
    RAISE EXCEPTION 'Workspace name must be between 2 and 50 characters';
  END IF;

  IF NOT (p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') OR char_length(p_slug) < 2 OR char_length(p_slug) > 60 THEN
    RAISE EXCEPTION 'Invalid workspace slug format';
  END IF;

  -- 1. Insert workspace
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (trim(p_name), p_slug, v_user_id)
  RETURNING * INTO v_workspace;

  -- 2. Insert owner membership record
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace.id, v_user_id, 'owner')
  RETURNING * INTO v_member;

  -- Return created workspace details
  RETURN jsonb_build_object(
    'id', v_workspace.id,
    'name', v_workspace.name,
    'slug', v_workspace.slug,
    'owner_id', v_workspace.owner_id,
    'role', v_member.role,
    'created_at', v_workspace.created_at,
    'updated_at', v_workspace.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(TEXT, TEXT) TO authenticated;

-- 7. Owner Protection Trigger: Prevent owner removal if workspace still exists
CREATE OR REPLACE FUNCTION public.prevent_owner_membership_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role = 'owner' AND EXISTS (
    SELECT 1 FROM public.workspaces WHERE id = OLD.workspace_id AND owner_id = OLD.user_id
  ) THEN
    RAISE EXCEPTION 'Cannot remove the owner of a workspace. Transfer ownership or delete workspace instead.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_workspace_member_deleted ON public.workspace_members;
CREATE TRIGGER on_workspace_member_deleted
  BEFORE DELETE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_membership_deletion();

-- 8. Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workspaces_updated ON public.workspaces;
CREATE TRIGGER on_workspaces_updated
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_workspace_members_updated ON public.workspace_members;
CREATE TRIGGER on_workspace_members_updated
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
