# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

morsetype is a browser-only, monkeytype-style CW (Morse) receive trainer: Web Audio generates Morse,
the user types what they copy, and copy is aligned to what was sent word by word. No backend.

## Commands

Toolchain is Deno (runtime, package manager, test runner, fmt, lint) provided by the Nix flake
(`direnv allow` or `nix develop`). Vite still needs npm deps in `node_modules/`, so run
`deno install` first.

```sh
deno task dev       # Vite dev server, http://localhost:5173
deno task test      # deno test (all *.test.ts)
deno task check     # type check
deno task build     # check, then static site in dist/
deno task ci        # fmt --check, lint, check, test — run before committing
deno fmt            # format (lineWidth 100)

deno test src/session/align.test.ts               # single file
deno test --filter "pairs identical copy"         # single test by name
```

Tests use `@std/testing/bdd` (`describe`/`it`) and `@std/expect`, colocated as `*.test.ts`. They
cover pure modules only (timing, envelope, alignment, content, results, settings) — the audio engine
and Solid UI are not unit-tested. Dependencies are declared in `deno.json` `imports` (no
package.json). Imports use explicit `.ts`/`.tsx` extensions. TypeScript is strict with
`noUncheckedIndexedAccess`, hence the frequent `!` on indexed access.

## Architecture

Stack: SolidJS + Vite, built with relative asset paths (`base: "./"`) so `dist/` works from any
subpath.

**Data flow.** `App.tsx` owns a single `CwEngine`, the persisted settings store, and stats. It
creates one `Session` (`src/session/session.ts`), which is the hub: on `start()` it snapshots a
`SessionConfig` from settings, builds a `WordSource` via `createSource` (`src/content/index.ts`),
and calls `engine.transmit()` with a `next(index, cursor)` callback that ends the stream in either
"words" or "time" mode. The engine reports each scheduled word back (`onWord`) with start/end times
on the AudioContext clock.

**One clock.** Everything time-related uses the engine's `heardTime()` (`ctx.currentTime` minus
output latency), not wall-clock time. Sent word start/end, keystroke times, and the rAF `tick` that
drives `now` are all on this clock. Grading depends on it: only words with `end <= now` are graded
("head copy": nothing is shown ahead of what's been heard), and alignment feeds keystroke and word
times into its costs.

**Audio** (`src/audio/`): a continuously running sine oscillator multiplied by keying-envelope
buffers rendered per word into a keyer GainNode's gain param. `envelope.ts` evaluates element times
analytically from `src/morse/timing.ts` (PARIS/ITU timing, ARRL Farnsworth) as absolute offsets from
a sample-aligned origin — preserve this to avoid drift and clicks. A look-ahead scheduler keeps ~1.5
s queued; `params()` is re-read per word so speed changes apply from the next word.

**Alignment** (`src/session/align.ts`): Needleman–Wunsch style DP over words (pair cost = normalized
edit distance, gap = 1) so a missed/extra/garbled word only affects itself, then per-character
Levenshtein alignment of paired words. With timing, `DEFAULT_COSTS` also uses a pending cost and a
copy-behind lag penalty (beyond `freeLag` words). These costs were tuned against a simulated copier,
so re-run `align.test.ts` after changing them. Live (`ops`) alignment treats trailing unreached sent
words as `pending`; `finish()` re-aligns with `final: true` so they count as `missed`. `results.ts`
turns ops into a `SessionResult`; `stats/stats.ts` folds results into persisted per-character stats.

**Content** (`src/content/`): each source is a `WordSource` (`next(): string`) taking an injectable
`Rng` for deterministic tests. Koch uses LCWO character order with the newest character weighted up.
Adding a source means extending `SourceKind`/`SOURCE_KINDS` and the `createSource` switch.

**Persistence**: all localStorage goes through `src/lib/persist.ts` (`readJson`/`writeJson`, which
never throw). Settings are a Solid store auto-saved and clamped/validated on load
(`settings/settings.ts`); stats go through the `StatsStore` interface (`stats/storage.ts`), which is
the intended seam for a future remote backend. Stored stats are versioned (`version: 1`).

**UI**: Solid components in `src/ui/`; global keyboard handling (space commits a word, Tab+Enter
restarts, Esc stops, `a` advances the Koch lesson) lives in `App.tsx`. Themes are CSS variables in
`styles/theme.css` selected via `data-theme` on `<html>`.
