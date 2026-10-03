import { createEffect, createSignal, For, Match, onCleanup, Show, Switch } from "solid-js";
import { CwEngine } from "./audio/engine";
import { KOCH_MAX_LESSON } from "./content/koch";
import { isMorseChar } from "./morse/alphabet";
import { createSession } from "./session/session";
import { createSettings, THEMES } from "./settings/settings";
import { recordSession, emptyStats } from "./stats/stats";
import { localStatsStore } from "./stats/storage";
import { ConfigBar } from "./ui/ConfigBar";
import { CopyArea } from "./ui/CopyArea";
import { KochPanel } from "./ui/KochPanel";
import { canAdvance, Results } from "./ui/Results";
import { StatsView } from "./ui/StatsView";

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

  const restart = () => {
    setView("train");
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
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select")) return;
    if (e.metaKey || (e.ctrlKey && e.key !== "Backspace")) return;

    if (e.key === "Tab") {
      e.preventDefault();
      tabArmed = true;
      return;
    }
    if (e.key === "Enter" && tabArmed) {
      e.preventDefault();
      tabArmed = false;
      restart();
      return;
    }
    tabArmed = false;

    if (view() === "stats") {
      if (e.key === "Escape") setView("train");
      return;
    }

    const status = session.status();
    if (status === "idle" || status === "done") {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
        restart();
      } else if (status === "done" && e.key.toLowerCase() === "a") {
        advance();
      } else if (e.key === "Escape") {
        session.stop();
      }
      return;
    }

    // running
    if (e.key === "Escape") {
      session.stop();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      session.commit();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      session.backspace(e.ctrlKey || e.altKey);
    } else if (e.key.length === 1) {
      const c = e.key.toUpperCase();
      if (isMorseChar(c)) {
        e.preventDefault();
        session.type(c);
      }
    }
  };
  window.addEventListener("keydown", onKeyDown);
  onCleanup(() => window.removeEventListener("keydown", onKeyDown));

  const running = () => session.status() === "running";

  return (
    <div class="app">
      <header class="header">
        <div class="logo">
          <span class="glyph">-- --- .-. ... .</span>
          morse<span class="dim">type</span>
        </div>
        <nav class="nav">
          <button classList={{ active: view() === "train" }} onClick={() => setView("train")}>
            train
          </button>
          <button
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
          <Show when={settings.source === "koch" && !running()}>
            <KochPanel settings={settings} set={setSettings} />
          </Show>
        </Show>
      </div>

      <main class="stage">
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
            <CopyArea session={session} settings={settings} />
          </Match>
          <Match when={session.status() === "done" && session.result()}>
            {(r) => <Results session={session} result={r()} onRestart={restart} onAdvance={advance} />}
          </Match>
          <Match when={session.status() === "idle"}>
            <div class="prompt">
              <div>
                press <kbd>space</kbd> to start
              </div>
              <div class="tip">copy in your head · no paper, no counting dits · let the sound become the letter</div>
            </div>
          </Match>
        </Switch>
      </main>

      <footer class="footer">
        <div class="hints">
          <span><kbd>space</kbd> start / next word</span>
          <span><kbd>tab</kbd>+<kbd>enter</kbd> restart</span>
          <span><kbd>esc</kbd> stop</span>
        </div>
        <div class="themes">
          <For each={THEMES}>
            {(t) => (
              <button classList={{ active: settings.theme === t }} onClick={() => setSettings("theme", t)}>
                {t}
              </button>
            )}
          </For>
        </div>
      </footer>
    </div>
  );
}
