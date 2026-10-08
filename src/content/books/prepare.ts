import { isMorseChar } from "../../morse/alphabet.ts";

const START = /^\*\*\* ?START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$/m;
const END = /^\*\*\* ?END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*$/m;

/** The book itself, without Project Gutenberg's header and licence. */
export function stripGutenberg(raw: string): string {
  let text = raw;
  const start = START.exec(text);
  if (start) text = text.slice(start.index + start[0].length);
  const end = END.exec(text);
  if (end) text = text.slice(0, end.index);
  return text;
}

/**
 * Turn prose into sendable words: ASCII-fold accents, drop quotes and apostrophes
 * (don't → DONT), split on dashes and brackets, reduce punctuation to the four Morse marks
 * (! → . and ; : → ,), uppercase, and keep only characters that have a code. Prosign symbols
 * in the text (= + ( <) are removed so they can't be sent by accident.
 */
export function prepareText(raw: string): string[] {
  const text = stripGutenberg(raw)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[‘’“”'"`´]/g, "")
    .replace(/[!]/g, ".")
    .replace(/[;:]/g, ",")
    .replace(/\.{2,}|…/g, ".")
    .replace(/[-‐-―_()[\]{}<>+=*&#@$%^|~\\]/g, " ")
    .toUpperCase();

  const out: string[] = [];
  for (const token of text.split(/\s+/)) {
    const w = [...token].filter(isMorseChar).join("").replace(/([.,?])[.,?]+/g, "$1");
    if (w === "") continue;
    const prev = out.at(-1);
    // Punctuation left on its own (after a removed quote or dash) joins the previous word.
    if (/^[.,?]+$/.test(w) && prev !== undefined && !/[.,?]$/.test(prev)) {
      out[out.length - 1] = prev + w[0];
    } else if (!/^[.,?]+$/.test(w)) {
      out.push(w);
    }
  }
  return out;
}

/** Cut to at most `max` words, at the last sentence end before the limit. */
export function truncateAtSentence(words: readonly string[], max: number): string[] {
  if (words.length <= max) return [...words];
  for (let i = max - 1; i > max / 2; i--) {
    if (/[.?]$/.test(words[i]!)) return words.slice(0, i + 1);
  }
  return words.slice(0, max);
}

/** Split a prepared text file back into words. */
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w !== "");
}
