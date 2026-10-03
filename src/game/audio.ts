export type AudioBus = {
  unlock: () => void;
  setVolume: (v: number) => void;
  setListener: (x: number, y: number, z: number) => void;
  jump: (pitch: number) => void;
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
  train: () => void;
  trainAt: (x: number, y: number, z: number) => void;
  stinger: () => void;
  announce: (text: string) => void;
  comment: (text: string) => void;
  weather: (kind: string) => void;
  owl: () => void;
  birds: () => void;
  tick: (dt: number, weather: string, moving: boolean, water: boolean) => void;
  dispose: () => void;
};

const HEAR = 28;
const HEAR_FULL = 7;

export function createAudio(): AudioBus {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let vol = 0.7;
  let wind: AudioBufferSourceNode | null = null;
  let stepAcc = 0;
  let laughAcc = 0;
  const ear = { x: 0, y: 8, z: 0 };
  let pilotVoices = 0;
  let shotVoices = 0;
  let boomVoices = 0;
  let boothUntil = 0;
  const boothQueue: { text: string; form: "booth" | "color" }[] = [];

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = vol;
      master.connect(ctx.destination);
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;
      const g = ctx.createGain();
      g.gain.value = 0.025;
      src.connect(filter);
      filter.connect(g);
      g.connect(master);
      src.start();
      wind = src;
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  function envGain(duration: number, peak: number) {
    const c = ac();
    const g = c.createGain();
    g.connect(master!);
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    return { c, g, t };
  }

  function tone(freq: number, dur: number, type: OscillatorType, peak: number, slide = 0) {
    if (peak < 0.004) return;
    const { c, g, t } = envGain(dur, peak);
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur: number, peak: number, freq: number) {
    if (peak < 0.004) return;
    const c = ac();
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.7;
    const { g } = envGain(dur, peak);
    src.connect(filter);
    filter.connect(g);
    src.start();
  }

  function sequence(notes: number[], step: number, type: OscillatorType, peak: number) {
    notes.forEach((f, i) => {
      window.setTimeout(() => tone(f, step * 0.9, type, peak), i * step * 1000);
    });
  }

  function distGain(x: number, y: number, z: number, far = HEAR) {
    const d = Math.hypot(x - ear.x, y - ear.y, z - ear.z);
    if (d <= HEAR_FULL) return 1;
    if (d >= far) return 0;
    const t = (d - HEAR_FULL) / (far - HEAR_FULL);
    return (1 - t) * (1 - t);
  }

  function boothGain() {
    const alt = Math.max(0, ear.y - 16);
    const edge = Math.max(0, Math.hypot(ear.x, ear.z) - 108);
    const d = Math.hypot(alt, edge);
    if (d < 8) return 1;
    if (d > 72) return 0;
    return 1 - (d - 8) / 64;
  }

  function talk(text: string, pitch: number, peak: number, form: "pilot" | "booth" | "color") {
    const words = text
      .toLowerCase()
      .replace(/[^a-z ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5);
    if (!words.length || peak < 0.004) return 80;
    const gap = form === "color" ? 0.075 : form === "booth" ? 0.12 : 0.09;
    const type: OscillatorType = form === "booth" ? "sawtooth" : form === "color" ? "triangle" : "square";
    const base = form === "booth" ? pitch * 0.62 : form === "color" ? pitch * 1.05 : pitch;
    let n = 0;
    words.forEach((word, wi) => {
      const syl = Math.min(3, Math.max(1, Math.round(word.length / 2)));
      for (let i = 0; i < syl; i++) {
        const ch = word[Math.min(word.length - 1, i * 2)] || "a";
        const vowel = ch === "i" || ch === "e" ? 1.45 : ch === "o" || ch === "u" ? 0.72 : ch === "a" ? 1.05 : 0.9;
        const when = (n + wi * 0.15) * gap;
        const f = Math.max(70, base * vowel);
        window.setTimeout(() => {
          tone(f, gap * 0.92, type, peak, form === "pilot" ? f * 0.08 : -f * 0.06);
          tone(f * 2.1, gap * 0.7, "sine", peak * 0.35);
        }, when * 1000);
        n++;
      }
    });
    return Math.max(180, n * gap * 1000 + 40);
  }

  function playBooth(text: string, form: "booth" | "color") {
    const g = boothGain();
    if (g < 0.05) return;
    const pitch = form === "booth" ? 196 : 280;
    const ms = talk(text, pitch, (form === "booth" ? 0.11 : 0.08) * g, form);
    boothUntil = performance.now() + ms + 280;
    window.setTimeout(flushBooth, ms + 280);
  }

  function flushBooth() {
    if (performance.now() < boothUntil) return;
    const next = boothQueue.shift();
    if (next) playBooth(next.text, next.form);
  }

  function queueBooth(text: string, form: "booth" | "color") {
    if (!text) return;
    if (performance.now() >= boothUntil && boothQueue.length === 0) playBooth(text, form);
    else if (boothQueue.length < 2) boothQueue.push({ text, form });
  }

  function announceLine(text: string) {
    const s = text.toLowerCase();
    if (s.includes("captured")) return "flag captured";
    if (s.includes("took")) return "flag taken";
    if (s.includes("returned")) return "flag returned";
    if (s.includes("surge")) return "speed surge";
    if (s.includes("holds the hill")) return "hill secured";
    if (s.includes("revived")) return "pilot revived";
    if (s.includes("mutant") || s.includes("raised")) return "mutant risen";
    return "";
  }

  function shotBody(kind: string, peak: number) {
    if (kind === "trace") noise(0.07, peak, 1400);
    else if (kind === "rocket") noise(0.2, peak, 220);
    else if (kind === "flame") noise(0.08, peak * 0.7, 700);
    else if (kind === "melee") tone(180, 0.08, "square", peak * 0.6);
    else noise(0.1, peak * 0.8, 600);
  }

  return {
    unlock() {
      ac();
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
      tone(pitch, 0.16, "sine", 0.08, pitch * 0.4);
    },
    step(water: boolean) {
      noise(water ? 0.12 : 0.05, water ? 0.07 : 0.04, water ? 500 : 180);
    },
    shot(kind: string) {
      shotBody(kind, 0.09);
    },
    shotAt(x: number, y: number, z: number, kind: string, self: boolean) {
      const g = self ? Math.max(0.9, distGain(x, y, z, 36)) : distGain(x, y, z, 36);
      if (g < 0.05) return;
      if (!self && shotVoices >= 3) return;
      shotVoices++;
      window.setTimeout(() => {
        shotVoices = Math.max(0, shotVoices - 1);
      }, 90);
      shotBody(kind, 0.1 * g);
    },
    ding() {
      tone(880, 0.12, "sine", 0.08);
      tone(1320, 0.18, "triangle", 0.05);
    },
    boom() {
      noise(0.28, 0.12, 140);
      tone(90, 0.22, "sine", 0.08, -40);
    },
    boomAt(x: number, y: number, z: number) {
      const g = distGain(x, y, z, 40);
      if (g < 0.05 || boomVoices >= 2) return;
      boomVoices++;
      window.setTimeout(() => {
        boomVoices = Math.max(0, boomVoices - 1);
      }, 280);
      noise(0.28, 0.12 * g, 140);
      tone(90, 0.22, "sine", 0.08 * g, -40);
    },
    voice(pitch: number, kind: string) {
      sequence([pitch, pitch * 1.25], 0.09, "sine", 0.07);
      void kind;
    },
    voiceAt(x: number, y: number, z: number, pitch: number, kind: string, line: string, self: boolean) {
      const g = self ? 1 : distGain(x, y, z, 24);
      if (g < 0.08) return;
      if (!self && pilotVoices >= 2) return;
      pilotVoices++;
      const phrase = line || kind || "hey";
      const ms = talk(phrase, Math.max(90, pitch), 0.13 * g, "pilot");
      window.setTimeout(() => {
        pilotVoices = Math.max(0, pilotVoices - 1);
      }, ms);
    },
    help(pitch: number) {
      sequence([pitch, pitch * 0.8, pitch], 0.14, "sine", 0.07);
    },
    helpAt(x: number, y: number, z: number, pitch: number, self: boolean) {
      const g = self ? 1 : distGain(x, y, z, 22);
      if (g < 0.08 || (!self && pilotVoices >= 2)) return;
      pilotVoices++;
      const ms = talk("help", Math.max(90, pitch), 0.12 * g, "pilot");
      window.setTimeout(() => {
        pilotVoices = Math.max(0, pilotVoices - 1);
      }, ms);
    },
    splash() {
      noise(0.18, 0.08, 900);
    },
    splashAt(x: number, y: number, z: number) {
      const g = distGain(x, y, z, 22);
      if (g < 0.05) return;
      noise(0.18, 0.08 * g, 900);
    },
    laugh() {
      tone(500 + Math.random() * 200, 0.1, "square", 0.04, 80);
    },
    laughAt(x: number, y: number, z: number) {
      const g = distGain(x, y, z, 22);
      if (g < 0.05) return;
      tone(500 + Math.random() * 200, 0.1, "square", 0.045 * g, 80);
    },
    train() {
      noise(0.16, 0.05, 120);
      tone(440, 0.2, "triangle", 0.03);
    },
    trainAt(x: number, y: number, z: number) {
      const g = distGain(x, y, z, 46);
      if (g < 0.05) return;
      noise(0.16, 0.05 * g, 120);
      tone(440, 0.2, "triangle", 0.035 * g);
    },
    stinger() {
      sequence([523, 659, 784], 0.09, "triangle", 0.05 * boothGain());
    },
    announce(text: string) {
      const line = announceLine(text);
      if (!line) return;
      tone(220, 0.08, "triangle", 0.04 * boothGain());
      queueBooth(line, "booth");
    },
    comment(text: string) {
      if (performance.now() < boothUntil) return;
      queueBooth(text, "color");
    },
    weather(kind: string) {
      const g = boothGain();
      if (kind === "rain") noise(0.4, 0.04 * g, 1000);
      else if (kind === "snow") tone(1200, 0.2, "sine", 0.02 * g);
      else tone(660, 0.15, "sine", 0.03 * g);
    },
    owl() {
      const g = boothGain();
      tone(330, 0.25, "sine", 0.05 * g, -80);
      window.setTimeout(() => tone(280, 0.3, "sine", 0.04 * g, -60), 280);
    },
    birds() {
      sequence([1400, 1800, 1500], 0.07, "sine", 0.03 * boothGain());
    },
    tick(dt: number, weather: string, moving: boolean, water: boolean) {
      if (!ctx) return;
      if (moving) {
        stepAcc += dt;
        const every = water ? 0.28 : 0.34;
        if (stepAcc > every) {
          stepAcc = 0;
          noise(water ? 0.1 : 0.04, 0.035, water ? 480 : 160);
        }
      }
      if (weather === "rain") {
        laughAcc += dt;
        if (laughAcc > 0.45) {
          laughAcc = 0;
          noise(0.12, 0.015 * boothGain(), 1500);
        }
      }
    },
    dispose() {
      try {
        wind?.stop();
      } catch {
        /* already stopped */
      }
      void ctx?.close();
      ctx = null;
      master = null;
    },
  };
}
