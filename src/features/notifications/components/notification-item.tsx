"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/features/collaboration/lib/relative-time";
import { UserCheck, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { NotificationItem as NotificationItemType, NotificationType } from "../types";

interface NotificationItemProps {
  notification: NotificationItemType;
  workspaceSlug?: string;
  onMarkRead: (id: string) => void;
  onCloseDropdown?: () => void;
}

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "task_assigned":
      return <UserCheck className="h-3 w-3 text-blue-500" />;
    case "task_status_changed":
      return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    case "task_priority_urgent":
      return <AlertTriangle className="h-3 w-3 text-destructive" />;
    case "task_due_soon":
      return <Clock className="h-3 w-3 text-amber-500" />;
    default:
      return null;
  }
}

export function NotificationItemRow({
  notification,
  workspaceSlug,
  onMarkRead,
  onCloseDropdown,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }

    if (workspaceSlug && notification.project_id) {
      onCloseDropdown?.();
      router.push(`/app/${workspaceSlug}/projects/${notification.project_id}`);
    }
  };

  const actorName =
    notification.actor?.fullName || notification.actor?.email?.split("@")[0] || "Someone";
  const initials = actorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-muted/50 cursor-pointer select-none border-b border-border/40 last:border-b-0 ${
        !notification.is_read ? "bg-primary/5" : ""
      }`}
    >
      {/* Actor Avatar with Type Badge */}
      <div className="relative shrink-0 mt-0.5">
        <Avatar className="h-8 w-8">
          {notification.actor?.avatarUrl && (
            <AvatarImage src={notification.actor.avatarUrl} alt={actorName} />
          )}
          <AvatarFallback className="text-[10px] bg-muted font-medium">{initials}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background border border-border">
          {getTypeIcon(notification.type)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold text-foreground truncate">{notification.title}</p>
          {!notification.is_read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
          )}
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {notification.message}
        </p>

        <p className="text-[10px] text-muted-foreground pt-0.5">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
    </div>
  );
}
