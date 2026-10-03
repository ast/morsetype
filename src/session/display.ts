import type { CharOp, WordOp } from "./align";
import { charOpsFor } from "./results";

export type DisplayWord =
  | { kind: "pair"; key: string; sent: string; typed: string; chars: CharOp[]; graded: boolean; correct: boolean }
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
