import { defineConfig } from "tsup";

export default defineConfig({
  entry: { sapientia: "src/bin/sapientia.ts" },
  format: ["esm"],
  dts: false,
  clean: true,
  target: "node20",
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" },
  external: ["better-sqlite3", "@sapientia/core", "@sapientia/sources-open", "@sapientia/sources-shadow"],
});
