import { alignChars, type CharOp, type WordOp } from "./align";

export interface CharCounts {
  ok: number;
  sub: number;
  miss: number;
  extra: number;
}

export interface SessionResult {
  date: number;
  source: string;
  kochLesson: number | null;
  charWpm: number;
  effWpm: number;
  seconds: number;
  words: number;
  wordsCorrect: number;
  chars: CharCounts;
  charAccuracy: number;
  wordAccuracy: number;
  /** Effective speed scaled by character accuracy. */
  copyWpm: number;
  /** Per sent character: how often it was sent and copied correctly. */
  perChar: Record<string, { seen: number; correct: number }>;
  /** [sent, typed] pairs for substitutions. */
  confusions: [string, string][];
}

export interface ResultInput {
  sent: readonly string[];
  typed: readonly string[];
  ops: readonly WordOp[];
  source: string;
  kochLesson: number | null;
  charWpm: number;
  effWpm: number;
  seconds: number;
}

/** Character ops for any word op, treating a missed word as all-missed characters. */
export function charOpsFor(op: WordOp, sent: readonly string[], typed: readonly string[]): CharOp[] {
  switch (op.kind) {
    case "pair":
      return alignChars(sent[op.sent]!, typed[op.typed]!);
    case "missed":
    case "pending":
      return [...sent[op.sent]!].map((c) => ({ kind: "miss", sent: c }));
    case "extra":
      return [...typed[op.typed]!].map((c) => ({ kind: "extra", typed: c }));
  }
}

export function computeResult(input: ResultInput): SessionResult {
  const chars: CharCounts = { ok: 0, sub: 0, miss: 0, extra: 0 };
  const perChar: SessionResult["perChar"] = {};
  const confusions: [string, string][] = [];
  let wordsCorrect = 0;

  for (const op of input.ops) {
    const cops = charOpsFor(op, input.sent, input.typed);
    if (op.kind === "pair" && cops.every((c) => c.kind === "ok")) wordsCorrect++;
    for (const c of cops) {
      chars[c.kind]++;
      if (c.kind === "extra") continue;
      const s = (perChar[c.sent] ??= { seen: 0, correct: 0 });
      s.seen++;
      if (c.kind === "ok") s.correct++;
      if (c.kind === "sub") confusions.push([c.sent, c.typed]);
    }
  }

  const total = chars.ok + chars.sub + chars.miss + chars.extra;
  const charAccuracy = total === 0 ? 0 : chars.ok / total;
  const words = input.sent.length;
  return {
    date: Date.now(),
    source: input.source,
    kochLesson: input.kochLesson,
    charWpm: input.charWpm,
    effWpm: input.effWpm,
    seconds: input.seconds,
    words,
    wordsCorrect,
    chars,
    charAccuracy,
    wordAccuracy: words === 0 ? 0 : wordsCorrect / words,
    copyWpm: input.effWpm * charAccuracy,
    perChar,
    confusions,
  };
}
