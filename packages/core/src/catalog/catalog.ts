import Database from "better-sqlite3";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { MIGRATIONS } from "./schema.js";

export interface CatalogBook {
  id?: number;
  title: string;
  subtitle?: string;
  authors: string[];
  year?: number;
  language?: string;
  format?: string;
  filePath?: string;
  fileHashSha256?: string;
  fileSize?: number;
  sourceId?: string;
  sourceRef?: string;
  subjects?: string[];
  categoryPath?: string;
}

/** SQLite-backed local catalog. Synchronous (better-sqlite3) for speed + simplicity. */
export class Catalog {
  private readonly db: Database.Database;

  private constructor(db: Database.Database) {
    this.db = db;
  }

  static async open(dbPath: string): Promise<Catalog> {
    await mkdir(dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    const cat = new Catalog(db);
    cat.migrate();
    return cat;
  }

  private migrate(): void {
    this.db.exec("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)");
    const row = this.db.prepare("SELECT version FROM schema_version").get() as
      | { version: number }
      | undefined;
    let current = row?.version ?? 0;
    if (!row) this.db.prepare("INSERT INTO schema_version (version) VALUES (0)").run();
    for (let i = current; i < MIGRATIONS.length; i++) {
      this.db.exec(MIGRATIONS[i]!);
      current = i + 1;
    }
    this.db.prepare("UPDATE schema_version SET version = ?").run(current);
  }

  /** Resolve (creating as needed) a hierarchical category from a "/"-joined path. */
  private upsertCategory(path: string): number | undefined {
    if (!path) return undefined;
    const parts = path.split("/").filter(Boolean);
    let parentId: number | null = null;
    let accumulated = "";
    for (const name of parts) {
      accumulated = accumulated ? `${accumulated}/${name}` : name;
      const existing = this.db
        .prepare("SELECT id FROM categories WHERE path = ?")
        .get(accumulated) as { id: number } | undefined;
      if (existing) {
        parentId = existing.id;
        continue;
      }
      const res = this.db
        .prepare("INSERT INTO categories (parent_id, name, path) VALUES (?, ?, ?)")
        .run(parentId, name, accumulated);
      parentId = Number(res.lastInsertRowid);
    }
    return parentId ?? undefined;
  }

  /** Insert a book + its relations + FTS row. Returns the new book id. */
  addBook(book: CatalogBook): number {
    const insert = this.db.transaction((b: CatalogBook): number => {
      const res = this.db
        .prepare(
          `INSERT INTO books (title, subtitle, year, language, format, file_path,
             file_hash_sha256, file_size, source_id, source_ref)
           VALUES (@title, @subtitle, @year, @language, @format, @filePath,
             @fileHashSha256, @fileSize, @sourceId, @sourceRef)`,
        )
        .run({
          title: b.title,
          subtitle: b.subtitle ?? null,
          year: b.year ?? null,
          language: b.language ?? null,
          format: b.format ?? null,
          filePath: b.filePath ?? null,
          fileHashSha256: b.fileHashSha256 ?? null,
          fileSize: b.fileSize ?? null,
          sourceId: b.sourceId ?? null,
          sourceRef: b.sourceRef ?? null,
        });
      const bookId = Number(res.lastInsertRowid);

      for (const name of b.authors) {
        this.db.prepare("INSERT OR IGNORE INTO authors (name) VALUES (?)").run(name);
        const a = this.db.prepare("SELECT id FROM authors WHERE name = ?").get(name) as {
          id: number;
        };
        this.db
          .prepare("INSERT OR IGNORE INTO book_authors (book_id, author_id) VALUES (?, ?)")
          .run(bookId, a.id);
      }
      for (const name of b.subjects ?? []) {
        this.db.prepare("INSERT OR IGNORE INTO subjects (name) VALUES (?)").run(name);
        const s = this.db.prepare("SELECT id FROM subjects WHERE name = ?").get(name) as {
          id: number;
        };
        this.db
          .prepare("INSERT OR IGNORE INTO book_subjects (book_id, subject_id) VALUES (?, ?)")
          .run(bookId, s.id);
      }
      if (b.categoryPath) {
        const catId = this.upsertCategory(b.categoryPath);
        if (catId)
          this.db
            .prepare("INSERT OR IGNORE INTO book_categories (book_id, category_id) VALUES (?, ?)")
            .run(bookId, catId);
      }

      this.db
        .prepare("INSERT INTO books_fts (rowid, title, authors, subjects) VALUES (?, ?, ?, ?)")
        .run(bookId, b.title, b.authors.join(" "), (b.subjects ?? []).join(" "));
      return bookId;
    });
    return insert(book);
  }

  /** True if a file with this hash is already catalogued. */
  hasHash(sha256: string): boolean {
    return !!this.db
      .prepare("SELECT 1 FROM books WHERE file_hash_sha256 = ? LIMIT 1")
      .get(sha256);
  }

  /** Full-text search across title/author/subjects. */
  search(query: string, limit = 25): CatalogBook[] {
    const rows = this.db
      .prepare(
        `SELECT b.* FROM books_fts f JOIN books b ON b.id = f.rowid
         WHERE books_fts MATCH ? ORDER BY rank LIMIT ?`,
      )
      .all(query, limit) as Array<Record<string, unknown>>;
    return rows.map(this.rowToBook);
  }

  list(limit = 50): CatalogBook[] {
    const rows = this.db
      .prepare("SELECT * FROM books ORDER BY added_at DESC LIMIT ?")
      .all(limit) as Array<Record<string, unknown>>;
    return rows.map(this.rowToBook);
  }

  count(): number {
    return (this.db.prepare("SELECT COUNT(*) AS n FROM books").get() as { n: number }).n;
  }

  private rowToBook = (r: Record<string, unknown>): CatalogBook => ({
    id: r.id as number,
    title: r.title as string,
    subtitle: (r.subtitle as string) ?? undefined,
    authors: [],
    year: (r.year as number) ?? undefined,
    language: (r.language as string) ?? undefined,
    format: (r.format as string) ?? undefined,
    filePath: (r.file_path as string) ?? undefined,
    fileHashSha256: (r.file_hash_sha256 as string) ?? undefined,
    fileSize: (r.file_size as number) ?? undefined,
    sourceId: (r.source_id as string) ?? undefined,
    sourceRef: (r.source_ref as string) ?? undefined,
  });

  close(): void {
    this.db.close();
  }
}
