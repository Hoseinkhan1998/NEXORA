"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TimelineTaskEvent } from "./timeline-task-event";
import { EditTaskDialog } from "../edit-task-dialog";
import { AssigneeAvatarStack } from "../assignee-avatar-stack";
import { Badge } from "@/components/ui/badge";
import { updateTaskDueDateAction } from "../../actions/update-task-due-date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getTaskTimelinePosition,
  TIMELINE_COLUMN_WIDTH,
  TIMELINE_TASK_PANEL_WIDTH,
  type TimelineDateRange,
  type TimelineDate,
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
  currentUserId?: string;
}

export function TimelineRow({
  task,
  dateRange,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
}: TimelineRowProps) {
  const position = getTaskTimelinePosition(task.due_date, dateRange);

  const statusLabel = task.status.replace("_", " ");
  const isDone = task.status === "done";

  const leftTriggerContent = (
    <div
      className={cn(
        "flex items-center justify-between gap-2 h-full w-full px-4 py-2 text-left group/info transition-colors cursor-pointer hover:bg-accent/40"
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
        <AssigneeAvatarStack
          assignees={task.assignees}
          fallbackAssignee={task.assignee}
          size="xs"
          showName={false}
          maxDisplay={2}
        />
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
        <EditTaskDialog
          task={task}
          workspaceId={workspaceId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          assignees={assignees}
          userRole={userRole}
          currentUserId={currentUserId}
          trigger={leftTriggerContent}
        />
      </div>

      {/* Right Timeline Date Track */}
      <div className="flex flex-1 relative">
        {dateRange.map((day, idx) => {
          const isTaskDay = position.inRange && position.columnIndex === idx;

          return (
            <TimelineDateCell
              key={day.dateKey}
              day={day}
              isTaskDay={isTaskDay}
              task={task}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
              currentUserId={currentUserId}
            />
          );
        })}
      </div>
    </div>
  );
}

function TimelineDateCell({
  day,
  isTaskDay,
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
}: {
  day: TimelineDate;
  isTaskDay: boolean;
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const canDrop = userRole !== "viewer";

  const handleDragOver = (e: React.DragEvent) => {
    if (!canDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canDrop) return;

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (!data.taskId) return;

      if (data.currentDueDate === day.dateKey) return;

      const res = await updateTaskDueDateAction(
        data.taskId,
        workspaceId,
        projectId,
        workspaceSlug,
        day.dateKey
      );

      if (res.success) {
        toast.success(`Rescheduled "${data.taskTitle || "Task"}" to ${day.dateKey}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to reschedule task.");
      }
    } catch (err) {
      console.error("[TimelineDateCell] Drop error:", err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ width: `${TIMELINE_COLUMN_WIDTH}px` }}
      className={cn(
        "shrink-0 h-full border-r border-border/40 flex items-center justify-center relative transition-colors",
        day.isToday && "bg-primary/5",
        day.isWeekend && "bg-muted/20",
        isDragOver && "bg-primary/20 ring-2 ring-primary ring-inset z-10"
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
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
