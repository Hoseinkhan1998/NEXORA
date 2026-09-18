import { describe, it, expect } from "vitest";
import {
  computeKpis,
  computeStatusDistribution,
  computePriorityDistribution,
  parseLocalDate,
} from "./analytics-calculations";
import type { AnalyticsTaskRecord } from "../types";
import type { Project } from "@/features/projects/types";

function mockTask(partial: Partial<AnalyticsTaskRecord>): AnalyticsTaskRecord {
  return {
    id: partial.id || "t-1",
    workspace_id: partial.workspace_id || "ws-1",
    project_id: partial.project_id || "p-1",
    title: partial.title || "Task Title",
    status: partial.status || "todo",
    priority: partial.priority || "medium",
    due_date: partial.due_date ?? null,
    assignee_id: partial.assignee_id ?? null,
    created_at: partial.created_at || "2026-09-01T00:00:00Z",
    updated_at: partial.updated_at || "2026-09-01T00:00:00Z",
  };
}

function mockProject(id: string, status: "active" | "archived" = "active"): Project {
  return {
    id,
    workspace_id: "ws-1",
    name: `Project ${id}`,
    slug: `project-${id}`,
    description: null,
    status,
    color: "#6366f1",
    created_by: "u-1",
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  };
}

describe("Analytics Calculations Engine", () => {
  const referenceDate = new Date("2026-09-18T12:00:00Z");

  describe("parseLocalDate", () => {
    it("parses pure YYYY-MM-DD into midnight local date without offset day shift", () => {
      const parsed = parseLocalDate("2026-09-18");
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(8); // September
      expect(parsed.getDate()).toBe(18);
    });
  });

  describe("computeKpis", () => {
    it("handles zero tasks gracefully without division-by-zero errors", () => {
      const kpis = computeKpis([], [mockProject("p1")], referenceDate);
      expect(kpis.totalTasks).toBe(0);
      expect(kpis.completedTasks).toBe(0);
      expect(kpis.incompleteTasks).toBe(0);
      expect(kpis.completionRate).toBe(0);
      expect(kpis.overdueTasks).toBe(0);
      expect(kpis.unassignedTasks).toBe(0);
      expect(kpis.totalProjects).toBe(1);
    });

    it("computes accurate completion percentage and unassigned counts", () => {
      const tasks: AnalyticsTaskRecord[] = [
        mockTask({ id: "1", status: "done", assignee_id: "u-1" }),
        mockTask({ id: "2", status: "in_progress", assignee_id: "u-1" }),
        mockTask({ id: "3", status: "todo", assignee_id: null }), // unassigned
        mockTask({ id: "4", status: "done", assignee_id: null }), // done and unassigned
      ];
      const projects = [mockProject("p1"), mockProject("p2", "archived")];

      const kpis = computeKpis(tasks, projects, referenceDate);

      expect(kpis.totalProjects).toBe(1); // Only active projects counted
      expect(kpis.totalTasks).toBe(4);
      expect(kpis.completedTasks).toBe(2);
      expect(kpis.incompleteTasks).toBe(2);
      expect(kpis.completionRate).toBe(50); // 2 of 4 = 50%
      expect(kpis.unassignedTasks).toBe(2);
    });

    it("correctly identifies overdue tasks relative to the reference date", () => {
      const tasks: AnalyticsTaskRecord[] = [
        mockTask({ id: "1", status: "todo", due_date: "2026-09-10" }), // overdue
        mockTask({ id: "2", status: "in_progress", due_date: "2026-09-25" }), // not overdue
        mockTask({ id: "3", status: "done", due_date: "2026-09-10" }), // past due date but completed -> not overdue
        mockTask({ id: "4", status: "todo", due_date: null }), // undated -> not overdue
      ];

      const kpis = computeKpis(tasks, [mockProject("p1")], referenceDate);
      expect(kpis.overdueTasks).toBe(1);
    });
  });

  describe("computeStatusDistribution", () => {
    it("computes exact breakdown and percentages across statuses", () => {
      const tasks: AnalyticsTaskRecord[] = [
        mockTask({ status: "todo" }),
        mockTask({ status: "todo" }),
        mockTask({ status: "in_progress" }),
        mockTask({ status: "done" }),
      ];

      const dist = computeStatusDistribution(tasks);
      expect(dist.total).toBe(4);
      expect(dist.todo.count).toBe(2);
      expect(dist.todo.percentage).toBe(50);
      expect(dist.inProgress.count).toBe(1);
      expect(dist.inProgress.percentage).toBe(25);
      expect(dist.done.count).toBe(1);
      expect(dist.done.percentage).toBe(25);
    });
  });

  describe("computePriorityDistribution", () => {
    it("computes exact breakdown across urgent, high, medium, and low", () => {
      const tasks: AnalyticsTaskRecord[] = [
        mockTask({ priority: "urgent" }),
        mockTask({ priority: "urgent" }),
        mockTask({ priority: "high" }),
        mockTask({ priority: "medium" }),
        mockTask({ priority: "low" }),
      ];

      const dist = computePriorityDistribution(tasks);
      expect(dist.urgent.count).toBe(2);
      expect(dist.high.count).toBe(1);
      expect(dist.medium.count).toBe(1);
      expect(dist.low.count).toBe(1);
    });
  });
});
