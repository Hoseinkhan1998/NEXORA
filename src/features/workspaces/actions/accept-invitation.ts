"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface InvitationDetailsResult {
  valid: boolean;
  error?: string;
  workspaceName?: string;
  workspaceSlug?: string;
  inviterName?: string;
  role?: string;
  email?: string | null;
  alreadyMember?: boolean;
}


export interface AcceptInvitationResult {
  success: boolean;
  error?: string;
  workspaceSlug?: string;
  workspaceName?: string;
  alreadyMember?: boolean;
}

/**
 * Retrieves public details about an invitation token to display on /invite/[token].
 */
export async function getInvitationDetailsAction(
  token: string
): Promise<InvitationDetailsResult> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { valid: false, error: "Missing invitation token." };
  }

  const supabase = await createClient();

  // Try RPC helper first
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_invitation_details",
    { p_token: cleanToken }
  );

  if (!rpcError && rpcData && typeof rpcData === "object") {
    const res = rpcData as Record<string, unknown>;
    if (res.valid) {
      return {
        valid: true,
        workspaceName: String(res.workspace_name),
        workspaceSlug: String(res.workspace_slug),
        inviterName: String(res.inviter_name || "Workspace Admin"),
        role: String(res.role || "member"),
        email: res.email ? String(res.email) : null,
        alreadyMember: Boolean(res.already_member),
      };
    }
    return {
      valid: false,
      error: String(res.error || "Invalid invitation."),
      workspaceSlug: res.workspace_slug ? String(res.workspace_slug) : undefined,
    };
  }


  // Fallback direct query
  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invitations")
    .select(
      `
      id,
      email,
      role,
      expires_at,
      accepted_at,
      workspace:workspaces (
        id,
        name,
        slug
      ),
      inviter:profiles!invited_by (
        full_name,
        email
      )
    `
    )
    .eq("token", cleanToken)
    .maybeSingle();

  if (inviteError || !invite) {
    return { valid: false, error: "Invitation link not found or invalid." };
  }

  if (invite.accepted_at && invite.email) {
    const ws = Array.isArray(invite.workspace) ? invite.workspace[0] : invite.workspace;
    return {
      valid: false,
      error: "This invitation has already been accepted.",
      workspaceSlug: ws?.slug,
    };
  }


  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { valid: false, error: "This invitation link has expired." };
  }

  const workspace = Array.isArray(invite.workspace) ? invite.workspace[0] : invite.workspace;
  const inviter = Array.isArray(invite.inviter) ? invite.inviter[0] : invite.inviter;

  return {
    valid: true,
    workspaceName: workspace?.name || "Workspace",
    workspaceSlug: workspace?.slug || "",
    inviterName: inviter?.full_name || inviter?.email?.split("@")[0] || "Admin",
    role: invite.role,
    email: invite.email,
  };
}

/**
 * Accepts an invitation and links current authenticated user to the workspace.
 */
export async function acceptInvitationAction(
  token: string
): Promise<AcceptInvitationResult> {
  const cleanToken = token.trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to accept this invitation." };
  }

  // 1. Try RPC first (atomic & security definer)
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "accept_workspace_invitation",
    { p_token: cleanToken }
  );

  if (rpcError) {
    console.error("[acceptInvitationAction] RPC call error:", rpcError);
  }

  if (!rpcError && rpcData && typeof rpcData === "object") {
    const res = rpcData as Record<string, unknown>;
    if (res.success) {
      const slug = String(res.workspace_slug || "");
      if (slug) {
        revalidatePath(`/app/${slug}`);
        revalidatePath(`/app/${slug}/settings`);
      }
      return {
        success: true,
        workspaceSlug: slug,
        workspaceName: String(res.workspace_name || ""),
        alreadyMember: Boolean(res.already_member),
      };
    }
    return { success: false, error: String(res.error || "Failed to join workspace.") };
  }

  // 2. Direct Fallback if RPC is not yet registered
  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invitations")
    .select(
      `
      id,
      workspace_id,
      email,
      role,
      expires_at,
      accepted_at,
      workspace:workspaces (
        id,
        name,
        slug
      )
    `
    )
    .eq("token", cleanToken)
    .maybeSingle();

  if (inviteError || !invite) {
    if (inviteError) {
      console.error("[acceptInvitationAction] Direct query error:", inviteError);
    }
    const fallbackMsg = rpcError ? rpcError.message : "Invalid invitation.";
    return { success: false, error: fallbackMsg };
  }


  if (invite.accepted_at && invite.email) {
    return { success: false, error: "This invitation has already been used." };
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { success: false, error: "This invitation link has expired." };
  }

  const workspace = Array.isArray(invite.workspace) ? invite.workspace[0] : invite.workspace;
  if (!workspace) {
    return { success: false, error: "Workspace not found." };
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return {
      success: true,
      alreadyMember: true,
      workspaceSlug: workspace.slug,
      workspaceName: workspace.name,
    };
  }

  // Insert member
  const { error: insertError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: invite.role,
  });

  if (insertError) {
    console.error("[acceptInvitationAction] Insert member error:", insertError);
    return { success: false, error: "Failed to join workspace. Please try again." };
  }

  // Mark invitation accepted if single-use email
  if (invite.email) {
    await supabase
      .from("workspace_invitations")
      .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
      .eq("id", invite.id);
  }

  revalidatePath(`/app/${workspace.slug}`);
  revalidatePath(`/app/${workspace.slug}/settings`);

  return {
    success: true,
    alreadyMember: false,
    workspaceSlug: workspace.slug,
    workspaceName: workspace.name,
  };
}
