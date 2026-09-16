export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  APP: {
    ROOT: "/app",
    WORKSPACE: (workspaceSlug: string) => `/app/${workspaceSlug}`,
    PROJECTS: (workspaceSlug: string) => `/app/${workspaceSlug}/projects`,
    PROJECT_DETAIL: (workspaceSlug: string, projectId: string) =>
      `/app/${workspaceSlug}/projects/${projectId}`,
    ANALYTICS: (workspaceSlug: string) => `/app/${workspaceSlug}/analytics`,
    SETTINGS: (workspaceSlug: string) => `/app/${workspaceSlug}/settings`,
  },
} as const;

export const APP_NAME = "NEXORA";
