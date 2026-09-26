import { createClient } from "@/lib/supabase/server";
import { createNotificationSchema } from "../schemas/notification";
import type { CreateNotificationInput } from "../types";
import { sendTelegramNotification } from "@/features/telegram/lib/send-telegram-notification";

/**
 * Server-side helper to record and dispatch an in-app notification.
 * Strictly guarantees that self-notifications (recipientId === actorId) are never created.
 * Fails safely without throwing so parent business actions are not disrupted.
 */
export async function createNotification(input: CreateNotificationInput): Promise<boolean> {
  // 1. Self-notification prevention guard
  if (!input.recipientId || input.recipientId === input.actorId) {
    return false;
  }

  // 2. Validate payload
  const validated = createNotificationSchema.safeParse(input);
  if (!validated.success) {
    console.error("[createNotification] Payload validation failed:", validated.error.flatten());
    return false;
  }

  const {
    workspaceId,
    recipientId,
    actorId,
    type,
    title,
    message,
    entityType,
    entityId,
    projectId,
  } = validated.data;

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("notifications").insert({
      workspace_id: workspaceId,
      recipient_id: recipientId,
      actor_id: actorId,
      type,
      title,
      message,
      entity_type: entityType,
      entity_id: entityId,
      project_id: projectId || null,
    });

    if (error) {
      console.error("[createNotification] Failed to insert notification:", error);
      return false;
    }

    // Dispatch real-time Telegram notification asynchronously (fire-and-forget)
    sendTelegramNotification({
      workspaceId,
      recipientId,
      actorId,
      type,
      title,
      message,
      entityType,
      entityId,
      projectId,
    }).catch((tgErr) => {
      console.warn("[createNotification] Telegram notification warning:", tgErr);
    });

    return true;
  } catch (err) {
    console.error("[createNotification] Unexpected error inserting notification:", err);
    return false;
  }
}
