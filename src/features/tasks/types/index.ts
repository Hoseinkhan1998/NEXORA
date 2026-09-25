export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  position: number;
  is_private?: boolean;
  attachments?: TaskAttachment[];
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface TaskCreator {
  id: string;
  email: string;
  full_name: string | null;
}

export interface TaskWithDetails extends Task {
  assignee: TaskAssignee | null;
  assignees: TaskAssignee[];
  creator?: TaskCreator | null;
  attachments?: TaskAttachment[];
}

export interface WorkspaceAssignee {
  userId: string;
  role: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  assigneeIds?: string[];
  dueDate?: string | null;
  position?: number;
  isPrivate?: boolean;
  attachments?: TaskAttachment[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  assigneeIds?: string[];
  dueDate?: string | null;
  position?: number;
  isPrivate?: boolean;
  attachments?: TaskAttachment[];
}

export * from "./comment";

