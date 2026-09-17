import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string | null;
  fieldErrors?: Record<string, string[]> | null;
  requiresConfirmation?: boolean;
  redirectTo?: string;
}

export interface CurrentUserSession {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
}
