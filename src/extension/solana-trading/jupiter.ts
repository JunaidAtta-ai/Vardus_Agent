import { VersionedTransaction } from "@solana/web3.js";
import type { SolanaWallet } from "./wallet.js";

const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6";
const SOL_MINT = "So11111111111111111111111111111111111111112";

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;   // lamports or raw token units
  outAmount: string;
  priceImpactPct: string;
  routePlan: unknown[];
}

export interface SwapResult {
  signature: string;
  inputMint: string;
  outputMint: string;
  inAmountSol?: number;
  outAmountTokens?: number;
}

/**
 * Jupiter DEX aggregator — best-route swap execution on Solana.
 */
export class JupiterClient {
  constructor(private readonly wallet: SolanaWallet) {}

  /** Get a swap quote from Jupiter */
  async getQuote(params: {
    inputMint: string;
    outputMint: string;
    amountLamports: number;
    slippageBps?: number;
  }): Promise<SwapQuote> {
    const slippage = params.slippageBps ?? this.wallet.config.slippageBps;
    const url = new URL(`${JUPITER_QUOTE_API}/quote`);
    url.searchParams.set("inputMint", params.inputMint);
    url.searchParams.set("outputMint", params.outputMint);
    url.searchParams.set("amount", String(params.amountLamports));
    url.searchParams.set("slippageBps", String(slippage));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Jupiter quote failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<SwapQuote>;
  }

  /** Execute a swap: SOL → token */
  async buyToken(params: {
    mint: string;
    solAmount: number;   // in SOL (not lamports)
  }): Promise<SwapResult> {
    const lamports = Math.floor(params.solAmount * 1_000_000_000);
    const quote = await this.getQuote({
      inputMint: SOL_MINT,
      outputMint: params.mint,
      amountLamports: lamports,
    });

    const swapTx = await this.getSwapTransaction(quote);
    const signature = await this.wallet.sendTransaction(swapTx);

    return {
      signature,
      inputMint: SOL_MINT,
      outputMint: params.mint,
      inAmountSol: params.solAmount,
      outAmountTokens: Number(quote.outAmount),
    };
  }

  /** Execute a swap: token → SOL */
  async sellToken(params: {
    mint: string;
    tokenAmount: number;  // raw units
  }): Promise<SwapResult> {
    const quote = await this.getQuote({
      inputMint: params.mint,
      outputMint: SOL_MINT,
      amountLamports: params.tokenAmount,
    });

    const swapTx = await this.getSwapTransaction(quote);
    const signature = await this.wallet.sendTransaction(swapTx);

    return {
      signature,
      inputMint: params.mint,
      outputMint: SOL_MINT,
      outAmountTokens: Number(quote.outAmount),
    };
  }

  private async getSwapTransaction(quote: SwapQuote): Promise<VersionedTransaction> {
    const res = await fetch(`${JUPITER_QUOTE_API}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: this.wallet.address,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    });

    if (!res.ok) throw new Error(`Jupiter swap failed: ${res.status} ${await res.text()}`);

    const { swapTransaction } = (await res.json()) as { swapTransaction: string };
    const txBytes = Buffer.from(swapTransaction, "base64");
    return VersionedTransaction.deserialize(txBytes);
  }
}
