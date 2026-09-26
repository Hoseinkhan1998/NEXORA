"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  TelegramContextValue,
  TelegramUser,
  TelegramWebApp,
} from "../types";

const TelegramContext = React.createContext<TelegramContextValue>({
  isTelegram: false,
  isReady: false,
  webApp: null,
  user: null,
  colorScheme: "dark",
  hapticImpact: () => {},
  hapticNotification: () => {},
  hapticSelection: () => {},
  expandViewport: () => {},
  closeMiniApp: () => {},
});

function getTelegramSnapshot(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const tg = window.Telegram?.WebApp;
  if (tg && typeof tg.initData === "string" && tg.initData.length > 0) {
    return tg;
  }
  return null;
}

function subscribe() {
  return () => {};
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const webApp = React.useSyncExternalStore(
    subscribe,
    getTelegramSnapshot,
    () => null
  );

  const isTelegram = Boolean(webApp);
  const user: TelegramUser | null = webApp?.initDataUnsafe?.user || null;
  const startParam: string | undefined = webApp?.initDataUnsafe?.start_param || undefined;
  const colorScheme: "light" | "dark" = webApp?.colorScheme || "dark";

  React.useEffect(() => {
    if (webApp) {
      try {
        webApp.ready();
        webApp.expand();
      } catch (err) {
        console.warn("[TelegramProvider] Error initializing WebApp:", err);
      }
    }
  }, [webApp]);

  // Synchronize Telegram native BackButton with Next.js navigation
  React.useEffect(() => {
    if (!isTelegram || !webApp?.BackButton) return;

    // Root paths where BackButton should be hidden
    const isRoot = pathname === "/" || pathname === "/app" || pathname === "/tg";

    const handleBack = () => {
      try {
        webApp.HapticFeedback?.selectionChanged();
      } catch {
        // Safe fallback
      }
      router.back();
    };

    if (isRoot) {
      webApp.BackButton.hide();
      webApp.BackButton.offClick(handleBack);
    } else {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBack);
    }

    return () => {
      try {
        webApp.BackButton.offClick(handleBack);
      } catch {
        // Clean up
      }
    };
  }, [isTelegram, webApp, pathname, router]);

  const hapticImpact = React.useCallback(
    (style: "light" | "medium" | "heavy" = "light") => {
      try {
        webApp?.HapticFeedback?.impactOccurred(style);
      } catch {
        // Safe fallback
      }
    },
    [webApp]
  );

  const hapticNotification = React.useCallback(
    (type: "error" | "success" | "warning") => {
      try {
        webApp?.HapticFeedback?.notificationOccurred(type);
      } catch {
        // Safe fallback
      }
    },
    [webApp]
  );

  const hapticSelection = React.useCallback(() => {
    try {
      webApp?.HapticFeedback?.selectionChanged();
    } catch {
      // Safe fallback
    }
  }, [webApp]);

  const expandViewport = React.useCallback(() => {
    try {
      webApp?.expand();
    } catch {
      // Safe fallback
    }
  }, [webApp]);

  const closeMiniApp = React.useCallback(() => {
    try {
      webApp?.close();
    } catch {
      // Safe fallback
    }
  }, [webApp]);

  const value = React.useMemo<TelegramContextValue>(
    () => ({
      isTelegram,
      isReady: true,
      webApp,
      user,
      startParam,
      colorScheme,
      hapticImpact,
      hapticNotification,
      hapticSelection,
      expandViewport,
      closeMiniApp,
    }),
    [
      isTelegram,
      webApp,
      user,
      startParam,
      colorScheme,
      hapticImpact,
      hapticNotification,
      hapticSelection,
      expandViewport,
      closeMiniApp,
    ]
  );

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return React.useContext(TelegramContext);
}
