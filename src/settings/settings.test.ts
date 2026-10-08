import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { DEFAULT_SETTINGS, sanitizeSettings } from "./settings.ts";

describe("sanitizeSettings", () => {
  it("falls back to defaults for missing or invalid storage", () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("garbage")).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps numbers and rejects unknown options", () => {
    const s = sanitizeSettings({
      charWpm: 500,
      effWpm: 80,
      groupSize: 0,
      kochLesson: 99,
      source: "nope",
      myCall: " sm7xyz/p!! ",
      contest: "nope",
      book: "nope",
      wordCount: 7,
      volume: NaN,
      theme: "carbon",
    });
    expect(s.charWpm).toBe(60);
    expect(s.effWpm).toBe(60);
    expect(s.groupSize).toBe(2);
    expect(s.kochLesson).toBe(40);
    expect(s.source).toBe(DEFAULT_SETTINGS.source);
    expect(s.myCall).toBe("SM7XYZ/P");
    expect(s.contest).toBe(DEFAULT_SETTINGS.contest);
    expect(s.book).toBe(DEFAULT_SETTINGS.book);
    expect(s.wordCount).toBe(DEFAULT_SETTINGS.wordCount);
    expect(s.volume).toBe(DEFAULT_SETTINGS.volume);
    expect(s.theme).toBe("carbon");
  });
});
