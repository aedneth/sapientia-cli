import {
  catalogDbPath,
  Catalog,
  importDirectory,
  type CommandDef,
} from "@sapientia/core";
import { resolve } from "node:path";

export const libraryCommand: CommandDef = {
  name: "library",
  description: "Browse, full-text search, or bulk-import the local catalog.",
  args: [{ name: "query", description: "Optional FTS query.", required: false }],
  flags: [
    { name: "limit", type: "number", description: "Max rows.", default: 50 },
    {
      name: "import",
      type: "string",
      description: "Scan a directory tree and index its ebooks into the catalog.",
    },
  ],
  exitCodes: [0, 2, 3, 6, 7],
  agentSafe: true,
  async handler(ctx) {
    const catalog = await Catalog.open(catalogDbPath(ctx.env));
    try {
      if (ctx.flags.import) {
        const root = resolve(String(ctx.flags.import));
        const showProgress = process.stderr.isTTY === true;
        const summary = await importDirectory(catalog, root, {
          onProgress: showProgress
            ? (p) => process.stderr.write(`\r  scanned ${p.scanned} · imported ${p.imported}   `)
            : undefined,
        });
        if (showProgress) process.stderr.write("\n");
        for (const w of summary.warnings) ctx.warn(w);
        return { root, total: catalog.count(), ...summary };
      }

      const limit = (ctx.flags.limit as number | undefined) ?? 50;
      const q = ctx.args.query ? String(ctx.args.query) : undefined;
      const books = q ? catalog.search(q, limit) : catalog.list(limit);
      return { total: catalog.count(), shown: books.length, books };
    } finally {
      catalog.close();
    }
  },
};
