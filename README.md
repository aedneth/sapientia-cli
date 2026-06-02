# Sapientia

> **Democratizar el acceso al conocimiento a toda la humanidad.**
> Multi-source ebook search, download, and local-library manager — for humans **and** AI agents.

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#quickstart">Quickstart</a> ·
  <a href="#agent-native">Agent-native</a> ·
  <a href="#commands">Commands</a> ·
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
