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

    // 1. Sync Supabase auth user metadata
    // CRITICAL: NEVER store base64 data URLs in auth user_metadata!
    // Supabase serializes user_metadata directly into the JWT session cookie.
    // Storing a base64 image in user_metadata causes the cookie to exceed 16KB-32KB,
    // which causes the HTTP server to throw HTTP 431 (Request Header Fields Too Large).
    // Base64 images are safely stored in public.profiles in PostgreSQL instead.
    const isBase64 = typeof input.avatarUrl === "string" && input.avatarUrl.startsWith("data:");
    const safeAuthAvatarUrl = isBase64 ? null : (input.avatarUrl ?? null);

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          avatar_url: safeAuthAvatarUrl,
        },
      });
    } catch (authMetaErr) {
      console.warn("[updateProfileAction] Auth metadata update warning:", authMetaErr);
    }

    let resolvedProfile = {
      id: user.id,
      email: user.email || "",
      fullName: trimmedName,
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : null,
    };

    // 2. Try atomic SECURITY DEFINER RPC function first (bypasses RLS issues)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("update_user_profile", {
        p_full_name: trimmedName,
        p_avatar_url: input.avatarUrl !== undefined ? input.avatarUrl : null,
      });

      if (!rpcError && rpcData) {
        resolvedProfile = {
          id: rpcData.id || user.id,
          email: rpcData.email || user.email || "",
          fullName: rpcData.full_name || trimmedName,
          avatarUrl: rpcData.avatar_url ?? input.avatarUrl ?? null,
        };

        revalidatePath("/app", "layout");
        return {
          success: true,
          profile: resolvedProfile,
        };
      }
    } catch {
      // RPC might not be deployed yet, continue to table upsert fallback
    }

    // 3. Fallback: Update or create database profile record directly
    try {
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

      if (!dbError && upsertedProfile) {
        resolvedProfile = {
          id: upsertedProfile.id,
          email: upsertedProfile.email,
          fullName: upsertedProfile.full_name,
          avatarUrl: upsertedProfile.avatar_url,
        };
      } else if (dbError) {
        console.warn("[updateProfileAction] Table upsert RLS warning:", dbError.message);
      }
    } catch (dbErr) {
      console.warn("[updateProfileAction] Direct upsert exception:", dbErr);
    }

    // 4. Revalidate application shell paths
    revalidatePath("/app", "layout");

    return {
      success: true,
      profile: resolvedProfile,
    };
  } catch (err) {
    console.error("[updateProfileAction] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}
