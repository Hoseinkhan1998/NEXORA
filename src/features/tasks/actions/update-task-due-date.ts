"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/features/collaboration/lib/log-activity";

export interface UpdateDueDateResult {
  success: boolean;
  error?: string;
  taskId?: string;
  dueDate?: string | null;
}

export async function updateTaskDueDateAction(
  taskId: string,
  workspaceId: string,
  projectId: string,
  workspaceSlug: string,
  dueDate: string | null
): Promise<UpdateDueDateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be authenticated to update task due dates.",
    };
  }

  // 1. Verify workspace membership & role
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    return {
      success: false,
      error: "You are not a member of this workspace.",
    };
  }

  if (member.role === "viewer") {
    return {
      success: false,
      error: "Viewers have read-only access and cannot reschedule tasks.",
    };
  }

  // 2. Fetch current task to verify existence and check permissions
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, due_date, created_by, project_id, workspace_id")
    .eq("id", taskId)
    .eq("workspace_id", workspaceId)
    .single();

  if (taskError || !task) {
    return {
      success: false,
      error: "Task not found in this workspace.",
    };
  }

  // 3. Enterprise permission check: owner/admin, creator, or assigned member
  const isPrivileged = member.role === "owner" || member.role === "admin";
  const isCreator = task.created_by === user.id;

  if (!isPrivileged && !isCreator) {
    const { data: assigneeCheck } = await supabase
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!assigneeCheck) {
      return {
        success: false,
        error: "Only project administrators, task creators, or assignees can reschedule this task.",
      };
    }
  }

  // 4. Update the task due_date
  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      due_date: dueDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message || "Failed to update task due date.",
    };
  }

  // 5. Log activity audit stream
  try {
    await logActivity({
      workspaceId,
      projectId,
      actorId: user.id,
      action: "task_due_date_changed",
      entityType: "task",
      entityId: taskId,
      metadata: {
        task_title: task.title,
        old_due_date: task.due_date || undefined,
        new_due_date: dueDate || undefined,
      },
    });
  } catch (err) {
    console.error("[updateTaskDueDateAction] Failed to log activity:", err);
  }

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}?view=calendar`);
  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}?view=timeline`);

  return {
    success: true,
    taskId,
    dueDate,
  };
}
