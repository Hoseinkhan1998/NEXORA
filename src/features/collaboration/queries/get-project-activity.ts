import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import type { ProjectActivityWithActor } from "../types";

export async function getProjectActivities(
  projectId: string,
  workspaceId: string,
  limit = 50
): Promise<ProjectActivityWithActor[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Enforce workspace membership server-side
  const membership = await getWorkspaceMembership(workspaceId, user.id);
  if (!membership) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_activity")
    .select(
      `
      id,
      workspace_id,
      project_id,
      actor_id,
      entity_type,
      entity_id,
      action,
      metadata,
      created_at,
      actor:profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[getProjectActivities] Query error:", error);
    return [];
  }

  return data.map((item) => {
    // Supabase can return joined relation as single object or array
    const rawActor = Array.isArray(item.actor) ? item.actor[0] : item.actor;
    return {
      id: item.id,
      workspace_id: item.workspace_id,
      project_id: item.project_id,
      actor_id: item.actor_id,
      entity_type: item.entity_type as "task" | "project",
      entity_id: item.entity_id,
      action: item.action as ProjectActivityWithActor["action"],
      metadata: (item.metadata || {}) as ProjectActivityWithActor["metadata"],
      created_at: item.created_at,
      actor: {
        id: rawActor?.id || item.actor_id,
        email: rawActor?.email || "",
        fullName: rawActor?.full_name || null,
        avatarUrl: rawActor?.avatar_url || null,
      },
    };
  });
}
