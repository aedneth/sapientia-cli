import { describe, expect, it } from "vitest";
import type { BookMetadata } from "../schemas/book.js";
import { rankResults } from "./rank.js";

const weights = {
  sourceReliability: 0.3,
  formatQuality: 0.3,
  metadataCompleteness: 0.2,
  availability: 0.2,
};

function book(over: Partial<BookMetadata>): BookMetadata {
  return {
    id: over.id ?? "x:1",
    sourceId: over.sourceId ?? "x",
    sourceRef: "1",
    title: "T",
    authors: [],
    formats: [],
    subjects: [],
    candidates: [],
    ...over,
  };
}

describe("rankResults", () => {
  it("ranks EPUB above TXT for the same source", () => {
    const ranked = rankResults(
      [
        book({ id: "a:1", sourceId: "a", formats: ["txt"] }),
        book({ id: "a:2", sourceId: "a", formats: ["epub"] }),
      ],
      weights,
      () => 0.9,
    );
    expect(ranked[0]!.id).toBe("a:2");
  });

  it("is deterministic on ties (stable by source then id)", () => {
    const input = [
      book({ id: "b:2", sourceId: "b" }),
      book({ id: "a:1", sourceId: "a" }),
    ];
    const first = rankResults(input, weights, () => 0.9).map((b) => b.id);
    const second = rankResults([...input].reverse(), weights, () => 0.9).map((b) => b.id);
    expect(first).toEqual(second);
    expect(first[0]).toBe("a:1");
  });
});
