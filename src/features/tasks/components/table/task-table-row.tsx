"use client";

import * as React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { TaskStatusBadge } from "../task-status-badge";
import { TaskPriorityBadge } from "../task-priority-badge";
import { EditTaskDialog } from "../edit-task-dialog";
import { AssigneeAvatarStack } from "../assignee-avatar-stack";
import { Calendar, AlertCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskTableRowProps {
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

function TaskTableRowInternal({
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: TaskTableRowProps) {
  const canEdit = userRole !== "viewer";

  // Check if task is overdue
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
        year: "numeric",
      })
    : null;

  return (
    <TableRow className="group hover:bg-muted/40 transition-colors">
      {/* 1. Task Title & Description */}
      <TableCell className="min-w-[240px] max-w-[400px]">
        <div className="space-y-0.5">
          {canEdit ? (
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
                  className="text-left font-medium text-foreground hover:text-primary transition-colors line-clamp-1 cursor-pointer focus-visible:outline-none focus-visible:underline"
                >
                  {task.title}
                </button>
              }
            />
          ) : (
            <span className="font-medium text-foreground line-clamp-1">{task.title}</span>
          )}

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 leading-snug">
              {task.description}
            </p>
          )}
        </div>
      </TableCell>

      {/* 2. Status */}
      <TableCell className="whitespace-nowrap">
        <TaskStatusBadge status={task.status} />
      </TableCell>

      {/* 3. Priority */}
      <TableCell className="whitespace-nowrap">
        <TaskPriorityBadge priority={task.priority} />
      </TableCell>

      {/* 4. Assignee */}
      <TableCell className="whitespace-nowrap">
        <AssigneeAvatarStack
          assignees={task.assignees}
          fallbackAssignee={task.assignee}
          size="sm"
          maxDisplay={3}
          showName={true}
        />
      </TableCell>

      {/* 5. Due Date */}
      <TableCell className="whitespace-nowrap font-mono text-xs">
        {formattedDueDate ? (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md",
              isOverdue
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20"
                : "text-muted-foreground"
            )}
            title={isOverdue ? "Overdue task" : `Due ${formattedDueDate}`}
          >
            {isOverdue ? (
              <AlertCircle className="h-3 w-3 text-rose-500" />
            ) : (
              <Calendar className="h-3 w-3 opacity-60" />
            )}
            <span>{formattedDueDate}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/40 italic font-sans">—</span>
        )}
      </TableCell>

      {/* 6. Actions */}
      <TableCell className="text-right whitespace-nowrap w-[70px]">
        {canEdit ? (
          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
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
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
            />
          </div>
        ) : (
          <span className="text-muted-foreground/40 text-xs">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export const TaskTableRow = React.memo(TaskTableRowInternal);
