import type {
  AnalyticsTaskRecord,
  AssigneeWorkloadItem,
  CompletionTrendPoint,
  DateRangePreset,
  DueDatePerformance,
  KpiMetrics,
  PriorityDistribution,
  ProjectAnalyticsSummary,
  StatusDistribution,
} from "../types";
import type { Project } from "@/features/projects/types";
import type { WorkspaceAssignee } from "@/features/tasks/types";
import type { ProjectActivity } from "@/features/collaboration/types";
import { generateDateBuckets, getDateRangeBounds, toISODateString } from "./date-range";

/**
 * Parses a date string (YYYY-MM-DD or ISO) into a local Date representing midnight of that day.
 */
export function parseLocalDate(dateStr: string): Date {
  // If it's pure YYYY-MM-DD, parse year, month, day to avoid UTC midnight timezone offset issues
  const datePart = dateStr.split("T")[0] ?? "";
  const parts = datePart.split("-");
  const p0 = parts[0];
  const p1 = parts[1];
  const p2 = parts[2];
  if (parts.length === 3 && p0 && p1 && p2) {
    const year = parseInt(p0, 10);
    const month = parseInt(p1, 10) - 1;
    const day = parseInt(p2, 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const parsed = new Date(dateStr);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

/**
 * Computes primary KPI metrics across the scoped tasks and projects.
 */
export function computeKpis(
  tasks: AnalyticsTaskRecord[],
  projects: Project[],
  referenceDate: Date = new Date()
): KpiMetrics {
  const totalProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = tasks.length;

  let completedTasks = 0;
  let overdueTasks = 0;
  let unassignedTasks = 0;

  const todayMidnight = new Date(referenceDate);
  todayMidnight.setHours(0, 0, 0, 0);

  for (const task of tasks) {
    const isDone = task.status === "done";
    if (isDone) {
      completedTasks++;
    } else {
      if (task.due_date) {
        const dueDate = parseLocalDate(task.due_date);
        if (dueDate < todayMidnight) {
          overdueTasks++;
        }
      }
    }

    if (!task.assignee_id) {
      unassignedTasks++;
    }
  }

  const incompleteTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    incompleteTasks,
    completionRate,
    overdueTasks,
    unassignedTasks,
  };
}

/**
 * Computes task breakdown by status (todo, in_progress, done).
 */
export function computeStatusDistribution(tasks: AnalyticsTaskRecord[]): StatusDistribution {
  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;

  for (const task of tasks) {
    if (task.status === "done") {
      doneCount++;
    } else if (task.status === "in_progress") {
      inProgressCount++;
    } else {
      todoCount++;
    }
  }

  const total = tasks.length;
  const getPct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return {
    todo: {
      status: "todo",
      label: "To Do",
      count: todoCount,
      percentage: getPct(todoCount),
      color: "#94a3b8", // slate-400
    },
    inProgress: {
      status: "in_progress",
      label: "In Progress",
      count: inProgressCount,
      percentage: getPct(inProgressCount),
      color: "#3b82f6", // blue-500
    },
    done: {
      status: "done",
      label: "Done",
      count: doneCount,
      percentage: getPct(doneCount),
      color: "#10b981", // emerald-500
    },
    total,
  };
}

/**
 * Computes task breakdown by priority (urgent, high, medium, low).
 */
export function computePriorityDistribution(tasks: AnalyticsTaskRecord[]): PriorityDistribution {
  let urgent = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const task of tasks) {
    switch (task.priority) {
      case "urgent":
        urgent++;
        break;
      case "high":
        high++;
        break;
      case "medium":
        medium++;
        break;
      case "low":
      default:
        low++;
        break;
    }
  }

  const total = tasks.length;
  const getPct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return {
    urgent: {
      priority: "urgent",
      label: "Urgent",
      count: urgent,
      percentage: getPct(urgent),
      color: "#ef4444", // red-500
    },
    high: {
      priority: "high",
      label: "High",
      count: high,
      percentage: getPct(high),
      color: "#f59e0b", // amber-500
    },
    medium: {
      priority: "medium",
      label: "Medium",
      count: medium,
      percentage: getPct(medium),
      color: "#0284c7", // sky-600
    },
    low: {
      priority: "low",
      label: "Low",
      count: low,
      percentage: getPct(low),
      color: "#64748b", // slate-500
    },
    total,
  };
}

/**
 * Computes due-date performance breakdown for non-done tasks.
 * Completed tasks are not classified as overdue.
 */
export function computeDueDatePerformance(
  tasks: AnalyticsTaskRecord[],
  referenceDate: Date = new Date()
): DueDatePerformance {
  let overdue = 0;
  let today = 0;
  let thisWeek = 0;
  let upcoming = 0;
  let noDueDate = 0;

  const startOfToday = new Date(referenceDate);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(referenceDate);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  for (const task of tasks) {
    if (task.status === "done") {
      continue;
    }

    if (!task.due_date) {
      noDueDate++;
      continue;
    }

    const due = parseLocalDate(task.due_date);

    if (due < startOfToday) {
      overdue++;
    } else if (due <= endOfToday) {
      today++;
    } else if (due <= endOfWeek) {
      thisWeek++;
    } else {
      upcoming++;
    }
  }

  return {
    overdue,
    today,
    thisWeek,
    upcoming,
    noDueDate,
  };
}

/**
 * Computes workload per assignee, plus unassigned tasks.
 */
export function computeAssigneeWorkload(
  tasks: AnalyticsTaskRecord[],
  members: WorkspaceAssignee[]
): AssigneeWorkloadItem[] {
  const memberMap = new Map<string, AssigneeWorkloadItem>();

  for (const member of members) {
    memberMap.set(member.userId, {
      userId: member.userId,
      name: member.fullName || member.email.split("@")[0] || "Member",
      email: member.email,
      avatarUrl: member.avatarUrl,
      total: 0,
      completed: 0,
      incomplete: 0,
      completionRate: 0,
    });
  }

  const unassigned: AssigneeWorkloadItem = {
    userId: null,
    name: "Unassigned",
    email: "",
    avatarUrl: null,
    total: 0,
    completed: 0,
    incomplete: 0,
    completionRate: 0,
  };

  for (const task of tasks) {
    const isDone = task.status === "done";
    if (!task.assignee_id) {
      unassigned.total++;
      if (isDone) {
        unassigned.completed++;
      } else {
        unassigned.incomplete++;
      }
    } else {
      let item = memberMap.get(task.assignee_id);
      if (!item) {
        // Assignee might not be in the current member list (e.g. former member)
        item = {
          userId: task.assignee_id,
          name: "Unknown Assignee",
          email: "",
          avatarUrl: null,
          total: 0,
          completed: 0,
          incomplete: 0,
          completionRate: 0,
        };
        memberMap.set(task.assignee_id, item);
      }
      item.total++;
      if (isDone) {
        item.completed++;
      } else {
        item.incomplete++;
      }
    }
  }

  // Calculate completion rates
  if (unassigned.total > 0) {
    unassigned.completionRate = Math.round((unassigned.completed / unassigned.total) * 100);
  }

  const result: AssigneeWorkloadItem[] = [];

  for (const item of memberMap.values()) {
    if (item.total > 0) {
      item.completionRate = Math.round((item.completed / item.total) * 100);
      result.push(item);
    }
  }

  // Sort members by total assigned tasks descending
  result.sort((a, b) => b.total - a.total);

  // Add unassigned at the end if it has tasks
  if (unassigned.total > 0) {
    result.push(unassigned);
  }

  return result;
}

/**
 * Computes historical completion trend from project_activity records.
 * Only events with action = 'task_status_changed', metadata.new_status = 'done',
 * and metadata.old_status != 'done' count as completion events.
 */
export function computeCompletionTrend(
  activities: ProjectActivity[],
  preset: DateRangePreset,
  referenceDate: Date = new Date()
): { points: CompletionTrendPoint[]; hasHistory: boolean } {
  const { start, end } = getDateRangeBounds(preset, referenceDate);

  // Filter valid completion activities
  const validCompletions = activities.filter((act) => {
    if (act.action !== "task_status_changed") return false;
    const newStatus = act.metadata?.new_status;
    const oldStatus = act.metadata?.old_status;
    return newStatus === "done" && oldStatus !== "done";
  });

  const hasHistory = validCompletions.length > 0;

  // Determine start boundary for 'all' preset
  let effectiveStart: Date;
  if (preset === "all") {
    if (validCompletions.length > 0) {
      const timestamps = validCompletions.map((a) => new Date(a.created_at).getTime());
      const minTimestamp = Math.min(...timestamps);
      effectiveStart = new Date(minTimestamp);
      effectiveStart.setHours(0, 0, 0, 0);

      // If span is less than 7 days, expand to 7 days for a nice baseline
      const diffDays = (end.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) {
        effectiveStart = new Date(end);
        effectiveStart.setDate(effectiveStart.getDate() - 6);
        effectiveStart.setHours(0, 0, 0, 0);
      }
    } else {
      // Default to 14 days if no history
      effectiveStart = new Date(end);
      effectiveStart.setDate(effectiveStart.getDate() - 13);
      effectiveStart.setHours(0, 0, 0, 0);
    }
  } else {
    effectiveStart = start ?? new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const buckets = generateDateBuckets(effectiveStart, end);
  const countsByDate = new Map<string, number>();

  for (const act of validCompletions) {
    const actDate = new Date(act.created_at);
    if (actDate >= effectiveStart && actDate <= end) {
      const dateKey = toISODateString(actDate);
      countsByDate.set(dateKey, (countsByDate.get(dateKey) || 0) + 1);
    }
  }

  const points: CompletionTrendPoint[] = buckets.map((bucket) => ({
    date: bucket.date,
    label: bucket.label,
    count: countsByDate.get(bucket.date) || 0,
  }));

  return { points, hasHistory };
}

/**
 * Computes project-level metrics summary for accessible projects.
 */
export function computeProjectSummaries(
  projects: Project[],
  tasks: AnalyticsTaskRecord[],
  referenceDate: Date = new Date()
): ProjectAnalyticsSummary[] {
  const todayMidnight = new Date(referenceDate);
  todayMidnight.setHours(0, 0, 0, 0);

  const taskMap = new Map<string, { total: number; completed: number; overdue: number }>();

  for (const task of tasks) {
    let stat = taskMap.get(task.project_id);
    if (!stat) {
      stat = { total: 0, completed: 0, overdue: 0 };
      taskMap.set(task.project_id, stat);
    }
    stat.total++;
    if (task.status === "done") {
      stat.completed++;
    } else {
      if (task.due_date) {
        const due = parseLocalDate(task.due_date);
        if (due < todayMidnight) {
          stat.overdue++;
        }
      }
    }
  }

  return projects
    .filter((p) => p.status === "active")
    .map((project) => {
      const stats = taskMap.get(project.id) || { total: 0, completed: 0, overdue: 0 };
      const incomplete = stats.total - stats.completed;
      const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        color: project.color,
        totalTasks: stats.total,
        completedTasks: stats.completed,
        incompleteTasks: incomplete,
        completionRate: rate,
        overdueTasks: stats.overdue,
      };
    })
    .sort((a, b) => b.totalTasks - a.totalTasks);
}
