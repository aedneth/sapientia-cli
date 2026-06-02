import {
  catalogDbPath,
  Catalog,
  downloadCandidate,
  NotFoundError,
  parseResultId,
  UsageError,
  type CommandDef,
  type DownloadCandidate,
} from "@sapientia/core";
import { join } from "node:path";
import { adapterContext, createRuntime } from "../runtime.js";

/** Read newline/space separated ids from stdin when `--input -` is given. */
async function readStdinIds(): Promise<string[]> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8").split(/\s+/).filter(Boolean);
}

export const getCommand: CommandDef = {
  name: "get",
  description: "Download a search result by id, verify its hash, optionally catalog it.",
  args: [{ name: "id", description: "Result id (sourceId:sourceRef). Omit with --input -.", required: false }],
  flags: [
    { name: "format", type: "string", description: "Preferred format." },
    { name: "output-dir", type: "string", description: "Override download directory." },
    { name: "to-catalog", type: "boolean", description: "Add the file to the local catalog." },
    { name: "input", type: "string", description: "Read ids from stdin when set to '-'." },
  ],
  exitCodes: [0, 2, 3, 4, 5, 7],
  agentSafe: false,
  async handler(ctx) {
    const ids: string[] =
      ctx.flags.input === "-"
        ? await readStdinIds()
        : ctx.args.id
          ? [String(ctx.args.id)]
          : [];
    if (ids.length === 0) throw new UsageError("Provide an id or pipe ids with `--input -`.");

    const { config, sources } = await createRuntime(ctx.env);
    const outDir = (ctx.flags["output-dir"] as string | undefined) ?? config.downloadDir!;
    const downloaded: unknown[] = [];

    for (const id of ids) {
      const parsed = parseResultId(id);
      if (!parsed) throw new UsageError(`Malformed id: ${id}`);
      const adapter = sources.get(parsed.sourceId);
      if (!adapter) throw new NotFoundError(`No enabled source for id: ${id}`);

      const meta = await adapter.resolve(parsed.sourceRef, adapterContext(adapter, config));
      const candidate = pickCandidate(meta.candidates, ctx.flags.format as string | undefined, config.formatPreference);
      if (!candidate) throw new NotFoundError(`No downloadable candidate for ${id}`);

      const ext = candidate.format === "unknown" ? "bin" : candidate.format;
      const dest = join(outDir, `${meta.authors[0] ?? "unknown"} - ${meta.title}.${ext}`.replace(/[/\\]/g, "_"));
      const result = await downloadCandidate(adapter, candidate, dest, adapterContext(adapter, config));

      if (ctx.flags["to-catalog"]) {
        const catalog = await Catalog.open(catalogDbPath(ctx.env));
        if (!catalog.hasHash(result.sha256)) {
          catalog.addBook({
            title: meta.title,
            authors: meta.authors,
            year: meta.year,
            language: meta.language,
            format: candidate.format,
            filePath: result.path,
            fileHashSha256: result.sha256,
            fileSize: result.bytesWritten,
            sourceId: meta.sourceId,
            sourceRef: meta.sourceRef,
            subjects: meta.subjects,
          });
        } else {
          ctx.warn(`already in catalog (hash match): ${meta.title}`);
        }
        catalog.close();
      }

      downloaded.push({ id, path: result.path, sha256: result.sha256, bytes: result.bytesWritten, verified: result.verified });
    }

    return { count: downloaded.length, downloaded };
  },
};

function pickCandidate(
  candidates: DownloadCandidate[],
  preferred: string | undefined,
  preference: string[],
): DownloadCandidate | undefined {
  if (candidates.length === 0) return undefined;
  if (preferred) {
    const exact = candidates.find((c) => c.format === preferred);
    if (exact) return exact;
  }
  for (const fmt of preference) {
    const match = candidates.find((c) => c.format === fmt);
    if (match) return match;
  }
  return candidates[0];
}
