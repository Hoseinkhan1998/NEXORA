"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "../queries/get-workspaces";
import { inviteMemberSchema, type InviteMemberInput } from "../schemas/invitation";
import { sendInvitationEmail } from "../lib/send-invitation-email";

export interface InviteMemberResult {
  success: boolean;
  error?: string;
  invitationToken?: string;
  alreadyMember?: boolean;
  emailSent?: boolean;
  inviteUrl?: string;
}

/**
 * Creates an email-specific invitation to a workspace with an assigned role.
 * Restricted to workspace owners and administrators.
 */
export async function inviteMemberByEmailAction(
  workspaceId: string,
  workspaceSlug: string,
  input: InviteMemberInput
): Promise<InviteMemberResult> {
  const validated = inviteMemberSchema.safeParse(input);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Invalid invitation input.",
    };
  }

  const { email, role } = validated.data;
  const supabase = await createClient();

  // 1. Authenticate caller
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to invite members." };
  }

  // 2. Authorize caller role (must be owner or admin)
  const callerMembership = await getWorkspaceMembership(workspaceId, user.id);
  if (
    !callerMembership ||
    (callerMembership.role !== "owner" && callerMembership.role !== "admin")
  ) {
    return {
      success: false,
      error: "Only workspace owners and administrators are permitted to invite members.",
    };
  }

  // 3. Check if user with this email is already a member
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (targetProfile) {
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetProfile.id)
      .maybeSingle();

    if (existingMember) {
      return {
        success: false,
        error: "A user with this email address is already a member of this workspace.",
        alreadyMember: true,
      };
    }
  }

  // 4. Generate secure token & 7-day expiration
  const token = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // 5. Delete any existing pending invitation for this email in this workspace
  await supabase
    .from("workspace_invitations")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("email", email)
    .is("accepted_at", null);

  // 6. Insert new invitation record
  const { error: insertError } = await supabase.from("workspace_invitations").insert({
    workspace_id: workspaceId,
    email,
    role,
    token,
    invited_by: user.id,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("[inviteMemberByEmailAction] Insert error:", insertError);
    return {
      success: false,
      error: "Failed to create invitation. Please ensure migrations are applied.",
    };
  }

  // 7. Resolve workspace and inviter details for email
  const { data: wsData } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .single();

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const workspaceName = wsData?.name || workspaceSlug;
  const inviterName =
    callerProfile?.full_name || user.email?.split("@")[0] || "A team administrator";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl.replace(/\/$/, "")}/invite/${token}`;

  const emailRes = await sendInvitationEmail({
    toEmail: email,
    workspaceName,
    inviterName,
    role,
    inviteUrl,
  });

  revalidatePath(`/app/${workspaceSlug}/settings`);

  return {
    success: true,
    invitationToken: token,
    emailSent: emailRes.sent,
    inviteUrl,
  };
}

/**
 * Retrieves an active shareable link invitation, or generates a new one.
 */
export async function getOrCreateShareableInviteAction(
  workspaceId: string,
  workspaceSlug: string,
  role: "admin" | "member" | "viewer" = "member",
  isSingleUse: boolean = false
): Promise<InviteMemberResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const callerMembership = await getWorkspaceMembership(workspaceId, user.id);
  if (
    !callerMembership ||
    (callerMembership.role !== "owner" && callerMembership.role !== "admin")
  ) {
    return {
      success: false,
      error: "Only owners and administrators can generate shareable invite links.",
    };
  }

  // Check for an existing unexpired reusable link (only if not requesting a single-use link)
  if (!isSingleUse) {
    const { data: existingLink } = await supabase
      .from("workspace_invitations")
      .select("token, expires_at")
      .eq("workspace_id", workspaceId)
      .is("email", null)
      .eq("role", role)
      .eq("is_single_use", false)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingLink?.token) {
      return {
        success: true,
        invitationToken: existingLink.token,
      };
    }
  }

  // Create a new shareable token (single-use expires in 7 days, reusable in 30 days)
  const token = `link_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  const days = isSingleUse ? 7 : 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase.from("workspace_invitations").insert({
    workspace_id: workspaceId,
    email: null, // Indicates shareable link
    role,
    token,
    invited_by: user.id,
    expires_at: expiresAt,
    is_single_use: isSingleUse,
  });

  if (insertError) {
    console.error("[getOrCreateShareableInviteAction] Insert error:", insertError);
    return {
      success: false,
      error: "Failed to create shareable link.",
    };
  }

  revalidatePath(`/app/${workspaceSlug}/settings`);

  return {
    success: true,
    invitationToken: token,
  };
}

/**
 * Revokes a pending invitation.
 */
export async function revokeInvitationAction(
  workspaceId: string,
  workspaceSlug: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const callerMembership = await getWorkspaceMembership(workspaceId, user.id);
  if (
    !callerMembership ||
    (callerMembership.role !== "owner" && callerMembership.role !== "admin")
  ) {
    return {
      success: false,
      error: "Only owners and administrators can revoke invitations.",
    };
  }

  const { error } = await supabase
    .from("workspace_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("workspace_id", workspaceId);

  if (error) {
    return { success: false, error: "Failed to revoke invitation." };
  }

  revalidatePath(`/app/${workspaceSlug}/settings`);
  return { success: true };
}
