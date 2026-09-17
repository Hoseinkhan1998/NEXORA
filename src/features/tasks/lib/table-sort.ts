import type { TaskWithDetails, TaskPriority, TaskStatus } from "../types";

export type SortField = "title" | "status" | "priority" | "assignee" | "due_date";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

const STATUS_WEIGHTS: Record<TaskStatus, number> = {
  todo: 1,
  in_progress: 2,
  done: 3,
};

export function sortTasks(
  tasks: TaskWithDetails[],
  sortConfig: SortConfig | null
): TaskWithDetails[] {
  if (!sortConfig) {
    return tasks;
  }

  const { field, direction } = sortConfig;
  const modifier = direction === "asc" ? 1 : -1;

  return [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case "title": {
        comparison = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
        break;
      }
      case "status": {
        const weightA = STATUS_WEIGHTS[a.status] || 0;
        const weightB = STATUS_WEIGHTS[b.status] || 0;
        comparison = weightA - weightB;
        break;
      }
      case "priority": {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
        comparison = weightA - weightB;
        break;
      }
      case "assignee": {
        const nameA = a.assignee?.full_name || a.assignee?.email || "";
        const nameB = b.assignee?.full_name || b.assignee?.email || "";

        if (!nameA && !nameB) comparison = 0;
        else if (!nameA)
          comparison = 1; // Put unassigned at the end
        else if (!nameB) comparison = -1;
        else comparison = nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
        break;
      }
      case "due_date": {
        const dateA = a.due_date || "";
        const dateB = b.due_date || "";

        if (!dateA && !dateB) comparison = 0;
        else if (!dateA)
          comparison = 1; // Put tasks without due date at the end
        else if (!dateB) comparison = -1;
        else comparison = dateA.localeCompare(dateB);
        break;
      }
      default:
        comparison = 0;
    }

    if (comparison !== 0) {
      return comparison * modifier;
    }

    // Deterministic tie-breaker
    return a.position - b.position || a.created_at.localeCompare(b.created_at);
  });
}
