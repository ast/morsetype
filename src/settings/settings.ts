import { createEffect } from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import { SOURCE_KINDS, type SourceKind } from "../content/index.ts";
import { KOCH_MAX_LESSON, KOCH_MIN_LESSON } from "../content/koch.ts";
import { readJson, writeJson } from "../lib/persist.ts";

export type ModeKind = "words" | "time";

export const WORD_COUNTS = [10, 25, 50, 100] as const;
export const SECONDS = [30, 60, 120, 300] as const;
export const THEMES = ["serika", "carbon", "paper", "phosphor"] as const;
export type Theme = (typeof THEMES)[number];

export interface Settings {
  charWpm: number;
  /** Effective speed; equal to charWpm means no Farnsworth spacing. */
  effWpm: number;
  pitch: number;
  riseMs: number;
  volume: number;
  source: SourceKind;
  kochLesson: number;
  groupSize: number;
  mode: ModeKind;
  wordCount: number;
  seconds: number;
  theme: Theme;
}

export const DEFAULT_SETTINGS: Settings = {
  charWpm: 20,
  effWpm: 20,
  pitch: 600,
  riseMs: 5,
  volume: 0.5,
  source: "koch",
  kochLesson: 1,
  groupSize: 5,
  mode: "words",
  wordCount: 25,
  seconds: 60,
  theme: "serika",
};

export const LIMITS = {
  wpm: [5, 60],
  pitch: [300, 1200],
  riseMs: [1, 15],
  groupSize: [2, 8],
} as const;

const KEY = "morsetype.settings.v1";

export function clamp(v: number, [min, max]: readonly [number, number]): number {
  return Math.min(max, Math.max(min, v));
}

/** Effective speed, never above the character speed. */
export function effectiveWpm(s: Pick<Settings, "charWpm" | "effWpm">): number {
  return Math.min(s.effWpm, s.charWpm);
}

/** Validate stored settings, falling back to defaults for anything missing or out of range. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  const num = (k: keyof Settings, limits: readonly [number, number]): number => {
    const v = r[k];
    return typeof v === "number" && Number.isFinite(v) ? clamp(v, limits) : (d[k] as number);
  };
  const oneOf = <T>(k: keyof Settings, options: readonly T[]): T =>
    options.includes(r[k] as T) ? (r[k] as T) : (d[k] as T);

  const charWpm = num("charWpm", LIMITS.wpm);
  return {
    charWpm,
    effWpm: Math.min(num("effWpm", LIMITS.wpm), charWpm),
    pitch: num("pitch", LIMITS.pitch),
    riseMs: num("riseMs", LIMITS.riseMs),
    volume: num("volume", [0, 1]),
    source: oneOf("source", SOURCE_KINDS),
    kochLesson: Math.round(num("kochLesson", [KOCH_MIN_LESSON, KOCH_MAX_LESSON])),
    groupSize: Math.round(num("groupSize", LIMITS.groupSize)),
    mode: oneOf<ModeKind>("mode", ["words", "time"]),
    wordCount: oneOf("wordCount", WORD_COUNTS),
    seconds: oneOf("seconds", SECONDS),
    theme: oneOf("theme", THEMES),
  };
}

export function createSettings(): [Settings, SetStoreFunction<Settings>] {
  const [settings, setSettings] = createStore<Settings>(sanitizeSettings(readJson(KEY)));
  createEffect(() => writeJson(KEY, { ...settings }));
  return [settings, setSettings];
}
