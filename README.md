# morsetype

A minimal, [monkeytype](https://monkeytype.com)-style CW receive trainer. Listen to
Morse code generated in the browser and type what you copy. The stream never stops
for mistakes: your copy is aligned to what was sent, word by word, so a missed or
garbled word only costs you that word — just like copying on the air.

## Features

- **Exact timing** — ITU-R M.1677-1 / PARIS standard (dit = 1200 / wpm ms, dah = 3,
  gaps 1 / 3 / 7 units), with optional **Farnsworth** spacing using the ARRL formula.
- **Click-free keying** — raised-cosine rise/fall (default 5 ms), edges centred on the
  ideal element boundaries so the half-amplitude points land exactly on time.
- **Koch method** — LCWO character order, random groups from the lesson's characters
  with the newest one weighted up, and an offer to advance at ≥ 90 % accuracy.
- **Content** — Koch groups, common English words, ham abbreviations & Q-codes,
  realistic callsigns, and rag-chew QSO snippets.
- **Head copy** — nothing is shown ahead of the cursor. Each word is graded only after
  it has been heard completely; wrong words reveal what was sent.
- **Stats** — per-character accuracy, which characters you confuse with which, and
  session history, stored locally in the browser.
- **Themes** — serika, carbon, paper, phosphor.

## How it works

### Audio

```
OscillatorNode(sine) ──► GainNode (keyer, gain = 0) ──► GainNode (volume) ──► out
AudioBufferSourceNode(envelope) ──┘  drives keyer.gain at audio rate
```

The sine oscillator runs continuously, so the carrier phase is never reset. For each
word the keying envelope is rendered into a buffer at the context's sample rate and
connected to the keyer's gain parameter, which multiplies it onto the sine. Element
times are computed as absolute offsets from a sample-aligned session origin and the
envelope is evaluated analytically per sample, so there is no accumulated drift.
A look-ahead scheduler keeps about 1.5 s of audio queued; speed changes apply from the
next word.

Measured on a rendered PARIS PARIS at 20 wpm, every element edge is within 0.1 ms of
ideal, and the largest sample-to-sample step equals that of the bare carrier (no clicks).

### Copy flow

Press space after each word. Typed words are aligned to sent words with a
Needleman–Wunsch style DP (pair cost = normalised edit distance, gap cost = 1), and
sent words you haven't reached yet are treated as pending, not missed. Paired words are
then aligned per character for colouring and statistics.

## Develop

Requires Nix with flakes; [nix-direnv](https://github.com/nix-community/nix-direnv) is
recommended.

```sh
direnv allow        # or: nix develop
pnpm install
pnpm dev            # http://localhost:5173
pnpm test           # timing, envelope, alignment, content, results
pnpm typecheck
pnpm build          # static site in dist/
```

Stack: TypeScript (strict), SolidJS, Vite, Vitest. No backend; everything runs in the
browser.

### Layout

```
src/
  morse/     alphabet, PARIS / Farnsworth timing
  audio/     envelope rendering, Web Audio engine & scheduler
  content/   Koch, English words, ham vocabulary, callsigns, QSOs
  session/   session store, word/char alignment, results
  stats/     aggregated stats and the storage interface
  settings/  persisted settings
  ui/        Solid components
  styles/    themes (CSS variables) and layout
```

## Keys

| Key               | Action                                   |
| ----------------- | ---------------------------------------- |
| `space`           | start a test / commit the current word   |
| `backspace`       | delete a character (`ctrl` = whole word) |
| `tab` + `enter`   | restart                                  |
| `esc`             | stop                                     |
| `a`               | advance Koch lesson (results, ≥ 90 %)    |

## Roadmap

- Band noise, QSB fading and QRM
- Prosigns (AR, SK, BT, KN …)
- Alternative edge shapes (e.g. Blackman)
- Optional backend for synced stats (Rust / axum)

## License

Not yet specified.
