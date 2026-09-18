import type { TaskPriority, TaskStatus, WorkspaceAssignee } from "@/features/tasks/types";
import type { Project } from "@/features/projects/types";
import type { ProjectActivity } from "@/features/collaboration/types";

export type DateRangePreset = "7d" | "30d" | "90d" | "all";

export interface AnalyticsFilterState {
  dateRange: DateRangePreset;
  projectId: string; // "all" or specific project UUID
}

export interface KpiMetrics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  completionRate: number; // 0 - 100
  overdueTasks: number;
  unassignedTasks: number;
}

export interface StatusDistributionItem {
  status: TaskStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface StatusDistribution {
  todo: StatusDistributionItem;
  inProgress: StatusDistributionItem;
  done: StatusDistributionItem;
  total: number;
}

export interface PriorityDistributionItem {
  priority: TaskPriority;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PriorityDistribution {
  urgent: PriorityDistributionItem;
  high: PriorityDistributionItem;
  medium: PriorityDistributionItem;
  low: PriorityDistributionItem;
  total: number;
}

export interface CompletionTrendPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  label: string; // e.g. "Sep 15"
  count: number;
}

export interface AssigneeWorkloadItem {
  userId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
  total: number;
  completed: number;
  incomplete: number;
  completionRate: number;
}

export interface DueDatePerformance {
  overdue: number;
  today: number;
  thisWeek: number;
  upcoming: number;
  noDueDate: number;
}

export interface ProjectAnalyticsSummary {
  id: string;
  name: string;
  color: string | null;
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  completionRate: number;
  overdueTasks: number;
}

export interface AnalyticsTaskRecord {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawAnalyticsData {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  projects: Project[];
  tasks: AnalyticsTaskRecord[];
  members: WorkspaceAssignee[];
  activities: ProjectActivity[];
}

export interface CalculatedAnalytics {
  kpis: KpiMetrics;
  statusDistribution: StatusDistribution;
  priorityDistribution: PriorityDistribution;
  completionTrend: CompletionTrendPoint[];
  assigneeWorkload: AssigneeWorkloadItem[];
  dueDatePerformance: DueDatePerformance;
  projectSummaries: ProjectAnalyticsSummary[];
  hasActivityHistory: boolean;
}
