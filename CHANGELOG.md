# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Infrastructure

- The `@sapientia` npm organization is now live, unblocking scoped package
  publishing (`@sapientia/core`, `@sapientia/cli`, `@sapientia/sources-open`,
  `@sapientia/sources-shadow`).

## [0.1.0] — 2026-06-02

### Added

- Monorepo scaffold (pnpm + TypeScript 5.5 + tsup + vitest).
- `@sapientia/core`: XDG config + Zod schema, error/exit-code model, canonical
  `BookMetadata` schema, pluggable `SourceAdapter` interface, normalization
  helpers, quality-ranking engine, integrity-checked/resumable download engine,
  SQLite catalog with FTS5 and hierarchical categories, and the declarative
  command registry (single source of truth for CLI, manifest, and MCP).
- `@sapientia/sources-open`: Project Gutenberg (Gutendex) and Standard Ebooks adapters.
- `@sapientia/sources-shadow`: opt-in plugin contract + legal gate (no bundled scrapers).
- `@sapientia/cli`: `search`, `get`, `library`, `add`, `sources`, `config`,
  `doctor`, `manifest`, and `mcp serve`. Global `--json`, `--yes`, `--no-input`,
  `--accept-legal`; deterministic POSIX exit codes; stdin/stdout composability.
- Repo-standard files: AGPL-3.0 `LICENSE`, `LICENSE-COMMERCIAL`, `README`,
  `CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT`, issue/PR templates, CI.

### Fixed

- CI workflow step order: `build` now runs before `typecheck` and `lint` so
  inter-package TypeScript declaration files exist when needed (TS2307 fix).

[Unreleased]: https://github.com/aedneth/sapientia-cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/aedneth/sapientia-cli/releases/tag/v0.1.0
