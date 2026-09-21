import OpenAI from "openai";
import type { CopilotRequestMessage } from "../types";
import { COPILOT_TOOLS, executeCopilotTool, type CopilotExecutionContext } from "./copilot-tools";

export interface ProviderResultSuccess {
  success: true;
  content: string;
  hasMutations?: boolean;
  executedActions?: string[];
}

export interface ProviderResultError {
  success: false;
  code: "AI_NOT_CONFIGURED" | "RATE_LIMITED" | "SERVER_ERROR";
  message: string;
}

export type ProviderResult = ProviderResultSuccess | ProviderResultError;

export interface AiProviderConfig {
  provider: "groq" | "gemini" | "openrouter" | "openai" | "custom";
  apiKey: string;
  baseURL?: string;
  model: string;
}

/**
 * Resolves active AI configuration checking supported free and commercial providers:
 * 1. AI_API_KEY (Custom generic override)
 * 2. GROQ_API_KEY (Free, fast inference on Groq)
 * 3. GEMINI_API_KEY (Google Gemini free tier)
 * 4. OPENROUTER_API_KEY (OpenRouter free/paid models)
 * 5. OPENAI_API_KEY (Standard OpenAI)
 */
export function resolveAiConfiguration(): AiProviderConfig | null {
  // 1. Custom / Generic override
  if (process.env.AI_API_KEY?.trim()) {
    return {
      provider: "custom",
      apiKey: process.env.AI_API_KEY.trim(),
      baseURL: process.env.AI_BASE_URL?.trim(),
      model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    };
  }

  // 2. Groq (Free tier, ultra-fast inference, supports function calling)
  if (process.env.GROQ_API_KEY?.trim()) {
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY.trim(),
      baseURL: process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
    };
  }

  // 3. Google Gemini via OpenAI-compatible endpoint
  if (process.env.GEMINI_API_KEY?.trim()) {
    return {
      provider: "gemini",
      apiKey: process.env.GEMINI_API_KEY.trim(),
      baseURL:
        process.env.GEMINI_BASE_URL?.trim() ||
        "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash",
    };
  }

  // 4. OpenRouter
  if (process.env.OPENROUTER_API_KEY?.trim()) {
    return {
      provider: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY.trim(),
      baseURL: process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL?.trim() || "meta-llama/llama-3.3-70b-instruct:free",
    };
  }

  // 5. OpenAI
  if (process.env.OPENAI_API_KEY?.trim()) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY.trim(),
      baseURL: process.env.OPENAI_BASE_URL?.trim(),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    };
  }

  return null;
}

/**
 * Candidate models to try sequentially if the chosen model returns 404.
 */
function getFallbackModels(provider: string, primaryModel: string): string[] {
  if (provider === "groq") {
    const list = [
      primaryModel,
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ];
    // deduplicate while preserving order
    return Array.from(new Set(list));
  }
  return [primaryModel];
}

/**
 * Server-side AI provider invocation with autonomous multi-step tool execution.
 */
export async function generateCopilotResponse(
  systemPrompt: string,
  messages: CopilotRequestMessage[],
  context?: CopilotExecutionContext
): Promise<ProviderResult> {
  const config = resolveAiConfiguration();

  // Clean check for missing configuration
  if (!config) {
    return {
      success: false,
      code: "AI_NOT_CONFIGURED",
      message:
        "AI Copilot is not configured. Please add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to your .env.local file.",
    };
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const candidateModels = getFallbackModels(config.provider, config.model);
  let lastError: unknown = null;

  for (const modelToUse of candidateModels) {
    try {
      // Format conversation history for OpenAI chat completions
      const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      let iterations = 0;
      const maxIterations = 5;
      let hasMutations = false;
      const executedActions: string[] = [];

      while (iterations < maxIterations) {
        iterations++;

        const response = await client.chat.completions.create({
          model: modelToUse,
          messages: openaiMessages,
          tools: context ? COPILOT_TOOLS : undefined,
          tool_choice: context ? "auto" : undefined,
          temperature: 0.2,
          max_tokens: 1200,
        });

        const choice = response.choices[0];
        const message = choice?.message;

        if (!message) {
          return {
            success: false,
            code: "SERVER_ERROR",
            message: "The AI provider returned an empty response. Please try again.",
          };
        }

        // Check if tool calls were requested by the AI
        if (message.tool_calls && message.tool_calls.length > 0 && context) {
          openaiMessages.push(message);

          for (const toolCall of message.tool_calls) {
            if (toolCall.type === "function") {
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(toolCall.function.arguments || "{}");
              } catch {
                args = {};
              }

              const toolResult = await executeCopilotTool(toolCall.function.name, args, context);

              if (toolResult.isMutation) {
                hasMutations = true;
                executedActions.push(toolResult.message);
              }

              openaiMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
              });
            }
          }

          // Loop to let the model generate conversational final response with tool results
          continue;
        }

        // Final assistant response reached
        const content = message.content?.trim();

        if (!content) {
          if (executedActions.length > 0) {
            return {
              success: true,
              content: executedActions.join("\n"),
              hasMutations,
              executedActions,
            };
          }

          return {
            success: false,
            code: "SERVER_ERROR",
            message: "The AI provider returned an empty response. Please try again.",
          };
        }

        return {
          success: true,
          content,
          hasMutations,
          executedActions,
        };
      }

      // If loop reached max iterations
      return {
        success: true,
        content:
          executedActions.length > 0
            ? executedActions.join("\n")
            : "Operations completed successfully.",
        hasMutations,
        executedActions,
      };
    } catch (error: unknown) {
      lastError = error;

      // Check for 404 (model not found / no access) to attempt next candidate model
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        (error as { status?: number }).status === 404
      ) {
        console.warn(
          `[copilot-provider] Model "${modelToUse}" returned 404. Attempting next candidate...`
        );
        continue;
      }

      // For non-404 errors, do not retry other models, handle immediately
      break;
    }
  }

  console.error(`[copilot-provider] ${config.provider} API error:`, lastError);

  if (lastError && typeof lastError === "object" && "status" in lastError) {
    const status = (lastError as { status?: number }).status;
    if (status === 429) {
      return {
        success: false,
        code: "RATE_LIMITED",
        message: "AI request rate limit reached. Please wait a moment before trying again.",
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

  const errorMsg = lastError instanceof Error ? lastError.message : "Unknown error";
  return {
    success: false,
    code: "SERVER_ERROR",
    message: `Error communicating with AI service: ${errorMsg}`,
  };
}
