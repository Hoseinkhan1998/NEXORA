"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Link2, Copy, Check, Trash2, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceInvitation, WorkspaceRole } from "../../types";
import { revokeInvitationAction } from "../../actions/invite-member";

interface PendingInvitationsListProps {
  invitations: WorkspaceInvitation[];
  workspaceId: string;
  workspaceSlug: string;
  currentUserRole: WorkspaceRole;
}

export function PendingInvitationsList({
  invitations,
  workspaceId,
  workspaceSlug,
  currentUserRole,
}: PendingInvitationsListProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  if (!invitations || invitations.length === 0) {
    return null;
  }

  const handleCopyLink = async (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedToken(token);
      toast.success("Invitation link copied to clipboard!");
      setTimeout(() => {
        setCopiedToken((prev) => (prev === token ? null : prev));
      }, 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleRevoke = (invitationId: string) => {
    setRevokingId(invitationId);
    startTransition(async () => {
      const res = await revokeInvitationAction(workspaceId, workspaceSlug, invitationId);
      setRevokingId(null);
      if (!res.success) {
        toast.error(res.error || "Failed to revoke invitation.");
        return;
      }
      toast.success("Invitation revoked successfully.");
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Pending Invitations ({invitations.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Invitations that have been dispatched but not yet accepted.
          </p>
        </div>
      </div>

      <div className="rounded-md border divide-y divide-border bg-card">
        {invitations.map((inv) => {
          const isEmailInvite = Boolean(inv.email);
          const isRevoking = isPending && revokingId === inv.id;
          const isCopied = copiedToken === inv.token;
          const expiresDate = new Date(inv.expiresAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={inv.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {isEmailInvite ? (
                    <Mail className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {isEmailInvite ? inv.email : "Shareable Join Link"}
                    </span>
                    <Badge variant={getRoleBadgeVariant(inv.role)} className="capitalize text-[10px] px-1.5 py-0 h-4">
                      {inv.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>Expires {expiresDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleCopyLink(inv.token)}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>

                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    disabled={isRevoking}
                    onClick={() => handleRevoke(inv.id)}
                    title="Revoke invitation"
                  >
                    {isRevoking ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
    </div>
  );
}
