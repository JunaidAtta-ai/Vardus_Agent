import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { z } from "zod";
import { getConfig } from "../../core/config.js";

// ── Config schema (added in config.ts as well) ────────────────────────────────
const SolanaConfigSchema = z.object({
  rpcUrl: z.string().default("https://api.mainnet-beta.solana.com"),
  privateKey: z.string().min(1, "Private key required"),
  maxSolPerTrade: z.number().default(0.5),
  maxPositionPercent: z.number().default(20),
  slippageBps: z.number().int().default(300),
  minLiquidityUsd: z.number().default(10000),
  cooldownSeconds: z.number().default(120),
  stopLossPercent: z.number().default(30),
  takeProfitPercent: z.number().default(100),
  autoTrading: z.boolean().default(true),
  tradingIntervalMinutes: z.number().default(10),
});

export type SolanaConfig = z.infer<typeof SolanaConfigSchema>;

// ── Token account info ────────────────────────────────────────────────────────
export interface TokenHolding {
  mint: string;
  symbol: string;
  amount: number;          // raw units
  uiAmount: number;        // human-readable
  decimals: number;
}

// ── Wallet ────────────────────────────────────────────────────────────────────
export class SolanaWallet {
  public readonly keypair: Keypair;
  public readonly connection: Connection;
  public readonly config: SolanaConfig;

  constructor(_rawConfig?: unknown) {
    // Use SolanaWallet.create() — constructor is intentionally disabled
    throw new Error("Use SolanaWallet.create() instead of new SolanaWallet()");
    // These assignments silence TypeScript strict-property checks:
    this.config = null as unknown as SolanaConfig;
    this.connection = null as unknown as Connection;
    this.keypair = null as unknown as Keypair;
  }

  static async create(rawConfig: unknown): Promise<SolanaWallet> {
    const config = SolanaConfigSchema.parse(rawConfig);
    const bs58 = await import("bs58");
    const secretKey = bs58.default.decode(config.privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);
    return Object.assign(Object.create(SolanaWallet.prototype), {
      keypair,
      connection: new Connection(config.rpcUrl, "confirmed"),
      config,
    }) as SolanaWallet;
  }

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  get address(): string {
    return this.keypair.publicKey.toString();
  }

  /** SOL balance in SOL (not lamports) */
  async getSolBalance(): Promise<number> {
    const lamports = await this.connection.getBalance(this.publicKey);
    return lamports / LAMPORTS_PER_SOL;
  }

  /** All SPL token accounts held by this wallet */
  async getTokenHoldings(): Promise<TokenHolding[]> {
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      this.publicKey,
      { programId: TOKEN_PROGRAM_ID },
    );

    return tokenAccounts.value
      .map((a) => {
        const parsed = a.account.data.parsed.info;
        const uiAmount = parsed.tokenAmount.uiAmount ?? 0;
        if (uiAmount === 0) return null;
        return {
          mint: parsed.mint as string,
          symbol: "???",          // enriched by DexScreener in scanner
          amount: Number(parsed.tokenAmount.amount),
          uiAmount,
          decimals: parsed.tokenAmount.decimals as number,
        } satisfies TokenHolding;
      })
      .filter(Boolean) as TokenHolding[];
  }

  /** Send a signed VersionedTransaction or legacy Transaction */
  async sendTransaction(tx: VersionedTransaction | Transaction): Promise<string> {
    if (tx instanceof VersionedTransaction) {
      tx.sign([this.keypair]);
      const sig = await this.connection.sendTransaction(tx);
      await this.connection.confirmTransaction(sig, "confirmed");
      return sig;
    } else {
      const sig = await sendAndConfirmTransaction(this.connection, tx, [this.keypair]);
      return sig;
    }
  }
}
