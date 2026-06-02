import {
  catalogDbPath,
  Catalog,
  FilesystemError,
  hashFile,
  normalizeFormat,
  type CommandDef,
} from "@sapientia/core";
import { stat } from "node:fs/promises";
import { basename, extname } from "node:path";

export const addCommand: CommandDef = {
  name: "add",
  description: "Add an existing local file to the catalog.",
  args: [{ name: "file", description: "Path to the ebook file.", required: true }],
  flags: [
    { name: "category", type: "string", description: 'Category path, e.g. "Filosofía/Ética".' },
    { name: "title", type: "string", description: "Override the derived title." },
    { name: "author", type: "string[]", description: "Author name(s)." },
  ],
  exitCodes: [0, 2, 6, 7],
  agentSafe: false,
  async handler(ctx) {
    const file = String(ctx.args.file);
    let size: number;
    try {
      size = (await stat(file)).size;
    } catch {
      throw new FilesystemError(`Cannot read file: ${file}`);
    }
    const sha256 = await hashFile(file);
    const catalog = await Catalog.open(catalogDbPath(ctx.env));
    try {
      if (catalog.hasHash(sha256)) {
        ctx.warn("file already in catalog (hash match)");
        return { added: false, sha256 };
      }
      const id = catalog.addBook({
        title: (ctx.flags.title as string) ?? basename(file, extname(file)),
        authors: (ctx.flags.author as string[]) ?? [],
        format: normalizeFormat(extname(file).slice(1)),
        filePath: file,
        fileHashSha256: sha256,
        fileSize: size,
        categoryPath: ctx.flags.category as string | undefined,
      });
      return { added: true, id, sha256 };
    } finally {
      catalog.close();
    }
  },
};
