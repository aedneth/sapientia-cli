import { describe, expect, it } from "vitest";
import { catalogDbPath, configFilePath, resolvePaths } from "./paths.js";

describe("XDG path resolution", () => {
  it("honors XDG_* env vars on any platform", () => {
    const env = {
      XDG_CONFIG_HOME: "/tmp/cfg",
      XDG_DATA_HOME: "/tmp/data",
      XDG_CACHE_HOME: "/tmp/cache",
      XDG_STATE_HOME: "/tmp/state",
    } as NodeJS.ProcessEnv;
    const p = resolvePaths(env);
    expect(p.config).toBe("/tmp/cfg/sapientia");
    expect(p.data).toBe("/tmp/data/sapientia");
    expect(catalogDbPath(env)).toBe("/tmp/data/sapientia/catalog.db");
  });

  it("prefers SAPIENTIA_CONFIG for the config file", () => {
    expect(configFilePath({ SAPIENTIA_CONFIG: "/custom/c.json" } as NodeJS.ProcessEnv)).toBe(
      "/custom/c.json",
    );
  });
});
