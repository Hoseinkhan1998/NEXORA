import { createClient } from "@/lib/supabase/server";
import type { CurrentUserSession, UserProfile } from "../types";

export async function getCurrentUser(): Promise<CurrentUserSession> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      profile: null,
      isAuthenticated: false,
    };
  }

  let profile: UserProfile | null = null;

  try {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      profile = {
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        avatarUrl: profileData.avatar_url,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      };
    } else {
      // Fallback profile representation from user metadata if row hasn't synced yet
      profile = {
        id: user.id,
        email: user.email || "",
        fullName:
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          null,
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at,
      };
    }
  } catch {
    profile = {
      id: user.id,
      email: user.email || "",
      fullName: (user.user_metadata?.full_name as string | undefined) || null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) || null,
      createdAt: user.created_at,
      updatedAt: user.created_at,
    };
  }

  return {
    user,
    profile,
    isAuthenticated: true,
  };
}
