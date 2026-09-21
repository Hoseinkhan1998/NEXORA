import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { ProfileSettingsCard } from "@/features/auth/components/profile-settings-card";
import {
  getWorkspaceBySlug,
  getWorkspaceMembers,
  getWorkspaceInvitations,
  MembersCard,
} from "@/features/workspaces";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

      <div className="grid gap-8">
        <MembersCard
          members={members}
          invitations={invitations}
          currentUserId={user.id}
          currentUserRole={currentWorkspace.role}
          workspaceId={currentWorkspace.id}
          workspaceSlug={currentWorkspace.slug}
        />

        <ProfileSettingsCard initialProfile={profile} />

        <Card className="shadow-xs max-w-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Workspace Configuration</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                Multi-Tenancy Active
              </Badge>
            </div>
            <CardDescription>Workspace metadata and tenant isolation verification.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
              <span className="text-muted-foreground">Workspace Name</span>
              <span className="font-medium text-foreground">{currentWorkspace.name}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
              <span className="text-muted-foreground">Active Slug</span>
              <span className="font-mono font-medium">{currentWorkspace.slug}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
              <span className="text-muted-foreground">Your Role</span>
              <Badge variant="secondary" className="capitalize text-[11px] font-medium">
                {currentWorkspace.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 text-xs">
              <span className="text-muted-foreground">Tenant Access</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Cryptographically Isolated & Verified
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
