import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { ProfileSettingsCard } from "@/features/auth/components/profile-settings-card";
import {
  getWorkspaceBySlug,
  getWorkspaceMembers,
  getWorkspaceInvitations,
  MembersCard,
  WorkspaceConfigCard,
} from "@/features/workspaces";
import { Settings } from "lucide-react";

interface SettingsPageProps {
  params: Promise<{ workspace: string }>;
}

export const metadata: Metadata = {
  title: "Settings | NEXORA",
  description: "Workspace configuration, member management, and user preferences.",
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: slug } = await params;
  const { user, profile } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const currentWorkspace = await getWorkspaceBySlug(slug);
  if (!currentWorkspace) {
    redirect("/app");
  }

  const canManageInvitations =
    currentWorkspace.role === "owner" || currentWorkspace.role === "admin";

  const [members, invitations] = await Promise.all([
    getWorkspaceMembers(currentWorkspace.id),
    canManageInvitations ? getWorkspaceInvitations(currentWorkspace.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your profile, team members, and configuration for workspace{" "}
          <span className="font-mono text-xs font-semibold text-foreground">/{slug}</span>
        </p>
      </div>

      <div className="space-y-8">
        {/* Full-Width Members Card */}
        <MembersCard
          members={members}
          invitations={invitations}
          currentUserId={user.id}
          currentUserRole={currentWorkspace.role}
          workspaceId={currentWorkspace.id}
          workspaceSlug={currentWorkspace.slug}
        />

        {/* Side-by-Side: Profile Settings & Workspace Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ProfileSettingsCard initialProfile={profile} />

          <WorkspaceConfigCard
            workspaceId={currentWorkspace.id}
            workspaceName={currentWorkspace.name}
            workspaceSlug={currentWorkspace.slug}
            currentUserRole={currentWorkspace.role}
          />
        </div>
      </div>
    </div>
  );
}
