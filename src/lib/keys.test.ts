import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { normalizeKey } from "./keys.ts";

const press = (
  key: string,
  mods: { ctrl?: boolean; alt?: boolean; meta?: boolean; code?: string } = {},
) =>
  normalizeKey({
    key,
    code: mods.code ?? "",
    ctrlKey: mods.ctrl ?? false,
    altKey: mods.alt ?? false,
    metaKey: mods.meta ?? false,
  });

describe("normalizeKey", () => {
  it("passes plain keys through", () => {
    expect(press("a")).toEqual({ key: "a", word: false });
    expect(press("Backspace")).toEqual({ key: "Backspace", word: false });
    expect(press(" ")).toEqual({ key: " ", word: false });
  });

  it("maps readline control chords", () => {
    expect(press("h", { ctrl: true })).toEqual({ key: "Backspace", word: false });
    expect(press("w", { ctrl: true })).toEqual({ key: "Backspace", word: true });
    expect(press("m", { ctrl: true })).toEqual({ key: "Enter", word: false });
    expect(press("j", { ctrl: true })).toEqual({ key: "Enter", word: false });
    expect(press("g", { ctrl: true })).toEqual({ key: "Escape", word: false });
    expect(press("[", { ctrl: true })).toEqual({ key: "Escape", word: false });
    expect(press("H", { ctrl: true })).toEqual({ key: "Backspace", word: false });
  });

  it("matches Ctrl+[ by physical key", () => {
    expect(press("å", { ctrl: true, code: "BracketLeft" })).toEqual({ key: "Escape", word: false });
  });

  it("deletes a word with Ctrl or Alt+Backspace", () => {
    expect(press("Backspace", { ctrl: true })).toEqual({ key: "Backspace", word: true });
    expect(press("Backspace", { alt: true })).toEqual({ key: "Backspace", word: true });
  });

  it("leaves other chords to the browser", () => {
    expect(press("c", { ctrl: true })).toBeNull();
    expect(press("h", { ctrl: true, alt: true })).toBeNull();
    expect(press("h", { meta: true })).toBeNull();
    expect(press("Backspace", { meta: true })).toBeNull();
  });
});
