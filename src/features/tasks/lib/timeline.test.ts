import { describe, it, expect } from "vitest";
import {
  generateTimelineDateRange,
  shiftTimelineDate,
  formatTimelineRangeLabel,
  getTaskTimelinePosition,
  partitionTimelineTasks,
} from "./timeline";
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
    assignee: null,
  };
}

describe("Timeline Engine", () => {
  const anchorDate = new Date(2026, 8, 18); // Sep 18, 2026

  describe("generateTimelineDateRange", () => {
    it("generates continuous date range with specified before and after offsets", () => {
      const dates = generateTimelineDateRange(anchorDate, 7, 28);
      // 7 days before + 1 anchor day + 28 days after = 36 total days
      expect(dates).toHaveLength(36);

      // Verify date continuity (day n+1 = day n + 1 day)
      for (let i = 1; i < dates.length; i++) {
        const prev = dates[i - 1]!.date.getTime();
        const curr = dates[i]!.date.getTime();
        const diffHours = Math.round((curr - prev) / (1000 * 60 * 60));
        expect(diffHours).toBeGreaterThanOrEqual(23);
        expect(diffHours).toBeLessThanOrEqual(25);
      }
    });

    it("correctly identifies weekend days", () => {
      const dates = generateTimelineDateRange(anchorDate, 7, 7);
      for (const item of dates) {
        const day = item.date.getDay();
        if (day === 0 || day === 6) {
          expect(item.isWeekend).toBe(true);
        } else {
          expect(item.isWeekend).toBe(false);
        }
      }
    });
  });

  describe("shiftTimelineDate", () => {
    it("shifts forward by specified number of days", () => {
      const shifted = shiftTimelineDate(anchorDate, 14);
      const diffDays = Math.round(
        (shifted.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(14);
    });

    it("shifts backward by specified number of days", () => {
      const shifted = shiftTimelineDate(anchorDate, -7);
      const diffDays = Math.round(
        (shifted.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(-7);
    });
  });

  describe("formatTimelineRangeLabel", () => {
    it("formats human-readable label across months in same year", () => {
      const dates = generateTimelineDateRange(anchorDate, 7, 28);
      const label = formatTimelineRangeLabel(dates);
      expect(label).toContain("Sep");
      expect(label).toContain("Oct");
      expect(label).toContain("2026");
    });

    it("returns empty string for empty date ranges", () => {
      expect(formatTimelineRangeLabel([])).toBe("");
    });
  });

  describe("getTaskTimelinePosition", () => {
    it("returns column index and inRange = true when task due date is in the window", () => {
      const dates = generateTimelineDateRange(anchorDate, 7, 28);
      const targetDateKey = dates[10]!.dateKey;

      const pos = getTaskTimelinePosition(targetDateKey, dates);
      expect(pos.inRange).toBe(true);
      expect(pos.columnIndex).toBe(10);
    });

    it("returns inRange = false when task due date is outside the window or null", () => {
      const dates = generateTimelineDateRange(anchorDate, 7, 7);
      const outOfRangeDate = "2028-01-01";

      expect(getTaskTimelinePosition(outOfRangeDate, dates)).toEqual({
        columnIndex: -1,
        inRange: false,
      });

      expect(getTaskTimelinePosition(null, dates)).toEqual({
        columnIndex: -1,
        inRange: false,
      });
    });
  });

  describe("partitionTimelineTasks", () => {
    it("separates tasks with valid due dates from undated tasks", () => {
      const tasks = [
        mockTask({ id: "1", due_date: "2026-09-20" }),
        mockTask({ id: "2", due_date: null }),
        mockTask({ id: "3", due_date: "2026-09-22" }),
      ];

      const { datedTasks, undatedTasks } = partitionTimelineTasks(tasks);
      expect(datedTasks.map((t) => t.id)).toEqual(["1", "3"]);
      expect(undatedTasks.map((t) => t.id)).toEqual(["2"]);
    });
  });
});
