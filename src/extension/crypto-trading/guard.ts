import type { StagedOrder } from "./wallet.js";
import { getConfig } from "../../core/config.js";

export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Guard pipeline — runs a series of safety checks before any order is pushed.
 * Checks are run in order; the first failure blocks the trade.
 */
export class CryptoGuard {
  private lastTradeAt: Record<string, number> = {}; // symbol → unix ms

  check(order: StagedOrder): GuardResult {
    const cfg = getConfig().crypto;
    const guards = cfg.guards;

    // ── 1. Symbol whitelist ────────────────────────────────────────────────
    if (!cfg.allowedSymbols.includes(order.symbol)) {
      return { allowed: false, reason: `Symbol ${order.symbol} is not in the allowed list.` };
    }

    // ── 2. Max position size ───────────────────────────────────────────────
    // Amount here is in base currency units; convert to USD is TODO (needs price feed)
    // Placeholder: block if amount * 100000 (mock price) > maxPositionUsd
    // Replace with real price lookup when price feed is ready.
    // if (estimatedUsd > guards.maxPositionUsd) { ... }

    // ── 3. Cooldown between trades ─────────────────────────────────────────
    const lastAt = this.lastTradeAt[order.symbol];
    if (lastAt !== undefined) {
      const elapsedSec = (Date.now() - lastAt) / 1000;
      if (elapsedSec < guards.cooldownSeconds) {
        return {
          allowed: false,
          reason: `Cooldown active for ${order.symbol}. Wait ${(guards.cooldownSeconds - elapsedSec).toFixed(0)}s.`,
        };
      }
    }

    return { allowed: true };
  }

  recordTrade(symbol: string): void {
    this.lastTradeAt[symbol] = Date.now();
  }
}
