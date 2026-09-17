import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowDown, ArrowUp, Flame } from "lucide-react";
import type { TaskPriority } from "../types";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  switch (priority) {
    case "urgent":
      return (
        <Badge
          variant="outline"
          className={`text-[10px] font-medium text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 gap-1 px-1.5 py-0.5 ${className || ""}`}
        >
          <Flame className="h-3 w-3" />
          <span>Urgent</span>
        </Badge>
      );
    case "high":
      return (
        <Badge
          variant="outline"
          className={`text-[10px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 gap-1 px-1.5 py-0.5 ${className || ""}`}
        >
          <ArrowUp className="h-3 w-3" />
          <span>High</span>
        </Badge>
      );
    case "medium":
      return (
        <Badge
          variant="outline"
          className={`text-[10px] font-medium text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 gap-1 px-1.5 py-0.5 ${className || ""}`}
        >
          <AlertTriangle className="h-3 w-3" />
          <span>Medium</span>
        </Badge>
      );
    case "low":
    default:
      return (
        <Badge
          variant="secondary"
          className={`text-[10px] font-medium text-muted-foreground gap-1 px-1.5 py-0.5 ${className || ""}`}
        >
          <ArrowDown className="h-3 w-3 opacity-60" />
          <span>Low</span>
        </Badge>
      );
  }
}
