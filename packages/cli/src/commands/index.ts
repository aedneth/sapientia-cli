import { CommandRegistry } from "@sapientia/core";
import { addCommand } from "./add.js";
import { configCommand } from "./config.js";
import { doctorCommand } from "./doctor.js";
import { getCommand } from "./get.js";
import { libraryCommand } from "./library.js";
import { manifestCommand } from "./manifest.js";
import { mcpCommand } from "./mcp.js";
import { searchCommand } from "./search.js";
import { sourcesCommand } from "./sources.js";

/** Build the registry — the single source of truth for CLI, manifest, and MCP. */
export function buildRegistry(): CommandRegistry {
  const registry = new CommandRegistry();
  registry.register(searchCommand);
  registry.register(getCommand);
  registry.register(libraryCommand);
  registry.register(addCommand);
  registry.register(sourcesCommand);
  registry.register(configCommand);
  registry.register(doctorCommand);
  registry.register(manifestCommand(registry));
  registry.register(mcpCommand(registry));
  return registry;
}
