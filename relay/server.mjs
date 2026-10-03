/**
 * Mount Dew match relay.
 * One shared room, 1000 pilots. Connections are accepted together:
 * a player already in the match does not block the next one.
 *
 *   node relay/server.mjs
 *
 * Accounts stay in relay/data.json.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join as pathJoin } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const MAX_PILOTS = 1000;
const here = dirname(fileURLToPath(import.meta.url));
const dataFile = pathJoin(here, "data.json");

const accounts = new Map();
const sessions = new Map();
const humans = new Map();
const liveSock = new Map();
const upgraded = new WeakSet();
let shots = [];
let shotSeq = 1;
let snapAt = 0;
let snapCount = -1;
let snapHumans = [];
let saving = false;
const chatLog = [];

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

async function save() {
  if (saving) return;
  saving = true;
  try {
    mkdirSync(here, { recursive: true });
    const rows = [];
    for (const [key, acc] of accounts) rows.push({ key, acc });
    await writeFile(dataFile, JSON.stringify({ accounts: rows }));
  } catch (err) {
    console.error("save failed", err);
  } finally {
    saving = false;
  }
}

function humansNow(now) {
  for (const [key, human] of humans) {
    const sock = liveSock.get(key);
    const open = sock && !sock.destroyed && !sock.writableEnded;
    if (!open && now - human.at > 12000) {
      humans.delete(key);
      if (liveSock.get(key) === sock) liveSock.delete(key);
    }
  }
  snapHumans = [];
  for (const human of humans.values()) snapHumans.push(human);
  snapAt = now;
  snapCount = humans.size;
  return snapHumans;
}

function rosterList() {
  const now = Date.now();
  const rows = [];
  for (const human of humansNow(now)) {
    const acc = accounts.get(String(human.nick || "").toLowerCase());
    rows.push({
      nick: human.nick,
      team: human.team,
      charId: human.charId,
      x: human.x,
      y: human.y,
      z: human.z,
      yaw: human.yaw,
      hp: human.hp,
      lvl: human.lvl,
      kills: acc?.kills || 0,
      deaths: acc?.deaths || 0,
      xp: acc?.xp || 0,
      caps: acc?.caps || 0,
      ping: acc?.pingPub || 0,
    });
  }
  return rows;
}

function broadcastRoster() {
  fanout(JSON.stringify({ op: "roster", pilots: rosterList() }));
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
    if (humans.size >= MAX_PILOTS) return { ok: false, error: "Match is full. One thousand pilots." };
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
      returns: false,
    };
    accounts.set(key, acc);
  } else if (!same(hashPass(password, acc.salt), acc.pass)) {
    return { ok: false, error: "That nickname is taken and the password does not match." };
  } else {
    acc.team = team;
    acc.charId = charId;
  }
  for (const [tok, k] of sessions) if (k === key) sessions.delete(tok);
  const token = randomBytes(18).toString("hex");
  sessions.set(token, key);
  const board = rosterList();
  console.log(`joined ${acc.nick}  (${sessions.size} sessions, ${humans.size} live)`);
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
  if (!msg.fix) {
    acc.lastActive = now;
    acc.idleStrikes = 0;
  }
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
  snapCount = -1;
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
  if (shots.length > 8000) shots = shots.filter((row) => now - row.at < 1500);
  const list = humansNow(now).filter((human) => human.nick !== acc.nick);
  const mine = shots.filter((row) => row.nick !== acc.nick && now - row.at < 1200);
  return { ok: true, xp: acc.xp, kills: acc.kills, deaths: acc.deaths, caps: acc.caps, humans: list, shots: mine, serverNow: now };
}

function noteNop(msg) {
  const key = sessions.get(String(msg.token || ""));
  if (!key) return { ok: false, error: "Session faded. Drop in again." };
  const human = humans.get(key);
  if (human) human.at = Date.now();
  return { ok: true };
}

function notePong(msg) {
  const key = sessions.get(String(msg.token || ""));
  const acc = key ? accounts.get(key) : null;
  if (!acc) return { ok: false };
  const sent = Number(msg.t) || 0;
  if (!sent) return { ok: true };
  const rtt = Math.max(0, Math.min(9999, Date.now() - sent));
  acc.ping = rtt;
  if (!acc.pingPubAt || Date.now() - acc.pingPubAt >= 5000) {
    acc.pingPub = rtt;
    acc.pingPubAt = Date.now();
  }
  return { ok: true };
}

function pushAfk(socket, action) {
  try {
    sendText(socket, JSON.stringify({ op: "afk", action }));
  } catch {
    sockets.delete(socket);
  }
}

function sweepIdle() {
  const now = Date.now();
  for (const [key] of humans) {
    const acc = accounts.get(key);
    const sock = liveSock.get(key);
    if (!acc || !sock || sock.destroyed) continue;
    const quiet = !acc.lastActive || now - acc.lastActive >= 30000;
    if (!quiet) continue;
    acc.idleStrikes = (acc.idleStrikes || 0) + 1;
    if (acc.idleStrikes === 1) pushAfk(sock, "spawn");
    else {
      pushAfk(sock, "kill");
      acc.idleStrikes = 0;
      acc.lastActive = now;
    }
  }
}

function seatPilot(socket, profile) {
  const key = String(profile.nick || "").toLowerCase();
  const acc = accounts.get(key);
  if (!acc) return;
  const was = humans.has(key);
  const now = Date.now();
  const prev = humans.get(key);
  humans.set(key, {
    nick: acc.nick,
    team: acc.team,
    charId: acc.charId,
    x: prev?.x || 0,
    y: prev?.y || 0,
    z: prev?.z || 0,
    yaw: prev?.yaw || 0,
    hp: prev?.hp ?? 100,
    lvl: Math.max(1, Math.floor(Math.sqrt((acc.xp || 0) / 40)) + 1),
    at: now,
  });
  snapCount = -1;
  const old = liveSock.get(key);
  liveSock.set(key, socket);
  socket._pilot = key;
  acc.lastActive = now;
  if (old && old !== socket) {
    try {
      old.end();
    } catch {
      /* already gone */
    }
  }
  if (!was) {
    const teamName = ["Citrus", "Voltage", "Code Red"][acc.team] || "the match";
    const text = acc.returns ? `${acc.nick} rejoined ${teamName}.` : `${acc.nick} joined ${teamName}.`;
    acc.returns = true;
    const line = JSON.stringify({ op: "announce", nick: acc.nick, team: acc.team, text });
    for (const sock of sockets) {
      if (sock === socket || sock.destroyed || sock.writableEnded) continue;
      try {
        sendText(sock, line);
      } catch {
        sockets.delete(sock);
      }
    }
  }
  broadcastRoster();
}

function releasePilot(socket) {
  const key = socket._pilot;
  sockets.delete(socket);
  if (!key || liveSock.get(key) !== socket) return;
  liveSock.delete(key);
  humans.delete(key);
  snapCount = -1;
  broadcastRoster();
}

function fanout(text) {
  for (const sock of sockets) {
    if (sock.destroyed || sock.writableEnded) {
      sockets.delete(sock);
      continue;
    }
    try {
      sendText(sock, text);
    } catch {
      sockets.delete(sock);
    }
  }
}

function sayChat(msg) {
  const key = sessions.get(String(msg.token || ""));
  if (!key) return { ok: false, error: "Session faded. Drop in again." };
  const acc = accounts.get(key);
  if (!acc) return { ok: false, error: "Unknown pilot." };
  const text = String(msg.text || "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  if (!text) return { ok: false, error: "Say something." };
  const now = Date.now();
  if (acc.lastChat && now - acc.lastChat < 400) return { ok: false, error: "Slow down." };
  acc.lastChat = now;
  const line = { op: "chat", nick: acc.nick, team: acc.team, text, at: now };
  chatLog.push(line);
  if (chatLog.length > 40) chatLog.shift();
  fanout(JSON.stringify(line));
  return { ok: true };
}

function sayAnnounce(msg, from) {
  const key = sessions.get(String(msg.token || ""));
  if (!key) return { ok: false, error: "Session faded. Drop in again." };
  const acc = accounts.get(key);
  if (!acc) return { ok: false, error: "Unknown pilot." };
  const text = String(msg.text || "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  if (!text) return { ok: false, error: "Empty." };
  const line = JSON.stringify({ op: "announce", nick: acc.nick, team: acc.team, text, at: Date.now() });
  for (const sock of sockets) {
    if (sock === from || sock.destroyed || sock.writableEnded) continue;
    try {
      sendText(sock, line);
    } catch {
      sockets.delete(sock);
    }
  }
  return { ok: true };
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
  try {
    if (msg.op === "join") body = joinPilot(msg);
    else if (msg.op === "pulse") body = pulse(msg);
    else if (msg.op === "nop") body = noteNop(msg);
    else if (msg.op === "pong") body = notePong(msg);
    else if (msg.op === "chat") body = sayChat(msg);
    else if (msg.op === "announce") body = sayAnnounce(msg, socket);
    else body = { ok: false, error: "Unknown op." };
  } catch (err) {
    console.error("pilot message failed", err);
    body = { ok: false, error: "Match hiccup. Try again." };
  }
  if (msg.op === "join" && body && body.ok) {
    seatPilot(socket, body.profile);
    body.board = rosterList();
  }
  sendText(socket, JSON.stringify({ id, ...body }));
  if (msg.op === "join" && body && body.ok) {
    for (const line of chatLog) sendText(socket, JSON.stringify(line));
  }
}

function acceptKey(key) {
  return createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
}

function sendText(socket, text) {
  if (socket.writableLength > 2_000_000) return;
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
  if (len > 1_000_000) return { opcode: 8, payload: Buffer.alloc(0), used: buf.length };
  const masked = (b1 & 128) !== 0;
  const maskLen = masked ? 4 : 0;
  if (buf.length < offset + maskLen + len) return null;
  const mask = masked ? buf.subarray(offset, offset + 4) : null;
  offset += maskLen;
  const payload = Buffer.from(buf.subarray(offset, offset + len));
  if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
  const used = offset + len;
  if (used <= 0) return null;
  return { opcode: buf[0] & 15, payload, used };
}

function bindSocket(socket, head) {
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 15000);
  let buf = head && head.length ? Buffer.from(head) : Buffer.alloc(0);
  const drain = () => {
    while (true) {
      const frame = takeFrame(buf);
      if (!frame || frame.used <= 0) break;
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
  };
  socket.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    if (buf.length > 2_000_000) {
      socket.destroy();
      return;
    }
    drain();
  });
  drain();
}

const sockets = new Set();

export function relayHealth() {
  return { ok: true, pilots: humans.size, cap: MAX_PILOTS, sessions: sessions.size, site: "https://mountdew.oops.wtf" };
}

export function attachRelay(server) {
  server.timeout = 0;
  server.requestTimeout = 0;
  server.headersTimeout = 0;
  server.keepAliveTimeout = 70_000;
  server.on("clientError", (_err, socket) => {
    if (upgraded.has(socket)) return;
    socket.destroy();
  });
  server.on("upgrade", (req, socket, head) => {
    const key = String(req.headers["sec-websocket-key"] || "");
    if (!key) {
      socket.destroy();
      return;
    }
    upgraded.add(socket);
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + acceptKey(key) + "\r\n\r\n",
    );
    sockets.add(socket);
    bindSocket(socket, head);
    socket.on("close", () => releasePilot(socket));
    socket.on("error", () => releasePilot(socket));
  });
}

load();
setInterval(save, 15000);
setInterval(broadcastRoster, 10000);
setInterval(sweepIdle, 30000);
let pingI = 0;
setInterval(() => {
  const entries = [...liveSock.entries()];
  const n = entries.length;
  if (!n) return;
  const perTick = Math.max(1, Math.ceil(n / 25));
  for (let k = 0; k < perTick; k++) {
    const pair = entries[pingI % n];
    pingI++;
    if (!pair) continue;
    const [key, sock] = pair;
    const acc = accounts.get(key);
    if (!acc || !sock || sock.destroyed || sock.writableEnded) continue;
    acc.probe = Date.now();
    try {
      sendText(sock, JSON.stringify({ op: "ping", t: acc.probe }));
    } catch {
      sockets.delete(sock);
    }
  }
}, 200);
setInterval(() => {
  const rows = [];
  for (const human of humans.values()) {
    const acc = accounts.get(String(human.nick || "").toLowerCase());
    if (!acc || !acc.pingPub) continue;
    rows.push({ nick: human.nick, ms: acc.pingPub });
  }
  if (rows.length) fanout(JSON.stringify({ op: "pings", rows }));
}, 5000);

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
      res.end(JSON.stringify(relayHealth()));
      return;
    }
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("Mount Dew relay. The site and the match share https://mountdew.oops.wtf via node host/server.mjs");
  });
  attachRelay(server);
  server.listen({ port: PORT, host: HOST, backlog: 4096 }, () => {
    console.log(`Mount Dew relay on ${HOST}:${PORT}  (${MAX_PILOTS} pilots, one room)`);
  });
}
