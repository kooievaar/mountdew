import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Maximize2, c as Eye, i as Settings, o as Map$1, r as Terminal, s as List, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bg182hlX.js
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
var rosterFns = /* @__PURE__ */ new Set();
var afkFns = /* @__PURE__ */ new Set();
var pingFns = /* @__PURE__ */ new Set();
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
function onRelayRoster(fn) {
	rosterFns.add(fn);
	return () => {
		rosterFns.delete(fn);
	};
}
function sendRelayNop() {
	bound?.nop();
}
function dropRelay() {
	bound?.close();
}
function onRelayAfk(fn) {
	afkFns.add(fn);
	return () => {
		afkFns.delete(fn);
	};
}
function onRelayPings(fn) {
	pingFns.add(fn);
	return () => {
		pingFns.delete(fn);
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
		let token = "";
		let opened = false;
		let openedHandle = null;
		let markClosed = () => {};
		const untilClose = new Promise((resolve) => {
			markClosed = resolve;
		});
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
				nop() {
					if (!token || sock.readyState !== WebSocket.OPEN) return;
					send("nop", { token }).catch(() => {});
				},
				untilClose() {
					return untilClose;
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
			if (msg.op === "ping") {
				if (sock.readyState === WebSocket.OPEN) sock.send(JSON.stringify({
					op: "pong",
					t: msg.t,
					token
				}));
				return;
			}
			if (msg.op === "afk" && (msg.action === "spawn" || msg.action === "kill")) {
				for (const fn of afkFns) fn(msg.action);
				return;
			}
			if (msg.op === "pings" && Array.isArray(msg.rows)) {
				const rows = msg.rows.slice(0, 1e3);
				for (const fn of pingFns) fn(rows);
				return;
			}
			if (msg.op === "roster" && Array.isArray(msg.pilots)) {
				const pilots = msg.pilots;
				for (const fn of rosterFns) fn(pilots);
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
			markClosed();
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
		name: "Sugoimeg",
		blurb: "White angelic doll. Wings, halo, hold jump to glide. A hello to megqtxo.",
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
		name: "Dizzydezzy",
		blurb: "Blue-haired doll. Speeds her squad and never stops spinning.",
		hair: 3116287,
		cloth: 8308991,
		skin: 16765624,
		style: "doll",
		ability: "aura",
		abilityName: "Dizzy pulse",
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
		name: "Gothgirl",
		blurb: "Straight black hair. Long shadow dash.",
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
		name: "PickMe",
		blurb: "Pink-haired friend of the goth. Fast revive and a shared heal.",
		hair: 16752324,
		cloth: 16735123,
		skin: 16765104,
		style: "doll",
		ability: "bestie",
		abilityName: "Pick-me pulse",
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
	},
	{
		id: "laile",
		name: "Laile",
		blurb: "Pink rambler. She keeps talking while she fights. A nod to the pink Barbie.",
		hair: 16735912,
		cloth: 16748232,
		skin: 16765124,
		style: "doll",
		ability: "aura",
		abilityName: "Rambler",
		weapons: [
			"plasma",
			"laugh",
			"melee"
		],
		jumps: 2,
		voice: 520
	},
	{
		id: "cloudy",
		name: "Cloudy",
		blurb: "Big-headed blonde. Flies, spills rainbows, and falls through the looking glass.",
		hair: 16769162,
		cloth: 4114175,
		skin: 16769224,
		style: "round",
		ability: "bird",
		abilityName: "Wonderflight",
		weapons: [
			"plasma",
			"laugh",
			"bounce"
		],
		jumps: 2,
		voice: 640
	},
	{
		id: "donnie",
		name: "The Donald",
		blurb: "Cartoon showman. Killstreaks become Winner calls. Twenty is god mode.",
		hair: 15781984,
		cloth: 1714795,
		skin: 15773808,
		style: "sport",
		ability: "winner",
		abilityName: "You're fired",
		weapons: [
			"plasma",
			"rocket",
			"melee"
		],
		jumps: 2,
		voice: 180
	},
	{
		id: "elon",
		name: "The Elon",
		blurb: "Throws a different car every time and will not stop selling it.",
		hair: 7031346,
		cloth: 1710618,
		skin: 15780008,
		style: "sport",
		ability: "tesla",
		abilityName: "Throw a car",
		weapons: [
			"rocket",
			"plasma",
			"melee"
		],
		jumps: 2,
		voice: 240
	},
	{
		id: "flux",
		name: "Ensign Flux",
		blurb: "Laser pistol. Boom. Fluxxed you right in the capaciter.",
		hair: 13213802,
		cloth: 13017434,
		skin: 15782068,
		style: "sport",
		ability: "flux",
		abilityName: "Flux pistol",
		weapons: [
			"plasma",
			"sniper",
			"knife"
		],
		jumps: 2,
		voice: 360
	},
	{
		id: "rock",
		name: "The Rock",
		blurb: "Most-followed movie star, 2026. Eyebrow, elbow, and a catchphrase you can smell.",
		hair: 1708556,
		cloth: 1710618,
		skin: 13010520,
		style: "sport",
		ability: "elbow",
		abilityName: "People's elbow",
		weapons: [
			"melee",
			"rocket",
			"plasma"
		],
		jumps: 2,
		voice: 110
	},
	{
		id: "zendaya",
		name: "Zendaya",
		blurb: "Most-followed actress, 2026. Spotlight, long curls, and a line that holds the hill.",
		hair: 2757644,
		cloth: 2059077,
		skin: 12880482,
		style: "doll",
		ability: "spotlight",
		abilityName: "Spotlight",
		weapons: [
			"plasma",
			"sniper",
			"laugh"
		],
		jumps: 2,
		voice: 280
	},
	{
		id: "jlo",
		name: "JLo",
		blurb: "Jenny from the block. Gets loud, dances the reload, and does not miss the drop.",
		hair: 1707016,
		cloth: 15119141,
		skin: 13671018,
		style: "sport",
		ability: "loud",
		abilityName: "Let's get loud",
		weapons: [
			"dual",
			"plasma",
			"laugh"
		],
		jumps: 2,
		voice: 230
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
	down: "oooowh!",
	die: "aiaiai!",
	sheep: "baaaa!",
	yay: "jeehee!",
	ride: "chuchu!",
	puff: "whooo!",
	groan: "graaah!"
};
var DYING = [
	"oooowh!",
	"wergh!",
	"aiaiai!",
	"owowow!",
	"eep!"
];
var FLIGHT = {
	angel: [
		"joohoo!",
		"joohoo halo!",
		"joohoo up we go"
	],
	pickme: [
		"joohoo dizzy!",
		"joohoo spin!",
		"joohoo!"
	],
	goth: [
		"joohoo...",
		"joohoo darkly",
		"joohoo"
	],
	bestie: [
		"joohoo bestie!",
		"joohoo with me!",
		"joohoo!"
	],
	puff: [
		"joohoo puff!",
		"joohoo float",
		"joohoo!"
	],
	bunny: [
		"joohoo hop!",
		"joohoo bounce",
		"joohoo!"
	],
	trips: [
		"joohoo three!",
		"joohoo mint",
		"joohoo!"
	],
	boomer: [
		"joohoo boom!",
		"joohoo rocket",
		"joohoo!"
	],
	buzz: [
		"joohoo buzz!",
		"joohoo hover",
		"joohoo!"
	],
	lark: [
		"joohoo bird!",
		"joohoo flap",
		"joohoo!"
	],
	pack: [
		"joohoo pack!",
		"joohoo thrust",
		"joohoo!"
	],
	pin: [
		"joohoo pin",
		"joohoo rite",
		"joohoo"
	],
	wrap: [
		"joohoo wrap",
		"joohoo linen",
		"joohoo"
	],
	bone: [
		"joohoo bones",
		"joohoo",
		"joohoo rattle"
	],
	glass: [
		"joohoo steady",
		"joohoo",
		"joohoo lens"
	],
	twin: [
		"joohoo twins!",
		"joohoo!",
		"joohoo both"
	],
	cinder: [
		"joohoo spark!",
		"joohoo fire",
		"joohoo!"
	],
	bleat: [
		"joohoo baa!",
		"joohoo!",
		"joohoo lamb"
	],
	blocky: [
		"joohoo block!",
		"joohoo!",
		"joohoo build"
	],
	wallaby: [
		"joohoo wall!",
		"joohoo ride",
		"joohoo!"
	],
	laile: [
		"joohoo and another thing",
		"joohoo wait listen",
		"joohoo!"
	],
	cloudy: [
		"joohoo curiouser",
		"joohoo rainbow",
		"joohoo!"
	],
	donnie: [
		"joohoo tremendous",
		"joohoo winner",
		"joohoo!"
	],
	elon: [
		"joohoo to mars",
		"joohoo buy this",
		"joohoo!"
	],
	flux: [
		"joohoo flux",
		"joohoo capaciter",
		"joohoo!"
	],
	rock: [
		"joohoo finally",
		"can you smell it",
		"joohoo bring it"
	],
	zendaya: [
		"joohoo watch this",
		"joohoo from oakland",
		"joohoo!"
	],
	jlo: [
		"joohoo get loud",
		"joohoo on the block",
		"joohoo!"
	]
};
var CHATTER = {
	angel: [
		"the light likes you",
		"wings stay polite",
		"halo on",
		"bless this flag"
	],
	pickme: [
		"spin with me",
		"blue hair don't care",
		"dizzy but accurate",
		"again again"
	],
	goth: [
		"this hill is mine",
		"don't smile",
		"shadows first",
		"how dreary and fun"
	],
	bestie: [
		"I saved you a spot",
		"pink team up",
		"hold my soda",
		"best friends score"
	],
	puff: [
		"inhale the desert",
		"so round so fast",
		"floaties out",
		"soft landing maybe"
	],
	bunny: [
		"hop hop hop",
		"the chain is the point",
		"ears up",
		"boing with intent"
	],
	trips: [
		"third jump is a lifestyle",
		"minty fresh air",
		"one two three",
		"leave them two"
	],
	boomer: [
		"rockets solve stairs",
		"count the boom",
		"up is a direction",
		"pardon the crater"
	],
	buzz: [
		"drone out",
		"I see you",
		"buzz off kindly",
		"hover tax"
	],
	lark: [
		"the wind owes me",
		"flap budget remains",
		"sky is open",
		"tweet no, fight yes"
	],
	pack: [
		"thruster warm",
		"backpack says yes",
		"fuel is a feeling",
		"hold jump, trust me"
	],
	pin: [
		"the pin finds a friend",
		"rise if you mean it",
		"doll of the rite",
		"careful, it listens"
	],
	wrap: [
		"stay wrapped",
		"linen holds",
		"the quiet kind of tough",
		"unwrap later"
	],
	bone: [
		"bones, politely",
		"the rattle is a greeting",
		"slower, harder",
		"mind the ribs"
	],
	glass: [
		"breath out, then the shot",
		"the lens doesn't lie",
		"hold still",
		"one clean look"
	],
	twin: [
		"both barrels agree",
		"left and right, same idea",
		"crosshair date",
		"twins don't miss twice"
	],
	cinder: [
		"a little flame",
		"toasty, not tragic",
		"cone of cute",
		"mind the eyebrows"
	],
	bleat: [
		"baa with purpose",
		"I come back",
		"lamb out",
		"pop then hop"
	],
	blocky: [
		"pad here",
		"wall there",
		"the map can be improved",
		"foreman on site"
	],
	wallaby: [
		"the wall is a road",
		"don't let go",
		"ride it out",
		"vertical is fine"
	],
	laile: [
		"so basically what happened was",
		"and then, wait, the good part",
		"I am still talking",
		"pink microphone on"
	],
	cloudy: [
		"down the wrong rabbit",
		"rainbows are tactical",
		"my head arrived first",
		"curiouser, fire"
	],
	donnie: [
		"tremendous pilot",
		"you're looking at a winner",
		"the best jump",
		"everybody says so"
	],
	elon: [
		"the car is the argument",
		"different model, same point",
		"they see me rollin",
		"mars can wait one flag"
	],
	flux: [
		"fluxxed in the capaciter",
		"laser says hello",
		"boom, politely",
		"ensign on the hill"
	],
	rock: [
		"Can you smell what the Rock is cooking",
		"Just bring it",
		"Know your role",
		"Finally the Rock has come back",
		"If you smell what I am cooking"
	],
	zendaya: [
		"Watch me",
		"I am still that girl from Oakland",
		"This is my light",
		"I make the spotlight",
		"Hold the hill with me"
	],
	jlo: [
		"Let's get loud",
		"Jenny from the block",
		"Love don't cost a thing",
		"I ain't going nowhere",
		"On the six"
	]
};
function spokenLine(charId, key) {
	if (key === "die" || key === "down") return DYING[Math.floor(Math.random() * DYING.length)];
	if (key === "jump" || key === "double" || key === "triple") {
		const set = FLIGHT[charId] || ["joohoo!"];
		return set[Math.floor(Math.random() * set.length)];
	}
	if (key === "idle") {
		const set = CHATTER[charId] || ["jeehee!"];
		return set[Math.floor(Math.random() * set.length)];
	}
	const own = CHATTER[charId];
	if (own && key !== "help" && key !== "groan" && key !== "sheep" && Math.random() < .55) return own[Math.floor(Math.random() * own.length)];
	return LINES[key] || key;
}
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
function ditherPeak(samples) {
	let peak = 1e-8;
	for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
	return peak;
}
function VolumeKnob({ db, onChange }) {
	const drag = (0, import_react.useRef)(null);
	const angle = -140 + (db + 60) / 66 * 280;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "knob-wrap",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "knob",
			role: "slider",
			"aria-label": "Master volume",
			"aria-valuemin": -60,
			"aria-valuemax": 6,
			"aria-valuenow": Math.round(db * 10) / 10,
			style: { transform: `rotate(${angle}deg)` },
			onPointerDown: (e) => {
				e.currentTarget.setPointerCapture(e.pointerId);
				drag.current = {
					y: e.clientY,
					db
				};
			},
			onPointerMove: (e) => {
				if (!drag.current) return;
				const next = drag.current.db + (drag.current.y - e.clientY) * .18;
				onChange(Math.max(-60, Math.min(6, Math.round(next * 10) / 10)));
			},
			onPointerUp: () => {
				drag.current = null;
			},
			onDoubleClick: () => onChange(-3.1),
			onKeyDown: (e) => {
				if (e.key === "ArrowUp" || e.key === "ArrowRight") onChange(Math.min(6, Math.round((db + .5) * 10) / 10));
				if (e.key === "ArrowDown" || e.key === "ArrowLeft") onChange(Math.max(-60, Math.round((db - .5) * 10) / 10));
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Volume" })]
	});
}
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
	const linkStop = (0, import_react.useRef)(null);
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
	const specRef = (0, import_react.useRef)(null);
	const scopeRef = (0, import_react.useRef)(null);
	const meterRefs = (0, import_react.useRef)([]);
	const holdRefs = (0, import_react.useRef)([]);
	const eqRead = (0, import_react.useRef)([]);
	const [strips, setStrips] = (0, import_react.useState)([
		0,
		1,
		2
	].map(() => ({
		fader: 0,
		pan: 0,
		trim: 0,
		hpf: 20,
		aux: 0,
		pre: false,
		mute: false,
		solo: false,
		pfl: false,
		pol: false
	})));
	const [auxReturn, setAuxReturn] = (0, import_react.useState)(0);
	const [duck, setDuck] = (0, import_react.useState)(.42);
	const [masterDb, setMasterDb] = (0, import_react.useState)(-3.1);
	const [masterMute, setMasterMute] = (0, import_react.useState)(false);
	const [eq, setEq] = (0, import_react.useState)({
		hz: 100,
		low: 0,
		lowMid: 0,
		mid: 0,
		highMid: 0,
		high: 0
	});
	const [eqOn, setEqOn] = (0, import_react.useState)(true);
	const [desk, setDesk] = (0, import_react.useState)("mix");
	function setMaster(db) {
		setMasterDb(db);
		if (!masterMute) gameRef.current?.setVolume(Math.max(0, Math.min(1, 10 ** (db / 20))));
	}
	function toggleMasterMute() {
		const next = !masterMute;
		setMasterMute(next);
		gameRef.current?.setVolume(next ? 0 : Math.max(0, Math.min(1, 10 ** (masterDb / 20))));
	}
	function setEqBand(patch) {
		const next = {
			...eq,
			...patch
		};
		setEq(next);
		gameRef.current?.setStudio({
			eq: [
				{
					f: next.hz,
					g: next.low
				},
				{ g: next.lowMid },
				{ g: next.mid },
				{ g: next.highMid },
				{ g: next.high }
			],
			eqOn
		});
	}
	function toggleEq() {
		const next = !eqOn;
		setEqOn(next);
		gameRef.current?.setStudio({ eqOn: next });
	}
	function sendMix(next = strips, aux = auxReturn, duckTo = duck) {
		const lin = (db) => db <= -60 ? 0 : 10 ** (db / 20);
		gameRef.current?.setMix({
			ch: next.map((s) => ({
				fader: lin(s.fader),
				trim: lin(s.trim),
				pan: s.pan,
				mute: s.mute,
				solo: s.solo,
				pfl: s.pfl,
				pol: s.pol ? -1 : 1,
				hpf: s.hpf < 25 ? 0 : s.hpf,
				aux: s.aux,
				pre: s.pre
			})),
			auxReturn: aux,
			duck: duckTo
		});
	}
	function patchStrip(index, patch) {
		const next = strips.map((s, i) => i === index ? {
			...s,
			...patch
		} : s);
		setStrips(next);
		sendMix(next);
	}
	const chatInputRef = (0, import_react.useRef)(null);
	const chatSeq = (0, import_react.useRef)(1);
	(0, import_react.useEffect)(() => {
		if (tab !== "sound" || !hud?.menu) return;
		let raf = 0;
		const loop = () => {
			raf = requestAnimationFrame(loop);
			const viz = gameRef.current?.getStudioViz();
			const meters = gameRef.current?.getMeters();
			if (viz?.centers) viz.centers.forEach((db, i) => {
				const el = eqRead.current[i];
				if (el) el.textContent = `${db >= 0 ? "+" : ""}${db.toFixed(1)} heard`;
			});
			if (meters) for (let i = 0; i < 4; i++) {
				const bar = meterRefs.current[i];
				const hold = holdRefs.current[i];
				if (bar) bar.style.height = `${Math.min(100, meters.peak[i] * 140)}%`;
				if (hold) hold.style.bottom = `${Math.min(98, meters.hold[i] * 140)}%`;
			}
			const spec = specRef.current;
			const scope = scopeRef.current;
			if (viz && spec) {
				const g = spec.getContext("2d");
				if (g) {
					const w = spec.width;
					const h = spec.height;
					g.clearRect(0, 0, w, h);
					g.fillStyle = "#140c18";
					g.fillRect(0, 0, w, h);
					const bins = viz.spectrum;
					const nyquist = Math.max(1e3, viz.rate / 2);
					const logX = (hz) => {
						const min = Math.log(20);
						const max = Math.log(Math.min(2e4, nyquist));
						return (Math.log(Math.min(Math.max(20, hz), nyquist)) - min) / (max - min) * w;
					};
					if (bins.length) {
						const bars = 64;
						const binHz = nyquist / bins.length;
						g.fillStyle = "#3ec6ff";
						for (let i = 0; i < bars; i++) {
							const hz = 20 * (Math.min(2e4, nyquist) / 20) ** (i / 63);
							const mag = bins[Math.min(bins.length - 1, Math.round(hz / binHz))] / 255;
							const x = logX(hz);
							const bw = Math.max(2, w / bars - 1);
							g.fillRect(x, h - mag * (h - 8), bw, mag * (h - 8));
						}
					}
					g.beginPath();
					g.strokeStyle = viz.eqOn ? "#c6e35a" : "#6a6458";
					g.lineWidth = 2;
					viz.freq.forEach((hz, i) => {
						const db = Math.max(-18, Math.min(18, 20 * Math.log10(Math.max(1e-4, viz.eq[i]))));
						const x = logX(hz);
						const y = h * .5 - db / 18 * (h * .45);
						if (i === 0) g.moveTo(x, y);
						else g.lineTo(x, y);
					});
					g.stroke();
				}
			}
			if (viz && scope) {
				const g = scope.getContext("2d");
				if (g) {
					const w = scope.width;
					const h = scope.height;
					g.fillStyle = "#140c18";
					g.fillRect(0, 0, w, h);
					g.strokeStyle = "#ff5a68";
					g.beginPath();
					const step = ditherPeak(viz.dither);
					viz.dither.forEach((s, i) => {
						const x = i / Math.max(1, viz.dither.length - 1) * w;
						const y = h * .5 - s / step * (h * .4);
						if (i === 0) g.moveTo(x, y);
						else g.lineTo(x, y);
					});
					g.stroke();
				}
			}
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [tab, hud?.menu]);
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
			const mod = await import("./engine-BAhTozcF.mjs");
			if (dead || !viewRef.current || !overlayRef.current) return;
			const qa = new URLSearchParams(window.location.search).has("qa");
			const game = mod.createGame(viewRef.current, overlayRef.current, { qa });
			gameRef.current = game;
			game.intro();
			const savedGfx = localStorage.getItem(GFX);
			if (savedGfx === "low" || savedGfx === "medium" || savedGfx === "high" || savedGfx === "ultra") game.setQuality(savedGfx);
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
	(0, import_react.useEffect)(() => onRelayRoster((pilots) => {
		gameRef.current?.applyRoster(pilots);
	}), []);
	(0, import_react.useEffect)(() => onRelayPings((rows) => {
		gameRef.current?.notePings(rows);
	}), []);
	(0, import_react.useEffect)(() => onRelayAfk((action) => {
		gameRef.current?.applyAfk(action);
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
			linkStop.current?.();
			let stopped = false;
			let linkedOnce = false;
			const stop = () => {
				stopped = true;
				bindRelay(null);
			};
			linkStop.current = stop;
			let delay = 700;
			while (!stopped) {
				for (const url of order) {
					if (stopped) return;
					try {
						const link = await connectRelay(url);
						if (stopped) {
							link.close();
							return;
						}
						const res = await link.join(clean, pass, teamId, hero);
						if (!res.ok) {
							link.close();
							if (/password|nickname|team|full/i.test(res.error)) {
								setError(res.error);
								setBusy(false);
								stopped = true;
								return;
							}
							continue;
						}
						bindRelay(link);
						localStorage.setItem(RELAY, url);
						localStorage.setItem(REMEMBER, JSON.stringify({
							nick: clean,
							password: pass,
							team: teamId,
							charId: hero
						}));
						setRelay(url);
						setBoard(res.board);
						if (!linkedOnce) {
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
							setError("");
							setBusy(false);
							linkedOnce = true;
						} else {
							game.setToken(res.token);
							game.pushLine("link restored");
						}
						delay = 700;
						await link.untilClose();
						if (stopped) return;
						break;
					} catch {}
				}
				if (stopped) return;
				if (!linkedOnce) {
					setError("Still trying the match servers…");
					setBusy(false);
				} else game.pushLine("reconnecting");
				await new Promise((r) => setTimeout(r, delay));
				delay = Math.min(5e3, Math.round(delay * 1.5));
			}
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
				onPointerDown: () => gameRef.current?.intro(),
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
										className: "launch",
										src: "/game/launch.mp4",
										autoPlay: true,
										muted: true,
										loop: true,
										playsInline: true,
										controls: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "lede",
										children: "One desert. Three flags. A hill that pays if you hold it. The match stays up, and you can drop in from this page."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "posters",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											className: "cover",
											src: "/og.jpg",
											alt: "Mount Dew app cover"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											className: "cast",
											src: "/game/cast.jpg",
											alt: "Seraph Doll, Bluebelle, Noir Nyx, and Bestie Bea in the desert"
										})]
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
										className: "pilot-grid",
										role: "listbox",
										"aria-label": "Pilots",
										children: CHARACTERS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											className: charId === c.id ? "champ on" : "champ",
											onClick: () => setCharId(c.id),
											type: "button",
											"aria-pressed": charId === c.id,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: `/game/pilots/${c.id}.jpg`,
												alt: ""
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.name })]
										}, c.id))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pilot-pick",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: `/game/pilots/${charId}.jpg`,
											alt: ""
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: CHARACTERS.find((c) => c.id === charId)?.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "muted",
											children: CHARACTERS.find((c) => c.id === charId)?.blurb
										})] })]
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
						children: [
							hud.banner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "banner",
								children: hud.banner
							}) : null,
							hud.heat > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "heat",
								children: ["HEATSTROKE", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: Math.ceil(hud.heat) })]
							}) : null,
							hud.feed.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								style: { opacity: Math.max(.35, 1 - (hud.now - line.at) / 6e3) },
								children: line.text
							}, line.id))
						]
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
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: ["Scoreboard · ", hud.rows.length] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
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
												className: `mark ${r.kind}`,
												title: r.kind
											}),
											r.charId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												className: "mini",
												src: `/game/pilots/${r.charId}.jpg`,
												alt: ""
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mini blank" }),
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
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ms",
												children: r.kind === "human" ? `${r.ping || "–"} ms` : r.kind
											})
										]
									}, `${t.id}-${r.kind}-${r.name}`))
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
										className: tab === "sound" ? "choice on" : "choice",
										type: "button",
										onClick: () => setTab("sound"),
										children: "Sound"
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
										"high",
										"ultra"
									].map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: hud.graphics === q ? "choice on" : "choice",
										type: "button",
										onClick: () => {
											localStorage.setItem(GFX, q);
											gameRef.current?.setQuality(q);
										},
										children: [q === "low" ? "Low" : q === "medium" ? "Medium" : q === "high" ? "High" : "Ultra", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: q === "low" ? "Older laptop GPU" : q === "medium" ? "4 cores and up" : q === "high" ? "Flagship GPU" : "Pencil shadows and ragdoll" })]
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
							tab === "sound" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "desk-nav",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: desk === "mix" ? "pill on" : "pill",
											type: "button",
											onClick: () => setDesk("mix"),
											children: "Mix"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: desk === "tone" ? "pill on" : "pill",
											type: "button",
											onClick: () => setDesk("tone"),
											children: "Tone"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: desk === "out" ? "pill on" : "pill",
											type: "button",
											onClick: () => setDesk("out"),
											children: "Output"
										})
									]
								}),
								desk === "mix" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mixer",
									children: [[
										"World",
										"Announce",
										"You"
									].map((name, index) => {
										const s = strips[index];
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "strip",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: name }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
													"Pan ",
													s.pan === 0 ? "C" : s.pan < 0 ? `L ${Math.abs(s.pan).toFixed(2)}` : `R ${s.pan.toFixed(2)}`,
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														"aria-label": `${name} pan`,
														type: "range",
														min: -1,
														max: 1,
														step: .01,
														value: s.pan,
														onChange: (e) => patchStrip(index, { pan: Number(e.target.value) }),
														onDoubleClick: () => patchStrip(index, { pan: 0 })
													})
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
													"Trim ",
													s.trim.toFixed(1),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														"aria-label": `${name} trim`,
														type: "range",
														min: -12,
														max: 12,
														step: .1,
														value: s.trim,
														onChange: (e) => patchStrip(index, { trim: Number(e.target.value) }),
														onDoubleClick: () => patchStrip(index, { trim: 0 })
													})
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
													"HPF ",
													s.hpf < 25 ? "off" : `${Math.round(s.hpf)}`,
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														"aria-label": `${name} high pass`,
														type: "range",
														min: 20,
														max: 400,
														step: 1,
														value: s.hpf,
														onChange: (e) => patchStrip(index, { hpf: Number(e.target.value) }),
														onDoubleClick: () => patchStrip(index, { hpf: 20 })
													})
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
													"Aux ",
													Math.round(s.aux * 100),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														"aria-label": `${name} aux`,
														type: "range",
														min: 0,
														max: 1,
														step: .01,
														value: s.aux,
														onChange: (e) => patchStrip(index, { aux: Number(e.target.value) }),
														onDoubleClick: () => patchStrip(index, { aux: 0 })
													})
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "strip-btns",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															className: s.mute ? "pill danger on" : "pill",
															type: "button",
															onClick: () => patchStrip(index, { mute: !s.mute }),
															children: "Mute"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															className: s.solo ? "pill solo on" : "pill",
															type: "button",
															onClick: () => patchStrip(index, { solo: !s.solo }),
															children: "Solo"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															className: s.pfl ? "pill on" : "pill",
															type: "button",
															onClick: () => patchStrip(index, { pfl: !s.pfl }),
															children: "PFL"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															className: s.pre ? "pill on" : "pill",
															type: "button",
															onClick: () => patchStrip(index, { pre: !s.pre }),
															children: s.pre ? "Pre" : "Post"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															className: s.pol ? "pill on" : "pill",
															type: "button",
															onClick: () => patchStrip(index, { pol: !s.pol }),
															children: "Phase"
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "strip-body",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														className: "fader",
														"aria-label": `${name} fader`,
														type: "range",
														min: -60,
														max: 12,
														step: .1,
														value: s.fader,
														onChange: (e) => patchStrip(index, { fader: Number(e.target.value) }),
														onDoubleClick: () => patchStrip(index, { fader: 0 })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "meter",
														"aria-hidden": "true",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { ref: (el) => {
															meterRefs.current[index] = el;
														} }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { ref: (el) => {
															holdRefs.current[index] = el;
														} })]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "strip-read",
													children: [s.fader <= -60 ? "-inf" : s.fader.toFixed(1), " dB"]
												})
											]
										}, name);
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "strip master",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Master" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeKnob, {
												db: masterDb,
												onChange: setMaster
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: masterMute ? "pill danger on" : "pill",
												type: "button",
												onClick: toggleMasterMute,
												children: masterMute ? "Muted" : "Mute"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: eqOn ? "pill on" : "pill",
												type: "button",
												onClick: toggleEq,
												children: eqOn ? "EQ on" : "EQ off"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
												"Low ",
												eq.low.toFixed(1),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": "Master low shelf",
													type: "range",
													min: -12,
													max: 12,
													step: .1,
													value: eq.low,
													onChange: (e) => setEqBand({ low: Number(e.target.value) }),
													onDoubleClick: () => setEqBand({ low: 0 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "strip-read",
													ref: (el) => {
														eqRead.current[0] = el;
													}
												})
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
												"Low mid ",
												eq.lowMid.toFixed(1),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": "Master low mid",
													type: "range",
													min: -12,
													max: 12,
													step: .1,
													value: eq.lowMid,
													onChange: (e) => setEqBand({ lowMid: Number(e.target.value) }),
													onDoubleClick: () => setEqBand({ lowMid: 0 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "strip-read",
													ref: (el) => {
														eqRead.current[1] = el;
													}
												})
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
												"Mid ",
												eq.mid.toFixed(1),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": "Master mid",
													type: "range",
													min: -12,
													max: 12,
													step: .1,
													value: eq.mid,
													onChange: (e) => setEqBand({ mid: Number(e.target.value) }),
													onDoubleClick: () => setEqBand({ mid: 0 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "strip-read",
													ref: (el) => {
														eqRead.current[2] = el;
													}
												})
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
												"High mid ",
												eq.highMid.toFixed(1),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": "Master high mid",
													type: "range",
													min: -12,
													max: 12,
													step: .1,
													value: eq.highMid,
													onChange: (e) => setEqBand({ highMid: Number(e.target.value) }),
													onDoubleClick: () => setEqBand({ highMid: 0 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "strip-read",
													ref: (el) => {
														eqRead.current[3] = el;
													}
												})
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
												"High ",
												eq.high.toFixed(1),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": "Master high shelf",
													type: "range",
													min: -12,
													max: 12,
													step: .1,
													value: eq.high,
													onChange: (e) => setEqBand({ high: Number(e.target.value) }),
													onDoubleClick: () => setEqBand({ high: 0 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "strip-read",
													ref: (el) => {
														eqRead.current[4] = el;
													}
												})
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
												"Duck ",
												Math.round(duck * 100),
												"%",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": "Announcer duck",
													type: "range",
													min: .1,
													max: 1,
													step: .01,
													value: duck,
													onChange: (e) => {
														const v = Number(e.target.value);
														setDuck(v);
														sendMix(strips, auxReturn, v);
													}
												})
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
												"Aux return ",
												Math.round(auxReturn * 100),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": "Aux return",
													type: "range",
													min: 0,
													max: 1,
													step: .01,
													value: auxReturn,
													onChange: (e) => {
														const v = Number(e.target.value);
														setAuxReturn(v);
														sendMix(strips, v, duck);
													}
												})
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "strip-body",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													className: "fader",
													"aria-label": "Master fader",
													type: "range",
													min: -60,
													max: 6,
													step: .1,
													value: masterDb,
													onChange: (e) => setMaster(Number(e.target.value)),
													onDoubleClick: () => setMaster(-3.1)
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "meter",
													"aria-hidden": "true",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { ref: (el) => {
														meterRefs.current[3] = el;
													} }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { ref: (el) => {
														holdRefs.current[3] = el;
													} })]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "strip-read",
												children: [masterDb <= -60 ? "-inf" : masterDb.toFixed(1), " dB"]
											})
										]
									})]
								}) : null,
								desk === "tone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
										ref: specRef,
										className: "studio-viz",
										width: 640,
										height: 160
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "studio-note",
										children: "The line is the measured response of the five filters, on a log frequency axis. It is flat while EQ is off. The settings stay put."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "desk-grid",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "desk-card",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Equaliser" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Low shelf Hz", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: 40,
														max: 240,
														step: 1,
														value: eq.hz,
														onChange: (e) => setEqBand({ hz: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Low shelf dB", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: -12,
														max: 12,
														step: .1,
														value: eq.low,
														onChange: (e) => setEqBand({ low: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Low mid dB", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: -12,
														max: 12,
														step: .1,
														value: eq.lowMid,
														onChange: (e) => setEqBand({ lowMid: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Mid dB", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: -12,
														max: 12,
														step: .1,
														value: eq.mid,
														onChange: (e) => setEqBand({ mid: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["High mid dB", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: -12,
														max: 12,
														step: .1,
														value: eq.highMid,
														onChange: (e) => setEqBand({ highMid: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["High shelf dB", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: -12,
														max: 12,
														step: .1,
														value: eq.high,
														onChange: (e) => setEqBand({ high: Number(e.target.value) })
													})]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "desk-card",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Bass phat" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Frequency", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: 40,
														max: 180,
														step: 1,
														defaultValue: 90,
														onChange: (e) => gameRef.current?.setStudio({ phatFreq: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Drive", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: 0,
														max: 1,
														step: .01,
														defaultValue: .4,
														onChange: (e) => gameRef.current?.setStudio({ phatDrive: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Mix", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: 0,
														max: 1,
														step: .01,
														defaultValue: 0,
														onChange: (e) => gameRef.current?.setStudio({ phatMix: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Amp and air" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Amp drive", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: 0,
														max: 1,
														step: .01,
														defaultValue: 0,
														onChange: (e) => gameRef.current?.setStudio({ ampDrive: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Air", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: -6,
														max: 8,
														step: .1,
														defaultValue: 0,
														onChange: (e) => gameRef.current?.setStudio({ air: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Width", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: 0,
														max: 2,
														step: .01,
														defaultValue: 1,
														onChange: (e) => gameRef.current?.setStudio({ width: Number(e.target.value) })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: ["Exciter", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "range",
														min: 0,
														max: 1,
														step: .01,
														defaultValue: 0,
														onChange: (e) => gameRef.current?.setStudio({ exciter: Number(e.target.value) })
													})]
												})
											]
										})]
									})
								] }) : null,
								desk === "out" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "desk-grid",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "desk-card",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Loudness" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field",
												children: ["ReplayGain", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													defaultValue: "none",
													onChange: (e) => gameRef.current?.setStudio({ replay: e.target.value }),
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "none",
															children: "None"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "gain",
															children: "Apply gain"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "prevent",
															children: "Apply gain and prevent clipping"
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field",
												children: ["Preamp dB", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "range",
													min: -12,
													max: 12,
													step: .1,
													defaultValue: 0,
													onChange: (e) => gameRef.current?.setStudio({ preamp: Number(e.target.value) })
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field",
												children: ["Target loudness dB", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "range",
													min: -24,
													max: -6,
													step: .1,
													defaultValue: -12,
													onChange: (e) => gameRef.current?.setStudio({ target: Number(e.target.value) })
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field",
												children: ["Peak ceiling %", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "range",
													min: 20,
													max: 100,
													step: 1,
													defaultValue: 50,
													onChange: (e) => gameRef.current?.setStudio({ peak: Number(e.target.value) })
												})]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "desk-card",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Dither" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
												ref: scopeRef,
												className: "dither-viz",
												width: 640,
												height: 80
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field",
												children: ["Shape", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													defaultValue: "tpdf",
													onChange: (e) => gameRef.current?.setDither({ shape: e.target.value }),
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "tpdf",
															children: "Triangular"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "rpdf",
															children: "Rectangular"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "floyd",
															children: "Floyd-Steinberg"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "off",
															children: "Off"
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field",
												children: ["Bits", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													defaultValue: "24",
													onChange: (e) => gameRef.current?.setDither({ bits: Number(e.target.value) }),
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "16",
															children: "16"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "24",
															children: "24"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "32",
															children: "32"
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field",
												children: ["Amount", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "range",
													min: 0,
													max: 2,
													step: .01,
													defaultValue: 1,
													onChange: (e) => gameRef.current?.setDither({ amount: Number(e.target.value) })
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field",
												children: ["Noise shaping", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "range",
													min: 0,
													max: .98,
													step: .01,
													defaultValue: 0,
													onChange: (e) => gameRef.current?.setDither({ shaping: Number(e.target.value) })
												})]
											})
										]
									})]
								}) : null
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
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "posters",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										className: "cover",
										src: "/og.jpg",
										alt: "Mount Dew app cover"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										className: "cast",
										src: "/game/cast.jpg",
										alt: "Seraph Doll, Bluebelle, Noir Nyx, and Bestie Bea in the desert"
									})]
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
export { CHAR_BY_ID as a, rankForLevel as c, dropRelay as d, netPulse as f, CHARACTERS as i, spokenLine as l, sendRelayNop as m, BOT_NAMES as n, TEAMS as o, sendRelayAnnounce as p, BUILD_ACTIONS as r, WEAPON_BY_ID as s, routes_exports as t, xpToLevel as u };
