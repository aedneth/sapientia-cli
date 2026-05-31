/**
 * Declarative command definitions — the single source of truth that generates the
 * Commander CLI, the `manifest` output, and the MCP tool list. Adding a command
 * here makes it available to humans and agents at once.
 */
export type FlagType = "string" | "number" | "boolean" | "string[]";

export interface FlagDef {
  name: string; // long name, e.g. "format"
  type: FlagType;
  description: string;
  short?: string; // single char, e.g. "y"
  default?: unknown;
  /** Choices for enum-like flags (surfaced in manifest + MCP schema). */
  choices?: string[];
}

export interface ArgDef {
  name: string;
  description: string;
  required: boolean;
  variadic?: boolean;
}

export interface CommandContext {
  args: Record<string, string | string[] | undefined>;
  flags: Record<string, unknown>;
  /** Resolved interactivity: false means no prompts allowed (agent mode). */
  interactive: boolean;
  env: NodeJS.ProcessEnv;
  /** Emit a non-fatal warning into the result envelope. */
  warn: (msg: string) => void;
}

export interface CommandDef {
  /** Dotted path, e.g. "config.set". Top-level commands have no dot. */
  name: string;
  description: string;
  args: ArgDef[];
  flags: FlagDef[];
  /** Exit codes this command may return, for documentation/manifest. */
  exitCodes: number[];
  /** Whether the command is safe to expose as an MCP tool (read-only, no side effects unless flagged). */
  agentSafe: boolean;
  /** Returns the `data` payload for the JSON envelope; throws SapientiaError on failure. */
  handler: (ctx: CommandContext) => Promise<unknown>;
}
