import {
  makeResultId,
  normalizeFormat,
  normalizeLanguage,
  SourceUnavailableError,
  type AdapterContext,
  type BookMetadata,
  type DownloadCandidate,
  type SearchQuery,
  type SourceAdapter,
} from "@sapientia/core";
import type { Writable } from "node:stream";

const GUTENDEX = "https://gutendex.com/books";

/**
 * Project Gutenberg asks automated clients to stay under ~1 request/second. Keep a
 * courteous gap between any network call this adapter makes (search and download).
 */
const MIN_INTERVAL_MS = 1000;
let lastRequestAt = 0;
async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string }[];
  languages: string[];
  subjects: string[];
  formats: Record<string, string>;
}

/** Project Gutenberg via the public Gutendex JSON API. Public domain, primary source. */
export class GutenbergAdapter implements SourceAdapter {
  readonly id = "gutenberg";
  readonly name = "Project Gutenberg";
  readonly kind = "open" as const;
  readonly capabilities = { search: true, download: true, formats: ["epub", "txt"] };
  readonly legal = {
    note: "Public domain works. Free to use, share and download worldwide.",
    requiresAcknowledgment: false,
  };

  async search(query: SearchQuery, ctx: AdapterContext): Promise<BookMetadata[]> {
    const url = new URL(GUTENDEX);
    url.searchParams.set("search", [query.text, query.author].filter(Boolean).join(" "));
    if (query.language) url.searchParams.set("languages", query.language);
    await throttle();
    const res = await ctx.fetch(url, {
      signal: ctx.signal,
      headers: { "user-agent": ctx.userAgent },
    });
    if (!res.ok) throw new SourceUnavailableError(`Gutendex returned ${res.status}`);
    const body = (await res.json()) as { results: GutendexBook[] };
    return body.results.slice(0, query.limit).map((b) => this.toMetadata(b));
  }

  async resolve(sourceRef: string, ctx: AdapterContext): Promise<BookMetadata> {
    await throttle();
    const res = await ctx.fetch(`${GUTENDEX}/${sourceRef}`, {
      signal: ctx.signal,
      headers: { "user-agent": ctx.userAgent },
    });
    if (!res.ok) throw new SourceUnavailableError(`Gutendex returned ${res.status}`);
    return this.toMetadata((await res.json()) as GutendexBook);
  }

  async download(
    candidate: DownloadCandidate,
    sink: Writable,
    ctx: AdapterContext,
    range?: { start: number },
  ): Promise<{ bytesWritten: number }> {
    const headers: Record<string, string> = { "user-agent": ctx.userAgent };
    if (range) headers.range = `bytes=${range.start}-`;
    await throttle();
    const res = await ctx.fetch(candidate.url, { signal: ctx.signal, headers });
    if (!res.ok || !res.body) throw new SourceUnavailableError(`Download failed: ${res.status}`);
    let bytesWritten = 0;
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      bytesWritten += chunk.byteLength;
      sink.write(chunk);
    }
    await new Promise<void>((resolve, reject) => sink.end((e?: Error) => (e ? reject(e) : resolve())));
    return { bytesWritten };
  }

  async health(ctx: AdapterContext) {
    const t = Date.now();
    try {
      const res = await ctx.fetch(`${GUTENDEX}/?ids=1`, {
        signal: ctx.signal,
        headers: { "user-agent": ctx.userAgent },
      });
      return { ok: res.ok, latencyMs: Date.now() - t };
    } catch (err) {
      return { ok: false, message: String(err) };
    }
  }

  private toMetadata(b: GutendexBook): BookMetadata {
    const candidates: DownloadCandidate[] = Object.entries(b.formats)
      .filter(([mime]) => /epub|plain/.test(mime))
      .map(([mime, url]) => ({
        format: normalizeFormat(mime),
        url,
        expectedHashes: {},
      }));
    return {
      id: makeResultId(this.id, String(b.id)),
      sourceId: this.id,
      sourceRef: String(b.id),
      title: b.title,
      authors: b.authors.map((a) => a.name),
      language: normalizeLanguage(b.languages[0]),
      subjects: b.subjects ?? [],
      formats: candidates.map((c) => c.format),
      candidates,
    };
  }
}
