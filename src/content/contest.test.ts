import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { isMorseChar } from "../morse/alphabet.ts";
import {
  CONTEST_KINDS,
  type ContestKind,
  contestSource,
  cutNumber,
  generateContestQso,
  zoneOf,
} from "./contest.ts";
import { seededRng } from "./source.ts";

const EXCHANGE: Record<ContestKind, RegExp> = {
  cqww: /^(5NN|599) [0-9TN]{1,2}$/,
  wpx: /^(5NN|599) [0-9TN]{3}$/,
  cwt: /^[A-Z]+ ([0-9TN]{3,5}|[A-Z]{1,3})$/,
  fd: /^[1-5][A-F] [A-Z]{2,3}$/,
};

describe("contest", () => {
  it("derives CQ zones from the prefix", () => {
    const r = seededRng(1);
    expect(zoneOf("SM7ABC", r)).toBe(14);
    expect(zoneOf("DL1XX", r)).toBe(14);
    expect(zoneOf("W1AW", r)).toBe(5);
    expect(zoneOf("K6XX", r)).toBe(3);
    expect(zoneOf("N0AX", r)).toBe(4);
    expect(zoneOf("JA1ABC", r)).toBe(25);
    expect(zoneOf("VK2XX", r)).toBe(30);
    const z = zoneOf("ZZ9ZZ", r);
    expect(z).toBeGreaterThanOrEqual(1);
    expect(z).toBeLessThanOrEqual(40);
  });

  it("cuts numbers to T and N", () => {
    expect(cutNumber("090", () => 0)).toBe("TNT");
    expect(cutNumber("090", () => 0.99)).toBe("090");
  });

  for (const kind of CONTEST_KINDS) {
    it(`${kind}: QSOs have the right shape`, () => {
      const r = seededRng(7);
      for (let i = 0; i < 100; i++) {
        const overs = generateContestQso(kind, "SM7ABC", "W1XYZ", i + 1, r);
        expect(overs[0]!.from).toBe("runner");
        expect(overs[0]!.words.join(" ")).toContain("SM7ABC");
        expect(overs[1]).toMatchObject({ from: "caller" });
        expect(overs[1]!.words[0]).toBe("W1XYZ");
        // Runner's report starts with the caller's call.
        const report = overs[2]!.words;
        expect(report[0]).toBe("W1XYZ");
        expect(report.slice(1).join(" ")).toMatch(EXCHANGE[kind]);
        // Caller's reply, after an optional TU/R.
        const reply = overs.at(-2)!.words.filter((w, i) => !(i === 0 && (w === "TU" || w === "R")));
        expect(reply.join(" ")).toMatch(EXCHANGE[kind]);
        expect(overs.at(-1)!.words[0]).toMatch(/^(TU|R)$/);
        for (const w of overs.flatMap((o) => o.words)) {
          expect([...w].every(isMorseChar), w).toBe(true);
        }
      }
    });
  }

  it("with my call set, only callers are sent and I run", () => {
    const src = contestSource("cqww", seededRng(3), "SM7XYZ");
    const words: string[] = [];
    for (let i = 0; i < 500; i++) words.push(src.next());
    expect(words).not.toContain("SM7XYZ");
    expect(words).not.toContain("CQ");
    expect(words).not.toContain("TEST");
    expect(words.join(" ")).toMatch(/(5NN|599) [0-9TN]{1,2}/);
  });

  it("encodes the runner's serial number", () => {
    const r = seededRng(5);
    for (const nr of [1, 7, 42, 109, 990]) {
      const overs = generateContestQso("wpx", "SM7ABC", "W1XYZ", nr, r);
      const sent = overs[2]!.words[2]!.replace(/T/g, "0").replace(/N/g, "9");
      expect(Number(sent)).toBe(nr);
    }
  });
});
