"use server";

import { createClient } from "@/lib/supabase/server";

export interface MarkAllReadResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to mark all unread notifications as read for the authenticated caller.
 */
export async function markAllNotificationsAsReadAction(
  workspaceId?: string
): Promise<MarkAllReadResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be signed in to update notifications.",
    };
  }

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { error } = await query;

  if (error) {
    console.error("[markAllNotificationsAsReadAction] Update error:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read.",
    };
  }

  return { success: true };
}
