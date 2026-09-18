import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "../types";

/**
 * Retrieves caller's notifications for the specified workspace.
 * Row Level Security (RLS) guarantees only caller's notifications are accessible.
 */
export async function getUserNotifications(
  workspaceId?: string,
  limit: number = 30
): Promise<NotificationItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("notifications")
    .select(
      `
      id,
      workspace_id,
      recipient_id,
      actor_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      project_id,
      is_read,
      created_at,
      actor:profiles!notifications_actor_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("[getUserNotifications] Query error:", error);
    return [];
  }

  return data.map((item) => {
    const actor = Array.isArray(item.actor) ? item.actor[0] : item.actor;
    return {
      id: item.id,
      workspace_id: item.workspace_id,
      recipient_id: item.recipient_id,
      actor_id: item.actor_id,
      type: item.type,
      title: item.title,
      message: item.message,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      project_id: item.project_id,
      is_read: item.is_read,
      created_at: item.created_at,
      actor: actor
        ? {
            id: actor.id,
            fullName: actor.full_name,
            email: actor.email,
            avatarUrl: actor.avatar_url,
          }
        : null,
    };
  });
}
