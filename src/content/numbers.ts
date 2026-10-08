import { chance, noRepeat, randInt, type Rng, type WordSource } from "./source.ts";

/** Numbers of 1–5 digits, sometimes with contest-style cut numbers (T for 0, N for 9). */
export function numbersSource(rng: Rng): WordSource {
  return noRepeat(() => {
    const digits = randInt(1, 5, rng);
    let s = "";
    for (let i = 0; i < digits; i++) s += String(randInt(i === 0 && digits > 1 ? 1 : 0, 9, rng));
    return chance(0.2, rng) ? s.replace(/0/g, "T").replace(/9/g, "N") : s;
  });
}
