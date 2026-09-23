import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/features/workspaces";
import { getWorkspaceProjects, CreateProjectDialog } from "@/features/projects";
import { getWorkspaceAssignees } from "@/features/tasks/queries/get-tasks";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Calendar,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Archive,
} from "lucide-react";

interface WorkspacePageProps {
  params: Promise<{ workspace: string }>;
}

export async function generateMetadata({ params }: WorkspacePageProps): Promise<Metadata> {
  const { workspace: slug } = await params;
  const ws = await getWorkspaceBySlug(slug);

  if (!ws) {
    return {
      title: "Workspace Not Found",
    };
  }

  return {
    title: `${ws.name} | NEXORA`,
    description: `Workspace overview for ${ws.name}`,
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace: slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);

  if (!workspace) {
    notFound();
  }

  // Fetch workspace projects, members, and task stats in parallel
  const [projects, supabase, workspaceMembers] = await Promise.all([
    getWorkspaceProjects(workspace.id),
    createClient(),
    getWorkspaceAssignees(workspace.id),
  ]);

  const canCreate = workspace.role !== "viewer";

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, project_id, status")
    .eq("workspace_id", workspace.id);

  const tasks = tasksData || [];

  // Pre-aggregate task metrics per project
  const projectStatsMap = new Map<
    string,
    { total: number; done: number; inProgress: number; percent: number }
  >();

  for (const project of projects) {
    const projectTasks = tasks.filter((t) => t.project_id === project.id);
    const total = projectTasks.length;
    const done = projectTasks.filter((t) => t.status === "done").length;
    const inProgress = projectTasks.filter((t) => t.status === "in_progress").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    projectStatsMap.set(project.id, { total, done, inProgress, percent });
  }

  const totalWorkspaceTasks = tasks.length;
  const completedWorkspaceTasks = tasks.filter((t) => t.status === "done").length;
  const overallWorkspacePercent =
    totalWorkspaceTasks > 0
      ? Math.round((completedWorkspaceTasks / totalWorkspaceTasks) * 100)
      : 0;

  const formattedDate = new Date(workspace.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{workspace.name}</h1>
            <Badge variant="secondary" className="capitalize font-mono text-[10px]">
              {workspace.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Multi-tenant workspace hub. Access all scoped projects, track team deliverables, and manage organizational settings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canCreate && (
            <CreateProjectDialog
              workspaceId={workspace.id}
              workspaceSlug={workspace.slug}
              workspaceMembers={workspaceMembers}
              redirectToProject={false}
              trigger={
                <Button size="sm" className="h-9 gap-1.5 shadow-xs">
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Project</span>
                </Button>
              }
            />
          )}
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 shadow-xs">
            <Link href={`/app/${workspace.slug}/projects`} prefetch={true}>
              <span>Explore Projects</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* High-Level Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Total workspace initiatives</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Deliverables
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedWorkspaceTasks} / {totalWorkspaceTasks}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {overallWorkspacePercent}% completed tasks
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Organization Role
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{workspace.role}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Verified PostgreSQL RLS</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Initialized On
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold mt-1">{formattedDate}</div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">Slug: /{workspace.slug}</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Showcase Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Projects & Initiatives
              </h2>
              <Badge variant="outline" className="text-xs font-mono">
                {projects.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct access to project boards, task tracking, timelines, and calendars.
            </p>
          </div>

          {projects.length > 0 && (
            <Link
              href={`/app/${workspace.slug}/projects`}
              prefetch={true}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View All Projects</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed bg-muted/20 text-center py-12 px-4 shadow-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-3 ring-8 ring-primary/5">
              <FolderKanban className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No projects in this workspace yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Get started by creating your first project to organize tasks, track milestones, and collaborate with your team.
            </p>
            {canCreate ? (
              <CreateProjectDialog
                workspaceId={workspace.id}
                workspaceSlug={workspace.slug}
                workspaceMembers={workspaceMembers}
                redirectToProject={false}
                trigger={
                  <Button size="sm" className="h-8 text-xs gap-1.5 shadow-xs">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Create First Project</span>
                  </Button>
                }
              />
            ) : (
              <Button asChild size="sm" className="h-8 text-xs gap-1.5 shadow-xs">
                <Link href={`/app/${workspace.slug}/projects`} prefetch={true}>
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span>View Projects</span>
                </Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const stats = projectStatsMap.get(project.id) || {
                total: 0,
                done: 0,
                inProgress: 0,
                percent: 0,
              };
              const isArchived = project.status === "archived";
              const projectColor = project.color || "#3B82F6";

              return (
                <Link
                  key={project.id}
                  href={`/app/${workspace.slug}/projects/${project.id}`}
                  prefetch={true}
                  className="block group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl transition-all"
                >
                  <Card className="h-full flex flex-col justify-between border-border/70 hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-card hover:bg-accent/5 cursor-pointer">
                    <CardHeader className="pb-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full shadow-xs"
                            style={{ backgroundColor: projectColor }}
                            aria-hidden="true"
                          />
                          <CardTitle className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </CardTitle>
                        </div>

                        <Badge
                          variant={isArchived ? "secondary" : "outline"}
                          className="text-[9px] uppercase font-mono px-1.5 py-0 shrink-0"
                        >
                          {isArchived ? (
                            <span className="flex items-center gap-1">
                              <Archive className="h-2.5 w-2.5" />
                              Archived
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </Badge>
                      </div>

                      <CardDescription className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                        {project.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-3 pt-0 space-y-2.5">
                      {/* Task Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-medium">Progress</span>
                          <span className="font-mono">{stats.percent}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${stats.percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Task Stats Row */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>
                            <strong>{stats.done}</strong>/{stats.total} done
                          </span>
                        </div>

                        {stats.inProgress > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                            <span>
                              <strong>{stats.inProgress}</strong> in progress
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 pb-3 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                      <div className="flex items-center gap-1 font-mono text-[10px] bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                        <FolderKanban className="h-3 w-3 shrink-0" />
                        <span className="truncate">/{project.slug}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary text-xs font-medium group-hover:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Multi-Tenancy Architecture Card */}
      <Card className="shadow-xs border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Multi-Tenancy Foundation Status
            </CardTitle>
            <Badge
              variant="outline"
              className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            >
              TASK 005 Active
            </Badge>
          </div>
          <CardDescription>
            Row Level Security (RLS) and membership isolation are active for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Workspace ID</span>
            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[280px]">
              {workspace.id}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Tenant Isolation</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Row Level Security Enforced
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-xs">
            <span className="text-muted-foreground">Scoped Routing</span>
            <span className="font-mono text-[11px] text-foreground bg-muted/60 px-1.5 py-0.5 rounded">
              /app/{workspace.slug}
              {"/*"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
