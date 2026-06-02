import { z } from "zod";

/** File formats sapientia understands, in default quality-preference order. */
export const FormatSchema = z.enum(["epub", "pdf", "mobi", "azw3", "djvu", "txt", "unknown"]);
export type BookFormat = z.infer<typeof FormatSchema>;

/** A downloadable artifact for a given result (one source may offer several). */
export const DownloadCandidateSchema = z.object({
  format: FormatSchema,
  url: z.string().url(),
  /** Expected hashes keyed by algorithm, when the source advertises them. */
  expectedHashes: z.record(z.string()).default({}),
  fileSize: z.number().int().nonnegative().optional(),
  /** Mirror priority / seeders for torrent-backed sources; higher is better. */
  availability: z.number().optional(),
  mirror: z.string().optional(),
});
export type DownloadCandidate = z.infer<typeof DownloadCandidateSchema>;

/**
 * Canonical, source-agnostic book metadata. Every adapter normalizes into this
 * shape so ranking, the catalog, and `--json` consumers see one schema.
 */
export const BookMetadataSchema = z.object({
  /** Stable id within a search result set: `${sourceId}:${sourceRef}`. */
  id: z.string(),
  sourceId: z.string(),
  sourceRef: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  authors: z.array(z.string()).default([]),
  year: z.number().int().optional(),
  publisher: z.string().optional(),
  isbn10: z.string().optional(),
  isbn13: z.string().optional(),
  /** ISO 639-1 where resolvable. */
  language: z.string().optional(),
  formats: z.array(FormatSchema).default([]),
  series: z.string().optional(),
  edition: z.string().optional(),
  description: z.string().optional(),
  subjects: z.array(z.string()).default([]),
  coverUrl: z.string().url().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  pageCount: z.number().int().nonnegative().optional(),
  candidates: z.array(DownloadCandidateSchema).default([]),
  /** Quality score assigned by the ranking engine (0–1). */
  score: z.number().optional(),
});
export type BookMetadata = z.infer<typeof BookMetadataSchema>;
