/** A key press after mapping readline/Emacs control chords to the keys they stand for. */
export interface Key {
  key: string;
  /** Backspace deletes the whole word. */
  word: boolean;
}

type KeyInput = Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "altKey" | "metaKey">;

const CTRL_ALIASES: Record<string, Key> = {
  h: { key: "Backspace", word: false },
  w: { key: "Backspace", word: true },
  m: { key: "Enter", word: false },
  j: { key: "Enter", word: false },
  g: { key: "Escape", word: false },
  "[": { key: "Escape", word: false },
  backspace: { key: "Backspace", word: true },
};

/**
 * Normalise a key press. Returns null for chords that aren't ours, so the
 * browser keeps them (Ctrl+C, Cmd+R, …). Ctrl+W only arrives in an app window;
 * browsers keep it for closing the tab otherwise.
 */
export function normalizeKey(e: KeyInput): Key | null {
  if (e.metaKey) return null;
  if (e.ctrlKey) {
    if (e.altKey) return null;
    // Ctrl+[ by physical key, as in a terminal: on Nordic layouts that key is å.
    if (e.code === "BracketLeft") return CTRL_ALIASES["["]!;
    return CTRL_ALIASES[e.key.toLowerCase()] ?? null;
  }
  return { key: e.key, word: e.altKey && e.key === "Backspace" };
}
