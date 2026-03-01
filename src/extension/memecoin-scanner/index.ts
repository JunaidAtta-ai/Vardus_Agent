import { z } from "zod";
import { DexScreenerClient } from "./dexscreener.js";
import { PumpFunClient } from "./pumpfun.js";
import type { Extension, ToolDefinition, EngineContext } from "../../core/types.js";
import type { DexToken } from "./dexscreener.js";
import type { PumpFunToken } from "./pumpfun.js";

// Latest scan results — shared with web API
let latestTrending: DexToken[] = [];
let latestPumpFun: PumpFunToken[] = [];

export function getLatestScanResults(): { trending: DexToken[]; pumpfun: PumpFunToken[] } {
  return { trending: latestTrending, pumpfun: latestPumpFun };
}

export class MemecoinScannerExtension implements Extension {
  readonly id = "memecoin-scanner";
  readonly name = "Memecoin Scanner";

  private dex = new DexScreenerClient();
  private pump = new PumpFunClient();
  private updateTimer: ReturnType<typeof setInterval> | null = null;

  async initialize(_ctx: EngineContext): Promise<void> {
    // Pre-populate cache on startup
    await this.refresh().catch(console.error);
    // Refresh every 5 minutes
    this.updateTimer = setInterval(() => this.refresh().catch(console.error), 5 * 60_000);
    console.log("[MemecoinScanner] Started background refresh every 5 min");
  }

  async destroy(): Promise<void> {
    if (this.updateTimer) clearInterval(this.updateTimer);
  }

  private async refresh(): Promise<void> {
    const [trending, pumpfun] = await Promise.allSettled([
      this.dex.getTrending(),
      this.pump.getTrending(15),
    ]);
    if (trending.status === "fulfilled") latestTrending = trending.value;
    if (pumpfun.status === "fulfilled") latestPumpFun = pumpfun.value;
  }

  readonly tools: ToolDefinition[] = [
    // ── scanTrending ──────────────────────────────────────────────────────────
    {
      name: "scanTrending",
      description: "Get trending Solana memecoins from DexScreener with price/volume/liquidity data.",
      parameters: z.object({
        minLiquidityUsd: z.number().default(5000).describe("Minimum liquidity in USD"),
        limit: z.number().int().positive().default(10),
      }),
      execute: async (args, _ctx) => {
        const { minLiquidityUsd, limit } = args as { minLiquidityUsd: number; limit: number };
        const tokens = latestTrending.length > 0
          ? latestTrending
          : await this.dex.getTrending();
        return {
          tokens: tokens
            .filter((t) => t.liquidityUsd >= minLiquidityUsd)
            .slice(0, limit),
        };
      },
    },

    // ── scanPumpFun ───────────────────────────────────────────────────────────
    {
      name: "scanPumpFun",
      description: "Get new and trending tokens launching on Pump.fun (Solana memecoins).",
      parameters: z.object({
        mode: z.enum(["new", "trending"]).default("trending"),
        limit: z.number().int().positive().default(10),
      }),
      execute: async (args, _ctx) => {
        const { mode, limit } = args as { mode: "new" | "trending"; limit: number };
        const tokens = mode === "new"
          ? await this.pump.getNewTokens(limit)
          : (latestPumpFun.length > 0 ? latestPumpFun : await this.pump.getTrending(limit));
        return { tokens: tokens.slice(0, limit) };
      },
    },

    // ── searchToken ───────────────────────────────────────────────────────────
    {
      name: "searchToken",
      description: "Search for a specific Solana token by name, symbol, or mint address.",
      parameters: z.object({
        query: z.string().describe("Search term — token name, symbol, or mint address"),
      }),
      execute: async (args, _ctx) => {
        const { query } = args as { query: string };
        const results = await this.dex.search(query);
        return { results };
      },
    },

    // ── getTokenInfo ──────────────────────────────────────────────────────────
    {
      name: "getTokenInfo",
      description: "Get detailed price and market data for a specific Solana token by mint address.",
      parameters: z.object({
        mint: z.string().describe("Token mint address"),
      }),
      execute: async (args, _ctx) => {
        const { mint } = args as { mint: string };
        const [dexData, pumpData] = await Promise.allSettled([
          this.dex.getTokens([mint]),
          this.pump.getToken(mint),
        ]);
        return {
          dex: dexData.status === "fulfilled" ? dexData.value[0] ?? null : null,
          pumpfun: pumpData.status === "fulfilled" ? pumpData.value : null,
        };
      },
    },

    // ── getNewListings ────────────────────────────────────────────────────────
    {
      name: "getNewListings",
      description: "Get the newest token pairs listed on Solana DEXes (last few hours).",
      parameters: z.object({
        limit: z.number().int().positive().default(10),
      }),
      execute: async (args, _ctx) => {
        const { limit } = args as { limit: number };
        const pairs = await this.dex.getNewPairs();
        return { pairs: pairs.slice(0, limit) };
      },
    },
  ];
}
