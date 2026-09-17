"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import { moveTaskSchema, type MoveTaskSchemaInput } from "../schemas/task";
import type { Task } from "../types";

export interface MoveTaskResult {
  success: boolean;
  error?: string;
  task?: Task;
}

export async function moveTaskAction(
  input: MoveTaskSchemaInput,
  workspaceSlug?: string
): Promise<MoveTaskResult> {
  // 1. Zod input validation
  const validated = moveTaskSchema.safeParse(input);
  if (!validated.success) {
    return {
      success: false,
      error: "Invalid task movement parameters.",
    };
  }

  const { taskId, workspaceId, projectId, status, position } = validated.data;

  // 2. Authenticate current caller
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be authenticated to move tasks.",
    };
  }

  // 3. Workspace authorization & role verification
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

  // 4. Verify project strictly belongs to the supplied workspace
  const { data: projectRecord, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (projectError || !projectRecord) {
    return {
      success: false,
      error: "Project does not exist or does not belong to this workspace.",
    };
  }

  // 5. Verify task exists, belongs to this project & workspace
  const { data: existingTask, error: taskCheckError } = await supabase
    .from("tasks")
    .select("id, status, position")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (taskCheckError || !existingTask) {
    return {
      success: false,
      error: "Task does not exist or does not belong to this project.",
    };
  }

  // 6. Perform atomic update of status and position
  const { data: updatedTask, error: updateError } = await supabase
    .from("tasks")
    .update({
      status,
      position,
    })
    .eq("id", taskId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (updateError || !updatedTask) {
    console.error("[moveTaskAction] Failed to update task position/status:", updateError);
    return {
      success: false,
      error: "Failed to persist task position. Please try again.",
    };
  }

  // 7. Revalidate cached views
  if (workspaceSlug) {
    revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);
  }

  return {
    success: true,
    task: updatedTask as Task,
  };
}
