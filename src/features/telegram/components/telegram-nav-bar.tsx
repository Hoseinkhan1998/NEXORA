"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, FolderKanban, Bot, Settings } from "lucide-react";
import { useTelegram } from "../hooks/use-telegram";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TelegramNavBarProps {
  currentWorkspaceSlug?: string;
}

export function TelegramNavBar({ currentWorkspaceSlug }: TelegramNavBarProps) {
  const { hapticSelection } = useTelegram();
  const pathname = usePathname();

  const basePrefix = currentWorkspaceSlug ? `/app/${currentWorkspaceSlug}` : "/app";

  const handleOpenCopilot = (e: React.MouseEvent) => {
    e.preventDefault();
    hapticSelection();
    if (!currentWorkspaceSlug) {
      toast.info("Please select a workspace to access AI Copilot.");
      return;
    }
    window.dispatchEvent(new CustomEvent("nexora:open-copilot"));
  };

  const navItems = [
    {
      label: "Home",
      icon: LayoutDashboard,
      href: basePrefix,
      isActive: pathname === basePrefix || pathname === "/app",
      isAction: false,
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: `${basePrefix}/analytics`,
      isActive: pathname.includes("/analytics"),
      isAction: false,
    },
    {
      label: "Projects",
      icon: FolderKanban,
      href: `${basePrefix}/projects`,
      isActive: pathname.includes("/projects"),
      isAction: false,
    },
    {
      label: "Copilot",
      icon: Bot,
      isAction: true,
      onClick: handleOpenCopilot,
      isActive: false,
    },
    {
      label: "Settings",
      icon: Settings,
      href: `${basePrefix}/settings`,
      isActive: pathname.includes("/settings"),
      isAction: false,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex h-16 items-center justify-around border-t border-border/60 bg-background/95 backdrop-blur-xl px-2 pb-safe supports-[backdrop-filter]:bg-background/85 shadow-lg"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        if (item.isAction) {
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-1.5 text-xs font-medium transition-all select-none cursor-pointer",
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
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href!}
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
