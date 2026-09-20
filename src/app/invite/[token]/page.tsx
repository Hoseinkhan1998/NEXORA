import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import {
  getInvitationDetailsAction,
  getWorkspaceBySlug,
} from "@/features/workspaces";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { InviteAcceptanceCard } from "./invite-acceptance-card";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Workspace Invitation | NEXORA",
  description: "Accept your invitation to collaborate in NEXORA.",
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const details = await getInvitationDetailsAction(token);
  const { user, isAuthenticated } = await getCurrentUser();

  // If user is authenticated and already a member of this workspace, immediately navigate to the workspace
  if (isAuthenticated && details.workspaceSlug) {
    const ws = await getWorkspaceBySlug(details.workspaceSlug);
    if (ws) {
      redirect(`/app/${details.workspaceSlug}`);
    }
  }

  if (isAuthenticated && details.alreadyMember && details.workspaceSlug) {
    redirect(`/app/${details.workspaceSlug}`);
  }

  if (!details.valid) {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/60 text-center">
        <CardHeader className="space-y-3 pb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Invalid Invitation
            </CardTitle>
            <CardDescription className="text-sm">
              {details.error ||
                "This invitation link is invalid, has expired, or has already been revoked."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex justify-center pt-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={isAuthenticated ? "/app" : "/login"}>
              <ArrowLeft className="h-4 w-4" />
              <span>{isAuthenticated ? "Go to Dashboard" : "Return to Sign In"}</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (details.valid) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      cookieStore.set("nexora_pending_invite_token", token, {
        path: "/",
        maxAge: 86400,
        sameSite: "lax",
      });
    } catch (e) {
      console.warn("[InvitePage] Could not set pending invite cookie:", e);
    }
  }



  return (
    <InviteAcceptanceCard
      token={token}
      details={details}
      isAuthenticated={isAuthenticated}
      currentUserEmail={user?.email}
      isAlreadyMember={false}
    />
  );
}

