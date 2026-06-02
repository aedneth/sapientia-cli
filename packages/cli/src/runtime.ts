import {
  loadConfig,
  SourceRegistry,
  type AdapterContext,
  type SapientiaConfig,
  type SourceAdapter,
} from "@sapientia/core";
import { createOpenAdapters } from "@sapientia/sources-open";

export const USER_AGENT = "sapientia-cli (+https://github.com/sapientia/sapientia-cli)";

export interface Runtime {
  config: SapientiaConfig;
  sources: SourceRegistry;
}

/** Build the runtime: load config and register bundled + enabled plugin adapters. */
export async function createRuntime(env: NodeJS.ProcessEnv = process.env): Promise<Runtime> {
  const config = await loadConfig(env);
  const sources = new SourceRegistry();
  for (const adapter of createOpenAdapters()) {
    const cfg = config.sources[adapter.id];
    if (cfg?.enabled === false) continue;
    sources.register(adapter);
  }
  // Shadow/plugin adapters are loaded lazily by the plugins subsystem (post-v0.5).
  return { config, sources };
}

/** Build the per-call context handed to adapters. */
export function adapterContext(
  adapter: SourceAdapter,
  config: SapientiaConfig,
  signal?: AbortSignal,
): AdapterContext {
  return {
    fetch: globalThis.fetch,
    signal,
    options: config.sources[adapter.id] ?? {},
    userAgent: USER_AGENT,
  };
}
