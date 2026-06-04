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

const BASE = "https://standardebooks.org";
const SEARCH = `${BASE}/ebooks`;

/**
 * Standard Ebooks throttles aggressive automated access, and its OPDS feed is now
 * gated behind a paid Patrons Circle (HTTP 401). We instead read the public,
 * anonymous HTML catalog — but keep a courteous ≥1s gap between requests.
 */
const MIN_INTERVAL_MS = 1000;
let lastRequestAt = 0;
async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/** Decode the small set of HTML entities Standard Ebooks emits in titles/authors. */
function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&#8217;/g, "’")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/**
 * Build the compatible-EPUB download URL for a book ref ("author/book[/translator]").
 * The bare `.epub` path serves a "download has started" interstitial; the actual
 * binary requires the `?source=download` query the site's own links carry.
 */
function epubUrl(ref: string): string {
  return `${BASE}/ebooks/${ref}/downloads/${ref.replace(/\//g, "_")}.epub?source=download`;
}

/**
 * Standard Ebooks — public-domain works with hand-crafted, high-quality EPUBs.
 * Discovery uses the anonymous HTML catalog; download URLs are deterministic from
 * the book's slug, so search constructs candidates without an extra round-trip.
 */
export class StandardEbooksAdapter implements SourceAdapter {
  readonly id = "standard-ebooks";
  readonly name = "Standard Ebooks";
  readonly kind = "open" as const;
  readonly capabilities = { search: true, download: true, formats: ["epub"] };
  readonly legal = {
    note: "Public domain, quality-formatted EPUBs. Free to use and share.",
    requiresAcknowledgment: false,
  };

  async search(query: SearchQuery, ctx: AdapterContext): Promise<BookMetadata[]> {
    const text = [query.text, query.author].filter(Boolean).join(" ").trim();
    const url = new URL(SEARCH);
    if (text) url.searchParams.set("query", text);
    await throttle();
    const res = await ctx.fetch(url, {
      signal: ctx.signal,
      headers: { "user-agent": ctx.userAgent, accept: "text/html" },
    });
    if (!res.ok) throw new SourceUnavailableError(`Standard Ebooks returned ${res.status}`);
    return this.parseListing(await res.text()).slice(0, query.limit);
  }

  async resolve(sourceRef: string, ctx: AdapterContext): Promise<BookMetadata> {
    await throttle();
    const res = await ctx.fetch(`${BASE}/ebooks/${sourceRef}`, {
      signal: ctx.signal,
      headers: { "user-agent": ctx.userAgent, accept: "text/html" },
    });
    if (!res.ok) throw new SourceUnavailableError(`Unknown Standard Ebooks ref: ${sourceRef}`);
    const html = await res.text();
    const title = decode(html.match(/<h1 property="schema:name">([^<]+)<\/h1>/)?.[1]?.trim() ?? sourceRef);
    const authors = this.parseAuthors(html);
    return this.toMetadata(sourceRef, title, authors);
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
    await new Promise<void>((resolve, reject) =>
      sink.end((e?: Error) => (e ? reject(e) : resolve())),
    );
    return { bytesWritten };
  }

  async health(ctx: AdapterContext) {
    const t = Date.now();
    try {
      const res = await ctx.fetch(SEARCH, {
        signal: ctx.signal,
        method: "HEAD",
        headers: { "user-agent": ctx.userAgent },
      });
      return { ok: res.ok, latencyMs: Date.now() - t };
    } catch (err) {
      return { ok: false, message: String(err) };
    }
  }

  /** Parse the HTML catalog listing into normalized results. Exposed for tests. */
  parseListing(html: string): BookMetadata[] {
    const out: BookMetadata[] = [];
    const seen = new Set<string>();
    // Each result is an <li class="ebook"> … </li>; split and parse per block.
    for (const block of html.split(/<li[ >]/).slice(1)) {
      const bookM = block.match(
        /<a href="(\/ebooks\/[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)?)"[^>]*property="schema:url"[^>]*>\s*<span property="schema:name">([^<]+)<\/span>/,
      );
      if (!bookM) continue;
      const ref = bookM[1]!.replace(/^\/ebooks\//, "");
      if (seen.has(ref)) continue;
      seen.add(ref);
      out.push(this.toMetadata(ref, decode(bookM[2]!.trim()), this.parseAuthors(block)));
    }
    return out;
  }

  private parseAuthors(html: string): string[] {
    return [
      ...html.matchAll(
        /property="schema:author"[\s\S]*?<span property="schema:name">([^<]+)<\/span>/g,
      ),
    ].map((m) => decode(m[1]!.trim()));
  }

  private toMetadata(ref: string, title: string, authors: string[]): BookMetadata {
    const candidate: DownloadCandidate = { format: "epub", url: epubUrl(ref), expectedHashes: {} };
    return {
      id: makeResultId(this.id, ref),
      sourceId: this.id,
      sourceRef: ref,
      title,
      authors,
      language: "en",
      subjects: [],
      formats: ["epub"],
      candidates: [candidate],
    };
  }
}
