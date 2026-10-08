import { readJson, writeJson } from "../../lib/persist.ts";

const KEY = "morsetype.books.v1";

type Positions = Record<string, number>;

function read(): Positions {
  const raw = readJson<unknown>(KEY);
  if (typeof raw !== "object" || raw === null) return {};
  const out: Positions = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[k] = Math.floor(v);
  }
  return out;
}

/** Where reading of a book will resume (word index). */
export function getPosition(id: string): number {
  return read()[id] ?? 0;
}

export function setPosition(id: string, index: number): void {
  writeJson(KEY, { ...read(), [id]: Math.max(0, Math.floor(index)) });
}
