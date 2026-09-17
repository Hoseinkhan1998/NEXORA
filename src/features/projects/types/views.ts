export type ProjectView = "list" | "kanban" | "table" | "calendar" | "timeline";

export const PROJECT_VIEWS: readonly ProjectView[] = [
  "list",
  "kanban",
  "table",
  "calendar",
  "timeline",
] as const;

export const DEFAULT_PROJECT_VIEW: ProjectView = "list";

export function isProjectView(val: unknown): val is ProjectView {
  return typeof val === "string" && (PROJECT_VIEWS as readonly string[]).includes(val);
}

export function parseProjectView(val: unknown): ProjectView {
  if (isProjectView(val)) {
    return val;
  }
  return DEFAULT_PROJECT_VIEW;
}

export interface ProjectViewMeta {
  id: ProjectView;
  label: string;
  description: string;
  implemented: boolean;
}

export const PROJECT_VIEW_CONFIGS: Record<ProjectView, ProjectViewMeta> = {
  list: {
    id: "list",
    label: "List",
    description: "Detailed list view with filters, tabs, and bulk task management.",
    implemented: true,
  },
  kanban: {
    id: "kanban",
    label: "Kanban",
    description: "Visual workflow board grouped by task lifecycle statuses.",
    implemented: true,
  },
  table: {
    id: "table",
    label: "Table",
    description: "Dense tabular spreadsheet view for high-volume task editing.",
    implemented: true,
  },
  calendar: {
    id: "calendar",
    label: "Calendar",
    description: "Monthly and weekly scheduling view mapped against task due dates.",
    implemented: true,
  },
  timeline: {
    id: "timeline",
    label: "Timeline",
    description: "Gantt-style timeline visualization tracking project deliverables.",
    implemented: true,
  },
};
