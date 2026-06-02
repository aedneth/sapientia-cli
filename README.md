# Sapientia

> **Democratizar el acceso al conocimiento a toda la humanidad.**
> Multi-source ebook search, download, and local-library manager — for humans **and** AI agents.

<p align="center">
  <a href="https://github.com/aedneth/sapientia-cli/actions/workflows/ci.yml">
    <img src="https://github.com/aedneth/sapientia-cli/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <a href="https://github.com/aedneth/sapientia-cli/releases/tag/v0.1.0">
    <img src="https://img.shields.io/github/v/release/aedneth/sapientia-cli?label=release" alt="Release">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License: AGPL-3.0">
  </a>
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#quickstart">Quickstart</a> ·
  <a href="#agent-native">Agent-native</a> ·
  <a href="#commands">Commands</a> ·
  <a href="#roadmap">Roadmap</a> ·
  <a href="#contributing">Contributing</a> ·
  <a href="#license">License</a>
</p>

---

Sapientia searches across open archives (Project Gutenberg, Standard Ebooks, and
more), ranks results by quality, downloads with hash-integrity verification, and
keeps a fast local **SQLite catalog** of your library — importable from an
existing folder taxonomy. It is part of the **Korvex** agent-native CLI suite.

- 🔎 **Unified multi-source search** with quality ranking (format, reliability, metadata completeness).
- ⬇️ **Integrity-checked downloads** (SHA-256, resumable).
- 🗂️ **Local catalog** with full-text search and hierarchical categories.
- 🤖 **Agent-native by design** — every flow has a non-interactive, `--json`, pipeable equivalent, plus a built-in **MCP server**.
- 🧩 **Pluggable sources** — open archives bundled; shadow libraries are a separate, opt-in plugin (see [Legal & abuse posture](#legal--abuse-posture)).

## Demo

```
$ sapientia search "The Dispossessed Le Guin" --json | jq '.results[0]'
{
  "id": "gutenberg:63221",
  "title": "The Dispossessed",
  "authors": ["Ursula K. Le Guin"],
  "year": 1974,
  "format": "epub",
  "source": "gutenberg",
  "qualityScore": 0.92,
  "downloadUrl": "https://www.gutenberg.org/ebooks/63221.epub.images"
}

$ sapientia get gutenberg:63221 --to-catalog
✔ Downloaded The Dispossessed (1.2 MB)
✔ SHA-256 verified
✔ Added to catalog — id: gut-63221

$ sapientia library "Le Guin" --json | jq '[.results[].title]'
["The Dispossessed", "The Left Hand of Darkness", "A Wizard of Earthsea"]
```

## Install

```bash
npm install -g @sapientia/cli      # Linux · macOS · Windows
sapientia --version
```

Standalone binaries (no Node) and Homebrew/Scoop packages are planned — see the [roadmap](CHANGELOG.md).

## Quickstart

```bash
sapientia search "The Dispossessed Le Guin"      # search all enabled sources
sapientia search "Nietzsche" --json | jq         # machine-readable output
sapientia get gutenberg:1342 --to-catalog        # download + verify + catalog
sapientia library "philosophy"                   # full-text search your catalog
sapientia add ./book.epub --category "Filosofía" # add an existing file
sapientia sources --check                        # list sources + health
sapientia doctor                                 # diagnose your setup
```

## Agent-native

Like `gh` and `vercel`, Sapientia is a first-class tool for terminal AI agents
(Claude Code, Codex, Gemini CLI, Hermes, OpenClaw, OpenCode, DeepSeek):

| Capability | How |
|---|---|
| Machine output | `--json` on every command — stable, versioned envelope |
| No prompts | `--no-input` / `SAPIENTIA_NO_INPUT=1` — never hangs on a TTY |
| Skip confirmations | `--yes` |
| Composability | stdin/stdout piping, `--ndjson`, `--input -` |
| Discovery | `sapientia manifest` — full typed command/flag surface |
| MCP | `sapientia mcp serve` — exposes commands as MCP tools |
| Deterministic exit codes | `0` ok · `2` usage · `3` not found · `4` unavailable · `5` integrity · `6` config · `7` fs · `8` partial · `130` interrupted |

```bash
# An agent can enumerate the whole tool surface, then call it:
sapientia manifest --json
sapientia search "Spinoza Ethics" --json --no-input
```

## Commands

| Command | Purpose |
|---|---|
| `search <query>` | Search enabled sources, ranked |
| `get <id>` | Download by result id, verify hash, optionally catalog |
| `library [query]` | Browse / full-text search the local catalog |
| `add <file>` | Add an existing file to the catalog |
| `sources [list\|enable\|disable]` | Manage sources, check health |
| `config <get\|set\|path>` | Configuration |
| `doctor` | Diagnostics |
| `manifest` | Emit command/tool manifest |
| `mcp serve` | Run the MCP server |

Run `sapientia <command> --help` for full flags. Config and data live under XDG
paths (`$XDG_CONFIG_HOME/sapientia`, `$XDG_DATA_HOME/sapientia`).

## Legal & abuse posture

Sapientia ships adapters **only for open, public-domain, and legal archives**.

**Shadow-library** sources are **not** bundled. They live in a separate,
**opt-in** package (`@sapientia/sources-shadow`) that you must install and
explicitly enable; enabling requires a one-time legal acknowledgment
(`--accept-legal`). You are responsible for compliance with the laws of your
jurisdiction. Sapientia performs no bulk scraping, fetches content only on your
explicit request, rate-limits sources, and never ships copyrighted material.
See [SECURITY.md](SECURITY.md) for takedown contact.

## Roadmap

| Version | Focus |
|---|---|
| **v0.1.0** | Agent-native foundation — core engine, open sources, MCP server *(current)* |
| **v0.2.0** | Open Library + Archive.org + arXiv adapters; ranking tuning |
| **v0.3.0** | `catalog import` for existing library taxonomy; Ink TUI browse mode |
| **v0.4.0** | Shell completions; richer `doctor`; persisted source enable/disable |
| **v0.5.0** | Plugin system + published opt-in `@sapientia/sources-shadow` |
| **v0.6.0** | Full MCP parity + versioned tool schemas |
| **v0.7.0–v0.9.0** | Standalone binaries, Homebrew/Scoop, hardening |
| **v1.0.0** | Frozen `--json` schemas, exit codes, and public API |

See [CHANGELOG.md](CHANGELOG.md) for full release notes.

## Contributing

Contributions are welcome — bug reports, source adapter ideas, and PRs.
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, commit conventions, and how to add a new source adapter. For security issues, see [SECURITY.md](SECURITY.md).

## License

**Dual-licensed — this is final and deliberate:**

- **[GNU AGPL-3.0](LICENSE)** — free and open source for everyone, forever. The
  code stays open; network-deployed modifications must share their source.
- **[Commercial license](LICENSE-COMMERCIAL)** — for companies that want to
  embed or resell Sapientia in proprietary/closed products without AGPL
  obligations. Contact eduardoa.borjas@gmail.com.

Permissive licenses (MIT/Apache) are intentionally **rejected**: they would let a
company use and resell this work without a commercial agreement. The dual model
keeps Sapientia free for the public while funding its continued development.

---

<p align="center"><sub>Built with TypeScript · Node 20 · part of the Korvex suite</sub></p>
