import { z } from "zod";
import type { Extension, ToolDefinition, EngineContext } from "../../core/types.js";

// ── Tiny indicator helpers ────────────────────────────────────────────────────

function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values[0];
  result.push(prev);
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result.slice(period - 1);
}

function rsi(closes: number[], period = 14): number[] {
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }
  const rsiValues: number[] = [];
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    if (avgLoss === 0) { rsiValues.push(100); continue; }
    const rs = avgGain / avgLoss;
    rsiValues.push(100 - 100 / (1 + rs));
  }
  return rsiValues;
}

// ─────────────────────────────────────────────────────────────────────────────

export class AnalysisKitExtension implements Extension {
  readonly id = "analysis-kit";
  readonly name = "Analysis Kit";

  readonly tools: ToolDefinition[] = [
    {
      name: "calcSMA",
      description: "Calculate Simple Moving Average for an array of close prices.",
      parameters: z.object({
        closes: z.array(z.number()).describe("Array of closing prices (oldest first)"),
        period: z.number().int().positive().default(20),
      }),
      execute: async (args, _ctx) => {
        const { closes, period } = args as { closes: number[]; period: number };
        return { sma: sma(closes, period) };
      },
    },

    {
      name: "calcEMA",
      description: "Calculate Exponential Moving Average for an array of close prices.",
      parameters: z.object({
        closes: z.array(z.number()),
        period: z.number().int().positive().default(20),
      }),
      execute: async (args, _ctx) => {
        const { closes, period } = args as { closes: number[]; period: number };
        return { ema: ema(closes, period) };
      },
    },

    {
      name: "calcRSI",
      description: "Calculate RSI (Relative Strength Index) for an array of close prices.",
      parameters: z.object({
        closes: z.array(z.number()),
        period: z.number().int().positive().default(14),
      }),
      execute: async (args, _ctx) => {
        const { closes, period } = args as { closes: number[]; period: number };
        return { rsi: rsi(closes, period) };
      },
    },

    {
      name: "calcMACD",
      description: "Calculate MACD (12/26/9) for an array of close prices.",
      parameters: z.object({
        closes: z.array(z.number()),
      }),
      execute: async (args, _ctx) => {
        const { closes } = args as { closes: number[] };
        const fast = ema(closes, 12);
        const slow = ema(closes, 26);
        const len = Math.min(fast.length, slow.length);
        const macdLine = fast.slice(fast.length - len).map((v, i) => v - slow[slow.length - len + i]);
        const signal = ema(macdLine, 9);
        const histogram = macdLine.slice(macdLine.length - signal.length).map((v, i) => v - signal[i]);
        return { macd: macdLine, signal, histogram };
      },
    },

    {
      name: "priceStats",
      description: "Basic statistics for an array of prices: min, max, mean, stddev.",
      parameters: z.object({
        prices: z.array(z.number()),
      }),
      execute: async (args, _ctx) => {
        const { prices } = args as { prices: number[] };
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length;
        return { min, max, mean, stddev: Math.sqrt(variance) };
      },
    },
  ];
}
