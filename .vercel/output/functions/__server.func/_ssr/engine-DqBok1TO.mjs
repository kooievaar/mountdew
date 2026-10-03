import { a as CHAR_BY_ID, c as WEAPON_BY_ID, d as netPulse, i as CHARACTERS, l as rankForLevel, n as BOT_NAMES, o as LINES, r as BUILD_ACTIONS, s as TEAMS, u as xpToLevel } from "./routes-Dy37HWDw.mjs";
import { A as PerspectiveCamera, B as TorusGeometry, C as MathUtils, D as MeshLambertMaterial, E as MeshBasicMaterial, F as RepeatWrapping, I as SRGBColorSpace, L as Scene, M as Points, N as PointsMaterial, O as MeshPhongMaterial, P as Quaternion, R as SphereGeometry, S as LineSegments, T as Mesh, V as Vector3, _ as Group, a as BufferGeometry, b as InstancedMesh, c as ClampToEdgeWrapping, d as CylinderGeometry, f as DirectionalLight, g as Fog, h as Float32BufferAttribute, i as BufferAttribute, j as PlaneGeometry, k as OctahedronGeometry, l as Color, m as Euler, n as AmbientLight, o as CanvasTexture, p as DodecahedronGeometry, r as BoxGeometry, s as CircleGeometry, t as WebGLRenderer, u as ConeGeometry, v as HemisphereLight, w as Matrix4, x as LineBasicMaterial, y as InstancedBufferAttribute, z as Timer } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-DqBok1TO.js
var HEAR = 28;
var HEAR_FULL = 7;
function createAudio() {
	let ctx = null;
	let master = null;
	let vol = .7;
	let wind = null;
	let stepAcc = 0;
	let laughAcc = 0;
	const ear = {
		x: 0,
		y: 8,
		z: 0
	};
	let pilotVoices = 0;
	let shotVoices = 0;
	let boomVoices = 0;
	let boothUntil = 0;
	const boothQueue = [];
	function ac() {
		if (!ctx) {
			ctx = new (window.AudioContext || window.webkitAudioContext)();
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
			g.gain.value = .025;
			src.connect(filter);
			filter.connect(g);
			g.connect(master);
			src.start();
			wind = src;
		}
		if (ctx.state === "suspended") ctx.resume();
		return ctx;
	}
	function envGain(duration, peak) {
		const c = ac();
		const g = c.createGain();
		g.connect(master);
		const t = c.currentTime;
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(Math.max(.001, peak), t + .02);
		g.gain.exponentialRampToValueAtTime(1e-4, t + duration);
		return {
			c,
			g,
			t
		};
	}
	function tone(freq, dur, type, peak, slide = 0) {
		if (peak < .004) return;
		const { c, g, t } = envGain(dur, peak);
		const o = c.createOscillator();
		o.type = type;
		o.frequency.setValueAtTime(freq, t);
		if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
		o.connect(g);
		o.start(t);
		o.stop(t + dur + .02);
	}
	function noise(dur, peak, freq) {
		if (peak < .004) return;
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
		filter.Q.value = .7;
		const { g } = envGain(dur, peak);
		src.connect(filter);
		filter.connect(g);
		src.start();
	}
	function sequence(notes, step, type, peak) {
		notes.forEach((f, i) => {
			window.setTimeout(() => tone(f, step * .9, type, peak), i * step * 1e3);
		});
	}
	function distGain(x, y, z, far = HEAR) {
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
	function talk(text, pitch, peak, form) {
		const words = text.toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).filter(Boolean).slice(0, 5);
		if (!words.length || peak < .004) return 80;
		const gap = form === "color" ? .075 : form === "booth" ? .12 : .09;
		const type = form === "booth" ? "sawtooth" : form === "color" ? "triangle" : "square";
		const base = form === "booth" ? pitch * .62 : form === "color" ? pitch * 1.05 : pitch;
		let n = 0;
		words.forEach((word, wi) => {
			const syl = Math.min(3, Math.max(1, Math.round(word.length / 2)));
			for (let i = 0; i < syl; i++) {
				const ch = word[Math.min(word.length - 1, i * 2)] || "a";
				const vowel = ch === "i" || ch === "e" ? 1.45 : ch === "o" || ch === "u" ? .72 : ch === "a" ? 1.05 : .9;
				const when = (n + wi * .15) * gap;
				const f = Math.max(70, base * vowel);
				window.setTimeout(() => {
					tone(f, gap * .92, type, peak, form === "pilot" ? f * .08 : -f * .06);
					tone(f * 2.1, gap * .7, "sine", peak * .35);
				}, when * 1e3);
				n++;
			}
		});
		return Math.max(180, n * gap * 1e3 + 40);
	}
	function playBooth(text, form) {
		const g = boothGain();
		if (g < .05) return;
		const ms = talk(text, form === "booth" ? 196 : 280, (form === "booth" ? .11 : .08) * g, form);
		boothUntil = performance.now() + ms + 280;
		window.setTimeout(flushBooth, ms + 280);
	}
	function flushBooth() {
		if (performance.now() < boothUntil) return;
		const next = boothQueue.shift();
		if (next) playBooth(next.text, next.form);
	}
	function queueBooth(text, form) {
		if (!text) return;
		if (performance.now() >= boothUntil && boothQueue.length === 0) playBooth(text, form);
		else if (boothQueue.length < 2) boothQueue.push({
			text,
			form
		});
	}
	function announceLine(text) {
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
	function shotBody(kind, peak) {
		if (kind === "trace") noise(.07, peak, 1400);
		else if (kind === "rocket") noise(.2, peak, 220);
		else if (kind === "flame") noise(.08, peak * .7, 700);
		else if (kind === "melee") tone(180, .08, "square", peak * .6);
		else noise(.1, peak * .8, 600);
	}
	return {
		unlock() {
			ac();
		},
		setVolume(v) {
			vol = v;
			if (master) master.gain.value = v;
		},
		setListener(x, y, z) {
			ear.x = x;
			ear.y = y;
			ear.z = z;
		},
		jump(pitch) {
			tone(pitch, .16, "sine", .08, pitch * .4);
		},
		step(water) {
			noise(water ? .12 : .05, water ? .07 : .04, water ? 500 : 180);
		},
		shot(kind) {
			shotBody(kind, .09);
		},
		shotAt(x, y, z, kind, self) {
			const g = self ? Math.max(.9, distGain(x, y, z, 36)) : distGain(x, y, z, 36);
			if (g < .05) return;
			if (!self && shotVoices >= 3) return;
			shotVoices++;
			window.setTimeout(() => {
				shotVoices = Math.max(0, shotVoices - 1);
			}, 90);
			shotBody(kind, .1 * g);
		},
		ding() {
			tone(880, .12, "sine", .08);
			tone(1320, .18, "triangle", .05);
		},
		boom() {
			noise(.28, .12, 140);
			tone(90, .22, "sine", .08, -40);
		},
		boomAt(x, y, z) {
			const g = distGain(x, y, z, 40);
			if (g < .05 || boomVoices >= 2) return;
			boomVoices++;
			window.setTimeout(() => {
				boomVoices = Math.max(0, boomVoices - 1);
			}, 280);
			noise(.28, .12 * g, 140);
			tone(90, .22, "sine", .08 * g, -40);
		},
		voice(pitch, kind) {
			sequence([pitch, pitch * 1.25], .09, "sine", .07);
		},
		voiceAt(x, y, z, pitch, kind, line, self) {
			const g = self ? 1 : distGain(x, y, z, 24);
			if (g < .08) return;
			if (!self && pilotVoices >= 2) return;
			pilotVoices++;
			const ms = talk(line || kind || "hey", Math.max(90, pitch), .13 * g, "pilot");
			window.setTimeout(() => {
				pilotVoices = Math.max(0, pilotVoices - 1);
			}, ms);
		},
		help(pitch) {
			sequence([
				pitch,
				pitch * .8,
				pitch
			], .14, "sine", .07);
		},
		helpAt(x, y, z, pitch, self) {
			const g = self ? 1 : distGain(x, y, z, 22);
			if (g < .08 || !self && pilotVoices >= 2) return;
			pilotVoices++;
			const ms = talk("help", Math.max(90, pitch), .12 * g, "pilot");
			window.setTimeout(() => {
				pilotVoices = Math.max(0, pilotVoices - 1);
			}, ms);
		},
		splash() {
			noise(.18, .08, 900);
		},
		splashAt(x, y, z) {
			const g = distGain(x, y, z, 22);
			if (g < .05) return;
			noise(.18, .08 * g, 900);
		},
		laugh() {
			tone(500 + Math.random() * 200, .1, "square", .04, 80);
		},
		laughAt(x, y, z) {
			const g = distGain(x, y, z, 22);
			if (g < .05) return;
			tone(500 + Math.random() * 200, .1, "square", .045 * g, 80);
		},
		train() {
			noise(.16, .05, 120);
			tone(440, .2, "triangle", .03);
		},
		trainAt(x, y, z) {
			const g = distGain(x, y, z, 46);
			if (g < .05) return;
			noise(.16, .05 * g, 120);
			tone(440, .2, "triangle", .035 * g);
		},
		stinger() {
			sequence([
				523,
				659,
				784
			], .09, "triangle", .05 * boothGain());
		},
		announce(text) {
			const line = announceLine(text);
			if (!line) return;
			tone(220, .08, "triangle", .04 * boothGain());
			queueBooth(line, "booth");
		},
		comment(text) {
			if (performance.now() < boothUntil) return;
			queueBooth(text, "color");
		},
		weather(kind) {
			const g = boothGain();
			if (kind === "rain") noise(.4, .04 * g, 1e3);
			else if (kind === "snow") tone(1200, .2, "sine", .02 * g);
			else tone(660, .15, "sine", .03 * g);
		},
		owl() {
			const g = boothGain();
			tone(330, .25, "sine", .05 * g, -80);
			window.setTimeout(() => tone(280, .3, "sine", .04 * g, -60), 280);
		},
		birds() {
			sequence([
				1400,
				1800,
				1500
			], .07, "sine", .03 * boothGain());
		},
		tick(dt, weather, moving, water) {
			if (!ctx) return;
			if (moving) {
				stepAcc += dt;
				if (stepAcc > (water ? .28 : .34)) {
					stepAcc = 0;
					noise(water ? .1 : .04, .035, water ? 480 : 160);
				}
			}
			if (weather === "rain") {
				laughAcc += dt;
				if (laughAcc > .45) {
					laughAcc = 0;
					noise(.12, .015 * boothGain(), 1500);
				}
			}
		},
		dispose() {
			try {
				wind?.stop();
			} catch {}
			ctx?.close();
			ctx = null;
			master = null;
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
	let prevSun = 1;
	let trainAng = .4;
	let trainToot = 0;
	let smileSnd = 0;
	let netAcc = 0;
	let uiAcc = 0;
	let fid = 1;
	const feed = [];
	const log = [];
	let banner = "";
	let bannerAt = 0;
	const pendingShots = [];
	const seenShots = /* @__PURE__ */ new Set();
	let openTele = -1;
	let spawnReq = false;
	let failWebgl = false;
	const subs = /* @__PURE__ */ new Set();
	let hud = blankHud();
	const white = new Color(1, 1, 1);
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
	renderer.toneMappingExposure = 1.02;
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
		opacity: .55,
		depthWrite: false
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
		if (feed.length > 8) feed.shift();
		if (big) {
			banner = text;
			bannerAt = performance.now();
			audio.announce(text);
		}
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
		if (a.voiceCd > 0) return;
		a.voiceCd = a === player ? .5 : a.minion ? 1.35 : 1.75;
		a.speech = LINES[key] || key;
		a.speechT = 1.15;
		const ch = CHAR_BY_ID[a.charId];
		audio.voiceAt(a.x, a.y + 1.2, a.z, ch?.voice || 440, key, a.speech, a === player);
	}
	function pose(mesh, i, x, y, z, rx, ry, rz, sx, sy, sz) {
		eul.set(rx, ry, rz, "XYZ");
		quat.setFromEuler(eul);
		mat.compose(pos.set(x, y, z), quat, scl.set(sx, sy, sz));
		mesh.setMatrixAt(i, mat);
	}
	function poseYP(mesh, i, x, y, z, pitch, yaw, roll, sx, sy, sz) {
		eul.set(pitch, yaw, roll, "YXZ");
		quat.setFromEuler(eul);
		mat.compose(pos.set(x, y, z), quat, scl.set(sx, sy, sz));
		mesh.setMatrixAt(i, mat);
	}
	function paint(mesh, i, hex, flash = 0) {
		col.setHex(hex);
		if (flash > 0) col.lerp(white, Math.min(1, flash * 5));
		mesh.setColorAt(i, col);
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
	function hurt(a, dmg, src, head) {
		if (a.state !== "live" || a.invuln > 0) return;
		if (qa && a === player) return;
		if (src && src.team === a.team) return;
		const ch = src ? CHAR_BY_ID[src.charId] : void 0;
		const lvl = src ? xpToLevel(src.xp).lvl : 1;
		const bonus = 1 + Math.min(.15, lvl * .004);
		a.hp -= dmg * bonus * (src?.minion ? .45 : 1) * (ch?.ability === "necro" && src?.minion ? 1.4 : 1);
		a.flash = .15;
		if (a === player) shake = Math.min(.4, shake + .12);
		if (a.hp <= 0) {
			a.hp = 0;
			a.state = "down";
			a.downT = 0;
			a.helpT = .2;
			a.deaths += 1;
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
				if (head && src === player) audio.ding();
			}
			if (a === player) a.pendingD += 1;
			const who = src ? src.name : "the field";
			line(`${head ? "Headshot " : ""}${who} dropped ${a.name}`, head || a === player || src === player);
			say(a, "down");
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
			flat: 0
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
			audio.jump(charOf(a).voice);
			return;
		}
		if (a.jumps < maxJ) {
			a.vy = 8.7;
			a.jumps += 1;
			a.roll = .48;
			a.grounded = false;
			say(a, a.jumps >= 3 ? "triple" : "double");
			audio.jump(charOf(a).voice * 1.15);
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
				a.vy = Math.min(a.vy, 9);
				a.fuel -= dt * .35;
			}
			if (ch.ability === "bird" && jumpHeld && !a.grounded && a.fuel > 0 && a.jumps >= ch.jumps) {
				a.vy += 20 * dt;
				a.vy = Math.min(a.vy, 7.5);
				a.fuel -= dt * .25;
			}
			if (a.hover && a.fuel > 0) {
				a.vy += (0 - a.vy) * (1 - Math.exp(-6 * dt));
				if (jumpHeld) a.vy += 8 * dt;
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
			if (glide) a.vy = -1.65;
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
		} else if (fire && a.cd <= 0 && w.kind !== "flame") shoot(a, w.id);
		if (!a.minion && fire && w.kind === "flame") {
			a.flame += dt;
			if (a.cd <= 0) {
				a.cd = .1;
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
			dmg: w.dmg
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
					a.invuln = .8;
					o.xp += 40;
					o.pendingXp += 40;
					line(`${o.name} revived ${a.name}`, true);
					say(a, "yay");
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
			if (a.remote) {
				const k = 1 - Math.exp(-8 * dt);
				a.x += (a.tx - a.x) * k;
				a.y += (a.ty - a.y) * k;
				a.z += (a.tz - a.z) * k;
				a.yaw = lerpAng(a.yaw, a.tyaw, k);
				continue;
			}
			if (a.state === "down") stepDown(a, dt);
			else stepLive(a, dt, first);
		}
		for (let i = balls.length - 1; i >= 0; i--) {
			const b = balls[i];
			b.life -= dt;
			b.vy -= (b.kind === "rocket" ? 4 : 12) * dt;
			const nx = b.x + b.vx * dt;
			const ny = b.y + b.vy * dt;
			const nz = b.z + b.vz * dt;
			const dist = Math.hypot(b.vx, b.vy, b.vz) * dt;
			const hit = dist > .001 ? rayAll(b.x, b.y, b.z, b.vx / (Math.hypot(b.vx, b.vy, b.vz) || 1), b.vy / (Math.hypot(b.vx, b.vy, b.vz) || 1), b.vz / (Math.hypot(b.vx, b.vy, b.vz) || 1), dist) : null;
			let actorBounce = false;
			for (const a of actors) {
				if (a.id === b.owner || a.state !== "live") continue;
				if (Math.hypot(a.x - nx, a.y + .8 - ny, a.z - nz) < .8) actorBounce = true;
			}
			if (hit || actorBounce || b.life <= 0) {
				if (b.kind === "rocket" || b.life <= 0 || b.bounces >= 2 && (hit || actorBounce)) {
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
		netAcc += dt;
		if (netAcc > .28 && token && player) {
			netAcc = 0;
			const dxp = player.pendingXp;
			const dk = player.pendingK;
			const dd = player.pendingD;
			const dc = player.pendingC;
			player.pendingXp = 0;
			player.pendingK = 0;
			player.pendingD = 0;
			player.pendingC = 0;
			const shots = pendingShots.splice(0, 8);
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
				shots
			}).then((res) => {
				if (!res.ok || !player) {
					player && (player.pendingXp += dxp);
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
				if (player) player.pendingXp += dxp;
			});
		}
	}
	function syncHumans(humans) {
		const names = new Set(humans.map((h) => h.nick));
		for (const a of actors) {
			if (!a.remote) continue;
			if (!names.has(a.name)) a.state = "gone";
		}
		for (const h of humans) {
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
					xp: h.lvl * 80,
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
			a.state = h.hp <= 0 ? "down" : "live";
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
	const humanMeshes = [
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
	];
	function park(i) {
		for (const mesh of humanMeshes) pose(mesh, i, 0, -80, 0, 0, 0, 0, .001, .001, .001);
		pose(faceM, i, 0, -80, 0, 0, 0, 0, .001, .001, .001);
	}
	function drawMutant(i, a, x, y, z, down, flash) {
		const yaw = a.yaw;
		const face = yaw + Math.PI;
		const fx = -Math.sin(yaw);
		const fz = -Math.cos(yaw);
		const rxx = Math.cos(yaw);
		const rzz = -Math.sin(yaw);
		const sway = down ? 0 : Math.cos(a.anim) * .055;
		x += rxx * sway;
		z += rzz * sway;
		const step = Math.sin(a.anim);
		const bob = down ? 0 : Math.abs(Math.cos(a.anim)) * .05;
		const skin = a.kind === "mummy" ? 16052444 : a.kind === "necro" ? 14221210 : 13170026;
		const rag = a.kind === "mummy" ? 16249316 : 6977604;
		const boneC = 15788760;
		const wound = 3809300;
		const hang = (pitch, len) => ({
			y: -Math.cos(pitch) * len,
			f: Math.sin(pitch) * len
		});
		const bodyPitch = down ? 1.15 : .5 + step * .05;
		const bodyY = y + (down ? .32 : .84 + bob);
		poseYP(zBody, i, x + fx * .08, bodyY, z + fz * .08, bodyPitch, face, step * .09, .68, .5, .4);
		paint(zBody, i, rag, flash);
		poseYP(zHump, i, x - fx * .16, bodyY + .16, z - fz * .16, bodyPitch - .25, face, 0, .34, .26, .28);
		paint(zHump, i, skin, flash);
		poseYP(zSpike, i, x - fx * .2, bodyY + .12, z - fz * .2, bodyPitch - .9, face, 0, .06, .18, .06);
		paint(zSpike, i, boneC, flash);
		poseYP(zBump, i, x - fx * .18, bodyY - .02, z - fz * .18, bodyPitch - .45, face, 0, .09, .16, .09);
		paint(zBump, i, boneC, flash);
		poseYP(zRib, i, x + fx * .22, bodyY + .02, z + fz * .22, bodyPitch, face, 0, .42, .06, .1);
		paint(zRib, i, wound, flash);
		const neckY = y + (down ? .4 : 1.02 + bob);
		poseYP(zNeck, i, x + fx * .22, neckY, z + fz * .22, bodyPitch * .65, face, step * .1, .14, .16, .14);
		paint(zNeck, i, skin, flash);
		const headY = y + (down ? .48 : 1.24 + bob);
		const headPitch = down ? .85 : .36 + Math.sin(a.anim * .5) * .07;
		poseYP(zHead, i, x + fx * .34, headY, z + fz * .34, headPitch, face, step * .05, .5, .46, .48);
		paint(zHead, i, skin, flash);
		poseYP(zJaw, i, x + fx * .52, headY - .18, z + fz * .52, headPitch + .42 + Math.abs(step) * .12, face, 0, .22, .06, .16);
		paint(zJaw, i, 1056780, flash);
		poseYP(zBrow, i, x + fx * .56, headY + .1, z + fz * .56, headPitch - .2, face, 0, .4, .07, .1);
		paint(zBrow, i, 1716240, flash);
		poseYP(zEye, i, 0, -80, 0, 0, 0, 0, .001, .001, .001);
		poseYP(zFace, i, x + fx * .6, headY - .02, z + fz * .6, headPitch, face, 0, down ? .001 : .5, down ? .001 : .54, 1);
		poseYP(zEarL, i, x + rxx * .27 + fx * .24, headY + .02, z + rzz * .27 + fz * .24, headPitch, face, .7, .06, .2, .04);
		paint(zEarL, i, skin, flash);
		poseYP(zEarR, i, x - rxx * .27 + fx * .24, headY + .02, z - rzz * .27 + fz * .24, headPitch, face, -.7, .06, .2, .04);
		paint(zEarR, i, skin, flash);
		poseYP(zBand, i, x - fx * .02, bodyY + .04, z - fz * .02, bodyPitch, face, 0, .14, .09, .48);
		paint(zBand, i, TEAMS[a.team].hex, 0);
		const solve = (df, dy, L1, L2) => {
			let f = df;
			let d = dy;
			let dist = Math.hypot(f, d) || .001;
			const maxR = L1 + L2 - .02;
			if (dist > maxR) {
				const k = maxR / dist;
				f *= k;
				d *= k;
				dist = maxR;
			}
			const to = Math.atan2(f, -d);
			const cosA = Math.min(1, Math.max(-1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist || 1)));
			const upper = to + Math.acos(cosA);
			const kF = Math.sin(upper) * L1;
			const kY = -Math.cos(upper) * L1;
			return {
				upper,
				lower: Math.atan2(f - kF, -(d - kY))
			};
		};
		const span = (mesh, hx, hy, hz, pitch, len, sx, sy, sz, color) => {
			const mid = hang(pitch, len * .5);
			poseYP(mesh, i, hx + fx * mid.f, hy + mid.y, hz + fz * mid.f, Math.PI - pitch, face, 0, sx, sy, sz);
			paint(mesh, i, color, flash);
			const end = hang(pitch, len);
			return {
				x: hx + fx * end.f,
				y: hy + end.y,
				z: hz + fz * end.f
			};
		};
		const swipe = !down && a.cd > .45;
		const arm = (side, phase, upper, fore, hand, claw0, clawA, clawB, shoulder) => {
			const sx = x + rxx * .4 * side;
			const sy = y + (down ? .38 : .98 + bob);
			const sz = z + rzz * .4 * side;
			poseYP(shoulder, i, sx, sy + .06, sz, bodyPitch, face, side * .4, .22, .14, .2);
			paint(shoulder, i, a.kind === "mummy" ? rag : skin, flash);
			const lift = down ? 0 : Math.max(0, Math.cos(phase));
			let handF = down ? .05 : .06 + Math.sin(phase) * .4;
			let handY = down ? y + .08 : sy - .8 + lift * .18;
			if (swipe && side < 0) {
				handF = .72;
				handY = sy - .15;
			}
			const sol = solve(handF, handY - sy, .36, .34);
			const elbow = span(upper, sx, sy, sz, sol.upper, .36, .15, .36, .15, skin);
			const wrist = span(fore, elbow.x, elbow.y, elbow.z, sol.lower, .34, .12, .34, .12, skin);
			poseYP(hand, i, wrist.x, wrist.y, wrist.z, Math.PI - sol.lower, face, 0, .15, .11, .13);
			paint(hand, i, skin, flash);
			const claws = [
				clawA,
				claw0,
				clawB
			];
			for (let k = -1; k <= 1; k++) {
				const ox = wrist.x + rxx * side * k * .055;
				const oy = wrist.y;
				const oz = wrist.z + rzz * side * k * .055;
				span(claws[k + 1], ox, oy, oz, sol.lower + .25, .16, .035, .16, .03, boneC);
			}
		};
		arm(1, a.anim + Math.PI, zArmL, zForeL, zHandL, zClawL, zClawL2, zClawL3, zShoulderL);
		arm(-1, a.anim, zArmR, zForeR, zHandR, zClawR, zClawR2, zClawR3, zShoulderR);
		const leg = (side, phase, thigh, shin, foot) => {
			const hx = x + rxx * .15 * side;
			const hy = y + (down ? .18 : .56 + bob * .4);
			const hz = z + rzz * .15 * side;
			const lift = down ? 0 : Math.max(0, Math.cos(phase));
			const footF = down ? .05 : Math.sin(phase) * .32;
			const footY = down ? y + .05 : y + .05 + lift * .24;
			const sol = solve(footF, footY - hy, .34, .32);
			const knee = span(thigh, hx, hy, hz, sol.upper, .34, .17, .34, .17, skin);
			const ankle = span(shin, knee.x, knee.y, knee.z, sol.lower, .32, .13, .32, .13, a.kind === "necro" ? boneC : skin);
			poseYP(foot, i, ankle.x + fx * .08, Math.max(y + .04, ankle.y), ankle.z + fz * .08, down ? 1.15 : .12, face, 0, .16, .07, .3);
			paint(foot, i, 1715218, flash);
		};
		leg(1, a.anim, zLegL, zShinL, zFootL);
		leg(-1, a.anim + Math.PI, zLegR, zShinR, zFootR);
		const ragW = a.kind === "mummy" ? 1.35 : .9;
		const flap = (side, mesh, phase) => {
			const hx = x + rxx * .2 * side + fx * .02;
			const hy = y + (down ? .26 : .58);
			const hz = z + rzz * .2 * side + fz * .02;
			const p = down ? 1.15 : .28 + Math.sin(phase) * .5;
			span(mesh, hx, hy, hz, p, .4 * ragW, .12 * ragW, .4 * ragW, .04, rag);
		};
		flap(1, zRagL, a.anim);
		flap(-1, zRagR, a.anim + 1.4);
	}
	function render() {
		const t = (clockParts().hoursF - 6) / 24 * Math.PI * 2;
		const sunV = tmp.set(Math.cos(t), Math.sin(t), .25).normalize();
		const day = MathUtils.smoothstep(sunV.y, -.25, .45);
		skyMat.color.setRGB(.22 + day * .78, .28 + day * .72, .55 + day * .45);
		hemi.intensity = .28 + day * .4;
		hemi.color.set(day > .4 ? 13625087 : 2240580);
		sun.intensity = .35 + day * 1.35;
		sun.position.copy(sunV).multiplyScalar(70);
		sunDisc.position.copy(sunV).multiplyScalar(300);
		sunDisc.material.color.set(day > .25 ? 16774064 : 16756858);
		clouds.position.x = Math.sin(performance.now() / 8e3) * 6;
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
		fog.color.set(day > .35 ? 9356526 : 1713988);
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
			const ch = CHAR_BY_ID[a?.charId || corpse?.charId || "angel"] || CHARACTERS[0];
			const team = a?.team ?? corpse?.team ?? 0;
			const x = a?.x ?? corpse.x;
			const y = a?.y ?? corpse.y;
			const z = a?.z ?? corpse.z;
			const face = (a?.yaw ?? 0) + Math.PI;
			const down = a?.state === "down" || !!corpse;
			const sheep = (a?.sheep || 0) > 0;
			const flash = a?.flash || 0;
			const gray = !!corpse || a?.hp === 0 && a?.state !== "down";
			if (a?.minion) {
				park(i);
				if (zi < ZMAX) drawMutant(zi++, a, x, y, z, down, flash);
				continue;
			}
			const swing = a ? Math.sin(a.anim) * (a.grounded ? .7 : .2) : 0;
			const bob = a && a.grounded ? Math.abs(Math.sin(a.anim)) * .06 : 0;
			const roll = a ? a.roll > 0 ? (1 - a.roll / .48) * Math.PI * 2 : 0 : 0;
			const rx = down ? 1.25 : roll;
			const hy = down ? .4 : 0;
			const look = lookOf(ch);
			const yaw = a?.yaw ?? 0;
			const fx = -Math.sin(yaw);
			const fz = -Math.cos(yaw);
			const rxx = -Math.cos(face);
			const rzz = Math.sin(face);
			const sc = (ch.style === "round" || sheep ? 1.15 : look.petite) * (a?.flat ? 1.15 : 1);
			const human = sheep ? .001 : 1;
			const cloth = gray ? 9079434 : sheep ? 16774890 : a?.minion ? 7178850 : ch.cloth;
			const skin = gray ? 10132122 : ch.skin;
			const hair = gray ? 7829367 : ch.hair;
			const bodyY = y + (down ? .45 : 1.02 + bob);
			const headY = y + (down ? .72 : 1.58 + bob) + hy;
			pose(bodyM, i, x, bodyY, z, rx, face, 0, .52 * sc * (a?.flat ? 1.25 : 1), (down ? .36 : .58) * (sheep ? .85 : 1) * (a?.flat ? .4 : 1), .36 * sc);
			paint(bodyM, i, cloth, flash);
			const headS = sheep || ch.style === "round" ? .78 : ch.style === "doll" || ch.style === "goth" ? .62 : .56;
			pose(headM, i, x, headY, z, 0, face, 0, headS, headS * (ch.style === "doll" ? 1.05 : 1), headS);
			paint(headM, i, sheep ? 16774890 : skin, flash);
			const bang = look.bangs;
			pose(hairM, i, x + fx * .16, headY + .16, z + fz * .16, down ? .6 : 0, face, 0, bang[0] * human, bang[1] * human, bang[2] * human);
			paint(hairM, i, hair, flash);
			const hb = look.hair;
			pose(hairBackM, i, x - fx * .2, headY + hb[3], z - fz * .2, down ? 1.1 : 0, face, 0, hb[0] * human, hb[1] * human, hb[2] * human);
			paint(hairBackM, i, hair, flash);
			const ps = Math.max(.001, look.puff * human);
			pose(hairLM, i, x + rxx * look.puffX, headY + look.puffY, z + rzz * look.puffX, 0, face, 0, ps, ps, ps);
			paint(hairLM, i, hair, flash);
			pose(hairRM, i, x - rxx * look.puffX, headY + look.puffY, z - rzz * look.puffX, 0, face, 0, ps, ps, ps);
			paint(hairRM, i, hair, flash);
			const sk = Math.max(.001, look.skirt * human);
			pose(skirtM, i, x, y + (down ? .28 : .58), z, down ? 1.2 : 0, face, 0, .92 * sk, down ? .12 : .34 * Math.min(sk, 1), .66 * sk);
			paint(skirtM, i, gray ? 9079434 : look.skirtColor || cloth, flash);
			const ws = look.wings > 0 && !sheep && !gray ? look.wings : .001;
			const flap = Math.sin(performance.now() / 160 + i) * .45;
			pose(wingLM, i, x + rxx * .32 - fx * .12, bodyY + .28, z + rzz * .32 - fz * .12, .15 + flap * .35, face, .35, .05 * ws, .28 * ws, .62 * ws);
			paint(wingLM, i, look.wingColor, 0);
			pose(wingRM, i, x - rxx * .32 - fx * .12, bodyY + .28, z - rzz * .32 - fz * .12, .15 + flap * .35, face, -.35, .05 * ws, .28 * ws, .62 * ws);
			paint(wingRM, i, look.wingColor, 0);
			const pk = look.pack > 0 && !sheep ? look.pack : .001;
			pose(packM, i, x - fx * .28, bodyY + .08, z - fz * .28, 0, face, 0, .36 * pk, .42 * pk, .22 * pk);
			paint(packM, i, look.packColor, flash);
			const wid = a ? loadout(ch)[a.weapon % loadout(ch).length] || "plasma" : "plasma";
			const gunLen = wid === "sniper" || wid === "rocket" ? .72 : wid === "knife" || wid === "melee" ? .28 : .46;
			const showGun = !down && !sheep && !gray;
			pose(gunM, i, x + rxx * .48 + fx * .28, bodyY + Math.sin(swing) * .12, z + rzz * .48 + fz * .28, -.2, face, 0, showGun ? .1 : .001, showGun ? .1 : .001, showGun ? gunLen : .001);
			paint(gunM, i, wid === "flame" ? 16738877 : wid === "sniper" ? 14149572 : 9347256, flash);
			pose(handM, i, x + rxx * .4, y + (down ? .4 : 1.02) + Math.sin(swing) * .2, z + rzz * .4, swing, face, 0, down || sheep ? .001 : .32, .32, .32);
			paint(handM, i, TEAMS[team].hex, flash);
			pose(handRM, i, x - rxx * .4, y + (down ? .38 : 1.05) - Math.sin(swing) * .2, z - rzz * .4, -swing, face, 0, down || sheep ? .001 : .32, .32, .32);
			paint(handRM, i, skin, flash);
			pose(footM, i, x + rxx * .16, y + (down ? .15 : .14 + Math.max(0, -Math.sin(swing)) * .1), z + rzz * .16, -swing, face, 0, down ? .001 : .32, .16, .46);
			paint(footM, i, ch.ability === "shadow" ? 1118232 : 2761756, flash);
			pose(footRM, i, x - rxx * .16, y + (down ? .15 : .14 + Math.max(0, Math.sin(swing)) * .1), z - rzz * .16, swing, face, 0, down ? .001 : .32, .16, .46);
			paint(footRM, i, ch.ability === "shadow" ? 1118232 : 2761756, flash);
			const halo = ch.ability === "glide" && !gray && !down && !sheep;
			pose(haloM, i, x, headY + .55, z, Math.PI / 2.4, performance.now() / 900, 0, halo ? 1.05 : .001, halo ? 1.05 : .001, halo ? 1.05 : .001);
			paint(haloM, i, 16771466, 0);
			const faceS = sheep || gray ? .001 : down ? .55 : headS * .92;
			pose(faceM, i, x + fx * (headS * .42), headY + .02, z + fz * (headS * .42), down ? .5 : 0, face, 0, faceS, faceS * 1.08, 1);
			pose(blobM, i, x, y + .06, z, -Math.PI / 2, 0, 0, .85, .85, .85);
			paint(blobM, i, 0, 0);
		}
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
		]) {
			mesh.count = n;
			mesh.instanceMatrix.needsUpdate = true;
			if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
		}
		faceM.count = n;
		faceM.instanceMatrix.needsUpdate = true;
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
		]) {
			mesh.count = zi;
			mesh.instanceMatrix.needsUpdate = true;
			if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
		}
		zEye.count = zi;
		zEye.instanceMatrix.needsUpdate = true;
		zFace.count = zi;
		zFace.instanceMatrix.needsUpdate = true;
		balls.forEach((b, i) => {
			if (i >= 40) return;
			mat.compose(pos.set(b.x, b.y, b.z), quat.identity(), scl.set(1, 1, 1));
			ballM.setMatrixAt(i, mat);
			col.setHex(b.kind === "rocket" ? 16738877 : b.kind === "laugh" ? 16769354 : 8057087);
			ballM.setColorAt(i, col);
		});
		ballM.count = Math.min(40, balls.length);
		ballM.instanceMatrix.needsUpdate = true;
		if (ballM.instanceColor) ballM.instanceColor.needsUpdate = true;
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
		}
		drawMini(ctx, w, h);
	}
	function drawMini(ctx, w, h) {
		if (!player) return;
		const R = Math.min(78, w * .18);
		const cx = 24 + R;
		const cy = h - 24 - R;
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
			spectate: false
		};
	}
	function emit() {
		const c = clockParts();
		const rows = actors.filter((a) => a.state !== "gone").map((a) => ({
			team: a.team,
			name: a.name,
			lvl: xpToLevel(a.xp).lvl,
			rank: rankForLevel(xpToLevel(a.xp).lvl).id,
			k: a.kills,
			d: a.deaths,
			xp: Math.floor(a.xp),
			me: a === player
		}));
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
			banner: performance.now() - bannerAt < 1800 ? banner : "",
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
			spectate
		};
		for (const s of subs) s();
	}
	function applyQuality(q) {
		quality = q;
		const pr = q === "low" ? .8 : q === "high" ? Math.min(1.6, window.devicePixelRatio || 1) : 1;
		renderer.setPixelRatio(pr);
		renderer.shadowMap.enabled = false;
		sun.castShadow = false;
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
			line(`pilot ${info.nick} on ${TEAMS[info.team].name}`);
			line("link up · prediction live");
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
