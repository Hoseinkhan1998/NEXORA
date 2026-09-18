-- ==============================================================================
-- Migration: Create Project Activity & Realtime Setup (TASK 009)
-- ==============================================================================
-- Description: Establishes persistent project_activity audit logging table,
--              workspace/project tenant integrity constraints, RLS policies,
--              and configures Supabase Realtime publication for tasks & activity.
-- ==============================================================================

-- 1. Create public.project_activity table
CREATE TABLE IF NOT EXISTS public.project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT fk_activity_project_workspace FOREIGN KEY (project_id, workspace_id) REFERENCES public.projects(id, workspace_id) ON DELETE CASCADE
);

-- Schema documentation comments
COMMENT ON TABLE public.project_activity IS 'Audit trail of user actions within projects for NEXORA real-time collaboration';
COMMENT ON COLUMN public.project_activity.id IS 'Unique activity record identifier';
COMMENT ON COLUMN public.project_activity.workspace_id IS 'Parent workspace identifier for tenant isolation';
COMMENT ON COLUMN public.project_activity.project_id IS 'Parent project identifier';
COMMENT ON COLUMN public.project_activity.actor_id IS 'Profile reference of user who performed the action';
COMMENT ON COLUMN public.project_activity.entity_type IS 'Type of entity mutated (e.g., task, project)';
COMMENT ON COLUMN public.project_activity.entity_id IS 'Identifier of mutated entity (persists even if entity deleted)';
COMMENT ON COLUMN public.project_activity.action IS 'Standardized action verb (e.g. task_created, task_status_changed, task_deleted)';
COMMENT ON COLUMN public.project_activity.metadata IS 'Structured contextual metadata (e.g. old/new values, titles)';
COMMENT ON COLUMN public.project_activity.created_at IS 'Immutable UTC timestamp when action occurred';

-- 2. Database-level Integrity Trigger: Defense-in-depth enforcement
CREATE OR REPLACE FUNCTION public.enforce_activity_workspace_project_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = NEW.project_id AND workspace_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'Data integrity violation: Activity workspace_id (%) does not match Project workspace_id for project %',
      NEW.workspace_id, NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_activity_workspace_project_check ON public.project_activity;
CREATE TRIGGER on_activity_workspace_project_check
  BEFORE INSERT OR UPDATE ON public.project_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_activity_workspace_project_match();

-- 3. Indexes for fast activity retrieval & feed streaming
CREATE INDEX IF NOT EXISTS idx_project_activity_project_created
  ON public.project_activity(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_activity_workspace_created
  ON public.project_activity(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_activity_actor_id
  ON public.project_activity(actor_id);

CREATE INDEX IF NOT EXISTS idx_project_activity_entity
  ON public.project_activity(entity_type, entity_id);

-- 4. Row Level Security (RLS) on public.project_activity
ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;

-- SELECT: Workspace members can view activity for projects in their workspace
CREATE POLICY "Members can view workspace project activity"
  ON public.project_activity
  FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- INSERT: Authorized members can log activity with their authenticated actor_id
CREATE POLICY "Authorized members can create activity"
  ON public.project_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.can_modify_workspace_projects(workspace_id)
  );

-- 5. Configure Supabase Realtime publication for tasks & project_activity
DO $$
BEGIN
  -- Add public.tasks if publication exists and table not already member
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'project_activity'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.project_activity;
    END IF;
  END IF;
END $$;

-- Enable REPLICA IDENTITY FULL for complete payload delivery in realtime events
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.project_activity REPLICA IDENTITY FULL;
