export type NotificationType =
  "task_assigned" | "task_status_changed" | "task_priority_urgent" | "task_due_soon";

export interface NotificationActor {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface NotificationItem {
  id: string;
  workspace_id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: string;
  entity_id: string;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: NotificationActor | null;
}

export interface CreateNotificationInput {
  workspaceId: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId: string;
  projectId?: string | null;
}
