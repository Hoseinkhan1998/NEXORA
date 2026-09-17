"use client";

import * as React from "react";
import { CalendarHeader } from "./calendar-header";
import { CalendarDayCell } from "./calendar-day-cell";
import { CalendarUndatedTasks } from "./calendar-undated-tasks";
import { WEEKDAYS, getMonthCalendarGrid, groupTasksByDate } from "../../lib/calendar";
import {
  filterTasks,
  hasActiveFilters,
  DEFAULT_TASK_FILTERS,
  type TaskTableFilters,
} from "../../lib/table-filter";
import { CreateTaskDialog } from "../create-task-dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, FilterX } from "lucide-react";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskCalendarProps {
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

export function TaskCalendar({
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());
  const [filters, setFilters] = React.useState<TaskTableFilters>(DEFAULT_TASK_FILTERS);

  const canCreate = userRole !== "viewer";
  const isFiltered = hasActiveFilters(filters);

  // 1. Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_TASK_FILTERS);
  };

  // 2. Filter tasks based on active filter controls
  const filteredTasks = React.useMemo(() => {
    return filterTasks(tasks, filters);
  }, [tasks, filters]);

  // 3. Partition tasks into dated map and undated array
  const { datedTasks, undatedTasks } = React.useMemo(() => {
    return groupTasksByDate(filteredTasks);
  }, [filteredTasks]);

  // 4. Generate the 7-column calendar day cells
  const calendarGrid = React.useMemo(() => {
    return getMonthCalendarGrid(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  // If no tasks exist in the project at all
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 ring-8 ring-primary/5">
          <CalendarDays className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">No tasks in this project yet</h4>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          Add tasks with due dates to schedule deliverables and visualize them on the project
          calendar.
        </p>
        {canCreate && (
          <CreateTaskDialog
            workspaceId={workspaceId}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            assignees={assignees}
          />
        )}
      </div>
    );
  }

  // If filters are active and match 0 tasks
  if (isFiltered && filteredTasks.length === 0) {
    return (
      <div className="space-y-4">
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          assignees={assignees}
        />
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground mb-3 ring-8 ring-muted/20">
            <FilterX className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">
            No tasks match your filters
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Try adjusting your status, priority, or assignee filter to view scheduled tasks.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs h-8">
            Reset filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header with Navigation and Filters */}
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        assignees={assignees}
      />

      {/* Main 7-Column Calendar Grid Wrapper */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-w-full">
          <div className="min-w-[700px]">
            {/* Weekday Labels Header */}
            <div className="grid grid-cols-7 border-b border-border/70 bg-muted/40 text-center font-medium text-xs text-muted-foreground">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="py-2 px-1 border-r border-border/60 last:border-r-0">
                  <span className="hidden sm:inline">{weekday}</span>
                  <span className="sm:hidden">{weekday.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 border-l border-t border-border/60">
              {calendarGrid.map((day) => {
                const dayTasks = datedTasks.get(day.dateKey) || [];
                return (
                  <CalendarDayCell
                    key={day.dateKey + day.dayNumber + (day.isCurrentMonth ? "curr" : "other")}
                    day={day}
                    tasks={dayTasks}
                    workspaceId={workspaceId}
                    projectId={projectId}
                    workspaceSlug={workspaceSlug}
                    assignees={assignees}
                    userRole={userRole}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Visually Secondary: Tasks with No Due Date */}
      <CalendarUndatedTasks
        tasks={undatedTasks}
        workspaceId={workspaceId}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
        assignees={assignees}
        userRole={userRole}
      />
    </div>
  );
}
