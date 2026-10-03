export type Solid = {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  oneway: boolean;
  bounce: number;
  turbo: number;
  climb: boolean;
  color: number;
};

export type Stream = { pts: { x: number; y: number; z: number }[]; r: number };

export type WorldData = {
  solids: Solid[];
  buckets: Map<string, number[]>;
  meds: { x: number; y: number; z: number }[];
  flags: { team: number; x: number; y: number; z: number }[];
  spawns: { team: number; x: number; y: number; z: number; yaw: number }[];
  palms: { x: number; z: number; s: number }[];
  cans: { x: number; y: number; z: number; kind: number }[];
  flowers: { x: number; z: number; c: number }[];
  rocks: { x: number; z: number; s: number; c: number }[];
  grass: { x: number; z: number; s: number; c: number }[];
  streams: Stream[];
  bunkers: { x: number; z: number }[];
  trainR: number;
  trainY: number;
  hill: { x: number; y: number; z: number; r: number };
  qa: { x: number; y: number; z: number; yaw: number };
  bases: { team: number; x: number; z: number }[];
};

const CELL = 16;

function key(ix: number, iz: number) {
  return `${ix},${iz}`;
}

export function riverZ(x: number) {
  return 8 + Math.sin(x * 0.045) * 7;
}

export function inRiver(x: number, z: number) {
  if (x < -102 || x > 102) return false;
  return Math.abs(z - riverZ(x)) < 6.2;
}

function add(solids: Solid[], cx: number, cy: number, cz: number, w: number, h: number, d: number, extra?: Partial<Solid>) {
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
    color: 0xc8c2b0,
    ...extra,
  });
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function buildWorld(): WorldData {
  const solids: Solid[] = [];
  const bases = [
    { team: 0, x: 0, z: -88 },
    { team: 1, x: -76, z: 44 },
    { team: 2, x: 76, z: 44 },
  ];
  const mesaColor = [0xf4f1e6, 0x243246, 0xc4514a];
  for (const b of bases) {
    add(solids, b.x, 4, b.z, 32, 8, 32, { color: mesaColor[b.team]! });
    const yawIn = Math.atan2(-b.x, -b.z);
    const fx = -Math.sin(yawIn);
    const fz = -Math.cos(yawIn);
    for (let i = 0; i < 4; i++) {
      const dist = 16 + i * 3.2;
      const hh = 1 + i * 1.7;
      add(solids, b.x + fx * dist, hh / 2, b.z + fz * dist, 6, hh, 4, {
        color: i % 2 ? 0xe7d7b0 : mesaColor[b.team]!,
      });
    }
    add(solids, b.x + fx * 12, 8.2, b.z + fz * 12, 2.6, 0.35, 2.6, {
      bounce: 15,
      color: 0xc6e35a,
    });
  }

  for (let i = 0; i < 14; i++) {
    const a = i * 0.62 + 0.4;
    const r = 8.2 + i * 0.18;
    const y = 1.6 + i * 1.82;
    add(solids, Math.cos(a) * r, y, Math.sin(a) * r, 3.5, 0.42, 3.5, {
      oneway: true,
      color: i % 2 ? 0xd7ec8a : 0xfff4b0,
    });
  }
  add(solids, 0, 27.35, 0, 18, 0.7, 18, { color: 0xf7f3c4 });
  add(solids, 11.4, 14, 0.2, 1.35, 28, 7.5, { climb: true, color: 0xf3ead0 });
  add(solids, 0, 4.6, -58, 18, 0.7, 7, { color: 0xf4f1e4 });

  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = 44;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (inRiver(x, z)) continue;
    if (i % 5 === 0) continue;
    add(solids, x, 1.15, z, 7, 2.3, 2.4, { color: 0x8d734c });
  }
  const bunkers = [
    { x: 28, z: 18 },
    { x: -30, z: 16 },
    { x: 4, z: -28 },
  ];
  for (const b of bunkers) {
    add(solids, b.x, 1.6, b.z, 8, 3.2, 6, { color: 0x6e5a40 });
    add(solids, b.x, 3.5, b.z - 2.2, 8, 0.4, 1.2, { oneway: true, color: 0x8a7050 });
  }

  const whites: [number, number, number][] = [
    [-40, -60, 7],
    [-28, -68, 5],
    [-50, -70, 6],
    [-36, -50, 4.5],
  ];
  for (const [x, z, h] of whites) {
    add(solids, x, h / 2, z, 8, h, 8, { color: 0xf6f3ec });
    add(solids, x, h + 0.35, z, 5.5, 0.7, 5.5, { color: 0xe4eccf });
  }
  const reds: [number, number, number][] = [
    [98, 18, 6],
    [90, 8, 5],
    [108, 30, 7],
    [86, 28, 4],
  ];
  for (const [x, z, h] of reds) {
    add(solids, x, h / 2, z, 7.5, h, 7.5, { color: 0xb8433c });
    add(solids, x + 1.2, h + 1.2, z, 1.4, 2.4, 1.4, { color: 0x6a2a24 });
  }
  const space: [number, number, number][] = [
    [-96, 62, 12],
    [-58, 70, 16],
    [-88, 24, 10],
    [-104, 40, 18],
  ];
  for (const [x, z, y] of space) {
    add(solids, x, y, z, 6, 0.45, 6, { oneway: true, color: 0x2c3e5a });
    add(solids, x, y + 0.15, z, 6.4, 0.12, 0.35, { oneway: true, color: 0x3ec6ff });
  }

  const pads: [number, number, number, number][] = [
    [0, 2.2, -18, 0],
    [14, 4.4, -8, 0],
    [-12, 6.2, 6, 1],
    [22, 0.4, 36, 1],
    [-24, 0.4, -36, 0],
    [48, 0.4, -18, 1],
    [-48, 0.4, 8, 0],
    [8, 10, -48, 0],
  ];
  for (const [x, y, z, turbo] of pads) {
    if (turbo) add(solids, x, y, z, 2.8, 0.3, 2.8, { turbo: 20, color: 0x7af0ff });
    else add(solids, x, y, z, 2.8, 0.3, 2.8, { bounce: 14, color: 0xc6e35a });
  }

  const crates: [number, number, number][] = [
    [18, 0.8, 22],
    [-16, 0.8, 26],
    [12, 2.2, 22],
    [30, 0.7, -8],
    [-34, 0.7, -6],
    [6, 0.7, 40],
    [-8, 0.7, -16],
    [42, 0.7, 18],
    [-46, 0.7, -22],
    [16, 0.7, -42],
  ];
  for (const [x, y, z] of crates) {
    add(solids, x, y, z, 1.6, 1.6, 1.6, { color: hash(x + z) > 0.72 ? 0xe7dcc4 : 0x9ccc65 });
  }

  for (let i = -2; i <= 2; i++) {
    const x = i * 36;
    const z = riverZ(x);
    add(solids, x, 0.7, z, 8, 1.2, 3.2, { color: 0xd9d0bc });
  }

  const cans: { x: number; y: number; z: number; kind: number }[] = [
    { x: 18, y: 2.1, z: -78, kind: 0 },
    { x: -20, y: 2.1, z: -82, kind: 0 },
    { x: 34, y: 2.1, z: -96, kind: 1 },
    { x: -8, y: 2.1, z: 52, kind: 2 },
    { x: 64, y: 2.1, z: 58, kind: 1 },
    { x: -70, y: 10.2, z: 36, kind: 2 },
    { x: 12, y: 10.2, z: -96, kind: 0 },
    { x: 88, y: 10.2, z: 52, kind: 1 },
  ];
  for (const c of cans) {
    add(solids, c.x, c.y, c.z, 2.4, 4.2, 2.4, { bounce: 13, color: 0x9ccc3a });
  }

  const meds: { x: number; y: number; z: number }[] = [];
  for (const b of bases) {
    meds.push({ x: b.x + 7, y: 8.15, z: b.z + 5 }, { x: b.x - 7, y: 8.15, z: b.z - 5 });
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x = Math.cos(a) * 26;
    const z = Math.sin(a) * 26;
    if (!inRiver(x, z)) meds.push({ x, y: 0.2, z });
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.2;
    const x = Math.cos(a) * 62;
    const z = Math.sin(a) * 62;
    if (!inRiver(x, z)) meds.push({ x, y: 0.2, z });
  }
  while (meds.length < 30) {
    meds.push({ x: -10 + meds.length, y: 0.2, z: 30 });
  }

  const flags = bases.map((b) => ({ team: b.team, x: b.x, y: 8, z: b.z }));
  const spawns = bases.flatMap((b) => {
    const yaw = Math.atan2(b.x, b.z);
    return [0, 1, 2, 3].map((k) => {
      const a = (k / 4) * Math.PI * 2;
      return { team: b.team, x: b.x + Math.cos(a) * 5, y: 8.05, z: b.z + Math.sin(a) * 5, yaw };
    });
  });

  const palms: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 18; i++) {
    const x = -70 + hash(i + 3) * 140;
    const z = -78 - hash(i + 9) * 30;
    if (Math.hypot(x, z + 88) < 18) continue;
    palms.push({ x, z, s: 0.9 + hash(i + 2) * 0.55 });
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.4;
    const r = 30 + hash(i + 21) * 22;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (inRiver(x, z) || Math.hypot(x, z) < 14) continue;
    palms.push({ x, z, s: 1.1 + hash(i + 8) * 0.55 });
  }
  const flowers: { x: number; z: number; c: number }[] = [];
  const grass: { x: number; z: number; s: number; c: number }[] = [];
  const rocks: { x: number; z: number; s: number; c: number }[] = [];
  const flowerCols = [0xff8ad0, 0xffe08a, 0xc6e35a, 0xffffff, 0xff6b6b];
  for (let i = 0; i < 140; i++) {
    const x = -110 + hash(i * 3.1) * 220;
    const z = -110 + hash(i * 5.7) * 220;
    if (inRiver(x, z)) continue;
    if (Math.hypot(x, z) < 12) continue;
    flowers.push({ x, z, c: flowerCols[i % flowerCols.length]! });
    if (i % 2 === 0) grass.push({ x: x + 0.6, z: z - 0.4, s: 0.4 + hash(i) * 0.5, c: z < -50 ? 0xc6e35a : 0x7dba5a });
  }
  for (let i = 0; i < 36; i++) {
    const x = -100 + hash(i + 40) * 200;
    const z = -100 + hash(i + 80) * 200;
    if (inRiver(x, z)) continue;
    const sand = z < -55;
    rocks.push({ x, z, s: 0.4 + hash(i + 12) * 0.9, c: sand ? 0xe6d3a8 : 0x8d8378 });
  }

  const streams: Stream[] = [
    {
      r: 2.4,
      pts: [
        { x: 0, y: 12, z: -68 },
        { x: 0, y: 14, z: -40 },
        { x: 2, y: 17, z: -16 },
        { x: 4, y: 20, z: -4 },
      ],
    },
    {
      r: 2.4,
      pts: [
        { x: -60, y: 12, z: 36 },
        { x: -36, y: 15, z: 22 },
        { x: -16, y: 18, z: 8 },
        { x: -4, y: 21, z: 2 },
      ],
    },
    {
      r: 2.4,
      pts: [
        { x: 60, y: 12, z: 36 },
        { x: 36, y: 15, z: 20 },
        { x: 16, y: 18, z: 8 },
        { x: 5, y: 21, z: 0 },
      ],
    },
  ];

  const buckets = new Map<string, number[]>();
  solids.forEach((s, i) => {
    const x0 = Math.floor(s.minX / CELL);
    const x1 = Math.floor(s.maxX / CELL);
    const z0 = Math.floor(s.minZ / CELL);
    const z1 = Math.floor(s.maxZ / CELL);
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const k = key(ix, iz);
        const arr = buckets.get(k);
        if (arr) arr.push(i);
        else buckets.set(k, [i]);
      }
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
    hill: { x: 0, y: 27.7, z: 0, r: 8.2 },
    qa: { x: 24, y: 0.05, z: -24, yaw: 0 },
    bases,
  };
}

export function querySolidIds(world: WorldData, x: number, z: number, rad: number): number[] {
  const x0 = Math.floor((x - rad) / CELL);
  const x1 = Math.floor((x + rad) / CELL);
  const z0 = Math.floor((z - rad) / CELL);
  const z1 = Math.floor((z + rad) / CELL);
  const out: number[] = [];
  const seen = new Set<number>();
  for (let ix = x0; ix <= x1; ix++) {
    for (let iz = z0; iz <= z1; iz++) {
      const arr = world.buckets.get(key(ix, iz));
      if (!arr) continue;
      for (const id of arr) {
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

export type RayHit = {
  t: number;
  nx: number;
  ny: number;
  nz: number;
  x: number;
  y: number;
  z: number;
  box: Solid | null;
  ground: boolean;
};

export function raySolids(
  world: WorldData,
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxT: number,
): RayHit | null {
  let best: RayHit | null = null;
  const ids = querySolidIds(world, ox + dx * maxT * 0.5, oz + dz * maxT * 0.5, maxT * 0.5 + 2);
  for (const id of ids) {
    const b = world.solids[id]!;
    const hit = rayAABB(ox, oy, oz, dx, dy, dz, b, maxT);
    if (hit && hit.t >= 0 && (!best || hit.t < best.t)) best = hit;
  }
  if (dy < 0 && oy > 0) {
    const t = (0 - oy) / dy;
    if (t > 0 && t < maxT && (!best || t < best.t)) {
      best = { t, nx: 0, ny: 1, nz: 0, x: ox + dx * t, y: 0, z: oz + dz * t, box: null, ground: true };
    }
  }
  return best;
}

export function rayAABB(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  b: Solid,
  maxT: number,
): RayHit | null {
  let tmin = 0;
  let tmax = maxT;
  let nx = 0,
    ny = 0,
    nz = 0;
  const slabs: [number, number, number, number, "x" | "y" | "z"][] = [
    [ox, dx, b.minX, b.maxX, "x"],
    [oy, dy, b.minY, b.maxY, "y"],
    [oz, dz, b.minZ, b.maxZ, "z"],
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
  return { t: tmin, nx, ny, nz, x: ox + dx * tmin, y: oy + dy * tmin, z: oz + dz * tmin, box: b, ground: false };
}
