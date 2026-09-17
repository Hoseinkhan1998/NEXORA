"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { MONTH_NAMES } from "../../lib/calendar";
import { hasActiveFilters, type TaskTableFilters } from "../../lib/table-filter";
import type { WorkspaceAssignee, TaskStatus, TaskPriority } from "../../types";

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  filters: TaskTableFilters;
  onFilterChange: (filters: TaskTableFilters) => void;
  onResetFilters: () => void;
  assignees: WorkspaceAssignee[];
}

export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  filters,
  onFilterChange,
  onResetFilters,
  assignees,
}: CalendarHeaderProps) {
  const monthName = MONTH_NAMES[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  const isFiltered = hasActiveFilters(filters);

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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
      {/* Month Navigation Controls */}
      <div className="flex items-center gap-2">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground min-w-[160px]">
          {monthName} {year}
        </h2>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToday}
            className="h-8 px-2.5 text-xs font-medium"
          >
            Today
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onPrevMonth}
            aria-label="Previous month"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNextMonth}
            aria-label="Next month"
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lightweight Calendar Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <div className="w-32">
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
        <div className="w-32">
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
        <div className="w-36">
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

        {/* Reset Filter Button */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            <span>Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
