"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { copilotRequestSchema } from "../schemas/copilot";
import { getWorkspaceCopilotContext } from "../lib/copilot-context";
import { buildCopilotSystemPrompt } from "../lib/copilot-prompt";
import { generateCopilotResponse } from "../lib/provider";
import { checkRateLimit } from "@/lib/security/rate-limit";
import type { CopilotResponse } from "../types";

/**
 * Server action that handles AI Copilot chat messages.
 * Enforces strict user authentication, tenant isolation, schema validation,
 * context bounding, and OpenAI execution.
 */
export async function sendCopilotMessage(input: unknown): Promise<CopilotResponse> {
  const supabase = await createClient();

  // 1. Authenticate user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be signed in to use NEXORA Copilot.",
      },
    };
  }

  // 2. Enforce rate limit (15 requests/minute per authenticated user)
  const rateLimit = checkRateLimit(`copilot:${user.id}`, {
    limit: 15,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: `Too many AI requests. Please wait ${rateLimit.retryAfter} seconds before trying again.`,
      },
    };
  }

  // 3. Validate input schema
  const parseResult = copilotRequestSchema.safeParse(input);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message || "Invalid request payload.";
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: firstError,
      },
    };
  }

  const { workspaceSlug, messages } = parseResult.data;

  // 3. Resolve workspace and verify tenant membership server-side
  const { data: workspaceData, error: workspaceError } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      slug,
      members:workspace_members!inner(user_id, role)
    `
    )
    .eq("slug", workspaceSlug)
    .eq("members.user_id", user.id)
    .single();

  if (workspaceError || !workspaceData) {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You do not have access to this workspace.",
      },
    };
  }

  try {
    // 4. Build bounded workspace context (RLS enforced)
    const contextData = await getWorkspaceCopilotContext(
      workspaceData.id,
      workspaceData.slug,
      workspaceData.name
    );

    // 5. Construct injection-resilient system prompt
    const systemPrompt = buildCopilotSystemPrompt(contextData);

    // Extract user role in workspace
    const memberRecord = Array.isArray(workspaceData.members)
      ? workspaceData.members[0]
      : workspaceData.members;
    const userRole = memberRecord?.role || "member";

    const executionContext = {
      supabase,
      workspaceId: workspaceData.id,
      workspaceSlug: workspaceData.slug,
      userId: user.id,
      role: userRole,
    };

    // 6. Invoke AI provider with autonomous execution context
    const result = await generateCopilotResponse(systemPrompt, messages, executionContext);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: result.code,
          message: result.message,
        },
      };
    }

    // Revalidate app routes if mutations were performed
    if (result.hasMutations) {
      revalidatePath(`/app/${workspaceData.slug}`);
      revalidatePath(`/app/${workspaceData.slug}/projects`);
    }

    return {
      success: true,
      message: {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.content,
        createdAt: new Date().toISOString(),
      },
      hasMutations: result.hasMutations,
      executedActions: result.executedActions,
    };
  } catch (error: unknown) {
    console.error("[sendCopilotMessage] Unexpected error:", error);
    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while communicating with the AI Copilot.",
      },
    };
  }
}
