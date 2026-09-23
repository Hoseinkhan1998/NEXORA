-- ==============================================================================
-- Migration: Scoped Project Memberships & Private Tasks (Non-Recursive RLS)
-- ==============================================================================
-- Description:
-- 1. Creates public.project_members junction table for scoped project access
-- 2. Backfills existing workspace members into project_members for existing projects
-- 3. Adds is_private column to public.tasks table
-- 4. Creates SECURITY DEFINER functions to eliminate any RLS recursion (42P17)
-- 5. Updates RLS policies on public.projects to enforce scoped project access
-- 6. Updates RLS policies on public.tasks to enforce project membership and strict privacy
-- 7. Updates RLS policies on public.project_members and task_assignees
-- ==============================================================================

-- 1. Create public.project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (project_id, user_id),
  CONSTRAINT chk_project_members_role CHECK (role IN ('lead', 'member'))
);

COMMENT ON TABLE public.project_members IS 'Scoped team membership for projects within a workspace';
COMMENT ON COLUMN public.project_members.project_id IS 'Target project reference';
COMMENT ON COLUMN public.project_members.user_id IS 'Assigned user profile reference';
COMMENT ON COLUMN public.project_members.role IS 'Role within project: lead or member';

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

-- 2. Add is_private column to public.tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tasks.is_private IS 'When true, task is strictly confidential and visible only to creator and assignees';

CREATE INDEX IF NOT EXISTS idx_tasks_is_private ON public.tasks(is_private);

-- 3. Backfill: Insert all current workspace members into project_members for existing projects
INSERT INTO public.project_members (project_id, user_id, role)
SELECT p.id, wm.user_id, CASE WHEN p.created_by = wm.user_id THEN 'lead' ELSE 'member' END
FROM public.projects p
JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Also ensure project creator is always a lead
INSERT INTO public.project_members (project_id, user_id, role)
SELECT id, created_by, 'lead'
FROM public.projects
ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'lead';

-- 4. SECURITY DEFINER Helper Functions (Prevents RLS 42P17 recursion)

-- Check if user is an explicit member of a project
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(UUID, UUID) TO authenticated;

-- Check if user can view members of a project (member of parent workspace)
CREATE OR REPLACE FUNCTION public.can_view_project_members(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.id = p_project_id
      AND wm.user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_project_members(UUID, UUID) TO authenticated;

-- Check if user can manage project members (workspace owner/admin, project creator, or project lead)
CREATE OR REPLACE FUNCTION public.can_manage_project_members(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.id = p_project_id
      AND wm.user_id = p_user_id
      AND (
        wm.role IN ('owner', 'admin')
        OR p.created_by = p_user_id
        OR EXISTS (
          SELECT 1
          FROM public.project_members pm
          WHERE pm.project_id = p_project_id
            AND pm.user_id = p_user_id
            AND pm.role = 'lead'
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_project_members(UUID, UUID) TO authenticated;

-- Check if user is assigned to a task (multi-assignee)
CREATE OR REPLACE FUNCTION public.is_task_assignee(p_task_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_assignees
    WHERE task_id = p_task_id
      AND user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_task_assignee(UUID, UUID) TO authenticated;

-- 5. Enable and Update RLS on public.project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can view project members" ON public.project_members;
CREATE POLICY "Workspace members can view project members"
  ON public.project_members
  FOR SELECT
  TO authenticated
  USING (public.can_view_project_members(project_id, auth.uid()));

DROP POLICY IF EXISTS "Authorized members can manage project members" ON public.project_members;
CREATE POLICY "Authorized members can manage project members"
  ON public.project_members
  FOR ALL
  TO authenticated
  USING (public.can_manage_project_members(project_id, auth.uid()))
  WITH CHECK (public.can_manage_project_members(project_id, auth.uid()));

-- 6. Update RLS policies on public.projects
DROP POLICY IF EXISTS "Members can view workspace projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view scoped workspace projects" ON public.projects;
CREATE POLICY "Members can view scoped workspace projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    public.is_workspace_owner_or_admin(workspace_id)
    OR created_by = auth.uid()
    OR public.is_project_member(id, auth.uid())
  );

-- 7. Update RLS policies on public.tasks
DROP POLICY IF EXISTS "Members can view workspace tasks" ON public.tasks;
DROP POLICY IF EXISTS "Members can view scoped workspace tasks" ON public.tasks;
CREATE POLICY "Members can view scoped workspace tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    -- Must have access to the project
    (
      public.is_workspace_owner_or_admin(workspace_id)
      OR tasks.created_by = auth.uid()
      OR public.is_project_member(tasks.project_id, auth.uid())
    )
    AND
    -- Strict Privacy Condition:
    (
      tasks.is_private = false
      OR tasks.created_by = auth.uid()
      OR tasks.assignee_id = auth.uid()
      OR public.is_task_assignee(tasks.id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authorized members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authorized members can create scoped tasks" ON public.tasks;
CREATE POLICY "Authorized members can create scoped tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.is_workspace_owner_or_admin(workspace_id)
      OR public.is_project_member(project_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authorized members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authorized members can update scoped tasks" ON public.tasks;
CREATE POLICY "Authorized members can update scoped tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    public.is_workspace_owner_or_admin(workspace_id)
    OR tasks.created_by = auth.uid()
    OR (
      tasks.is_private = false
      AND public.is_project_member(tasks.project_id, auth.uid())
    )
    OR (
      tasks.is_private = true
      AND (
        tasks.assignee_id = auth.uid()
        OR public.is_task_assignee(tasks.id, auth.uid())
      )
    )
  )
  WITH CHECK (
    public.is_workspace_owner_or_admin(workspace_id)
    OR tasks.created_by = auth.uid()
    OR (
      tasks.is_private = false
      AND public.is_project_member(tasks.project_id, auth.uid())
    )
    OR (
      tasks.is_private = true
      AND (
        tasks.assignee_id = auth.uid()
        OR public.is_task_assignee(tasks.id, auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Authorized members can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authorized members can delete scoped tasks" ON public.tasks;
CREATE POLICY "Authorized members can delete scoped tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    public.is_workspace_owner_or_admin(workspace_id)
    OR tasks.created_by = auth.uid()
  );
