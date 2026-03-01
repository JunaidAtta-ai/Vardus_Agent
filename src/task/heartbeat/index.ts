import * as fs from "fs";
import * as path from "path";
import type { Engine } from "../../core/engine.js";
import type { EventLog } from "../../core/event-log.js";
import type { ConnectorRegistry } from "../../core/connector-registry.js";
import { getConfig } from "../../core/config.js";

const HEARTBEAT_PROMPT_PATH = path.resolve("data/brain/heartbeat.md");
const HEARTBEAT_DEFAULT_PATH = path.resolve("data/default/heartbeat.default.md");

function loadHeartbeatPrompt(): string {
  if (fs.existsSync(HEARTBEAT_PROMPT_PATH)) return fs.readFileSync(HEARTBEAT_PROMPT_PATH, "utf8");
  if (fs.existsSync(HEARTBEAT_DEFAULT_PATH)) return fs.readFileSync(HEARTBEAT_DEFAULT_PATH, "utf8");
  return `Review current market conditions. 
Reply with EXACTLY one of:
  HEARTBEAT_OK          — nothing important to report
  CHAT_NO               — something changed but not urgent
  CHAT_YES: <message>   — important update to send to the user`;
}

/**
 * Heartbeat — periodic AI check-in.
 * Uses a structured response protocol:
 *   HEARTBEAT_OK  → stay quiet
 *   CHAT_NO       → acknowledge but don't message user
 *   CHAT_YES: …   → deliver message via ConnectorRegistry
 */
export class Heartbeat {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly engine: Engine,
    private readonly eventLog: EventLog,
    private readonly connectorRegistry: ConnectorRegistry,
  ) {}

  start(): void {
    const cfg = getConfig().heartbeat;
    if (!cfg.enabled) return;

    this.timer = setInterval(async () => {
      const [activeStart, activeEnd] = cfg.activeHours;
      const hour = new Date().getHours();
      if (hour < activeStart || hour >= activeEnd) return; // outside active window

      await this.check();
    }, cfg.intervalMinutes * 60_000);

    console.log(`[Heartbeat] Started — every ${cfg.intervalMinutes} min, active hours ${cfg.activeHours[0]}-${cfg.activeHours[1]}`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async check(): Promise<void> {
    const prompt = loadHeartbeatPrompt();
    const ctx = { sessionId: "heartbeat", connectorId: "heartbeat" };

    try {
      const reply = await this.engine.oneShot(prompt, ctx);
      await this.eventLog.emit("heartbeat.check", { reply });

      if (reply.startsWith("CHAT_YES:")) {
        const message = reply.replace(/^CHAT_YES:\s*/, "").trim();
        await this.connectorRegistry.sendToLast(message);
      }
      // HEARTBEAT_OK and CHAT_NO → do nothing
    } catch (err) {
      await this.eventLog.emit("error", { source: "heartbeat", error: String(err) });
    }
  }
}
