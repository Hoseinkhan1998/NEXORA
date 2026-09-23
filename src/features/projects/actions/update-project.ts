"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import { updateProjectSchema, type UpdateProjectSchemaInput } from "../schemas/project";
import type { Project } from "../types";

export interface UpdateProjectState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
    description?: string[];
    color?: string[];
    status?: string[];
  };
  project?: Project;
}

export async function updateProjectAction(
  projectId: string,
  workspaceId: string,
  workspaceSlug: string,
  input: UpdateProjectSchemaInput
): Promise<UpdateProjectState> {
  const validated = updateProjectSchema.safeParse(input);

  if (!validated.success) {
    const flattened = validated.error.flatten();
    return {
      success: false,
      error: "Please correct the form errors.",
      fieldErrors: {
        name: flattened.fieldErrors.name,
        description: flattened.fieldErrors.description,
        color: flattened.fieldErrors.color,
        status: flattened.fieldErrors.status,
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
      error: "You must be authenticated to edit a project.",
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
      error: "Viewers are not permitted to edit projects in this workspace.",
    };
  }

  const updateData: Record<string, unknown> = {};
  if (validated.data.name !== undefined) updateData.name = validated.data.name.trim();
  if (validated.data.description !== undefined)
    updateData.description = validated.data.description?.trim() || null;
  if (validated.data.color !== undefined) updateData.color = validated.data.color?.trim() || null;
  if (validated.data.status !== undefined) updateData.status = validated.data.status;

  const { data: updatedProject, error: updateError } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (updateError || !updatedProject) {
    console.error("[updateProjectAction] Update error:", updateError);
    return {
      success: false,
      error: "Failed to update project. Please try again.",
    };
  }

  if (validated.data.memberIds !== undefined) {
    try {
      const targetMemberIds = new Set(validated.data.memberIds);
      targetMemberIds.add(updatedProject.created_by);

      await supabase.from("project_members").delete().eq("project_id", projectId);
      const rows = Array.from(targetMemberIds).map((uid) => ({
        project_id: projectId,
        user_id: uid,
        role: uid === updatedProject.created_by ? "lead" : "member",
      }));
      await supabase.from("project_members").insert(rows);
    } catch (err) {
      console.warn("[updateProjectAction] Could not sync project_members:", err);
    }
  }

  revalidatePath(`/app/${workspaceSlug}/projects`);
  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);

  return {
    success: true,
    project: updatedProject as Project,
  };
}
