import { isMorseChar } from "../morse/alphabet.ts";

/**
 * Split the copy input's raw value into finished words and the word still
 * being typed. Lower case is folded and characters without a Morse code are
 * dropped, so native edits and pastes reduce to what could have been sent.
 */
export function parseCopyInput(value: string): { commits: string[]; current: string } {
  const words = value.split(/\s/).map((w) => [...w.toUpperCase()].filter(isMorseChar).join(""));
  const current = words.pop() ?? "";
  return { commits: words.filter((w) => w !== ""), current };
}
