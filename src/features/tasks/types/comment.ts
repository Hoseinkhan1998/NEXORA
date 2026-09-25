export interface TaskCommentAuthor {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  workspace_id: string;
  user_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  author: TaskCommentAuthor;
}

export interface TaskCommentsPage {
  comments: TaskComment[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}
