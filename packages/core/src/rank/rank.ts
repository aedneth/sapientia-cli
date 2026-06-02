import type { RankingWeightsSchema } from "../config/config.js";
import type { z } from "zod";
import type { BookFormat, BookMetadata } from "../schemas/book.js";

type RankingWeights = z.infer<typeof RankingWeightsSchema>;

/** Format quality scores (0–1), EPUB best per the overview. */
const FORMAT_QUALITY: Record<BookFormat, number> = {
  epub: 1.0,
  pdf: 0.8,
  mobi: 0.6,
  azw3: 0.6,
  djvu: 0.4,
  txt: 0.3,
  unknown: 0.1,
};

/** Reliability score for a source id (0–1). Open archives outrank scrapers. */
export interface SourceReliability {
  (sourceId: string): number;
}

function formatScore(formats: BookFormat[]): number {
  if (formats.length === 0) return FORMAT_QUALITY.unknown;
  return Math.max(...formats.map((f) => FORMAT_QUALITY[f] ?? 0.1));
}

function metadataCompleteness(b: BookMetadata): number {
  const fields = [b.title, b.authors.length > 0, b.year, b.language, b.isbn13 ?? b.isbn10, b.description];
  const present = fields.filter(Boolean).length;
  return present / fields.length;
}

function availabilityScore(b: BookMetadata): number {
  const best = b.candidates.reduce((max, c) => Math.max(max, c.availability ?? 0), 0);
  if (best <= 0) return 0.5; // unknown availability is neutral
  return Math.min(1, best / 100);
}

/**
 * Assign a deterministic 0–1 quality score and return results sorted best-first.
 * Ties break by source id then result id so `--json` output is stable across runs.
 */
export function rankResults(
  results: BookMetadata[],
  weights: RankingWeights,
  reliability: SourceReliability,
): BookMetadata[] {
  const scored = results.map((b) => {
    const score =
      weights.sourceReliability * reliability(b.sourceId) +
      weights.formatQuality * formatScore(b.formats) +
      weights.metadataCompleteness * metadataCompleteness(b) +
      weights.availability * availabilityScore(b);
    return { ...b, score };
  });
  scored.sort((a, b) => {
    if (b.score! !== a.score!) return b.score! - a.score!;
    if (a.sourceId !== b.sourceId) return a.sourceId.localeCompare(b.sourceId);
    return a.id.localeCompare(b.id);
  });
  return scored;
}
