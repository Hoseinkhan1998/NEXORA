"use server";

import { createClient } from "@/lib/supabase/server";

export interface MarkNotificationReadResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to mark a single notification as read for the authenticated caller.
 */
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<MarkNotificationReadResult> {
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

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);

  if (error) {
    console.error("[markNotificationAsReadAction] Update error:", error);
    return {
      success: false,
      error: "Failed to mark notification as read.",
    };
  }

  return { success: true };
}
