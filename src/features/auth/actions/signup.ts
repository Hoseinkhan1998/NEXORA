"use server";

import { createClient } from "@/lib/supabase/server";
import { signupSchema, type SignupInput } from "../schemas/auth";
import { mapAuthError } from "../utils/error-mapping";
import type { AuthActionResult } from "../types";

export async function signupAction(values: SignupInput): Promise<AuthActionResult> {
  const parseResult = signupSchema.safeParse(values);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Please correct the highlighted errors.",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = await createClient();
    const { email, password, fullName } = parseResult.data;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    // Check if user session was immediately established or email confirmation is required
    if (data.user && !data.session) {
      return {
        success: true,
        requiresConfirmation: true,
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
