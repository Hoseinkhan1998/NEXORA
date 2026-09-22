import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { getWorkspaceBySlug, getUserWorkspaces, generateSlug } from "@/features/workspaces";
import { createClient } from "@/lib/supabase/server";
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
    const matchedByName = userWorkspaces.find((w) => generateSlug(w.name) === slug);
    if (matchedByName) {
      redirect(`/app/${matchedByName.slug}`);
    }
    const defaultWorkspace = userWorkspaces[0];
    if (!defaultWorkspace) {
      redirect("/app/onboarding");
    }
    // Safe redirect without leaking workspace metadata to unauthorized users
    redirect(`/app/${defaultWorkspace.slug}`);
  }

  // Auto-sync slug if workspace name was updated but slug was still the old one
  const expectedSlug = generateSlug(currentWorkspace.name);
  if (
    currentWorkspace.slug !== expectedSlug &&
    (currentWorkspace.role === "owner" || currentWorkspace.role === "admin")
  ) {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", expectedSlug)
      .neq("id", currentWorkspace.id)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from("workspaces")
        .update({ slug: expectedSlug, updated_at: new Date().toISOString() })
        .eq("id", currentWorkspace.id);

      currentWorkspace.slug = expectedSlug;
    }
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
