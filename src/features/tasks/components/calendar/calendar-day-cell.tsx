"use client";

import * as React from "react";
import { CalendarTaskItem } from "./calendar-task-item";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "../../lib/calendar";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface CalendarDayCellProps {
  day: CalendarDay;
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

export function CalendarDayCell({
  day,
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: CalendarDayCellProps) {
  const isCurrentMonth = day.isCurrentMonth;
  const isToday = day.isToday;

  return (
    <div
      className={cn(
        "flex flex-col min-h-[105px] sm:min-h-[125px] p-1.5 border-b border-r border-border/60 transition-colors",
        isCurrentMonth ? "bg-card" : "bg-muted/25 text-muted-foreground/50",
        isToday && "bg-primary/5"
      )}
    >
      {/* Day header: Day number */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span
          className={cn(
            "inline-flex items-center justify-center text-xs font-medium rounded-full h-5 w-5",
            isToday
              ? "bg-primary text-primary-foreground font-bold shadow-xs"
              : isCurrentMonth
                ? "text-foreground"
                : "text-muted-foreground/50"
          )}
        >
          {day.dayNumber}
        </span>

        {tasks.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground/70">{tasks.length}</span>
        )}
      </div>

      {/* Task event chips stream */}
      <div className="flex-1 space-y-1 overflow-y-auto max-h-[100px] scrollbar-thin">
        {tasks.map((task) => (
          <CalendarTaskItem
            key={task.id}
            task={task}
            workspaceId={workspaceId}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            assignees={assignees}
            userRole={userRole}
          />
        ))}
      </div>
    </div>
  );
}
