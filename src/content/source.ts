/** A random number generator returning values in [0, 1). */
export type Rng = () => number;

/** An endless supply of words to send. */
export interface WordSource {
  next(): string;
  /**
   * Whether the last word returned closed a natural unit (an over, a contest QSO, a
   * sentence), so a session that is due to end can stop here without cutting mid-phrase.
   * Sources without natural units leave it undefined.
   */
  atBoundary?(): boolean;
}

export function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** True with probability p. */
export function chance(p: number, rng: Rng): boolean {
  return rng() < p;
}

/** Avoids sending the same word twice in a row. */
export function noRepeat(source: () => string, tries = 4): WordSource {
  let last = "";
  return {
    next() {
      let w = source();
      for (let i = 0; i < tries && w === last; i++) w = source();
      last = w;
      return w;
    },
  };
}

/**
 * Plays back a script of units (overs, QSOs, sentences…) word by word, asking for a new
 * script when the current one runs out. `atBoundary()` is true between units.
 */
export function scriptSource(nextScript: () => readonly (readonly string[])[]): WordSource {
  let units: readonly (readonly string[])[] = [];
  let unit = 0;
  let word = 0;
  let boundary = false;
  return {
    next() {
      while (unit >= units.length || word >= units[unit]!.length) {
        if (unit >= units.length) {
          units = nextScript().filter((u) => u.length > 0);
          unit = 0;
        } else {
          unit++;
        }
        word = 0;
      }
      const w = units[unit]![word++]!;
      boundary = word >= units[unit]!.length;
      return w;
    },
    atBoundary: () => boundary,
  };
}

/** Deterministic generator (mulberry32) for tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
