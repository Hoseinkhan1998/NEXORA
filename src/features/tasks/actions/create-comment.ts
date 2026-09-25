"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/features/notifications";
import type { TaskComment } from "../types/comment";

export interface CreateCommentInput {
  taskId: string;
  workspaceId: string;
  content?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
}

export interface CreateCommentResult {
  success: boolean;
  comment?: TaskComment;
  error?: string;
}

export async function createCommentAction(
  input: CreateCommentInput
): Promise<CreateCommentResult> {
  const content = (input.content || "").trim();
  const fileUrl = input.fileUrl?.trim() || null;

  if (!content && !fileUrl) {
    return {
      success: false,
      error: "Message content or an attached file is required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Please sign in to post a message.",
    };
  }

  // 1. Verify workspace membership (all roles including viewer can comment)
  const { data: member, error: memErr } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memErr || !member) {
    return {
      success: false,
      error: "You are not a member of this workspace.",
    };
  }

  // 2. Fetch task to check existence and recipients for notification
  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .select("id, title, is_private, created_by, project_id")
    .eq("id", input.taskId)
    .single();

  if (taskErr || !task) {
    return {
      success: false,
      error: "Task not found.",
    };
  }

  // 3. Insert into task_comments
  const { data: newRow, error: insertErr } = await supabase
    .from("task_comments")
    .insert({
      task_id: input.taskId,
      workspace_id: input.workspaceId,
      user_id: user.id,
      content,
      file_url: fileUrl,
      file_name: input.fileName || null,
      file_type: input.fileType || null,
      file_size: input.fileSize || null,
    })
    .select(
      `
      id,
      task_id,
      workspace_id,
      user_id,
      content,
      file_url,
      file_name,
      file_type,
      file_size,
      created_at,
      updated_at,
      author:profiles!task_comments_user_id_fkey (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .single();

  if (insertErr || !newRow) {
    console.error("[createCommentAction] Failed to insert comment:", insertErr);
    return {
      success: false,
      error: insertErr?.message || "Failed to post message.",
    };
  }

  const rawAuthor = Array.isArray(newRow.author) ? newRow.author[0] : newRow.author;
  const comment: TaskComment = {
    id: newRow.id,
    task_id: newRow.task_id,
    workspace_id: newRow.workspace_id,
    user_id: newRow.user_id,
    content: newRow.content,
    file_url: newRow.file_url,
    file_name: newRow.file_name,
    file_type: newRow.file_type,
    file_size: newRow.file_size,
    created_at: newRow.created_at,
    updated_at: newRow.updated_at,
    author: {
      id: rawAuthor?.id || user.id,
      email: rawAuthor?.email || user.email || "",
      full_name: rawAuthor?.full_name || null,
      avatar_url: rawAuthor?.avatar_url || null,
    },
  };

  // 4. Send background notification to assignees and creator (excluding sender)
  try {
    const { data: assignees } = await supabase
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", input.taskId);

    const recipientIds = new Set<string>();
    if (task.created_by && task.created_by !== user.id) {
      recipientIds.add(task.created_by);
    }
    assignees?.forEach((a) => {
      if (a.user_id !== user.id) recipientIds.add(a.user_id);
    });

    const senderName =
      rawAuthor?.full_name || rawAuthor?.email?.split("@")[0] || "A team member";
    const snippet = content
      ? content.slice(0, 80)
      : input.fileName
      ? `attached a file: ${input.fileName}`
      : "posted a message in task.";

    for (const recipientId of recipientIds) {
      await createNotification({
        workspaceId: input.workspaceId,
        recipientId: recipientId,
        actorId: user.id,
        title: `New message in task: ${task.title}`,
        message: `${senderName}: ${snippet}`,
        type: "task_assigned",
        entityType: "task",
        entityId: task.id,
        projectId: task.project_id,
      }).catch((e) => console.warn("[createCommentAction] Notification error:", e));
    }
  } catch (notifErr) {
    console.warn("[createCommentAction] Could not dispatch notifications:", notifErr);
  }

  return {
    success: true,
    comment,
  };
}
