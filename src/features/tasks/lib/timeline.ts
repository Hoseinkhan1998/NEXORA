import { normalizeDateKey } from "./calendar";
import type { TaskWithDetails } from "../types";

export interface TimelineDate {
  date: Date;
  dateKey: string; // "YYYY-MM-DD"
  dayNumber: number;
  monthLabel: string; // "Sep", "Oct"
  weekdayLabel: string; // "Mon", "Tue"
  isToday: boolean;
  isWeekend: boolean;
}

export type TimelineDateRange = TimelineDate[];

export const TIMELINE_COLUMN_WIDTH = 44; // pixels per date column
export const TIMELINE_TASK_PANEL_WIDTH = 320; // pixels for left sticky task column

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Generates a continuous array of TimelineDate items centered around anchorDate.
 * Defaults to 7 days before and 28 days after (36 days total window).
 */
export function generateTimelineDateRange(
  anchorDate: Date,
  daysBefore = 7,
  daysAfter = 28
): TimelineDate[] {
  const todayKey = normalizeDateKey(new Date());
  const dates: TimelineDate[] = [];

  const start = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate() - daysBefore
  );
  const totalDays = daysBefore + 1 + daysAfter;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dateKey = normalizeDateKey(d) || "";
    const dayOfWeek = d.getDay();

    dates.push({
      date: d,
      dateKey,
      dayNumber: d.getDate(),
      monthLabel: SHORT_MONTH_NAMES[d.getMonth()] ?? "",
      weekdayLabel: SHORT_WEEKDAYS[dayOfWeek] ?? "",
      isToday: dateKey === todayKey,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return dates;
}

/**
 * Shifts an anchor date forward or backward by a given number of days.
 */
export function shiftTimelineDate(currentAnchor: Date, days: number): Date {
  return new Date(
    currentAnchor.getFullYear(),
    currentAnchor.getMonth(),
    currentAnchor.getDate() + days
  );
}

/**
 * Formats a human-readable header label for the timeline window (e.g. "Sep 11 – Oct 16, 2026").
 */
export function formatTimelineRangeLabel(dateRange: TimelineDate[]): string {
  if (dateRange.length === 0) return "";
  const first = dateRange[0];
  const last = dateRange[dateRange.length - 1];

  if (!first || !last) return "";

  const firstYear = first.date.getFullYear();
  const lastYear = last.date.getFullYear();

  if (firstYear === lastYear) {
    if (first.monthLabel === last.monthLabel) {
      return `${first.monthLabel} ${first.dayNumber} – ${last.dayNumber}, ${firstYear}`;
    }
    return `${first.monthLabel} ${first.dayNumber} – ${last.monthLabel} ${last.dayNumber}, ${firstYear}`;
  }

  return `${first.monthLabel} ${first.dayNumber}, ${firstYear} – ${last.monthLabel} ${last.dayNumber}, ${lastYear}`;
}

/**
 * Determines whether a task's due date sits within the active dateRange and returns its column index.
 */
export function getTaskTimelinePosition(
  dueDate: string | null | undefined,
  dateRange: TimelineDate[]
): { columnIndex: number; inRange: boolean } {
  const taskKey = normalizeDateKey(dueDate);
  if (!taskKey) {
    return { columnIndex: -1, inRange: false };
  }

  const idx = dateRange.findIndex((d) => d.dateKey === taskKey);
  return {
    columnIndex: idx,
    inRange: idx !== -1,
  };
}

/**
 * Partitions tasks into dated tasks and tasks without a due date.
 */
export function partitionTimelineTasks(tasks: TaskWithDetails[]): {
  datedTasks: TaskWithDetails[];
  undatedTasks: TaskWithDetails[];
} {
  const datedTasks: TaskWithDetails[] = [];
  const undatedTasks: TaskWithDetails[] = [];

  for (const task of tasks) {
    if (normalizeDateKey(task.due_date)) {
      datedTasks.push(task);
    } else {
      undatedTasks.push(task);
    }
  }

  return {
    datedTasks,
    undatedTasks,
  };
}
