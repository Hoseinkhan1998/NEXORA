"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createWorkspaceSchema } from "../schemas/workspace";
import { generateSlug, generateCollisionSlug } from "../utils/slug";
import type { WorkspaceWithRole } from "../types";

export interface CreateWorkspaceState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
  };
  workspace?: WorkspaceWithRole;
}

/**
 * Server action to atomically create a workspace and assign the current user as owner.
 */
export async function createWorkspaceAction(
  _prevState: CreateWorkspaceState | null,
  formData: FormData
): Promise<CreateWorkspaceState> {
  const name = formData.get("name")?.toString() || "";
  const customSlug = formData.get("slug")?.toString();

  const validated = createWorkspaceSchema.safeParse({
    name,
    slug: customSlug || undefined,
  });

  if (!validated.success) {
    const flattened = validated.error.flatten();
    return {
      success: false,
      error: "Please correct the errors below.",
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
      error: "You must be authenticated to create a workspace.",
    };
  }

  const baseSlug = validated.data.slug || generateSlug(validated.data.name);
  let targetSlug = baseSlug;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;

    // Call PostgreSQL atomic function
    const { data, error } = await supabase.rpc("create_workspace_with_owner", {
      p_name: validated.data.name.trim(),
      p_slug: targetSlug,
    });

    if (!error && data) {
      revalidatePath("/app", "layout");
      return {
        success: true,
        workspace: data as WorkspaceWithRole,
      };
    }

    if (error) {
      // Check for uniqueness collision on slug
      if (
        error.code === "23505" ||
        error.message?.toLowerCase().includes("unique") ||
        error.message?.toLowerCase().includes("duplicate")
      ) {
        targetSlug = generateCollisionSlug(baseSlug);
        continue;
      }

      console.error("[createWorkspaceAction] Database error:", error);
      return {
        success: false,
        error: "Unable to create workspace at this time. Please try again.",
      };
    }
  }

  return {
    success: false,
    error: "A workspace with this name or slug already exists. Please choose a different name.",
  };
}
