"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PresenceUser } from "../types";

interface UseProjectPresenceProps {
  projectId: string;
  currentUser: PresenceUser | null;
}

export function useProjectPresence({ projectId, currentUser }: UseProjectPresenceProps) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!projectId || !currentUser) return;

    const supabase = createClient();
    const channel = supabase.channel(`project:${projectId}:presence`, {
      config: {
        presence: {
          key: currentUser.userId,
        },
      },
    });

    const updatePresenceState = () => {
      const state = channel.presenceState<PresenceUser>();
      const userMap = new Map<string, PresenceUser>();

      for (const presenceEntries of Object.values(state)) {
        for (const entry of presenceEntries) {
          if (entry && entry.userId) {
            // Keep latest or first occurrence
            if (!userMap.has(entry.userId)) {
              userMap.set(entry.userId, entry);
            }
          }
        }
      }

      // Always include current user if not yet synced in state
      if (!userMap.has(currentUser.userId)) {
        userMap.set(currentUser.userId, currentUser);
      }

      // Sort: current user first, then others alphabetically
      const users = Array.from(userMap.values()).sort((a, b) => {
        if (a.userId === currentUser.userId) return -1;
        if (b.userId === currentUser.userId) return 1;
        const nameA = a.fullName || a.email;
        const nameB = b.fullName || b.email;
        return nameA.localeCompare(nameB);
      });

      setOnlineUsers(users);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        updatePresenceState();
      })
      .on("presence", { event: "join" }, () => {
        updatePresenceState();
      })
      .on("presence", { event: "leave" }, () => {
        updatePresenceState();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(currentUser);
        }
      });

    return () => {
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
    };
  }, [projectId, currentUser]);

  return {
    onlineUsers,
  };
}
