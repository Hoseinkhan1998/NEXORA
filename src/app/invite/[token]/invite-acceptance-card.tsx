"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, ArrowRight, LogIn, UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { acceptInvitationAction, type InvitationDetailsResult } from "@/features/workspaces/actions/accept-invitation";

interface InviteAcceptanceCardProps {
  token: string;
  details: InvitationDetailsResult;
  isAuthenticated: boolean;
  currentUserEmail?: string;
  isAlreadyMember?: boolean;
}

export function InviteAcceptanceCard({
  token,
  details,
  isAuthenticated,
  currentUserEmail,
  isAlreadyMember,
}: InviteAcceptanceCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(false);

  const handleAccept = () => {
    startTransition(async () => {
      const res = await acceptInvitationAction(token);
      if (!res.success) {
        toast.error(res.error || "Failed to accept invitation.");
        return;
      }

      setJoined(true);
      toast.success("Welcome to the team! Redirecting to workspace...");
      const targetSlug = res.workspaceSlug || details.workspaceSlug;
      setTimeout(() => {
        router.push(`/app/${targetSlug}`);
        router.refresh();
      }, 1000);
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-border/60">
      <CardHeader className="text-center space-y-3 pb-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
          <Building2 className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <Badge variant="secondary" className="capitalize text-xs font-mono mb-1">
            {details.role || "Member"} Invitation
          </Badge>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Join {details.workspaceName}
          </CardTitle>
          <CardDescription className="text-sm">
            <strong className="text-foreground">{details.inviterName}</strong> has invited you to
            collaborate in their NEXORA workspace.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/40 border border-border/50 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Workspace</span>
            <span className="font-semibold text-foreground">{details.workspaceName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Assigned Role</span>
            <Badge variant="outline" className="capitalize text-[10px]">
              {details.role}
            </Badge>
          </div>
          {details.email && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Invited Email</span>
              <span className="font-mono text-muted-foreground">{details.email}</span>
            </div>
          )}
        </div>

        {isAuthenticated && currentUserEmail && details.email && currentUserEmail.toLowerCase() !== details.email.toLowerCase() && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2 text-center">
            You are signed in as <span className="font-mono">{currentUserEmail}</span>. Accepting will add this account to the workspace.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-2">
        {joined ? (
          <Button disabled className="w-full gap-2 bg-emerald-600 text-white">
            <CheckCircle2 className="h-4 w-4" />
            Joined Successfully
          </Button>
        ) : isAlreadyMember ? (
          <Button asChild className="w-full gap-2">
            <Link href={`/app/${details.workspaceSlug}`}>
              <span>Open Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : isAuthenticated ? (
          <Button
            onClick={handleAccept}
            disabled={isPending}
            className="w-full gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Joining Workspace...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Accept Invitation & Join</span>
              </>
            )}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <Button asChild variant="default" className="gap-1.5">
              <Link href={`/login?returnTo=/invite/${token}`}>
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-1.5">
              <Link href={`/signup?returnTo=/invite/${token}`}>
                <UserPlus className="h-4 w-4" />
                <span>Sign Up</span>
              </Link>
            </Button>
          </div>
        )}

        {!isAuthenticated && (
          <p className="text-[11px] text-center text-muted-foreground">
            Sign in with an existing account or create a new one to accept.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
