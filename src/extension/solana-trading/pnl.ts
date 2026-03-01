import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { randomUUID } from "crypto";

const PNL_DIR = path.resolve("data/solana-trading");
const PNL_FILE = path.join(PNL_DIR, "trades.jsonl");

export type TradeType = "buy" | "sell";

export interface TradeRecord {
  id: string;
  type: TradeType;
  timestamp: number;
  mint: string;
  symbol: string;
  solAmount: number;
  tokenAmount: number;
  pricePerToken: number;  // in SOL
  signature: string;
  reasoning: string;
}

export interface Position {
  mint: string;
  symbol: string;
  tokenAmount: number;
  costBasisSol: number;     // total SOL spent
  avgEntryPriceSol: number; // SOL per token
  currentPriceSol?: number; // filled by scanner
  pnlSol?: number;
  pnlPercent?: number;
}

export class PnLTracker {
  constructor() {
    fs.mkdirSync(PNL_DIR, { recursive: true });
  }

  /** Record a trade */
  record(trade: Omit<TradeRecord, "id">): TradeRecord {
    const full: TradeRecord = { id: randomUUID().slice(0, 8), ...trade };
    fs.appendFileSync(PNL_FILE, JSON.stringify(full) + "\n", "utf8");
    return full;
  }

  /** Load all trades */
  async loadAll(): Promise<TradeRecord[]> {
    if (!fs.existsSync(PNL_FILE)) return [];
    const trades: TradeRecord[] = [];
    const rl = readline.createInterface({ input: fs.createReadStream(PNL_FILE), crlfDelay: Infinity });
    for await (const line of rl) {
      if (line.trim()) {
        try { trades.push(JSON.parse(line)); } catch { /* skip */ }
      }
    }
    return trades;
  }

  /** Compute current open positions from trade history */
  async getPositions(): Promise<Position[]> {
    const trades = await this.loadAll();
    const positions = new Map<string, Position>();

    for (const t of trades) {
      const pos = positions.get(t.mint) ?? {
        mint: t.mint,
        symbol: t.symbol,
        tokenAmount: 0,
        costBasisSol: 0,
        avgEntryPriceSol: 0,
      };

      if (t.type === "buy") {
        pos.costBasisSol += t.solAmount;
        pos.tokenAmount += t.tokenAmount;
      } else {
        // Proportionally reduce cost basis
        const ratio = t.tokenAmount / (pos.tokenAmount || 1);
        pos.costBasisSol -= pos.costBasisSol * ratio;
        pos.tokenAmount -= t.tokenAmount;
      }

      pos.avgEntryPriceSol = pos.tokenAmount > 0 ? pos.costBasisSol / pos.tokenAmount : 0;
      positions.set(t.mint, pos);
    }

    // Filter out closed / dust positions
    return Array.from(positions.values()).filter((p) => p.tokenAmount > 0.0001);
  }

  /** Get last N trades */
  async recent(n = 20): Promise<TradeRecord[]> {
    const all = await this.loadAll();
    return all.slice(-n);
  }

  /** Summary stats */
  async summary(): Promise<{ totalTrades: number; totalRealizedPnlSol: number }> {
    const all = await this.loadAll();
    let realizedPnl = 0;
    const costBasis = new Map<string, number>();
    const holdings = new Map<string, number>();

    for (const t of all) {
      if (t.type === "buy") {
        costBasis.set(t.mint, (costBasis.get(t.mint) ?? 0) + t.solAmount);
        holdings.set(t.mint, (holdings.get(t.mint) ?? 0) + t.tokenAmount);
      } else {
        const avg = (costBasis.get(t.mint) ?? 0) / (holdings.get(t.mint) ?? 1);
        const cost = avg * t.tokenAmount;
        realizedPnl += t.solAmount - cost;
        holdings.set(t.mint, (holdings.get(t.mint) ?? 0) - t.tokenAmount);
      }
    }

    return { totalTrades: all.length, totalRealizedPnlSol: realizedPnl };
  }
}
