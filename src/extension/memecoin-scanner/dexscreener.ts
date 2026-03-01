const DEXSCREENER_API = "https://api.dexscreener.com";

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
  age?: string;   // "5m", "2h", "1d"
  pairAddress: string;
  url: string;
}

/** Parse a DexScreener pair into a normalised DexToken */
function parsePair(pair: Record<string, unknown>): DexToken | null {
  try {
    const baseToken = pair.baseToken as Record<string, string>;
    const priceUsd = parseFloat((pair.priceUsd as string | undefined) ?? "0");
    const priceNative = parseFloat((pair.priceNative as string | undefined) ?? "0");
    const liquidity = (pair.liquidity as Record<string, number> | undefined)?.usd ?? 0;
    const volume = (pair.volume as Record<string, number> | undefined)?.h24 ?? 0;
    const priceChange = pair.priceChange as Record<string, number> | undefined;

    return {
      mint: baseToken.address,
      symbol: baseToken.symbol,
      name: baseToken.name,
      priceUsd,
      priceSol: priceNative,
      liquidityUsd: liquidity,
      volume24h: volume,
      priceChange24h: priceChange?.h24 ?? 0,
      priceChange1h: priceChange?.h1 ?? 0,
      marketCapUsd: typeof pair.marketCap === "number" ? pair.marketCap : undefined,
      pairAddress: pair.pairAddress as string,
      url: pair.url as string,
    };
  } catch {
    return null;
  }
}

export class DexScreenerClient {
  /** Get trending Solana tokens (boosted/featured) */
  async getTrending(): Promise<DexToken[]> {
    const res = await fetch(`${DEXSCREENER_API}/token-boosts/top/v1`);
    if (!res.ok) throw new Error(`DexScreener trending failed: ${res.status}`);
    const data = (await res.json()) as { tokenAddress: string; chainId: string }[];

    // Get full details for Solana tokens only
    const solanaMints = data
      .filter((t) => t.chainId === "solana")
      .slice(0, 15)
      .map((t) => t.tokenAddress);

    if (solanaMints.length === 0) return [];
    return this.getTokens(solanaMints);
  }

  /** Get token info by mint addresses (max 30 per call) */
  async getTokens(mints: string[]): Promise<DexToken[]> {
    const results: DexToken[] = [];
    const chunks = [];
    for (let i = 0; i < mints.length; i += 30) chunks.push(mints.slice(i, i + 30));

    for (const chunk of chunks) {
      const res = await fetch(`${DEXSCREENER_API}/tokens/solana/${chunk.join(",")}`);
      if (!res.ok) continue;
      const data = (await res.json()) as { pairs?: Record<string, unknown>[] };
      for (const pair of data.pairs ?? []) {
        const token = parsePair(pair);
        if (token) results.push(token);
      }
    }

    return results;
  }

  /** Search for tokens by name or symbol */
  async search(query: string): Promise<DexToken[]> {
    const res = await fetch(`${DEXSCREENER_API}/latest/dex/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`DexScreener search failed: ${res.status}`);
    const data = (await res.json()) as { pairs?: Record<string, unknown>[] };
    return (data.pairs ?? [])
      .filter((p) => (p.chainId as string) === "solana")
      .slice(0, 10)
      .map(parsePair)
      .filter(Boolean) as DexToken[];
  }

  /** Get latest pairs on Solana (new listings) */
  async getNewPairs(): Promise<DexToken[]> {
    const res = await fetch(`${DEXSCREENER_API}/latest/dex/pairs/solana`);
    if (!res.ok) throw new Error(`DexScreener new pairs failed: ${res.status}`);
    const data = (await res.json()) as { pairs?: Record<string, unknown>[] };
    return (data.pairs ?? [])
      .slice(0, 20)
      .map(parsePair)
      .filter(Boolean) as DexToken[];
  }
}
