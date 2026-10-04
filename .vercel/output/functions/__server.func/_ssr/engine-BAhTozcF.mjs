import { a as CHAR_BY_ID, c as rankForLevel, d as dropRelay, f as netPulse, i as CHARACTERS, l as spokenLine, m as sendRelayNop, n as BOT_NAMES, o as TEAMS, p as sendRelayAnnounce, r as BUILD_ACTIONS, s as WEAPON_BY_ID, u as xpToLevel } from "./routes-Bg182hlX.mjs";
import { A as MeshLambertMaterial, B as Quaternion, C as Line, D as Matrix4, E as MathUtils, F as OctahedronGeometry, G as SkinnedMesh, H as SRGBColorSpace, I as PerspectiveCamera, J as TorusGeometry, K as SphereGeometry, L as PlaneGeometry, M as MeshToonMaterial, N as NearestFilter, O as Mesh, P as Object3D, R as Points, S as InstancedMesh, T as LineSegments, U as Scene, V as RepeatWrapping, W as Skeleton, X as Vector3, Y as Uint16BufferAttribute, _ as Float32BufferAttribute, a as BufferAttribute, b as HemisphereLight, c as CircleGeometry, d as ConeGeometry, f as CylinderGeometry, g as Euler, h as DodecahedronGeometry, i as BoxGeometry, j as MeshPhongMaterial, k as MeshBasicMaterial, l as ClampToEdgeWrapping, m as DirectionalLight, n as AmbientLight, o as BufferGeometry, p as DataTexture, q as Timer, r as Bone, s as CanvasTexture, t as WebGLRenderer, u as Color, v as Fog, w as LineBasicMaterial, x as InstancedBufferAttribute, y as Group, z as PointsMaterial } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-BAhTozcF.js
var mixer_worklet_default = "// Mount Dew mixer. MIT License. Made by Dan with Grok.\nclass DewMixer extends AudioWorkletProcessor {\n  constructor() {\n    super();\n    this.bufs = [];\n    this.voices = [];\n    this.active = [];\n    this.clock = 0;\n    this.pL = new Float32Array(256);\n    this.pR = new Float32Array(256);\n    this.wL = new Float32Array(256);\n    this.wR = new Float32Array(256);\n    for (let i = 0; i < 448; i++) {\n      this.voices.push({ on: 0, listed: 0, buf: 0, pos: 0, gain: 0, rate: 1, start: 0, lane: 0, gl: 1, gr: 1, loop: 0 });\n    }\n    this.aL = new Float32Array(256);\n    this.aR = new Float32Array(256);\n    this.oL = new Float32Array(256);\n    this.oR = new Float32Array(256);\n    this.port.onmessage = (e) => this.onMsg(e.data);\n    this.base = [0.55, 1.2, 0.95];\n    this.duck = 0.42;\n    this.auxReturn = 0;\n    this.auxBuf = new Float32Array(4096);\n    this.auxPos = 0;\n    this.meterCool = 0;\n    this.masterPeak = 0;\n    this.masterHold = 0;\n    this.masterHoldAge = 0;\n    this.ch = [0, 1, 2].map(() => ({\n      trim: 1,\n      pan: 0,\n      mute: 0,\n      solo: 0,\n      pfl: 0,\n      fader: 1,\n      pol: 1,\n      hpf: 0,\n      aux: 0,\n      pre: 0,\n      x1L: 0,\n      y1L: 0,\n      x1R: 0,\n      y1R: 0,\n      peak: 0,\n      hold: 0,\n      holdAge: 0,\n    }));\n  }\n\n  onMsg(data) {\n    if (!data) return;\n    if (data.cmd === \"bufs\") {\n      this.bufs = data.bufs || [];\n      return;\n    }\n    if (data.cmd === \"addbuf\") {\n      this.bufs[data.id] = data.buf;\n      return;\n    }\n    if (data.cmd === \"write\") {\n      const dst = this.bufs[data.id];\n      if (!dst || data.at == null || !data.samples) return;\n      dst.set(data.samples, data.at);\n      return;\n    }\n    if (data.cmd === \"gain\") {\n      for (let i = 0; i < this.voices.length; i++) {\n        const v = this.voices[i];\n        if (v.loop && v.buf === data.id) v.gain = data.gain;\n      }\n      return;\n    }\n    if (data.cmd === \"mix\") {\n      const rows = data.ch || [];\n      for (let i = 0; i < 3 && i < rows.length; i++) {\n        const row = rows[i];\n        const ch = this.ch[i];\n        if (row.trim != null) ch.trim = row.trim;\n        if (row.pan != null) ch.pan = row.pan;\n        if (row.mute != null) ch.mute = row.mute ? 1 : 0;\n        if (row.solo != null) ch.solo = row.solo ? 1 : 0;\n        if (row.pfl != null) ch.pfl = row.pfl ? 1 : 0;\n        if (row.fader != null) ch.fader = row.fader;\n        if (row.pol != null) ch.pol = row.pol < 0 ? -1 : 1;\n        if (row.hpf != null) ch.hpf = row.hpf;\n        if (row.aux != null) ch.aux = row.aux;\n        if (row.pre != null) ch.pre = row.pre ? 1 : 0;\n      }\n      if (data.auxReturn != null) this.auxReturn = data.auxReturn;\n      if (data.duck != null) this.duck = data.duck;\n      return;\n    }\n    const items = data.items || [];\n    for (let i = 0; i < items.length; i++) this.play(items[i]);\n  }\n\n  play(it) {\n    if (!it || !this.bufs[it.id]) return;\n    const lane = it.lane | 0;\n    const from = lane === 2 ? 0 : lane === 1 ? 16 : 96;\n    const to = lane === 2 ? 16 : lane === 1 ? 96 : 448;\n    let free = null;\n    for (let i = from; i < to; i++) {\n      if (!this.voices[i].on) {\n        free = this.voices[i];\n        break;\n      }\n    }\n    if (!free) return;\n    const slot = free;\n    slot.on = 1;\n    slot.buf = it.id;\n    slot.pos = 0;\n    slot.gain = it.gain;\n    slot.rate = it.rate || 1;\n    slot.start = this.clock + Math.max(0, (it.delay || 0) * sampleRate);\n    slot.lane = lane;\n    slot.loop = it.loop ? 1 : 0;\n    const pan = Math.max(-1, Math.min(1, it.pan || 0));\n    if (lane === 2) {\n      slot.gl = 1;\n      slot.gr = 1;\n    } else {\n      slot.gl = 1 - Math.max(0, pan);\n      slot.gr = 1 + Math.min(0, pan);\n    }\n    if (!slot.listed) {\n      slot.listed = 1;\n      this.active.push(slot);\n    }\n  }\n\n  process(_inputs, outputs) {\n    const outL = outputs[0] && outputs[0][0];\n    if (!outL) return true;\n    const outR = outputs[0][1] || null;\n    const n = outL.length;\n    if (this.aL.length < n) {\n      this.aL = new Float32Array(n);\n      this.aR = new Float32Array(n);\n      this.oL = new Float32Array(n);\n      this.oR = new Float32Array(n);\n      this.wL = new Float32Array(n);\n      this.wR = new Float32Array(n);\n    }\n    const aL = this.aL;\n    const aR = this.aR;\n    const oL = this.oL;\n    const oR = this.oR;\n    const wL = this.wL;\n    const wR = this.wR;\n    aL.fill(0, 0, n);\n    aR.fill(0, 0, n);\n    oL.fill(0, 0, n);\n    oR.fill(0, 0, n);\n    wL.fill(0, 0, n);\n    wR.fill(0, 0, n);\n    const clock = this.clock;\n    const bufs = this.bufs;\n    const active = this.active;\n    let dead = 0;\n    for (let k = 0; k < active.length; k++) {\n      const v = active[k];\n      if (!v.on) {\n        dead++;\n        continue;\n      }\n      const data = bufs[v.buf];\n      if (!data) {\n        v.on = 0;\n        dead++;\n        continue;\n      }\n      let pos = v.pos;\n      const rate = v.rate;\n      const gain = v.gain;\n      const start = v.start;\n      const gl = v.gl;\n      const gr = v.gr;\n      const len = data.length;\n      const loop = v.loop;\n      const L = v.lane === 2 ? oL : v.lane === 1 ? aL : wL;\n      const R = v.lane === 2 ? oR : v.lane === 1 ? aR : wR;\n      for (let i = 0; i < n; i++) {\n        if (clock + i < start) continue;\n        let idx = pos | 0;\n        if (idx >= len) {\n          if (loop) {\n            pos = 0;\n            idx = 0;\n          } else {\n            v.on = 0;\n            dead++;\n            break;\n          }\n        }\n        const s = data[idx] * gain;\n        L[i] += s * gl;\n        R[i] += s * gr;\n        pos += rate;\n      }\n      v.pos = pos;\n    }\n    let anySolo = 0;\n    let anyPfl = 0;\n    for (let c = 0; c < 3; c++) {\n      if (this.ch[c].solo) anySolo = 1;\n      if (this.ch[c].pfl) anyPfl = 1;\n    }\n    const lanes = [wL, aL, oL];\n    const lanesR = [wR, aR, oR];\n    const auxDelay = Math.max(1, Math.min(4095, Math.floor(sampleRate * 0.018)));\n    let masterPeak = 0;\n    for (let i = 0; i < n; i++) {\n      let l = 0;\n      let r = 0;\n      let aux = 0;\n      const annHot = Math.max(Math.abs(aL[i]), Math.abs(aR[i])) > 0.015;\n      for (let c = 0; c < 3; c++) {\n        const ch = this.ch[c];\n        let xL = lanes[c][i];\n        let xR = lanesR[c][i];\n        if (c === 0) {\n          const keep = annHot ? this.duck : 1;\n          xL = (xL / (1 + Math.abs(xL))) * keep;\n          xR = (xR / (1 + Math.abs(xR))) * keep;\n        }\n        if (ch.hpf > 15) {\n          const a = Math.exp((-2 * Math.PI * ch.hpf) / sampleRate);\n          ch.y1L = a * (ch.y1L + xL - ch.x1L);\n          ch.x1L = xL;\n          xL = ch.y1L;\n          ch.y1R = a * (ch.y1R + xR - ch.x1R);\n          ch.x1R = xR;\n          xR = ch.y1R;\n        }\n        xL *= ch.pol * ch.trim;\n        xR *= ch.pol * ch.trim;\n        const fadedL = xL * ch.fader * this.base[c];\n        const fadedR = xR * ch.fader * this.base[c];\n        const sendFrom = ch.pre ? (xL + xR) * 0.5 : (fadedL + fadedR) * 0.5;\n        aux += sendFrom * ch.aux;\n        const open = ch.mute ? 0 : anyPfl ? (ch.pfl ? 1 : 0) : anySolo && !ch.solo ? 0 : 1;\n        const p = Math.max(-1, Math.min(1, ch.pan));\n        const gl = Math.cos((p + 1) * Math.PI * 0.25) * Math.SQRT2;\n        const gr = Math.sin((p + 1) * Math.PI * 0.25) * Math.SQRT2;\n        const busL = fadedL * gl * open;\n        const busR = fadedR * gr * open;\n        l += busL;\n        r += busR;\n        const pk = Math.max(Math.abs(busL), Math.abs(busR));\n        if (pk > ch.peak) ch.peak = pk;\n        if (pk >= ch.hold) {\n          ch.hold = pk;\n          ch.holdAge = 0;\n        }\n      }\n      const ap = this.auxPos & 4095;\n      const delayed = this.auxBuf[(ap - auxDelay) & 4095];\n      this.auxBuf[ap] = aux;\n      this.auxPos++;\n      l += delayed * this.auxReturn;\n      r += delayed * this.auxReturn;\n      l /= 1 + Math.abs(l) * 0.12;\n      r /= 1 + Math.abs(r) * 0.12;\n      const mp = Math.max(Math.abs(l), Math.abs(r));\n      if (mp > masterPeak) masterPeak = mp;\n      outL[i] = outR ? l : (l + r) * 0.5;\n      if (outR) outR[i] = r;\n    }\n    for (let c = 0; c < 3; c++) {\n      const ch = this.ch[c];\n      ch.peak *= 0.82;\n      ch.holdAge++;\n      if (ch.holdAge > (sampleRate * 0.9) / n) ch.hold *= 0.9;\n    }\n    if (masterPeak > this.masterPeak) this.masterPeak = masterPeak;\n    else this.masterPeak *= 0.82;\n    if (masterPeak >= this.masterHold) {\n      this.masterHold = masterPeak;\n      this.masterHoldAge = 0;\n    } else if (++this.masterHoldAge > (sampleRate * 0.9) / n) this.masterHold *= 0.9;\n    if (++this.meterCool >= 16) {\n      this.meterCool = 0;\n      this.port.postMessage({\n        cmd: \"meters\",\n        peak: [this.ch[0].peak, this.ch[1].peak, this.ch[2].peak, this.masterPeak],\n        hold: [this.ch[0].hold, this.ch[1].hold, this.ch[2].hold, this.masterHold],\n      });\n    }\n    if (dead > 32) {\n      const keep = [];\n      for (let k = 0; k < active.length; k++) {\n        if (active[k].on) keep.push(active[k]);\n        else active[k].listed = 0;\n      }\n      this.active = keep;\n    }\n    this.clock = clock + n;\n    return true;\n  }\n}\n\nregisterProcessor(\"dew-mixer\", DewMixer);\n\nclass DewDither extends AudioWorkletProcessor {\n  constructor() {\n    super();\n    this.tpdf = null;\n    this.rpdf = null;\n    this.pos = 0;\n    this.enabled = 1;\n    this.shape = 2;\n    this.scale = 1 / 8388608;\n    this.step = 1 / 8388608;\n    this.shaping = 0;\n    this.errL = 0;\n    this.errR = 0;\n    this.eL = [0, 0, 0, 0];\n    this.eR = [0, 0, 0, 0];\n    this.snap = new Float32Array(128);\n    this.snapI = 0;\n    this.snapCool = 0;\n    this.port.onmessage = (e) => {\n      const data = e.data;\n      if (!data || data.cmd !== \"dither\") return;\n      if (data.tpdf) this.tpdf = data.tpdf;\n      if (data.rpdf) this.rpdf = data.rpdf;\n      if (data.enabled != null) this.enabled = data.enabled ? 1 : 0;\n      if (data.shape != null) this.shape = data.shape;\n      if (data.scale != null) this.scale = data.scale;\n      if (data.step != null) this.step = data.step;\n      if (data.shaping != null) this.shaping = data.shaping;\n    };\n  }\n\n  diffuse(x, err, step, noise) {\n    const fb = (7 * err[0] + 5 * err[1] + 3 * err[2] + err[3]) / 16;\n    const acc = Math.max(-1.5, Math.min(1.5, x + fb + noise));\n    const q = Math.max(-1, Math.min(1, Math.round(acc / step) * step));\n    const e = acc - q;\n    err[3] = err[2];\n    err[2] = err[1];\n    err[1] = err[0];\n    err[0] = e;\n    return q;\n  }\n\n  process(inputs, outputs) {\n    const input = inputs[0];\n    const output = outputs[0];\n    if (!output || !output[0]) return true;\n    const srcL = input && input[0];\n    const srcR = (input && input[1]) || srcL;\n    const dstL = output[0];\n    const dstR = output[1] || null;\n    const n = dstL.length;\n    const table = this.shape === 1 ? this.rpdf : this.tpdf;\n    if (!srcL || !this.enabled || this.shape === 0 || (this.shape !== 3 && (!table || this.scale === 0))) {\n      if (srcL) dstL.set(srcL);\n      if (dstR && srcR) dstR.set(srcR);\n      return true;\n    }\n    const mask = table ? table.length - 1 : 0;\n    const scale = this.scale;\n    const shaping = this.shaping;\n    const step = this.step > 0 ? this.step : 1 / 8388608;\n    let pos = this.pos;\n    let errL = this.errL;\n    let errR = this.errR;\n    for (let i = 0; i < n; i++) {\n      const n0 = table ? table[pos & mask] * scale : 0;\n      const n1 = table ? table[(pos + 1) & mask] * scale : 0;\n      let yL;\n      let yR;\n      let draw;\n      if (this.shape === 3) {\n        yL = this.diffuse(srcL[i], this.eL, step, n0);\n        yR = srcR ? this.diffuse(srcR[i], this.eR, step, n1) : yL;\n        draw = this.eL[0];\n      } else {\n        errL = n0 - shaping * errL;\n        errR = n1 - shaping * errR;\n        yL = srcL[i] + errL;\n        yR = srcR ? srcR[i] + errR : yL;\n        draw = errL;\n      }\n      dstL[i] = yL;\n      if (dstR) dstR[i] = yR;\n      this.snap[this.snapI] = draw;\n      this.snapI = (this.snapI + 1) & 127;\n      pos += 2;\n    }\n    this.pos = pos;\n    this.errL = errL;\n    this.errR = errR;\n    if (++this.snapCool >= 24) {\n      this.snapCool = 0;\n      const copy = new Float32Array(this.snap.length);\n      for (let i = 0; i < copy.length; i++) copy[i] = this.snap[(this.snapI + i) & 127];\n      this.port.postMessage({ cmd: \"scope\", samples: copy });\n    }\n    return true;\n  }\n}\n\nregisterProcessor(\"dew-dither\", DewDither);\n\nclass DewWidth extends AudioWorkletProcessor {\n  constructor() {\n    super();\n    this.width = 1;\n    this.port.onmessage = (e) => {\n      if (e.data && e.data.cmd === \"width\") this.width = Math.max(0, Math.min(2, e.data.width));\n    };\n  }\n\n  process(inputs, outputs) {\n    const input = inputs[0];\n    const output = outputs[0];\n    if (!output || !output[0]) return true;\n    const l = input && input[0];\n    const r = (input && input[1]) || l;\n    const oL = output[0];\n    const oR = output[1] || null;\n    if (!l) return true;\n    const w = this.width;\n    const n = oL.length;\n    for (let i = 0; i < n; i++) {\n      const L = l[i];\n      const R = r ? r[i] : L;\n      const mid = (L + R) * 0.5;\n      const side = (L - R) * 0.5 * w;\n      oL[i] = mid + side;\n      if (oR) oR[i] = mid - side;\n    }\n    return true;\n  }\n}\n\nregisterProcessor(\"dew-width\", DewWidth);\n";
var params = {
	enabled: true,
	shape: "tpdf",
	bits: 24,
	amount: 1,
	shaping: 0
};
function setDitherParams(next) {
	const bits = next.bits === 16 || next.bits === 32 ? next.bits : next.bits === 24 ? 24 : params.bits;
	const shape = next.shape === "off" || next.shape === "rpdf" || next.shape === "tpdf" || next.shape === "floyd" ? next.shape : params.shape;
	params = {
		enabled: next.enabled ?? params.enabled,
		shape,
		bits,
		amount: Math.max(0, Math.min(2, next.amount ?? params.amount)),
		shaping: Math.max(0, Math.min(.98, next.shaping ?? params.shaping))
	};
	return params;
}
function ditherParams() {
	return params;
}
function ditherStep(p = params) {
	return p.bits === 16 ? 1 / 32768 : p.bits === 32 ? 1 / 2147483648 : 1 / 8388608;
}
function ditherScale(p = params) {
	if (!p.enabled || p.shape === "off" || p.amount <= 0) return 0;
	return ditherStep(p) * p.amount;
}
function uniform(seed) {
	let s = seed >>> 0;
	return () => {
		s = Math.imul(s, 1664525) + 1013904223 >>> 0;
		return s / 4294967296;
	};
}
function buildTable(n, seed, triangular) {
	const next = uniform(seed);
	const table = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const a = next();
		table[i] = triangular ? a + next() - 1 : a * 2 - 1;
	}
	return table;
}
/** Unit rectangular dither, range ±1 before the bit-depth scale. */
var DITHER_RPDF = buildTable(4096, 1374496523, false);
/** Unit triangular dither, range ±1 before the bit-depth scale. */
var DITHER_TPDF = buildTable(4096, 1831565813, true);
var cursor = 0;
function nextDither() {
	const v = (params.shape === "rpdf" ? DITHER_RPDF : DITHER_TPDF)[cursor & 4095] * ditherScale();
	cursor = cursor + 1 & 4095;
	return v;
}
function ditherInto(data, gain) {
	let peak = 0;
	for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
	if (peak < 1e-5) return data;
	const g = gain / peak;
	if (params.shape === "floyd" && params.enabled) {
		const step = ditherStep();
		const err = [
			0,
			0,
			0,
			0
		];
		for (let i = 0; i < data.length; i++) {
			const fb = (7 * err[0] + 5 * err[1] + 3 * err[2] + err[3]) / 16;
			const acc = data[i] * g + fb;
			const q = Math.max(-1, Math.min(1, Math.round(acc / step) * step));
			const e = acc - q;
			err[3] = err[2];
			err[2] = err[1];
			err[1] = err[0];
			err[0] = e;
			data[i] = q;
		}
		return data;
	}
	const scale = ditherScale();
	for (let i = 0; i < data.length; i++) data[i] = data[i] * g + (scale ? nextDither() : 0);
	return data;
}
var STUDIO_DEFAULT = {
	eq: [
		{
			f: 100,
			g: 0,
			q: 1
		},
		{
			f: 250,
			g: 0,
			q: Math.SQRT2
		},
		{
			f: 1e3,
			g: 0,
			q: Math.SQRT2
		},
		{
			f: 4e3,
			g: 0,
			q: Math.SQRT2
		},
		{
			f: 1e4,
			g: 0,
			q: 1
		}
	],
	phatFreq: 90,
	phatDrive: .4,
	phatMix: 0,
	ampDrive: 0,
	replay: "none",
	preamp: 0,
	target: -12,
	peak: 50,
	air: 0,
	width: 1,
	exciter: 0,
	eqOn: true
};
var HEAR = 28;
var HEAR_FULL = 7;
var ID = {
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
	drink: 23
};
function createAudio() {
	let ctx = null;
	let master = null;
	let worldBus = null;
	let node = null;
	let vol = .7;
	let mode = "boot";
	let started = false;
	let windOn = false;
	const phraseSlot = [];
	const envelopes = /* @__PURE__ */ new Map();
	const loops = /* @__PURE__ */ new Set();
	let introDone = false;
	let stepAcc = 0;
	const ear = {
		x: 0,
		y: 8,
		z: 0
	};
	const pcm = [];
	const banks = [];
	const batch = [];
	let flushQueued = false;
	function rng(seed) {
		let s = seed >>> 0;
		return () => {
			s = Math.imul(s, 1664525) + 1013904223 >>> 0;
			return s / 4294967296;
		};
	}
	function normalize(data, amp) {
		return ditherInto(data, amp);
	}
	function chirp(sr, f0, f1, dur, amp) {
		const len = Math.max(1, Math.floor(sr * dur));
		const b = new Float32Array(len);
		let ph = 0;
		for (let i = 0; i < len; i++) {
			const k = i / len;
			const f = f0 * Math.pow(f1 / f0, k);
			ph += 2 * Math.PI * f / sr;
			const env = Math.min(1, i / (sr * .01)) * Math.pow(1 - k, 1.15);
			b[i] = Math.sin(ph) * env;
		}
		return normalize(b, amp);
	}
	function noise(sr, dur, cut, amp, seed) {
		const len = Math.max(1, Math.floor(sr * dur));
		const b = new Float32Array(len);
		const next = rng(seed);
		let y = 0;
		const c = Math.min(.92, cut);
		for (let i = 0; i < len; i++) {
			const white = next() * 2 - 1;
			y += c * (white - y);
			const k = i / len;
			const env = Math.min(1, i / (sr * .006)) * (1 - k);
			b[i] = y * env;
		}
		return normalize(b, amp);
	}
	function vowel(sr, f0, formants, amp) {
		const len = Math.max(1, Math.floor(sr * .12));
		const b = new Float32Array(len);
		const ph = new Array(formants.length + 1).fill(0);
		for (let i = 0; i < len; i++) {
			const k = i / len;
			const env = Math.min(1, i / (sr * .01)) * Math.pow(1 - k, .65);
			ph[0] += 2 * Math.PI * f0 / sr;
			let s = Math.sin(ph[0]) * .55;
			for (let f = 0; f < formants.length; f++) {
				ph[f + 1] += 2 * Math.PI * formants[f] / sr;
				s += Math.sin(ph[f + 1]) * (.22 - f * .04);
			}
			const n = i * 17 % 100 / 100 - .5;
			const bite = i < sr * .018 ? n * (1 - i / (sr * .018)) * .35 : 0;
			b[i] = (s + bite) * env;
		}
		return normalize(b, amp);
	}
	function laughLine(sr) {
		const syl = [
			520,
			640,
			560,
			820,
			940,
			800,
			500,
			630,
			560
		];
		const gap = .145;
		const sylDur = .12;
		const len = Math.floor(sr * (syl.length * gap + .05));
		const b = new Float32Array(len);
		for (let n = 0; n < syl.length; n++) {
			const start = Math.floor(sr * n * gap);
			const count = Math.floor(sr * sylDur);
			let ph = 0;
			let ph2 = 0;
			const f = syl[n];
			for (let i = 0; i < count && start + i < len; i++) {
				const k = i / count;
				const env = Math.min(1, i / (sr * .014)) * (1 - k) * (1 - k);
				ph += 2 * Math.PI * f / sr;
				ph2 += 2 * Math.PI * f * 2.02 / sr;
				b[start + i] += (Math.sin(ph) * .72 + Math.sin(ph2) * .28) * env;
			}
		}
		return normalize(b, .95);
	}
	function push(data) {
		pcm.push(data);
		const ab = ctx.createBuffer(1, data.length, ctx.sampleRate);
		ab.getChannelData(0).set(data);
		banks.push(ab);
	}
	function buildBuffers() {
		if (!ctx || pcm.length) return;
		const sr = ctx.sampleRate;
		push(chirp(sr, 320, 880, .15, .95));
		push(chirp(sr, 180, 70, .2, .9));
		push(noise(sr, .09, .55, .8, 3));
		push(noise(sr, .22, .18, .9, 9));
		push(noise(sr, .1, .72, .75, 12));
		push(chirp(sr, 220, 90, .08, .8));
		push(noise(sr, .38, .12, .95, 21));
		push(noise(sr, .16, .62, .7, 33));
		push(noise(sr, .2, .16, .6, 40));
		push(noise(sr, .05, .35, .55, 51));
		push(noise(sr, .1, .48, .6, 62));
		push(chirp(sr, 880, 1320, .12, .8));
		push(chirp(sr, 1400, 1800, .07, .55));
		push(chirp(sr, 420, 240, .28, .7));
		push(vowel(sr, 200, [
			800,
			1200,
			2600
		], .95));
		push(vowel(sr, 200, [
			500,
			1900,
			2500
		], .95));
		push(vowel(sr, 200, [
			320,
			2300,
			3e3
		], .95));
		push(vowel(sr, 180, [
			500,
			900,
			2400
		], .95));
		push(vowel(sr, 180, [
			350,
			800,
			2200
		], .95));
		push(laughLine(sr));
		push(noise(sr, 2, .08, .4, 70));
		push(rainBed(sr));
		push(riverBed(sr));
		push(drinkBed(sr));
	}
	function rainBed(sr) {
		const len = Math.floor(sr * 2);
		const b = new Float32Array(len);
		const next = rng(90);
		let y = 0;
		for (let i = 0; i < len; i++) {
			const white = next() * 2 - 1;
			y += .22 * (white - y);
			const drop = next() > .985 ? (next() * 2 - 1) * (.4 + next()) : 0;
			b[i] = y * .35 + drop;
		}
		return normalize(b, .55);
	}
	function riverBed(sr) {
		const len = Math.floor(sr * 2);
		const b = new Float32Array(len);
		const next = rng(120);
		for (let n = 0; n < 28; n++) {
			const start = Math.floor(next() * (len - sr * .12));
			const f = 680 + next() * 540;
			let ph = 0;
			const count = Math.floor(sr * (.05 + next() * .07));
			for (let i = 0; i < count && start + i < len; i++) {
				const k = i / count;
				ph += 2 * Math.PI * f / sr;
				b[start + i] += Math.sin(ph) * Math.pow(1 - k, 2.4) * (.35 + next() * .4);
			}
		}
		return normalize(b, .7);
	}
	function drinkBed(sr) {
		const len = Math.floor(sr * .7);
		const b = new Float32Array(len);
		const next = rng(150);
		for (let g = 0; g < 3; g++) {
			const start = Math.floor(sr * (.05 + g * .2));
			let y = 0;
			const count = Math.floor(sr * .16);
			for (let i = 0; i < count && start + i < len; i++) {
				y += .35 * (next() * 2 - 1 - y);
				const k = i / count;
				const env = Math.sin(Math.min(1, k * 3) * Math.PI) * (1 - k);
				b[start + i] += y * env + Math.sin(2 * Math.PI * 180 * i / sr) * env * .4;
			}
		}
		return normalize(b, .8);
	}
	function speechF0(voice) {
		if (voice < 160) return 95 + (voice - 90) * .2;
		if (voice < 320) return 110 + (voice - 160) * .35;
		if (voice < 480) return 170 + (voice - 320) * .4;
		return 240 + Math.min(110, (voice - 480) * .22);
	}
	function shiftFormants(base, shift) {
		const keep = shift.rate > 0 ? 1 / shift.rate : 1;
		const f1 = Math.max(180, Math.min(1200, (base[0] * shift.alpha * shift.split[0] + shift.beta) * keep));
		const f2 = Math.max(f1 + 160, Math.min(3e3, (base[1] * shift.alpha * shift.split[1] + shift.beta) * keep));
		const f3 = Math.max(f2 + 220, Math.min(4600, (base[2] * shift.alpha * shift.split[2] + shift.beta) * keep));
		const bw = .75 + .25 * shift.alpha;
		return [
			f1,
			f2,
			f3,
			Math.max(40, base[3] * bw * keep),
			Math.max(50, base[4] * bw * keep),
			Math.max(70, base[5] * bw * keep)
		];
	}
	const SR_A = 16e3;
	const PERIOD = 114;
	function tractFrame(form, periods) {
		const n = PERIOD * periods;
		const frame = new Float64Array(n);
		const poles = [
			{
				y1: 0,
				y2: 0
			},
			{
				y1: 0,
				y2: 0
			},
			{
				y1: 0,
				y2: 0
			}
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
				const slot = poles[k];
				const r = Math.exp(-Math.PI * form[k + 3] / SR_A);
				const a1 = 2 * r * Math.cos(2 * Math.PI * form[k] / SR_A);
				const a2 = -(r * r);
				y = (1 - r) * y + a1 * slot.y1 + a2 * slot.y2;
				slot.y2 = slot.y1;
				slot.y1 = y;
			}
			frame[i] = y * (.5 - .5 * Math.cos(2 * Math.PI * i / (n - 1)));
		}
		return frame;
	}
	function lpcAnalyze(form) {
		const order = 12;
		const frame = tractFrame(form, 16);
		const n = frame.length;
		const corr = /* @__PURE__ */ new Float64Array(13);
		for (let lag = 0; lag <= order; lag++) {
			let s = 0;
			let c = 0;
			for (let i = 0; i < n - lag; i++) {
				const y = frame[i] * frame[i + lag] - c;
				const t = s + y;
				c = t - s - y;
				s = t;
			}
			corr[lag] = s;
		}
		const a = /* @__PURE__ */ new Float64Array(13);
		a[0] = 1;
		let err = corr[0];
		if (err < 1e-12) return {
			a,
			gain: 1e-6
		};
		for (let i = 1; i <= order; i++) {
			let lambda = corr[i];
			for (let j = 1; j < i; j++) lambda -= a[j] * corr[i - j];
			lambda /= err;
			if (Math.abs(lambda) >= .999) lambda = Math.sign(lambda) * .999;
			const next = /* @__PURE__ */ new Float64Array(13);
			next[0] = 1;
			for (let j = 1; j < i; j++) next[j] = a[j] - lambda * a[i - j];
			next[i] = lambda;
			for (let j = 0; j <= i; j++) a[j] = next[j];
			err *= 1 - lambda * lambda;
			if (err < 1e-14) break;
		}
		return {
			a,
			gain: Math.sqrt(Math.max(err, 1e-18))
		};
	}
	function lpcMag(model, freq) {
		const w = 2 * Math.PI * Math.max(40, Math.min(7400, freq)) / 16e3;
		let re = 1;
		let im = 0;
		for (let j = 1; j < model.a.length; j++) {
			re -= model.a[j] * Math.cos(w * j);
			im -= model.a[j] * Math.sin(w * j);
		}
		return model.gain / Math.max(1e-8, Math.hypot(re, im));
	}
	function burgAnalyze(form) {
		const order = 12;
		const frame = tractFrame(form, 8);
		const n = frame.length;
		const f = Float64Array.from(frame);
		const b = Float64Array.from(frame);
		const a = /* @__PURE__ */ new Float64Array(13);
		a[0] = 1;
		let e = 0;
		for (let i = 0; i < n; i++) e += frame[i] * frame[i];
		e /= n;
		for (let m = 1; m <= order; m++) {
			let num = 0;
			let den = 1e-18;
			for (let i = m; i < n; i++) {
				const w = (i + 1) * (n - i);
				num += w * f[i] * b[i - 1];
				den += w * (f[i] * f[i] + b[i - 1] * b[i - 1]);
			}
			let k = 2 * num / den;
			if (Math.abs(k) > .999) k = Math.sign(k) * .999;
			const next = Float64Array.from(a);
			for (let j = 1; j < m; j++) next[j] = a[j] - k * a[m - j];
			next[m] = k;
			a.set(next);
			for (let i = n - 1; i >= m; i--) {
				const fi = f[i];
				const bi = b[i - 1];
				f[i] = fi - k * bi;
				b[i] = bi - k * fi;
			}
			e *= 1 - k * k;
		}
		return {
			a,
			gain: Math.sqrt(Math.max(e, 1e-18))
		};
	}
	function fft256(re, im, inverse) {
		const n = re.length;
		for (let i = 1, j = 0; i < n; i++) {
			let bit = n >> 1;
			for (; j & bit; bit >>= 1) j ^= bit;
			j ^= bit;
			if (i < j) {
				const tr = re[i];
				re[i] = re[j];
				re[j] = tr;
				const ti = im[i];
				im[i] = im[j];
				im[j] = ti;
			}
		}
		for (let len = 2; len <= n; len <<= 1) {
			const ang = 2 * Math.PI / len * (inverse ? 1 : -1);
			const wr = Math.cos(ang);
			const wi = Math.sin(ang);
			for (let i = 0; i < n; i += len) {
				let wRe = 1;
				let wIm = 0;
				for (let k = 0; k < len / 2; k++) {
					const ur = re[i + k];
					const ui = im[i + k];
					const vr = re[i + k + len / 2] * wRe - im[i + k + len / 2] * wIm;
					const vi = re[i + k + len / 2] * wIm + im[i + k + len / 2] * wRe;
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
		if (inverse) for (let i = 0; i < n; i++) {
			re[i] = re[i] / n;
			im[i] = im[i] / n;
		}
	}
	function lifterCurve(autocorr, burg) {
		const n = 256;
		const re = new Float64Array(n);
		const im = new Float64Array(n);
		for (let i = 0; i < n / 2; i++) {
			const freq = i / (n / 2) * 8e3;
			const mag = .5 * (Math.log(Math.max(1e-8, lpcMag(autocorr, freq))) + Math.log(Math.max(1e-8, lpcMag(burg, freq))));
			re[i] = mag;
			if (i > 0) re[n - i] = mag;
		}
		fft256(re, im, true);
		const keep = 28;
		for (let i = 29; i < 228; i++) re[i] = 0;
		re[keep] = re[keep] * .5;
		re[228] = re[228] * .5;
		im.fill(0);
		fft256(re, im, false);
		const curve = new Float64Array(n / 2);
		for (let i = 0; i < curve.length; i++) curve[i] = Math.exp(re[i]);
		return curve;
	}
	function fitPitch(f0, amount) {
		if (amount < .02) return f0;
		const midi = 69 + 12 * Math.log2(Math.max(40, f0) / 440);
		return 440 * 2 ** ((midi + (Math.round(midi) - midi) * Math.min(1, amount) - 69) / 12);
	}
	function shiftFor(alpha, beta, smile, rate = 1) {
		return {
			alpha,
			beta,
			split: alpha > 1.02 || beta > 18 ? [
				1.04,
				1.14 * (1 + smile),
				1.1
			] : [
				.98,
				.96 * (1 + smile * .4),
				.95
			],
			rate
		};
	}
	const LOOK = {
		angel: [
			268,
			1.08,
			70,
			.08,
			.12,
			.22
		],
		pickme: [
			252,
			1.06,
			55,
			.1,
			.1,
			.18
		],
		goth: [
			176,
			1.02,
			26,
			.02,
			.28,
			.06
		],
		bestie: [
			258,
			1.07,
			62,
			.12,
			.1,
			.2
		],
		puff: [
			292,
			1.1,
			90,
			.14,
			.05,
			.24
		],
		bunny: [
			276,
			1.08,
			60,
			.1,
			.08,
			.16
		],
		trips: [
			264,
			1.07,
			58,
			.09,
			.1,
			.16
		],
		boomer: [
			128,
			.94,
			-10,
			.04,
			.45,
			.05
		],
		buzz: [
			198,
			1,
			10,
			.02,
			.2,
			.08
		],
		lark: [
			302,
			1.12,
			80,
			.12,
			.05,
			.2
		],
		pack: [
			150,
			.96,
			-8,
			.03,
			.4,
			.06
		],
		pin: [
			118,
			.92,
			-18,
			0,
			.35,
			.04
		],
		wrap: [
			110,
			.9,
			-22,
			0,
			.42,
			.05
		],
		bone: [
			98,
			.88,
			-30,
			0,
			.38,
			.04
		],
		glass: [
			168,
			.98,
			0,
			0,
			.22,
			.05
		],
		twin: [
			242,
			1.05,
			48,
			.08,
			.12,
			.14
		],
		cinder: [
			156,
			.97,
			-4,
			.05,
			.3,
			.08
		],
		bleat: [
			284,
			1.1,
			75,
			.15,
			.05,
			.22
		],
		blocky: [
			164,
			.98,
			0,
			.02,
			.34,
			.05
		],
		wallaby: [
			208,
			1.02,
			20,
			.06,
			.18,
			.1
		],
		laile: [
			232,
			1.05,
			50,
			.11,
			.12,
			.2
		],
		cloudy: [
			278,
			1.09,
			68,
			.13,
			.08,
			.18
		],
		donnie: [
			142,
			.95,
			12,
			.16,
			.55,
			.08
		],
		elon: [
			228,
			1.06,
			40,
			.14,
			.1,
			.12
		],
		flux: [
			160,
			.97,
			-6,
			.02,
			.3,
			.05
		],
		rock: [
			96,
			.88,
			-28,
			.02,
			.62,
			.03
		],
		zendaya: [
			206,
			1.04,
			42,
			.04,
			.22,
			.1
		],
		jlo: [
			198,
			1.05,
			36,
			.07,
			.28,
			.12
		]
	};
	function modeOf(kind, line) {
		const k = `${kind} ${line}`.toLowerCase();
		if (k.includes("click")) return "click";
		if (k.includes("tick")) return "tick";
		if (k.includes("smack")) return "smack";
		if (k.includes("whisper") || k.includes("die") || k.includes("groan")) return "whisper";
		if (/(yay|joohoo|sing|winner|loud|yess|triple|double)/.test(k)) return "sing";
		return "talk";
	}
	function castOf(charId, pitch, kind, line) {
		const look = LOOK[charId];
		const mode = modeOf(kind, line);
		const f0 = look ? look[0] : pitch > 380 ? speechF0(pitch) : pitch;
		const alpha = look ? look[1] : f0 > 190 ? 1.05 : .96;
		const beta = look ? look[2] : f0 > 190 ? 40 : -12;
		const smile = look ? look[3] : .04;
		const chest = look ? look[4] : f0 < 150 ? .4 : .12;
		const breath = look ? look[5] : f0 > 220 ? .16 : .06;
		const tune = mode === "sing" ? .86 : mode === "whisper" ? 0 : f0 > 220 ? .28 : .12;
		return {
			f0: fitPitch(mode === "whisper" ? f0 * .9 : f0, tune),
			shift: shiftFor(alpha, beta, smile),
			tune,
			breath: mode === "whisper" ? Math.min(.55, breath + .28) : breath,
			oq: mode === "whisper" ? .7 : breath > .14 ? .6 : .44,
			smile,
			chest,
			mode
		};
	}
	function mouthBurst(mode, sr) {
		const len = Math.max(1, Math.floor(sr * (mode === "tick" ? .028 : mode === "click" ? .05 : .09)));
		const b = new Float32Array(len);
		let y1 = 0;
		let y2 = 0;
		const f = mode === "tick" ? 2800 : mode === "click" ? 1450 : 680;
		const r = Math.exp(-Math.PI * (mode === "tick" ? 220 : 140) / sr);
		const a1 = 2 * r * Math.cos(2 * Math.PI * f / sr);
		const a2 = -(r * r);
		for (let i = 0; i < len; i++) {
			const env = Math.exp(-i / len * (mode === "smack" ? 4 : 9));
			const x = (i < 2 ? 1 : 0) + (Math.random() * 2 - 1) * (mode === "smack" ? .45 : .04);
			const y = (1 - r) * x + a1 * y1 + a2 * y2;
			y2 = y1;
			y1 = y;
			b[i] = y * env;
		}
		return normalize(b, .8);
	}
	function renderPhrase(text, sr, cast) {
		if (cast.mode === "click" || cast.mode === "smack" || cast.mode === "tick") return mouthBurst(cast.mode, sr);
		const words = text.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 16);
		const vowels = {
			a: [
				730,
				1090,
				2440,
				80,
				90,
				120
			],
			e: [
				530,
				1840,
				2480,
				60,
				90,
				120
			],
			i: [
				270,
				2290,
				3010,
				60,
				90,
				150
			],
			o: [
				570,
				840,
				2410,
				70,
				80,
				100
			],
			u: [
				300,
				870,
				2240,
				60,
				80,
				110
			]
		};
		const shift = cast.shift;
		const f0 = cast.f0;
		const oq = cast.oq;
		const syl = [];
		let t = .03;
		const gap = .098;
		const placed = (vowel) => shiftFormants(vowel, shift);
		const envFor = (form) => {
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
				const v = (word.slice(i * 3, i * 3 + 3).match(/[aeiou]/) || ["a"])[0];
				const wobble = v === "i" ? 1.08 : v === "e" ? 1.03 : v === "o" || v === "u" ? .92 : 1;
				syl.push({
					f: Math.max(70, f0 * wobble),
					t,
					env: envFor(placed(vowels[v] || vowels.a))
				});
				t += gap;
			}
			t += gap * .45;
		}
		if (!syl.length) syl.push({
			f: f0,
			t: .02,
			env: envFor(placed(vowels.a))
		});
		const len = Math.max(1, Math.floor(sr * (t + .22)));
		const b = new Float32Array(len);
		const nyq = sr * .45;
		const maxH = 48;
		const phase = new Float32Array(maxH);
		const amp = new Float32Array(maxH);
		const ampT = new Float32Array(maxH);
		const tilt = (.25 + oq) * (1 - cast.chest * .5);
		const breath = cast.breath;
		let nPrev = 0;
		let hop = 0;
		let noiseT = 0;
		const at = (curve, freq) => {
			const bin = Math.max(0, Math.min(7990, freq)) / 8e3 * (curve.length - 1);
			const i0 = Math.max(0, Math.min(curve.length - 2, bin | 0));
			const fr = bin - i0;
			return curve[i0] * (1 - fr) + curve[i0 + 1] * fr;
		};
		const harm = cast.mode === "whisper" ? .28 : 1;
		const noiseBoost = cast.mode === "whisper" ? 2.2 : 1;
		for (let i = 0; i < len; i++) {
			const time = i / sr;
			let env = 0;
			let wsum = 0;
			let ff = syl[0].f;
			let accF = 0;
			const live = [];
			for (const sy of syl) {
				const u = (time - sy.t) / .09;
				if (u < -.45 || u > 2.6) continue;
				const e = (.5 - .5 * Math.cos(Math.min(1, Math.max(0, (u + .2) / .32)) * Math.PI)) * (u > 1 ? Math.exp(-(u - 1) * 2.2) : 1);
				if (e > env) env = e;
				if (e < .002) continue;
				wsum += e;
				accF += sy.f * e;
				live.push({
					e,
					env: sy.env
				});
			}
			if (wsum > .001) ff = accF / wsum;
			const vib = cast.mode === "sing" ? .014 : .004;
			ff *= 1 + vib * Math.sin(time * (cast.mode === "sing" ? 28 : 37));
			if (hop <= 0) {
				hop = 32;
				const nH = Math.max(1, Math.min(maxH, Math.floor(Math.min(nyq, 4800) / ff)));
				for (let h = 0; h < nH; h++) {
					const freq = (h + 1) * ff;
					let s = 0;
					for (const part of live) s += part.e * at(part.env, freq);
					const tract = wsum > .001 ? s / wsum : 0;
					ampT[h] = tract * Math.pow(freq / 140, -tilt);
				}
				for (let h = nH; h < maxH; h++) ampT[h] = 0;
				let sN = 0;
				for (const part of live) sN += part.e * at(part.env, 3400);
				noiseT = (wsum > .001 ? sN / wsum : 0) * Math.pow(3400 / 140, -tilt);
			}
			hop--;
			let voice = 0;
			const step = 2 * Math.PI * ff / sr;
			for (let h = 0; h < maxH; h++) {
				amp[h] += (ampT[h] - amp[h]) * .2;
				phase[h] = (phase[h] + step * (h + 1)) % (Math.PI * 2);
				voice += amp[h] * Math.sin(phase[h]);
			}
			nPrev = nPrev * .7 + (Math.random() * 2 - 1) * .3;
			b[i] = (voice * harm + nPrev * breath * noiseT * noiseBoost) * env;
		}
		return normalize(b, .92);
	}
	function storeBuf(id, data) {
		pcm[id] = data;
		const ab = ctx.createBuffer(1, data.length, ctx.sampleRate);
		ab.getChannelData(0).set(data);
		banks[id] = ab;
		if (node && mode === "worklet") node.port.postMessage({
			cmd: "addbuf",
			id,
			buf: data
		});
	}
	function phraseId(text, cast) {
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
			storeBuf(24 + slot, renderPhrase(text, ctx.sampleRate, cast));
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
		node.port.postMessage({
			cmd: "batch",
			items
		});
	}
	function fallback(it) {
		if (!ctx || !master || !banks[it.id]) return;
		const src = ctx.createBufferSource();
		src.buffer = banks[it.id];
		src.playbackRate.value = Math.max(.25, it.rate || 1);
		src.loop = !!it.loop;
		const g = ctx.createGain();
		const when = ctx.currentTime + Math.max(0, it.delay || 0);
		const strip = mix.ch[Math.max(0, Math.min(2, it.lane))];
		const level = it.gain * strip.trim * strip.fader * (strip.mute ? 0 : 1);
		g.gain.setValueAtTime(Math.max(1e-4, level), when);
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
			const dur = banks[it.id].duration / Math.max(.25, it.rate || 1);
			src.stop(when + dur + .03);
		}
	}
	function kick(it) {
		if (it.gain < .004) return;
		if (!ctx) boot();
		if (ctx && ctx.state === "suspended") ctx.resume();
		if (mode === "worklet") {
			batch.push(it);
			schedule();
			return;
		}
		fallback(it);
	}
	let ditherOn = false;
	const mix = {
		ch: [
			0,
			1,
			2
		].map(() => ({
			trim: 1,
			pan: 0,
			mute: false,
			solo: false,
			pfl: false,
			fader: 1,
			pol: 1,
			hpf: 0,
			aux: 0,
			pre: false
		})),
		auxReturn: 0,
		duck: .42
	};
	const meters = {
		peak: [
			0,
			0,
			0,
			0
		],
		hold: [
			0,
			0,
			0,
			0
		]
	};
	function pushMix() {
		if (node && mode === "worklet") node.port.postMessage({
			cmd: "mix",
			...mix
		});
	}
	let ditherNode = null;
	function ditherMessage() {
		const p = ditherParams();
		const shape = p.shape === "rpdf" ? 1 : p.shape === "tpdf" ? 2 : p.shape === "floyd" ? 3 : 0;
		return {
			cmd: "dither",
			enabled: p.enabled,
			shape,
			scale: ditherScale(p),
			step: ditherStep(p),
			shaping: p.shaping
		};
	}
	let studioOut = null;
	let widthNode = null;
	let analyser = null;
	const ditherScope = /* @__PURE__ */ new Float32Array(128);
	const studio = {
		...STUDIO_DEFAULT,
		eq: STUDIO_DEFAULT.eq.map((b) => ({ ...b }))
	};
	let eqNodes = [];
	let eqWet = null;
	let eqDry = null;
	let airNode = null;
	let phatLP = null;
	let phatHP = null;
	let phatSat = null;
	let phatWet = null;
	let phatHigh = null;
	let phatDry = null;
	let exciteWet = null;
	let ampWet = null;
	let ampShape = null;
	let makeup = null;
	let ceiling = null;
	let rider = 0;
	function shapeCurve(drive, mix) {
		const n = 1024;
		const c = new Float32Array(n);
		const k = 1 + drive * 48;
		const norm = Math.tanh(k);
		for (let i = 0; i < n; i++) {
			const x = i / 1023 * 2 - 1;
			const y = Math.tanh(k * x) / norm;
			c[i] = x * (1 - mix) + y * mix;
		}
		return c;
	}
	function fadeTo(gain, value) {
		if (!ctx) return;
		const now = ctx.currentTime;
		gain.cancelScheduledValues(now);
		gain.setValueAtTime(gain.value, now);
		gain.linearRampToValueAtTime(value, now + .012);
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
			phatLP.frequency.setTargetAtTime(studio.phatFreq, ctx.currentTime, .02);
			phatHP.frequency.setTargetAtTime(studio.phatFreq, ctx.currentTime, .02);
		}
		if (phatSat) phatSat.curve = shapeCurve(studio.phatDrive, 1);
		const mix = Math.max(0, Math.min(1, studio.phatMix));
		if (phatDry) fadeTo(phatDry.gain, 1 - mix);
		if (phatWet) fadeTo(phatWet.gain, mix);
		if (phatHigh) fadeTo(phatHigh.gain, mix);
		if (exciteWet) fadeTo(exciteWet.gain, Math.max(0, Math.min(1, studio.exciter)) * .35);
		if (ampShape) ampShape.curve = shapeCurve(studio.ampDrive, studio.ampDrive > .01 ? 1 : 0);
		if (ampWet) fadeTo(ampWet.gain, studio.ampDrive > .01 ? 1 : 0);
		if (widthNode) widthNode.port.postMessage({
			cmd: "width",
			width: studio.width
		});
		const peakLin = Math.max(.05, Math.min(1, studio.peak / 100));
		if (ceiling) {
			const hold = studio.replay === "none" ? 0 : 20 * Math.log10(peakLin);
			ceiling.threshold.setTargetAtTime(hold, ctx.currentTime, .03);
			ceiling.ratio.setTargetAtTime(studio.replay === "prevent" || studio.replay === "gain" ? 20 : 1, ctx.currentTime, .03);
		}
		if (studio.replay === "none" && makeup) fadeTo(makeup.gain, Math.pow(10, studio.preamp / 20));
	}
	function rideLoudness() {
		if (!ctx || !analyser || !makeup) return;
		if (studio.replay === "none") return;
		const buf = new Float32Array(analyser.fftSize);
		analyser.getFloatTimeDomainData(buf);
		let s = 0;
		for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
		const rms = Math.sqrt(s / buf.length);
		if (rms < 1e-4) return;
		const db = 20 * Math.log10(rms);
		const delta = Math.max(-18, Math.min(12, studio.target - db));
		const want = Math.pow(10, (delta + studio.preamp) / 20);
		makeup.gain.setTargetAtTime(want, ctx.currentTime, .15);
	}
	function buildStudio() {
		if (!ctx || !master || studioOut) return;
		eqNodes = [
			"lowshelf",
			"peaking",
			"peaking",
			"peaking",
			"highshelf"
		].map((type) => {
			const f = ctx.createBiquadFilter();
			f.type = type;
			return f;
		});
		airNode = ctx.createBiquadFilter();
		airNode.type = "highshelf";
		airNode.frequency.value = 12e3;
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
		phatComp.attack.value = .005;
		phatComp.release.value = .12;
		phatWet = ctx.createGain();
		phatHigh = ctx.createGain();
		const phatSum = ctx.createGain();
		const exHP = ctx.createBiquadFilter();
		exHP.type = "highpass";
		exHP.frequency.value = 6500;
		const exSat = ctx.createWaveShaper();
		exSat.curve = shapeCurve(.35, 1);
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
		ceiling.attack.value = .002;
		ceiling.release.value = .08;
		analyser = ctx.createAnalyser();
		analyser.fftSize = 1024;
		analyser.smoothingTimeConstant = .75;
		studioOut = ctx.createGain();
		const eqIn = ctx.createGain();
		eqWet = ctx.createGain();
		eqDry = ctx.createGain();
		const eqSum = ctx.createGain();
		master.connect(eqIn);
		let prev = eqIn;
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
		buildStudio.pre = preWidth;
		buildStudio.post = postWidth;
		applyStudio();
		if (!rider) rider = window.setInterval(rideLoudness, 200);
	}
	function insertWidth() {
		if (!ctx) return;
		const pre = buildStudio.pre;
		const post = buildStudio.post;
		if (!pre || !post || widthNode) return;
		try {
			widthNode = new AudioWorkletNode(ctx, "dew-width", {
				numberOfInputs: 1,
				numberOfOutputs: 1,
				outputChannelCount: [2]
			});
		} catch {
			return;
		}
		pre.disconnect();
		pre.connect(widthNode);
		widthNode.connect(post);
		widthNode.port.postMessage({
			cmd: "width",
			width: studio.width
		});
	}
	function installDither(stage) {
		if (!ctx || !studioOut || ditherOn) return;
		ditherOn = true;
		studioOut.disconnect();
		stage.connect(ctx.destination);
		studioOut.connect(stage);
	}
	function boot() {
		if (started) return;
		started = true;
		ctx = new (window.AudioContext || window.webkitAudioContext)();
		master = ctx.createGain();
		master.gain.value = vol;
		buildStudio();
		worldBus = ctx.createGain();
		worldBus.gain.value = .9;
		const lim = ctx.createDynamicsCompressor();
		lim.threshold.value = -3;
		lim.knee.value = 4;
		lim.ratio.value = 1.5;
		lim.attack.value = .002;
		lim.release.value = .06;
		worldBus.connect(lim);
		lim.connect(master);
		buildBuffers();
		const url = URL.createObjectURL(new Blob([mixer_worklet_default], { type: "application/javascript" }));
		ctx.audioWorklet.addModule(url).then(() => {
			URL.revokeObjectURL(url);
			if (!ctx || !master) return;
			try {
				node = new AudioWorkletNode(ctx, "dew-mixer", {
					numberOfInputs: 0,
					numberOfOutputs: 1,
					outputChannelCount: [2]
				});
			} catch {
				node = new AudioWorkletNode(ctx, "dew-mixer");
			}
			node.connect(master);
			node.port.onmessage = (e) => {
				const data = e.data;
				if (data?.cmd === "meters" && data.peak && data.hold) {
					meters.peak = data.peak;
					meters.hold = data.hold;
				}
			};
			node.port.postMessage({
				cmd: "bufs",
				bufs: pcm
			});
			pushMix();
			const dither = new AudioWorkletNode(ctx, "dew-dither", {
				numberOfInputs: 1,
				numberOfOutputs: 1,
				outputChannelCount: [2]
			});
			ditherNode = dither;
			dither.port.postMessage({
				...ditherMessage(),
				tpdf: DITHER_TPDF,
				rpdf: DITHER_RPDF
			});
			dither.port.onmessage = (e) => {
				const data = e.data;
				if (data?.cmd === "scope" && data.samples) ditherScope.set(data.samples);
			};
			insertWidth();
			installDither(dither);
			mode = "worklet";
			armWind();
			flush();
		}).catch(() => {
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
							const noise = !scale ? 0 : table[pos + i + ch & 4095] * scale;
							dst[i] = src[i] + noise;
						}
					}
					pos = pos + n & 4095;
				};
				installDither(proc);
			}
			armWind();
		});
	}
	function armWind() {
		if (windOn) return;
		windOn = true;
		kick({
			id: ID.wind,
			delay: 0,
			gain: .045,
			rate: 1,
			pan: 0,
			lane: 0,
			loop: true
		});
	}
	function place(x, y, z, far = HEAR) {
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
		return {
			g,
			pan: Math.max(-1, Math.min(1, dx / 26))
		};
	}
	function cloneCast(cast, dir) {
		const rate = dir < 0 ? .98 : 1.02;
		return {
			...cast,
			shift: {
				...cast.shift,
				beta: cast.shift.beta + dir * 16,
				rate,
				split: [
					cast.shift.split[0],
					cast.shift.split[1] * (dir < 0 ? 1.04 : 1.07),
					cast.shift.split[2]
				]
			}
		};
	}
	function flushNow() {
		flushQueued = false;
		if (mode !== "worklet" || !node || !batch.length) return;
		const items = batch.splice(0, batch.length);
		node.port.postMessage({
			cmd: "batch",
			items
		});
	}
	function wordSpan(word) {
		return .08 + Math.min(3, Math.max(1, Math.ceil(word.replace(/[^a-z]/gi, "").length / 3))) * .09;
	}
	function speak(text, pitch, gain, lane, pan, charId = "", kind = "", clones = false) {
		if (!text || gain < .004) return;
		if (!ctx) boot();
		if (!ctx) return;
		const cast = castOf(charId, pitch, kind, text);
		const words = text.split(/\s+/).filter(Boolean);
		const lead = words[0] || text;
		const utter = (line, delay, voice, g, p, rate) => {
			kick({
				id: phraseId(line, voice),
				delay,
				gain: g,
				rate,
				pan: p,
				lane
			});
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
					utter(word, t, left, gain * .42, Math.max(-1, pan - .72), .98);
					utter(word, t, right, gain * .42, Math.min(1, pan + .72), 1.02);
					t += wordSpan(word);
				}
			}
			flushNow();
		}, 0);
	}
	function setLoop(id, gain) {
		if (!loops.has(id)) {
			if (gain < .01) return;
			loops.add(id);
			kick({
				id,
				delay: 0,
				gain,
				rate: 1,
				pan: 0,
				lane: 0,
				loop: true
			});
			return;
		}
		if (node && mode === "worklet") node.port.postMessage({
			cmd: "gain",
			id,
			gain
		});
	}
	function shotId(kind) {
		if (kind === "rocket") return ID.rocket;
		if (kind === "flame") return ID.flame;
		if (kind === "melee") return ID.melee;
		return ID.shot;
	}
	let baked = false;
	function bakeBarks() {
		if (baked || !ctx) return;
		baked = true;
		const lines = [
			"help",
			"yay",
			"ow",
			"jump",
			"die",
			"Double Winner",
			"Heatstroke cured",
			"Mount Dew Oh yesss"
		];
		let i = 0;
		const step = () => {
			if (!ctx || i >= lines.length) return;
			const line = lines[i++];
			phraseId(line, castOf("flux", 118, line, line));
			setTimeout(step, 0);
		};
		setTimeout(step, 0);
	}
	return {
		unlock() {
			boot();
			if (ctx && ctx.state === "suspended") ctx.resume();
			bakeBarks();
		},
		setVolume(v) {
			vol = v;
			if (master) master.gain.value = v;
		},
		setDither(next) {
			setDitherParams(next);
			if (ditherNode) ditherNode.port.postMessage(ditherMessage());
		},
		setStudio(next) {
			if (next.eq) studio.eq = studio.eq.map((b, i) => ({
				...b,
				...next.eq?.[i]
			}));
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
			const rate = ctx?.sampleRate || 48e3;
			const hi = Math.min(2e4, rate * .49);
			for (let i = 0; i < n; i++) freq[i] = 20 * (hi / 20) ** (i / 127);
			if (studio.eqOn) for (const band of eqNodes) {
				band.getFrequencyResponse(freq, mag, phase);
				for (let i = 0; i < n; i++) eq[i] = eq[i] * mag[i];
			}
			const centers = new Float32Array(studio.eq.length);
			const oneF = /* @__PURE__ */ new Float32Array(1);
			const oneM = /* @__PURE__ */ new Float32Array(1);
			const oneP = /* @__PURE__ */ new Float32Array(1);
			for (let b = 0; b < studio.eq.length; b++) {
				oneF[0] = Math.min(hi, Math.max(20, studio.eq[b].f));
				let m = 1;
				if (studio.eqOn) for (const band of eqNodes) {
					band.getFrequencyResponse(oneF, oneM, oneP);
					m *= oneM[0];
				}
				centers[b] = 20 * Math.log10(Math.max(1e-4, m));
			}
			return {
				spectrum,
				eq,
				freq,
				centers,
				dither: ditherScope,
				rate,
				eqOn: studio.eqOn
			};
		},
		setMix(next) {
			if (next.ch) mix.ch = mix.ch.map((row, i) => ({
				...row,
				...next.ch?.[i]
			}));
			if (next.auxReturn != null) mix.auxReturn = next.auxReturn;
			if (next.duck != null) mix.duck = next.duck;
			pushMix();
		},
		getMeters() {
			return meters;
		},
		setListener(x, y, z) {
			ear.x = x;
			ear.y = y;
			ear.z = z;
		},
		jump(pitch) {
			if (pitch < 250) kick({
				id: ID.land,
				delay: 0,
				gain: .62,
				rate: 1,
				pan: 0,
				lane: 2
			});
			else kick({
				id: ID.jump,
				delay: 0,
				gain: .78,
				rate: Math.max(.75, Math.min(1.7, pitch / 480)),
				pan: 0,
				lane: 2
			});
		},
		hopAt(x, y, z, pitch) {
			const p = place(x, y, z, 22);
			if (p.g < .02) return;
			kick({
				id: ID.jump,
				delay: 0,
				gain: .28 * p.g,
				rate: Math.max(.7, Math.min(1.7, pitch / 480)),
				pan: p.pan,
				lane: 0
			});
		},
		step(water) {
			kick({
				id: water ? ID.water : ID.step,
				delay: 0,
				gain: water ? .16 : .1,
				rate: .9 + Math.random() * .2,
				pan: 0,
				lane: 0
			});
		},
		shot(kind) {
			kick({
				id: shotId(kind),
				delay: 0,
				gain: .34,
				rate: 1,
				pan: 0,
				lane: 0
			});
		},
		shotAt(x, y, z, kind, self) {
			const p = self ? {
				g: 1,
				pan: 0
			} : place(x, y, z, 40);
			if (p.g < .02) return;
			kick({
				id: shotId(kind),
				delay: 0,
				gain: (self ? .4 : .3) * p.g,
				rate: .92 + Math.random() * .16,
				pan: p.pan,
				lane: 0
			});
		},
		ding() {
			kick({
				id: ID.ding,
				delay: 0,
				gain: .42,
				rate: 1,
				pan: 0,
				lane: 2
			});
			kick({
				id: ID.ding,
				delay: .08,
				gain: .34,
				rate: 1.5,
				pan: 0,
				lane: 2
			});
		},
		boom() {
			kick({
				id: ID.boom,
				delay: 0,
				gain: .7,
				rate: 1,
				pan: 0,
				lane: 0
			});
		},
		boomAt(x, y, z) {
			const p = place(x, y, z, 48);
			if (p.g < .02) return;
			kick({
				id: ID.boom,
				delay: 0,
				gain: .72 * p.g,
				rate: 1,
				pan: p.pan,
				lane: 0
			});
		},
		voice(pitch, kind, charId) {
			speak(kind || "hey", pitch, .46, 2, 0, charId || "", kind, true);
		},
		voiceAt(x, y, z, pitch, kind, line, self, charId) {
			const p = self ? {
				g: 1,
				pan: 0
			} : place(x, y, z, 30);
			if (p.g < .02) return;
			speak(line || kind || "hey", pitch, (self ? .56 : .34) * p.g, self ? 2 : 0, p.pan, charId || "", kind, self);
		},
		help(pitch) {
			speak("help", pitch, .5, 2, 0);
		},
		helpAt(x, y, z, pitch, self) {
			const p = self ? {
				g: 1,
				pan: 0
			} : place(x, y, z, 28);
			if (p.g < .02) return;
			speak("help", pitch, (self ? .52 : .32) * p.g, self ? 2 : 0, p.pan);
		},
		splash() {
			kick({
				id: ID.splash,
				delay: 0,
				gain: .22,
				rate: 1,
				pan: 0,
				lane: 0
			});
		},
		splashAt(x, y, z) {
			const p = place(x, y, z, 24);
			if (p.g < .02) return;
			kick({
				id: ID.splash,
				delay: 0,
				gain: .24 * p.g,
				rate: 1,
				pan: p.pan,
				lane: 0
			});
		},
		laugh() {
			kick({
				id: ID.laugh,
				delay: 0,
				gain: .4,
				rate: 1,
				pan: 0,
				lane: 0
			});
		},
		laughAt(x, y, z) {
			const p = place(x, y, z, 24);
			if (p.g < .02) return;
			kick({
				id: ID.laugh,
				delay: 0,
				gain: .36 * p.g,
				rate: 1,
				pan: p.pan,
				lane: 0
			});
		},
		giggle(x, y, z) {
			const p = place(x, y, z, 32);
			const g = Math.max(p.g, .55);
			kick({
				id: ID.laugh,
				delay: 0,
				gain: .62 * g,
				rate: 1.04,
				pan: p.pan,
				lane: 2
			});
		},
		train() {
			kick({
				id: ID.train,
				delay: 0,
				gain: .16,
				rate: 1,
				pan: 0,
				lane: 0
			});
		},
		trainAt(x, y, z) {
			const p = place(x, y, z, 52);
			if (p.g < .02) return;
			kick({
				id: ID.train,
				delay: 0,
				gain: .18 * p.g,
				rate: 1,
				pan: p.pan,
				lane: 0
			});
		},
		stinger() {
			kick({
				id: ID.ding,
				delay: 0,
				gain: .4,
				rate: .8,
				pan: 0,
				lane: 2
			});
			kick({
				id: ID.ding,
				delay: .09,
				gain: .36,
				rate: 1,
				pan: 0,
				lane: 2
			});
			kick({
				id: ID.ding,
				delay: .18,
				gain: .42,
				rate: 1.25,
				pan: 0,
				lane: 2
			});
		},
		announce(text) {
			const line = text.replace(/\s+/g, " ").trim().slice(0, 180);
			if (!line) return;
			speak(line, 118, .78, 1, 0, "flux", "announce", true);
		},
		intro() {
			boot();
			const speakIntro = () => {
				if (introDone) return;
				introDone = true;
				const line = "Mount Dew Oh yesss";
				const lead = castOf("flux", 118, "announce", line);
				lead.f0 = fitPitch(118, .4);
				lead.shift = {
					alpha: .92,
					beta: -20,
					split: [
						.98,
						.95,
						.94
					],
					rate: 1
				};
				lead.mode = "sing";
				const left = castOf("zendaya", 206, "sing", line);
				left.f0 = fitPitch(232, .7);
				left.shift = {
					alpha: 1.04,
					beta: 45,
					split: [
						1.06,
						1.16,
						1.12
					],
					rate: .98
				};
				const right = castOf("jlo", 198, "sing", line);
				right.f0 = fitPitch(258, .7);
				right.shift = {
					alpha: 1.06,
					beta: 75,
					split: [
						1.08,
						1.2,
						1.16
					],
					rate: 1.02
				};
				kick({
					id: phraseId(line, left),
					delay: 0,
					gain: .58,
					rate: .98,
					pan: -.82,
					lane: 1
				});
				flushNow();
				setTimeout(() => {
					if (!ctx) return;
					kick({
						id: phraseId(line, lead),
						delay: 0,
						gain: .92,
						rate: 1,
						pan: 0,
						lane: 1
					});
					kick({
						id: phraseId(line, right),
						delay: 0,
						gain: .58,
						rate: 1.02,
						pan: .82,
						lane: 1
					});
					flushNow();
				}, 0);
			};
			if (ctx && ctx.state !== "running") {
				ctx.resume().then(speakIntro);
				return;
			}
			speakIntro();
		},
		cured() {
			kick({
				id: ID.splash,
				delay: 0,
				gain: .42,
				rate: 1,
				pan: 0,
				lane: 2
			});
			kick({
				id: ID.drink,
				delay: .1,
				gain: .58,
				rate: 1,
				pan: 0,
				lane: 2
			});
			speak("Heatstroke cured", 118, .86, 1, 0, "flux", "announce", true);
		},
		comment(text) {
			const line = text.replace(/\s+/g, " ").trim().slice(0, 180);
			if (!line) return;
			speak(line, 118, .6, 1, 0, "flux", "announce", true);
		},
		weather(kind) {
			if (kind === "rain") setLoop(ID.rain, .22);
			else if (kind === "snow") setLoop(ID.rain, .06);
			else setLoop(ID.rain, 0);
			setLoop(ID.river, kind === "rain" ? .08 : 0);
		},
		owl() {
			kick({
				id: ID.owl,
				delay: 0,
				gain: .16,
				rate: 1,
				pan: .2,
				lane: 0
			});
			kick({
				id: ID.owl,
				delay: .32,
				gain: .14,
				rate: .86,
				pan: -.15,
				lane: 0
			});
		},
		birds() {
			kick({
				id: ID.bird,
				delay: 0,
				gain: .1,
				rate: 1,
				pan: .3,
				lane: 0
			});
			kick({
				id: ID.bird,
				delay: .08,
				gain: .08,
				rate: 1.25,
				pan: -.2,
				lane: 0
			});
			kick({
				id: ID.bird,
				delay: .16,
				gain: .07,
				rate: .9,
				pan: .1,
				lane: 0
			});
		},
		tick(dt, weather, moving, water) {
			if (!ctx) return;
			if (moving) {
				stepAcc += dt;
				if (stepAcc > (water ? .28 : .34)) {
					stepAcc = 0;
					kick({
						id: water ? ID.water : ID.step,
						delay: 0,
						gain: .1,
						rate: .85 + Math.random() * .3,
						pan: 0,
						lane: 0
					});
				}
			}
			if (weather === "rain") {
				setLoop(ID.rain, .2);
				setLoop(ID.river, water ? .36 : .08);
			} else if (weather === "snow") {
				setLoop(ID.rain, .05);
				setLoop(ID.river, 0);
			} else {
				setLoop(ID.rain, 0);
				setLoop(ID.river, 0);
			}
		},
		dispose() {
			mode = "buffer";
			batch.length = 0;
			ctx?.close();
			ctx = null;
			master = null;
			node = null;
		}
	};
}
var S = .64;
var GLASS = [
	.12,
	.2,
	.26
];
var TIRE = [
	.06,
	.06,
	.07
];
var RIM = [
	.78,
	.8,
	.82
];
var LAMP = [
	.95,
	.97,
	1
];
var TAIL = [
	.72,
	.1,
	.08
];
var DARK = [
	.08,
	.08,
	.09
];
function tri(pos, nor, col, a, b, c, color) {
	const ux = b[0] - a[0];
	const uy = b[1] - a[1];
	const uz = b[2] - a[2];
	const vx = c[0] - a[0];
	const vy = c[1] - a[1];
	const vz = c[2] - a[2];
	let nx = uy * vz - uz * vy;
	let ny = uz * vx - ux * vz;
	let nz = ux * vy - uy * vx;
	const len = Math.hypot(nx, ny, nz) || 1;
	nx /= len;
	ny /= len;
	nz /= len;
	for (const p of [
		a,
		b,
		c
	]) {
		pos.push(p[0], p[1], p[2]);
		nor.push(nx, ny, nz);
		col.push(color[0], color[1], color[2]);
	}
}
function quad(pos, nor, col, a, b, c, d, color) {
	tri(pos, nor, col, a, b, c, color);
	tri(pos, nor, col, a, c, d, color);
}
function box(pos, nor, col, cx, cy, cz, hx, hy, hz, color) {
	const x0 = cx - hx;
	const x1 = cx + hx;
	const y0 = cy - hy;
	const y1 = cy + hy;
	const z0 = cz - hz;
	const z1 = cz + hz;
	quad(pos, nor, col, [
		x0,
		y0,
		z1
	], [
		x1,
		y0,
		z1
	], [
		x1,
		y1,
		z1
	], [
		x0,
		y1,
		z1
	], color);
	quad(pos, nor, col, [
		x1,
		y0,
		z0
	], [
		x0,
		y0,
		z0
	], [
		x0,
		y1,
		z0
	], [
		x1,
		y1,
		z0
	], color);
	quad(pos, nor, col, [
		x1,
		y0,
		z1
	], [
		x1,
		y0,
		z0
	], [
		x1,
		y1,
		z0
	], [
		x1,
		y1,
		z1
	], color);
	quad(pos, nor, col, [
		x0,
		y0,
		z0
	], [
		x0,
		y0,
		z1
	], [
		x0,
		y1,
		z1
	], [
		x0,
		y1,
		z0
	], color);
	quad(pos, nor, col, [
		x0,
		y1,
		z1
	], [
		x1,
		y1,
		z1
	], [
		x1,
		y1,
		z0
	], [
		x0,
		y1,
		z0
	], color);
	quad(pos, nor, col, [
		x0,
		y0,
		z0
	], [
		x1,
		y0,
		z0
	], [
		x1,
		y0,
		z1
	], [
		x0,
		y0,
		z1
	], color);
}
function join(pos, nor, col, a, b, color) {
	const n = a.length;
	for (let i = 0; i < n; i++) {
		const j = (i + 1) % n;
		quad(pos, nor, col, a[i], a[j], b[j], b[i], color);
	}
}
function cap(pos, nor, col, ring, color, nose) {
	const c = [
		0,
		0,
		0
	];
	for (const p of ring) {
		c[0] += p[0];
		c[1] += p[1];
		c[2] += p[2];
	}
	c[0] /= ring.length;
	c[1] /= ring.length;
	c[2] /= ring.length;
	for (let i = 0; i < ring.length; i++) {
		const j = (i + 1) % ring.length;
		if (nose) tri(pos, nor, col, c, ring[i], ring[j], color);
		else tri(pos, nor, col, c, ring[j], ring[i], color);
	}
}
function section(x, halfW, y0, belt, roof, roofW, sharp) {
	const w = halfW;
	const rw = Math.min(roofW, w);
	if (sharp) return [
		[
			x,
			y0,
			-w
		],
		[
			x,
			y0,
			w
		],
		[
			x,
			belt,
			w
		],
		[
			x,
			roof,
			rw
		],
		[
			x,
			roof,
			-rw
		],
		[
			x,
			belt,
			-w
		]
	];
	const mid = y0 + (belt - y0) * .35;
	const shoulder = belt + (roof - belt) * .45;
	return [
		[
			x,
			y0,
			-w * .35
		],
		[
			x,
			y0,
			w * .35
		],
		[
			x,
			mid,
			w * .98
		],
		[
			x,
			belt,
			w * .94
		],
		[
			x,
			shoulder,
			w * .72
		],
		[
			x,
			roof,
			rw
		],
		[
			x,
			roof,
			-rw
		],
		[
			x,
			shoulder,
			-w * .72
		],
		[
			x,
			belt,
			-w * .94
		],
		[
			x,
			mid,
			-w * .98
		]
	];
}
function wheel(pos, nor, col, cx, cy, cz, r, w) {
	const n = 22;
	for (let i = 0; i < n; i++) {
		const a0 = i / n * Math.PI * 2;
		const a1 = (i + 1) / n * Math.PI * 2;
		const c0x = Math.cos(a0);
		const c0y = Math.sin(a0);
		const c1x = Math.cos(a1);
		const c1y = Math.sin(a1);
		quad(pos, nor, col, [
			cx + c0x * r,
			cy + c0y * r,
			cz + w
		], [
			cx + c1x * r,
			cy + c1y * r,
			cz + w
		], [
			cx + c1x * r,
			cy + c1y * r,
			cz - w
		], [
			cx + c0x * r,
			cy + c0y * r,
			cz - w
		], TIRE);
		const rimR = r * .68;
		quad(pos, nor, col, [
			cx + c0x * r,
			cy + c0y * r,
			cz + w * .72
		], [
			cx + c0x * rimR,
			cy + c0y * rimR,
			cz + w * .55
		], [
			cx + c1x * rimR,
			cy + c1y * rimR,
			cz + w * .55
		], [
			cx + c1x * r,
			cy + c1y * r,
			cz + w * .72
		], RIM);
		tri(pos, nor, col, [
			cx,
			cy,
			cz + w * .45
		], [
			cx + c0x * rimR * .45,
			cy + c0y * rimR * .45,
			cz + w * .45
		], [
			cx + c1x * rimR * .45,
			cy + c1y * rimR * .45,
			cz + w * .45
		], RIM);
	}
	for (let s = 0; s < 5; s++) {
		const a = s / 5 * Math.PI * 2;
		const cs = Math.cos(a) * r * .62;
		const sn = Math.sin(a) * r * .62;
		const ox = -Math.sin(a) * r * .05;
		const oy = Math.cos(a) * r * .05;
		quad(pos, nor, col, [
			cx + ox,
			cy + oy,
			cz + w * .5
		], [
			cx - ox,
			cy - oy,
			cz + w * .5
		], [
			cx + cs - ox,
			cy + sn - oy,
			cz + w * .5
		], [
			cx + cs + ox,
			cy + sn + oy,
			cz + w * .5
		], RIM);
	}
}
function densify(stations) {
	const out = [];
	for (let i = 0; i < stations.length - 1; i++) {
		const a = stations[i];
		const b = stations[i + 1];
		out.push(a);
		out.push({
			t: (a.t + b.t) / 2,
			w: (a.w + b.w) / 2,
			y0: (a.y0 + b.y0) / 2,
			belt: (a.belt + b.belt) / 2,
			roof: (a.roof + b.roof) / 2,
			rw: (a.rw + b.rw) / 2
		});
	}
	out.push(stations[stations.length - 1]);
	return out;
}
function arch(pos, nor, col, cx, cy, cz, r, paint) {
	const n = 7;
	const lip = [
		paint[0] * .72,
		paint[1] * .72,
		paint[2] * .72
	];
	for (let i = 0; i < n; i++) {
		const a0 = Math.PI * (.15 + i / n * .7);
		const a1 = Math.PI * (.15 + (i + 1) / n * .7);
		const x0 = Math.cos(a0) * r;
		const y0 = Math.sin(a0) * r;
		const x1 = Math.cos(a1) * r;
		const y1 = Math.sin(a1) * r;
		quad(pos, nor, col, [
			cx + x0,
			cy + y0,
			cz
		], [
			cx + x1,
			cy + y1,
			cz
		], [
			cx + x1 * .82,
			cy + y1 * .82,
			cz
		], [
			cx + x0 * .82,
			cy + y0 * .82,
			cz
		], lip);
	}
}
function shell(opt) {
	const pos = [];
	const nor = [];
	const col = [];
	const L = opt.length * S;
	const halfL = L / 2;
	const halfW = opt.width * S / 2;
	const rings = densify(opt.stations).map((st) => {
		return section(-halfL + st.t * L, halfW * st.w, st.y0 * S, st.belt * S, st.roof * S, halfW * st.rw, !!opt.sharp);
	});
	cap(pos, nor, col, rings[0], opt.paint, false);
	for (let i = 0; i < rings.length - 1; i++) join(pos, nor, col, rings[i], rings[i + 1], opt.paint);
	cap(pos, nor, col, rings[rings.length - 1], opt.paint, true);
	const glassFrom = Math.floor(rings.length * .28);
	const glassTo = Math.floor(rings.length * .62);
	for (let i = glassFrom; i < glassTo; i++) {
		const a = rings[i];
		const b = rings[i + 1];
		const top = Math.floor(a.length / 2);
		quad(pos, nor, col, a[top - 1], a[top], b[top], b[top - 1], GLASS);
		quad(pos, nor, col, a[top], a[top + 1], b[top + 1], b[top], GLASS);
	}
	const wy = opt.wheelR * S * .92;
	const wr = opt.wheelR * S;
	const ww = .11 * S;
	const wx = opt.wheelbase * S / 2;
	const wz = halfW * .96;
	wheel(pos, nor, col, wx, wy, wz, wr, ww);
	wheel(pos, nor, col, wx, wy, -wz, wr, ww);
	wheel(pos, nor, col, -wx, wy, wz, wr, ww);
	wheel(pos, nor, col, -wx, wy, -wz, wr, ww);
	box(pos, nor, col, halfL * .9, .48 * S, halfW * .55, .05 * S, .07 * S, .16 * S, LAMP);
	box(pos, nor, col, halfL * .9, .48 * S, -halfW * .55, .05 * S, .07 * S, .16 * S, LAMP);
	box(pos, nor, col, -halfL * .94, .55 * S, 0, .04 * S, .05 * S, halfW * .7, TAIL);
	box(pos, nor, col, 0, .16 * S, 0, halfL * .62, .045 * S, halfW * .48, DARK);
	if (opt.mirrors !== false) {
		box(pos, nor, col, halfL * .12, .78 * S, halfW + .06 * S, .08 * S, .04 * S, .1 * S, DARK);
		box(pos, nor, col, halfL * .12, .78 * S, -(halfW + .06 * S), .08 * S, .04 * S, .1 * S, DARK);
	}
	const belt = .72 * S;
	const winTop = (opt.sharp ? 1.15 : .98) * S;
	const winRear = -halfL * .42;
	const winFront = halfL * .18;
	for (const side of [1, -1]) {
		const z = side * halfW * .9;
		quad(pos, nor, col, [
			winRear,
			belt,
			z
		], [
			winFront,
			belt * .92,
			z
		], [
			winFront - halfL * .08,
			winTop,
			z
		], [
			winRear + halfL * .06,
			winTop * .92,
			z
		], GLASS);
		box(pos, nor, col, -halfL * .05, belt * .95, side * (halfW + .015 * S), .012 * S, .22 * S, .02 * S, [
			.04,
			.04,
			.05
		]);
		box(pos, nor, col, halfL * .22, belt * .95, side * (halfW + .015 * S), .012 * S, .16 * S, .02 * S, [
			.04,
			.04,
			.05
		]);
		box(pos, nor, col, halfL * .02, .47359999999999997, side * (halfW + .02 * S), .05 * S, .012 * S, .012 * S, [
			.2,
			.2,
			.22
		]);
	}
	box(pos, nor, col, halfL * .55, .58 * S, 0, halfL * .22, .012 * S, .015 * S, [
		.15,
		.15,
		.16
	]);
	box(pos, nor, col, halfL * .97, .34 * S, 0, .03 * S, .05 * S, halfW * .72, DARK);
	box(pos, nor, col, -halfL * .97, .36 * S, 0, .03 * S, .05 * S, halfW * .7, DARK);
	box(pos, nor, col, halfL * .93, .5 * S, 0, .02 * S, .03 * S, .04 * S, [
		.85,
		.1,
		.12
	]);
	box(pos, nor, col, 0, .47359999999999997, halfW * .98, halfL * .72, .012 * S, .012 * S, DARK);
	box(pos, nor, col, 0, .47359999999999997, -halfW * .98, halfL * .72, .012 * S, .012 * S, DARK);
	box(pos, nor, col, -halfL * .15, winTop + .02 * S, halfW * .42, .02 * S, .02 * S, halfL * .22, DARK);
	box(pos, nor, col, -halfL * .15, winTop + .02 * S, -halfW * .42, .02 * S, .02 * S, halfL * .22, DARK);
	arch(pos, nor, col, wx, wy, halfW * .86, wr * 1.18, opt.paint);
	arch(pos, nor, col, wx, wy, -halfW * .86, wr * 1.18, opt.paint);
	arch(pos, nor, col, -wx, wy, halfW * .86, wr * 1.18, opt.paint);
	arch(pos, nor, col, -wx, wy, -halfW * .86, wr * 1.18, opt.paint);
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
	geo.setAttribute("normal", new Float32BufferAttribute(nor, 3));
	geo.setAttribute("color", new Float32BufferAttribute(col, 3));
	geo.computeBoundingSphere();
	return geo;
}
var TESLA_NAMES = [
	"Model 3",
	"Model Y",
	"Model S",
	"Model X",
	"Cybertruck",
	"Roadster"
];
function teslaGeometries() {
	return [
		shell({
			length: 4.72,
			width: 1.85,
			stations: [
				{
					t: 0,
					w: .78,
					y0: .32,
					belt: .62,
					roof: .7,
					rw: .28
				},
				{
					t: .08,
					w: .94,
					y0: .24,
					belt: .72,
					roof: .9,
					rw: .5
				},
				{
					t: .2,
					w: 1,
					y0: .22,
					belt: .78,
					roof: 1.08,
					rw: .62
				},
				{
					t: .36,
					w: 1,
					y0: .22,
					belt: .8,
					roof: 1.16,
					rw: .58
				},
				{
					t: .5,
					w: .99,
					y0: .22,
					belt: .78,
					roof: 1.1,
					rw: .46
				},
				{
					t: .64,
					w: .97,
					y0: .22,
					belt: .66,
					roof: .72,
					rw: .2
				},
				{
					t: .82,
					w: .94,
					y0: .24,
					belt: .52,
					roof: .54,
					rw: .06
				},
				{
					t: 1,
					w: .8,
					y0: .3,
					belt: .44,
					roof: .44,
					rw: .02
				}
			],
			paint: [
				.9,
				.91,
				.93
			],
			wheelbase: 2.88,
			wheelR: .34
		}),
		shell({
			length: 4.79,
			width: 1.92,
			stations: [
				{
					t: 0,
					w: .86,
					y0: .34,
					belt: .78,
					roof: 1.05,
					rw: .42
				},
				{
					t: .1,
					w: .98,
					y0: .26,
					belt: .9,
					roof: 1.32,
					rw: .7
				},
				{
					t: .28,
					w: 1,
					y0: .24,
					belt: .96,
					roof: 1.48,
					rw: .72
				},
				{
					t: .48,
					w: 1,
					y0: .24,
					belt: .94,
					roof: 1.46,
					rw: .66
				},
				{
					t: .64,
					w: .98,
					y0: .24,
					belt: .78,
					roof: .9,
					rw: .28
				},
				{
					t: .82,
					w: .94,
					y0: .26,
					belt: .58,
					roof: .58,
					rw: .08
				},
				{
					t: 1,
					w: .82,
					y0: .32,
					belt: .48,
					roof: .48,
					rw: .02
				}
			],
			paint: [
				.18,
				.42,
				.82
			],
			wheelbase: 2.89,
			wheelR: .36
		}),
		shell({
			length: 4.97,
			width: 1.96,
			stations: [
				{
					t: 0,
					w: .8,
					y0: .3,
					belt: .58,
					roof: .66,
					rw: .26
				},
				{
					t: .12,
					w: .96,
					y0: .22,
					belt: .7,
					roof: .92,
					rw: .55
				},
				{
					t: .3,
					w: 1,
					y0: .2,
					belt: .74,
					roof: 1.02,
					rw: .6
				},
				{
					t: .48,
					w: 1,
					y0: .2,
					belt: .74,
					roof: 1,
					rw: .5
				},
				{
					t: .66,
					w: .98,
					y0: .2,
					belt: .6,
					roof: .64,
					rw: .16
				},
				{
					t: .84,
					w: .95,
					y0: .22,
					belt: .48,
					roof: .5,
					rw: .05
				},
				{
					t: 1,
					w: .78,
					y0: .28,
					belt: .4,
					roof: .4,
					rw: .02
				}
			],
			paint: [
				.07,
				.07,
				.09
			],
			wheelbase: 2.96,
			wheelR: .34
		}),
		shell({
			length: 5.04,
			width: 2,
			stations: [
				{
					t: 0,
					w: .9,
					y0: .36,
					belt: .9,
					roof: 1.2,
					rw: .55
				},
				{
					t: .14,
					w: 1,
					y0: .28,
					belt: 1.02,
					roof: 1.55,
					rw: .78
				},
				{
					t: .36,
					w: 1,
					y0: .26,
					belt: 1.06,
					roof: 1.64,
					rw: .8
				},
				{
					t: .55,
					w: 1,
					y0: .26,
					belt: 1.02,
					roof: 1.5,
					rw: .7
				},
				{
					t: .72,
					w: .98,
					y0: .26,
					belt: .8,
					roof: .9,
					rw: .3
				},
				{
					t: .88,
					w: .94,
					y0: .28,
					belt: .6,
					roof: .62,
					rw: .08
				},
				{
					t: 1,
					w: .84,
					y0: .34,
					belt: .5,
					roof: .5,
					rw: .02
				}
			],
			paint: [
				.8,
				.82,
				.84
			],
			wheelbase: 2.96,
			wheelR: .37
		}),
		shell({
			length: 5.68,
			width: 2.03,
			stations: [
				{
					t: 0,
					w: .96,
					y0: .48,
					belt: 1.05,
					roof: 1.7,
					rw: .9
				},
				{
					t: .18,
					w: 1,
					y0: .42,
					belt: 1.15,
					roof: 1.72,
					rw: .96
				},
				{
					t: .4,
					w: 1,
					y0: .4,
					belt: 1.05,
					roof: 1.42,
					rw: .94
				},
				{
					t: .62,
					w: .98,
					y0: .38,
					belt: .82,
					roof: 1.02,
					rw: .9
				},
				{
					t: .82,
					w: .94,
					y0: .38,
					belt: .62,
					roof: .7,
					rw: .7
				},
				{
					t: 1,
					w: .86,
					y0: .4,
					belt: .46,
					roof: .46,
					rw: .4
				}
			],
			paint: [
				.7,
				.72,
				.74
			],
			sharp: true,
			wheelbase: 3.63,
			wheelR: .42,
			mirrors: false
		}),
		shell({
			length: 4.1,
			width: 1.9,
			stations: [
				{
					t: 0,
					w: .84,
					y0: .24,
					belt: .42,
					roof: .48,
					rw: .22
				},
				{
					t: .16,
					w: .98,
					y0: .18,
					belt: .5,
					roof: .7,
					rw: .42
				},
				{
					t: .32,
					w: 1,
					y0: .16,
					belt: .52,
					roof: .74,
					rw: .36
				},
				{
					t: .46,
					w: .98,
					y0: .16,
					belt: .42,
					roof: .5,
					rw: .14
				},
				{
					t: .7,
					w: .96,
					y0: .16,
					belt: .34,
					roof: .36,
					rw: .04
				},
				{
					t: 1,
					w: .8,
					y0: .2,
					belt: .3,
					roof: .3,
					rw: .02
				}
			],
			paint: [
				.75,
				.08,
				.1
			],
			wheelbase: 2.4,
			wheelR: .33
		})
	];
}
var NAMES = [
	"hips",
	"spine",
	"chest",
	"neck",
	"head",
	"armL",
	"foreL",
	"handL",
	"armR",
	"foreR",
	"handR",
	"thighL",
	"shinL",
	"footL",
	"thighR",
	"shinR",
	"footR",
	"hair",
	"skirt"
];
var NB = NAMES.length;
var grad = (() => {
	const data = new Uint8Array([
		48,
		42,
		38,
		255,
		96,
		90,
		84,
		255,
		168,
		164,
		156,
		255,
		244,
		242,
		236,
		255
	]);
	const tex = new DataTexture(data, 4, 1);
	tex.magFilter = NearestFilter;
	tex.minFilter = NearestFilter;
	tex.needsUpdate = true;
	return tex;
})();
var solidMat = new MeshPhongMaterial({
	vertexColors: true,
	shininess: 22,
	specular: new Color(6710886)
});
var pencilMat = new MeshToonMaterial({
	vertexColors: true,
	gradientMap: grad
});
function bone() {
	return new Bone();
}
function idx(name) {
	return NAMES.indexOf(name);
}
function buildTemplate(mutant) {
	const pos = [];
	const region = [];
	const skinI = [];
	const skinW = [];
	const hips = bone();
	const spine = bone();
	const chest = bone();
	const neck = bone();
	const head = bone();
	const hair = bone();
	const armL = bone();
	const foreL = bone();
	const handL = bone();
	const armR = bone();
	const foreR = bone();
	const handR = bone();
	const thighL = bone();
	const shinL = bone();
	const footL = bone();
	const thighR = bone();
	const shinR = bone();
	const footR = bone();
	const skirt = bone();
	hips.add(spine, thighL, thighR, skirt);
	spine.add(chest);
	chest.add(neck, armL, armR);
	neck.add(head);
	head.add(hair);
	armL.add(foreL);
	foreL.add(handL);
	armR.add(foreR);
	foreR.add(handR);
	thighL.add(shinL);
	shinL.add(footL);
	thighR.add(shinR);
	shinR.add(footR);
	const list = [
		hips,
		spine,
		chest,
		neck,
		head,
		armL,
		foreL,
		handL,
		armR,
		foreR,
		handR,
		thighL,
		shinL,
		footL,
		thighR,
		shinR,
		footR,
		hair,
		skirt
	];
	hips.position.set(0, .96, 0);
	spine.position.set(0, .16, mutant ? .06 : .02);
	chest.position.set(0, .18, 0);
	neck.position.set(0, .16, mutant ? -.04 : -.02);
	head.position.set(0, mutant ? .18 : .14, 0);
	hair.position.set(0, .08, .02);
	armL.position.set(mutant ? .26 : .2, .08, 0);
	foreL.position.set(mutant ? .32 : .26, -.02, 0);
	handL.position.set(.2, -.02, 0);
	armR.position.set(mutant ? -.26 : -.2, .08, 0);
	foreR.position.set(mutant ? -.32 : -.26, -.02, 0);
	handR.position.set(-.2, -.02, 0);
	thighL.position.set(.1, -.06, 0);
	shinL.position.set(0, -.42, .02);
	footL.position.set(0, -.4, 0);
	thighR.position.set(-.1, -.06, 0);
	shinR.position.set(0, -.42, .02);
	footR.position.set(0, -.4, 0);
	skirt.position.set(0, -.02, 0);
	const dummy = new Object3D();
	dummy.add(hips);
	dummy.updateMatrixWorld(true);
	const at = (b) => {
		const v = new Vector3();
		b.getWorldPosition(v);
		return v;
	};
	const tube = (a, b, r0, r1, rings, radial, boneId, reg, parent) => {
		const dir = new Vector3().subVectors(b, a);
		const len = dir.length() || 1;
		dir.multiplyScalar(1 / len);
		const up = Math.abs(dir.y) > .9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
		const side = new Vector3().crossVectors(dir, up).normalize();
		const lift = new Vector3().crossVectors(side, dir).normalize();
		const ringsV = [];
		for (let i = 0; i <= rings; i++) {
			const t = i / rings;
			const c = a.clone().lerp(b, t);
			const rad = r0 + (r1 - r0) * t;
			const ring = [];
			const wParent = (i === 0 || i === rings) && i === 0 ? .35 : 0;
			for (let k = 0; k < radial; k++) {
				const ang = k / radial * Math.PI * 2;
				const p = c.clone().addScaledVector(side, Math.cos(ang) * rad).addScaledVector(lift, Math.sin(ang) * rad);
				ring.push(pos.length / 3);
				pos.push(p.x, p.y, p.z);
				region.push(reg);
				skinI.push(boneId, parent, 0, 0);
				skinW.push(1 - wParent, wParent, 0, 0);
			}
			ringsV.push(ring);
		}
		const radialN = radial;
		for (let i = 0; i < rings; i++) for (let k = 0; k < radialN; k++) {
			const k2 = (k + 1) % radialN;
			const a0 = ringsV[i][k];
			const a1 = ringsV[i][k2];
			const b0 = ringsV[i + 1][k];
			const b1 = ringsV[i + 1][k2];
			quad(a0, a1, b1, b0);
		}
	};
	const index = [];
	function quad(a, b, c, d) {
		index.push(a, b, c, a, c, d);
	}
	function sphere(center, rx, ry, rz, seg, rings, boneId, reg) {
		const rows = [];
		for (let i = 0; i <= rings; i++) {
			const v = i / rings * Math.PI;
			const row = [];
			for (let k = 0; k < seg; k++) {
				const u = k / seg * Math.PI * 2;
				const p = new Vector3(Math.sin(v) * Math.cos(u) * rx, Math.cos(v) * ry, Math.sin(v) * Math.sin(u) * rz).add(center);
				row.push(pos.length / 3);
				pos.push(p.x, p.y, p.z);
				region.push(reg);
				skinI.push(boneId, 0, 0, 0);
				skinW.push(1, 0, 0, 0);
			}
			rows.push(row);
		}
		for (let i = 0; i < rings; i++) for (let k = 0; k < seg; k++) {
			const k2 = (k + 1) % seg;
			quad(rows[i][k], rows[i][k2], rows[i + 1][k2], rows[i + 1][k]);
		}
	}
	const headP = at(head);
	const chestP = at(chest);
	const hipsP = at(hips);
	const neckP = at(neck);
	const spineP = at(spine);
	tube(hipsP, spineP, mutant ? .16 : .13, .11, 4, 10, idx("hips"), 1, idx("hips"));
	tube(spineP, chestP, .11, mutant ? .2 : .16, 4, 10, idx("spine"), 1, idx("hips"));
	tube(chestP, neckP, mutant ? .18 : .15, .07, 3, 10, idx("chest"), 1, idx("spine"));
	tube(neckP, headP, .055, .06, 2, 8, idx("neck"), 0, idx("chest"));
	sphere(headP, mutant ? .2 : .15, mutant ? .18 : .16, mutant ? .18 : .15, 16, 10, idx("head"), 0);
	const eyeY = headP.y + .02;
	const eyeZ = headP.z - (mutant ? .16 : .12);
	sphere(new Vector3(headP.x - .05, eyeY, eyeZ), .028, .02, .02, 6, 4, idx("head"), 3);
	sphere(new Vector3(headP.x + .05, eyeY, eyeZ), .028, .02, .02, 6, 4, idx("head"), 3);
	sphere(new Vector3(headP.x - .05, eyeY, eyeZ - .018), .012, .012, .01, 5, 3, idx("head"), 4);
	sphere(new Vector3(headP.x + .05, eyeY, eyeZ - .018), .012, .012, .01, 5, 3, idx("head"), 4);
	sphere(new Vector3(headP.x, headP.y - .02, eyeZ + .01), .03, .04, .04, 6, 4, idx("head"), 0);
	sphere(headP.clone().add(new Vector3(0, .08, .02)), mutant ? .12 : .16, mutant ? .08 : .12, .16, 10, 6, idx("hair"), 2);
	sphere(headP.clone().add(new Vector3(0, .02, -.08)), .14, .06, .08, 8, 4, idx("hair"), 2);
	const hairTail = headP.clone().add(new Vector3(0, -.05, .16));
	tube(headP.clone().add(new Vector3(0, .05, .04)), hairTail, .08, .03, 4, 8, idx("hair"), 2, idx("head"));
	const armPairs = [[
		armL,
		foreL,
		handL,
		"armL",
		"foreL",
		"handL"
	], [
		armR,
		foreR,
		handR,
		"armR",
		"foreR",
		"handR"
	]];
	for (const [up, mid, tip, aName, bName, cName] of armPairs) {
		tube(at(up), at(mid), mutant ? .07 : .05, .04, 5, 10, idx(aName), 0, idx("chest"));
		tube(at(mid), at(tip), .042, .032, 5, 10, idx(bName), 0, idx(aName));
		sphere(at(tip), .045, .04, .04, 6, 4, idx(cName), 0);
		const tipP = at(tip);
		const sign = tipP.x >= 0 ? 1 : -1;
		for (let f = 0; f < 4; f++) {
			const root = tipP.clone().add(new Vector3(sign * .02, -.02, -.03 + f * .018));
			tube(root, root.clone().add(new Vector3(sign * (mutant && f < 3 ? .16 : .07), mutant ? -.04 : -.01, 0)), mutant && f < 3 ? .018 : .012, .006, 2, 5, idx(cName), mutant && f < 3 ? 5 : 0, idx(bName));
		}
	}
	const legPairs = [[
		thighL,
		shinL,
		footL,
		"thighL",
		"shinL",
		"footL"
	], [
		thighR,
		shinR,
		footR,
		"thighR",
		"shinR",
		"footR"
	]];
	for (const [up, mid, tip, aName, bName, cName] of legPairs) {
		tube(at(up), at(mid), .08, .055, 5, 10, idx(aName), 1, idx("hips"));
		tube(at(mid), at(tip), .055, .04, 5, 10, idx(bName), 0, idx(aName));
		const ankle = at(tip);
		tube(ankle, ankle.clone().add(new Vector3(0, -.02, -.16)), .045, .03, 3, 6, idx(cName), 5, idx(bName));
	}
	tube(hipsP.clone(), hipsP.clone().add(new Vector3(0, -.28, 0)), .16, .26, 3, 10, idx("skirt"), 1, idx("hips"));
	dummy.remove(hips);
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
	geo.setIndex(index);
	geo.setAttribute("region", new Float32BufferAttribute(region, 1));
	geo.setAttribute("skinIndex", new Uint16BufferAttribute(skinI, 4));
	geo.setAttribute("skinWeight", new Float32BufferAttribute(skinW, 4));
	const colors = new Float32Array(pos.length / 3 * 3);
	colors.fill(1);
	geo.setAttribute("color", new BufferAttribute(colors, 3));
	geo.computeVertexNormals();
	return {
		geo,
		bones() {
			return list;
		}
	};
}
var pilotTemplate = buildTemplate(false);
var mutantTemplate = buildTemplate(true);
function paint(geo, skin, hair, cloth) {
	const region = geo.getAttribute("region");
	const color = geo.getAttribute("color");
	const s = new Color(skin);
	const h = new Color(hair);
	const c = new Color(cloth);
	const shoe = new Color(2365455);
	const white = new Color(16054271);
	const pupil = new Color(1313802);
	for (let i = 0; i < region.count; i++) {
		const r = region.getX(i);
		const col = r < .5 ? s : r < 1.5 ? c : r < 2.5 ? h : r < 3.5 ? white : r < 4.5 ? pupil : shoe;
		color.setXYZ(i, col.r, col.g, col.b);
	}
	color.needsUpdate = true;
}
function addBone(name, local, parent) {
	const b = new Bone();
	b.name = name;
	b.position.copy(local);
	parent?.add(b);
	return b;
}
function freshBones(mutant) {
	const hips = addBone("hips", new Vector3(0, .96, 0), null);
	const spine = addBone("spine", new Vector3(0, .16, mutant ? .06 : .02), hips);
	const chest = addBone("chest", new Vector3(0, .18, 0), spine);
	const neck = addBone("neck", new Vector3(0, .16, mutant ? -.04 : -.02), chest);
	const head = addBone("head", new Vector3(0, mutant ? .18 : .14, 0), neck);
	const hair = addBone("hair", new Vector3(0, .08, .02), head);
	const armL = addBone("armL", new Vector3(mutant ? .26 : .2, .08, 0), chest);
	const foreL = addBone("foreL", new Vector3(mutant ? .32 : .26, -.02, 0), armL);
	const handL = addBone("handL", new Vector3(.2, -.02, 0), foreL);
	const armR = addBone("armR", new Vector3(mutant ? -.26 : -.2, .08, 0), chest);
	const foreR = addBone("foreR", new Vector3(mutant ? -.32 : -.26, -.02, 0), armR);
	const handR = addBone("handR", new Vector3(-.2, -.02, 0), foreR);
	const thighL = addBone("thighL", new Vector3(.1, -.06, 0), hips);
	const shinL = addBone("shinL", new Vector3(0, -.42, .02), thighL);
	const footL = addBone("footL", new Vector3(0, -.4, 0), shinL);
	const thighR = addBone("thighR", new Vector3(-.1, -.06, 0), hips);
	const shinR = addBone("shinR", new Vector3(0, -.42, .02), thighR);
	const footR = addBone("footR", new Vector3(0, -.4, 0), shinR);
	const skirt = addBone("skirt", new Vector3(0, -.02, 0), hips);
	return {
		hips,
		ordered: [
			hips,
			spine,
			chest,
			neck,
			head,
			armL,
			foreL,
			handL,
			armR,
			foreR,
			handR,
			thighL,
			shinL,
			footL,
			thighR,
			shinR,
			footR,
			hair,
			skirt
		],
		head,
		hair,
		chest,
		handR,
		skirt
	};
}
function pencilShadow() {
	const pos = [];
	for (let s = 0; s < 9; s++) {
		const a0 = s / 9 * Math.PI * 2;
		const a1 = a0 + .55;
		const x0 = Math.cos(a0) * .34;
		const z0 = Math.sin(a0) * .2;
		const x1 = Math.cos(a1) * .46;
		const z1 = Math.sin(a1) * .26;
		const o = .012;
		pos.push(x0, 0, z0, x1, 0, z1, x0 + o, .001, z0 + o);
	}
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
	geo.computeVertexNormals();
	const mat = new MeshBasicMaterial({
		color: 1840142,
		transparent: true,
		opacity: .45,
		depthWrite: false
	});
	const mesh = new Mesh(geo, mat);
	mesh.rotation.x = 0;
	mesh.renderOrder = 2;
	return mesh;
}
function gunMesh() {
	const g = new Group();
	const body = new Mesh(new BoxGeometry(.06, .07, .42), new MeshLambertMaterial({ color: 9347256 }));
	const grip = new Mesh(new BoxGeometry(.05, .12, .06), new MeshLambertMaterial({ color: 2761756 }));
	grip.position.set(0, -.08, .08);
	g.add(body, grip);
	return g;
}
function createFigures(scene, count, mutant) {
	const template = mutant ? mutantTemplate : pilotTemplate;
	const slots = Array.from({ length: count }, () => {
		const rig = freshBones(mutant);
		const geo = template.geo.clone();
		const mesh = new SkinnedMesh(geo, solidMat);
		mesh.add(rig.hips);
		mesh.updateMatrixWorld(true);
		mesh.bind(new Skeleton(rig.ordered));
		mesh.frustumCulled = false;
		mesh.visible = false;
		mesh.castShadow = false;
		mesh.receiveShadow = false;
		const wingL = new Mesh(new BoxGeometry(.08, .5, .28), new MeshLambertMaterial({
			color: 16777215,
			side: 2
		}));
		const wingR = new Mesh(new BoxGeometry(.08, .5, .28), new MeshLambertMaterial({
			color: 16777215,
			side: 2
		}));
		wingL.position.set(.22, .05, .02);
		wingR.position.set(-.22, .05, .02);
		rig.chest.add(wingL, wingR);
		const halo = new Mesh(new TorusGeometry(.22, .025, 6, 14), new MeshLambertMaterial({ color: 16771466 }));
		halo.position.set(0, .22, 0);
		halo.rotation.x = Math.PI / 2.4;
		rig.head.add(halo);
		const gun = gunMesh();
		gun.position.set(0, -.06, -.16);
		rig.handR.add(gun);
		const mouthMat = new MeshBasicMaterial({ color: 4853792 });
		const mouthBit = new Mesh(new CircleGeometry(.035, 8), mouthMat);
		const mouthOpen = new Mesh(new CircleGeometry(.055, 8), mouthMat);
		mouthBit.position.set(0, -.02, .11);
		mouthOpen.position.set(0, -.035, .115);
		mouthOpen.scale.set(1, 1.35, 1);
		rig.head.add(mouthBit, mouthOpen);
		const veins = [
			0,
			1,
			2,
			3
		].map((i) => {
			const vein = new Mesh(new BoxGeometry(.012, .1, .008), new MeshBasicMaterial({ color: 9050160 }));
			vein.position.set((i - 1.5) * .028, .05, .1);
			vein.rotation.z = (i - 1.5) * .45;
			vein.visible = false;
			rig.head.add(vein);
			return vein;
		});
		const shadow = pencilShadow();
		scene.add(mesh, shadow);
		return {
			mesh,
			rig,
			wingL,
			wingR,
			halo,
			gun,
			mouthBit,
			mouthOpen,
			veins,
			shadow,
			cur: new Float32Array(NB * 3),
			vel: new Float32Array(NB * 3),
			rag: false,
			phase: Math.random() * 6,
			key: "",
			px: 0,
			pz: 0,
			pyaw: 0,
			leanP: 0,
			leanR: 0
		};
	});
	let ultra = false;
	const target = new Float32Array(NB * 3);
	const eul = new Euler();
	function add(name, x, y, z, w) {
		const i = idx(name) * 3;
		target[i] += x * w;
		target[i + 1] += y * w;
		target[i + 2] += z * w;
	}
	function blend(spec, phase) {
		target.fill(0);
		const sp = spec.speed;
		let idle = spec.grounded ? 1 : 0;
		const run = spec.grounded ? MathUtils.clamp((sp - 3) / 5, 0, 1) : 0;
		const walk = spec.grounded ? MathUtils.clamp(sp / 3.2, 0, 1) * (1 - run) : 0;
		idle = spec.grounded ? Math.max(0, 1 - Math.max(walk, run)) : 0;
		const jump = !spec.grounded && spec.vy > .6 ? 1 : 0;
		const air = !spec.grounded && spec.vy <= .6 ? 1 : 0;
		const wall = spec.climb ? 1 : 0;
		const dash = spec.dash ? 1 : 0;
		const down = spec.down ? MathUtils.clamp(spec.fall, 0, 1) : 0;
		const land = spec.bounce && spec.grounded ? .85 : 0;
		const armDropL = -1.25;
		const armDropR = 1.25;
		add("armL", 0, 0, armDropL, 1);
		add("armR", 0, 0, armDropR, 1);
		add("foreL", 0, 0, -.45, 1);
		add("foreR", 0, 0, .45, 1);
		add("chest", Math.sin(phase * .5) * .04, 0, 0, idle);
		add("hair", Math.sin(phase) * .12, 0, 0, 1);
		const s = Math.sin(phase);
		add("thighL", s * (.7 + run * .45), 0, .05, Math.max(walk, run));
		add("thighR", -s * (.7 + run * .45), 0, -.05, Math.max(walk, run));
		add("shinL", Math.max(0, -s) * (.9 + run * .45), 0, 0, Math.max(walk, run));
		add("shinR", Math.max(0, s) * (.9 + run * .45), 0, 0, Math.max(walk, run));
		add("armL", 0, s * (.45 + run * .4), 0, Math.max(walk, run));
		add("armR", 0, -s * (.45 + run * .4), 0, Math.max(walk, run));
		add("hips", 0, s * .1, 0, Math.max(walk, run));
		add("chest", -s * .08, 0, 0, Math.max(walk, run));
		add("spine", .35, 0, 0, jump);
		add("thighL", .7, 0, 0, jump);
		add("thighR", .7, 0, 0, jump);
		add("shinL", 1.15, 0, 0, jump);
		add("shinR", 1.15, 0, 0, jump);
		add("armL", 0, 0, 1.5, jump);
		add("armR", 0, 0, -1.5, jump);
		add("chest", .25, 0, 0, air);
		add("armL", 0, 0, .7, air);
		add("armR", 0, 0, -.7, air);
		add("thighL", .25, 0, .12, air);
		add("thighR", .25, 0, -.12, air);
		add("hair", .5, 0, 0, air + jump);
		add("spine", .2, 0, .45, wall);
		add("armL", 0, 0, 1.3, wall);
		add("thighL", .9, 0, 0, wall);
		add("shinL", .4, 0, 0, wall);
		add("spine", .65, 0, 0, dash);
		add("armL", 0, -.6, 0, dash);
		add("armR", 0, .6, 0, dash);
		add("thighL", .55, 0, 0, land);
		add("thighR", .55, 0, 0, land);
		add("shinL", 1.05, 0, 0, land);
		add("shinR", 1.05, 0, 0, land);
		add("chest", .4, 0, 0, land);
		add("spine", 1.15, 0, 0, down);
		add("head", .4, 0, 0, down);
		add("armL", .4, .3, .4, down);
		add("armR", .4, -.3, -.4, down);
		add("thighL", .35, 0, .2, down);
		add("thighR", .2, 0, -.2, down);
		add("spine", -spec.lean * .45, 0, -spec.bank * .55, 1);
		add("chest", -spec.lean * .2, 0, -spec.bank * .25, 1);
		add("head", -spec.lean * .35, 0, -spec.bank * .15, 1);
		if (spec.mood === "wave") {
			add("armR", -.15, 0, -2.55, 1);
			add("foreR", Math.sin(phase * 7) * .55, 0, -.35, 1);
			add("head", 0, spec.look, 0, 1);
		} else if (spec.mood === "angry") {
			add("armR", -.05, 0, -2.35, 1);
			add("foreR", 0, 0, -1.25, 1);
			add("head", .18, spec.look, .22, 1);
			add("chest", .12, 0, 0, 1);
		} else if (spec.mood === "depressed" || spec.mood === "cry") {
			add("spine", .55, 0, 0, 1);
			add("head", .7, spec.look * .25, 0, 1);
			add("armL", .4, .1, .25, 1);
			add("armR", .4, -.1, -.25, 1);
		} else if (spec.mood === "talk" || spec.mood === "exclaim" || spec.mood === "happy") {
			add("head", 0, spec.look, 0, 1);
			add("chest", -.08, 0, 0, 1);
		} else if (spec.look) {
			add("head", 0, spec.look, 0, 1);
			add("neck", 0, spec.look * .4, 0, 1);
		}
		if (mutant) add("spine", .35, 0, 0, 1);
	}
	return {
		setUltra(on) {
			ultra = on;
			for (const slot of slots) slot.mesh.material = on ? pencilMat : solidMat;
		},
		hide(i) {
			const slot = slots[i];
			if (!slot) return;
			slot.mesh.visible = false;
			slot.shadow.visible = false;
		},
		hideFrom(n) {
			for (let i = n; i < slots.length; i++) {
				slots[i].mesh.visible = false;
				slots[i].shadow.visible = false;
			}
		},
		place(i, spec) {
			const slot = slots[i];
			if (!slot) return;
			const moved = Math.hypot(spec.x - slot.px, spec.z - slot.pz);
			const speed = Math.max(spec.speed, spec.dt > 0 ? moved / spec.dt : 0);
			slot.px = spec.x;
			slot.pz = spec.z;
			slot.phase += speed * spec.dt * 2.4 + (spec.grounded ? 0 : spec.dt);
			const key = `${spec.id}|${spec.skin}|${spec.hair}|${spec.cloth}|${spec.sheep ? 1 : 0}`;
			if (key !== slot.key) {
				slot.key = key;
				paint(slot.mesh.geometry, spec.sheep ? 16774890 : spec.skin, spec.sheep ? 16774890 : spec.hair, spec.sheep ? 16774890 : spec.cloth);
			}
			blend({
				...spec,
				speed
			}, slot.phase);
			const ragdoll = ultra && (spec.down || spec.vy < -2.2 || spec.bounce || spec.fall > .08);
			if (ragdoll && !slot.rag) for (let b = 0; b < NB; b++) {
				slot.vel[b * 3] = (Math.random() - .5) * 3 + spec.vy * .15;
				slot.vel[b * 3 + 1] = (Math.random() - .5) * 2;
				slot.vel[b * 3 + 2] = (Math.random() - .5) * 2;
			}
			slot.rag = ragdoll;
			const dt = Math.min(.05, spec.dt);
			if (ragdoll) for (let b = 0; b < NB; b++) {
				if (!spec.grounded) slot.vel[b * 3] += dt * (b > 10 ? 1.6 : .25);
				if (spec.bounce) slot.vel[b * 3] += (Math.random() - .5) * 5;
				slot.vel[b * 3] *= .9;
				slot.vel[b * 3 + 1] *= .88;
				slot.vel[b * 3 + 2] *= .88;
				slot.cur[b * 3] += slot.vel[b * 3] * dt;
				slot.cur[b * 3 + 1] += slot.vel[b * 3 + 1] * dt;
				slot.cur[b * 3 + 2] += slot.vel[b * 3 + 2] * dt;
				const spring = spec.down ? 2.2 : 5;
				slot.vel[b * 3] += (target[b * 3] - slot.cur[b * 3]) * spring * dt;
				slot.vel[b * 3 + 1] += (target[b * 3 + 1] - slot.cur[b * 3 + 1]) * spring * dt;
				slot.vel[b * 3 + 2] += (target[b * 3 + 2] - slot.cur[b * 3 + 2]) * spring * dt;
				slot.cur[b * 3] = MathUtils.clamp(slot.cur[b * 3], -2.4, 2.4);
				slot.cur[b * 3 + 2] = MathUtils.clamp(slot.cur[b * 3 + 2], -2.4, 2.4);
			}
			else {
				const t = 1 - Math.exp(-14 * dt);
				for (let k = 0; k < target.length; k++) slot.cur[k] = slot.cur[k] + (target[k] - slot.cur[k]) * t;
				slot.vel.fill(0);
			}
			for (let b = 0; b < NB; b++) {
				eul.set(slot.cur[b * 3], slot.cur[b * 3 + 1], slot.cur[b * 3 + 2]);
				slot.rig.ordered[b].rotation.copy(eul);
			}
			slot.rig.hair.scale.set(1, MathUtils.clamp(spec.hairLen, .25, 1.8), 1);
			const showSkirt = spec.skirt > .2 && !spec.sheep;
			slot.rig.skirt.scale.setScalar(showSkirt ? 1 : .001);
			slot.rig.head.scale.setScalar(spec.sheep ? 1.28 : mutant ? 1.08 : 1);
			const flap = Math.sin(performance.now() / 160 + i) * .4;
			slot.wingL.visible = spec.wings > 0 && !spec.sheep;
			slot.wingR.visible = slot.wingL.visible;
			slot.wingL.rotation.z = .4 + flap;
			slot.wingR.rotation.z = -.4 - flap;
			slot.wingL.material.color.setHex(spec.wingColor);
			slot.wingR.material.color.setHex(spec.wingColor);
			slot.halo.visible = spec.halo;
			slot.gun.visible = spec.gun;
			const talking = spec.mouth >= 0;
			slot.mouthBit.visible = talking && spec.mouth === 0;
			slot.mouthOpen.visible = talking && spec.mouth === 1;
			slot.veins.forEach((vein, vi) => {
				vein.visible = vi < spec.veins;
			});
			slot.mesh.visible = true;
			let turn = spec.yaw - slot.pyaw;
			while (turn > Math.PI) turn -= Math.PI * 2;
			while (turn < -Math.PI) turn += Math.PI * 2;
			slot.pyaw = spec.yaw;
			const turnLean = MathUtils.clamp(-turn / Math.max(.008, spec.dt) * .045, -.4, .4);
			const k = 1 - Math.exp(-9 * Math.min(.05, spec.dt));
			slot.leanP += (spec.lean - slot.leanP) * k;
			slot.leanR += (spec.bank + turnLean - slot.leanR) * k;
			const bob = spec.grounded && !spec.down ? Math.abs(Math.sin(slot.phase * 2)) * .045 * MathUtils.clamp(speed / 6, 0, 1) : 0;
			slot.mesh.position.set(spec.x, spec.y + bob, spec.z);
			slot.mesh.rotation.order = "YXZ";
			const flop = !ultra && spec.down ? spec.fall * 1.15 : 0;
			slot.mesh.rotation.set(flop + slot.leanP, spec.yaw, slot.leanR);
			slot.mesh.scale.set(spec.scale, spec.scale * spec.squash, spec.scale);
			slot.mesh.castShadow = ultra;
			slot.mesh.updateMatrixWorld(true);
			slot.shadow.visible = !spec.down;
			if (ultra) {
				const lit = Math.max(.05, spec.sunY);
				const len = MathUtils.clamp(.42 / lit, .35, 3.4);
				slot.shadow.position.set(spec.x - spec.sunX * len, spec.y + .035, spec.z - spec.sunZ * len);
				slot.shadow.scale.set(.45 + len * .22, 1, .32 + len * .5);
				slot.shadow.rotation.y = Math.atan2(spec.sunX, spec.sunZ);
				slot.shadow.material.opacity = .45;
			} else {
				slot.shadow.position.set(spec.x, spec.y + .03, spec.z);
				slot.shadow.scale.set(.7, 1, .45);
				slot.shadow.rotation.y = spec.yaw;
				slot.shadow.material.opacity = .28;
			}
		}
	};
}
var CELL = 16;
function key(ix, iz) {
	return `${ix},${iz}`;
}
function riverZ(x) {
	return 8 + Math.sin(x * .045) * 7;
}
function inRiver(x, z) {
	if (x < -102 || x > 102) return false;
	return Math.abs(z - riverZ(x)) < 6.2;
}
function add(solids, cx, cy, cz, w, h, d, extra) {
	solids.push({
		minX: cx - w / 2,
		maxX: cx + w / 2,
		minY: cy - h / 2,
		maxY: cy + h / 2,
		minZ: cz - d / 2,
		maxZ: cz + d / 2,
		oneway: false,
		bounce: 0,
		turbo: 0,
		climb: false,
		color: 13157040,
		...extra
	});
}
function hash(n) {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
}
function buildWorld() {
	const solids = [];
	const bases = [
		{
			team: 0,
			x: 0,
			z: -88
		},
		{
			team: 1,
			x: -76,
			z: 44
		},
		{
			team: 2,
			x: 76,
			z: 44
		}
	];
	const mesaColor = [
		16052710,
		2372166,
		12865866
	];
	for (const b of bases) {
		add(solids, b.x, 4, b.z, 32, 8, 32, { color: mesaColor[b.team] });
		const yawIn = Math.atan2(-b.x, -b.z);
		const fx = -Math.sin(yawIn);
		const fz = -Math.cos(yawIn);
		for (let i = 0; i < 4; i++) {
			const dist = 16 + i * 3.2;
			const hh = 1 + i * 1.7;
			add(solids, b.x + fx * dist, hh / 2, b.z + fz * dist, 6, hh, 4, { color: i % 2 ? 15194032 : mesaColor[b.team] });
		}
		add(solids, b.x + fx * 12, 8.2, b.z + fz * 12, 2.6, .35, 2.6, {
			bounce: 15,
			color: 13034330
		});
	}
	for (let i = 0; i < 14; i++) {
		const a = i * .62 + .4;
		const r = 8.2 + i * .18;
		const y = 1.6 + i * 1.82;
		add(solids, Math.cos(a) * r, y, Math.sin(a) * r, 3.5, .42, 3.5, {
			oneway: true,
			color: i % 2 ? 14150794 : 16774320
		});
	}
	add(solids, 0, 27.35, 0, 18, .7, 18, { color: 16249796 });
	add(solids, 11.4, 14, .2, 1.35, 28, 7.5, {
		climb: true,
		color: 15985360
	});
	add(solids, 0, 4.6, -58, 18, .7, 7, { color: 16052708 });
	for (let i = 0; i < 22; i++) {
		const a = i / 22 * Math.PI * 2;
		const r = 44;
		const x = Math.cos(a) * r;
		const z = Math.sin(a) * r;
		if (inRiver(x, z)) continue;
		if (i % 5 === 0) continue;
		add(solids, x, 1.15, z, 7, 2.3, 2.4, { color: 9270092 });
	}
	const bunkers = [
		{
			x: 28,
			z: 18
		},
		{
			x: -30,
			z: 16
		},
		{
			x: 4,
			z: -28
		}
	];
	for (const b of bunkers) {
		add(solids, b.x, 1.6, b.z, 8, 3.2, 6, { color: 7232064 });
		add(solids, b.x, 3.5, b.z - 2.2, 8, .4, 1.2, {
			oneway: true,
			color: 9072720
		});
	}
	for (const [x, z, h] of [
		[
			-40,
			-60,
			7
		],
		[
			-28,
			-68,
			5
		],
		[
			-50,
			-70,
			6
		],
		[
			-36,
			-50,
			4.5
		]
	]) {
		add(solids, x, h / 2, z, 8, h, 8, { color: 16184300 });
		add(solids, x, h + .35, z, 5.5, .7, 5.5, { color: 15002831 });
	}
	for (const [x, z, h] of [
		[
			98,
			18,
			6
		],
		[
			90,
			8,
			5
		],
		[
			108,
			30,
			7
		],
		[
			86,
			28,
			4
		]
	]) {
		add(solids, x, h / 2, z, 7.5, h, 7.5, { color: 12075836 });
		add(solids, x + 1.2, h + 1.2, z, 1.4, 2.4, 1.4, { color: 6957604 });
	}
	for (const [x, z, y] of [
		[
			-96,
			62,
			12
		],
		[
			-58,
			70,
			16
		],
		[
			-88,
			24,
			10
		],
		[
			-104,
			40,
			18
		]
	]) {
		add(solids, x, y, z, 6, .45, 6, {
			oneway: true,
			color: 2899546
		});
		add(solids, x, y + .15, z, 6.4, .12, .35, {
			oneway: true,
			color: 4114175
		});
	}
	for (const [x, y, z, turbo] of [
		[
			0,
			2.2,
			-18,
			0
		],
		[
			14,
			4.4,
			-8,
			0
		],
		[
			-12,
			6.2,
			6,
			1
		],
		[
			22,
			.4,
			36,
			1
		],
		[
			-24,
			.4,
			-36,
			0
		],
		[
			48,
			.4,
			-18,
			1
		],
		[
			-48,
			.4,
			8,
			0
		],
		[
			8,
			10,
			-48,
			0
		]
	]) if (turbo) add(solids, x, y, z, 2.8, .3, 2.8, {
		turbo: 20,
		color: 8057087
	});
	else add(solids, x, y, z, 2.8, .3, 2.8, {
		bounce: 14,
		color: 13034330
	});
	for (const [x, y, z] of [
		[
			18,
			.8,
			22
		],
		[
			-16,
			.8,
			26
		],
		[
			12,
			2.2,
			22
		],
		[
			30,
			.7,
			-8
		],
		[
			-34,
			.7,
			-6
		],
		[
			6,
			.7,
			40
		],
		[
			-8,
			.7,
			-16
		],
		[
			42,
			.7,
			18
		],
		[
			-46,
			.7,
			-22
		],
		[
			16,
			.7,
			-42
		]
	]) add(solids, x, y, z, 1.6, 1.6, 1.6, { color: hash(x + z) > .72 ? 15195332 : 10275941 });
	for (let i = -2; i <= 2; i++) {
		const x = i * 36;
		add(solids, x, .7, riverZ(x), 8, 1.2, 3.2, { color: 14274748 });
	}
	const cans = [
		{
			x: 18,
			y: 2.1,
			z: -78,
			kind: 0
		},
		{
			x: -20,
			y: 2.1,
			z: -82,
			kind: 0
		},
		{
			x: 34,
			y: 2.1,
			z: -96,
			kind: 1
		},
		{
			x: -8,
			y: 2.1,
			z: 52,
			kind: 2
		},
		{
			x: 64,
			y: 2.1,
			z: 58,
			kind: 1
		},
		{
			x: -70,
			y: 10.2,
			z: 36,
			kind: 2
		},
		{
			x: 12,
			y: 10.2,
			z: -96,
			kind: 0
		},
		{
			x: 88,
			y: 10.2,
			z: 52,
			kind: 1
		}
	];
	for (const c of cans) add(solids, c.x, c.y, c.z, 2.4, 4.2, 2.4, {
		bounce: 13,
		color: 10275898
	});
	const meds = [];
	for (const b of bases) meds.push({
		x: b.x + 7,
		y: 8.15,
		z: b.z + 5
	}, {
		x: b.x - 7,
		y: 8.15,
		z: b.z - 5
	});
	for (let i = 0; i < 10; i++) {
		const a = i / 10 * Math.PI * 2;
		const x = Math.cos(a) * 26;
		const z = Math.sin(a) * 26;
		if (!inRiver(x, z)) meds.push({
			x,
			y: .2,
			z
		});
	}
	for (let i = 0; i < 12; i++) {
		const a = i / 12 * Math.PI * 2 + .2;
		const x = Math.cos(a) * 62;
		const z = Math.sin(a) * 62;
		if (!inRiver(x, z)) meds.push({
			x,
			y: .2,
			z
		});
	}
	while (meds.length < 30) meds.push({
		x: -10 + meds.length,
		y: .2,
		z: 30
	});
	const flags = bases.map((b) => ({
		team: b.team,
		x: b.x,
		y: 8,
		z: b.z
	}));
	const spawns = bases.flatMap((b) => {
		const yaw = Math.atan2(b.x, b.z);
		return [
			0,
			1,
			2,
			3
		].map((k) => {
			const a = k / 4 * Math.PI * 2;
			return {
				team: b.team,
				x: b.x + Math.cos(a) * 5,
				y: 8.05,
				z: b.z + Math.sin(a) * 5,
				yaw
			};
		});
	});
	const palms = [];
	for (let i = 0; i < 18; i++) {
		const x = -70 + hash(i + 3) * 140;
		const z = -78 - hash(i + 9) * 30;
		if (Math.hypot(x, z + 88) < 18) continue;
		palms.push({
			x,
			z,
			s: .9 + hash(i + 2) * .55
		});
	}
	for (let i = 0; i < 16; i++) {
		const a = i / 16 * Math.PI * 2 + .4;
		const r = 30 + hash(i + 21) * 22;
		const x = Math.cos(a) * r;
		const z = Math.sin(a) * r;
		if (inRiver(x, z) || Math.hypot(x, z) < 14) continue;
		palms.push({
			x,
			z,
			s: 1.1 + hash(i + 8) * .55
		});
	}
	const flowers = [];
	const grass = [];
	const rocks = [];
	const flowerCols = [
		16747216,
		16769162,
		13034330,
		16777215,
		16739179
	];
	for (let i = 0; i < 140; i++) {
		const x = -110 + hash(i * 3.1) * 220;
		const z = -110 + hash(i * 5.7) * 220;
		if (inRiver(x, z)) continue;
		if (Math.hypot(x, z) < 12) continue;
		flowers.push({
			x,
			z,
			c: flowerCols[i % flowerCols.length]
		});
		if (i % 2 === 0) grass.push({
			x: x + .6,
			z: z - .4,
			s: .4 + hash(i) * .5,
			c: z < -50 ? 13034330 : 8239706
		});
	}
	for (let i = 0; i < 36; i++) {
		const x = -100 + hash(i + 40) * 200;
		const z = -100 + hash(i + 80) * 200;
		if (inRiver(x, z)) continue;
		const sand = z < -55;
		rocks.push({
			x,
			z,
			s: .4 + hash(i + 12) * .9,
			c: sand ? 15127464 : 9274232
		});
	}
	const streams = [
		{
			r: 2.4,
			pts: [
				{
					x: 0,
					y: 12,
					z: -68
				},
				{
					x: 0,
					y: 14,
					z: -40
				},
				{
					x: 2,
					y: 17,
					z: -16
				},
				{
					x: 4,
					y: 20,
					z: -4
				}
			]
		},
		{
			r: 2.4,
			pts: [
				{
					x: -60,
					y: 12,
					z: 36
				},
				{
					x: -36,
					y: 15,
					z: 22
				},
				{
					x: -16,
					y: 18,
					z: 8
				},
				{
					x: -4,
					y: 21,
					z: 2
				}
			]
		},
		{
			r: 2.4,
			pts: [
				{
					x: 60,
					y: 12,
					z: 36
				},
				{
					x: 36,
					y: 15,
					z: 20
				},
				{
					x: 16,
					y: 18,
					z: 8
				},
				{
					x: 5,
					y: 21,
					z: 0
				}
			]
		}
	];
	const buckets = /* @__PURE__ */ new Map();
	solids.forEach((s, i) => {
		const x0 = Math.floor(s.minX / CELL);
		const x1 = Math.floor(s.maxX / CELL);
		const z0 = Math.floor(s.minZ / CELL);
		const z1 = Math.floor(s.maxZ / CELL);
		for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
			const k = key(ix, iz);
			const arr = buckets.get(k);
			if (arr) arr.push(i);
			else buckets.set(k, [i]);
		}
	});
	return {
		solids,
		buckets,
		meds: meds.slice(0, 30),
		flags,
		spawns,
		palms,
		cans,
		flowers,
		rocks,
		grass,
		streams,
		bunkers,
		trainR: 68,
		trainY: 3.15,
		hill: {
			x: 0,
			y: 27.7,
			z: 0,
			r: 8.2
		},
		qa: {
			x: 24,
			y: .05,
			z: -24,
			yaw: 0
		},
		bases
	};
}
function querySolidIds(world, x, z, rad) {
	const x0 = Math.floor((x - rad) / CELL);
	const x1 = Math.floor((x + rad) / CELL);
	const z0 = Math.floor((z - rad) / CELL);
	const z1 = Math.floor((z + rad) / CELL);
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
		const arr = world.buckets.get(key(ix, iz));
		if (!arr) continue;
		for (const id of arr) {
			if (seen.has(id)) continue;
			seen.add(id);
			out.push(id);
		}
	}
	return out;
}
function raySolids(world, ox, oy, oz, dx, dy, dz, maxT) {
	let best = null;
	const ids = querySolidIds(world, ox + dx * maxT * .5, oz + dz * maxT * .5, maxT * .5 + 2);
	for (const id of ids) {
		const b = world.solids[id];
		const hit = rayAABB(ox, oy, oz, dx, dy, dz, b, maxT);
		if (hit && hit.t >= 0 && (!best || hit.t < best.t)) best = hit;
	}
	if (dy < 0 && oy > 0) {
		const t = (0 - oy) / dy;
		if (t > 0 && t < maxT && (!best || t < best.t)) best = {
			t,
			nx: 0,
			ny: 1,
			nz: 0,
			x: ox + dx * t,
			y: 0,
			z: oz + dz * t,
			box: null,
			ground: true
		};
	}
	return best;
}
function rayAABB(ox, oy, oz, dx, dy, dz, b, maxT) {
	let tmin = 0;
	let tmax = maxT;
	let nx = 0, ny = 0, nz = 0;
	const slabs = [
		[
			ox,
			dx,
			b.minX,
			b.maxX,
			"x"
		],
		[
			oy,
			dy,
			b.minY,
			b.maxY,
			"y"
		],
		[
			oz,
			dz,
			b.minZ,
			b.maxZ,
			"z"
		]
	];
	for (const [o, d, mn, mx, axis] of slabs) {
		if (Math.abs(d) < 1e-8) {
			if (o < mn || o > mx) return null;
			continue;
		}
		let t1 = (mn - o) / d;
		let t2 = (mx - o) / d;
		let n = -1;
		if (t1 > t2) {
			const s = t1;
			t1 = t2;
			t2 = s;
			n = 1;
		}
		if (t1 > tmin) {
			tmin = t1;
			nx = ny = nz = 0;
			if (axis === "x") nx = n;
			else if (axis === "y") ny = n;
			else nz = n;
		}
		tmax = Math.min(tmax, t2);
		if (tmin > tmax) return null;
	}
	if (tmin < 0 || tmin > maxT) return null;
	return {
		t: tmin,
		nx,
		ny,
		nz,
		x: ox + dx * tmin,
		y: oy + dy * tmin,
		z: oz + dz * tmin,
		box: b,
		ground: false
	};
}
function sheet(w, h) {
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	return {
		c,
		g: c.getContext("2d")
	};
}
function texOf(c) {
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	t.wrapS = RepeatWrapping;
	t.wrapT = RepeatWrapping;
	t.anisotropy = 4;
	t.needsUpdate = true;
	return t;
}
function specks(g, w, h, n, a) {
	for (let i = 0; i < n; i++) {
		g.globalAlpha = a * (.3 + Math.random() * .7);
		g.fillStyle = Math.random() > .5 ? "#000" : "#fff";
		g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
	}
	g.globalAlpha = 1;
}
function cloth() {
	const { c, g } = sheet(128, 128);
	g.fillStyle = "#f6f3ec";
	g.fillRect(0, 0, 128, 128);
	for (let y = 0; y < 128; y += 3) {
		g.fillStyle = y % 6 === 0 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.35)";
		g.fillRect(0, y, 128, 1);
	}
	for (let x = 0; x < 128; x += 5) {
		g.fillStyle = "rgba(0,0,0,0.035)";
		g.fillRect(x, 0, 1, 128);
	}
	g.fillStyle = "rgba(40,30,20,0.18)";
	g.fillRect(60, 0, 4, 128);
	g.fillRect(0, 96, 128, 3);
	specks(g, 128, 128, 80, .08);
	return texOf(c);
}
function skin() {
	const { c, g } = sheet(128, 128);
	const grd = g.createRadialGradient(64, 54, 10, 64, 64, 78);
	grd.addColorStop(0, "#fffdfb");
	grd.addColorStop(1, "#f3e4d8");
	g.fillStyle = grd;
	g.fillRect(0, 0, 128, 128);
	g.fillStyle = "rgba(255,140,150,0.16)";
	g.beginPath();
	g.ellipse(28, 78, 18, 10, 0, 0, Math.PI * 2);
	g.ellipse(100, 78, 18, 10, 0, 0, Math.PI * 2);
	g.fill();
	specks(g, 128, 128, 140, .06);
	return texOf(c);
}
function hair() {
	const { c, g } = sheet(64, 128);
	g.fillStyle = "#f7f4ef";
	g.fillRect(0, 0, 64, 128);
	for (let x = 0; x < 64; x += 3) {
		g.fillStyle = x % 6 === 0 ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.28)";
		g.fillRect(x, 0, 1, 128);
	}
	g.fillStyle = "rgba(0,0,0,0.08)";
	for (let i = 0; i < 12; i++) g.fillRect(Math.random() * 64, 0, 2, 128);
	return texOf(c);
}
function stone() {
	const { c, g } = sheet(256, 256);
	g.fillStyle = "#c9c2b6";
	g.fillRect(0, 0, 256, 256);
	const bw = 64;
	const bh = 32;
	for (let y = 0; y < 256; y += bh) {
		const off = y / bh % 2 ? bw / 2 : 0;
		for (let x = -64; x < 256; x += bw) {
			const l = 236 + Math.floor(Math.random() * 16);
			g.fillStyle = `rgb(${l},${l - 4},${l - 10})`;
			g.fillRect(x + off + 2, y + 2, 60, 28);
			g.fillStyle = "rgba(255,255,255,0.18)";
			g.fillRect(x + off + 4, y + 4, 52, 3);
		}
	}
	specks(g, 256, 256, 200, .07);
	return texOf(c);
}
function wood() {
	const { c, g } = sheet(64, 128);
	g.fillStyle = "#e7d3b4";
	g.fillRect(0, 0, 64, 128);
	for (let x = 0; x < 64; x += 1) {
		const n = Math.sin(x * .7) * 8 + Math.sin(x * .17) * 6;
		g.strokeStyle = `rgba(90,52,24,${.08 + x % 5 * .03})`;
		g.beginPath();
		g.moveTo(x, 0);
		g.bezierCurveTo(x + n, 40, x - n, 80, x + n * .3, 128);
		g.stroke();
	}
	g.fillStyle = "rgba(60,36,16,0.25)";
	g.fillRect(0, 0, 64, 3);
	return texOf(c);
}
function leaf() {
	const { c, g } = sheet(128, 128);
	g.fillStyle = "#e9ffe4";
	g.fillRect(0, 0, 128, 128);
	g.strokeStyle = "rgba(20,80,30,0.28)";
	for (let i = 0; i < 18; i++) {
		g.beginPath();
		g.moveTo(64, 118);
		g.quadraticCurveTo(20 + i * 5, 40, 10 + i * 6, 8);
		g.stroke();
	}
	specks(g, 128, 128, 60, .08);
	return texOf(c);
}
function metal() {
	const { c, g } = sheet(128, 64);
	const grd = g.createLinearGradient(0, 0, 0, 64);
	grd.addColorStop(0, "#ffffff");
	grd.addColorStop(.45, "#e4e7ee");
	grd.addColorStop(1, "#f7f8fb");
	g.fillStyle = grd;
	g.fillRect(0, 0, 128, 64);
	g.fillStyle = "rgba(255,255,255,0.65)";
	g.fillRect(0, 8, 128, 6);
	g.fillStyle = "rgba(0,0,0,0.08)";
	for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 128, 1);
	return texOf(c);
}
function grit() {
	const { c, g } = sheet(256, 256);
	g.fillStyle = "#ffffff";
	g.fillRect(0, 0, 256, 256);
	g.strokeStyle = "rgba(40,70,20,0.16)";
	g.lineWidth = 1;
	for (let i = 0; i < 220; i++) {
		const x = Math.random() * 256;
		const y = Math.random() * 256;
		g.beginPath();
		g.moveTo(x, y);
		g.lineTo(x + (Math.random() - .5) * 4, y - 5 - Math.random() * 9);
		g.stroke();
	}
	specks(g, 256, 256, 500, .1);
	const t = texOf(c);
	t.repeat.set(28, 28);
	return t;
}
function caustic() {
	const { c, g } = sheet(128, 128);
	g.fillStyle = "#f3fbff";
	g.fillRect(0, 0, 128, 128);
	g.strokeStyle = "rgba(255,255,255,0.85)";
	g.lineWidth = 2;
	for (let i = 0; i < 16; i++) {
		g.beginPath();
		g.ellipse(Math.random() * 128, Math.random() * 128, 10 + Math.random() * 20, 4 + Math.random() * 8, Math.random() * 3, 0, Math.PI * 2);
		g.stroke();
	}
	const t = texOf(c);
	t.repeat.set(6, 1);
	return t;
}
function feather() {
	const { c, g } = sheet(128, 64);
	g.fillStyle = "#fffdf8";
	g.fillRect(0, 0, 128, 64);
	g.strokeStyle = "rgba(180,160,90,0.35)";
	for (let x = 8; x < 128; x += 6) {
		g.beginPath();
		g.moveTo(4, 32);
		g.lineTo(x, 4);
		g.moveTo(4, 32);
		g.lineTo(x, 60);
		g.stroke();
	}
	return texOf(c);
}
function rock() {
	const { c, g } = sheet(64, 64);
	g.fillStyle = "#f4f1ea";
	g.fillRect(0, 0, 64, 64);
	for (let i = 0; i < 8; i++) {
		g.fillStyle = `rgba(80,70,60,${.05 + Math.random() * .12})`;
		g.beginPath();
		g.ellipse(Math.random() * 64, Math.random() * 64, 8 + Math.random() * 16, 6, Math.random(), 0, Math.PI * 2);
		g.fill();
	}
	specks(g, 64, 64, 40, .12);
	return texOf(c);
}
function petal() {
	const { c, g } = sheet(64, 64);
	g.fillStyle = "#fff";
	g.fillRect(0, 0, 64, 64);
	g.strokeStyle = "rgba(80,40,60,0.2)";
	for (let i = 0; i < 5; i++) {
		g.beginPath();
		g.moveTo(32, 60);
		g.quadraticCurveTo(8 + i * 10, 20, 32, 4);
		g.stroke();
	}
	return texOf(c);
}
function blade() {
	const { c, g } = sheet(32, 64);
	g.fillStyle = "#f4ffe8";
	g.fillRect(0, 0, 32, 64);
	g.strokeStyle = "rgba(20,60,10,0.25)";
	g.beginPath();
	g.moveTo(16, 64);
	g.lineTo(16, 4);
	g.moveTo(10, 64);
	g.lineTo(8, 12);
	g.moveTo(22, 64);
	g.lineTo(24, 16);
	g.stroke();
	return texOf(c);
}
function zombieSkin() {
	const { c, g } = sheet(256, 256);
	g.fillStyle = "#6fce3c";
	g.fillRect(0, 0, 256, 256);
	for (let i = 0; i < 36; i++) {
		g.fillStyle = i % 3 === 0 ? "#2f6a18" : i % 3 === 1 ? "#b6f56a" : "#8adf48";
		g.globalAlpha = .85;
		g.beginPath();
		g.ellipse(Math.random() * 256, Math.random() * 256, 12 + Math.random() * 36, 8 + Math.random() * 22, Math.random() * 3, 0, Math.PI * 2);
		g.fill();
	}
	g.globalAlpha = 1;
	g.strokeStyle = "#1c4a12";
	g.lineWidth = 2;
	for (let i = 0; i < 10; i++) {
		g.beginPath();
		const x = Math.random() * 256;
		g.moveTo(x, 0);
		g.bezierCurveTo(x + 30, 60, x - 40, 120, x + 10, 256);
		g.stroke();
	}
	for (let i = 0; i < 14; i++) {
		g.fillStyle = i % 2 ? "#dfe86a" : "#214014";
		g.beginPath();
		g.ellipse(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 7, 3 + Math.random() * 4, 0, 0, Math.PI * 2);
		g.fill();
	}
	g.fillStyle = "rgba(20,40,10,0.35)";
	g.fillRect(0, 150, 256, 8);
	g.strokeStyle = "rgba(18,12,8,0.55)";
	g.lineWidth = 2;
	for (let i = 0; i < 8; i++) {
		const x = 20 + i * 28;
		const y = 40 + i % 4 * 48;
		g.beginPath();
		g.moveTo(x, y);
		g.lineTo(x + 16, y + 4);
		g.moveTo(x + 8, y - 6);
		g.lineTo(x + 8, y + 10);
		g.stroke();
	}
	return texOf(c);
}
function zombieRag() {
	const { c, g } = sheet(128, 128);
	g.fillStyle = "#dfe8c8";
	g.fillRect(0, 0, 128, 128);
	for (let y = 0; y < 128; y += 8) {
		g.fillStyle = y % 16 === 0 ? "rgba(40,30,16,0.18)" : "rgba(255,255,255,0.2)";
		g.fillRect(0, y, 128, 3);
	}
	g.fillStyle = "#5caa32";
	for (let i = 0; i < 7; i++) {
		g.beginPath();
		g.moveTo(10 + i * 16, 20 + i % 3 * 18);
		g.lineTo(28 + i * 12, 8);
		g.lineTo(36 + i * 10, 40);
		g.closePath();
		g.fill();
	}
	g.strokeStyle = "rgba(20,16,8,0.45)";
	g.lineWidth = 2;
	g.beginPath();
	g.moveTo(0, 40);
	g.lineTo(50, 70);
	g.lineTo(128, 48);
	g.stroke();
	g.fillStyle = "#3f8a28";
	g.beginPath();
	g.moveTo(18, 90);
	g.lineTo(46, 78);
	g.lineTo(40, 118);
	g.closePath();
	g.fill();
	g.beginPath();
	g.moveTo(88, 24);
	g.lineTo(112, 16);
	g.lineTo(104, 48);
	g.closePath();
	g.fill();
	return texOf(c);
}
function boneTex() {
	const { c, g } = sheet(128, 128);
	g.fillStyle = "#f4f0e4";
	g.fillRect(0, 0, 128, 128);
	g.strokeStyle = "rgba(120,96,64,0.45)";
	g.lineWidth = 2;
	for (let i = 0; i < 7; i++) {
		g.beginPath();
		g.moveTo(8, 10 + i * 16);
		g.quadraticCurveTo(64, 4 + i * 16, 120, 18 + i * 16);
		g.stroke();
	}
	g.fillStyle = "rgba(90,70,40,0.18)";
	for (let i = 0; i < 5; i++) {
		g.beginPath();
		g.ellipse(20 + i * 22, 30 + i % 3 * 28, 6, 3, .4, 0, Math.PI * 2);
		g.fill();
	}
	return texOf(c);
}
function mutantFace() {
	const { c, g } = sheet(256, 256);
	g.clearRect(0, 0, 256, 256);
	g.fillStyle = "#8ee85a";
	g.beginPath();
	g.ellipse(128, 136, 108, 116, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = "rgba(24,60,12,0.38)";
	g.beginPath();
	g.ellipse(64, 162, 30, 38, .4, 0, Math.PI * 2);
	g.ellipse(192, 162, 30, 38, -.4, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = "#f3ff86";
	g.shadowColor = "#d8ff48";
	g.shadowBlur = 16;
	g.beginPath();
	g.ellipse(86, 116, 30, 18, 0, 0, Math.PI * 2);
	g.ellipse(170, 116, 30, 18, 0, 0, Math.PI * 2);
	g.fill();
	g.shadowBlur = 0;
	g.fillStyle = "#101c08";
	g.fillRect(80, 100, 7, 32);
	g.fillRect(164, 100, 7, 32);
	g.fillStyle = "#163010";
	g.beginPath();
	g.moveTo(128, 134);
	g.lineTo(112, 170);
	g.lineTo(144, 170);
	g.fill();
	g.fillStyle = "#0c1808";
	g.beginPath();
	g.ellipse(128, 198, 48, 24, 0, 0, Math.PI * 2);
	g.fill();
	g.fillStyle = "#f6f1e4";
	for (let i = 0; i < 4; i++) {
		g.fillRect(94 + i * 18, 180, 9, 14);
		g.fillRect(94 + i * 18, 204, 9, 12);
	}
	g.strokeStyle = "#1a140c";
	g.lineWidth = 3;
	g.beginPath();
	g.moveTo(36, 74);
	g.lineTo(220, 92);
	g.stroke();
	for (let x = 48; x < 214; x += 24) {
		g.beginPath();
		g.moveTo(x, 64);
		g.lineTo(x + 6, 102);
		g.stroke();
	}
	g.strokeStyle = "rgba(50,18,12,0.8)";
	g.lineWidth = 4;
	g.beginPath();
	g.moveTo(36, 148);
	g.lineTo(72, 176);
	g.lineTo(46, 208);
	g.stroke();
	const t = texOf(c);
	t.wrapS = ClampToEdgeWrapping;
	t.wrapT = ClampToEdgeWrapping;
	return t;
}
function mutantEyes() {
	const { c, g } = sheet(128, 64);
	g.clearRect(0, 0, 128, 64);
	g.fillStyle = "#d9ff4a";
	g.shadowColor = "#c6ff3a";
	g.shadowBlur = 14;
	g.beginPath();
	g.ellipse(36, 32, 16, 11, 0, 0, Math.PI * 2);
	g.ellipse(92, 32, 16, 11, 0, 0, Math.PI * 2);
	g.fill();
	g.shadowBlur = 0;
	g.fillStyle = "#142008";
	g.fillRect(33, 22, 4, 20);
	g.fillRect(89, 22, 4, 20);
	return texOf(c);
}
function bakeTextures() {
	const eyes = mutantEyes();
	return {
		cloth: cloth(),
		skin: skin(),
		hair: hair(),
		stone: stone(),
		wood: wood(),
		leaf: leaf(),
		metal: metal(),
		grit: grit(),
		caustic: caustic(),
		feather: feather(),
		rock: rock(),
		petal: petal(),
		blade: blade(),
		zombieSkin: zombieSkin(),
		zombieRag: zombieRag(),
		bone: boneTex(),
		mutantFace: mutantFace(),
		eyes
	};
}
var MAX = 72;
var DAY = 3600;
var GLYPH = {
	M: [
		"10001",
		"11011",
		"10101",
		"10001",
		"10001",
		"10001",
		"10001"
	],
	O: [
		"01110",
		"10001",
		"10001",
		"10001",
		"10001",
		"10001",
		"01110"
	],
	U: [
		"10001",
		"10001",
		"10001",
		"10001",
		"10001",
		"10001",
		"01110"
	],
	N: [
		"10001",
		"11001",
		"10101",
		"10011",
		"10001",
		"10001",
		"10001"
	],
	T: [
		"11111",
		"00100",
		"00100",
		"00100",
		"00100",
		"00100",
		"00100"
	],
	D: [
		"11110",
		"10001",
		"10001",
		"10001",
		"10001",
		"10001",
		"11110"
	],
	E: [
		"11111",
		"10000",
		"10000",
		"11110",
		"10000",
		"10000",
		"11111"
	],
	W: [
		"10001",
		"10001",
		"10001",
		"10101",
		"10101",
		"11011",
		"10001"
	]
};
var emptyTouch = () => ({
	x: 0,
	y: 0,
	lookX: 0,
	lookY: 0,
	fire: false,
	jump: false,
	act: false,
	cycle: false,
	dash: false
});
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function lerpAng(a, b, t) {
	let d = b - a;
	while (d > Math.PI) d -= Math.PI * 2;
	while (d < -Math.PI) d += Math.PI * 2;
	return a + d * t;
}
function createGame(view, overlay, opts) {
	const audio = createAudio();
	const world = buildWorld();
	const dyn = [];
	const actors = [];
	const balls = [];
	let carSerial = 0;
	const drones = [];
	const smiles = [];
	const tracers = [];
	const corpses = [];
	const parts = [];
	const flags = world.flags.map((f) => ({
		team: f.team,
		x: f.x,
		y: f.y + 1.2,
		z: f.z,
		hx: f.x,
		hy: f.y + 1.2,
		hz: f.z,
		carrier: -1,
		home: true,
		drop: 0
	}));
	const bunkers = world.bunkers.map((b) => ({
		...b,
		n: 0,
		done: false
	}));
	const caps = [
		0,
		0,
		0
	];
	const hillScore = [
		0,
		0,
		0
	];
	let hillOwner = -1;
	let hillTime = 0;
	let hillEmpty = 0;
	let boost = false;
	let surged = false;
	let nextId = 2;
	let player = null;
	let token = "";
	let pulseGen = 0;
	let linked = [];
	let spectate = false;
	const fly = {
		x: 0,
		y: 14,
		z: 30,
		yaw: 0,
		pitch: -.3
	};
	let commentT = 8;
	let qa = opts.qa;
	let playing = false;
	let menu = false;
	let showMap = false;
	let quality = "medium";
	let sens = .0022;
	let volume = .7;
	let yaw = 0;
	let pitch = .2;
	let lookX = 0;
	let lookY = 0;
	let shake = 0;
	let hitMark = 0;
	let hitHead = false;
	let scope = false;
	let mouseFire = false;
	let mouseScope = false;
	const keys = /* @__PURE__ */ new Set();
	let qaKeys = null;
	const was = {
		jump: false,
		act: false,
		cycle: false,
		fire: false
	};
	const edges = {
		jump: false,
		act: false,
		cycle: false,
		dash: false,
		slot: -1
	};
	const touch = emptyTouch();
	let queuedDash = null;
	const tapAt = {};
	let clock0 = performance.now() / 1e3 - 15 / 24 * DAY;
	let weather = "sun";
	let weatherT = 25;
	let heatLeft = 0;
	let heatArm = 48;
	let lightX = .35;
	let lightY = .8;
	let lightZ = .15;
	let meteorIn = 12;
	let prevSun = 1;
	let trainAng = .4;
	let trainToot = 0;
	let smileSnd = 0;
	let netAcc = 0;
	let lastNet = 0;
	let afkFix = false;
	let rambleT = 7;
	let rambleI = 0;
	let chatterT = 5;
	const RAMBLE = [
		"okay wait I was just saying the pink one",
		"and then she goes no stay with me this matters",
		"I am still talking because the story is not done",
		"hold on the next part is the good part"
	];
	let uiAcc = 0;
	let fid = 1;
	const feed = [];
	const log = [];
	let banner = "";
	let bannerAt = 0;
	const bannerQ = [];
	const pendingShots = [];
	const seenShots = /* @__PURE__ */ new Set();
	let openTele = -1;
	let spawnReq = false;
	let failWebgl = false;
	const subs = /* @__PURE__ */ new Set();
	let hud = blankHud();
	new Color(1, 1, 1);
	const tmp = new Vector3();
	const dir = new Vector3();
	const eul = new Euler();
	const quat = new Quaternion();
	const pos = new Vector3();
	const scl = new Vector3();
	const mat = new Matrix4();
	const col = new Color();
	let renderer;
	try {
		renderer = new WebGLRenderer({
			canvas: view,
			antialias: true,
			powerPreference: "high-performance"
		});
	} catch {
		failWebgl = true;
		renderer = new WebGLRenderer({ canvas: view });
	}
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.12;
	renderer.shadowMap.enabled = false;
	renderer.shadowMap.type = 2;
	renderer.setPixelRatio(1);
	renderer.setSize(view.clientWidth || 1280, view.clientHeight || 720, false);
	const scene = new Scene();
	scene.fog = new Fog(9356526, 130, 380);
	const skins = bakeTextures();
	const camera = new PerspectiveCamera(74, 1, .1, 500);
	const hemi = new HemisphereLight(12180735, 9420642, .85);
	scene.add(hemi);
	scene.add(new AmbientLight(16774890, .38));
	const rim = new DirectionalLight(10405119, .35);
	rim.position.set(-24, 18, -30);
	scene.add(rim);
	const sun = new DirectionalLight(16773840, 1.1);
	sun.position.set(40, 60, 20);
	sun.castShadow = false;
	sun.shadow.mapSize.set(1024, 1024);
	sun.shadow.camera.near = 2;
	sun.shadow.camera.far = 90;
	sun.shadow.camera.left = -28;
	sun.shadow.camera.right = 28;
	sun.shadow.camera.top = 28;
	sun.shadow.camera.bottom = -28;
	sun.shadow.bias = -6e-4;
	scene.add(sun);
	scene.add(sun.target);
	const skyGeo = new SphereGeometry(380, 20, 12);
	const skyPos = skyGeo.attributes.position;
	const skyCol = new Float32Array(skyPos.count * 3);
	for (let i = 0; i < skyPos.count; i++) {
		const elev = skyPos.getY(i) / 380;
		if (elev < 0) {
			skyCol[i * 3] = .45;
			skyCol[i * 3 + 1] = .62;
			skyCol[i * 3 + 2] = .82;
		} else {
			const t = Math.pow(MathUtils.clamp(elev / .2, 0, 1), .5);
			skyCol[i * 3] = 1 + -.84 * t;
			skyCol[i * 3 + 1] = .55 + (.42 - .55) * t;
			skyCol[i * 3 + 2] = .28 + .7 * t;
		}
	}
	skyGeo.setAttribute("color", new BufferAttribute(skyCol, 3));
	const skyMat = new MeshBasicMaterial({
		vertexColors: true,
		side: 1,
		depthWrite: false,
		fog: false
	});
	const sky = new Mesh(skyGeo, skyMat);
	scene.add(sky);
	const sunDisc = new Mesh(new SphereGeometry(16, 16, 12), new MeshBasicMaterial({
		color: 16774064,
		fog: false,
		depthWrite: false
	}));
	scene.add(sunDisc);
	const moonDisc = new Mesh(new SphereGeometry(9, 14, 10), new MeshBasicMaterial({
		color: 14673919,
		fog: false,
		depthWrite: false
	}));
	scene.add(moonDisc);
	const moon = new DirectionalLight(12044031, 0);
	moon.position.set(-30, 40, -10);
	scene.add(moon);
	const flareMat = new MeshBasicMaterial({
		color: 16770984,
		transparent: true,
		opacity: .55,
		fog: false,
		depthWrite: false,
		blending: 2
	});
	const flares = [
		1.8,
		.7,
		.35
	].map((s, i) => {
		const mesh = new Mesh(new PlaneGeometry(18 * s, 18 * s), flareMat.clone());
		mesh.material.opacity = .28 - i * .06;
		mesh.visible = false;
		scene.add(mesh);
		return mesh;
	});
	const starPositions = [];
	const starColors = [];
	for (let i = 0; i < 160; i++) {
		const az = i * 2.399 % (Math.PI * 2);
		const el = .18 + i * 47 % 100 / 100 * 1.15;
		const r = 330;
		starPositions.push(Math.cos(el) * Math.sin(az) * r, Math.sin(el) * r, Math.cos(el) * Math.cos(az) * r);
		const tint = i % 5 === 0 ? [
			1,
			.82,
			.45
		] : i % 4 === 0 ? [
			.75,
			.85,
			1
		] : [
			1,
			.98,
			.92
		];
		starColors.push(tint[0], tint[1], tint[2]);
	}
	const starGeo = new BufferGeometry();
	starGeo.setAttribute("position", new Float32BufferAttribute(starPositions, 3));
	starGeo.setAttribute("color", new Float32BufferAttribute(starColors, 3));
	const stars = new Points(starGeo, new PointsMaterial({
		size: 4.2,
		vertexColors: true,
		fog: false,
		sizeAttenuation: false,
		transparent: true,
		opacity: 0
	}));
	scene.add(stars);
	const meteor = new Mesh(new CylinderGeometry(.12, .55, 16, 5), new MeshBasicMaterial({
		color: 16773577,
		fog: false,
		transparent: true,
		opacity: .9
	}));
	meteor.visible = false;
	scene.add(meteor);
	const clouds = new Group();
	for (let i = 0; i < 10; i++) {
		const puff = new Mesh(new SphereGeometry(5 + i % 3 * 1.4, 10, 8), new MeshBasicMaterial({
			color: i % 2 ? 16776696 : 16054271,
			fog: false
		}));
		puff.position.set(-70 + i % 5 * 32, 28 + i % 3 * 3, -40 + Math.floor(i / 5) * 36);
		puff.scale.set(1.8, .42, 1.1);
		clouds.add(puff);
	}
	scene.add(clouds);
	const groundGeo = new PlaneGeometry(240, 240, 60, 60);
	groundGeo.rotateX(-Math.PI / 2);
	const gPos = groundGeo.attributes.position;
	const gCol = new Float32Array(gPos.count * 3);
	const tint = new Color();
	for (let i = 0; i < gPos.count; i++) {
		const x = gPos.getX(i);
		const z = gPos.getZ(i);
		const center = Math.hypot(x, z);
		tint.setHex(5156404);
		if (center > 16) tint.lerp(new Color(13803866), Math.min(1, (center - 16) / 28));
		if (z < -40) tint.lerp(new Color(15913594), Math.min(1, (-40 - z) / 22));
		if (Math.hypot(x + 38, z + 62) < 28) tint.lerp(new Color(16052712), .92);
		if (Math.hypot(x - 76, z - 44) < 34) tint.lerp(new Color(14039618), .88);
		if (Math.hypot(x + 76, z - 44) < 34) tint.lerp(new Color(1450035), .9);
		const river = Math.abs(z - (8 + Math.sin(x * .045) * 7));
		if (river < 8) tint.lerp(new Color(1349828), 1 - river / 8);
		gCol[i * 3] = tint.r;
		gCol[i * 3 + 1] = tint.g;
		gCol[i * 3 + 2] = tint.b;
	}
	groundGeo.setAttribute("color", new BufferAttribute(gCol, 3));
	const ground = new Mesh(groundGeo, new MeshLambertMaterial({
		vertexColors: true,
		map: skins.grit
	}));
	ground.receiveShadow = true;
	ground.visible = true;
	scene.add(ground);
	const waterPts = [];
	const waterIdx = [];
	const waterUv = [];
	const steps = 48;
	for (let i = 0; i <= steps; i++) {
		const x = -102 + i / steps * 204;
		const z = 8 + Math.sin(x * .045) * 7;
		waterPts.push(x, .32, z - 6.2, x, .32, z + 6.2);
		waterUv.push(i / 6, 0, i / 6, 1);
		if (i < steps) {
			const a = i * 2;
			waterIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
		}
	}
	const waterGeo = new BufferGeometry();
	waterGeo.setAttribute("position", new Float32BufferAttribute(waterPts, 3));
	waterGeo.setAttribute("uv", new Float32BufferAttribute(waterUv, 2));
	waterGeo.setIndex(waterIdx);
	waterGeo.computeVertexNormals();
	const water = new Mesh(waterGeo, new MeshPhongMaterial({
		color: 4114175,
		map: skins.caustic,
		transparent: true,
		opacity: .72,
		shininess: 90,
		specular: 16777215,
		side: 2
	}));
	scene.add(water);
	const boxGeo = new BoxGeometry(1, 1, 1);
	const stoneMat = new MeshLambertMaterial({
		color: 16777215,
		map: skins.stone
	});
	tileInstances(stoneMat, .42);
	const staticBoxes = new InstancedMesh(boxGeo, stoneMat, world.solids.length);
	staticBoxes.instanceColor = new InstancedBufferAttribute(new Float32Array(world.solids.length * 3), 3);
	staticBoxes.frustumCulled = false;
	staticBoxes.castShadow = false;
	staticBoxes.receiveShadow = false;
	world.solids.forEach((s, i) => {
		if (s.bounce === 13) mat.compose(pos.set(0, -100, 0), quat.identity(), scl.set(.001, .001, .001));
		else {
			const w = s.maxX - s.minX;
			const h = s.maxY - s.minY;
			const d = s.maxZ - s.minZ;
			mat.compose(pos.set((s.minX + s.maxX) / 2, (s.minY + s.maxY) / 2, (s.minZ + s.maxZ) / 2), quat.identity(), scl.set(w, h, d));
		}
		staticBoxes.setMatrixAt(i, mat);
		col.setHex(s.color);
		staticBoxes.setColorAt(i, col);
	});
	scene.add(staticBoxes);
	const dynMat = stoneMat.clone();
	tileInstances(dynMat, .42);
	const dynMesh = new InstancedMesh(boxGeo, dynMat, 80);
	dynMesh.instanceColor = new InstancedBufferAttribute(/* @__PURE__ */ new Float32Array(240), 3);
	dynMesh.frustumCulled = false;
	dynMesh.count = 0;
	scene.add(dynMesh);
	function tileInstances(mat, density) {
		mat.onBeforeCompile = (shader) => {
			shader.vertexShader = shader.vertexShader.replace("#include <uv_vertex>", `#include <uv_vertex>
#ifdef USE_INSTANCING
  vMapUv *= vec2(max(length(instanceMatrix[0].xyz), 0.2), max(length(instanceMatrix[1].xyz), 0.2)) * ${density.toFixed(3)};
#endif`);
		};
	}
	function makeParts(geo, n, map) {
		const m = new InstancedMesh(geo, new MeshLambertMaterial({
			color: 16777215,
			map: map || null
		}), n);
		m.instanceColor = new InstancedBufferAttribute(new Float32Array(n * 3), 3);
		m.frustumCulled = false;
		m.count = 0;
		scene.add(m);
		return m;
	}
	const headM = makeParts(new SphereGeometry(.5, 12, 10), MAX, skins.skin);
	const bodyM = makeParts(boxGeo, MAX, skins.cloth);
	const hairM = makeParts(boxGeo, MAX, skins.hair);
	const handM = makeParts(new SphereGeometry(.5, 8, 6), MAX, skins.skin);
	const handRM = makeParts(new SphereGeometry(.5, 8, 6), MAX, skins.skin);
	const footM = makeParts(boxGeo, MAX, skins.cloth);
	const footRM = makeParts(boxGeo, MAX, skins.cloth);
	const haloM = makeParts(new TorusGeometry(.42, .05, 6, 12), MAX, skins.metal);
	const blobM = makeParts(new CircleGeometry(.7, 12), MAX);
	const hairBackM = makeParts(boxGeo, MAX, skins.hair);
	const hairLM = makeParts(new SphereGeometry(.5, 8, 6), MAX, skins.hair);
	const hairRM = makeParts(new SphereGeometry(.5, 8, 6), MAX, skins.hair);
	const skirtM = makeParts(boxGeo, MAX, skins.cloth);
	const wingLM = makeParts(boxGeo, MAX, skins.feather);
	const wingRM = makeParts(boxGeo, MAX, skins.feather);
	const packM = makeParts(boxGeo, MAX, skins.metal);
	const gunM = makeParts(boxGeo, MAX, skins.metal);
	const ZMAX = 48;
	const zBody = makeParts(boxGeo, ZMAX, skins.zombieRag);
	const zHump = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zHead = makeParts(new SphereGeometry(.5, 12, 10), ZMAX, skins.zombieSkin);
	const zJaw = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zArmL = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zArmR = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zHandL = makeParts(new SphereGeometry(.5, 8, 6), ZMAX, skins.zombieSkin);
	const zHandR = makeParts(new SphereGeometry(.5, 8, 6), ZMAX, skins.zombieSkin);
	const zLegL = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zLegR = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zForeL = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zForeR = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zShinL = makeParts(boxGeo, ZMAX, skins.bone);
	const zShinR = makeParts(boxGeo, ZMAX, skins.bone);
	const zFootL = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zFootR = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zClawL = makeParts(boxGeo, ZMAX, skins.bone);
	const zClawR = makeParts(boxGeo, ZMAX, skins.bone);
	const zClawL2 = makeParts(boxGeo, ZMAX, skins.bone);
	const zClawR2 = makeParts(boxGeo, ZMAX, skins.bone);
	const zClawL3 = makeParts(boxGeo, ZMAX, skins.bone);
	const zClawR3 = makeParts(boxGeo, ZMAX, skins.bone);
	const zNeck = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zBrow = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zEarL = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zEarR = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zRib = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zSpike = makeParts(boxGeo, ZMAX, skins.bone);
	const zBump = makeParts(boxGeo, ZMAX, skins.bone);
	const zShoulderL = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zShoulderR = makeParts(boxGeo, ZMAX, skins.zombieSkin);
	const zRagL = makeParts(boxGeo, ZMAX, skins.zombieRag);
	const zRagR = makeParts(boxGeo, ZMAX, skins.zombieRag);
	const zBand = makeParts(boxGeo, ZMAX);
	const zEye = new InstancedMesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
		map: skins.eyes,
		transparent: true,
		depthWrite: false
	}), ZMAX);
	zEye.frustumCulled = false;
	zEye.count = 0;
	scene.add(zEye);
	const zFace = new InstancedMesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
		map: skins.mutantFace,
		alphaTest: .4,
		side: 0
	}), ZMAX);
	zFace.frustumCulled = false;
	zFace.count = 0;
	scene.add(zFace);
	const faceTex = (() => {
		const c = document.createElement("canvas");
		c.width = 128;
		c.height = 128;
		const g = c.getContext("2d");
		g.clearRect(0, 0, 128, 128);
		g.fillStyle = "#ffe4cf";
		g.beginPath();
		g.ellipse(64, 66, 50, 56, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "rgba(255, 118, 146, 0.45)";
		g.beginPath();
		g.ellipse(28, 82, 14, 8, 0, 0, Math.PI * 2);
		g.fill();
		g.beginPath();
		g.ellipse(100, 82, 14, 8, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#1c140e";
		g.beginPath();
		g.ellipse(40, 60, 8, 11, 0, 0, Math.PI * 2);
		g.ellipse(88, 60, 8, 11, 0, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#fffaf4";
		g.beginPath();
		g.arc(43, 56, 3, 0, Math.PI * 2);
		g.arc(91, 56, 3, 0, Math.PI * 2);
		g.fill();
		g.strokeStyle = "#1c140e";
		g.lineWidth = 4;
		g.lineCap = "round";
		g.beginPath();
		g.arc(64, 84, 16, .2, Math.PI - .2);
		g.stroke();
		const t = new CanvasTexture(c);
		t.colorSpace = SRGBColorSpace;
		return t;
	})();
	const faceM = new InstancedMesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
		map: faceTex,
		transparent: true,
		depthWrite: false,
		side: 2
	}), MAX);
	faceM.frustumCulled = false;
	faceM.count = 0;
	scene.add(faceM);
	blobM.material.transparent = true;
	blobM.material.opacity = .35;
	blobM.material.depthWrite = false;
	const ballM = makeParts(new SphereGeometry(.28, 10, 8), 40, skins.metal);
	const carPools = teslaGeometries().map((geo) => {
		const mesh = new InstancedMesh(geo, new MeshLambertMaterial({ vertexColors: true }), 8);
		mesh.frustumCulled = false;
		mesh.count = 0;
		scene.add(mesh);
		return mesh;
	});
	const pilots = createFigures(scene, MAX, false);
	const mutants = createFigures(scene, 48, true);
	let frameDt = .016;
	const droneM = makeParts(new BoxGeometry(.7, .22, .7), 16, skins.metal);
	const smileTex = (() => {
		const c = document.createElement("canvas");
		c.width = 64;
		c.height = 64;
		const g = c.getContext("2d");
		g.fillStyle = "#ffe14a";
		g.beginPath();
		g.arc(32, 32, 30, 0, Math.PI * 2);
		g.fill();
		g.fillStyle = "#1a2208";
		g.beginPath();
		g.arc(22, 26, 4, 0, Math.PI * 2);
		g.arc(42, 26, 4, 0, Math.PI * 2);
		g.fill();
		g.strokeStyle = "#1a2208";
		g.lineWidth = 3;
		g.beginPath();
		g.arc(32, 34, 12, .2, Math.PI - .2);
		g.stroke();
		const t = new CanvasTexture(c);
		t.colorSpace = SRGBColorSpace;
		return t;
	})();
	const smileM = new InstancedMesh(new SphereGeometry(.35, 10, 8), new MeshBasicMaterial({ map: smileTex }), 28);
	smileM.frustumCulled = false;
	smileM.count = 0;
	scene.add(smileM);
	const flowerM = makeParts(new ConeGeometry(.18, .45, 5), world.flowers.length, skins.petal);
	world.flowers.forEach((f, i) => {
		mat.compose(pos.set(f.x, .22, f.z), quat.identity(), scl.set(1, 1, 1));
		flowerM.setMatrixAt(i, mat);
		col.setHex(f.c);
		flowerM.setColorAt(i, col);
	});
	flowerM.count = world.flowers.length;
	const rockM = makeParts(new DodecahedronGeometry(.45, 0), world.rocks.length, skins.rock);
	world.rocks.forEach((r, i) => {
		eul.set(r.s, r.x, 0);
		quat.setFromEuler(eul);
		mat.compose(pos.set(r.x, r.s * .3, r.z), quat, scl.set(r.s, r.s * .7, r.s));
		rockM.setMatrixAt(i, mat);
		col.setHex(r.c);
		rockM.setColorAt(i, col);
	});
	rockM.count = world.rocks.length;
	const grassM = makeParts(new ConeGeometry(.12, .55, 4), world.grass.length, skins.blade);
	world.grass.forEach((g, i) => {
		mat.compose(pos.set(g.x, .25, g.z), quat.identity(), scl.set(g.s, g.s, g.s));
		grassM.setMatrixAt(i, mat);
		col.setHex(g.c);
		grassM.setColorAt(i, col);
	});
	grassM.count = world.grass.length;
	const trunkM = makeParts(new CylinderGeometry(.22, .32, 4.4, 6), Math.max(1, world.palms.length), skins.wood);
	const crownM = makeParts(new ConeGeometry(1.7, 2.1, 7), Math.max(1, world.palms.length), skins.leaf);
	world.palms.forEach((p, i) => {
		mat.compose(pos.set(p.x, 2.2 * p.s, p.z), quat.identity(), scl.set(p.s, p.s, p.s));
		trunkM.setMatrixAt(i, mat);
		col.setHex(9067058);
		trunkM.setColorAt(i, col);
		mat.compose(pos.set(p.x, 4.5 * p.s, p.z), quat.identity(), scl.set(p.s, p.s, p.s));
		crownM.setMatrixAt(i, mat);
		col.setHex(3120714);
		crownM.setColorAt(i, col);
	});
	trunkM.count = world.palms.length;
	crownM.count = world.palms.length;
	const canColors = [
		13034330,
		16734824,
		4114175
	];
	const canNames = [
		"MOUNT",
		"RED",
		"VOLT"
	];
	for (const c of world.cans) {
		const cvs = document.createElement("canvas");
		cvs.width = 128;
		cvs.height = 128;
		const g = cvs.getContext("2d");
		g.fillStyle = `#${canColors[c.kind].toString(16).padStart(6, "0")}`;
		g.fillRect(0, 0, 128, 128);
		g.fillStyle = "#1a2208";
		g.font = "700 26px sans-serif";
		g.textAlign = "center";
		g.fillText(canNames[c.kind] || "DEW", 64, 58);
		g.fillText("DEW", 64, 92);
		const tex = new CanvasTexture(cvs);
		tex.colorSpace = SRGBColorSpace;
		const mesh = new Mesh(new CylinderGeometry(1.05, 1.05, 3.6, 16), new MeshLambertMaterial({ map: tex }));
		mesh.position.set(c.x, c.y, c.z);
		scene.add(mesh);
	}
	const ringMat = new MeshBasicMaterial({
		color: 14155626,
		transparent: true,
		opacity: .22,
		depthWrite: false
	});
	const windMat = new LineBasicMaterial({
		color: 16056312,
		transparent: true,
		opacity: .45
	});
	const windLines = [];
	world.streams.forEach((stream, si) => {
		for (let k = 0; k < 5; k++) {
			const geo = new BufferGeometry();
			geo.setAttribute("position", new BufferAttribute(/* @__PURE__ */ new Float32Array(18), 3));
			const line = new Line(geo, windMat);
			scene.add(line);
			windLines.push({
				line,
				stream: si,
				t: k / 5
			});
		}
	});
	for (const s of world.streams) for (const p of s.pts) {
		const ring = new Mesh(new TorusGeometry(1.35, .07, 8, 18), ringMat);
		ring.position.set(p.x, p.y, p.z);
		ring.lookAt(p.x + .2, p.y + .2, p.z + 1);
		scene.add(ring);
	}
	const rail = new Mesh(new TorusGeometry(world.trainR, .22, 8, 64), new MeshLambertMaterial({
		color: 7169116,
		map: skins.metal
	}));
	rail.rotation.x = Math.PI / 2;
	rail.position.y = world.trainY;
	scene.add(rail);
	const train = new Group();
	const trainMat = new MeshLambertMaterial({
		color: 13034330,
		map: skins.metal
	});
	for (let i = 0; i < 3; i++) {
		const car = new Mesh(new BoxGeometry(3.4, 2.1, 1.7), i === 0 ? trainMat : new MeshLambertMaterial({
			color: 16052708,
			map: skins.metal
		}));
		car.position.z = -i * 3.8;
		train.add(car);
	}
	const stack = new Mesh(new CylinderGeometry(.18, .22, .8, 8), new MeshLambertMaterial({
		color: 8947848,
		map: skins.metal
	}));
	stack.position.set(0, 1.4, .4);
	train.add(stack);
	scene.add(train);
	const flagMeshes = [];
	for (const f of flags) {
		const pole = new Mesh(new CylinderGeometry(.08, .08, 2.2, 6), new MeshLambertMaterial({
			color: 16052708,
			map: skins.wood
		}));
		scene.add(pole);
		const cloth = new Mesh(new BoxGeometry(1.1, .7, .08), new MeshLambertMaterial({
			color: TEAMS[f.team].hex,
			map: skins.cloth
		}));
		scene.add(cloth);
		flagMeshes.push(pole, cloth);
	}
	const medRing = makeParts(new TorusGeometry(.85, .06, 6, 16), 30);
	const medBox = makeParts(new OctahedronGeometry(.35, 0), 30, skins.metal);
	world.meds.forEach((m, i) => {
		eul.set(Math.PI / 2, 0, 0);
		quat.setFromEuler(eul);
		mat.compose(pos.set(m.x, m.y + .05, m.z), quat, scl.set(1, 1, 1));
		medRing.setMatrixAt(i, mat);
		col.setHex(16773800);
		medRing.setColorAt(i, col);
	});
	medRing.count = world.meds.length;
	const medState = world.meds.map(() => 0);
	buildLogo(scene);
	const tPos = /* @__PURE__ */ new Float32Array(480);
	const tCol = /* @__PURE__ */ new Float32Array(480);
	const tGeo = new BufferGeometry();
	tGeo.setAttribute("position", new BufferAttribute(tPos, 3));
	tGeo.setAttribute("color", new BufferAttribute(tCol, 3));
	const tLines = new LineSegments(tGeo, new LineBasicMaterial({
		vertexColors: true,
		transparent: true,
		blending: 2
	}));
	scene.add(tLines);
	const pPos = /* @__PURE__ */ new Float32Array(1200);
	const pCol = /* @__PURE__ */ new Float32Array(1200);
	const pGeo = new BufferGeometry();
	pGeo.setAttribute("position", new BufferAttribute(pPos, 3));
	pGeo.setAttribute("color", new BufferAttribute(pCol, 3));
	const pMat = new PointsMaterial({
		size: .28,
		vertexColors: true,
		transparent: true,
		depthWrite: false,
		blending: 2
	});
	const points = new Points(pGeo, pMat);
	points.frustumCulled = false;
	scene.add(points);
	const viewScene = new Scene();
	const viewCam = new PerspectiveCamera(74, 1, .05, 12);
	const gun = new Group();
	viewCam.add(gun);
	viewScene.add(viewCam);
	let gunId = "";
	let gunKick = 0;
	let wheelShown = 0;
	const timer = new Timer();
	timer.connect(document);
	let acc = 0;
	let running = true;
	function line(text, big = false) {
		log.push({ text: `${clockLabel()}  ${text}` });
		if (log.length > 80) log.shift();
		feed.push({
			id: fid++,
			text,
			at: performance.now()
		});
		if (feed.length > 12) feed.shift();
		if (big) {
			bannerQ.push(text);
			audio.announce(text);
		}
	}
	function pumpBanner() {
		const now = performance.now();
		if (banner && now - bannerAt < 2800) return;
		const next = bannerQ.shift();
		banner = next || "";
		if (next) bannerAt = now;
	}
	function globalCall(text) {
		line(text, true);
		sendRelayAnnounce(text);
	}
	function streakTitle(spree, life, charId = "") {
		if (charId === "donnie") {
			if (life === 20) return "DONALD TRUMP IS GODMODE!";
			if (life === 10) return "Double penta-kill";
			if (spree >= 5) return "Penta-kill";
			if (spree === 4) return "Quadruple Winner!";
			if (spree === 3) return "Triple Winner!";
			if (spree === 2) return "Double Winner!";
			return "";
		}
		if (life === 20) return "GODMODE";
		if (life === 10) return "DOUBLE PENTA-KILL";
		if (spree >= 5) return "PENTA-KILL";
		if (spree === 4) return "QUADRUPLE KILL";
		if (spree === 3) return "TRIPLE KILL";
		if (spree === 2) return "DOUBLE KILL";
		return "";
	}
	function clockParts() {
		const elapsed = performance.now() / 1e3 - clock0;
		const days = Math.floor(elapsed / DAY);
		const hoursF = (elapsed - days * DAY) / DAY * 24;
		const hours = Math.floor(hoursF);
		const mins = Math.floor((hoursF - hours) * 60);
		const date = new Date(Date.UTC(2026, 2, 20 + days));
		const month = date.getUTCMonth();
		return {
			hoursF,
			hours,
			mins,
			date,
			season: month < 2 || month === 11 ? "Winter" : month < 5 ? "Spring" : month < 8 ? "Summer" : "Autumn",
			days
		};
	}
	function clockLabel() {
		const c = clockParts();
		return `${String(c.hours).padStart(2, "0")}:${String(c.mins).padStart(2, "0")}`;
	}
	function say(a, key) {
		if (key !== "die" && a.voiceCd > 0) return;
		a.voiceCd = key === "die" ? .4 : a === player ? .45 : a.minion ? 1.35 : 1.6;
		a.speech = spokenLine(a.charId, key);
		a.speechT = key === "die" ? 1.4 : 1.35;
		if (a.moodT < .25) {
			a.mood = key === "die" || key === "down" ? "cry" : "talk";
			a.moodT = a.speechT;
		}
		const ch = CHAR_BY_ID[a.charId];
		audio.voiceAt(a.x, a.y + 1.2, a.z, ch?.voice || 440, key, a.speech, a === player, a.charId);
	}
	function lookOf(ch) {
		const base = {
			petite: 1,
			bangs: [
				.4,
				.16,
				.3
			],
			hair: [
				.36,
				.42,
				.26,
				.08
			],
			puff: .001,
			puffY: .05,
			puffX: .4,
			skirt: .55,
			skirtColor: 0,
			wings: 0,
			wingColor: 16775922,
			pack: 0,
			packColor: 3818576
		};
		if (ch.ability === "elbow") return {
			...base,
			petite: 1.18,
			hair: [
				.22,
				.12,
				.22,
				.02
			],
			skirt: .001,
			puff: .2
		};
		if (ch.ability === "spotlight") return {
			...base,
			petite: .94,
			hair: [
				.4,
				1.2,
				.28,
				-.12
			],
			skirt: .9,
			skirtColor: 14070366
		};
		if (ch.ability === "loud") return {
			...base,
			petite: .97,
			hair: [
				.26,
				.78,
				.16,
				.22
			],
			skirt: .75,
			skirtColor: 15119141
		};
		if (ch.ability === "glide") return {
			...base,
			petite: .86,
			bangs: [
				.46,
				.18,
				.3
			],
			hair: [
				.36,
				1.05,
				.12,
				-.18
			],
			skirt: 1,
			skirtColor: 16774084,
			wings: 1,
			wingColor: 16775926
		};
		if (ch.ability === "aura") return {
			...base,
			petite: .92,
			bangs: [
				.46,
				.18,
				.32
			],
			hair: [
				.34,
				.55,
				.28,
				.05
			],
			puff: .72,
			puffY: .12,
			puffX: .46,
			skirt: 1,
			skirtColor: 16748232
		};
		if (ch.ability === "shadow") return {
			...base,
			petite: .84,
			bangs: [
				.44,
				.28,
				.24
			],
			hair: [
				.4,
				1.35,
				.1,
				-.34
			],
			skirt: .95,
			skirtColor: 1708068,
			wings: 0
		};
		if (ch.ability === "bestie") return {
			...base,
			petite: .9,
			bangs: [
				.4,
				.16,
				.3
			],
			hair: [
				.22,
				.28,
				.2,
				.16
			],
			puff: .48,
			puffY: .46,
			puffX: .38,
			skirt: 1,
			skirtColor: 16739226
		};
		if (ch.style === "round") return {
			...base,
			petite: 1.08,
			bangs: [
				.22,
				.12,
				.2
			],
			hair: [
				.2,
				.18,
				.2,
				.32
			],
			skirt: .001,
			puff: .22
		};
		if (ch.style === "bird" || ch.ability === "bird") return {
			...base,
			hair: [
				.16,
				.34,
				.16,
				.42
			],
			wings: .72,
			wingColor: 16769162,
			skirt: .35,
			skirtColor: 16774890
		};
		if (ch.style === "goth") return {
			...base,
			petite: .9,
			bangs: [
				.46,
				.28,
				.26
			],
			hair: [
				.48,
				1.2,
				.18,
				-.32
			],
			skirt: .8,
			skirtColor: ch.cloth
		};
		if (ch.ability === "jet") return {
			...base,
			pack: 1,
			packColor: 6127272,
			skirt: .4
		};
		if (ch.ability === "sheep") return {
			...base,
			skirt: .001,
			puff: .28,
			puffY: .35,
			hair: [
				.16,
				.16,
				.16,
				.4
			]
		};
		return base;
	}
	function nearby(x, z, rad) {
		const out = [];
		for (const id of querySolidIds(world, x, z, rad)) out.push(world.solids[id]);
		for (const d of dyn) {
			if (!d.alive) continue;
			if (x + rad < d.minX || x - rad > d.maxX || z + rad < d.minZ || z - rad > d.maxZ) continue;
			out.push(d);
		}
		return out;
	}
	function rayAll(ox, oy, oz, dx, dy, dz, maxT) {
		let best = raySolids(world, ox, oy, oz, dx, dy, dz, maxT);
		for (const d of dyn) {
			if (!d.alive) continue;
			const hit = rayAABB(ox, oy, oz, dx, dy, dz, d, maxT);
			if (hit && (!best || hit.t < best.t)) best = hit;
		}
		return best;
	}
	function probeWall(a) {
		let best = null;
		let bestT = .9;
		for (let i = 0; i < 8; i++) {
			const ang = i / 8 * Math.PI * 2;
			const dx = Math.cos(ang);
			const dz = Math.sin(ang);
			const hit = rayAll(a.x, a.y + .95, a.z, dx, 0, dz, .9);
			if (!hit || hit.ground || Math.abs(hit.ny) > .4) continue;
			const box = hit.box;
			if (box && (box.oneway || box.bounce > 0 || box.turbo > 0)) continue;
			if (!(box ? box.maxY - box.minY > 1.7 || box.climb : false)) continue;
			if (hit.t < bestT) {
				bestT = hit.t;
				best = {
					nx: hit.nx,
					nz: hit.nz,
					x: hit.x,
					z: hit.z,
					top: box ? box.maxY : a.y + 2
				};
			}
		}
		return best;
	}
	function streamAt(a) {
		let on = false;
		for (const s of world.streams) for (let i = 0; i < s.pts.length - 1; i++) {
			const p = s.pts[i];
			const q = s.pts[i + 1];
			const abx = q.x - p.x;
			const aby = q.y - p.y;
			const abz = q.z - p.z;
			const apx = a.x - p.x;
			const apy = a.y - p.y;
			const apz = a.z - p.z;
			const ab2 = abx * abx + aby * aby + abz * abz || 1;
			let t = (apx * abx + apy * aby + apz * abz) / ab2;
			t = clamp(t, 0, 1);
			const cx = p.x + abx * t;
			const cy = p.y + aby * t;
			const cz = p.z + abz * t;
			if (Math.hypot(a.x - cx, a.y - cy, a.z - cz) < s.r) {
				const len = Math.hypot(abx, aby, abz) || 1;
				a.vx += abx / len * 18 * .016;
				a.vz += abz / len * 18 * .016;
				a.vy += .192;
				a.vy = Math.min(a.vy, 9);
				on = true;
			}
		}
		return on;
	}
	function trainPose(ang) {
		const c = Math.cos(ang);
		const s = Math.sin(ang);
		return {
			x: c * world.trainR,
			y: world.trainY,
			z: s * world.trainR,
			rx: c,
			rz: s,
			tx: -s,
			tz: c
		};
	}
	function emote(a, mood, seconds, look) {
		a.mood = mood;
		a.moodT = seconds;
		const at = look || player;
		if (at && at !== a) {
			a.lookX = at.x;
			a.lookZ = at.z;
		} else {
			a.lookX = a.x - Math.sin(a.yaw) * 6;
			a.lookZ = a.z - Math.cos(a.yaw) * 6;
		}
		if (mood === "angry") a.veins = a.hp < 45 ? 4 : 3;
	}
	function hurt(a, dmg, src, head) {
		if (a.state !== "live" || a.invuln > 0) return;
		if (qa && a === player) return;
		if (src && src.team === a.team) return;
		const ch = src ? CHAR_BY_ID[src.charId] : void 0;
		const lvl = src ? xpToLevel(src.xp).lvl : 1;
		const bonus = 1 + Math.min(.15, lvl * .004);
		a.hp -= dmg * bonus * (src?.minion ? .45 : 1) * (ch?.ability === "necro" && src?.minion ? 1.4 : 1);
		a.flash = .15;
		if (a.hp > 0) emote(a, "angry", 1.35, src);
		if (a === player) shake = Math.min(.4, shake + .12);
		if (a.hp <= 0) {
			a.hp = 0;
			a.state = "down";
			a.downT = 0;
			a.fall = 0;
			a.helpT = .2;
			a.vy = Math.max(a.vy, 5.5);
			if (src) {
				const dx = a.x - src.x;
				const dz = a.z - src.z;
				const len = Math.hypot(dx, dz) || 1;
				a.vx += dx / len * 5;
				a.vz += dz / len * 5;
			}
			if (a === player) shake = Math.min(.7, shake + .35);
			a.deaths += 1;
			a.lifeStreak = 0;
			a.spree = 0;
			a.riding = false;
			a.sheep = 0;
			a.hover = false;
			if (a.flag >= 0) dropFlag(a);
			if (src && src.state === "live") {
				src.kills += 1;
				const gain = head ? 75 : 50;
				src.xp += gain;
				src.pendingXp += gain;
				src.pendingK += 1;
				const nowMs = performance.now();
				if (nowMs - src.spreeAt > 4500) src.spree = 0;
				src.spree += 1;
				src.spreeAt = nowMs;
				src.lifeStreak += 1;
				if (head && src === player) audio.ding();
				if (src === player) gunKick = 1;
			}
			if (a === player) a.pendingD += 1;
			const who = src ? src.name : "the field";
			const killLine = `${head ? "HEADSHOT " : "KILL "}${who} dropped ${a.name}`;
			const shout = !!src && !src.bot || !a.bot;
			line(killLine, shout);
			if (shout) sendRelayAnnounce(killLine);
			if (src) {
				const title = streakTitle(src.spree, src.lifeStreak, src.charId);
				if (title && shout) {
					line(title, true);
					sendRelayAnnounce(title);
				}
				if (src.charId === "donnie") say(src, "You're fired!");
			}
			say(a, "die");
			emote(a, "cry", 1.8, src);
			if (src) emote(src, "wave", 1.5, a);
			for (let i = 0; i < 8; i++) burst(a.x, a.y + 1, a.z, 16765562, 4);
		}
	}
	function dropFlag(a) {
		const f = flags.find((fl) => fl.team === a.flag);
		if (!f) {
			a.flag = -1;
			return;
		}
		f.carrier = -1;
		f.home = false;
		f.x = a.x;
		f.y = a.y + .4;
		f.z = a.z;
		f.drop = 0;
		a.flag = -1;
	}
	function burst(x, y, z, color, n) {
		for (let i = 0; i < n; i++) {
			parts.push({
				x,
				y,
				z,
				vx: (Math.random() - .5) * 6,
				vy: Math.random() * 5,
				vz: (Math.random() - .5) * 6,
				life: .4 + Math.random() * .4,
				max: .8,
				color
			});
			if (parts.length > 380) parts.shift();
		}
	}
	function explode(x, y, z, radius, dmg, owner, self = 1) {
		audio.boomAt(x, y, z);
		burst(x, y, z, 16773828, 16);
		for (const a of actors) {
			if (a.state !== "live") continue;
			const dx = a.x - x;
			const dy = a.y + .8 - y;
			const dz = a.z - z;
			const dist = Math.hypot(dx, dy, dz);
			if (dist > radius || dist < .001) continue;
			const fall = 1 - dist / radius;
			const src = actors.find((o) => o.id === owner) || null;
			const isSelf = a.id === owner;
			hurt(a, dmg * fall * (isSelf ? .22 * self : 1), src, false);
			const push = (isSelf ? 20 : 12) * fall;
			a.vx += dx / dist * push;
			a.vz += dz / dist * push;
			a.vy += push * .9 + (isSelf ? 7 : 2);
			a.grounded = false;
			a.riding = false;
		}
	}
	function loadout(char) {
		const list = [...char.weapons];
		if (!list.includes("melee") && !list.includes("knife")) list.push("melee");
		return list.slice(0, 4);
	}
	function makeActor(partial) {
		const ch = CHAR_BY_ID[partial.charId] || CHARACTERS[0];
		return {
			id: partial.id ?? nextId++,
			name: partial.name,
			team: partial.team,
			charId: ch.id,
			bot: partial.bot ?? false,
			remote: partial.remote ?? false,
			minion: partial.minion ?? false,
			kind: partial.kind ?? ch.ability,
			x: partial.x ?? 0,
			y: partial.y ?? 0,
			z: partial.z ?? 0,
			vx: 0,
			vy: 0,
			vz: 0,
			tx: partial.x ?? 0,
			ty: partial.y ?? 0,
			tz: partial.z ?? 0,
			yaw: partial.yaw ?? 0,
			tyaw: partial.yaw ?? 0,
			hp: partial.hp ?? (partial.minion ? 70 : 100),
			state: "live",
			jumps: 0,
			grounded: false,
			climb: false,
			roll: 0,
			dashCd: 0,
			lunge: 0,
			weapon: 0,
			cd: 0,
			kills: 0,
			deaths: 0,
			xp: partial.xp ?? 0,
			flag: -1,
			downT: 0,
			flash: 0,
			anim: Math.random() * 6,
			bunny: 1,
			sinceLand: 1,
			fuel: 1,
			sheep: 0,
			puff: 0,
			inhale: 0,
			hover: false,
			aura: 0,
			shade: 0,
			helpT: 2,
			speech: "",
			speechT: 0,
			invuln: partial.invuln ?? 0,
			goalX: partial.x ?? 0,
			goalY: 0,
			goalZ: partial.z ?? 0,
			think: Math.random(),
			stuck: 0,
			riding: false,
			inWater: false,
			wasWater: false,
			wasGround: false,
			flame: 0,
			slow: 0,
			burst: 0,
			pendingXp: 0,
			pendingK: 0,
			pendingD: 0,
			pendingC: 0,
			build: 0,
			teleCd: 0,
			revive: 0,
			voiceCd: 0,
			abilityCd: 0,
			flat: 0,
			spree: 0,
			spreeAt: 0,
			lifeStreak: 0,
			fall: 1,
			mood: "",
			moodT: 0,
			wet: 0,
			lookX: 0,
			lookZ: 0,
			heatSick: false,
			veins: 0
		};
	}
	function spawnBots() {
		let n = 0;
		for (let t = 0; t < 3; t++) for (let k = 0; k < 12; k++) {
			const spots = world.spawns.filter((s) => s.team === t);
			const s = spots[k % spots.length];
			const ch = CHARACTERS[n % CHARACTERS.length];
			const a = makeActor({
				name: BOT_NAMES[n % BOT_NAMES.length],
				team: t,
				charId: ch.id,
				bot: true,
				x: s.x + (k - 1.5) * .4,
				y: s.y,
				z: s.z,
				yaw: s.yaw,
				xp: 30 + n * 28
			});
			actors.push(a);
			n++;
		}
	}
	spawnBots();
	spawnMutants();
	function spawnMutants() {
		const kinds = [
			"voodoo",
			"mummy",
			"necro"
		];
		const names = [
			"Mutant",
			"Wrapmutant",
			"Bonemutant"
		];
		for (let t = 0; t < 3; t++) {
			const s = world.spawns.filter((s) => s.team === t)[0] || world.spawns[0];
			actors.push(makeActor({
				name: names[t],
				team: t,
				charId: t === 0 ? "pin" : t === 1 ? "wrap" : "bone",
				bot: true,
				minion: true,
				kind: kinds[t],
				x: s.x + 3.2,
				y: s.y,
				z: s.z + 1.4,
				hp: t === 1 ? 90 : 70,
				xp: 12
			}));
		}
	}
	function held(code) {
		return keys.has(code) || (qaKeys?.includes(code) ?? false);
	}
	function charOf(a) {
		return CHAR_BY_ID[a.charId] || CHARACTERS[0];
	}
	function speedOf(a) {
		let s = a.minion ? 2.7 : 8.5;
		if (a.slow > 0) s *= .55;
		if (a.inWater) s *= .64;
		if (heatLeft > 0 && a.heatSick) s *= .5;
		if (charOf(a).ability === "bunny") s *= a.bunny;
		if (boost && a.team === hillOwner) s *= 1.2;
		for (const o of actors) {
			if (o === a || o.state !== "live" || o.team !== a.team) continue;
			if (charOf(o).ability === "aura" && Math.hypot(o.x - a.x, o.z - a.z) < (o.aura > 0 ? 14 : 8)) s *= o.aura > 0 ? 1.18 : 1.08;
		}
		return s;
	}
	function tryJump(a, wall) {
		const maxJ = charOf(a).jumps;
		if (a.minion) {
			if (!a.grounded && a.sinceLand >= .12) return;
			a.vy = 6.1;
			a.vx *= .55;
			a.vz *= .55;
			a.grounded = false;
			a.jumps = maxJ;
			a.riding = false;
			say(a, "groan");
			return;
		}
		if (a.climb || wall && !a.grounded) {
			const n = wall || {
				nx: -Math.sin(a.yaw),
				nz: -Math.cos(a.yaw)
			};
			a.vx = n.nx * 9.6;
			a.vz = n.nz * 9.6;
			a.vy = 9.3;
			a.climb = false;
			a.grounded = false;
			a.jumps = 0;
			a.riding = false;
			say(a, "wall");
			return;
		}
		if (a.grounded || a.sinceLand < .14) {
			const bunny = charOf(a).ability === "bunny";
			if (bunny && a.sinceLand < .22 && a.sinceLand > .02) a.bunny = Math.min(1.85, a.bunny + .12);
			else if (bunny) a.bunny = 1;
			a.vy = 9.15 * (bunny ? .92 + a.bunny * .18 : 1);
			a.grounded = false;
			a.jumps = 1;
			a.riding = false;
			say(a, "jump");
			if (a === player) audio.jump(charOf(a).voice);
			else audio.hopAt(a.x, a.y + 1, a.z, charOf(a).voice);
			return;
		}
		if (a.jumps < maxJ) {
			a.vy = 8.7;
			a.jumps += 1;
			a.roll = .48;
			a.grounded = false;
			say(a, a.jumps >= 3 ? "triple" : "double");
			if (a === player) audio.jump(charOf(a).voice * 1.15);
			else audio.hopAt(a.x, a.y + 1, a.z, charOf(a).voice);
			return;
		}
		if (charOf(a).ability === "bird" && a.fuel > .05) {
			a.vy = Math.max(a.vy, 4.4);
			a.fuel -= .12;
			say(a, "triple");
		}
	}
	function collide(a, dt) {
		const r = .42;
		const h = 1.62;
		a.x += a.vx * dt;
		for (const b of nearby(a.x, a.z, 1.02)) resolveH(a, b, "x", r, h);
		const prevY = a.y;
		a.y += a.vy * dt;
		a.grounded = false;
		for (const b of nearby(a.x, a.z, .62)) {
			if (a.x + r <= b.minX || a.x - r >= b.maxX || a.z + r <= b.minZ || a.z - r >= b.maxZ) continue;
			if (a.y + h <= b.minY || a.y >= b.maxY) continue;
			if (prevY >= b.maxY - .05 && a.vy <= .01 && (!b.oneway || prevY >= b.maxY - .08)) {
				a.y = b.maxY;
				if (b.bounce > 0) {
					a.vy = b.bounce;
					a.grounded = false;
					a.jumps = 0;
					a.bunny = Math.min(1.85, a.bunny + .04);
					if (a === player) audio.jump(520);
				} else if (b.turbo > 0) {
					a.vy = 0;
					a.grounded = true;
					a.vx = -Math.sin(a.yaw) * b.turbo;
					a.vz = -Math.cos(a.yaw) * b.turbo;
					say(a, "dash");
				} else {
					a.vy = 0;
					a.grounded = true;
				}
			} else if (!b.oneway && a.vy > 0 && prevY + h <= b.minY + .2) {
				a.y = b.minY - h;
				a.vy = 0;
			}
		}
		a.z += a.vz * dt;
		for (const b of nearby(a.x, a.z, 1.02)) resolveH(a, b, "z", r, h);
		if (a.y < 0) {
			a.y = 0;
			if (a.vy < 0) a.vy = 0;
			a.grounded = true;
		}
		a.x = clamp(a.x, -116, 116);
		a.z = clamp(a.z, -116, 116);
		const wet = inRiver(a.x, a.z) && a.y < .95;
		a.inWater = wet;
		if (wet && a.vy < -1) a.vy = -1;
	}
	function resolveH(a, b, axis, r, h) {
		if (b.oneway || b.bounce > 0) return;
		if (a.y + h <= b.minY + .02 || a.y >= b.maxY - .01) return;
		if (a.x + r <= b.minX || a.x - r >= b.maxX || a.z + r <= b.minZ || a.z - r >= b.maxZ) return;
		if (b.maxY - a.y <= .55 && b.maxY - a.y > .01 && a.vy <= 4) {
			a.y = b.maxY;
			a.grounded = true;
			if (a.vy < 0) a.vy = 0;
			return;
		}
		if (axis === "x") {
			if (a.x + r - b.minX < b.maxX - (a.x - r)) {
				a.x = b.minX - r;
				if (a.vx > 0) a.vx = 0;
			} else {
				a.x = b.maxX + r;
				if (a.vx < 0) a.vx = 0;
			}
		} else if (a.z + r - b.minZ < b.maxZ - (a.z - r)) {
			a.z = b.minZ - r;
			if (a.vz > 0) a.vz = 0;
		} else {
			a.z = b.maxZ + r;
			if (a.vz < 0) a.vz = 0;
		}
	}
	function stepLive(a, dt, first) {
		const ch = charOf(a);
		const bot = a.bot;
		let fwd = 0;
		let str = 0;
		let jumpEdge = false;
		let jumpHeld = false;
		let actEdge = false;
		let actHeld = false;
		let fire = false;
		let dash = false;
		if (!bot && !(spectate && a === player)) {
			if (held("KeyW") || touch.y > .2) fwd += 1;
			if (held("KeyS") || touch.y < -.2) fwd -= 1;
			if (held("KeyD") || touch.x > .2) str += 1;
			if (held("KeyA") || touch.x < -.2) str -= 1;
			if (touch.y) fwd += touch.y;
			if (touch.x) str += touch.x;
			fwd = clamp(fwd, -1, 1);
			str = clamp(str, -1, 1);
			jumpEdge = first && edges.jump;
			jumpHeld = held("Space") || touch.jump;
			actEdge = first && edges.act;
			actHeld = held("KeyF") || touch.act;
			fire = (mouseFire || touch.fire) && !menu && (document.pointerLockElement === view || touch.fire || qa);
			dash = first && edges.dash;
			if (queuedDash && first) {
				fwd = queuedDash.f || fwd;
				str = queuedDash.s || str;
				dash = true;
				queuedDash = null;
			}
			if (first && held("KeyQ")) a.yaw += 1.7 * dt;
			if (first && held("KeyE")) a.yaw -= 1.7 * dt;
			if (first) {
				a.yaw -= lookX * sens;
				pitch = clamp(pitch - lookY * sens, -1.2, 1.2);
				lookX = 0;
				lookY = 0;
				yaw = a.yaw;
			}
			if (menu || showMap || showScore || showConsole) {
				fwd = 0;
				str = 0;
				jumpEdge = false;
				jumpHeld = false;
				actEdge = false;
				actHeld = false;
				fire = false;
				dash = false;
			}
		} else if (bot) {
			a.think -= dt;
			if (a.think <= 0) {
				a.think = .4;
				pickGoal(a);
			}
			const dx = a.goalX - a.x;
			const dz = a.goalZ - a.z;
			const L = Math.hypot(dx, dz) || 1;
			const desired = Math.atan2(-dx / L, -dz / L);
			if (a.minion) {
				let turn = desired - a.yaw;
				while (turn > Math.PI) turn -= Math.PI * 2;
				while (turn < -Math.PI) turn += Math.PI * 2;
				a.yaw += turn * Math.min(1, 3.2 * dt);
				if (a.stuck > .5) {
					const side = (a.id & 1) === 0 ? 1 : -1;
					a.yaw += side * 2.2 * dt;
					fwd = 1;
				} else fwd = L < .75 ? 0 : Math.min(1, .4 + (L - .75) / 2);
				jumpEdge = a.grounded && a.sinceLand > .45 && (a.stuck > .8 || a.goalY > a.y + 1.2);
			} else {
				a.yaw = desired;
				fwd = 1;
				if (a.stuck > .4) str = a.id % 2 ? 1 : -1;
				jumpEdge = (a.goalY > a.y + 1.1 || a.stuck > .5) && Math.random() < .08;
			}
			if (Math.hypot(a.vx, a.vz) < .35 && fwd > .2) a.stuck += dt;
			else a.stuck = Math.max(0, a.stuck - dt * 2);
			jumpHeld = false;
			const foe = nearestEnemy(a, a.minion ? 18 : 26);
			fire = !!foe && Math.random() < .35 && a.cd <= 0;
			if (a.minion && foe && Math.hypot(foe.x - a.x, foe.z - a.z) < 2.4) fire = true;
			if (!a.minion && a.abilityCd <= 0) {
				const ab = ch.ability;
				const nearBody = corpses.some((c) => !c.used && Math.hypot(c.x - a.x, c.z - a.z) < 8);
				if ((ab === "voodoo" || ab === "mummy" || ab === "necro") && nearBody) useAbility(a);
				else if ((ab === "aura" || ab === "bestie") && Math.random() < .03) useAbility(a);
			}
		}
		a.cd = Math.max(0, a.cd - dt);
		a.dashCd = Math.max(0, a.dashCd - dt);
		a.voiceCd = Math.max(0, a.voiceCd - dt);
		a.abilityCd = Math.max(0, a.abilityCd - dt);
		a.teleCd = Math.max(0, a.teleCd - dt);
		a.flash = Math.max(0, a.flash - dt);
		a.invuln = Math.max(0, a.invuln - dt);
		a.speechT = Math.max(0, a.speechT - dt);
		a.roll = Math.max(0, a.roll - dt);
		a.slow = Math.max(0, a.slow - dt);
		a.shade = Math.max(0, a.shade - dt);
		a.burst = Math.max(0, a.burst - dt);
		a.puff = Math.max(0, a.puff - dt);
		a.aura = Math.max(0, a.aura - dt);
		a.flat = Math.max(0, a.flat - dt);
		if (a.inhale > 0) {
			a.inhale -= dt;
			for (const o of actors) {
				if (o === a || o.state !== "live" || o.team === a.team) continue;
				const d = Math.hypot(o.x - a.x, o.z - a.z);
				if (d < 7 && d > .2) {
					o.vx += (a.x - o.x) / d * 8 * dt;
					o.vz += (a.z - o.z) / d * 8 * dt;
				}
			}
			if (a.inhale <= 0) {
				a.puff = 4;
				say(a, "puff");
			}
		}
		if (a.sheep > 0) {
			a.sheep -= dt;
			const cy = Math.cos(pitch);
			const fx = -Math.sin(a.yaw) * (bot ? 1 : cy);
			const fy = bot ? .15 : Math.sin(pitch);
			const fz = -Math.cos(a.yaw) * (bot ? 1 : cy);
			a.vx = fx * 22;
			a.vy = fy * 22;
			a.vz = fz * 22;
			a.x += a.vx * dt;
			a.y += a.vy * dt;
			a.z += a.vz * dt;
			const hit = rayAll(a.x, a.y + .6, a.z, Math.sign(a.vx) || 0, 0, Math.sign(a.vz) || 0, .8);
			const bumped = actors.some((o) => o !== a && o.state === "live" && o.team !== a.team && Math.hypot(o.x - a.x, o.z - a.z) < 1.2);
			if (hit || bumped || a.y < .2 || a.sheep <= 0) {
				explode(a.x, a.y + .5, a.z, 4.5, 48, a.id, 0);
				a.sheep = 0;
				a.vy = 12;
				a.vx *= .25;
				a.vz *= .25;
				a.jumps = 0;
				a.grounded = false;
				say(a, "yay");
			}
			return;
		}
		const fx = -Math.sin(a.yaw);
		const fz = -Math.cos(a.yaw);
		const rx = Math.cos(a.yaw);
		const rz = -Math.sin(a.yaw);
		let wx = fx * fwd + rx * str;
		let wz = fz * fwd + rz * str;
		const wm = Math.hypot(wx, wz);
		if (wm > 1) {
			wx /= wm;
			wz /= wm;
		}
		const wall = probeWall(a);
		if (jumpEdge) tryJump(a, wall);
		else if (actHeld && wall && !bot) {
			a.climb = true;
			a.vx = 0;
			a.vz = 0;
			a.vy = fwd * 5.4;
			a.x = wall.x + wall.nx * .5;
			a.z = wall.z + wall.nz * .5;
			const tx = -wall.nz;
			const tz = wall.nx;
			a.x += tx * str * 3.2 * dt;
			a.z += tz * str * 3.2 * dt;
			a.jumps = 0;
			if (a.y >= wall.top - .05) {
				a.y = wall.top;
				a.climb = false;
				a.grounded = true;
				a.vy = 0;
			}
		} else {
			a.climb = false;
			if (dash && a.dashCd <= 0 && wm > .15) {
				const dashSp = a.puff > 0 ? 22 : 16.5;
				a.vx = wx * dashSp;
				a.vz = wz * dashSp;
				a.dashCd = .72;
				a.lunge = .18;
				if (a.puff > 0) a.flat = .45;
				if (ch.ability === "shadow") a.shade = .3;
				say(a, "dash");
			}
			if (a.lunge > 0) a.lunge -= dt;
			const glide = ch.ability === "glide" && jumpHeld && a.vy < 0 && !a.grounded;
			if (ch.ability === "jet" && jumpHeld && !a.grounded && a.fuel > 0) {
				a.vy += 24 * dt;
				if (!bot && a === player) a.vy += Math.sin(pitch) * 14 * dt;
				a.vy = Math.min(a.vy, 9);
				a.fuel -= dt * .35;
			}
			if (ch.ability === "bird" && jumpHeld && !a.grounded && a.fuel > 0 && a.jumps >= ch.jumps) {
				a.vy += 20 * dt;
				if (!bot && a === player) a.vy += Math.sin(pitch) * 12 * dt;
				a.vy = Math.min(a.vy, 7.5);
				a.fuel -= dt * .25;
			}
			if (a.hover && a.fuel > 0) {
				a.vy += (0 - a.vy) * (1 - Math.exp(-6 * dt));
				if (jumpHeld) a.vy += 8 * dt;
				if (!bot && a === player) a.vy += Math.sin(pitch) * 10 * dt;
				a.fuel -= dt * .18;
				if (a.fuel <= 0) a.hover = false;
			}
			const spd = speedOf(a);
			if (a.lunge <= 0) {
				const k = 1 - Math.exp((a.grounded ? -14 : -5) * dt);
				a.vx += (wx * spd - a.vx) * k;
				a.vz += (wz * spd - a.vz) * k;
			}
			if (!a.hover && !glide && a.puff <= 0) a.vy -= 28 * dt;
			else if (a.puff > 0) a.vy -= 8 * dt;
			if (glide) a.vy = -1.65 + (!bot && a === player ? Math.sin(pitch) * 6.5 : 0);
			if (!a.minion && !a.grounded && wall && fwd > .2) {
				const into = a.vx * -wall.nx + a.vz * -wall.nz;
				if (into > 0) {
					a.vx += wall.nx * into;
					a.vz += wall.nz * into;
				}
				const ride = ch.ability === "wall" ? .35 : 3.1;
				if (a.vy < -ride) a.vy = -ride;
				if (a === player && Math.random() < .02) a.pendingXp += 1;
			}
			if (!bot && a === player && !a.grounded && !a.climb && !glide && !a.hover && a.puff <= 0) a.vy += Math.sin(pitch) * 5 * dt;
			if (!bot && actEdge) {
				if (BUILD_ACTIONS[a.build]?.id === "ability" || a.build === 0) useAbility(a);
				else place(a);
			}
		}
		if (a.grounded) {
			a.sinceLand += dt;
			a.fuel = Math.min(1, a.fuel + dt * .4);
			if (!a.wasGround && a.vy <= 0) {
				if (a === player) audio.jump(180);
				burst(a.x, a.y, a.z, 16777215, 4);
			}
		} else a.sinceLand = 0;
		const beforeWater = a.wasWater;
		if (a.riding) {
			if (jumpEdge) {
				const tr = trainPose(trainAng);
				a.riding = false;
				a.vx = tr.tx * 16 + tr.rx * 3;
				a.vz = tr.tz * 16 + tr.rz * 3;
				a.vy = 9;
				a.jumps = 0;
				say(a, "ride");
			} else {
				const tr = trainPose(trainAng);
				a.x = tr.x + tr.rx * 2.2;
				a.z = tr.z + tr.rz * 2.2;
				a.y = tr.y + 1.05;
				a.vx = tr.tx * 16;
				a.vz = tr.tz * 16;
				a.vy = 0;
				a.grounded = true;
			}
		} else {
			collide(a, dt);
			if (!a.climb && streamAt(a)) a.grounded = false;
			if (!a.minion && !jumpEdge) {
				const tr = trainPose(trainAng);
				if (Math.hypot(a.x - tr.x, a.z - tr.z) < 3.1 && a.y > tr.y - .2 && a.y < tr.y + 2.4) {
					a.riding = true;
					say(a, "ride");
				}
			}
		}
		if (a.inWater && !beforeWater) {
			audio.splashAt(a.x, a.y, a.z);
			say(a, "water");
			burst(a.x, .4, a.z, 10479615, 8);
		}
		if (a.inWater && a.heatSick) {
			a.heatSick = false;
			a.mood = "happy";
			a.moodT = 1.4;
			if (a === player) {
				audio.cured();
				line("HEATSTROKE CURED!", true);
			}
		}
		a.wasWater = a.inWater;
		a.wasGround = a.grounded;
		if (a.grounded && ch.ability === "bunny" && a.sinceLand > .28) a.bunny = Math.max(1, a.bunny - dt * .4);
		if (a.minion) {
			const moving = Math.hypot(a.vx, a.vz);
			if (a.grounded && moving > .35) a.anim += moving / 1.28 * Math.PI * 2 * dt;
			else {
				const m = (a.anim % Math.PI + Math.PI) % Math.PI;
				a.anim += (Math.PI / 2 - m) * Math.min(1, dt * 8);
			}
		} else a.anim += Math.hypot(a.vx, a.vz) * dt * 1.6;
		if (!(qa && a === player)) for (const o of actors) {
			if (o === a || o.state !== "live") continue;
			const dx = a.x - o.x;
			const dz = a.z - o.z;
			const dist = Math.hypot(dx, dz);
			if (dist < .75 && dist > .01 && !a.climb && !a.riding) {
				const push = a.minion ? 1.6 : 6;
				a.vx += dx / dist * push * dt;
				a.vz += dz / dist * push * dt;
			}
		}
		if (a.hp < (a.minion ? 90 : 100)) a.hp = Math.min(a.minion ? 90 : 100, a.hp + dt * (a.minion ? .3 : 1));
		for (let i = 0; i < medState.length; i++) {
			const m = world.meds[i];
			if (medState[i] > 0) medState[i] = Math.max(0, medState[i] - dt);
			else if (a.hp < 100 && Math.hypot(a.x - m.x, a.z - m.z) < 1.35 && Math.abs(a.y - m.y) < 2) {
				a.hp = Math.min(100, a.hp + 45);
				medState[i] = 60;
				burst(m.x, m.y + .4, m.z, 11992938, 8);
				if (a === player) line("Medpack");
			}
		}
		for (const d of dyn) {
			if (!d.alive || a.teleCd > 0) continue;
			if (d.kind === "tele" && overlap(a, d)) {
				const other = dyn.find((o) => o.alive && o.kind === "tele" && o.link === d.link && o !== d);
				if (other) {
					a.x = (other.minX + other.maxX) / 2 + -Math.sin(a.yaw) * 1.4;
					a.z = (other.minZ + other.maxZ) / 2 + -Math.cos(a.yaw) * 1.4;
					a.y = other.maxY + .1;
					a.teleCd = 1.1;
					burst(a.x, a.y, a.z, 8057087, 8);
				}
			}
			if (d.kind === "tangle" && d.team !== a.team && overlap(a, d)) a.slow = 2.2;
		}
		const weapons = loadout(ch);
		if (first && edges.slot >= 0 && !bot) a.weapon = edges.slot % weapons.length;
		const w = WEAPON_BY_ID[weapons[a.weapon % weapons.length] || "plasma"];
		if (a.minion) {
			const prey = nearestEnemy(a, 2.55);
			if (prey && a.cd <= 0) {
				a.cd = .82;
				hurt(prey, a.kind === "necro" ? 18 : 13, a, false);
				burst(prey.x, prey.y + 1, prey.z, 10354506, 7);
				say(a, "groan");
			}
		} else if (fire && a.cd <= 0 && w.kind !== "flame") {
			if (a === player) gunKick = 1;
			shoot(a, w.id);
		}
		if (!a.minion && fire && w.kind === "flame") {
			a.flame += dt;
			if (a.cd <= 0) {
				a.cd = .1;
				if (a === player) gunKick = 1;
				flame(a);
			}
		}
		if (a === player) scope = mouseScope && w.id === "sniper" && !menu;
		stepPickups(a);
	}
	function overlap(a, b) {
		return a.x > b.minX - .4 && a.x < b.maxX + .4 && a.z > b.minZ - .4 && a.z < b.maxZ + .4 && a.y + 1.4 > b.minY && a.y < b.maxY + .4;
	}
	function nearestEnemy(a, rad) {
		let best = null;
		let bd = rad;
		for (const o of actors) {
			if (o.state !== "live" || o.team === a.team) continue;
			const d = Math.hypot(o.x - a.x, o.z - a.z);
			if (d < bd) {
				bd = d;
				best = o;
			}
		}
		return best;
	}
	function pickGoal(a) {
		if (a.hp < 40) {
			let best = world.meds[0];
			let bd = 1e9;
			for (const m of world.meds) {
				const d = Math.hypot(m.x - a.x, m.z - a.z);
				if (d < bd) {
					bd = d;
					best = m;
				}
			}
			a.goalX = best.x;
			a.goalY = best.y;
			a.goalZ = best.z;
			return;
		}
		if (a.minion && a.flag < 0 && a.hp >= 40) {
			const foe = nearestEnemy(a, 30);
			if (foe) {
				a.goalX = foe.x;
				a.goalY = foe.y;
				a.goalZ = foe.z;
				return;
			}
		}
		const ally = actors.find((o) => o !== a && o.state === "down" && o.team === a.team && Math.hypot(o.x - a.x, o.z - a.z) < 24);
		if (ally && !a.minion) {
			a.goalX = ally.x;
			a.goalY = ally.y;
			a.goalZ = ally.z;
			return;
		}
		if (a.flag >= 0) {
			const b = world.bases[a.team];
			a.goalX = b.x;
			a.goalY = 8;
			a.goalZ = b.z;
			return;
		}
		if (a.id * 13 % 10 < 3) {
			a.goalX = 0;
			a.goalY = 28;
			a.goalZ = 0;
			return;
		}
		let bestF = flags[0];
		let bd = 1e9;
		for (const f of flags) {
			if (f.team === a.team && f.home) continue;
			const d = Math.hypot(f.x - a.x, f.z - a.z) + (f.team === a.team ? -8 : 0);
			if (d < bd) {
				bd = d;
				bestF = f;
			}
		}
		a.goalX = bestF.x + (a.id % 5 - 2);
		a.goalY = bestF.y;
		a.goalZ = bestF.z;
	}
	function aimDir(a, out) {
		if (a === player) {
			camera.getWorldDirection(out);
			return;
		}
		out.set(-Math.sin(a.yaw), 0, -Math.cos(a.yaw));
	}
	function shoot(a, id) {
		const w = WEAPON_BY_ID[id];
		a.cd = w.cd * (a.burst > 0 ? .45 : 1);
		aimDir(a, dir);
		const ox = a === player ? camera.position.x : a.x;
		const oy = a === player ? camera.position.y : a.y + 1.4;
		const oz = a === player ? camera.position.z : a.z;
		audio.shotAt(ox, oy, oz, w.kind, a === player);
		if (w.kind === "trace" || w.kind === "melee") {
			const reach = w.kind === "melee" ? 2.5 : id === "sniper" ? 220 : 90;
			const hit = trace(ox, oy, oz, dir.x, dir.y, dir.z, reach, a);
			const endX = hit ? hit.x : ox + dir.x * Math.min(reach, 40);
			const endY = hit ? hit.y : oy + dir.y * Math.min(reach, 40);
			const endZ = hit ? hit.z : oz + dir.z * Math.min(reach, 40);
			tracers.push({
				x1: ox,
				y1: oy,
				z1: oz,
				x2: endX,
				y2: endY,
				z2: endZ,
				life: id === "sniper" ? .18 : .08,
				max: .18,
				color: TEAMS[a.team].hex
			});
			if (id === "dual") tracers.push({
				x1: ox + .2,
				y1: oy,
				z1: oz,
				x2: endX,
				y2: endY,
				z2: endZ,
				life: .08,
				max: .1,
				color: 16748232
			});
			if (hit?.actor) {
				hurt(hit.actor, hit.head ? w.head : w.dmg, a, hit.head);
				if (a === player) {
					hitMark = .12;
					hitHead = hit.head;
				}
			}
			if (a === player) pendingShots.push({
				ox,
				oy,
				oz,
				dx: dir.x,
				dy: dir.y,
				dz: dir.z,
				dmg: w.dmg
			});
		} else if (w.kind === "rocket" || w.kind === "bounce" || w.kind === "laugh") balls.push({
			x: ox + dir.x * 1.2,
			y: oy + dir.y * 1.2,
			z: oz + dir.z * 1.2,
			vx: dir.x * w.speed,
			vy: dir.y * w.speed,
			vz: dir.z * w.speed,
			life: w.kind === "rocket" ? 3.2 : 2.8,
			bounces: 0,
			kind: w.kind,
			team: a.team,
			owner: a.id,
			dmg: w.dmg,
			model: 0,
			spin: 0,
			tilt: 0,
			face: a.yaw,
			laughT: .15
		});
		else if (w.kind === "drone") drones.push({
			x: ox + dir.x,
			y: oy,
			z: oz + dir.z,
			team: a.team,
			life: 8,
			dmg: w.dmg,
			owner: a.id
		});
	}
	function flame(a) {
		aimDir(a, dir);
		audio.shotAt(a.x, a.y + 1.2, a.z, "flame", a === player);
		burst(a.x + dir.x, a.y + 1.2, a.z + dir.z, 16738858, 3);
		for (const o of actors) {
			if (o.state !== "live" || o.team === a.team) continue;
			const dx = o.x - a.x;
			const dy = o.y + .8 - (a.y + 1.2);
			const dz = o.z - a.z;
			const dist = Math.hypot(dx, dy, dz);
			if (dist > 7 || dist < .01) continue;
			if (dx / dist * dir.x + dy / dist * dir.y + dz / dist * dir.z > .75) hurt(o, 7, a, false);
		}
	}
	function trace(ox, oy, oz, dx, dy, dz, maxT, src) {
		const wall = rayAll(ox, oy, oz, dx, dy, dz, maxT);
		let bestT = wall ? wall.t : maxT;
		let hit = null;
		for (const o of actors) {
			if (o === src || o.state !== "live") continue;
			const body = sphereT(ox, oy, oz, dx, dy, dz, o.x, o.y + .85, o.z, .55, bestT);
			const head = sphereT(ox, oy, oz, dx, dy, dz, o.x, o.y + 1.5, o.z, .38, bestT);
			const t = head ?? body;
			if (t == null) continue;
			if (t < bestT) {
				bestT = t;
				hit = {
					actor: o,
					head: head != null && (body == null || head <= body),
					x: ox + dx * t,
					y: oy + dy * t,
					z: oz + dz * t
				};
			}
		}
		if (wall && (!hit || wall.t < bestT)) return {
			actor: null,
			head: false,
			x: wall.x,
			y: wall.y,
			z: wall.z
		};
		return hit;
	}
	function sphereT(ox, oy, oz, dx, dy, dz, cx, cy, cz, rad, maxT) {
		const lx = cx - ox;
		const ly = cy - oy;
		const lz = cz - oz;
		const t = lx * dx + ly * dy + lz * dz;
		if (t < 0 || t > maxT) return null;
		const ddx = ox + dx * t - cx;
		const ddy = oy + dy * t - cy;
		const ddz = oz + dz * t - cz;
		if (ddx * ddx + ddy * ddy + ddz * ddz > rad * rad) return null;
		return t;
	}
	function useAbility(a) {
		const ch = charOf(a);
		if (a.abilityCd > 0) return;
		if (ch.ability === "shadow") {
			a.vx = -Math.sin(a.yaw) * 22;
			a.vz = -Math.cos(a.yaw) * 22;
			a.shade = .35;
			a.abilityCd = 3;
			say(a, "dash");
		} else if (ch.ability === "aura") {
			a.aura = 4.5;
			a.abilityCd = 8;
			say(a, "yay");
		} else if (ch.ability === "bestie") {
			for (const o of actors) if (o.team === a.team && o.state === "live" && Math.hypot(o.x - a.x, o.z - a.z) < 8) o.hp = Math.min(100, o.hp + 28);
			a.abilityCd = 10;
			burst(a.x, a.y + 1, a.z, 16748228, 10);
		} else if (ch.ability === "puff") {
			a.inhale = .7;
			a.abilityCd = 6;
			audio.shotAt(a.x, a.y + 1, a.z, "flame", a === player);
		} else if (ch.ability === "sheep") {
			a.sheep = 4.5;
			a.abilityCd = 11;
			say(a, "sheep");
		} else if (ch.ability === "drone") {
			a.hover = !a.hover;
			a.abilityCd = .4;
			say(a, "triple");
		} else if (ch.ability === "voodoo" || ch.ability === "mummy" || ch.ability === "necro") {
			if (raise(a)) {
				a.abilityCd = 4;
				say(a, "groan");
			}
		} else if (ch.ability === "glide") {
			a.vy = Math.max(a.vy, 6);
			a.abilityCd = 2;
			say(a, "triple");
		} else if (ch.ability === "snipe") {
			scope = true;
			mouseScope = true;
			a.abilityCd = .3;
		} else if (ch.ability === "dual") {
			a.burst = 2.5;
			a.abilityCd = 6;
		} else if (ch.ability === "tesla") {
			aimDir(a, dir);
			const lines = [
				"Buy this!",
				"And this!",
				"Take this!",
				"They see me rollin. They hatin.",
				"Wanna go to Mars?"
			];
			const phrase = lines[Math.abs(a.kills + carSerial) % lines.length] || "Buy this!";
			const model = carSerial % TESLA_NAMES.length;
			carSerial += 1;
			balls.push({
				x: a.x + dir.x * 1.6,
				y: a.y + 1.3,
				z: a.z + dir.z * 1.6,
				vx: dir.x * 16,
				vy: dir.y * 7 + 6,
				vz: dir.z * 16,
				life: 4.4,
				bounces: 0,
				kind: "car",
				team: a.team,
				owner: a.id,
				dmg: 70,
				model,
				spin: .6,
				tilt: .35,
				face: a.yaw,
				laughT: 0
			});
			a.abilityCd = 2.2;
			say(a, phrase);
		} else if (ch.ability === "winner") {
			const lines = [
				"Double Winner!",
				"You're fired!",
				"All powers combined. I am Captain Planet!"
			];
			a.abilityCd = 5;
			a.vx += -Math.sin(a.yaw) * 10;
			a.vz += -Math.cos(a.yaw) * 10;
			say(a, lines[Math.abs(a.kills) % lines.length] || "Double Winner!");
		} else if (ch.ability === "flux") {
			a.abilityCd = 1.1;
			shoot(a, "plasma");
			say(a, "boom fluxxed you right in the capaciter");
		} else if (ch.ability === "elbow") {
			a.vy = Math.max(a.vy, 7.5);
			a.abilityCd = 4.5;
			a.lunge = .28;
			for (const o of actors) if (o !== a && o.state === "live" && o.team !== a.team && Math.hypot(o.x - a.x, o.z - a.z) < 3.2) hurt(o, 36, a, false);
			emote(a, "wave", .8, null);
			say(a, "Can you smell what the Rock is cooking");
		} else if (ch.ability === "spotlight") {
			a.abilityCd = 7;
			a.shade = .4;
			for (const o of actors) if (o !== a && o.state === "live" && o.team !== a.team && Math.hypot(o.x - a.x, o.z - a.z) < 9) {
				o.slow = Math.max(o.slow, 1.4);
				emote(o, "exclaim", .8, a);
			}
			burst(a.x, a.y + 1.6, a.z, 16773570, 14);
			say(a, "Watch me");
		} else if (ch.ability === "loud") {
			a.abilityCd = 6;
			for (const o of actors) if (o !== a && o.state === "live" && Math.hypot(o.x - a.x, o.z - a.z) < 8) {
				const dx = o.x - a.x;
				const dz = o.z - a.z;
				const len = Math.hypot(dx, dz) || 1;
				o.vx += dx / len * 8;
				o.vz += dz / len * 8;
				if (o.team !== a.team) hurt(o, 12, a, false);
			}
			emote(a, "exclaim", 1, null);
			say(a, "Let's get loud");
		} else if (ch.id === "cloudy") {
			a.vy = Math.max(a.vy, 8);
			a.abilityCd = 3;
			for (const color of [
				16734858,
				16769354,
				8257354,
				4114175,
				11766015
			]) burst(a.x, a.y + 1.4, a.z, color, 4);
			say(a, "curiouser and curiouser");
		} else {
			a.abilityCd = .4;
			say(a, "yay");
		}
	}
	function minionCount(team) {
		return actors.filter((a) => a.minion && a.team === team && a.state === "live").length;
	}
	function raise(a) {
		let best = null;
		let bd = 8;
		for (const c of corpses) {
			if (c.used) continue;
			const d = Math.hypot(c.x - a.x, c.z - a.z);
			if (d < bd) {
				bd = d;
				best = c;
			}
		}
		if (!best) {
			if (a === player) line("No body in reach");
			return false;
		}
		if (minionCount(a.team) >= 16) {
			if (a === player) line("Risen squad is full");
			return false;
		}
		best.used = true;
		const rite = charOf(a).ability;
		const m = makeActor({
			name: rite === "mummy" ? "Wrapmutant" : rite === "necro" ? "Bonemutant" : "Mutant",
			team: a.team,
			charId: a.charId,
			bot: true,
			minion: true,
			kind: rite,
			x: best.x,
			y: best.y,
			z: best.z,
			hp: rite === "mummy" ? 90 : rite === "necro" ? 74 : 64
		});
		actors.push(m);
		line(`${a.name} raised a mutant`, a === player);
		burst(best.x, best.y + .6, best.z, 9305925, 12);
		return true;
	}
	function place(a) {
		const piece = BUILD_ACTIONS[a.build]?.id || "block";
		if (piece === "ability") {
			useAbility(a);
			return;
		}
		if (dyn.filter((d) => d.alive && d.kind === piece).length >= (piece === "block" ? 36 : 8) + (charOf(a).ability === "builder" ? 8 : 0)) {
			if (a === player) line("No more of those");
			return;
		}
		const fx = -Math.sin(a.yaw);
		const fz = -Math.cos(a.yaw);
		let x = Math.round((a.x + fx * 2.5) / 2) * 2;
		let z = Math.round((a.z + fz * 2.5) / 2) * 2;
		const down = rayAll(x, a.y + 2.2, z, 0, -1, 0, 8);
		const solid = {
			...pieceSpec(piece, x, down ? down.y : 0, z),
			alive: true,
			kind: piece,
			team: a.team,
			cool: 0,
			link: -1,
			yaw: a.yaw
		};
		if (piece === "tele") {
			if (openTele >= 0 && dyn[openTele]?.alive) {
				solid.link = openTele;
				dyn[openTele].link = dyn.length;
				openTele = -1;
			} else {
				solid.link = dyn.length;
				openTele = dyn.length;
			}
		}
		dyn.push(solid);
		if (piece === "block") {
			for (const b of bunkers) if (!b.done && Math.hypot(b.x - x, b.z - z) < 9) {
				b.n += 1;
				if (b.n >= 3) {
					b.done = true;
					a.xp += 80;
					a.pendingXp += 80;
					line("Bunker established", true);
				}
			}
		}
		if (a === player) line(`Placed ${BUILD_ACTIONS[a.build]?.name}`);
	}
	function pieceSpec(piece, x, floor, z) {
		if (piece === "jump") return boxSolid(x, floor + .2, z, 2, .35, 2, {
			bounce: 15,
			color: 13034330
		});
		if (piece === "turbo") return boxSolid(x, floor + .2, z, 2, .35, 2, {
			turbo: 20,
			color: 8057087
		});
		if (piece === "turret") return boxSolid(x, floor + .7, z, 1.1, 1.4, 1.1, { color: 2238506 });
		if (piece === "mine") return boxSolid(x, floor + .12, z, .8, .2, .8, { color: 16734824 });
		if (piece === "tangle") return boxSolid(x, floor + .3, z, 1.6, .5, 1.6, { color: 11766015 });
		if (piece === "tele") return boxSolid(x, floor + .15, z, 1.6, .25, 1.6, { color: 4114175 });
		const sand = z < -50;
		return boxSolid(x, floor + 1, z, 2, 2, 2, { color: sand ? 15194020 : 9292373 });
	}
	function boxSolid(cx, cy, cz, w, h, d, extra) {
		return {
			minX: cx - w / 2,
			maxX: cx + w / 2,
			minY: cy - h / 2,
			maxY: cy + h / 2,
			minZ: cz - d / 2,
			maxZ: cz + d / 2,
			oneway: false,
			bounce: 0,
			turbo: 0,
			climb: false,
			color: 16777215,
			...extra
		};
	}
	function stepPickups(a) {
		if (a.state !== "live") return;
		for (const f of flags) {
			if (f.carrier === a.id) {
				f.x = a.x;
				f.y = a.y + 2.3;
				f.z = a.z;
				if (f.team !== a.team && onBase(a, a.team) && ownHome(a.team)) {
					caps[a.team] += 1;
					a.xp += 150;
					a.pendingXp += 150;
					a.pendingC += 1;
					f.carrier = -1;
					a.flag = -1;
					f.home = true;
					f.x = f.hx;
					f.y = f.hy;
					f.z = f.hz;
					line(`${a.name} captured the ${TEAMS[f.team].name} flag`, true);
					say(a, "yay");
				}
				continue;
			}
			if (f.carrier >= 0) continue;
			if (Math.hypot(a.x - f.x, a.z - f.z) < 2.3 && Math.abs(a.y - f.y) < 3) {
				if (!f.home && a.team === f.team) {
					f.home = true;
					f.x = f.hx;
					f.y = f.hy;
					f.z = f.hz;
					line(`${TEAMS[f.team].name} flag returned`, true);
				} else if (a.team !== f.team && a.flag < 0) {
					f.carrier = a.id;
					f.home = false;
					a.flag = f.team;
					line(`${a.name} took the ${TEAMS[f.team].name} flag`, true);
				}
			}
		}
	}
	function onBase(a, team) {
		const b = world.bases[team];
		return a.y > 6.5 && Math.hypot(a.x - b.x, a.z - b.z) < 15;
	}
	function ownHome(team) {
		const f = flags[team];
		return !!f && f.home && f.carrier < 0;
	}
	function stepDown(a, dt) {
		a.downT += dt;
		a.fall = Math.min(1, a.downT / .72);
		if (a.fall < 1) {
			a.vy -= 26 * dt;
			a.vx *= Math.max(0, 1 - dt * 2.4);
			a.vz *= Math.max(0, 1 - dt * 2.4);
			collide(a, dt);
			if (a.grounded && a.vy <= 0) {
				a.vx *= .82;
				a.vz *= .82;
			}
		}
		a.helpT -= dt;
		a.revive = 0;
		for (const o of actors) {
			if (o.state !== "live" || o.team !== a.team || o.minion) continue;
			if (Math.hypot(o.x - a.x, o.z - a.z) < 1.35 && Math.abs(o.y - a.y) < 2) {
				a.revive += dt;
				const need = charOf(o).ability === "bestie" ? .12 : .4;
				if (a.revive >= need) {
					a.state = "live";
					a.hp = 60;
					a.fall = 1;
					a.invuln = .8;
					o.xp += 40;
					o.pendingXp += 40;
					line(`${o.name} revived ${a.name}`, true);
					say(a, "yay");
					emote(o, "wave", 1.4, a);
					emote(a, "happy", 1.2, o);
					return;
				}
			}
		}
		if (a.helpT <= 0) {
			a.helpT = 2.8;
			a.speech = "help!";
			a.speechT = 1;
			audio.helpAt(a.x, a.y + 1, a.z, charOf(a).voice, a === player);
		}
		if ((a === player ? spawnReq || edges.jump && !menu : a.downT > 8) || a.downT > 22) {
			corpses.push({
				x: a.x,
				y: a.y,
				z: a.z,
				team: a.team,
				charId: a.charId,
				life: 36,
				used: false
			});
			if (corpses.length > 24) corpses.shift();
			if (a.minion) a.state = "gone";
			else respawn(a);
			spawnReq = false;
		}
	}
	function respawn(a) {
		const spots = world.spawns.filter((s) => s.team === a.team);
		const s = spots[Math.floor(Math.random() * spots.length)] || world.spawns[0];
		if (qa && a === player) {
			a.x = world.qa.x;
			a.y = world.qa.y;
			a.z = world.qa.z;
			a.yaw = world.qa.yaw;
		} else {
			a.x = s.x;
			a.y = s.y;
			a.z = s.z;
			a.yaw = s.yaw;
		}
		a.vx = a.vy = a.vz = 0;
		a.hp = 100;
		a.state = "live";
		a.invuln = 1.3;
		a.flag = -1;
		a.riding = false;
		a.sheep = 0;
		a.hover = false;
		a.grounded = true;
		if (a === player) {
			yaw = a.yaw;
			line("Back on the field");
		}
	}
	function stepFly(dt, first) {
		if (first) {
			fly.yaw -= lookX * sens;
			fly.pitch = clamp(fly.pitch - lookY * sens, -1.15, 1.15);
			lookX = 0;
			lookY = 0;
		}
		if (menu || showMap || showScore || showConsole) return;
		let fwd = 0;
		let str = 0;
		let up = 0;
		if (held("KeyW") || touch.y > .2) fwd += 1;
		if (held("KeyS") || touch.y < -.2) fwd -= 1;
		if (held("KeyD") || touch.x > .2) str += 1;
		if (held("KeyA") || touch.x < -.2) str -= 1;
		if (touch.y) fwd += touch.y;
		if (touch.x) str += touch.x;
		fwd = clamp(fwd, -1, 1);
		str = clamp(str, -1, 1);
		if (held("Space") || touch.jump) up += 1;
		if (held("ControlLeft") || held("ControlRight") || held("KeyC")) up -= 1;
		const sp = 16 * (held("ShiftLeft") || held("ShiftRight") || touch.dash ? 2.6 : 1);
		const cy = Math.cos(fly.pitch);
		const fx = -Math.sin(fly.yaw) * cy;
		const fy = Math.sin(fly.pitch);
		const fz = -Math.cos(fly.yaw) * cy;
		const rx = Math.cos(fly.yaw);
		const rz = -Math.sin(fly.yaw);
		fly.x += (fx * fwd + rx * str) * sp * dt;
		fly.y += (fy * fwd + up) * sp * dt;
		fly.z += (fz * fwd + rz * str) * sp * dt;
		fly.x = clamp(fly.x, -140, 140);
		fly.y = clamp(fly.y, .6, 86);
		fly.z = clamp(fly.z, -140, 140);
	}
	function earNow() {
		if (spectate) return fly;
		if (player) return {
			x: player.x,
			y: player.y + 1.6,
			z: player.z
		};
		return {
			x: 0,
			y: 22,
			z: 0
		};
	}
	function pickComment() {
		const e = earNow();
		let nearM = false;
		let nearFlag = false;
		for (const a of actors) {
			if (a.state !== "live") continue;
			const d = Math.hypot(a.x - e.x, a.z - e.z);
			if (a.minion && d < 16) nearM = true;
			if (a.flag >= 0 && d < 24) nearFlag = true;
		}
		if (nearFlag) return "flag runner";
		if (nearM) return "claws out";
		if (Math.hypot(e.x - world.hill.x, e.z - world.hill.z) < 22) return "hill fight";
		if (player && !spectate && player.inWater) return "in the river";
		const flavors = [
			"squad up",
			"watch the flank",
			"hold the flag",
			"nice and easy"
		];
		return flavors[Math.floor(performance.now() / 11e3) % flavors.length] || "squad up";
	}
	function simulate(dt, first) {
		if (spectate) stepFly(dt, first);
		const c = clockParts();
		const sunY = Math.sin((c.hoursF - 6) / 24 * Math.PI * 2);
		if (prevSun > 0 && sunY <= 0) audio.owl();
		if (prevSun <= .05 && sunY > .05) audio.birds();
		prevSun = sunY;
		weatherT -= dt;
		if (weatherT <= 0) {
			const optsW = [
				"clear",
				"cloudy",
				"sun",
				"rain",
				"snow"
			];
			weather = optsW[Math.floor(Math.random() * optsW.length)];
			weatherT = 35 + Math.random() * 40;
			audio.weather(weather);
			line(`Weather ${weather}`);
		}
		const body = skyBody(c.hoursF, c.date);
		if (weather === "sun" && body.sun.alt > .2) {
			heatArm -= dt * (c.season === "Summer" ? 1 : .4);
			if (heatLeft <= 0 && heatArm <= 0) {
				heatLeft = 60;
				heatArm = 70 + Math.random() * 80;
				for (const a of actors) if (a.state === "live") a.heatSick = true;
				globalCall("HEATSTROKE");
				audio.announce("Heatstroke. One minute. Find the river.");
			}
		}
		if (heatLeft > 0) {
			heatLeft = Math.max(0, heatLeft - dt);
			if (heatLeft <= 0) for (const a of actors) a.heatSick = false;
		}
		const wetSky = weather === "rain" || weather === "snow";
		trainAng += dt * .22;
		trainToot -= dt;
		if (trainToot <= 0) {
			trainToot = 7;
			const tr = trainPose(trainAng);
			audio.trainAt(tr.x, tr.y, tr.z);
			burst(tr.x, tr.y + 2.2, tr.z, 16777215, 4);
		}
		for (const f of flags) if (f.carrier < 0 && !f.home) {
			f.drop += dt;
			if (f.drop > 20) {
				f.home = true;
				f.x = f.hx;
				f.y = f.hy;
				f.z = f.hz;
				line(`${TEAMS[f.team].name} flag returned`);
			}
		}
		for (const a of actors) {
			if (a.state === "gone") continue;
			a.moodT = Math.max(0, a.moodT - dt);
			if (a.moodT <= 0 && a.mood !== "depressed") a.mood = "";
			a.veins = a.mood === "angry" ? a.veins : Math.max(0, a.veins - dt * 2);
			if (wetSky && a.state === "live") a.wet = Math.min(40, a.wet + dt);
			else a.wet = Math.max(0, a.wet - dt * 1.7);
			if (a.wet > 14 && a.state === "live") {
				a.mood = "depressed";
				a.moodT = 1.4;
			} else if (a.mood === "depressed" && a.wet < 2) a.mood = "";
			if (a.remote) {
				const k = 1 - Math.exp(-8 * dt);
				a.x += (a.tx - a.x) * k;
				a.y += (a.ty - a.y) * k;
				a.z += (a.tz - a.z) * k;
				a.yaw = lerpAng(a.yaw, a.tyaw, k);
				a.fall = a.state === "down" ? Math.min(1, a.fall + dt / .72) : 1;
				continue;
			}
			if (a.state === "down") stepDown(a, dt);
			else stepLive(a, dt, first);
		}
		for (let i = balls.length - 1; i >= 0; i--) {
			const b = balls[i];
			b.life -= dt;
			b.spin += dt * (b.kind === "car" ? 2.2 : 0);
			b.tilt += dt * (b.kind === "car" ? 1.4 : 0);
			b.vy -= (b.kind === "rocket" ? 4 : b.kind === "car" ? 9 : 12) * dt;
			if (b.kind === "laugh") {
				b.laughT -= dt;
				if (b.laughT <= 0) {
					b.laughT = .72;
					audio.giggle(b.x, b.y, b.z);
				}
			}
			const nx = b.x + b.vx * dt;
			const ny = b.y + b.vy * dt;
			const nz = b.z + b.vz * dt;
			const dist = Math.hypot(b.vx, b.vy, b.vz) * dt;
			const hit = dist > .001 ? rayAll(b.x, b.y, b.z, b.vx / (Math.hypot(b.vx, b.vy, b.vz) || 1), b.vy / (Math.hypot(b.vx, b.vy, b.vz) || 1), b.vz / (Math.hypot(b.vx, b.vy, b.vz) || 1), dist) : null;
			const reach = b.kind === "car" ? 1.45 : .8;
			let actorBounce = false;
			for (const a of actors) {
				if (a.id === b.owner || a.state !== "live") continue;
				if (Math.hypot(a.x - nx, a.y + .8 - ny, a.z - nz) < reach) actorBounce = true;
			}
			const pops = b.kind === "rocket" || b.life <= 0 || b.bounces >= 2 && (hit || actorBounce);
			if (hit || actorBounce || b.life <= 0) {
				if (pops) {
					if (b.kind === "laugh") {
						burst(b.x, b.y, b.z, 16769354, 8);
						explode(b.x, b.y, b.z, 3.2, b.dmg, b.owner, 0);
						for (let k = 0; k < 6; k++) smiles.push({
							x: b.x,
							y: b.y,
							z: b.z,
							vx: (Math.random() - .5) * 8,
							vy: 4 + Math.random() * 4,
							vz: (Math.random() - .5) * 8,
							life: 10
						});
					} else explode(hit ? hit.x : b.x, hit ? hit.y : b.y, hit ? hit.z : b.z, 4.4, b.dmg, b.owner, 1);
					balls.splice(i, 1);
				} else {
					b.bounces += 1;
					b.spin += b.kind === "car" ? 1.4 : 0;
					b.tilt += b.kind === "car" ? .8 : 0;
					const nxp = hit ? hit.nx : 0;
					const nyp = hit ? hit.ny : 1;
					const nzp = hit ? hit.nz : 0;
					const vn = b.vx * nxp + b.vy * nyp + b.vz * nzp;
					b.vx = (b.vx - 2 * vn * nxp) * .72;
					b.vy = (b.vy - 2 * vn * nyp) * .72;
					b.vz = (b.vz - 2 * vn * nzp) * .72;
					if (hit) {
						b.x = hit.x + nxp * .3;
						b.y = hit.y + nyp * .3;
						b.z = hit.z + nzp * .3;
					}
				}
			} else {
				b.x = nx;
				b.y = ny;
				b.z = nz;
			}
		}
		for (let i = drones.length - 1; i >= 0; i--) {
			const d = drones[i];
			d.life -= dt;
			let foe = null;
			let bd = 30;
			for (const a of actors) {
				if (a.state !== "live" || a.team === d.team) continue;
				const dist = Math.hypot(a.x - d.x, a.z - d.z);
				if (dist < bd) {
					bd = dist;
					foe = a;
				}
			}
			if (foe) {
				d.x += (foe.x - d.x) / (bd || 1) * 10 * dt;
				d.y += (foe.y + 1 - d.y) * 2 * dt;
				d.z += (foe.z - d.z) / (bd || 1) * 10 * dt;
				if (bd < 1.3) {
					explode(d.x, d.y, d.z, 3.2, d.dmg, d.owner, 0);
					burst(d.x, d.y, d.z, 16777215, 12);
					drones.splice(i, 1);
					continue;
				}
			}
			if (d.life <= 0) drones.splice(i, 1);
		}
		smileSnd -= dt;
		for (let i = smiles.length - 1; i >= 0; i--) {
			const s = smiles[i];
			s.life -= dt;
			s.vy -= 10 * dt;
			s.x += s.vx * dt;
			s.y += s.vy * dt;
			s.z += s.vz * dt;
			if (s.y < .3) {
				s.y = .3;
				s.vy = Math.abs(s.vy) * .6;
				s.vx *= .8;
				s.vz *= .8;
			}
			if (s.life <= 0) smiles.splice(i, 1);
		}
		if (smiles.length && smileSnd <= 0) {
			smileSnd = .7;
			audio.laughAt(smiles[0].x, smiles[0].y, smiles[0].z);
		}
		for (const d of dyn) {
			if (!d.alive) continue;
			if (d.kind === "turret") {
				d.cool -= dt;
				d.yaw += dt;
				const cx = (d.minX + d.maxX) / 2;
				const cy = d.maxY + .4;
				const cz = (d.minZ + d.maxZ) / 2;
				let foe = null;
				let bd = 26;
				for (const a of actors) {
					if (a.state !== "live" || a.team === d.team) continue;
					const dist = Math.hypot(a.x - cx, a.z - cz);
					if (dist < bd) {
						bd = dist;
						foe = a;
					}
				}
				if (foe && d.cool <= 0) {
					d.cool = .38;
					const dx = foe.x - cx;
					const dy = foe.y + 1 - cy;
					const dz = foe.z - cz;
					const L = Math.hypot(dx, dy, dz) || 1;
					const hit = trace(cx, cy, cz, dx / L, dy / L, dz / L, 28, foe);
					tracers.push({
						x1: cx,
						y1: cy,
						z1: cz,
						x2: foe.x,
						y2: foe.y + 1,
						z2: foe.z,
						life: .06,
						max: .06,
						color: TEAMS[d.team].hex
					});
					if (hit?.actor) hurt(hit.actor, 8, null, false);
				}
			}
			if (d.kind === "mine") for (const a of actors) {
				if (a.state !== "live" || a.team === d.team) continue;
				if (Math.hypot(a.x - (d.minX + d.maxX) / 2, a.z - (d.minZ + d.maxZ) / 2) < 1.35) {
					explode((d.minX + d.maxX) / 2, d.maxY, (d.minZ + d.maxZ) / 2, 3.6, 50, -1, 0);
					d.alive = false;
				}
			}
		}
		const counts = [
			0,
			0,
			0
		];
		for (const a of actors) {
			if (a.state !== "live") continue;
			if (a.y > world.hill.y - 1.4 && Math.hypot(a.x - world.hill.x, a.z - world.hill.z) < world.hill.r) counts[a.team] += 1;
		}
		const present = counts.filter((n) => n > 0).length;
		if (present === 1) {
			const team = counts.findIndex((n) => n > 0);
			if (hillOwner !== team) {
				hillOwner = team;
				hillTime = 0;
				surged = false;
				boost = false;
				line(`${TEAMS[team].name} holds the hill`, true);
			} else hillTime += dt;
			hillEmpty = 0;
			if (hillTime >= 10) hillScore[team] += dt / 10;
			if (hillTime >= 120 && !surged) {
				surged = true;
				boost = true;
				line(`${TEAMS[team].name} speed surge`, true);
			}
			if (hillTime >= 120) boost = true;
		} else if (present === 0) {
			hillEmpty += dt;
			if (hillEmpty > 6) {
				hillOwner = -1;
				hillTime = 0;
				boost = false;
				surged = false;
			}
		}
		if (boost) {
			for (const a of actors) if (a.team === hillOwner && a.state === "live" && Math.random() < .3) parts.push({
				x: a.x,
				y: a.y + 1.2,
				z: a.z,
				vx: 0,
				vy: 1.5,
				vz: 0,
				life: .6,
				max: .6,
				color: 11992938
			});
		}
		for (let i = parts.length - 1; i >= 0; i--) {
			const p = parts[i];
			p.life -= dt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.z += p.vz * dt;
			p.vy -= 2 * dt;
			if (p.life <= 0) parts.splice(i, 1);
		}
		for (let i = tracers.length - 1; i >= 0; i--) {
			tracers[i].life -= dt;
			if (tracers[i].life <= 0) tracers.splice(i, 1);
		}
		for (const c of corpses) c.life -= dt;
		for (let i = corpses.length - 1; i >= 0; i--) if (corpses[i].life <= 0 || corpses[i].used) corpses.splice(i, 1);
		for (let i = actors.length - 1; i >= 0; i--) if (actors[i].state === "gone") actors.splice(i, 1);
		if (player && playing && !spectate) {
			const moving = Math.hypot(player.vx, player.vz) > 1.2 && player.grounded;
			audio.tick(dt, weather, moving, player.inWater);
		}
		if (playing) {
			commentT -= dt;
			if (commentT <= 0) {
				commentT = 11;
				audio.comment(pickComment());
			}
		}
		if (weather === "rain" || weather === "snow") {
			const cam = spectate ? fly : player || {
				x: 0,
				y: 10,
				z: 0
			};
			if (parts.length < 300 && Math.random() < .8) parts.push({
				x: cam.x + (Math.random() - .5) * 30,
				y: cam.y + 12,
				z: cam.z + (Math.random() - .5) * 30,
				vx: weather === "snow" ? .2 : -1,
				vy: weather === "snow" ? -2 : -14,
				vz: 0,
				life: 1.2,
				max: 1.2,
				color: weather === "snow" ? 16777215 : 10474751
			});
		}
		if (playing && player && player.state === "live") {
			chatterT -= dt;
			if (chatterT <= 0) {
				chatterT = 7 + Math.random() * 5;
				say(player, "idle");
			}
		}
		if (playing && player && player.state === "live" && player.charId === "laile") {
			rambleT -= dt;
			if (rambleT <= 0) {
				rambleT = 9;
				say(player, RAMBLE[rambleI % RAMBLE.length] || "still talking");
				rambleI++;
			}
		}
		netAcc += dt;
		if (token && player) {
			const nowMs = performance.now();
			if ((pendingShots.length > 0 || player.pendingXp > 0 || player.pendingK > 0 || Math.hypot(player.vx, player.vz) > .4 || afkFix) && netAcc > .28) {
				netAcc = 0;
				lastNet = nowMs;
				const fixing = afkFix;
				afkFix = false;
				const dxp = player.pendingXp;
				const dk = player.pendingK;
				const dd = player.pendingD;
				const dc = player.pendingC;
				player.pendingXp = 0;
				player.pendingK = 0;
				player.pendingD = 0;
				player.pendingC = 0;
				const shots = pendingShots.splice(0, 8);
				const mine = ++pulseGen;
				netPulse({
					token,
					x: player.x,
					y: player.y,
					z: player.z,
					yaw: player.yaw,
					hp: player.hp,
					dxp,
					dk,
					dd,
					dc,
					shots,
					fix: fixing
				}).then((res) => {
					if (mine !== pulseGen || !player) return;
					if (!res.ok) {
						player.pendingXp += dxp;
						if (/session|unknown/i.test(res.error)) dropRelay();
						return;
					}
					player.xp = Math.max(player.xp, res.xp + player.pendingXp);
					syncHumans(res.humans);
					for (const s of res.shots) {
						if (seenShots.has(s.id) || !player) continue;
						seenShots.add(s.id);
						if (sphereT(s.ox, s.oy, s.oz, s.dx, s.dy, s.dz, player.x, player.y + .9, player.z, 1.5, 80) != null && s.team !== player.team) hurt(player, s.dmg, null, false);
						tracers.push({
							x1: s.ox,
							y1: s.oy,
							z1: s.oz,
							x2: s.ox + s.dx * 20,
							y2: s.oy + s.dy * 20,
							z2: s.oz + s.dz * 20,
							life: .08,
							max: .08,
							color: TEAMS[s.team]?.hex || 16777215
						});
					}
				}).catch(() => {
					if (mine !== pulseGen) return;
					if (player) player.pendingXp += dxp;
				});
			} else if (nowMs - lastNet > 1e3) {
				lastNet = nowMs;
				sendRelayNop();
			}
		}
	}
	function syncHumans(humans) {
		const names = new Set(humans.map((h) => h.nick));
		for (const h of linked) if (!player || h.nick !== player.name) names.add(h.nick);
		for (const a of actors) {
			if (!a.remote) continue;
			if (!names.has(a.name)) a.state = "gone";
		}
		for (const h of humans) {
			if (player && h.nick === player.name) continue;
			let a = actors.find((x) => x.remote && x.name === h.nick);
			if (!a) {
				a = makeActor({
					name: h.nick,
					team: h.team,
					charId: CHAR_BY_ID[h.charId] ? h.charId : "angel",
					remote: true,
					x: h.x,
					y: h.y,
					z: h.z,
					yaw: h.yaw,
					xp: h.xp ?? h.lvl * 80,
					hp: h.hp
				});
				actors.push(a);
			}
			a.tx = h.x;
			a.ty = h.y;
			a.tz = h.z;
			a.tyaw = h.yaw;
			a.hp = h.hp;
			a.team = h.team;
			if (typeof h.kills === "number") a.kills = h.kills;
			if (typeof h.deaths === "number") a.deaths = h.deaths;
			if (typeof h.xp === "number") a.xp = Math.max(a.xp, h.xp);
			const next = h.hp <= 0 ? "down" : "live";
			if (a.state !== "down" && next === "down") a.fall = 0;
			if (next === "live") a.fall = 1;
			a.state = next;
		}
	}
	function sampleInput() {
		const jump = held("Space") || touch.jump;
		const act = held("KeyF") || touch.act;
		const cycle = held("KeyG") || touch.cycle;
		edges.jump = jump && !was.jump;
		edges.act = act && !was.act;
		edges.cycle = cycle && !was.cycle;
		edges.dash = (held("ShiftLeft") || held("ShiftRight") || touch.dash) && !shiftWas;
		if (edges.cycle && player && playing && !menu) {
			player.build = (player.build + 1) % BUILD_ACTIONS.length;
			line(BUILD_ACTIONS[player.build].name);
		}
		was.jump = jump;
		was.act = act;
		was.cycle = cycle;
		shiftWas = held("ShiftLeft") || held("ShiftRight") || touch.dash;
		edges.slot = -1;
		for (let i = 0; i < 4; i++) if (held(`Digit${i + 1}`)) edges.slot = i;
	}
	let shiftWas = false;
	function figureSpec(actor, x, y, z, ease, charId) {
		const ch = CHAR_BY_ID[actor?.charId || charId || "angel"] || CHARACTERS[0];
		const look = lookOf(ch);
		const sheep = (actor?.sheep || 0) > 0;
		const gray = !!actor && actor.hp === 0 && actor.state !== "down";
		const down = !actor || actor.state === "down" || ease > .95;
		const mood = actor?.mood || "";
		const talking = mood === "talk" || mood === "angry" || mood === "cry" || mood === "exclaim" || mood === "wave" || mood === "happy" || (actor?.speechT || 0) > 0;
		let lookYaw = 0;
		if (actor && Math.abs(actor.lookX) + Math.abs(actor.lookZ) > .1) {
			const dx = actor.lookX - actor.x;
			const dz = actor.lookZ - actor.z;
			let d = Math.atan2(-dx, -dz) - actor.yaw;
			while (d > Math.PI) d -= Math.PI * 2;
			while (d < -Math.PI) d += Math.PI * 2;
			lookYaw = clamp(d, -1.1, 1.1);
		}
		const angry = mood === "angry";
		const skin = gray ? 10132122 : angry ? lerpHex(ch.skin, 6950944, .72) : ch.skin;
		return {
			x,
			y,
			z,
			yaw: actor?.yaw ?? 0,
			dt: frameDt,
			speed: actor ? Math.hypot(actor.vx, actor.vz) : 0,
			vy: actor?.vy ?? 0,
			grounded: actor ? actor.grounded : true,
			climb: !!actor?.climb,
			dash: !!actor && (actor.lunge > 0 || actor.roll > 0),
			down,
			fall: actor?.state === "down" ? actor.fall : ease,
			bounce: !!actor && actor.grounded && actor.sinceLand < .16,
			sheep,
			scale: (ch.id === "rock" ? 1.16 : ch.style === "round" || sheep ? 1.12 : look.petite) * (actor?.flat ? 1.05 : 1),
			squash: actor?.flat ? .72 : 1,
			skin,
			hair: gray ? 7829367 : ch.hair,
			cloth: gray ? 9079434 : ch.cloth,
			hairLen: sheep ? .25 : .45 + look.hair[1],
			skirt: sheep ? 0 : look.skirt,
			wings: gray || sheep ? 0 : look.wings,
			wingColor: look.wingColor,
			halo: ch.ability === "glide" && !gray && !down && !sheep,
			gun: !down && !sheep && !gray && !actor?.minion,
			id: actor?.id ?? -1,
			mood,
			mouth: talking ? Math.floor(performance.now() / 200) % 2 : -1,
			veins: angry ? Math.round(actor?.veins || 3) : 0,
			look: lookYaw,
			angry,
			sunX: lightX,
			sunY: Math.max(-.2, lightY),
			sunZ: lightZ,
			lean: actor && !down ? clamp((actor.climb ? .55 : 0) + (actor.grounded ? 0 : -actor.vy * .045), -.65, .7) : 0,
			bank: actor && !down ? clamp(-(actor.vx * Math.cos(actor.yaw) + actor.vz * -Math.sin(actor.yaw)) * .055, -.42, .42) : 0
		};
	}
	function lerpHex(a, b, t) {
		const ar = a >> 16 & 255;
		const ag = a >> 8 & 255;
		const ab = a & 255;
		const br = b >> 16 & 255;
		const bg = b >> 8 & 255;
		const bb = b & 255;
		const r = Math.round(ar + (br - ar) * t);
		const g = Math.round(ag + (bg - ag) * t);
		const bl = Math.round(ab + (bb - ab) * t);
		return r << 16 | g << 8 | bl;
	}
	function skyBody(hoursF, date) {
		const lat = 35.2 * Math.PI / 180;
		const solar = hoursF + (-115.5 / 15 - -8);
		const n = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(), 0, 0)) / 864e5);
		const decl = .4093 * Math.sin(2 * Math.PI * (284 + n) / 365);
		const H = (solar - 12) * 15 * Math.PI / 180;
		const alt = Math.asin(clamp(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H), -1, 1));
		let az = Math.acos(clamp((Math.sin(decl) * Math.cos(lat) - Math.cos(decl) * Math.sin(lat) * Math.cos(H)) / Math.max(.08, Math.cos(alt)), -1, 1));
		if (H > 0) az = Math.PI * 2 - az;
		const cosA = Math.cos(alt);
		const phase = n % 29.53 / 29.53 * Math.PI * 2;
		const mH = H + Math.PI * (1 + .08 * Math.sin(phase));
		const mDecl = decl * .35 + Math.sin(phase) * .08;
		const mAlt = Math.asin(clamp(Math.sin(lat) * Math.sin(mDecl) + Math.cos(lat) * Math.cos(mDecl) * Math.cos(mH), -1, 1));
		let mAz = Math.acos(clamp((Math.sin(mDecl) * Math.cos(lat) - Math.cos(mDecl) * Math.sin(lat) * Math.cos(mH)) / Math.max(.08, Math.cos(mAlt)), -1, 1));
		if (Math.sin(mH) > 0) mAz = Math.PI * 2 - mAz;
		const mCos = Math.cos(mAlt);
		return {
			sun: {
				x: cosA * Math.sin(az),
				y: Math.sin(alt),
				z: cosA * Math.cos(az),
				alt
			},
			moon: {
				x: mCos * Math.sin(mAz),
				y: Math.sin(mAlt),
				z: mCos * Math.cos(mAz),
				alt: mAlt
			}
		};
	}
	function paintSky(day, season) {
		const pal = season === "Summer" ? [
			.2,
			.48,
			.92,
			1,
			.7,
			.28
		] : season === "Autumn" ? [
			.38,
			.28,
			.55,
			.96,
			.4,
			.18
		] : season === "Winter" ? [
			.5,
			.62,
			.78,
			.78,
			.84,
			.92
		] : [
			.32,
			.58,
			.95,
			1,
			.68,
			.55
		];
		const night = 1 - day;
		const attr = skyGeo.attributes.color;
		for (let i = 0; i < skyPos.count; i++) {
			const elev = skyPos.getY(i) / 380;
			const t = elev < 0 ? 0 : Math.pow(clamp(elev / .5, 0, 1), .6);
			const hr = pal[3] * (1 - t) + pal[0] * t;
			const hg = pal[4] * (1 - t) + pal[1] * t;
			const hb = pal[5] * (1 - t) + pal[2] * t;
			const nr = .1 * (1 - t) + .02 * t;
			const ng = .12 * (1 - t) + .03 * t;
			const nb = .26 * (1 - t) + .08 * t;
			attr.setXYZ(i, hr * day + nr * night, hg * day + ng * night, hb * day + nb * night);
		}
		attr.needsUpdate = true;
	}
	function streamPoint(stream, t) {
		const pts = stream.pts;
		if (pts.length < 2) return pts[0] || {
			x: 0,
			y: 8,
			z: 0
		};
		const span = (pts.length - 1) * t;
		const i = Math.min(pts.length - 2, Math.floor(span));
		const f = span - i;
		const a = pts[i];
		const b = pts[i + 1];
		return {
			x: a.x + (b.x - a.x) * f,
			y: a.y + (b.y - a.y) * f,
			z: a.z + (b.z - a.z) * f
		};
	}
	function render() {
		const c = clockParts();
		const body = skyBody(c.hoursF, c.date);
		const sunV = tmp.set(body.sun.x, body.sun.y, body.sun.z);
		if (sunV.lengthSq() < .001) sunV.set(.2, .2, .2);
		sunV.normalize();
		const day = MathUtils.smoothstep(body.sun.alt, -.18, .28);
		const night = 1 - day;
		const moonUp = MathUtils.smoothstep(body.moon.alt, -.05, .25) * night;
		paintSky(day, c.season);
		skyMat.color.setRGB(1, 1, 1);
		hemi.intensity = .22 + day * .55 + moonUp * .18;
		hemi.color.set(day > .45 ? c.season === "Autumn" ? 16760970 : c.season === "Winter" ? 14017778 : 13625087 : 2371652);
		hemi.groundColor.set(c.season === "Winter" ? 12964060 : c.season === "Autumn" ? 9067058 : c.season === "Summer" ? 13017674 : 8301141);
		sun.intensity = Math.max(0, body.sun.alt) * (weather === "rain" ? .45 : 1.35);
		sun.position.copy(sunV).multiplyScalar(80);
		sun.color.set(c.season === "Summer" ? 16773314 : c.season === "Winter" ? 16774890 : 16769200);
		lightX = sunV.x;
		lightY = body.sun.alt > .02 ? sunV.y : body.moon.y;
		lightZ = body.sun.alt > .02 ? sunV.z : body.moon.z;
		if (body.sun.alt <= .02) {
			const mlen = Math.hypot(body.moon.x, body.moon.y, body.moon.z) || 1;
			lightX = body.moon.x / mlen;
			lightY = Math.max(.08, body.moon.y / mlen);
			lightZ = body.moon.z / mlen;
		}
		sunDisc.position.copy(sunV).multiplyScalar(210);
		sunDisc.scale.setScalar(1.7);
		sunDisc.visible = body.sun.alt > -.08;
		sunDisc.material.color.set(body.sun.alt > .15 ? 16774856 : 16751202);
		moonDisc.position.set(body.moon.x, body.moon.y, body.moon.z).normalize().multiplyScalar(230);
		moonDisc.visible = body.moon.alt > -.05;
		moonDisc.material.color.setHSL(.62, .15, .78 + .15 * Math.sin(c.date.getUTCDate() % 29 / 29 * Math.PI));
		moon.intensity = moonUp * .55;
		moon.position.set(body.moon.x, body.moon.y, body.moon.z).normalize().multiplyScalar(70);
		stars.material.opacity = night * (weather === "rain" ? .15 : .95);
		meteorIn -= frameDt;
		if (meteorIn <= 0 && night > .4) {
			meteorIn = 14 + Math.random() * 22;
			meteor.visible = true;
			meteor.userData.life = 1.3;
			meteor.userData.x = (Math.random() - .5) * 180;
			meteor.userData.y = 70 + Math.random() * 30;
			meteor.userData.z = -40 - Math.random() * 80;
		}
		if (meteor.visible) {
			meteor.userData.life -= frameDt;
			meteor.userData.x += frameDt * 46;
			meteor.userData.y -= frameDt * 28;
			meteor.position.set(meteor.userData.x, meteor.userData.y, meteor.userData.z);
			meteor.lookAt(meteor.position.x + 1, meteor.position.y - .6, meteor.position.z);
			if (meteor.userData.life <= 0) meteor.visible = false;
		}
		const camPos = camera.position;
		flares.forEach((flare, i) => {
			flare.visible = day > .35 && weather !== "rain" && weather !== "snow";
			flare.position.copy(sunDisc.position).lerp(camPos, .18 + i * .16);
			flare.lookAt(camPos);
			flare.rotation.z += frameDt * (.4 + i);
		});
		clouds.position.x = Math.sin(performance.now() / 7e3) * 10;
		clouds.position.z = Math.cos(performance.now() / 9e3) * 4;
		for (const ribbon of windLines) {
			const stream = world.streams[ribbon.stream];
			if (!stream) continue;
			ribbon.t = (ribbon.t + frameDt * .18) % 1;
			const attr = ribbon.line.geometry.attributes.position;
			for (let s = 0; s < 6; s++) {
				const p = streamPoint(stream, (ribbon.t + s * .035) % 1);
				const wobble = Math.sin(performance.now() / 400 + s + ribbon.t * 8) * .35;
				attr.setXYZ(s, p.x + wobble, p.y + .4, p.z);
			}
			attr.needsUpdate = true;
		}
		const span = playing && player ? 36 : 90;
		sun.shadow.camera.left = -span;
		sun.shadow.camera.right = span;
		sun.shadow.camera.top = span;
		sun.shadow.camera.bottom = -span;
		sun.shadow.camera.far = playing ? 100 : 160;
		sun.shadow.camera.updateProjectionMatrix();
		if (player) sun.target.position.set(player.x, player.y, player.z);
		else sun.target.position.set(0, 4, 0);
		sun.target.updateMatrixWorld();
		const fog = scene.fog;
		fog.color.set(weather === "rain" ? 7240840 : weather === "snow" ? 14016746 : day > .35 ? c.season === "Autumn" ? 14721136 : c.season === "Winter" ? 14017262 : c.season === "Summer" ? 15780234 : 9356526 : 1713988);
		fog.near = weather === "rain" ? 70 : 130;
		fog.far = weather === "rain" ? 220 : 380;
		const tr = trainPose(trainAng);
		train.position.set(tr.x, tr.y + .4, tr.z);
		train.rotation.y = -trainAng;
		flags.forEach((f, i) => {
			const pole = flagMeshes[i * 2];
			const cloth = flagMeshes[i * 2 + 1];
			pole.position.set(f.x, f.y + .4, f.z);
			cloth.position.set(f.x + .6, f.y + 1.1, f.z);
			cloth.rotation.y = performance.now() / 400 + i;
		});
		world.meds.forEach((m, i) => {
			const up = medState[i] <= 0;
			mat.compose(pos.set(m.x, up ? m.y + .7 + Math.sin(performance.now() / 300 + i) * .08 : -20, m.z), quat.identity(), scl.set(up ? 1 : .01, up ? 1 : .01, up ? 1 : .01));
			medBox.setMatrixAt(i, mat);
			col.setHex(16734824);
			medBox.setColorAt(i, col);
		});
		medBox.count = world.meds.length;
		medBox.instanceMatrix.needsUpdate = true;
		if (medBox.instanceColor) medBox.instanceColor.needsUpdate = true;
		let di = 0;
		for (const d of dyn) {
			if (!d.alive || di >= 80) continue;
			const w = d.maxX - d.minX;
			const h = d.maxY - d.minY;
			const dz = d.maxZ - d.minZ;
			eul.set(0, d.kind === "turret" ? d.yaw : 0, 0);
			quat.setFromEuler(eul);
			mat.compose(pos.set((d.minX + d.maxX) / 2, (d.minY + d.maxY) / 2, (d.minZ + d.maxZ) / 2), quat, scl.set(w, h, dz));
			dynMesh.setMatrixAt(di, mat);
			col.setHex(d.color);
			dynMesh.setColorAt(di, col);
			di++;
		}
		dynMesh.count = di;
		dynMesh.instanceMatrix.needsUpdate = true;
		if (dynMesh.instanceColor) dynMesh.instanceColor.needsUpdate = true;
		const draw = [];
		for (const a of actors) if (a.state !== "gone") draw.push({ a });
		for (const c of corpses) if (!c.used) draw.push({
			a: null,
			corpse: c
		});
		const n = Math.min(MAX, draw.length);
		let zi = 0;
		for (let i = 0; i < n; i++) {
			const slot = draw[i];
			const a = slot.a;
			const corpse = slot.corpse;
			const x = a?.x ?? corpse.x;
			const y = a?.y ?? corpse.y;
			const z = a?.z ?? corpse.z;
			const ease = corpse ? 1 : a?.state === "down" ? a.fall * a.fall * (3 - 2 * a.fall) : 0;
			if (a?.minion) {
				pilots.hide(i);
				if (zi < 48) mutants.place(zi++, figureSpec(a, x, y, z, ease));
				continue;
			}
			pilots.place(i, figureSpec(a, x, y, z, ease, corpse?.charId));
		}
		pilots.hideFrom(n);
		mutants.hideFrom(zi);
		for (const mesh of [
			bodyM,
			headM,
			hairM,
			hairBackM,
			hairLM,
			hairRM,
			handM,
			handRM,
			footM,
			footRM,
			haloM,
			blobM,
			skirtM,
			wingLM,
			wingRM,
			packM,
			gunM
		]) mesh.count = 0;
		faceM.count = 0;
		for (const mesh of [
			zBody,
			zHump,
			zHead,
			zJaw,
			zArmL,
			zArmR,
			zForeL,
			zForeR,
			zHandL,
			zHandR,
			zClawL,
			zClawR,
			zClawL2,
			zClawR2,
			zClawL3,
			zClawR3,
			zLegL,
			zLegR,
			zShinL,
			zShinR,
			zFootL,
			zFootR,
			zNeck,
			zBrow,
			zEarL,
			zEarR,
			zRib,
			zSpike,
			zBump,
			zBand,
			zShoulderL,
			zShoulderR,
			zRagL,
			zRagR
		]) mesh.count = 0;
		zEye.count = 0;
		zFace.count = 0;
		let ballShown = 0;
		balls.forEach((b) => {
			if (b.kind === "car") return;
			if (ballShown >= 40) return;
			mat.compose(pos.set(b.x, b.y, b.z), quat.identity(), scl.set(1, 1, 1));
			ballM.setMatrixAt(ballShown, mat);
			col.setHex(b.kind === "rocket" ? 16738877 : b.kind === "laugh" ? 16769354 : 8057087);
			ballM.setColorAt(ballShown, col);
			ballShown += 1;
		});
		ballM.count = ballShown;
		ballM.instanceMatrix.needsUpdate = true;
		if (ballM.instanceColor) ballM.instanceColor.needsUpdate = true;
		const carCounts = carPools.map(() => 0);
		for (const b of balls) {
			if (b.kind !== "car") continue;
			const mi = b.model % carPools.length;
			const slot = carCounts[mi];
			if (slot >= 8) continue;
			carCounts[mi] = slot + 1;
			eul.set(b.tilt, b.face, b.spin, "YXZ");
			quat.setFromEuler(eul);
			mat.compose(pos.set(b.x, b.y, b.z), quat, scl.set(1, 1, 1));
			carPools[mi].setMatrixAt(slot, mat);
		}
		carPools.forEach((mesh, i) => {
			mesh.count = carCounts[i] || 0;
			mesh.instanceMatrix.needsUpdate = true;
		});
		drones.forEach((d, i) => {
			if (i >= 16) return;
			mat.compose(pos.set(d.x, d.y, d.z), quat.identity(), scl.set(1, 1, 1));
			droneM.setMatrixAt(i, mat);
			col.setHex(2239027);
			droneM.setColorAt(i, col);
		});
		droneM.count = Math.min(16, drones.length);
		droneM.instanceMatrix.needsUpdate = true;
		smiles.forEach((s, i) => {
			if (i >= 28) return;
			const spin = quat.setFromEuler(eul.set(0, performance.now() / 200, 0));
			mat.compose(pos.set(s.x, s.y, s.z), spin, scl.set(1, 1, 1));
			smileM.setMatrixAt(i, mat);
		});
		smileM.count = Math.min(28, smiles.length);
		smileM.instanceMatrix.needsUpdate = true;
		let ti = 0;
		for (const trc of tracers) {
			if (ti >= 80) break;
			const o = ti * 6;
			tPos[o] = trc.x1;
			tPos[o + 1] = trc.y1;
			tPos[o + 2] = trc.z1;
			tPos[o + 3] = trc.x2;
			tPos[o + 4] = trc.y2;
			tPos[o + 5] = trc.z2;
			col.setHex(trc.color);
			const a = trc.life / trc.max;
			for (let k = 0; k < 2; k++) {
				tCol[o + k * 3] = col.r * a;
				tCol[o + k * 3 + 1] = col.g * a;
				tCol[o + k * 3 + 2] = col.b * a;
			}
			ti++;
		}
		tGeo.getAttribute("position").needsUpdate = true;
		tGeo.getAttribute("color").needsUpdate = true;
		tGeo.setDrawRange(0, ti * 2);
		for (let i = 0; i < 400; i++) {
			const p = parts[i];
			const o = i * 3;
			if (!p) {
				pPos[o + 1] = -50;
				continue;
			}
			pPos[o] = p.x;
			pPos[o + 1] = p.y;
			pPos[o + 2] = p.z;
			col.setHex(p.color);
			pCol[o] = col.r;
			pCol[o + 1] = col.g;
			pCol[o + 2] = col.b;
		}
		pGeo.getAttribute("position").needsUpdate = true;
		pGeo.getAttribute("color").needsUpdate = true;
		const w = view.clientWidth || 1;
		const h = view.clientHeight || 1;
		if (camera.aspect !== w / h) {
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
		}
		if (spectate) {
			camera.position.set(fly.x, fly.y, fly.z);
			camera.lookAt(fly.x - Math.sin(fly.yaw) * Math.cos(fly.pitch), fly.y + Math.sin(fly.pitch), fly.z - Math.cos(fly.yaw) * Math.cos(fly.pitch));
			if (camera.fov !== 74) {
				camera.fov = 74;
				camera.updateProjectionMatrix();
			}
			gun.visible = false;
		} else if (playing && player && player.state !== "gone") {
			const dist = scope ? 2.5 : 6.4;
			const lookYh = player.y + 1.45;
			const cy = Math.cos(pitch);
			const lx = -Math.sin(player.yaw) * cy;
			const ly = Math.sin(pitch);
			const lz = -Math.cos(player.yaw) * cy;
			const rx = Math.cos(player.yaw);
			const rz = -Math.sin(player.yaw);
			let cx = player.x - lx * dist + rx * .65;
			let cyw = lookYh - ly * dist + .45;
			let cz = player.z - lz * dist + rz * .65;
			const dx = cx - player.x;
			const dy = cyw - lookYh;
			const dz = cz - player.z;
			const len = Math.hypot(dx, dy, dz) || 1;
			const block = rayAll(player.x, lookYh, player.z, dx / len, dy / len, dz / len, len);
			if (block && block.t < len) {
				cx = player.x + dx / len * Math.max(.6, block.t - .3);
				cyw = lookYh + dy / len * Math.max(.6, block.t - .3);
				cz = player.z + dz / len * Math.max(.6, block.t - .3);
			}
			const bob = player.grounded ? Math.sin(player.anim * 2) * .04 : 0;
			camera.position.set(cx + (Math.random() - .5) * shake, cyw + bob + (Math.random() - .5) * shake, cz);
			camera.lookAt(player.x, lookYh, player.z);
			const fov = scope ? 18 : 74;
			if (camera.fov !== fov) {
				camera.fov = fov;
				camera.updateProjectionMatrix();
			}
			shake *= .9;
			const id = loadout(charOf(player))[player.weapon] || "plasma";
			if (id !== gunId) {
				gunId = id;
				gun.clear();
				const matG = new MeshBasicMaterial({ color: id === "flame" ? 16738877 : 10135485 });
				const body = new Mesh(new BoxGeometry(.18, .16, .7), matG);
				body.position.set(.32, -.24, -.55);
				gun.add(body);
				if (id === "dual" || id === "sniper") {
					const b2 = new Mesh(new BoxGeometry(id === "sniper" ? .08 : .16, .14, id === "sniper" ? 1.05 : .55), matG);
					b2.position.set(id === "dual" ? .12 : .34, -.22, id === "sniper" ? -.85 : -.5);
					gun.add(b2);
				}
			}
			gun.visible = !scope;
			viewCam.aspect = w / h;
			viewCam.fov = camera.fov;
			viewCam.updateProjectionMatrix();
		} else {
			const ang = performance.now() / 1e3 * .07;
			camera.position.set(Math.sin(ang) * 46, 26, Math.cos(ang) * 46);
			camera.lookAt(0, 7, -6);
			gun.visible = false;
		}
		renderer.setSize(w, h, false);
		audio.setListener(camera.position.x, camera.position.y, camera.position.z);
		renderer.render(scene, camera);
		drawOverlay(w, h);
	}
	function drawOverlay(w, h) {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		if (overlay.width !== Math.floor(w * dpr) || overlay.height !== Math.floor(h * dpr)) {
			overlay.width = Math.floor(w * dpr);
			overlay.height = Math.floor(h * dpr);
		}
		const ctx = overlay.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		if (!playing || !player) return;
		if (showMap) {
			drawMap(ctx, w, h);
			return;
		}
		const cx = w / 2;
		const cy = h / 2;
		ctx.strokeStyle = "rgba(244,241,228,0.9)";
		ctx.lineWidth = 2;
		const gap = scope ? 4 : 7;
		const len = scope ? 14 : 8;
		ctx.beginPath();
		ctx.moveTo(cx - gap - len, cy);
		ctx.lineTo(cx - gap, cy);
		ctx.moveTo(cx + gap, cy);
		ctx.lineTo(cx + gap + len, cy);
		ctx.moveTo(cx, cy - gap - len);
		ctx.lineTo(cx, cy - gap);
		ctx.moveTo(cx, cy + gap);
		ctx.lineTo(cx, cy + gap + len);
		ctx.stroke();
		if (spectate) {
			ctx.fillStyle = "#f4f1e4";
			ctx.font = "600 14px Outfit, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("Spectator   WASD fly   Space up   Ctrl down   V back", cx, 28);
		}
		if (hitMark > 0) {
			ctx.strokeStyle = hitHead ? "#ffe14a" : "#ffffff";
			ctx.beginPath();
			ctx.moveTo(cx - 10, cy - 10);
			ctx.lineTo(cx - 4, cy - 4);
			ctx.moveTo(cx + 10, cy - 10);
			ctx.lineTo(cx + 4, cy - 4);
			ctx.moveTo(cx - 10, cy + 10);
			ctx.lineTo(cx - 4, cy + 4);
			ctx.moveTo(cx + 10, cy + 10);
			ctx.lineTo(cx + 4, cy + 4);
			ctx.stroke();
			hitMark -= .016;
		}
		if (scope) {
			ctx.fillStyle = "rgba(6,8,10,0.62)";
			ctx.beginPath();
			ctx.rect(0, 0, w, h);
			ctx.arc(cx, cy, Math.min(w, h) * .28, 0, Math.PI * 2, true);
			ctx.fill("evenodd");
			ctx.strokeStyle = "rgba(198,227,90,0.85)";
			ctx.stroke();
		}
		if (player.hp < 40 && player.state === "live") {
			const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * .3, cx, cy, Math.min(w, h) * .7);
			g.addColorStop(0, "rgba(0,0,0,0)");
			g.addColorStop(1, "rgba(120,20,24,0.45)");
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, w, h);
		}
		for (const slot of actors.concat([])) {
			if (slot.state === "gone") continue;
			tmp.set(slot.x, slot.y + 2.15, slot.z).project(camera);
			if (tmp.z > 1) continue;
			const sx = (tmp.x * .5 + .5) * w;
			const jitter = (slot.name.charCodeAt(0) + slot.name.length * 3) % 5 * 4;
			const sy = (-tmp.y * .5 + .5) * h - jitter;
			if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue;
			const rank = rankForLevel(xpToLevel(slot.xp).lvl);
			const lvl = xpToLevel(slot.xp).lvl;
			ctx.font = "600 12px Outfit, sans-serif";
			ctx.textAlign = "center";
			ctx.fillStyle = TEAMS[slot.team].color;
			const label = `${rank.id}  ${slot.name}  ${lvl}`;
			ctx.fillText(label, sx, sy);
			const bw = 64;
			const hp = clamp(slot.hp / 100, 0, 1);
			ctx.fillStyle = "rgba(0,0,0,0.45)";
			ctx.fillRect(sx - bw / 2, sy + 4, bw, 5);
			ctx.fillStyle = slot.state === "down" ? "#111" : hp > .6 ? "#7dce4a" : hp > .3 ? "#f0a040" : "#e04b4b";
			ctx.fillRect(sx - bw / 2, sy + 4, bw * (slot.state === "down" ? 1 : hp), 5);
			if (slot.state === "down") {
				ctx.fillStyle = "#ffe14a";
				ctx.font = "700 16px Outfit, sans-serif";
				ctx.fillText("!", sx, sy - 16);
			}
			if (slot.speechT > 0) {
				ctx.fillStyle = "rgba(244,241,228,0.92)";
				ctx.font = "600 13px Fredoka, sans-serif";
				ctx.fillText(slot.speech, sx, sy - 28);
			}
			if (slot.mood) {
				const moodColor = slot.mood === "angry" ? "#c41828" : slot.mood === "depressed" ? "#6a7894" : slot.mood === "cry" ? "#6aa0d8" : slot.mood === "wave" || slot.mood === "happy" ? "#7dce4a" : slot.mood === "exclaim" ? "#f0c14a" : "#f4f1e4";
				ctx.save();
				ctx.translate(sx, sy - 46);
				ctx.fillStyle = moodColor;
				ctx.beginPath();
				ctx.moveTo(0, -10);
				ctx.lineTo(7, 0);
				ctx.lineTo(0, 10);
				ctx.lineTo(-7, 0);
				ctx.closePath();
				ctx.fill();
				if (slot.mood === "angry") {
					ctx.strokeStyle = "#3a0610";
					ctx.lineWidth = 1.4;
					ctx.beginPath();
					ctx.moveTo(-3, -2);
					ctx.lineTo(0, 3);
					ctx.lineTo(3, -1);
					ctx.stroke();
				}
				ctx.restore();
			}
		}
		if (!spectate) drawWeaponWheel(ctx, w, h);
		drawMini(ctx, w, h);
	}
	function drawWeaponWheel(ctx, w, h) {
		if (!player) return;
		const list = loadout(charOf(player));
		const n = list.length;
		if (!n) return;
		const sel = (player.weapon % n + n) % n;
		let delta = sel - wheelShown;
		if (delta > n / 2) delta -= n;
		if (delta < -n / 2) delta += n;
		wheelShown += delta * .22;
		if (Math.abs(delta) < .01) wheelShown = sel;
		gunKick *= .86;
		const cx = w / 2;
		const cy = h - 168;
		const t = performance.now() / 1e3;
		for (let i = 0; i < n; i++) {
			let off = i - wheelShown;
			if (off > n / 2) off -= n;
			if (off < -n / 2) off += n;
			if (Math.abs(off) > 2.2) continue;
			const near = Math.abs(off) < .35;
			const scale = (near ? 1.2 : .62) - Math.abs(off) * .08;
			const x = cx + off * 86;
			const y = cy + Math.abs(off) * 10 - (near ? Math.sin(t * 7) * 3 + gunKick * 14 : 0);
			drawWeaponIcon(ctx, list[i] || "plasma", x, y, scale, off * .42, near);
			ctx.font = "700 11px Fredoka, sans-serif";
			ctx.textAlign = "center";
			ctx.lineWidth = 3;
			ctx.strokeStyle = "#1a140c";
			ctx.fillStyle = near ? "#ffe14a" : "#f4f1e4";
			const num = String(i % 4 + 1);
			ctx.strokeText(num, x, y + 28 * Math.max(scale, .5));
			ctx.fillText(num, x, y + 28 * Math.max(scale, .5));
		}
		const name = WEAPON_BY_ID[list[sel] || "plasma"].name;
		ctx.font = "700 18px Fredoka, sans-serif";
		ctx.textAlign = "center";
		ctx.lineWidth = 5;
		ctx.strokeStyle = "#1a140c";
		ctx.fillStyle = "#fff6e4";
		ctx.strokeText(name, cx, cy - 46);
		ctx.fillText(name, cx, cy - 46);
	}
	function drawWeaponIcon(ctx, id, x, y, s, tilt, hot) {
		ctx.save();
		ctx.translate(x, y + (hot ? 0 : 4));
		ctx.rotate(tilt);
		ctx.scale(s, s);
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#1a140c";
		ctx.fillStyle = hot ? "#fff6e4" : "#d9d3c4";
		const accent = id === "flame" ? "#ff6a3d" : id === "rocket" ? "#ff5a68" : id === "sniper" ? "#c6e35a" : id === "laugh" ? "#ffe14a" : id === "bounce" ? "#3ec6ff" : "#7ec8ff";
		const mark = () => {
			ctx.fill();
			ctx.stroke();
		};
		if (id === "dual") {
			ctx.save();
			ctx.translate(-8, 2);
			ctx.rotate(-.4);
			ctx.fillRect(-4, -3, 16, 7);
			ctx.strokeRect(-4, -3, 16, 7);
			ctx.fillRect(8, -2, 8, 4);
			ctx.strokeRect(8, -2, 8, 4);
			ctx.restore();
			ctx.save();
			ctx.translate(6, 6);
			ctx.rotate(.35);
			ctx.fillRect(-4, -3, 16, 7);
			ctx.strokeRect(-4, -3, 16, 7);
			ctx.fillRect(8, -2, 8, 4);
			ctx.strokeRect(8, -2, 8, 4);
			ctx.restore();
		} else if (id === "sniper") {
			ctx.fillRect(-18, -3, 34, 6);
			ctx.strokeRect(-18, -3, 34, 6);
			ctx.fillStyle = accent;
			ctx.beginPath();
			ctx.arc(4, -7, 5, 0, Math.PI * 2);
			mark();
			ctx.fillStyle = "#fff6e4";
			ctx.fillRect(14, -2, 10, 4);
			ctx.strokeRect(14, -2, 10, 4);
		} else if (id === "rocket") {
			ctx.fillRect(-16, -5, 26, 10);
			ctx.strokeRect(-16, -5, 26, 10);
			ctx.fillStyle = accent;
			ctx.beginPath();
			ctx.moveTo(10, -7);
			ctx.lineTo(22, 0);
			ctx.lineTo(10, 7);
			ctx.closePath();
			mark();
			ctx.fillStyle = "#fff6e4";
			ctx.fillRect(-18, -8, 6, 4);
			ctx.strokeRect(-18, -8, 6, 4);
			ctx.fillRect(-18, 4, 6, 4);
			ctx.strokeRect(-18, 4, 6, 4);
		} else if (id === "bounce") {
			ctx.fillStyle = accent;
			ctx.beginPath();
			ctx.arc(0, 0, 12, 0, Math.PI * 2);
			mark();
			ctx.fillStyle = "#fff6e4";
			ctx.fillRect(-12, -3, 24, 6);
			ctx.strokeRect(-12, -3, 24, 6);
		} else if (id === "laugh") {
			ctx.fillStyle = accent;
			ctx.beginPath();
			ctx.arc(0, 0, 12, 0, Math.PI * 2);
			mark();
			ctx.fillStyle = "#1a140c";
			ctx.beginPath();
			ctx.arc(-4, -2, 1.6, 0, Math.PI * 2);
			ctx.arc(4, -2, 1.6, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(0, 2, 5, .15, Math.PI - .15);
			ctx.stroke();
		} else if (id === "flame") {
			ctx.fillRect(-3, 2, 6, 14);
			ctx.strokeRect(-3, 2, 6, 14);
			ctx.fillStyle = accent;
			ctx.beginPath();
			ctx.moveTo(0, -16);
			ctx.quadraticCurveTo(12, -2, 0, 6);
			ctx.quadraticCurveTo(-12, -2, 0, -16);
			mark();
		} else if (id === "knife") {
			ctx.fillStyle = "#e7eef2";
			ctx.beginPath();
			ctx.moveTo(-4, 8);
			ctx.lineTo(2, -16);
			ctx.lineTo(6, 8);
			ctx.closePath();
			mark();
			ctx.fillStyle = "#8a5a32";
			ctx.fillRect(-3, 8, 8, 8);
			ctx.strokeRect(-3, 8, 8, 8);
		} else if (id === "melee" || id === "bat") {
			ctx.rotate(-.6);
			ctx.fillStyle = "#e7c48a";
			ctx.beginPath();
			ctx.roundRect(-4, -16, 8, 28, 4);
			mark();
			ctx.fillStyle = "#8a5a32";
			ctx.fillRect(-3, 10, 6, 8);
			ctx.strokeRect(-3, 10, 6, 8);
		} else if (id === "drone") {
			ctx.fillStyle = accent;
			ctx.beginPath();
			ctx.arc(0, 0, 6, 0, Math.PI * 2);
			mark();
			for (const [dx, dy] of [
				[-10, -8],
				[10, -8],
				[-10, 8],
				[10, 8]
			]) {
				ctx.fillStyle = "#fff6e4";
				ctx.beginPath();
				ctx.arc(dx, dy, 4, 0, Math.PI * 2);
				mark();
			}
		} else {
			ctx.fillRect(-14, -4, 22, 8);
			ctx.strokeRect(-14, -4, 22, 8);
			ctx.fillStyle = accent;
			ctx.fillRect(6, -3, 12, 5);
			ctx.strokeRect(6, -3, 12, 5);
			ctx.fillStyle = "#fff6e4";
			ctx.fillRect(-6, 4, 5, 8);
			ctx.strokeRect(-6, 4, 5, 8);
		}
		ctx.restore();
	}
	function drawMini(ctx, w, h) {
		if (!player) return;
		const R = Math.min(68, w * .11);
		const cx = w - 18 - R;
		const cy = Math.min(h * .36, h - 240);
		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, R, 0, Math.PI * 2);
		ctx.clip();
		ctx.fillStyle = "rgba(16,18,14,0.55)";
		ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
		const scale = R / 42;
		const fx = -Math.sin(player.yaw);
		const fz = -Math.cos(player.yaw);
		const rx = Math.cos(player.yaw);
		const rz = -Math.sin(player.yaw);
		const blot = (x, z, color, rad) => {
			const dx = x - player.x;
			const dz = z - player.z;
			const localR = dx * rx + dz * rz;
			const localF = dx * fx + dz * fz;
			const dist = Math.hypot(localR, localF);
			let px = localR;
			let py = localF;
			if (dist > 40) {
				px = localR / dist * 40;
				py = localF / dist * 40;
			}
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(cx + px * scale, cy - py * scale, rad, 0, Math.PI * 2);
			ctx.fill();
		};
		for (const f of flags) blot(f.x, f.z, TEAMS[f.team].color, 4);
		blot(0, 0, "#ffe14a", 3);
		for (const a of actors) {
			if (a === player || a.state === "gone") continue;
			const dx = a.x - player.x;
			const dz = a.z - player.z;
			const dist = Math.hypot(dx, dz);
			blot(a.x, a.z, a.state === "down" ? "#111" : TEAMS[a.team].color, dist > 40 ? 3 : 4);
			if (dist < 22) {
				const localR = dx * rx + dz * rz;
				const localF = dx * fx + dz * fz;
				ctx.fillStyle = TEAMS[a.team].color;
				ctx.font = "10px Outfit, sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(`${a.name} ${Math.ceil(a.hp)}`, cx + localR * scale, cy - localF * scale - 6);
			}
		}
		ctx.restore();
		ctx.strokeStyle = "rgba(244,241,228,0.7)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(cx, cy, R, 0, Math.PI * 2);
		ctx.stroke();
		ctx.fillStyle = "#f4f1e4";
		ctx.beginPath();
		ctx.moveTo(cx, cy - 7);
		ctx.lineTo(cx - 5, cy + 5);
		ctx.lineTo(cx + 5, cy + 5);
		ctx.fill();
	}
	function drawMap(ctx, w, h) {
		ctx.fillStyle = "rgba(10,12,8,0.72)";
		ctx.fillRect(0, 0, w, h);
		const s = Math.min(w, h) * .36;
		const cx = w / 2;
		const cy = h / 2;
		const project = (x, z) => ({
			x: cx + x / 120 * s,
			y: cy + z / 120 * s
		});
		ctx.strokeStyle = "rgba(244,241,228,0.25)";
		ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
		ctx.beginPath();
		for (let i = 0; i <= 20; i++) {
			const x = -100 + i * 10;
			const p = project(x, 8 + Math.sin(x * .045) * 7);
			if (i === 0) ctx.moveTo(p.x, p.y);
			else ctx.lineTo(p.x, p.y);
		}
		ctx.strokeStyle = "rgba(62,198,255,0.7)";
		ctx.stroke();
		for (const f of flags) {
			const p = project(f.x, f.z);
			ctx.fillStyle = TEAMS[f.team].color;
			ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
		}
		const hill = project(0, 0);
		ctx.strokeStyle = "#ffe14a";
		ctx.beginPath();
		ctx.arc(hill.x, hill.y, 8, 0, Math.PI * 2);
		ctx.stroke();
		for (const a of actors) {
			if (a.state === "gone") continue;
			const p = project(a.x, a.z);
			ctx.fillStyle = a.state === "down" ? "#111" : TEAMS[a.team].color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, a === player ? 6 : 4, 0, Math.PI * 2);
			ctx.fill();
			if (a === player || Math.hypot(a.x - (spectate ? fly.x : player?.x || 0), a.z - (spectate ? fly.z : player?.z || 0)) < 50) {
				ctx.fillStyle = "#f4f1e4";
				ctx.font = "11px Outfit, sans-serif";
				ctx.textAlign = "left";
				const rank = rankForLevel(xpToLevel(a.xp).lvl);
				ctx.fillText(`${rank.id} ${a.name} ${Math.ceil(a.hp)}`, p.x + 6, p.y + 3);
			}
			if (a.state === "down") {
				ctx.fillStyle = "#ffe14a";
				ctx.fillText("!", p.x - 2, p.y - 8);
			}
		}
		ctx.fillStyle = "#f4f1e4";
		ctx.font = "600 16px Fredoka, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText("Field map  ·  M to close", cx, cy - s - 16);
	}
	function blankHud() {
		return {
			phase: "attract",
			locked: false,
			hp: 100,
			maxHp: 100,
			weapon: "Plasma Rifle",
			action: "Signature",
			cd: 0,
			teams: TEAMS.map((t) => ({
				name: t.name,
				color: t.color,
				caps: 0,
				hill: 0
			})),
			hillText: "Hill open",
			boost: false,
			feed: [],
			log: [],
			banner: "",
			rows: [],
			time: "15:00",
			date: "20 Mar",
			season: "Spring",
			weather: "sun",
			downed: false,
			graphics: "medium",
			sens: .0022,
			volume: .7,
			now: 0,
			build: "Signature",
			score: false,
			map: false,
			console: false,
			menu: false,
			spectate: false,
			heat: 0
		};
	}
	const pings = /* @__PURE__ */ new Map();
	function rowKind(a) {
		if (a.minion) return a.kind === "mummy" ? "mummy" : a.kind === "necro" ? "necro" : "mutant";
		if (a.bot) return "bot";
		return "human";
	}
	function pingOf(nick) {
		return pings.get(nick)?.ms || 0;
	}
	function scoreRows() {
		if (linked.length) {
			const rows = linked.map((h) => ({
				team: h.team,
				name: h.nick,
				lvl: h.lvl || xpToLevel(h.xp || 0).lvl,
				rank: rankForLevel(h.lvl || xpToLevel(h.xp || 0).lvl).id,
				k: h.kills || 0,
				d: h.deaths || 0,
				xp: Math.floor(h.xp || 0),
				me: player?.name === h.nick,
				kind: "human",
				ping: pingOf(h.nick) || h.ping || 0,
				charId: h.charId || ""
			}));
			if (player && !rows.some((r) => r.name === player.name)) {
				const self = player;
				const lvl = xpToLevel(self.xp).lvl;
				rows.push({
					team: self.team,
					name: self.name,
					lvl,
					rank: rankForLevel(lvl).id,
					k: self.kills,
					d: self.deaths,
					xp: Math.floor(self.xp),
					me: true,
					kind: "human",
					ping: pingOf(self.name),
					charId: self.charId
				});
			}
			for (const a of actors) {
				if (a.state === "gone" || !a.bot && !a.minion) continue;
				rows.push({
					team: a.team,
					name: a.name,
					lvl: xpToLevel(a.xp).lvl,
					rank: rankForLevel(xpToLevel(a.xp).lvl).id,
					k: a.kills,
					d: a.deaths,
					xp: Math.floor(a.xp),
					me: false,
					kind: rowKind(a),
					ping: 0,
					charId: a.minion ? "" : a.charId
				});
			}
			return rows;
		}
		return actors.filter((a) => a.state !== "gone").map((a) => ({
			team: a.team,
			name: a.name,
			lvl: xpToLevel(a.xp).lvl,
			rank: rankForLevel(xpToLevel(a.xp).lvl).id,
			k: a.kills,
			d: a.deaths,
			xp: Math.floor(a.xp),
			me: a === player,
			kind: rowKind(a),
			ping: a === player ? pingOf(a.name) : 0,
			charId: a.minion ? "" : a.charId
		}));
	}
	function emit() {
		pumpBanner();
		const c = clockParts();
		const rows = scoreRows();
		const weapon = player ? WEAPON_BY_ID[loadout(charOf(player))[player.weapon] || "plasma"].name : "Plasma Rifle";
		hud = {
			phase: playing ? "play" : "attract",
			locked: document.pointerLockElement === view,
			hp: player ? Math.ceil(player.hp) : 100,
			maxHp: 100,
			weapon,
			action: player ? BUILD_ACTIONS[player.build]?.name || "Signature" : "Signature",
			cd: player ? player.abilityCd : 0,
			teams: TEAMS.map((t) => ({
				name: t.name,
				color: t.color,
				caps: caps[t.id] || 0,
				hill: Math.floor(hillScore[t.id] || 0)
			})),
			hillText: hillOwner < 0 ? "Hill open" : `${TEAMS[hillOwner].name} ${Math.floor(hillTime)}s${boost ? " · surge" : ""}`,
			boost,
			feed: feed.slice(-5),
			log: log.slice(-40),
			banner,
			rows,
			time: `${String(c.hours).padStart(2, "0")}:${String(c.mins).padStart(2, "0")}`,
			date: c.date.toLocaleDateString("en-GB", {
				day: "numeric",
				month: "short",
				timeZone: "UTC"
			}),
			season: c.season,
			weather,
			downed: player?.state === "down",
			graphics: quality,
			sens,
			volume,
			now: performance.now(),
			build: player ? BUILD_ACTIONS[player.build]?.name || "" : "",
			score: showScore,
			map: showMap,
			console: showConsole,
			menu,
			spectate,
			heat: player?.heatSick ? heatLeft : 0
		};
		for (const s of subs) s();
	}
	function applyQuality(q) {
		quality = q;
		const pr = q === "low" ? .8 : q === "ultra" ? Math.min(1.75, window.devicePixelRatio || 1) : q === "high" ? Math.min(1.6, window.devicePixelRatio || 1) : 1;
		renderer.setPixelRatio(pr);
		const shadows = q === "high" || q === "ultra";
		renderer.shadowMap.enabled = shadows;
		sun.castShadow = shadows;
		sun.shadow.mapSize.set(q === "ultra" ? 2048 : 1024, q === "ultra" ? 2048 : 1024);
		if (sun.shadow.map) {
			sun.shadow.map.dispose();
			sun.shadow.map = null;
		}
		ground.castShadow = false;
		ground.receiveShadow = shadows;
		staticBoxes.castShadow = shadows;
		staticBoxes.receiveShadow = shadows;
		pilots.setUltra(q === "ultra");
		mutants.setUltra(q === "ultra");
		flowerM.count = q === "low" ? Math.min(40, world.flowers.length) : world.flowers.length;
		grassM.count = q === "low" ? Math.min(30, world.grass.length) : world.grass.length;
	}
	function onKeyDown(e) {
		const tag = e.target?.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA") return;
		if (e.repeat) return;
		keys.add(e.code);
		if (playing && (e.code === "Tab" || e.code === "Space")) e.preventDefault();
		const now = performance.now() / 1e3;
		if ([
			"KeyW",
			"KeyA",
			"KeyS",
			"KeyD",
			"KeyQ",
			"KeyE"
		].includes(e.code)) {
			if (now - (tapAt[e.code] || -10) < .28) queuedDash = {
				f: e.code === "KeyW" ? 1 : e.code === "KeyS" ? -1 : 0,
				s: e.code === "KeyD" ? 1 : e.code === "KeyA" ? -1 : e.code === "KeyE" ? 1 : e.code === "KeyQ" ? -1 : 0
			};
			tapAt[e.code] = now;
		}
		if (!playing || menu) return;
		if (e.code === "Tab") {
			showScore = !showScore;
			if (showScore) document.exitPointerLock();
			emit();
		} else if (e.code === "KeyM") {
			showMap = !showMap;
			if (showMap) document.exitPointerLock();
			emit();
		} else if (e.code === "Backquote") {
			showConsole = !showConsole;
			if (showConsole) document.exitPointerLock();
			emit();
		} else if (e.code === "Escape") {
			menu = !menu;
			document.exitPointerLock();
			emit();
		} else if (e.code === "KeyV") toggleSpectate();
	}
	let showScore = false;
	let showConsole = false;
	function onKeyUp(e) {
		keys.delete(e.code);
	}
	function onMouse(e) {
		if (document.pointerLockElement !== view) return;
		lookX += e.movementX;
		lookY += e.movementY;
		touch.lookX += e.movementX;
	}
	function onDown(e) {
		if (e.button === 0) mouseFire = true;
		if (e.button === 2) mouseScope = true;
	}
	function onUp(e) {
		if (e.button === 0) mouseFire = false;
		if (e.button === 2) mouseScope = false;
	}
	function onLock() {
		emit();
	}
	function onWheel(e) {
		if (!player || menu) return;
		const len = loadout(charOf(player)).length;
		player.weapon = (player.weapon + (e.deltaY > 0 ? 1 : len - 1)) % len;
	}
	function onClick() {
		audio.unlock();
		if (!playing || menu || showMap || showScore || showConsole) return;
		if (document.pointerLockElement !== view) {
			const req = view.requestPointerLock;
			try {
				const ret = req.call(view, { unadjustedMovement: true });
				if (ret && typeof ret.catch === "function") ret.catch(() => view.requestPointerLock());
			} catch {
				view.requestPointerLock();
			}
		}
	}
	function onResize() {
		const w = view.clientWidth || window.innerWidth;
		const h = view.clientHeight || window.innerHeight;
		camera.aspect = w / Math.max(1, h);
		camera.updateProjectionMatrix();
		renderer.setSize(w, h, false);
	}
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
	window.addEventListener("mousemove", onMouse);
	window.addEventListener("mousedown", onDown);
	window.addEventListener("mouseup", onUp);
	window.addEventListener("wheel", onWheel, { passive: true });
	document.addEventListener("pointerlockchange", onLock);
	view.addEventListener("click", onClick);
	window.addEventListener("resize", onResize);
	window.addEventListener("blur", () => keys.clear());
	view.addEventListener("contextmenu", (e) => e.preventDefault());
	line("MOUNT DEW 1.0.1");
	line("textures baked in memory");
	line("relay Amsterdam-IX");
	line("movement prediction on");
	line("hits fire-and-forget");
	applyQuality("high");
	emit();
	renderer.setAnimationLoop(() => {
		if (!running) return;
		timer.update();
		let dt = timer.getDelta();
		if (!Number.isFinite(dt) || dt < 0) dt = .016;
		dt = Math.min(.05, dt);
		sampleInput();
		acc += dt;
		let guard = 0;
		let first = true;
		while (acc >= 1 / 60 && guard < 4) {
			simulate(1 / 60, first);
			acc -= 1 / 60;
			guard++;
			first = false;
			edges.jump = false;
			edges.act = false;
			edges.cycle = false;
			edges.dash = false;
		}
		frameDt = dt;
		render();
		uiAcc += dt;
		if (uiAcc > .12) {
			uiAcc = 0;
			emit();
		}
	});
	function toggleSpectate() {
		if (!playing || !player) return;
		spectate = !spectate;
		if (spectate) {
			fly.x = player.x - Math.sin(player.yaw) * -8;
			fly.y = player.y + 7;
			fly.z = player.z - Math.cos(player.yaw) * -8;
			fly.yaw = player.yaw;
			fly.pitch = -.28;
			line("Spectator camera. Sounds fade as you fly off.");
		} else line("Back on your pilot.");
		emit();
	}
	function installProbe() {
		if (!qa) return;
		window.__controlsTest = {
			getYaw: () => player ? player.yaw : yaw,
			getSpeed: () => player ? Math.hypot(player.vx, player.vz) : 0,
			setKeys: (codes) => {
				qaKeys = codes;
			},
			getPos: () => ({
				x: player?.x || 0,
				y: player?.y || 0,
				z: player?.z || 0
			}),
			getRight: () => {
				const y = player?.yaw || 0;
				return {
					x: Math.cos(y),
					z: -Math.sin(y)
				};
			},
			getMinion: () => {
				let m = null;
				let best = -1;
				for (const a of actors) {
					if (!a.minion || a.state !== "live") continue;
					const speed = Math.hypot(a.vx, a.vz);
					if (speed > best) {
						best = speed;
						m = a;
					}
				}
				if (!m) return null;
				return {
					id: m.id,
					x: m.x,
					z: m.z,
					yaw: m.yaw,
					speed: best
				};
			},
			getMinions: () => actors.filter((a) => a.minion && a.state === "live").map((a) => ({
				id: a.id,
				x: a.x,
				z: a.z,
				yaw: a.yaw,
				speed: Math.hypot(a.vx, a.vz)
			})),
			toggleSpectate: () => toggleSpectate(),
			getFly: () => ({
				x: fly.x,
				y: fly.y,
				z: fly.z,
				yaw: fly.yaw,
				pitch: fly.pitch,
				on: spectate
			})
		};
	}
	const api = {
		destroy() {
			running = false;
			renderer.setAnimationLoop(null);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("mousemove", onMouse);
			window.removeEventListener("mousedown", onDown);
			window.removeEventListener("mouseup", onUp);
			window.removeEventListener("wheel", onWheel);
			document.removeEventListener("pointerlockchange", onLock);
			view.removeEventListener("click", onClick);
			window.removeEventListener("resize", onResize);
			audio.dispose();
			renderer.dispose();
			if (window.__controlsTest) delete window.__controlsTest;
		},
		deploy(info) {
			if (player) return;
			token = info.token;
			qa = !!info.qa || opts.qa;
			const s = world.spawns.filter((s) => s.team === info.team)[0] || world.spawns[0];
			const ch = CHAR_BY_ID[info.charId] ? info.charId : "angel";
			player = makeActor({
				id: 1,
				name: info.nick,
				team: info.team,
				charId: ch,
				bot: false,
				x: qa ? world.qa.x : s.x,
				y: qa ? world.qa.y : s.y,
				z: qa ? world.qa.z : s.z,
				yaw: qa ? world.qa.yaw : s.yaw,
				xp: info.xp
			});
			actors.push(player);
			yaw = player.yaw;
			playing = true;
			const self = player;
			if (linked.length) syncHumans(linked.filter((h) => h.nick !== self.name));
			line(`${info.nick} joined ${TEAMS[info.team].name}.`, true);
			globalCall("Instructor: Steal an enemy flag and bring it home. Guard your own.");
			globalCall("Instructor: Hold the yellow hill in the center for two minutes. Your team then runs faster.");
			installProbe();
			if (qa) {
				const kinds = [
					"voodoo",
					"mummy",
					"necro"
				];
				for (let i = 0; i < 3; i++) {
					const m = makeActor({
						name: i === 1 ? "Wrapmutant" : i === 2 ? "Bonemutant" : "Mutant",
						team: i,
						charId: "bone",
						bot: true,
						minion: true,
						kind: kinds[i],
						x: world.qa.x + (i - 1) * 1.45,
						y: world.qa.y,
						z: world.qa.z + 2.1,
						yaw: Math.PI,
						hp: 80
					});
					m.goalX = m.x;
					m.goalY = m.y;
					m.goalZ = m.z + 16;
					m.think = 12;
					m.anim = i * 1.7;
					actors.push(m);
				}
			}
			emit();
		},
		subscribe(fn) {
			subs.add(fn);
			return () => subs.delete(fn);
		},
		getHud: () => hud,
		setQuality(q) {
			applyQuality(q);
			emit();
		},
		setVolume(v) {
			volume = v;
			audio.setVolume(v);
		},
		setDither(next) {
			audio.setDither(next);
		},
		setStudio(next) {
			audio.setStudio(next);
		},
		getStudioViz() {
			return audio.getStudioViz();
		},
		setMix(next) {
			audio.setMix(next);
		},
		getMeters() {
			return audio.getMeters();
		},
		setSens(v) {
			sens = v;
		},
		toggleScore() {
			showScore = !showScore;
			emit();
		},
		toggleMap() {
			showMap = !showMap;
			emit();
		},
		toggleConsole() {
			showConsole = !showConsole;
			emit();
		},
		scoreOpen: () => showScore,
		mapOpen: () => showMap,
		consoleOpen: () => showConsole,
		setMenu(v) {
			menu = v;
			if (v) document.exitPointerLock();
			emit();
		},
		intro() {
			audio.unlock();
			audio.intro();
		},
		toggleSpectate() {
			toggleSpectate();
		},
		spawnNow() {
			spawnReq = true;
		},
		setTouch(t) {
			touch.x = t.x;
			touch.y = t.y;
			touch.fire = t.fire;
			touch.jump = t.jump;
			touch.act = t.act;
			touch.cycle = t.cycle;
			touch.dash = t.dash;
			lookX += t.lookX;
			lookY += t.lookY;
		},
		lock() {
			view.requestPointerLock();
		},
		fullscreen() {
			if (document.fullscreenElement) document.exitFullscreen();
			else document.documentElement.requestFullscreen?.();
		},
		pushLine(s) {
			line(s);
			emit();
		},
		pushAnnounce(s) {
			line(s, true);
			emit();
		},
		setToken(next) {
			token = next;
		},
		notePings(rows) {
			const now = performance.now();
			for (const row of rows) {
				const prev = pings.get(row.nick);
				if (prev && now - prev.at < 5e3) continue;
				pings.set(row.nick, {
					ms: Math.max(0, Math.round(row.ms)),
					at: now
				});
			}
			emit();
		},
		applyAfk(action) {
			if (!player) return;
			const self = player;
			if (action === "spawn") {
				const s = world.spawns.filter((s) => s.team === self.team)[0] || world.spawns[0];
				if (s) {
					self.x = s.x;
					self.y = s.y;
					self.z = s.z;
					self.vx = 0;
					self.vy = 0;
					self.vz = 0;
				}
				afkFix = true;
				line("No update for 30 seconds. Back to spawn.", true);
			} else {
				player.hp = 0;
				player.state = "down";
				player.lifeStreak = 0;
				player.spree = 0;
				line("Still idle. You are down.", true);
			}
			emit();
		},
		applyRoster(pilots) {
			linked = Array.isArray(pilots) ? pilots : [];
			if (player) {
				const self = player;
				syncHumans(linked.filter((h) => h.nick !== self.name));
				const me = linked.find((h) => h.nick === self.name);
				if (me) self.xp = Math.max(self.xp, me.xp || 0);
			}
			emit();
		},
		failed: failWebgl
	};
	onResize();
	return api;
}
function buildLogo(scene) {
	const group = new Group();
	const plaque = new Mesh(new BoxGeometry(15.5, 5.6, .55), new MeshLambertMaterial({ color: 2898456 }));
	group.add(plaque);
	const word = "MOUNT DEW";
	let cursor = -6.2;
	const yellow = new MeshLambertMaterial({ color: 16769354 });
	const green = new MeshLambertMaterial({ color: 13034330 });
	for (const ch of word) {
		if (ch === " ") {
			cursor += .7;
			continue;
		}
		const rows = GLYPH[ch];
		if (!rows) continue;
		rows.forEach((row, y) => {
			for (let x = 0; x < row.length; x++) {
				if (row[x] !== "1") continue;
				const cube = new Mesh(new BoxGeometry(.28, .28, .22), (x + y) % 2 ? yellow : green);
				cube.position.set(cursor + x * .3, 1.7 - y * .3, .38);
				group.add(cube);
			}
		});
		cursor += 1.7;
	}
	group.position.set(0, 8.1, -61.2);
	group.rotation.y = Math.PI;
	scene.add(group);
}
//#endregion
export { createGame };
