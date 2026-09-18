import { z } from "zod";

export const activityActionSchema = z.enum([
  "task_created",
  "task_updated",
  "task_status_changed",
  "task_moved",
  "task_priority_changed",
  "task_assigned",
  "task_due_date_changed",
  "task_deleted",
  "project_updated",
  "project_archived",
]);

export const logActivityInputSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
  projectId: z.string().uuid("Invalid project ID"),
  entityType: z.enum(["task", "project"]),
  entityId: z.string().uuid("Invalid entity ID"),
  action: activityActionSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type LogActivityInput = z.infer<typeof logActivityInputSchema>;
