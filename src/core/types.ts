// ─── Shared interfaces ──────────────────────────────────────────────────────

export interface EngineContext {
  sessionId: string;
  connectorId: string; // e.g. "web", "telegram"
  userId?: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  // JSON Schema for parameters
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>, ctx: EngineContext) => Promise<unknown>;
}

export interface Extension {
  id: string;
  name: string;
  tools: ToolDefinition[];
  /** Called once during startup */
  initialize?(ctx: EngineContext): Promise<void>;
  /** Called on graceful shutdown */
  destroy?(): Promise<void>;
}

export interface Connector {
  id: string;
  /** Start serving / polling */
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Send a message to the user via this connector */
  send(userId: string, text: string): Promise<void>;
}

export type EventType =
  | "agent.message"
  | "trade.staged"
  | "trade.committed"
  | "trade.pushed"
  | "guard.blocked"
  | "cron.fire"
  | "heartbeat.check"
  | "error";

export interface AppEvent {
  id: string;       // uuid v4
  type: EventType;
  payload: unknown;
  ts: number;       // unix ms
}
