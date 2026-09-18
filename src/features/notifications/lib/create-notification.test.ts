import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotification } from "./create-notification";
import type { CreateNotificationInput } from "../types";

// Mock Supabase server client
const mockInsert = vi.fn();
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
const mockSupabase = { from: mockFrom };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

describe("Notifications Dispatcher Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  const validPayload: CreateNotificationInput = {
    workspaceId: "11111111-1111-4111-8111-111111111111",
    recipientId: "22222222-2222-4222-8222-222222222222",
    actorId: "33333333-3333-4333-8333-333333333333",
    type: "task_assigned",
    title: "New Task Assigned",
    message: "You have been assigned to 'Optimize Database'.",
    entityType: "task",
    entityId: "44444444-4444-4444-8444-444444444444",
    projectId: "55555555-5555-4555-8555-555555555555",
  };

  it("strictly prevents self-notifications when recipientId === actorId", async () => {
    const result = await createNotification({
      ...validPayload,
      recipientId: "66666666-6666-4666-8666-666666666666",
      actorId: "66666666-6666-4666-8666-666666666666",
    });

    expect(result).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns false immediately when recipientId is empty or missing", async () => {
    const result = await createNotification({
      ...validPayload,
      recipientId: "",
    });

    expect(result).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns false when payload fails validation schema (e.g. empty title)", async () => {
    const result = await createNotification({
      ...validPayload,
      title: "", // empty title violates schema
    });

    expect(result).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("successfully dispatches notification when actor and recipient are different users", async () => {
    const result = await createNotification(validPayload);

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("notifications");
    expect(mockInsert).toHaveBeenCalledWith({
      workspace_id: "11111111-1111-4111-8111-111111111111",
      recipient_id: "22222222-2222-4222-8222-222222222222",
      actor_id: "33333333-3333-4333-8333-333333333333",
      type: "task_assigned",
      title: "New Task Assigned",
      message: "You have been assigned to 'Optimize Database'.",
      entity_type: "task",
      entity_id: "44444444-4444-4444-8444-444444444444",
      project_id: "55555555-5555-4555-8555-555555555555",
    });
  });

  it("handles Supabase insert errors gracefully without throwing", async () => {
    mockInsert.mockResolvedValue({ error: { message: "Database connection failed" } });

    const result = await createNotification(validPayload);
    expect(result).toBe(false);
  });
});
