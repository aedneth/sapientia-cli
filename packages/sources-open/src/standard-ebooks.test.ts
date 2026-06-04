import { describe, expect, it } from "vitest";
import { StandardEbooksAdapter } from "./standard-ebooks.js";

// Trimmed but structurally faithful sample of the public catalog listing markup.
const LISTING = `
<ol class="ebooks-list">
  <li class="ebook">
    <div class="thumbnail-container" aria-hidden="true">
      <a href="/ebooks/mary-shelley/frankenstein" tabindex="-1" property="schema:url"><img/></a>
    </div>
    <p><a href="/ebooks/mary-shelley/frankenstein" property="schema:url"><span property="schema:name">Frankenstein</span></a></p>
    <p class="author" typeof="schema:Person" property="schema:author" resource="/ebooks/mary-shelley"><a href="https://standardebooks.org/ebooks/mary-shelley" property="schema:url"><span property="schema:name">Mary Shelley</span></a></p>
  </li>
  <li class="ebook">
    <div class="thumbnail-container" aria-hidden="true">
      <a href="/ebooks/friedrich-nietzsche/beyond-good-and-evil/helen-zimmern" tabindex="-1" property="schema:url"><img/></a>
    </div>
    <p><a href="/ebooks/friedrich-nietzsche/beyond-good-and-evil/helen-zimmern" property="schema:url"><span property="schema:name">Beyond Good &amp; Evil</span></a></p>
    <p class="author" typeof="schema:Person" property="schema:author" resource="/ebooks/friedrich-nietzsche"><a href="https://standardebooks.org/ebooks/friedrich-nietzsche" property="schema:url"><span property="schema:name">Friedrich Nietzsche</span></a></p>
  </li>
</ol>`;

describe("StandardEbooksAdapter.parseListing", () => {
  const adapter = new StandardEbooksAdapter();
  const results = adapter.parseListing(LISTING);

  it("extracts one result per book entry", () => {
    expect(results).toHaveLength(2);
  });

  it("parses a two-segment book ref, title, author and epub url", () => {
    const fr = results[0]!;
    expect(fr.sourceRef).toBe("mary-shelley/frankenstein");
    expect(fr.id).toBe("standard-ebooks:mary-shelley/frankenstein");
    expect(fr.title).toBe("Frankenstein");
    expect(fr.authors).toEqual(["Mary Shelley"]);
    expect(fr.candidates[0]!.url).toBe(
      "https://standardebooks.org/ebooks/mary-shelley/frankenstein/downloads/mary-shelley_frankenstein.epub?source=download",
    );
  });

  it("handles a translated (three-segment) ref and decodes entities", () => {
    const be = results[1]!;
    expect(be.sourceRef).toBe("friedrich-nietzsche/beyond-good-and-evil/helen-zimmern");
    expect(be.title).toBe("Beyond Good & Evil");
    expect(be.candidates[0]!.url).toBe(
      "https://standardebooks.org/ebooks/friedrich-nietzsche/beyond-good-and-evil/helen-zimmern/downloads/friedrich-nietzsche_beyond-good-and-evil_helen-zimmern.epub?source=download",
    );
  });

  it("does not mistake the single-segment author link for a book", () => {
    expect(results.every((r) => r.sourceRef.includes("/"))).toBe(true);
  });
});
