import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { isMorseChar } from "../../morse/alphabet.ts";
import { bookSource, SAMPLE_WORDS } from "./book.ts";
import { prepareText, splitWords, stripGutenberg, truncateAtSentence } from "./prepare.ts";

const RAW = `The Project Gutenberg eBook of Example
Release date: today

*** START OF THE PROJECT GUTENBERG EBOOK EXAMPLE ***

CHAPTER I.

“Don’t do that!” said Alice—quite crossly; she was (as usual) right: the café was closed…
He paid £5 for it, 3.5 per cent. "Why?" (Nobody knew.) <AR> = + 1 + 1

*** END OF THE PROJECT GUTENBERG EBOOK EXAMPLE ***
Licence text here.`;

describe("prepareText", () => {
  it("keeps only the book", () => {
    const body = stripGutenberg(RAW);
    expect(body).not.toContain("Release date");
    expect(body).not.toContain("Licence");
    expect(body).toContain("CHAPTER I.");
  });

  it("turns prose into sendable words", () => {
    const words = prepareText(RAW);
    expect(words.join(" ")).toBe(
      "CHAPTER I. DONT DO THAT. SAID ALICE QUITE CROSSLY, SHE WAS AS USUAL RIGHT, THE CAFE " +
        "WAS CLOSED. HE PAID 5 FOR IT, 3.5 PER CENT. WHY? NOBODY KNEW. AR 1 1",
    );
    for (const w of words) expect([...w].every(isMorseChar), w).toBe(true);
  });

  it("never emits prosign symbols", () => {
    for (const w of prepareText("a = b + c (d) <e> * f")) expect(w).not.toMatch(/[=+(<]/);
  });

  it("truncates at a sentence end", () => {
    const words = splitWords("ONE TWO. THREE FOUR FIVE? SIX SEVEN EIGHT NINE TEN.");
    expect(truncateAtSentence(words, 7)).toEqual(["ONE", "TWO.", "THREE", "FOUR", "FIVE?"]);
    expect(truncateAtSentence(words, 20)).toEqual(words);
  });
});

describe("bookSource", () => {
  it("reads sequentially from a position and wraps", () => {
    const words = splitWords("A B. C D? E");
    const src = bookSource(words, 3);
    expect([src.next(), src.next(), src.next(), src.next()]).toEqual(["D?", "E", "A", "B."]);
    expect(src.position()).toBe(2);
    expect(src.size()).toBe(5);
  });

  it("is at a boundary after a sentence end", () => {
    const src = bookSource(splitWords("A B. C D? E"));
    const flags: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      src.next();
      flags.push(src.atBoundary!());
    }
    expect(flags).toEqual([false, true, false, true, false]);
  });

  it("ships a usable sample", () => {
    expect(SAMPLE_WORDS.length).toBeGreaterThan(50);
    expect(SAMPLE_WORDS).toContain("DAISY");
    expect(SAMPLE_WORDS.join(" ")).toContain("RAN CLOSE BY HER.");
  });
});
