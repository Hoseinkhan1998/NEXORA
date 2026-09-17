"use client";

import * as React from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/features/auth";
import { logoutAction } from "@/features/auth/actions/logout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";

interface UserMenuProps {
  user: User | null;
  profile: UserProfile | null;
}

export function UserMenu({ user, profile }: UserMenuProps) {
  const [isLoggingOut, startTransition] = React.useTransition();

  const displayName = profile?.fullName || user?.user_metadata?.full_name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const avatarUrl = profile?.avatarUrl || user?.user_metadata?.avatar_url || "";

  // Generate fallback initials
  const initials = React.useMemo(() => {
    if (displayName && displayName !== "User") {
      const parts = displayName.trim().split(" ");
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return displayName.slice(0, 2).toUpperCase();
    }
    if (displayEmail) {
      return displayEmail.slice(0, 2).toUpperCase();
    }
    return "NX";
  }, [displayName, displayEmail]);

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="User account menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-[11px] font-medium bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/app/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
