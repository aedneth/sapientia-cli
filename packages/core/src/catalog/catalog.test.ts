import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Catalog } from "./catalog.js";

describe("Catalog", () => {
  let dir: string;
  let catalog: Catalog;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "sapientia-cat-"));
    catalog = await Catalog.open(join(dir, "catalog.db"));
  });
  afterEach(async () => {
    catalog.close();
    await rm(dir, { recursive: true, force: true });
  });

  it("round-trips a book with its authors and is counted", () => {
    catalog.addBook({
      title: "The Dispossessed",
      authors: ["Ursula K. Le Guin"],
      format: "epub",
      filePath: "/x/dispossessed.epub",
      fileHashSha256: "abc123",
      categoryPath: "Literatura/Science Fiction",
    });
    expect(catalog.count()).toBe(1);
    const [book] = catalog.list();
    expect(book!.title).toBe("The Dispossessed");
    expect(book!.authors).toEqual(["Ursula K. Le Guin"]);
  });

  it("preserves multiple authors via group_concat", () => {
    catalog.addBook({
      title: "Anti-Oedipus",
      authors: ["Gilles Deleuze", "Félix Guattari"],
      filePath: "/x/anti-oedipus.epub",
      fileHashSha256: "def456",
    });
    expect(catalog.list()[0]!.authors).toEqual(["Gilles Deleuze", "Félix Guattari"]);
  });

  it("detects an existing file by hash", () => {
    catalog.addBook({ title: "X", authors: [], filePath: "/x/x.epub", fileHashSha256: "hash-1" });
    expect(catalog.hasHash("hash-1")).toBe(true);
    expect(catalog.hasHash("missing")).toBe(false);
  });

  it("full-text searches title and tolerates operator characters", () => {
    catalog.addBook({ title: "Beyond Good and Evil", authors: ["Nietzsche"], fileHashSha256: "h2" });
    expect(catalog.search("evil").map((b) => b.title)).toContain("Beyond Good and Evil");
    expect(() => catalog.search("good (and) evil:")).not.toThrow();
  });
});
