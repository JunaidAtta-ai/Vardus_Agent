export interface PumpFunToken {
  mint: string;
  symbol: string;
  name: string;
  description: string;
  createdAt: number;
  priceUsd: number;
  marketCapUsd: number;
  replies: number;
  twitter?: string;
  telegram?: string;
  website?: string;
  imageUri?: string;
}

/**
 * Pump.fun API client — fetches newly launched and trending memecoins.
 * Uses the public Pump.fun API.
 */
export class PumpFunClient {
  private readonly baseUrl = "https://frontend-api.pump.fun";

  /** Get newest tokens (just launched) */
  async getNewTokens(limit = 20): Promise<PumpFunToken[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/coins?offset=0&limit=${limit}&sort=created_timestamp&order=DESC&includeNsfw=false`,
      );
      if (!res.ok) throw new Error(`Pump.fun API error: ${res.status}`);
      const data = (await res.json()) as Record<string, unknown>[];
      return data.map(this.parseToken).filter(Boolean) as PumpFunToken[];
    } catch (err) {
      console.warn("[PumpFun] Failed to fetch new tokens:", err);
      return [];
    }
  }

  /** Get trending tokens on Pump.fun by reply count (social activity) */
  async getTrending(limit = 20): Promise<PumpFunToken[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/coins?offset=0&limit=${limit}&sort=reply_count&order=DESC&includeNsfw=false`,
      );
      if (!res.ok) throw new Error(`Pump.fun API error: ${res.status}`);
      const data = (await res.json()) as Record<string, unknown>[];
      return data.map(this.parseToken).filter(Boolean) as PumpFunToken[];
    } catch (err) {
      console.warn("[PumpFun] Failed to fetch trending tokens:", err);
      return [];
    }
  }

  /** Get a single token by mint */
  async getToken(mint: string): Promise<PumpFunToken | null> {
    try {
      const res = await fetch(`${this.baseUrl}/coins/${mint}`);
      if (!res.ok) return null;
      return this.parseToken(await res.json() as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  private parseToken(raw: Record<string, unknown>): PumpFunToken | null {
    try {
      return {
        mint: raw.mint as string,
        symbol: raw.symbol as string,
        name: raw.name as string,
        description: (raw.description as string) ?? "",
        createdAt: Number(raw.created_timestamp),
        priceUsd: Number(raw.usd_market_cap ?? 0) / 1_000_000_000,
        marketCapUsd: Number(raw.usd_market_cap ?? 0),
        replies: Number(raw.reply_count ?? 0),
        twitter: raw.twitter as string | undefined,
        telegram: raw.telegram as string | undefined,
        website: raw.website as string | undefined,
        imageUri: raw.image_uri as string | undefined,
      };
    } catch {
      return null;
    }
  }
}
