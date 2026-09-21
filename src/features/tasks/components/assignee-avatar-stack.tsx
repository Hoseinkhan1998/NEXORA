"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskAssignee } from "../types";

interface AssigneeAvatarStackProps {
  assignees?: TaskAssignee[] | null;
  fallbackAssignee?: TaskAssignee | null;
  className?: string;
  size?: "xs" | "sm" | "md";
  showName?: boolean;
  maxDisplay?: number;
}

function getInitials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function AssigneeAvatarStack({
  assignees = [],
  fallbackAssignee,
  className,
  size = "sm",
  showName = true,
  maxDisplay = 3,
}: AssigneeAvatarStackProps) {
  const safeAssignees = React.useMemo(() => {
    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      return assignees.filter(Boolean);
    }
    if (fallbackAssignee) {
      return [fallbackAssignee];
    }
    return [];
  }, [assignees, fallbackAssignee]);

  const sizeClasses = {
    xs: "h-4 w-4 text-[9px]",
    sm: "h-5 w-5 text-[10px]",
    md: "h-6 w-6 text-[11px]",
  }[size];

  if (safeAssignees.length === 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 italic select-none",
          className
        )}
      >
        <User className={cn(size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5", "opacity-50")} />
        {showName && <span>Unassigned</span>}
      </div>
    );
  }

  // Single assignee view: Avatar + Full Name
  if (safeAssignees.length === 1) {
    const single = safeAssignees[0]!;
    const displayName = single.full_name || single.email.split("@")[0] || "User";
    const initials = getInitials(single.full_name, single.email);

    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-2 min-w-0 max-w-full cursor-default",
                className
              )}
            >
              <Avatar className={cn(sizeClasses, "ring-1 ring-background shadow-xs shrink-0")}>
                {single.avatar_url && <AvatarImage src={single.avatar_url} alt={displayName} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {showName && (
                <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
                  {displayName}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-semibold">{displayName}</p>
            <p className="text-[11px] text-muted-foreground font-mono">{single.email}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Multiple assignees view: Overlapping Avatar Stack with Tooltips
  const visibleAssignees = safeAssignees.slice(0, maxDisplay);
  const remainingCount = safeAssignees.length - maxDisplay;

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("inline-flex items-center gap-1.5 min-w-0", className)}>
        <div className="flex items-center -space-x-1.5 overflow-hidden p-0.5">
          {visibleAssignees.map((assignee) => {
            const displayName = assignee.full_name || assignee.email.split("@")[0] || "User";
            const initials = getInitials(assignee.full_name, assignee.email);

            return (
              <Tooltip key={assignee.id}>
                <TooltipTrigger asChild>
                  <Avatar
                    className={cn(
                      sizeClasses,
                      "ring-2 ring-background shadow-xs shrink-0 cursor-default transition-transform hover:z-10 hover:scale-110"
                    )}
                  >
                    {assignee.avatar_url && (
                      <AvatarImage src={assignee.avatar_url} alt={displayName} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{assignee.email}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    sizeClasses,
                    "flex items-center justify-center rounded-full bg-muted border border-border/80 text-muted-foreground font-semibold text-[9px] ring-2 ring-background cursor-default"
                  )}
                >
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">
                  +{remainingCount} more:{" "}
                  {safeAssignees
                    .slice(maxDisplay)
                    .map((a) => a.full_name || a.email.split("@")[0])
                    .join(", ")}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {showName && (
          <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">
            {safeAssignees.length} assignees
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
