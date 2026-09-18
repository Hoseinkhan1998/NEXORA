"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Loader2 } from "lucide-react";
import { NotificationItemRow } from "./notification-item";
import { NotificationEmpty } from "./notification-empty";
import { markNotificationAsReadAction } from "../actions/mark-notification-read";
import { markAllNotificationsAsReadAction } from "../actions/mark-all-read";
import type { NotificationItem as NotificationItemType } from "../types";

interface NotificationDropdownPanelProps {
  notifications: NotificationItemType[];
  unreadCount: number;
  workspaceId?: string;
  workspaceSlug?: string;
  onClose: () => void;
  markLocalRead: (notificationId: string) => void;
  markAllLocalRead: () => void;
}

export function NotificationDropdownPanel({
  notifications,
  unreadCount,
  workspaceId,
  workspaceSlug,
  onClose,
  markLocalRead,
  markAllLocalRead,
}: NotificationDropdownPanelProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isMarkingAll, startMarkAllTransition] = useTransition();

  const handleMarkRead = async (notificationId: string) => {
    markLocalRead(notificationId);
    await markNotificationAsReadAction(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllLocalRead();
    startMarkAllTransition(async () => {
      await markAllNotificationsAsReadAction(workspaceId);
    });
  };

  const filteredNotifications =
    activeTab === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {isMarkingAll ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5 mr-1 text-primary" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tab Filters */}
      <div className="flex border-b border-border/60 px-3 pt-1 gap-2 bg-muted/10">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "all"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "unread"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread
          {unreadCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
      </div>

      {/* Notification Items List */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-border/40">
        {filteredNotifications.length === 0 ? (
          <NotificationEmpty filter={activeTab} />
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItemRow
              key={notification.id}
              notification={notification}
              workspaceSlug={workspaceSlug}
              onMarkRead={handleMarkRead}
              onCloseDropdown={onClose}
            />
          ))
        )}
      </div>
    </>
  );
}
