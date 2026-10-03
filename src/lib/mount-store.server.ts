import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type Profile = {
  nick: string;
  xp: number;
  kills: number;
  deaths: number;
  caps: number;
  team: number;
  charId: string;
};

export type HumanSnap = {
  nick: string;
  team: number;
  charId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  lvl: number;
  at: number;
};

export type ShotRelay = {
  id: number;
  nick: string;
  team: number;
  ox: number;
  oy: number;
  oz: number;
  dx: number;
  dy: number;
  dz: number;
  dmg: number;
  at: number;
};

type Acc = Profile & {
  pass: string;
  salt: string;
  windowStart: number;
  xpWindow: number;
  kWindow: number;
};

type Store = {
  accounts: Map<string, Acc>;
  sessions: Map<string, string>;
  humans: Map<string, HumanSnap>;
  shots: ShotRelay[];
  shotSeq: number;
};

function store(): Store {
  const g = globalThis as unknown as { __MOUNTDEW?: Store };
  if (!g.__MOUNTDEW) {
    g.__MOUNTDEW = {
      accounts: new Map(),
      sessions: new Map(),
      humans: new Map(),
      shots: [],
      shotSeq: 1,
    };
  }
  return g.__MOUNTDEW;
}

function hashPass(password: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function same(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

const HOUSE = [
  "Coco", "Fizz", "Neon", "Ruby", "Halo", "Orbit", "Pepper", "Mint", "Glint", "Salsa",
  "Byte", "Coral", "Lumen", "Zest", "Nova", "Brick",
];

export function getBoard(): { nick: string; xp: number; kills: number; deaths: number; caps: number; team: number }[] {
  const s = store();
  const now = Date.now();
  const rows = new Map<string, { nick: string; xp: number; kills: number; deaths: number; caps: number; team: number }>();
  HOUSE.forEach((nick, i) => {
    const xp = 180 + ((i * 137 + Math.floor(now / 120000)) % 900);
    rows.set(nick.toLowerCase(), {
      nick,
      xp,
      kills: 4 + (i % 9),
      deaths: 3 + (i % 5),
      caps: i % 4,
      team: i % 3,
    });
  });
  for (const acc of s.accounts.values()) {
    rows.set(acc.nick.toLowerCase(), {
      nick: acc.nick,
      xp: acc.xp,
      kills: acc.kills,
      deaths: acc.deaths,
      caps: acc.caps,
      team: acc.team,
    });
  }
  return [...rows.values()].sort((a, b) => b.xp - a.xp).slice(0, 24);
}

export function joinAccount(input: { nick: string; password: string; team: number; charId: string }):
  | { ok: true; token: string; profile: Profile; board: ReturnType<typeof getBoard> }
  | { ok: false; error: string } {
  const nick = input.nick.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) {
    return { ok: false, error: "Nickname needs 3–16 letters, numbers, or underscore." };
  }
  if (input.password.length < 4 || input.password.length > 64) {
    return { ok: false, error: "Password needs 4–64 characters." };
  }
  const team = input.team;
  if (team !== 0 && team !== 1 && team !== 2) return { ok: false, error: "Pick a team." };
  const s = store();
  const key = nick.toLowerCase();
  let acc = s.accounts.get(key);
  if (!acc) {
    const salt = randomBytes(8).toString("hex");
    acc = {
      nick,
      pass: hashPass(input.password, salt),
      salt,
      xp: 0,
      kills: 0,
      deaths: 0,
      caps: 0,
      team,
      charId: input.charId,
      windowStart: Date.now(),
      xpWindow: 0,
      kWindow: 0,
    };
    s.accounts.set(key, acc);
  } else if (!same(hashPass(input.password, acc.salt), acc.pass)) {
    return { ok: false, error: "That nickname is taken and the password does not match." };
  } else {
    acc.team = team;
    acc.charId = input.charId;
  }
  const token = randomBytes(18).toString("hex");
  s.sessions.set(token, key);
  const profile: Profile = {
    nick: acc.nick,
    xp: acc.xp,
    kills: acc.kills,
    deaths: acc.deaths,
    caps: acc.caps,
    team: acc.team,
    charId: acc.charId,
  };
  return { ok: true, token, profile, board: getBoard() };
}

export function pulseAccount(input: {
  token: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  dxp: number;
  dk: number;
  dd: number;
  dc: number;
  shots: { ox: number; oy: number; oz: number; dx: number; dy: number; dz: number; dmg: number }[];
}):
  | {
      ok: true;
      xp: number;
      kills: number;
      deaths: number;
      caps: number;
      humans: HumanSnap[];
      shots: ShotRelay[];
      serverNow: number;
    }
  | { ok: false; error: string } {
  const s = store();
  const key = s.sessions.get(input.token);
  if (!key) return { ok: false, error: "Session faded. Drop in again." };
  const acc = s.accounts.get(key);
  if (!acc) return { ok: false, error: "Unknown pilot." };
  const now = Date.now();
  if (now - acc.windowStart > 10000) {
    acc.windowStart = now;
    acc.xpWindow = 0;
    acc.kWindow = 0;
  }
  const addXp = Math.max(0, Math.min(400 - acc.xpWindow, Math.floor(input.dxp || 0)));
  const addK = Math.max(0, Math.min(8 - acc.kWindow, Math.floor(input.dk || 0)));
  const addD = Math.max(0, Math.min(6, Math.floor(input.dd || 0)));
  const addC = Math.max(0, Math.min(4, Math.floor(input.dc || 0)));
  acc.xp += addXp;
  acc.kills += addK;
  acc.deaths += addD;
  acc.caps += addC;
  acc.xpWindow += addXp;
  acc.kWindow += addK;
  const lvl = Math.max(1, Math.floor(Math.sqrt(acc.xp / 40)) + 1);
  s.humans.set(key, {
    nick: acc.nick,
    team: acc.team,
    charId: acc.charId,
    x: input.x,
    y: input.y,
    z: input.z,
    yaw: input.yaw,
    hp: input.hp,
    lvl,
    at: now,
  });
  for (const [k, h] of s.humans) {
    if (now - h.at > 8000) s.humans.delete(k);
  }
  const relayed: ShotRelay[] = [];
  for (const shot of (input.shots || []).slice(0, 8)) {
    const row: ShotRelay = {
      id: s.shotSeq++,
      nick: acc.nick,
      team: acc.team,
      ox: shot.ox,
      oy: shot.oy,
      oz: shot.oz,
      dx: shot.dx,
      dy: shot.dy,
      dz: shot.dz,
      dmg: Math.max(0, Math.min(160, shot.dmg)),
      at: now,
    };
    s.shots.push(row);
    relayed.push(row);
  }
  s.shots = s.shots.filter((sh) => now - sh.at < 1500).slice(-80);
  const humans = [...s.humans.values()].filter((h) => h.nick.toLowerCase() !== key);
  const shots = s.shots.filter((sh) => sh.nick.toLowerCase() !== key && now - sh.at < 1200);
  return {
    ok: true,
    xp: acc.xp,
    kills: acc.kills,
    deaths: acc.deaths,
    caps: acc.caps,
    humans,
    shots,
    serverNow: now,
  };
}
