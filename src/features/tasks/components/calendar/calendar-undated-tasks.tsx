"use client";

import * as React from "react";
import { EditTaskDialog } from "../edit-task-dialog";
import { TaskPriorityBadge } from "../task-priority-badge";
import { ChevronDown, ChevronUp, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface CalendarUndatedTasksProps {
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

export function CalendarUndatedTasks({
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: CalendarUndatedTasksProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const canEdit = userRole !== "viewer";

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 text-xs overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2.5 text-left font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CalendarOff className="h-4 w-4 text-muted-foreground/70" />
          <span>
            <strong className="text-foreground">{tasks.length}</strong> tasks have no due date
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>{isOpen ? "Hide" : "Show"}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* Expandable chips stream */}
      {isOpen && (
        <div className="p-3 border-t border-border/50 bg-background/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {tasks.map((task) => {
            const trigger = (
              <div
                className={cn(
                  "flex items-center justify-between gap-2 p-2 rounded-md border border-border/60 bg-card hover:bg-accent transition-all text-xs",
                  canEdit ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span className="truncate font-medium text-foreground">{task.title}</span>
                <div className="shrink-0">
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              </div>
            );

            if (!canEdit) {
              return <div key={task.id}>{trigger}</div>;
            }

            return (
              <EditTaskDialog
                key={task.id}
                task={task}
                workspaceId={workspaceId}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                assignees={assignees}
                userRole={userRole}
                trigger={trigger}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
