import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { createSource, SOURCE_KINDS } from "./index.ts";
import { isMorseChar } from "../morse/alphabet.ts";
import { callsign } from "./callsigns.ts";

describe("content sources", () => {
  for (const kind of SOURCE_KINDS) {
    it(`${kind} only produces sendable, non-empty words`, () => {
      const src = createSource({ kind, kochLesson: 10, groupSize: 5 });
      for (let i = 0; i < 500; i++) {
        const w = src.next();
        expect(w.length).toBeGreaterThan(0);
        expect([...w].every(isMorseChar), w).toBe(true);
      }
    });
  }

  it("callsigns look like callsigns", () => {
    for (let i = 0; i < 200; i++) {
      expect(callsign(Math.random)).toMatch(/^[A-Z0-9]{1,3}\d[A-Z]{1,3}(\/(P|M|QRP))?$/);
    }
  });
});
