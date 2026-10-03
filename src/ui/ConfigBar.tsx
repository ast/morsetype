import { For, Show, type JSX } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { SOURCE_KINDS } from "../content";
import { clamp, LIMITS, SECONDS, WORD_COUNTS, type Settings } from "../settings/settings";

type Props = {
  settings: Settings;
  set: SetStoreFunction<Settings>;
  dimmed: boolean;
};

function Opt(props: { active: boolean; onClick: () => void; children: JSX.Element }) {
  return (
    <button class="opt" classList={{ active: props.active }} onClick={(e) => { props.onClick(); e.currentTarget.blur(); }}>
      {props.children}
    </button>
  );
}

function NumberField(props: {
  label: string;
  value: number;
  limits: readonly [number, number];
  step?: number;
  title?: string;
  onChange: (v: number) => void;
}) {
  const commit = (raw: string) => {
    const v = Number(raw);
    if (Number.isFinite(v)) props.onChange(clamp(v, props.limits));
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
        onChange={(e) => commit(e.currentTarget.value)}
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
        <For each={SOURCE_KINDS}>
          {(k) => (
            <Opt active={s().source === k} onClick={() => props.set("source", k)}>
              {k}
            </Opt>
          )}
        </For>
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
          onChange={(v) => props.set({ charWpm: v, effWpm: Math.min(s().effWpm, v) })}
        />
        <NumberField
          label="eff"
          title="effective speed (Farnsworth); equal to wpm disables it"
          value={Math.min(s().effWpm, s().charWpm)}
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
          />
        </label>
      </div>
    </div>
  );
}
