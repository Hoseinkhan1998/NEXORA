export type RealtimeConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface PresenceUser {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  onlineAt: string;
}

export type ActivityAction =
  | "task_created"
  | "task_updated"
  | "task_status_changed"
  | "task_moved"
  | "task_priority_changed"
  | "task_assigned"
  | "task_due_date_changed"
  | "task_deleted"
  | "project_updated"
  | "project_archived";

export interface ActivityMetadata {
  task_title?: string;
  old_status?: string;
  new_status?: string;
  old_priority?: string;
  new_priority?: string;
  assignee_id?: string | null;
  assignee_name?: string | null;
  old_due_date?: string | null;
  new_due_date?: string | null;
  position?: number;
  [key: string]: unknown;
}

export interface ProjectActivity {
  id: string;
  workspace_id: string;
  project_id: string;
  actor_id: string;
  entity_type: "task" | "project";
  entity_id: string;
  action: ActivityAction;
  metadata: ActivityMetadata;
  created_at: string;
}

export interface ActivityActor {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface ProjectActivityWithActor extends ProjectActivity {
  actor: ActivityActor;
}
