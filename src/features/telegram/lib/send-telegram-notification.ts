import { createClient } from "@/lib/supabase/server";

interface TelegramNotificationInput {
  workspaceId: string;
  recipientId: string;
  actorId?: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  projectId?: string | null;
}

export async function sendTelegramNotification(
  input: TelegramNotificationInput
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return false;
  }

  try {
    const supabase = await createClient();

    // 1. Fetch recipient's telegram_id from profiles
    const { data: recipientProfile, error } = await supabase
      .from("profiles")
      .select("telegram_id, full_name")
      .eq("id", input.recipientId)
      .maybeSingle();

    if (error || !recipientProfile?.telegram_id) {
      // Recipient does not have a linked Telegram account
      return false;
    }

    const chatId = recipientProfile.telegram_id;

    // 2. Select appropriate icon and header based on notification type
    let icon = "🔔";
    if (input.type === "task_assigned") {
      icon = "📋";
    } else if (input.title.toLowerCase().includes("message") || input.title.toLowerCase().includes("comment")) {
      icon = "💬";
    } else if (input.type === "task_status_changed") {
      icon = "🔄";
    } else if (input.type === "task_priority_urgent") {
      icon = "🚨";
    } else if (input.type === "task_due_soon") {
      icon = "⏰";
    }

    // 3. Format clean markdown message
    const formattedText =
      `${icon} *NEXORA Notification*\n\n` +
      `*${escapeMarkdown(input.title)}*\n` +
      `${escapeMarkdown(input.message)}\n\n` +
      `_Delivered by NEXORA Task Manager_`;

    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://nexora.app";
    const actionUrl = `${appOrigin}/tg`;

    // 4. Send message via Telegram Bot API
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedText,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Open in NEXORA",
                web_app: { url: actionUrl },
              },
            ],
          ],
        },
      }),
    });

    return res.ok;
  } catch (err) {
    console.warn("[sendTelegramNotification] Notification delivery warning:", err);
    return false;
  }
}

/**
 * Escapes characters with special meaning in Telegram Markdown V1
 */
function escapeMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/[*_`\[]/g, " ")
    .trim();
}
