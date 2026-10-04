// Mount Dew mixer. MIT License. Made by Dan with Grok.
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
    this.port.onmessage = (e) => this.onMsg(e.data);
    this.base = [0.55, 1.2, 0.95];
    this.duck = 0.42;
    this.auxReturn = 0;
    this.auxBuf = new Float32Array(4096);
    this.auxPos = 0;
    this.meterCool = 0;
    this.masterPeak = 0;
    this.masterHold = 0;
    this.masterHoldAge = 0;
    this.ch = [0, 1, 2].map(() => ({
      trim: 1,
      pan: 0,
      mute: 0,
      solo: 0,
      pfl: 0,
      fader: 1,
      pol: 1,
      hpf: 0,
      aux: 0,
      pre: 0,
      x1L: 0,
      y1L: 0,
      x1R: 0,
      y1R: 0,
      peak: 0,
      hold: 0,
      holdAge: 0,
    }));
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
    if (data.cmd === "write") {
      const dst = this.bufs[data.id];
      if (!dst || data.at == null || !data.samples) return;
      dst.set(data.samples, data.at);
      return;
    }
    if (data.cmd === "gain") {
      for (let i = 0; i < this.voices.length; i++) {
        const v = this.voices[i];
        if (v.loop && v.buf === data.id) v.gain = data.gain;
      }
      return;
    }
    if (data.cmd === "mix") {
      const rows = data.ch || [];
      for (let i = 0; i < 3 && i < rows.length; i++) {
        const row = rows[i];
        const ch = this.ch[i];
        if (row.trim != null) ch.trim = row.trim;
        if (row.pan != null) ch.pan = row.pan;
        if (row.mute != null) ch.mute = row.mute ? 1 : 0;
        if (row.solo != null) ch.solo = row.solo ? 1 : 0;
        if (row.pfl != null) ch.pfl = row.pfl ? 1 : 0;
        if (row.fader != null) ch.fader = row.fader;
        if (row.pol != null) ch.pol = row.pol < 0 ? -1 : 1;
        if (row.hpf != null) ch.hpf = row.hpf;
        if (row.aux != null) ch.aux = row.aux;
        if (row.pre != null) ch.pre = row.pre ? 1 : 0;
      }
      if (data.auxReturn != null) this.auxReturn = data.auxReturn;
      if (data.duck != null) this.duck = data.duck;
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
    slot.on = 1;
    slot.buf = it.id;
    slot.pos = 0;
    slot.gain = it.gain;
    slot.rate = it.rate || 1;
    slot.start = this.clock + Math.max(0, (it.delay || 0) * sampleRate);
    slot.lane = lane;
    slot.loop = it.loop ? 1 : 0;
    const pan = Math.max(-1, Math.min(1, it.pan || 0));
    if (lane === 2) {
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
    let anySolo = 0;
    let anyPfl = 0;
    for (let c = 0; c < 3; c++) {
      if (this.ch[c].solo) anySolo = 1;
      if (this.ch[c].pfl) anyPfl = 1;
    }
    const lanes = [wL, aL, oL];
    const lanesR = [wR, aR, oR];
    const auxDelay = Math.max(1, Math.min(4095, Math.floor(sampleRate * 0.018)));
    let masterPeak = 0;
    for (let i = 0; i < n; i++) {
      let l = 0;
      let r = 0;
      let aux = 0;
      const annHot = Math.max(Math.abs(aL[i]), Math.abs(aR[i])) > 0.015;
      for (let c = 0; c < 3; c++) {
        const ch = this.ch[c];
        let xL = lanes[c][i];
        let xR = lanesR[c][i];
        if (c === 0) {
          const keep = annHot ? this.duck : 1;
          xL = (xL / (1 + Math.abs(xL))) * keep;
          xR = (xR / (1 + Math.abs(xR))) * keep;
        }
        if (ch.hpf > 15) {
          const a = Math.exp((-2 * Math.PI * ch.hpf) / sampleRate);
          ch.y1L = a * (ch.y1L + xL - ch.x1L);
          ch.x1L = xL;
          xL = ch.y1L;
          ch.y1R = a * (ch.y1R + xR - ch.x1R);
          ch.x1R = xR;
          xR = ch.y1R;
        }
        xL *= ch.pol * ch.trim;
        xR *= ch.pol * ch.trim;
        const fadedL = xL * ch.fader * this.base[c];
        const fadedR = xR * ch.fader * this.base[c];
        const sendFrom = ch.pre ? (xL + xR) * 0.5 : (fadedL + fadedR) * 0.5;
        aux += sendFrom * ch.aux;
        const open = ch.mute ? 0 : anyPfl ? (ch.pfl ? 1 : 0) : anySolo && !ch.solo ? 0 : 1;
        const p = Math.max(-1, Math.min(1, ch.pan));
        const gl = Math.cos((p + 1) * Math.PI * 0.25) * Math.SQRT2;
        const gr = Math.sin((p + 1) * Math.PI * 0.25) * Math.SQRT2;
        const busL = fadedL * gl * open;
        const busR = fadedR * gr * open;
        l += busL;
        r += busR;
        const pk = Math.max(Math.abs(busL), Math.abs(busR));
        if (pk > ch.peak) ch.peak = pk;
        if (pk >= ch.hold) {
          ch.hold = pk;
          ch.holdAge = 0;
        }
      }
      const ap = this.auxPos & 4095;
      const delayed = this.auxBuf[(ap - auxDelay) & 4095];
      this.auxBuf[ap] = aux;
      this.auxPos++;
      l += delayed * this.auxReturn;
      r += delayed * this.auxReturn;
      l /= 1 + Math.abs(l) * 0.12;
      r /= 1 + Math.abs(r) * 0.12;
      const mp = Math.max(Math.abs(l), Math.abs(r));
      if (mp > masterPeak) masterPeak = mp;
      outL[i] = outR ? l : (l + r) * 0.5;
      if (outR) outR[i] = r;
    }
    for (let c = 0; c < 3; c++) {
      const ch = this.ch[c];
      ch.peak *= 0.82;
      ch.holdAge++;
      if (ch.holdAge > (sampleRate * 0.9) / n) ch.hold *= 0.9;
    }
    if (masterPeak > this.masterPeak) this.masterPeak = masterPeak;
    else this.masterPeak *= 0.82;
    if (masterPeak >= this.masterHold) {
      this.masterHold = masterPeak;
      this.masterHoldAge = 0;
    } else if (++this.masterHoldAge > (sampleRate * 0.9) / n) this.masterHold *= 0.9;
    if (++this.meterCool >= 16) {
      this.meterCool = 0;
      this.port.postMessage({
        cmd: "meters",
        peak: [this.ch[0].peak, this.ch[1].peak, this.ch[2].peak, this.masterPeak],
        hold: [this.ch[0].hold, this.ch[1].hold, this.ch[2].hold, this.masterHold],
      });
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

class DewDither extends AudioWorkletProcessor {
  constructor() {
    super();
    this.tpdf = null;
    this.rpdf = null;
    this.pos = 0;
    this.enabled = 1;
    this.shape = 2;
    this.scale = 1 / 8388608;
    this.step = 1 / 8388608;
    this.shaping = 0;
    this.errL = 0;
    this.errR = 0;
    this.eL = [0, 0, 0, 0];
    this.eR = [0, 0, 0, 0];
    this.snap = new Float32Array(128);
    this.snapI = 0;
    this.snapCool = 0;
    this.port.onmessage = (e) => {
      const data = e.data;
      if (!data || data.cmd !== "dither") return;
      if (data.tpdf) this.tpdf = data.tpdf;
      if (data.rpdf) this.rpdf = data.rpdf;
      if (data.enabled != null) this.enabled = data.enabled ? 1 : 0;
      if (data.shape != null) this.shape = data.shape;
      if (data.scale != null) this.scale = data.scale;
      if (data.step != null) this.step = data.step;
      if (data.shaping != null) this.shaping = data.shaping;
    };
  }

  diffuse(x, err, step, noise) {
    const fb = (7 * err[0] + 5 * err[1] + 3 * err[2] + err[3]) / 16;
    const acc = Math.max(-1.5, Math.min(1.5, x + fb + noise));
    const q = Math.max(-1, Math.min(1, Math.round(acc / step) * step));
    const e = acc - q;
    err[3] = err[2];
    err[2] = err[1];
    err[1] = err[0];
    err[0] = e;
    return q;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const srcL = input && input[0];
    const srcR = (input && input[1]) || srcL;
    const dstL = output[0];
    const dstR = output[1] || null;
    const n = dstL.length;
    const table = this.shape === 1 ? this.rpdf : this.tpdf;
    if (!srcL || !this.enabled || this.shape === 0 || (this.shape !== 3 && (!table || this.scale === 0))) {
      if (srcL) dstL.set(srcL);
      if (dstR && srcR) dstR.set(srcR);
      return true;
    }
    const mask = table ? table.length - 1 : 0;
    const scale = this.scale;
    const shaping = this.shaping;
    const step = this.step > 0 ? this.step : 1 / 8388608;
    let pos = this.pos;
    let errL = this.errL;
    let errR = this.errR;
    for (let i = 0; i < n; i++) {
      const n0 = table ? table[pos & mask] * scale : 0;
      const n1 = table ? table[(pos + 1) & mask] * scale : 0;
      let yL;
      let yR;
      let draw;
      if (this.shape === 3) {
        yL = this.diffuse(srcL[i], this.eL, step, n0);
        yR = srcR ? this.diffuse(srcR[i], this.eR, step, n1) : yL;
        draw = this.eL[0];
      } else {
        errL = n0 - shaping * errL;
        errR = n1 - shaping * errR;
        yL = srcL[i] + errL;
        yR = srcR ? srcR[i] + errR : yL;
        draw = errL;
      }
      dstL[i] = yL;
      if (dstR) dstR[i] = yR;
      this.snap[this.snapI] = draw;
      this.snapI = (this.snapI + 1) & 127;
      pos += 2;
    }
    this.pos = pos;
    this.errL = errL;
    this.errR = errR;
    if (++this.snapCool >= 24) {
      this.snapCool = 0;
      const copy = new Float32Array(this.snap.length);
      for (let i = 0; i < copy.length; i++) copy[i] = this.snap[(this.snapI + i) & 127];
      this.port.postMessage({ cmd: "scope", samples: copy });
    }
    return true;
  }
}

registerProcessor("dew-dither", DewDither);

class DewWidth extends AudioWorkletProcessor {
  constructor() {
    super();
    this.width = 1;
    this.port.onmessage = (e) => {
      if (e.data && e.data.cmd === "width") this.width = Math.max(0, Math.min(2, e.data.width));
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const l = input && input[0];
    const r = (input && input[1]) || l;
    const oL = output[0];
    const oR = output[1] || null;
    if (!l) return true;
    const w = this.width;
    const n = oL.length;
    for (let i = 0; i < n; i++) {
      const L = l[i];
      const R = r ? r[i] : L;
      const mid = (L + R) * 0.5;
      const side = (L - R) * 0.5 * w;
      oL[i] = mid + side;
      if (oR) oR[i] = mid - side;
    }
    return true;
  }
}

registerProcessor("dew-width", DewWidth);
