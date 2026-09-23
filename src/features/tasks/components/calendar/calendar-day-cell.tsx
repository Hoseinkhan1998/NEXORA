"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarTaskItem } from "./calendar-task-item";
import { updateTaskDueDateAction } from "../../actions/update-task-due-date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "../../lib/calendar";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface CalendarDayCellProps {
  day: CalendarDay;
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  currentUserId?: string;
  onUpdateDueDate?: (taskId: string, newDueDate: string | null) => Promise<void> | void;
}

export function CalendarDayCell({
  day,
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
  onUpdateDueDate,
}: CalendarDayCellProps) {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = React.useState(false);

  const isCurrentMonth = day.isCurrentMonth;
  const isToday = day.isToday;
  const canDrop = userRole !== "viewer";

  const handleDragOver = (e: React.DragEvent) => {
    if (!canDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canDrop) return;

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (!data.taskId) return;

      if (data.currentDueDate === day.dateKey) {
        return;
      }

      if (onUpdateDueDate) {
        await onUpdateDueDate(data.taskId, day.dateKey);
      } else {
        const res = await updateTaskDueDateAction(
          data.taskId,
          workspaceId,
          projectId,
          workspaceSlug,
          day.dateKey
        );

        if (res.success) {
          toast.success(`Rescheduled "${data.taskTitle || "Task"}" to ${day.dateKey}`);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to reschedule task.");
        }
      }
    } catch (err) {
      console.error("[CalendarDayCell] Drop error:", err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col min-h-[105px] sm:min-h-[125px] p-1.5 border-b border-r border-border/60 transition-colors",
        isCurrentMonth ? "bg-card" : "bg-muted/25 text-muted-foreground/50",
        isToday && "bg-primary/5",
        isDragOver && "ring-2 ring-primary ring-inset bg-primary/10 shadow-xs"
      )}
    >
      {/* Day header: Day number */}
      <div className="flex items-center justify-between mb-1 px-1 pointer-events-none">
        <span
          className={cn(
            "inline-flex items-center justify-center text-xs font-medium rounded-full h-5 w-5",
            isToday
              ? "bg-primary text-primary-foreground font-bold shadow-xs"
              : isCurrentMonth
                ? "text-foreground"
                : "text-muted-foreground/50"
          )}
        >
          {day.dayNumber}
        </span>

        {tasks.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground/70">{tasks.length}</span>
        )}
      </div>

      {/* Task event chips stream */}
      <div className="flex-1 space-y-1 overflow-y-auto max-h-[100px] scrollbar-thin">
        {tasks.map((task) => (
          <CalendarTaskItem
            key={task.id}
            task={task}
            workspaceId={workspaceId}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            assignees={assignees}
            userRole={userRole}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
