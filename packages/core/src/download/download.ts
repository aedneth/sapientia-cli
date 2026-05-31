import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";
import type { SourceAdapter } from "../adapter/types.js";
import type { AdapterContext } from "../adapter/types.js";
import { IntegrityError } from "../errors/errors.js";
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

  const sha256 = await hashFile(destPath, "sha256");
  const verified: Record<string, boolean> = {};
  for (const [algo, expected] of Object.entries(candidate.expectedHashes)) {
    const actual = algo === "sha256" ? sha256 : await hashFile(destPath, algo);
    verified[algo] = actual.toLowerCase() === expected.toLowerCase();
    if (!verified[algo]) {
      throw new IntegrityError(`Hash mismatch (${algo}) for ${destPath}`, {
        algo,
        expected,
        actual,
      });
    }
  }

  return { path: destPath, bytesWritten: start + bytesWritten, sha256, verified };
}
