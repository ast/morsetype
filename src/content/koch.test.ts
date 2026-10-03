import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { KOCH_MAX_LESSON, KOCH_ORDER, kochChars, kochNewChar, kochSource } from "./koch.ts";
import { isMorseChar } from "../morse/alphabet.ts";

describe("koch", () => {
  it("has 41 unique sendable characters", () => {
    expect(KOCH_ORDER).toHaveLength(41);
    expect(new Set(KOCH_ORDER).size).toBe(41);
    expect(KOCH_ORDER.every(isMorseChar)).toBe(true);
    expect(KOCH_MAX_LESSON).toBe(40);
  });

  it("lesson 1 is K M and each lesson adds one char", () => {
    expect(kochChars(1)).toEqual(["K", "M"]);
    expect(kochNewChar(2)).toBe("U");
    expect(kochChars(KOCH_MAX_LESSON)).toHaveLength(41);
  });

  it("generates groups only from lesson characters", () => {
    const src = kochSource(5, 5, Math.random);
    const allowed = new Set(kochChars(5));
    for (let i = 0; i < 200; i++) {
      const g = src.next();
      expect(g).toHaveLength(5);
      expect([...g].every((c) => allowed.has(c))).toBe(true);
    }
  });
});
