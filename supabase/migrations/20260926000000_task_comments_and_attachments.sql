-- ==============================================================================
-- NEXORA Database Migration: Task Comments & Attachments
-- File: supabase/migrations/20260926000000_task_comments_and_attachments.sql
-- Description:
-- 1. Adds attachments JSONB column to tasks table for task-level files.
-- 2. Creates task_comments table with real-time capability and pagination index.
-- 3. Implements can_access_task helper function to enforce private task privacy on comments.
-- 4. Enables all members (including viewer role) with task access to chat & attach files.
-- 5. Configures storage bucket task-attachments with 10MB limit and RLS policies.
-- ==============================================================================

-- 1. Add attachments column to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb NOT NULL;

-- 2. Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text DEFAULT '' NOT NULL,
    file_url text,
    file_name text,
    file_type text,
    file_size bigint,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Optimize pagination: fetching latest 10 comments per task
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created ON public.task_comments(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_workspace ON public.task_comments(workspace_id);

-- 3. Security Definer Helper: can_access_task
CREATE OR REPLACE FUNCTION public.can_access_task(p_task_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_private boolean;
    v_created_by uuid;
    v_workspace_id uuid;
    v_is_member boolean;
    v_is_assignee boolean;
BEGIN
    SELECT t.is_private, t.created_by, t.workspace_id
    INTO v_is_private, v_created_by, v_workspace_id
    FROM public.tasks t
    WHERE t.id = p_task_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Verify workspace membership
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = v_workspace_id AND wm.user_id = p_user_id
    ) INTO v_is_member;

    IF NOT v_is_member THEN
        RETURN false;
    END IF;

    -- Public task: any member of this workspace can access
    IF NOT coalesce(v_is_private, false) THEN
        RETURN true;
    END IF;

    -- Private task: creator
    IF v_created_by = p_user_id THEN
        RETURN true;
    END IF;

    -- Private task: assignees
    SELECT EXISTS (
        SELECT 1 FROM public.task_assignees ta
        WHERE ta.task_id = p_task_id AND ta.user_id = p_user_id
    ) INTO v_is_assignee;

    RETURN coalesce(v_is_assignee, false);
END;
$$;

-- 4. Enable Row Level Security (RLS) on task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members with task access can view task comments" ON public.task_comments;
CREATE POLICY "Members with task access can view task comments"
    ON public.task_comments
    FOR SELECT
    TO authenticated
    USING (
        public.can_access_task(task_id, auth.uid())
    );

DROP POLICY IF EXISTS "Members with task access can insert task comments" ON public.task_comments;
CREATE POLICY "Members with task access can insert task comments"
    ON public.task_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND public.can_access_task(task_id, auth.uid())
    );

DROP POLICY IF EXISTS "Authors and admins can delete task comments" ON public.task_comments;
CREATE POLICY "Authors and admins can delete task comments"
    ON public.task_comments
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = task_comments.workspace_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin')
        )
    );

-- 5. Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'task_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
    END IF;
END $$;

-- 6. Storage Bucket Configuration (10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('task-attachments', 'task-attachments', true, 10485760, null)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload task attachments"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "Public task attachments access" ON storage.objects;
CREATE POLICY "Public task attachments access"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "Authenticated users can delete own task attachments" ON storage.objects;
CREATE POLICY "Authenticated users can delete own task attachments"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'task-attachments' AND (owner = auth.uid() OR auth.role() = 'service_role'));
