/**
 * Mount Dew match relay.
 * One process, 100 pilots, built for a desktop CPU.
 *
 *   node relay/server.mjs
 *
 * Then put  ws://THIS-PC:8787  in Match server before you drop in.
 * PORT=8787 overrides the port. Accounts stay in relay/data.json.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join as pathJoin } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const MAX_PILOTS = 100;
const here = dirname(fileURLToPath(import.meta.url));
const dataFile = pathJoin(here, "data.json");

const accounts = new Map();
const sessions = new Map();
const humans = new Map();
let shots = [];
let shotSeq = 1;
let snapAt = 0;
let snapHumans = [];

function hashPass(password, salt) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function same(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function load() {
  try {
    const raw = JSON.parse(readFileSync(dataFile, "utf8"));
    for (const row of raw.accounts || []) accounts.set(row.key, row.acc);
  } catch {
    /* first boot */
  }
}

function save() {
  try {
    mkdirSync(here, { recursive: true });
    const rows = [];
    for (const [key, acc] of accounts) rows.push({ key, acc });
    writeFileSync(dataFile, JSON.stringify({ accounts: rows }));
  } catch (err) {
    console.error("save failed", err);
  }
}

function humansNow(now) {
  if (now - snapAt < 50 && snapHumans.length) return snapHumans;
  for (const [key, human] of humans) {
    if (now - human.at > 8000) humans.delete(key);
  }
  snapHumans = [];
  for (const human of humans.values()) snapHumans.push(human);
  snapAt = now;
  return snapHumans;
}

function joinPilot(msg) {
  const nick = String(msg.nick || "").trim();
  const password = String(msg.password || "");
  const team = Number(msg.team);
  const charId = String(msg.charId || "angel").slice(0, 24);
  if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) return { ok: false, error: "Nickname needs 3–16 letters, numbers, or underscore." };
  if (password.length < 4 || password.length > 64) return { ok: false, error: "Password needs 4–64 characters." };
  if (team !== 0 && team !== 1 && team !== 2) return { ok: false, error: "Pick a team." };
  const key = nick.toLowerCase();
  let acc = accounts.get(key);
  if (!acc) {
    if (humans.size >= MAX_PILOTS) return { ok: false, error: "Match is full. One hundred pilots." };
    const salt = randomBytes(8).toString("hex");
    acc = {
      nick,
      pass: hashPass(password, salt),
      salt,
      xp: 0,
      kills: 0,
      deaths: 0,
      caps: 0,
      team,
      charId,
      windowStart: Date.now(),
      xpWindow: 0,
      kWindow: 0,
    };
    accounts.set(key, acc);
  } else if (!same(hashPass(password, acc.salt), acc.pass)) {
    return { ok: false, error: "That nickname is taken and the password does not match." };
  } else {
    acc.team = team;
    acc.charId = charId;
  }
  const token = randomBytes(18).toString("hex");
  sessions.set(token, key);
  const board = [...accounts.values()]
    .map((row) => ({ nick: row.nick, xp: row.xp, kills: row.kills, deaths: row.deaths, caps: row.caps, team: row.team }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 24);
  return {
    ok: true,
    token,
    profile: { nick: acc.nick, xp: acc.xp, kills: acc.kills, deaths: acc.deaths, caps: acc.caps, team: acc.team, charId: acc.charId },
    board,
  };
}

function pulse(msg) {
  const key = sessions.get(String(msg.token || ""));
  if (!key) return { ok: false, error: "Session faded. Drop in again." };
  const acc = accounts.get(key);
  if (!acc) return { ok: false, error: "Unknown pilot." };
  const now = Date.now();
  if (acc.lastPulse && now - acc.lastPulse < 30) {
    return { ok: true, xp: acc.xp, kills: acc.kills, deaths: acc.deaths, caps: acc.caps, humans: humansNow(now).filter((h) => h.nick !== acc.nick), shots: [], serverNow: now };
  }
  acc.lastPulse = now;
  if (now - acc.windowStart > 10000) {
    acc.windowStart = now;
    acc.xpWindow = 0;
    acc.kWindow = 0;
  }
  const addXp = Math.max(0, Math.min(400 - acc.xpWindow, Math.floor(Number(msg.dxp) || 0)));
  const addK = Math.max(0, Math.min(8 - acc.kWindow, Math.floor(Number(msg.dk) || 0)));
  const addD = Math.max(0, Math.min(6, Math.floor(Number(msg.dd) || 0)));
  const addC = Math.max(0, Math.min(4, Math.floor(Number(msg.dc) || 0)));
  acc.xp += addXp;
  acc.kills += addK;
  acc.deaths += addD;
  acc.caps += addC;
  acc.xpWindow += addXp;
  acc.kWindow += addK;
  const lvl = Math.max(1, Math.floor(Math.sqrt(acc.xp / 40)) + 1);
  humans.set(key, {
    nick: acc.nick,
    team: acc.team,
    charId: acc.charId,
    x: Number(msg.x) || 0,
    y: Number(msg.y) || 0,
    z: Number(msg.z) || 0,
    yaw: Number(msg.yaw) || 0,
    hp: Number(msg.hp) || 0,
    lvl,
    at: now,
  });
  const incoming = Array.isArray(msg.shots) ? msg.shots.slice(0, 8) : [];
  for (const shot of incoming) {
    shots.push({
      id: shotSeq++,
      nick: acc.nick,
      team: acc.team,
      ox: Number(shot.ox) || 0,
      oy: Number(shot.oy) || 0,
      oz: Number(shot.oz) || 0,
      dx: Number(shot.dx) || 0,
      dy: Number(shot.dy) || 0,
      dz: Number(shot.dz) || 0,
      dmg: Math.max(0, Math.min(160, Number(shot.dmg) || 0)),
      at: now,
    });
  }
  if (shots.length > 240) shots = shots.slice(-160);
  else shots = shots.filter((row) => now - row.at < 1500);
  const list = humansNow(now).filter((human) => human.nick !== acc.nick);
  const mine = shots.filter((row) => row.nick !== acc.nick && now - row.at < 1200);
  return { ok: true, xp: acc.xp, kills: acc.kills, deaths: acc.deaths, caps: acc.caps, humans: list, shots: mine, serverNow: now };
}

function onJson(socket, text) {
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return;
  }
  const id = msg.id;
  let body;
  if (msg.op === "join") body = joinPilot(msg);
  else if (msg.op === "pulse") body = pulse(msg);
  else body = { ok: false, error: "Unknown op." };
  sendText(socket, JSON.stringify({ id, ...body }));
}

function acceptKey(key) {
  return createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
}

function sendText(socket, text) {
  const payload = Buffer.from(text);
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x81;
  socket.write(Buffer.concat([header, payload]));
}

function takeFrame(buf) {
  if (buf.length < 2) return null;
  const b1 = buf[1];
  let len = b1 & 127;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    len = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }
  const masked = (b1 & 128) !== 0;
  const maskLen = masked ? 4 : 0;
  if (buf.length < offset + maskLen + len) return null;
  const mask = masked ? buf.subarray(offset, offset + 4) : null;
  offset += maskLen;
  const payload = Buffer.from(buf.subarray(offset, offset + len));
  if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
  return { opcode: buf[0] & 15, payload, used: offset + len };
}

const sockets = new Set();

export function relayHealth() {
  return { ok: true, pilots: humans.size, cap: MAX_PILOTS, site: "http://mountdew.oops.wtf" };
}

export function attachRelay(server) {
  server.on("upgrade", (req, socket) => {
    const key = String(req.headers["sec-websocket-key"] || "");
    if (!key) {
      socket.destroy();
      return;
    }
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + acceptKey(key) + "\r\n\r\n",
    );
    sockets.add(socket);
    let buf = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (true) {
        const frame = takeFrame(buf);
        if (!frame) break;
        buf = buf.subarray(frame.used);
        if (frame.opcode === 8) {
          socket.end();
          return;
        }
        if (frame.opcode === 9) {
          const pong = Buffer.alloc(2);
          pong[0] = 0x8a;
          pong[1] = 0;
          socket.write(pong);
          continue;
        }
        if (frame.opcode === 1) onJson(socket, frame.payload.toString("utf8"));
      }
    });
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => sockets.delete(socket));
  });
}

load();
setInterval(save, 15000);

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(relayHealth()));
      return;
    }
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("Mount Dew relay. The site and the match share http://mountdew.oops.wtf via node host/server.mjs");
  });
  attachRelay(server);
  server.listen(PORT, HOST, () => {
    console.log(`Mount Dew relay on ${HOST}:${PORT}  (${MAX_PILOTS} pilots)`);
  });
}
