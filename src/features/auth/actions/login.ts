"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "../schemas/auth";
import { mapAuthError } from "../utils/error-mapping";
import type { AuthActionResult } from "../types";

export async function loginAction(values: LoginInput): Promise<AuthActionResult> {
  const parseResult = loginSchema.safeParse(values);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please correct the highlighted errors.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parseResult.data.email,
      password: parseResult.data.password,
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    if (data?.user) {
      try {
        const metadata = data.user.user_metadata || {};
        const fullName =
          metadata.full_name || metadata.name || data.user.email?.split("@")[0] || null;
        const avatarUrl = metadata.avatar_url || metadata.picture || null;

        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email || "",
            full_name: fullName,
            avatar_url: avatarUrl,
          },
          { onConflict: "id" }
        );
      } catch (profileErr) {
        console.warn("[loginAction] Profile self-heal warning:", profileErr);
      }
    }

    return {
      success: true,
      redirectTo: "/app",
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}
