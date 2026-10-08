import { bookSource, SAMPLE_WORDS } from "./books/book.ts";
import { DEFAULT_BOOK } from "./books/catalog.ts";
import { splitWords } from "./books/prepare.ts";
import { callsignSource, hamSource } from "./ham.ts";
import { type ContestKind, contestSource } from "./contest.ts";
import { kochSource } from "./koch.ts";
import { numbersSource } from "./numbers.ts";
import { qsoSource } from "./qso.ts";
import type { Rng, WordSource } from "./source.ts";
import { englishSource } from "./words.ts";

export type SourceKind =
  | "koch"
  | "english"
  | "ham"
  | "callsigns"
  | "numbers"
  | "qso"
  | "contest"
  | "book";
export const SOURCE_KINDS: readonly SourceKind[] = [
  "koch",
  "english",
  "ham",
  "callsigns",
  "numbers",
  "qso",
  "contest",
  "book",
];

export interface SourceOptions {
  kind: SourceKind;
  kochLesson: number;
  groupSize: number;
  /** Your callsign; when set, QSO and contest sources only send the other station. */
  myCall?: string;
  contest?: ContestKind;
  book?: string;
  /** Prepared text of `book` (see books/index.ts); a short sample is used when absent. */
  bookText?: string;
  /** Word index to start reading the book from. */
  bookStart?: number;
}

export function createSource(opts: SourceOptions, rng: Rng = Math.random): WordSource {
  switch (opts.kind) {
    case "koch":
      return kochSource(opts.kochLesson, opts.groupSize, rng);
    case "english":
      return englishSource(rng);
    case "ham":
      return hamSource(rng);
    case "callsigns":
      return callsignSource(rng);
    case "numbers":
      return numbersSource(rng);
    case "qso":
      return qsoSource(rng, opts.myCall);
    case "contest":
      return contestSource(opts.contest ?? "cqww", rng, opts.myCall);
    case "book":
      return bookSource(
        opts.bookText === undefined ? SAMPLE_WORDS : splitWords(opts.bookText),
        opts.bookStart ?? 0,
      );
  }
}

export { DEFAULT_BOOK };
export type { WordSource } from "./source.ts";
