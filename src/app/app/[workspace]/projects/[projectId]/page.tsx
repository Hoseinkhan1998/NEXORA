import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/features/workspaces";
import { getProjectById, getProjectMemberIds } from "@/features/projects/queries/get-projects";
import { EditProjectDialog } from "@/features/projects/components/edit-project-dialog";
import { ArchiveProjectButton } from "@/features/projects/components/archive-project-button";
import { getProjectTasks, getProjectAssignees, getWorkspaceAssignees } from "@/features/tasks/queries/get-tasks";
import { ProjectViewContent } from "@/features/projects/components/project-view-content";
import { parseProjectView } from "@/features/projects/types/views";
import { getCurrentUser } from "@/features/auth/utils/get-current-user";
import { getProjectActivities } from "@/features/collaboration/queries/get-project-activity";
import { ProjectPresence, ActivitySheet, ActivityFeed } from "@/features/collaboration";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, FolderKanban, ShieldCheck, History } from "lucide-react";
import { DynamicBreadcrumbSetter } from "@/components/layout/app-shell/breadcrumb-context";

interface ProjectDetailPageProps {
  params: Promise<{ workspace: string; projectId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { workspace: slug, projectId } = await params;
  const ws = await getWorkspaceBySlug(slug);
  if (!ws) return { title: "Project Not Found" };

  const project = await getProjectById(projectId, ws.id);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.name} — ${ws.name} | NEXORA`,
    description: project.description || `Project detail for ${project.name}`,
  };
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const { workspace: slug, projectId } = await params;
  const { view: rawView } = await searchParams;
  const initialView = parseProjectView(rawView);

  // 1. Resolve workspace
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  // 2. Resolve project strictly scoped to this workspace
  const project = await getProjectById(projectId, workspace.id);
  if (!project) {
    notFound();
  }

  // 3. Fetch project tasks, project assignees, workspace assignees, and activities in parallel
  const [tasks, assignees, workspaceMembers, projectMemberIds, { user, profile }, initialActivities] = await Promise.all([
    getProjectTasks(project.id, workspace.id),
    getProjectAssignees(project.id, workspace.id),
    getWorkspaceAssignees(workspace.id),
    getProjectMemberIds(project.id),
    getCurrentUser(),
    getProjectActivities(project.id, workspace.id, 50),
  ]);

  const currentUserPresence = user
    ? {
        userId: user.id,
        email: user.email || "",
        fullName: profile?.fullName || null,
        avatarUrl: profile?.avatarUrl || null,
        onlineAt: new Date().toISOString(),
      }
    : null;

  const isArchived = project.status === "archived";
  const projectColor = project.color || "#3B82F6";
  const canModify = workspace.role !== "viewer";

  const createdDateFormatted = new Date(project.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const updatedDateFormatted = new Date(project.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const creatorName =
    project.creator?.full_name || project.creator?.email?.split("@")[0] || "Team Member";

  return (
    <div className="space-y-6">
      <DynamicBreadcrumbSetter segment={project.id} label={project.name} />

      {/* Back link */}
      <div>
        <Link
          href={`/app/${workspace.slug}/projects`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Header Banner with Presence & Live Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="h-4 w-4 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: projectColor }}
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {project.name}
            </h1>
            <Badge
              variant={isArchived ? "secondary" : "outline"}
              className="text-[10px] uppercase font-mono px-2 py-0.5"
            >
              {isArchived ? (
                "Archived"
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Workspace:</span>
            <span className="font-semibold text-foreground">{workspace.name}</span>
            {project.description && (
              <>
                <span className="text-border">•</span>
                <span className="text-muted-foreground truncate max-w-[340px]">{project.description}</span>
              </>
            )}
          </div>
        </div>

        {/* Real-time Collaboration Controls: Presence & Activity */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ProjectPresence projectId={project.id} currentUser={currentUserPresence} />

          <ActivitySheet
            projectId={project.id}
            projectName={project.name}
            initialActivities={initialActivities}
          />

          {canModify && (
            <>
              <EditProjectDialog
                project={project}
                workspaceSlug={workspace.slug}
                workspaceMembers={workspaceMembers}
                initialMemberIds={projectMemberIds}
              />
              <ArchiveProjectButton
                projectId={project.id}
                workspaceId={workspace.id}
                workspaceSlug={workspace.slug}
                currentStatus={project.status}
              />
            </>
          )}
        </div>
      </div>

      {/* 1. Project Views Section (List, Kanban, Table, Calendar, Timeline) */}
      <div>
        <ProjectViewContent
          initialView={initialView}
          tasks={tasks}
          workspaceId={workspace.id}
          projectId={project.id}
          workspaceSlug={workspace.slug}
          assignees={assignees}
          userRole={workspace.role}
          currentUserId={user?.id}
        />
      </div>

      {/* 2. Embedded Activity & Initiative Metadata (2/3 and 1/3 Grid) */}
      <div className="grid gap-6 lg:grid-cols-3 pt-2">
        {/* Left Column (2/3 width): Recent Project Activity */}
        <div className="lg:col-span-2">
          <Card className="shadow-xs h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <span>Recent Project Activity</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  Live Stream
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Real-time audit stream of task transitions, reassignments, and team updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                <ActivityFeed projectId={project.id} initialActivities={initialActivities} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3 width): Initiative Metadata */}
        <div className="lg:col-span-1">
          <Card className="shadow-xs h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">Initiative Metadata</CardTitle>
              <CardDescription className="text-xs">Project attributes and governance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs pt-4">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Created By
                </span>
                <span
                  className="font-medium text-foreground truncate max-w-[140px]"
                  title={creatorName}
                >
                  {creatorName}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Created Date
                </span>
                <span className="font-medium text-foreground">{createdDateFormatted}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Last Updated
                </span>
                <span className="font-medium text-foreground">{updatedDateFormatted}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                  Color Theme
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: projectColor }}
                  />
                  <span className="font-mono text-foreground font-medium uppercase text-[11px]">
                    {projectColor}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  RLS Isolation
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Enforced</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
