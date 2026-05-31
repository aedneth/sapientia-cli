import { ok, type CommandDef, type CommandRegistry } from "@sapientia/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, type ZodRawShape } from "zod";
import { runCommand } from "../execute.js";
import { VERSION } from "../version.js";

/** Build a zod input shape for a command from its declarative args + flags. */
function toInputShape(cmd: CommandDef): ZodRawShape {
  const shape: ZodRawShape = {};
  for (const a of cmd.args) {
    const base = z.string().describe(a.description);
    shape[a.name] = a.required ? base : base.optional();
  }
  for (const f of cmd.flags) {
    let t: z.ZodTypeAny;
    switch (f.type) {
      case "number":
        t = z.number();
        break;
      case "boolean":
        t = z.boolean();
        break;
      case "string[]":
        t = z.array(z.string());
        break;
      default:
        t = z.string();
    }
    shape[f.name] = t.describe(f.description).optional();
  }
  return shape;
}

/** Start the stdio MCP server, exposing every agent-safe command as a tool. */
export async function startMcpServer(
  registry: CommandRegistry,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  const server = new McpServer({ name: "sapientia", version: VERSION });

  for (const cmd of registry.list()) {
    if (!cmd.agentSafe || cmd.name === "mcp") continue;
    server.tool(
      cmd.name.replace(/\./g, "_"),
      cmd.description,
      toInputShape(cmd),
      async (input: Record<string, unknown>) => {
        const args: Record<string, string> = {};
        const flags: Record<string, unknown> = { json: true };
        for (const a of cmd.args) if (input[a.name] != null) args[a.name] = String(input[a.name]);
        for (const f of cmd.flags) if (input[f.name] != null) flags[f.name] = input[f.name];
        const result = await runCommand(cmd, { args, flags, env });
        const envelope = result.ok
          ? ok(cmd.name, result.data, result.warnings)
          : { ok: false, error: result.error };
        return { content: [{ type: "text" as const, text: JSON.stringify(envelope) }] };
      },
    );
  }

  await server.connect(new StdioServerTransport());

  // Keep the process alive until the transport closes; otherwise the caller would
  // exit immediately after connecting and tear down the server.
  await new Promise<void>((resolve) => {
    server.server.onclose = () => resolve();
  });
}
