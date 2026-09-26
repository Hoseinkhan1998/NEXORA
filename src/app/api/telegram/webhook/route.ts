import { NextResponse, type NextRequest } from "next/server";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    text?: string;
    date: number;
  };
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  replyMarkup?: object
) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("[TelegramWebhook] Failed to send message:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN is not configured." },
        { status: 500 }
      );
    }

    const update = (await request.json()) as TelegramUpdate;
    if (!update || !update.message) {
      return NextResponse.json({ ok: true, ignored: "No message payload" });
    }

    const { chat, text, from } = update.message;
    const chatId = chat.id;
    const rawText = text?.trim() || "";

    // Determine base URL from headers or environment
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "https://nexora.app");

    const tmaUrl = `${appOrigin}/tg`;

    if (rawText.startsWith("/start")) {
      const name = from?.first_name || "there";
      const welcomeText =
        `👋 *Hello ${name}! Welcome to NEXORA.*\n\n` +
        `Your complete project management & team collaboration hub is now accessible inside Telegram.\n\n` +
        `✨ *Features:*\n` +
        `• 📋 Multi-member task boards & kanban\n` +
        `• ⚡ Instant 0ms caching & fluid navigation\n` +
        `• 💬 Task comments, attachments & AI Copilot\n` +
        `• 📊 Team analytics & timelines\n\n` +
        `Tap the button below to launch your workspace:`;

      await sendTelegramMessage(botToken, chatId, welcomeText, {
        inline_keyboard: [
          [
            {
              text: "🚀 Open NEXORA Mini App",
              web_app: { url: tmaUrl },
            },
          ],
          [
            {
              text: "🌐 Web Dashboard",
              url: appOrigin,
            },
          ],
        ],
      });

      return NextResponse.json({ ok: true });
    }

    if (rawText.startsWith("/help")) {
      const helpText =
        `🛠 *NEXORA Bot Help*\n\n` +
        `Commands:\n` +
        `• /start - Launch the NEXORA Mini App\n` +
        `• /help - Show this guide\n\n` +
        `To link your existing account or view your projects, tap **Open NEXORA Mini App** below.`;

      await sendTelegramMessage(botToken, chatId, helpText, {
        inline_keyboard: [
          [
            {
              text: "🚀 Open NEXORA Mini App",
              web_app: { url: tmaUrl },
            },
          ],
        ],
      });

      return NextResponse.json({ ok: true });
    }

    // Default reply for any other text
    await sendTelegramMessage(
      botToken,
      chatId,
      `Hello! Tap below to open your NEXORA workspace inside Telegram:`,
      {
        inline_keyboard: [
          [
            {
              text: "🚀 Launch NEXORA",
              web_app: { url: tmaUrl },
            },
          ],
        ],
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook handler exception";
    console.error("[TelegramWebhook] Exception:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "NEXORA Telegram Bot Webhook",
    timestamp: new Date().toISOString(),
  });
}
