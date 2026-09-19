"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { mapAuthError } from "../utils/error-mapping";
import { getAppOrigin } from "../utils/get-app-origin";

const emailSchema = z.string().email("Invalid email address");

export async function resendConfirmationAction(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const result = emailSchema.safeParse(email);
  if (!result.success) {
    return {
      success: false,
      error: "Please provide a valid email address.",
    };
  }

  try {
    const supabase = await createClient();
    const appUrl = await getAppOrigin();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: result.data,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: mapAuthError(error),
      };
    }

    return {
      success: true,
      message: "Verification email sent. Please check your inbox and spam folder.",
    };
  } catch (err) {
    return {
      success: false,
      error: mapAuthError(err),
    };
  }
}
