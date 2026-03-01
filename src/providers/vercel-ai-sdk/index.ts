import { generateText, tool } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { AIProvider } from "../../core/ai-provider.js";
import type { EngineContext, Message } from "../../core/types.js";
import type { ToolCenter } from "../../core/tool-center.js";
import { getConfig } from "../../core/config.js";

function buildSdkModel() {
  const cfg = getConfig();
  const modelName = cfg.model.model;

  if (modelName.startsWith("claude")) {
    if (!cfg.apiKeys.anthropic) throw new Error("Missing ANTHROPIC API key in api-keys.json");
    const anthropic = createAnthropic({ apiKey: cfg.apiKeys.anthropic });
    return anthropic(modelName);
  }

  if (modelName.startsWith("gpt") || modelName.startsWith("o")) {
    if (!cfg.apiKeys.openai) throw new Error("Missing OPENAI API key in api-keys.json");
    const openai = createOpenAI({ apiKey: cfg.apiKeys.openai });
    return openai(modelName);
  }

  throw new Error(`[VercelAiSdkProvider] Unsupported model prefix: ${modelName}. Add a case in buildSdkModel().`);
}

/**
 * Converts a ToolCenter's tools into Vercel AI SDK format using zod schemas.
 * Each tool's `parameters` field must be a Zod object schema.
 */
function buildSdkTools(toolCenter: ToolCenter, ctx: EngineContext): Record<string, ReturnType<typeof tool>> {
  const result: Record<string, ReturnType<typeof tool>> = {};

  for (const t of toolCenter.listTools()) {
    result[t.name] = tool({
      description: t.description,
      parameters: t.parameters as z.ZodObject<z.ZodRawShape>,
      execute: async (args) => {
        return t.execute(args as Record<string, unknown>, ctx);
      },
    });
  }

  return result;
}

/**
 * Vercel AI SDK provider — runs a ToolLoopAgent in-process.
 * Supports Anthropic, OpenAI, and Google models.
 */
export class VercelAiSdkProvider implements AIProvider {
  readonly id = "vercel-ai-sdk";

  async run(params: {
    messages: Message[];
    tools: ToolCenter;
    ctx: EngineContext;
    systemPrompt: string;
    maxSteps: number;
  }): Promise<string> {
    const { messages, tools, ctx, systemPrompt, maxSteps } = params;
    const model = buildSdkModel();
    const sdkTools = buildSdkTools(tools, ctx);

    const sdkMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages: sdkMessages,
      tools: sdkTools,
      maxSteps,
    });

    return text;
  }
}
