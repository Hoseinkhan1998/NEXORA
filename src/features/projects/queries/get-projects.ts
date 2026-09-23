import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus, ProjectWithCreator } from "../types";

/**
 * Retrieves all projects for a specific workspace, optionally filtered by status.
 * Enforced by PostgreSQL RLS (caller must be a workspace member).
 * Cached per-request using React cache.
 */
export const getWorkspaceProjects = cache(async function getWorkspaceProjects(
  workspaceId: string,
  status?: ProjectStatus
): Promise<ProjectWithCreator[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("projects")
    .select(
      `
      id,
      workspace_id,
      name,
      slug,
      description,
      status,
      color,
      created_by,
      created_at,
      updated_at,
      creator:profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((item) => {
    const creator = Array.isArray(item.creator) ? item.creator[0] : item.creator;
    return {
      id: item.id,
      workspace_id: item.workspace_id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      status: item.status as ProjectStatus,
      color: item.color,
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
      creator: creator
        ? {
            id: creator.id,
            email: creator.email,
            full_name: creator.full_name,
            avatar_url: creator.avatar_url,
          }
        : null,
    };
  });
});

/**
 * Securely resolves a project by ID, verifying that it belongs to the specified workspace.
 * Returns null if not found or if caller lacks membership.
 * Cached per-request using React cache.
 */
export const getProjectById = cache(async function getProjectById(
  projectId: string,
  workspaceId: string
): Promise<ProjectWithCreator | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      workspace_id,
      name,
      slug,
      description,
      status,
      color,
      created_by,
      created_at,
      updated_at,
      creator:profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    return null;
  }

  const creator = Array.isArray(data.creator) ? data.creator[0] : data.creator;

  return {
    id: data.id,
    workspace_id: data.workspace_id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    status: data.status as ProjectStatus,
    color: data.color,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
    creator: creator
      ? {
          id: creator.id,
          email: creator.email,
          full_name: creator.full_name,
          avatar_url: creator.avatar_url,
        }
      : null,
  };
});
