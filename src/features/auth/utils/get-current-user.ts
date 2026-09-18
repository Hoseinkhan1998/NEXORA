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

    if (!profileData) {
      // Profile does not exist in public.profiles (e.g. deleted by admin)
      return {
        user: null,
        profile: null,
        isAuthenticated: false,
      };
    }

    profile = {
      id: profileData.id,
      email: profileData.email,
      fullName: profileData.full_name,
      avatarUrl: profileData.avatar_url,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
    };
  } catch {
    return {
      user: null,
      profile: null,
      isAuthenticated: false,
    };
  }

  return {
    user,
    profile,
    isAuthenticated: true,
  };
}
