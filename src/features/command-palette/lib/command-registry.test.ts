import { describe, it, expect, vi } from "vitest";
import { buildCommandActions } from "./command-registry";
import { formatShortcut } from "./platform";

describe("Command Palette Registry & Platform Engine", () => {
  describe("formatShortcut", () => {
    it("formats shortcut with key combination", () => {
      const shortcut = formatShortcut("K");
      expect(shortcut).toMatch(/^(⌘K|Ctrl\+K)$/);
    });
  });

  describe("buildCommandActions", () => {
    const onNavigate = vi.fn();
    const onOpenCopilot = vi.fn();
    const onToggleTheme = vi.fn();
    const onOpenNotifications = vi.fn();

    const sampleWorkspaces = [
      { id: "ws-1", name: "Engineering", slug: "engineering", role: "owner" as const },
      { id: "ws-2", name: "Marketing", slug: "marketing", role: "member" as const },
    ];

    const sampleProjects = [
      { id: "p-1", name: "iOS App", slug: "ios-app", color: "#6366f1" },
      { id: "p-2", name: "Design System", slug: "design-system", color: "#10b981" },
    ];

    it("generates correct action groups (actions, navigation, projects, workspaces)", () => {
      const actions = buildCommandActions({
        workspaceSlug: "engineering",
        workspaces: sampleWorkspaces,
        projects: sampleProjects,
        onNavigate,
        onOpenCopilot,
        onToggleTheme,
        onOpenNotifications,
      });

      const groups = new Set(actions.map((a) => a.group));
      expect(groups.has("actions")).toBe(true);
      expect(groups.has("navigation")).toBe(true);
      expect(groups.has("projects")).toBe(true);
      expect(groups.has("workspaces")).toBe(true);
    });

    it("wires quick actions to their respective callbacks", () => {
      const actions = buildCommandActions({
        workspaceSlug: "engineering",
        workspaces: sampleWorkspaces,
        projects: sampleProjects,
        onNavigate,
        onOpenCopilot,
        onToggleTheme,
        onOpenNotifications,
      });

      const copilotAction = actions.find((a) => a.id === "action-copilot");
      expect(copilotAction).toBeDefined();
      copilotAction?.onSelect();
      expect(onOpenCopilot).toHaveBeenCalledTimes(1);

      const themeAction = actions.find((a) => a.id === "action-theme");
      expect(themeAction).toBeDefined();
      themeAction?.onSelect();
      expect(onToggleTheme).toHaveBeenCalledTimes(1);

      const notifAction = actions.find((a) => a.id === "action-notifications");
      expect(notifAction).toBeDefined();
      notifAction?.onSelect();
      expect(onOpenNotifications).toHaveBeenCalledTimes(1);
    });

    it("maps dynamic projects into project group with workspace scoped paths", () => {
      const actions = buildCommandActions({
        workspaceSlug: "engineering",
        workspaces: sampleWorkspaces,
        projects: sampleProjects,
        onNavigate,
        onOpenCopilot,
        onToggleTheme,
        onOpenNotifications,
      });

      const projectActions = actions.filter((a) => a.group === "projects");
      expect(projectActions).toHaveLength(2);

      const p1Action = projectActions.find((a) => a.id === "project-p-1");
      expect(p1Action?.label).toBe("iOS App");
      p1Action?.onSelect();
      expect(onNavigate).toHaveBeenCalledWith("/app/engineering/projects/p-1");
    });

    it("omits current workspace from the workspace switcher group", () => {
      const actions = buildCommandActions({
        workspaceSlug: "engineering",
        workspaces: sampleWorkspaces, // contains 'engineering' and 'marketing'
        projects: sampleProjects,
        onNavigate,
        onOpenCopilot,
        onToggleTheme,
        onOpenNotifications,
      });

      const wsActions = actions.filter((a) => a.group === "workspaces");
      expect(wsActions).toHaveLength(1);
      expect(wsActions[0]?.label).toBe("Switch to Marketing");
      wsActions[0]?.onSelect();
      expect(onNavigate).toHaveBeenCalledWith("/app/marketing");
    });
  });
});
