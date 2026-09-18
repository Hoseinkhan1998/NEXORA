"use client";

import * as React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskTableToolbar } from "./task-table-toolbar";
import { TaskTableRow } from "./task-table-row";
import { TaskTableEmpty } from "./task-table-empty";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortTasks, type SortField, type SortConfig } from "../../lib/table-sort";
import {
  filterTasks,
  hasActiveFilters,
  DEFAULT_TASK_FILTERS,
  type TaskTableFilters,
} from "../../lib/table-filter";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskTableProps {
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

interface ColumnHeaderProps {
  field: SortField;
  label: string;
  sortConfig: SortConfig | null;
  onSort: (field: SortField) => void;
  className?: string;
}

function ColumnHeader({ field, label, sortConfig, onSort, className }: ColumnHeaderProps) {
  const isSorted = sortConfig?.field === field;
  const direction = isSorted ? sortConfig.direction : null;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1.5 hover:text-foreground font-medium transition-colors text-xs select-none",
          isSorted && "text-foreground font-semibold"
        )}
      >
        <span>{label}</span>
        {direction === "asc" && <ArrowUp className="h-3.5 w-3.5 text-primary" />}
        {direction === "desc" && <ArrowDown className="h-3.5 w-3.5 text-primary" />}
        {!direction && <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />}
      </button>
    </TableHead>
  );
}

export function TaskTable({
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: TaskTableProps) {
  const [filters, setFilters] = React.useState<TaskTableFilters>(DEFAULT_TASK_FILTERS);
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>(null);

  const canCreate = userRole !== "viewer";
  const isFiltered = hasActiveFilters(filters);

  const handleSort = React.useCallback((field: SortField) => {
    setSortConfig((prev) => {
      if (prev?.field === field) {
        if (prev.direction === "asc") {
          return { field, direction: "desc" };
        }
        // Toggle off back to default order
        return null;
      }
      return { field, direction: "asc" };
    });
  }, []);

  const handleResetFilters = React.useCallback(() => {
    setFilters(DEFAULT_TASK_FILTERS);
  }, []);

  // 1. Filter tasks
  const filteredTasks = React.useMemo(() => {
    return filterTasks(tasks, filters);
  }, [tasks, filters]);

  // 2. Sort filtered tasks
  const processedTasks = React.useMemo(() => {
    return sortTasks(filteredTasks, sortConfig);
  }, [filteredTasks, sortConfig]);

  return (
    <div className="space-y-3.5">
      {/* Table Filters Toolbar */}
      <TaskTableToolbar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        assignees={assignees}
        totalTasksCount={tasks.length}
        filteredTasksCount={filteredTasks.length}
      />

      {/* Responsive Table Container */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        {processedTasks.length === 0 ? (
          <TaskTableEmpty
            isFiltered={isFiltered}
            onClearFilters={handleResetFilters}
            canCreate={canCreate}
            workspaceId={workspaceId}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            assignees={assignees}
          />
        ) : (
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/70">
              <TableRow className="hover:bg-transparent">
                <ColumnHeader
                  field="title"
                  label="Task"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="min-w-[240px]"
                />
                <ColumnHeader
                  field="status"
                  label="Status"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-[140px]"
                />
                <ColumnHeader
                  field="priority"
                  label="Priority"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-[120px]"
                />
                <ColumnHeader
                  field="assignee"
                  label="Assignee"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-[160px]"
                />
                <ColumnHeader
                  field="due_date"
                  label="Due Date"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-[140px]"
                />
                <TableHead className="w-[70px] text-right font-medium text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedTasks.map((task) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  workspaceId={workspaceId}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                  assignees={assignees}
                  userRole={userRole}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
