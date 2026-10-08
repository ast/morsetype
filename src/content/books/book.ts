import type { WordSource } from "../source.ts";
import { prepareText } from "./prepare.ts";

/** Used when no book text is available (tests, or a book that failed to load). */
export const SAMPLE_WORDS: readonly string[] = prepareText(
  `Alice was beginning to get very tired of sitting by her sister on the bank, and of having
  nothing to do: once or twice she had peeped into the book her sister was reading, but it had
  no pictures or conversations in it, "and what is the use of a book," thought Alice "without
  pictures or conversations?" So she was considering in her own mind (as well as she could, for
  the hot day made her feel very sleepy and stupid), whether the pleasure of making a
  daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a
  White Rabbit with pink eyes ran close by her.`,
);

export interface BookSource extends WordSource {
  /** Index of the next word to send. */
  position(): number;
  /** Number of words in the book. */
  size(): number;
}

/** Reads a book from `start`, word by word, wrapping around at the end. */
export function bookSource(words: readonly string[], start = 0): BookSource {
  const n = words.length;
  let i = n === 0 ? 0 : ((Math.floor(start) % n) + n) % n;
  let last = "";
  return {
    next() {
      if (n === 0) return "E";
      last = words[i]!;
      i = (i + 1) % n;
      return last;
    },
    atBoundary: () => /[.?]$/.test(last),
    position: () => i,
    size: () => n,
  };
}
