-- ==============================================================================
-- Migration: Create Projects for NEXORA (Multi-Tenant Projects Foundation)
-- ==============================================================================
-- Description: Establishes multi-tenant projects table, lifecycle status,
--              workspace-scoped uniqueness, and RLS policies enforcing tenant isolation.
-- ==============================================================================

-- 1. Create public.projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  color TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_projects_status CHECK (status IN ('active', 'archived')),
  CONSTRAINT chk_projects_name_length CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 80),
  CONSTRAINT chk_projects_description_length CHECK (description IS NULL OR char_length(description) <= 500),
  CONSTRAINT chk_projects_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) >= 2 AND char_length(slug) <= 100),
  CONSTRAINT uq_projects_workspace_slug UNIQUE (workspace_id, slug)
);

-- Schema documentation comments
COMMENT ON TABLE public.projects IS 'Multi-tenant projects scoped strictly to workspaces';
COMMENT ON COLUMN public.projects.id IS 'Unique project identifier';
COMMENT ON COLUMN public.projects.workspace_id IS 'References the parent workspace for multi-tenancy';
COMMENT ON COLUMN public.projects.name IS 'Display name of the project';
COMMENT ON COLUMN public.projects.slug IS 'URL slug scoped uniquely to the workspace';
COMMENT ON COLUMN public.projects.description IS 'Optional summary of the project scope';
COMMENT ON COLUMN public.projects.status IS 'Lifecycle status: active or archived';
COMMENT ON COLUMN public.projects.color IS 'Visual theme color for the project';
COMMENT ON COLUMN public.projects.created_by IS 'References the user profile who created the project';

-- Indexes on projects
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_slug ON public.projects(workspace_id, slug);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_status ON public.projects(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- 2. Security Definer Helper Function for Project Permissions
-- Verifies the current user is a member of the workspace with create/edit rights (owner, admin, member)
CREATE OR REPLACE FUNCTION public.can_modify_workspace_projects(p_workspace_id UUID)
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
      AND role IN ('owner', 'admin', 'member')
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_modify_workspace_projects(UUID) TO authenticated;

-- 3. Row Level Security (RLS) on public.projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- SELECT: Authenticated workspace members can read all projects in their workspace
CREATE POLICY "Members can view workspace projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- INSERT: Authorized workspace members (owner, admin, member) can create projects in their workspace
CREATE POLICY "Authorized members can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.can_modify_workspace_projects(workspace_id)
  );

-- UPDATE: Authorized workspace members can update projects in their workspace
CREATE POLICY "Authorized members can update projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (public.can_modify_workspace_projects(workspace_id))
  WITH CHECK (public.can_modify_workspace_projects(workspace_id));

-- DELETE: Only owners and admins can physically delete projects (normal lifecycle uses status='archived')
CREATE POLICY "Only owners and admins can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner_or_admin(workspace_id));

-- 4. Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS on_projects_updated ON public.projects;
CREATE TRIGGER on_projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
