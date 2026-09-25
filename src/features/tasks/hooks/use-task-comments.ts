"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TaskComment } from "../types/comment";

interface CacheEntry {
  comments: TaskComment[];
  nextCursor: string | null;
  hasMore: boolean;
  timestamp: number;
}

// In-memory client cache to make task opening instant (0ms delay)
const taskCommentsCache = new Map<string, CacheEntry>();

interface UseTaskCommentsProps {
  taskId: string;
  workspaceId: string;
  initialComments?: TaskComment[];
}

export function useTaskComments({
  taskId,
  workspaceId,
  initialComments,
}: UseTaskCommentsProps) {
  const cached = taskCommentsCache.get(taskId);

  const [comments, setComments] = useState<TaskComment[]>(() => {
    if (initialComments && initialComments.length > 0) return initialComments;
    if (cached) return cached.comments;
    return [];
  });

  const [isLoadingInitial, setIsLoadingInitial] = useState(() => {
    if (initialComments && initialComments.length > 0) return false;
    if (cached) return false; // Instant display from cache!
    return true;
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(() => {
    if (cached) return cached.hasMore;
    return true;
  });
  const nextCursorRef = useRef<string | null>(cached ? cached.nextCursor : null);

  // Fetch initial 10 comments with stale-while-revalidate caching
  useEffect(() => {
    let isCancelled = false;

    async function loadInitial() {
      const hasCached = taskCommentsCache.has(taskId);
      if (!hasCached) {
        setIsLoadingInitial(true);
      }

      try {
        const res = await fetch(`/api/tasks/${taskId}/comments?limit=10`);
        if (!res.ok) throw new Error("Failed to load comments");
        const data = await res.json();

        if (!isCancelled) {
          const freshComments: TaskComment[] = data.comments || [];
          setComments((prev) => {
            // Keep optimistic or newly received realtime messages
            const freshIds = new Set(freshComments.map((c) => c.id));
            const pending = prev.filter((c) => !freshIds.has(c.id));
            const merged = [...freshComments, ...pending];

            taskCommentsCache.set(taskId, {
              comments: merged,
              nextCursor: data.nextCursor,
              hasMore: Boolean(data.hasMore),
              timestamp: Date.now(),
            });

            return merged;
          });

          nextCursorRef.current = data.nextCursor;
          setHasMore(Boolean(data.hasMore));
        }
      } catch (err) {
        console.error("[useTaskComments] Initial fetch error:", err);
      } finally {
        if (!isCancelled) {
          setIsLoadingInitial(false);
        }
      }
    }

    if (!initialComments || initialComments.length === 0) {
      loadInitial();
    } else {
      nextCursorRef.current = initialComments[0]?.created_at || null;
      setIsLoadingInitial(false);
      taskCommentsCache.set(taskId, {
        comments: initialComments,
        nextCursor: initialComments[0]?.created_at || null,
        hasMore: true,
        timestamp: Date.now(),
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [taskId, initialComments]);

  // Load older 10 comments when scrolling up
  const loadOlderComments = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursorRef.current) return;

    setIsLoadingMore(true);
    try {
      const url = `/api/tasks/${taskId}/comments?limit=10&cursor=${encodeURIComponent(
        nextCursorRef.current
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load older comments");
      const data = await res.json();

      const older: TaskComment[] = data.comments || [];
      if (older.length > 0) {
        setComments((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const filtered = older.filter((c) => !existingIds.has(c.id));
          const updated = [...filtered, ...prev];

          // Update cache with prepended older messages
          taskCommentsCache.set(taskId, {
            comments: updated,
            nextCursor: data.nextCursor,
            hasMore: Boolean(data.hasMore),
            timestamp: Date.now(),
          });

          return updated;
        });

        nextCursorRef.current = data.nextCursor;
        setHasMore(Boolean(data.hasMore));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("[useTaskComments] Error loading older comments:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [taskId, isLoadingMore, hasMore]);

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Real-time subscription for live comments
  useEffect(() => {
    if (!taskId) return;

    const supabase = createClient();
    const channelName = `task-comments-${taskId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        async (payload) => {
          const raw = payload.new as Record<string, unknown>;

          setComments((prev) => {
            if (prev.some((c) => c.id === raw.id)) return prev;

            const tempComment: TaskComment = {
              id: raw.id as string,
              task_id: raw.task_id as string,
              workspace_id: raw.workspace_id as string,
              user_id: raw.user_id as string,
              content: (raw.content as string) || "",
              file_url: (raw.file_url as string) || null,
              file_name: (raw.file_name as string) || null,
              file_type: (raw.file_type as string) || null,
              file_size: (raw.file_size as number) || null,
              created_at: raw.created_at as string,
              updated_at: raw.updated_at as string,
              author: {
                id: raw.user_id as string,
                email: "",
                full_name: null,
                avatar_url: null,
              },
            };

            const updated = [...prev, tempComment];

            // Cache update
            const entry = taskCommentsCache.get(taskId);
            taskCommentsCache.set(taskId, {
              comments: updated,
              nextCursor: entry?.nextCursor || null,
              hasMore: entry?.hasMore ?? false,
              timestamp: Date.now(),
            });

            // Fetch profile in background to update
            supabase
              .from("profiles")
              .select("id, email, full_name, avatar_url")
              .eq("id", raw.user_id as string)
              .single()
              .then(({ data: profile }) => {
                if (profile) {
                  setComments((curr) => {
                    const hydrated = curr.map((c) =>
                      c.id === raw.id
                        ? {
                            ...c,
                            author: {
                              id: profile.id,
                              email: profile.email || "",
                              full_name: profile.full_name || null,
                              avatar_url: profile.avatar_url || null,
                            },
                          }
                        : c
                    );

                    taskCommentsCache.set(taskId, {
                      comments: hydrated,
                      nextCursor: entry?.nextCursor || null,
                      hasMore: entry?.hasMore ?? false,
                      timestamp: Date.now(),
                    });

                    return hydrated;
                  });
                }
              });

            return updated;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "task_comments",
        },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            setComments((prev) => {
              if (!prev.some((c) => c.id === deletedId)) return prev;
              const updated = prev.filter((c) => c.id !== deletedId);
              const entry = taskCommentsCache.get(taskId);
              if (entry) {
                taskCommentsCache.set(taskId, {
                  ...entry,
                  comments: updated,
                  timestamp: Date.now(),
                });
              }
              return updated;
            });
          }
        }
      )
      .on("broadcast", { event: "comment_deleted" }, ({ payload }) => {
        const deletedId = (payload as { id?: string })?.id;
        if (deletedId) {
          setComments((prev) => {
            if (!prev.some((c) => c.id === deletedId)) return prev;
            const updated = prev.filter((c) => c.id !== deletedId);
            const entry = taskCommentsCache.get(taskId);
            if (entry) {
              taskCommentsCache.set(taskId, {
                ...entry,
                comments: updated,
                timestamp: Date.now(),
              });
            }
            return updated;
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  const addCommentLocally = useCallback(
    (newComment: TaskComment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev;
        const updated = [...prev, newComment];
        const entry = taskCommentsCache.get(taskId);
        taskCommentsCache.set(taskId, {
          comments: updated,
          nextCursor: entry?.nextCursor || null,
          hasMore: entry?.hasMore ?? false,
          timestamp: Date.now(),
        });
        return updated;
      });
    },
    [taskId]
  );

  const removeCommentLocally = useCallback(
    (commentId: string) => {
      setComments((prev) => {
        const updated = prev.filter((c) => c.id !== commentId);
        const entry = taskCommentsCache.get(taskId);
        if (entry) {
          taskCommentsCache.set(taskId, {
            ...entry,
            comments: updated,
            timestamp: Date.now(),
          });
        }
        return updated;
      });

      // Broadcast deletion immediately to other connected team members
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "comment_deleted",
          payload: { id: commentId },
        });
      }
    },
    [taskId]
  );

  return {
    comments,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    loadOlderComments,
    addCommentLocally,
    removeCommentLocally,
  };
}
