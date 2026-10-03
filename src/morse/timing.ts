import { patternOf } from "./alphabet";

/**
 * Morse timing per ITU-R M.1677-1 using the PARIS standard word (50 units):
 * dah = 3 dits, gap inside a character = 1 dit, between characters = 3 dits,
 * between words = 7 dits.
 *
 * Farnsworth timing (ARRL) keeps characters at `charWpm` and stretches only the
 * gaps between characters and words so the overall speed becomes `effWpm`.
 */
export interface TimingParams {
  /** Character speed in WPM (PARIS). */
  charWpm: number;
  /** Effective (overall) speed in WPM. Equal to charWpm disables Farnsworth. */
  effWpm: number;
}

/** All durations in seconds. */
export interface Spacing {
  dit: number;
  dah: number;
  elementGap: number;
  charGap: number;
  wordGap: number;
}

/** A key-down interval in seconds. */
export interface KeyInterval {
  on: number;
  off: number;
}

export interface CharTiming {
  char: string;
  start: number;
  end: number;
}

/** Timing of one word relative to its own start (t = 0 is the first key-down). */
export interface WordTiming {
  text: string;
  elements: KeyInterval[];
  chars: CharTiming[];
  /** Time of the last key-up. */
  duration: number;
}

export const PARIS_UNITS = 50;

export function ditSeconds(wpm: number): number {
  return 1.2 / wpm;
}

export function spacing({ charWpm, effWpm }: TimingParams): Spacing {
  const dit = ditSeconds(charWpm);
  const base: Spacing = {
    dit,
    dah: 3 * dit,
    elementGap: dit,
    charGap: 3 * dit,
    wordGap: 7 * dit,
  };
  if (effWpm >= charWpm) return base;

  // ARRL "Morse Code: The Essential Language", Farnsworth timing:
  // total extra delay per PARIS word, spread 3/19 per char gap and 7/19 per word gap.
  const c = charWpm;
  const s = effWpm;
  const ta = (60 * c - 37.2 * s) / (s * c);
  return { ...base, charGap: (3 * ta) / 19, wordGap: (7 * ta) / 19 };
}

/** Lay out the key-down intervals of a single word. Unknown characters are skipped. */
export function wordTiming(text: string, sp: Spacing): WordTiming {
  const elements: KeyInterval[] = [];
  const chars: CharTiming[] = [];
  let t = 0;
  let first = true;

  for (const char of text) {
    const pattern = patternOf(char);
    if (pattern === undefined) continue;
    if (!first) t += sp.charGap;
    first = false;

    const start = t;
    [...pattern].forEach((sym, i) => {
      if (i > 0) t += sp.elementGap;
      const len = sym === "-" ? sp.dah : sp.dit;
      elements.push({ on: t, off: t + len });
      t += len;
    });
    chars.push({ char, start, end: t });
  }

  return { text, elements, chars, duration: t };
}
