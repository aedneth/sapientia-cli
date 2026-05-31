# Contributing to Sapientia

Thanks for your interest in improving Sapientia! This document explains how to
get set up and the expectations for contributions.

## Development setup

Requirements: **Node.js 20+** and **pnpm 9+** (via `corepack enable`).

```bash
git clone https://github.com/<owner>/sapientia-cli.git
cd sapientia-cli
corepack enable
pnpm install
pnpm build         # build all packages
pnpm test          # run the test suite
pnpm typecheck     # type-check all packages
pnpm lint          # lint
```

The repo is a pnpm monorepo:

| Package | Purpose |
|---|---|
| `@sapientia/core` | Domain engine: adapters, normalization, ranking, download, catalog, config, command registry |
| `@sapientia/cli` | The `sapientia` binary (Commander + MCP) |
| `@sapientia/sources-open` | Bundled open-archive adapters |
| `@sapientia/sources-shadow` | Opt-in shadow-library plugin (contract + legal gate only) |

## Adding a source adapter

Implement the `SourceAdapter` interface from `@sapientia/core` and register it in
the appropriate package factory. Open/legal sources go in `sources-open`. Every
adapter must pass the shared adapter contract tests (fixtures, no live network in
CI). Normalize all output into the canonical `BookMetadata` schema.

## Adding a command

Commands are **declarative** — add a `CommandDef` and register it in
`packages/cli/src/commands/index.ts`. The Commander CLI, the `manifest` output,
and the MCP tools are all generated from the registry, so a single definition
serves humans and agents. Every command must support `--json` and return a stable
envelope.

## Commit & PR guidelines

- Use clear, conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`…).
- Add tests for new behavior; keep `pnpm test`, `pnpm typecheck`, and `pnpm lint` green.
- Keep changes focused; one logical change per PR.
- Update `CHANGELOG.md` under "Unreleased".

## Developer Certificate of Origin & dual licensing

Sapientia is dual-licensed (AGPL-3.0 + commercial). By contributing, you certify
that you wrote the contribution or have the right to submit it, and you agree
that your contribution may be distributed under **both** the AGPL-3.0 and the
project's commercial license. We may ask you to sign a Contributor License
Agreement (CLA) before a first merge. Sign your commits with `git commit -s`.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind.
