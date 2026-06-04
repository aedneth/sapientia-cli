---
type: opus-bootstrap
project: sapientia-cli
created: 2026-06-03
status: active
---

# OPUS ORCHESTRATOR BOOTSTRAP — sapientia-cli

> Paste this as your first message after `claude --resume <session-id>` in the sapientia-cli tab.
> Model: `claude-opus-4-8` (set via `/model claude-opus-4-8` after resume).

---

## YOUR ROLE

You are the **Opus 4.8 orchestrator** for sapientia-cli. Your mission: take this monorepo from pre-release **v0.1.0** (architecture only) to a working, published **v1.0.0** — a CLI that searches and downloads books from open archives and shadow libraries.

Vision: "Democratizar el acceso al conocimiento a toda la humanidad." This is Eduardo's most personal project — building a tool for everyone what he's done manually since age 13.

v1.0.0 target: **open source adapters working E2E** (Project Gutenberg + Standard Ebooks), catalog indexing, download, local library browse. Shadow library adapters (Z-Library, LibGen) come after.

---

## STEP 1 — LOAD CONTEXT FIRST

```bash
cat .brain/_CONTEXT.md
cat graphify-out/GRAPH_REPORT.md
cat ~/Documents/Second\ Brain/02-projects/sapientia-cli/_overview.md
cat package.json
find packages/ -name "*.ts" -not -path "*/dist/*" -not -path "*/node_modules/*" | sort
```

Key facts (ground truth):
- **Current version:** v0.1.0
- **Architecture:** pnpm monorepo with 4 packages:
  - `packages/core` — schemas, config, adapter interface, normalize, rank, errors
  - `packages/cli` — Commander entry point, execute.ts, runtime.ts, output.ts
  - `packages/sources-open` — `GutenbergAdapter`, `StandardEbooksAdapter` (scaffolded)
  - `packages/sources-shadow` — stub only (Z-Library, LibGen stubs)
- **Core god nodes:** `Catalog` (11), `resolvePaths()` (7), `createRuntime()` (7), `StandardEbooksAdapter` (7), `GutenbergAdapter` (7), `configFilePath()` (6), `runCommand()` (6), `CommandRegistry` (5), `adapterContext()` (5), `emitSuccess()` (5)
- **Key architecture:** `createRuntime()` wires adapters → `CommandRegistry` routes commands → `runCommand()` executes → `emitSuccess()`/`emitError()` output
- **License:** AGPL-3.0 + Dual Commercial (FINAL)
- **Tests:** 3 test files (rank.test.ts, paths.test.ts, normalize.test.ts) — core logic tested, adapters not yet

---

## STEP 2 — ULTRAPLAN TARGET (v1.0.0)

### A. Gutenberg Adapter — Full Implementation (GutenbergAdapter)

`GutenbergAdapter` is scaffolded — implement fully:
- **Search:** Gutenberg catalog API: `https://gutenberg.org/ebooks/search/?query=TITLE&format=json`
  - Parse results into `BookResult[]` schema (title, author, year, formats[], id, source)
  - Support: `sapientia search "The Dispossessed" --source gutenberg`
- **Download:** `https://www.gutenberg.org/ebooks/{id}.epub.noimages` (EPUB preferred) or `.pdf`
  - Stream download with progress bar
  - Write to configured download directory (`~/Documents/Digital Library/` or configured path)
  - Add to local catalog on download completion
- **Format preference:** EPUB > PDF > plain text (use `rank.ts` score)
- **Rate limiting:** Gutenberg has a 1 req/sec soft limit — respect it with a delay

### B. Standard Ebooks Adapter — Full Implementation (StandardEbooksAdapter)

`StandardEbooksAdapter` is scaffolded — implement fully:
- **Search:** Standard Ebooks Atom feed: `https://standardebooks.org/feeds/opds` + search endpoint
  - OPDS protocol (Atom XML) — parse with a lightweight XML parser (e.g., `fast-xml-parser`)
  - Map to `BookResult[]` schema
- **Download:** EPUB URL from OPDS entry (Standard Ebooks EPUBs are high quality — always prefer)
  - Stream download with progress
  - Add to catalog
- **Quality bonus:** Standard Ebooks gets a quality multiplier in `rank.ts` — their EPUBs are the best available

### C. Local Catalog (Catalog god node — SQLite)

`Catalog` (11 edges) is the core abstraction — implement fully:
- SQLite database at `~/.config/sapientia/catalog.db`
- Schema: `books(id, title, author, year, format, source, path, added_at, isbn?, language?)`
- `catalog.add(book)` — insert on download
- `catalog.search(query)` — FTS5 full-text search over title + author
- `catalog.list()` — list all books with filters (author, format, source, year range)
- `sapientia library` — browse local catalog with pagination (table display)
- `sapientia add <file>` — add an existing local file to catalog (metadata from filename + optional manual input)
- Import: `sapientia library --import ~/Documents/Digital\ Library/` — scan and index Eduardo's existing 1,201 files

### D. Download Command + Progress

`sapientia download <id>`:
- Accept result ID from `sapientia search` output
- Show download progress (bytes, %, speed, ETA)
- Hash verification on completion (SHA-256 match against source-provided hash when available)
- Add to catalog automatically
- Open with system reader on completion: `--open` flag (optional)

### E. Search UX — Unified Results

`sapientia search "The Dispossessed Ursula"`:
- Query all configured sources in parallel (Promise.all)
- Rank results via `rank.ts` (source reliability + format quality + metadata completeness)
- Display unified ranked table: `| # | Title | Author | Year | Format | Source | Quality |`
- `--source gutenberg` / `--source standard-ebooks` for single-source queries
- `--format epub` to filter by format
- `sapientia search --json "query"` → JSON output for scripting

### F. Sources Command
`sapientia sources`:
- List all configured sources with: name, type (open/shadow), status (reachable/unreachable), last checked
- `sapientia sources --check` — test connectivity to all sources

### G. Config + Doctor
`sapientia config`:
- Download directory (`~/Documents/Digital Library/` as default)
- Format preference (epub/pdf/mobi)
- Language preference (es/en/any)
- Shadow library toggle (disabled by default)

`sapientia doctor`:
- Download directory exists and is writable
- SQLite catalog accessible
- Network connectivity (ping gutenberg.org, standardebooks.org)
- All configured shadow sources reachable (if enabled)

### H. Shadow Library Stubs → v1.1.0

`packages/sources-shadow` (Z-Library, LibGen) — keep stubs, mark as `experimental` in `sapientia sources`:
- Gate behind `--experimental` flag
- Add `SHADOW_SOURCES.md` disclaimer in the package
- These ship in v1.1.0 when access patterns are confirmed

### I. `sapientia library --import` — Eduardo's 1,201 Books

This is a first-run feature:
- Scan directory tree for supported formats (EPUB, PDF, MOBI, DJVU, AZW3, plain text)
- Extract metadata from filename (pattern: `Author - Title.epub`, `Title [Year].pdf`, etc.)
- Fuzzy-match against Gutenberg/Standard Ebooks for metadata enrichment (optional, `--enrich`)
- Map to Eduardo's category taxonomy (see CKIS overview — 11 top-level categories)
- Progress bar for large imports (1,201 files)

---

## STEP 3 — SPRINT ATOMIZATION RULES

**Monorepo execution order:**
1. `packages/core` changes first (schemas, adapters interface, catalog schema)
2. `packages/sources-open` adapter implementations
3. `packages/cli` command wiring
4. Integration tests last

**Rules:**
1. **pnpm workspaces:** use `pnpm --filter @sapientia/core test` not `npm test` — know which package you're in
2. **Never import between packages except through their `index.ts`** — no deep imports
3. **SQLite catalog schema is immutable once shipped** — add columns carefully, never rename
4. **`createRuntime()` is the composition root** — adapter wiring changes go here
5. **`emitSuccess()` / `emitError()` are the output layer** — never bypass them
6. **Rate limiting tasks are separate from adapter implementation tasks**

Example:
```
TASK-02 [CORE]: Implement Catalog SQLite schema + CRUD (packages/core)
  Files: packages/core/src/catalog/catalog.ts (new), packages/core/src/catalog/schema.sql (new),
         packages/core/src/catalog/catalog.test.ts
  Done: catalog.add(), catalog.search(), catalog.list() pass unit tests;
        database file created at configured path on first call
  Depends: TASK-01 (BookResult schema finalized)
```

---

## STEP 4 — WORKER ORCHESTRATION PROTOCOL

**Worker briefing template:**
```
You are a Sonnet execution agent for sapientia-cli — a pnpm monorepo ebook library tool.

MONOREPO FACTS:
- 4 packages: core, cli, sources-open, sources-shadow
- Always use `pnpm --filter <package> <command>` to scope commands
- Never deep-import across packages — only import from package index.ts
- createRuntime() in packages/cli/src/runtime.ts is the composition root — adapter wiring happens there
- emitSuccess() / emitError() in packages/cli/src/render/output.ts — all output through these
- Catalog (11 edges) is in packages/core — SQLite via better-sqlite3 (synchronous)
- EPUB is always the preferred format — rank.ts already encodes this

TASK: [exact task spec with package scope]
CONTEXT: [relevant god nodes]
CONSTRAINTS:
- Read before edit
- Run pnpm build from root to verify all packages build together
- pnpm test from root to verify all packages pass
- Do NOT add shadow library adapters unless the task explicitly scopes sources-shadow
- Do NOT commit

Report back: files changed + exact pnpm commands to verify done criterion.
```

---

## STEP 5 — AUDIT PROTOCOL

```bash
# From monorepo root
pnpm build
pnpm test
npx tsc -p tsconfig.json --noEmit 2>/dev/null || pnpm --filter '*' exec tsc --noEmit
npm audit --audit-level=moderate
```

**Audit checklist:**
- [ ] `sapientia doctor` passes: SQLite writable, network reachable, download dir exists
- [ ] Gutenberg search returns results for "The Dispossessed" (live network test or recorded fixture)
- [ ] Standard Ebooks OPDS parsing handles malformed XML gracefully (try/catch + emitError)
- [ ] Catalog FTS5 search handles: empty query, special chars, accented chars (Spanish/French titles)
- [ ] Download: incomplete file cleaned up on abort/error (no partial EPUBs in library)
- [ ] `--json` flag valid JSON on: search, library, sources, doctor
- [ ] `sapientia library --import` handles: unrecognized formats (skip), permission errors (skip + warn), duplicate files (skip + log)
- [ ] Rate limiting: Gutenberg adapter has ≥1s delay between requests
- [ ] No shadow library code reachable without `--experimental` flag

---

## STEP 6 — COMPLETION CRITERIA + COMMIT

- [ ] `pnpm build` → all 4 packages build successfully
- [ ] `pnpm test` → all tests pass (rank, paths, normalize + new adapter + catalog tests)
- [ ] `npx tsc --noEmit` → 0 type errors across all packages
- [ ] `npm audit` → 0 moderate/high
- [ ] `sapientia doctor` → all checks pass
- [ ] `sapientia search "frankenstein"` → returns Gutenberg + Standard Ebooks results
- [ ] `sapientia download <id>` → EPUB lands in configured download directory + catalog entry created
- [ ] `npm publish --dry-run` (from packages/cli) → exits cleanly

```bash
git add [specific files]
git commit -m "feat: sapientia-cli v1.0.0 — Gutenberg + Standard Ebooks, local catalog, download pipeline"
git tag v1.0.0
git push origin main --tags
```

---

## STEP 7 — PERSONAL GUIDE (after v1.0.0 is pushed)

This step runs **only after Step 6 is fully complete** — v1.0.0 tagged, pushed, and npm published.

Write Eduardo's personal reference guide to:
`~/Documents/Second Brain/02-projects/sapientia-cli/personal-guide.md`

**What this IS:** Eduardo's personal manual — how he uses Sapientia to find and download books, manage his 1,201-book digital library, and continue the habit he's had since age 13. Written in plain language with his real library structure and real search examples.
**What this is NOT:** developer docs or a README for strangers.

### Guide structure:

```
---
type: guide
subtype: personal-tool-reference
project: sapientia-cli
created: <today>
modified: <today>
tags: [guide, cli, personal-reference, sapientia, libros, biblioteca, ebooks, conocimiento]
related:
  - "[[02-projects/sapientia-cli/_overview]]"
---

# sapientia — Mi Guía Personal
```

**Section 1 — ¿Qué es esto y por qué existe?**
Plain-language origin story: Eduardo ha descargado libros de internet desde los 13 años. Tiene 1,201 archivos en `~/Documents/Digital Library/`. Sapientia automatiza ese pipeline manual: antes buscaba en Gutenberg/LibGen/etc. manualmente, descargaba, movía al folder correcto. Ahora es un comando. La visión: "democratizar el acceso al conocimiento a toda la humanidad."

**Section 2 — Mi biblioteca digital actual**
La estructura real de `~/Documents/Digital Library/`: las 11 categorías principales (Ciencias, Filosofía, Historia, Idiomas, Literatura, No-Ficción, Otros, Pensamiento Político, Psicología, Religión, Tecnología). Cómo Sapientia indexa esta estructura. Cómo ver el catálogo completo: `sapientia library`.

**Section 3 — Todos los comandos con ejemplos reales**
Every command with Eduardo's actual usage:
- `sapientia search "The Dispossessed Ursula Le Guin"` — busca en todas las fuentes en paralelo. Cómo leer los resultados (Quality score, formato, fuente).
- `sapientia search --source standard-ebooks "Nietzsche"` — busca en una fuente específica
- `sapientia search --format epub "Dostoevsky"` — filtrar por formato
- `sapientia download <id>` — descargar el resultado seleccionado. Qué pasa: descarga, verifica hash, agrega al catálogo.
- `sapientia library` — navegar el catálogo local. Cómo filtrar (`--author`, `--format`, `--category`)
- `sapientia library --import ~/Documents/Digital\ Library/` — el primer setup: indexar los 1,201 libros existentes
- `sapientia add <archivo>` — agregar un ebook que ya tengo al catálogo manualmente
- `sapientia sources` — ver qué fuentes están configuradas y su estado (accesibles/no)
- `sapientia config` — el directorio de descarga, formato preferido, idioma
- `sapientia doctor` — verificar que todo funciona

**Section 4 — Mis fuentes de libros y cómo las uso**
Explicado en simple, sin jerga técnica:
- **Project Gutenberg** — dominio público, clásicos de la literatura mundial. Gratis, confiable, siempre disponible.
- **Standard Ebooks** — lo mismo que Gutenberg pero formateados mucho mejor. Para los clásicos que Eduardo lee en e-reader, siempre prefiere Standard Ebooks.
- **Open Library (Internet Archive)** — millones de títulos, préstamo digital. Útil para libros más modernos que ya no tienen derechos de autor.
- **Fuentes shadow** (cuando las active): para acceso a libros que no están en dominio público. El `--experimental` flag las habilita.

**Section 5 — El primer setup: importar los 1,201 libros**
Paso a paso de cómo Eduardo usa `sapientia library --import` por primera vez:
1. `sapientia library --import ~/Documents/Digital\ Library/` → escanea y crea el catálogo SQLite
2. Cuánto tiempo tarda (estimado), qué hace con cada archivo, qué hace si no puede leer el metadata
3. Después del import: `sapientia library` muestra todos los libros navegables
4. `sapientia library --import --enrich` — el flag opcional que busca metadata faltante en Gutenberg/Standard Ebooks

**Section 6 — Integración con CKIS (el futuro)**
Cómo Sapientia conecta con el flujo de conocimiento más amplio:
- Sapientia es la capa de ADQUISICIÓN. Procesar los libros (extraer insights, crear notas permanentes) es el siguiente paso — la "CKIS Book Processing Pipeline" que Eduardo planea para después de v1.0.0.
- Por ahora: los libros están en el catálogo → Eduardo los busca con `sapientia search` → los lee → procesa insights manualmente en CKIS.
- La conexión futura: `sapientia export <id> --to-ckis` generaría una nota en Obsidian lista para procesar.

**Section 7 — Lo que aprendí**
- Por qué EPUB > PDF para leer: texto reflow, fuente ajustable, sin scroll horizontal
- Standard Ebooks tiene una calidad de formateo que Gutenberg no alcanza — cuando existe en Standard Ebooks, descarga de ahí
- El hash verification al descargar: cómo sé que el archivo no está corrupto
- Por qué el catálogo es SQLite y no JSON: FTS5 para búsqueda en texto completo de 1,200 libros

**Section 8 — Referencia rápida**
Cheat sheet de todos los comandos. Incluir la búsqueda favorita de Eduardo (filosofía en español, libros técnicos en inglés).

### After writing the guide:
1. Write the file to the exact CKIS path above
2. Add `[[personal-guide]]` wikilink to `02-projects/sapientia-cli/_overview.md`
3. Update `_overview.md`'s `modified:` to today

---

## CKIS INTEGRATION REMINDER

- Eduardo's existing 1,201-book library is in `~/Documents/Digital Library/` — the `--import` command is high-value
- `renderNote()` equivalent may be needed later for CKIS book processing pipeline (out of scope for v1.0.0)
- `.brain/decisions/` — ADR for: OPDS vs custom search API, SQLite vs JSON catalog, shadow library gating
- The CKIS overview describes Eduardo's full category taxonomy — use it as the default catalog taxonomy

Begin by executing Step 1 (Load Context) now.
