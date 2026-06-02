/** Ordered migrations. Each runs once; `schema_version` tracks the applied count. */
export const MIGRATIONS: string[] = [
  // 001 — base catalog
  `
  CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    year INTEGER,
    publisher TEXT,
    isbn10 TEXT,
    isbn13 TEXT,
    language TEXT,
    format TEXT,
    file_path TEXT UNIQUE,
    file_hash_sha256 TEXT,
    file_size INTEGER,
    source_id TEXT,
    source_ref TEXT,
    added_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
  CREATE TABLE book_authors (
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
  );
  CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE
  );
  CREATE TABLE book_categories (
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, category_id)
  );
  CREATE TABLE subjects (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
  CREATE TABLE book_subjects (
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, subject_id)
  );
  CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE downloads (
    id INTEGER PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
    source_id TEXT,
    url TEXT,
    status TEXT NOT NULL,
    sha256 TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE VIRTUAL TABLE books_fts USING fts5(
    title, authors, subjects, content=''
  );
  `,
];
