"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getPrimaryNavItems, getSecondaryNavItems, type NavItem } from "./nav-config";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";
import type { WorkspaceWithRole } from "@/features/workspaces/types";
import { Badge } from "@/components/ui/badge";

export interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  currentWorkspace?: WorkspaceWithRole | null;
  workspaces?: WorkspaceWithRole[];
}

export function Sidebar({
  className,
  onNavigate,
  currentWorkspace = null,
  workspaces = [],
}: SidebarProps) {
  const pathname = usePathname();

  const primaryItems = React.useMemo(
    () => getPrimaryNavItems(currentWorkspace?.slug),
    [currentWorkspace?.slug]
  );
  const secondaryItems = React.useMemo(
    () => getSecondaryNavItems(currentWorkspace?.slug),
    [currentWorkspace?.slug]
  );

  function isItemActive(item: NavItem): boolean {
    if (!pathname) return false;
    if (item.exact) {
      return pathname === item.href;
    }
    // Match root or nested paths (e.g. /app/projects and /app/projects/123)
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const brandHref = currentWorkspace ? `/app/${currentWorkspace.slug}` : "/app";

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card/40 backdrop-blur-xs select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-border/60">
        <Link
          href={brandHref}
          onClick={onNavigate}
          className="flex items-center gap-2 font-bold tracking-tight text-lg text-foreground hover:opacity-90 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs shadow-xs">
            N
          </div>
          <span>NEXORA</span>
        </Link>
      </div>

      {/* Real Workspace Switcher */}
      <div className="p-3 border-b border-border/40">
        <WorkspaceSwitcher
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
          onSelect={onNavigate}
        />
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Platform
          </div>
          <nav className="space-y-1" aria-label="Primary Navigation">
            {primaryItems.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-accent-foreground"
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant={active ? "secondary" : "outline"}
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Preferences
          </div>
          <nav className="space-y-1" aria-label="Secondary Navigation">
            {secondaryItems.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              if (item.disabled) {
                return (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed select-none"
                    aria-disabled="true"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono">Soon</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-accent-foreground"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-border/40">
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/40 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
          <span className="font-mono text-[10px] opacity-70">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
