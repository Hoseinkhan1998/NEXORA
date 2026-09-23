import { z } from "zod";

export const PROJECT_COLOR_PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
] as const;

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Project name must be at least 2 characters" })
    .max(80, { message: "Project name must be 80 characters or fewer" }),
  description: z
    .string()
    .trim()
    .max(500, { message: "Description must be 500 characters or fewer" })
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: "Invalid color format" })
    .optional()
    .or(z.literal("")),
  memberIds: z.array(z.string().uuid()).optional(),
});

export type CreateProjectSchemaInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Project name must be at least 2 characters" })
    .max(80, { message: "Project name must be 80 characters or fewer" })
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, { message: "Description must be 500 characters or fewer" })
    .nullable()
    .optional(),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: "Invalid color format" })
    .nullable()
    .optional(),
  status: z.enum(["active", "archived"]).optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

export type UpdateProjectSchemaInput = z.infer<typeof updateProjectSchema>;
