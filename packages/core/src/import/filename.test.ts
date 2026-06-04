import { describe, expect, it } from "vitest";
import {
  categoryFromPath,
  isSupportedFile,
  parseBookFilename,
} from "./filename.js";

describe("isSupportedFile", () => {
  it("accepts known ebook extensions and rejects others", () => {
    expect(isSupportedFile("book.epub")).toBe(true);
    expect(isSupportedFile("BOOK.PDF")).toBe(true);
    expect(isSupportedFile("notes.txt")).toBe(true);
    expect(isSupportedFile("cover.jpg")).toBe(false);
    expect(isSupportedFile("README")).toBe(false);
  });
});

describe("parseBookFilename", () => {
  it("splits 'Author - Title' and sets format from extension", () => {
    const p = parseBookFilename("Ursula K. Le Guin - The Dispossessed.epub");
    expect(p.authors).toEqual(["Ursula K. Le Guin"]);
    expect(p.title).toBe("The Dispossessed");
    expect(p.format).toBe("epub");
  });

  it("extracts a parenthesized or bracketed year", () => {
    expect(parseBookFilename("Dostoevsky - The Idiot (1869).pdf")).toMatchObject({
      authors: ["Dostoevsky"],
      title: "The Idiot",
      year: 1869,
      format: "pdf",
    });
    expect(parseBookFilename("Sapiens [2011].epub").year).toBe(2011);
  });

  it("splits multiple authors on & / and / ;", () => {
    expect(parseBookFilename("Deleuze & Guattari - Anti-Oedipus.epub").authors).toEqual([
      "Deleuze",
      "Guattari",
    ]);
  });

  it("treats a bare title with no separator as title-only", () => {
    const p = parseBookFilename("Meditations.mobi");
    expect(p.title).toBe("Meditations");
    expect(p.authors).toEqual([]);
    expect(p.format).toBe("mobi");
  });

  it("converts underscores to spaces", () => {
    expect(parseBookFilename("Carl_Sagan_-_Cosmos.epub")).toMatchObject({
      authors: ["Carl Sagan"],
      title: "Cosmos",
    });
  });
});

describe("categoryFromPath", () => {
  const root = "/home/e/Digital Library";
  it("maps nested directories to a category path", () => {
    expect(categoryFromPath(root, `${root}/Filosofía/Ética/book.epub`)).toBe("Filosofía/Ética");
  });
  it("returns undefined for files directly in the root", () => {
    expect(categoryFromPath(root, `${root}/book.epub`)).toBeUndefined();
  });
});
