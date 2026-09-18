import * as React from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/features/auth";
import { ThemeToggle } from "@/components/shared";
import { MobileNav } from "./mobile-nav";
import { Breadcrumbs } from "./breadcrumbs";
import { UserMenu } from "./user-menu";
import type { WorkspaceWithRole } from "@/features/workspaces/types";
import { CopilotTrigger } from "@/features/ai/components/copilot-trigger";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import { CommandBar } from "@/features/command-palette";

interface TopbarProps {
  user: User | null;
  profile: UserProfile | null;
  currentWorkspace?: WorkspaceWithRole | null;
  workspaces?: WorkspaceWithRole[];
}

export function Topbar({ user, profile, currentWorkspace, workspaces = [] }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 backdrop-blur-xs px-4 sm:px-6">
      {/* Left section: mobile trigger + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav currentWorkspace={currentWorkspace} workspaces={workspaces} />
        <Breadcrumbs className="hidden sm:flex" />
      </div>

      {/* Center: Command Palette Trigger & Dialog */}
      {currentWorkspace && (
        <div className="flex items-center justify-center flex-1 max-w-xs mx-3">
          <CommandBar
            workspaceSlug={currentWorkspace.slug}
            workspaceId={currentWorkspace.id}
            workspaces={workspaces.map((w) => ({
              id: w.id,
              name: w.name,
              slug: w.slug,
              role: w.role,
            }))}
          />
        </div>
      )}

      {/* Right section: copilot trigger + theme toggle + notifications + user menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* AI Copilot trigger */}
        <CopilotTrigger
          workspaceSlug={currentWorkspace?.slug}
          workspaceName={currentWorkspace?.name}
        />

        {/* In-app Notification Center */}
        <NotificationCenter
          userId={user?.id}
          workspaceId={currentWorkspace?.id}
          workspaceSlug={currentWorkspace?.slug}
        />

        {/* Theme switcher */}
        <ThemeToggle />

        {/* User account dropdown */}
        <UserMenu user={user} profile={profile} />
      </div>
    </header>
  );
}
