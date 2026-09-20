"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck } from "lucide-react";
import type { WorkspaceMemberWithProfile, WorkspaceInvitation, WorkspaceRole } from "../../types";
import { MembersTable } from "./members-table";
import { InviteMemberDialog } from "./invite-member-dialog";
import { PendingInvitationsList } from "./pending-invitations-list";

interface MembersCardProps {
  members: WorkspaceMemberWithProfile[];
  invitations: WorkspaceInvitation[];
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  workspaceId: string;
  workspaceSlug: string;
}

export function MembersCard({
  members,
  invitations,
  currentUserId,
  currentUserRole,
  workspaceId,
  workspaceSlug,
}: MembersCardProps) {
  const canInvite = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Team Members</CardTitle>
              <Badge variant="secondary" className="text-xs font-mono">
                {members.length} {members.length === 1 ? "member" : "members"}
              </Badge>
            </div>
            <CardDescription>
              Manage members, assign granular roles, and invite new team collaborators.
            </CardDescription>
          </div>

          {canInvite && (
            <InviteMemberDialog
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <MembersTable
          members={members}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />

        <PendingInvitationsList
          invitations={invitations}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          currentUserRole={currentUserRole}
        />

        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground border border-border/50 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-foreground">Role Permissions Overview:</span>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li><strong className="text-foreground">Owner:</strong> Full workspace ownership, member management, and billing control.</li>
              <li><strong className="text-foreground">Admin:</strong> Invite members, update roles, create, and manage projects.</li>
              <li><strong className="text-foreground">Member:</strong> Create, edit, and collaborate on tasks and project boards.</li>
              <li><strong className="text-foreground">Viewer:</strong> Read-only access to tasks, timeline, and project updates.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
