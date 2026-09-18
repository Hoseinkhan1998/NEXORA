"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface UpdateProfileInput {
  fullName: string;
  avatarUrl?: string | null;
}

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
  profile?: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export async function updateProfileAction(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be authenticated to update your profile.",
      };
    }

    const trimmedName = input.fullName.trim();
    if (trimmedName.length < 2) {
      return {
        success: false,
        error: "Full name must be at least 2 characters.",
      };
    }

    // 1. Update or create database profile record (upsert guarantees resilience)
    const profilePayload = {
      id: user.id,
      email: user.email || "",
      full_name: trimmedName,
      avatar_url: input.avatarUrl !== undefined ? input.avatarUrl : null,
      updated_at: new Date().toISOString(),
    };

    const { data: upsertedProfile, error: dbError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("id, email, full_name, avatar_url")
      .maybeSingle();

    if (dbError) {
      console.error("[updateProfileAction] Database update error:", dbError);
      return {
        success: false,
        error: dbError.message || "Failed to update profile in database.",
      };
    }

    const resolvedProfile = upsertedProfile || {
      id: user.id,
      email: user.email || "",
      full_name: trimmedName,
      avatar_url: input.avatarUrl !== undefined ? input.avatarUrl : null,
    };

    // 2. Sync auth metadata
    await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        avatar_url: input.avatarUrl || null,
      },
    });

    // 3. Revalidate application shell paths
    revalidatePath("/app", "layout");

    return {
      success: true,
      profile: {
        id: resolvedProfile.id,
        email: resolvedProfile.email,
        fullName: resolvedProfile.full_name,
        avatarUrl: resolvedProfile.avatar_url,
      },
    };
  } catch (err) {
    console.error("[updateProfileAction] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}
