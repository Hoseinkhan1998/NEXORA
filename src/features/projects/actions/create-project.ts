"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import { createProjectSchema } from "../schemas/project";
import { generateProjectSlug, buildCandidateSlug } from "../lib/slug";
import type { Project } from "../types";

export interface CreateProjectState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
    description?: string[];
    color?: string[];
  };
  project?: Project;
}

export async function createProjectAction(
  workspaceId: string,
  workspaceSlug: string,
  _prevState: CreateProjectState | null,
  formData: FormData
): Promise<CreateProjectState> {
  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || undefined;
  const color = formData.get("color")?.toString() || undefined;

  const validated = createProjectSchema.safeParse({
    name,
    description: description || undefined,
    color: color || undefined,
  });

  if (!validated.success) {
    const flattened = validated.error.flatten();
    return {
      success: false,
      error: "Please correct the form errors.",
      fieldErrors: {
        name: flattened.fieldErrors.name,
        description: flattened.fieldErrors.description,
        color: flattened.fieldErrors.color,
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
      error: "You must be authenticated to create a project.",
    };
  }

  // Verify membership and role permissions
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
      error: "Viewers are not permitted to create projects in this workspace.",
    };
  }

  const baseSlug = generateProjectSlug(validated.data.name);

  // Fetch existing slugs in this workspace to guarantee workspace-scoped uniqueness
  const { data: existingProjects } = await supabase
    .from("projects")
    .select("slug")
    .eq("workspace_id", workspaceId)
    .ilike("slug", `${baseSlug}%`);

  const existingSlugSet = new Set((existingProjects ?? []).map((p) => p.slug));

  let finalSlug = baseSlug;
  let counter = 1;
  while (existingSlugSet.has(finalSlug)) {
    counter++;
    finalSlug = buildCandidateSlug(baseSlug, counter);
  }

  const rawMemberIds = formData
    .getAll("memberIds")
    .map((v) => v.toString().trim())
    .filter(Boolean);

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspaceId,
      name: validated.data.name.trim(),
      slug: finalSlug,
      description: validated.data.description?.trim() || null,
      color: validated.data.color?.trim() || null,
      status: "active",
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError || !project) {
    console.error("[createProjectAction] Insert error:", insertError);
    return {
      success: false,
      error: "Failed to create project. Please try again.",
    };
  }

  // Insert project members (creator is always lead)
  try {
    const targetMemberIds = new Set(rawMemberIds);
    targetMemberIds.add(user.id);

    const memberRows = Array.from(targetMemberIds).map((uid) => ({
      project_id: project.id,
      user_id: uid,
      role: uid === user.id ? "lead" : "member",
    }));

    await supabase.from("project_members").insert(memberRows);
  } catch (err) {
    console.warn("[createProjectAction] Could not insert project_members:", err);
  }

  revalidatePath(`/app/${workspaceSlug}`);
  revalidatePath(`/app/${workspaceSlug}/projects`);

  return {
    success: true,
    project: project as Project,
  };
}
