/**
 * Production Pre-Flight Environment Validation Helper
 *
 * Verifies that required client and server environment variables are correctly
 * defined and syntactically valid prior to serving traffic.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(
  env: Record<string, string | undefined> = process.env
): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.trim() === "") {
    errors.push("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  } else {
    try {
      const parsed = new URL(supabaseUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        errors.push(
          `NEXT_PUBLIC_SUPABASE_URL must use http or https protocol. Received: ${parsed.protocol}`
        );
      }
    } catch {
      errors.push(
        `NEXT_PUBLIC_SUPABASE_URL is not a valid URL format: "${supabaseUrl}". Expected format: https://xyzcompany.supabase.co`
      );
    }
  }

  // 2. Validate NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY)
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseKey || supabaseKey.trim() === "") {
    errors.push(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  } else if (supabaseKey.length < 20) {
    warnings.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY appears suspiciously short. Ensure it matches your Supabase project API settings."
    );
  }

  // 3. Informative warnings for server-only optional keys
  const hasAiKey = Boolean(
    env.GROQ_API_KEY ||
      env.GEMINI_API_KEY ||
      env.OPENROUTER_API_KEY ||
      env.OPENAI_API_KEY ||
      env.AI_API_KEY
  );
  if (!hasAiKey && env.NODE_ENV === "production") {
    warnings.push(
      "No AI provider key (GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY) is set. In-app AI Copilot features will be unavailable in production."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that the environment is valid, logging actionable diagnostic messages.
 * In production mode, throws an error if critical variables are missing.
 */
export function assertValidEnvironment(
  env: Record<string, string | undefined> = process.env,
  strict: boolean = process.env.NODE_ENV === "production"
): void {
  const result = validateEnvironment(env);

  if (result.warnings.length > 0) {
    console.warn("[NEXORA Env Pre-Flight] Warnings:", result.warnings.join(" | "));
  }

  if (!result.valid) {
    const errorDetails = result.errors.join("\n - ");
    const message = `[NEXORA Env Pre-Flight] Critical configuration errors:\n - ${errorDetails}\n\nPlease check your .env.local or deployment environment settings.`;

    if (strict) {
      throw new Error(message);
    } else {
      console.error(message);
    }
  }
}
