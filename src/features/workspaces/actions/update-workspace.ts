"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateWorkspaceSchema } from "../schemas/workspace";
import { generateSlug, generateCollisionSlug } from "../utils/slug";

export interface UpdateWorkspaceResult {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
  };
  name?: string;
  slug?: string;
  previousSlug?: string;
}

export async function updateWorkspaceAction(
  workspaceId: string,
  workspaceSlug: string,
  name: string
): Promise<UpdateWorkspaceResult> {
  const validated = updateWorkspaceSchema.safeParse({ name });
  if (!validated.success) {
    const flattened = validated.error.flatten();
    return {
      success: false,
      error: "Please enter a valid workspace name (2-50 characters).",
      fieldErrors: {
        name: flattened.fieldErrors.name,
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
      error: "You must be authenticated to update workspace settings.",
    };
  }

  // Security check: Verify that caller is owner or admin in this workspace
  const { data: membership, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !membership) {
    return {
      success: false,
      error: "You are not a member of this workspace.",
    };
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return {
      success: false,
      error: "Only workspace owners and administrators can edit workspace details.",
    };
  }

  const trimmedName = validated.data.name.trim();
  const baseSlug = generateSlug(trimmedName);
  let targetSlug = baseSlug;

  // If slug differs from the current one, verify uniqueness or generate collision-safe slug
  if (targetSlug !== workspaceSlug) {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      attempts++;
      const { data: existing } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", targetSlug)
        .neq("id", workspaceId)
        .maybeSingle();

      if (!existing) {
        break;
      }
      targetSlug = generateCollisionSlug(baseSlug);
    }
  }

  const { error: updateError } = await supabase
    .from("workspaces")
    .update({
      name: trimmedName,
      slug: targetSlug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message || "Failed to update workspace name.",
    };
  }

  revalidatePath(`/app/${workspaceSlug}`, "layout");
  revalidatePath(`/app/${targetSlug}`, "layout");
  revalidatePath("/app", "layout");

  return {
    success: true,
    name: trimmedName,
    slug: targetSlug,
    previousSlug: workspaceSlug,
  };
}
