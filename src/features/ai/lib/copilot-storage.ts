import type { CopilotMessage } from "../types";

export interface CopilotSession {
  id: string;
  title: string;
  workspaceSlug: string;
  createdAt: string;
  updatedAt: string;
  messages: CopilotMessage[];
}

const STORAGE_PREFIX = "nexora_copilot_sessions_";
const ACTIVE_SESSION_PREFIX = "nexora_copilot_active_";

/**
 * Derives a clean conversation title from the first user message.
 */
export function deriveSessionTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim().replace(/^["']|["']$/g, "");
  if (cleaned.length <= 36) return cleaned;
  return cleaned.slice(0, 36).trimEnd() + "...";
}

/**
 * Loads all saved chat sessions for a specific workspace.
 */
export function getWorkspaceSessions(workspaceSlug: string): CopilotSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${workspaceSlug}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error("[copilot-storage] Failed to load sessions:", err);
    return [];
  }
}

/**
 * Persists all chat sessions for a workspace into localStorage.
 */
export function saveWorkspaceSessions(workspaceSlug: string, sessions: CopilotSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${workspaceSlug}`, JSON.stringify(sessions));
  } catch (err) {
    console.error("[copilot-storage] Failed to save sessions:", err);
  }
}

/**
 * Retrieves the currently active session ID for a workspace.
 */
export function getActiveSessionId(workspaceSlug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${ACTIVE_SESSION_PREFIX}${workspaceSlug}`);
  } catch {
    return null;
  }
}

/**
 * Sets the currently active session ID for a workspace.
 */
export function setActiveSessionId(workspaceSlug: string, sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${ACTIVE_SESSION_PREFIX}${workspaceSlug}`, sessionId);
  } catch {
    // ignore
  }
}

/**
 * Creates a brand new chat session and saves it.
 */
export function createNewSession(
  workspaceSlug: string,
  initialTitle: string = "New Conversation"
): CopilotSession {
  const newSession: CopilotSession = {
    id: crypto.randomUUID(),
    title: initialTitle,
    workspaceSlug,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };

  const existing = getWorkspaceSessions(workspaceSlug);
  const updated = [newSession, ...existing];
  saveWorkspaceSessions(workspaceSlug, updated);
  setActiveSessionId(workspaceSlug, newSession.id);

  return newSession;
}

/**
 * Deletes a session by ID and returns the remaining sessions.
 */
export function deleteSession(workspaceSlug: string, sessionId: string): CopilotSession[] {
  const existing = getWorkspaceSessions(workspaceSlug);
  const updated = existing.filter((s) => s.id !== sessionId);
  saveWorkspaceSessions(workspaceSlug, updated);

  const activeId = getActiveSessionId(workspaceSlug);
  if (activeId === sessionId) {
    const nextActive = updated[0]?.id ?? null;
    if (nextActive) {
      setActiveSessionId(workspaceSlug, nextActive);
    } else {
      localStorage.removeItem(`${ACTIVE_SESSION_PREFIX}${workspaceSlug}`);
    }
  }

  return updated;
}

/**
 * Clears all chat history for this workspace.
 */
export function clearAllSessions(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${workspaceSlug}`);
  localStorage.removeItem(`${ACTIVE_SESSION_PREFIX}${workspaceSlug}`);
}
