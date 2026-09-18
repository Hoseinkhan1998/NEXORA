-- ==============================================================================
-- Migration: Create Notifications System & Realtime Publication (TASK 012)
-- ==============================================================================
-- Description: Establishes public.notifications table, tenant isolation constraints,
--              user-scoped RLS policies, indexes for unread retrieval, and
--              configures Supabase Realtime publication for in-app notifications.
-- ==============================================================================

-- 1. Create public.notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_status_changed', 'task_priority_urgent', 'task_due_soon')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'task',
  entity_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fk_notifications_project_workspace FOREIGN KEY (project_id, workspace_id) REFERENCES public.projects(id, workspace_id) ON DELETE CASCADE
);

-- Schema documentation comments
COMMENT ON TABLE public.notifications IS 'Multi-tenant in-app notification center table for NEXORA';
COMMENT ON COLUMN public.notifications.id IS 'Unique notification record identifier';
COMMENT ON COLUMN public.notifications.workspace_id IS 'Parent workspace identifier for tenant isolation';
COMMENT ON COLUMN public.notifications.recipient_id IS 'Target user receiving the notification';
COMMENT ON COLUMN public.notifications.actor_id IS 'User who performed the action that triggered the notification';
COMMENT ON COLUMN public.notifications.type IS 'Standardized notification category (task_assigned, task_status_changed, task_priority_urgent, task_due_soon)';
COMMENT ON COLUMN public.notifications.title IS 'Short headline summary of the notification';
COMMENT ON COLUMN public.notifications.message IS 'Detailed descriptive narrative';
COMMENT ON COLUMN public.notifications.entity_type IS 'Type of entity referenced (default: task)';
COMMENT ON COLUMN public.notifications.entity_id IS 'Identifier of referenced entity';
COMMENT ON COLUMN public.notifications.project_id IS 'Optional project reference';
COMMENT ON COLUMN public.notifications.is_read IS 'Flag indicating whether recipient has read the notification';
COMMENT ON COLUMN public.notifications.created_at IS 'UTC timestamp when notification was dispatched';

-- 2. Indexes for fast retrieval of unread notifications & feed queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications(recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_workspace_recipient
  ON public.notifications(workspace_id, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

-- 3. Row Level Security (RLS) on public.notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view notifications where they are the recipient
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- UPDATE: Users can only mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- INSERT: Authorized workspace members can dispatch notifications within their workspace
CREATE POLICY "Authorized workspace members can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.is_workspace_member(workspace_id)
  );

-- 4. Configure Supabase Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END IF;
END $$;

-- Enable REPLICA IDENTITY FULL for complete payload delivery in realtime events
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
