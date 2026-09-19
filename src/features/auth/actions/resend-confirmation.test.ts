import { describe, it, expect, vi, beforeEach } from "vitest";
import { resendConfirmationAction } from "./resend-confirmation";

const mockResend = vi.fn();
const mockSupabase = {
  auth: {
    resend: mockResend,
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

describe("resendConfirmationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResend.mockResolvedValue({ error: null });
  });

  it("fails immediately on invalid email format", async () => {
    const result = await resendConfirmationAction("not-an-email");
    expect(result.success).toBe(false);
    expect(result.error).toContain("valid email");
    expect(mockResend).not.toHaveBeenCalled();
  });

  it("calls supabase.auth.resend with valid email and signup type", async () => {
    const result = await resendConfirmationAction("alex@nexora.app");
    expect(result.success).toBe(true);
    expect(result.message).toContain("Verification email sent");
    expect(mockResend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "signup",
        email: "alex@nexora.app",
      })
    );
  });

  it("handles Supabase rate limit error gracefully", async () => {
    mockResend.mockResolvedValue({
      error: { message: "For security purposes, you can only request this once every 60 seconds" },
    });

    const result = await resendConfirmationAction("alex@nexora.app");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
