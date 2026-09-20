export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberWithProfile {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string | null;
  role: "admin" | "member" | "viewer";
  token: string;
  invitedByName?: string;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}
