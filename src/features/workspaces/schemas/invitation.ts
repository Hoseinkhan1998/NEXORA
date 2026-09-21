import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  role: z
    .enum(["admin", "member", "viewer"], {
      message: "Please select a valid role (Admin, Member, or Viewer).",
    })
    .default("member"),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  targetUserId: z.string().uuid("Invalid user ID."),
  newRole: z.enum(["admin", "member", "viewer"], {
    message: "Invalid role specified.",
  }),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const shareableInviteLinkSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]).default("member"),
  expiresInDays: z.number().int().min(1).max(90).default(7),
  maxUses: z.number().int().min(1).max(100).default(25),
});

export type ShareableInviteLinkInput = z.infer<typeof shareableInviteLinkSchema>;
