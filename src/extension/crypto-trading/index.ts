import { z } from "zod";
import ccxt from "ccxt";
import { CryptoWallet } from "./wallet.js";
import { CryptoGuard } from "./guard.js";
import { getConfig } from "../../core/config.js";
import { EventLog } from "../../core/event-log.js";
import type { Extension, ToolDefinition, EngineContext } from "../../core/types.js";

export class CryptoTradingExtension implements Extension {
  readonly id = "crypto-trading";
  readonly name = "Crypto Trading";

  private wallet = new CryptoWallet();
  private guard = new CryptoGuard();
  private exchange: ccxt.Exchange | null = null;

  constructor(private readonly eventLog: EventLog) {}

  async initialize(_ctx: EngineContext): Promise<void> {
    const cfg = getConfig().crypto;
    const ExchangeClass = (ccxt as unknown as Record<string, new (opts: object) => ccxt.Exchange>)[cfg.exchange];
    if (!ExchangeClass) throw new Error(`[CryptoTrading] Unknown exchange: ${cfg.exchange}`);

    this.exchange = new ExchangeClass({
      apiKey: cfg.apiKey,
      secret: cfg.apiSecret,
      ...(cfg.testnet ? { options: { defaultType: "future" } } : {}),
    });

    if (cfg.testnet && typeof (this.exchange as unknown as Record<string, unknown>).setSandboxMode === "function") {
      (this.exchange as unknown as { setSandboxMode: (v: boolean) => void }).setSandboxMode(true);
    }

    console.log(`[CryptoTrading] Connected to ${cfg.exchange} (testnet=${cfg.testnet})`);
  }

  readonly tools: ToolDefinition[] = [
    // ── walletStage ──────────────────────────────────────────────────────────
    {
      name: "walletStage",
      description: "Stage a crypto order into the wallet (does NOT execute it yet).",
      parameters: z.object({
        symbol: z.string().describe("Trading pair, e.g. BTC/USDT"),
        side: z.enum(["buy", "sell"]),
        amount: z.number().positive().describe("Amount in base currency"),
        orderType: z.enum(["market", "limit"]).default("market"),
        price: z.number().optional().describe("Limit price (required for limit orders)"),
      }),
      execute: async (args, _ctx) => {
        const order = args as { symbol: string; side: "buy" | "sell"; amount: number; orderType: "market" | "limit"; price?: number };
        const guardResult = this.guard.check(order);
        if (!guardResult.allowed) {
          await this.eventLog.emit("guard.blocked", { order, reason: guardResult.reason });
          return { success: false, reason: guardResult.reason };
        }
        this.wallet.stageOrder(order);
        await this.eventLog.emit("trade.staged", { order });
        return { success: true, staged: this.wallet.getStagedOrders() };
      },
    },

    // ── walletCommit ─────────────────────────────────────────────────────────
    {
      name: "walletCommit",
      description: "Commit all staged orders with a message. Returns a commit hash.",
      parameters: z.object({
        message: z.string().describe("Commit message describing the trading rationale"),
      }),
      execute: async (args, _ctx) => {
        const commit = this.wallet.commit((args as { message: string }).message);
        await this.eventLog.emit("trade.committed", { commit });
        return { success: true, hash: commit.hash, orders: commit.orders };
      },
    },

    // ── walletPush ───────────────────────────────────────────────────────────
    {
      name: "walletPush",
      description: "Push (execute) a committed order batch on the exchange.",
      parameters: z.object({
        hash: z.string().describe("8-char commit hash from walletCommit"),
      }),
      execute: async (args, _ctx) => {
        const { hash } = args as { hash: string };
        const commit = this.wallet.getCommit(hash);
        if (!commit) return { success: false, reason: `Commit ${hash} not found.` };
        if (commit.status !== "pending") return { success: false, reason: `Commit ${hash} is already ${commit.status}.` };
        if (!this.exchange) return { success: false, reason: "Exchange not initialised." };

        const results: unknown[] = [];
        for (const order of commit.orders) {
          try {
            const result = order.orderType === "limit"
              ? await this.exchange.createLimitOrder(order.symbol, order.side, order.amount, order.price!)
              : await this.exchange.createMarketOrder(order.symbol, order.side, order.amount);
            this.guard.recordTrade(order.symbol);
            results.push(result);
          } catch (err) {
            this.wallet.markFailed(hash);
            await this.eventLog.emit("error", { hash, order, error: String(err) });
            return { success: false, reason: String(err), partial: results };
          }
        }

        this.wallet.markPushed(hash);
        await this.eventLog.emit("trade.pushed", { hash, results });
        return { success: true, hash, results };
      },
    },

    // ── walletLog ────────────────────────────────────────────────────────────
    {
      name: "walletLog",
      description: "Show the wallet commit history.",
      parameters: z.object({
        limit: z.number().int().positive().default(10),
      }),
      execute: async (args, _ctx) => {
        const { limit } = args as { limit: number };
        const log = this.wallet.getLog().slice(-limit);
        return { commits: log };
      },
    },

    // ── walletStatus ─────────────────────────────────────────────────────────
    {
      name: "walletStatus",
      description: "Show currently staged orders.",
      parameters: z.object({}),
      execute: async (_args, _ctx) => {
        return { staged: this.wallet.getStagedOrders() };
      },
    },

    // ── fetchBalance ─────────────────────────────────────────────────────────
    {
      name: "fetchBalance",
      description: "Fetch current account balance from the exchange.",
      parameters: z.object({}),
      execute: async (_args, _ctx) => {
        if (!this.exchange) return { error: "Exchange not initialised." };
        const balance = await this.exchange.fetchBalance();
        return { balance: balance.total };
      },
    },

    // ── fetchTicker ──────────────────────────────────────────────────────────
    {
      name: "fetchTicker",
      description: "Get the latest price ticker for a symbol.",
      parameters: z.object({
        symbol: z.string().describe("Trading pair, e.g. BTC/USDT"),
      }),
      execute: async (args, _ctx) => {
        if (!this.exchange) return { error: "Exchange not initialised." };
        const { symbol } = args as { symbol: string };
        const ticker = await this.exchange.fetchTicker(symbol);
        return { symbol, price: ticker.last, bid: ticker.bid, ask: ticker.ask, volume: ticker.quoteVolume };
      },
    },

    // ── fetchOHLCV ───────────────────────────────────────────────────────────
    {
      name: "fetchOHLCV",
      description: "Fetch OHLCV (candlestick) data for a symbol.",
      parameters: z.object({
        symbol: z.string(),
        timeframe: z.string().default("1h"),
        limit: z.number().int().positive().default(50),
      }),
      execute: async (args, _ctx) => {
        if (!this.exchange) return { error: "Exchange not initialised." };
        const { symbol, timeframe, limit } = args as { symbol: string; timeframe: string; limit: number };
        const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
        return { symbol, timeframe, candles: ohlcv.map(([t, o, h, l, c, v]) => ({ t, o, h, l, c, v })) };
      },
    },
  ];
}
