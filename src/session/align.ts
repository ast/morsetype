/**
 * Alignment of copied text against sent text.
 *
 * Words are aligned with a Needleman–Wunsch style DP so that a missed word, an
 * extra word or a garbled word only affects itself and never shifts the
 * grading of everything after it. Paired words are then aligned per character.
 */

export type CharOp =
  | { kind: "ok"; sent: string; typed: string }
  | { kind: "sub"; sent: string; typed: string }
  | { kind: "miss"; sent: string }
  | { kind: "extra"; typed: string };

export type WordOp =
  | { kind: "pair"; sent: number; typed: number }
  | { kind: "missed"; sent: number }
  | { kind: "extra"; typed: number }
  /** Sent words after the last copied word: not graded yet. */
  | { kind: "pending"; sent: number };

function levTable(a: readonly string[], b: readonly string[]): number[][] {
  const d: number[][] = Array.from(
    { length: a.length + 1 },
    (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const sub = d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
      d[i]![j] = Math.min(sub, d[i - 1]![j]! + 1, d[i]![j - 1]! + 1);
    }
  }
  return d;
}

export function editDistance(a: string, b: string): number {
  return levTable([...a], [...b])[a.length]![b.length]!;
}

export function alignChars(sent: string, typed: string): CharOp[] {
  const a = [...sent];
  const b = [...typed];
  const d = levTable(a, b);
  const ops: CharOp[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    const here = d[i]![j]!;
    if (i > 0 && j > 0) {
      const same = a[i - 1] === b[j - 1];
      if (here === d[i - 1]![j - 1]! + (same ? 0 : 1)) {
        ops.push({ kind: same ? "ok" : "sub", sent: a[i - 1]!, typed: b[j - 1]! });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && here === d[i - 1]![j]! + 1) {
      ops.push({ kind: "miss", sent: a[i - 1]! });
      i--;
    } else {
      ops.push({ kind: "extra", typed: b[j - 1]! });
      j--;
    }
  }
  return ops.reverse();
}

/** Cost of pairing two words: 0 when equal, 2 when completely different. */
function pairCost(sent: string, typed: string): number {
  const len = Math.max(sent.length, typed.length);
  return len === 0 ? 0 : (2 * editDistance(sent, typed)) / len;
}

const GAP = 1;

/**
 * Align typed words to sent words. Unmatched sent words after the last
 * paired word cost nothing (the operator may simply be behind) and are
 * reported as `pending`.
 */
export function alignWords(sent: readonly string[], typed: readonly string[]): WordOp[] {
  const m = sent.length;
  const n = typed.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i]![0] = i * GAP;
  for (let j = 0; j <= n; j++) d[0]![j] = j * GAP;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i]![j] = Math.min(
        d[i - 1]![j - 1]! + pairCost(sent[i - 1]!, typed[j - 1]!),
        d[i - 1]![j]! + GAP,
        d[i]![j - 1]! + GAP,
      );
    }
  }

  // Free trailing sent gaps: end at the best row; ties prefer copying further.
  let end = 0;
  for (let i = 1; i <= m; i++) if (d[i]![n]! <= d[end]![n]! + 1e-9) end = i;

  const ops: WordOp[] = [];
  for (let k = m - 1; k >= end; k--) ops.push({ kind: "pending", sent: k });

  let i = end;
  let j = n;
  const eq = (x: number, y: number) => Math.abs(x - y) < 1e-9;
  while (i > 0 || j > 0) {
    const here = d[i]![j]!;
    if (i > 0 && j > 0 && eq(here, d[i - 1]![j - 1]! + pairCost(sent[i - 1]!, typed[j - 1]!))) {
      ops.push({ kind: "pair", sent: i - 1, typed: j - 1 });
      i--;
      j--;
    } else if (i > 0 && eq(here, d[i - 1]![j]! + GAP)) {
      ops.push({ kind: "missed", sent: i - 1 });
      i--;
    } else {
      ops.push({ kind: "extra", typed: j - 1 });
      j--;
    }
  }
  return ops.reverse();
}
