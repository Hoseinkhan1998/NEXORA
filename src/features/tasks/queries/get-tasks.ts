import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  TaskWithDetails,
  TaskAssignee,
  WorkspaceAssignee,
  TaskStatus,
  TaskPriority,
} from "../types";

/**
 * Retrieves all tasks for a specific project within a workspace.
 * Enforced by PostgreSQL RLS (caller must be a workspace member).
 */
const TASK_SELECT_WITH_MULTI_ASSIGNEES = `
  id,
  workspace_id,
  project_id,
  title,
  description,
  status,
  priority,
  assignee_id,
  created_by,
  due_date,
  position,
  created_at,
  updated_at,
  assignees_rel:task_assignees (
    profile:profiles (
      id,
      email,
      full_name,
      avatar_url
    )
  ),
  assignee:profiles!tasks_assignee_id_fkey (
    id,
    email,
    full_name,
    avatar_url
  ),
  creator:profiles!tasks_created_by_fkey (
    id,
    email,
    full_name
  )
`;

const TASK_SELECT_LEGACY = `
  id,
  workspace_id,
  project_id,
  title,
  description,
  status,
  priority,
  assignee_id,
  created_by,
  due_date,
  position,
  created_at,
  updated_at,
  assignee:profiles!tasks_assignee_id_fkey (
    id,
    email,
    full_name,
    avatar_url
  ),
  creator:profiles!tasks_created_by_fkey (
    id,
    email,
    full_name
  )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTaskRow(item: any): TaskWithDetails {
  const assignee = Array.isArray(item.assignee) ? item.assignee[0] : item.assignee;
  const creator = Array.isArray(item.creator) ? item.creator[0] : item.creator;

  const assigneesList: TaskAssignee[] = [];
  if (Array.isArray(item.assignees_rel)) {
    for (const rel of item.assignees_rel) {
      const prof = Array.isArray(rel.profile) ? rel.profile[0] : rel.profile;
      if (prof) {
        assigneesList.push({
          id: prof.id,
          email: prof.email,
          full_name: prof.full_name,
          avatar_url: prof.avatar_url,
        });
      }
    }
  }

  if (assigneesList.length === 0 && assignee) {
    assigneesList.push({
      id: assignee.id,
      email: assignee.email,
      full_name: assignee.full_name,
      avatar_url: assignee.avatar_url,
    });
  }

  const primaryAssignee =
    assigneesList[0] ||
    (assignee
      ? {
          id: assignee.id,
          email: assignee.email,
          full_name: assignee.full_name,
          avatar_url: assignee.avatar_url,
        }
      : null);

  return {
    id: item.id,
    workspace_id: item.workspace_id,
    project_id: item.project_id,
    title: item.title,
    description: item.description,
    status: item.status as TaskStatus,
    priority: item.priority as TaskPriority,
    assignee_id: item.assignee_id,
    created_by: item.created_by,
    due_date: item.due_date,
    position: item.position,
    created_at: item.created_at,
    updated_at: item.updated_at,
    assignee: primaryAssignee,
    assignees: assigneesList,
    creator: creator
      ? {
          id: creator.id,
          email: creator.email,
          full_name: creator.full_name,
        }
      : null,
  };
}

/**
 * Retrieves all tasks for a specific project within a workspace.
 * Enforced by PostgreSQL RLS (caller must be a workspace member).
 */
export const getProjectTasks = cache(async function getProjectTasks(
  projectId: string,
  workspaceId: string
): Promise<TaskWithDetails[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_MULTI_ASSIGNEES)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    // If task_assignees relationship fails before migration is applied, fallback to legacy query
    const fallbackRes = await supabase
      .from("tasks")
      .select(TASK_SELECT_LEGACY)
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });

    data = fallbackRes.data as unknown as typeof data;
    error = fallbackRes.error;
  }

  if (error || !data) {
    console.error("[getProjectTasks] Error querying tasks:", error);
    return [];
  }

  return data.map(mapTaskRow);
});

/**
 * Retrieves a single task by ID, securely scoped to project and workspace.
 */
export async function getTaskById(
  taskId: string,
  projectId: string,
  workspaceId: string
): Promise<TaskWithDetails | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_MULTI_ASSIGNEES)
    .eq("id", taskId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    const fallbackRes = await supabase
      .from("tasks")
      .select(TASK_SELECT_LEGACY)
      .eq("id", taskId)
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId)
      .single();

    data = fallbackRes.data as unknown as typeof data;
    error = fallbackRes.error;
  }

  if (error || !data) {
    return null;
  }

  return mapTaskRow(data);
}

/**
 * Retrieves valid assignees for a workspace (strictly workspace members).
 */
export async function getWorkspaceAssignees(workspaceId: string): Promise<WorkspaceAssignee[]> {
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
      user_id,
      role,
      profile:profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq("workspace_id", workspaceId);

  if (error || !data) {
    console.error("[getWorkspaceAssignees] Error querying assignees:", error);
    return [];
  }

  return data.map((item) => {
    const profile = Array.isArray(item.profile) ? item.profile[0] : item.profile;
    return {
      userId: item.user_id,
      role: item.role,
      email: profile?.email || "Unknown",
      fullName: profile?.full_name || null,
      avatarUrl: profile?.avatar_url || null,
    };
  });
}
