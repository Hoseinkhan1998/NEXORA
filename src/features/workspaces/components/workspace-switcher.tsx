"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import type { WorkspaceWithRole } from "../types";

interface WorkspaceSwitcherProps {
  currentWorkspace: WorkspaceWithRole | null;
  workspaces: WorkspaceWithRole[];
  onSelect?: () => void;
}

export function WorkspaceSwitcher({
  currentWorkspace,
  workspaces,
  onSelect,
}: WorkspaceSwitcherProps) {
  const router = useRouter();

  function handleSelect(slug: string) {
    if (onSelect) {
      onSelect();
    }
    router.push(`/app/${slug}`);
  }

  function handleCreateNew() {
    if (onSelect) {
      onSelect();
    }
    router.push("/app/onboarding");
  }

  const displayName = currentWorkspace?.name || "Select Workspace";
  const displayRole = currentWorkspace?.role || "member";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Current workspace: ${displayName}. Click to switch workspace.`}
          className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card/60 p-2 text-left shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-xs shadow-xs">
              {initial || <Building2 className="h-3.5 w-3.5" />}
            </div>
            <div className="flex flex-col min-w-0 leading-none">
              <span className="truncate text-xs font-semibold text-foreground">{displayName}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                {displayRole}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <Badge
              variant="secondary"
              className="text-[9px] px-1 py-0 h-4 uppercase font-mono tracking-wider"
            >
              {displayRole}
            </Badge>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60 p-1.5 shadow-lg" sideOffset={6}>
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 py-1">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuGroup className="space-y-0.5">
          {workspaces.map((ws) => {
            const isCurrent = currentWorkspace?.id === ws.id;
            const wsInitial = ws.name.charAt(0).toUpperCase();

            return (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleSelect(ws.slug)}
                className="flex items-center justify-between cursor-pointer py-2 px-2 rounded-md"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-foreground font-medium text-xs">
                    {wsInitial}
                  </div>
                  <div className="flex flex-col min-w-0 leading-none">
                    <span className="truncate text-xs font-medium text-foreground">{ws.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize mt-0.5">
                      {ws.role}
                    </span>
                  </div>
                </div>

                {isCurrent && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={handleCreateNew}
          className="flex items-center gap-2 cursor-pointer py-1.5 px-2 text-xs text-muted-foreground hover:text-foreground font-medium rounded-md"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-background">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span>Create workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
