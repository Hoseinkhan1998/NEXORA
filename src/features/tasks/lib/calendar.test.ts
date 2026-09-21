import { describe, it, expect } from "vitest";
import { normalizeDateKey, getMonthCalendarGrid, groupTasksByDate } from "./calendar";
import type { TaskWithDetails } from "../types";

function mockTask(partial: Partial<TaskWithDetails>): TaskWithDetails {
  return {
    id: partial.id || "t-1",
    workspace_id: "ws-1",
    project_id: "p-1",
    title: partial.title || "Task Title",
    description: null,
    status: "todo",
    priority: "medium",
    assignee_id: null,
    due_date: partial.due_date ?? null,
    position: 1000,
    created_by: "u-1",
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
    assignee: partial.assignee ?? null,
    assignees: partial.assignees ?? [],
    ...partial,
  };
}

describe("Calendar Engine", () => {
  describe("normalizeDateKey", () => {
    it("preserves already normalized YYYY-MM-DD strings", () => {
      expect(normalizeDateKey("2026-09-18")).toBe("2026-09-18");
    });

    it("normalizes Date objects accurately into YYYY-MM-DD", () => {
      const d = new Date(2026, 8, 18); // Note: month is 0-indexed, 8 = Sep
      expect(normalizeDateKey(d)).toBe("2026-09-18");
    });

    it("normalizes ISO timestamp strings into date keys", () => {
      const iso = "2026-10-05T14:30:00.000Z";
      const key = normalizeDateKey(iso);
      expect(key).toMatch(/^2026-10-0[56]$/); // Avoid timezone shift failure
    });

    it("returns null for null, undefined, or invalid inputs", () => {
      expect(normalizeDateKey(null)).toBeNull();
      expect(normalizeDateKey(undefined)).toBeNull();
      expect(normalizeDateKey("invalid-date-string")).toBeNull();
    });
  });

  describe("getMonthCalendarGrid", () => {
    it("generates 35 or 42 grid cells ensuring full complete weeks (multiples of 7)", () => {
      const gridSep2026 = getMonthCalendarGrid(2026, 8); // Sep 2026
      expect(gridSep2026.length % 7).toBe(0);
      expect(gridSep2026.length).toBeGreaterThanOrEqual(35);
    });

    it("correctly identifies leap-year February (29 days in 2024)", () => {
      const feb2024 = getMonthCalendarGrid(2024, 1);
      const currentMonthDays = feb2024.filter((d) => d.isCurrentMonth);
      expect(currentMonthDays).toHaveLength(29);
    });

    it("correctly identifies standard February (28 days in 2025)", () => {
      const feb2025 = getMonthCalendarGrid(2025, 1);
      const currentMonthDays = feb2025.filter((d) => d.isCurrentMonth);
      expect(currentMonthDays).toHaveLength(28);
    });

    it("correctly handles 30-day and 31-day months", () => {
      // April has 30 days
      const apr2026 = getMonthCalendarGrid(2026, 3);
      expect(apr2026.filter((d) => d.isCurrentMonth)).toHaveLength(30);

      // May has 31 days
      const may2026 = getMonthCalendarGrid(2026, 4);
      expect(may2026.filter((d) => d.isCurrentMonth)).toHaveLength(31);
    });

    it("includes leading days from previous month and trailing days from next month", () => {
      const grid = getMonthCalendarGrid(2026, 8); // Sep 2026
      const leadingDays = grid.filter((d, idx) => idx === 0 && !d.isCurrentMonth);
      expect(leadingDays.length).toBeGreaterThanOrEqual(1);
      // Sep 1, 2026 is a Tuesday -> leading days Sunday and Monday exist
      expect(grid[0]?.isCurrentMonth).toBe(false);
      expect(grid[grid.length - 1]?.isCurrentMonth).toBe(false);
    });
  });

  describe("groupTasksByDate", () => {
    it("groups dated tasks under their normalized dateKey and separates undated tasks", () => {
      const tasks: TaskWithDetails[] = [
        mockTask({ id: "1", due_date: "2026-09-20" }),
        mockTask({ id: "2", due_date: "2026-09-20" }),
        mockTask({ id: "3", due_date: "2026-09-25" }),
        mockTask({ id: "4", due_date: null }),
      ];

      const { datedTasks, undatedTasks } = groupTasksByDate(tasks);

      expect(datedTasks.get("2026-09-20")).toHaveLength(2);
      expect(datedTasks.get("2026-09-25")).toHaveLength(1);
      expect(undatedTasks).toHaveLength(1);
      expect(undatedTasks[0]?.id).toBe("4");
    });
  });
});
