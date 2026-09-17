import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Workspace name must be at least 2 characters" })
    .max(50, { message: "Workspace name must be 50 characters or fewer" }),
  slug: z
    .string()
    .trim()
    .min(2, { message: "Slug must be at least 2 characters" })
    .max(60, { message: "Slug must be 60 characters or fewer" })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    })
    .optional(),
});

export type CreateWorkspaceSchemaInput = z.infer<typeof createWorkspaceSchema>;
