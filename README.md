# morsetype

A minimal, monkeytype-style CW receive trainer. Listen to Morse generated in the
browser and type what you copy; the stream never stops for mistakes, and your copy
is aligned to what was sent afterwards.

- Exact ITU / PARIS timing, optional Farnsworth spacing (ARRL formula)
- Click-free keying: raised-cosine envelope rendered sample-exact and multiplied
  onto a continuous sine through Web Audio (`AudioBufferSourceNode → GainNode.gain`)
- Koch method (LCWO order), English words, ham abbreviations, callsigns, QSO snippets
- Per-word grading after each word has been heard; per-character stats in localStorage

## Develop

```sh
direnv allow        # or: nix develop
pnpm install
pnpm dev            # http://localhost:5173
pnpm test           # timing, envelope, alignment, content
pnpm build
```

## Keys

`space` start / commit word · `backspace` edit word · `tab`+`enter` restart · `esc` stop ·
`a` advance Koch lesson on the results screen (at ≥ 90 %)
