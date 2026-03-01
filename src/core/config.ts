import * as fs from "fs";
import * as path from "path";
import { z } from "zod";

const CONFIG_DIR = path.resolve("data/config");

function readJson(file: string): unknown {
  const p = path.join(CONFIG_DIR, file);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONFIG_DIR, file), JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const AiProviderConfigSchema = z.object({
  provider: z.enum(["vercel-ai-sdk", "claude-code"]).default("vercel-ai-sdk"),
});

export const ModelConfigSchema = z.object({
  model: z.string().default("claude-3-5-sonnet-20241022"),
});

export const ApiKeysConfigSchema = z.object({
  anthropic: z.string().optional(),
  openai: z.string().optional(),
  google: z.string().optional(),
});

export const AgentConfigSchema = z.object({
  maxSteps: z.number().int().positive().default(20),
  evolutionMode: z.boolean().default(false),
});

export const EngineConfigSchema = z.object({
  tradingPairs: z.array(z.string()).default(["BTC/USDT", "ETH/USDT"]),
  tickIntervalMs: z.number().int().positive().default(60_000),
  timeframe: z.string().default("1h"),
});

export const CryptoConfigSchema = z.object({
  exchange: z.string().default("bybit"),
  apiKey: z.string().default(""),
  apiSecret: z.string().default(""),
  testnet: z.boolean().default(true),
  allowedSymbols: z.array(z.string()).default(["BTC/USDT", "ETH/USDT"]),
  guards: z.object({
    maxPositionUsd: z.number().default(1000),
    maxLeverage: z.number().default(5),
    cooldownSeconds: z.number().default(60),
  }).default({}),
});

export const ConnectorsConfigSchema = z.object({
  webPort: z.number().int().default(3002),
  telegramToken: z.string().default(""),
  telegramEnabled: z.boolean().default(false),
  mcpEnabled: z.boolean().default(false),
  mcpPort: z.number().int().default(3003),
});

export const HeartbeatConfigSchema = z.object({
  enabled: z.boolean().default(true),
  intervalMinutes: z.number().int().positive().default(30),
  activeHours: z.tuple([z.number(), z.number()]).default([8, 22]),
});

export const NewsCollectorConfigSchema = z.object({
  enabled: z.boolean().default(true),
  intervalMinutes: z.number().int().positive().default(15),
  retentionDays: z.number().int().positive().default(7),
  feeds: z.array(z.string()).default([
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
  ]),
});

// ─── Loader ──────────────────────────────────────────────────────────────────

export class Config {
  readonly aiProvider = AiProviderConfigSchema.parse(readJson("ai-provider.json"));
  readonly model = ModelConfigSchema.parse({
    ...readJson("model.json") as object,
    ...(process.env.AI_MODEL ? { model: process.env.AI_MODEL } : {}),
  });
  readonly apiKeys = ApiKeysConfigSchema.parse({
    ...readJson("api-keys.json") as object,
    ...(process.env.ANTHROPIC_API_KEY ? { anthropic: process.env.ANTHROPIC_API_KEY } : {}),
    ...(process.env.OPENAI_API_KEY    ? { openai:    process.env.OPENAI_API_KEY    } : {}),
    ...(process.env.GOOGLE_API_KEY    ? { google:    process.env.GOOGLE_API_KEY    } : {}),
  });
  readonly agent = AgentConfigSchema.parse(readJson("agent.json"));
  readonly engine = EngineConfigSchema.parse(readJson("engine.json"));
  readonly crypto = CryptoConfigSchema.parse(readJson("crypto.json"));
  readonly connectors = ConnectorsConfigSchema.parse({
    ...readJson("connectors.json") as object,
    ...(process.env.PORT ? { webPort: Number(process.env.PORT) } : {}),
  });
  readonly heartbeat = HeartbeatConfigSchema.parse(readJson("heartbeat.json"));
  readonly newsCollector = NewsCollectorConfigSchema.parse(readJson("news-collector.json"));

  /** Persist a single config file. */
  save(file: string, data: unknown): void {
    writeJson(file, data);
  }
}

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) _config = new Config();
  return _config;
}

/** Force reload from disk (used after hot-reload edits). */
export function reloadConfig(): Config {
  _config = new Config();
  return _config;
}
