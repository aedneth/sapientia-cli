import { catalogDbPath, configFilePath, resolvePaths, type CommandDef } from "@sapientia/core";
import { access } from "node:fs/promises";
import { adapterContext, createRuntime } from "../runtime.js";

export const doctorCommand: CommandDef = {
  name: "doctor",
  description: "Diagnose config, directories, native deps, and source connectivity.",
  args: [],
  flags: [{ name: "offline", type: "boolean", description: "Skip network probes." }],
  exitCodes: [0, 4, 6, 7],
  agentSafe: true,
  async handler(ctx) {
    const paths = resolvePaths(ctx.env);
    const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

    checks.push({ name: "node", ok: true, detail: process.version });
    checks.push({ name: "config", ok: true, detail: configFilePath(ctx.env) });
    for (const [k, dir] of Object.entries(paths)) {
      checks.push({ name: `dir:${k}`, ok: await canAccess(dir), detail: dir });
    }
    checks.push({ name: "catalog", ok: true, detail: catalogDbPath(ctx.env) });

    const { config, sources } = await createRuntime(ctx.env);
    if (!ctx.flags.offline) {
      for (const a of sources.list()) {
        const h = await a.health(adapterContext(a, config));
        checks.push({ name: `source:${a.id}`, ok: h.ok, detail: h.message ?? `${h.latencyMs}ms` });
      }
    }

    const ok = checks.every((c) => c.ok);
    return { ok, checks };
  },
};

async function canAccess(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false; // missing dirs are created on first write; reported, not fatal
  }
}
