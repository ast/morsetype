import { For } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { bookById, BOOKS } from "../content/books/catalog.ts";
import { CONTEST_KINDS, CONTEST_LABELS } from "../content/contest.ts";
import type { SourceKind } from "../content/index.ts";
import type { Settings } from "../settings/settings.ts";

/** Sources without a sub-choice, in display order. */
const PLAIN: readonly SourceKind[] = ["koch", "english", "ham", "callsigns", "numbers", "qso"];

/** One dropdown for the source; contests and books are listed as their own entries. */
export function SourceSelect(props: { settings: Settings; set: SetStoreFunction<Settings> }) {
  const value = () => {
    const s = props.settings;
    if (s.source === "contest") return `contest:${s.contest}`;
    if (s.source === "book") return `book:${s.book}`;
    return s.source;
  };
  /** The selected entry's text, to size the control to it (monospace, so ch works). */
  const label = () => {
    const s = props.settings;
    if (s.source === "contest") return `contest · ${CONTEST_LABELS[s.contest]}`;
    if (s.source === "book") return `book · ${bookById(s.book)?.short ?? s.book}`;
    return s.source;
  };
  const choose = (v: string) => {
    const [kind, sub] = v.split(":");
    if (kind === "contest" && sub) {
      props.set({ source: "contest", contest: sub as Settings["contest"] });
    } else if (kind === "book" && sub) props.set({ source: "book", book: sub });
    else props.set("source", kind as SourceKind);
  };
  return (
    <label class="field select" title="what to copy">
      <select
        value={value()}
        style={{ width: `${label().length + 0.5}ch` }}
        onChange={(e) => {
          choose(e.currentTarget.value);
          e.currentTarget.blur();
        }}
      >
        <For each={PLAIN}>{(k) => <option value={k}>{k}</option>}</For>
        <optgroup label="contest">
          <For each={CONTEST_KINDS}>
            {(k) => <option value={`contest:${k}`}>contest · {CONTEST_LABELS[k]}</option>}
          </For>
        </optgroup>
        <optgroup label="book">
          <For each={BOOKS}>
            {(b) => <option value={`book:${b.id}`}>book · {b.short}</option>}
          </For>
        </optgroup>
      </select>
    </label>
  );
}
