import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Task title is required" })
    .max(160, { message: "Task title must be 160 characters or fewer" }),
  description: z
    .string()
    .trim()
    .max(5000, { message: "Description must be 5000 characters or fewer" })
    .optional()
    .or(z.literal("")),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigneeId: z
    .string()
    .uuid({ message: "Invalid assignee ID" })
    .nullable()
    .optional()
    .or(z.literal("")),
  assigneeIds: z.array(z.string().uuid({ message: "Invalid assignee ID" })).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Due date must be in YYYY-MM-DD format" })
    .nullable()
    .optional()
    .or(z.literal("")),
  position: z.coerce.number().optional(),
  isPrivate: z.boolean().optional().default(false),
});

export type CreateTaskSchemaInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Task title is required" })
    .max(160, { message: "Task title must be 160 characters or fewer" })
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, { message: "Description must be 5000 characters or fewer" })
    .nullable()
    .optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z
    .string()
    .uuid({ message: "Invalid assignee ID" })
    .nullable()
    .optional()
    .or(z.literal("")),
  assigneeIds: z.array(z.string().uuid({ message: "Invalid assignee ID" })).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Due date must be in YYYY-MM-DD format" })
    .nullable()
    .optional()
    .or(z.literal("")),
  position: z.coerce.number().optional(),
  isPrivate: z.boolean().optional(),
});

export type UpdateTaskSchemaInput = z.infer<typeof updateTaskSchema>;

export const moveTaskSchema = z.object({
  taskId: z.string().uuid({ message: "Invalid task ID" }),
  workspaceId: z.string().uuid({ message: "Invalid workspace ID" }),
  projectId: z.string().uuid({ message: "Invalid project ID" }),
  status: z.enum(["todo", "in_progress", "done"], {
    message: "Status must be todo, in_progress, or done",
  }),
  position: z.coerce.number().positive({ message: "Position must be a positive number" }),
});

export type MoveTaskSchemaInput = z.infer<typeof moveTaskSchema>;
