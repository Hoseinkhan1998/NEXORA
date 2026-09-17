import type { TaskWithDetails } from "../types";

export interface CalendarDay {
  date: Date;
  dateKey: string; // "YYYY-MM-DD"
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Normalizes any Date, ISO string, or YYYY-MM-DD string into a safe YYYY-MM-DD key.
 */
export function normalizeDateKey(dateInput: Date | string | null | undefined): string | null {
  if (!dateInput) return null;

  if (typeof dateInput === "string") {
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    // If it's an ISO string (e.g. 2026-10-15T00:00:00+00:00)
    const parsed = new Date(dateInput);
    if (isNaN(parsed.getTime())) return null;

    // Use date components to avoid timezone day shifts
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Generates the full 7-column calendar matrix for the given year and month (0-indexed).
 * Includes leading days from the previous month and trailing days from the next month.
 */
export function getMonthCalendarGrid(year: number, month: number): CalendarDay[] {
  const todayKey = normalizeDateKey(new Date());

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: CalendarDay[] = [];

  // 1. Leading days from previous month
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const date = new Date(year, month - 1, dayNum);
    const dateKey = normalizeDateKey(date) || "";
    grid.push({
      date,
      dateKey,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
    });
  }

  // 2. Days of current month
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const date = new Date(year, month, dayNum);
    const dateKey = normalizeDateKey(date) || "";
    grid.push({
      date,
      dateKey,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
    });
  }

  // 3. Trailing days from next month to complete the final week (total 35 or 42 cells)
  const totalCellsNeeded = Math.ceil(grid.length / 7) * 7;
  const trailingDaysNeeded = totalCellsNeeded - grid.length;

  for (let dayNum = 1; dayNum <= trailingDaysNeeded; dayNum++) {
    const date = new Date(year, month + 1, dayNum);
    const dateKey = normalizeDateKey(date) || "";
    grid.push({
      date,
      dateKey,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
    });
  }

  return grid;
}

/**
 * Groups tasks by dateKey for fast calendar day lookup and collects undated tasks.
 */
export function groupTasksByDate(tasks: TaskWithDetails[]): {
  datedTasks: Map<string, TaskWithDetails[]>;
  undatedTasks: TaskWithDetails[];
} {
  const datedTasks = new Map<string, TaskWithDetails[]>();
  const undatedTasks: TaskWithDetails[] = [];

  for (const task of tasks) {
    const dateKey = normalizeDateKey(task.due_date);
    if (dateKey) {
      const existing = datedTasks.get(dateKey) || [];
      existing.push(task);
      datedTasks.set(dateKey, existing);
    } else {
      undatedTasks.push(task);
    }
  }

  return {
    datedTasks,
    undatedTasks,
  };
}
