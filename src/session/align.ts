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

/** Cost of pairing two words by content: 0 when equal, 2 when completely different. */
function contentCost(sent: string, typed: string): number {
  const len = Math.max(sent.length, typed.length);
  return len === 0 ? 0 : (2 * editDistance(sent, typed)) / len;
}

/** When words were heard and typed, on one clock (seconds). */
export interface AlignTiming {
  /** Start and end of each sent word. */
  sent: readonly { start: number; end: number }[];
  /** Time of the first keystroke of each typed word. */
  typed: readonly number[];
}

export interface AlignCosts {
  /** A sent word with no copy before the last copied word. */
  missed: number;
  /** A typed word that matches nothing. */
  extra: number;
  /** A sent word after the last copied word, already fully heard when that word was started. */
  pending: number;
  /** Words of copy-behind that are considered normal. */
  freeLag: number;
  /** Cost per word of copy-behind beyond `freeLag`. */
  lag: number;
}

/**
 * Tuned with a simulated copier (missed words and runs of misses, typos, junk
 * words, copy-behind up to 4 s) over Koch, English and callsign content:
 * a pending cost near `missed` makes recovery after a miss immediate, while
 * staying below it keeps slow copiers from being marked as missing words.
 */
export const DEFAULT_COSTS: AlignCosts = {
  missed: 1,
  extra: 1,
  pending: 0.8,
  freeLag: 2,
  lag: 0.5,
};

export interface AlignOptions {
  timing?: AlignTiming;
  /** Session over: trailing uncopied words are missed, not pending. */
  final?: boolean;
  costs?: AlignCosts;
}

/** Number of sent words fully heard at time t (sent words are in time order). */
function heardBy(sent: AlignTiming["sent"], t: number): number {
  let lo = 0;
  let hi = sent.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sent[mid]!.end <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Align typed words to sent words with a Needleman–Wunsch style DP.
 *
 * Content decides most pairings, and timing breaks the ties that content alone
 * cannot: a word cannot be copied before it starts, and copying a word long
 * after several newer words have been heard is unlikely. Sent words after the
 * last copied word are `pending` (the operator may just be behind). They are
 * not free, though, or pairing a copy with an older, missed word would always
 * look cheaper than admitting the miss.
 */
export function alignWords(
  sent: readonly string[],
  typed: readonly string[],
  opts: AlignOptions = {},
): WordOp[] {
  const c = opts.costs ?? DEFAULT_COSTS;
  const timing = opts.timing;
  const m = sent.length;
  const n = typed.length;

  const heard = timing ? typed.map((_, j) => heardBy(timing.sent, timing.typed[j]!)) : [];
  const pairCost = (i: number, j: number): number => {
    let cost = contentCost(sent[i]!, typed[j]!);
    if (timing) {
      const t = timing.typed[j]!;
      if (timing.sent[i]!.start > t) return Infinity;
      const lag = Math.max(0, heard[j]! - (i + 1));
      cost += c.lag * Math.max(0, lag - c.freeLag);
    }
    return cost;
  };

  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i]![0] = i * c.missed;
  for (let j = 0; j <= n; j++) d[0]![j] = j * c.extra;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i]![j] = Math.min(
        d[i - 1]![j - 1]! + pairCost(i - 1, j - 1),
        d[i - 1]![j]! + c.missed,
        d[i]![j - 1]! + c.extra,
      );
    }
  }

  // Cost of leaving sent word k uncopied after the last copied word.
  const lastTyped = timing && n > 0 ? timing.typed[n - 1]! : Infinity;
  const trailing = (k: number): number => {
    if (opts.final) return c.missed;
    if (timing && n > 0) return timing.sent[k]!.end <= lastTyped ? c.pending : 0;
    return c.pending;
  };
  const tail = new Array<number>(m + 1).fill(0);
  for (let k = m - 1; k >= 0; k--) tail[k] = tail[k + 1]! + trailing(k);

  // Choose where copying ends; ties prefer copying further.
  let end = 0;
  for (let i = 1; i <= m; i++) {
    if (d[i]![n]! + tail[i]! <= d[end]![n]! + tail[end]! + 1e-9) end = i;
  }

  const ops: WordOp[] = [];
  for (let k = m - 1; k >= end; k--) {
    ops.push(opts.final ? { kind: "missed", sent: k } : { kind: "pending", sent: k });
  }

  let i = end;
  let j = n;
  const eq = (x: number, y: number) => Math.abs(x - y) < 1e-9;
  while (i > 0 || j > 0) {
    const here = d[i]![j]!;
    if (i > 0 && j > 0 && eq(here, d[i - 1]![j - 1]! + pairCost(i - 1, j - 1))) {
      ops.push({ kind: "pair", sent: i - 1, typed: j - 1 });
      i--;
      j--;
    } else if (i > 0 && eq(here, d[i - 1]![j]! + c.missed)) {
      ops.push({ kind: "missed", sent: i - 1 });
      i--;
    } else {
      ops.push({ kind: "extra", typed: j - 1 });
      j--;
    }
  }
  return ops.reverse();
}
