"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PresenceUser } from "../../types";

interface PresenceAvatarStackProps {
  users: PresenceUser[];
  maxVisible?: number;
}

export function PresenceAvatarStack({ users, maxVisible = 4 }: PresenceAvatarStackProps) {
  if (users.length === 0) return null;

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center -space-x-2 overflow-hidden py-1">
        {visibleUsers.map((user) => {
          const displayName = user.fullName || user.email.split("@")[0] || "User";
          const initials = (displayName[0] || "U").toUpperCase();

          return (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <div className="relative inline-block cursor-pointer transition-transform hover:z-10 hover:scale-105">
                  <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border/50 text-[10px]">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[9px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
                    aria-hidden="true"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <span className="font-semibold">{displayName}</span> (online now)
              </TooltipContent>
            </Tooltip>
          );
        })}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground ring-1 ring-border/50 cursor-pointer">
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-xs">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Also online:</p>
                {users.slice(maxVisible).map((u) => (
                  <p key={u.userId} className="text-muted-foreground">
                    {u.fullName || u.email}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
