import type { CommandDef, FlagDef } from "./types.js";

/** Global flags every command inherits; documented once, applied everywhere. */
export const GLOBAL_FLAGS: FlagDef[] = [
  { name: "json", type: "boolean", description: "Emit machine-readable JSON envelope." },
  { name: "yes", short: "y", type: "boolean", description: "Skip confirmation prompts." },
  { name: "no-input", type: "boolean", description: "Never prompt; fail instead (agent mode)." },
  { name: "accept-legal", type: "boolean", description: "Accept legal acknowledgment for gated sources." },
  { name: "quiet", type: "boolean", description: "Suppress non-essential output." },
  { name: "verbose", type: "boolean", description: "Verbose logging to stderr." },
  { name: "no-color", type: "boolean", description: "Disable ANSI color." },
  { name: "config", type: "string", description: "Path to an alternate config file." },
  { name: "profile", type: "string", description: "Named config profile." },
];

export class CommandRegistry {
  private readonly commands = new Map<string, CommandDef>();

  register(def: CommandDef): void {
    if (this.commands.has(def.name)) throw new Error(`Duplicate command: ${def.name}`);
    this.commands.set(def.name, def);
  }

  get(name: string): CommandDef | undefined {
    return this.commands.get(name);
  }

  list(): CommandDef[] {
    return [...this.commands.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Serialize the full command surface for `sapientia manifest`. */
  toManifest(version: string): unknown {
    return {
      schemaVersion: "1",
      tool: "sapientia",
      version,
      globalFlags: GLOBAL_FLAGS,
      commands: this.list().map((c) => ({
        name: c.name,
        description: c.description,
        args: c.args,
        flags: c.flags,
        exitCodes: c.exitCodes,
        agentSafe: c.agentSafe,
      })),
    };
  }
}
