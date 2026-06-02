import {
  ExitCode,
  rankResults,
  SearchQuerySchema,
  UsageError,
  type BookMetadata,
  type CommandDef,
} from "@sapientia/core";
import { adapterContext, createRuntime } from "../runtime.js";

export const searchCommand: CommandDef = {
  name: "search",
  description: "Search all enabled sources and return ranked results.",
  args: [{ name: "query", description: "Search text.", required: true }],
  flags: [
    { name: "source", type: "string", description: "Restrict to one source id." },
    { name: "author", type: "string", description: "Filter by author." },
    { name: "category", type: "string", description: "Filter by category." },
    { name: "language", type: "string", description: "ISO 639-1 language filter." },
    { name: "format", type: "string", description: "Preferred format.", choices: ["epub", "pdf", "mobi", "azw3", "djvu", "txt"] },
    { name: "year", type: "number", description: "Publication year filter." },
    { name: "limit", type: "number", description: "Max results.", default: 25 },
    { name: "sort", type: "string", description: "Sort key.", choices: ["score", "year", "title"], default: "score" },
  ],
  exitCodes: [0, 2, 3, 4, 8],
  agentSafe: true,
  async handler(ctx) {
    const query = SearchQuerySchema.parse({
      text: String(ctx.args.query ?? ""),
      author: ctx.flags.author as string | undefined,
      category: ctx.flags.category as string | undefined,
      language: ctx.flags.language as string | undefined,
      format: ctx.flags.format as string | undefined,
      year: ctx.flags.year as number | undefined,
      limit: (ctx.flags.limit as number | undefined) ?? 25,
    });

    const { config, sources } = await createRuntime(ctx.env);
    let adapters = sources.list().filter((a) => a.capabilities.search);
    if (ctx.flags.source) {
      adapters = adapters.filter((a) => a.id === ctx.flags.source);
      if (adapters.length === 0) throw new UsageError(`Unknown source: ${ctx.flags.source}`);
    }

    const settled = await Promise.allSettled(
      adapters.map((a) => a.search(query, adapterContext(a, config))),
    );

    const results: BookMetadata[] = [];
    let failures = 0;
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") results.push(...r.value);
      else {
        failures++;
        ctx.warn(`source ${adapters[i]!.id} failed: ${String((r as PromiseRejectedResult).reason)}`);
      }
    });

    const reliability = (id: string) => (sources.get(id)?.kind === "open" ? 0.9 : 0.6);
    const ranked = rankResults(results, config.ranking.weights, reliability);

    if (failures > 0) ctx.setExitCode(ExitCode.PARTIAL);

    return {
      query: query.text,
      total: ranked.length,
      sourcesQueried: adapters.length,
      sourcesFailed: failures,
      results: ranked,
    };
  },
};
