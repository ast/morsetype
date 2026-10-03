import type { SessionResult } from "../session/results.ts";

export interface HistoryEntry {
  date: number;
  source: string;
  kochLesson: number | null;
  charWpm: number;
  effWpm: number;
  words: number;
  charAccuracy: number;
  copyWpm: number;
}

export interface StatsData {
  version: 1;
  chars: Record<string, { seen: number; correct: number }>;
  /** confusions[sent][typed] = count */
  confusions: Record<string, Record<string, number>>;
  history: HistoryEntry[];
}

const MAX_HISTORY = 500;

export function emptyStats(): StatsData {
  return { version: 1, chars: {}, confusions: {}, history: [] };
}

export function recordSession(data: StatsData, r: SessionResult): StatsData {
  const chars = { ...data.chars };
  for (const [c, s] of Object.entries(r.perChar)) {
    const prev = chars[c] ?? { seen: 0, correct: 0 };
    chars[c] = { seen: prev.seen + s.seen, correct: prev.correct + s.correct };
  }

  const confusions = { ...data.confusions };
  for (const [sent, typed] of r.confusions) {
    const row = { ...confusions[sent] };
    row[typed] = (row[typed] ?? 0) + 1;
    confusions[sent] = row;
  }

  const entry: HistoryEntry = {
    date: r.date,
    source: r.source,
    kochLesson: r.kochLesson,
    charWpm: r.charWpm,
    effWpm: r.effWpm,
    words: r.words,
    charAccuracy: r.charAccuracy,
    copyWpm: r.copyWpm,
  };
  return { version: 1, chars, confusions, history: [...data.history, entry].slice(-MAX_HISTORY) };
}

/** Most frequent wrong copies of a character. */
export function topConfusions(data: StatsData, char: string, n = 3): [string, number][] {
  return Object.entries(data.confusions[char] ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}
