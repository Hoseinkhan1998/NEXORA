import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema } from "./auth";

describe("Auth Schemas", () => {
  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "alex@nexora.app",
        password: "securePassword123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("alex@nexora.app");
      }
    });

    it("trims whitespace from email", () => {
      const result = loginSchema.safeParse({
        email: "  alex@nexora.app  ",
        password: "securePassword123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("alex@nexora.app");
      }
    });

    it("rejects invalid email formats", () => {
      const invalidEmails = [
        "not-an-email",
        "missing@domain",
        "@missinguser.com",
        "spaces in@email.com",
      ];
      for (const email of invalidEmails) {
        const result = loginSchema.safeParse({
          email,
          password: "password123",
        });
        expect(result.success).toBe(false);
      }
    });

    it("rejects empty email and empty password", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.email).toBeDefined();
        expect(errors.password).toBeDefined();
      }
    });

    it("rejects password shorter than 6 characters", () => {
      const result = loginSchema.safeParse({
        email: "alex@nexora.app",
        password: "12345",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toContain(
          "Password must be at least 6 characters"
        );
      }
    });
  });

  describe("signupSchema", () => {
    it("accepts valid signup with matching passwords and optional full name", () => {
      const result = signupSchema.safeParse({
        email: "sara@nexora.app",
        fullName: "Sara Connor",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid signup with empty full name", () => {
      const result = signupSchema.safeParse({
        email: "sara@nexora.app",
        fullName: "",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const result = signupSchema.safeParse({
        email: "sara@nexora.app",
        password: "password123",
        confirmPassword: "differentPassword456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.confirmPassword).toContain("Passwords do not match");
      }
    });

    it("rejects fullName exceeding maximum character limit", () => {
      const longName = "A".repeat(101);
      const result = signupSchema.safeParse({
        email: "sara@nexora.app",
        fullName: longName,
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.fullName).toContain(
          "Full name must be 100 characters or fewer"
        );
      }
    });
  });
});
