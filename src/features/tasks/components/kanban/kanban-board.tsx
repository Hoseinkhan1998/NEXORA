"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { calculateTaskPosition } from "../../lib/position";
import { moveTaskAction } from "../../actions/move-task";
import type { TaskWithDetails, TaskStatus, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface KanbanBoardProps {
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

const ALL_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"] as const;

function isStatus(id: string): id is TaskStatus {
  return (ALL_STATUSES as readonly string[]).includes(id);
}

function findColumn(
  columns: Record<TaskStatus, TaskWithDetails[]>,
  taskId: string
): TaskStatus | null {
  for (const status of ALL_STATUSES) {
    if (columns[status].some((t) => t.id === taskId)) {
      return status;
    }
  }
  return null;
}

export function KanbanBoard({
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: KanbanBoardProps) {
  const isViewer = userRole === "viewer";

  // Group and sort tasks by position for each column
  const buildColumnsState = React.useCallback((taskList: TaskWithDetails[]) => {
    return {
      todo: taskList.filter((t) => t.status === "todo").sort((a, b) => a.position - b.position),
      in_progress: taskList
        .filter((t) => t.status === "in_progress")
        .sort((a, b) => a.position - b.position),
      done: taskList.filter((t) => t.status === "done").sort((a, b) => a.position - b.position),
    };
  }, []);

  const [prevTasks, setPrevTasks] = React.useState(tasks);
  const [columns, setColumns] = React.useState<Record<TaskStatus, TaskWithDetails[]>>(() =>
    buildColumnsState(tasks)
  );

  // Sync state whenever tasks prop changes (e.g. from server revalidation)
  if (prevTasks !== tasks) {
    setPrevTasks(tasks);
    setColumns(buildColumnsState(tasks));
  }

  // Track currently dragged task & snapshot for rollback
  const [activeTask, setActiveTask] = React.useState<TaskWithDetails | null>(null);
  const dragSnapshotRef = React.useRef<Record<TaskStatus, TaskWithDetails[]> | null>(null);

  // DnD Sensors: 5px movement required to distinguish dragging from button/dialog clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (isViewer) return;
    const { active } = event;
    const activeId = String(active.id);

    const activeCol = findColumn(columns, activeId);
    if (activeCol) {
      const task = columns[activeCol].find((t) => t.id === activeId);
      if (task) {
        setActiveTask(task);
        dragSnapshotRef.current = columns;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (isViewer) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeColumn = findColumn(columns, activeId);
    const overColumn = isStatus(overId) ? overId : findColumn(columns, overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) {
      return;
    }

    setColumns((prev) => {
      const sourceList = prev[activeColumn];
      const targetList = prev[overColumn];

      const activeIndex = sourceList.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;

      const sourceItem = sourceList[activeIndex];
      if (!sourceItem) return prev;
      const activeItem: TaskWithDetails = { ...sourceItem, status: overColumn };

      let overIndex: number;
      if (isStatus(overId)) {
        overIndex = targetList.length;
      } else {
        overIndex = targetList.findIndex((t) => t.id === overId);
        if (overIndex === -1) overIndex = targetList.length;
      }

      return {
        ...prev,
        [activeColumn]: sourceList.filter((t) => t.id !== activeId),
        [overColumn]: [
          ...targetList.slice(0, overIndex),
          activeItem,
          ...targetList.slice(overIndex),
        ],
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (isViewer) return;
    const { active, over } = event;
    const activeId = String(active.id);
    const snapshot = dragSnapshotRef.current;
    dragSnapshotRef.current = null;

    if (!over) {
      if (snapshot) setColumns(snapshot);
      setActiveTask(null);
      return;
    }

    const overId = String(over.id);
    const activeColumn = findColumn(columns, activeId);
    const overColumn = isStatus(overId) ? overId : findColumn(columns, overId);

    if (!activeColumn || !overColumn) {
      if (snapshot) setColumns(snapshot);
      setActiveTask(null);
      return;
    }

    let finalItems = [...columns[overColumn]];
    const activeIndex = finalItems.findIndex((t) => t.id === activeId);

    let targetIndex = activeIndex;
    if (!isStatus(overId)) {
      targetIndex = finalItems.findIndex((t) => t.id === overId);
      if (targetIndex === -1) targetIndex = activeIndex;
    }

    if (activeColumn === overColumn && activeIndex !== targetIndex) {
      finalItems = arrayMove(finalItems, activeIndex, targetIndex);
    }

    // Compute new position using surrounding neighbors
    const movedIndex = finalItems.findIndex((t) => t.id === activeId);
    if (movedIndex === -1) {
      if (snapshot) setColumns(snapshot);
      setActiveTask(null);
      return;
    }

    const prevTask = movedIndex > 0 ? finalItems[movedIndex - 1] : null;
    const nextTask = movedIndex < finalItems.length - 1 ? finalItems[movedIndex + 1] : null;

    const prevPos = prevTask ? prevTask.position : null;
    const nextPos = nextTask ? nextTask.position : null;

    const newPosition = calculateTaskPosition(prevPos, nextPos);

    const currentMovedItem = finalItems[movedIndex];
    if (!currentMovedItem) {
      if (snapshot) setColumns(snapshot);
      setActiveTask(null);
      return;
    }

    // Update item with new position & target status
    const updatedTask: TaskWithDetails = {
      ...currentMovedItem,
      position: newPosition,
      status: overColumn,
    };
    finalItems[movedIndex] = updatedTask;

    const nextState = {
      ...columns,
      [overColumn]: finalItems,
    };
    setColumns(nextState);
    setActiveTask(null);

    // Check if task changed column or position
    const originalTask = snapshot
      ? Object.values(snapshot)
          .flat()
          .find((t) => t.id === activeId)
      : null;

    const hasChanged =
      !originalTask || originalTask.status !== overColumn || originalTask.position !== newPosition;

    if (!hasChanged) {
      return;
    }

    // Persist via server action with rollback on failure
    try {
      const result = await moveTaskAction(
        {
          taskId: activeId,
          workspaceId,
          projectId,
          status: overColumn,
          position: newPosition,
        },
        workspaceSlug
      );

      if (!result.success) {
        console.error("[KanbanBoard] moveTaskAction failed:", result.error);
        if (snapshot) setColumns(snapshot);
        toast.error(
          result.error || "Could not move the task. Your previous task order has been restored."
        );
      }
    } catch (err) {
      console.error("[KanbanBoard] unexpected error:", err);
      if (snapshot) setColumns(snapshot);
      toast.error("Could not move the task. Your previous task order has been restored.");
    }
  };

  const handleDragCancel = () => {
    if (dragSnapshotRef.current) {
      setColumns(dragSnapshotRef.current);
      dragSnapshotRef.current = null;
    }
    setActiveTask(null);
  };

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Horizontal scroll container on mobile/tablet, 3-column grid on desktop */}
        <div className="flex flex-row items-start gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory">
          <div className="flex-1 min-w-[280px] sm:min-w-[320px] snap-start">
            <KanbanColumn
              status="todo"
              title="To Do"
              tasks={columns.todo}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
            />
          </div>

          <div className="flex-1 min-w-[280px] sm:min-w-[320px] snap-start">
            <KanbanColumn
              status="in_progress"
              title="In Progress"
              tasks={columns.in_progress}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
            />
          </div>

          <div className="flex-1 min-w-[280px] sm:min-w-[320px] snap-start">
            <KanbanColumn
              status="done"
              title="Done"
              tasks={columns.done}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
            />
          </div>
        </div>

        {/* Floating card overlay while dragging */}
        <DragOverlay>
          {activeTask ? (
            <KanbanCard
              task={activeTask}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
