import type { TaskWithDetails, TaskPriority, TaskStatus } from "../types";

export interface TaskTableFilters {
  searchQuery: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  assigneeId: string | "all" | "unassigned";
}

export const DEFAULT_TASK_FILTERS: TaskTableFilters = {
  searchQuery: "",
  status: "all",
  priority: "all",
  assigneeId: "all",
};

export function hasActiveFilters(filters: TaskTableFilters): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.assigneeId !== "all"
  );
}

export function filterTasks(
  tasks: TaskWithDetails[],
  filters: TaskTableFilters
): TaskWithDetails[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    // 1. Search Filter (title, description, assignee)
    if (query) {
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query) ?? false;
      const matchesAssignee =
        task.assignee?.full_name?.toLowerCase().includes(query) ||
        task.assignee?.email?.toLowerCase().includes(query) ||
        false;

      if (!matchesTitle && !matchesDescription && !matchesAssignee) {
        return false;
      }
    }

    // 2. Status Filter
    if (filters.status !== "all" && task.status !== filters.status) {
      return false;
    }

    // 3. Priority Filter
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    // 4. Assignee Filter
    if (filters.assigneeId !== "all") {
      if (filters.assigneeId === "unassigned") {
        if (task.assignee_id !== null && task.assignee !== null) {
          return false;
        }
      } else if (task.assignee_id !== filters.assigneeId) {
        return false;
      }
    }

    return true;
  });
}
