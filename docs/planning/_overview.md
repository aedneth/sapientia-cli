---
type: project-overview
project: sapientia-cli
status: planning
created: 2026-05-11
modified: 2026-05-11
tags: [project, open-source, cli, knowledge, books, library, ebooks, typescript, nodejs]
related:
  - "[[03-knowledge/maps-of-content/Public-Repos-Master-Strategy]]"
  - "[[02-projects/magnus-cli/_overview]]"
  - "[[02-projects/korvex/_overview]]"
---

# Sapientia CLI — Project Overview

CLI tool to search, download, and manage ebooks across open archives and shadow libraries. Born from Eduardo's practice since age 13 of collecting books from the internet. His existing Digital Library (`~/Documents/Digital Library/`) has 1,201 files — Sapientia makes the same pipeline available to everyone.

Vision: "Democratizar el acceso al conocimiento a toda la humanidad."

━━━

## Core Workflow

```
sapientia search "The Dispossessed Ursula Le Guin"
  → query all configured sources in parallel
  → rank by: source reliability, format quality, availability
  → display unified results with metadata
  → user selects → download → add to local catalog
```

━━━

## CLI Commands

```bash
sapientia search "The Dispossessed Ursula"           # Search all indexed sources
sapientia search --category philosophy "Nietzsche"   # Category-filtered search
sapientia download <id>                               # Download selected result
sapientia library                                     # Browse local library catalog
sapientia add <file>                                  # Add existing file to catalog
sapientia sources                                     # List configured sources + status
sapientia config                                      # Download path, sources, format preference
sapientia doctor                                      # Verify source connectivity, download dir
```

━━━

## Sources

| Source | Type | Notes |
|---|---|---|
| Project Gutenberg | Open archive | Public domain, primary |
| Standard Ebooks | Open archive | Public domain, quality-formatted EPUB |
| Open Library (Internet Archive) | Open archive | Millions of titles |
| Archive.org | Open archive | Massive public domain collection |
| Z-Library API | Shadow library | When available |
| Library Genesis | Shadow library | LibGen — vast catalog |
| Sci-Hub alternatives | Academic | Papers and journals |
| Bibliomania / ManyBooks | Open archive | Secondary sources |

━━━

## Technical Architecture

| Layer | Choice | Notes |
|---|---|---|
| Language | Node.js 20 + TypeScript | Consistent with other tools |
| Source adapters | One adapter per source | Pluggable interface |
| Format support | EPUB, PDF, MOBI, DJVU, AZW3, plain text | EPUB primary |
| Metadata normalization | Unified schema across all sources | Author, title, year, ISBN, language |
| File integrity | Hash verification on download | Detect corrupted/incomplete files |
| Local catalog | SQLite index of local library | Fast search without re-scanning |

━━━

## Quality Ranking Factors

1. Source reliability score (uptime, availability history)
2. Format quality: EPUB > PDF > MOBI > DJVU > plain text
3. File integrity verification (hash match)
4. Availability (seeders for torrent-backed sources)
5. Metadata completeness

━━━

## Eduardo's Digital Library — Category System

Becomes the default taxonomy for Sapientia. `sapientia catalog` imports and indexes existing 1,201 files.

```
Ciencias & Divulgación/          Filosofía/ (12 subcategories)
Historia & Arte/                 Idiomas/ (English self-academy)
Literatura & Ficción/ (15 sub)   No-Ficción & Ensayos/
Otros/ (Comics, Revistas)        Pensamiento Político & Social/ (12 sub)
Psicología & Comportamiento/     Religión & Teología/
Tecnología & Hacking/ (7 sub)
```

━━━

## Future Integration: CKIS Processing

Eduardo's long-term goal: run all 1,201 books (and future acquisitions) through the CKIS second brain — extract insights, create permanent notes, build knowledge graph. Sapientia is the acquisition layer; CKIS processing is a separate massive undertaking tracked independently.

━━━

## Build Complexity

**Medium-high.** Multiple source adapters with different APIs/scraping strategies, format handling, metadata normalization across sources. No real-time streaming protocol (simpler than StreamNet) but breadth of sources adds surface area.

━━━

## License & Audience

- **License:** AGPL-3.0 + Dual Commercial License. Eduardo's intent: free forever for users; commercial rights retained for sustainability.
- **Target:** Researchers, autodidacts, archivists, librarians, knowledge workers, students — anyone building a personal digital library
- **Personal motivation:** "Tener una biblioteca de cientos de millones de libros para leer durante toda mi vida." — dream since age 13.
