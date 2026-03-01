import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const WALLET_DIR = path.resolve("data/crypto-trading");

export interface StagedOrder {
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  orderType: "market" | "limit";
  price?: number;
}

export interface WalletCommit {
  hash: string; // 8-char hex
  timestamp: number;
  message: string;
  orders: StagedOrder[];
  status: "pending" | "pushed" | "failed";
}

/**
 * Git-like trading wallet.
 * Stage → Commit (with message + hash) → Push (execute on exchange).
 */
export class CryptoWallet {
  private staged: StagedOrder[] = [];
  private log: WalletCommit[] = [];
  private logFile = path.join(WALLET_DIR, "commits.jsonl");

  constructor() {
    fs.mkdirSync(WALLET_DIR, { recursive: true });
    this.load();
  }

  private load(): void {
    if (!fs.existsSync(this.logFile)) return;
    const lines = fs.readFileSync(this.logFile, "utf8").split("\n").filter(Boolean);
    this.log = lines.map((l) => JSON.parse(l) as WalletCommit);
  }

  private persist(commit: WalletCommit): void {
    fs.appendFileSync(this.logFile, JSON.stringify(commit) + "\n", "utf8");
  }

  stageOrder(order: StagedOrder): void {
    this.staged.push(order);
  }

  unstage(): void {
    this.staged = [];
  }

  getStagedOrders(): StagedOrder[] {
    return [...this.staged];
  }

  commit(message: string): WalletCommit {
    if (this.staged.length === 0) throw new Error("Nothing staged to commit.");
    const commit: WalletCommit = {
      hash: randomUUID().replace(/-/g, "").slice(0, 8),
      timestamp: Date.now(),
      message,
      orders: [...this.staged],
      status: "pending",
    };
    this.staged = [];
    this.log.push(commit);
    this.persist(commit);
    return commit;
  }

  /** Execute a pending commit on the exchange. Implemented in CryptoTradingExtension. */
  markPushed(hash: string): void {
    const commit = this.log.find((c) => c.hash === hash);
    if (commit) commit.status = "pushed";
  }

  markFailed(hash: string): void {
    const commit = this.log.find((c) => c.hash === hash);
    if (commit) commit.status = "failed";
  }

  getLog(): WalletCommit[] {
    return [...this.log];
  }

  getCommit(hash: string): WalletCommit | undefined {
    return this.log.find((c) => c.hash === hash);
  }
}
