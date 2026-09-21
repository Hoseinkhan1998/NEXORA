"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TaskWithDetails, WorkspaceAssignee } from "@/features/tasks/types";
import type { RealtimeConnectionStatus } from "../types";

interface UseProjectRealtimeProps {
  projectId: string;
  initialTasks: TaskWithDetails[];
  assignees: WorkspaceAssignee[];
}

export function useProjectRealtime({
  projectId,
  initialTasks,
  assignees,
}: UseProjectRealtimeProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(initialTasks);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>("connecting");

  // Keep a map of assignees for quick synchronous lookup on realtime events
  const assigneeMap = useMemo(() => {
    const map = new Map<string, WorkspaceAssignee>();
    for (const a of assignees) {
      map.set(a.userId, a);
    }
    return map;
  }, [assignees]);

  // Synchronize state when initialTasks prop updates from server revalidation
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  if (prevInitialTasks !== initialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`project:${projectId}:tasks`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const rawNew = payload.new as Record<string, unknown>;
            setTasks((prev) => {
              // Avoid duplicates if task already exists
              if (prev.some((t) => t.id === rawNew.id)) {
                return prev;
              }

              const assigneeId = rawNew.assignee_id as string | null;
              const matchedAssignee = assigneeId ? assigneeMap.get(assigneeId) : null;
              const assigneeObj = matchedAssignee
                ? {
                    id: matchedAssignee.userId,
                    email: matchedAssignee.email,
                    full_name: matchedAssignee.fullName,
                    avatar_url: matchedAssignee.avatarUrl,
                  }
                : null;

              const newTask: TaskWithDetails = {
                id: rawNew.id as string,
                workspace_id: rawNew.workspace_id as string,
                project_id: rawNew.project_id as string,
                title: rawNew.title as string,
                description: (rawNew.description as string | null) || null,
                status: rawNew.status as TaskWithDetails["status"],
                priority: rawNew.priority as TaskWithDetails["priority"],
                assignee_id: assigneeId,
                created_by: rawNew.created_by as string,
                due_date: (rawNew.due_date as string | null) || null,
                position: Number(rawNew.position) || 0,
                created_at: rawNew.created_at as string,
                updated_at: rawNew.updated_at as string,
                assignee: assigneeObj,
                assignees: assigneeObj ? [assigneeObj] : [],
              };

              return [...prev, newTask];
            });
          } else if (payload.eventType === "UPDATE") {
            const rawNew = payload.new as Record<string, unknown>;
            setTasks((prev) =>
              prev.map((t) => {
                if (t.id !== rawNew.id) return t;

                const assigneeId = rawNew.assignee_id as string | null;
                const matchedAssignee = assigneeId ? assigneeMap.get(assigneeId) : null;

                return {
                  ...t,
                  title: rawNew.title as string,
                  description: (rawNew.description as string | null) || null,
                  status: rawNew.status as TaskWithDetails["status"],
                  priority: rawNew.priority as TaskWithDetails["priority"],
                  assignee_id: assigneeId,
                  due_date: (rawNew.due_date as string | null) || null,
                  position: Number(rawNew.position) || t.position,
                  updated_at: rawNew.updated_at as string,
                  assignee:
                    assigneeId !== t.assignee_id
                      ? matchedAssignee
                        ? {
                            id: matchedAssignee.userId,
                            email: matchedAssignee.email,
                            full_name: matchedAssignee.fullName,
                            avatar_url: matchedAssignee.avatarUrl,
                          }
                        : null
                      : t.assignee,
                };
              })
            );
          } else if (payload.eventType === "DELETE") {
            const rawOld = payload.old as Record<string, unknown>;
            setTasks((prev) => prev.filter((t) => t.id !== rawOld.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
        } else if (status === "TIMED_OUT") {
          setConnectionStatus("disconnected");
        } else if (status === "CLOSED") {
          setConnectionStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, assigneeMap]);

  return {
    tasks,
    setTasks,
    connectionStatus,
  };
}
