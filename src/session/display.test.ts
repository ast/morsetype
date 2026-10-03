import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { alignWords } from "./align.ts";
import { buildDisplay, reuseUnchanged } from "./display.ts";

describe("display", () => {
  it("reuses unchanged words between updates", () => {
    const sent = ["CQ", "DE", "SM5XYZ"];
    const before = buildDisplay(alignWords(sent, ["CQ"]), sent, ["CQ"], 1);
    const typed = ["CQ", "DF"];
    const after = reuseUnchanged(before, buildDisplay(alignWords(sent, typed), sent, typed, 2));
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toMatchObject({ kind: "pair", typed: "DF", graded: true, correct: false });
  });

  it("replaces a word when it becomes graded", () => {
    const sent = ["CQ", "DE"];
    const typed = ["CQ", "DE"];
    const ops = alignWords(sent, typed);
    const before = buildDisplay(ops, sent, typed, 1);
    const after = reuseUnchanged(before, buildDisplay(ops, sent, typed, 2));
    expect(after[0]).toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
  });
});
