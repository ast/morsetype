import type { KeyInterval } from "../morse/timing.ts";

/**
 * Keying envelope rendering.
 *
 * Each key-down interval becomes a plateau of 1.0 with raised-cosine edges.
 * Edges are centred on the ideal element boundaries, so the envelope crosses
 * 0.5 exactly at `on` and `off` (element length measured at half amplitude,
 * as for transmitter keying). The smooth edges band-limit the keyed carrier
 * and prevent key clicks.
 */

/** Largest rise time we allow, as a fraction of a dit, so edges never overlap. */
export const MAX_RISE_FRACTION = 0.4;

export function effectiveRise(riseSeconds: number, ditSeconds: number): number {
  return Math.min(riseSeconds, MAX_RISE_FRACTION * ditSeconds);
}

/** Raised-cosine ramp, x in [0, 1] → [0, 1]. */
function ramp(x: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * x);
}

/** Envelope value at time t for one element. */
export function elementLevel(t: number, el: KeyInterval, rise: number): number {
  const h = rise / 2;
  if (t <= el.on - h || t >= el.off + h) return 0;
  if (t < el.on + h) return ramp((t - (el.on - h)) / rise);
  if (t > el.off - h) return ramp((el.off + h - t) / rise);
  return 1;
}

export interface EnvelopeChunk {
  /** Index of the first sample, counted from the session origin (t = 0). */
  startSample: number;
  data: Float32Array;
}

/**
 * Render the envelope for a group of elements given in absolute seconds from
 * the session origin. Sample n of the chunk corresponds to time
 * (startSample + n) / sampleRate, so timing never accumulates rounding error.
 */
export function renderEnvelope(
  elements: readonly KeyInterval[],
  sampleRate: number,
  rise: number,
): EnvelopeChunk {
  if (elements.length === 0) return { startSample: 0, data: new Float32Array(0) };

  const h = rise / 2;
  const first = elements[0]!;
  const last = elements[elements.length - 1]!;
  const startSample = Math.floor((first.on - h) * sampleRate) - 1;
  const endSample = Math.ceil((last.off + h) * sampleRate) + 1;
  const data = new Float32Array(endSample - startSample);

  for (const el of elements) {
    const a = Math.max(startSample, Math.floor((el.on - h) * sampleRate));
    const b = Math.min(endSample, Math.ceil((el.off + h) * sampleRate) + 1);
    for (let n = a; n < b; n++) {
      const v = elementLevel(n / sampleRate, el, rise);
      const i = n - startSample;
      if (v > data[i]!) data[i] = v;
    }
  }
  return { startSample, data };
}
