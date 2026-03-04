/**
 * main.ts — Composition root (Solana Memecoin Trader)
 */

import { getConfig } from "./core/config.js";
import { EventLog } from "./core/event-log.js";
import { ConnectorRegistry } from "./core/connector-registry.js";
import { ToolCenter } from "./core/tool-center.js";
import { SessionStore } from "./core/session.js";
import { ProviderRouter } from "./core/ai-provider.js";
import { AgentCenter } from "./core/agent-center.js";
import { Engine } from "./core/engine.js";

// ── Providers ─────────────────────────────────────────────────────────────────
import { VercelAiSdkProvider } from "./providers/vercel-ai-sdk/index.js";
import { ClaudeCodeProvider } from "./providers/claude-code/index.js";

// ── Extensions ────────────────────────────────────────────────────────────────
import { SolanaTradingExtension } from "./extension/solana-trading/index.js";
import { MemecoinScannerExtension } from "./extension/memecoin-scanner/index.js";
import { AnalysisKitExtension } from "./extension/analysis-kit/index.js";
import { BrainExtension } from "./extension/brain/index.js";
import { NewsCollectorExtension } from "./extension/news-collector/index.js";

// ── Connectors ────────────────────────────────────────────────────────────────
import { WebConnector } from "./connectors/web/index.js";
import { TelegramConnector } from "./connectors/telegram/index.js";

// ── Tasks ─────────────────────────────────────────────────────────────────────
import { CronEngine } from "./task/cron/index.js";
import { Heartbeat } from "./task/heartbeat/index.js";
import { TradingLoop } from "./task/trading-loop/index.js";

async function main(): Promise<void> {
  console.log("=== VARDUS Agent starting ===");
  const cfg = getConfig();

  // ── Core infrastructure ──────────────────────────────────────────────────
  const eventLog = new EventLog();
  const connectorRegistry = new ConnectorRegistry();
  const toolCenter = new ToolCenter();
  const sessionStore = new SessionStore();
  const providerRouter = new ProviderRouter();

  // ── Register AI providers ────────────────────────────────────────────────
  providerRouter.register(new VercelAiSdkProvider());
  providerRouter.register(new ClaudeCodeProvider());

  // ── Agent core ───────────────────────────────────────────────────────────
  const agentCenter = new AgentCenter(providerRouter, toolCenter, sessionStore);
  const engine = new Engine(agentCenter);

  // ── Register extensions ──────────────────────────────────────────────────
  const solanaTrading = new SolanaTradingExtension(eventLog);
  const scanner = new MemecoinScannerExtension();
  const analysisKit = new AnalysisKitExtension();
  const brain = new BrainExtension();
  const newsCollector = new NewsCollectorExtension();

  const bootCtx = { sessionId: "boot", connectorId: "system" };

  for (const ext of [solanaTrading, scanner, analysisKit, brain, newsCollector]) {
    toolCenter.registerExtension(ext);
    if (ext.initialize) await ext.initialize(bootCtx);
  }

  console.log(`[ToolCenter] ${toolCenter.listTools().length} tools registered`);

  // ── Start connectors ─────────────────────────────────────────────────────
  const webConnector = new WebConnector(
    engine, connectorRegistry, eventLog, solanaTrading, cfg.connectors.webPort,
  );
  connectorRegistry.register(webConnector);
  await webConnector.start();

  if (cfg.connectors.telegramEnabled && cfg.connectors.telegramToken) {
    const tg = new TelegramConnector(engine, connectorRegistry, cfg.connectors.telegramToken);
    connectorRegistry.register(tg);
    await tg.start();
  } else {
    console.log("[Telegram] Disabled (set telegramEnabled=true + token in connectors.json)");
  }

  // ── Start background tasks ───────────────────────────────────────────────
  const cronEngine = new CronEngine(engine, eventLog, connectorRegistry);
  cronEngine.start();

  const heartbeat = new Heartbeat(engine, eventLog, connectorRegistry);
  heartbeat.start();

  const tradingLoop = new TradingLoop(engine, eventLog, connectorRegistry);
  tradingLoop.start();

  // ── Record startup ───────────────────────────────────────────────────────
  await eventLog.emit("agent.message", { message: "VARDUS Agent started", ts: Date.now() });
  console.log(`=== Ready — http://localhost:${cfg.connectors.webPort} ===`);

  // ── Graceful shutdown ────────────────────────────────────────────────────
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, async () => {
      console.log(`\n${signal} — shutting down...`);
      tradingLoop.stop();
      heartbeat.stop();
      cronEngine.stop();
      await webConnector.stop();
      for (const ext of [solanaTrading, scanner, analysisKit, brain, newsCollector]) {
        if (ext.destroy) await ext.destroy();
      }
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
