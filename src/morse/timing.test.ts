import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { ditSeconds, PARIS_UNITS, spacing, wordTiming } from "./timing.ts";

describe("timing", () => {
  it("dit is 60 ms at 20 wpm", () => {
    expect(ditSeconds(20)).toBeCloseTo(0.06, 12);
  });

  it("PARIS plus a word gap is 50 units", () => {
    const sp = spacing({ charWpm: 20, effWpm: 20 });
    const w = wordTiming("PARIS", sp);
    expect((w.duration + sp.wordGap) / sp.dit).toBeCloseTo(PARIS_UNITS, 9);
  });

  it("sending PARIS repeatedly gives exactly the configured wpm", () => {
    for (const wpm of [5, 13, 20, 25, 40]) {
      const sp = spacing({ charWpm: wpm, effWpm: wpm });
      const perWord = wordTiming("PARIS", sp).duration + sp.wordGap;
      expect(60 / perWord).toBeCloseTo(wpm, 9);
    }
  });

  it("Farnsworth keeps characters fast and hits the effective speed", () => {
    const sp = spacing({ charWpm: 18, effWpm: 10 });
    expect(sp.dit).toBeCloseTo(1.2 / 18, 12);
    const perWord = wordTiming("PARIS", sp).duration + sp.wordGap;
    expect(60 / perWord).toBeCloseTo(10, 9);
    // ARRL: ta = (60*18 - 37.2*10) / (10*18) = 3.9333 s
    expect(sp.charGap).toBeCloseTo((3 * 3.9333333) / 19, 5);
    expect(sp.wordGap).toBeCloseTo((7 * 3.9333333) / 19, 5);
  });

  it("lays out elements and characters", () => {
    const sp = spacing({ charWpm: 20, effWpm: 20 });
    const d = sp.dit;
    const w = wordTiming("AN", sp);
    // A = .-   N = -.
    expect(w.elements.map((e) => [e.on / d, e.off / d])).toEqual([
      [0, 1],
      [2, 5],
      [8, 11],
      [12, 13],
    ].map(([a, b]) => [expect.closeTo(a!, 9), expect.closeTo(b!, 9)]));
    expect(w.chars.map((c) => c.char)).toEqual(["A", "N"]);
    expect(w.duration / d).toBeCloseTo(13, 9);
  });

  it("sends prosigns as one run-together character", () => {
    const sp = spacing({ charWpm: 20, effWpm: 20 });
    expect(wordTiming("+", sp).elements).toHaveLength(5); // <AR> .-.-.
    expect(wordTiming("<", sp).elements).toHaveLength(6); // <SK> ...-.-
    expect(wordTiming("(", sp).elements).toHaveLength(5); // <KN> -.--.
    expect(wordTiming("=", sp).chars).toHaveLength(1);
  });
});
