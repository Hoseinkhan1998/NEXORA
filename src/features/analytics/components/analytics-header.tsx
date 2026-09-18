"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, Calendar, FolderKanban } from "lucide-react";
import type { DateRangePreset } from "../types";
import type { Project } from "@/features/projects/types";

interface AnalyticsHeaderProps {
  workspaceName: string;
  workspaceSlug: string;
  projects: Project[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  selectedDateRange: DateRangePreset;
  onDateRangeChange: (range: DateRangePreset) => void;
}

export function AnalyticsHeader({
  workspaceName,
  workspaceSlug,
  projects,
  selectedProjectId,
  onProjectChange,
  selectedDateRange,
  onDateRangeChange,
}: AnalyticsHeaderProps) {
  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time metrics and workload intelligence for{" "}
          <span className="font-semibold text-foreground">{workspaceName}</span>{" "}
          <span className="font-mono text-xs text-muted-foreground">({`/${workspaceSlug}`})</span>
        </p>
      </div>

      {/* Global Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Project Selector */}
        <div className="w-[180px]">
          <Select value={selectedProjectId} onValueChange={onProjectChange}>
            <SelectTrigger className="h-9 text-xs" aria-label="Filter by project">
              <div className="flex items-center gap-2 truncate">
                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Projects" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Projects ({activeProjects.length})
              </SelectItem>
              {activeProjects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color || "#6366f1" }}
                    />
                    <span className="truncate">{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Selector */}
        <div className="w-[150px]">
          <Select
            value={selectedDateRange}
            onValueChange={(val) => onDateRangeChange(val as DateRangePreset)}
          >
            <SelectTrigger className="h-9 text-xs" aria-label="Select date range">
              <div className="flex items-center gap-2 truncate">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Date Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d" className="text-xs">
                Last 7 Days
              </SelectItem>
              <SelectItem value="30d" className="text-xs">
                Last 30 Days
              </SelectItem>
              <SelectItem value="90d" className="text-xs">
                Last 90 Days
              </SelectItem>
              <SelectItem value="all" className="text-xs">
                All Time
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
