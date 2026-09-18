import { createClient } from "@/lib/supabase/server";
import { getWorkspaceAssignees } from "@/features/tasks/queries/get-tasks";
import type { RawAnalyticsData } from "../types";
import type { Project } from "@/features/projects/types";
import type { ProjectActivity } from "@/features/collaboration/types";

/**
 * Server query that fetches all raw datasets required for workspace analytics.
 * Scoped strictly to the authenticated user and their authorized workspace.
 * Row Level Security (RLS) is strictly enforced.
 */
export async function getWorkspaceAnalyticsData(
  workspaceSlug: string
): Promise<RawAnalyticsData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // 1. Resolve workspace and verify membership
  const { data: workspaceData, error: workspaceError } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      slug,
      members:workspace_members!inner(user_id, role)
    `
    )
    .eq("slug", workspaceSlug)
    .eq("members.user_id", user.id)
    .single();

  if (workspaceError || !workspaceData) {
    return null;
  }

  const workspaceId = workspaceData.id;

  // 2. Fetch accessible projects in this workspace
  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select(
      "id, workspace_id, name, slug, description, status, color, created_by, created_at, updated_at"
    )
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (projectsError) {
    console.error("[getWorkspaceAnalyticsData] Error fetching projects:", projectsError);
  }

  // 3. Fetch tasks across workspace projects
  const { data: tasksData, error: tasksError } = await supabase
    .from("tasks")
    .select(
      "id, workspace_id, project_id, title, status, priority, assignee_id, due_date, created_at, updated_at"
    )
    .eq("workspace_id", workspaceId);

  if (tasksError) {
    console.error("[getWorkspaceAnalyticsData] Error fetching tasks:", tasksError);
  }

  // 4. Fetch eligible assignees/members
  const members = await getWorkspaceAssignees(workspaceId);

  // 5. Fetch status changed activities for historical completion velocity
  const { data: activitiesData, error: activitiesError } = await supabase
    .from("project_activity")
    .select(
      "id, workspace_id, project_id, actor_id, entity_type, entity_id, action, metadata, created_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("action", "task_status_changed")
    .order("created_at", { ascending: false });

  if (activitiesError) {
    console.error("[getWorkspaceAnalyticsData] Error fetching activities:", activitiesError);
  }

  return {
    workspace: {
      id: workspaceData.id,
      name: workspaceData.name,
      slug: workspaceData.slug,
    },
    projects: (projectsData as Project[]) || [],
    tasks: tasksData || [],
    members: members || [],
    activities: (activitiesData as ProjectActivity[]) || [],
  };
}
