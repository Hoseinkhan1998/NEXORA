"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FolderKanban, ShieldAlert } from "lucide-react";
import { ProjectCard } from "./project-card";
import { ProjectEmptyState } from "./project-empty-state";
import { CreateProjectDialog } from "./create-project-dialog";
import type { ProjectWithCreator } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface ProjectListViewProps {
  projects: ProjectWithCreator[];
  workspaceId: string;
  workspaceSlug: string;
  userRole: WorkspaceRole;
}

export function ProjectListView({
  projects,
  workspaceId,
  workspaceSlug,
  userRole,
}: ProjectListViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("active");

  const canCreate = userRole !== "viewer";

  const filteredProjects = React.useMemo(() => {
    return projects.filter((project) => {
      // Tab filter
      if (activeTab === "active" && project.status !== "active") return false;
      if (activeTab === "archived" && project.status !== "archived") return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(query);
        const matchesDesc = project.description?.toLowerCase().includes(query);
        const matchesSlug = project.slug.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesSlug;
      }

      return true;
    });
  }, [projects, activeTab, searchQuery]);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const archivedCount = projects.filter((p) => p.status === "archived").length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
              <FolderKanban className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {activeCount} active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage projects, scope goals, and organize deliverables for this workspace.
          </p>
        </div>

        {canCreate ? (
          <CreateProjectDialog workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-md border border-border/50">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            <span>Viewer mode (Read-only)</span>
          </div>
        )}
      </div>

      {/* Tabs & Search Controls */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="active" className="text-xs">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              Archived ({archivedCount})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {filteredProjects.length === 0 ? (
            <ProjectEmptyState
              title={
                searchQuery
                  ? "No matching projects"
                  : activeTab === "archived"
                    ? "No archived projects"
                    : "No projects in this workspace"
              }
              description={
                searchQuery
                  ? `No projects found matching "${searchQuery}". Try a different keyword.`
                  : activeTab === "archived"
                    ? "Archived projects will appear here when completed or retired."
                    : "Create your first project to start organizing sprints and deliverables."
              }
              action={
                canCreate && !searchQuery && activeTab !== "archived" ? (
                  <CreateProjectDialog workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} workspaceSlug={workspaceSlug} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
