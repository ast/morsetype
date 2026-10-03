import { ENGLISH_COMMON } from "./wordlists/en.ts";
import { noRepeat, pick, type Rng, type WordSource } from "./source.ts";

const ENGLISH = [...new Set(ENGLISH_COMMON)];

export function englishSource(rng: Rng): WordSource {
  return noRepeat(() => pick(ENGLISH, rng));
}
