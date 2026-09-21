import * as React from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/features/auth";
import type { WorkspaceWithRole } from "@/features/workspaces/types";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ProductTourProvider } from "@/features/tour";

interface AppShellProps {
  children: React.ReactNode;
  user: User | null;
  profile: UserProfile | null;
  currentWorkspace?: WorkspaceWithRole | null;
  workspaces?: WorkspaceWithRole[];
}

export function AppShell({
  children,
  user,
  profile,
  currentWorkspace = null,
  workspaces = [],
}: AppShellProps) {
  return (
    <ProductTourProvider
      workspaceId={currentWorkspace?.id}
      userId={user?.id}
      role={currentWorkspace?.role}
    >
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
          <Sidebar
            className="h-full w-full"
            currentWorkspace={currentWorkspace}
            workspaces={workspaces}
          />
        </div>

        {/* Main Content Viewport */}
        <div className="flex flex-1 flex-col md:pl-64 min-w-0">
          <Topbar
            user={user}
            profile={profile}
            currentWorkspace={currentWorkspace}
            workspaces={workspaces}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="mx-auto max-w-6xl w-full">{children}</div>
          </main>
        </div>
      </div>
    </ProductTourProvider>
  );
}
