import * as React from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/features/auth";
import { ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { Breadcrumbs } from "./breadcrumbs";
import { UserMenu } from "./user-menu";
import type { WorkspaceWithRole } from "@/features/workspaces/types";

interface TopbarProps {
  user: User | null;
  profile: UserProfile | null;
  currentWorkspace?: WorkspaceWithRole | null;
  workspaces?: WorkspaceWithRole[];
}

export function Topbar({ user, profile, currentWorkspace, workspaces }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 backdrop-blur-xs px-4 sm:px-6">
      {/* Left section: mobile trigger + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav currentWorkspace={currentWorkspace} workspaces={workspaces} />
        <Breadcrumbs className="hidden sm:flex" />
      </div>

      {/* Right section: theme toggle + notifications placeholder + user menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notifications placeholder */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
          aria-label="Notifications (coming soon)"
          disabled
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Theme switcher */}
        <ThemeToggle />

        {/* User account dropdown */}
        <UserMenu user={user} profile={profile} />
      </div>
    </header>
  );
}
