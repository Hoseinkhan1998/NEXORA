"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, CheckSquare, ShieldAlert } from "lucide-react";
import { TaskItem } from "./task-item";
import { TaskEmptyState } from "./task-empty-state";
import { CreateTaskDialog } from "./create-task-dialog";
import type { TaskWithDetails, WorkspaceAssignee } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskListProps {
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  currentUserId?: string;
}

export function TaskList({
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("all");

  const canCreate = userRole !== "viewer";

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === "todo" && task.status !== "todo") return false;
      if (activeTab === "in_progress" && task.status !== "in_progress") return false;
      if (activeTab === "done" && task.status !== "done") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesAssignee =
          task.assignee?.full_name?.toLowerCase().includes(query) ||
          task.assignee?.email?.toLowerCase().includes(query) ||
          task.assignees?.some(
            (a) =>
              a.full_name?.toLowerCase().includes(query) || a.email?.toLowerCase().includes(query)
          );

        return matchesTitle || matchesDesc || matchesAssignee;
      }

      return true;
    });
  }, [tasks, activeTab, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <CheckSquare className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Tasks</h2>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <Badge variant="secondary" className="px-1.5 py-0 h-4">
              {tasks.length} total
            </Badge>
            {doneCount > 0 && (
              <Badge
                variant="outline"
                className="px-1.5 py-0 h-4 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                {doneCount} done
              </Badge>
            )}
          </div>
        </div>

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

      {/* Tabs and Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs h-7">
              All ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="todo" className="text-xs h-7">
              To Do ({todoCount})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs h-7">
              In Progress ({inProgressCount})
            </TabsTrigger>
            <TabsTrigger value="done" className="text-xs h-7">
              Done ({doneCount})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0 space-y-2">
          {filteredTasks.length === 0 ? (
            <TaskEmptyState
              title={
                searchQuery
                  ? "No matching tasks"
                  : activeTab === "done"
                    ? "No completed tasks yet"
                    : activeTab === "in_progress"
                      ? "No tasks in progress"
                      : "No tasks in this project"
              }
              description={
                searchQuery
                  ? `No tasks found matching "${searchQuery}".`
                  : activeTab === "done"
                    ? "Completed tasks will appear here as your team finishes deliverables."
                    : "Add tasks to break down deliverables and assign them to your team."
              }
              action={
                canCreate && !searchQuery && activeTab !== "done" ? (
                  <CreateTaskDialog
                    workspaceId={workspaceId}
                    projectId={projectId}
                    workspaceSlug={workspaceSlug}
                    assignees={assignees}
                  />
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              <div className="hidden md:flex items-center justify-between px-3.5 py-1 text-[11px] font-medium text-muted-foreground/60 select-none">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-[105px] text-center shrink-0">Status</span>
                  <span className="flex-1 pl-1">Task</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="w-[74px] text-center shrink-0">Priority</span>
                  <span className="w-[100px] text-left shrink-0">Due Date</span>
                  <span className="w-[140px] text-right shrink-0">Assignees</span>
                </div>
              </div>
              {filteredTasks.map((task) => (
                <TaskItem
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
