"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { useNotificationsRealtime } from "../hooks/use-notifications-realtime";
import type { NotificationItem as NotificationItemType } from "../types";

const NotificationDropdownPanel = dynamic(
  () => import("./notification-dropdown-panel").then((mod) => mod.NotificationDropdownPanel),
  {
    loading: () => (
      <div className="flex h-48 items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

interface NotificationCenterProps {
  userId?: string;
  workspaceId?: string;
  workspaceSlug?: string;
}

export function NotificationCenter({
  userId,
  workspaceId,
  workspaceSlug,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<{
    notifications: NotificationItemType[];
    unreadCount: number;
  }>({ notifications: [], unreadCount: 0 });

  const { notifications, unreadCount, markLocalRead, markAllLocalRead } = useNotificationsRealtime({
    userId,
    workspaceId,
    initialNotifications: initialData.notifications,
    initialUnreadCount: initialData.unreadCount,
  });

  // Listen for custom event from command palette
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("nexora:open-notifications", handleOpen);
    return () => window.removeEventListener("nexora:open-notifications", handleOpen);
  }, []);

  // Load initial notifications on first mount
  useEffect(() => {
    if (!userId) return;

    async function loadNotifications() {
      try {
        const res = await fetch(
          `/api/notifications${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
        );
        if (res.ok) {
          const data: { notifications: NotificationItemType[]; unreadCount: number } =
            await res.json();
          if (data.notifications) {
            setInitialData({
              notifications: data.notifications,
              unreadCount: data.unreadCount,
            });
          }
        }
      } catch {
        // Non-blocking
      }
    }

    loadNotifications();
  }, [userId, workspaceId]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground relative cursor-pointer"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[380px] p-0 shadow-lg border border-border bg-popover text-popover-foreground rounded-xl overflow-hidden"
      >
        {open && (
          <NotificationDropdownPanel
            notifications={notifications}
            unreadCount={unreadCount}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            onClose={() => setOpen(false)}
            markLocalRead={markLocalRead}
            markAllLocalRead={markAllLocalRead}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
