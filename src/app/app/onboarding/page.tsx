import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/features/auth";
import { getUserWorkspaces, OnboardingForm } from "@/features/workspaces";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Workspace | NEXORA",
  description: "Create your organization workspace to get started with NEXORA.",
};

export default async function OnboardingPage() {
  const { user } = await getCurrentUser();
  const workspaces = await getUserWorkspaces();

  const firstWorkspace = workspaces[0];
  const isFirstWorkspace = !firstWorkspace;

  if (isFirstWorkspace) {
    const cookieStore = await cookies();
    const pendingInvite = cookieStore.get("nexora_pending_invite_token")?.value;
    if (pendingInvite) {
      redirect(`/invite/${pendingInvite}`);
    }
  }


  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-border/60 px-6">
        <Link
          href={isFirstWorkspace ? "#" : `/app/${firstWorkspace.slug}`}
          className="flex items-center gap-2 font-bold tracking-tight text-lg text-foreground hover:opacity-90 transition-opacity"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs shadow-xs">
            N
          </div>
          <span>NEXORA</span>
        </Link>

        {!isFirstWorkspace && (
          <Link
            href={`/app/${firstWorkspace.slug}`}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to workspace</span>
          </Link>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg space-y-4">
          <OnboardingForm
            title={isFirstWorkspace ? "Create your first workspace" : "Create a new workspace"}
            description={
              isFirstWorkspace
                ? `Welcome ${user?.email ? user.email.split("@")[0] : ""}! Set up your organization to start collaborating with your team.`
                : "Add another workspace to organize a different team, client, or company."
            }
          />
        </div>
      </main>
    </div>
  );
}
