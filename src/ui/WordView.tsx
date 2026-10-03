import { For, Match, Switch } from "solid-js";
import type { DisplayWord } from "../session/display.ts";

export function WordView(props: { word: DisplayWord }) {
  return (
    <Switch>
      <Match when={props.word.kind === "pair" && props.word}>
        {(w) => (
          <Switch>
            <Match when={!w().graded}>
              <span class="word pending-grade">{w().typed}</span>
            </Match>
            <Match when={w().graded}>
              <span
                class="word"
                classList={{ wrong: !w().correct }}
                data-sent={w().correct ? undefined : w().sent}
              >
                <For each={w().chars}>
                  {(c) => <span class={c.kind}>{c.kind === "miss" ? c.sent : c.typed}</span>}
                </For>
              </span>
            </Match>
          </Switch>
        )}
      </Match>
      <Match when={props.word.kind === "missed" && props.word}>
        {(w) => (
          // Shown like a wrong word in which every character was missed.
          <span class="word wrong missed" title="missed">
            <For each={[...w().sent]}>{(c) => <span class="miss">{c}</span>}</For>
          </span>
        )}
      </Match>
      <Match when={props.word.kind === "extra" && props.word}>
        {(w) => (
          <span class="word">
            <span class="extra">{w().typed}</span>
          </span>
        )}
      </Match>
    </Switch>
  );
}
