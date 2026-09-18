"use client";

import { useState, useMemo } from "react";
import type { RawAnalyticsData, DateRangePreset } from "../types";
import {
  computeKpis,
  computeStatusDistribution,
  computePriorityDistribution,
  computeDueDatePerformance,
  computeAssigneeWorkload,
  computeCompletionTrend,
  computeProjectSummaries,
} from "../lib/analytics-calculations";
import { AnalyticsHeader } from "./analytics-header";
import { AnalyticsKpiGrid } from "./analytics-kpi-grid";
import { TaskStatusChart } from "./charts/task-status-chart";
import { PriorityChart } from "./charts/priority-chart";
import { CompletionTrendChart } from "./charts/completion-trend-chart";
import { WorkloadChart } from "./charts/workload-chart";
import { DueDateSummary } from "./due-date-summary";
import { ProjectSummary } from "./project-summary";
import { AnalyticsEmpty } from "./analytics-empty";

interface AnalyticsDashboardProps {
  data: RawAnalyticsData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>("30d");

  const { workspace, projects, tasks, members, activities } = data;

  // Filter tasks by project
  const scopedTasks = useMemo(() => {
    if (selectedProjectId === "all") {
      return tasks;
    }
    return tasks.filter((t) => t.project_id === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Filter projects by selection
  const scopedProjects = useMemo(() => {
    if (selectedProjectId === "all") {
      return projects;
    }
    return projects.filter((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Filter activities by project
  const scopedActivities = useMemo(() => {
    if (selectedProjectId === "all") {
      return activities;
    }
    return activities.filter((a) => a.project_id === selectedProjectId);
  }, [activities, selectedProjectId]);

  // Pure memoized calculations
  const kpis = useMemo(
    () => computeKpis(scopedTasks, scopedProjects),
    [scopedTasks, scopedProjects]
  );

  const statusDistribution = useMemo(() => computeStatusDistribution(scopedTasks), [scopedTasks]);

  const priorityDistribution = useMemo(
    () => computePriorityDistribution(scopedTasks),
    [scopedTasks]
  );

  const dueDatePerformance = useMemo(() => computeDueDatePerformance(scopedTasks), [scopedTasks]);

  const assigneeWorkload = useMemo(
    () => computeAssigneeWorkload(scopedTasks, members),
    [scopedTasks, members]
  );

  const { points: completionTrend, hasHistory } = useMemo(
    () => computeCompletionTrend(scopedActivities, selectedDateRange),
    [scopedActivities, selectedDateRange]
  );

  const projectSummaries = useMemo(
    () => computeProjectSummaries(scopedProjects, scopedTasks),
    [scopedProjects, scopedTasks]
  );

  return (
    <div className="space-y-6">
      {/* Header with Project and Date Range Controls */}
      <AnalyticsHeader
        workspaceName={workspace.name}
        workspaceSlug={workspace.slug}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={setSelectedDateRange}
      />

      {/* Zero projects empty state */}
      {projects.length === 0 ? (
        <AnalyticsEmpty type="no-projects" />
      ) : (
        <>
          {/* Top KPI Metrics Row */}
          <AnalyticsKpiGrid kpis={kpis} />

          {/* If there are no tasks in the selected scope */}
          {scopedTasks.length === 0 ? (
            <AnalyticsEmpty type="no-tasks" />
          ) : (
            <>
              {/* Distributions Row (Status Donut & Priority Stack) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TaskStatusChart distribution={statusDistribution} />
                <PriorityChart distribution={priorityDistribution} />
              </div>

              {/* Trend and Workload Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CompletionTrendChart
                  points={completionTrend}
                  hasHistory={hasHistory}
                  dateRange={selectedDateRange}
                />
                <WorkloadChart workload={assigneeWorkload} />
              </div>

              {/* Due Date Performance */}
              <DueDateSummary performance={dueDatePerformance} />

              {/* Project Summaries */}
              <ProjectSummary summaries={projectSummaries} />
            </>
          )}
        </>
      )}
    </div>
  );
}
