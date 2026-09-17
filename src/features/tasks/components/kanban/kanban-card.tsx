"use client";

import * as React from "react";
import { TaskPriorityBadge } from "../task-priority-badge";
import { EditTaskDialog } from "../edit-task-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, User, AlertCircle, MoreHorizontal, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

export interface KanbanCardProps {
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  style?: React.CSSProperties;
  className?: string;
}

export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(function KanbanCard(
  {
    task,
    workspaceId,
    projectId,
    workspaceSlug,
    assignees,
    userRole,
    isDragging,
    isOverlay,
    dragHandleProps,
    style,
    className,
  },
  ref
) {
  const canEdit = userRole !== "viewer";

  const assigneeName = task.assignee?.full_name || task.assignee?.email?.split("@")[0] || null;
  const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : "?";

  // Check if task is overdue (due_date in the past and not marked done)
  const isOverdue = React.useMemo(() => {
    if (!task.due_date || task.status === "done") return false;
    const due = new Date(task.due_date + "T23:59:59");
    const now = new Date();
    return due.getTime() < now.getTime();
  }, [task.due_date, task.status]);

  const formattedDueDate = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "group relative flex flex-col justify-between gap-3 p-3.5 rounded-lg border bg-card text-card-foreground shadow-xs transition-all",
        "border-border/70 hover:border-border",
        isDragging && "opacity-40 border-dashed border-primary/50 bg-primary/5",
        isOverlay && "shadow-xl ring-2 ring-primary/30 rotate-1 cursor-grabbing z-50 bg-card",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        className
      )}
    >
      {/* Top row: Drag Handle + Priority Badge + Quick Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Dedicated Drag Handle for non-viewers */}
          {canEdit && dragHandleProps && (
            <button
              type="button"
              {...dragHandleProps}
              aria-label={`Drag task ${task.title}`}
              className={cn(
                "flex h-6 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted/80 transition-colors",
                "cursor-grab active:cursor-grabbing touch-none focus-visible:ring-1 focus-visible:ring-ring"
              )}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <TaskPriorityBadge priority={task.priority} />
        </div>

        {canEdit && (
          <div className="opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
            <EditTaskDialog
              task={task}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
              trigger={
                <button
                  type="button"
                  aria-label={`Edit task ${task.title}`}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Task Title & Description */}
      <div className="space-y-1 min-w-0">
        <h4 className="text-sm font-medium tracking-tight text-foreground leading-snug break-words">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Bottom row: Due Date + Assignee */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs text-muted-foreground">
        {/* Due Date Indicator */}
        {formattedDueDate ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md",
              isOverdue
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20"
                : "bg-muted/50 text-muted-foreground"
            )}
            title={isOverdue ? "Overdue task" : `Due ${formattedDueDate}`}
          >
            {isOverdue ? (
              <AlertCircle className="h-3 w-3 text-rose-500" />
            ) : (
              <Calendar className="h-3 w-3 opacity-70" />
            )}
            <span>{formattedDueDate}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Assignee Avatar */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          title={assigneeName ? `Assigned to ${assigneeName}` : "Unassigned"}
        >
          {assigneeName ? (
            <Avatar className="h-5 w-5 text-[10px]">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {assigneeInitial}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/60">
              <User className="h-3 w-3 opacity-50" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
