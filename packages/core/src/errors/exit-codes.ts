/**
 * Deterministic POSIX exit codes. Frozen as part of the public contract at v1.0.
 * Agents rely on these to branch without parsing output.
 */
export const ExitCode = {
  /** Success. */
  OK: 0,
  /** Generic, uncategorized failure. */
  GENERIC: 1,
  /** Usage / validation error — bad flags, missing required input in non-interactive mode. */
  USAGE: 2,
  /** Requested resource not found / no results. */
  NOT_FOUND: 3,
  /** Source or network unavailable. */
  UNAVAILABLE: 4,
  /** Integrity verification (hash) failure. */
  INTEGRITY: 5,
  /** Configuration error. */
  CONFIG: 6,
  /** Filesystem / permission error. */
  FILESYSTEM: 7,
  /** Partial success — some sources failed but others returned. */
  PARTIAL: 8,
  /** Interrupted (SIGINT). */
  INTERRUPTED: 130,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];
