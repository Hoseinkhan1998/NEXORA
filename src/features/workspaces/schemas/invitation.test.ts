import { describe, it, expect } from "vitest";
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  shareableInviteLinkSchema,
} from "./invitation";

describe("Workspace Invitation Schemas & RBAC Validations", () => {
  describe("inviteMemberSchema", () => {
    it("accepts valid email with valid roles", () => {
      const validAdmin = inviteMemberSchema.safeParse({
        email: "alice@example.com",
        role: "admin",
      });
      expect(validAdmin.success).toBe(true);

      const validViewer = inviteMemberSchema.safeParse({
        email: "bob@example.com",
        role: "viewer",
      });
      expect(validViewer.success).toBe(true);

      const validMember = inviteMemberSchema.safeParse({
        email: "charlie@example.com",
        role: "member",
      });
      expect(validMember.success).toBe(true);
    });

    it("lowercases and trims email", () => {
      const parsed = inviteMemberSchema.parse({
        email: "  USER@Example.COM  ",
        role: "member",
      });
      expect(parsed.email).toBe("user@example.com");
    });

    it("defaults role to 'member' if unspecified", () => {
      const parsed = inviteMemberSchema.parse({
        email: "test@domain.com",
      });
      expect(parsed.role).toBe("member");
    });

    it("rejects invalid email formats", () => {
      const invalid = inviteMemberSchema.safeParse({
        email: "not-an-email",
        role: "member",
      });
      expect(invalid.success).toBe(false);
    });

    it("rejects 'owner' role in invitation (owner role cannot be directly invited)", () => {
      const invalid = inviteMemberSchema.safeParse({
        email: "hacker@example.com",
        role: "owner",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("updateMemberRoleSchema", () => {
    it("validates valid role transitions", () => {
      const valid = updateMemberRoleSchema.safeParse({
        targetUserId: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
        newRole: "admin",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects empty targetUserId", () => {
      const invalid = updateMemberRoleSchema.safeParse({
        targetUserId: "",
        newRole: "viewer",
      });
      expect(invalid.success).toBe(false);
    });

    it("rejects upgrading to 'owner' via standard member role update", () => {
      const invalid = updateMemberRoleSchema.safeParse({
        targetUserId: "user-123",
        newRole: "owner",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("shareableInviteLinkSchema", () => {
    it("applies default values for expiration and max uses", () => {
      const parsed = shareableInviteLinkSchema.parse({});
      expect(parsed.role).toBe("member");
      expect(parsed.expiresInDays).toBe(7);
      expect(parsed.maxUses).toBe(25);
    });

    it("rejects expiration days beyond allowable boundaries", () => {
      const tooSmall = shareableInviteLinkSchema.safeParse({ expiresInDays: 0 });
      expect(tooSmall.success).toBe(false);

      const tooLarge = shareableInviteLinkSchema.safeParse({ expiresInDays: 100 });
      expect(tooLarge.success).toBe(false);
    });

    it("rejects non-integer max uses", () => {
      const invalid = shareableInviteLinkSchema.safeParse({ maxUses: 5.5 });
      expect(invalid.success).toBe(false);
    });
  });
});
