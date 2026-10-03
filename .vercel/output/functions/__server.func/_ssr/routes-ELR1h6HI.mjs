import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Maximize2, c as Eye, i as Settings, o as Map$1, r as Terminal, s as List, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-ELR1h6HI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchBoard = createServerFn({ method: "GET" }).handler(createSsrRpc("38de277d04ff73509a671fe012d752d1ca5fd2e381741a4062895e2889124e63"));
var joinMount = createServerFn({ method: "POST" }).validator((input) => ({
	nick: String(input?.nick ?? ""),
	password: String(input?.password ?? ""),
	team: Number(input?.team ?? 0),
	charId: String(input?.charId ?? "angel")
})).handler(createSsrRpc("7f0f5192eafa87df62a9a26a998e8b403257215abb90756e135fc90ee16d8925"));
var pulseMount = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("1287837d9f5e5647a3b5b13e52250686e368193d74072347df5a97c9c571f25c"));
var bound = null;
var chatFns = /* @__PURE__ */ new Set();
var announceFns = /* @__PURE__ */ new Set();
function bindRelay(next) {
	bound?.close();
	bound = next;
}
function relayBound() {
	return !!bound;
}
function sendRelayChat(text) {
	bound?.chat(text);
}
function sendRelayAnnounce(text) {
	bound?.announce(text);
}
function onRelayAnnounce(fn) {
	announceFns.add(fn);
	return () => {
		announceFns.delete(fn);
	};
}
function onRelayChat(fn) {
	chatFns.add(fn);
	return () => {
		chatFns.delete(fn);
	};
}
async function netPulse(body) {
	if (bound) return bound.pulse(body);
	return pulseMount({ data: body });
}
function connectRelay(url) {
	return new Promise((resolve, reject) => {
		let sock;
		try {
			sock = new WebSocket(url);
		} catch {
			reject(/* @__PURE__ */ new Error("bad address"));
			return;
		}
		const waiters = /* @__PURE__ */ new Map();
		let seq = 1;
		let opened = false;
		let openedHandle = null;
		const timer = window.setTimeout(() => {
			if (!opened) {
				sock.close();
				reject(/* @__PURE__ */ new Error("timeout"));
			}
		}, 4e3);
		function send(op, extra) {
			const id = seq++;
			const payload = JSON.stringify({
				op,
				id,
				...extra
			});
			const done = new Promise((ok, fail) => {
				waiters.set(id, {
					ok,
					fail
				});
			});
			sock.send(payload);
			return done;
		}
		sock.addEventListener("open", () => {
			opened = true;
			window.clearTimeout(timer);
			let token = "";
			const handle = {
				async join(nick, password, team, charId) {
					const msg = await send("join", {
						nick,
						password,
						team,
						charId
					});
					if (msg.ok !== true) return {
						ok: false,
						error: String(msg.error || "Join failed.")
					};
					token = String(msg.token || "");
					const profile = msg.profile;
					return {
						ok: true,
						token,
						profile,
						board: Array.isArray(msg.board) ? msg.board : []
					};
				},
				async pulse(body) {
					const msg = await send("pulse", body);
					if (!msg.ok) return {
						ok: false,
						error: String(msg.error || "Pulse failed.")
					};
					return msg;
				},
				chat(text) {
					const clean = text.replace(/\s+/g, " ").trim().slice(0, 160);
					if (!token || !clean) return;
					sock.send(JSON.stringify({
						op: "chat",
						id: seq++,
						token,
						text: clean
					}));
				},
				announce(text) {
					const clean = text.replace(/\s+/g, " ").trim().slice(0, 180);
					if (!token || !clean) return;
					sock.send(JSON.stringify({
						op: "announce",
						id: seq++,
						token,
						text: clean
					}));
				},
				close() {
					sock.close();
				}
			};
			openedHandle = handle;
			resolve(handle);
		});
		sock.addEventListener("message", (ev) => {
			let msg;
			try {
				msg = JSON.parse(String(ev.data));
			} catch {
				return;
			}
			if (msg.op === "announce" && typeof msg.text === "string") {
				const text = msg.text.slice(0, 180);
				for (const fn of announceFns) fn(text);
				return;
			}
			if (msg.op === "chat" && typeof msg.nick === "string" && typeof msg.text === "string") {
				const line = {
					nick: msg.nick.slice(0, 16),
					team: Number(msg.team) || 0,
					text: msg.text.slice(0, 160)
				};
				for (const fn of chatFns) fn(line);
				return;
			}
			const id = Number(msg.id);
			const waiter = waiters.get(id);
			if (!waiter) return;
			waiters.delete(id);
			waiter.ok(msg);
		});
		sock.addEventListener("error", () => {
			if (!opened) reject(/* @__PURE__ */ new Error("unreachable"));
		});
		sock.addEventListener("close", () => {
			for (const waiter of waiters.values()) waiter.fail(/* @__PURE__ */ new Error("closed"));
			waiters.clear();
			if (bound === openedHandle) bound = null;
		});
	});
}
var TEAMS = [
	{
		id: 0,
		name: "Citrus",
		short: "CIT",
		color: "#c6e35a",
		hex: 13034330,
		base: [0, -88]
	},
	{
		id: 1,
		name: "Voltage",
		short: "VLT",
		color: "#3ec6ff",
		hex: 4114175,
		base: [-76, 44]
	},
	{
		id: 2,
		name: "Code Red",
		short: "RED",
		color: "#ff5a68",
		hex: 16734824,
		base: [76, 44]
	}
];
var WEAPON_BY_ID = Object.fromEntries([
	{
		id: "plasma",
		name: "Plasma Rifle",
		kind: "trace",
		dmg: 11,
		head: 18,
		cd: .11,
		speed: 0,
		auto: true
	},
	{
		id: "dual",
		name: "Twin Popguns",
		kind: "trace",
		dmg: 16,
		head: 26,
		cd: .18,
		speed: 0,
		auto: false
	},
	{
		id: "sniper",
		name: "Glass Rifle",
		kind: "trace",
		dmg: 72,
		head: 140,
		cd: .95,
		speed: 0,
		auto: false
	},
	{
		id: "rocket",
		name: "Rocket Tube",
		kind: "rocket",
		dmg: 54,
		head: 54,
		cd: .85,
		speed: 26,
		auto: false
	},
	{
		id: "bounce",
		name: "Bounce Ball",
		kind: "bounce",
		dmg: 28,
		head: 28,
		cd: .55,
		speed: 18,
		auto: false
	},
	{
		id: "laugh",
		name: "Laugh Grenade",
		kind: "laugh",
		dmg: 26,
		head: 26,
		cd: .9,
		speed: 14,
		auto: false
	},
	{
		id: "flame",
		name: "Party Torch",
		kind: "flame",
		dmg: 28,
		head: 28,
		cd: .08,
		speed: 0,
		auto: true
	},
	{
		id: "melee",
		name: "Bat",
		kind: "melee",
		dmg: 42,
		head: 58,
		cd: .42,
		speed: 0,
		auto: false
	},
	{
		id: "knife",
		name: "Knife",
		kind: "melee",
		dmg: 48,
		head: 70,
		cd: .36,
		speed: 0,
		auto: false
	},
	{
		id: "drone",
		name: "Drone Launcher",
		kind: "drone",
		dmg: 46,
		head: 46,
		cd: 1.1,
		speed: 12,
		auto: false
	}
].map((w) => [w.id, w]));
var CHARACTERS = [
	{
		id: "angel",
		name: "Seraph Doll",
		blurb: "Petite white-haired angel. Wings, halo, hold jump to glide.",
		hair: 16774890,
		cloth: 16774360,
		skin: 16769220,
		style: "doll",
		ability: "glide",
		abilityName: "Halo glide",
		weapons: [
			"plasma",
			"laugh",
			"melee"
		],
		jumps: 2,
		voice: 620
	},
	{
		id: "pickme",
		name: "Bluebelle",
		blurb: "Blue-haired spark. Speeds her squad and never stops cheering.",
		hair: 3116287,
		cloth: 16744120,
		skin: 16765624,
		style: "sport",
		ability: "aura",
		abilityName: "Pick-me pulse",
		weapons: [
			"dual",
			"plasma",
			"laugh"
		],
		jumps: 2,
		voice: 540
	},
	{
		id: "goth",
		name: "Noir Nyx",
		blurb: "Petite, straight black hair, long shadow dash.",
		hair: 1314328,
		cloth: 3810384,
		skin: 15978680,
		style: "goth",
		ability: "shadow",
		abilityName: "Shadow dash",
		weapons: [
			"plasma",
			"knife",
			"laugh"
		],
		jumps: 2,
		voice: 300
	},
	{
		id: "bestie",
		name: "Bestie Bea",
		blurb: "The goth's best friend. Fast revive, shared heal, everybody happy.",
		hair: 16752324,
		cloth: 16735123,
		skin: 16765104,
		style: "doll",
		ability: "bestie",
		abilityName: "Bestie pulse",
		weapons: [
			"plasma",
			"laugh",
			"melee"
		],
		jumps: 2,
		voice: 580
	},
	{
		id: "puff",
		name: "Puffstar",
		blurb: "Inhale, float, then flatten into a slide. Original, not a copy.",
		hair: 16747220,
		cloth: 16736162,
		skin: 16758741,
		style: "round",
		ability: "puff",
		abilityName: "Inhale",
		weapons: [
			"bounce",
			"plasma",
			"melee"
		],
		jumps: 2,
		voice: 700
	},
	{
		id: "bunny",
		name: "Hopscotch",
		blurb: "Chain jumps to run faster and bounce higher, up to a cap.",
		hair: 16773314,
		cloth: 16747069,
		skin: 16765616,
		style: "sport",
		ability: "bunny",
		abilityName: "Bunny chain",
		weapons: [
			"plasma",
			"laugh",
			"melee"
		],
		jumps: 2,
		voice: 640
	},
	{
		id: "trips",
		name: "Triple Mint",
		blurb: "Three jumps. Everyone else still gets two.",
		hair: 12124111,
		cloth: 6543008,
		skin: 16769224,
		style: "sport",
		ability: "triple",
		abilityName: "Triple jump",
		weapons: [
			"plasma",
			"bounce",
			"melee"
		],
		jumps: 3,
		voice: 600
	},
	{
		id: "boomer",
		name: "Boomer",
		blurb: "Rockets that shove you skyward when they pop.",
		hair: 16738877,
		cloth: 15778122,
		skin: 15777952,
		style: "sport",
		ability: "rocket",
		abilityName: "Rocket jump",
		weapons: [
			"rocket",
			"plasma",
			"melee"
		],
		jumps: 2,
		voice: 280
	},
	{
		id: "buzz",
		name: "Buzz",
		blurb: "Hovers like a drone and launches stalking buzzbombs.",
		hair: 10474751,
		cloth: 2765636,
		skin: 14206128,
		style: "sport",
		ability: "drone",
		abilityName: "Hover",
		weapons: [
			"drone",
			"plasma",
			"melee"
		],
		jumps: 2,
		voice: 480
	},
	{
		id: "lark",
		name: "Skylark",
		blurb: "Flaps like a bird. Fuel comes back when you land.",
		hair: 16769162,
		cloth: 8308991,
		skin: 16767164,
		style: "bird",
		ability: "bird",
		abilityName: "Flap",
		weapons: [
			"plasma",
			"laugh",
			"melee"
		],
		jumps: 2,
		voice: 720
	},
	{
		id: "pack",
		name: "Packrat",
		blurb: "Backpack thruster. Hold jump in the air.",
		hair: 13153952,
		cloth: 7049073,
		skin: 15254180,
		style: "sport",
		ability: "jet",
		abilityName: "Backpack",
		weapons: [
			"plasma",
			"rocket",
			"melee"
		],
		jumps: 2,
		voice: 360
	},
	{
		id: "pin",
		name: "Pinpop",
		blurb: "Voodoo rite. Raises a fallen body as a friendly soldier.",
		hair: 7027967,
		cloth: 2365488,
		skin: 13146232,
		style: "goth",
		ability: "voodoo",
		abilityName: "Rise",
		weapons: [
			"plasma",
			"laugh",
			"melee"
		],
		jumps: 2,
		voice: 260
	},
	{
		id: "wrap",
		name: "Wrapley",
		blurb: "Mummy rite. Tougher risen soldiers.",
		hair: 16051416,
		cloth: 15128504,
		skin: 14205594,
		style: "doll",
		ability: "mummy",
		abilityName: "Unwrap",
		weapons: [
			"plasma",
			"melee",
			"laugh"
		],
		jumps: 2,
		voice: 240
	},
	{
		id: "bone",
		name: "Bonecaller",
		blurb: "Necromancer rite. Slower risen, harder hits.",
		hair: 14155752,
		cloth: 2109480,
		skin: 15390916,
		style: "goth",
		ability: "necro",
		abilityName: "Call bones",
		weapons: [
			"plasma",
			"bounce",
			"knife"
		],
		jumps: 2,
		voice: 220
	},
	{
		id: "glass",
		name: "Glasseye",
		blurb: "Sniper. Right mouse is a lens, not a spray.",
		hair: 13227752,
		cloth: 1976868,
		skin: 15782068,
		style: "doll",
		ability: "snipe",
		abilityName: "Steady lens",
		weapons: [
			"sniper",
			"plasma",
			"knife"
		],
		jumps: 2,
		voice: 400
	},
	{
		id: "twin",
		name: "Twinstitch",
		blurb: "Dual popguns. Both shots meet on the crosshair.",
		hair: 16735912,
		cloth: 2106926,
		skin: 16765112,
		style: "sport",
		ability: "dual",
		abilityName: "Twin burst",
		weapons: [
			"dual",
			"plasma",
			"laugh"
		],
		jumps: 2,
		voice: 560
	},
	{
		id: "cinder",
		name: "Cinderpop",
		blurb: "Short cute flamethrower cone.",
		hair: 16731438,
		cloth: 3809304,
		skin: 15775896,
		style: "sport",
		ability: "flame",
		abilityName: "Torch",
		weapons: [
			"flame",
			"plasma",
			"laugh"
		],
		jumps: 2,
		voice: 340
	},
	{
		id: "bleat",
		name: "Superbleat",
		blurb: "Fly as a kamikaze lamb, pop, then hop out alive.",
		hair: 16774890,
		cloth: 16250866,
		skin: 16771288,
		style: "round",
		ability: "sheep",
		abilityName: "Superbleat",
		weapons: [
			"plasma",
			"laugh",
			"melee"
		],
		jumps: 2,
		voice: 660
	},
	{
		id: "blocky",
		name: "Blocky",
		blurb: "Places pads, walls, turrets and traps faster.",
		hair: 9425231,
		cloth: 4880946,
		skin: 15780008,
		style: "sport",
		ability: "builder",
		abilityName: "Foreman",
		weapons: [
			"plasma",
			"bounce",
			"melee"
		],
		jumps: 2,
		voice: 420
	},
	{
		id: "wallaby",
		name: "Wallaby",
		blurb: "Wallrides almost without falling.",
		hair: 16765562,
		cloth: 15686460,
		skin: 16306868,
		style: "sport",
		ability: "wall",
		abilityName: "Long ride",
		weapons: [
			"plasma",
			"melee",
			"laugh"
		],
		jumps: 2,
		voice: 500
	}
];
var CHAR_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
var BUILD_ACTIONS = [
	{
		id: "ability",
		name: "Signature"
	},
	{
		id: "block",
		name: "Block"
	},
	{
		id: "jump",
		name: "Jump pad"
	},
	{
		id: "turbo",
		name: "Turbo pad"
	},
	{
		id: "turret",
		name: "Turret"
	},
	{
		id: "mine",
		name: "Mine"
	},
	{
		id: "tangle",
		name: "Tangle"
	},
	{
		id: "tele",
		name: "Telepad"
	}
];
var RANKS = [
	{
		id: "Rct",
		name: "Recruit",
		lvl: 1
	},
	{
		id: "Pvt",
		name: "Private",
		lvl: 3
	},
	{
		id: "PFC",
		name: "Private FC",
		lvl: 6
	},
	{
		id: "Cpl",
		name: "Corporal",
		lvl: 10
	},
	{
		id: "Sgt",
		name: "Sergeant",
		lvl: 15
	},
	{
		id: "SSgt",
		name: "Staff Sergeant",
		lvl: 22
	},
	{
		id: "SFC",
		name: "Sergeant FC",
		lvl: 30
	},
	{
		id: "MSgt",
		name: "Master Sergeant",
		lvl: 40
	},
	{
		id: "1SG",
		name: "First Sergeant",
		lvl: 52
	},
	{
		id: "SGM",
		name: "Sergeant Major",
		lvl: 66
	},
	{
		id: "2LT",
		name: "Second Lieutenant",
		lvl: 82
	},
	{
		id: "1LT",
		name: "First Lieutenant",
		lvl: 100
	},
	{
		id: "Cpt",
		name: "Captain",
		lvl: 122
	},
	{
		id: "Maj",
		name: "Major",
		lvl: 148
	},
	{
		id: "LTC",
		name: "Lt. Colonel",
		lvl: 178
	},
	{
		id: "Col",
		name: "Colonel",
		lvl: 214
	},
	{
		id: "BGen",
		name: "Brigadier",
		lvl: 256
	},
	{
		id: "MGen",
		name: "Major General",
		lvl: 306
	},
	{
		id: "LGen",
		name: "Lt. General",
		lvl: 366
	},
	{
		id: "Gen",
		name: "General",
		lvl: 440
	}
];
function xpToLevel(xp) {
	let lvl = 1;
	let need = 80;
	let left = Math.max(0, xp);
	while (left >= need && lvl < 500) {
		left -= need;
		lvl += 1;
		need = Math.floor(need * 1.14 + 22);
	}
	return {
		lvl,
		into: left,
		need
	};
}
function rankForLevel(lvl) {
	let index = 0;
	for (let i = 0; i < RANKS.length; i++) if (lvl >= RANKS[i].lvl) index = i;
	return {
		...RANKS[index],
		index
	};
}
var BOT_NAMES = [
	"Limewire",
	"Fizz",
	"Coco",
	"Halo",
	"Nim",
	"Pebble",
	"Soda",
	"Juniper",
	"Dewdrop",
	"Zest",
	"Mango",
	"Kiwi",
	"Volt",
	"Neon",
	"Glint",
	"Byte",
	"Orbit",
	"Pixel",
	"Quark",
	"Lumen",
	"Static",
	"Comet",
	"Nova",
	"Ion",
	"Chili",
	"Brick",
	"Ruby",
	"Ember",
	"Salsa",
	"Rouge",
	"Coral",
	"Mars",
	"Pepper",
	"Brickie",
	"Rook",
	"Hex"
];
var LINES = {
	jump: "joohoo!",
	double: "boing boing!",
	triple: "wheee!",
	dash: "let's go!",
	wall: "hup!",
	water: "splish!",
	land: "phew!",
	down: "help!",
	sheep: "baaaa!",
	yay: "jeehee!",
	ride: "chuchu!",
	puff: "whooo!",
	groan: "graaah!"
};
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
var REMEMBER = "mountdew.gate.v1";
var REG = "mountdew.reg.v1";
var GFX = "mountdew.gfx";
var RELAY = "mountdew.relay";
var PUBLIC_SITE = "https://mountdew.oops.wtf";
var SERVERS = [
	"wss://mountdew.oops.wtf:8888",
	"wss://mountdew.groups.id:8888",
	"wss://mountdew.tantrum.org:8888"
];
var SERVER_LABEL = [
	"Primary",
	"Fallback",
	"Third"
];
var ASCII = ` __  __  ___  _   _ _   _ _____
|  \\/  |/ _ \\| | | | \\ | |_   _|
| |\\/| | | | | | | |  \\| | | |
| |  | | |_| | |_| | |\\  | | |
|_|  |_|\\___/ \\___/|_| \\_| |_|
          D E W`;
function Home() {
	const viewRef = (0, import_react.useRef)(null);
	const overlayRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const [nick, setNick] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [relay, setRelay] = (0, import_react.useState)(SERVERS[0]);
	const [serverLive, setServerLive] = (0, import_react.useState)({});
	const [team, setTeam] = (0, import_react.useState)(0);
	const [charId, setCharId] = (0, import_react.useState)("angel");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [phase, setPhase] = (0, import_react.useState)("login");
	const [board, setBoard] = (0, import_react.useState)([]);
	const [hud, setHud] = (0, import_react.useState)(null);
	const [tab, setTab] = (0, import_react.useState)("help");
	const [chat, setChat] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const touch = (0, import_react.useRef)({
		x: 0,
		y: 0,
		fire: false,
		jump: false,
		act: false,
		cycle: false,
		dash: false
	});
	const chatLogRef = (0, import_react.useRef)(null);
	const chatInputRef = (0, import_react.useRef)(null);
	const chatSeq = (0, import_react.useRef)(1);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(REMEMBER);
			if (raw) {
				const saved = JSON.parse(raw);
				if (saved.nick) setNick(saved.nick);
				if (saved.password) setPassword(saved.password);
				if (saved.team === 0 || saved.team === 1 || saved.team === 2) setTeam(saved.team);
				if (saved.charId) setCharId(saved.charId);
			}
			const savedRelay = localStorage.getItem(RELAY);
			if (savedRelay && SERVERS.includes(savedRelay)) setRelay(savedRelay);
			else setRelay(SERVERS[0]);
		} catch {}
		const host = window.location.hostname;
		if (host === "mountdew.oops.wtf" || host === "mountdew.groups.id" || host === "mountdew.tantrum.org" || window.location.port === "8888") for (const url of SERVERS) {
			const health = url.replace(/^wss:/, "https:") + "/health";
			fetch(health).then((res) => res.ok ? res.json() : null).then((body) => {
				if (body && typeof body.pilots === "number") setServerLive((prev) => ({
					...prev,
					[url]: body.pilots
				}));
			}).catch(() => {});
		}
		fetchBoard().then(setBoard).catch(() => setError("Relay quiet. You can still drop in locally."));
		let dead = false;
		let stop = () => {};
		(async () => {
			const mod = await import("./engine-BC8zf6Fg.mjs");
			if (dead || !viewRef.current || !overlayRef.current) return;
			const qa = new URLSearchParams(window.location.search).has("qa");
			const game = mod.createGame(viewRef.current, overlayRef.current, { qa });
			gameRef.current = game;
			const savedGfx = localStorage.getItem(GFX);
			if (savedGfx === "low" || savedGfx === "medium" || savedGfx === "high") game.setQuality(savedGfx);
			stop = game.subscribe(() => setHud(game.getHud()));
			setHud(game.getHud());
			if (qa) enter(game, "PilotQA", "qatest", 0, "angel", true);
		})();
		return () => {
			dead = true;
			stop();
			gameRef.current?.destroy();
			bindRelay(null);
			gameRef.current = null;
		};
	}, []);
	(0, import_react.useEffect)(() => onRelayChat((line) => {
		setChat((prev) => [...prev, {
			...line,
			id: chatSeq.current++
		}].slice(-40));
	}), []);
	(0, import_react.useEffect)(() => onRelayAnnounce((text) => {
		gameRef.current?.pushAnnounce(text);
	}), []);
	(0, import_react.useEffect)(() => {
		const el = chatLogRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [chat]);
	(0, import_react.useEffect)(() => {
		if (phase !== "play") return;
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (e.code !== "Enter") return;
			e.preventDefault();
			document.exitPointerLock();
			chatInputRef.current?.focus();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [phase]);
	function submitChat(e) {
		e.preventDefault();
		const text = draft.replace(/\s+/g, " ").trim().slice(0, 160);
		if (!text) return;
		setDraft("");
		if (relayBound()) sendRelayChat(text);
		else setChat((prev) => [...prev, {
			id: chatSeq.current++,
			nick: nick.trim() || "You",
			team,
			text
		}].slice(-40));
		chatInputRef.current?.blur();
	}
	async function enter(game, name, pass, teamId, hero, qa = false) {
		setBusy(true);
		setError("");
		const clean = name.trim();
		const address = relay.trim();
		if (address && !qa) {
			const order = SERVERS.includes(address) ? [address, ...SERVERS.filter((url) => url !== address)] : [address];
			let linked = false;
			for (const url of order) try {
				const link = await connectRelay(url);
				const res = await link.join(clean, pass, teamId, hero);
				if (!res.ok) {
					link.close();
					setError(res.error);
					setBusy(false);
					return;
				}
				localStorage.setItem(RELAY, url);
				localStorage.setItem(REMEMBER, JSON.stringify({
					nick: clean,
					password: pass,
					team: teamId,
					charId: hero
				}));
				bindRelay(link);
				setRelay(url);
				setBoard(res.board);
				game.deploy({
					nick: res.profile.nick,
					team: teamId,
					charId: hero,
					token: res.token,
					xp: res.profile.xp,
					qa
				});
				game.pushLine(url === SERVERS[0] ? "match server linked" : `linked ${url}`);
				setPhase("play");
				linked = true;
				break;
			} catch {}
			if (!linked) setError("None of the match servers answered. Clear the address to play in this browser.");
			setBusy(false);
			return;
		}
		if (!address) localStorage.removeItem(RELAY);
		try {
			const res = await joinMount({ data: {
				nick: clean,
				password: pass,
				team: teamId,
				charId: hero
			} });
			if (!res.ok) {
				setError(res.error);
				setBusy(false);
				return;
			}
			localStorage.setItem(REMEMBER, JSON.stringify({
				nick: clean,
				password: pass,
				team: teamId,
				charId: hero
			}));
			setBoard(res.board);
			game.deploy({
				nick: res.profile.nick,
				team: teamId,
				charId: hero,
				token: res.token,
				xp: res.profile.xp,
				qa
			});
			setPhase("play");
		} catch {
			const bag = readReg();
			const key = clean.toLowerCase();
			const existing = bag[key];
			if (existing && existing.password !== pass) {
				setError("Relay unreachable, and that nickname is already saved with another password.");
				setBusy(false);
				return;
			}
			if (!/^[A-Za-z0-9_]{3,16}$/.test(clean) || pass.length < 4) {
				setError("Nickname 3–16 letters or numbers. Password at least 4.");
				setBusy(false);
				return;
			}
			const profile = existing || {
				password: pass,
				xp: 0,
				kills: 0,
				deaths: 0,
				caps: 0,
				team: teamId,
				charId: hero
			};
			bag[key] = {
				...profile,
				password: pass,
				team: teamId,
				charId: hero
			};
			localStorage.setItem(REG, JSON.stringify(bag));
			localStorage.setItem(REMEMBER, JSON.stringify({
				nick: clean,
				password: pass,
				team: teamId,
				charId: hero
			}));
			game.deploy({
				nick: clean,
				team: teamId,
				charId: hero,
				token: "",
				xp: profile.xp,
				qa
			});
			game.pushLine("relay delayed · local gate");
			setPhase("play");
		}
		setBusy(false);
	}
	function pushTouch(lookX = 0, lookY = 0) {
		const t = touch.current;
		gameRef.current?.setTouch({
			...t,
			lookX,
			lookY
		});
	}
	function jump(id) {
		document.getElementById(id)?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}
	const play = phase === "play" && hud;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "dew",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: viewRef,
				className: "view"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: overlayRef,
				className: "overlay"
			}),
			phase === "login" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "login",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "site",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "site-bar",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "kicker",
								children: "Mount Dew"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "brand-line",
								children: "100 seats · three teams"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
								className: "site-nav",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => jump("howto"),
										children: "How to play"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => jump("teams"),
										children: "Teams"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => jump("ledger"),
										children: "Ledger"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "btn primary",
										type: "button",
										onClick: () => jump("drop"),
										children: "Play"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: "site-banner",
							src: "/x-banner.jpg",
							alt: "Mount Dew banner. Four pilots in the desert."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "hero",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hero-copy",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "kicker",
										children: PUBLIC_SITE
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Mount Dew" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "lede",
										children: "One desert. Three flags. A hill that pays if you hold it. The match stays up, and you can drop in from this page."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										className: "cover",
										src: "/og.jpg",
										alt: "Mount Dew app cover"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "handle",
										children: "@sugoimeg"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "servers",
										"aria-label": "Match servers",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "kicker",
											children: "Match servers"
										}), SERVERS.map((url, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: relay === url ? "choice on" : "choice",
											onClick: () => setRelay(url),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: SERVER_LABEL[index] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mono",
													children: url
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: serverLive[url] == null ? "quiet" : `${serverLive[url]} pilots` })
											]
										}, url))]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								id: "drop",
								className: "panel",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "kicker",
										children: "Start the match"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Drop in" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "teams",
										children: TEAMS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: team === t.id ? "choice on" : "choice",
											onClick: () => setTeam(t.id),
											type: "button",
											children: t.name
										}, t.id))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "chars",
										"aria-label": "Pilots",
										children: CHARACTERS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											className: charId === c.id ? "choice on" : "choice",
											onClick: () => setCharId(c.id),
											type: "button",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "swatch",
													style: { background: `#${c.hair.toString(16).padStart(6, "0")}` }
												}),
												c.name,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: c.abilityName })
											]
										}, c.id))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "muted",
										children: CHARACTERS.find((c) => c.id === charId)?.blurb
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "field",
										children: ["Nickname", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "nick",
											autoComplete: "username",
											value: nick,
											onChange: (e) => setNick(e.target.value),
											maxLength: 16,
											suppressHydrationWarning: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "field",
										children: ["Password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "pass",
											type: "password",
											autoComplete: "current-password",
											value: password,
											onChange: (e) => setPassword(e.target.value),
											suppressHydrationWarning: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "field",
										children: ["Match server", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "relay",
											autoComplete: "off",
											placeholder: "Clear to play only in this browser",
											value: relay,
											onChange: (e) => setRelay(e.target.value),
											suppressHydrationWarning: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "muted",
										children: serverLive[SERVERS[0]] == null ? "Primary is wss://mountdew.oops.wtf:8888. If it is quiet, drop-in tries the fallback, then the third server. Clear the address to play alone in this browser." : `${serverLive[SERVERS[0]]} of 1000 pilots on the primary match.`
									}),
									error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "err",
										children: error
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "btn primary",
										type: "button",
										disabled: busy,
										onClick: () => {
											const game = gameRef.current;
											if (!game) return;
											enter(game, nick, password, team, charId);
										},
										children: busy ? "Linking" : "Drop in"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							id: "howto",
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "How to start" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
									className: "steps",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Open the site." }), " The game is this page. Nothing to install."] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Pick a team and a pilot." }), " Citrus holds the white stone, Voltage the space decks, Code Red the red city."] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Drop in." }), " A nickname and a password keep your rank. Then click the field to look."] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "On the field" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "help-grid",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WASD" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Move. A is screen-left. Double-tap dodges." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Enter" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chat. Escape leaves the box. Everyone in the match sees it." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mouse" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Look and shoot. Shots meet the crosshair." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Space" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Jump, double jump, wall jump. F climbs a wall." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Shift" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Dash. Hold into a wall in the air to wallride." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "F / G" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Use the selected action, or cycle blocks, pads, turrets, and traps." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "V" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Fly the spectator camera. Voices fade as you leave." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Tab / M" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Scoreboard and map. Backtick opens the console." })
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							id: "teams",
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Three cities, one hill" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "trio",
									children: TEAMS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
										className: "team-card",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "swatch",
												style: { background: t.color }
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												style: { color: t.color },
												children: t.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "muted",
												children: t.id === 0 ? "Coconut desert and white stone." : t.id === 1 ? "Space decks above the trench." : "Red stone city on the east mesa."
											})
										]
									}, t.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "muted",
									children: "Hold the middle hill for two minutes and your team runs faster. Flags go home if they sit too long. Pinpop, Wrapley, and Bonecaller raise green mutants from fallen bodies. You hear your pilot, nearby guns, an announcer, and a commentator. A full field does not shout all at once."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							id: "ledger",
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Season ledger" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "muted",
									children: "Scores kept by the relay. Empty seats on the field are match pilots until a person takes them."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "ledger",
									children: [board.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "muted",
										children: "No scores yet. The first drop-in opens the book."
									}) : null, board.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "row",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "swatch",
												style: { background: TEAMS[row.team]?.color || "#c6e35a" }
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.nick }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [row.xp, " xp"] })
										]
									}, row.nick))]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Match PC" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "muted",
									children: "The website is https://mountdew.oops.wtf. The match room is the same on wss://mountdew.oops.wtf:8888, then wss://mountdew.groups.id:8888, then wss://mountdew.tantrum.org:8888. Drop-in tries them in that order. Start a match PC with node host/server.mjs."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "credit",
									children: "MADE BY DAN"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "ascii",
							children: ASCII
						})
					]
				})
			}) : null,
			play ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: hud.map ? "hud map-open" : "hud",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "topbar",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "chip scores",
							children: hud.teams.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								style: { color: t.color },
								children: [
									t.name,
									" ",
									t.caps
								]
							}, t.name))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "chip clock",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: hud.time }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: hud.date }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									hud.season,
									" · ",
									hud.weather
								] })
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "feed",
						children: [hud.banner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "banner",
							children: hud.banner
						}) : null, hud.feed.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							style: { opacity: Math.max(.35, 1 - (hud.now - line.at) / 6e3) },
							children: line.text
						}, line.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bottombar",
						style: {
							position: "absolute",
							left: 16,
							right: 16,
							bottom: 16
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "chip hp",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [hud.hp, " hp"] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bar",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: hud.hp > 60 ? "fill good" : hud.hp > 30 ? "fill mid" : "fill low",
										style: { width: `${hud.hp}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "muted",
									children: [
										"F ",
										hud.action,
										hud.cd > 0 ? ` · ${hud.cd.toFixed(1)}s` : "",
										" · ",
										hud.hillText
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pad interactive",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "icon-btn",
									type: "button",
									"aria-label": "Scoreboard",
									onClick: () => gameRef.current?.toggleScore(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "icon-btn",
									type: "button",
									"aria-label": "Map",
									onClick: () => gameRef.current?.toggleMap(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map$1, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "icon-btn",
									type: "button",
									"aria-label": "Console",
									onClick: () => gameRef.current?.toggleConsole(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "icon-btn",
									type: "button",
									"aria-label": "Spectate",
									onClick: () => gameRef.current?.toggleSpectate(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "icon-btn",
									type: "button",
									"aria-label": "Options",
									onClick: () => gameRef.current?.setMenu(true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 18 })
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "chat",
						"aria-label": "Match chat",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "chat-log",
							ref: chatLogRef,
							children: [chat.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted",
								children: "Enter to chat. The match can read it."
							}) : null, chat.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									style: { color: TEAMS[line.team]?.color || "#f7f4ea" },
									children: line.nick
								}),
								" ",
								line.text
							] }, line.id))]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
							onSubmit: submitChat,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: chatInputRef,
								value: draft,
								maxLength: 160,
								placeholder: "Chat",
								"aria-label": "Chat",
								onChange: (e) => setDraft(e.target.value),
								onFocus: () => document.exitPointerLock(),
								onKeyDown: (e) => {
									if (e.key === "Escape") e.currentTarget.blur();
								}
							})
						})]
					}),
					!hud.locked && !hud.menu && !hud.score && !hud.map && !hud.console ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn primary look",
						type: "button",
						onClick: () => gameRef.current?.lock(),
						children: "Click to look"
					}) : null,
					hud.downed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn look",
						style: { top: "62%" },
						type: "button",
						onClick: () => gameRef.current?.spawnNow(),
						children: "Spawn"
					}) : null,
					hud.score ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "sheet",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "topbar",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Scoreboard" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "Close scoreboard",
								onClick: () => gameRef.current?.toggleScore(),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "board",
							children: TEAMS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									style: { color: t.color },
									children: t.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "scroll",
									children: hud.rows.filter((r) => r.team === t.id).sort((a, b) => b.xp - a.xp).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: r.me ? "pilot me" : "pilot",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rank",
												children: r.rank
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.name }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["L", r.lvl] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												r.k,
												"/",
												r.d
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.xp })
										]
									}, `${t.id}-${r.name}`))
								})]
							}, t.id))
						})]
					}) : null,
					hud.console ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "sheet",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "topbar",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Console" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-btn",
								type: "button",
								"aria-label": "Close console",
								onClick: () => gameRef.current?.toggleConsole(),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "log",
							children: hud.log.map((l) => l.text).join("\n")
						})]
					}) : null,
					hud.menu ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "sheet",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								className: "menu-banner",
								src: "/x-banner.jpg",
								alt: "Mount Dew"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "topbar",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Options" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "icon-btn",
									type: "button",
									"aria-label": "Close options",
									onClick: () => gameRef.current?.setMenu(false),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "teams",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: tab === "graphics" ? "choice on" : "choice",
										type: "button",
										onClick: () => setTab("graphics"),
										children: "Graphics"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: tab === "help" ? "choice on" : "choice",
										type: "button",
										onClick: () => setTab("help"),
										children: "Help"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: tab === "about" ? "choice on" : "choice",
										type: "button",
										onClick: () => setTab("about"),
										children: "About"
									})
								]
							}),
							tab === "graphics" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "teams",
									children: [
										"low",
										"medium",
										"high"
									].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: hud.graphics === q ? "choice on" : "choice",
										type: "button",
										onClick: () => {
											localStorage.setItem(GFX, q);
											gameRef.current?.setQuality(q);
										},
										children: [q === "low" ? "Low" : q === "medium" ? "Medium" : "High", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: q === "low" ? "Older laptop GPU" : q === "medium" ? "4 cores and up" : "Flagship GPU" })]
									}, q))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "field",
									children: ["Look sensitivity", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: 8e-4,
										max: .006,
										step: 1e-4,
										defaultValue: .0022,
										onChange: (e) => gameRef.current?.setSens(Number(e.target.value))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "field",
									children: ["Volume", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: 0,
										max: 1,
										step: .01,
										defaultValue: .7,
										onChange: (e) => gameRef.current?.setVolume(Number(e.target.value))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "btn",
									type: "button",
									onClick: () => gameRef.current?.fullscreen(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { size: 16 }), " Fullscreen"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "btn",
									type: "button",
									onClick: () => gameRef.current?.toggleSpectate(),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 16 }),
										" ",
										hud.spectate ? "Back to pilot" : "Spectate"
									]
								})
							] }) : null,
							tab === "help" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "help-grid",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WASD" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Move. Double-tap dodges." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mouse" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Look and shoot. Shots meet the crosshair. No spread." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Space" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Jump, double jump, wall jump. Hold near a wall with F to climb." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Q / E" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Turn. Double-tap sidesteps." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Shift" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Dash. Wallride by holding into a wall in the air." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "F / G" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "F does the selected action. G cycles signature, blocks, pads, turret, mine, tangle, telepad." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rise" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pinpop, Wrapley, and Bonecaller turn a nearby body into a green mutant. Mutants shamble and claw. They can still carry a flag. Sixteen per team." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "1–4" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Weapons. The wheel shows the gun you hold large, and the others smaller beside it. Scroll switches. Right mouse scopes the glass rifle." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Tab / M / `" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Scoreboard, map, console. Esc options." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "V" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Spectator camera. WASD flies, Space up, Ctrl down, Shift boosts. World voices and shots fade as you fly away. V returns you to your pilot." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Enter" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chat. Escape leaves the box. The line goes to every pilot in the match." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Voices" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "You hear your pilot, the announcer, and a commentator. Other pilots and guns only if they are close, so a full field does not turn into noise." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Server" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "The website is https://mountdew.oops.wtf. The match tries wss://mountdew.oops.wtf:8888, then wss://mountdew.groups.id:8888, then wss://mountdew.tantrum.org:8888. Clear Match server to play only in this browser." })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "credit",
								children: "MADE BY DAN"
							})] }) : null,
							tab === "about" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									className: "cover",
									src: "/og.jpg",
									alt: "Mount Dew app cover"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "handle",
									children: "@sugoimeg"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "muted",
									children: "Mount Dew is a nonstop three-team capture match. Citrus holds the white stone and the coconut desert, Voltage the space decks, Code Red the red stone city. The hill in the middle pays a speed surge if a team keeps it for two minutes. Rise rites pull green mutants out of fallen bodies. An announcer calls the flags and a commentator talks over the nearby fight. Fly the spectator camera and the field goes quiet as you leave it. The match PC can host a thousand pilots in one room. Your nickname stays in this browser. Rank and score updates go through the relay so a refreshed page cannot invent them."
								})
							] }) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "touch",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "stick",
								onPointerDown: (e) => {
									e.currentTarget.setPointerCapture(e.pointerId);
									moveStick(e);
								},
								onPointerMove: (e) => {
									if (e.currentTarget.hasPointerCapture(e.pointerId)) moveStick(e);
								},
								onPointerUp: (e) => {
									touch.current.x = 0;
									touch.current.y = 0;
									pushTouch();
									e.currentTarget.releasePointerCapture(e.pointerId);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pad",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "icon-btn",
										type: "button",
										onPointerDown: () => {
											touch.current.jump = true;
											pushTouch();
										},
										onPointerUp: () => {
											touch.current.jump = false;
											pushTouch();
										},
										children: "Jump"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "icon-btn",
										type: "button",
										onPointerDown: () => {
											touch.current.fire = true;
											pushTouch();
										},
										onPointerUp: () => {
											touch.current.fire = false;
											pushTouch();
										},
										children: "Fire"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "icon-btn",
										type: "button",
										onPointerDown: () => {
											touch.current.act = true;
											pushTouch();
										},
										onPointerUp: () => {
											touch.current.act = false;
											pushTouch();
										},
										children: "F"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "icon-btn",
										type: "button",
										onClick: () => {
											touch.current.cycle = true;
											pushTouch();
											touch.current.cycle = false;
										},
										children: "G"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "lookpad",
								onPointerDown: (e) => e.currentTarget.setPointerCapture(e.pointerId),
								onPointerMove: (e) => {
									if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
									pushTouch(e.movementX, e.movementY);
								}
							})
						]
					})
				]
			}) : null
		]
	});
	function moveStick(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width * 2 - 1;
		const y = -((e.clientY - rect.top) / rect.height * 2 - 1);
		touch.current.x = Math.max(-1, Math.min(1, x));
		touch.current.y = Math.max(-1, Math.min(1, y));
		pushTouch();
	}
}
function readReg() {
	try {
		return JSON.parse(localStorage.getItem(REG) || "{}");
	} catch {
		return {};
	}
}
//#endregion
export { CHAR_BY_ID as a, WEAPON_BY_ID as c, netPulse as d, sendRelayAnnounce as f, CHARACTERS as i, rankForLevel as l, BOT_NAMES as n, LINES as o, BUILD_ACTIONS as r, TEAMS as s, routes_exports as t, xpToLevel as u };
