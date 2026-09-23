"use client";

import * as React from "react";
import { TaskPriorityBadge } from "../task-priority-badge";
import { EditTaskDialog } from "../edit-task-dialog";
import { AssigneeAvatarStack } from "../assignee-avatar-stack";
import { Calendar, AlertCircle, GripVertical, Lock } from "lucide-react";
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
  currentUserId?: string;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  style?: React.CSSProperties;
  className?: string;
}

export const KanbanCardInternal = React.forwardRef<HTMLDivElement, KanbanCardProps>(
  function KanbanCard(
    {
      task,
      workspaceId,
      projectId,
      workspaceSlug,
      assignees,
      userRole,
      currentUserId,
      isDragging,
      isOverlay,
      dragHandleProps,
      style,
      className,
    },
    ref
  ) {
    const [detailOpen, setDetailOpen] = React.useState(false);
    const canEdit = userRole !== "viewer";

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

    const handleCardClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) {
        return;
      }
      setDetailOpen(true);
    };

    return (
      <div
        ref={ref}
        style={style}
        onClick={handleCardClick}
        className={cn(
          "group relative flex flex-col justify-between gap-3 p-3.5 rounded-lg border bg-card text-card-foreground shadow-xs transition-all cursor-pointer",
          "border-border/70 hover:border-primary/40 hover:shadow-md",
          isDragging && "opacity-40 border-dashed border-primary/50 bg-primary/5 cursor-grabbing",
          isOverlay && "shadow-xl ring-2 ring-primary/30 rotate-1 cursor-grabbing z-50 bg-card",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
          className
        )}
      >
        <EditTaskDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          task={task}
          workspaceId={workspaceId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          assignees={assignees}
          userRole={userRole}
          currentUserId={currentUserId}
        />

        {/* Top row: Drag Handle + Priority Badge */}
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
            {task.is_private && (
              <span title="Confidential / Private Task" className="inline-flex items-center text-amber-500">
                <Lock className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>

        {/* Task Title & Description */}
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-medium tracking-tight text-foreground leading-snug break-words group-hover:text-primary transition-colors">
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

          {/* Assignee Avatar Stack */}
          <AssigneeAvatarStack
            assignees={task.assignees}
            fallbackAssignee={task.assignee}
            size="xs"
            maxDisplay={3}
            showName={false}
          />
        </div>
      </div>
    );
  }
);

export const KanbanCard = React.memo(KanbanCardInternal);
