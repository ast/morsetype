import { batch, createMemo, createSignal, onCleanup } from "solid-js";
import type { CwEngine, Transmission } from "../audio/engine.ts";
import { createSource } from "../content/index.ts";
import type { Settings } from "../settings/settings.ts";
import { alignWords, type WordOp } from "./align.ts";
import { computeResult, type SessionResult } from "./results.ts";

export type Status = "idle" | "running" | "done";

/** A sent word with its start/end on the AudioContext clock. */
export interface SentWord {
  text: string;
  start: number;
  end: number;
}

/** A copied word and when its first key was pressed (heard clock). */
interface TypedWord {
  text: string;
  at: number;
}

/** After the last word: minimum wait, and quiet time after the last keystroke. */
const END_GRACE = 2.5;
const KEY_GRACE = 1.5;

export type Session = ReturnType<typeof createSession>;

export function createSession(
  engine: CwEngine,
  settings: Settings,
  onFinish: (result: SessionResult) => void,
) {
  const [status, setStatus] = createSignal<Status>("idle");
  const [sent, setSent] = createSignal<SentWord[]>([]);
  const [typedWords, setTypedWords] = createSignal<TypedWord[]>([]);
  const typed = createMemo(() => typedWords().map((w) => w.text));
  const [current, setCurrent] = createSignal("");
  const [now, setNow] = createSignal(0);
  const [result, setResult] = createSignal<SessionResult | null>(null);
  const [finalOps, setFinalOps] = createSignal<WordOp[]>([]);

  let tx: Transmission | null = null;
  let txDone = false;
  let raf = 0;
  let lastKey = 0;
  let currentAt = 0;
  let generation = 0;

  const countWhere = (pred: (w: SentWord) => boolean) => sent().filter(pred).length;
  /** Words whose first element has been heard. */
  const startedCount = createMemo(() => countWhere((w) => w.start <= now()));
  /** Words that have been heard completely; only these get graded. */
  const endedCount = createMemo(() => countWhere((w) => w.end <= now()));
  const sounding = createMemo(() => sent().some((w) => w.start <= now() && now() < w.end));
  const origin = createMemo(() => sent()[0]?.start ?? null);
  const elapsed = createMemo(() => {
    const o = origin();
    return o === null ? 0 : Math.max(0, now() - o);
  });

  const heardWords = createMemo(() => sent().slice(0, startedCount()));
  const ops = createMemo<WordOp[]>(() =>
    alignWords(heardWords().map((w) => w.text), typed(), {
      timing: { sent: heardWords(), typed: typedWords().map((w) => w.at) },
    })
  );

  function tick() {
    setNow(engine.heardTime());
    if (status() === "running" && txDone) {
      const last = sent().at(-1);
      const t = now();
      if (!last || (t > last.end + END_GRACE && t > lastKey + KEY_GRACE)) finish();
    }
    if (status() === "running") raf = requestAnimationFrame(tick);
  }

  async function start() {
    reset();
    const gen = ++generation;
    await engine.ensure();
    if (gen !== generation) return;
    engine.setTone({ pitch: settings.pitch, volume: settings.volume });

    const source = createSource({
      kind: settings.source,
      kochLesson: settings.kochLesson,
      groupSize: settings.groupSize,
    });
    const mode = settings.mode;
    const wordCount = settings.wordCount;
    const seconds = settings.seconds;

    setStatus("running");
    tx = engine.transmit({
      next: (index, cursor) =>
        (mode === "words" ? index < wordCount : cursor < seconds) ? source.next() : null,
      params: () => ({
        charWpm: settings.charWpm,
        effWpm: Math.min(settings.effWpm, settings.charWpm),
        rise: settings.riseMs / 1000,
      }),
      onWord: (w) => setSent((s) => [...s, { text: w.text, start: w.start, end: w.end }]),
      onDone: () => {
        txDone = true;
      },
    });
    raf = requestAnimationFrame(tick);
  }

  function halt() {
    generation++;
    cancelAnimationFrame(raf);
    tx?.stop();
    tx = null;
  }

  function reset() {
    halt();
    txDone = false;
    lastKey = 0;
    batch(() => {
      setSent([]);
      setTypedWords([]);
      setCurrent("");
      setResult(null);
      setFinalOps([]);
      setStatus("idle");
    });
  }

  function finish() {
    if (status() !== "running") return;
    commit();
    halt();
    const words = sent();
    const texts = words.map((w) => w.text);
    // Grade everything that was sent; uncopied words at the end count as missed.
    const gradedOps = alignWords(texts, typed(), {
      final: true,
      timing: { sent: words, typed: typedWords().map((w) => w.at) },
    });
    const r = computeResult({
      sent: texts,
      typed: typed(),
      ops: gradedOps,
      source: settings.source,
      kochLesson: settings.source === "koch" ? settings.kochLesson : null,
      charWpm: settings.charWpm,
      effWpm: Math.min(settings.effWpm, settings.charWpm),
      seconds: words.length ? words.at(-1)!.end - words[0]!.start : 0,
    });
    batch(() => {
      setFinalOps(gradedOps);
      setResult(r);
      setStatus("done");
    });
    onFinish(r);
  }

  function touch() {
    lastKey = engine.heardTime();
  }

  function type(char: string) {
    if (status() !== "running") return;
    touch();
    if (current() === "") currentAt = lastKey;
    setCurrent((c) => c + char);
  }

  function backspace(word = false) {
    if (status() !== "running") return;
    touch();
    setCurrent((c) => (word ? "" : c.slice(0, -1)));
  }

  function commit() {
    const word = current();
    if (word === "") return;
    touch();
    batch(() => {
      setTypedWords((t) => [...t, { text: word, at: currentAt }]);
      setCurrent("");
    });
    // Copied the final word: no need to wait for the grace period.
    const last = sent().at(-1);
    if (
      status() === "running" && txDone && last && typed().length >= startedCount() &&
      now() >= last.end
    ) {
      queueMicrotask(finish);
    }
  }

  onCleanup(halt);

  return {
    status,
    sent,
    typed,
    current,
    result,
    ops,
    finalOps,
    startedCount,
    endedCount,
    sounding,
    elapsed,
    start,
    stop: reset,
    finish,
    type,
    backspace,
    commit,
  };
}
