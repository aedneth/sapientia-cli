import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, truncate } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";
import type { SourceAdapter } from "../adapter/types.js";
import type { AdapterContext } from "../adapter/types.js";
import { FilesystemError, IntegrityError, UsageError } from "../errors/errors.js";
import type { DownloadCandidate } from "../schemas/book.js";

export interface DownloadResult {
  path: string;
  bytesWritten: number;
  sha256: string;
  /** Per-algorithm verification outcome against advertised hashes. */
  verified: Record<string, boolean>;
}

/** Compute the SHA-256 of a file already on disk. */
export async function hashFile(path: string, algo = "sha256"): Promise<string> {
  const hash = createHash(algo);
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

/** Private IP ranges that must never be fetched (SSRF guard). */
const BLOCKED_HOSTS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,       // link-local
  /^\[::1\]$/,        // IPv6 loopback
  /^\[fc..:.*\]$/i,   // IPv6 ULA
];

/**
 * Validate a candidate URL before fetching. Rejects non-HTTP(S) schemes and
 * private/loopback hosts to prevent SSRF from malicious adapter responses.
 * Throws UsageError (exit 2) on violation.
 */
export function validateDownloadUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UsageError(`Invalid download URL: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UsageError(
      `Download URL must use http(s): — got ${parsed.protocol} in ${url}`,
    );
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.some((re) => re.test(host))) {
    throw new UsageError(`Download URL targets a private or loopback host: ${host}`);
  }
}

/**
 * Download a candidate through its adapter, hashing the stream as it lands and
 * verifying against any advertised hashes. Resumes a partial file via HTTP Range.
 * Throws IntegrityError (exit 5) on a hash mismatch.
 */
export async function downloadCandidate(
  adapter: SourceAdapter,
  candidate: DownloadCandidate,
  destPath: string,
  ctx: AdapterContext,
): Promise<DownloadResult> {
  // Guard before any I/O so an agent can't steer us to internal endpoints.
  validateDownloadUrl(candidate.url);

  await mkdir(dirname(destPath), { recursive: true });

  let start = 0;
  try {
    const existing = await stat(destPath);
    if (candidate.fileSize && existing.size < candidate.fileSize) start = existing.size;
  } catch {
    /* no partial file */
  }

  const sink = createWriteStream(destPath, { flags: start > 0 ? "a" : "w" });
  const { bytesWritten } = await adapter.download(
    candidate,
    sink,
    ctx,
    start > 0 ? { start } : undefined,
  );

  // If we asked for a range but the server returned the full content, the file is now
  // prefix + full body (corrupted). Detect by comparing actual size to expected.
  if (start > 0 && candidate.fileSize) {
    const finalStat = await stat(destPath);
    if (finalStat.size > candidate.fileSize) {
      // Truncate and surface a clear error rather than silently leaving corrupt data.
      await new Promise<void>((res, rej) =>
        truncate(destPath, 0, (e) => (e ? rej(e) : res())),
      );
      throw new FilesystemError(
        `Resume corrupted: server did not honor HTTP Range for ${candidate.url}. ` +
          `File truncated — retry without a partial file.`,
        { url: candidate.url, expectedSize: candidate.fileSize, actualSize: finalStat.size },
      );
    }
  }

  const sha256 = await hashFile(destPath, "sha256");
  const verified: Record<string, boolean> = {};
  for (const [algo, expected] of Object.entries(candidate.expectedHashes)) {
    const actual = algo === "sha256" ? sha256 : await hashFile(destPath, algo);
    verified[algo] = actual.toLowerCase() === expected.toLowerCase();
    if (!verified[algo]) {
      // Remove the bad file so a retry starts clean.
      await unlink(destPath).catch(() => undefined);
      throw new IntegrityError(`Hash mismatch (${algo}) for ${destPath}`, {
        algo,
        expected,
        actual,
      });
    }
  }

  return { path: destPath, bytesWritten: start + bytesWritten, sha256, verified };
}
