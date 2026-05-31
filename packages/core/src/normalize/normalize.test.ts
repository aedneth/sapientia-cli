import { describe, expect, it } from "vitest";
import { makeResultId, normalizeFormat, normalizeIsbn, normalizeLanguage, parseResultId } from "./normalize.js";

describe("normalize", () => {
  it("maps mime/extension fragments to formats", () => {
    expect(normalizeFormat("application/epub+zip")).toBe("epub");
    expect(normalizeFormat("text/plain; charset=utf-8")).toBe("txt");
    expect(normalizeFormat(undefined)).toBe("unknown");
  });

  it("classifies ISBNs by length", () => {
    expect(normalizeIsbn("978-0-306-40615-7")).toEqual({ isbn13: "9780306406157" });
    expect(normalizeIsbn("0-306-40615-2")).toEqual({ isbn10: "0306406152" });
  });

  it("normalizes languages to ISO 639-1", () => {
    expect(normalizeLanguage("English")).toBe("en");
    expect(normalizeLanguage("es")).toBe("es");
  });

  it("round-trips result ids", () => {
    const id = makeResultId("gutenberg", "1342");
    expect(parseResultId(id)).toEqual({ sourceId: "gutenberg", sourceRef: "1342" });
  });
});
