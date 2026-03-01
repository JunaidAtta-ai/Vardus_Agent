import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import RssParser from "rss-parser";
import { z } from "zod";
import type { Extension, ToolDefinition, EngineContext } from "../../core/types.js";
import { getConfig } from "../../core/config.js";

const NEWS_DIR = path.resolve("data/news-collector");
const ARCHIVE_FILE = path.join(NEWS_DIR, "archive.jsonl");

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  content: string;
  fetchedAt: number;
}

function archiveItems(items: NewsItem[]): void {
  fs.mkdirSync(NEWS_DIR, { recursive: true });
  for (const item of items) {
    fs.appendFileSync(ARCHIVE_FILE, JSON.stringify(item) + "\n", "utf8");
  }
}

async function readArchive(limit: number): Promise<NewsItem[]> {
  if (!fs.existsSync(ARCHIVE_FILE)) return [];
  const items: NewsItem[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(ARCHIVE_FILE), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.trim()) {
      try { items.push(JSON.parse(line)); } catch { /* skip */ }
    }
  }
  return items.slice(-limit);
}

async function searchArchive(query: string, limit: number): Promise<NewsItem[]> {
  const all = await readArchive(10_000);
  const q = query.toLowerCase();
  return all
    .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    .slice(-limit);
}

export class NewsCollectorExtension implements Extension {
  readonly id = "news-collector";
  readonly name = "News Collector";

  private timer: ReturnType<typeof setInterval> | null = null;
  private parser = new RssParser();

  async initialize(_ctx: EngineContext): Promise<void> {
    const cfg = getConfig().newsCollector;
    if (!cfg.enabled) return;
    await this.fetchAll();
    this.timer = setInterval(() => {
      this.fetchAll().catch(console.error);
    }, cfg.intervalMinutes * 60_000);
    console.log(`[NewsCollector] Started — fetching every ${cfg.intervalMinutes} min`);
  }

  async destroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
  }

  private async fetchAll(): Promise<void> {
    const cfg = getConfig().newsCollector;
    const items: NewsItem[] = [];
    for (const feedUrl of cfg.feeds) {
      try {
        const feed = await this.parser.parseURL(feedUrl);
        for (const entry of feed.items ?? []) {
          items.push({
            id: entry.guid ?? entry.link ?? `${feedUrl}-${entry.pubDate}`,
            title: entry.title ?? "",
            link: entry.link ?? "",
            pubDate: entry.pubDate ?? "",
            source: feed.title ?? feedUrl,
            content: entry.contentSnippet ?? entry.summary ?? "",
            fetchedAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn(`[NewsCollector] Failed to fetch ${feedUrl}: ${err}`);
      }
    }
    if (items.length > 0) archiveItems(items);
  }

  readonly tools: ToolDefinition[] = [
    {
      name: "globNews",
      description: "Get the latest N news articles from the archive.",
      parameters: z.object({
        limit: z.number().int().positive().default(20),
      }),
      execute: async (args, _ctx) => {
        const { limit } = args as { limit: number };
        return { articles: await readArchive(limit) };
      },
    },

    {
      name: "grepNews",
      description: "Search the news archive for articles matching a query string.",
      parameters: z.object({
        query: z.string().describe("Search term (case-insensitive)"),
        limit: z.number().int().positive().default(10),
      }),
      execute: async (args, _ctx) => {
        const { query, limit } = args as { query: string; limit: number };
        return { articles: await searchArchive(query, limit) };
      },
    },

    {
      name: "readNews",
      description: "Read a single news article from the archive by its ID.",
      parameters: z.object({
        id: z.string(),
      }),
      execute: async (args, _ctx) => {
        const { id } = args as { id: string };
        const all = await readArchive(10_000);
        const article = all.find((n) => n.id === id);
        return article ?? { error: "Article not found." };
      },
    },

    {
      name: "fetchNewsNow",
      description: "Trigger an immediate news fetch from all configured RSS feeds.",
      parameters: z.object({}),
      execute: async (_args, _ctx) => {
        await this.fetchAll();
        return { success: true };
      },
    },
  ];
}
