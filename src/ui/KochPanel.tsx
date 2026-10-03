import { For } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { KOCH_MAX_LESSON, KOCH_MIN_LESSON, kochChars } from "../content/koch.ts";
import { clamp, LIMITS, type Settings } from "../settings/settings.ts";

export function KochPanel(props: { settings: Settings; set: SetStoreFunction<Settings> }) {
  const lesson = () => props.settings.kochLesson;
  const chars = () => kochChars(lesson());
  const setLesson = (n: number) =>
    props.set("kochLesson", clamp(n, [KOCH_MIN_LESSON, KOCH_MAX_LESSON]));
  const setGroup = (n: number) => props.set("groupSize", clamp(n, LIMITS.groupSize));

  return (
    <div class="koch">
      <span>
        <button
          type="button"
          class="step"
          onClick={() => setLesson(lesson() - 1)}
          title="previous lesson"
        >
          −
        </button>
        lesson {lesson()}
        <button
          type="button"
          class="step"
          onClick={() => setLesson(lesson() + 1)}
          title="next lesson"
        >
          +
        </button>
      </span>
      <span class="chars">
        <For each={chars()}>
          {(c, i) => (
            <span classList={{ new: i() === chars().length - 1 && lesson() > 1 }}>{c}</span>
          )}
        </For>
      </span>
      <span>
        <button
          type="button"
          class="step"
          onClick={() => setGroup(props.settings.groupSize - 1)}
          title="shorter groups"
        >
          −
        </button>
        group {props.settings.groupSize}
        <button
          type="button"
          class="step"
          onClick={() => setGroup(props.settings.groupSize + 1)}
          title="longer groups"
        >
          +
        </button>
      </span>
    </div>
  );
}
