"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, RotateCcw } from "lucide-react";
import { hasActiveFilters, type TaskTableFilters } from "../../lib/table-filter";
import type { WorkspaceAssignee, TaskStatus, TaskPriority } from "../../types";

interface TaskTableToolbarProps {
  filters: TaskTableFilters;
  onFilterChange: (filters: TaskTableFilters) => void;
  onResetFilters: () => void;
  assignees: WorkspaceAssignee[];
  totalTasksCount: number;
  filteredTasksCount: number;
}

export function TaskTableToolbar({
  filters,
  onFilterChange,
  onResetFilters,
  assignees,
  totalTasksCount,
  filteredTasksCount,
}: TaskTableToolbarProps) {
  const isFiltered = hasActiveFilters(filters);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchQuery: e.target.value,
    });
  };

  const handleClearSearch = () => {
    onFilterChange({
      ...filters,
      searchQuery: "",
    });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value as TaskStatus | "all",
    });
  };

  const handlePriorityChange = (value: string) => {
    onFilterChange({
      ...filters,
      priority: value as TaskPriority | "all",
    });
  };

  const handleAssigneeChange = (value: string) => {
    onFilterChange({
      ...filters,
      assigneeId: value,
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Search + Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative w-full sm:w-60 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="pl-8 pr-7 h-8 text-xs bg-background"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-2 h-4 w-4 rounded-sm text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="w-full sm:w-36">
            <Select value={filters.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div className="w-full sm:w-40">
            <Select value={filters.assigneeId} onValueChange={handleAssigneeChange}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {assignees.map((assignee) => {
                  const name = assignee.fullName || assignee.email.split("@")[0] || assignee.userId;
                  return (
                    <SelectItem key={assignee.userId} value={assignee.userId}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Right Side: Task Count Metric */}
        <div className="flex items-center text-xs font-mono text-muted-foreground shrink-0 self-end sm:self-center">
          {isFiltered ? (
            <span>
              Showing <strong className="text-foreground">{filteredTasksCount}</strong> of{" "}
              {totalTasksCount}
            </span>
          ) : (
            <span>
              <strong className="text-foreground">{totalTasksCount}</strong> total tasks
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
