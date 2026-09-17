"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import type { Project, ProjectStatus } from "../types";

export interface ArchiveProjectResult {
  success: boolean;
  error?: string;
  project?: Project;
}

export async function toggleArchiveProjectAction(
  projectId: string,
  workspaceId: string,
  workspaceSlug: string,
  targetStatus: ProjectStatus
): Promise<ArchiveProjectResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be authenticated to perform this action.",
    };
  }

  const membership = await getWorkspaceMembership(workspaceId, user.id);
  if (!membership) {
    return {
      success: false,
      error: "You are not a member of this workspace.",
    };
  }

  if (membership.role === "viewer") {
    return {
      success: false,
      error: "Viewers are not permitted to change project status.",
    };
  }

  const { data: updatedProject, error } = await supabase
    .from("projects")
    .update({ status: targetStatus })
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error || !updatedProject) {
    console.error("[toggleArchiveProjectAction] Status update error:", error);
    return {
      success: false,
      error: "Failed to update project status. Please try again.",
    };
  }

  revalidatePath(`/app/${workspaceSlug}/projects`);
  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);

  return {
    success: true,
    project: updatedProject as Project,
  };
}
