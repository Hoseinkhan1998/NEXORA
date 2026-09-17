"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ListTodo, Columns3, TableProperties, CalendarDays, Clock } from "lucide-react";
import type { ProjectView } from "../types/views";
import { PROJECT_VIEWS, PROJECT_VIEW_CONFIGS } from "../types/views";

interface ProjectViewSwitcherProps {
  currentView: ProjectView;
  onViewChange: (view: ProjectView) => void;
  className?: string;
}

const VIEW_ICONS: Record<ProjectView, React.ComponentType<{ className?: string }>> = {
  list: ListTodo,
  kanban: Columns3,
  table: TableProperties,
  calendar: CalendarDays,
  timeline: Clock,
};

export function ProjectViewSwitcher({
  currentView,
  onViewChange,
  className,
}: ProjectViewSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Project Views"
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/50 text-muted-foreground",
        className
      )}
    >
      {PROJECT_VIEWS.map((view) => {
        const config = PROJECT_VIEW_CONFIGS[view];
        const Icon = VIEW_ICONS[view];
        const isActive = currentView === view;

        return (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`project-view-${view}`}
            onClick={() => onViewChange(view)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              isActive
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              !config.implemented && "opacity-75"
            )}
            title={config.implemented ? `${config.label} View` : `${config.label} View (Roadmap)`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{config.label}</span>
            {!config.implemented && (
              <span className="hidden md:inline-block text-[9px] font-mono text-muted-foreground/70 bg-muted px-1 rounded">
                Soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
