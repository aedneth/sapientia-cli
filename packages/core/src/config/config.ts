import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { ConfigError } from "../errors/errors.js";
import { configFilePath, resolvePaths } from "./paths.js";

export const RankingWeightsSchema = z.object({
  sourceReliability: z.number().default(0.3),
  formatQuality: z.number().default(0.3),
  metadataCompleteness: z.number().default(0.2),
  availability: z.number().default(0.2),
});

export const ConfigSchema = z.object({
  /** Root of the local library (Eduardo's Digital Library by default). */
  libraryPath: z.string().optional(),
  /** Where downloads land before being catalogued. */
  downloadDir: z.string().optional(),
  /** Ordered format preference, best first. */
  formatPreference: z
    .array(z.string())
    .default(["epub", "pdf", "mobi", "azw3", "djvu", "txt"]),
  languagePreference: z.array(z.string()).default([]),
  /** Per-source enable flags + opaque options. */
  sources: z.record(z.object({ enabled: z.boolean().default(true) }).passthrough()).default({}),
  /** Registered plugin package names (resolved from the plugins dir). */
  plugins: z.array(z.string()).default([]),
  ranking: z.object({ weights: RankingWeightsSchema.default({}) }).default({}),
  network: z
    .object({
      timeoutMs: z.number().int().positive().default(30000),
      concurrency: z.number().int().positive().default(4),
      retries: z.number().int().nonnegative().default(2),
      proxy: z.string().optional(),
      torSocks: z.string().optional(),
    })
    .default({}),
  legal: z.object({ acknowledgedShadow: z.boolean().default(false) }).default({}),
  telemetry: z.literal(false).default(false),
});

export type SapientiaConfig = z.infer<typeof ConfigSchema>;

/** Load + validate config, applying defaults for a missing file. */
export async function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): Promise<SapientiaConfig> {
  const path = configFilePath(env);
  let raw: unknown = {};
  try {
    raw = JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new ConfigError(`Failed to read config at ${path}`, { cause: String(err) });
    }
  }
  const parsed = ConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ConfigError(`Invalid config at ${path}`, { issues: parsed.error.issues });
  }
  return applyEnvOverrides(parsed.data, env);
}

function applyEnvOverrides(cfg: SapientiaConfig, env: NodeJS.ProcessEnv): SapientiaConfig {
  return {
    ...cfg,
    libraryPath: env.SAPIENTIA_LIBRARY ?? cfg.libraryPath,
    downloadDir:
      env.SAPIENTIA_DOWNLOAD_DIR ?? cfg.downloadDir ?? join(resolvePaths(env).data, "downloads"),
  };
}

export async function saveConfig(
  cfg: SapientiaConfig,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const path = configFilePath(env);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}
