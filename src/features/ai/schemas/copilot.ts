import { z } from "zod";

export const copilotMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message exceeds 2,000 characters limit."),
});

export const copilotRequestSchema = z.object({
  workspaceSlug: z
    .string()
    .trim()
    .min(1, "Workspace identifier is required.")
    .max(100, "Workspace identifier is too long."),
  messages: z
    .array(copilotMessageSchema)
    .min(1, "At least one message is required.")
    .max(20, "Conversation history limit exceeded (max 20 messages)."),
});

export type CopilotRequestInput = z.infer<typeof copilotRequestSchema>;
