"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "../queries/get-workspaces";
import { updateMemberRoleSchema, type UpdateMemberRoleInput } from "../schemas/invitation";
import { logActivity } from "@/features/collaboration/lib/log-activity";
import type { WorkspaceRole } from "../types";

export interface ManageMemberResult {
  success: boolean;
  error?: string;
}

/**
 * Updates a workspace member's role (Owner can change anyone; Admin can change between member/viewer).
 */
export async function updateMemberRoleAction(
  workspaceId: string,
  workspaceSlug: string,
  input: UpdateMemberRoleInput
): Promise<ManageMemberResult> {
  const validated = updateMemberRoleSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || "Invalid input." };
  }

  const { targetUserId, newRole } = validated.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  // 1. Authorize caller
  const callerMembership = await getWorkspaceMembership(workspaceId, user.id);
  if (
    !callerMembership ||
    (callerMembership.role !== "owner" && callerMembership.role !== "admin")
  ) {
    return {
      success: false,
      error: "Only owners and administrators are permitted to change member roles.",
    };
  }

  // 2. Fetch workspace owner
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .single();

  if (workspace?.owner_id === targetUserId) {
    return {
      success: false,
      error: "The workspace owner role cannot be altered.",
    };
  }

  // 3. Fetch target member's current role
  const targetMembership = await getWorkspaceMembership(workspaceId, targetUserId);
  if (!targetMembership) {
    return {
      success: false,
      error: "Target user is not a member of this workspace.",
    };
  }

  // Admins cannot change roles of other Admins, or promote users to Admin
  if (callerMembership.role === "admin") {
    if (targetMembership.role === "admin" || newRole === "admin") {
      return {
        success: false,
        error: "Only the workspace owner can promote or demote administrators.",
      };
    }
  }

  // 4. Update role in database
  const { error: updateError } = await supabase
    .from("workspace_members")
    .update({ role: newRole as WorkspaceRole, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId);

  if (updateError) {
    console.error("[updateMemberRoleAction] Update error:", updateError);
    return { success: false, error: "Failed to update member role." };
  }

  await logActivity({
    workspaceId,
    projectId: workspaceId,
    actorId: user.id,
    entityType: "project",
    entityId: workspaceId,
    action: "project_updated",
    metadata: {
      type: "role_updated",
      target_user_id: targetUserId,
      from_role: targetMembership.role,
      to_role: newRole,
    },
  });

  revalidatePath(`/app/${workspaceSlug}/settings`);
  revalidatePath(`/app/${workspaceSlug}`);

  return { success: true };
}

/**
 * Removes a member from a workspace (or allows self-leave).
 */
export async function removeMemberAction(
  workspaceId: string,
  workspaceSlug: string,
  targetUserId: string
): Promise<ManageMemberResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .single();

  if (workspace?.owner_id === targetUserId) {
    return {
      success: false,
      error: "The workspace owner cannot be removed. Transfer ownership before leaving.",
    };
  }

  const callerMembership = await getWorkspaceMembership(workspaceId, user.id);
  if (!callerMembership) {
    return { success: false, error: "You are not a member of this workspace." };
  }

  const isSelf = user.id === targetUserId;

  // If not self, verify caller is owner or admin
  if (!isSelf) {
    if (callerMembership.role !== "owner" && callerMembership.role !== "admin") {
      return {
        success: false,
        error: "Only owners and administrators can remove members.",
      };
    }

    const targetMembership = await getWorkspaceMembership(workspaceId, targetUserId);
    if (!targetMembership) {
      return { success: false, error: "User is not a member of this workspace." };
    }

    if (callerMembership.role === "admin" && targetMembership.role === "admin") {
      return {
        success: false,
        error: "Administrators cannot remove other administrators.",
      };
    }
  }

  const { error: deleteError } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId);

  if (deleteError) {
    console.error("[removeMemberAction] Delete error:", deleteError);
    return { success: false, error: "Failed to remove member." };
  }

  await logActivity({
    workspaceId,
    projectId: workspaceId,
    actorId: user.id,
    entityType: "project",
    entityId: workspaceId,
    action: "project_updated",
    metadata: {
      type: isSelf ? "member_left" : "member_removed",
      target_user_id: targetUserId,
    },
  });

  revalidatePath(`/app/${workspaceSlug}/settings`);
  revalidatePath(`/app/${workspaceSlug}`);

  return { success: true };
}
