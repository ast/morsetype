import { createMemo, For, Show } from "solid-js";
import { KOCH_ORDER } from "../content/koch";
import { topConfusions, type StatsData } from "../stats/stats";

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function StatsView(props: { stats: StatsData; onReset: () => void }) {
  const cells = createMemo(() =>
    KOCH_ORDER.map((c) => {
      const s = props.stats.chars[c];
      const acc = s && s.seen > 0 ? s.correct / s.seen : null;
      return { c, seen: s?.seen ?? 0, acc, confusions: topConfusions(props.stats, c) };
    }),
  );
  const recent = createMemo(() => [...props.stats.history].reverse().slice(0, 25));

  return (
    <div class="stats-view">
      <section>
        <h2 class="section-title">characters (koch order)</h2>
        <div class="char-grid">
          <For each={cells()}>
            {(cell) => (
              <div
                class="char-cell"
                classList={{ weak: cell.acc !== null && cell.acc < 0.9, unseen: cell.acc === null }}
                title={
                  cell.confusions.length
                    ? `copied as: ${cell.confusions.map(([t, n]) => `${t}×${n}`).join(" ")}`
                    : undefined
                }
              >
                <div class="c">{cell.c}</div>
                <div class="acc">{cell.acc === null ? "–" : `${pct(cell.acc)} · ${cell.seen}`}</div>
                <div class="bar">
                  <div style={{ width: cell.acc === null ? "0" : pct(cell.acc) }} />
                </div>
              </div>
            )}
          </For>
        </div>
      </section>
      <section>
        <h2 class="section-title">recent tests</h2>
        <Show when={recent().length > 0} fallback={<div class="empty">no tests yet</div>}>
          <table class="history">
            <thead>
              <tr>
                <th>date</th>
                <th>source</th>
                <th>speed</th>
                <th>words</th>
                <th>acc</th>
                <th>copy</th>
              </tr>
            </thead>
            <tbody>
              <For each={recent()}>
                {(h) => (
                  <tr>
                    <td>{new Date(h.date).toLocaleString()}</td>
                    <td>{h.source}{h.kochLesson !== null ? ` ${h.kochLesson}` : ""}</td>
                    <td>{h.effWpm < h.charWpm ? `${h.charWpm}/${h.effWpm}` : h.charWpm}</td>
                    <td>{h.words}</td>
                    <td>{pct(h.charAccuracy)}</td>
                    <td>{h.copyWpm.toFixed(1)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </section>
      <div class="actions">
        <button
          onClick={() => {
            if (confirm("Reset all stats and history?")) props.onReset();
          }}
        >
          reset stats
        </button>
      </div>
    </div>
  );
}
