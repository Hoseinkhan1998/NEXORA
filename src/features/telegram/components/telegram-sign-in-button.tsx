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


  const [config, setConfig] = React.useState<{ botId: string | null; botUsername: string }>({
    botId: process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || null,
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "Mazin_NEXORAbot",
  });

  React.useEffect(() => {
    fetch("/api/auth/telegram")
      .then((res) => res.json())
      .then((data) => {
        if (data.botUsername || data.botId) {
          setConfig({
            botId: data.botId || process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || null,
            botUsername: data.botUsername || "Mazin_NEXORAbot",
          });
        }
      })
      .catch(() => {});
  }, []);

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

    // 2. Outside Telegram: Seamlessly launch Telegram bot (with invite start parameter if present)
    const botUsername = config.botUsername || "Mazin_NEXORAbot";

    let botUrl = `https://t.me/${botUsername}`;
    const inviteMatch = targetReturn.match(/\/invite\/([a-zA-Z0-9_-]+)/);
    if (inviteMatch && inviteMatch[1]) {
      const inviteToken = inviteMatch[1];
      botUrl = `https://t.me/${botUsername}?start=invite_${inviteToken}`;
      try {
        document.cookie = `nexora_pending_invite_token=${inviteToken}; path=/; max-age=86400; SameSite=Lax`;
      } catch {
        // Ignore cookie write errors
      }
    }

    toast.info("Connecting to Telegram", {
      description: `Opening @${botUsername}...`,
      duration: 3500,
    });

    const newTab = window.open(botUrl, "_blank");
    if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
      window.location.href = botUrl;
    }
    setIsLoading(false);
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
