"use client";

import * as React from "react";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { EditTaskDialog } from "./edit-task-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";
import type { TaskWithDetails, WorkspaceAssignee } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskItemProps {
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

export function TaskItem({
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: TaskItemProps) {
  const canEdit = userRole !== "viewer";

  const assigneeName = task.assignee?.full_name || task.assignee?.email?.split("@")[0] || null;

  const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : "?";

  const formattedDueDate = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/70 bg-card hover:bg-accent/40 hover:border-border transition-all">
      {/* Left section: status + title + description */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="pt-0.5 shrink-0">
          <TaskStatusBadge status={task.status} />
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground tracking-tight leading-snug break-words">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
          )}
        </div>
      </div>

      {/* Right section: priority + assignee + due date + edit trigger */}
      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center text-xs text-muted-foreground">
        {/* Priority Badge */}
        <TaskPriorityBadge priority={task.priority} />

        {/* Due Date */}
        {formattedDueDate ? (
          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
            <Calendar className="h-3 w-3 opacity-70" />
            <span>{formattedDueDate}</span>
          </div>
        ) : null}

        {/* Assignee */}
        <div
          className="flex items-center gap-1.5 min-w-[90px]"
          title={assigneeName || "Unassigned"}
        >
          {assigneeName ? (
            <div className="flex items-center gap-1.5 truncate">
              <Avatar className="h-5 w-5 text-[10px]">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {assigneeInitial}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px] text-[11px] font-medium text-foreground">
                {assigneeName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 italic">
              <User className="h-3 w-3 opacity-50" />
              <span>Unassigned</span>
            </div>
          )}
        </div>

        {/* Edit Task Action */}
        {canEdit && (
          <div className="opacity-80 group-hover:opacity-100 transition-opacity">
            <EditTaskDialog
              task={task}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
            />
          </div>
        )}
      </div>
    </div>
  );
}
