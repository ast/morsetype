import { For, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { CONTEST_KINDS, CONTEST_LABELS } from "../content/contest.ts";
import { sanitizeCall, type Settings } from "../settings/settings.ts";
import { Opt } from "./Opt.tsx";

/** Options for the QSO and contest sources: your callsign, and which contest. */
export function HamPanel(props: { settings: Settings; set: SetStoreFunction<Settings> }) {
  const commit = (input: HTMLInputElement) => {
    props.set("myCall", sanitizeCall(input.value));
    input.value = props.settings.myCall;
  };
  return (
    <div class="panel">
      <Show when={props.settings.source === "contest"}>
        <span class="opts">
          <For each={CONTEST_KINDS}>
            {(k) => (
              <Opt
                active={props.settings.contest === k}
                onClick={() => props.set("contest", k)}
              >
                {CONTEST_LABELS[k]}
              </Opt>
            )}
          </For>
        </span>
      </Show>
      <label
        class="field"
        title={props.settings.source === "contest"
          ? "with your call set you run the pile-up: only the callers are sent"
          : "with your call set the other station works you: only their overs are sent"}
      >
        <span>my call</span>
        <input
          type="text"
          class="call"
          placeholder="both sides"
          value={props.settings.myCall}
          onChange={(e) => commit(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
          }}
        />
      </label>
      <span class="hint">
        {props.settings.myCall === ""
          ? "both stations are sent"
          : props.settings.source === "contest"
          ? `you run · callers work ${props.settings.myCall}`
          : `only the station working ${props.settings.myCall} is sent`}
      </span>
    </div>
  );
}
