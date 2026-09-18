import { describe, it, expect } from "vitest";
import { sortTasks, type SortConfig } from "./table-sort";
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
    created_at: partial.created_at || "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
    assignee: partial.assignee ?? null,
  };
}

describe("Table Sorting Engine", () => {
  it("returns original array order when sortConfig is null", () => {
    const tasks = [mockTask({ id: "1", title: "B" }), mockTask({ id: "2", title: "A" })];
    const sorted = sortTasks(tasks, null);
    expect(sorted.map((t) => t.id)).toEqual(["1", "2"]);
  });

  describe("title sorting", () => {
    it("sorts alphabetically ascending", () => {
      const tasks = [
        mockTask({ id: "1", title: "Zebra" }),
        mockTask({ id: "2", title: "Apple" }),
        mockTask({ id: "3", title: "Mango" }),
      ];
      const config: SortConfig = { field: "title", direction: "asc" };
      const sorted = sortTasks(tasks, config);
      expect(sorted.map((t) => t.title)).toEqual(["Apple", "Mango", "Zebra"]);
    });

    it("sorts alphabetically descending", () => {
      const tasks = [mockTask({ id: "1", title: "Apple" }), mockTask({ id: "2", title: "Zebra" })];
      const config: SortConfig = { field: "title", direction: "desc" };
      const sorted = sortTasks(tasks, config);
      expect(sorted.map((t) => t.title)).toEqual(["Zebra", "Apple"]);
    });
  });

  describe("status sorting", () => {
    it("sorts status by workflow progression (todo < in_progress < done)", () => {
      const tasks = [
        mockTask({ id: "1", status: "done" }),
        mockTask({ id: "2", status: "todo" }),
        mockTask({ id: "3", status: "in_progress" }),
      ];
      const config: SortConfig = { field: "status", direction: "asc" };
      const sorted = sortTasks(tasks, config);
      expect(sorted.map((t) => t.status)).toEqual(["todo", "in_progress", "done"]);
    });
  });

  describe("priority sorting", () => {
    it("sorts priority by severity (low < medium < high < urgent)", () => {
      const tasks = [
        mockTask({ id: "1", priority: "urgent" }),
        mockTask({ id: "2", priority: "low" }),
        mockTask({ id: "3", priority: "high" }),
        mockTask({ id: "4", priority: "medium" }),
      ];
      const config: SortConfig = { field: "priority", direction: "asc" };
      const sorted = sortTasks(tasks, config);
      expect(sorted.map((t) => t.priority)).toEqual(["low", "medium", "high", "urgent"]);
    });
  });

  describe("assignee sorting", () => {
    it("sorts by assignee name and places unassigned at the end in ascending order", () => {
      const tasks = [
        mockTask({ id: "1", assignee: null }),
        mockTask({
          id: "2",
          assignee: { id: "u2", email: "bob@example.com", full_name: "Bob", avatar_url: null },
        }),
        mockTask({
          id: "3",
          assignee: { id: "u1", email: "alice@example.com", full_name: "Alice", avatar_url: null },
        }),
      ];
      const config: SortConfig = { field: "assignee", direction: "asc" };
      const sorted = sortTasks(tasks, config);
      expect(sorted.map((t) => t.id)).toEqual(["3", "2", "1"]);
    });
  });

  describe("due_date sorting", () => {
    it("sorts dates chronologically and puts tasks without due dates at the end", () => {
      const tasks = [
        mockTask({ id: "1", due_date: null }),
        mockTask({ id: "2", due_date: "2026-10-01" }),
        mockTask({ id: "3", due_date: "2026-09-15" }),
      ];
      const config: SortConfig = { field: "due_date", direction: "asc" };
      const sorted = sortTasks(tasks, config);
      expect(sorted.map((t) => t.id)).toEqual(["3", "2", "1"]);
    });
  });

  describe("deterministic tie-breaker", () => {
    it("uses position and created_at as deterministic tie-breakers when primary sort matches", () => {
      const tasks = [
        mockTask({ id: "1", status: "todo", position: 2000, created_at: "2026-09-02" }),
        mockTask({ id: "2", status: "todo", position: 1000, created_at: "2026-09-01" }),
      ];
      const config: SortConfig = { field: "status", direction: "asc" };
      const sorted = sortTasks(tasks, config);
      expect(sorted.map((t) => t.id)).toEqual(["2", "1"]);
    });
  });
});
