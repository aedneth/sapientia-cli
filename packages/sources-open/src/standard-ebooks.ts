import {
  makeResultId,
  SourceUnavailableError,
  type AdapterContext,
  type BookMetadata,
  type DownloadCandidate,
  type SearchQuery,
  type SourceAdapter,
} from "@sapientia/core";
import type { Writable } from "node:stream";

const OPDS = "https://standardebooks.org/feeds/opds/all";

/**
 * Standard Ebooks — public-domain works with hand-crafted, high-quality EPUBs.
 * Uses the public OPDS catalog feed; filters client-side by query text.
 */
export class StandardEbooksAdapter implements SourceAdapter {
  readonly id = "standard-ebooks";
  readonly name = "Standard Ebooks";
  readonly kind = "open" as const;
  readonly capabilities = { search: true, download: true, formats: ["epub", "azw3"] };
  readonly legal = {
    note: "Public domain, quality-formatted EPUBs. Free to use and share.",
    requiresAcknowledgment: false,
  };

  async search(query: SearchQuery, ctx: AdapterContext): Promise<BookMetadata[]> {
    const res = await ctx.fetch(OPDS, {
      signal: ctx.signal,
      headers: { "user-agent": ctx.userAgent, accept: "application/atom+xml" },
    });
    if (!res.ok) throw new SourceUnavailableError(`Standard Ebooks returned ${res.status}`);
    const xml = await res.text();
    return this.parseOpds(xml, query).slice(0, query.limit);
  }

  async resolve(sourceRef: string, ctx: AdapterContext): Promise<BookMetadata> {
    const all = await this.search({ text: "", limit: 10000 } as SearchQuery, ctx);
    const found = all.find((b) => b.sourceRef === sourceRef);
    if (!found) throw new SourceUnavailableError(`Unknown Standard Ebooks ref: ${sourceRef}`);
    return found;
  }

  async download(
    candidate: DownloadCandidate,
    sink: Writable,
    ctx: AdapterContext,
    range?: { start: number },
  ): Promise<{ bytesWritten: number }> {
    const headers: Record<string, string> = { "user-agent": ctx.userAgent };
    if (range) headers.range = `bytes=${range.start}-`;
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
      const res = await ctx.fetch(OPDS, {
        signal: ctx.signal,
        method: "HEAD",
        headers: { "user-agent": ctx.userAgent },
      });
      return { ok: res.ok, latencyMs: Date.now() - t };
    } catch (err) {
      return { ok: false, message: String(err) };
    }
  }

  /** Minimal OPDS/Atom parse — entries with title, author and an epub acquisition link. */
  private parseOpds(xml: string, query: SearchQuery): BookMetadata[] {
    const entries = xml.split(/<entry>/).slice(1);
    const needle = `${query.text} ${query.author ?? ""}`.trim().toLowerCase();
    const out: BookMetadata[] = [];
    for (const e of entries) {
      const title = e.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
      const author = e.match(/<author>\s*<name>([^<]+)<\/name>/)?.[1]?.trim();
      const id = e.match(/<id>([^<]+)<\/id>/)?.[1]?.trim();
      const epub = e.match(/href="([^"]+\.epub)"/)?.[1];
      if (!title || !id) continue;
      if (needle && !`${title} ${author ?? ""}`.toLowerCase().includes(needle)) continue;
      const ref = id.split("/").pop() ?? id;
      const candidates: DownloadCandidate[] = epub
        ? [{ format: "epub", url: epub.startsWith("http") ? epub : `https://standardebooks.org${epub}`, expectedHashes: {} }]
        : [];
      out.push({
        id: makeResultId(this.id, ref),
        sourceId: this.id,
        sourceRef: ref,
        title,
        authors: author ? [author] : [],
        formats: candidates.map((c) => c.format),
        subjects: [],
        candidates,
      });
    }
    return out;
  }
}
