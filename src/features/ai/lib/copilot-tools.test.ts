import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { COPILOT_TOOLS, executeCopilotTool } from "./copilot-tools";
import { resolveAiConfiguration } from "./provider";

describe("NEXORA AI Copilot - Tools & Guardrails", () => {
  it("defines standard management tools for projects and tasks", () => {
    const toolNames = COPILOT_TOOLS.map((t) => ("function" in t ? t.function.name : ""));
    expect(toolNames).toContain("create_project");
    expect(toolNames).toContain("update_project");
    expect(toolNames).toContain("archive_project");
    expect(toolNames).toContain("create_task");
    expect(toolNames).toContain("update_task");
    expect(toolNames).toContain("move_task_status");
    expect(toolNames).toContain("delete_task");
    expect(toolNames).toContain("list_projects");
    expect(toolNames).toContain("list_tasks");
  });

  it("strictly enforces guardrails: NO tools exist for profiles, passwords, avatars, or billing", () => {
    const toolNames = COPILOT_TOOLS.map((t) => ("function" in t ? t.function.name : ""));
    expect(toolNames).not.toContain("update_profile");
    expect(toolNames).not.toContain("change_password");
    expect(toolNames).not.toContain("update_avatar");
    expect(toolNames).not.toContain("update_billing");
    expect(toolNames).not.toContain("delete_workspace");
  });

  describe("executeCopilotTool permissions", () => {
    const fakeSupabase = {} as unknown as SupabaseClient;

    it("prevents viewers from performing mutations", async () => {
      const result = await executeCopilotTool(
        "create_task",
        { title: "Test task" },
        {
          supabase: fakeSupabase,
          workspaceId: "ws-123",
          workspaceSlug: "test-ws",
          userId: "usr-1",
          role: "viewer",
        }
      );

      expect(result.success).toBe(false);
      expect(result.isMutation).toBe(false);
      expect(result.message).toContain("Viewer");
    });

    it("prevents standard members from deleting tasks", async () => {
      const result = await executeCopilotTool(
        "delete_task",
        { taskIdOrTitle: "task-1" },
        {
          supabase: fakeSupabase,
          workspaceId: "ws-123",
          workspaceSlug: "test-ws",
          userId: "usr-1",
          role: "member",
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("Only workspace owners and administrators");
    });
  });

  describe("executeCopilotTool execution", () => {
    let mockSupabase: { from: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn(),
      };
    });

    it("creates a task and returns success", async () => {
      // Mock finding project
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "p-1", name: "پروژه تست", slug: "test-proj", status: "active" },
            }),
          };
        }
        if (table === "tasks") {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "t-1", title: "تسک تستی", status: "todo" },
              error: null,
            }),
          };
        }
        if (table === "project_activity") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await executeCopilotTool(
        "create_task",
        { title: "تسک تستی", status: "todo" },
        {
          supabase: mockSupabase as unknown as SupabaseClient,
          workspaceId: "ws-1",
          workspaceSlug: "ws-slug",
          userId: "usr-1",
          role: "owner",
        }
      );

      expect(result.success).toBe(true);
      expect(result.isMutation).toBe(true);
      expect(result.message).toContain("تسک تستی");
    });

    it("moves task status correctly", async () => {
      // Mock finding and updating task
      const taskList = [{ id: "t-1", project_id: "p-1", title: "تسک تست", status: "todo" }];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tasks") {
          const queryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: taskList }),
            update: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "t-1", project_id: "p-1", title: "تسک تست", status: "done" },
              error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "t-1", project_id: "p-1", title: "تسک تست", status: "todo" },
            }),
          };
          return queryBuilder;
        }
        if (table === "project_activity") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await executeCopilotTool(
        "move_task_status",
        { taskIdOrTitle: "تسک تست", status: "done" },
        {
          supabase: mockSupabase as unknown as SupabaseClient,
          workspaceId: "ws-1",
          workspaceSlug: "ws-slug",
          userId: "usr-1",
          role: "owner",
        }
      );

      expect(result.success).toBe(true);
      expect(result.isMutation).toBe(true);
      expect(result.message).toContain("moved from");
    });
  });
});

describe("AI Provider Configuration Resolution", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
  });

  it("resolves null when no key is set", () => {
    expect(resolveAiConfiguration()).toBeNull();
  });

  it("prioritizes Groq when GROQ_API_KEY is configured", () => {
    process.env.GROQ_API_KEY = "gsk_test123";
    const config = resolveAiConfiguration();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe("groq");
    expect(config?.baseURL).toBe("https://api.groq.com/openai/v1");
    expect(config?.model).toBe("openai/gpt-oss-120b");
  });

  it("resolves Gemini when GEMINI_API_KEY is configured", () => {
    process.env.GEMINI_API_KEY = "AIza_test123";
    const config = resolveAiConfiguration();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe("gemini");
    expect(config?.baseURL).toBe("https://generativelanguage.googleapis.com/v1beta/openai/");
  });

  it("resolves OpenAI when OPENAI_API_KEY is configured", () => {
    process.env.OPENAI_API_KEY = "sk-test123";
    const config = resolveAiConfiguration();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe("openai");
    expect(config?.model).toBe("gpt-4o-mini");
  });
});
