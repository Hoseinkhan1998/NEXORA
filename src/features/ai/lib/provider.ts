import OpenAI from "openai";
import type { CopilotRequestMessage } from "../types";

export interface ProviderResultSuccess {
  success: true;
  content: string;
}

export interface ProviderResultError {
  success: false;
  code: "AI_NOT_CONFIGURED" | "RATE_LIMITED" | "SERVER_ERROR";
  message: string;
}

export type ProviderResult = ProviderResultSuccess | ProviderResultError;

/**
 * Server-side OpenAI provider wrapper.
 * Validates configuration and handles provider invocation and error normalization.
 */
export async function generateCopilotResponse(
  systemPrompt: string,
  messages: CopilotRequestMessage[]
): Promise<ProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  // Clean check for missing configuration
  if (!apiKey) {
    return {
      success: false,
      code: "AI_NOT_CONFIGURED",
      message:
        "AI Copilot is not configured. Please set the OPENAI_API_KEY environment variable in your server configuration.",
    };
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  try {
    const client = new OpenAI({ apiKey });

    // Format conversation history for OpenAI chat completions
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const response = await client.chat.completions.create({
      model,
      messages: openaiMessages,
      temperature: 0.2,
      max_tokens: 1000,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content?.trim();

    if (!content) {
      return {
        success: false,
        code: "SERVER_ERROR",
        message: "The AI provider returned an empty response. Please try again.",
      };
    }

    return {
      success: true,
      content,
    };
  } catch (error: unknown) {
    console.error("[copilot-provider] OpenAI API error:", error);

    // Normalize known error statuses
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status?: number }).status;
      if (status === 429) {
        return {
          success: false,
          code: "RATE_LIMITED",
          message: "AI request rate limit reached. Please wait a moment before asking again.",
        };
      }
      if (status === 401) {
        return {
          success: false,
          code: "AI_NOT_CONFIGURED",
          message: "The configured AI API key is invalid or unauthorized.",
        };
      }
    }

    return {
      success: false,
      code: "SERVER_ERROR",
      message: "An unexpected error occurred while processing your request with the AI provider.",
    };
  }
}
