import type { ToolDefinition, Extension } from "./types.js";

/**
 * Centralized tool registry.
 * Extensions register their tools here.
 * ProviderRouter reads tools from here when building the AI call.
 */
export class ToolCenter {
  private tools = new Map<string, ToolDefinition>();
  private extensions = new Map<string, Extension>();

  registerExtension(ext: Extension): void {
    this.extensions.set(ext.id, ext);
    for (const tool of ext.tools) {
      if (this.tools.has(tool.name)) {
        console.warn(`[ToolCenter] Tool name collision: ${tool.name} (from extension ${ext.id})`);
      }
      this.tools.set(tool.name, tool);
    }
  }

  unregisterExtension(id: string): void {
    const ext = this.extensions.get(id);
    if (!ext) return;
    for (const tool of ext.tools) {
      this.tools.delete(tool.name);
    }
    this.extensions.delete(id);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  listExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Export tools in Vercel AI SDK format.
   * Returns a record of tool definitions keyed by name.
   */
  toVercelAiTools(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name, tool] of this.tools) {
      result[name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: tool.execute,
      };
    }
    return result;
  }
}
