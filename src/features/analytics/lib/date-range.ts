import type { DateRangePreset } from "../types";

export interface DateRangeBounds {
  start: Date | null;
  end: Date;
}

/**
 * Returns date range boundary timestamps for a preset.
 */
export function getDateRangeBounds(preset: DateRangePreset, referenceDate?: Date): DateRangeBounds {
  const end = referenceDate ? new Date(referenceDate) : new Date();
  end.setHours(23, 59, 59, 999);

  if (preset === "all") {
    return { start: null, end };
  }

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);

  if (preset === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (preset === "30d") {
    start.setDate(start.getDate() - 29);
  } else if (preset === "90d") {
    start.setDate(start.getDate() - 89);
  }

  return { start, end };
}

/**
 * Formats a Date object to YYYY-MM-DD.
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to a human-friendly short label (e.g. "Sep 18").
 */
export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Generates an array of continuous daily date strings (YYYY-MM-DD) between start and end.
 */
export function generateDateBuckets(
  start: Date,
  end: Date
): Array<{ date: string; label: string }> {
  const buckets: Array<{ date: string; label: string }> = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const targetEnd = new Date(end);
  targetEnd.setHours(23, 59, 59, 999);

  while (current <= targetEnd) {
    buckets.push({
      date: toISODateString(current),
      label: formatDateLabel(current),
    });
    current.setDate(current.getDate() + 1);
  }

  return buckets;
}
