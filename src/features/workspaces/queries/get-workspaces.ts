import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole, WorkspaceWithRole, WorkspaceMember } from "../types";

/**
 * Retrieves all workspaces that the current authenticated user belongs to.
 * Enforced by RLS on workspace_members and workspaces.
 */
export async function getUserWorkspaces(): Promise<WorkspaceWithRole[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      `
      role,
      created_at,
      workspace:workspaces!inner (
        id,
        name,
        slug,
        owner_id,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .map((item) => {
      // Supabase returns relation as single object or array depending on schema typing
      const ws = Array.isArray(item.workspace) ? item.workspace[0] : item.workspace;
      if (!ws) return null;
      return {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        owner_id: ws.owner_id,
        role: item.role as WorkspaceRole,
        created_at: ws.created_at,
        updated_at: ws.updated_at,
      };
    })
    .filter((ws): ws is WorkspaceWithRole => ws !== null);
}

/**
 * Resolves a workspace by its unique slug and verifies the current user's membership.
 * Returns null if the workspace doesn't exist or the user is not a member.
 */
export async function getWorkspaceBySlug(slug: string): Promise<WorkspaceWithRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Query workspace by slug (RLS policy ensures only members can read it)
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name, slug, owner_id, created_at, updated_at")
    .eq("slug", slug)
    .single();

  if (wsError || !workspace) {
    return null;
  }

  // Resolve membership & role
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .single();

  if (memberError || !member) {
    return null;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    owner_id: workspace.owner_id,
    role: member.role as WorkspaceRole,
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
  };
}

/**
 * Gets a user's membership for a specific workspace.
 */
export async function getWorkspaceMembership(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, user_id, role, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    role: data.role as WorkspaceRole,
  };
}
