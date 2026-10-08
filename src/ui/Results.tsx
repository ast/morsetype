import { createMemo, For, Show } from "solid-js";
import { KOCH_MAX_LESSON, kochNewChar } from "../content/koch.ts";
import type { Session } from "../session/session.ts";
import { buildDisplay } from "../session/display.ts";
import type { SessionResult } from "../session/results.ts";
import { WordView } from "./WordView.tsx";
import { formatSpeed, pct } from "../lib/format.ts";
import { charLabel } from "../morse/alphabet.ts";

export const ADVANCE_THRESHOLD = 0.9;

export function canAdvance(r: SessionResult): boolean {
  return r.kochLesson !== null && r.kochLesson < KOCH_MAX_LESSON &&
    r.charAccuracy >= ADVANCE_THRESHOLD;
}

export function Results(props: {
  session: Session;
  result: SessionResult;
  onRestart: () => void;
  onAdvance: () => void;
}) {
  const r = () => props.result;
  const review = createMemo(() =>
    buildDisplay(
      props.session.finalOps(),
      props.session.sent().map((w) => w.text),
      props.session.typed(),
    )
  );
  const missed = createMemo(() =>
    Object.entries(r().perChar)
      .filter(([, s]) => s.correct < s.seen)
      .map(([c, s]) => ({ c, miss: s.seen - s.correct, seen: s.seen }))
      .sort((a, b) => b.miss - a.miss)
      .slice(0, 8)
  );

  return (
    <div class="results">
      <div>
        <div class="big">
          <div class="label">acc</div>
          <div class="value">{pct(r().charAccuracy)}</div>
        </div>
        <div class="big">
          <div class="label">copy</div>
          <div class="value">{r().copyWpm.toFixed(1)}</div>
        </div>
      </div>
      <div class="small-stats">
        <Stat
          label="speed"
          value={formatSpeed(r())}
        />
        <Stat label="words" value={`${r().wordsCorrect}/${r().words}`} />
        <Stat
          label="chars"
          value={`${r().chars.ok}/${r().chars.sub}/${r().chars.miss}/${r().chars.extra}`}
          title="correct / wrong / missed / extra"
        />
        <Stat label="time" value={`${Math.round(r().seconds)}s`} />
        <Show when={r().kochLesson !== null}>
          <Stat label="lesson" value={String(r().kochLesson)} />
        </Show>
        <Show when={missed().length > 0}>
          <Stat label="missed chars" value={missed().map((m) => charLabel(m.c)).join(" ")} />
        </Show>
      </div>
      <div class="review">
        <div class="words">
          <div class="words-inner">
            <For each={review()}>{(w) => <WordView word={w} />}</For>
          </div>
        </div>
      </div>
      <div class="actions">
        <button type="button" onClick={() => props.onRestart()}>
          next test <kbd>tab</kbd>+<kbd>enter</kbd>
        </button>
        <Show when={canAdvance(r())}>
          <button type="button" class="advance" onClick={() => props.onAdvance()}>
            ≥ 90% · advance to lesson {r().kochLesson! + 1} (adds{" "}
            {charLabel(kochNewChar(r().kochLesson! + 1))}) <kbd>a</kbd>
          </button>
        </Show>
      </div>
    </div>
  );
}

function Stat(props: { label: string; value: string; title?: string }) {
  return (
    <div title={props.title}>
      <div class="label">{props.label}</div>
      <div class="value">{props.value}</div>
    </div>
  );
}
