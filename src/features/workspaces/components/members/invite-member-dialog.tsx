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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { UserPlus, Mail, Link as LinkIcon, Check, Copy, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  inviteMemberByEmailAction,
  getOrCreateShareableInviteAction,
} from "../../actions/invite-member";

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
  const [activeTab, setActiveTab] = useState("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [emailRole, setEmailRole] = useState<"admin" | "member" | "viewer">("member");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<{ email: string; inviteUrl: string; token: string } | null>(null);
  const [isPendingEmail, startEmailTransition] = useTransition();

  // Shareable link state
  const [linkRole, setLinkRole] = useState<"admin" | "member" | "viewer">("member");
  const [shareableToken, setShareableToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPendingLink, startLinkTransition] = useTransition();

  // Fetch or generate shareable link when tab opens
  useEffect(() => {
    if (open && activeTab === "link" && !shareableToken) {
      startLinkTransition(async () => {
        const res = await getOrCreateShareableInviteAction(workspaceId, workspaceSlug, linkRole);
        if (res.success && res.invitationToken) {
          setShareableToken(res.invitationToken);
        }
      });
    }
  }, [open, activeTab, linkRole, workspaceId, workspaceSlug, shareableToken]);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError("Email address is required.");
      return;
    }

    setEmailError(null);
    startEmailTransition(async () => {
      const res = await inviteMemberByEmailAction(workspaceId, workspaceSlug, {
        email: email.trim(),
        role: emailRole,
      });

      if (!res.success) {
        setEmailError(res.error || "Failed to send invitation.");
        return;
      }

      if (res.emailSent) {
        toast.success(`Invitation email sent to ${email}`);
        setEmail("");
        setEmailRole("member");
        setCreatedInvite(null);
        setOpen(false);
      } else {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const fallbackUrl = res.inviteUrl || `${origin}/invite/${res.invitationToken}`;
        setCreatedInvite({
          email: email.trim(),
          inviteUrl: fallbackUrl,
          token: res.invitationToken || "",
        });
        toast.success("Invitation created successfully!");
      }
    });
  };


  const handleCopyLink = () => {
    if (!shareableToken) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}/invite/${shareableToken}`;

    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const roleDescriptions: Record<string, string> = {
    admin: "Can manage projects, tasks, and invite team members.",
    member: "Can create, update, and complete tasks.",
    viewer: "Read-only access to boards, tasks, and analytics.",
  };

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
            Add team members to collaborate on projects and tasks in this workspace.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-2 w-full h-9">
            <TabsTrigger value="email" className="text-xs gap-1.5 cursor-pointer">
              <Mail className="h-3.5 w-3.5" />
              <span>Email Invite</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="text-xs gap-1.5 cursor-pointer">
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Shareable Link</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: By Email */}
          <TabsContent value="email" className="space-y-4 pt-3">
            {createdInvite ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>Invitation Ready for {createdInvite.email}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Automated email service is not configured in the environment. Send this direct invitation link to your teammate:
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Direct Invitation Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={createdInvite.inviteUrl}
                      className="font-mono text-xs h-9 bg-muted/40 selection:bg-primary"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(createdInvite.inviteUrl);
                        toast.success("Invitation link copied to clipboard!");
                      }}
                      className="h-9 px-3 gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCreatedInvite(null);
                      setEmail("");
                    }}
                    className="text-xs cursor-pointer"
                  >
                    Invite Another
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setCreatedInvite(null);
                      setEmail("");
                      setOpen(false);
                    }}
                    className="text-xs cursor-pointer"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email" className="text-xs font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPendingEmail}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invite-role" className="text-xs font-medium">
                    Workspace Role
                  </Label>
                  <Select
                    value={emailRole}
                    onValueChange={(val) => setEmailRole(val as "admin" | "member" | "viewer")}
                    disabled={isPendingEmail}
                  >
                    <SelectTrigger id="invite-role" className="h-9 text-xs">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="text-xs">
                        Admin
                      </SelectItem>
                      <SelectItem value="member" className="text-xs">
                        Member
                      </SelectItem>
                      <SelectItem value="viewer" className="text-xs">
                        Viewer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {roleDescriptions[emailRole]}
                  </p>
                </div>

                {emailError && (
                  <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="text-xs cursor-pointer"
                    disabled={isPendingEmail}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPendingEmail || !email.trim()}
                    className="text-xs cursor-pointer gap-1.5"
                  >
                    {isPendingEmail && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Send Invitation</span>
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>


          {/* TAB 2: Shareable Link */}
          <TabsContent value="link" className="space-y-4 pt-3">
            <div className="space-y-3">
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
                <p className="text-[11px] text-muted-foreground">
                  {roleDescriptions[linkRole]}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Shareable Join Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={
                      shareableToken
                        ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${shareableToken}`
                        : "Generating link..."
                    }
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

              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                Anyone with this link can create an account or sign in to join this workspace with the assigned role. Link is valid for 30 days.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
