// ── API types shared between frontend and backend ─────────────────────────────

export interface WalletInfo {
  address: string;
  solBalance: number;
  tokens: { mint: string; symbol: string; uiAmount: number; decimals: number }[];
}

export interface Position {
  mint: string;
  symbol: string;
  tokenAmount: number;
  costBasisSol: number;
  avgEntryPriceSol: number;
  currentPriceSol?: number;
  pnlSol?: number;
  pnlPercent?: number;
}

export interface PositionsSummary {
  totalTrades: number;
  totalRealizedPnlSol: number;
}

export interface Trade {
  id: string;
  type: "buy" | "sell";
  timestamp: number;
  mint: string;
  symbol: string;
  solAmount: number;
  tokenAmount: number;
  pricePerToken: number;
  signature: string;
  reasoning: string;
}

export interface DexToken {
  mint: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceSol: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange24h: number;
  priceChange1h: number;
  marketCapUsd?: number;
  url: string;
}

export interface PumpToken {
  mint: string;
  symbol: string;
  name: string;
  description: string;
  marketCapUsd: number;
  replies: number;
  twitter?: string;
}

export interface AppEvent {
  id: string;
  type: string;
  payload: unknown;
  ts: number;
}

// SSE message shapes
export type SSEMessage =
  | { type: "event"; data: AppEvent }
  | { type: "chat.reply"; reply: string; sessionId: string };

export interface BrainState {
  memory: { frontalLobe: string; lastUpdated: number } | null;
  emotions: Array<{ timestamp: number; emotion: string; sentiment: number; rationale: string }>;
}

export interface AgentConfig {
  solana: {
    rpcUrl?: string;
    maxSolPerTrade?: number;
    maxPositionPercent?: number;
    slippageBps?: number;
    minLiquidityUsd?: number;
    cooldownSeconds?: number;
    stopLossPercent?: number;
    takeProfitPercent?: number;
    autoTrading?: boolean;
    tradingIntervalMinutes?: number;
  };
  model: string;
  webPort: number;
}

export interface Analytics {
  totalPnl: number;
  solSpent: number;
  solReceived: number;
  winRate: number;
  totalBuys: number;
  totalSells: number;
  timeline: Array<{ ts: number; value: number }>;
}

