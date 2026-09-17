import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { getWorkspaceBySlug, getUserWorkspaces } from "@/features/workspaces";
import { AppShell } from "@/components/layout/app-shell";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ workspace: string }>;
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspace: slug } = await params;
  const { user, profile, isAuthenticated } = await getCurrentUser();

  if (!isAuthenticated) {
    redirect("/login");
  }

  // Server-side verification of workspace slug & membership authorization
  const currentWorkspace = await getWorkspaceBySlug(slug);

  if (!currentWorkspace) {
    // If not found or user is not a member, check if user has other workspaces
    const userWorkspaces = await getUserWorkspaces();
    const defaultWorkspace = userWorkspaces[0];
    if (!defaultWorkspace) {
      redirect("/app/onboarding");
    }
    // Safe redirect without leaking workspace metadata to unauthorized users
    redirect(`/app/${defaultWorkspace.slug}`);
  }

  const allWorkspaces = await getUserWorkspaces();

  return (
    <AppShell
      user={user}
      profile={profile}
      currentWorkspace={currentWorkspace}
      workspaces={allWorkspaces}
    >
      {children}
    </AppShell>
  );
}
