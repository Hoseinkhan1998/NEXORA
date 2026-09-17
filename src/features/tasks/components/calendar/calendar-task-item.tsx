"use client";

import * as React from "react";
import { EditTaskDialog } from "../edit-task-dialog";
import { cn } from "@/lib/utils";
import type { TaskWithDetails, WorkspaceAssignee, TaskPriority, TaskStatus } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface CalendarTaskItemProps {
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

const PRIORITY_DOT_COLORS: Record<TaskPriority, string> = {
  urgent: "bg-rose-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-slate-400 dark:bg-slate-500",
};

const STATUS_BORDER_COLORS: Record<TaskStatus, string> = {
  todo: "border-l-slate-400 dark:border-l-slate-500",
  in_progress: "border-l-blue-500",
  done: "border-l-emerald-500 opacity-70",
};

export function CalendarTaskItem({
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: CalendarTaskItemProps) {
  const canEdit = userRole !== "viewer";
  const priorityDot = PRIORITY_DOT_COLORS[task.priority] || "bg-blue-500";
  const statusBorder = STATUS_BORDER_COLORS[task.status] || "border-l-slate-400";
  const isDone = task.status === "done";

  const triggerContent = (
    <div
      className={cn(
        "group/item flex items-center gap-1.5 w-full text-left px-1.5 py-1 rounded text-[11px] font-medium leading-tight",
        "bg-background/80 hover:bg-accent border border-border/60 border-l-2 shadow-2xs transition-all",
        statusBorder,
        canEdit ? "cursor-pointer" : "cursor-default"
      )}
      title={`${task.title} (${task.priority} priority - ${task.status})`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot)} />
      <span
        className={cn(
          "truncate flex-1 text-foreground",
          isDone && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </span>
    </div>
  );

  if (!canEdit) {
    return triggerContent;
  }

  return (
    <EditTaskDialog
      task={task}
      workspaceId={workspaceId}
      projectId={projectId}
      workspaceSlug={workspaceSlug}
      assignees={assignees}
      userRole={userRole}
      trigger={triggerContent}
    />
  );
}
