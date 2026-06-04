import { readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import type { Catalog } from "../catalog/catalog.js";
import { hashFile } from "../download/download.js";
import { categoryFromPath, isSupportedFile, parseBookFilename } from "./filename.js";

export interface ImportProgress {
  scanned: number;
  imported: number;
  current: string;
}

export interface ImportOptions {
  /** Called after each supported file is processed; for progress display. */
  onProgress?: (p: ImportProgress) => void;
  /** Cap on warning strings retained in the summary (errors are still counted). */
  maxWarnings?: number;
}

export interface ImportSummary {
  /** Supported ebook files encountered. */
  scanned: number;
  imported: number;
  /** Already catalogued (hash match). */
  skipped: number;
  /** Unreadable file, hash failure, or insert conflict. */
  failed: number;
  warnings: string[];
}

/** Recursively yield file paths under `dir`, silently skipping unreadable dirs. */
async function* walk(dir: string, onUnreadable: (d: string) => void): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    onUnreadable(dir);
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full, onUnreadable);
    else if (e.isFile()) yield full;
  }
}

/**
 * Scan a directory tree and index supported ebooks into the catalog. Metadata is
 * derived from each filename and the directory hierarchy becomes the category
 * taxonomy. Files already present (by SHA-256) are skipped; unreadable files are
 * counted and reported rather than aborting the run.
 */
export async function importDirectory(
  catalog: Catalog,
  root: string,
  opts: ImportOptions = {},
): Promise<ImportSummary> {
  const maxWarnings = opts.maxWarnings ?? 50;
  const summary: ImportSummary = { scanned: 0, imported: 0, skipped: 0, failed: 0, warnings: [] };
  const note = (msg: string) => {
    if (summary.warnings.length < maxWarnings) summary.warnings.push(msg);
  };

  for await (const file of walk(root, (d) => note(`unreadable directory: ${d}`))) {
    if (!isSupportedFile(file)) continue;
    summary.scanned++;
    try {
      const sha256 = await hashFile(file);
      if (catalog.hasHash(sha256)) {
        summary.skipped++;
      } else {
        const meta = parseBookFilename(basename(file));
        const size = (await stat(file)).size;
        catalog.addBook({
          title: meta.title,
          authors: meta.authors,
          year: meta.year,
          format: meta.format,
          filePath: file,
          fileHashSha256: sha256,
          fileSize: size,
          categoryPath: categoryFromPath(root, file),
        });
        summary.imported++;
      }
    } catch (err) {
      summary.failed++;
      note(`${file}: ${String(err)}`);
    }
    opts.onProgress?.({ scanned: summary.scanned, imported: summary.imported, current: file });
  }
  return summary;
}
