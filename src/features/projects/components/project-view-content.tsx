"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProjectViewSwitcher } from "./project-view-switcher";
import { ProjectViewPlaceholder } from "./project-view-placeholder";
import { TaskList } from "@/features/tasks/components/task-list";
import { KanbanBoard } from "@/features/tasks/components/kanban/kanban-board";
import { TaskTable } from "@/features/tasks/components/table/task-table";
import { TaskCalendar } from "@/features/tasks/components/calendar/task-calendar";
import { TaskTimeline } from "@/features/tasks/components/timeline/task-timeline";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { ShieldAlert } from "lucide-react";
import type { ProjectView } from "../types/views";
import { isProjectView, DEFAULT_PROJECT_VIEW } from "../types/views";
import type { TaskWithDetails, WorkspaceAssignee } from "@/features/tasks/types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface ProjectViewContentProps {
  initialView?: ProjectView;
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

export function ProjectViewContent({
  initialView = DEFAULT_PROJECT_VIEW,
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: ProjectViewContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      {/* View Switcher & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <ProjectViewSwitcher currentView={currentView} onViewChange={handleViewChange} />
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
          />
        )}

        {currentView !== "list" &&
          currentView !== "kanban" &&
          currentView !== "table" &&
          currentView !== "calendar" &&
          currentView !== "timeline" && <ProjectViewPlaceholder view={currentView} />}
      </div>
    </div>
  );
}
