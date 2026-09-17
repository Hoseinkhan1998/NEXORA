"use client";

import * as React from "react";
import { TimelineTaskEvent } from "./timeline-task-event";
import { EditTaskDialog } from "../edit-task-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getTaskTimelinePosition,
  TIMELINE_COLUMN_WIDTH,
  TIMELINE_TASK_PANEL_WIDTH,
  type TimelineDateRange,
} from "../../lib/timeline";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TimelineRowProps {
  task: TaskWithDetails;
  dateRange: TimelineDateRange;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

export function TimelineRow({
  task,
  dateRange,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: TimelineRowProps) {
  const canEdit = userRole !== "viewer";
  const position = getTaskTimelinePosition(task.due_date, dateRange);

  const statusLabel = task.status.replace("_", " ");
  const isDone = task.status === "done";

  const assigneeName = task.assignee
    ? task.assignee.full_name || task.assignee.email.split("@")[0]
    : null;

  const leftTriggerContent = (
    <div
      className={cn(
        "flex items-center justify-between gap-2 h-full w-full px-4 py-2 text-left group/info transition-colors",
        canEdit ? "cursor-pointer hover:bg-accent/40" : "cursor-default"
      )}
      title={`${task.title} (Due: ${task.due_date || "None"})`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className={cn(
            "text-xs font-medium truncate text-foreground group-hover/info:text-primary transition-colors",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Badge
          variant="outline"
          className="h-5 px-1.5 text-[10px] capitalize font-medium text-muted-foreground"
        >
          {statusLabel}
        </Badge>
        {assigneeName && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[70px]">
            {assigneeName}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-11 border-b border-border/60 hover:bg-muted/10 transition-colors">
      {/* Sticky Left Task Information Column */}
      <div
        style={{ width: `${TIMELINE_TASK_PANEL_WIDTH}px` }}
        className="sticky left-0 z-10 shrink-0 border-r border-border/60 bg-card"
      >
        {canEdit ? (
          <EditTaskDialog
            task={task}
            workspaceId={workspaceId}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            assignees={assignees}
            userRole={userRole}
            trigger={leftTriggerContent}
          />
        ) : (
          leftTriggerContent
        )}
      </div>

      {/* Right Timeline Date Track */}
      <div className="flex flex-1 relative">
        {dateRange.map((day, idx) => {
          const isTaskDay = position.inRange && position.columnIndex === idx;

          return (
            <div
              key={day.dateKey}
              style={{ width: `${TIMELINE_COLUMN_WIDTH}px` }}
              className={cn(
                "shrink-0 h-full border-r border-border/40 flex items-center justify-center relative",
                day.isToday && "bg-primary/5",
                day.isWeekend && "bg-muted/20"
              )}
            >
              {isTaskDay && (
                <TimelineTaskEvent
                  task={task}
                  workspaceId={workspaceId}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                  assignees={assignees}
                  userRole={userRole}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
