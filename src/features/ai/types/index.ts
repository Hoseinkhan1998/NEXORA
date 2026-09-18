export type CopilotRole = "user" | "assistant";

export interface CopilotMessage {
  id: string;
  role: CopilotRole;
  content: string;
  createdAt: string;
}

export interface CopilotRequestMessage {
  role: CopilotRole;
  content: string;
}

export interface CopilotContextProject {
  id: string;
  name: string;
  status: string;
  description: string | null;
  totalTasks: number;
  completedTasks: number;
}

export interface CopilotContextTask {
  id: string;
  projectName: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeName: string | null;
  dueDate: string | null;
}

export interface CopilotContextActivity {
  id: string;
  action: string;
  taskTitle: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface WorkspaceContextData {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  projects: CopilotContextProject[];
  tasks: CopilotContextTask[];
  recentActivities: CopilotContextActivity[];
}

export interface CopilotResponseSuccess {
  success: true;
  message: CopilotMessage;
}

export interface CopilotResponseError {
  success: false;
  error: {
    code:
      "AI_NOT_CONFIGURED" | "UNAUTHORIZED" | "VALIDATION_ERROR" | "RATE_LIMITED" | "SERVER_ERROR";
    message: string;
  };
}

export type CopilotResponse = CopilotResponseSuccess | CopilotResponseError;
