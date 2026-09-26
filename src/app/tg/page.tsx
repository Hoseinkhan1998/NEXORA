"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Send, ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {} from "@/features/telegram";

export default function TelegramBridgePage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<"authenticating" | "ready" | "fallback">(
    "authenticating"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;

    if (!tg || typeof initData !== "string" || initData.length === 0) {
      // In normal browser environment
      queueMicrotask(() => setStatus("fallback"));
      return;
    }

    try {
      tg.ready();
      tg.expand();
      tg.HapticFeedback?.impactOccurred("light");
    } catch (err) {
      console.warn("[TG Bridge] WebApp init error:", err);
    }

    // Check for startParam in URL query string or Telegram WebApp initDataUnsafe
    const searchParams = new URLSearchParams(window.location.search);
    const urlStartParam = searchParams.get("startapp") || searchParams.get("start_param");
    const unsafeStartParam = (tg as unknown as { initDataUnsafe?: { start_param?: string } })
      ?.initDataUnsafe?.start_param;
    const startParam = urlStartParam || unsafeStartParam;

    // Authenticate with server using initData
    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, startParam }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (res.ok && json.success) {
          tg.HapticFeedback?.notificationOccurred("success");
          setStatus("ready");
          // Smoothly navigate to the application
          window.location.href = json.redirect || "/app";
        } else {
          throw new Error(json.error || "Authentication failed");
        }
      })
      .catch((err) => {
        console.error("[TG Bridge] Auth error:", err);
        tg.HapticFeedback?.notificationOccurred("error");
        setErrorMessage(err.message || "Failed to authenticate with Telegram.");
        setStatus("fallback");
      });
  }, [router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-card to-background p-6 select-none">
      <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-2xl text-center">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* NEXORA Brand Logo & Tag */}
        <div className="flex items-center justify-center space-x-2.5 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            NEXORA
          </span>
        </div>

        {status === "authenticating" ? (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Connecting with Telegram...
            </h2>
            <p className="text-sm text-muted-foreground">
              Verifying your secure credentials and launching workspace.
            </p>
          </div>
        ) : status === "ready" ? (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <ArrowRight className="h-6 w-6" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Opening Workspace</h2>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {errorMessage ? (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">NEXORA in Telegram</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Experience full project management, task tracking, and instant collaboration
                directly inside Telegram.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button asChild size="lg" className="w-full gap-2 font-medium">
                <a
                  href="https://t.me/NexoraTasksBot"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="h-4 w-4" />
                  Open in Telegram
                  <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
                </a>
              </Button>

              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/login">
                  Continue to Web App
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
