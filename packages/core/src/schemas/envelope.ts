/**
 * Stable, versioned `--json` envelope wrapping every command's machine output.
 * Schema version is bumped only on breaking changes and frozen at v1.0.
 */
export const JSON_SCHEMA_VERSION = "1";

export interface JsonEnvelope<T = unknown> {
  schemaVersion: string;
  command: string;
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  warnings: string[];
}

export function ok<T>(command: string, data: T, warnings: string[] = []): JsonEnvelope<T> {
  return { schemaVersion: JSON_SCHEMA_VERSION, command, ok: true, data, warnings };
}

export function fail(
  command: string,
  error: { code: string; message: string; details?: Record<string, unknown> },
  warnings: string[] = [],
): JsonEnvelope<never> {
  return { schemaVersion: JSON_SCHEMA_VERSION, command, ok: false, error, warnings };
}
