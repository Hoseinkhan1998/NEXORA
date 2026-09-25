"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteCommentAction(commentId: string, workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if author or admin/owner
  const { data: comment, error: fetchErr } = await supabase
    .from("task_comments")
    .select("id, user_id, workspace_id")
    .eq("id", commentId)
    .single();

  if (fetchErr || !comment) {
    return { success: false, error: "Comment not found" };
  }

  const isAuthor = comment.user_id === user.id;

  if (!isAuthor) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = member?.role === "owner" || member?.role === "admin";
    if (!isAdmin) {
      return { success: false, error: "You cannot delete this comment" };
    }
  }

  const { error: delErr } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId);

  if (delErr) {
    return { success: false, error: delErr.message };
  }

  return { success: true };
}
