import { describe, it, expect } from "vitest";
import { validateEnvironment, assertValidEnvironment } from "./env-check";

describe("Production Pre-Flight Environment Validation", () => {
  it("validates successfully with correct Supabase credentials", () => {
    const validEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "https://myproject.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_valid_test_key_long_enough_12345",
      NODE_ENV: "production",
      OPENAI_API_KEY: "sk-test-key",
    };

    const result = validateEnvironment(validEnv);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("reports error when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_valid_test_key_long_enough_12345",
    };

    const result = validateEnvironment(invalidEnv);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  });

  it("reports error when NEXT_PUBLIC_SUPABASE_URL has invalid URL format", () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "invalid-not-a-url",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_valid_test_key_long_enough_12345",
    };

    const result = validateEnvironment(invalidEnv);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("NEXT_PUBLIC_SUPABASE_URL is not a valid URL format");
  });

  it("reports error when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing", () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "https://myproject.supabase.co",
    };

    const result = validateEnvironment(invalidEnv);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  });

  it("supports NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback", () => {
    const fallbackEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "https://myproject.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_anon_fallback_key_12345",
    };

    const result = validateEnvironment(fallbackEnv);
    expect(result.valid).toBe(true);
  });

  it("throws in strict production mode when validation fails", () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: "",
    };

    expect(() => assertValidEnvironment(invalidEnv, true)).toThrowError(
      /Critical configuration errors/
    );
  });
});
