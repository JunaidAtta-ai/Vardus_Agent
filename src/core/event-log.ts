import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { randomUUID } from "crypto";
import type { AppEvent, EventType } from "./types.js";

const LOG_DIR = path.resolve("data/event-log");
const LOG_FILE = path.join(LOG_DIR, "events.jsonl");

type Subscriber = (event: AppEvent) => void;

/**
 * Persistent append-only event log backed by a JSONL file.
 * Supports in-process subscriptions (fan-out to all listeners).
 */
export class EventLog {
  private subscribers = new Map<string, Subscriber>();

  constructor() {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  /** Emit an event — append to file and fan-out to subscribers. */
  async emit(type: EventType, payload: unknown): Promise<AppEvent> {
    const event: AppEvent = {
      id: randomUUID(),
      type,
      payload,
      ts: Date.now(),
    };
    const line = JSON.stringify(event) + "\n";
    fs.appendFileSync(LOG_FILE, line, "utf8");
    for (const cb of this.subscribers.values()) {
      try {
        cb(event);
      } catch {
        // individual subscriber errors must not break the log
      }
    }
    return event;
  }

  /** Subscribe to all events. Returns an unsubscribe function. */
  subscribe(cb: Subscriber): () => void {
    const id = randomUUID();
    this.subscribers.set(id, cb);
    return () => this.subscribers.delete(id);
  }

  /** Read all persisted events from the JSONL file. */
  async readAll(): Promise<AppEvent[]> {
    if (!fs.existsSync(LOG_FILE)) return [];
    const events: AppEvent[] = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(LOG_FILE, "utf8"),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      if (line.trim()) {
        try {
          events.push(JSON.parse(line) as AppEvent);
        } catch {
          // skip malformed lines (crash recovery)
        }
      }
    }
    return events;
  }

  /** Read the last N events. */
  async tail(n: number): Promise<AppEvent[]> {
    const all = await this.readAll();
    return all.slice(-n);
  }
}
