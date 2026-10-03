import * as THREE from "three";

export type FigureSpec = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  dt: number;
  speed: number;
  vy: number;
  grounded: boolean;
  climb: boolean;
  dash: boolean;
  down: boolean;
  fall: number;
  bounce: boolean;
  sheep: boolean;
  scale: number;
  squash: number;
  skin: number;
  hair: number;
  cloth: number;
  hairLen: number;
  skirt: number;
  wings: number;
  wingColor: number;
  halo: boolean;
  gun: boolean;
  id: number;
  mood: string;
  mouth: number;
  veins: number;
  look: number;
  angry: boolean;
  sunX: number;
  sunY: number;
  sunZ: number;
  lean: number;
  bank: number;
};

const NAMES = ["hips", "spine", "chest", "neck", "head", "armL", "foreL", "handL", "armR", "foreR", "handR", "thighL", "shinL", "footL", "thighR", "shinR", "footR", "hair", "skirt"] as const;
const NB = NAMES.length;

const grad = (() => {
  const data = new Uint8Array([48, 42, 38, 255, 96, 90, 84, 255, 168, 164, 156, 255, 244, 242, 236, 255]);
  const tex = new THREE.DataTexture(data, 4, 1);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();

const solidMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 22, specular: new THREE.Color(0x666666) });
const pencilMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad });

function bone(): THREE.Bone {
  return new THREE.Bone();
}

function idx(name: (typeof NAMES)[number]) {
  return NAMES.indexOf(name);
}

type Built = { geo: THREE.BufferGeometry; bones: () => THREE.Bone[] };

function buildTemplate(mutant: boolean): Built {
  const pos: number[] = [];
  const region: number[] = [];
  const skinI: number[] = [];
  const skinW: number[] = [];
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
  const list = [hips, spine, chest, neck, head, armL, foreL, handL, armR, foreR, handR, thighL, shinL, footL, thighR, shinR, footR, hair, skirt];
  hips.position.set(0, 0.96, 0);
  spine.position.set(0, 0.16, mutant ? 0.06 : 0.02);
  chest.position.set(0, 0.18, 0);
  neck.position.set(0, 0.16, mutant ? -0.04 : -0.02);
  head.position.set(0, mutant ? 0.18 : 0.14, 0);
  hair.position.set(0, 0.08, 0.02);
  armL.position.set(mutant ? 0.26 : 0.2, 0.08, 0);
  foreL.position.set(mutant ? 0.32 : 0.26, -0.02, 0);
  handL.position.set(0.2, -0.02, 0);
  armR.position.set(mutant ? -0.26 : -0.2, 0.08, 0);
  foreR.position.set(mutant ? -0.32 : -0.26, -0.02, 0);
  handR.position.set(-0.2, -0.02, 0);
  thighL.position.set(0.1, -0.06, 0);
  shinL.position.set(0, -0.42, 0.02);
  footL.position.set(0, -0.4, 0);
  thighR.position.set(-0.1, -0.06, 0);
  shinR.position.set(0, -0.42, 0.02);
  footR.position.set(0, -0.4, 0);
  skirt.position.set(0, -0.02, 0);
  const dummy = new THREE.Object3D();
  dummy.add(hips);
  dummy.updateMatrixWorld(true);
  const at = (b: THREE.Bone) => {
    const v = new THREE.Vector3();
    b.getWorldPosition(v);
    return v;
  };
  const tube = (a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, rings: number, radial: number, boneId: number, reg: number, parent: number) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length() || 1;
    dir.multiplyScalar(1 / len);
    const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(dir, up).normalize();
    const lift = new THREE.Vector3().crossVectors(side, dir).normalize();
    const ringsV: number[][] = [];
    for (let i = 0; i <= rings; i++) {
      const t = i / rings;
      const c = a.clone().lerp(b, t);
      const rad = r0 + (r1 - r0) * t;
      const ring: number[] = [];
      const end = i === 0 || i === rings;
      const wParent = end && i === 0 ? 0.35 : 0;
      for (let k = 0; k < radial; k++) {
        const ang = (k / radial) * Math.PI * 2;
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
    for (let i = 0; i < rings; i++) {
      for (let k = 0; k < radialN; k++) {
        const k2 = (k + 1) % radialN;
        const a0 = ringsV[i]![k]!;
        const a1 = ringsV[i]![k2]!;
        const b0 = ringsV[i + 1]![k]!;
        const b1 = ringsV[i + 1]![k2]!;
        quad(a0, a1, b1, b0);
      }
    }
  };
  const index: number[] = [];
  function quad(a: number, b: number, c: number, d: number) {
    index.push(a, b, c, a, c, d);
  }
  function sphere(center: THREE.Vector3, rx: number, ry: number, rz: number, seg: number, rings: number, boneId: number, reg: number) {
    const rows: number[][] = [];
    for (let i = 0; i <= rings; i++) {
      const v = (i / rings) * Math.PI;
      const row: number[] = [];
      for (let k = 0; k < seg; k++) {
        const u = (k / seg) * Math.PI * 2;
        const p = new THREE.Vector3(Math.sin(v) * Math.cos(u) * rx, Math.cos(v) * ry, Math.sin(v) * Math.sin(u) * rz).add(center);
        row.push(pos.length / 3);
        pos.push(p.x, p.y, p.z);
        region.push(reg);
        skinI.push(boneId, 0, 0, 0);
        skinW.push(1, 0, 0, 0);
      }
      rows.push(row);
    }
    for (let i = 0; i < rings; i++) {
      for (let k = 0; k < seg; k++) {
        const k2 = (k + 1) % seg;
        quad(rows[i]![k]!, rows[i]![k2]!, rows[i + 1]![k2]!, rows[i + 1]![k]!);
      }
    }
  }
  const headP = at(head);
  const chestP = at(chest);
  const hipsP = at(hips);
  const neckP = at(neck);
  const spineP = at(spine);
  tube(hipsP, spineP, mutant ? 0.16 : 0.13, 0.11, 4, 10, idx("hips"), 1, idx("hips"));
  tube(spineP, chestP, 0.11, mutant ? 0.2 : 0.16, 4, 10, idx("spine"), 1, idx("hips"));
  tube(chestP, neckP, mutant ? 0.18 : 0.15, 0.07, 3, 10, idx("chest"), 1, idx("spine"));
  tube(neckP, headP, 0.055, 0.06, 2, 8, idx("neck"), 0, idx("chest"));
  sphere(headP, mutant ? 0.2 : 0.15, mutant ? 0.18 : 0.16, mutant ? 0.18 : 0.15, 16, 10, idx("head"), 0);
  const eyeY = headP.y + 0.02;
  const eyeZ = headP.z - (mutant ? 0.16 : 0.12);
  sphere(new THREE.Vector3(headP.x - 0.05, eyeY, eyeZ), 0.028, 0.02, 0.02, 6, 4, idx("head"), 3);
  sphere(new THREE.Vector3(headP.x + 0.05, eyeY, eyeZ), 0.028, 0.02, 0.02, 6, 4, idx("head"), 3);
  sphere(new THREE.Vector3(headP.x - 0.05, eyeY, eyeZ - 0.018), 0.012, 0.012, 0.01, 5, 3, idx("head"), 4);
  sphere(new THREE.Vector3(headP.x + 0.05, eyeY, eyeZ - 0.018), 0.012, 0.012, 0.01, 5, 3, idx("head"), 4);
  sphere(new THREE.Vector3(headP.x, headP.y - 0.02, eyeZ + 0.01), 0.03, 0.04, 0.04, 6, 4, idx("head"), 0);
  sphere(headP.clone().add(new THREE.Vector3(0, 0.08, 0.02)), mutant ? 0.12 : 0.16, mutant ? 0.08 : 0.12, 0.16, 10, 6, idx("hair"), 2);
  sphere(headP.clone().add(new THREE.Vector3(0, 0.02, -0.08)), 0.14, 0.06, 0.08, 8, 4, idx("hair"), 2);
  const hairTail = headP.clone().add(new THREE.Vector3(0, -0.05, 0.16));
  tube(headP.clone().add(new THREE.Vector3(0, 0.05, 0.04)), hairTail, 0.08, 0.03, 4, 8, idx("hair"), 2, idx("head"));
  const armPairs: [THREE.Bone, THREE.Bone, THREE.Bone, string, string, string][] = [
    [armL, foreL, handL, "armL", "foreL", "handL"],
    [armR, foreR, handR, "armR", "foreR", "handR"],
  ];
  for (const [up, mid, tip, aName, bName, cName] of armPairs) {
    tube(at(up), at(mid), mutant ? 0.07 : 0.05, 0.04, 5, 10, idx(aName as (typeof NAMES)[number]), 0, idx("chest"));
    tube(at(mid), at(tip), 0.042, 0.032, 5, 10, idx(bName as (typeof NAMES)[number]), 0, idx(aName as (typeof NAMES)[number]));
    sphere(at(tip), 0.045, 0.04, 0.04, 6, 4, idx(cName as (typeof NAMES)[number]), 0);
    const tipP = at(tip);
    const sign = tipP.x >= 0 ? 1 : -1;
    for (let f = 0; f < 4; f++) {
      const root = tipP.clone().add(new THREE.Vector3(sign * 0.02, -0.02, -0.03 + f * 0.018));
      const end = root.clone().add(new THREE.Vector3(sign * (mutant && f < 3 ? 0.16 : 0.07), mutant ? -0.04 : -0.01, 0));
      tube(root, end, mutant && f < 3 ? 0.018 : 0.012, 0.006, 2, 5, idx(cName as (typeof NAMES)[number]), mutant && f < 3 ? 5 : 0, idx(bName as (typeof NAMES)[number]));
    }
  }
  const legPairs: [THREE.Bone, THREE.Bone, THREE.Bone, string, string, string][] = [
    [thighL, shinL, footL, "thighL", "shinL", "footL"],
    [thighR, shinR, footR, "thighR", "shinR", "footR"],
  ];
  for (const [up, mid, tip, aName, bName, cName] of legPairs) {
    tube(at(up), at(mid), 0.08, 0.055, 5, 10, idx(aName as (typeof NAMES)[number]), 1, idx("hips"));
    tube(at(mid), at(tip), 0.055, 0.04, 5, 10, idx(bName as (typeof NAMES)[number]), 0, idx(aName as (typeof NAMES)[number]));
    const ankle = at(tip);
    const toe = ankle.clone().add(new THREE.Vector3(0, -0.02, -0.16));
    tube(ankle, toe, 0.045, 0.03, 3, 6, idx(cName as (typeof NAMES)[number]), 5, idx(bName as (typeof NAMES)[number]));
  }
  const skirtTop = hipsP.clone();
  const skirtHem = hipsP.clone().add(new THREE.Vector3(0, -0.28, 0));
  tube(skirtTop, skirtHem, 0.16, 0.26, 3, 10, idx("skirt"), 1, idx("hips"));
  dummy.remove(hips);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.setAttribute("region", new THREE.Float32BufferAttribute(region, 1));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinI, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinW, 4));
  const colors = new Float32Array((pos.length / 3) * 3);
  colors.fill(1);
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return {
    geo,
    bones() {
      return list;
    },
  };
}

const pilotTemplate = buildTemplate(false);
const mutantTemplate = buildTemplate(true);

function paint(geo: THREE.BufferGeometry, skin: number, hair: number, cloth: number) {
  const region = geo.getAttribute("region") as THREE.BufferAttribute;
  const color = geo.getAttribute("color") as THREE.BufferAttribute;
  const s = new THREE.Color(skin);
  const h = new THREE.Color(hair);
  const c = new THREE.Color(cloth);
  const shoe = new THREE.Color(0x24180f);
  const white = new THREE.Color(0xf4f7ff);
  const pupil = new THREE.Color(0x140c0a);
  for (let i = 0; i < region.count; i++) {
    const r = region.getX(i);
    const col = r < 0.5 ? s : r < 1.5 ? c : r < 2.5 ? h : r < 3.5 ? white : r < 4.5 ? pupil : shoe;
    color.setXYZ(i, col.r, col.g, col.b);
  }
  color.needsUpdate = true;
}

function addBone(name: string, local: THREE.Vector3, parent: THREE.Bone | null) {
  const b = new THREE.Bone();
  b.name = name;
  b.position.copy(local);
  parent?.add(b);
  return b;
}

function freshBones(mutant: boolean) {
  const hips = addBone("hips", new THREE.Vector3(0, 0.96, 0), null);
  const spine = addBone("spine", new THREE.Vector3(0, 0.16, mutant ? 0.06 : 0.02), hips);
  const chest = addBone("chest", new THREE.Vector3(0, 0.18, 0), spine);
  const neck = addBone("neck", new THREE.Vector3(0, 0.16, mutant ? -0.04 : -0.02), chest);
  const head = addBone("head", new THREE.Vector3(0, mutant ? 0.18 : 0.14, 0), neck);
  const hair = addBone("hair", new THREE.Vector3(0, 0.08, 0.02), head);
  const armL = addBone("armL", new THREE.Vector3(mutant ? 0.26 : 0.2, 0.08, 0), chest);
  const foreL = addBone("foreL", new THREE.Vector3(mutant ? 0.32 : 0.26, -0.02, 0), armL);
  const handL = addBone("handL", new THREE.Vector3(0.2, -0.02, 0), foreL);
  const armR = addBone("armR", new THREE.Vector3(mutant ? -0.26 : -0.2, 0.08, 0), chest);
  const foreR = addBone("foreR", new THREE.Vector3(mutant ? -0.32 : -0.26, -0.02, 0), armR);
  const handR = addBone("handR", new THREE.Vector3(-0.2, -0.02, 0), foreR);
  const thighL = addBone("thighL", new THREE.Vector3(0.1, -0.06, 0), hips);
  const shinL = addBone("shinL", new THREE.Vector3(0, -0.42, 0.02), thighL);
  const footL = addBone("footL", new THREE.Vector3(0, -0.4, 0), shinL);
  const thighR = addBone("thighR", new THREE.Vector3(-0.1, -0.06, 0), hips);
  const shinR = addBone("shinR", new THREE.Vector3(0, -0.42, 0.02), thighR);
  const footR = addBone("footR", new THREE.Vector3(0, -0.4, 0), shinR);
  const skirt = addBone("skirt", new THREE.Vector3(0, -0.02, 0), hips);
  const ordered = [hips, spine, chest, neck, head, armL, foreL, handL, armR, foreR, handR, thighL, shinL, footL, thighR, shinR, footR, hair, skirt];
  return { hips, ordered, head, hair, chest, handR, skirt };
}

function pencilShadow() {
  const pos: number[] = [];
  for (let s = 0; s < 9; s++) {
    const a0 = (s / 9) * Math.PI * 2;
    const a1 = a0 + 0.55;
    const x0 = Math.cos(a0) * 0.34;
    const z0 = Math.sin(a0) * 0.2;
    const x1 = Math.cos(a1) * 0.46;
    const z1 = Math.sin(a1) * 0.26;
    const o = 0.012;
    pos.push(x0, 0, z0, x1, 0, z1, x0 + o, 0.001, z0 + o);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ color: 0x1c140e, transparent: true, opacity: 0.45, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = 0;
  mesh.renderOrder = 2;
  return mesh;
}

function gunMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.42), new THREE.MeshLambertMaterial({ color: 0x8ea0b8 }));
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.06), new THREE.MeshLambertMaterial({ color: 0x2a241c }));
  grip.position.set(0, -0.08, 0.08);
  g.add(body, grip);
  return g;
}

export type FigurePool = {
  place(i: number, spec: FigureSpec): void;
  hide(i: number): void;
  hideFrom(n: number): void;
  setUltra(on: boolean): void;
};

export function createFigures(scene: THREE.Scene, count: number, mutant: boolean): FigurePool {
  const template = mutant ? mutantTemplate : pilotTemplate;
  const slots = Array.from({ length: count }, () => {
    const rig = freshBones(mutant);
    const geo = template.geo.clone();
    const mesh = new THREE.SkinnedMesh(geo, solidMat as THREE.Material);
    mesh.add(rig.hips);
    mesh.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(rig.ordered));
    mesh.frustumCulled = false;
    mesh.visible = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.28), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.28), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    wingL.position.set(0.22, 0.05, 0.02);
    wingR.position.set(-0.22, 0.05, 0.02);
    rig.chest.add(wingL, wingR);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 14), new THREE.MeshLambertMaterial({ color: 0xffe98a }));
    halo.position.set(0, 0.22, 0);
    halo.rotation.x = Math.PI / 2.4;
    rig.head.add(halo);
    const gun = gunMesh();
    gun.position.set(0, -0.06, -0.16);
    rig.handR.add(gun);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x4a1020 });
    const mouthBit = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), mouthMat);
    const mouthOpen = new THREE.Mesh(new THREE.CircleGeometry(0.055, 8), mouthMat);
    mouthBit.position.set(0, -0.02, 0.11);
    mouthOpen.position.set(0, -0.035, 0.115);
    mouthOpen.scale.set(1, 1.35, 1);
    rig.head.add(mouthBit, mouthOpen);
    const veins = [0, 1, 2, 3].map((i) => {
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.1, 0.008), new THREE.MeshBasicMaterial({ color: 0x8a1830 }));
      vein.position.set((i - 1.5) * 0.028, 0.05, 0.1);
      vein.rotation.z = (i - 1.5) * 0.45;
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
      leanR: 0,
    };
  });
  let ultra = false;
  const target = new Float32Array(NB * 3);
  const eul = new THREE.Euler();

  function add(name: (typeof NAMES)[number], x: number, y: number, z: number, w: number) {
    const i = idx(name) * 3;
    target[i]! += x * w;
    target[i + 1]! += y * w;
    target[i + 2]! += z * w;
  }

  function blend(spec: FigureSpec, phase: number) {
    target.fill(0);
    const sp = spec.speed;
    let idle = spec.grounded ? 1 : 0;
    const run = spec.grounded ? THREE.MathUtils.clamp((sp - 3) / 5, 0, 1) : 0;
    const walk = spec.grounded ? THREE.MathUtils.clamp(sp / 3.2, 0, 1) * (1 - run) : 0;
    idle = spec.grounded ? Math.max(0, 1 - Math.max(walk, run)) : 0;
    const jump = !spec.grounded && spec.vy > 0.6 ? 1 : 0;
    const air = !spec.grounded && spec.vy <= 0.6 ? 1 : 0;
    const wall = spec.climb ? 1 : 0;
    const dash = spec.dash ? 1 : 0;
    const down = spec.down ? THREE.MathUtils.clamp(spec.fall, 0, 1) : 0;
    const land = spec.bounce && spec.grounded ? 0.85 : 0;
    const armDropL = -1.25;
    const armDropR = 1.25;
    add("armL", 0, 0, armDropL, 1);
    add("armR", 0, 0, armDropR, 1);
    add("foreL", 0, 0, -0.45, 1);
    add("foreR", 0, 0, 0.45, 1);
    add("chest", Math.sin(phase * 0.5) * 0.04, 0, 0, idle);
    add("hair", Math.sin(phase) * 0.12, 0, 0, 1);
    const s = Math.sin(phase);
    add("thighL", s * (0.7 + run * 0.45), 0, 0.05, Math.max(walk, run));
    add("thighR", -s * (0.7 + run * 0.45), 0, -0.05, Math.max(walk, run));
    add("shinL", Math.max(0, -s) * (0.9 + run * 0.45), 0, 0, Math.max(walk, run));
    add("shinR", Math.max(0, s) * (0.9 + run * 0.45), 0, 0, Math.max(walk, run));
    add("armL", 0, s * (0.45 + run * 0.4), 0, Math.max(walk, run));
    add("armR", 0, -s * (0.45 + run * 0.4), 0, Math.max(walk, run));
    add("hips", 0, s * 0.1, 0, Math.max(walk, run));
    add("chest", -s * 0.08, 0, 0, Math.max(walk, run));
    add("spine", 0.35, 0, 0, jump);
    add("thighL", 0.7, 0, 0, jump);
    add("thighR", 0.7, 0, 0, jump);
    add("shinL", 1.15, 0, 0, jump);
    add("shinR", 1.15, 0, 0, jump);
    add("armL", 0, 0, 1.5, jump);
    add("armR", 0, 0, -1.5, jump);
    add("chest", 0.25, 0, 0, air);
    add("armL", 0, 0, 0.7, air);
    add("armR", 0, 0, -0.7, air);
    add("thighL", 0.25, 0, 0.12, air);
    add("thighR", 0.25, 0, -0.12, air);
    add("hair", 0.5, 0, 0, air + jump);
    add("spine", 0.2, 0, 0.45, wall);
    add("armL", 0, 0, 1.3, wall);
    add("thighL", 0.9, 0, 0, wall);
    add("shinL", 0.4, 0, 0, wall);
    add("spine", 0.65, 0, 0, dash);
    add("armL", 0, -0.6, 0, dash);
    add("armR", 0, 0.6, 0, dash);
    add("thighL", 0.55, 0, 0, land);
    add("thighR", 0.55, 0, 0, land);
    add("shinL", 1.05, 0, 0, land);
    add("shinR", 1.05, 0, 0, land);
    add("chest", 0.4, 0, 0, land);
    add("spine", 1.15, 0, 0, down);
    add("head", 0.4, 0, 0, down);
    add("armL", 0.4, 0.3, 0.4, down);
    add("armR", 0.4, -0.3, -0.4, down);
    add("thighL", 0.35, 0, 0.2, down);
    add("thighR", 0.2, 0, -0.2, down);
    add("spine", -spec.lean * 0.45, 0, -spec.bank * 0.55, 1);
    add("chest", -spec.lean * 0.2, 0, -spec.bank * 0.25, 1);
    add("head", -spec.lean * 0.35, 0, -spec.bank * 0.15, 1);
    if (spec.mood === "wave") {
      add("armR", -0.15, 0, -2.55, 1);
      add("foreR", Math.sin(phase * 7) * 0.55, 0, -0.35, 1);
      add("head", 0, spec.look, 0, 1);
    } else if (spec.mood === "angry") {
      add("armR", -0.05, 0, -2.35, 1);
      add("foreR", 0, 0, -1.25, 1);
      add("head", 0.18, spec.look, 0.22, 1);
      add("chest", 0.12, 0, 0, 1);
    } else if (spec.mood === "depressed" || spec.mood === "cry") {
      add("spine", 0.55, 0, 0, 1);
      add("head", 0.7, spec.look * 0.25, 0, 1);
      add("armL", 0.4, 0.1, 0.25, 1);
      add("armR", 0.4, -0.1, -0.25, 1);
    } else if (spec.mood === "talk" || spec.mood === "exclaim" || spec.mood === "happy") {
      add("head", 0, spec.look, 0, 1);
      add("chest", -0.08, 0, 0, 1);
    } else if (spec.look) {
      add("head", 0, spec.look, 0, 1);
      add("neck", 0, spec.look * 0.4, 0, 1);
    }
    if (mutant) add("spine", 0.35, 0, 0, 1);
    void idle;
  }

  return {
    setUltra(on: boolean) {
      ultra = on;
      for (const slot of slots) slot.mesh.material = on ? pencilMat : solidMat;
    },
    hide(i: number) {
      const slot = slots[i];
      if (!slot) return;
      slot.mesh.visible = false;
      slot.shadow.visible = false;
    },
    hideFrom(n: number) {
      for (let i = n; i < slots.length; i++) {
        slots[i]!.mesh.visible = false;
        slots[i]!.shadow.visible = false;
      }
    },
    place(i: number, spec: FigureSpec) {
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
        paint(slot.mesh.geometry, spec.sheep ? 0xfff6ea : spec.skin, spec.sheep ? 0xfff6ea : spec.hair, spec.sheep ? 0xfff6ea : spec.cloth);
      }
      blend({ ...spec, speed }, slot.phase);
      const ragdoll = ultra && (spec.down || spec.vy < -2.2 || spec.bounce || spec.fall > 0.08);
      if (ragdoll && !slot.rag) {
        for (let b = 0; b < NB; b++) {
          slot.vel[b * 3] = (Math.random() - 0.5) * 3 + spec.vy * 0.15;
          slot.vel[b * 3 + 1] = (Math.random() - 0.5) * 2;
          slot.vel[b * 3 + 2] = (Math.random() - 0.5) * 2;
        }
      }
      slot.rag = ragdoll;
      const dt = Math.min(0.05, spec.dt);
      if (ragdoll) {
        for (let b = 0; b < NB; b++) {
          if (!spec.grounded) slot.vel[b * 3]! += dt * (b > 10 ? 1.6 : 0.25);
          if (spec.bounce) slot.vel[b * 3]! += (Math.random() - 0.5) * 5;
          slot.vel[b * 3]! *= 0.9;
          slot.vel[b * 3 + 1]! *= 0.88;
          slot.vel[b * 3 + 2]! *= 0.88;
          slot.cur[b * 3]! += slot.vel[b * 3]! * dt;
          slot.cur[b * 3 + 1]! += slot.vel[b * 3 + 1]! * dt;
          slot.cur[b * 3 + 2]! += slot.vel[b * 3 + 2]! * dt;
          const spring = spec.down ? 2.2 : 5;
          slot.vel[b * 3]! += (target[b * 3]! - slot.cur[b * 3]!) * spring * dt;
          slot.vel[b * 3 + 1]! += (target[b * 3 + 1]! - slot.cur[b * 3 + 1]!) * spring * dt;
          slot.vel[b * 3 + 2]! += (target[b * 3 + 2]! - slot.cur[b * 3 + 2]!) * spring * dt;
          slot.cur[b * 3] = THREE.MathUtils.clamp(slot.cur[b * 3]!, -2.4, 2.4);
          slot.cur[b * 3 + 2] = THREE.MathUtils.clamp(slot.cur[b * 3 + 2]!, -2.4, 2.4);
        }
      } else {
        const t = 1 - Math.exp(-14 * dt);
        for (let k = 0; k < target.length; k++) slot.cur[k] = slot.cur[k]! + (target[k]! - slot.cur[k]!) * t;
        slot.vel.fill(0);
      }
      for (let b = 0; b < NB; b++) {
        eul.set(slot.cur[b * 3]!, slot.cur[b * 3 + 1]!, slot.cur[b * 3 + 2]!);
        slot.rig.ordered[b]!.rotation.copy(eul);
      }
      slot.rig.hair.scale.set(1, THREE.MathUtils.clamp(spec.hairLen, 0.25, 1.8), 1);
      const showSkirt = spec.skirt > 0.2 && !spec.sheep;
      slot.rig.skirt.scale.setScalar(showSkirt ? 1 : 0.001);
      slot.rig.head.scale.setScalar(spec.sheep ? 1.28 : mutant ? 1.08 : 1);
      const flap = Math.sin(performance.now() / 160 + i) * 0.4;
      slot.wingL.visible = spec.wings > 0 && !spec.sheep;
      slot.wingR.visible = slot.wingL.visible;
      slot.wingL.rotation.z = 0.4 + flap;
      slot.wingR.rotation.z = -0.4 - flap;
      (slot.wingL.material as THREE.MeshLambertMaterial).color.setHex(spec.wingColor);
      (slot.wingR.material as THREE.MeshLambertMaterial).color.setHex(spec.wingColor);
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
      const turnLean = THREE.MathUtils.clamp((-turn / Math.max(0.008, spec.dt)) * 0.045, -0.4, 0.4);
      const k = 1 - Math.exp(-9 * Math.min(0.05, spec.dt));
      slot.leanP += (spec.lean - slot.leanP) * k;
      slot.leanR += (spec.bank + turnLean - slot.leanR) * k;
      const bob = spec.grounded && !spec.down ? Math.abs(Math.sin(slot.phase * 2)) * 0.045 * THREE.MathUtils.clamp(speed / 6, 0, 1) : 0;
      slot.mesh.position.set(spec.x, spec.y + bob, spec.z);
      slot.mesh.rotation.order = "YXZ";
      const flop = !ultra && spec.down ? spec.fall * 1.15 : 0;
      slot.mesh.rotation.set(flop + slot.leanP, spec.yaw, slot.leanR);
      slot.mesh.scale.set(spec.scale, spec.scale * spec.squash, spec.scale);
      slot.mesh.castShadow = ultra;
      slot.mesh.updateMatrixWorld(true);
      slot.shadow.visible = !spec.down;
      if (ultra) {
        const lit = Math.max(0.05, spec.sunY);
        const len = THREE.MathUtils.clamp(0.42 / lit, 0.35, 3.4);
        slot.shadow.position.set(spec.x - spec.sunX * len, spec.y + 0.035, spec.z - spec.sunZ * len);
        slot.shadow.scale.set(0.45 + len * 0.22, 1, 0.32 + len * 0.5);
        slot.shadow.rotation.y = Math.atan2(spec.sunX, spec.sunZ);
        (slot.shadow.material as THREE.MeshBasicMaterial).opacity = 0.45;
      } else {
        slot.shadow.position.set(spec.x, spec.y + 0.03, spec.z);
        slot.shadow.scale.set(0.7, 1, 0.45);
        slot.shadow.rotation.y = spec.yaw;
        (slot.shadow.material as THREE.MeshBasicMaterial).opacity = 0.28;
      }
    },
  };
}
