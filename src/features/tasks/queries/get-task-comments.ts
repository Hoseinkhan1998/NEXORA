import { createClient } from "@/lib/supabase/server";
import type { TaskComment, TaskCommentsPage } from "../types/comment";

export interface GetTaskCommentsOptions {
  limit?: number;
  cursor?: string | null; // ISO timestamp for loading older messages
}

export async function getTaskComments(
  taskId: string,
  options: GetTaskCommentsOptions = {}
): Promise<TaskCommentsPage> {
  const limit = options.limit || 10;
  const cursor = options.cursor;

  const supabase = await createClient();

  let query = supabase
    .from("task_comments")
    .select(
      `
      id,
      task_id,
      workspace_id,
      user_id,
      content,
      file_url,
      file_name,
      file_type,
      file_size,
      created_at,
      updated_at,
      author:profiles!task_comments_user_id_fkey (
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getTaskComments] Error fetching comments:", error);
    return {
      comments: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  const rawList = data || [];
  const hasMore = rawList.length > limit;
  const items = hasMore ? rawList.slice(0, limit) : rawList;

  const mapped: TaskComment[] = items.map((row: any) => {
    const rawAuthor = Array.isArray(row.author) ? row.author[0] : row.author;
    return {
      id: row.id,
      task_id: row.task_id,
      workspace_id: row.workspace_id,
      user_id: row.user_id,
      content: row.content || "",
      file_url: row.file_url || null,
      file_name: row.file_name || null,
      file_type: row.file_type || null,
      file_size: row.file_size || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: {
        id: rawAuthor?.id || row.user_id,
        email: rawAuthor?.email || "",
        full_name: rawAuthor?.full_name || null,
        avatar_url: rawAuthor?.avatar_url || null,
      },
    };
  });

  // Reverse so older is at the top, latest at bottom
  mapped.reverse();

  const oldestInBatch = mapped[0]?.created_at || null;
  const nextCursor = hasMore ? oldestInBatch : null;

  return {
    comments: mapped,
    nextCursor,
    hasMore,
  };
}
