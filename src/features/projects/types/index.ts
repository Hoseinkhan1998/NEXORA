export type ProjectStatus = "active" | "archived";

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  color: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreatorProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ProjectWithCreator extends Project {
  creator: ProjectCreatorProfile | null;
}

export interface ProjectWithWorkspace extends Project {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: "lead" | "member";
  createdAt: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  memberIds?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  status?: ProjectStatus;
  memberIds?: string[];
}

export * from "./views";
