"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProjectViewSwitcher } from "./project-view-switcher";
import { ProjectViewPlaceholder } from "./project-view-placeholder";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { useProjectRealtime, RealtimeStatusBadge } from "@/features/collaboration";
import { ShieldAlert, Smartphone } from "lucide-react";
import type { ProjectView } from "../types/views";
import { isProjectView, DEFAULT_PROJECT_VIEW } from "../types/views";
import type { TaskWithDetails, WorkspaceAssignee } from "@/features/tasks/types";
import type { WorkspaceRole } from "@/features/workspaces/types";

function ViewSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse pt-2">
      <div className="h-10 bg-muted/40 rounded-lg w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-64 bg-muted/30 rounded-lg" />
        <div className="h-64 bg-muted/30 rounded-lg" />
        <div className="h-64 bg-muted/30 rounded-lg" />
      </div>
    </div>
  );
}

const TaskList = dynamic(
  () => import("@/features/tasks/components/task-list").then((mod) => mod.TaskList),
  { loading: () => <ViewSkeleton /> }
);

const KanbanBoard = dynamic(
  () => import("@/features/tasks/components/kanban/kanban-board").then((mod) => mod.KanbanBoard),
  { loading: () => <ViewSkeleton /> }
);

const TaskTable = dynamic(
  () => import("@/features/tasks/components/table/task-table").then((mod) => mod.TaskTable),
  { loading: () => <ViewSkeleton /> }
);

const TaskCalendar = dynamic(
  () =>
    import("@/features/tasks/components/calendar/task-calendar").then((mod) => mod.TaskCalendar),
  { loading: () => <ViewSkeleton /> }
);

const TaskTimeline = dynamic(
  () =>
    import("@/features/tasks/components/timeline/task-timeline").then((mod) => mod.TaskTimeline),
  { loading: () => <ViewSkeleton /> }
);

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Project-scoped live real-time task synchronization
  const { tasks, connectionStatus } = useProjectRealtime({
    projectId,
    initialTasks,
    assignees,
  });

  // URL query param ?view=... is the source of truth, falling back safely to initialView or "list"
  const rawView = searchParams.get("view");
  const currentView: ProjectView = React.useMemo(() => {
    if (rawView && isProjectView(rawView)) {
      return rawView;
    }
    return initialView || DEFAULT_PROJECT_VIEW;
  }, [rawView, initialView]);

  const handleViewChange = React.useCallback(
    (newView: ProjectView) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", newView);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
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
