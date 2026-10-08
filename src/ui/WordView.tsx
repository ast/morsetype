import { For, Match, Switch } from "solid-js";
import { charLabel, PROSIGNS } from "../morse/alphabet.ts";
import type { DisplayWord } from "../session/display.ts";

/** One sent or typed character; prosigns are shown by name. */
function Char(props: { kind: string; c: string }) {
  return (
    <span class={props.kind} classList={{ prosign: props.c in PROSIGNS }}>
      {charLabel(props.c)}
    </span>
  );
}

function label(word: string): string {
  return [...word].map(charLabel).join("");
}

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
                data-sent={w().correct ? undefined : label(w().sent)}
              >
                <For each={w().chars}>
                  {(c) => <Char kind={c.kind} c={c.kind === "miss" ? c.sent : c.typed} />}
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
            <For each={[...w().sent]}>{(c) => <Char kind="miss" c={c} />}</For>
          </span>
        )}
      </Match>
      <Match when={props.word.kind === "extra" && props.word}>
        {(w) => (
          <span class="word">
            <span class="extra">{label(w().typed)}</span>
          </span>
        )}
      </Match>
    </Switch>
  );
}
