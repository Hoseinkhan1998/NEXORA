import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Circle, Clock, CheckCircle2 } from "lucide-react";
import type { TaskStatus } from "../types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  switch (status) {
    case "done":
      return (
        <Badge
          variant="outline"
          className={`text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 gap-1 px-2 py-0.5 ${className || ""}`}
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>Done</span>
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          variant="outline"
          className={`text-[10px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 gap-1 px-2 py-0.5 ${className || ""}`}
        >
          <Clock className="h-3 w-3" />
          <span>In Progress</span>
        </Badge>
      );
    case "todo":
    default:
      return (
        <Badge
          variant="secondary"
          className={`text-[10px] font-medium text-muted-foreground gap-1 px-2 py-0.5 ${className || ""}`}
        >
          <Circle className="h-3 w-3 opacity-60" />
          <span>To Do</span>
        </Badge>
      );
  }
}
