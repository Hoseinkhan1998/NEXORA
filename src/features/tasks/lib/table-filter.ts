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
        task.assignees?.some(
          (a) =>
            a.full_name?.toLowerCase().includes(query) || a.email?.toLowerCase().includes(query)
        ) ||
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
        const hasAssignees =
          (task.assignees && task.assignees.length > 0) ||
          Boolean(task.assignee_id || task.assignee);
        if (hasAssignees) {
          return false;
        }
      } else {
        const isAssigned =
          task.assignee_id === filters.assigneeId ||
          task.assignees?.some((a) => a.id === filters.assigneeId);
        if (!isAssigned) {
          return false;
        }
      }
    }

    return true;
  });
}
