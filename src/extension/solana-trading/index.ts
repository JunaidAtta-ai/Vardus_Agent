import { z } from "zod";
import * as fs from "fs";
import { SolanaWallet } from "./wallet.js";
import { JupiterClient } from "./jupiter.js";
import { PnLTracker } from "./pnl.js";
import { EventLog } from "../../core/event-log.js";
import type { Extension, ToolDefinition, EngineContext } from "../../core/types.js";

function loadSolanaConfig(): unknown {
  const p = "data/config/solana.json";
  const fromFile = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
  return {
    ...fromFile,
    ...(process.env.SOLANA_PRIVATE_KEY ? { privateKey: process.env.SOLANA_PRIVATE_KEY } : {}),
    ...(process.env.SOLANA_RPC_URL     ? { rpcUrl:     process.env.SOLANA_RPC_URL     } : {}),
  };
}

export class SolanaTradingExtension implements Extension {
  readonly id = "solana-trading";
  readonly name = "Solana Trading";

  private wallet!: SolanaWallet;
  private jupiter!: JupiterClient;
  public pnl = new PnLTracker();
  private lastTradeAt: Record<string, number> = {};

  constructor(private readonly eventLog: EventLog) {}

  async initialize(_ctx: EngineContext): Promise<void> {
    const cfg = loadSolanaConfig();
    this.wallet = await SolanaWallet.create(cfg);
    this.jupiter = new JupiterClient(this.wallet);
    const sol = await this.wallet.getSolBalance();
    console.log(`[SolanaTrading] Wallet: ${this.wallet.address}`);
    console.log(`[SolanaTrading] Balance: ${sol.toFixed(4)} SOL`);
  }

  getWallet(): SolanaWallet { return this.wallet; }
  getPnL(): PnLTracker { return this.pnl; }

  readonly tools: ToolDefinition[] = [
    // ── walletInfo ────────────────────────────────────────────────────────────
    {
      name: "walletInfo",
      description: "Get wallet address, SOL balance, and all token holdings.",
      parameters: z.object({}),
      execute: async (_args, _ctx) => {
        const sol = await this.wallet.getSolBalance();
        const tokens = await this.wallet.getTokenHoldings();
        return { address: this.wallet.address, solBalance: sol, tokens };
      },
    },

    // ── solanaBuy ─────────────────────────────────────────────────────────────
    {
      name: "solanaBuy",
      description: "Buy a Solana memecoin via Jupiter DEX. Specify mint address and SOL amount.",
      parameters: z.object({
        mint: z.string().describe("Token mint address"),
        symbol: z.string().describe("Token symbol (e.g. BONK)"),
        solAmount: z.number().positive().describe("Amount of SOL to spend"),
        reasoning: z.string().describe("Why you are buying this token"),
      }),
      execute: async (args, _ctx) => {
        const { mint, symbol, solAmount, reasoning } = args as {
          mint: string; symbol: string; solAmount: number; reasoning: string;
        };
        const cfg = this.wallet.config;

        // Guard: max SOL per trade
        if (solAmount > cfg.maxSolPerTrade) {
          return { success: false, reason: `Exceeds maxSolPerTrade (${cfg.maxSolPerTrade} SOL)` };
        }

        // Guard: cooldown
        const lastAt = this.lastTradeAt[mint];
        if (lastAt && (Date.now() - lastAt) / 1000 < cfg.cooldownSeconds) {
          return { success: false, reason: `Cooldown active for ${symbol}` };
        }

        try {
          const result = await this.jupiter.buyToken({ mint, solAmount });
          this.lastTradeAt[mint] = Date.now();

          const tokenAmount = result.outAmountTokens ?? 0;
          const trade = this.pnl.record({
            type: "buy",
            timestamp: Date.now(),
            mint,
            symbol,
            solAmount,
            tokenAmount,
            pricePerToken: tokenAmount > 0 ? solAmount / tokenAmount : 0,
            signature: result.signature,
            reasoning,
          });

          await this.eventLog.emit("trade.pushed", {
            action: "buy", mint, symbol, solAmount, tokenAmount,
            signature: result.signature, reasoning, tradeId: trade.id,
          });

          return { success: true, signature: result.signature, tokenAmount, tradeId: trade.id };
        } catch (err) {
          await this.eventLog.emit("error", { source: "solanaBuy", mint, error: String(err) });
          return { success: false, reason: String(err) };
        }
      },
    },

    // ── solanaSell ────────────────────────────────────────────────────────────
    {
      name: "solanaSell",
      description: "Sell a Solana memecoin back to SOL via Jupiter DEX.",
      parameters: z.object({
        mint: z.string().describe("Token mint address"),
        symbol: z.string().describe("Token symbol"),
        percentToSell: z.number().min(1).max(100).default(100).describe("% of holdings to sell"),
        reasoning: z.string().describe("Why you are selling"),
      }),
      execute: async (args, _ctx) => {
        const { mint, symbol, percentToSell, reasoning } = args as {
          mint: string; symbol: string; percentToSell: number; reasoning: string;
        };

        const holdings = await this.wallet.getTokenHoldings();
        const holding = holdings.find((h) => h.mint === mint);
        if (!holding || holding.uiAmount === 0) {
          return { success: false, reason: `No holdings found for ${symbol}` };
        }

        const rawAmount = Math.floor(holding.amount * (percentToSell / 100));
        if (rawAmount === 0) return { success: false, reason: "Amount too small" };

        try {
          const result = await this.jupiter.sellToken({ mint, tokenAmount: rawAmount });
          this.lastTradeAt[mint] = Date.now();

          const solReceived = (result.outAmountTokens ?? 0) / 1_000_000_000;
          const trade = this.pnl.record({
            type: "sell",
            timestamp: Date.now(),
            mint,
            symbol,
            solAmount: solReceived,
            tokenAmount: rawAmount,
            pricePerToken: rawAmount > 0 ? solReceived / rawAmount : 0,
            signature: result.signature,
            reasoning,
          });

          await this.eventLog.emit("trade.pushed", {
            action: "sell", mint, symbol, solReceived, tokenAmountSold: rawAmount,
            signature: result.signature, reasoning, tradeId: trade.id,
          });

          return { success: true, signature: result.signature, solReceived, tradeId: trade.id };
        } catch (err) {
          await this.eventLog.emit("error", { source: "solanaSell", mint, error: String(err) });
          return { success: false, reason: String(err) };
        }
      },
    },

    // ── positionsInfo ─────────────────────────────────────────────────────────
    {
      name: "positionsInfo",
      description: "Get current open positions and P&L summary.",
      parameters: z.object({}),
      execute: async (_args, _ctx) => {
        const positions = await this.pnl.getPositions();
        const summary = await this.pnl.summary();
        return { positions, summary };
      },
    },

    // ── tradeHistory ──────────────────────────────────────────────────────────
    {
      name: "tradeHistory",
      description: "Show recent trade history.",
      parameters: z.object({
        limit: z.number().int().positive().default(20),
      }),
      execute: async (args, _ctx) => {
        const { limit } = args as { limit: number };
        return { trades: await this.pnl.recent(limit) };
      },
    },
  ];
}
