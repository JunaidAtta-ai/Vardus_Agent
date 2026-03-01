import type { AgentCenter } from "./agent-center.js";
import type { EngineContext } from "./types.js";

/**
 * Engine is a thin public facade over AgentCenter.
 * All external code (connectors, tasks) only talks to Engine.
 */
export class Engine {
  constructor(private readonly agentCenter: AgentCenter) {}

  async chat(userMessage: string, ctx: EngineContext): Promise<string> {
    return this.agentCenter.chat(userMessage, ctx);
  }

  async oneShot(prompt: string, ctx: EngineContext): Promise<string> {
    return this.agentCenter.oneShot(prompt, ctx);
  }
}
