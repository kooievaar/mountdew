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

export function createAudio(): AudioBus {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  let voiceBus: GainNode | null = null;
  let boothBus: GainNode | null = null;
  let noiseBuf: AudioBuffer | null = null;
  let vol = 0.7;
  let wind: AudioBufferSourceNode | null = null;
  let stepAcc = 0;
  let laughAcc = 0;
  const ear = { x: 0, y: 8, z: 0 };
  let pilotVoices = 0;
  let giggleOn = 0;
  let shotVoices = 0;
  let boomVoices = 0;
  let introDone = false;
  let boothUntil = 0;
  const boothQueue: { text: string; form: "booth" | "color" }[] = [];

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = vol;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.8;
      sfxBus.connect(master);
      voiceBus = ctx.createGain();
      voiceBus.gain.value = 1;
      voiceBus.connect(master);
      boothBus = ctx.createGain();
      boothBus.gain.value = 1;
      boothBus.connect(master);
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

  function envGain(duration: number, peak: number, bus?: GainNode | null) {
    const c = ac();
    const g = c.createGain();
    g.connect(bus || sfxBus || master!);
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.04, duration));
    return { c, g, t };
  }

  function tone(freq: number, dur: number, type: OscillatorType, peak: number, slide = 0, bus?: GainNode | null) {
    if (peak < 0.004) return;
    const { c, g, t } = envGain(dur, peak, bus);
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(40, freq), t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur: number, peak: number, freq: number) {
    if (peak < 0.004) return;
    const c = ac();
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.8;
    const { g, t } = envGain(dur, peak, sfxBus);
    src.connect(filter);
    filter.connect(g);
    const offset = Math.random() * Math.max(0, noiseBuf.duration - dur);
    src.start(t, offset);
    src.stop(t + dur + 0.02);
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
      .replace(/[^a-z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 18);
    if (!words.length || peak < 0.004) return 80;
    const bus = form === "pilot" ? voiceBus : boothBus;
    const gap = form === "color" ? 0.11 : form === "booth" ? 0.15 : 0.12;
    const type: OscillatorType = form === "booth" ? "triangle" : "sine";
    const base = form === "booth" ? Math.max(150, pitch) : form === "color" ? pitch : pitch;
    const c = ac();
    const start = c.currentTime + 0.03;
    let n = 0;
    words.forEach((word, wi) => {
      const syl = Math.min(4, Math.max(1, Math.ceil(word.length / 3)));
      for (let i = 0; i < syl; i++) {
        const ch = word[Math.min(word.length - 1, i)] || "a";
        const vowel = ch === "i" || ch === "e" ? 1.35 : ch === "o" || ch === "u" ? 0.78 : ch === "a" ? 1.08 : 0.95;
        const when = start + (n + wi * 0.2) * gap;
        const f = Math.max(80, base * vowel);
        const dur = gap * 0.92;
        const g = c.createGain();
        g.connect(bus || master!);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), when + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        const o = c.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f, when);
        o.frequency.exponentialRampToValueAtTime(Math.max(70, f * (form === "pilot" ? 1.06 : 0.94)), when + dur);
        o.connect(g);
        o.start(when);
        o.stop(when + dur + 0.02);
        const h = c.createOscillator();
        const hg = c.createGain();
        hg.connect(bus || master!);
        hg.gain.setValueAtTime(0.0001, when);
        hg.gain.exponentialRampToValueAtTime(Math.max(0.001, peak * 0.28), when + 0.02);
        hg.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.8);
        h.type = "sine";
        h.frequency.setValueAtTime(f * 2, when);
        h.connect(hg);
        h.start(when);
        h.stop(when + dur);
        n++;
      }
    });
    return Math.max(280, (n + words.length * 0.2) * gap * 1000 + 80);
  }

  function playBooth(text: string, form: "booth" | "color") {
    const g = form === "booth" ? Math.max(0.75, boothGain()) : Math.max(0.4, boothGain());
    const pitch = form === "booth" ? 210 : 320;
    const ms = talk(text, pitch, (form === "booth" ? 0.14 : 0.1) * g, form);
    boothUntil = performance.now() + ms + 180;
    window.setTimeout(flushBooth, ms + 180);
  }

  function flushBooth() {
    if (performance.now() < boothUntil) return;
    const next = boothQueue.shift();
    if (next) playBooth(next.text, next.form);
  }

  function queueBooth(text: string, form: "booth" | "color") {
    if (!text) return;
    if (performance.now() >= boothUntil && boothQueue.length === 0) playBooth(text, form);
    else if (boothQueue.length < 8) boothQueue.push({ text, form });
  }

  function announceLine(text: string) {
    return text.replace(/\s+/g, " ").trim().slice(0, 180);
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
      if (!self && shotVoices >= 8) return;
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
      if (!self && pilotVoices >= 4) return;
      pilotVoices++;
      const phrase = line || kind || "hey";
      const ms = talk(phrase, Math.max(90, pitch), 0.16 * g, "pilot");
      window.setTimeout(() => {
        pilotVoices = Math.max(0, pilotVoices - 1);
      }, ms);
    },
    help(pitch: number) {
      sequence([pitch, pitch * 0.8, pitch], 0.14, "sine", 0.07);
    },
    helpAt(x: number, y: number, z: number, pitch: number, self: boolean) {
      const g = self ? 1 : distGain(x, y, z, 22);
      if (g < 0.08 || (!self && pilotVoices >= 4)) return;
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
    giggle(x: number, y: number, z: number) {
      const g = distGain(x, y, z, 26);
      if (g < 0.05 || giggleOn >= 2) return;
      giggleOn++;
      const ms = talk("Hahaha Hihihi Hahaha", 620, 0.18 * g, "pilot");
      window.setTimeout(() => {
        giggleOn = Math.max(0, giggleOn - 1);
      }, ms);
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
      queueBooth(line, "booth");
    },
    intro() {
      const c = ac();
      const speak = () => {
        if (introDone) return;
        introDone = true;
        const roll = Math.floor(Math.random() * 3);
        const pitch = roll === 0 ? 96 : roll === 1 ? 230 : 410;
        const form = roll === 0 ? "booth" : roll === 1 ? "color" : "pilot";
        talk("Mount Dew Ow yes", pitch, 0.22, form);
      };
      if (c.state !== "running") {
        void c.resume().then(speak);
        return;
      }
      speak();
    },
    comment(text: string) {
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
