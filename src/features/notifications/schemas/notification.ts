import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "task_assigned",
  "task_status_changed",
  "task_priority_urgent",
  "task_due_soon",
]);

export const createNotificationSchema = z
  .object({
    workspaceId: z.string().uuid("Invalid workspace ID"),
    recipientId: z.string().uuid("Invalid recipient ID"),
    actorId: z.string().uuid("Invalid actor ID"),
    type: notificationTypeSchema,
    title: z.string().trim().min(1, "Title is required").max(255, "Title too long"),
    message: z.string().trim().min(1, "Message is required").max(1000, "Message too long"),
    entityType: z.string().default("task"),
    entityId: z.string().uuid("Invalid entity ID"),
    projectId: z.string().uuid("Invalid project ID").nullable().optional(),
  })
  .refine((data) => data.recipientId !== data.actorId, {
    message: "Self-notifications are not permitted.",
    path: ["recipientId"],
  });

export type CreateNotificationSchemaInput = z.infer<typeof createNotificationSchema>;
