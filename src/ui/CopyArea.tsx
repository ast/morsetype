import { createEffect, createMemo, For, on, Show } from "solid-js";
import type { Session } from "../session/session.ts";
import { buildDisplay } from "../session/display.ts";
import type { Settings } from "../settings/settings.ts";
import { WordView } from "./WordView.tsx";

/** The live copy line: graded words, the word being typed, and nothing ahead. */
export function CopyArea(props: { session: Session; settings: Settings }) {
  const s = props.session;
  let inner!: HTMLDivElement;
  let caret!: HTMLSpanElement;

  const words = createMemo(() =>
    buildDisplay(
      s.ops(),
      s.sent().map((w) => w.text),
      s.typed(),
      s.endedCount(),
    )
  );

  const progress = createMemo(() => {
    if (props.settings.mode === "time") {
      return String(Math.max(0, Math.ceil(props.settings.seconds - s.elapsed())));
    }
    return `${s.startedCount()}/${props.settings.wordCount}`;
  });

  // Keep the caret on the second visible line, monkeytype style.
  createEffect(
    on([words, s.current], () => {
      const line = parseFloat(getComputedStyle(inner).lineHeight) || 0;
      const row = Math.round(caret.parentElement!.offsetTop / (line || 1));
      inner.style.transform = `translateY(${-Math.max(0, row - 1) * line}px)`;
    }),
  );

  return (
    <div class="copy">
      <div class="meta">
        <span>{progress()}</span>
        <span class="pulse" classList={{ on: s.sounding() }} title="sending" />
      </div>
      <div class="words" classList={{ typing: s.current() !== "" }}>
        <div class="words-inner" ref={inner}>
          <For each={words()}>{(w) => <WordView word={w} />}</For>
          <span class="word current">
            {s.current()}
            <span class="caret" ref={caret} />
          </span>
        </div>
      </div>
      <Show when={s.typed().length === 0 && s.current() === ""}>
        <div class="prompt">
          <span class="tip">
            listen · type what you copy · <kbd>space</kbd> after each word
          </span>
        </div>
      </Show>
    </div>
  );
}
