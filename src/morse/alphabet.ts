/**
 * International Morse code (ITU-R M.1677-1) for the characters supported in v1.
 * Patterns use '.' for dit and '-' for dah.
 */
export const MORSE: Readonly<Record<string, string>> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "/": "-..-.",
  "=": "-...-",
  // Prosigns, sent as one character: <AR> end of message, <KN> go ahead (named station only),
  // <SK> end of contact. '=' above is <BT> (break / new paragraph).
  "+": ".-.-.",
  "(": "-.--.",
  "<": "...-.-",
};

/** Characters that stand for a prosign, and the letters they are written with. */
export const PROSIGNS: Readonly<Record<string, string>> = {
  "=": "BT",
  "+": "AR",
  "(": "KN",
  "<": "SK",
};

/** How a sent/typed character is shown: `<AR>` for a prosign, the character itself otherwise. */
export function charLabel(c: string): string {
  const p = PROSIGNS[c];
  return p === undefined ? c : `<${p}>`;
}

export function isMorseChar(c: string): boolean {
  return Object.hasOwn(MORSE, c);
}

export function patternOf(c: string): string | undefined {
  return MORSE[c];
}

/** Uppercase and drop anything that cannot be sent. */
export function normalize(text: string): string {
  return [...text.toUpperCase()].filter(isMorseChar).join("");
}
