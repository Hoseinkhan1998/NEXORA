import { redirect } from "next/navigation";
import { getUserWorkspaces } from "@/features/workspaces";

export default async function ProjectsRedirect() {
  const workspaces = await getUserWorkspaces();
  const firstWorkspace = workspaces[0];

  if (!firstWorkspace) {
    redirect("/app/onboarding");
  }

  redirect(`/app/${firstWorkspace.slug}/projects`);
}
