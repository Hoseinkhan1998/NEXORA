"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, ShieldAlert, User, Eye, Trash2, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceMemberWithProfile, WorkspaceRole } from "../../types";
import { updateMemberRoleAction, removeMemberAction } from "../../actions/manage-member";

interface MembersTableProps {
  members: WorkspaceMemberWithProfile[];
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  workspaceId: string;
  workspaceSlug: string;
}

export function MembersTable({
  members,
  currentUserId,
  currentUserRole,
  workspaceId,
  workspaceSlug,
}: MembersTableProps) {
  const router = useRouter();
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberWithProfile | null>(null);
  const [isPendingRole, startRoleTransition] = useTransition();
  const [isPendingRemove, startRemoveTransition] = useTransition();

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin";
  const canManage = isOwner || isAdmin;

  const handleRoleChange = (targetUserId: string, newRole: "admin" | "member" | "viewer") => {
    startRoleTransition(async () => {
      const res = await updateMemberRoleAction(workspaceId, workspaceSlug, {
        targetUserId,
        newRole,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update role.");
        return;
      }

      toast.success(`Role updated to ${newRole}`);
    });
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove) return;

    startRemoveTransition(async () => {
      const isSelf = memberToRemove.userId === currentUserId;
      const res = await removeMemberAction(workspaceId, workspaceSlug, memberToRemove.userId);

      if (!res.success) {
        toast.error(res.error || "Failed to remove member.");
        return;
      }

      toast.success(isSelf ? "You have left the workspace" : "Member removed from workspace");
      setMemberToRemove(null);

      if (isSelf) {
        router.push("/app");
        router.refresh();
      }
    });
  };

  const getRoleIcon = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />;
      case "admin":
        return <Shield className="h-3.5 w-3.5 text-indigo-500" />;
      case "member":
        return <User className="h-3.5 w-3.5 text-muted-foreground" />;
      case "viewer":
        return <Eye className="h-3.5 w-3.5 text-muted-foreground/70" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          const isTargetOwner = m.role === "owner";
          const isTargetAdmin = m.role === "admin";

          // Can caller change this target's role?
          let canEditRole = false;
          if (canManage && !isTargetOwner) {
            if (isOwner) canEditRole = true;
            else if (isAdmin && !isTargetAdmin) canEditRole = true;
          }

          // Can caller remove this target?
          let canRemove = false;
          if (isSelf && !isTargetOwner)
            canRemove = true; // self-leave
          else if (isOwner && !isTargetOwner) canRemove = true;
          else if (isAdmin && !isTargetOwner && !isTargetAdmin) canRemove = true;

          const initials = (m.fullName || m.email || "U").slice(0, 2).toUpperCase();

          return (
            <div
              key={m.id}
              className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors text-xs gap-3"
            >
              {/* Member Profile info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar className="h-8 w-8 rounded-full border border-border shrink-0">
                  {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.fullName || m.email} />}
                  <AvatarFallback className="text-[11px] font-medium bg-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground truncate">
                      {m.fullName || m.email.split("@")[0]}
                    </span>
                    {isSelf && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0 font-mono">
                        You
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate block">
                    {m.email}
                  </span>
                </div>
              </div>

              {/* Role & Permissions control */}
              <div className="flex items-center gap-2 shrink-0">
                {isTargetOwner ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                    <ShieldAlert className="h-3 w-3" />
                    <span>Owner</span>
                  </div>
                ) : canEditRole ? (
                  <Select
                    defaultValue={m.role}
                    onValueChange={(val) =>
                      handleRoleChange(m.userId, val as "admin" | "member" | "viewer")
                    }
                    disabled={isPendingRole}
                  >
                    <SelectTrigger className="h-7 w-28 text-[11px] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isOwner && (
                        <SelectItem value="admin" className="text-xs">
                          Admin
                        </SelectItem>
                      )}
                      <SelectItem value="member" className="text-xs">
                        Member
                      </SelectItem>
                      <SelectItem value="viewer" className="text-xs">
                        Viewer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-[11px]">
                    {getRoleIcon(m.role)}
                    <span className="capitalize">{m.role}</span>
                  </div>
                )}

                {/* Remove / Leave Action Button */}
                {canRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMemberToRemove(m)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                    title={isSelf ? "Leave workspace" : "Remove member"}
                    aria-label={isSelf ? "Leave workspace" : "Remove member"}
                  >
                    {isSelf ? (
                      <LogOut className="h-3.5 w-3.5" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Remove Confirmation Dialog */}
      <Dialog open={Boolean(memberToRemove)} onOpenChange={(o) => !o && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-semibold">
              {memberToRemove?.userId === currentUserId ? "Leave Workspace" : "Remove Team Member"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {memberToRemove?.userId === currentUserId
                ? "Are you sure you want to leave this workspace? You will lose access to all projects, tasks, and discussions within it."
                : `Are you sure you want to remove ${memberToRemove?.fullName || memberToRemove?.email} from this workspace? They will immediately lose access.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMemberToRemove(null)}
              disabled={isPendingRemove}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmRemove}
              disabled={isPendingRemove}
              className="text-xs cursor-pointer gap-1.5"
            >
              {isPendingRemove && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {memberToRemove?.userId === currentUserId ? "Leave Workspace" : "Remove Member"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
