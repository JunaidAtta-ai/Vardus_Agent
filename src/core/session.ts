import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import type { Message } from "./types.js";

const SESSIONS_DIR = path.resolve("data/sessions");

export class SessionStore {
  constructor() {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }

  private filePath(sessionId: string): string {
    return path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
  }

  async append(sessionId: string, message: Message): Promise<void> {
    const line = JSON.stringify(message) + "\n";
    fs.appendFileSync(this.filePath(sessionId), line, "utf8");
  }

  async load(sessionId: string): Promise<Message[]> {
    const file = this.filePath(sessionId);
    if (!fs.existsSync(file)) return [];
    const messages: Message[] = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(file, "utf8"),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      if (line.trim()) {
        try {
          messages.push(JSON.parse(line) as Message);
        } catch {
          // skip malformed lines
        }
      }
    }
    return messages;
  }

  async clear(sessionId: string): Promise<void> {
    const file = this.filePath(sessionId);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  listSessions(): string[] {
    return fs.readdirSync(SESSIONS_DIR)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => f.replace(/\.jsonl$/, ""));
  }
}
