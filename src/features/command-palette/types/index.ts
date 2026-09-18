import type { ComponentType } from "react";

export type CommandGroupType = "actions" | "navigation" | "projects" | "workspaces";

export interface CommandActionItem {
  id: string;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  shortcut?: string;
  group: CommandGroupType;
  keywords?: string[];
  onSelect: () => void;
}

export interface CommandProjectItem {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface CommandWorkspaceItem {
  id: string;
  name: string;
  slug: string;
}
