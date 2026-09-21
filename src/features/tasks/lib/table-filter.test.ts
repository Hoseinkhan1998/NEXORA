import { describe, it, expect } from "vitest";
import { filterTasks, hasActiveFilters, DEFAULT_TASK_FILTERS } from "./table-filter";
import type { TaskWithDetails } from "../types";

function mockTask(partial: Partial<TaskWithDetails>): TaskWithDetails {
  return {
    id: partial.id || "t-1",
    workspace_id: "ws-1",
    project_id: "p-1",
    title: partial.title || "Task Title",
    description: partial.description ?? null,
    status: partial.status || "todo",
    priority: partial.priority || "medium",
    assignee_id: partial.assignee_id ?? null,
    due_date: partial.due_date ?? null,
    position: partial.position ?? 1000,
    created_by: "u-1",
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
    assignee: partial.assignee ?? null,
    assignees: partial.assignees ?? (partial.assignee ? [partial.assignee] : []),
    ...partial,
  };
}

describe("Table Filtering Engine", () => {
  const sampleTasks: TaskWithDetails[] = [
    mockTask({
      id: "1",
      title: "Design login page",
      description: "Create high-fidelity Figma mockups",
      status: "in_progress",
      priority: "high",
      assignee_id: "u-alice",
      assignee: {
        id: "u-alice",
        email: "alice@example.com",
        full_name: "Alice Smith",
        avatar_url: null,
      },
    }),
    mockTask({
      id: "2",
      title: "Database schema migration",
      description: "Add RLS policies for tenant isolation",
      status: "done",
      priority: "urgent",
      assignee_id: "u-bob",
      assignee: { id: "u-bob", email: "bob@example.com", full_name: "Bob Jones", avatar_url: null },
    }),
    mockTask({
      id: "3",
      title: "Write documentation",
      description: null,
      status: "todo",
      priority: "low",
      assignee_id: null,
      assignee: null,
    }),
  ];

  describe("hasActiveFilters", () => {
    it("returns false for default empty filters", () => {
      expect(hasActiveFilters(DEFAULT_TASK_FILTERS)).toBe(false);
    });

    it("returns true when any filter is active", () => {
      expect(hasActiveFilters({ ...DEFAULT_TASK_FILTERS, searchQuery: "login" })).toBe(true);
      expect(hasActiveFilters({ ...DEFAULT_TASK_FILTERS, status: "todo" })).toBe(true);
      expect(hasActiveFilters({ ...DEFAULT_TASK_FILTERS, priority: "urgent" })).toBe(true);
      expect(hasActiveFilters({ ...DEFAULT_TASK_FILTERS, assigneeId: "u-alice" })).toBe(true);
    });
  });

  describe("filterTasks", () => {
    it("filters by text search matching title, description, or assignee name", () => {
      // Matches title
      let result = filterTasks(sampleTasks, { ...DEFAULT_TASK_FILTERS, searchQuery: "login" });
      expect(result.map((t) => t.id)).toEqual(["1"]);

      // Matches description
      result = filterTasks(sampleTasks, {
        ...DEFAULT_TASK_FILTERS,
        searchQuery: "tenant isolation",
      });
      expect(result.map((t) => t.id)).toEqual(["2"]);

      // Matches assignee full name
      result = filterTasks(sampleTasks, { ...DEFAULT_TASK_FILTERS, searchQuery: "alice" });
      expect(result.map((t) => t.id)).toEqual(["1"]);
    });

    it("filters by exact task status", () => {
      const result = filterTasks(sampleTasks, { ...DEFAULT_TASK_FILTERS, status: "done" });
      expect(result.map((t) => t.id)).toEqual(["2"]);
    });

    it("filters by exact task priority", () => {
      const result = filterTasks(sampleTasks, { ...DEFAULT_TASK_FILTERS, priority: "low" });
      expect(result.map((t) => t.id)).toEqual(["3"]);
    });

    it("filters by specific assignee ID", () => {
      const result = filterTasks(sampleTasks, { ...DEFAULT_TASK_FILTERS, assigneeId: "u-bob" });
      expect(result.map((t) => t.id)).toEqual(["2"]);
    });

    it("filters exclusively for unassigned tasks", () => {
      const result = filterTasks(sampleTasks, {
        ...DEFAULT_TASK_FILTERS,
        assigneeId: "unassigned",
      });
      expect(result.map((t) => t.id)).toEqual(["3"]);
    });

    it("combines multiple filters conjunctively (AND logic)", () => {
      // status: in_progress AND priority: high -> matches task 1
      let result = filterTasks(sampleTasks, {
        ...DEFAULT_TASK_FILTERS,
        status: "in_progress",
        priority: "high",
      });
      expect(result.map((t) => t.id)).toEqual(["1"]);

      // status: in_progress AND priority: low -> no matches
      result = filterTasks(sampleTasks, {
        ...DEFAULT_TASK_FILTERS,
        status: "in_progress",
        priority: "low",
      });
      expect(result).toHaveLength(0);
    });
  });
});
