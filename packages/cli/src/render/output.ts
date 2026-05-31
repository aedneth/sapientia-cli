import { fail, ok, type JsonEnvelope } from "@sapientia/core";

/** Resolve whether prompts are allowed. Agent mode = never prompt. */
export function isInteractive(flags: Record<string, unknown>, env: NodeJS.ProcessEnv): boolean {
  if (flags.json || flags["no-input"]) return false;
  if (env.SAPIENTIA_NO_INPUT) return false;
  return Boolean(process.stdout.isTTY && process.stdin.isTTY);
}

export function wantsJson(flags: Record<string, unknown>, env: NodeJS.ProcessEnv): boolean {
  return Boolean(flags.json || env.SAPIENTIA_JSON);
}

/** Emit a success envelope (JSON) or hand the data to a human renderer. */
export function emitSuccess<T>(
  command: string,
  data: T,
  warnings: string[],
  json: boolean,
  human: (data: T, warnings: string[]) => void,
): void {
  if (json) {
    writeJson(ok(command, data, warnings));
  } else {
    for (const w of warnings) process.stderr.write(`warning: ${w}\n`);
    human(data, warnings);
  }
}

export function emitError(
  command: string,
  error: { code: string; message: string; details?: Record<string, unknown> },
  json: boolean,
): void {
  if (json) {
    writeJson(fail(command, error));
  } else {
    process.stderr.write(`error: ${error.message}\n`);
  }
}

function writeJson(env: JsonEnvelope): void {
  process.stdout.write(JSON.stringify(env, null, 2) + "\n");
}
