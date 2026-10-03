class DewMixer extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufs = [];
    this.voices = [];
    this.active = [];
    this.clock = 0;
    this.pL = new Float32Array(256);
    this.pR = new Float32Array(256);
    this.wL = new Float32Array(256);
    this.wR = new Float32Array(256);
    for (let i = 0; i < 448; i++) {
      this.voices.push({ on: 0, listed: 0, buf: 0, pos: 0, gain: 0, rate: 1, start: 0, lane: 0, gl: 1, gr: 1, loop: 0 });
    }
    this.aL = new Float32Array(256);
    this.aR = new Float32Array(256);
    this.oL = new Float32Array(256);
    this.oR = new Float32Array(256);
    this.delayL = new Float32Array(16384);
    this.delayR = new Float32Array(16384);
    this.dPos = 0;
    this.lpL = 0;
    this.lpR = 0;
    this.port.onmessage = (e) => this.onMsg(e.data);
  }

  onMsg(data) {
    if (!data) return;
    if (data.cmd === "bufs") {
      this.bufs = data.bufs || [];
      return;
    }
    if (data.cmd === "addbuf") {
      this.bufs[data.id] = data.buf;
      return;
    }
    if (data.cmd === "gain") {
      for (let i = 0; i < this.voices.length; i++) {
        const v = this.voices[i];
        if (v.loop && v.buf === data.id) v.gain = data.gain;
      }
      return;
    }
    const items = data.items || [];
    for (let i = 0; i < items.length; i++) this.play(items[i]);
  }

  play(it) {
    if (!it || !this.bufs[it.id]) return;
    const lane = it.lane | 0;
    const from = lane === 2 ? 0 : lane === 1 ? 16 : 96;
    const to = lane === 2 ? 16 : lane === 1 ? 96 : 448;
    let free = null;
    for (let i = from; i < to; i++) {
      if (!this.voices[i].on) {
        free = this.voices[i];
        break;
      }
    }
    if (!free) return;
    const slot = free;
    const pan = it.pan || 0;
    slot.on = 1;
    slot.buf = it.id;
    slot.pos = 0;
    slot.gain = it.gain;
    slot.rate = it.rate || 1;
    slot.start = this.clock + Math.max(0, (it.delay || 0) * sampleRate);
    slot.lane = lane;
    slot.loop = it.loop ? 1 : 0;
    if (lane) {
      slot.gl = 1;
      slot.gr = 1;
    } else {
      slot.gl = 1 - Math.max(0, pan);
      slot.gr = 1 + Math.min(0, pan);
    }
    if (!slot.listed) {
      slot.listed = 1;
      this.active.push(slot);
    }
  }

  process(_inputs, outputs) {
    const outL = outputs[0] && outputs[0][0];
    if (!outL) return true;
    const outR = outputs[0][1] || null;
    const n = outL.length;
    if (this.aL.length < n) {
      this.aL = new Float32Array(n);
      this.aR = new Float32Array(n);
      this.oL = new Float32Array(n);
      this.oR = new Float32Array(n);
      this.wL = new Float32Array(n);
      this.wR = new Float32Array(n);
    }
    const aL = this.aL;
    const aR = this.aR;
    const oL = this.oL;
    const oR = this.oR;
    const wL = this.wL;
    const wR = this.wR;
    aL.fill(0, 0, n);
    aR.fill(0, 0, n);
    oL.fill(0, 0, n);
    oR.fill(0, 0, n);
    wL.fill(0, 0, n);
    wR.fill(0, 0, n);
    const clock = this.clock;
    const bufs = this.bufs;
    const active = this.active;
    let dead = 0;
    for (let k = 0; k < active.length; k++) {
      const v = active[k];
      if (!v.on) {
        dead++;
        continue;
      }
      const data = bufs[v.buf];
      if (!data) {
        v.on = 0;
        dead++;
        continue;
      }
      let pos = v.pos;
      const rate = v.rate;
      const gain = v.gain;
      const start = v.start;
      const gl = v.gl;
      const gr = v.gr;
      const len = data.length;
      const loop = v.loop;
      const L = v.lane === 2 ? oL : v.lane === 1 ? aL : wL;
      const R = v.lane === 2 ? oR : v.lane === 1 ? aR : wR;
      for (let i = 0; i < n; i++) {
        if (clock + i < start) continue;
        let idx = pos | 0;
        if (idx >= len) {
          if (loop) {
            pos = 0;
            idx = 0;
          } else {
            v.on = 0;
            dead++;
            break;
          }
        }
        const s = data[idx] * gain;
        L[i] += s * gl;
        R[i] += s * gr;
        pos += rate;
      }
      v.pos = pos;
    }
    const mask = this.delayL.length - 1;
    const tapA = Math.floor(sampleRate * 0.17);
    const tapB = Math.floor(sampleRate * 0.31);
    let dPos = this.dPos;
    let lpL = this.lpL;
    let lpR = this.lpR;
    let ann = 0;
    for (let i = 0; i < n; i++) ann = Math.max(ann, Math.abs(aL[i]), Math.abs(aR[i]));
    const duck = ann > 0.015 ? 0.42 : 1;
    for (let i = 0; i < n; i++) {
      const iA = (dPos - tapA) & mask;
      const iB = (dPos - tapB) & mask;
      const echoL = this.delayL[iA] * 0.46 + this.delayL[iB] * 0.24;
      const echoR = this.delayR[iA] * 0.46 + this.delayR[iB] * 0.24;
      lpL += (echoL - lpL) * 0.28;
      lpR += (echoR - lpR) * 0.28;
      const voiceL = aL[i] * 1.25 + lpL;
      const voiceR = aR[i] * 1.25 + lpR;
      const wl = (wL[i] / (1 + Math.abs(wL[i]))) * duck;
      const wr = (wR[i] / (1 + Math.abs(wR[i]))) * duck;
      let l = oL[i] * 0.95 + voiceL + wl * 0.55;
      let r = oR[i] * 0.95 + voiceR + wr * 0.55;
      l /= 1 + Math.abs(l) * 0.12;
      r /= 1 + Math.abs(r) * 0.12;
      this.delayL[dPos] = aL[i] * 0.7 + lpL * 0.32;
      this.delayR[dPos] = aR[i] * 0.7 + lpR * 0.32;
      dPos = (dPos + 1) & mask;
      outL[i] = outR ? l : (l + r) * 0.5;
      if (outR) outR[i] = r;
    }
    this.dPos = dPos;
    this.lpL = lpL;
    this.lpR = lpR;
    if (dead > 32) {
      const keep = [];
      for (let k = 0; k < active.length; k++) {
        if (active[k].on) keep.push(active[k]);
        else active[k].listed = 0;
      }
      this.active = keep;
    }
    this.clock = clock + n;
    return true;
  }
}

registerProcessor("dew-mixer", DewMixer);
