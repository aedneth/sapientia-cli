import {
  configFilePath,
  loadConfig,
  saveConfig,
  UsageError,
  type CommandDef,
} from "@sapientia/core";

export const configCommand: CommandDef = {
  name: "config",
  description: "Get, set, or locate configuration values.",
  args: [
    { name: "action", description: "get | set | path", required: true },
    { name: "key", description: "Dotted config key (for get/set).", required: false },
    { name: "value", description: "Value (for set).", required: false },
  ],
  flags: [],
  exitCodes: [0, 2, 6],
  agentSafe: true,
  async handler(ctx) {
    const action = String(ctx.args.action);
    if (action === "path") return { path: configFilePath(ctx.env) };

    const config = await loadConfig(ctx.env);
    if (action === "get") {
      const key = ctx.args.key as string | undefined;
      if (!key) return { config };
      return { key, value: dig(config as Record<string, unknown>, key) };
    }
    if (action === "set") {
      const key = ctx.args.key as string | undefined;
      const value = ctx.args.value as string | undefined;
      if (!key || value === undefined) throw new UsageError("set requires <key> <value>");
      setDeep(config as Record<string, unknown>, key, coerce(value));
      await saveConfig(config, ctx.env);
      return { key, value: dig(config as Record<string, unknown>, key) };
    }
    throw new UsageError(`Unknown config action: ${action}`);
  },
};

function dig(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

function setDeep(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

function coerce(v: string): unknown {
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}
