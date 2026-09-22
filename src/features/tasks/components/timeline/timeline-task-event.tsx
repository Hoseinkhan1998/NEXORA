"use client";

import * as React from "react";
import { EditTaskDialog } from "../edit-task-dialog";
import { cn } from "@/lib/utils";
import type { TaskWithDetails, WorkspaceAssignee, TaskPriority, TaskStatus } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TimelineTaskEventProps {
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  currentUserId?: string;
}

const PRIORITY_STYLES: Record<TaskPriority, { border: string; dot: string; bg: string }> = {
  urgent: {
    border: "border-rose-500/70",
    dot: "bg-rose-500",
    bg: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300",
  },
  high: {
    border: "border-amber-500/70",
    dot: "bg-amber-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300",
  },
  medium: {
    border: "border-blue-500/70",
    dot: "bg-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300",
  },
  low: {
    border: "border-slate-400/70 dark:border-slate-500/70",
    dot: "bg-slate-400 dark:bg-slate-500",
    bg: "bg-muted hover:bg-muted/80 text-muted-foreground",
  },
};

const STATUS_INDICATOR: Record<TaskStatus, string> = {
  todo: "border-l-2 border-l-slate-400",
  in_progress: "border-l-2 border-l-blue-500",
  done: "border-l-2 border-l-emerald-500 line-through opacity-75",
};

export function TimelineTaskEvent({
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
}: TimelineTaskEventProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const isPrivileged = userRole === "owner" || userRole === "admin";
  const isCreator = currentUserId ? task.created_by === currentUserId : false;
  const isAssignee = currentUserId
    ? task.assignees?.some((a) => a.id === currentUserId) || task.assignee?.id === currentUserId
    : false;
  const canDrag = userRole !== "viewer" && (isPrivileged || isCreator || isAssignee);

  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const statusStyle = STATUS_INDICATOR[task.status] || STATUS_INDICATOR.todo;

  const eventPill = (
    <div
      draggable={canDrag}
      onDragStart={(e) => {
        if (!canDrag) return;
        setIsDragging(true);
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            taskId: task.id,
            taskTitle: task.title,
            currentDueDate: task.due_date,
          })
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        "group/pill flex items-center gap-1.5 h-7 w-[40px] mx-auto px-1.5 rounded text-[11px] font-medium border shadow-2xs transition-all select-none",
        priorityStyle.bg,
        priorityStyle.border,
        statusStyle,
        canDrag ? "cursor-grab active:cursor-grabbing hover:scale-105" : "cursor-pointer",
        isDragging && "opacity-40 ring-1 ring-primary"
      )}
      title={`${task.title} (Due: ${task.due_date}) • ${task.priority} priority, ${task.status}${canDrag ? " • Drag to reschedule" : ""}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot(task.priority))} />
      <span className="truncate text-[10px] font-semibold leading-none">
        {task.status === "done" ? "✓" : "●"}
      </span>
    </div>
  );

  return (
    <EditTaskDialog
      task={task}
      workspaceId={workspaceId}
      projectId={projectId}
      workspaceSlug={workspaceSlug}
      assignees={assignees}
      userRole={userRole}
      currentUserId={currentUserId}
      trigger={eventPill}
    />
  );
}

function priorityDot(priority: TaskPriority) {
  switch (priority) {
    case "urgent":
      return "bg-rose-500";
    case "high":
      return "bg-amber-500";
    case "medium":
      return "bg-blue-500";
    case "low":
    default:
      return "bg-slate-400 dark:bg-slate-500";
  }
}
