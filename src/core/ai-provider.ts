import { getConfig } from "./config.js";
import type { ToolCenter } from "./tool-center.js";
import type { SessionStore } from "./session.js";
import type { EngineContext, Message } from "./types.js";

export interface AIProvider {
  id: string;
  /** Run a single agent turn and return the assistant reply. */
  run(params: {
    messages: Message[];
    tools: ToolCenter;
    ctx: EngineContext;
    systemPrompt: string;
    maxSteps: number;
  }): Promise<string>;
}

/**
 * ProviderRouter reads `ai-provider.json` on every call so the provider
 * can be switched at runtime without a restart.
 */
export class ProviderRouter {
  private providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  private getActive(): AIProvider {
    const cfg = getConfig();
    const id = cfg.aiProvider.provider;
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`[ProviderRouter] No provider registered with id "${id}". Available: ${[...this.providers.keys()].join(", ")}`);
    }
    return provider;
  }

  async run(params: Parameters<AIProvider["run"]>[0]): Promise<string> {
    return this.getActive().run(params);
  }
}
