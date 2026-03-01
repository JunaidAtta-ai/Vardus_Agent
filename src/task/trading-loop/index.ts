import * as fs from "fs";
import * as path from "path";
import type { Engine } from "../../core/engine.js";
import type { EventLog } from "../../core/event-log.js";
import type { ConnectorRegistry } from "../../core/connector-registry.js";
import { getConfig } from "../../core/config.js";

const LOOP_PROMPT_PATH = path.resolve("data/brain/trading-loop.md");
const LOOP_DEFAULT_PATH = path.resolve("data/default/trading-loop.default.md");

function loadLoopPrompt(): string {
  if (fs.existsSync(LOOP_PROMPT_PATH)) return fs.readFileSync(LOOP_PROMPT_PATH, "utf8");
  if (fs.existsSync(LOOP_DEFAULT_PATH)) return fs.readFileSync(LOOP_DEFAULT_PATH, "utf8");
  return `You are an autonomous Solana memecoin trader. 
Execute ONE trading cycle:
1. Check wallet balance (walletInfo)
2. Check current positions (positionsInfo)
3. Scan for trending tokens (scanTrending, scanPumpFun)
4. Analyze each opportunity: liquidity, volume, price momentum, social activity
5. Make a decision: buy, sell, or hold. Explain your reasoning.
6. Execute via solanaBuy or solanaSell. Always include reasoning.
Keep positions diversified. Never risk more than allowed per trade.`;
}

/**
 * TradingLoop — autonomous trading task that runs on a schedule.
 * Calls the AI engine with full context (wallet, positions, scanner) 
 * and lets it decide to buy/sell/hold.
 */
export class TradingLoop {
  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  constructor(
    private readonly engine: Engine,
    private readonly eventLog: EventLog,
    private readonly connectorRegistry: ConnectorRegistry,
  ) {}

  start(): void {
    const solanaConfig = this.loadSolanaConfig();
    if (!solanaConfig.autoTrading) {
      console.log("[TradingLoop] Auto-trading disabled in solana.json");
      return;
    }

    const intervalMs = solanaConfig.tradingIntervalMinutes * 60_000;
    this.timer = setInterval(async () => {
      if (!this.isRunning) await this.tick();
    }, intervalMs);

    // Run first cycle after 30 seconds
    setTimeout(async () => {
      if (!this.isRunning) await this.tick();
    }, 30_000);

    console.log(`[TradingLoop] Started — running every ${solanaConfig.tradingIntervalMinutes} min`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    this.isRunning = true;
    const ctx = { sessionId: "trading-loop", connectorId: "trading-loop" };

    try {
      await this.eventLog.emit("agent.message", {
        message: "[TradingLoop] Starting trading cycle...",
        source: "trading-loop",
      });

      const prompt = loadLoopPrompt();
      const reply = await this.engine.oneShot(prompt, ctx);

      await this.eventLog.emit("agent.message", {
        message: reply,
        source: "trading-loop",
      });

      // Notify via last connector if there's something worth reporting
      if (reply.length > 20) {
        await this.connectorRegistry.sendToLast(
          `[Trading Cycle]\n${reply.slice(0, 500)}${reply.length > 500 ? "..." : ""}`,
        );
      }
    } catch (err) {
      await this.eventLog.emit("error", {
        source: "trading-loop",
        error: String(err),
      });
    } finally {
      this.isRunning = false;
    }
  }

  private loadSolanaConfig(): { autoTrading: boolean; tradingIntervalMinutes: number } {
    const p = "data/config/solana.json";
    if (!fs.existsSync(p)) return { autoTrading: false, tradingIntervalMinutes: 10 };
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }
}
