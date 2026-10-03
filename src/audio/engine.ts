import { spacing, wordTiming, type TimingParams } from "../morse/timing";
import { effectiveRise, renderEnvelope } from "./envelope";

/**
 * Audio graph:
 *
 *   Oscillator(sine) ──► keyer Gain (gain = 0) ──► volume Gain ──► destination
 *   BufferSource(envelope) ───────┘ (drives keyer.gain at audio rate)
 *
 * The oscillator runs continuously; the envelope buffers multiply it, so
 * keying is sample-accurate and the carrier phase is never reset.
 */

export interface ToneParams {
  pitch: number;
  volume: number;
}

export interface TransmitParams extends TimingParams {
  /** Rise/fall time in seconds. */
  rise: number;
}

/** A word as scheduled on the AudioContext clock (seconds). */
export interface ScheduledWord {
  index: number;
  text: string;
  start: number;
  end: number;
}

export interface TransmitOptions {
  /**
   * Next word to send, or null when the session has nothing more to send.
   * `cursor` is the start time of that word in seconds since the session origin.
   */
  next: (index: number, cursor: number) => string | null;
  /** Read for every word, so speed changes apply from the next word on. */
  params: () => TransmitParams;
  onWord: (word: ScheduledWord) => void;
  onDone: () => void;
}

const LOOKAHEAD = 1.5;
const TICK_MS = 50;
const PREROLL = 0.35;

export class CwEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private keyer: GainNode | null = null;
  private volume: GainNode | null = null;
  private tone: ToneParams = { pitch: 600, volume: 0.5 };

  /** Must be called from a user gesture the first time. */
  async ensure(): Promise<AudioContext> {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = this.tone.pitch;
      const keyer = ctx.createGain();
      keyer.gain.value = 0;
      const volume = ctx.createGain();
      volume.gain.value = this.tone.volume;
      osc.connect(keyer).connect(volume).connect(ctx.destination);
      osc.start();
      Object.assign(this, { ctx, osc, keyer, volume });
    }
    const ctx = this.ctx!;
    if (ctx.state !== "running") await ctx.resume();
    return ctx;
  }

  setTone(tone: ToneParams): void {
    this.tone = tone;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.osc!.frequency.setTargetAtTime(tone.pitch, t, 0.01);
    this.volume!.gain.setTargetAtTime(tone.volume, t, 0.01);
  }

  /**
   * Time on the AudioContext clock of what is reaching the speakers right now,
   * compensating for output latency.
   */
  heardTime(): number {
    const ctx = this.ctx;
    if (!ctx) return 0;
    const ts = ctx.getOutputTimestamp?.();
    if (ts?.contextTime !== undefined && ts.performanceTime !== undefined && ts.performanceTime > 0) {
      return ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
    }
    return ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
  }

  transmit(opts: TransmitOptions): Transmission {
    if (!this.ctx) throw new Error("CwEngine.ensure() must be called first");
    return new Transmission(this.ctx, this.keyer!, this.volume!, () => this.tone.volume, opts);
  }
}

export class Transmission {
  private readonly origin: number;
  private readonly sources: AudioBufferSourceNode[] = [];
  private cursor = 0;
  private index = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private finished = false;
  private lastEnd = 0;

  constructor(
    private readonly ctx: AudioContext,
    private readonly keyer: GainNode,
    private readonly volume: GainNode,
    private readonly volumeLevel: () => number,
    private readonly opts: TransmitOptions,
  ) {
    // Align the session origin to a sample so every buffer starts on an exact sample.
    const sr = ctx.sampleRate;
    this.origin = Math.ceil((ctx.currentTime + PREROLL) * sr) / sr;
    this.pump();
    this.timer = setInterval(() => this.pump(), TICK_MS);
  }

  private pump(): void {
    if (this.finished) {
      if (this.ctx.currentTime > this.lastEnd) this.finish();
      return;
    }
    const horizon = this.ctx.currentTime + LOOKAHEAD - this.origin;
    while (!this.finished && this.cursor < horizon) {
      const text = this.opts.next(this.index, this.cursor);
      if (text === null) {
        this.finished = true;
        break;
      }
      this.schedule(text);
    }
  }

  private schedule(text: string): void {
    const params = this.opts.params();
    const sp = spacing(params);
    const w = wordTiming(text, sp);
    if (w.elements.length === 0) return;

    const start = this.cursor;
    const elements = w.elements.map((e) => ({ on: start + e.on, off: start + e.off }));
    const sr = this.ctx.sampleRate;
    const chunk = renderEnvelope(elements, sr, effectiveRise(params.rise, sp.dit));

    const buffer = this.ctx.createBuffer(1, chunk.data.length, sr);
    buffer.copyToChannel(chunk.data as Float32Array<ArrayBuffer>, 0);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.keyer.gain);
    src.onended = () => {
      src.disconnect();
      const i = this.sources.indexOf(src);
      if (i >= 0) this.sources.splice(i, 1);
    };
    src.start(this.origin + chunk.startSample / sr);
    this.sources.push(src);

    const word: ScheduledWord = {
      index: this.index++,
      text: w.text,
      start: this.origin + start,
      end: this.origin + start + w.duration,
    };
    this.lastEnd = word.end;
    this.cursor = start + w.duration + sp.wordGap;
    this.opts.onWord(word);
  }

  private finish(): void {
    this.clearTimer();
    this.opts.onDone();
  }

  private clearTimer(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  /** Stop immediately, fading out to avoid a click if a tone is sounding. */
  stop(): void {
    this.clearTimer();
    this.finished = true;
    const t = this.ctx.currentTime;
    const fade = 0.008;
    this.volume.gain.cancelScheduledValues(t);
    this.volume.gain.setValueAtTime(this.volume.gain.value, t);
    this.volume.gain.linearRampToValueAtTime(0, t + fade);
    for (const src of this.sources.splice(0)) {
      src.onended = null;
      src.stop(t + fade);
      setTimeout(() => src.disconnect(), (fade + 0.05) * 1000);
    }
    this.volume.gain.setValueAtTime(this.volumeLevel(), t + fade + 0.02);
  }
}
