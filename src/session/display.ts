import type { CharOp, WordOp } from "./align.ts";
import { charOpsFor } from "./results.ts";

export type DisplayWord =
  | {
    kind: "pair";
    key: string;
    sent: string;
    typed: string;
    chars: CharOp[];
    graded: boolean;
    correct: boolean;
  }
  | { kind: "missed"; key: string; sent: string }
  | { kind: "extra"; key: string; typed: string };

/**
 * Turn an alignment into what the copy area shows. Pending words are hidden,
 * and a pair is only graded once its sent word has been heard completely.
 */
export function buildDisplay(
  ops: readonly WordOp[],
  sent: readonly string[],
  typed: readonly string[],
  endedCount = Infinity,
): DisplayWord[] {
  const out: DisplayWord[] = [];
  for (const op of ops) {
    switch (op.kind) {
      case "pair": {
        const chars = charOpsFor(op, sent, typed);
        out.push({
          kind: "pair",
          key: `p${op.sent}-${op.typed}`,
          sent: sent[op.sent]!,
          typed: typed[op.typed]!,
          chars,
          graded: op.sent < endedCount,
          correct: chars.every((c) => c.kind === "ok"),
        });
        break;
      }
      case "missed":
        out.push({ kind: "missed", key: `m${op.sent}`, sent: sent[op.sent]! });
        break;
      case "extra":
        out.push({ kind: "extra", key: `e${op.typed}`, typed: typed[op.typed]! });
        break;
      case "pending":
        break;
    }
  }
  return out;
}

function sameWord(a: DisplayWord, b: DisplayWord): boolean {
  if (a.key !== b.key) return false;
  if (a.kind === "pair" && b.kind === "pair") {
    return a.typed === b.typed && a.sent === b.sent && a.graded === b.graded;
  }
  return true;
}

/**
 * Reuse unchanged words from the previous display, so keyed rendering (Solid's
 * `<For>` matches by identity) only touches words that actually changed.
 */
export function reuseUnchanged(
  prev: readonly DisplayWord[],
  next: DisplayWord[],
): DisplayWord[] {
  const byKey = new Map(prev.map((w) => [w.key, w]));
  return next.map((w) => {
    const old = byKey.get(w.key);
    return old && sameWord(old, w) ? old : w;
  });
}
