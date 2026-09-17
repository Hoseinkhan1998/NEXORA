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
    redirect("/app/onboarding");
  }

  // Deterministically redirect to the user's primary/first accessible workspace
  redirect(`/app/${firstWorkspace.slug}`);
}
