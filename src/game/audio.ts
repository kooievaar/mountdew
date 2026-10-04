// Mount Dew voice studio. MIT License. Made by Dan with Grok.
import workletSource from "../../public/game/mixer-worklet.js?raw";
import { DITHER_RPDF, DITHER_TPDF, ditherInto, ditherParams, ditherScale, ditherStep, setDitherParams, type DitherParams } from "./dither";

export type StudioParams = {
  eq: { f: number; g: number; q: number }[];
  phatFreq: number;
  phatDrive: number;
  phatMix: number;
  ampDrive: number;
  replay: "none" | "gain" | "prevent";
  preamp: number;
  target: number;
  peak: number;
  air: number;
  width: number;
  exciter: number;
  eqOn: boolean;
};

export type MixStrip = {
  trim: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  pfl: boolean;
  fader: number;
  pol: number;
  hpf: number;
  aux: number;
  pre: boolean;
};

export type MixState = {
  ch: MixStrip[];
  auxReturn: number;
  duck: number;
};

export type MixMeters = { peak: number[]; hold: number[] };

export type StudioViz = {
  spectrum: Uint8Array;
  eq: Float32Array;
  freq: Float32Array;
  centers: Float32Array;
  dither: Float32Array;
  rate: number;
  eqOn: boolean;
};

const STUDIO_DEFAULT: StudioParams = {
  eq: [
    { f: 100, g: 0, q: 1 },
    { f: 250, g: 0, q: Math.SQRT2 },
    { f: 1000, g: 0, q: Math.SQRT2 },
    { f: 4000, g: 0, q: Math.SQRT2 },
    { f: 10000, g: 0, q: 1 },
  ],
  phatFreq: 90,
  phatDrive: 0.4,
  phatMix: 0,
  ampDrive: 0,
  replay: "none",
  preamp: 0,
  target: -12,
  peak: 50,
  air: 0,
  width: 1,
  exciter: 0,
  eqOn: true,
};

export type AudioBus = {
  unlock: () => void;
  setVolume: (v: number) => void;
  setDither: (next: Partial<DitherParams>) => void;
  setStudio: (next: Partial<Omit<StudioParams, "eq">> & { eq?: ({ f?: number; g?: number; q?: number } | undefined)[] }) => void;
  getStudioViz: () => StudioViz;
  setMix: (next: Partial<MixState> & { ch?: (Partial<MixStrip> | undefined)[] }) => void;
  getMeters: () => MixMeters;
  setListener: (x: number, y: number, z: number) => void;
  jump: (pitch: number) => void;
  hopAt: (x: number, y: number, z: number, pitch: number) => void;
  step: (water: boolean) => void;
  shot: (kind: string) => void;
  shotAt: (x: number, y: number, z: number, kind: string, self: boolean) => void;
  ding: () => void;
  boom: () => void;
  boomAt: (x: number, y: number, z: number) => void;
  voice: (pitch: number, kind: string, charId?: string) => void;
  voiceAt: (x: number, y: number, z: number, pitch: number, kind: string, line: string, self: boolean, charId?: string) => void;
  help: (pitch: number) => void;
  helpAt: (x: number, y: number, z: number, pitch: number, self: boolean) => void;
  splash: () => void;
  splashAt: (x: number, y: number, z: number) => void;
  laugh: () => void;
  laughAt: (x: number, y: number, z: number) => void;
  giggle: (x: number, y: number, z: number) => void;
  train: () => void;
  trainAt: (x: number, y: number, z: number) => void;
  stinger: () => void;
  announce: (text: string) => void;
  comment: (text: string) => void;
  intro: () => void;
  cured: () => void;
  weather: (kind: string) => void;
  owl: () => void;
  birds: () => void;
  tick: (dt: number, weather: string, moving: boolean, water: boolean) => void;
  dispose: () => void;
};

const HEAR = 28;
const HEAR_FULL = 7;

const ID = {
  jump: 0,
  land: 1,
  shot: 2,
  rocket: 3,
  flame: 4,
  melee: 5,
  boom: 6,
  splash: 7,
  train: 8,
  step: 9,
  water: 10,
  ding: 11,
  bird: 12,
  owl: 13,
  a: 14,
  e: 15,
  i: 16,
  o: 17,
  u: 18,
  laugh: 19,
  wind: 20,
  rain: 21,
  river: 22,
  drink: 23,
} as const;

type Item = {
  id: number;
  delay: number;
  gain: number;
  rate: number;
  pan: number;
  lane: number;
  loop?: boolean;
};

export function createAudio(): AudioBus {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let worldBus: GainNode | null = null;
  let node: AudioWorkletNode | null = null;
  let vol = 0.7;
  let mode: "boot" | "worklet" | "buffer" = "boot";
  let started = false;
  let windOn = false;
  const phraseSlot: string[] = [];
  const envelopes = new Map<string, Float64Array>();
  const loops = new Set<number>();
  let introDone = false;
  let stepAcc = 0;
  const ear = { x: 0, y: 8, z: 0 };
  const pcm: Float32Array[] = [];
  const banks: AudioBuffer[] = [];
  const batch: Item[] = [];
  let flushQueued = false;

  function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function normalize(data: Float32Array, amp: number) {
    return ditherInto(data, amp);
  }

  function chirp(sr: number, f0: number, f1: number, dur: number, amp: number) {
    const len = Math.max(1, Math.floor(sr * dur));
    const b = new Float32Array(len);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const k = i / len;
      const f = f0 * Math.pow(f1 / f0, k);
      ph += (2 * Math.PI * f) / sr;
      const env = Math.min(1, i / (sr * 0.01)) * Math.pow(1 - k, 1.15);
      b[i] = Math.sin(ph) * env;
    }
    return normalize(b, amp);
  }

  function noise(sr: number, dur: number, cut: number, amp: number, seed: number) {
    const len = Math.max(1, Math.floor(sr * dur));
    const b = new Float32Array(len);
    const next = rng(seed);
    let y = 0;
    const c = Math.min(0.92, cut);
    for (let i = 0; i < len; i++) {
      const white = next() * 2 - 1;
      y += c * (white - y);
      const k = i / len;
      const env = Math.min(1, i / (sr * 0.006)) * (1 - k);
      b[i] = y * env;
    }
    return normalize(b, amp);
  }

  function vowel(sr: number, f0: number, formants: number[], amp: number) {
    const len = Math.max(1, Math.floor(sr * 0.12));
    const b = new Float32Array(len);
    const ph = new Array(formants.length + 1).fill(0);
    for (let i = 0; i < len; i++) {
      const k = i / len;
      const env = Math.min(1, i / (sr * 0.01)) * Math.pow(1 - k, 0.65);
      ph[0] += (2 * Math.PI * f0) / sr;
      let s = Math.sin(ph[0]) * 0.55;
      for (let f = 0; f < formants.length; f++) {
        ph[f + 1] += (2 * Math.PI * formants[f]) / sr;
        s += Math.sin(ph[f + 1]) * (0.22 - f * 0.04);
      }
      const n = ((i * 17) % 100) / 100 - 0.5;
      const bite = i < sr * 0.018 ? n * (1 - i / (sr * 0.018)) * 0.35 : 0;
      b[i] = (s + bite) * env;
    }
    return normalize(b, amp);
  }

  function laughLine(sr: number) {
    const syl = [520, 640, 560, 820, 940, 800, 500, 630, 560];
    const gap = 0.145;
    const sylDur = 0.12;
    const len = Math.floor(sr * (syl.length * gap + 0.05));
    const b = new Float32Array(len);
    for (let n = 0; n < syl.length; n++) {
      const start = Math.floor(sr * n * gap);
      const count = Math.floor(sr * sylDur);
      let ph = 0;
      let ph2 = 0;
      const f = syl[n];
      for (let i = 0; i < count && start + i < len; i++) {
        const k = i / count;
        const env = Math.min(1, i / (sr * 0.014)) * (1 - k) * (1 - k);
        ph += (2 * Math.PI * f) / sr;
        ph2 += (2 * Math.PI * f * 2.02) / sr;
        b[start + i] += (Math.sin(ph) * 0.72 + Math.sin(ph2) * 0.28) * env;
      }
    }
    return normalize(b, 0.95);
  }

  function push(data: Float32Array) {
    pcm.push(data);
    const ab = ctx!.createBuffer(1, data.length, ctx!.sampleRate);
    ab.getChannelData(0).set(data);
    banks.push(ab);
  }

  function buildBuffers() {
    if (!ctx || pcm.length) return;
    const sr = ctx.sampleRate;
    push(chirp(sr, 320, 880, 0.15, 0.95));
    push(chirp(sr, 180, 70, 0.2, 0.9));
    push(noise(sr, 0.09, 0.55, 0.8, 3));
    push(noise(sr, 0.22, 0.18, 0.9, 9));
    push(noise(sr, 0.1, 0.72, 0.75, 12));
    push(chirp(sr, 220, 90, 0.08, 0.8));
    push(noise(sr, 0.38, 0.12, 0.95, 21));
    push(noise(sr, 0.16, 0.62, 0.7, 33));
    push(noise(sr, 0.2, 0.16, 0.6, 40));
    push(noise(sr, 0.05, 0.35, 0.55, 51));
    push(noise(sr, 0.1, 0.48, 0.6, 62));
    push(chirp(sr, 880, 1320, 0.12, 0.8));
    push(chirp(sr, 1400, 1800, 0.07, 0.55));
    push(chirp(sr, 420, 240, 0.28, 0.7));
    push(vowel(sr, 200, [800, 1200, 2600], 0.95));
    push(vowel(sr, 200, [500, 1900, 2500], 0.95));
    push(vowel(sr, 200, [320, 2300, 3000], 0.95));
    push(vowel(sr, 180, [500, 900, 2400], 0.95));
    push(vowel(sr, 180, [350, 800, 2200], 0.95));
    push(laughLine(sr));
    push(noise(sr, 2.0, 0.08, 0.4, 70));
    push(rainBed(sr));
    push(riverBed(sr));
    push(drinkBed(sr));
  }

  function rainBed(sr: number) {
    const len = Math.floor(sr * 2);
    const b = new Float32Array(len);
    const next = rng(90);
    let y = 0;
    for (let i = 0; i < len; i++) {
      const white = next() * 2 - 1;
      y += 0.22 * (white - y);
      const drop = next() > 0.985 ? (next() * 2 - 1) * (0.4 + next()) : 0;
      b[i] = y * 0.35 + drop;
    }
    return normalize(b, 0.55);
  }

  function riverBed(sr: number) {
    const len = Math.floor(sr * 2);
    const b = new Float32Array(len);
    const next = rng(120);
    for (let n = 0; n < 28; n++) {
      const start = Math.floor(next() * (len - sr * 0.12));
      const f = 680 + next() * 540;
      let ph = 0;
      const count = Math.floor(sr * (0.05 + next() * 0.07));
      for (let i = 0; i < count && start + i < len; i++) {
        const k = i / count;
        ph += (2 * Math.PI * f) / sr;
        b[start + i] += Math.sin(ph) * Math.pow(1 - k, 2.4) * (0.35 + next() * 0.4);
      }
    }
    return normalize(b, 0.7);
  }

  function drinkBed(sr: number) {
    const len = Math.floor(sr * 0.7);
    const b = new Float32Array(len);
    const next = rng(150);
    for (let g = 0; g < 3; g++) {
      const start = Math.floor(sr * (0.05 + g * 0.2));
      let y = 0;
      const count = Math.floor(sr * 0.16);
      for (let i = 0; i < count && start + i < len; i++) {
        y += 0.35 * ((next() * 2 - 1) - y);
        const k = i / count;
        const env = Math.sin(Math.min(1, k * 3) * Math.PI) * (1 - k);
        b[start + i] += y * env + Math.sin((2 * Math.PI * 180 * i) / sr) * env * 0.4;
      }
    }
    return normalize(b, 0.8);
  }

  type FormantShift = { alpha: number; beta: number; split: [number, number, number]; rate: number };

  function speechF0(voice: number) {
    if (voice < 160) return 95 + (voice - 90) * 0.2;
    if (voice < 320) return 110 + (voice - 160) * 0.35;
    if (voice < 480) return 170 + (voice - 320) * 0.4;
    return 240 + Math.min(110, (voice - 480) * 0.22);
  }

  function shiftFormants(base: number[], shift: FormantShift) {
    const keep = shift.rate > 0 ? 1 / shift.rate : 1;
    const f1 = Math.max(180, Math.min(1200, (base[0]! * shift.alpha * shift.split[0] + shift.beta) * keep));
    const f2 = Math.max(f1 + 160, Math.min(3000, (base[1]! * shift.alpha * shift.split[1] + shift.beta) * keep));
    const f3 = Math.max(f2 + 220, Math.min(4600, (base[2]! * shift.alpha * shift.split[2] + shift.beta) * keep));
    const bw = 0.75 + 0.25 * shift.alpha;
    return [
      f1,
      f2,
      f3,
      Math.max(40, base[3]! * bw * keep),
      Math.max(50, base[4]! * bw * keep),
      Math.max(70, base[5]! * bw * keep),
    ];
  }

  type Lpc = { a: Float64Array; gain: number };

  const SR_A = 16000;
  const PERIOD = 114;

  function tractFrame(form: number[], periods: number) {
    const n = PERIOD * periods;
    const frame = new Float64Array(n);
    const poles = [
      { y1: 0, y2: 0 },
      { y1: 0, y2: 0 },
      { y1: 0, y2: 0 },
    ];
    let phase = 0;
    for (let i = 0; i < n; i++) {
      phase += 1 / PERIOD;
      let x = 0;
      if (phase >= 1) {
        phase -= 1;
        x = 1;
      }
      let y = x;
      for (let k = 0; k < 3; k++) {
        const slot = poles[k]!;
        const r = Math.exp((-Math.PI * form[k + 3]!) / SR_A);
        const a1 = 2 * r * Math.cos((2 * Math.PI * form[k]!) / SR_A);
        const a2 = -(r * r);
        y = (1 - r) * y + a1 * slot.y1 + a2 * slot.y2;
        slot.y2 = slot.y1;
        slot.y1 = y;
      }
      frame[i] = y * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
    }
    return frame;
  }

  function lpcAnalyze(form: number[]): Lpc {
    const order = 12;
    const frame = tractFrame(form, 16);
    const n = frame.length;
    const corr = new Float64Array(order + 1);
    for (let lag = 0; lag <= order; lag++) {
      let s = 0;
      let c = 0;
      for (let i = 0; i < n - lag; i++) {
        const y = frame[i]! * frame[i + lag]! - c;
        const t = s + y;
        c = t - s - y;
        s = t;
      }
      corr[lag] = s;
    }
    const a = new Float64Array(order + 1);
    a[0] = 1;
    let err = corr[0]!;
    if (err < 1e-12) return { a, gain: 1e-6 };
    for (let i = 1; i <= order; i++) {
      let lambda = corr[i]!;
      for (let j = 1; j < i; j++) lambda -= a[j]! * corr[i - j]!;
      lambda /= err;
      if (Math.abs(lambda) >= 0.999) lambda = Math.sign(lambda) * 0.999;
      const next = new Float64Array(order + 1);
      next[0] = 1;
      for (let j = 1; j < i; j++) next[j] = a[j]! - lambda * a[i - j]!;
      next[i] = lambda;
      for (let j = 0; j <= i; j++) a[j] = next[j]!;
      err *= 1 - lambda * lambda;
      if (err < 1e-14) break;
    }
    return { a, gain: Math.sqrt(Math.max(err, 1e-18)) };
  }

  function lpcMag(model: Lpc, freq: number) {
    const w = (2 * Math.PI * Math.max(40, Math.min(7400, freq))) / 16000;
    let re = 1;
    let im = 0;
    for (let j = 1; j < model.a.length; j++) {
      re -= model.a[j]! * Math.cos(w * j);
      im -= model.a[j]! * Math.sin(w * j);
    }
    return model.gain / Math.max(1e-8, Math.hypot(re, im));
  }

  function burgAnalyze(form: number[]): Lpc {
    const order = 12;
    const frame = tractFrame(form, 8);
    const n = frame.length;
    const f = Float64Array.from(frame);
    const b = Float64Array.from(frame);
    const a = new Float64Array(order + 1);
    a[0] = 1;
    let e = 0;
    for (let i = 0; i < n; i++) e += frame[i]! * frame[i]!;
    e /= n;
    for (let m = 1; m <= order; m++) {
      let num = 0;
      let den = 1e-18;
      for (let i = m; i < n; i++) {
        const w = (i + 1) * (n - i);
        num += w * f[i]! * b[i - 1]!;
        den += w * (f[i]! * f[i]! + b[i - 1]! * b[i - 1]!);
      }
      let k = (2 * num) / den;
      if (Math.abs(k) > 0.999) k = Math.sign(k) * 0.999;
      const next = Float64Array.from(a);
      for (let j = 1; j < m; j++) next[j] = a[j]! - k * a[m - j]!;
      next[m] = k;
      a.set(next);
      for (let i = n - 1; i >= m; i--) {
        const fi = f[i]!;
        const bi = b[i - 1]!;
        f[i] = fi - k * bi;
        b[i] = bi - k * fi;
      }
      e *= 1 - k * k;
    }
    return { a, gain: Math.sqrt(Math.max(e, 1e-18)) };
  }

  function fft256(re: Float64Array, im: Float64Array, inverse: boolean) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        const tr = re[i]!;
        re[i] = re[j]!;
        re[j] = tr;
        const ti = im[i]!;
        im[i] = im[j]!;
        im[j] = ti;
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = ((2 * Math.PI) / len) * (inverse ? 1 : -1);
      const wr = Math.cos(ang);
      const wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let wRe = 1;
        let wIm = 0;
        for (let k = 0; k < len / 2; k++) {
          const ur = re[i + k]!;
          const ui = im[i + k]!;
          const vr = re[i + k + len / 2]! * wRe - im[i + k + len / 2]! * wIm;
          const vi = re[i + k + len / 2]! * wIm + im[i + k + len / 2]! * wRe;
          re[i + k] = ur + vr;
          im[i + k] = ui + vi;
          re[i + k + len / 2] = ur - vr;
          im[i + k + len / 2] = ui - vi;
          const nr = wRe * wr - wIm * wi;
          wIm = wRe * wi + wIm * wr;
          wRe = nr;
        }
      }
    }
    if (inverse) {
      for (let i = 0; i < n; i++) {
        re[i] = re[i]! / n;
        im[i] = im[i]! / n;
      }
    }
  }

  function lifterCurve(autocorr: Lpc, burg: Lpc) {
    const n = 256;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n / 2; i++) {
      const freq = (i / (n / 2)) * 8000;
      const mag = 0.5 * (Math.log(Math.max(1e-8, lpcMag(autocorr, freq))) + Math.log(Math.max(1e-8, lpcMag(burg, freq))));
      re[i] = mag;
      if (i > 0) re[n - i] = mag;
    }
    fft256(re, im, true);
    const keep = 28;
    for (let i = keep + 1; i < n - keep; i++) re[i] = 0;
    re[keep] = re[keep]! * 0.5;
    if (keep > 0) re[n - keep] = re[n - keep]! * 0.5;
    im.fill(0);
    fft256(re, im, false);
    const curve = new Float64Array(n / 2);
    for (let i = 0; i < curve.length; i++) curve[i] = Math.exp(re[i]!);
    return curve;
  }

  type VoiceMode = "talk" | "sing" | "whisper" | "click" | "smack" | "tick";
  type VoiceCast = {
    f0: number;
    shift: FormantShift;
    tune: number;
    breath: number;
    oq: number;
    smile: number;
    chest: number;
    mode: VoiceMode;
  };

  function fitPitch(f0: number, amount: number) {
    if (amount < 0.02) return f0;
    const midi = 69 + 12 * Math.log2(Math.max(40, f0) / 440);
    const near = Math.round(midi);
    const mixed = midi + (near - midi) * Math.min(1, amount);
    return 440 * 2 ** ((mixed - 69) / 12);
  }

  function shiftFor(alpha: number, beta: number, smile: number, rate = 1): FormantShift {
    const bright = alpha > 1.02 || beta > 18;
    const split: [number, number, number] = bright
      ? [1.04, 1.14 * (1 + smile), 1.1]
      : [0.98, 0.96 * (1 + smile * 0.4), 0.95];
    return { alpha, beta, split, rate };
  }

  const LOOK: Record<string, [number, number, number, number, number, number]> = {
    angel: [268, 1.08, 70, 0.08, 0.12, 0.22],
    pickme: [252, 1.06, 55, 0.1, 0.1, 0.18],
    goth: [176, 1.02, 26, 0.02, 0.28, 0.06],
    bestie: [258, 1.07, 62, 0.12, 0.1, 0.2],
    puff: [292, 1.1, 90, 0.14, 0.05, 0.24],
    bunny: [276, 1.08, 60, 0.1, 0.08, 0.16],
    trips: [264, 1.07, 58, 0.09, 0.1, 0.16],
    boomer: [128, 0.94, -10, 0.04, 0.45, 0.05],
    buzz: [198, 1.0, 10, 0.02, 0.2, 0.08],
    lark: [302, 1.12, 80, 0.12, 0.05, 0.2],
    pack: [150, 0.96, -8, 0.03, 0.4, 0.06],
    pin: [118, 0.92, -18, 0, 0.35, 0.04],
    wrap: [110, 0.9, -22, 0, 0.42, 0.05],
    bone: [98, 0.88, -30, 0, 0.38, 0.04],
    glass: [168, 0.98, 0, 0, 0.22, 0.05],
    twin: [242, 1.05, 48, 0.08, 0.12, 0.14],
    cinder: [156, 0.97, -4, 0.05, 0.3, 0.08],
    bleat: [284, 1.1, 75, 0.15, 0.05, 0.22],
    blocky: [164, 0.98, 0, 0.02, 0.34, 0.05],
    wallaby: [208, 1.02, 20, 0.06, 0.18, 0.1],
    laile: [232, 1.05, 50, 0.11, 0.12, 0.2],
    cloudy: [278, 1.09, 68, 0.13, 0.08, 0.18],
    donnie: [142, 0.95, 12, 0.16, 0.55, 0.08],
    elon: [228, 1.06, 40, 0.14, 0.1, 0.12],
    flux: [160, 0.97, -6, 0.02, 0.3, 0.05],
    rock: [96, 0.88, -28, 0.02, 0.62, 0.03],
    zendaya: [206, 1.04, 42, 0.04, 0.22, 0.1],
    jlo: [198, 1.05, 36, 0.07, 0.28, 0.12],
  };

  function modeOf(kind: string, line: string): VoiceMode {
    const k = `${kind} ${line}`.toLowerCase();
    if (k.includes("click")) return "click";
    if (k.includes("tick")) return "tick";
    if (k.includes("smack")) return "smack";
    if (k.includes("whisper") || k.includes("die") || k.includes("groan")) return "whisper";
    if (/(yay|joohoo|sing|winner|loud|yess|triple|double)/.test(k)) return "sing";
    return "talk";
  }

  function castOf(charId: string, pitch: number, kind: string, line: string): VoiceCast {
    const look = LOOK[charId];
    const mode = modeOf(kind, line);
    const f0 = look ? look[0] : pitch > 380 ? speechF0(pitch) : pitch;
    const alpha = look ? look[1] : f0 > 190 ? 1.05 : 0.96;
    const beta = look ? look[2] : f0 > 190 ? 40 : -12;
    const smile = look ? look[3] : 0.04;
    const chest = look ? look[4] : f0 < 150 ? 0.4 : 0.12;
    const breath = look ? look[5] : f0 > 220 ? 0.16 : 0.06;
    const tune = mode === "sing" ? 0.86 : mode === "whisper" ? 0 : f0 > 220 ? 0.28 : 0.12;
    return {
      f0: fitPitch(mode === "whisper" ? f0 * 0.9 : f0, tune),
      shift: shiftFor(alpha, beta, smile),
      tune,
      breath: mode === "whisper" ? Math.min(0.55, breath + 0.28) : breath,
      oq: mode === "whisper" ? 0.7 : breath > 0.14 ? 0.6 : 0.44,
      smile,
      chest,
      mode,
    };
  }

  function mouthBurst(mode: VoiceMode, sr: number) {
    const dur = mode === "tick" ? 0.028 : mode === "click" ? 0.05 : 0.09;
    const len = Math.max(1, Math.floor(sr * dur));
    const b = new Float32Array(len);
    let y1 = 0;
    let y2 = 0;
    const f = mode === "tick" ? 2800 : mode === "click" ? 1450 : 680;
    const bw = mode === "tick" ? 220 : 140;
    const r = Math.exp((-Math.PI * bw) / sr);
    const a1 = 2 * r * Math.cos((2 * Math.PI * f) / sr);
    const a2 = -(r * r);
    for (let i = 0; i < len; i++) {
      const env = Math.exp((-i / len) * (mode === "smack" ? 4 : 9));
      const x = (i < 2 ? 1 : 0) + (Math.random() * 2 - 1) * (mode === "smack" ? 0.45 : 0.04);
      const y = (1 - r) * x + a1 * y1 + a2 * y2;
      y2 = y1;
      y1 = y;
      b[i] = y * env;
    }
    return normalize(b, 0.8);
  }

  function renderPhrase(text: string, sr: number, cast: VoiceCast) {
    if (cast.mode === "click" || cast.mode === "smack" || cast.mode === "tick") return mouthBurst(cast.mode, sr);
    const words = text
      .toLowerCase()
      .replace(/[^a-z ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 16);
    const vowels: Record<string, number[]> = {
      a: [730, 1090, 2440, 80, 90, 120],
      e: [530, 1840, 2480, 60, 90, 120],
      i: [270, 2290, 3010, 60, 90, 150],
      o: [570, 840, 2410, 70, 80, 100],
      u: [300, 870, 2240, 60, 80, 110],
    };
    const shift = cast.shift;
    const f0 = cast.f0;
    const oq = cast.oq;
    const syl: { f: number; t: number; env: Float64Array }[] = [];
    let t = 0.03;
    const gap = 0.098;
    const placed = (vowel: number[]) => shiftFormants(vowel, shift);
    const envFor = (form: number[]) => {
      const key = form.map((v) => Math.round(v)).join(",");
      let hit = envelopes.get(key);
      if (!hit) {
        hit = lifterCurve(lpcAnalyze(form), burgAnalyze(form));
        envelopes.set(key, hit);
      }
      return hit;
    };
    for (const word of words) {
      const n = Math.min(3, Math.max(1, Math.ceil(word.length / 3)));
      for (let i = 0; i < n; i++) {
        const slice = word.slice(i * 3, i * 3 + 3);
        const v = (slice.match(/[aeiou]/) || ["a"])[0]!;
        const wobble = v === "i" ? 1.08 : v === "e" ? 1.03 : v === "o" || v === "u" ? 0.92 : 1;
        syl.push({ f: Math.max(70, f0 * wobble), t, env: envFor(placed(vowels[v] || vowels.a!)) });
        t += gap;
      }
      t += gap * 0.45;
    }
    if (!syl.length) syl.push({ f: f0, t: 0.02, env: envFor(placed(vowels.a!)) });
    const len = Math.max(1, Math.floor(sr * (t + 0.22)));
    const b = new Float32Array(len);
    const nyq = sr * 0.45;
    const maxH = 48;
    const phase = new Float32Array(maxH);
    const amp = new Float32Array(maxH);
    const ampT = new Float32Array(maxH);
    const tilt = (0.25 + oq) * (1 - cast.chest * 0.5);
    const breath = cast.breath;
    let nPrev = 0;
    let hop = 0;
    let noiseT = 0;
    const at = (curve: Float64Array, freq: number) => {
      const bin = (Math.max(0, Math.min(7990, freq)) / 8000) * (curve.length - 1);
      const i0 = Math.max(0, Math.min(curve.length - 2, bin | 0));
      const fr = bin - i0;
      return curve[i0]! * (1 - fr) + curve[i0 + 1]! * fr;
    };
    const harm = cast.mode === "whisper" ? 0.28 : 1;
    const noiseBoost = cast.mode === "whisper" ? 2.2 : 1;
    for (let i = 0; i < len; i++) {
      const time = i / sr;
      let env = 0;
      let wsum = 0;
      let ff = syl[0]!.f;
      let accF = 0;
      const live: { e: number; env: Float64Array }[] = [];
      for (const sy of syl) {
        const u = (time - sy.t) / 0.09;
        if (u < -0.45 || u > 2.6) continue;
        const w = 0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, (u + 0.2) / 0.32)) * Math.PI);
        const tail = u > 1 ? Math.exp(-(u - 1) * 2.2) : 1;
        const e = w * tail;
        if (e > env) env = e;
        if (e < 0.002) continue;
        wsum += e;
        accF += sy.f * e;
        live.push({ e, env: sy.env });
      }
      if (wsum > 0.001) ff = accF / wsum;
      const vib = cast.mode === "sing" ? 0.014 : 0.004;
      ff *= 1 + vib * Math.sin(time * (cast.mode === "sing" ? 28 : 37));
      if (hop <= 0) {
        hop = 32;
        const nH = Math.max(1, Math.min(maxH, Math.floor(Math.min(nyq, 4800) / ff)));
        for (let h = 0; h < nH; h++) {
          const freq = (h + 1) * ff;
          let s = 0;
          for (const part of live) s += part.e * at(part.env, freq);
          const tract = wsum > 0.001 ? s / wsum : 0;
          ampT[h] = tract * Math.pow(freq / 140, -tilt);
        }
        for (let h = nH; h < maxH; h++) ampT[h] = 0;
        let sN = 0;
        for (const part of live) sN += part.e * at(part.env, 3400);
        noiseT = (wsum > 0.001 ? sN / wsum : 0) * Math.pow(3400 / 140, -tilt);
      }
      hop--;
      let voice = 0;
      const step = (2 * Math.PI * ff) / sr;
      for (let h = 0; h < maxH; h++) {
        amp[h] += (ampT[h]! - amp[h]!) * 0.2;
        phase[h] = (phase[h]! + step * (h + 1)) % (Math.PI * 2);
        voice += amp[h]! * Math.sin(phase[h]!);
      }
      nPrev = nPrev * 0.7 + (Math.random() * 2 - 1) * 0.3;
      b[i] = (voice * harm + nPrev * breath * noiseT * noiseBoost) * env;
    }
    return normalize(b, 0.92);
  }

  function storeBuf(id: number, data: Float32Array) {
    pcm[id] = data;
    const ab = ctx!.createBuffer(1, data.length, ctx!.sampleRate);
    ab.getChannelData(0).set(data);
    banks[id] = ab;
    if (node && mode === "worklet") node.port.postMessage({ cmd: "addbuf", id, buf: data });
  }

  function phraseId(text: string, cast: VoiceCast) {
    const use = cast.shift;
    const key = `${Math.round(cast.f0)}|${use.alpha.toFixed(3)}|${use.beta}|${use.split.join(",")}|${use.rate}|${cast.mode}|${cast.breath.toFixed(2)}|${text}`;
    let slot = phraseSlot.indexOf(key);
    if (slot < 0) {
      if (phraseSlot.length < 48) phraseSlot.push(key);
      else {
        phraseSlot.shift();
        phraseSlot.push(key);
      }
      slot = phraseSlot.indexOf(key);
      storeBuf(24 + slot, renderPhrase(text, ctx!.sampleRate, cast));
    }
    return 24 + slot;
  }

  function schedule() {
    if (flushQueued) return;
    flushQueued = true;
    queueMicrotask(flush);
  }

  function flush() {
    flushQueued = false;
    if (mode !== "worklet" || !node || !batch.length) return;
    const items = batch.splice(0, batch.length);
    node.port.postMessage({ cmd: "batch", items });
  }

  function fallback(it: Item) {
    if (!ctx || !master || !banks[it.id]) return;
    const src = ctx.createBufferSource();
    src.buffer = banks[it.id];
    src.playbackRate.value = Math.max(0.25, it.rate || 1);
    src.loop = !!it.loop;
    const g = ctx.createGain();
    const when = ctx.currentTime + Math.max(0, it.delay || 0);
    const strip = mix.ch[Math.max(0, Math.min(2, it.lane))]!;
    const level = it.gain * strip.trim * strip.fader * (strip.mute ? 0 : 1);
    g.gain.setValueAtTime(Math.max(0.0001, level), when);
    src.connect(g);
    const bus = it.lane ? master : worldBus || master;
    if (it.lane !== 2 && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.setValueAtTime(Math.max(-1, Math.min(1, it.pan || 0)), when);
      g.connect(p);
      p.connect(bus);
    } else g.connect(bus);
    src.start(when);
    if (!it.loop) {
      const dur = banks[it.id].duration / Math.max(0.25, it.rate || 1);
      src.stop(when + dur + 0.03);
    }
  }

  function kick(it: Item) {
    if (it.gain < 0.004) return;
    if (!ctx) boot();
    if (ctx && ctx.state === "suspended") void ctx.resume();
    if (mode === "worklet") {
      batch.push(it);
      schedule();
      return;
    }
    fallback(it);
  }

  let ditherOn = false;
  const mix: MixState = {
    ch: [0, 1, 2].map(() => ({ trim: 1, pan: 0, mute: false, solo: false, pfl: false, fader: 1, pol: 1, hpf: 0, aux: 0, pre: false })),
    auxReturn: 0,
    duck: 0.42,
  };
  const meters: MixMeters = { peak: [0, 0, 0, 0], hold: [0, 0, 0, 0] };

  function pushMix() {
    if (node && mode === "worklet") node.port.postMessage({ cmd: "mix", ...mix });
  }
  let ditherNode: AudioWorkletNode | null = null;

  function ditherMessage() {
    const p = ditherParams();
    const shape = p.shape === "rpdf" ? 1 : p.shape === "tpdf" ? 2 : p.shape === "floyd" ? 3 : 0;
    return { cmd: "dither" as const, enabled: p.enabled, shape, scale: ditherScale(p), step: ditherStep(p), shaping: p.shaping };
  }

  let studioOut: GainNode | null = null;
  let widthNode: AudioWorkletNode | null = null;
  let analyser: AnalyserNode | null = null;
  const ditherScope = new Float32Array(128);
  const studio: StudioParams = {
    ...STUDIO_DEFAULT,
    eq: STUDIO_DEFAULT.eq.map((b) => ({ ...b })),
  };
  let eqNodes: BiquadFilterNode[] = [];
  let eqWet: GainNode | null = null;
  let eqDry: GainNode | null = null;
  let airNode: BiquadFilterNode | null = null;
  let phatLP: BiquadFilterNode | null = null;
  let phatHP: BiquadFilterNode | null = null;
  let phatSat: WaveShaperNode | null = null;
  let phatWet: GainNode | null = null;
  let phatHigh: GainNode | null = null;
  let phatDry: GainNode | null = null;
  let exciteWet: GainNode | null = null;
  let ampWet: GainNode | null = null;
  let ampShape: WaveShaperNode | null = null;
  let makeup: GainNode | null = null;
  let ceiling: DynamicsCompressorNode | null = null;
  let rider = 0;

  function shapeCurve(drive: number, mix: number) {
    const n = 1024;
    const c = new Float32Array(n);
    const k = 1 + drive * 48;
    const norm = Math.tanh(k);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      const y = Math.tanh(k * x) / norm;
      c[i] = x * (1 - mix) + y * mix;
    }
    return c;
  }

  function fadeTo(gain: AudioParam, value: number) {
    if (!ctx) return;
    const now = ctx.currentTime;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(value, now + 0.012);
  }

  function applyStudio() {
    if (!ctx) return;
    const now = ctx.currentTime;
    eqNodes.forEach((node, i) => {
      const b = studio.eq[i];
      if (!b) return;
      node.frequency.setValueAtTime(b.f, now);
      node.Q.setValueAtTime(b.q, now);
      node.gain.setValueAtTime(b.g, now);
    });
    if (eqWet && eqDry) {
      fadeTo(eqWet.gain, studio.eqOn ? 1 : 0);
      fadeTo(eqDry.gain, studio.eqOn ? 0 : 1);
    }
    if (airNode) airNode.gain.setValueAtTime(studio.air, now);
    if (phatLP && phatHP) {
      phatLP.frequency.setTargetAtTime(studio.phatFreq, ctx.currentTime, 0.02);
      phatHP.frequency.setTargetAtTime(studio.phatFreq, ctx.currentTime, 0.02);
    }
    if (phatSat) phatSat.curve = shapeCurve(studio.phatDrive, 1);
    const mix = Math.max(0, Math.min(1, studio.phatMix));
    if (phatDry) fadeTo(phatDry.gain, 1 - mix);
    if (phatWet) fadeTo(phatWet.gain, mix);
    if (phatHigh) fadeTo(phatHigh.gain, mix);
    if (exciteWet) fadeTo(exciteWet.gain, Math.max(0, Math.min(1, studio.exciter)) * 0.35);
    if (ampShape) ampShape.curve = shapeCurve(studio.ampDrive, studio.ampDrive > 0.01 ? 1 : 0);
    if (ampWet) fadeTo(ampWet.gain, studio.ampDrive > 0.01 ? 1 : 0);
    if (widthNode) widthNode.port.postMessage({ cmd: "width", width: studio.width });
    const peakLin = Math.max(0.05, Math.min(1, studio.peak / 100));
    if (ceiling) {
      const hold = studio.replay === "none" ? 0 : 20 * Math.log10(peakLin);
      ceiling.threshold.setTargetAtTime(hold, ctx.currentTime, 0.03);
      ceiling.ratio.setTargetAtTime(studio.replay === "prevent" || studio.replay === "gain" ? 20 : 1, ctx.currentTime, 0.03);
    }
    if (studio.replay === "none" && makeup) fadeTo(makeup.gain, Math.pow(10, studio.preamp / 20));
  }

  function rideLoudness() {
    if (!ctx || !analyser || !makeup) return;
    if (studio.replay === "none") return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i]! * buf[i]!;
    const rms = Math.sqrt(s / buf.length);
    if (rms < 1e-4) return;
    const db = 20 * Math.log10(rms);
    const delta = Math.max(-18, Math.min(12, studio.target - db));
    const want = Math.pow(10, (delta + studio.preamp) / 20);
    makeup.gain.setTargetAtTime(want, ctx.currentTime, 0.15);
  }

  function buildStudio() {
    if (!ctx || !master || studioOut) return;
    const types: BiquadFilterType[] = ["lowshelf", "peaking", "peaking", "peaking", "highshelf"];
    eqNodes = types.map((type) => {
      const f = ctx!.createBiquadFilter();
      f.type = type;
      return f;
    });
    airNode = ctx.createBiquadFilter();
    airNode.type = "highshelf";
    airNode.frequency.value = 12000;
    const phatIn = ctx.createGain();
    phatDry = ctx.createGain();
    phatLP = ctx.createBiquadFilter();
    phatLP.type = "lowpass";
    phatHP = ctx.createBiquadFilter();
    phatHP.type = "highpass";
    phatSat = ctx.createWaveShaper();
    phatSat.oversample = "4x";
    const phatComp = ctx.createDynamicsCompressor();
    phatComp.threshold.value = -18;
    phatComp.ratio.value = 3;
    phatComp.attack.value = 0.005;
    phatComp.release.value = 0.12;
    phatWet = ctx.createGain();
    phatHigh = ctx.createGain();
    const phatSum = ctx.createGain();
    const exHP = ctx.createBiquadFilter();
    exHP.type = "highpass";
    exHP.frequency.value = 6500;
    const exSat = ctx.createWaveShaper();
    exSat.curve = shapeCurve(0.35, 1);
    exSat.oversample = "2x";
    exciteWet = ctx.createGain();
    const exSum = ctx.createGain();
    ampShape = ctx.createWaveShaper();
    ampShape.oversample = "4x";
    ampWet = ctx.createGain();
    const preWidth = ctx.createGain();
    const postWidth = ctx.createGain();
    makeup = ctx.createGain();
    ceiling = ctx.createDynamicsCompressor();
    ceiling.knee.value = 0;
    ceiling.attack.value = 0.002;
    ceiling.release.value = 0.08;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
    studioOut = ctx.createGain();
    const eqIn = ctx.createGain();
    eqWet = ctx.createGain();
    eqDry = ctx.createGain();
    const eqSum = ctx.createGain();
    master.connect(eqIn);
    let prev: AudioNode = eqIn;
    for (const band of eqNodes) {
      prev.connect(band);
      prev = band;
    }
    prev.connect(eqWet);
    eqWet.connect(eqSum);
    eqIn.connect(eqDry);
    eqDry.connect(eqSum);
    eqSum.connect(airNode);
    airNode.connect(phatIn);
    phatIn.connect(phatDry);
    phatDry.connect(phatSum);
    phatIn.connect(phatLP);
    phatLP.connect(phatSat);
    phatSat.connect(phatComp);
    phatComp.connect(phatWet);
    phatWet.connect(phatSum);
    phatIn.connect(phatHP);
    phatHP.connect(phatHigh);
    phatHigh.connect(phatSum);
    phatSum.connect(exSum);
    phatSum.connect(exHP);
    exHP.connect(exSat);
    exSat.connect(exciteWet);
    exciteWet.connect(exSum);
    exSum.connect(ampShape);
    ampShape.connect(ampWet);
    ampWet.connect(preWidth);
    preWidth.connect(postWidth);
    postWidth.connect(makeup);
    makeup.connect(ceiling);
    ceiling.connect(analyser);
    ceiling.connect(studioOut);
    studioOut.connect(ctx.destination);
    (buildStudio as unknown as { pre?: GainNode }).pre = preWidth;
    (buildStudio as unknown as { post?: GainNode }).post = postWidth;
    applyStudio();
    if (!rider) rider = window.setInterval(rideLoudness, 200);
  }

  function insertWidth() {
    if (!ctx) return;
    const pre = (buildStudio as unknown as { pre?: GainNode }).pre;
    const post = (buildStudio as unknown as { post?: GainNode }).post;
    if (!pre || !post || widthNode) return;
    try {
      widthNode = new AudioWorkletNode(ctx, "dew-width", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
    } catch {
      return;
    }
    pre.disconnect();
    pre.connect(widthNode);
    widthNode.connect(post);
    widthNode.port.postMessage({ cmd: "width", width: studio.width });
  }

  function installDither(stage: AudioNode) {
    if (!ctx || !studioOut || ditherOn) return;
    ditherOn = true;
    studioOut.disconnect();
    stage.connect(ctx.destination);
    studioOut.connect(stage);
  }

  function boot() {
    if (started) return;
    started = true;
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = vol;
    buildStudio();
    worldBus = ctx.createGain();
    worldBus.gain.value = 0.9;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -3;
    lim.knee.value = 4;
    lim.ratio.value = 1.5;
    lim.attack.value = 0.002;
    lim.release.value = 0.06;
    worldBus.connect(lim);
    lim.connect(master);
    buildBuffers();
    const url = URL.createObjectURL(new Blob([workletSource], { type: "application/javascript" }));
    void ctx.audioWorklet
      .addModule(url)
      .then(() => {
        URL.revokeObjectURL(url);
        if (!ctx || !master) return;
        try {
          node = new AudioWorkletNode(ctx, "dew-mixer", { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
        } catch {
          node = new AudioWorkletNode(ctx, "dew-mixer");
        }
        node.connect(master);
        node.port.onmessage = (e) => {
          const data = e.data as { cmd?: string; peak?: number[]; hold?: number[] };
          if (data?.cmd === "meters" && data.peak && data.hold) {
            meters.peak = data.peak;
            meters.hold = data.hold;
          }
        };
        node.port.postMessage({ cmd: "bufs", bufs: pcm });
        pushMix();
        const dither = new AudioWorkletNode(ctx, "dew-dither", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
        ditherNode = dither;
        dither.port.postMessage({ ...ditherMessage(), tpdf: DITHER_TPDF, rpdf: DITHER_RPDF });
        dither.port.onmessage = (e) => {
          const data = e.data as { cmd?: string; samples?: Float32Array };
          if (data?.cmd === "scope" && data.samples) ditherScope.set(data.samples);
        };
        insertWidth();
        installDither(dither);
        mode = "worklet";
        armWind();
        flush();
      })
      .catch(() => {
        URL.revokeObjectURL(url);
        mode = "buffer";
        if (ctx && ctx.createScriptProcessor) {
          const proc = ctx.createScriptProcessor(256, 2, 2);
          let pos = 0;
          proc.onaudioprocess = (e) => {
            const p = ditherParams();
            const scale = ditherScale(p);
            const table = p.shape === "rpdf" ? DITHER_RPDF : DITHER_TPDF;
            const n = e.inputBuffer.length;
            const chs = e.inputBuffer.numberOfChannels;
            for (let ch = 0; ch < e.outputBuffer.numberOfChannels; ch++) {
              const src = e.inputBuffer.getChannelData(Math.min(ch, chs - 1));
              const dst = e.outputBuffer.getChannelData(ch);
              for (let i = 0; i < n; i++) {
                const noise = !scale ? 0 : table[(pos + i + ch) & 4095]! * scale;
                dst[i] = src[i]! + noise;
              }
            }
            pos = (pos + n) & 4095;
          };
          installDither(proc);
        }
        armWind();
      });
  }

  function armWind() {
    if (windOn) return;
    windOn = true;
    kick({ id: ID.wind, delay: 0, gain: 0.045, rate: 1, pan: 0, lane: 0, loop: true });
  }

  function place(x: number, y: number, z: number, far = HEAR) {
    const dx = x - ear.x;
    const dy = y - ear.y;
    const dz = z - ear.z;
    const d = Math.hypot(dx, dy, dz);
    let g = 1;
    if (d > HEAR_FULL) {
      if (d >= far) g = 0;
      else {
        const t = (d - HEAR_FULL) / (far - HEAR_FULL);
        g = (1 - t) * (1 - t);
      }
    }
    return { g, pan: Math.max(-1, Math.min(1, dx / 26)) };
  }

  function cloneCast(cast: VoiceCast, dir: number): VoiceCast {
    const rate = dir < 0 ? 0.98 : 1.02;
    return {
      ...cast,
      shift: {
        ...cast.shift,
        beta: cast.shift.beta + dir * 16,
        rate,
        split: [cast.shift.split[0], cast.shift.split[1] * (dir < 0 ? 1.04 : 1.07), cast.shift.split[2]],
      },
    };
  }

  function flushNow() {
    flushQueued = false;
    if (mode !== "worklet" || !node || !batch.length) return;
    const items = batch.splice(0, batch.length);
    node.port.postMessage({ cmd: "batch", items });
  }

  function wordSpan(word: string) {
    const n = Math.min(3, Math.max(1, Math.ceil(word.replace(/[^a-z]/gi, "").length / 3)));
    return 0.08 + n * 0.09;
  }

  function speak(text: string, pitch: number, gain: number, lane: number, pan: number, charId = "", kind = "", clones = false) {
    if (!text || gain < 0.004) return;
    if (!ctx) boot();
    if (!ctx) return;
    const cast = castOf(charId, pitch, kind, text);
    const words = text.split(/\s+/).filter(Boolean);
    const lead = words[0] || text;
    const utter = (line: string, delay: number, voice: VoiceCast, g: number, p: number, rate: number) => {
      kick({ id: phraseId(line, voice), delay, gain: g, rate, pan: p, lane });
    };
    utter(lead, 0, cast, gain, pan, 1);
    flushNow();
    const rest = words.slice(1);
    if (!rest.length && !clones) return;
    setTimeout(() => {
      if (!ctx) return;
      let delay = wordSpan(lead);
      for (const word of rest) {
        utter(word, delay, cast, gain, pan, 1);
        delay += wordSpan(word);
      }
      if (clones && cast.mode !== "click" && cast.mode !== "tick" && cast.mode !== "smack") {
        const left = cloneCast(cast, -1);
        const right = cloneCast(cast, 1);
        let t = 0;
        const queue = words.length ? words : [text];
        for (const word of queue) {
          utter(word, t, left, gain * 0.42, Math.max(-1, pan - 0.72), 0.98);
          utter(word, t, right, gain * 0.42, Math.min(1, pan + 0.72), 1.02);
          t += wordSpan(word);
        }
      }
      flushNow();
    }, 0);
  }

  function setLoop(id: number, gain: number) {
    if (!loops.has(id)) {
      if (gain < 0.01) return;
      loops.add(id);
      kick({ id, delay: 0, gain, rate: 1, pan: 0, lane: 0, loop: true });
      return;
    }
    if (node && mode === "worklet") node.port.postMessage({ cmd: "gain", id, gain });
  }

  function shotId(kind: string) {
    if (kind === "rocket") return ID.rocket;
    if (kind === "flame") return ID.flame;
    if (kind === "melee") return ID.melee;
    return ID.shot;
  }

  let baked = false;
  function bakeBarks() {
    if (baked || !ctx) return;
    baked = true;
    const lines = ["help", "yay", "ow", "jump", "die", "Double Winner", "Heatstroke cured", "Mount Dew Oh yesss"];
    let i = 0;
    const step = () => {
      if (!ctx || i >= lines.length) return;
      const line = lines[i++]!;
      phraseId(line, castOf("flux", 118, line, line));
      setTimeout(step, 0);
    };
    setTimeout(step, 0);
  }

  return {
    unlock() {
      boot();
      if (ctx && ctx.state === "suspended") void ctx.resume();
      bakeBarks();
    },
    setVolume(v: number) {
      vol = v;
      if (master) master.gain.value = v;
    },
    setDither(next: Partial<DitherParams>) {
      setDitherParams(next);
      if (ditherNode) ditherNode.port.postMessage(ditherMessage());
    },
    setStudio(next: Partial<Omit<StudioParams, "eq">> & { eq?: ({ f?: number; g?: number; q?: number } | undefined)[] }) {
      if (next.eq) studio.eq = studio.eq.map((b, i) => ({ ...b, ...next.eq?.[i] }));
      if (next.phatFreq != null) studio.phatFreq = next.phatFreq;
      if (next.phatDrive != null) studio.phatDrive = next.phatDrive;
      if (next.phatMix != null) studio.phatMix = next.phatMix;
      if (next.ampDrive != null) studio.ampDrive = next.ampDrive;
      if (next.replay) studio.replay = next.replay;
      if (next.preamp != null) studio.preamp = next.preamp;
      if (next.target != null) studio.target = next.target;
      if (next.peak != null) studio.peak = next.peak;
      if (next.air != null) studio.air = next.air;
      if (next.width != null) studio.width = next.width;
      if (next.exciter != null) studio.exciter = next.exciter;
      if (next.eqOn != null) studio.eqOn = next.eqOn;
      applyStudio();
    },
    getStudioViz() {
      const spectrum = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);
      if (analyser) analyser.getByteFrequencyData(spectrum);
      const n = 128;
      const freq = new Float32Array(n);
      const mag = new Float32Array(n);
      const phase = new Float32Array(n);
      const eq = new Float32Array(n);
      eq.fill(1);
      const rate = ctx?.sampleRate || 48000;
      const hi = Math.min(20000, rate * 0.49);
      for (let i = 0; i < n; i++) freq[i] = 20 * (hi / 20) ** (i / (n - 1));
      if (studio.eqOn) {
        for (const band of eqNodes) {
          band.getFrequencyResponse(freq, mag, phase);
          for (let i = 0; i < n; i++) eq[i] = eq[i]! * mag[i]!;
        }
      }
      const centers = new Float32Array(studio.eq.length);
      const oneF = new Float32Array(1);
      const oneM = new Float32Array(1);
      const oneP = new Float32Array(1);
      for (let b = 0; b < studio.eq.length; b++) {
        oneF[0] = Math.min(hi, Math.max(20, studio.eq[b]!.f));
        let m = 1;
        if (studio.eqOn) {
          for (const band of eqNodes) {
            band.getFrequencyResponse(oneF, oneM, oneP);
            m *= oneM[0]!;
          }
        }
        centers[b] = 20 * Math.log10(Math.max(1e-4, m));
      }
      return { spectrum, eq, freq, centers, dither: ditherScope, rate, eqOn: studio.eqOn };
    },
    setMix(next) {
      if (next.ch) {
        mix.ch = mix.ch.map((row, i) => ({ ...row, ...next.ch?.[i] }));
      }
      if (next.auxReturn != null) mix.auxReturn = next.auxReturn;
      if (next.duck != null) mix.duck = next.duck;
      pushMix();
    },
    getMeters() {
      return meters;
    },
    setListener(x: number, y: number, z: number) {
      ear.x = x;
      ear.y = y;
      ear.z = z;
    },
    jump(pitch: number) {
      if (pitch < 250) kick({ id: ID.land, delay: 0, gain: 0.62, rate: 1, pan: 0, lane: 2 });
      else kick({ id: ID.jump, delay: 0, gain: 0.78, rate: Math.max(0.75, Math.min(1.7, pitch / 480)), pan: 0, lane: 2 });
    },
    hopAt(x: number, y: number, z: number, pitch: number) {
      const p = place(x, y, z, 22);
      if (p.g < 0.02) return;
      kick({ id: ID.jump, delay: 0, gain: 0.28 * p.g, rate: Math.max(0.7, Math.min(1.7, pitch / 480)), pan: p.pan, lane: 0 });
    },
    step(water: boolean) {
      kick({ id: water ? ID.water : ID.step, delay: 0, gain: water ? 0.16 : 0.1, rate: 0.9 + Math.random() * 0.2, pan: 0, lane: 0 });
    },
    shot(kind: string) {
      kick({ id: shotId(kind), delay: 0, gain: 0.34, rate: 1, pan: 0, lane: 0 });
    },
    shotAt(x: number, y: number, z: number, kind: string, self: boolean) {
      const p = self ? { g: 1, pan: 0 } : place(x, y, z, 40);
      if (p.g < 0.02) return;
      kick({ id: shotId(kind), delay: 0, gain: (self ? 0.4 : 0.3) * p.g, rate: 0.92 + Math.random() * 0.16, pan: p.pan, lane: 0 });
    },
    ding() {
      kick({ id: ID.ding, delay: 0, gain: 0.42, rate: 1, pan: 0, lane: 2 });
      kick({ id: ID.ding, delay: 0.08, gain: 0.34, rate: 1.5, pan: 0, lane: 2 });
    },
    boom() {
      kick({ id: ID.boom, delay: 0, gain: 0.7, rate: 1, pan: 0, lane: 0 });
    },
    boomAt(x: number, y: number, z: number) {
      const p = place(x, y, z, 48);
      if (p.g < 0.02) return;
      kick({ id: ID.boom, delay: 0, gain: 0.72 * p.g, rate: 1, pan: p.pan, lane: 0 });
    },
    voice(pitch: number, kind: string, charId?: string) {
      speak(kind || "hey", pitch, 0.46, 2, 0, charId || "", kind, true);
    },
    voiceAt(x: number, y: number, z: number, pitch: number, kind: string, line: string, self: boolean, charId?: string) {
      const p = self ? { g: 1, pan: 0 } : place(x, y, z, 30);
      if (p.g < 0.02) return;
      speak(line || kind || "hey", pitch, (self ? 0.56 : 0.34) * p.g, self ? 2 : 0, p.pan, charId || "", kind, self);
    },
    help(pitch: number) {
      speak("help", pitch, 0.5, 2, 0);
    },
    helpAt(x: number, y: number, z: number, pitch: number, self: boolean) {
      const p = self ? { g: 1, pan: 0 } : place(x, y, z, 28);
      if (p.g < 0.02) return;
      speak("help", pitch, (self ? 0.52 : 0.32) * p.g, self ? 2 : 0, p.pan);
    },
    splash() {
      kick({ id: ID.splash, delay: 0, gain: 0.22, rate: 1, pan: 0, lane: 0 });
    },
    splashAt(x: number, y: number, z: number) {
      const p = place(x, y, z, 24);
      if (p.g < 0.02) return;
      kick({ id: ID.splash, delay: 0, gain: 0.24 * p.g, rate: 1, pan: p.pan, lane: 0 });
    },
    laugh() {
      kick({ id: ID.laugh, delay: 0, gain: 0.4, rate: 1, pan: 0, lane: 0 });
    },
    laughAt(x: number, y: number, z: number) {
      const p = place(x, y, z, 24);
      if (p.g < 0.02) return;
      kick({ id: ID.laugh, delay: 0, gain: 0.36 * p.g, rate: 1, pan: p.pan, lane: 0 });
    },
    giggle(x: number, y: number, z: number) {
      const p = place(x, y, z, 32);
      const g = Math.max(p.g, 0.55);
      kick({ id: ID.laugh, delay: 0, gain: 0.62 * g, rate: 1.04, pan: p.pan, lane: 2 });
    },
    train() {
      kick({ id: ID.train, delay: 0, gain: 0.16, rate: 1, pan: 0, lane: 0 });
    },
    trainAt(x: number, y: number, z: number) {
      const p = place(x, y, z, 52);
      if (p.g < 0.02) return;
      kick({ id: ID.train, delay: 0, gain: 0.18 * p.g, rate: 1, pan: p.pan, lane: 0 });
    },
    stinger() {
      kick({ id: ID.ding, delay: 0, gain: 0.4, rate: 0.8, pan: 0, lane: 2 });
      kick({ id: ID.ding, delay: 0.09, gain: 0.36, rate: 1, pan: 0, lane: 2 });
      kick({ id: ID.ding, delay: 0.18, gain: 0.42, rate: 1.25, pan: 0, lane: 2 });
    },
    announce(text: string) {
      const line = text.replace(/\s+/g, " ").trim().slice(0, 180);
      if (!line) return;
      speak(line, 118, 0.78, 1, 0, "flux", "announce", true);
    },
    intro() {
      boot();
      const speakIntro = () => {
        if (introDone) return;
        introDone = true;
        const line = "Mount Dew Oh yesss";
        const lead = castOf("flux", 118, "announce", line);
        lead.f0 = fitPitch(118, 0.4);
        lead.shift = { alpha: 0.92, beta: -20, split: [0.98, 0.95, 0.94], rate: 1 };
        lead.mode = "sing";
        const left = castOf("zendaya", 206, "sing", line);
        left.f0 = fitPitch(232, 0.7);
        left.shift = { alpha: 1.04, beta: 45, split: [1.06, 1.16, 1.12], rate: 0.98 };
        const right = castOf("jlo", 198, "sing", line);
        right.f0 = fitPitch(258, 0.7);
        right.shift = { alpha: 1.06, beta: 75, split: [1.08, 1.2, 1.16], rate: 1.02 };
        kick({ id: phraseId(line, left), delay: 0, gain: 0.58, rate: 0.98, pan: -0.82, lane: 1 });
        flushNow();
        setTimeout(() => {
          if (!ctx) return;
          kick({ id: phraseId(line, lead), delay: 0, gain: 0.92, rate: 1, pan: 0, lane: 1 });
          kick({ id: phraseId(line, right), delay: 0, gain: 0.58, rate: 1.02, pan: 0.82, lane: 1 });
          flushNow();
        }, 0);
      };
      if (ctx && ctx.state !== "running") {
        void ctx.resume().then(speakIntro);
        return;
      }
      speakIntro();
    },
    cured() {
      kick({ id: ID.splash, delay: 0, gain: 0.42, rate: 1, pan: 0, lane: 2 });
      kick({ id: ID.drink, delay: 0.1, gain: 0.58, rate: 1, pan: 0, lane: 2 });
      speak("Heatstroke cured", 118, 0.86, 1, 0, "flux", "announce", true);
    },
    comment(text: string) {
      const line = text.replace(/\s+/g, " ").trim().slice(0, 180);
      if (!line) return;
      speak(line, 118, 0.6, 1, 0, "flux", "announce", true);
    },
    weather(kind: string) {
      if (kind === "rain") setLoop(ID.rain, 0.22);
      else if (kind === "snow") setLoop(ID.rain, 0.06);
      else setLoop(ID.rain, 0);
      setLoop(ID.river, kind === "rain" ? 0.08 : 0);
    },
    owl() {
      kick({ id: ID.owl, delay: 0, gain: 0.16, rate: 1, pan: 0.2, lane: 0 });
      kick({ id: ID.owl, delay: 0.32, gain: 0.14, rate: 0.86, pan: -0.15, lane: 0 });
    },
    birds() {
      kick({ id: ID.bird, delay: 0, gain: 0.1, rate: 1, pan: 0.3, lane: 0 });
      kick({ id: ID.bird, delay: 0.08, gain: 0.08, rate: 1.25, pan: -0.2, lane: 0 });
      kick({ id: ID.bird, delay: 0.16, gain: 0.07, rate: 0.9, pan: 0.1, lane: 0 });
    },
    tick(dt: number, weather: string, moving: boolean, water: boolean) {
      if (!ctx) return;
      if (moving) {
        stepAcc += dt;
        if (stepAcc > (water ? 0.28 : 0.34)) {
          stepAcc = 0;
          kick({ id: water ? ID.water : ID.step, delay: 0, gain: 0.1, rate: 0.85 + Math.random() * 0.3, pan: 0, lane: 0 });
        }
      }
      if (weather === "rain") {
        setLoop(ID.rain, 0.2);
        setLoop(ID.river, water ? 0.36 : 0.08);
      } else if (weather === "snow") {
        setLoop(ID.rain, 0.05);
        setLoop(ID.river, 0);
      } else {
        setLoop(ID.rain, 0);
        setLoop(ID.river, 0);
      }
    },
    dispose() {
      mode = "buffer";
      batch.length = 0;
      void ctx?.close();
      ctx = null;
      master = null;
      node = null;
    },
  };
}
