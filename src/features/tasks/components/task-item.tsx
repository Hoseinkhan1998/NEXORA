"use client";

import * as React from "react";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskDetailDialog } from "./task-detail-dialog";
import { AssigneeAvatarStack } from "./assignee-avatar-stack";
import { Calendar, Lock } from "lucide-react";
import type { TaskWithDetails, WorkspaceAssignee } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskItemProps {
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  currentUserId?: string;
}

export function TaskItem({
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
}: TaskItemProps) {
  const [open, setOpen] = React.useState(false);

  const formattedDueDate = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <>
      <TaskDetailDialog
        open={open}
        onOpenChange={setOpen}
        task={task}
        workspaceId={workspaceId}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
        assignees={assignees}
        userRole={userRole}
        currentUserId={currentUserId}
      />
      <div
        onClick={() => setOpen(true)}
        className="group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-border/70 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
      >
        {/* Left section: status badge (fixed width) + title + description */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-[105px] shrink-0 flex items-center justify-center">
            <TaskStatusBadge status={task.status} fixedWidth />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground tracking-tight leading-snug truncate group-hover:text-primary transition-colors inline-flex items-center gap-1.5">
              <span>{task.title}</span>
              {task.is_private && (
                <span title="Confidential / Private Task" className="inline-flex items-center text-amber-500">
                  <Lock className="h-3 w-3 shrink-0" />
                </span>
              )}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
            )}
          </div>
        </div>

        {/* Right section: priority + due date + assignees with clean columnar alignment */}
        <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground self-end md:self-center">
          {/* Priority Badge column */}
          <div className="w-[74px] shrink-0 flex items-center justify-center">
            <TaskPriorityBadge priority={task.priority} className="w-full justify-center text-center" />
          </div>

          {/* Due Date column */}
          <div className="w-[100px] shrink-0 flex items-center justify-start">
            {formattedDueDate ? (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                <Calendar className="h-3 w-3 opacity-70 shrink-0" />
                <span className="truncate">{formattedDueDate}</span>
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/40 italic pl-1">No due date</span>
            )}
          </div>

          {/* Assignees column */}
          <div className="w-[140px] shrink-0 flex items-center justify-end">
            <AssigneeAvatarStack
              assignees={task.assignees}
              fallbackAssignee={task.assignee}
              size="xs"
              maxDisplay={3}
              showName={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}
