/** A random number generator returning values in [0, 1). */
export type Rng = () => number;

/** An endless supply of words to send. */
export interface WordSource {
  next(): string;
}

export function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
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
