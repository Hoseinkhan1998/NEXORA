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
    const { error } = await supabase.auth.signInWithPassword({
      email: parseResult.data.email,
      password: parseResult.data.password,
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
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
