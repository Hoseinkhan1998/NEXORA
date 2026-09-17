-- ==============================================================================
-- Migration: Create Tasks for NEXORA (Tasks Domain Foundation)
-- ==============================================================================
-- Description: Establishes multi-tenant tasks table, cross-entity workspace/project
--              integrity constraint, status/priority models, indexes, and RLS policies.
-- ==============================================================================

-- 1. Ensure compound unique key on projects to support compound foreign key
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS uq_projects_id_workspace_id;
ALTER TABLE public.projects ADD CONSTRAINT uq_projects_id_workspace_id UNIQUE (id, workspace_id);

-- 2. Create public.tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  due_date DATE NULL,
  position NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_tasks_title_length CHECK (char_length(trim(title)) >= 1 AND char_length(title) <= 160),
  CONSTRAINT chk_tasks_description_length CHECK (description IS NULL OR char_length(description) <= 5000),
  CONSTRAINT chk_tasks_status CHECK (status IN ('todo', 'in_progress', 'done')),
  CONSTRAINT chk_tasks_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT fk_tasks_project_workspace FOREIGN KEY (project_id, workspace_id) REFERENCES public.projects(id, workspace_id) ON DELETE CASCADE
);

-- Schema documentation comments
COMMENT ON TABLE public.tasks IS 'First-class tasks scoped to a project and workspace in NEXORA';
COMMENT ON COLUMN public.tasks.id IS 'Unique task identifier';
COMMENT ON COLUMN public.tasks.workspace_id IS 'Parent workspace identifier for tenant scoping';
COMMENT ON COLUMN public.tasks.project_id IS 'Parent project identifier';
COMMENT ON COLUMN public.tasks.title IS 'Task title (1-160 characters)';
COMMENT ON COLUMN public.tasks.description IS 'Optional task description/notes';
COMMENT ON COLUMN public.tasks.status IS 'Lifecycle state: todo, in_progress, or done';
COMMENT ON COLUMN public.tasks.priority IS 'Urgency level: low, medium, high, or urgent';
COMMENT ON COLUMN public.tasks.assignee_id IS 'Optional reference to assigned workspace member profile';
COMMENT ON COLUMN public.tasks.created_by IS 'Creator profile reference';
COMMENT ON COLUMN public.tasks.due_date IS 'Optional target completion date';
COMMENT ON COLUMN public.tasks.position IS 'Ordering position within project';

-- 3. Database-level Integrity Trigger: Defense-in-depth enforcement
-- Guarantees that a task's workspace_id strictly equals its project's workspace_id
CREATE OR REPLACE FUNCTION public.enforce_task_workspace_project_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = NEW.project_id AND workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'Data integrity violation: Task workspace_id (%) does not match Project workspace_id for project %',
      NEW.workspace_id, NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_workspace_project_check ON public.tasks;
CREATE TRIGGER on_task_workspace_project_check
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_task_workspace_project_match();

-- 4. Indexes on tasks
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_project ON public.tasks(workspace_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_project_position ON public.tasks(project_id, position);

-- 5. Row Level Security (RLS) on public.tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Workspace members can view tasks in their workspace
CREATE POLICY "Members can view workspace tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- INSERT: Authorized members (owner, admin, member) can create tasks in their workspace
CREATE POLICY "Authorized members can create tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.can_modify_workspace_projects(workspace_id)
  );

-- UPDATE: Authorized members (owner, admin, member) can update tasks in their workspace
CREATE POLICY "Authorized members can update tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (public.can_modify_workspace_projects(workspace_id))
  WITH CHECK (public.can_modify_workspace_projects(workspace_id));

-- DELETE: Only owners and admins can delete tasks
CREATE POLICY "Only owners and admins can delete tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner_or_admin(workspace_id));

-- 6. Trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS on_tasks_updated ON public.tasks;
CREATE TRIGGER on_tasks_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Ensure fellow workspace members can view profiles for task assignment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Members can view fellow workspace members profiles'
  ) THEN
    CREATE POLICY "Members can view fellow workspace members profiles"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (
        id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.workspace_members m1
          JOIN public.workspace_members m2 ON m1.workspace_id = m2.workspace_id
          WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
        )
      );
  END IF;
END $$;
