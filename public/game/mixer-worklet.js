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
    this.port.onmessage = (e) => this.onMsg(e.data);
  }

  onMsg(data) {
    if (!data) return;
    if (data.cmd === "bufs") {
      this.bufs = data.bufs || [];
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
    let old = null;
    let oldT = 1e18;
    for (let i = from; i < to; i++) {
      const v = this.voices[i];
      if (!v.on) {
        free = v;
        break;
      }
      if (v.start < oldT) {
        oldT = v.start;
        old = v;
      }
    }
    const slot = free || old;
    if (!slot) return;
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
    if (this.pL.length < n) {
      this.pL = new Float32Array(n);
      this.pR = new Float32Array(n);
      this.wL = new Float32Array(n);
      this.wR = new Float32Array(n);
    }
    const pL = this.pL;
    const pR = this.pR;
    const wL = this.wL;
    const wR = this.wR;
    pL.fill(0, 0, n);
    pR.fill(0, 0, n);
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
      const L = v.lane ? pL : wL;
      const R = v.lane ? pR : wR;
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
    for (let i = 0; i < n; i++) {
      const wl = wL[i] / (1 + Math.abs(wL[i]));
      const wr = wR[i] / (1 + Math.abs(wR[i]));
      let l = pL[i] * 0.92 + wl * 0.5;
      let r = pR[i] * 0.92 + wr * 0.5;
      l /= 1 + Math.abs(l) * 0.15;
      r /= 1 + Math.abs(r) * 0.15;
      outL[i] = outR ? l : (l + r) * 0.5;
      if (outR) outR[i] = r;
    }
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
