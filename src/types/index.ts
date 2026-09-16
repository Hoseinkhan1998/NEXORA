import type { ReactNode } from "react";

export interface ChildrenProps {
  children: ReactNode;
}

export interface WorkspaceParams {
  workspace: string;
}

export interface ProjectParams extends WorkspaceParams {
  projectId: string;
}
