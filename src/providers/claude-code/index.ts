import { execFile } from "child_process";
import { promisify } from "util";
import type { AIProvider } from "../../core/ai-provider.js";
import type { EngineContext, Message } from "../../core/types.js";
import type { ToolCenter } from "../../core/tool-center.js";

const execFileAsync = promisify(execFile);

/**
 * Claude Code CLI provider — spawns `claude -p "<prompt>"` as a subprocess.
 * Tools are NOT injected here; Claude Code has its own tool execution loop.
 *
 * This provider is useful for evolution mode where Claude Code can access the
 * filesystem and run arbitrary bash commands.
 */
export class ClaudeCodeProvider implements AIProvider {
  readonly id = "claude-code";

  async run(params: {
    messages: Message[];
    tools: ToolCenter;
    ctx: EngineContext;
    systemPrompt: string;
    maxSteps: number;
  }): Promise<string> {
    const { messages, systemPrompt } = params;

    // Build a plain text prompt from the conversation history
    const historyText = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const fullPrompt = `${systemPrompt}\n\n${historyText}`;

    try {
      const { stdout } = await execFileAsync("claude", ["-p", fullPrompt], {
        maxBuffer: 10 * 1024 * 1024, // 10 MB
      });
      return stdout.trim();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[ClaudeCodeProvider] claude CLI failed: ${msg}`);
    }
  }
}
