"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";

export interface DeleteTaskResult {
  success: boolean;
  error?: string;
}

export async function deleteTaskAction(
  taskId: string,
  workspaceId: string,
  projectId: string,
  workspaceSlug: string
): Promise<DeleteTaskResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be authenticated to delete a task.",
    };
  }

  const membership = await getWorkspaceMembership(workspaceId, user.id);
  if (!membership) {
    return {
      success: false,
      error: "You do not have access to this workspace.",
    };
  }

  // Deletion restricted strictly to owner and admin
  if (membership.role !== "owner" && membership.role !== "admin") {
    return {
      success: false,
      error: "Only workspace owners and administrators are permitted to delete tasks.",
    };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("[deleteTaskAction] Delete error:", error);
    return {
      success: false,
      error: "Failed to delete task.",
    };
  }

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);

  return { success: true };
}
