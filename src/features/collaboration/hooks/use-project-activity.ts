"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProjectActivityWithActor } from "../types";

interface UseProjectActivityProps {
  projectId: string;
  initialActivities: ProjectActivityWithActor[];
}

export function useProjectActivity({ projectId, initialActivities }: UseProjectActivityProps) {
  const [activities, setActivities] = useState<ProjectActivityWithActor[]>(initialActivities);

  // Synchronize state when initialActivities prop updates from server revalidation
  const [prevInitial, setPrevInitial] = useState(initialActivities);
  if (prevInitial !== initialActivities) {
    setPrevInitial(initialActivities);
    setActivities(initialActivities);
  }

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`project:${projectId}:activity`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_activity",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const raw = payload.new as Record<string, unknown>;

          // Fetch actor profile for live activity
          let actor = {
            id: raw.actor_id as string,
            email: "",
            fullName: null as string | null,
            avatarUrl: null as string | null,
          };

          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, email, full_name, avatar_url")
              .eq("id", raw.actor_id as string)
              .single();

            if (profile) {
              actor = {
                id: profile.id,
                email: profile.email || "",
                fullName: profile.full_name || null,
                avatarUrl: profile.avatar_url || null,
              };
            }
          } catch (err) {
            console.warn("[useProjectActivity] Could not hydrate actor profile:", err);
          }

          const newActivity: ProjectActivityWithActor = {
            id: raw.id as string,
            workspace_id: raw.workspace_id as string,
            project_id: raw.project_id as string,
            actor_id: raw.actor_id as string,
            entity_type: raw.entity_type as "task" | "project",
            entity_id: raw.entity_id as string,
            action: raw.action as ProjectActivityWithActor["action"],
            metadata: (raw.metadata || {}) as ProjectActivityWithActor["metadata"],
            created_at: raw.created_at as string,
            actor,
          };

          setActivities((prev) => [newActivity, ...prev.filter((a) => a.id !== newActivity.id)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    activities,
    setActivities,
  };
}
