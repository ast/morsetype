import { createSignal, For, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { bookById, BOOKS } from "../content/books/catalog.ts";
import { loadBook } from "../content/books/index.ts";
import { splitWords } from "../content/books/prepare.ts";
import { getPosition, setPosition } from "../content/books/progress.ts";
import type { Settings } from "../settings/settings.ts";
import { Opt } from "./Opt.tsx";

/**
 * Pick a book and see how far you have read. Mounted only while no session runs, so the
 * saved position can simply be read on mount and after each change.
 */
export function BookPanel(props: { settings: Settings; set: SetStoreFunction<Settings> }) {
  const [position, setPos] = createSignal(getPosition(props.settings.book));
  const [size, setSize] = createSignal<number | null>(null);

  const refresh = (id: string) => {
    setPos(getPosition(id));
    setSize(null);
    loadBook(id).then((text) => {
      if (id === props.settings.book) setSize(splitWords(text).length);
    }, () => {});
  };
  refresh(props.settings.book);

  const choose = (id: string) => {
    props.set("book", id);
    refresh(id);
  };
  const move = (index: number) => {
    setPosition(props.settings.book, index);
    setPos(index);
  };
  const book = () => bookById(props.settings.book);

  return (
    <div class="panel book">
      <span class="opts">
        <For each={BOOKS}>
          {(b) => (
            <Opt active={props.settings.book === b.id} onClick={() => choose(b.id)}>{b.short}</Opt>
          )}
        </For>
      </span>
      <span class="hint" title={`${book()?.title ?? ""} — ${book()?.author ?? ""}`}>
        <Show when={size() !== null} fallback={`word ${position().toLocaleString()}`}>
          word {position().toLocaleString()} / {size()!.toLocaleString()} ·{" "}
          {Math.round((position() / size()!) * 100)}%
        </Show>
      </span>
      <span>
        <button type="button" class="step" onClick={() => move(0)} title="read from the start">
          restart
        </button>
        <button
          type="button"
          class="step"
          onClick={() => move(Math.floor(Math.random() * (size() ?? 1)))}
          title="jump to a random place in the book"
        >
          random passage
        </button>
      </span>
    </div>
  );
}
