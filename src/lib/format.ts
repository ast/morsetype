/** 0.934 → "93%" */
export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** Character speed, with the effective speed when Farnsworth spacing is on: "20" or "20/12". */
export function formatSpeed(s: { charWpm: number; effWpm: number }): string {
  return s.effWpm < s.charWpm ? `${s.charWpm}/${s.effWpm}` : `${s.charWpm}`;
}
