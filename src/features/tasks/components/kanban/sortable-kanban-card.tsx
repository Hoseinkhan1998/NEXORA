"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard, type KanbanCardProps } from "./kanban-card";

interface SortableKanbanCardProps extends Omit<
  KanbanCardProps,
  "isDragging" | "dragHandleProps" | "style"
> {
  disabled?: boolean;
}

export function SortableKanbanCard({
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  disabled,
}: SortableKanbanCardProps) {
  const isViewer = userRole === "viewer";
  const isDisabled = disabled || isViewer;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
      status: task.status,
    },
    disabled: isDisabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <KanbanCard
      ref={setNodeRef}
      task={task}
      workspaceId={workspaceId}
      projectId={projectId}
      workspaceSlug={workspaceSlug}
      assignees={assignees}
      userRole={userRole}
      isDragging={isDragging}
      dragHandleProps={!isDisabled ? { ...attributes, ...listeners } : undefined}
      style={style}
    />
  );
}
