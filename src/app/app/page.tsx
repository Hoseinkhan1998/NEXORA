import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { getUserWorkspaces } from "@/features/workspaces";

export default async function AppIndexPage() {
  const { isAuthenticated } = await getCurrentUser();

  if (!isAuthenticated) {
    redirect("/login");
  }

  const workspaces = await getUserWorkspaces();
  const firstWorkspace = workspaces[0];

  if (!firstWorkspace) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const pendingInvite = cookieStore.get("nexora_pending_invite_token")?.value;
    if (pendingInvite) {
      redirect(`/invite/${pendingInvite}`);
    }
    redirect("/app/onboarding");
  }

  // Deterministically redirect to the user's primary/first accessible workspace
  redirect(`/app/${firstWorkspace.slug}`);
}
