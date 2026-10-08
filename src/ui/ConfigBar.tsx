import { For, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import {
  clamp,
  effectiveWpm,
  LIMITS,
  SECONDS,
  type Settings,
  WORD_COUNTS,
} from "../settings/settings.ts";
import { Opt } from "./Opt.tsx";
import { SourceSelect } from "./SourceSelect.tsx";

type Props = {
  settings: Settings;
  set: SetStoreFunction<Settings>;
  dimmed: boolean;
};

function NumberField(props: {
  label: string;
  value: number;
  limits: readonly [number, number];
  step?: number;
  title?: string;
  onChange: (v: number) => void;
}) {
  const commit = (input: HTMLInputElement) => {
    const raw = input.value.trim();
    const v = Number(raw);
    if (raw !== "" && Number.isFinite(v)) props.onChange(clamp(v, props.limits));
    // Show what was actually stored: the store may not change if the value was clamped
    // to what it already was, or was rejected.
    input.value = String(props.value);
  };
  return (
    <label class="field" title={props.title}>
      <input
        type="number"
        min={props.limits[0]}
        max={props.limits[1]}
        step={props.step ?? 1}
        value={props.value}
        style={{ width: `${String(props.value).length + 0.6}ch` }}
        onChange={(e) => commit(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
        }}
      />
      <span>{props.label}</span>
    </label>
  );
}

export function ConfigBar(props: Props) {
  const s = () => props.settings;
  return (
    <div class="config" classList={{ dimmed: props.dimmed }}>
      <div class="group">
        <SourceSelect settings={props.settings} set={props.set} />
      </div>
      <div class="group">
        <Opt active={s().mode === "words"} onClick={() => props.set("mode", "words")}>words</Opt>
        <Opt active={s().mode === "time"} onClick={() => props.set("mode", "time")}>time</Opt>
      </div>
      <div class="group">
        <Show
          when={s().mode === "words"}
          fallback={
            <For each={SECONDS}>
              {(n) => (
                <Opt active={s().seconds === n} onClick={() => props.set("seconds", n)}>
                  {n}
                </Opt>
              )}
            </For>
          }
        >
          <For each={WORD_COUNTS}>
            {(n) => (
              <Opt active={s().wordCount === n} onClick={() => props.set("wordCount", n)}>
                {n}
              </Opt>
            )}
          </For>
        </Show>
      </div>
      <div class="group">
        <NumberField
          label="wpm"
          title="character speed (PARIS)"
          value={s().charWpm}
          limits={LIMITS.wpm}
          onChange={(v) =>
            props.set({ charWpm: v, effWpm: effectiveWpm({ charWpm: v, effWpm: s().effWpm }) })}
        />
        <NumberField
          label="eff"
          title="effective speed (Farnsworth); equal to wpm disables it"
          value={effectiveWpm(s())}
          limits={[LIMITS.wpm[0], s().charWpm]}
          onChange={(v) => props.set("effWpm", v)}
        />
      </div>
      <div class="group">
        <NumberField
          label="hz"
          title="tone pitch"
          value={s().pitch}
          limits={LIMITS.pitch}
          step={10}
          onChange={(v) => props.set("pitch", v)}
        />
        <NumberField
          label="ms"
          title="rise/fall time"
          value={s().riseMs}
          limits={LIMITS.riseMs}
          step={0.5}
          onChange={(v) => props.set("riseMs", v)}
        />
        <label class="field" title="volume">
          <span>vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s().volume}
            onInput={(e) => props.set("volume", Number(e.currentTarget.value))}
            onPointerUp={(e) => e.currentTarget.blur()}
          />
        </label>
      </div>
    </div>
  );
}
