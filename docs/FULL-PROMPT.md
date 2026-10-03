Paste this whole document as one prompt.

# Build Mount Dew

Build a finished, playable browser game called Mount Dew, plus the support files in this prompt. It is a cute high-graphics 3D capture-the-flag match for one hundred human seats, three teams, one large map, running all the time with no win limit. The look is Fortnite / Team Fortress 2 / League of Legends candy, not realistic. Ship a real match, not a menu mock.

Stack: TanStack Start, React 19, Vite, Tailwind v4, Three.js in a dynamically imported vanilla engine. Nickname gate is custom (no platform auth, no database). Remember nickname and password in localStorage. Rank, xp, kills, deaths, and captures are server-authoritative. Movement is predicted locally. Other pilots interpolate. Shots are fire-and-forget. If the Match server field is blank, play through the in-browser relay. If it has an address, connect there.

## Hard rules learned while making this game

- Third-person strafe, not vehicle steering. Yaw 0 faces world -Z. forward = (-sin yaw, 0, -cos yaw). right = (cos yaw, 0, -sin yaw). W is +forward, S is -forward, D is +right, A is -right. A moves screen-left, D moves screen-right. Q increases yaw, E decreases yaw. Mouse yaw -= movementX, pitch -= movementY, clamp about ±1.2. Do not flip the A/D signs. Do not treat A/D as yaw.
- Shots leave the camera exactly through the crosshair. No spread, no recoil, unlimited ammo. Aim is independent of movement.
- Sky is a vertex-colored MeshBasic sphere. Ground is MeshLambert with a baked grit map. Fog is Fog(0x8ec4ee, 130, 380). Do not use a custom ShaderMaterial on the sky or the ground (it fills the frame with rainbow noise). Shadow maps stay off on low, medium, and high. Default graphics is high.
- Do not render a second scene for the viewmodel gun. A second renderer.render clears the world. The gun can exist, but only the main scene is drawn.
- Do not run an onBeforeCompile tile tint on character instances. It turns the buildings black. Tint characters with instance color.
- Help credit is exactly the text MADE BY DAN. Do not write MADE IN CHINA.
- The nickname screen and the About tab show public/game/cast.jpg and the label @sugoimeg.
- Names are legally distinct. Do not use Kirby, Skeletor, Super Sheep, or Mountain Dew as names. The title stays Mount Dew. Cans read MOUNT, VOLT, and RED DEW. The pink round lead is Puffstar. The bone lead is Bonecaller. The lamb is Superbleat.
- Bots are 12 per team (36) plus one starter mutant per team. Actor parts cap at 72. Mutant parts cap at 48. Empty seats are match pilots, not a fake crowd of 100 simulated dolls. Say that honestly.
- Raised soldiers are green mutant zombies, not recolored pilots. They shamble the way they face. Two-bone arms and legs. Limb pitch 0 means the limb hangs straight down; the mesh pitch is Math.PI minus that angle so local +Y points down and a little forward. Body and head hunch slightly forward. Do not flip the torso by PI or the arms point up. Walk speed about 2.7. Animation rate is speed/1.28 times 2π so the feet plant. If the goal is closer than 0.75, stop. If stuck, turn sideways instead of crab-strafing. No wallride and no train. A short hop when a ledge is in the way. Claws are long along local Y from the wrist. Face has stitches, glowing eyes, and teeth. Extra pieces: neck, brow, torn ears, chest wound, back spikes, three bone claws, shoulder caps, rag flaps. Sixteen live mutants per team.
- Textures (cloth, skin, hair, stone, wood, leaves, metal, grit, water, feathers, zombie skin, rags, bone, mutant face) are canvas textures baked once when the match loads. RAM use is fine.
- No music. Synth sound effects and short spoken lines only.

## Match

Three teams, nonstop capture the flag. Citrus #c6e35a at (0, -88), Voltage #3ec6ff at (-76, 44), Code Red #ff5a68 at (76, 44). Bases sit about two floors above the trenches. Hill at the middle, held for two minutes, then that team gets 20% speed and green plus particles. HP 100, regen 1 per second. Minions cap at 90 and regen 0.3 per second. Downed pilots keep their color and name, scream help, and show an X on the map. Walk-through revive. Space or Spawn leaves a gray corpse. Pinpop (voodoo), Wrapley (mummy), and Bonecaller (necromancer) raise a nearby corpse. Mutants fight, carry flags, and stand on the hill. One starter mutant per team.

Scoreboard is Tab. Map is M, otherwise a rotating minimap. Clock is top-right: time, date, month, season, weather. 24 game hours equal 60 real minutes (day length 3600 seconds). Start near 15:00. The calendar starts 20 March 2026 UTC. Weather changes every 35 to 75 seconds among clear, cloudy, sun, rain, and snow. Console is the backtick key. Ranks run Recruit through General, each needing more levels than the last, Jaymod-style, not a real military chart. ASCII logo and boot lines: MOUNT DEW 1.0.1, textures baked in memory, relay Amsterdam-IX, movement prediction on, hits fire-and-forget.

Options: graphics low / medium / high (default high), look sensitivity, volume, fullscreen. Tokens: ink #12140f, surface #1c2116, citrus #c6e35a. Fonts Fredoka and Outfit. No emoji in the chrome.

## Cast

Twenty pilots. Voice numbers are synth pitch.

1. Seraph Doll, angel. Petite white-haired angel, wings, halo, hold jump to glide. Voice 620. Weapons plasma, laugh, melee.
2. Bluebelle. Blue hair, squad speed aura. Voice 540. Dual, plasma, laugh.
3. Noir Nyx. Petite, straight black hair, long shadow dash. Voice 300. Plasma, knife, laugh.
4. Bestie Bea. The goth's friend. Fast revive and shared heal. Voice 580. Plasma, laugh, melee.
5. Puffstar. Inhale, float, then flatten into a slide. Voice 700. Bounce, plasma, melee.
6. Hopscotch. Bunny chains get faster and higher up to a cap. Voice 640.
7. Triple Mint. Three jumps. Everyone else has two. Voice 600.
8. Boomer. Rockets that rocket-jump. Voice 280.
9. Buzz. Drone hover and stalking buzzbombs. Voice 480.
10. Skylark. Bird flap. Fuel returns on landing. Voice 720.
11. Packrat. Jetpack. Hold jump in the air. Voice 360.
12. Pinpop. Voodoo rise. Voice 260.
13. Wrapley. Mummy rise, tougher mutants. Voice 240.
14. Bonecaller. Necromancer rise, slower mutants, harder hits. Voice 220.
15. Glasseye. Sniper. Right mouse is a scope, FOV 18. Voice 400.
16. Twinstitch. Dual popguns, both shots on the crosshair. Voice 560.
17. Cinderpop. Short flamethrower cone. Voice 340.
18. Superbleat. Kamikaze lamb, pop, hop out alive. Voice 660. Line: baaaa!
19. Blocky. Places pads, walls, turrets, and traps faster. Voice 420.
20. Wallaby. Wallrides longer than anyone. Everyone can wallride. Voice 500.

Weapons: Plasma Rifle hitscan, Twin Popguns, Glass Rifle, Rocket Tube, Bounce Ball, Laugh Grenade (becomes bouncing smileys for about 10 seconds), Party Torch cone, Bat, Knife, Drone Launcher. G cycles signature, block, jump pad, turbo, turret, mine, tangle, telepad. F uses the selected action, or climbs if you are holding a wall. Minecraft-style building. A bunker of three blocks awards xp.

Lines, spoken as syllables, not recordings: jump joohoo, double boing boing, triple wheee, dash let's go, wall hup, water splish, land phew, down help, sheep baaaa, yay jeehee, ride chuchu, puff whooo, groan graaah.

## Movement

WASD plus Q and E. Double-tap WASD to dodge. Shift dashes. Jump, double jump, wall jump, coyote time, step-up. Infinite climb while F is held on a wall. Rocket jump. Wallride. Bunnyhop chains. Triple jump on Triple Mint. Fly for the bird, the drone, the jetpack, and the angel glide. Easy air control. No fall damage. Actors do not block each other. QA spawn is x 24, y 0.05, z -24, yaw 0. Bots do not damage the QA pilot.

## Map

One desert map. Coconut palms, a white stone city, a red stone city, and a space deck zone. Biomes Citrus, Voltage, and Code Red. A river and bridges. A spiral parkour and a climbable wall up to the hill. Air-current rings. A loop train you stick to and jump off carrying its velocity. Thirty medpack rings that heal 45 and respawn after 60 seconds. Giant bounce soda cans. Team bases, trenches two floors lower, flags at the bases.

## Voices, announcer, commentator, spectator

Too many pilots makes one shared sound bus into noise. Hear only nearby sounds.

- The listener is the camera.
- A sound is full volume within 7 meters and silent by about 28 meters (shots and explosions may reach a little farther, the train a little farther than that).
- You always hear your own pilot.
- At most two other pilot voices, three gunshots, and two explosions at once.
- Character lines are a syllable synth (square for pilots, saw for the announcer, triangle for the commentator) plus a quiet sine harmonic. Not text-to-speech. Pilot voice cooldown about 0.5 seconds, mutants about 1.35, other bots about 1.75.
- The announcer and the commentator share one booth queue, at most two lines waiting. The announcer calls flag captured, flag taken, flag returned, speed surge, hill secured, pilot revived, and mutant risen. The commentator speaks every 11 seconds about what is near the camera: a flag runner, claws out, a hill fight, the river, or a short flavor line (squad up, watch the flank, hold the flag, nice and easy). If the announcer is talking, the commentator waits.
- Booth volume fades when the camera climbs above about 16 meters or travels horizontally past about 108 meters from the map center, and is gone by roughly 70 meters past that. Flying away quiets the whole mix, including the booth. The field still hears the booth when you are on it.

Spectator: V, the eye button, or Options. The fly camera uses WASD along the look direction. A is screen-left and D is screen-right, same basis as the pilot. Space up, Ctrl or C down, Shift about 2.6 times faster. Clamp the fly camera to the map, from just above the ground to about 86 high. The pilot body does not enter bot AI while you spectate, and it stays where you left it. Mouse look moves the fly camera, not the pilot. Overlay caption: Spectator, WASD fly, Space up, Ctrl down, V back. Sounds use the fly camera, so they fade as you leave.

## Match server you can run

A desktop with a Core i7 and 32 GB of RAM hosts one hundred pilots in one process. No npm dependencies. Node is enough. Write the file relay/server.mjs exactly as embedded below. Run it with node relay/server.mjs. It listens on 0.0.0.0 port 8787 unless HOST or PORT is set. Health is GET /health and returns ok, pilot count, and cap 100. Accounts persist to relay/data.json every 15 seconds. Passwords are salted SHA-256. A wrong password never overwrites a name. New names register at once. Cap 100 connected pilots. Pulse rejects unknown tokens. Rate-limit pulses closer than 30 ms by returning the last score without applying gains. Every 10 seconds, accept at most 400 xp and 8 kills. Also clamp deaths and captures per pulse. Humans snapshot is cached for 50 ms. Drop humans silent for 8 seconds. Keep a ring of about 240 recent shots and only return shots from other pilots newer than about 1.2 seconds. WebSocket is raw RFC 6455, text frames, opcode 8 closes, opcode 9 answers with pong. Messages are JSON {op, id, ...}. Ops are join and pulse. The reply echoes id.

Join fields: nick (3 to 16 letters, numbers, underscore), password (4 to 64), team 0, 1, or 2, charId. Reply ok, token, profile, and a top-24 board.

Pulse fields: token, x, y, z, yaw, hp, dxp, dk, dd, dc, shots[{ox,oy,oz,dx,dy,dz,dmg}]. Reply ok, xp, kills, deaths, caps, humans (everyone else), shots, serverNow.

The browser client tries the typed address for 4 seconds. On failure, say the match server did not answer and do not drop the pilot in. On success, bind that socket and send pulses there instead of the in-browser relay. Closing the page closes the socket. Leave the field blank to play in this browser. Help tells the player: leave Match server blank to play here; to host 100 pilots, run node relay/server.mjs on the match PC and paste its address before you drop in.

The in-browser relay uses the same password, session, and pulse caps so a refreshed page cannot invent score.

## Support file: docs/design.md

Write this file exactly:

```markdown
# Mount Dew 1.0.1

Three-team capture the flag on one desert map, played in the browser. Humans sync through an Amsterdam-IX relay (nickname, password, xp, position, shots). Open seats are match pilots so the field is alive alone.

## 1.0.1

- Surfaces are canvas textures baked once when the match loads: cloth, skin, hair, stone, wood, leaves, metal, ground grit, water, feathers. Instance color still tints them, so teams and biomes stay readable.
- Raised soldiers are green mutant models (hunched, long arms, glowing eyes, torn rags), not recolored pilots. They shamble on a two-bone stride matched to their speed, so the feet plant instead of skating. They turn to face the way they walk, hop a low ledge, and do not wallride or ride the train. They claw, hunt, and can still carry a flag. Pinpop, Wrapley, and Bonecaller raise them. Each team also starts with one on the field. Sixteen live mutants per team. Extra pieces: painted face, neck, brow, torn ears, chest wound, back spikes, three bone claws, shoulder caps, and rag flaps.
- Shadow maps stay off. The sky and ground stay Lambert / basic materials.

## Choices

- Third-person strafe, not vehicle steer. A moves screen-left while facing the camera. Mouse aims. Shots leave the crosshair with no spread and no recoil.
- Movement is immediate on your machine. Other pilots interpolate. Hits are sent without waiting for an ack. The relay caps xp and kills per 10 seconds.
- Collision is simple boxes so jumps, walljumps, climb, and pads stay easy: coyote time, step-up, generous wall probe.
- One draw for the static map (instancing), shared character parts, a separate mutant rig, line tracers for guns, pooled particles. Shadow maps stay off so the map does not go black.
- Cute candy pops stand in for gibs. No real-world weapon photo as the viewmodel.
- Nicknames are the account. New names register at once. Passwords are salted on the relay and also remembered in this browser, as requested. Wrong password cannot take an existing name.
- Voices stay local. You always hear your pilot. At most two other pilots and a handful of close guns. An announcer calls captures, returns, the hill, and rise. A commentator drops a short line every few seconds. Both fade if the camera leaves the field.
- V detaches a spectator camera. WASD flies along the look direction, A is screen-left, Space up, Ctrl down, Shift faster. The pilot stays where they were until V again.
- A match PC runs `node relay/server.mjs` (100 pilots, one process, accounts in relay/data.json). Paste that address into Match server. Leave it blank to play inside the browser.

## Map

Citrus mesa in the coconut desert and white stone, Voltage on the space decks, Code Red in the red stone city. Trenches and a river sit two floors lower. A spiral and a climbable wall reach the hill. Air rings, a loop train, bounce cans, and medpacks connect the flags.

## Ranks

Recruit through General. Each rank asks for more levels than the last, Jaymod-style, not a real military chart.
```

## Support file: relay/server.mjs

Write this file exactly:

```js
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
import { fileURLToPath } from "node:url";

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

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, pilots: humans.size, cap: MAX_PILOTS }));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Mount Dew relay. Open a websocket on this port.");
});

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

load();
setInterval(save, 15000);
server.listen(PORT, HOST, () => {
  console.log(`Mount Dew relay on ${HOST}:${PORT}  (${MAX_PILOTS} pilots)`);
});
```

## Done when

A stranger can open the page, pick a team and a pilot, and play capture the flag with bots and one mutant per team. Nearby voices are intelligible. The announcer calls a capture. The commentator talks every few seconds. V flies the camera and the field goes quiet as it climbs away. A and D still strafe screen-left and screen-right on the pilot and on the fly camera. Help still says MADE BY DAN. Blank Match server plays immediately. node relay/server.mjs accepts a hundred pilots on a normal desktop.
