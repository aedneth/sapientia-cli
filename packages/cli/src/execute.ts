import { toSapientiaError, type CommandDef } from "@sapientia/core";
import { isInteractive } from "./render/output.js";

export interface RunResult {
  ok: boolean;
  data?: unknown;
  warnings: string[];
  error?: { code: string; message: string; details?: Record<string, unknown> };
  exitCode: number;
}

/**
 * Execute a command handler in isolation: builds the CommandContext, collects
 * warnings, and maps any thrown error to a stable code + exit code. Used by both
 * the Commander wiring and the MCP server so behavior is identical.
 */
export async function runCommand(
  cmd: CommandDef,
  opts: {
    args: Record<string, string | string[] | undefined>;
    flags: Record<string, unknown>;
    env: NodeJS.ProcessEnv;
  },
): Promise<RunResult> {
  const warnings: string[] = [];
  let overrideExitCode = 0;
  try {
    const data = await cmd.handler({
      args: opts.args,
      flags: opts.flags,
      interactive: isInteractive(opts.flags, opts.env),
      env: opts.env,
      warn: (m) => warnings.push(m),
      setExitCode: (code) => { overrideExitCode = code; },
    });
    return { ok: true, data, warnings, exitCode: overrideExitCode };
  } catch (err) {
    const e = toSapientiaError(err);
    return {
      ok: false,
      warnings,
      error: { code: e.code, message: e.message, details: e.details },
      exitCode: e.exitCode,
    };
  }
}
