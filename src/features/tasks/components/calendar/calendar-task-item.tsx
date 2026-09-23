"use client";

import * as React from "react";
import { EditTaskDialog } from "../edit-task-dialog";
import { Lock } from "lucide-react";
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
  currentUserId?: string;
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
  currentUserId,
}: CalendarTaskItemProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const priorityDot = PRIORITY_DOT_COLORS[task.priority] || "bg-blue-500";
  const statusBorder = STATUS_BORDER_COLORS[task.status] || "border-l-slate-400";
  const isDone = task.status === "done";

  // Enterprise permission check
  const isPrivileged = userRole === "owner" || userRole === "admin";
  const isCreator = currentUserId ? task.created_by === currentUserId : false;
  const isAssignee = currentUserId
    ? task.assignees?.some((a) => a.id === currentUserId) || task.assignee?.id === currentUserId
    : false;
  const canDrag = userRole !== "viewer" && (isPrivileged || isCreator || isAssignee);

  const triggerContent = (
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
        "group/item flex items-center gap-1.5 w-full text-left px-1.5 py-1 rounded text-[11px] font-medium leading-tight select-none",
        "bg-background/80 hover:bg-accent border border-border/60 border-l-2 shadow-2xs transition-all",
        statusBorder,
        canDrag ? "cursor-grab active:cursor-grabbing hover:scale-[1.01]" : "cursor-pointer",
        isDragging && "opacity-40 ring-1 ring-primary"
      )}
      title={`${task.title} (${task.priority} priority - ${task.status})${canDrag ? " • Drag to reschedule" : ""}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot)} />
      <span
        className={cn(
          "truncate flex-1 text-foreground inline-flex items-center gap-1",
          isDone && "line-through text-muted-foreground"
        )}
      >
        <span className="truncate">{task.title}</span>
        {task.is_private && <Lock className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
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
      trigger={triggerContent}
    />
  );
}
