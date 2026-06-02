import { catalogDbPath, Catalog, type CommandDef } from "@sapientia/core";

export const libraryCommand: CommandDef = {
  name: "library",
  description: "Browse or full-text search the local catalog.",
  args: [{ name: "query", description: "Optional FTS query.", required: false }],
  flags: [{ name: "limit", type: "number", description: "Max rows.", default: 50 }],
  exitCodes: [0, 3, 6, 7],
  agentSafe: true,
  async handler(ctx) {
    const catalog = await Catalog.open(catalogDbPath(ctx.env));
    try {
      const limit = (ctx.flags.limit as number | undefined) ?? 50;
      const q = ctx.args.query ? String(ctx.args.query) : undefined;
      const books = q ? catalog.search(q, limit) : catalog.list(limit);
      return { total: catalog.count(), shown: books.length, books };
    } finally {
      catalog.close();
    }
  },
};
