"use client";

import * as React from "react";
import { TimelineHeader } from "./timeline-header";
import { TimelineRow } from "./timeline-row";
import { TimelineUndatedTasks } from "./timeline-undated-tasks";
import { CreateTaskDialog } from "../create-task-dialog";
import { Button } from "@/components/ui/button";
import { GanttChartSquare, FilterX } from "lucide-react";
import {
  generateTimelineDateRange,
  shiftTimelineDate,
  partitionTimelineTasks,
  TIMELINE_COLUMN_WIDTH,
  TIMELINE_TASK_PANEL_WIDTH,
  type TimelineDate,
} from "../../lib/timeline";
import {
  filterTasks,
  hasActiveFilters,
  DEFAULT_TASK_FILTERS,
  type TaskTableFilters,
} from "../../lib/table-filter";
import type { TaskWithDetails, WorkspaceAssignee } from "../../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskTimelineProps {
  tasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
}

export function TaskTimeline({
  tasks,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
}: TaskTimelineProps) {
  const [anchorDate, setAnchorDate] = React.useState<Date>(() => new Date());
  const [filters, setFilters] = React.useState<TaskTableFilters>(DEFAULT_TASK_FILTERS);

  const canCreate = userRole !== "viewer";
  const isFiltered = hasActiveFilters(filters);

  // Generate continuous date range centered around anchor: 7 days prior, 28 days forward
  const dateRange = React.useMemo(() => generateTimelineDateRange(anchorDate, 7, 28), [anchorDate]);

  // Filter tasks based on status, priority, assignee
  const filteredTasks = React.useMemo(() => filterTasks(tasks, filters), [tasks, filters]);

  // Partition into dated and undated
  const { datedTasks, undatedTasks } = React.useMemo(
    () => partitionTimelineTasks(filteredTasks),
    [filteredTasks]
  );

  // Navigation handlers
  const handleShift = (days: number) => {
    setAnchorDate((prev) => shiftTimelineDate(prev, days));
  };

  const handleToday = () => {
    setAnchorDate(new Date());
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_TASK_FILTERS);
  };

  // Group continuous days into month segments for the top timeline header row
  const monthGroups = React.useMemo(() => {
    const groups: { label: string; count: number }[] = [];
    for (const day of dateRange) {
      const monthLabel = day.date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.label === monthLabel) {
        lastGroup.count += 1;
      } else {
        groups.push({ label: monthLabel, count: 1 });
      }
    }
    return groups;
  }, [dateRange]);

  const totalGridWidth = TIMELINE_TASK_PANEL_WIDTH + dateRange.length * TIMELINE_COLUMN_WIDTH;

  // Zero state: No tasks in the project at all
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 ring-8 ring-primary/5">
          <GanttChartSquare className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">No tasks in this project yet</h4>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          Add tasks with due dates to track project milestones and visualize them on the timeline.
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

  // Filter Zero state: Tasks exist but none match filters
  if (isFiltered && filteredTasks.length === 0) {
    return (
      <div className="space-y-4">
        <TimelineHeader
          dateRange={dateRange}
          onShift={handleShift}
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
            Try adjusting your status, priority, or assignee filter to view tasks on the timeline.
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
      {/* Timeline Controls & Filter Bar */}
      <TimelineHeader
        dateRange={dateRange}
        onShift={handleShift}
        onToday={handleToday}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        assignees={assignees}
      />

      {/* Main Timeline Card */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-w-full">
          <div style={{ minWidth: `${totalGridWidth}px` }} className="flex flex-col select-none">
            {/* Dual-Row Date Header */}
            <div className="sticky top-0 z-20 flex flex-col border-b border-border/70 bg-card">
              {/* Month Row */}
              <div className="flex border-b border-border/60 bg-muted/40">
                <div
                  style={{ width: `${TIMELINE_TASK_PANEL_WIDTH}px` }}
                  className="sticky left-0 z-30 shrink-0 border-r border-border/60 bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  Tasks ({datedTasks.length} scheduled)
                </div>
                <div className="flex flex-1">
                  {monthGroups.map((group, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${group.count * TIMELINE_COLUMN_WIDTH}px`,
                      }}
                      className="shrink-0 border-r border-border/60 px-3 py-1.5 text-xs font-semibold text-foreground/80 truncate"
                    >
                      {group.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Row */}
              <div className="flex bg-card">
                <div
                  style={{ width: `${TIMELINE_TASK_PANEL_WIDTH}px` }}
                  className="sticky left-0 z-30 shrink-0 border-r border-border/60 bg-card px-4 py-1.5 text-[11px] font-medium text-muted-foreground"
                >
                  Title / Status / Assignee
                </div>
                <div className="flex flex-1">
                  {dateRange.map((day: TimelineDate) => (
                    <div
                      key={day.dateKey}
                      style={{ width: `${TIMELINE_COLUMN_WIDTH}px` }}
                      className={`shrink-0 border-r border-border/60 py-1 text-center text-[10px] transition-colors ${
                        day.isToday
                          ? "bg-primary/10 font-bold text-primary"
                          : day.isWeekend
                            ? "bg-muted/30 text-muted-foreground"
                            : "text-foreground"
                      }`}
                    >
                      <div className="font-medium text-muted-foreground uppercase text-[9px]">
                        {day.weekdayLabel.charAt(0)}
                      </div>
                      <div
                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                          day.isToday ? "bg-primary font-semibold text-primary-foreground" : ""
                        }`}
                      >
                        {day.dayNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Task Rows Container */}
            <div className="divide-y divide-border/60">
              {datedTasks.length > 0 ? (
                datedTasks.map((task) => (
                  <TimelineRow
                    key={task.id}
                    task={task}
                    dateRange={dateRange}
                    workspaceId={workspaceId}
                    projectId={projectId}
                    workspaceSlug={workspaceSlug}
                    assignees={assignees}
                    userRole={userRole}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center py-10 text-center text-xs text-muted-foreground">
                  All tasks in this selection are undated. See the undated section below.
                </div>
              )}
            </div>

            {/* Undated Tasks Collapsible Section */}
            <TimelineUndatedTasks
              tasks={undatedTasks}
              workspaceId={workspaceId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              assignees={assignees}
              userRole={userRole}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
