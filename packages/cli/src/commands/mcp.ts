import type { CommandDef, CommandRegistry } from "@sapientia/core";
import { startMcpServer } from "../mcp/server.js";

/** `mcp serve` launches the stdio MCP server generated from the same registry. */
export function mcpCommand(registry: CommandRegistry): CommandDef {
  return {
    name: "mcp",
    description: "Run the built-in MCP server (stdio) exposing commands as tools.",
    args: [{ name: "action", description: "serve", required: false }],
    flags: [],
    exitCodes: [0, 1],
    agentSafe: true,
    async handler(ctx) {
      const action = (ctx.args.action as string) ?? "serve";
      if (action !== "serve") return { error: `unknown action: ${action}` };
      await startMcpServer(registry, ctx.env);
      return { started: true };
    },
  };
}
