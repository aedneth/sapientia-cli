import type { CommandDef, CommandRegistry } from "@sapientia/core";
import { VERSION } from "../version.js";

/** `manifest` exposes the entire command surface so agents can self-configure. */
export function manifestCommand(registry: CommandRegistry): CommandDef {
  return {
    name: "manifest",
    description: "Emit the full command/tool manifest for agents and tooling.",
    args: [],
    flags: [{ name: "schemas", type: "boolean", description: "Include JSON output schema refs." }],
    exitCodes: [0],
    agentSafe: true,
    async handler() {
      return registry.toManifest(VERSION);
    },
  };
}
