import { ExitCode } from "./exit-codes.js";

/**
 * Base error carrying a deterministic exit code and a stable machine code.
 * Every thrown error in sapientia should be (or wrap into) a SapientiaError so
 * the CLI can map it to an exit code and a `--json` error envelope without guessing.
 */
export class SapientiaError extends Error {
  readonly exitCode: ExitCode;
  /** Stable, lowercase, snake_case identifier surfaced in `--json` output. */
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    opts: { exitCode: ExitCode; code: string; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, { cause: opts.cause });
    this.name = new.target.name;
    this.exitCode = opts.exitCode;
    this.code = opts.code;
    this.details = opts.details;
  }
}

export class UsageError extends SapientiaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { exitCode: ExitCode.USAGE, code: "usage_error", details });
  }
}

export class NotFoundError extends SapientiaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { exitCode: ExitCode.NOT_FOUND, code: "not_found", details });
  }
}

export class SourceUnavailableError extends SapientiaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { exitCode: ExitCode.UNAVAILABLE, code: "source_unavailable", details });
  }
}

export class IntegrityError extends SapientiaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { exitCode: ExitCode.INTEGRITY, code: "integrity_failure", details });
  }
}

export class ConfigError extends SapientiaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { exitCode: ExitCode.CONFIG, code: "config_error", details });
  }
}

export class FilesystemError extends SapientiaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, { exitCode: ExitCode.FILESYSTEM, code: "filesystem_error", details });
  }
}

/** Coerce any thrown value into a SapientiaError for uniform handling. */
export function toSapientiaError(err: unknown): SapientiaError {
  if (err instanceof SapientiaError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new SapientiaError(message, {
    exitCode: ExitCode.GENERIC,
    code: "internal_error",
    cause: err,
  });
}
