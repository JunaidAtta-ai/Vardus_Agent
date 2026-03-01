import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { randomUUID } from "crypto";
import * as fs from "fs";
import type { Connector } from "../../core/types.js";
import type { Engine } from "../../core/engine.js";
import type { ConnectorRegistry } from "../../core/connector-registry.js";
import type { EventLog } from "../../core/event-log.js";
import type { SolanaTradingExtension } from "../../extension/solana-trading/index.js";
import { getLatestScanResults } from "../../extension/memecoin-scanner/index.js";

export class WebConnector implements Connector {
  readonly id = "web";
  private app = new Hono();
  private server: ReturnType<typeof serve> | null = null;
  private sseClients = new Map<string, ReadableStreamDefaultController<Uint8Array>>();

  constructor(
    private readonly engine: Engine,
    private readonly registry: ConnectorRegistry,
    private readonly eventLog: EventLog,
    private readonly solanaTrading: SolanaTradingExtension,
    private readonly port: number,
  ) {
    this.setupRoutes();
    this.eventLog.subscribe((event) => {
      this.broadcast({ type: "event", data: event });
    });
  }

  private setupRoutes(): void {
    const { app, engine, registry } = this;

    app.use("*", async (c, next) => {
      await next();
      c.header("Access-Control-Allow-Origin", "*");
      c.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      c.header("Access-Control-Allow-Headers", "Content-Type");
    });
    app.options("*", (c) => c.text("ok"));

    // ── Health ────────────────────────────────────────────────────────────────
    app.get("/health", (c) => c.json({ status: "ok", ts: Date.now() }));

    // ── SSE stream ────────────────────────────────────────────────────────────
    app.get("/events", (c) => {
      const clientId = randomUUID();
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start: (controller) => {
          this.sseClients.set(clientId, controller);
          controller.enqueue(encoder.encode(": ping\n\n"));
          c.req.raw.signal.addEventListener("abort", () => {
            this.sseClients.delete(clientId);
          });
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    });

    // ── Chat ──────────────────────────────────────────────────────────────────
    app.post("/chat", async (c) => {
      const body = await c.req.json<{ message: string; sessionId?: string; userId?: string }>();
      const sessionId = body.sessionId ?? "web-default";
      const userId = body.userId ?? "web-user";
      registry.recordInteraction("web", userId);
      const ctx = { sessionId, connectorId: "web", userId };
      const reply = await engine.chat(body.message, ctx);
      this.broadcast({ type: "chat.reply", reply, sessionId });
      return c.json({ reply, sessionId });
    });

    // ── Wallet ────────────────────────────────────────────────────────────────
    app.get("/api/wallet", async (c) => {
      try {
        const wallet = this.solanaTrading.getWallet();
        const [sol, tokens] = await Promise.all([wallet.getSolBalance(), wallet.getTokenHoldings()]);
        return c.json({ address: wallet.address, solBalance: sol, tokens });
      } catch (err) { return c.json({ error: String(err) }, 500); }
    });

    // ── Positions + P&L ───────────────────────────────────────────────────────
    app.get("/api/positions", async (c) => {
      try {
        const positions = await this.solanaTrading.getPnL().getPositions();
        const summary = await this.solanaTrading.getPnL().summary();
        return c.json({ positions, summary });
      } catch (err) { return c.json({ error: String(err) }, 500); }
    });

    // ── Trade history ─────────────────────────────────────────────────────────
    app.get("/api/trades", async (c) => {
      const limit = Number(c.req.query("limit") ?? "50");
      return c.json({ trades: await this.solanaTrading.getPnL().recent(limit) });
    });

    // ── Scanner ───────────────────────────────────────────────────────────────
    app.get("/api/scanner", (c) => c.json(getLatestScanResults()));

    // ── Event log ─────────────────────────────────────────────────────────────
    app.get("/api/events", async (c) => {
      const limit = Number(c.req.query("limit") ?? "50");
      return c.json({ events: await this.eventLog.tail(limit) });
    });

    // ── Brain state ───────────────────────────────────────────────────────────
    app.get("/api/brain", (c) => {
      try {
        const memFile = "data/brain/memory.json";
        const emotionFile = "data/brain/emotion.jsonl";
        const memory = fs.existsSync(memFile)
          ? JSON.parse(fs.readFileSync(memFile, "utf8"))
          : { frontalLobe: "", lastUpdated: 0 };
        const emotions = fs.existsSync(emotionFile)
          ? fs.readFileSync(emotionFile, "utf8").split("\n").filter(Boolean)
              .slice(-30).reverse().map((l) => JSON.parse(l))
          : [];
        return c.json({ memory, emotions });
      } catch (err) { return c.json({ error: String(err) }, 500); }
    });

    // ── Safe config ───────────────────────────────────────────────────────────
    app.get("/api/config", (c) => {
      try {
        const readJson = (p: string) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
        const solRaw = readJson("data/config/solana.json") as Record<string, unknown>;
        const { privateKey: _pk, ...solana } = solRaw;
        const model = (readJson("data/config/model.json") as Record<string, unknown>).model ?? "gpt-4o";
        const connCfg = readJson("data/config/connectors.json") as Record<string, unknown>;
        return c.json({ solana, model, webPort: connCfg.webPort ?? 3002 });
      } catch (err) { return c.json({ error: String(err) }, 500); }
    });

    // ── Analytics ─────────────────────────────────────────────────────────────
    app.get("/api/analytics", async (c) => {
      try {
        const all = await this.solanaTrading.getPnL().recent(1000);
        const buys = all.filter((t: { type: string }) => t.type === "buy");
        const sells = all.filter((t: { type: string }) => t.type === "sell");
        const totalPnl = sells.reduce((s: number, t: { solAmount: number }) => s + t.solAmount, 0)
                       - buys.reduce((s: number, t: { solAmount: number }) => s + t.solAmount, 0);
        const solSpent = buys.reduce((s: number, t: { solAmount: number }) => s + t.solAmount, 0);
        const solReceived = sells.reduce((s: number, t: { solAmount: number }) => s + t.solAmount, 0);
        const winRate = buys.length > 0 ? Math.round((sells.length / buys.length) * 100) : 0;
        // Build cumulative PnL timeline
        let cumulative = 0;
        const timeline = all.map((t: { type: string; solAmount: number; timestamp: number }) => {
          cumulative += t.type === "sell" ? t.solAmount : -t.solAmount;
          return { ts: t.timestamp, value: cumulative };
        });
        return c.json({ totalPnl, solSpent, solReceived, winRate,
          totalBuys: buys.length, totalSells: sells.length, timeline });
      } catch (err) { return c.json({ error: String(err) }, 500); }
    });

    // ── Static UI (production build) ──────────────────────────────────────────
    app.get("/*", async (c) => {
      const uiDist = "ui/dist";
      const url = new URL(c.req.url);
      let fp = `${uiDist}${url.pathname}`;
      if (!fp.includes(".") || fp.endsWith("/")) fp = `${uiDist}/index.html`;
      if (!fs.existsSync(fp)) fp = `${uiDist}/index.html`;
      if (!fs.existsSync(fp)) return c.text("UI not built. Run: cd ui && pnpm build", 404);
      const content = fs.readFileSync(fp);
      const mime: Record<string, string> = {
        html: "text/html", js: "application/javascript", css: "text/css",
        png: "image/png", svg: "image/svg+xml", ico: "image/x-icon",
      };
      const ext = fp.split(".").pop() ?? "html";
      return new Response(content, { headers: { "Content-Type": mime[ext] ?? "text/plain" } });
    });
  }

  broadcast(payload: unknown): void {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    const bytes = new TextEncoder().encode(data);
    for (const [id, ctrl] of this.sseClients) {
      try { ctrl.enqueue(bytes); } catch { this.sseClients.delete(id); }
    }
  }

  async start(): Promise<void> {
    this.server = serve({ fetch: this.app.fetch, port: this.port });
    console.log(`[WebConnector] http://localhost:${this.port}`);
  }

  async stop(): Promise<void> {
    if (this.server) (this.server as { close: () => void }).close();
  }

  async send(_userId: string, text: string): Promise<void> {
    this.broadcast({ type: "chat.reply", reply: text });
  }
}
