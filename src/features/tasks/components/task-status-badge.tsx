import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Circle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "../types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
  fixedWidth?: boolean;
}

export function TaskStatusBadge({ status, className, fixedWidth = false }: TaskStatusBadgeProps) {
  const widthClasses = fixedWidth ? "w-[105px] justify-center text-center shrink-0" : "";

  switch (status) {
    case "done":
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 gap-1.5 px-2 py-0.5",
            widthClasses,
            className
          )}
        >
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>Done</span>
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 gap-1.5 px-2 py-0.5",
            widthClasses,
            className
          )}
        >
          <Clock className="h-3 w-3 shrink-0" />
          <span>In Progress</span>
        </Badge>
      );
    case "todo":
    default:
      return (
        <Badge
          variant="secondary"
          className={cn(
            "text-[10px] font-medium text-muted-foreground gap-1.5 px-2 py-0.5",
            widthClasses,
            className
          )}
        >
          <Circle className="h-3 w-3 shrink-0 opacity-60" />
          <span>To Do</span>
        </Badge>
      );
  }
}
