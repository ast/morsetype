import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { alignChars, type AlignTiming, alignWords, editDistance } from "./align.ts";

const kinds = (ops: { kind: string }[]) => ops.map((o) => o.kind);

describe("alignChars", () => {
  it("handles substitutions, misses and extras", () => {
    expect(editDistance("SM5XYZ", "SM5XZ")).toBe(1);
    expect(kinds(alignChars("SM5XYZ", "SM5XZ"))).toEqual(["ok", "ok", "ok", "ok", "miss", "ok"]);
    expect(kinds(alignChars("CQ", "CQQ")).sort()).toEqual(["extra", "ok", "ok"]);
    expect(alignChars("DE", "DF")).toEqual([
      { kind: "ok", sent: "D", typed: "D" },
      { kind: "sub", sent: "E", typed: "F" },
    ]);
  });
});

describe("alignWords", () => {
  it("pairs identical copy", () => {
    expect(kinds(alignWords(["CQ", "DE", "SM5XYZ"], ["CQ", "DE", "SM5XYZ"]))).toEqual([
      "pair",
      "pair",
      "pair",
    ]);
  });

  it("marks words not yet copied as pending, not missed", () => {
    expect(kinds(alignWords(["CQ", "DE", "SM5XYZ", "K"], ["CQ", "DE"]))).toEqual([
      "pair",
      "pair",
      "pending",
      "pending",
    ]);
    expect(kinds(alignWords(["CQ"], []))).toEqual(["pending"]);
  });

  it("recovers from a skipped word", () => {
    const ops = alignWords(["THE", "QUICK", "BROWN", "FOX"], ["THE", "BROWN"]);
    expect(ops).toEqual([
      { kind: "pair", sent: 0, typed: 0 },
      { kind: "missed", sent: 1 },
      { kind: "pair", sent: 2, typed: 1 },
      { kind: "pending", sent: 3 },
    ]);
  });

  it("recovers from a skipped random group", () => {
    const ops = alignWords(["KMRUS", "ERKMU", "SURKE"], ["KMRUS", "SURKE"]);
    expect(kinds(ops)).toEqual(["pair", "missed", "pair"]);
  });

  it("keeps a garbled word paired", () => {
    const ops = alignWords(["CQ", "SM5XYZ", "K"], ["CQ", "SN5XZ", "K"]);
    expect(kinds(ops)).toEqual(["pair", "pair", "pair"]);
  });

  it("reports extra words", () => {
    const ops = alignWords(["TU", "73"], ["TU", "EE", "73"]);
    expect(ops).toEqual([
      { kind: "pair", sent: 0, typed: 0 },
      { kind: "extra", typed: 1 },
      { kind: "pair", sent: 1, typed: 2 },
    ]);
  });
});

/** Sent words of 2 s with 0.5 s gaps; each typed word starts `delay` s after its word ends. */
function timed(sent: string[], copied: [word: number, text: string][], delay = 0.8) {
  const sentTimes = sent.map((_, i) => ({ start: i * 2.5, end: i * 2.5 + 2 }));
  const timing: AlignTiming = {
    sent: sentTimes,
    typed: copied.map(([i]) => sentTimes[i]!.end + delay),
  };
  return { typed: copied.map(([, t]) => t), timing };
}

describe("alignWords recovery while copying", () => {
  // Groups from a small Koch alphabet look alike, which used to let one missed
  // group shift the grading of every following group.
  const groups = ["KMKMM", "MKKMK", "KKMMK", "MKMKM", "KMMKK", "MMKKM"];

  it("recovers immediately after a missed group", () => {
    // Group 1 missed; the copier is typing group 2 while group 3 sounds.
    const { typed, timing } = timed(groups.slice(0, 4), [[0, "KMKMM"], [2, "KKMMK"]]);
    expect(alignWords(groups.slice(0, 4), typed, { timing })).toEqual([
      { kind: "pair", sent: 0, typed: 0 },
      { kind: "missed", sent: 1 },
      { kind: "pair", sent: 2, typed: 1 },
      { kind: "pending", sent: 3 },
    ]);
  });

  it("recovers immediately after several missed groups", () => {
    const { typed, timing } = timed(groups, [[0, "KMKMM"], [4, "KMMKK"]]);
    expect(kinds(alignWords(groups, typed, { timing }))).toEqual([
      "pair",
      "missed",
      "missed",
      "missed",
      "pair",
      "pending",
    ]);
  });

  it("does not mark a copier who is behind as missing words", () => {
    // Typing group 1 while groups 2 and 3 have already been sent.
    const { typed, timing } = timed(groups.slice(0, 4), [[0, "KMKMM"], [1, "MKKMK"]], 3.5);
    expect(kinds(alignWords(groups.slice(0, 4), typed, { timing }))).toEqual([
      "pair",
      "pair",
      "pending",
      "pending",
    ]);
  });

  it("never pairs a word with copy typed before it started", () => {
    const sent = ["CQ", "CQ"];
    const timing: AlignTiming = {
      sent: [{ start: 0, end: 1 }, { start: 2, end: 3 }],
      typed: [1.5],
    };
    expect(alignWords(sent, ["CQ"], { timing })).toEqual([
      { kind: "pair", sent: 0, typed: 0 },
      { kind: "pending", sent: 1 },
    ]);
  });

  it("marks uncopied words at the end as missed when the session is over", () => {
    expect(kinds(alignWords(["TU", "73", "EE"], ["TU"], { final: true }))).toEqual([
      "pair",
      "missed",
      "missed",
    ]);
  });
});
