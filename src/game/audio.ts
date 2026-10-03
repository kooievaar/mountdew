import workletSource from "../../public/game/mixer-worklet.js?raw";

export type AudioBus = {
  unlock: () => void;
  setVolume: (v: number) => void;
  setListener: (x: number, y: number, z: number) => void;
  jump: (pitch: number) => void;
  hopAt: (x: number, y: number, z: number, pitch: number) => void;
  step: (water: boolean) => void;
  shot: (kind: string) => void;
  shotAt: (x: number, y: number, z: number, kind: string, self: boolean) => void;
  ding: () => void;
  boom: () => void;
  boomAt: (x: number, y: number, z: number) => void;
  voice: (pitch: number, kind: string) => void;
  voiceAt: (x: number, y: number, z: number, pitch: number, kind: string, line: string, self: boolean) => void;
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

const VOWEL: Record<string, number> = { a: ID.a, e: ID.e, i: ID.i, o: ID.o, u: ID.u };

export function createAudio(): AudioBus {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let worldBus: GainNode | null = null;
  let node: AudioWorkletNode | null = null;
  let vol = 0.7;
  let mode: "boot" | "worklet" | "buffer" = "boot";
  let started = false;
  let windOn = false;
  let introDone = false;
  let stepAcc = 0;
  let rainAcc = 0;
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
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
    if (peak < 1e-5) return data;
    const g = amp / peak;
    for (let i = 0; i < data.length; i++) data[i] *= g;
    return data;
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
    push(noise(sr, 0.35, 0.7, 0.45, 88));
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
    g.gain.setValueAtTime(Math.max(0.001, it.gain), when);
    src.connect(g);
    const bus = it.lane ? master : worldBus || master;
    if (!it.lane && ctx.createStereoPanner) {
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

  function boot() {
    if (started) return;
    started = true;
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
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
        node.port.postMessage({ cmd: "bufs", bufs: pcm });
        mode = "worklet";
        armWind();
        flush();
      })
      .catch(() => {
        URL.revokeObjectURL(url);
        mode = "buffer";
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

  function rateOf(pitch: number) {
    return Math.max(0.45, Math.min(2.5, pitch / 200));
  }

  function speak(text: string, pitch: number, gain: number, lane: number, pan: number, gap: number) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 14);
    if (!words.length || gain < 0.004) return;
    const rate = rateOf(pitch);
    let t = 0.02;
    let n = 0;
    for (const word of words) {
      const syl = Math.min(3, Math.max(1, Math.ceil(word.length / 3)));
      for (let i = 0; i < syl; i++) {
        if (n >= 36) return;
        const slice = word.slice(i * 3, i * 3 + 3);
        const v = (slice.match(/[aeiou]/) || ["a"])[0];
        const scale = v === "i" ? 1.22 : v === "e" ? 1.08 : v === "o" || v === "u" ? 0.84 : 1;
        kick({ id: VOWEL[v] || ID.a, delay: t, gain, rate: rate * scale, pan, lane });
        t += gap;
        n++;
      }
      t += gap * 0.42;
    }
  }

  function shotId(kind: string) {
    if (kind === "rocket") return ID.rocket;
    if (kind === "flame") return ID.flame;
    if (kind === "melee") return ID.melee;
    return ID.shot;
  }

  return {
    unlock() {
      boot();
      if (ctx && ctx.state === "suspended") void ctx.resume();
    },
    setVolume(v: number) {
      vol = v;
      if (master) master.gain.value = v;
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
    voice(pitch: number, kind: string) {
      speak(kind || "hey", pitch, 0.46, 1, 0, 0.09);
    },
    voiceAt(x: number, y: number, z: number, pitch: number, kind: string, line: string, self: boolean) {
      const p = self ? { g: 1, pan: 0 } : place(x, y, z, 30);
      if (p.g < 0.02) return;
      speak(line || kind || "hey", pitch, (self ? 0.56 : 0.34) * p.g, self ? 1 : 0, p.pan, self ? 0.092 : 0.078);
    },
    help(pitch: number) {
      speak("help", pitch, 0.5, 1, 0, 0.1);
    },
    helpAt(x: number, y: number, z: number, pitch: number, self: boolean) {
      const p = self ? { g: 1, pan: 0 } : place(x, y, z, 28);
      if (p.g < 0.02) return;
      speak("help", pitch, (self ? 0.52 : 0.32) * p.g, self ? 1 : 0, p.pan, 0.1);
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
      kick({ id: ID.ding, delay: 0, gain: 0.28, rate: 0.72, pan: 0, lane: 2 });
      speak(line, 168, 0.62, 1, 0, 0.108);
    },
    intro() {
      boot();
      const speakIntro = () => {
        if (introDone) return;
        introDone = true;
        const roll = Math.floor(Math.random() * 3);
        const pitch = roll === 0 ? 150 : roll === 1 ? 240 : 360;
        speak("Mount Dew Ow yes", pitch, 0.7, 1, 0, 0.12);
      };
      if (ctx && ctx.state !== "running") {
        void ctx.resume().then(speakIntro);
        return;
      }
      speakIntro();
    },
    comment(text: string) {
      const line = text.replace(/\s+/g, " ").trim().slice(0, 180);
      if (!line) return;
      speak(line, 250, 0.5, 1, 0, 0.1);
    },
    weather(kind: string) {
      if (kind === "rain") kick({ id: ID.rain, delay: 0, gain: 0.12, rate: 1, pan: 0, lane: 0 });
      else if (kind === "snow") kick({ id: ID.bird, delay: 0, gain: 0.06, rate: 0.7, pan: 0, lane: 0 });
      else kick({ id: ID.ding, delay: 0, gain: 0.08, rate: 0.6, pan: 0, lane: 0 });
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
        rainAcc += dt;
        if (rainAcc > 0.45) {
          rainAcc = 0;
          kick({ id: ID.rain, delay: 0, gain: 0.05, rate: 0.8 + Math.random() * 0.4, pan: Math.random() * 1.4 - 0.7, lane: 0 });
        }
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
