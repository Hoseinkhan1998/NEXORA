"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ProjectViewSwitcher } from "./project-view-switcher";
import { ProjectViewPlaceholder } from "./project-view-placeholder";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { useProjectRealtime, RealtimeStatusBadge } from "@/features/collaboration";
import { ShieldAlert, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { updateTaskDueDateAction } from "@/features/tasks/actions/update-task-due-date";
import type { ProjectView } from "../types/views";
import { isProjectView, DEFAULT_PROJECT_VIEW } from "../types/views";
import type { TaskWithDetails, WorkspaceAssignee } from "@/features/tasks/types";
import type { WorkspaceRole } from "@/features/workspaces/types";

import { TaskList } from "@/features/tasks/components/task-list";
import { KanbanBoard } from "@/features/tasks/components/kanban/kanban-board";
import { TaskTable } from "@/features/tasks/components/table/task-table";
import { TaskCalendar } from "@/features/tasks/components/calendar/task-calendar";
import { TaskTimeline } from "@/features/tasks/components/timeline/task-timeline";

interface ProjectViewContentProps {
  initialView?: ProjectView;
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  currentUserId?: string;
}

export function ProjectViewContent({
  initialView = DEFAULT_PROJECT_VIEW,
  tasks: initialTasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
}: ProjectViewContentProps) {
  const searchParams = useSearchParams();

  // Project-scoped live real-time task synchronization with optimistic protection
  const { tasks, connectionStatus, updateTaskOptimistic, rollbackOptimistic } = useProjectRealtime({
    projectId,
    initialTasks,
    assignees,
  });

  // Client-managed view state for instant (0ms) tab switching without server revalidation
  const [currentView, setCurrentView] = React.useState<ProjectView>(() => {
    const raw = searchParams.get("view");
    if (raw && isProjectView(raw)) return raw;
    return initialView || DEFAULT_PROJECT_VIEW;
  });

  const handleViewChange = React.useCallback(
    (newView: ProjectView) => {
      // 1. Instantaneous UI state update (0ms delay)
      setCurrentView(newView);

      // 2. Quiet URL synchronization without triggering a slow Next.js server component re-fetch
      try {
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("view", newView);
          window.history.replaceState(window.history.state, "", url.toString());
        }
      } catch {
        // Fallback for SSR/testing
      }
    },
    []
  );

  /**
   * Optimistic Task Due Date Update (0ms UI latency)
   * Immediately moves task in local React state, runs server action in background,
   * protects against server revalidation race conditions, and cleanly rolls back only if an error occurs.
   */
  const handleUpdateTaskDueDate = React.useCallback(
    async (taskId: string, newDueDate: string | null) => {
      if (userRole === "viewer") return;

      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const previousDueDate = targetTask.due_date;
      if (previousDueDate === newDueDate) return;

      // 1. Optimistic locked mutation on local state (0ms delay)
      updateTaskOptimistic(taskId, { due_date: newDueDate });

      // 2. Background server action execution
      try {
        const res = await updateTaskDueDateAction(
          taskId,
          workspaceId,
          projectId,
          workspaceSlug,
          newDueDate
        );

        if (!res.success) {
          // Revert back on error
          rollbackOptimistic(taskId, targetTask);
          toast.error(res.error || "Failed to reschedule task.");
        } else {
          toast.success(
            `Rescheduled "${targetTask.title}" to ${newDueDate || "None"}`
          );
        }
      } catch (err) {
        console.error("[handleUpdateTaskDueDate] Network error:", err);
        rollbackOptimistic(taskId, targetTask);
        toast.error("Network error while rescheduling task.");
      }
    },
    [tasks, userRole, workspaceId, projectId, workspaceSlug, updateTaskOptimistic, rollbackOptimistic]
  );

  const canCreate = userRole !== "viewer";
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Mobile-Optimized View: Touch-first List with Info Banner */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border/70 bg-muted/30 text-xs text-muted-foreground">
          <Smartphone className="h-4 w-4 text-primary shrink-0" />
          <span>
            Mobile view active. Detailed Kanban, Table, Calendar, and Timeline views are available on tablet & desktop screens.
          </span>
        </div>

        <TaskList
          tasks={tasks}
          workspaceId={workspaceId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          assignees={assignees}
          userRole={userRole}
          currentUserId={currentUserId}
        />
      </div>

      {/* Desktop View: Multi-View Toolbar & Full Views */}
      <div className="hidden md:block space-y-4">
        {/* View Switcher & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <ProjectViewSwitcher currentView={currentView} onViewChange={handleViewChange} />
            <RealtimeStatusBadge status={connectionStatus} />
          </div>

          {/* In non-list views, provide the Task creation trigger in the toolbar */}
          {currentView !== "list" && (
            <div className="flex items-center gap-2 shrink-0">
              {canCreate ? (
                <CreateTaskDialog
                  workspaceId={workspaceId}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                  assignees={assignees}
                />
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  <span>Viewer mode (Read-only)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active View Render Area */}
        <div id={`project-view-${currentView}`} role="tabpanel">
          {currentView === "list" && (
            <TaskList
              tasks={tasks}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
              currentUserId={currentUserId}
            />
          )}

          {currentView === "kanban" && (
            <div className="space-y-4">
              {/* Kanban Header Summary */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>{tasks.length} total tasks</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {doneCount} completed
                  </span>
                </div>
              </div>

              {/* Kanban Board */}
              <KanbanBoard
                tasks={tasks}
                workspaceId={workspaceId}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                assignees={assignees}
                userRole={userRole}
                currentUserId={currentUserId}
              />
            </div>
          )}

          {currentView === "table" && (
            <TaskTable
              tasks={tasks}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
              currentUserId={currentUserId}
            />
          )}

          {currentView === "calendar" && (
            <TaskCalendar
              tasks={tasks}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
              currentUserId={currentUserId}
              onUpdateDueDate={handleUpdateTaskDueDate}
            />
          )}

          {currentView === "timeline" && (
            <TaskTimeline
              tasks={tasks}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
              currentUserId={currentUserId}
              onUpdateDueDate={handleUpdateTaskDueDate}
            />
          )}

          {currentView !== "list" &&
            currentView !== "kanban" &&
            currentView !== "table" &&
            currentView !== "calendar" &&
            currentView !== "timeline" && <ProjectViewPlaceholder view={currentView} />}
        </div>
      </div>
    </div>
  );
}
