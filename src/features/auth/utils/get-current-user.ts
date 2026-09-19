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

    let activeProfileData = profileData;

    if (!activeProfileData) {
      // Self-heal: profile record is missing in public.profiles. Auto-provision for authenticated user.
      const fallbackName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "User";
      const fallbackAvatar =
        (user.user_metadata?.avatar_url as string | undefined) ||
        (user.user_metadata?.picture as string | undefined) ||
        null;

      try {
        const { data: createdProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email || "",
              full_name: fallbackName,
              avatar_url: fallbackAvatar,
            },
            { onConflict: "id" }
          )
          .select("id, email, full_name, avatar_url, created_at, updated_at")
          .maybeSingle();

        if (createdProfile) {
          activeProfileData = createdProfile;
        }
      } catch (upsertErr) {
        console.warn("[getCurrentUser] Self-healing profile error:", upsertErr);
      }
    }

    profile = activeProfileData
      ? {
          id: activeProfileData.id,
          email: activeProfileData.email,
          fullName:
            activeProfileData.full_name ||
            (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.name as string | undefined) ||
            null,
          avatarUrl:
            activeProfileData.avatar_url ||
            (user.user_metadata?.avatar_url as string | undefined) ||
            null,
          createdAt: activeProfileData.created_at,
          updatedAt: activeProfileData.updated_at,
        }
      : {
          id: user.id,
          email: user.email || "",
          fullName:
            (user.user_metadata?.full_name as string | undefined) ||
            user.email?.split("@")[0] ||
            "User",
          avatarUrl: (user.user_metadata?.avatar_url as string | undefined) || null,
          createdAt: user.created_at,
          updatedAt: user.created_at,
        };
  } catch {
    // If any DB query throws, still honor the authenticated user session with a fallback profile
    profile = {
      id: user.id,
      email: user.email || "",
      fullName:
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "User",
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
