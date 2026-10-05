import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { parseCopyInput } from "./copyInput.ts";

describe("parseCopyInput", () => {
  it("keeps an unfinished word as current", () => {
    expect(parseCopyInput("AB")).toEqual({ commits: [], current: "AB" });
    expect(parseCopyInput("")).toEqual({ commits: [], current: "" });
  });

  it("commits words followed by whitespace", () => {
    expect(parseCopyInput("ab ")).toEqual({ commits: ["AB"], current: "" });
    expect(parseCopyInput("cq cq")).toEqual({ commits: ["CQ"], current: "CQ" });
    expect(parseCopyInput("a\tb  c")).toEqual({ commits: ["A", "B"], current: "C" });
  });

  it("drops characters without a Morse code", () => {
    expect(parseCopyInput("s#m5~")).toEqual({ commits: [], current: "SM5" });
    expect(parseCopyInput("## x")).toEqual({ commits: [], current: "X" });
  });

  it("commits nothing for bare whitespace", () => {
    expect(parseCopyInput(" ")).toEqual({ commits: [], current: "" });
  });
});
