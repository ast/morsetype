import { describe, expect, it } from "vitest";
import { alignWords } from "./align";
import { computeResult } from "./results";
import { emptyStats, recordSession } from "../stats/stats";

describe("results", () => {
  it("scores a session with a typo and a missed word", () => {
    const sent = ["CQ", "DE", "SM5XYZ", "K"];
    const typed = ["CQ", "SM5XZY", "K"];
    const ops = alignWords(sent, typed);
    const r = computeResult({
      sent, typed, ops, source: "qso", kochLesson: null, charWpm: 20, effWpm: 20, seconds: 10,
    });
    expect(r.words).toBe(4);
    expect(r.wordsCorrect).toBe(2);
    expect(r.chars.miss).toBeGreaterThanOrEqual(2); // D, E
    expect(r.perChar["D"]).toEqual({ seen: 1, correct: 0 });
    expect(r.charAccuracy).toBeGreaterThan(0.5);
    expect(r.charAccuracy).toBeLessThan(1);

    const stats = recordSession(emptyStats(), r);
    expect(stats.history).toHaveLength(1);
    expect(stats.chars["C"]).toEqual({ seen: 1, correct: 1 });
  });
});
