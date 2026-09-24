-- ==============================================================================
-- Migration: Secure Project Activity with Private Tasks Confidentiality
-- ==============================================================================
-- Description:
-- Enforces Row Level Security (RLS) on public.project_activity so that activities
-- related to private tasks (is_private = true) are visible ONLY to the task creator
-- and its assigned members, preserving strict privacy across all audit streams.
-- ==============================================================================

-- 1. Helper function to check if a user is authorized to view a specific activity
CREATE OR REPLACE FUNCTION public.can_view_project_activity(
  p_workspace_id UUID,
  p_project_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- 1. Must have access to the project
    (
      public.is_workspace_owner_or_admin(p_workspace_id)
      OR public.is_project_member(p_project_id, p_user_id)
    )
    AND
    -- 2. If entity is a task, verify confidentiality
    CASE 
      WHEN p_entity_type = 'task' THEN (
        CASE
          -- If explicitly marked private in metadata
          WHEN COALESCE((p_metadata->>'is_private')::boolean, false) = true THEN (
            p_metadata->>'created_by' = p_user_id::text
            OR p_metadata->>'assignee_id' = p_user_id::text
            OR EXISTS (
              SELECT 1 FROM public.tasks t
              WHERE t.id = p_entity_id
                AND (
                  t.created_by = p_user_id
                  OR t.assignee_id = p_user_id
                  OR public.is_task_assignee(t.id, p_user_id)
                )
            )
          )
          -- Otherwise check the live tasks table
          ELSE (
            NOT EXISTS (
              SELECT 1 FROM public.tasks t
              WHERE t.id = p_entity_id
                AND t.is_private = true
            )
            OR EXISTS (
              SELECT 1 FROM public.tasks t
              WHERE t.id = p_entity_id
                AND t.is_private = true
                AND (
                  t.created_by = p_user_id
                  OR t.assignee_id = p_user_id
                  OR public.is_task_assignee(t.id, p_user_id)
                )
            )
          )
        END
      )
      ELSE true
    END;
$$;

GRANT EXECUTE ON FUNCTION public.can_view_project_activity(UUID, UUID, TEXT, UUID, JSONB, UUID) TO authenticated;

-- 2. Update RLS on public.project_activity
ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view workspace project activity" ON public.project_activity;
DROP POLICY IF EXISTS "Members can view authorized project activity" ON public.project_activity;

CREATE POLICY "Members can view authorized project activity"
  ON public.project_activity
  FOR SELECT
  TO authenticated
  USING (
    public.can_view_project_activity(workspace_id, project_id, entity_type, entity_id, metadata, auth.uid())
  );
