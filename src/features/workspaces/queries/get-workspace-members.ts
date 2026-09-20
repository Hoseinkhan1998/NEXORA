import { createClient } from "@/lib/supabase/server";
import type { WorkspaceMemberWithProfile, WorkspaceInvitation } from "../types";

/**
 * Retrieves all members with their profile metadata for a given workspace.
 * Strict Row Level Security (RLS) ensures users can only query workspaces they belong to.
 */
export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      `
      id,
      user_id,
      workspace_id,
      role,
      created_at,
      profile:profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[getWorkspaceMembers] Error querying members:", error);
    return [];
  }

  // Map and sort: Owner first, then Admin, then Member, then Viewer
  const roleWeights: Record<string, number> = {
    owner: 1,
    admin: 2,
    member: 3,
    viewer: 4,
  };

  const members: WorkspaceMemberWithProfile[] = data.map((item) => {
    const profile = Array.isArray(item.profile) ? item.profile[0] : item.profile;
    return {
      id: item.id,
      userId: item.user_id,
      workspaceId: item.workspace_id,
      role: item.role,
      email: profile?.email || "Unknown",
      fullName: profile?.full_name || null,
      avatarUrl: profile?.avatar_url || null,
      joinedAt: item.created_at,
    };
  });

  return members.sort((a, b) => {
    const weightA = roleWeights[a.role] || 99;
    const weightB = roleWeights[b.role] || 99;
    if (weightA !== weightB) return weightA - weightB;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });
}

/**
 * Retrieves active, unexpired pending invitations for a workspace.
 * Restricted by RLS to workspace owners and administrators.
 */
export async function getWorkspaceInvitations(
  workspaceId: string
): Promise<WorkspaceInvitation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_invitations")
    .select(
      `
      id,
      workspace_id,
      email,
      role,
      token,
      expires_at,
      created_at,
      accepted_at,
      inviter:profiles!invited_by (
        full_name,
        email
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) {
    // If the table doesn't exist yet before migration, fail gracefully without breaking the page
    return [];
  }

  return data.map((item) => {
    const inviter = Array.isArray(item.inviter) ? item.inviter[0] : item.inviter;
    const inviterName = inviter?.full_name || inviter?.email?.split("@")[0] || "Admin";

    return {
      id: item.id,
      workspaceId: item.workspace_id,
      email: item.email,
      role: item.role,
      token: item.token,
      invitedByName: inviterName,
      expiresAt: item.expires_at,
      createdAt: item.created_at,
    };
  });
}
