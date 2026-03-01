import { Bot } from "grammy";
import { randomUUID } from "crypto";
import type { Connector } from "../../core/types.js";
import type { Engine } from "../../core/engine.js";
import type { ConnectorRegistry } from "../../core/connector-registry.js";

/**
 * Telegram connector — uses grammY (polling mode).
 * Each Telegram chat_id maps to a stable sessionId.
 */
export class TelegramConnector implements Connector {
  readonly id = "telegram";
  private bot: Bot;
  private chatSessions = new Map<number, string>(); // chat_id → sessionId

  constructor(
    private readonly engine: Engine,
    private readonly registry: ConnectorRegistry,
    private readonly token: string,
  ) {
    this.bot = new Bot(token);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.bot.on("message:text", async (ctx) => {
      const chatId = ctx.chat.id;
      const userId = String(chatId);

      // Stable session per chat
      if (!this.chatSessions.has(chatId)) {
        this.chatSessions.set(chatId, randomUUID());
      }
      const sessionId = this.chatSessions.get(chatId)!;

      this.registry.recordInteraction("telegram", userId);

      const engineCtx = { sessionId, connectorId: "telegram", userId };

      try {
        const reply = await this.engine.chat(ctx.message.text, engineCtx);
        await ctx.reply(reply);
      } catch (err) {
        await ctx.reply(`Error: ${String(err)}`);
      }
    });

    this.bot.command("start", (ctx) => ctx.reply("Trader Agent online. Ask me anything."));
    this.bot.command("status", (ctx) => ctx.reply("Agent running. Use /help for commands."));
    this.bot.command("help", (ctx) =>
      ctx.reply([
        "/start — greet",
        "/status — agent status",
        "Just type to chat with the trading agent.",
      ].join("\n"))
    );
  }

  async start(): Promise<void> {
    // Start polling without blocking
    this.bot.start({ onStart: () => console.log("[TelegramConnector] Bot started (polling)") });
  }

  async stop(): Promise<void> {
    await this.bot.stop();
  }

  async send(userId: string, text: string): Promise<void> {
    const chatId = parseInt(userId, 10);
    await this.bot.api.sendMessage(chatId, text);
  }
}
