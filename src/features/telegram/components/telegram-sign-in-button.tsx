"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useTelegram } from "../hooks/use-telegram";

interface TelegramSignInButtonProps {
  label?: string;
  returnTo?: string;
  className?: string;
}

export function TelegramSignInButton({
  label = "Continue with Telegram",
  returnTo,
  className,
}: TelegramSignInButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isTelegram, webApp, hapticImpact, hapticNotification } = useTelegram();
  const [isLoading, setIsLoading] = React.useState(false);

  const targetReturn =
    returnTo || searchParams.get("returnTo") || searchParams.get("next") || "/app";

  // Load Telegram widget script dynamically on the web if not already present
  React.useEffect(() => {
    if (typeof window === "undefined" || isTelegram) return;

    if (!document.getElementById("telegram-widget-script")) {
      const script = document.createElement("script");
      script.id = "telegram-widget-script";
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isTelegram]);

  async function handleTelegramAuth() {
    setIsLoading(true);

    // 1. Inside Telegram Mini App: Native 1-click seamless login
    if (isTelegram && webApp?.initData) {
      try {
        hapticImpact("medium");
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: webApp.initData }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          hapticNotification("success");
          toast.success("Signed in with Telegram!");
          window.location.href = targetReturn;
          return;
        }

        throw new Error(data.error || "Failed to authenticate with Telegram.");
      } catch (err: unknown) {
        hapticNotification("error");
        const message = err instanceof Error ? err.message : "Authentication failed.";
        toast.error("Telegram Login Error", { description: message });
        setIsLoading(false);
        return;
      }
    }

    // 2. Outside Telegram: Standard Web Browser Login via Telegram Login Widget
    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || "8840552954";
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "NexoraTasksBot";
      Telegram?: {
        Login?: {
          auth: (
            options: { bot_id: string; request_access: boolean },
            callback: (user: Record<string, string | number> | false) => void
          ) => void;
        };
      };
    };

    if (tgWindow.Telegram?.Login?.auth) {
      tgWindow.Telegram.Login.auth(
        { bot_id: botId, request_access: true },
        async (widgetUser) => {
          if (!widgetUser) {
            setIsLoading(false);
            return;
          }

          try {
            const res = await fetch("/api/auth/telegram/widget", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                widgetData: widgetUser,
                returnTo: targetReturn,
              }),
            });

            const json = await res.json();
            if (res.ok && json.success) {
              toast.success("Successfully logged in with Telegram!");
              window.location.href = json.redirect || targetReturn;
            } else {
              throw new Error(json.error || "Authentication failed");
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Login failed";
            toast.error("Authentication Error", { description: message });
            setIsLoading(false);
          }
        }
      );
    } else {
      // Fallback if widget script is loading: open bot directly with return link
      window.open(`https://t.me/${botUsername}`, "_blank");
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleTelegramAuth}
      disabled={isLoading}
      className={`w-full relative flex items-center justify-center gap-2 border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 text-foreground transition-colors ${
        className || ""
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
      ) : (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-white shrink-0">
          <Send className="h-2.5 w-2.5 -translate-x-[0.5px] translate-y-[0.5px]" />
        </div>
      )}
      <span className="font-medium text-sm text-sky-500 dark:text-sky-400">{label}</span>
    </Button>
  );
}
