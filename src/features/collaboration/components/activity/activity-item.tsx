"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatActivityNarrative, getActivityVisualVariant } from "../../lib/activity-formatter";
import { formatRelativeTime } from "../../lib/relative-time";
import type { ProjectActivityWithActor } from "../../types";
import { Plus, ArrowRight, Sparkles, User, Calendar, Trash2, FileEdit } from "lucide-react";

interface ActivityItemProps {
  activity: ProjectActivityWithActor;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const actorName = activity.actor.fullName || activity.actor.email.split("@")[0] || "Someone";
  const initials = (actorName[0] || "U").toUpperCase();
  const narrative = formatActivityNarrative(activity);
  const variant = getActivityVisualVariant(activity.action);
  const timeFormatted = formatRelativeTime(activity.created_at);

  const getIcon = () => {
    switch (variant.iconType) {
      case "create":
        return <Plus className="h-3 w-3" />;
      case "status":
        return <ArrowRight className="h-3 w-3" />;
      case "priority":
        return <Sparkles className="h-3 w-3" />;
      case "assign":
        return <User className="h-3 w-3" />;
      case "calendar":
        return <Calendar className="h-3 w-3" />;
      case "delete":
        return <Trash2 className="h-3 w-3" />;
      default:
        return <FileEdit className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0 text-xs">
      <Avatar className="h-7 w-7 shrink-0 mt-0.5 border border-border/60">
        {activity.actor.avatarUrl && <AvatarImage src={activity.actor.avatarUrl} alt={actorName} />}
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[10px]">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="leading-snug text-foreground break-words">
          <span className="font-semibold text-foreground">{actorName}</span>{" "}
          <span className="text-muted-foreground">{narrative.verb}</span>
          {narrative.details && (
            <span className="text-muted-foreground/80 italic ml-1 font-mono text-[11px]">
              ({narrative.details})
            </span>
          )}
        </p>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`h-4 px-1.5 text-[9px] font-medium gap-1 uppercase tracking-wider ${variant.badgeClass}`}
          >
            {getIcon()}
            <span>{activity.action.replace("task_", "").replace("_", " ")}</span>
          </Badge>

          <span
            className="text-[10px] text-muted-foreground/70 font-mono"
            title={new Date(activity.created_at).toLocaleString()}
          >
            {timeFormatted}
          </span>
        </div>
      </div>
    </div>
  );
}
