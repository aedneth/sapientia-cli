import { catalogDbPath, configFilePath, resolvePaths, type CommandDef } from "@sapientia/core";
import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
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

    const { config, sources } = await createRuntime(ctx.env);

    checks.push({ name: "node", ok: true, detail: process.version });
    checks.push({ name: "config", ok: true, detail: configFilePath(ctx.env) });
    // App directories are meant to exist; create them if missing and confirm they
    // are writable, so a fresh install is healed rather than reported as broken.
    for (const [k, dir] of Object.entries({ ...paths, download: config.downloadDir! })) {
      const w = await ensureWritable(dir);
      checks.push({ name: `dir:${k}`, ok: w.ok, detail: w.ok ? dir : w.detail });
    }
    checks.push({ name: "catalog", ok: true, detail: catalogDbPath(ctx.env) });

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

async function ensureWritable(dir: string): Promise<{ ok: boolean; detail?: string }> {
  try {
    await mkdir(dir, { recursive: true });
    await access(dir, constants.W_OK);
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: `not writable: ${String(err)}` };
  }
}
