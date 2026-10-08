import { createEffect, createSignal, on, Show } from "solid-js";
import { bookById } from "../content/books/catalog.ts";
import { loadBook } from "../content/books/index.ts";
import { splitWords } from "../content/books/prepare.ts";
import { getPosition, setPosition } from "../content/books/progress.ts";
import type { Settings } from "../settings/settings.ts";

/**
 * How far you have read in the chosen book. Mounted only while no session runs, so the saved
 * position can simply be read when the panel appears or the book changes.
 */
export function BookPanel(props: { settings: Settings }) {
  const [position, setPos] = createSignal(getPosition(props.settings.book));
  const [size, setSize] = createSignal<number | null>(null);

  const refresh = (id: string) => {
    setPos(getPosition(id));
    setSize(null);
    loadBook(id).then((text) => {
      if (id === props.settings.book) setSize(splitWords(text).length);
    }, () => {});
  };
  createEffect(on(() => props.settings.book, refresh));
  const move = (index: number) => {
    setPosition(props.settings.book, index);
    setPos(index);
  };
  const book = () => bookById(props.settings.book);

  return (
    <div class="panel book">
      <span class="title">{book()?.title} · {book()?.author}</span>
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
