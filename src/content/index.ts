import { englishSource } from "./words.ts";
import { callsignSource, hamSource, qsoSource } from "./ham.ts";
import { kochSource } from "./koch.ts";
import type { Rng, WordSource } from "./source.ts";

export type SourceKind = "koch" | "english" | "ham" | "callsigns" | "qso";

export const SOURCE_KINDS: readonly SourceKind[] = ["koch", "english", "ham", "callsigns", "qso"];

export interface SourceOptions {
  kind: SourceKind;
  kochLesson: number;
  groupSize: number;
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
    case "qso":
      return qsoSource(rng);
  }
}

export type { WordSource } from "./source.ts";
