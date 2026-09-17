import { createClient } from "@/lib/supabase/server";
import type { TaskWithDetails, WorkspaceAssignee, TaskStatus, TaskPriority } from "../types";

/**
 * Retrieves all tasks for a specific project within a workspace.
 * Enforced by PostgreSQL RLS (caller must be a workspace member).
 */
export async function getProjectTasks(
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

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
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
    `
    )
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getProjectTasks] Error querying tasks:", error);
    return [];
  }

  return data.map((item) => {
    const assignee = Array.isArray(item.assignee) ? item.assignee[0] : item.assignee;
    const creator = Array.isArray(item.creator) ? item.creator[0] : item.creator;

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
      assignee: assignee
        ? {
            id: assignee.id,
            email: assignee.email,
            full_name: assignee.full_name,
            avatar_url: assignee.avatar_url,
          }
        : null,
      creator: creator
        ? {
            id: creator.id,
            email: creator.email,
            full_name: creator.full_name,
          }
        : null,
    };
  });
}

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

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
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
    `
    )
    .eq("id", taskId)
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    return null;
  }

  const assignee = Array.isArray(data.assignee) ? data.assignee[0] : data.assignee;
  const creator = Array.isArray(data.creator) ? data.creator[0] : data.creator;

  return {
    id: data.id,
    workspace_id: data.workspace_id,
    project_id: data.project_id,
    title: data.title,
    description: data.description,
    status: data.status as TaskStatus,
    priority: data.priority as TaskPriority,
    assignee_id: data.assignee_id,
    created_by: data.created_by,
    due_date: data.due_date,
    position: data.position,
    created_at: data.created_at,
    updated_at: data.updated_at,
    assignee: assignee
      ? {
          id: assignee.id,
          email: assignee.email,
          full_name: assignee.full_name,
          avatar_url: assignee.avatar_url,
        }
      : null,
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
