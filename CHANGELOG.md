# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## Roadmap

- **v0.1.0** — first published release (this scaffold, hardened).
- **v0.2.0** — Open Library + Archive.org + arXiv adapters; ranking tuning.
- **v0.3.0** — `catalog import` of an existing library taxonomy; Ink TUI browse.
- **v0.4.0** — `completion`; richer `doctor`; persisted `sources enable/disable`.
- **v0.5.0** — plugin system + published opt-in `sources-shadow`.
- **v0.6.0** — full MCP parity + tool schemas.
- **v0.7.0–v0.9.0** — standalone binaries, Homebrew/Scoop, hardening.
- **v1.0.0** — frozen `--json` schemas, exit codes, and public API.

[Unreleased]: https://github.com/sapientia/sapientia-cli/commits/main
