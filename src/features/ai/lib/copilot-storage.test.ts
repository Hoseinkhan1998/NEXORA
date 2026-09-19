import { describe, it, expect, beforeEach } from "vitest";
import {
  createNewSession,
  getWorkspaceSessions,
  deleteSession,
  clearAllSessions,
  deriveSessionTitle,
  setActiveSessionId,
  getActiveSessionId,
} from "./copilot-storage";

describe("Copilot Storage & Session Management", () => {
  const workspaceSlug = "test-ws-storage";

  beforeEach(() => {
    clearAllSessions(workspaceSlug);
  });

  it("derives a clean short session title from the first prompt", () => {
    expect(deriveSessionTitle("Hello world")).toBe("Hello world");
    expect(
      deriveSessionTitle("Can you please help me create a comprehensive marketing strategy for our product?")
    ).toBe("Can you please help me create a comp...");
  });

  it("creates and retrieves new sessions", () => {
    const session = createNewSession(workspaceSlug, "Sprint Planning");
    expect(session.id).toBeDefined();
    expect(session.title).toBe("Sprint Planning");
    expect(session.workspaceSlug).toBe(workspaceSlug);

    const loaded = getWorkspaceSessions(workspaceSlug);
    expect(loaded.length).toBe(1);
    expect(loaded[0]?.id).toBe(session.id);
  });

  it("sets and gets active session ID", () => {
    setActiveSessionId(workspaceSlug, "session-abc");
    expect(getActiveSessionId(workspaceSlug)).toBe("session-abc");
  });

  it("deletes a session and updates active session if needed", () => {
    const s1 = createNewSession(workspaceSlug, "Session 1");
    const s2 = createNewSession(workspaceSlug, "Session 2");

    expect(getWorkspaceSessions(workspaceSlug).length).toBe(2);

    const remaining = deleteSession(workspaceSlug, s2.id);
    expect(remaining.length).toBe(1);
    expect(remaining[0]?.id).toBe(s1.id);
  });

  it("clears all sessions", () => {
    createNewSession(workspaceSlug, "Session 1");
    createNewSession(workspaceSlug, "Session 2");
    clearAllSessions(workspaceSlug);

    expect(getWorkspaceSessions(workspaceSlug).length).toBe(0);
    expect(getActiveSessionId(workspaceSlug)).toBeNull();
  });
});
