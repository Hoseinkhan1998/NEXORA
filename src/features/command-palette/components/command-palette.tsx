"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { buildCommandActions } from "../lib/command-registry";
import type { CommandProjectItem, CommandWorkspaceItem } from "../types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  workspaceId?: string;
  workspaces?: CommandWorkspaceItem[];
}

export function CommandPalette({
  open,
  onOpenChange,
  workspaceSlug,
  workspaceId,
  workspaces = [],
}: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [projects, setProjects] = useState<CommandProjectItem[]>([]);

  // Fetch active projects for this workspace when dialog opens
  useEffect(() => {
    if (!open || !workspaceId) return;

    let isMounted = true;
    async function loadProjects() {
      try {
        const res = await fetch(`/api/projects?workspaceId=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.projects) {
            setProjects(
              data.projects.map(
                (p: { id: string; name: string; slug: string; color: string | null }) => ({
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  color: p.color,
                })
              )
            );
          }
        }
      } catch (err) {
        console.error("[CommandPalette] Failed to load projects:", err);
      }
    }

    loadProjects();
    return () => {
      isMounted = false;
    };
  }, [open, workspaceId]);

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  const handleOpenCopilot = () => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent("nexora:open-copilot"));
  };

  const handleToggleTheme = () => {
    onOpenChange(false);
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleOpenNotifications = () => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent("nexora:open-notifications"));
  };

  const actions = buildCommandActions({
    workspaceSlug,
    workspaces,
    projects,
    onNavigate: handleNavigate,
    onOpenCopilot: handleOpenCopilot,
    onToggleTheme: handleToggleTheme,
    onOpenNotifications: handleOpenNotifications,
  });

  const quickActions = actions.filter((a) => a.group === "actions");
  const navActions = actions.filter((a) => a.group === "navigation");
  const projectActions = actions.filter((a) => a.group === "projects");
  const workspaceActions = actions.filter((a) => a.group === "workspaces");

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands, projects, or navigation..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {quickActions.length > 0 && (
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.id}
                  value={`${action.label} ${action.keywords?.join(" ") || ""}`}
                  onSelect={action.onSelect}
                  className="gap-2.5"
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{action.label}</span>
                    {action.description && (
                      <span className="text-[10px] text-muted-foreground">
                        {action.description}
                      </span>
                    )}
                  </div>
                  {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {navActions.length > 0 && (
          <CommandGroup heading="Navigation">
            {navActions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.id}
                  value={`${action.label} ${action.keywords?.join(" ") || ""}`}
                  onSelect={action.onSelect}
                  className="gap-2.5"
                >
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="font-medium text-foreground">{action.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {projectActions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projectActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={`${action.label} ${action.keywords?.join(" ") || ""}`}
                    onSelect={action.onSelect}
                    className="gap-2.5"
                  >
                    {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{action.label}</span>
                      <span className="text-[10px] text-muted-foreground">Project</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {workspaceActions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch Workspace">
              {workspaceActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={`${action.label} ${action.keywords?.join(" ") || ""}`}
                    onSelect={action.onSelect}
                    className="gap-2.5"
                  >
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{action.label}</span>
                      {action.description && (
                        <span className="text-[10px] text-muted-foreground">
                          {action.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
