import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { isMorseChar } from "../morse/alphabet.ts";
import { AR, BT, generateQso, KN, phrases, qsoSource, SK } from "./qso.ts";
import { seededRng } from "./source.ts";

const rng = () => seededRng(42);

function stationLike(call: string) {
  return {
    call,
    name: "ALBIN",
    qth: "MALMO",
    rig: "K3",
    ant: "DIPOLE",
    pwr: "100W",
    wx: "SUNNY",
    temp: 18,
    rst: "579",
  };
}

describe("qso", () => {
  it("is a complete exchange between the same two stations", () => {
    const r = rng();
    for (let i = 0; i < 50; i++) {
      const overs = generateQso(r, stationLike("SM7ABC"), stationLike("W1XYZ"));
      expect(overs.length).toBeGreaterThanOrEqual(5);
      expect(overs[0]!.from).toBe("a");
      expect(overs[0]!.words[0]).toBe("CQ");
      // Alternating overs, each addressed "<other> DE <self>" after the CQ.
      for (let k = 1; k < overs.length; k++) {
        const o = overs[k]!;
        expect(o.from).not.toBe(overs[k - 1]!.from);
        const self = o.from === "a" ? "SM7ABC" : "W1XYZ";
        const other = o.from === "a" ? "W1XYZ" : "SM7ABC";
        expect(o.words.join(" ")).toMatch(new RegExp(`^(${other} )+DE ${self}\\b`));
      }
      // Ends with <SK>, possibly followed by dits.
      const last = overs.at(-1)!.words;
      expect(last.join(" ")).toMatch(new RegExp(`\\${SK}( E E| EE)?$`));
      // Only known callsigns appear.
      for (const w of overs.flatMap((o) => o.words)) {
        expect([...w].every(isMorseChar), w).toBe(true);
      }
    }
  });

  it("uses prosigns as single characters", () => {
    const overs = generateQso(rng(), stationLike("SM7ABC"), stationLike("W1XYZ"));
    const all = overs.flatMap((o) => o.words);
    expect(all).toContain(SK);
    expect(all.some((w) => w === KN || w === AR)).toBe(true);
    expect(all).not.toContain("SK");
    expect(all).not.toContain("KN");
  });

  it("splits overs into phrases at <BT>, keeping it", () => {
    expect(phrases(["A", "DE", "B", BT, "UR", "RST", "599", BT, "KN"])).toEqual([
      ["A", "DE", "B", BT],
      ["UR", "RST", "599", BT],
      ["KN"],
    ]);
  });

  it("reports boundaries at phrase ends", () => {
    const src = qsoSource(rng());
    let boundaries = 0;
    for (let i = 0; i < 400; i++) {
      const w = src.next();
      if (src.atBoundary!()) {
        boundaries++;
        expect(w === BT || /[K(+<E]$/.test(w) || w === "TU", w).toBe(true);
      }
    }
    expect(boundaries).toBeGreaterThan(20);
  });

  it("with my call set, only the other station transmits", () => {
    const src = qsoSource(rng(), "sm7xyz");
    const words: string[] = [];
    for (let i = 0; i < 2000; i++) words.push(src.next());
    const text = words.join(" ");
    expect(text).toContain("SM7XYZ");
    // Every "DE <call>" names the sender; it is never us.
    for (const m of text.matchAll(/ DE ([A-Z0-9/]+)/g)) expect(m[1]).not.toBe("SM7XYZ");
    // We get worked both as the CQ caller and as the answering station.
    expect(text).toMatch(/CQ CQ/);
    expect(text).toMatch(/SM7XYZ DE [A-Z0-9/]+ [A-Z0-9/]+/);
  });
});
