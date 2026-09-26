"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Check, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { getOrCreateShareableInviteAction } from "../../actions/invite-member";

interface InviteMemberDialogProps {
  workspaceId: string;
  workspaceSlug: string;
  trigger?: React.ReactNode;
}

export function InviteMemberDialog({
  workspaceId,
  workspaceSlug,
  trigger,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [linkRole, setLinkRole] = useState<"admin" | "member" | "viewer">("member");
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [shareableToken, setShareableToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPendingLink, startLinkTransition] = useTransition();

  // Fetch or generate shareable link when dialog opens or parameters change
  useEffect(() => {
    if (open && !shareableToken) {
      startLinkTransition(async () => {
        const res = await getOrCreateShareableInviteAction(
          workspaceId,
          workspaceSlug,
          linkRole,
          isSingleUse
        );
        if (res.success && res.invitationToken) {
          setShareableToken(res.invitationToken);
        }
      });
    }
  }, [open, linkRole, isSingleUse, workspaceId, workspaceSlug, shareableToken]);

  const handleCopyLink = () => {
    if (!shareableToken) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/invite/${shareableToken}`;

    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareOnTelegram = () => {
    if (!shareableToken) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/invite/${shareableToken}`;
    const text = encodeURIComponent(`You've been invited to join ${workspaceSlug} on NEXORA!`);
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${text}`;
    window.open(tgShareUrl, "_blank");
  };

  const roleDescriptions: Record<string, string> = {
    admin: "Can manage projects, tasks, and invite team members.",
    member: "Can create, update, and complete tasks.",
    viewer: "Read-only access to boards, tasks, and analytics.",
  };

  const currentInviteUrl = shareableToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${shareableToken}`
    : "Generating link...";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5 cursor-pointer shadow-xs">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite Member</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base font-semibold">Invite to Workspace</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Share this link with teammates to let them join this workspace with their chosen role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Role for Link Joiners</Label>
            <Select
              value={linkRole}
              onValueChange={(val) => {
                const newRole = val as "admin" | "member" | "viewer";
                setLinkRole(newRole);
                setShareableToken(null);
              }}
              disabled={isPendingLink}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member" className="text-xs">
                  Member (Recommended)
                </SelectItem>
                <SelectItem value="viewer" className="text-xs">
                  Viewer
                </SelectItem>
                <SelectItem value="admin" className="text-xs">
                  Admin
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">{roleDescriptions[linkRole]}</p>
          </div>

          <div className="flex items-start space-x-2.5 p-2.5 rounded-lg border border-border/50 bg-muted/20">
            <Checkbox
              id="single-use-checkbox"
              checked={isSingleUse}
              onCheckedChange={(checked) => {
                setIsSingleUse(Boolean(checked));
                setShareableToken(null);
              }}
              disabled={isPendingLink}
              className="mt-0.5"
            />
            <div className="grid gap-0.5 leading-tight">
              <Label
                htmlFor="single-use-checkbox"
                className="text-xs font-medium cursor-pointer"
              >
                Single-use link (Expires after first join)
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Automatically invalidates this link as soon as one person accepts it.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Shareable Join Link</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={currentInviteUrl}
                className="h-9 text-xs font-mono select-all bg-muted/30"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                disabled={!shareableToken || isPendingLink}
                className="h-9 px-3 shrink-0 cursor-pointer gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareOnTelegram}
              disabled={!shareableToken || isPendingLink}
              className="w-full gap-1.5 text-xs text-sky-500 hover:text-sky-600 hover:bg-sky-500/10 border-sky-500/30"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Share via Telegram</span>
            </Button>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
            Anyone with this link can create an account or sign in to join this workspace with
            the assigned role. Link is valid for 30 days.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
