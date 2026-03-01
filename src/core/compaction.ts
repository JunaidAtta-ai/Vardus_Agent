import * as fs from "fs";
import * as path from "path";
import type { Message } from "./types.js";

/**
 * Compacts a session's message list when it grows too long.
 *
 * Strategy:
 *  1. Keep the system prompt (first message) untouched.
 *  2. Keep the last `keepLastN` messages untouched.
 *  3. Summarise everything in between into a single assistant message.
 *
 * Actual summarisation calls the AI — for now this is a stub that simply
 * truncates. Wire up a real AI call when needed.
 */
export class Compaction {
  private keepLastN: number;
  private maxMessages: number;

  constructor(opts: { maxMessages?: number; keepLastN?: number } = {}) {
    this.maxMessages = opts.maxMessages ?? 40;
    this.keepLastN = opts.keepLastN ?? 10;
  }

  needsCompaction(messages: Message[]): boolean {
    return messages.length > this.maxMessages;
  }

  /** Returns a compacted copy of the message list. */
  compact(messages: Message[]): Message[] {
    if (!this.needsCompaction(messages)) return messages;

    const system = messages[0]?.role === "system" ? [messages[0]] : [];
    const rest = messages.slice(system.length);
    const keep = rest.slice(-this.keepLastN);
    const summarised = rest.slice(0, rest.length - this.keepLastN);

    if (summarised.length === 0) return messages;

    const summaryText =
      `[Context compacted — ${summarised.length} earlier messages summarised]\n` +
      summarised
        .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 200)}`)
        .join("\n");

    const summaryMessage: Message = {
      role: "assistant",
      content: summaryText,
      timestamp: Date.now(),
    };

    return [...system, summaryMessage, ...keep];
  }
}
