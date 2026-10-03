import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { alignChars, alignWords, editDistance } from "./align.ts";

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
