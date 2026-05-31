import type { BookFormat } from "../schemas/book.js";

/** Map an arbitrary extension/mime fragment to a known BookFormat. */
export function normalizeFormat(input: string | undefined): BookFormat {
  if (!input) return "unknown";
  const s = input.toLowerCase();
  if (s.includes("epub")) return "epub";
  if (s.includes("pdf")) return "pdf";
  if (s.includes("azw3")) return "azw3";
  if (s.includes("mobi")) return "mobi";
  if (s.includes("djvu")) return "djvu";
  if (s.includes("text") || s.endsWith("txt")) return "txt";
  return "unknown";
}

/** Strip ISBN to digits/X and classify by length. */
export function normalizeIsbn(input: string | undefined): { isbn10?: string; isbn13?: string } {
  if (!input) return {};
  const cleaned = input.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (cleaned.length === 13) return { isbn13: cleaned };
  if (cleaned.length === 10) return { isbn10: cleaned };
  return {};
}

/** Normalize a language token to an ISO 639-1 lowercase code when recognizable. */
export function normalizeLanguage(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const s = input.trim().toLowerCase();
  const map: Record<string, string> = {
    english: "en",
    spanish: "es",
    "español": "es",
    french: "fr",
    "français": "fr",
    german: "de",
    deutsch: "de",
  };
  if (map[s]) return map[s];
  if (/^[a-z]{2}$/.test(s)) return s;
  if (/^[a-z]{3}$/.test(s)) return s.slice(0, 2);
  return s;
}

/** Build the stable cross-source result id. */
export function makeResultId(sourceId: string, sourceRef: string): string {
  return `${sourceId}:${sourceRef}`;
}

/** Split a stable result id back into its parts. */
export function parseResultId(id: string): { sourceId: string; sourceRef: string } | undefined {
  const idx = id.indexOf(":");
  if (idx <= 0) return undefined;
  return { sourceId: id.slice(0, idx), sourceRef: id.slice(idx + 1) };
}
