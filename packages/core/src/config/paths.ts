import envPaths from "env-paths";
import { homedir } from "node:os";
import { join } from "node:path";

const APP = "sapientia";

/**
 * Resolve application directories. XDG_* env vars win on every platform when set
 * (per the agent-native, cross-OS mandate); otherwise fall back to platform
 * conventions via env-paths.
 */
export interface SapientiaPaths {
  config: string;
  data: string;
  cache: string;
  state: string;
}

export function resolvePaths(env: NodeJS.ProcessEnv = process.env): SapientiaPaths {
  const fallback = envPaths(APP, { suffix: "" });
  const home = homedir();
  return {
    config: env.XDG_CONFIG_HOME ? join(env.XDG_CONFIG_HOME, APP) : fallback.config,
    data: env.XDG_DATA_HOME ? join(env.XDG_DATA_HOME, APP) : fallback.data,
    cache: env.XDG_CACHE_HOME ? join(env.XDG_CACHE_HOME, APP) : fallback.cache,
    state: env.XDG_STATE_HOME
      ? join(env.XDG_STATE_HOME, APP)
      : join(home, ".local", "state", APP),
  };
}

export function configFilePath(env: NodeJS.ProcessEnv = process.env): string {
  if (env.SAPIENTIA_CONFIG) return env.SAPIENTIA_CONFIG;
  return join(resolvePaths(env).config, "config.json");
}

export function catalogDbPath(env: NodeJS.ProcessEnv = process.env): string {
  return join(resolvePaths(env).data, "catalog.db");
}

export function pluginsDir(env: NodeJS.ProcessEnv = process.env): string {
  return join(resolvePaths(env).data, "plugins");
}
