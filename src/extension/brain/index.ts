import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import type { Extension, ToolDefinition, EngineContext } from "../../core/types.js";

const BRAIN_DIR = path.resolve("data/brain");
const MEMORY_FILE = path.join(BRAIN_DIR, "memory.json");
const EMOTION_FILE = path.join(BRAIN_DIR, "emotion.jsonl");

interface Memory {
  frontalLobe: string; // working memory / summary of current context
  lastUpdated: number;
}

interface EmotionEntry {
  timestamp: number;
  emotion: string;  // e.g. "cautious", "confident", "anxious"
  sentiment: number; // -1 to +1
  rationale: string;
}

function loadMemory(): Memory {
  if (!fs.existsSync(MEMORY_FILE)) {
    return { frontalLobe: "", lastUpdated: 0 };
  }
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8")) as Memory;
}

function saveMemory(mem: Memory): void {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(mem, null, 2), "utf8");
}

function appendEmotion(entry: EmotionEntry): void {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
  fs.appendFileSync(EMOTION_FILE, JSON.stringify(entry) + "\n", "utf8");
}

function readEmotionLog(limit: number): EmotionEntry[] {
  if (!fs.existsSync(EMOTION_FILE)) return [];
  const lines = fs.readFileSync(EMOTION_FILE, "utf8").split("\n").filter(Boolean);
  return lines.slice(-limit).map((l) => JSON.parse(l) as EmotionEntry);
}

export class BrainExtension implements Extension {
  readonly id = "brain";
  readonly name = "Brain (Memory + Emotion)";

  readonly tools: ToolDefinition[] = [
    {
      name: "brainRead",
      description: "Read current working memory (frontal lobe) stored in the brain.",
      parameters: z.object({}),
      execute: async (_args, _ctx) => {
        return loadMemory();
      },
    },

    {
      name: "brainWrite",
      description: "Update working memory (frontal lobe) in the brain.",
      parameters: z.object({
        content: z.string().describe("New content to store as working memory"),
      }),
      execute: async (args, _ctx) => {
        const mem: Memory = {
          frontalLobe: (args as { content: string }).content,
          lastUpdated: Date.now(),
        };
        saveMemory(mem);
        return { success: true };
      },
    },

    {
      name: "brainAppend",
      description: "Append to existing working memory rather than overwriting.",
      parameters: z.object({
        content: z.string(),
      }),
      execute: async (args, _ctx) => {
        const existing = loadMemory();
        const mem: Memory = {
          frontalLobe: existing.frontalLobe
            ? `${existing.frontalLobe}\n${(args as { content: string }).content}`
            : (args as { content: string }).content,
          lastUpdated: Date.now(),
        };
        saveMemory(mem);
        return { success: true };
      },
    },

    {
      name: "emotionLog",
      description: "Log the current emotional/sentiment state with a rationale.",
      parameters: z.object({
        emotion: z.string().describe("e.g. cautious, confident, anxious, neutral"),
        sentiment: z.number().min(-1).max(1).describe("Numeric sentiment: -1 (very bearish) to +1 (very bullish)"),
        rationale: z.string().describe("Why you feel this way right now"),
      }),
      execute: async (args, _ctx) => {
        const { emotion, sentiment, rationale } = args as { emotion: string; sentiment: number; rationale: string };
        appendEmotion({ timestamp: Date.now(), emotion, sentiment, rationale });
        return { success: true };
      },
    },

    {
      name: "emotionHistory",
      description: "Read recent emotion log entries.",
      parameters: z.object({
        limit: z.number().int().positive().default(10),
      }),
      execute: async (args, _ctx) => {
        const { limit } = args as { limit: number };
        return { entries: readEmotionLog(limit) };
      },
    },
  ];
}
