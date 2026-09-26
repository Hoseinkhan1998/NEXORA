"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, CheckSquare, Bot, Settings } from "lucide-react";
import { useTelegram } from "../hooks/use-telegram";
import { cn } from "@/lib/utils";

interface TelegramNavBarProps {
  currentWorkspaceSlug?: string;
}

export function TelegramNavBar({ currentWorkspaceSlug }: TelegramNavBarProps) {
  const { isTelegram, hapticSelection } = useTelegram();
  const pathname = usePathname();

  // ONLY render when inside Telegram Mini App
  if (!isTelegram) return null;

  const basePrefix = currentWorkspaceSlug ? `/app/${currentWorkspaceSlug}` : "/app";

  const navItems = [
    {
      label: "Home",
      icon: LayoutDashboard,
      href: basePrefix,
      isActive: pathname === basePrefix || pathname === "/app",
    },
    {
      label: "Projects",
      icon: FolderKanban,
      href: `${basePrefix}/projects`,
      isActive: pathname.includes("/projects"),
    },
    {
      label: "Tasks",
      icon: CheckSquare,
      href: `${basePrefix}/tasks`,
      isActive: pathname.includes("/tasks"),
    },
    {
      label: "Copilot",
      icon: Bot,
      href: `${basePrefix}/ai`,
      isActive: pathname.includes("/ai"),
    },
    {
      label: "Settings",
      icon: Settings,
      href: `${basePrefix}/settings`,
      isActive: pathname.includes("/settings"),
    },
  ];

  return (
    <nav
      aria-label="Telegram Mini App Navigation"
      className="fixed bottom-0 inset-x-0 z-50 flex h-16 items-center justify-around border-t border-border/60 bg-background/90 backdrop-blur-xl px-2 pb-safe supports-[backdrop-filter]:bg-background/80"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => hapticSelection()}
            className={cn(
              "flex flex-1 flex-col items-center justify-center py-1.5 text-xs font-medium transition-all select-none",
              item.isActive
                ? "text-primary scale-105 font-semibold"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative">
              <Icon className={cn("h-5 w-5 mb-0.5", item.isActive && "stroke-[2.5px]")} />
              {item.isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="truncate tracking-tight text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
