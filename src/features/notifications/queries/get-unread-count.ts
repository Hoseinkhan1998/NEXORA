import { createClient } from "@/lib/supabase/server";

/**
 * Retrieves the total count of unread notifications for the authenticated user.
 */
export async function getUnreadNotificationCount(workspaceId?: string): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  let query = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("[getUnreadNotificationCount] Query error:", error);
    return 0;
  }

  return count || 0;
}
