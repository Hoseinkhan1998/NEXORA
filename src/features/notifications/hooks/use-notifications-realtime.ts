"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { NotificationItem } from "../types";

interface UseNotificationsRealtimeProps {
  userId?: string;
  workspaceId?: string;
  initialNotifications?: NotificationItem[];
  initialUnreadCount?: number;
}

export function useNotificationsRealtime({
  userId,
  workspaceId,
  initialNotifications = [],
  initialUnreadCount = 0,
}: UseNotificationsRealtimeProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);

  // Synchronize state during render when initial props update
  const [prevInitialNotifications, setPrevInitialNotifications] = useState(initialNotifications);
  if (prevInitialNotifications !== initialNotifications) {
    setPrevInitialNotifications(initialNotifications);
    setNotifications(initialNotifications);
  }

  const [prevInitialUnreadCount, setPrevInitialUnreadCount] = useState(initialUnreadCount);
  if (prevInitialUnreadCount !== initialUnreadCount) {
    setPrevInitialUnreadCount(initialUnreadCount);
    setUnreadCount(initialUnreadCount);
  }

  const markLocalRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllLocalRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channelName = `user-notifications:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          const raw = payload.new as Record<string, unknown>;

          // Only accept for current workspace if specified
          if (workspaceId && raw.workspace_id !== workspaceId) {
            return;
          }

          // Fetch actor profile for incoming notification
          let actor = null;
          if (raw.actor_id) {
            const { data: actorProfile } = await supabase
              .from("profiles")
              .select("id, full_name, email, avatar_url")
              .eq("id", raw.actor_id)
              .single();

            if (actorProfile) {
              actor = {
                id: actorProfile.id,
                fullName: actorProfile.full_name,
                email: actorProfile.email,
                avatarUrl: actorProfile.avatar_url,
              };
            }
          }

          const newNotification: NotificationItem = {
            id: raw.id as string,
            workspace_id: raw.workspace_id as string,
            recipient_id: raw.recipient_id as string,
            actor_id: raw.actor_id as string,
            type: raw.type as NotificationItem["type"],
            title: raw.title as string,
            message: raw.message as string,
            entity_type: raw.entity_type as string,
            entity_id: raw.entity_id as string,
            project_id: (raw.project_id as string) || null,
            is_read: Boolean(raw.is_read),
            created_at: raw.created_at as string,
            actor,
          };

          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Trigger lightweight Sonner toast notification
          toast(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const updatedId = raw.id as string;
          const isRead = Boolean(raw.is_read);

          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedId ? { ...n, is_read: isRead } : n))
          );

          if (isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, workspaceId]);

  return {
    notifications,
    unreadCount,
    markLocalRead,
    markAllLocalRead,
  };
}
