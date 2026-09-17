"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import { updateTaskSchema, type UpdateTaskSchemaInput } from "../schemas/task";
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

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);

  return {
    success: true,
    task: updatedTask as Task,
  };
}
