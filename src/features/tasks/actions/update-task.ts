"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import { updateTaskSchema, type UpdateTaskSchemaInput } from "../schemas/task";
import { logActivity } from "@/features/collaboration/lib/log-activity";
import { createNotification } from "@/features/notifications";
import type { Task } from "../types";

export interface UpdateTaskState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    title?: string[];
    description?: string[];
    status?: string[];
    priority?: string[];
    assigneeId?: string[];
    dueDate?: string[];
  };
  task?: Task;
}

export async function updateTaskAction(
  taskId: string,
  workspaceId: string,
  projectId: string,
  workspaceSlug: string,
  input: UpdateTaskSchemaInput
): Promise<UpdateTaskState> {
  const validated = updateTaskSchema.safeParse(input);

  if (!validated.success) {
    const flattened = validated.error.flatten();
    return {
      success: false,
      error: "Please correct the form errors.",
      fieldErrors: {
        title: flattened.fieldErrors.title,
        description: flattened.fieldErrors.description,
        status: flattened.fieldErrors.status,
        priority: flattened.fieldErrors.priority,
        assigneeId: flattened.fieldErrors.assigneeId,
        dueDate: flattened.fieldErrors.dueDate,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be authenticated to update a task.",
    };
  }

  const membership = await getWorkspaceMembership(workspaceId, user.id);
  if (!membership) {
    return {
      success: false,
      error: "You do not have access to this workspace.",
    };
  }

  if (membership.role === "viewer") {
    return {
      success: false,
      error: "Viewers are not permitted to modify tasks.",
    };
  }

  // If assigneeId is being updated, verify assignee belongs to this workspace
  if (validated.data.assigneeId) {
    const { data: assigneeMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", validated.data.assigneeId)
      .single();

    if (!assigneeMember) {
      return {
        success: false,
        error: "Selected assignee is not a member of this workspace.",
      };
    }
  }

  // Fetch existing task snapshot for fine-grained change comparison
  const { data: existingTask } = await supabase
    .from("tasks")
    .select("id, title, status, priority, assignee_id, due_date")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  const updateData: Record<string, unknown> = {};
  if (validated.data.title !== undefined) updateData.title = validated.data.title.trim();
  if (validated.data.description !== undefined)
    updateData.description = validated.data.description?.trim() || null;
  if (validated.data.status !== undefined) updateData.status = validated.data.status;
  if (validated.data.priority !== undefined) updateData.priority = validated.data.priority;
  if (validated.data.assigneeId !== undefined)
    updateData.assignee_id = validated.data.assigneeId || null;
  if (validated.data.dueDate !== undefined) updateData.due_date = validated.data.dueDate || null;
  if (validated.data.position !== undefined) updateData.position = validated.data.position;

  const { data: updatedTask, error: updateError } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (updateError || !updatedTask) {
    console.error("[updateTaskAction] Update error:", updateError);
    return {
      success: false,
      error: "Failed to update task. Please try again.",
    };
  }

  // Record fine-grained activity event
  if (existingTask) {
    if (validated.data.status !== undefined && validated.data.status !== existingTask.status) {
      await logActivity({
        workspaceId,
        projectId,
        actorId: user.id,
        entityType: "task",
        entityId: taskId,
        action: "task_status_changed",
        metadata: {
          task_title: updatedTask.title,
          old_status: existingTask.status,
          new_status: updatedTask.status,
        },
      });
    } else if (
      validated.data.priority !== undefined &&
      validated.data.priority !== existingTask.priority
    ) {
      await logActivity({
        workspaceId,
        projectId,
        actorId: user.id,
        entityType: "task",
        entityId: taskId,
        action: "task_priority_changed",
        metadata: {
          task_title: updatedTask.title,
          old_priority: existingTask.priority,
          new_priority: updatedTask.priority,
        },
      });
    } else if (
      validated.data.assigneeId !== undefined &&
      validated.data.assigneeId !== existingTask.assignee_id
    ) {
      await logActivity({
        workspaceId,
        projectId,
        actorId: user.id,
        entityType: "task",
        entityId: taskId,
        action: "task_assigned",
        metadata: {
          task_title: updatedTask.title,
          assignee_id: updatedTask.assignee_id,
        },
      });
    } else if (
      validated.data.dueDate !== undefined &&
      validated.data.dueDate !== existingTask.due_date
    ) {
      await logActivity({
        workspaceId,
        projectId,
        actorId: user.id,
        entityType: "task",
        entityId: taskId,
        action: "task_due_date_changed",
        metadata: {
          task_title: updatedTask.title,
          old_due_date: existingTask.due_date,
          new_due_date: updatedTask.due_date,
        },
      });
    } else {
      await logActivity({
        workspaceId,
        projectId,
        actorId: user.id,
        entityType: "task",
        entityId: taskId,
        action: "task_updated",
        metadata: {
          task_title: updatedTask.title,
        },
      });
    }
    // Dispatch in-app notifications
    // 1. Task assigned to another user
    if (
      validated.data.assigneeId !== undefined &&
      validated.data.assigneeId !== existingTask.assignee_id &&
      validated.data.assigneeId &&
      validated.data.assigneeId !== user.id
    ) {
      await createNotification({
        workspaceId,
        recipientId: validated.data.assigneeId,
        actorId: user.id,
        type: "task_assigned",
        title: "Task assigned to you",
        message: `You were assigned to task "${updatedTask.title}".`,
        entityType: "task",
        entityId: taskId,
        projectId,
      });
    }

    // 2. Status changed by someone else on assigned task
    if (
      validated.data.status !== undefined &&
      validated.data.status !== existingTask.status &&
      updatedTask.assignee_id &&
      updatedTask.assignee_id !== user.id
    ) {
      await createNotification({
        workspaceId,
        recipientId: updatedTask.assignee_id,
        actorId: user.id,
        type: "task_status_changed",
        title: "Task status updated",
        message: `Task "${updatedTask.title}" was moved to ${updatedTask.status.replace("_", " ")}.`,
        entityType: "task",
        entityId: taskId,
        projectId,
      });
    }

    // 3. Priority escalated to Urgent
    if (
      validated.data.priority === "urgent" &&
      existingTask.priority !== "urgent" &&
      updatedTask.assignee_id &&
      updatedTask.assignee_id !== user.id
    ) {
      await createNotification({
        workspaceId,
        recipientId: updatedTask.assignee_id,
        actorId: user.id,
        type: "task_priority_urgent",
        title: "Task marked Urgent",
        message: `Task "${updatedTask.title}" was escalated to Urgent priority.`,
        entityType: "task",
        entityId: taskId,
        projectId,
      });
    }
  }

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);

  return {
    success: true,
    task: updatedTask as Task,
  };
}
