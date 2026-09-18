import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  Sparkles,
  SunMoon,
  Bell,
  Building2,
} from "lucide-react";
import type { CommandActionItem, CommandProjectItem, CommandWorkspaceItem } from "../types";

interface BuildCommandRegistryParams {
  workspaceSlug: string;
  workspaces?: CommandWorkspaceItem[];
  projects?: CommandProjectItem[];
  onNavigate: (url: string) => void;
  onOpenCopilot: () => void;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
}

export function buildCommandActions({
  workspaceSlug,
  workspaces = [],
  projects = [],
  onNavigate,
  onOpenCopilot,
  onToggleTheme,
  onOpenNotifications,
}: BuildCommandRegistryParams): CommandActionItem[] {
  const actions: CommandActionItem[] = [];

  // 1. Quick Actions Group
  actions.push(
    {
      id: "action-copilot",
      label: "Ask AI Copilot",
      description: "Ask questions about projects and workload",
      icon: Sparkles,
      shortcut: "⌘J",
      group: "actions",
      keywords: ["ai", "copilot", "ask", "assistant", "help"],
      onSelect: onOpenCopilot,
    },
    {
      id: "action-theme",
      label: "Toggle Theme",
      description: "Switch between light and dark mode",
      icon: SunMoon,
      shortcut: "⌘T",
      group: "actions",
      keywords: ["theme", "dark", "light", "mode", "color"],
      onSelect: onToggleTheme,
    },
    {
      id: "action-notifications",
      label: "View Notifications",
      description: "Open in-app notification center",
      icon: Bell,
      group: "actions",
      keywords: ["notifications", "alerts", "inbox", "bell", "unread"],
      onSelect: onOpenNotifications,
    }
  );

  // 2. Navigation Group
  actions.push(
    {
      id: "nav-overview",
      label: "Overview",
      description: "Workspace dashboard and recent activity",
      icon: LayoutDashboard,
      group: "navigation",
      keywords: ["overview", "home", "dashboard"],
      onSelect: () => onNavigate(`/app/${workspaceSlug}`),
    },
    {
      id: "nav-projects",
      label: "Projects",
      description: "View and manage all workspace projects",
      icon: FolderKanban,
      group: "navigation",
      keywords: ["projects", "initiatives", "boards"],
      onSelect: () => onNavigate(`/app/${workspaceSlug}/projects`),
    },
    {
      id: "nav-analytics",
      label: "Analytics",
      description: "Metrics, KPI trends, and workload performance",
      icon: BarChart3,
      group: "navigation",
      keywords: ["analytics", "metrics", "charts", "kpi", "performance"],
      onSelect: () => onNavigate(`/app/${workspaceSlug}/analytics`),
    },
    {
      id: "nav-settings",
      label: "Settings",
      description: "Workspace configuration and member roles",
      icon: Settings,
      group: "navigation",
      keywords: ["settings", "admin", "roles", "members", "config"],
      onSelect: () => onNavigate(`/app/${workspaceSlug}/settings`),
    }
  );

  // 3. Dynamic Projects Group
  for (const project of projects) {
    actions.push({
      id: `project-${project.id}`,
      label: project.name,
      description: `Jump to project`,
      icon: FolderKanban,
      group: "projects",
      keywords: ["project", project.name.toLowerCase(), project.slug],
      onSelect: () => onNavigate(`/app/${workspaceSlug}/projects/${project.id}`),
    });
  }

  // 4. Workspaces Group (Switching)
  for (const ws of workspaces) {
    if (ws.slug !== workspaceSlug) {
      actions.push({
        id: `workspace-${ws.id}`,
        label: `Switch to ${ws.name}`,
        description: `/${ws.slug}`,
        icon: Building2,
        group: "workspaces",
        keywords: ["workspace", "tenant", ws.name.toLowerCase(), ws.slug],
        onSelect: () => onNavigate(`/app/${ws.slug}`),
      });
    }
  }

  return actions;
}
