import type { ProviderRouter } from "./ai-provider.js";
import type { ToolCenter } from "./tool-center.js";
import type { SessionStore } from "./session.js";
import { Compaction } from "./compaction.js";
import type { EngineContext, Message } from "./types.js";
import { getConfig } from "./config.js";
import * as fs from "fs";
import * as path from "path";

const PERSONA_PATH = path.resolve("data/brain/persona.md");
const PERSONA_DEFAULT_PATH = path.resolve("data/default/persona.default.md");

function loadPersona(): string {
  if (fs.existsSync(PERSONA_PATH)) {
    return fs.readFileSync(PERSONA_PATH, "utf8");
  }
  if (fs.existsSync(PERSONA_DEFAULT_PATH)) {
    return fs.readFileSync(PERSONA_DEFAULT_PATH, "utf8");
  }
  return "You are a helpful AI trading assistant.";
}

/**
 * AgentCenter manages all agent interactions.
 * It owns the ProviderRouter and routes every conversation request through it.
 */
export class AgentCenter {
  private compaction = new Compaction();

  constructor(
    private readonly router: ProviderRouter,
    private readonly tools: ToolCenter,
    private readonly sessions: SessionStore,
  ) {}

  async chat(userMessage: string, ctx: EngineContext): Promise<string> {
    const cfg = getConfig();

    // Load session history
    let history = await this.sessions.load(ctx.sessionId);

    // Append user message
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    await this.sessions.append(ctx.sessionId, userMsg);
    history = [...history, userMsg];

    // Compact if needed
    if (this.compaction.needsCompaction(history)) {
      history = this.compaction.compact(history);
    }

    // Run AI provider
    const reply = await this.router.run({
      messages: history,
      tools: this.tools,
      ctx,
      systemPrompt: loadPersona(),
      maxSteps: cfg.agent.maxSteps,
    });

    // Persist assistant reply
    const assistantMsg: Message = {
      role: "assistant",
      content: reply,
      timestamp: Date.now(),
    };
    await this.sessions.append(ctx.sessionId, assistantMsg);

    return reply;
  }

  /** Stateless one-shot call (used by heartbeat / cron tasks). */
  async oneShot(prompt: string, ctx: EngineContext): Promise<string> {
    const cfg = getConfig();
    const messages: Message[] = [
      { role: "user", content: prompt, timestamp: Date.now() },
    ];
    return this.router.run({
      messages,
      tools: this.tools,
      ctx,
      systemPrompt: loadPersona(),
      maxSteps: cfg.agent.maxSteps,
    });
  }
}
