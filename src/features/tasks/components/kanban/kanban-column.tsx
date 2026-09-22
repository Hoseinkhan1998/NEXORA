"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { SortableKanbanCard } from "./sortable-kanban-card";
import { cn } from "@/lib/utils";
import type { TaskWithDetails, TaskStatus, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  currentUserId?: string;
}

const STATUS_CONFIGS: Record<
  TaskStatus,
  {
    dotColor: string;
    emptyText: string;
  }
> = {
  todo: {
    dotColor: "bg-slate-500 dark:bg-slate-400",
    emptyText: "No tasks to do",
  },
  in_progress: {
    dotColor: "bg-blue-500 dark:bg-blue-400",
    emptyText: "No tasks in progress",
  },
  done: {
    dotColor: "bg-emerald-500 dark:bg-emerald-400",
    emptyText: "No completed tasks",
  },
};

export function KanbanColumn({
  status,
  title,
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
}: KanbanColumnProps) {
  const config = STATUS_CONFIGS[status];
  const isViewer = userRole === "viewer";

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "Column",
      status,
    },
    disabled: isViewer,
  });

  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 min-w-[280px] sm:min-w-[320px] rounded-xl bg-muted/30 border border-border/60 p-3.5 space-y-3 transition-colors",
        isOver && !isViewer && "ring-2 ring-primary/40 bg-muted/50 border-primary/30"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", config.dotColor)} />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        </div>
        <Badge variant="secondary" className="text-[11px] font-mono font-medium px-2 py-0 h-5">
          {tasks.length}
        </Badge>
      </div>

      {/* Column Cards Stream */}
      <div className="flex-1 space-y-2.5 min-h-[160px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[140px] rounded-lg border border-dashed border-border/60 bg-background/30 p-4 text-center">
              <p className="text-xs text-muted-foreground italic">{config.emptyText}</p>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableKanbanCard
                key={task.id}
                task={task}
                workspaceId={workspaceId}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                assignees={assignees}
                userRole={userRole}
                currentUserId={currentUserId}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
