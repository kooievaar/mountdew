import * as THREE from "three";

type RGB = [number, number, number];
type Ring = number[][];

const S = 0.64;
const GLASS: RGB = [0.12, 0.2, 0.26];
const TIRE: RGB = [0.06, 0.06, 0.07];
const RIM: RGB = [0.78, 0.8, 0.82];
const LAMP: RGB = [0.95, 0.97, 1];
const TAIL: RGB = [0.72, 0.1, 0.08];
const DARK: RGB = [0.08, 0.08, 0.09];

function tri(pos: number[], nor: number[], col: number[], a: number[], b: number[], c: number[], color: RGB) {
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
  for (const p of [a, b, c]) {
    pos.push(p[0], p[1], p[2]);
    nor.push(nx, ny, nz);
    col.push(color[0], color[1], color[2]);
  }
}

function quad(pos: number[], nor: number[], col: number[], a: number[], b: number[], c: number[], d: number[], color: RGB) {
  tri(pos, nor, col, a, b, c, color);
  tri(pos, nor, col, a, c, d, color);
}

function box(pos: number[], nor: number[], col: number[], cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, color: RGB) {
  const x0 = cx - hx;
  const x1 = cx + hx;
  const y0 = cy - hy;
  const y1 = cy + hy;
  const z0 = cz - hz;
  const z1 = cz + hz;
  quad(pos, nor, col, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], color);
  quad(pos, nor, col, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], color);
  quad(pos, nor, col, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], color);
  quad(pos, nor, col, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], color);
  quad(pos, nor, col, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], color);
  quad(pos, nor, col, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], color);
}

function join(pos: number[], nor: number[], col: number[], a: Ring, b: Ring, color: RGB) {
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    quad(pos, nor, col, a[i]!, a[j]!, b[j]!, b[i]!, color);
  }
}

function cap(pos: number[], nor: number[], col: number[], ring: Ring, color: RGB, nose: boolean) {
  const c = [0, 0, 0];
  for (const p of ring) {
    c[0] += p[0]!;
    c[1] += p[1]!;
    c[2] += p[2]!;
  }
  c[0] /= ring.length;
  c[1] /= ring.length;
  c[2] /= ring.length;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    if (nose) tri(pos, nor, col, c, ring[i]!, ring[j]!, color);
    else tri(pos, nor, col, c, ring[j]!, ring[i]!, color);
  }
}

function section(x: number, halfW: number, y0: number, belt: number, roof: number, roofW: number, sharp: boolean): Ring {
  const w = halfW;
  const rw = Math.min(roofW, w);
  if (sharp) {
    return [
      [x, y0, -w],
      [x, y0, w],
      [x, belt, w],
      [x, roof, rw],
      [x, roof, -rw],
      [x, belt, -w],
    ];
  }
  const mid = y0 + (belt - y0) * 0.35;
  const shoulder = belt + (roof - belt) * 0.45;
  return [
    [x, y0, -w * 0.35],
    [x, y0, w * 0.35],
    [x, mid, w * 0.98],
    [x, belt, w * 0.94],
    [x, shoulder, w * 0.72],
    [x, roof, rw],
    [x, roof, -rw],
    [x, shoulder, -w * 0.72],
    [x, belt, -w * 0.94],
    [x, mid, -w * 0.98],
  ];
}

function wheel(pos: number[], nor: number[], col: number[], cx: number, cy: number, cz: number, r: number, w: number) {
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const c0x = Math.cos(a0);
    const c0y = Math.sin(a0);
    const c1x = Math.cos(a1);
    const c1y = Math.sin(a1);
    quad(
      pos,
      nor,
      col,
      [cx + c0x * r, cy + c0y * r, cz + w],
      [cx + c1x * r, cy + c1y * r, cz + w],
      [cx + c1x * r, cy + c1y * r, cz - w],
      [cx + c0x * r, cy + c0y * r, cz - w],
      TIRE,
    );
    const rimR = r * 0.68;
    quad(
      pos,
      nor,
      col,
      [cx + c0x * r, cy + c0y * r, cz + w * 0.72],
      [cx + c0x * rimR, cy + c0y * rimR, cz + w * 0.55],
      [cx + c1x * rimR, cy + c1y * rimR, cz + w * 0.55],
      [cx + c1x * r, cy + c1y * r, cz + w * 0.72],
      RIM,
    );
    tri(pos, nor, col, [cx, cy, cz + w * 0.45], [cx + c0x * rimR * 0.45, cy + c0y * rimR * 0.45, cz + w * 0.45], [cx + c1x * rimR * 0.45, cy + c1y * rimR * 0.45, cz + w * 0.45], RIM);
  }
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    const cs = Math.cos(a) * r * 0.62;
    const sn = Math.sin(a) * r * 0.62;
    const ox = -Math.sin(a) * r * 0.05;
    const oy = Math.cos(a) * r * 0.05;
    quad(
      pos,
      nor,
      col,
      [cx + ox, cy + oy, cz + w * 0.5],
      [cx - ox, cy - oy, cz + w * 0.5],
      [cx + cs - ox, cy + sn - oy, cz + w * 0.5],
      [cx + cs + ox, cy + sn + oy, cz + w * 0.5],
      RIM,
    );
  }
}

function densify(stations: Station[]): Station[] {
  const out: Station[] = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i]!;
    const b = stations[i + 1]!;
    out.push(a);
    out.push({
      t: (a.t + b.t) / 2,
      w: (a.w + b.w) / 2,
      y0: (a.y0 + b.y0) / 2,
      belt: (a.belt + b.belt) / 2,
      roof: (a.roof + b.roof) / 2,
      rw: (a.rw + b.rw) / 2,
    });
  }
  out.push(stations[stations.length - 1]!);
  return out;
}

function arch(pos: number[], nor: number[], col: number[], cx: number, cy: number, cz: number, r: number, paint: RGB) {
  const n = 7;
  const lip: RGB = [paint[0] * 0.72, paint[1] * 0.72, paint[2] * 0.72];
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (0.15 + (i / n) * 0.7);
    const a1 = Math.PI * (0.15 + ((i + 1) / n) * 0.7);
    const x0 = Math.cos(a0) * r;
    const y0 = Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r;
    const y1 = Math.sin(a1) * r;
    quad(pos, nor, col, [cx + x0, cy + y0, cz], [cx + x1, cy + y1, cz], [cx + x1 * 0.82, cy + y1 * 0.82, cz], [cx + x0 * 0.82, cy + y0 * 0.82, cz], lip);
  }
}

type Station = { t: number; w: number; y0: number; belt: number; roof: number; rw: number };

function shell(opt: {
  length: number;
  width: number;
  stations: Station[];
  paint: RGB;
  sharp?: boolean;
  wheelbase: number;
  wheelR: number;
  mirrors?: boolean;
}) {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const L = opt.length * S;
  const halfL = L / 2;
  const halfW = (opt.width * S) / 2;
  const rings = densify(opt.stations).map((st) => {
    const x = -halfL + st.t * L;
    return section(x, halfW * st.w, st.y0 * S, st.belt * S, st.roof * S, halfW * st.rw, !!opt.sharp);
  });
  cap(pos, nor, col, rings[0]!, opt.paint, false);
  for (let i = 0; i < rings.length - 1; i++) join(pos, nor, col, rings[i]!, rings[i + 1]!, opt.paint);
  cap(pos, nor, col, rings[rings.length - 1]!, opt.paint, true);
  const glassFrom = Math.floor(rings.length * 0.28);
  const glassTo = Math.floor(rings.length * 0.62);
  for (let i = glassFrom; i < glassTo; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    const top = Math.floor(a.length / 2);
    quad(pos, nor, col, a[top - 1]!, a[top]!, b[top]!, b[top - 1]!, GLASS);
    quad(pos, nor, col, a[top]!, a[top + 1]!, b[top + 1]!, b[top]!, GLASS);
  }
  const wy = opt.wheelR * S * 0.92;
  const wr = opt.wheelR * S;
  const ww = 0.11 * S;
  const wx = (opt.wheelbase * S) / 2;
  const wz = halfW * 0.96;
  wheel(pos, nor, col, wx, wy, wz, wr, ww);
  wheel(pos, nor, col, wx, wy, -wz, wr, ww);
  wheel(pos, nor, col, -wx, wy, wz, wr, ww);
  wheel(pos, nor, col, -wx, wy, -wz, wr, ww);
  box(pos, nor, col, halfL * 0.9, 0.48 * S, halfW * 0.55, 0.05 * S, 0.07 * S, 0.16 * S, LAMP);
  box(pos, nor, col, halfL * 0.9, 0.48 * S, -halfW * 0.55, 0.05 * S, 0.07 * S, 0.16 * S, LAMP);
  box(pos, nor, col, -halfL * 0.94, 0.55 * S, 0, 0.04 * S, 0.05 * S, halfW * 0.7, TAIL);
  box(pos, nor, col, 0, 0.16 * S, 0, halfL * 0.62, 0.045 * S, halfW * 0.48, DARK);
  if (opt.mirrors !== false) {
    box(pos, nor, col, halfL * 0.12, 0.78 * S, halfW + 0.06 * S, 0.08 * S, 0.04 * S, 0.1 * S, DARK);
    box(pos, nor, col, halfL * 0.12, 0.78 * S, -(halfW + 0.06 * S), 0.08 * S, 0.04 * S, 0.1 * S, DARK);
  }
  const belt = 0.72 * S;
  const winTop = (opt.sharp ? 1.15 : 0.98) * S;
  const winRear = -halfL * 0.42;
  const winFront = halfL * 0.18;
  for (const side of [1, -1]) {
    const z = side * halfW * 0.9;
    quad(
      pos,
      nor,
      col,
      [winRear, belt, z],
      [winFront, belt * 0.92, z],
      [winFront - halfL * 0.08, winTop, z],
      [winRear + halfL * 0.06, winTop * 0.92, z],
      GLASS,
    );
    box(pos, nor, col, -halfL * 0.05, belt * 0.95, side * (halfW + 0.015 * S), 0.012 * S, 0.22 * S, 0.02 * S, [0.04, 0.04, 0.05]);
    box(pos, nor, col, halfL * 0.22, belt * 0.95, side * (halfW + 0.015 * S), 0.012 * S, 0.16 * S, 0.02 * S, [0.04, 0.04, 0.05]);
    box(pos, nor, col, halfL * 0.02, belt + 0.02 * S, side * (halfW + 0.02 * S), 0.05 * S, 0.012 * S, 0.012 * S, [0.2, 0.2, 0.22]);
  }
  box(pos, nor, col, halfL * 0.55, 0.58 * S, 0, halfL * 0.22, 0.012 * S, 0.015 * S, [0.15, 0.15, 0.16]);
  box(pos, nor, col, halfL * 0.97, 0.34 * S, 0, 0.03 * S, 0.05 * S, halfW * 0.72, DARK);
  box(pos, nor, col, -halfL * 0.97, 0.36 * S, 0, 0.03 * S, 0.05 * S, halfW * 0.7, DARK);
  box(pos, nor, col, halfL * 0.93, 0.5 * S, 0, 0.02 * S, 0.03 * S, 0.04 * S, [0.85, 0.1, 0.12]);
  box(pos, nor, col, 0, belt + 0.02 * S, halfW * 0.98, halfL * 0.72, 0.012 * S, 0.012 * S, DARK);
  box(pos, nor, col, 0, belt + 0.02 * S, -halfW * 0.98, halfL * 0.72, 0.012 * S, 0.012 * S, DARK);
  box(pos, nor, col, -halfL * 0.15, winTop + 0.02 * S, halfW * 0.42, 0.02 * S, 0.02 * S, halfL * 0.22, DARK);
  box(pos, nor, col, -halfL * 0.15, winTop + 0.02 * S, -halfW * 0.42, 0.02 * S, 0.02 * S, halfL * 0.22, DARK);
  arch(pos, nor, col, wx, wy, halfW * 0.86, wr * 1.18, opt.paint);
  arch(pos, nor, col, wx, wy, -halfW * 0.86, wr * 1.18, opt.paint);
  arch(pos, nor, col, -wx, wy, halfW * 0.86, wr * 1.18, opt.paint);
  arch(pos, nor, col, -wx, wy, -halfW * 0.86, wr * 1.18, opt.paint);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  return geo;
}

export const TESLA_NAMES = ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "Roadster"] as const;

export function teslaGeometries(): THREE.BufferGeometry[] {
  const fastback: Station[] = [
    { t: 0, w: 0.78, y0: 0.32, belt: 0.62, roof: 0.7, rw: 0.28 },
    { t: 0.08, w: 0.94, y0: 0.24, belt: 0.72, roof: 0.9, rw: 0.5 },
    { t: 0.2, w: 1, y0: 0.22, belt: 0.78, roof: 1.08, rw: 0.62 },
    { t: 0.36, w: 1, y0: 0.22, belt: 0.8, roof: 1.16, rw: 0.58 },
    { t: 0.5, w: 0.99, y0: 0.22, belt: 0.78, roof: 1.1, rw: 0.46 },
    { t: 0.64, w: 0.97, y0: 0.22, belt: 0.66, roof: 0.72, rw: 0.2 },
    { t: 0.82, w: 0.94, y0: 0.24, belt: 0.52, roof: 0.54, rw: 0.06 },
    { t: 1, w: 0.8, y0: 0.3, belt: 0.44, roof: 0.44, rw: 0.02 },
  ];
  const hatch: Station[] = [
    { t: 0, w: 0.86, y0: 0.34, belt: 0.78, roof: 1.05, rw: 0.42 },
    { t: 0.1, w: 0.98, y0: 0.26, belt: 0.9, roof: 1.32, rw: 0.7 },
    { t: 0.28, w: 1, y0: 0.24, belt: 0.96, roof: 1.48, rw: 0.72 },
    { t: 0.48, w: 1, y0: 0.24, belt: 0.94, roof: 1.46, rw: 0.66 },
    { t: 0.64, w: 0.98, y0: 0.24, belt: 0.78, roof: 0.9, rw: 0.28 },
    { t: 0.82, w: 0.94, y0: 0.26, belt: 0.58, roof: 0.58, rw: 0.08 },
    { t: 1, w: 0.82, y0: 0.32, belt: 0.48, roof: 0.48, rw: 0.02 },
  ];
  const long: Station[] = [
    { t: 0, w: 0.8, y0: 0.3, belt: 0.58, roof: 0.66, rw: 0.26 },
    { t: 0.12, w: 0.96, y0: 0.22, belt: 0.7, roof: 0.92, rw: 0.55 },
    { t: 0.3, w: 1, y0: 0.2, belt: 0.74, roof: 1.02, rw: 0.6 },
    { t: 0.48, w: 1, y0: 0.2, belt: 0.74, roof: 1.0, rw: 0.5 },
    { t: 0.66, w: 0.98, y0: 0.2, belt: 0.6, roof: 0.64, rw: 0.16 },
    { t: 0.84, w: 0.95, y0: 0.22, belt: 0.48, roof: 0.5, rw: 0.05 },
    { t: 1, w: 0.78, y0: 0.28, belt: 0.4, roof: 0.4, rw: 0.02 },
  ];
  const suv: Station[] = [
    { t: 0, w: 0.9, y0: 0.36, belt: 0.9, roof: 1.2, rw: 0.55 },
    { t: 0.14, w: 1, y0: 0.28, belt: 1.02, roof: 1.55, rw: 0.78 },
    { t: 0.36, w: 1, y0: 0.26, belt: 1.06, roof: 1.64, rw: 0.8 },
    { t: 0.55, w: 1, y0: 0.26, belt: 1.02, roof: 1.5, rw: 0.7 },
    { t: 0.72, w: 0.98, y0: 0.26, belt: 0.8, roof: 0.9, rw: 0.3 },
    { t: 0.88, w: 0.94, y0: 0.28, belt: 0.6, roof: 0.62, rw: 0.08 },
    { t: 1, w: 0.84, y0: 0.34, belt: 0.5, roof: 0.5, rw: 0.02 },
  ];
  const wedge: Station[] = [
    { t: 0, w: 0.96, y0: 0.48, belt: 1.05, roof: 1.7, rw: 0.9 },
    { t: 0.18, w: 1, y0: 0.42, belt: 1.15, roof: 1.72, rw: 0.96 },
    { t: 0.4, w: 1, y0: 0.4, belt: 1.05, roof: 1.42, rw: 0.94 },
    { t: 0.62, w: 0.98, y0: 0.38, belt: 0.82, roof: 1.02, rw: 0.9 },
    { t: 0.82, w: 0.94, y0: 0.38, belt: 0.62, roof: 0.7, rw: 0.7 },
    { t: 1, w: 0.86, y0: 0.4, belt: 0.46, roof: 0.46, rw: 0.4 },
  ];
  const sport: Station[] = [
    { t: 0, w: 0.84, y0: 0.24, belt: 0.42, roof: 0.48, rw: 0.22 },
    { t: 0.16, w: 0.98, y0: 0.18, belt: 0.5, roof: 0.7, rw: 0.42 },
    { t: 0.32, w: 1, y0: 0.16, belt: 0.52, roof: 0.74, rw: 0.36 },
    { t: 0.46, w: 0.98, y0: 0.16, belt: 0.42, roof: 0.5, rw: 0.14 },
    { t: 0.7, w: 0.96, y0: 0.16, belt: 0.34, roof: 0.36, rw: 0.04 },
    { t: 1, w: 0.8, y0: 0.2, belt: 0.3, roof: 0.3, rw: 0.02 },
  ];
  return [
    shell({ length: 4.72, width: 1.85, stations: fastback, paint: [0.9, 0.91, 0.93], wheelbase: 2.88, wheelR: 0.34 }),
    shell({ length: 4.79, width: 1.92, stations: hatch, paint: [0.18, 0.42, 0.82], wheelbase: 2.89, wheelR: 0.36 }),
    shell({ length: 4.97, width: 1.96, stations: long, paint: [0.07, 0.07, 0.09], wheelbase: 2.96, wheelR: 0.34 }),
    shell({ length: 5.04, width: 2.0, stations: suv, paint: [0.8, 0.82, 0.84], wheelbase: 2.96, wheelR: 0.37 }),
    shell({ length: 5.68, width: 2.03, stations: wedge, paint: [0.7, 0.72, 0.74], sharp: true, wheelbase: 3.63, wheelR: 0.42, mirrors: false }),
    shell({ length: 4.1, width: 1.9, stations: sport, paint: [0.75, 0.08, 0.1], wheelbase: 2.4, wheelR: 0.33 }),
  ];
}
