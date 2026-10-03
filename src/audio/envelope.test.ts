import { describe, expect, it } from "vitest";
import { spacing, wordTiming } from "../morse/timing";
import { effectiveRise, elementLevel, renderEnvelope } from "./envelope";

const SR = 48000;

describe("envelope", () => {
  it("crosses half amplitude exactly at the element boundaries", () => {
    const el = { on: 0.1, off: 0.16 };
    const rise = 0.005;
    expect(elementLevel(el.on, el, rise)).toBeCloseTo(0.5, 12);
    expect(elementLevel(el.off, el, rise)).toBeCloseTo(0.5, 12);
    expect(elementLevel(0.13, el, rise)).toBe(1);
    expect(elementLevel(el.on - rise / 2, el, rise)).toBe(0);
    expect(elementLevel(el.off + rise / 2, el, rise)).toBe(0);
  });

  it("renders a smooth envelope with no jumps, starting and ending at zero", () => {
    const sp = spacing({ charWpm: 30, effWpm: 30 });
    const offset = 1.2345;
    const w = wordTiming("PARIS", sp);
    const els = w.elements.map((e) => ({ on: e.on + offset, off: e.off + offset }));
    const rise = effectiveRise(0.005, sp.dit);
    const { startSample, data } = renderEnvelope(els, SR, rise);

    expect(data[0]).toBe(0);
    expect(data[data.length - 1]).toBe(0);
    expect(Math.max(...data)).toBe(1);

    // Max per-sample step of a 5 ms raised cosine is pi/2 / (rise*SR).
    const maxStep = Math.PI / 2 / (rise * SR) + 1e-6;
    for (let i = 1; i < data.length; i++) {
      expect(Math.abs(data[i]! - data[i - 1]!)).toBeLessThanOrEqual(maxStep);
    }

    // Key-down time measured at the 0.5 threshold matches the ideal timing
    // to within one sample.
    const onSamples = data.filter((v) => v >= 0.5).length;
    const ideal = w.elements.reduce((s, e) => s + (e.off - e.on), 0) * SR;
    expect(Math.abs(onSamples - ideal)).toBeLessThanOrEqual(w.elements.length);

    // First rising crossing is at the first element's on time.
    const firstUp = data.findIndex((v) => v >= 0.5) + startSample;
    expect(Math.abs(firstUp / SR - els[0]!.on)).toBeLessThan(1 / SR);
  });

  it("clamps rise time at high speed", () => {
    const dit = 1.2 / 60;
    expect(effectiveRise(0.01, dit)).toBeCloseTo(0.4 * dit, 12);
    expect(effectiveRise(0.005, 1.2 / 20)).toBe(0.005);
  });
});
