import { batch, createEffect, createSignal, For, Match, onCleanup, Show, Switch } from "solid-js";
import { CwEngine } from "./audio/engine.ts";
import { KOCH_MAX_LESSON } from "./content/koch.ts";
import { normalizeKey } from "./lib/keys.ts";
import { isMorseChar } from "./morse/alphabet.ts";
import { parseCopyInput } from "./session/copyInput.ts";
import { createSession } from "./session/session.ts";
import { createSettings, THEMES } from "./settings/settings.ts";
import { emptyStats, recordSession } from "./stats/stats.ts";
import { localStatsStore } from "./stats/storage.ts";
import { BookPanel } from "./ui/BookPanel.tsx";
import { ConfigBar } from "./ui/ConfigBar.tsx";
import { HamPanel } from "./ui/HamPanel.tsx";
import { CopyArea } from "./ui/CopyArea.tsx";
import { KochPanel } from "./ui/KochPanel.tsx";
import { canAdvance, Results } from "./ui/Results.tsx";
import { StatsView } from "./ui/StatsView.tsx";

type View = "train" | "stats";

export function App() {
  const [settings, setSettings] = createSettings();
  const [stats, setStats] = createSignal(localStatsStore.load());
  const [view, setView] = createSignal<View>("train");
  const engine = new CwEngine();

  const session = createSession(engine, settings, (result) => {
    const next = recordSession(stats(), result);
    setStats(next);
    localStatsStore.save(next);
  });

  createEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  });
  createEffect(() => engine.setTone({ pitch: settings.pitch, volume: settings.volume }));

  // Copy goes through a hidden input so the platform's own editing keys work
  // (e.g. ctrl-w / ctrl-u in Firefox with the GTK Emacs key theme).
  let copyInput!: HTMLInputElement;
  const onCopyInput = (e: InputEvent) => {
    if (e.isComposing) return;
    if (session.status() !== "running") {
      copyInput.value = "";
      return;
    }
    const { commits, current } = parseCopyInput(copyInput.value);
    batch(() => {
      for (const word of commits) {
        session.edit(word);
        session.commit();
      }
      session.edit(current);
    });
    // Write the normalised word back, even when the session state didn't change.
    copyInput.value = session.current();
  };
  createEffect(() => {
    const text = session.current();
    if (copyInput.value !== text) copyInput.value = text;
  });

  const restart = () => {
    setView("train");
    copyInput.focus();
    void session.start();
  };

  const advance = () => {
    const r = session.result();
    if (!r || !canAdvance(r)) return;
    setSettings("kochLesson", Math.min(r.kochLesson! + 1, KOCH_MAX_LESSON));
    restart();
  };

  let tabArmed = false;
  const onKeyDown = (e: KeyboardEvent) => {
    // Let text fields keep their keys; sliders and buttons don't take typing.
    const target = e.target as HTMLElement | null;
    if (target?.closest('input:not([type="range"]):not(.copy-input), textarea, select')) return;
    const k = normalizeKey(e);
    if (!k) return;
    // Our control chords never fall through to the browser (Ctrl+H history, Ctrl+G find…).
    if (e.ctrlKey) e.preventDefault();
    const key = k.key;

    // Tab+Enter restarts during and after a test; otherwise Tab moves focus as usual.
    if (key === "Tab" && view() === "train" && session.status() !== "idle") {
      e.preventDefault();
      tabArmed = true;
      return;
    }
    if (key === "Enter" && tabArmed) {
      e.preventDefault();
      tabArmed = false;
      restart();
      return;
    }
    tabArmed = false;

    if (view() === "stats") {
      if (key === "Escape") setView("train");
      return;
    }

    const status = session.status();
    if (status === "idle" || status === "done") {
      if (key === " " || key === "Enter") {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
        restart();
      } else if (status === "done" && key.toLowerCase() === "a") {
        advance();
      } else if (key === "Escape") {
        session.stop();
      }
      return;
    }

    // running: keys typed into the copy input reach the session through onCopyInput.
    const inCopy = target === copyInput;
    if (!inCopy) copyInput.focus();
    if (key === "Escape") {
      session.stop();
    } else if (key === "Enter" || (key === " " && !inCopy)) {
      e.preventDefault();
      session.commit();
    } else if (key === "Backspace") {
      e.preventDefault();
      session.backspace(k.word);
    } else if (key.length === 1 && !inCopy) {
      const c = key.toUpperCase();
      if (isMorseChar(c)) {
        e.preventDefault();
        session.type(c);
      }
    }
  };
  document.addEventListener("keydown", onKeyDown);
  onCleanup(() => document.removeEventListener("keydown", onKeyDown));

  const running = () => session.status() === "running";

  return (
    <div class="app">
      <header class="header">
        <div class="logo">
          <span class="glyph">-- --- .-. ... .</span>
          morse<span class="dim">type</span>
        </div>
        <nav class="nav">
          <button
            type="button"
            classList={{ active: view() === "train" }}
            onClick={() => setView("train")}
          >
            train
          </button>
          <button
            type="button"
            classList={{ active: view() === "stats" }}
            onClick={() => {
              session.stop();
              setView("stats");
            }}
          >
            stats
          </button>
        </nav>
      </header>

      <div>
        <Show when={view() === "train"}>
          <ConfigBar settings={settings} set={setSettings} dimmed={running()} />
          <Show when={!running()}>
            <Switch>
              <Match when={settings.source === "koch"}>
                <KochPanel settings={settings} set={setSettings} />
              </Match>
              <Match when={settings.source === "qso" || settings.source === "contest"}>
                <HamPanel settings={settings} set={setSettings} />
              </Match>
              <Match when={settings.source === "book"}>
                <BookPanel settings={settings} set={setSettings} />
              </Match>
            </Switch>
          </Show>
        </Show>
      </div>

      <main class="stage">
        <input
          ref={copyInput}
          class="copy-input"
          aria-label="copy"
          autocomplete="off"
          autocapitalize="off"
          spellcheck={false}
          tabIndex={-1}
          onInput={onCopyInput}
        />
        <Switch>
          <Match when={view() === "stats"}>
            <StatsView
              stats={stats()}
              onReset={() => {
                const empty = emptyStats();
                setStats(empty);
                localStatsStore.save(empty);
              }}
            />
          </Match>
          <Match when={session.status() === "running"}>
            <CopyArea session={session} />
          </Match>
          <Match when={session.status() === "done" && session.result()}>
            {(r) => (
              <Results session={session} result={r()} onRestart={restart} onAdvance={advance} />
            )}
          </Match>
          <Match when={session.status() === "loading"}>
            <div class="prompt">loading book…</div>
          </Match>
          <Match when={session.status() === "idle"}>
            <div class="prompt">
              <div>
                press <kbd>space</kbd> to start
              </div>
              <div class="tip">
                copy in your head · no paper, no counting dits · let the sound become the letter
              </div>
              <div class="tip">
                prosigns: <kbd>=</kbd> BT · <kbd>+</kbd> AR · <kbd>(</kbd> KN · <kbd>&lt;</kbd> SK
              </div>
              <dl class="keys">
                <dt>
                  <kbd>space</kbd> <kbd>ctrl-m</kbd>
                </dt>
                <dd>commit word</dd>
                <dt>
                  <kbd>bksp</kbd> <kbd>ctrl-h</kbd>
                </dt>
                <dd>delete character</dd>
                <dt>
                  <kbd>alt-bksp</kbd> <kbd>ctrl-w</kbd>
                </dt>
                <dd>delete word</dd>
                <dt>
                  <kbd>tab</kbd>+<kbd>enter</kbd>
                </dt>
                <dd>restart</dd>
                <dt>
                  <kbd>esc</kbd> <kbd>ctrl-g</kbd>
                </dt>
                <dd>stop</dd>
              </dl>
            </div>
          </Match>
        </Switch>
      </main>

      <footer class="footer">
        <div class="hints">
          <span>
            <kbd>space</kbd> start / next word
          </span>
          <span>
            <kbd>tab</kbd>+<kbd>enter</kbd> restart
          </span>
          <span>
            <kbd>esc</kbd> stop
          </span>
        </div>
        <div class="themes">
          <For each={THEMES}>
            {(t) => (
              <button
                type="button"
                classList={{ active: settings.theme === t }}
                onClick={() => setSettings("theme", t)}
              >
                {t}
              </button>
            )}
          </For>
        </div>
      </footer>
    </div>
  );
}
