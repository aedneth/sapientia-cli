import { relative, sep } from "node:path";
import { normalizeFormat } from "../normalize/normalize.js";
import type { BookFormat } from "../schemas/book.js";

/** Ebook extensions the importer will index; everything else is skipped. */
export const SUPPORTED_EXTENSIONS = ["epub", "pdf", "mobi", "azw3", "djvu", "txt"] as const;

export function isSupportedFile(filename: string): boolean {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return !!ext && (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

export interface ParsedFilename {
  title: string;
  authors: string[];
  year?: number;
  format: BookFormat;
}

/** Split a joined author string ("A & B", "A and B", "A; B") into names. */
function splitAuthors(s: string): string[] {
  return s
    .split(/\s*[&;]\s*|\s+and\s+/i)
    .map((a) => a.trim())
    .filter(Boolean);
}

/**
 * Best-effort metadata from a bare filename. Handles the common shapes in a
 * hand-curated library: "Author - Title", "Title (Year)", "Title [Year]", or
 * just "Title". Underscores become spaces; the extension sets the format.
 */
export function parseBookFilename(filename: string): ParsedFilename {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const format = normalizeFormat(ext);

  let base = filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let year: number | undefined;
  const yearM = base.match(/[([]\s*((?:1[5-9]|20)\d{2})\s*[)\]]/);
  if (yearM) {
    year = Number(yearM[1]);
    base = base.replace(yearM[0], "").replace(/\s+/g, " ").trim();
  }

  let authors: string[] = [];
  let title = base;
  const dash = base.indexOf(" - ");
  if (dash > 0) {
    const left = base.slice(0, dash).trim();
    const right = base.slice(dash + 3).trim();
    if (left && right) {
      authors = splitAuthors(left);
      title = right;
    }
  }

  return { title: title.trim() || base, authors, year, format };
}

/**
 * Derive a "/"-joined category path from a file's location under the import root
 * (the directory hierarchy becomes the taxonomy). Returns undefined for files
 * directly in the root.
 */
export function categoryFromPath(root: string, filePath: string): string | undefined {
  const rel = relative(root, filePath);
  const parts = rel.split(sep);
  parts.pop(); // drop the filename
  const dirs = parts.filter(Boolean);
  return dirs.length ? dirs.join("/") : undefined;
}
