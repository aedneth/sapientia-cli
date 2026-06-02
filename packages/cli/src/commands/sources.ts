import { type CommandDef } from "@sapientia/core";
import { adapterContext, createRuntime } from "../runtime.js";

export const sourcesCommand: CommandDef = {
  name: "sources",
  description: "List configured sources and their health.",
  args: [
    {
      name: "action",
      description: "list | enable | disable (default: list).",
      required: false,
    },
    { name: "id", description: "Source id for enable/disable.", required: false },
  ],
  flags: [{ name: "check", type: "boolean", description: "Probe each source's health." }],
  exitCodes: [0, 2, 4, 6],
  agentSafe: true,
  async handler(ctx) {
    const { config, sources } = await createRuntime(ctx.env);
    const action = (ctx.args.action as string) ?? "list";
    if (action !== "list") {
      // enable/disable mutate config; full impl lands with `config set` plumbing (v0.4).
      ctx.warn(`'${action}' is recognized; persistence arrives in v0.4 via config set.`);
    }

    const list = await Promise.all(
      sources.list().map(async (a) => {
        const base = {
          id: a.id,
          name: a.name,
          kind: a.kind,
          enabled: config.sources[a.id]?.enabled !== false,
          legal: a.legal,
          capabilities: a.capabilities,
        };
        if (!ctx.flags.check) return base;
        const health = await a.health(adapterContext(a, config));
        return { ...base, health };
      }),
    );
    return { sources: list };
  },
};
