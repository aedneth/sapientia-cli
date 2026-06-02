import type { Writable } from "node:stream";
import type { BookMetadata, DownloadCandidate } from "../schemas/book.js";
import type { SearchQuery } from "../schemas/query.js";

export type SourceKind = "open" | "shadow" | "academic";

export interface LegalPosture {
  /** Human-readable note shown in `sources list` and on enable. */
  note: string;
  /** Whether enabling this source requires explicit legal acknowledgment. */
  requiresAcknowledgment: boolean;
}

export interface AdapterCapabilities {
  search: boolean;
  download: boolean;
  /** Formats this source can deliver. */
  formats: string[];
}

export interface HealthStatus {
  ok: boolean;
  latencyMs?: number;
  message?: string;
}

/** Runtime services handed to adapters; keeps adapters free of global state. */
export interface AdapterContext {
  fetch: typeof globalThis.fetch;
  signal?: AbortSignal;
  /** Per-source options from config (`sources[id]`). */
  options: Record<string, unknown>;
  userAgent: string;
}

/**
 * The pluggable per-source contract. Bundled open archives and the opt-in shadow
 * plugin both implement this; ranking/catalog/CLI never special-case a source.
 */
export interface SourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly kind: SourceKind;
  readonly capabilities: AdapterCapabilities;
  readonly legal: LegalPosture;

  /** Yield raw-but-normalized results. Adapters should respect query.limit. */
  search(query: SearchQuery, ctx: AdapterContext): Promise<BookMetadata[]>;

  /** Full metadata + download candidates for a single sourceRef. */
  resolve(sourceRef: string, ctx: AdapterContext): Promise<BookMetadata>;

  /**
   * Stream a candidate into `sink`. Implementations must support HTTP Range so the
   * download engine can resume; return the byte count written and any server hash.
   */
  download(
    candidate: DownloadCandidate,
    sink: Writable,
    ctx: AdapterContext,
    range?: { start: number },
  ): Promise<{ bytesWritten: number }>;

  health(ctx: AdapterContext): Promise<HealthStatus>;
}
