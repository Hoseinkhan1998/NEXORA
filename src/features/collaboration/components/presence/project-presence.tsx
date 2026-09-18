"use client";

import { useProjectPresence } from "../../hooks/use-project-presence";
import { PresenceAvatarStack } from "./presence-avatar-stack";
import type { PresenceUser } from "../../types";

interface ProjectPresenceProps {
  projectId: string;
  currentUser: PresenceUser | null;
}

export function ProjectPresence({ projectId, currentUser }: ProjectPresenceProps) {
  const { onlineUsers } = useProjectPresence({ projectId, currentUser });

  if (onlineUsers.length === 0) return null;

  return (
    <div
      className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted/40 border border-border/50 text-xs text-muted-foreground shadow-2xs"
      role="status"
      aria-label={`${onlineUsers.length} members active in this project`}
    >
      <div className="flex items-center gap-1.5 font-medium">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] text-foreground font-semibold">{onlineUsers.length}</span>
        <span className="hidden sm:inline text-[11px] text-muted-foreground">online</span>
      </div>

      <div className="h-3.5 w-px bg-border/80" />

      <PresenceAvatarStack users={onlineUsers} maxVisible={4} />
    </div>
  );
}
