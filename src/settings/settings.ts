import { createEffect } from "solid-js";
import { createStore, type SetStoreFunction } from "solid-js/store";
import type { SourceKind } from "../content/index.ts";
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

export function createSettings(): [Settings, SetStoreFunction<Settings>] {
  const stored = readJson<Partial<Settings>>(KEY) ?? {};
  const [settings, setSettings] = createStore<Settings>({ ...DEFAULT_SETTINGS, ...stored });
  createEffect(() => writeJson(KEY, { ...settings }));
  return [settings, setSettings];
}
