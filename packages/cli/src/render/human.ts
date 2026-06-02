import pc from "picocolors";

/** Plain, scannable human output. Agents use --json; humans get this. */
export function renderHuman(command: string, data: unknown): void {
  const out = process.stdout;
  switch (command) {
    case "search": {
      const d = data as { results: SearchRow[]; total: number; sourcesFailed: number };
      if (d.total === 0) {
        out.write("No results.\n");
        return;
      }
      for (const r of d.results) {
        const score = r.score != null ? pc.dim(` [${r.score.toFixed(2)}]`) : "";
        out.write(`${pc.bold(r.title)}${score}\n`);
        out.write(`  ${r.authors.join(", ") || "Unknown"} · ${r.formats.join("/") || "?"} · ${pc.cyan(r.id)}\n`);
      }
      out.write(pc.dim(`\n${d.total} result(s)${d.sourcesFailed ? `, ${d.sourcesFailed} source(s) failed` : ""}\n`));
      return;
    }
    case "library": {
      const d = data as { books: SearchRow[]; total: number; shown: number };
      for (const b of d.books) out.write(`${pc.bold(b.title)} — ${b.authors?.join(", ") || ""}\n`);
      out.write(pc.dim(`\n${d.shown}/${d.total} in catalog\n`));
      return;
    }
    default:
      out.write(JSON.stringify(data, null, 2) + "\n");
  }
}

interface SearchRow {
  id: string;
  title: string;
  authors: string[];
  formats: string[];
  score?: number;
}
