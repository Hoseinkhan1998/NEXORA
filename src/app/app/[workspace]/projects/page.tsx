import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/features/workspaces";
import { getWorkspaceProjects, ProjectListView } from "@/features/projects";
import { getWorkspaceAssignees } from "@/features/tasks/queries/get-tasks";

interface ProjectsPageProps {
  params: Promise<{ workspace: string }>;
}

export async function generateMetadata({ params }: ProjectsPageProps): Promise<Metadata> {
  const { workspace: slug } = await params;
  const ws = await getWorkspaceBySlug(slug);

  if (!ws) {
    return {
      title: "Projects | NEXORA",
    };
  }

  return {
    title: `Projects — ${ws.name} | NEXORA`,
    description: `Projects and initiatives in ${ws.name}`,
  };
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { workspace: slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);

  if (!workspace) {
    notFound();
  }

  const [projects, workspaceMembers] = await Promise.all([
    getWorkspaceProjects(workspace.id),
    getWorkspaceAssignees(workspace.id),
  ]);

  return (
    <ProjectListView
      projects={projects}
      workspaceId={workspace.id}
      workspaceSlug={workspace.slug}
      userRole={workspace.role}
      workspaceMembers={workspaceMembers}
    />
  );
}
