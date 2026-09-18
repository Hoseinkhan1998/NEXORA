import { createClient } from "@/lib/supabase/server";
import type { ActivityAction, ActivityMetadata } from "../types";

interface LogActivityParams {
  workspaceId: string;
  projectId: string;
  actorId: string;
  entityType: "task" | "project";
  entityId: string;
  action: ActivityAction;
  metadata?: ActivityMetadata;
}

/**
 * Server-side helper to record an activity event into public.project_activity.
 * Fails safely without throwing so the primary user mutation succeeds even if
 * activity logging encounters transient issues.
 */
export async function logActivity({
  workspaceId,
  projectId,
  actorId,
  entityType,
  entityId,
  action,
  metadata = {},
}: LogActivityParams): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("project_activity").insert({
      workspace_id: workspaceId,
      project_id: projectId,
      actor_id: actorId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      metadata,
    });

    if (error) {
      console.error("[logActivity] Failed to insert activity:", error);
    }
  } catch (err) {
    console.error("[logActivity] Unexpected error logging activity:", err);
  }
}
