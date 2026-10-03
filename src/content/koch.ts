import { type Rng, type WordSource } from "./source.ts";

/** Koch character order as used by LCWO. */
export const KOCH_ORDER = [
  ..."KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X",
] as const;

export const KOCH_MIN_LESSON = 1;
export const KOCH_MAX_LESSON = KOCH_ORDER.length - 1;

/** Lesson n uses the first n + 1 characters (lesson 1 = K M). */
export function kochChars(lesson: number): string[] {
  const n = Math.min(Math.max(lesson, KOCH_MIN_LESSON), KOCH_MAX_LESSON);
  return KOCH_ORDER.slice(0, n + 1);
}

/** The character introduced in a lesson. */
export function kochNewChar(lesson: number): string {
  return kochChars(lesson).at(-1)!;
}

/** Random groups from the lesson's characters, with the newest one weighted up. */
export function kochSource(lesson: number, groupSize: number, rng: Rng, newWeight = 2): WordSource {
  const chars = kochChars(lesson);
  const weights = chars.map((_, i) => (i === chars.length - 1 && lesson > 1 ? newWeight : 1));
  const total = weights.reduce((a, b) => a + b, 0);

  const pickChar = (): string => {
    let r = rng() * total;
    for (let i = 0; i < chars.length; i++) {
      r -= weights[i]!;
      if (r < 0) return chars[i]!;
    }
    return chars.at(-1)!;
  };

  return {
    next() {
      let s = "";
      for (let i = 0; i < groupSize; i++) s += pickChar();
      return s;
    },
  };
}
