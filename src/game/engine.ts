import * as THREE from "three";
import { netPulse, sendRelayAnnounce } from "@/game/relay-client";
import { createAudio } from "./audio";
import {
  BOT_NAMES,
  BUILD_ACTIONS,
  CHAR_BY_ID,
  CHARACTERS,
  LINES,
  TEAMS,
  WEAPON_BY_ID,
  rankForLevel,
  xpToLevel,
  type CharDef,
  type TeamId,
} from "./content";
import { buildWorld, inRiver, querySolidIds, rayAABB, raySolids, type RayHit, type Solid, type WorldData } from "./world";
import { bakeTextures } from "./textures";

export type Quality = "low" | "medium" | "high";

export type HudState = {
  phase: "attract" | "play";
  locked: boolean;
  hp: number;
  maxHp: number;
  weapon: string;
  action: string;
  cd: number;
  teams: { name: string; color: string; caps: number; hill: number }[];
  hillText: string;
  boost: boolean;
  feed: { id: number; text: string; at: number }[];
  log: { text: string }[];
  banner: string;
  rows: { team: number; name: string; lvl: number; rank: string; k: number; d: number; xp: number; me: boolean }[];
  time: string;
  date: string;
  season: string;
  weather: string;
  downed: boolean;
  graphics: Quality;
  sens: number;
  volume: number;
  now: number;
  build: string;
  score: boolean;
  map: boolean;
  console: boolean;
  menu: boolean;
  spectate: boolean;
};

type TouchState = {
  x: number;
  y: number;
  lookX: number;
  lookY: number;
  fire: boolean;
  jump: boolean;
  act: boolean;
  cycle: boolean;
  dash: boolean;
};

type Actor = {
  id: number;
  name: string;
  team: TeamId;
  charId: string;
  bot: boolean;
  remote: boolean;
  minion: boolean;
  kind: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  tx: number;
  ty: number;
  tz: number;
  yaw: number;
  tyaw: number;
  hp: number;
  state: "live" | "down" | "gone";
  jumps: number;
  grounded: boolean;
  climb: boolean;
  roll: number;
  dashCd: number;
  lunge: number;
  weapon: number;
  cd: number;
  kills: number;
  deaths: number;
  xp: number;
  flag: number;
  downT: number;
  flash: number;
  anim: number;
  bunny: number;
  sinceLand: number;
  fuel: number;
  sheep: number;
  puff: number;
  inhale: number;
  hover: boolean;
  aura: number;
  shade: number;
  helpT: number;
  speech: string;
  speechT: number;
  invuln: number;
  goalX: number;
  goalY: number;
  goalZ: number;
  think: number;
  stuck: number;
  riding: boolean;
  inWater: boolean;
  wasWater: boolean;
  wasGround: boolean;
  flame: number;
  slow: number;
  burst: number;
  pendingXp: number;
  pendingK: number;
  pendingD: number;
  pendingC: number;
  build: number;
  teleCd: number;
  revive: number;
  voiceCd: number;
  abilityCd: number;
  flat: number;
  spree: number;
  spreeAt: number;
  lifeStreak: number;
};

type Dyn = Solid & { alive: boolean; kind: string; team: number; cool: number; link: number; yaw: number };
type Ball = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; bounces: number; kind: string; team: number; owner: number; dmg: number };
type Drone = { x: number; y: number; z: number; team: number; life: number; dmg: number; owner: number };
type Smile = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number };
type Tracer = { x1: number; y1: number; z1: number; x2: number; y2: number; z2: number; life: number; max: number; color: number };
type Corpse = { x: number; y: number; z: number; team: number; charId: string; life: number; used: boolean };
type Flag = { team: number; x: number; y: number; z: number; hx: number; hy: number; hz: number; carrier: number; home: boolean; drop: number };
type Part = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; color: number };

const MAX = 72;
const DAY = 60 * 60;
const GLYPH: Record<string, string[]> = {
  M: ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
};

const emptyTouch = (): TouchState => ({ x: 0, y: 0, lookX: 0, lookY: 0, fire: false, jump: false, act: false, cycle: false, dash: false });

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerpAng(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function createGame(view: HTMLCanvasElement, overlay: HTMLCanvasElement, opts: { qa: boolean }) {
  const audio = createAudio();
  const world = buildWorld();
  const dyn: Dyn[] = [];
  const actors: Actor[] = [];
  const balls: Ball[] = [];
  const drones: Drone[] = [];
  const smiles: Smile[] = [];
  const tracers: Tracer[] = [];
  const corpses: Corpse[] = [];
  const parts: Part[] = [];
  const flags: Flag[] = world.flags.map((f) => ({
    team: f.team,
    x: f.x,
    y: f.y + 1.2,
    z: f.z,
    hx: f.x,
    hy: f.y + 1.2,
    hz: f.z,
    carrier: -1,
    home: true,
    drop: 0,
  }));
  const bunkers = world.bunkers.map((b) => ({ ...b, n: 0, done: false }));
  const caps = [0, 0, 0];
  const hillScore = [0, 0, 0];
  let hillOwner = -1;
  let hillTime = 0;
  let hillEmpty = 0;
  let boost = false;
  let surged = false;
  let nextId = 2;
  let player: Actor | null = null;
  let token = "";
  let spectate = false;
  const fly = { x: 0, y: 14, z: 30, yaw: 0, pitch: -0.3 };
  let commentT = 8;
  let qa = opts.qa;
  let playing = false;
  let menu = false;
  let showMap = false;
  let quality: Quality = "medium";
  let sens = 0.0022;
  let volume = 0.7;
  let yaw = 0;
  let pitch = 0.2;
  let lookX = 0;
  let lookY = 0;
  let shake = 0;
  let hitMark = 0;
  let hitHead = false;
  let scope = false;
  let mouseFire = false;
  let mouseScope = false;
  const keys = new Set<string>();
  let qaKeys: string[] | null = null;
  const was = { jump: false, act: false, cycle: false, fire: false };
  const edges = { jump: false, act: false, cycle: false, dash: false, slot: -1 };
  const touch = emptyTouch();
  let queuedDash: { f: number; s: number } | null = null;
  const tapAt: Record<string, number> = {};
  let clock0 = performance.now() / 1000 - (15 / 24) * DAY;
  let weather: "clear" | "cloudy" | "sun" | "rain" | "snow" = "sun";
  let weatherT = 25;
  let prevSun = 1;
  let trainAng = 0.4;
  let trainToot = 0;
  let smileSnd = 0;
  let netAcc = 0;
  let uiAcc = 0;
  let fid = 1;
  const feed: { id: number; text: string; at: number }[] = [];
  const log: { text: string }[] = [];
  let banner = "";
  let bannerAt = 0;
  const bannerQ: string[] = [];
  const pendingShots: { ox: number; oy: number; oz: number; dx: number; dy: number; dz: number; dmg: number }[] = [];
  const seenShots = new Set<number>();
  let openTele = -1;
  let spawnReq = false;
  let failWebgl = false;
  const subs = new Set<() => void>();
  let hud: HudState = blankHud();
  const white = new THREE.Color(1, 1, 1);
  const tmp = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const eul = new THREE.Euler();
  const quat = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const mat = new THREE.Matrix4();
  const col = new THREE.Color();

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: true, powerPreference: "high-performance" });
  } catch {
    failWebgl = true;
    renderer = new THREE.WebGLRenderer({ canvas: view });
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(1);
  renderer.setSize(view.clientWidth || 1280, view.clientHeight || 720, false);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x8ec4ee, 130, 380);
  const skins = bakeTextures();
  const camera = new THREE.PerspectiveCamera(74, 1, 0.1, 500);
  const hemi = new THREE.HemisphereLight(0xb9dcff, 0x8fbf62, 0.85);
  scene.add(hemi);
  scene.add(new THREE.AmbientLight(0xfff6ea, 0.38));
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.1);
  sun.position.set(40, 60, 20);
  sun.castShadow = false;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 90;
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(sun.target);

  const skyGeo = new THREE.SphereGeometry(380, 20, 12);
  const skyPos = skyGeo.attributes.position;
  const skyCol = new Float32Array(skyPos.count * 3);
  for (let i = 0; i < skyPos.count; i++) {
    const elev = skyPos.getY(i) / 380;
    if (elev < 0) {
      skyCol[i * 3] = 0.45;
      skyCol[i * 3 + 1] = 0.62;
      skyCol[i * 3 + 2] = 0.82;
    } else {
      const t = Math.pow(THREE.MathUtils.clamp(elev / 0.2, 0, 1), 0.5);
      skyCol[i * 3] = 1 + (0.16 - 1) * t;
      skyCol[i * 3 + 1] = 0.55 + (0.42 - 0.55) * t;
      skyCol[i * 3 + 2] = 0.28 + (0.98 - 0.28) * t;
    }
  }
  skyGeo.setAttribute("color", new THREE.BufferAttribute(skyCol, 3));
  const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(16, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false, depthWrite: false }),
  );
  scene.add(sunDisc);
  const clouds = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(5 + (i % 3) * 1.4, 10, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xfffdf8 : 0xf4f7ff, fog: false }),
    );
    puff.position.set(-70 + (i % 5) * 32, 28 + (i % 3) * 3, -40 + Math.floor(i / 5) * 36);
    puff.scale.set(1.8, 0.42, 1.1);
    clouds.add(puff);
  }
  scene.add(clouds);

  const groundGeo = new THREE.PlaneGeometry(240, 240, 60, 60);
  groundGeo.rotateX(-Math.PI / 2);
  const gPos = groundGeo.attributes.position;
  const gCol = new Float32Array(gPos.count * 3);
  const tint = new THREE.Color();
  for (let i = 0; i < gPos.count; i++) {
    const x = gPos.getX(i);
    const z = gPos.getZ(i);
    const center = Math.hypot(x, z);
    tint.setHex(0x4eae34);
    if (center > 16) tint.lerp(new THREE.Color(0xd2a15a), Math.min(1, (center - 16) / 28));
    if (z < -40) tint.lerp(new THREE.Color(0xf2d27a), Math.min(1, (-40 - z) / 22));
    if (Math.hypot(x + 38, z + 62) < 28) tint.lerp(new THREE.Color(0xf4f1e8), 0.92);
    if (Math.hypot(x - 76, z - 44) < 34) tint.lerp(new THREE.Color(0xd63a42), 0.88);
    if (Math.hypot(x + 76, z - 44) < 34) tint.lerp(new THREE.Color(0x162033), 0.9);
    const river = Math.abs(z - (8 + Math.sin(x * 0.045) * 7));
    if (river < 8) tint.lerp(new THREE.Color(0x1498c4), 1 - river / 8);
    gCol[i * 3] = tint.r;
    gCol[i * 3 + 1] = tint.g;
    gCol[i * 3 + 2] = tint.b;
  }
  groundGeo.setAttribute("color", new THREE.BufferAttribute(gCol, 3));
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ vertexColors: true, map: skins.grit }));
  ground.receiveShadow = true;
  ground.visible = true;
  scene.add(ground);

  const waterPts: number[] = [];
  const waterIdx: number[] = [];
  const waterUv: number[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const x = -102 + (i / steps) * 204;
    const z = 8 + Math.sin(x * 0.045) * 7;
    waterPts.push(x, 0.32, z - 6.2, x, 0.32, z + 6.2);
    waterUv.push(i / 6, 0, i / 6, 1);
    if (i < steps) {
      const a = i * 2;
      waterIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute("position", new THREE.Float32BufferAttribute(waterPts, 3));
  waterGeo.setAttribute("uv", new THREE.Float32BufferAttribute(waterUv, 2));
  waterGeo.setIndex(waterIdx);
  waterGeo.computeVertexNormals();
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshPhongMaterial({ color: 0x3ec6ff, map: skins.caustic, transparent: true, opacity: 0.72, shininess: 90, specular: 0xffffff, side: THREE.DoubleSide }),
  );
  scene.add(water);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: skins.stone });
  tileInstances(stoneMat, 0.42);
  const staticBoxes = new THREE.InstancedMesh(boxGeo, stoneMat, world.solids.length);
  staticBoxes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(world.solids.length * 3), 3);
  staticBoxes.frustumCulled = false;
  staticBoxes.castShadow = false;
  staticBoxes.receiveShadow = false;
  world.solids.forEach((s, i) => {
    if (s.bounce === 13) {
      mat.compose(pos.set(0, -100, 0), quat.identity(), scl.set(0.001, 0.001, 0.001));
    } else {
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
  tileInstances(dynMat, 0.42);
  const dynMesh = new THREE.InstancedMesh(boxGeo, dynMat, 80);
  dynMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(80 * 3), 3);
  dynMesh.frustumCulled = false;
  dynMesh.count = 0;
  scene.add(dynMesh);

  function tileInstances(mat: THREE.MeshLambertMaterial, density: number) {
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
#ifdef USE_INSTANCING
  vMapUv *= vec2(max(length(instanceMatrix[0].xyz), 0.2), max(length(instanceMatrix[1].xyz), 0.2)) * ${density.toFixed(3)};
#endif`,
      );
    };
  }

  function makeParts(geo: THREE.BufferGeometry, n: number, map?: THREE.Texture | null) {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff, map: map || null }), n);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    m.frustumCulled = false;
    m.count = 0;
    scene.add(m);
    return m;
  }
  const headM = makeParts(new THREE.SphereGeometry(0.5, 12, 10), MAX, skins.skin);
  const bodyM = makeParts(boxGeo, MAX, skins.cloth);
  const hairM = makeParts(boxGeo, MAX, skins.hair);
  const handM = makeParts(new THREE.SphereGeometry(0.5, 8, 6), MAX, skins.skin);
  const handRM = makeParts(new THREE.SphereGeometry(0.5, 8, 6), MAX, skins.skin);
  const footM = makeParts(boxGeo, MAX, skins.cloth);
  const footRM = makeParts(boxGeo, MAX, skins.cloth);
  const haloM = makeParts(new THREE.TorusGeometry(0.42, 0.05, 6, 12), MAX, skins.metal);
  const blobM = makeParts(new THREE.CircleGeometry(0.7, 12), MAX);
  const hairBackM = makeParts(boxGeo, MAX, skins.hair);
  const hairLM = makeParts(new THREE.SphereGeometry(0.5, 8, 6), MAX, skins.hair);
  const hairRM = makeParts(new THREE.SphereGeometry(0.5, 8, 6), MAX, skins.hair);
  const skirtM = makeParts(boxGeo, MAX, skins.cloth);
  const wingLM = makeParts(boxGeo, MAX, skins.feather);
  const wingRM = makeParts(boxGeo, MAX, skins.feather);
  const packM = makeParts(boxGeo, MAX, skins.metal);
  const gunM = makeParts(boxGeo, MAX, skins.metal);
  const ZMAX = 48;
  const zBody = makeParts(boxGeo, ZMAX, skins.zombieRag);
  const zHump = makeParts(boxGeo, ZMAX, skins.zombieSkin);
  const zHead = makeParts(new THREE.SphereGeometry(0.5, 12, 10), ZMAX, skins.zombieSkin);
  const zJaw = makeParts(boxGeo, ZMAX, skins.zombieSkin);
  const zArmL = makeParts(boxGeo, ZMAX, skins.zombieSkin);
  const zArmR = makeParts(boxGeo, ZMAX, skins.zombieSkin);
  const zHandL = makeParts(new THREE.SphereGeometry(0.5, 8, 6), ZMAX, skins.zombieSkin);
  const zHandR = makeParts(new THREE.SphereGeometry(0.5, 8, 6), ZMAX, skins.zombieSkin);
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
  const zEye = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: skins.eyes, transparent: true, depthWrite: false }),
    ZMAX,
  );
  zEye.frustumCulled = false;
  zEye.count = 0;
  scene.add(zEye);
  const zFace = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: skins.mutantFace, alphaTest: 0.4, side: THREE.FrontSide }),
    ZMAX,
  );
  zFace.frustumCulled = false;
  zFace.count = 0;
  scene.add(zFace);
  const faceTex = (() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d")!;
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
    g.arc(64, 84, 16, 0.2, Math.PI - 0.2);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const faceM = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    MAX,
  );
  faceM.frustumCulled = false;
  faceM.count = 0;
  scene.add(faceM);
  (blobM.material as THREE.MeshLambertMaterial).transparent = true;
  (blobM.material as THREE.MeshLambertMaterial).opacity = 0.35;
  (blobM.material as THREE.MeshLambertMaterial).depthWrite = false;

  const ballM = makeParts(new THREE.SphereGeometry(0.28, 10, 8), 40, skins.metal);
  const droneM = makeParts(new THREE.BoxGeometry(0.7, 0.22, 0.7), 16, skins.metal);
  const smileTex = (() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const g = c.getContext("2d")!;
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
    g.arc(32, 34, 12, 0.2, Math.PI - 0.2);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const smileM = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.35, 10, 8),
    new THREE.MeshBasicMaterial({ map: smileTex }),
    28,
  );
  smileM.frustumCulled = false;
  smileM.count = 0;
  scene.add(smileM);

  const flowerM = makeParts(new THREE.ConeGeometry(0.18, 0.45, 5), world.flowers.length, skins.petal);
  world.flowers.forEach((f, i) => {
    mat.compose(pos.set(f.x, 0.22, f.z), quat.identity(), scl.set(1, 1, 1));
    flowerM.setMatrixAt(i, mat);
    col.setHex(f.c);
    flowerM.setColorAt(i, col);
  });
  flowerM.count = world.flowers.length;
  const rockM = makeParts(new THREE.DodecahedronGeometry(0.45, 0), world.rocks.length, skins.rock);
  world.rocks.forEach((r, i) => {
    eul.set(r.s, r.x, 0);
    quat.setFromEuler(eul);
    mat.compose(pos.set(r.x, r.s * 0.3, r.z), quat, scl.set(r.s, r.s * 0.7, r.s));
    rockM.setMatrixAt(i, mat);
    col.setHex(r.c);
    rockM.setColorAt(i, col);
  });
  rockM.count = world.rocks.length;
  const grassM = makeParts(new THREE.ConeGeometry(0.12, 0.55, 4), world.grass.length, skins.blade);
  world.grass.forEach((g, i) => {
    mat.compose(pos.set(g.x, 0.25, g.z), quat.identity(), scl.set(g.s, g.s, g.s));
    grassM.setMatrixAt(i, mat);
    col.setHex(g.c);
    grassM.setColorAt(i, col);
  });
  grassM.count = world.grass.length;

  const trunkM = makeParts(new THREE.CylinderGeometry(0.22, 0.32, 4.4, 6), Math.max(1, world.palms.length), skins.wood);
  const crownM = makeParts(new THREE.ConeGeometry(1.7, 2.1, 7), Math.max(1, world.palms.length), skins.leaf);
  world.palms.forEach((p, i) => {
    mat.compose(pos.set(p.x, 2.2 * p.s, p.z), quat.identity(), scl.set(p.s, p.s, p.s));
    trunkM.setMatrixAt(i, mat);
    col.setHex(0x8a5a32);
    trunkM.setColorAt(i, col);
    mat.compose(pos.set(p.x, 4.5 * p.s, p.z), quat.identity(), scl.set(p.s, p.s, p.s));
    crownM.setMatrixAt(i, mat);
    col.setHex(0x2f9e4a);
    crownM.setColorAt(i, col);
  });
  trunkM.count = world.palms.length;
  crownM.count = world.palms.length;

  const canColors = [0xc6e35a, 0xff5a68, 0x3ec6ff];
  const canNames = ["MOUNT", "RED", "VOLT"];
  for (const c of world.cans) {
    const cvs = document.createElement("canvas");
    cvs.width = 128;
    cvs.height = 128;
    const g = cvs.getContext("2d")!;
    g.fillStyle = `#${canColors[c.kind]!.toString(16).padStart(6, "0")}`;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = "#1a2208";
    g.font = "700 26px sans-serif";
    g.textAlign = "center";
    g.fillText(canNames[c.kind] || "DEW", 64, 58);
    g.fillText("DEW", 64, 92);
    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 3.6, 16),
      new THREE.MeshLambertMaterial({ map: tex }),
    );
    mesh.position.set(c.x, c.y, c.z);
    scene.add(mesh);
  }

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xd7ff6a, transparent: true, opacity: 0.55, depthWrite: false });
  for (const s of world.streams) {
    for (const p of s.pts) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.07, 8, 18), ringMat);
      ring.position.set(p.x, p.y, p.z);
      ring.lookAt(p.x + 0.2, p.y + 0.2, p.z + 1);
      scene.add(ring);
    }
  }
  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(world.trainR, 0.22, 8, 64),
    new THREE.MeshLambertMaterial({ color: 0x6d645c, map: skins.metal }),
  );
  rail.rotation.x = Math.PI / 2;
  rail.position.y = world.trainY;
  scene.add(rail);
  const train = new THREE.Group();
  const trainMat = new THREE.MeshLambertMaterial({ color: 0xc6e35a, map: skins.metal });
  for (let i = 0; i < 3; i++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.1, 1.7), i === 0 ? trainMat : new THREE.MeshLambertMaterial({ color: 0xf4f1e4, map: skins.metal }));
    car.position.z = -i * 3.8;
    train.add(car);
  }
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0x888888, map: skins.metal }));
  stack.position.set(0, 1.4, 0.4);
  train.add(stack);
  scene.add(train);

  const flagMeshes: THREE.Mesh[] = [];
  for (const f of flags) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), new THREE.MeshLambertMaterial({ color: 0xf4f1e4, map: skins.wood }));
    scene.add(pole);
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.08), new THREE.MeshLambertMaterial({ color: TEAMS[f.team]!.hex, map: skins.cloth }));
    scene.add(cloth);
    flagMeshes.push(pole, cloth);
  }
  const medRing = makeParts(new THREE.TorusGeometry(0.85, 0.06, 6, 16), 30);
  const medBox = makeParts(new THREE.OctahedronGeometry(0.35, 0), 30, skins.metal);
  world.meds.forEach((m, i) => {
    eul.set(Math.PI / 2, 0, 0);
    quat.setFromEuler(eul);
    mat.compose(pos.set(m.x, m.y + 0.05, m.z), quat, scl.set(1, 1, 1));
    medRing.setMatrixAt(i, mat);
    col.setHex(0xfff2a8);
    medRing.setColorAt(i, col);
  });
  medRing.count = world.meds.length;
  const medState = world.meds.map(() => 0);

  buildLogo(scene);

  const tPos = new Float32Array(80 * 6);
  const tCol = new Float32Array(80 * 6);
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3));
  tGeo.setAttribute("color", new THREE.BufferAttribute(tCol, 3));
  const tLines = new THREE.LineSegments(
    tGeo,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending }),
  );
  scene.add(tLines);
  const pPos = new Float32Array(400 * 3);
  const pCol = new Float32Array(400 * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  const viewScene = new THREE.Scene();
  const viewCam = new THREE.PerspectiveCamera(74, 1, 0.05, 12);
  const gun = new THREE.Group();
  viewCam.add(gun);
  viewScene.add(viewCam);
  let gunId = "";
  let gunKick = 0;
  let wheelShown = 0;

  const timer = new THREE.Timer();
  timer.connect(document);
  let acc = 0;
  let running = true;

  function line(text: string, big = false) {
    log.push({ text: `${clockLabel()}  ${text}` });
    if (log.length > 80) log.shift();
    feed.push({ id: fid++, text, at: performance.now() });
    if (feed.length > 12) feed.shift();
    if (big) {
      bannerQ.push(text);
      audio.announce(text);
    }
  }

  function pumpBanner() {
    const now = performance.now();
    if (banner && now - bannerAt < 2800) return;
    const next = bannerQ.shift();
    banner = next || "";
    if (next) bannerAt = now;
  }

  function globalCall(text: string) {
    line(text, true);
    sendRelayAnnounce(text);
  }

  function streakTitle(spree: number, life: number) {
    if (life === 20) return "GODMODE";
    if (life === 10) return "DOUBLE PENTA-KILL";
    if (spree >= 5) return "PENTA-KILL";
    if (spree === 4) return "QUADRUPLE KILL";
    if (spree === 3) return "TRIPLE KILL";
    if (spree === 2) return "DOUBLE KILL";
    return "";
  }

  function clockParts() {
    const elapsed = performance.now() / 1000 - clock0;
    const days = Math.floor(elapsed / DAY);
    const tod = elapsed - days * DAY;
    const hoursF = (tod / DAY) * 24;
    const hours = Math.floor(hoursF);
    const mins = Math.floor((hoursF - hours) * 60);
    const date = new Date(Date.UTC(2026, 2, 20 + days));
    const month = date.getUTCMonth();
    const season = month < 2 || month === 11 ? "Winter" : month < 5 ? "Spring" : month < 8 ? "Summer" : "Autumn";
    return { hoursF, hours, mins, date, season, days };
  }
  function clockLabel() {
    const c = clockParts();
    return `${String(c.hours).padStart(2, "0")}:${String(c.mins).padStart(2, "0")}`;
  }

  function say(a: Actor, key: string) {
    if (a.voiceCd > 0) return;
    a.voiceCd = a === player ? 0.5 : a.minion ? 1.35 : 1.75;
    a.speech = LINES[key] || key;
    a.speechT = 1.15;
    const ch = CHAR_BY_ID[a.charId];
    audio.voiceAt(a.x, a.y + 1.2, a.z, ch?.voice || 440, key, a.speech, a === player);
  }

  function pose(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, sx: number, sy: number, sz: number) {
    eul.set(rx, ry, rz, "XYZ");
    quat.setFromEuler(eul);
    mat.compose(pos.set(x, y, z), quat, scl.set(sx, sy, sz));
    mesh.setMatrixAt(i, mat);
  }
  function poseYP(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, pitch: number, yaw: number, roll: number, sx: number, sy: number, sz: number) {
    eul.set(pitch, yaw, roll, "YXZ");
    quat.setFromEuler(eul);
    mat.compose(pos.set(x, y, z), quat, scl.set(sx, sy, sz));
    mesh.setMatrixAt(i, mat);
  }
  function paint(mesh: THREE.InstancedMesh, i: number, hex: number, flash = 0) {
    col.setHex(hex);
    if (flash > 0) col.lerp(white, Math.min(1, flash * 5));
    mesh.setColorAt(i, col);
  }

  function lookOf(ch: CharDef) {
    const base = {
      petite: 1,
      bangs: [0.4, 0.16, 0.3] as [number, number, number],
      hair: [0.36, 0.42, 0.26, 0.08] as [number, number, number, number],
      puff: 0.001,
      puffY: 0.05,
      puffX: 0.4,
      skirt: 0.55,
      skirtColor: 0,
      wings: 0,
      wingColor: 0xfffaf2,
      pack: 0,
      packColor: 0x3a4450,
    };
    if (ch.ability === "glide") {
      return { ...base, petite: 0.86, bangs: [0.46, 0.18, 0.3] as [number, number, number], hair: [0.36, 1.05, 0.12, -0.18] as [number, number, number, number], skirt: 1, skirtColor: 0xfff3c4, wings: 1, wingColor: 0xfffaf6 };
    }
    if (ch.ability === "aura") {
      return { ...base, petite: 0.92, bangs: [0.46, 0.18, 0.32] as [number, number, number], hair: [0.34, 0.55, 0.28, 0.05] as [number, number, number, number], puff: 0.72, puffY: 0.12, puffX: 0.46, skirt: 1, skirtColor: 0xff8ec8 };
    }
    if (ch.ability === "shadow") {
      return { ...base, petite: 0.84, bangs: [0.44, 0.28, 0.24] as [number, number, number], hair: [0.4, 1.35, 0.1, -0.34] as [number, number, number, number], skirt: 0.95, skirtColor: 0x1a1024, wings: 0 };
    }
    if (ch.ability === "bestie") {
      return { ...base, petite: 0.9, bangs: [0.4, 0.16, 0.3] as [number, number, number], hair: [0.22, 0.28, 0.2, 0.16] as [number, number, number, number], puff: 0.48, puffY: 0.46, puffX: 0.38, skirt: 1, skirtColor: 0xff6b9a };
    }
    if (ch.style === "round") {
      return { ...base, petite: 1.08, bangs: [0.22, 0.12, 0.2] as [number, number, number], hair: [0.2, 0.18, 0.2, 0.32] as [number, number, number, number], skirt: 0.001, puff: 0.22 };
    }
    if (ch.style === "bird" || ch.ability === "bird") {
      return { ...base, hair: [0.16, 0.34, 0.16, 0.42] as [number, number, number, number], wings: 0.72, wingColor: 0xffe08a, skirt: 0.35, skirtColor: 0xfff6ea };
    }
    if (ch.style === "goth") {
      return { ...base, petite: 0.9, bangs: [0.46, 0.28, 0.26] as [number, number, number], hair: [0.48, 1.2, 0.18, -0.32] as [number, number, number, number], skirt: 0.8, skirtColor: ch.cloth };
    }
    if (ch.ability === "jet") {
      return { ...base, pack: 1, packColor: 0x5d7ea8, skirt: 0.4 };
    }
    if (ch.ability === "sheep") {
      return { ...base, skirt: 0.001, puff: 0.28, puffY: 0.35, hair: [0.16, 0.16, 0.16, 0.4] as [number, number, number, number] };
    }
    return base;
  }

  function nearby(x: number, z: number, rad: number): Solid[] {
    const out: Solid[] = [];
    for (const id of querySolidIds(world, x, z, rad)) out.push(world.solids[id]!);
    for (const d of dyn) {
      if (!d.alive) continue;
      if (x + rad < d.minX || x - rad > d.maxX || z + rad < d.minZ || z - rad > d.maxZ) continue;
      out.push(d);
    }
    return out;
  }

  function rayAll(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number): RayHit | null {
    let best = raySolids(world, ox, oy, oz, dx, dy, dz, maxT);
    for (const d of dyn) {
      if (!d.alive) continue;
      const hit = rayAABB(ox, oy, oz, dx, dy, dz, d, maxT);
      if (hit && (!best || hit.t < best.t)) best = hit;
    }
    return best;
  }

  function probeWall(a: Actor) {
    let best: { nx: number; nz: number; x: number; z: number; top: number } | null = null;
    let bestT = 0.9;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      const hit = rayAll(a.x, a.y + 0.95, a.z, dx, 0, dz, 0.9);
      if (!hit || hit.ground || Math.abs(hit.ny) > 0.4) continue;
      const box = hit.box;
      if (box && (box.oneway || box.bounce > 0 || box.turbo > 0)) continue;
      const tall = box ? box.maxY - box.minY > 1.7 || box.climb : false;
      if (!tall) continue;
      if (hit.t < bestT) {
        bestT = hit.t;
        best = { nx: hit.nx, nz: hit.nz, x: hit.x, z: hit.z, top: box ? box.maxY : a.y + 2 };
      }
    }
    return best;
  }

  function streamAt(a: Actor) {
    let on = false;
    for (const s of world.streams) {
      for (let i = 0; i < s.pts.length - 1; i++) {
        const p = s.pts[i]!;
        const q = s.pts[i + 1]!;
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
        const dist = Math.hypot(a.x - cx, a.y - cy, a.z - cz);
        if (dist < s.r) {
          const len = Math.hypot(abx, aby, abz) || 1;
          a.vx += (abx / len) * 18 * 0.016;
          a.vz += (abz / len) * 18 * 0.016;
          a.vy += 12 * 0.016;
          a.vy = Math.min(a.vy, 9);
          on = true;
        }
      }
    }
    return on;
  }

  function trainPose(ang: number) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    return { x: c * world.trainR, y: world.trainY, z: s * world.trainR, rx: c, rz: s, tx: -s, tz: c };
  }

  function hurt(a: Actor, dmg: number, src: Actor | null, head: boolean) {
    if (a.state !== "live" || a.invuln > 0) return;
    if (qa && a === player) return;
    if (src && src.team === a.team) return;
    const ch = src ? CHAR_BY_ID[src.charId] : undefined;
    const lvl = src ? xpToLevel(src.xp).lvl : 1;
    const bonus = 1 + Math.min(0.15, lvl * 0.004);
    a.hp -= dmg * bonus * (src?.minion ? 0.45 : 1) * (ch?.ability === "necro" && src?.minion ? 1.4 : 1);
    a.flash = 0.15;
    if (a === player) shake = Math.min(0.4, shake + 0.12);
    if (a.hp <= 0) {
      a.hp = 0;
      a.state = "down";
      a.downT = 0;
      a.helpT = 0.2;
      a.deaths += 1;
      a.lifeStreak = 0;
      a.spree = 0;
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
        const nowMs = performance.now();
        if (nowMs - src.spreeAt > 4500) src.spree = 0;
        src.spree += 1;
        src.spreeAt = nowMs;
        src.lifeStreak += 1;
        if (head && src === player) audio.ding();
        if (src === player) gunKick = 1;
      }
      if (a === player) a.pendingD += 1;
      const who = src ? src.name : "the field";
      const killLine = `${head ? "HEADSHOT " : "KILL "}${who} dropped ${a.name}`;
      const shout = (!!src && !src.bot) || !a.bot;
      line(killLine, shout);
      if (shout) sendRelayAnnounce(killLine);
      if (src) {
        const title = streakTitle(src.spree, src.lifeStreak);
        if (title && shout) {
          line(title, true);
          sendRelayAnnounce(title);
        }
      }
      say(a, "down");
      for (let i = 0; i < 8; i++) burst(a.x, a.y + 1, a.z, 0xffd27a, 4);
    }
  }

  function dropFlag(a: Actor) {
    const f = flags.find((fl) => fl.team === a.flag);
    if (!f) {
      a.flag = -1;
      return;
    }
    f.carrier = -1;
    f.home = false;
    f.x = a.x;
    f.y = a.y + 0.4;
    f.z = a.z;
    f.drop = 0;
    a.flag = -1;
  }

  function burst(x: number, y: number, z: number, color: number, n: number) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 5,
        vz: (Math.random() - 0.5) * 6,
        life: 0.4 + Math.random() * 0.4,
        max: 0.8,
        color,
      });
      if (parts.length > 380) parts.shift();
    }
  }

  function explode(x: number, y: number, z: number, radius: number, dmg: number, owner: number, self = 1) {
    audio.boomAt(x, y, z);
    burst(x, y, z, 0xfff2c4, 16);
    for (const a of actors) {
      if (a.state !== "live") continue;
      const dx = a.x - x;
      const dy = a.y + 0.8 - y;
      const dz = a.z - z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > radius || dist < 0.001) continue;
      const fall = 1 - dist / radius;
      const src = actors.find((o) => o.id === owner) || null;
      const isSelf = a.id === owner;
      hurt(a, dmg * fall * (isSelf ? 0.22 * self : 1), src, false);
      const push = (isSelf ? 20 : 12) * fall;
      a.vx += (dx / dist) * push;
      a.vz += (dz / dist) * push;
      a.vy += push * 0.9 + (isSelf ? 7 : 2);
      a.grounded = false;
      a.riding = false;
    }
  }

  function loadout(char: CharDef) {
    const list = [...char.weapons];
    if (!list.includes("melee") && !list.includes("knife")) list.push("melee");
    return list.slice(0, 4);
  }

  function makeActor(partial: Partial<Actor> & Pick<Actor, "name" | "team" | "charId">): Actor {
    const ch = CHAR_BY_ID[partial.charId] || CHARACTERS[0]!;
    const a: Actor = {
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
      flat: 0,
      spree: 0,
      spreeAt: 0,
      lifeStreak: 0,
    };
    return a;
  }

  function spawnBots() {
    let n = 0;
    for (let t = 0; t < 3; t++) {
      for (let k = 0; k < 12; k++) {
        const spots = world.spawns.filter((s) => s.team === t);
        const s = spots[k % spots.length]!;
        const ch = CHARACTERS[n % CHARACTERS.length]!;
        const a = makeActor({
          name: BOT_NAMES[n % BOT_NAMES.length]!,
          team: t as TeamId,
          charId: ch.id,
          bot: true,
          x: s.x + (k - 1.5) * 0.4,
          y: s.y,
          z: s.z,
          yaw: s.yaw,
          xp: 30 + n * 28,
        });
        actors.push(a);
        n++;
      }
    }
  }
  spawnBots();
  spawnMutants();

  function spawnMutants() {
    const kinds = ["voodoo", "mummy", "necro"];
    const names = ["Mutant", "Wrapmutant", "Bonemutant"];
    for (let t = 0; t < 3; t++) {
      const spots = world.spawns.filter((s) => s.team === t);
      const s = spots[0] || world.spawns[0]!;
      actors.push(
        makeActor({
          name: names[t]!,
          team: t as TeamId,
          charId: t === 0 ? "pin" : t === 1 ? "wrap" : "bone",
          bot: true,
          minion: true,
          kind: kinds[t],
          x: s.x + 3.2,
          y: s.y,
          z: s.z + 1.4,
          hp: t === 1 ? 90 : 70,
          xp: 12,
        }),
      );
    }
  }

  function held(code: string) {
    return keys.has(code) || (qaKeys?.includes(code) ?? false);
  }

  function charOf(a: Actor) {
    return CHAR_BY_ID[a.charId] || CHARACTERS[0]!;
  }

  function speedOf(a: Actor) {
    let s = a.minion ? 2.7 : 8.5;
    if (a.slow > 0) s *= 0.55;
    if (a.inWater) s *= 0.64;
    if (charOf(a).ability === "bunny") s *= a.bunny;
    if (boost && a.team === hillOwner) s *= 1.2;
    for (const o of actors) {
      if (o === a || o.state !== "live" || o.team !== a.team) continue;
      if (charOf(o).ability === "aura" && Math.hypot(o.x - a.x, o.z - a.z) < (o.aura > 0 ? 14 : 8)) s *= o.aura > 0 ? 1.18 : 1.08;
    }
    return s;
  }

  function tryJump(a: Actor, wall: ReturnType<typeof probeWall> | null) {
    const maxJ = charOf(a).jumps;
    if (a.minion) {
      if (!a.grounded && a.sinceLand >= 0.12) return;
      a.vy = 6.1;
      a.vx *= 0.55;
      a.vz *= 0.55;
      a.grounded = false;
      a.jumps = maxJ;
      a.riding = false;
      say(a, "groan");
      return;
    }
    if (a.climb || (wall && !a.grounded)) {
      const n = wall || { nx: -Math.sin(a.yaw), nz: -Math.cos(a.yaw) };
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
    if (a.grounded || a.sinceLand < 0.14) {
      const bunny = charOf(a).ability === "bunny";
      if (bunny && a.sinceLand < 0.22 && a.sinceLand > 0.02) a.bunny = Math.min(1.85, a.bunny + 0.12);
      else if (bunny) a.bunny = 1;
      a.vy = 9.15 * (bunny ? 0.92 + a.bunny * 0.18 : 1);
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
      a.roll = 0.48;
      a.grounded = false;
      say(a, a.jumps >= 3 ? "triple" : "double");
      audio.jump(charOf(a).voice * 1.15);
      return;
    }
    if (charOf(a).ability === "bird" && a.fuel > 0.05) {
      a.vy = Math.max(a.vy, 4.4);
      a.fuel -= 0.12;
      say(a, "triple");
    }
  }

  function collide(a: Actor, dt: number) {
    const r = 0.42;
    const h = 1.62;
    a.x += a.vx * dt;
    for (const b of nearby(a.x, a.z, r + 0.6)) resolveH(a, b, "x", r, h);
    const prevY = a.y;
    a.y += a.vy * dt;
    a.grounded = false;
    for (const b of nearby(a.x, a.z, r + 0.2)) {
      if (a.x + r <= b.minX || a.x - r >= b.maxX || a.z + r <= b.minZ || a.z - r >= b.maxZ) continue;
      if (a.y + h <= b.minY || a.y >= b.maxY) continue;
      const fromAbove = prevY >= b.maxY - 0.05 && a.vy <= 0.01;
      if (fromAbove && (!b.oneway || prevY >= b.maxY - 0.08)) {
        a.y = b.maxY;
        if (b.bounce > 0) {
          a.vy = b.bounce;
          a.grounded = false;
          a.jumps = 0;
          a.bunny = Math.min(1.85, a.bunny + 0.04);
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
      } else if (!b.oneway && a.vy > 0 && prevY + h <= b.minY + 0.2) {
        a.y = b.minY - h;
        a.vy = 0;
      }
    }
    a.z += a.vz * dt;
    for (const b of nearby(a.x, a.z, r + 0.6)) resolveH(a, b, "z", r, h);
    if (a.y < 0) {
      a.y = 0;
      if (a.vy < 0) a.vy = 0;
      a.grounded = true;
    }
    a.x = clamp(a.x, -116, 116);
    a.z = clamp(a.z, -116, 116);
    const wet = inRiver(a.x, a.z) && a.y < 0.95;
    a.inWater = wet;
    if (wet && a.vy < -1) a.vy = -1;
  }

  function resolveH(a: Actor, b: Solid, axis: "x" | "z", r: number, h: number) {
    if (b.oneway || b.bounce > 0) return;
    if (a.y + h <= b.minY + 0.02 || a.y >= b.maxY - 0.01) return;
    if (a.x + r <= b.minX || a.x - r >= b.maxX || a.z + r <= b.minZ || a.z - r >= b.maxZ) return;
    if (b.maxY - a.y <= 0.55 && b.maxY - a.y > 0.01 && a.vy <= 4) {
      a.y = b.maxY;
      a.grounded = true;
      if (a.vy < 0) a.vy = 0;
      return;
    }
    if (axis === "x") {
      const penL = a.x + r - b.minX;
      const penR = b.maxX - (a.x - r);
      if (penL < penR) {
        a.x = b.minX - r;
        if (a.vx > 0) a.vx = 0;
      } else {
        a.x = b.maxX + r;
        if (a.vx < 0) a.vx = 0;
      }
    } else {
      const penL = a.z + r - b.minZ;
      const penR = b.maxZ - (a.z - r);
      if (penL < penR) {
        a.z = b.minZ - r;
        if (a.vz > 0) a.vz = 0;
      } else {
        a.z = b.maxZ + r;
        if (a.vz < 0) a.vz = 0;
      }
    }
  }

  function stepLive(a: Actor, dt: number, first: boolean) {
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
      if (held("KeyW") || touch.y > 0.2) fwd += 1;
      if (held("KeyS") || touch.y < -0.2) fwd -= 1;
      if (held("KeyD") || touch.x > 0.2) str += 1;
      if (held("KeyA") || touch.x < -0.2) str -= 1;
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
        a.think = 0.4;
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
        if (a.stuck > 0.5) {
          const side = (a.id & 1) === 0 ? 1 : -1;
          a.yaw += side * 2.2 * dt;
          fwd = 1;
        } else fwd = L < 0.75 ? 0 : Math.min(1, 0.4 + (L - 0.75) / 2);
        jumpEdge = a.grounded && a.sinceLand > 0.45 && (a.stuck > 0.8 || a.goalY > a.y + 1.2);
      } else {
        a.yaw = desired;
        fwd = 1;
        if (a.stuck > 0.4) str = a.id % 2 ? 1 : -1;
        jumpEdge = (a.goalY > a.y + 1.1 || a.stuck > 0.5) && Math.random() < 0.08;
      }
      const sp = Math.hypot(a.vx, a.vz);
      if (sp < 0.35 && fwd > 0.2) a.stuck += dt;
      else a.stuck = Math.max(0, a.stuck - dt * 2);
      jumpHeld = false;
      const foe = nearestEnemy(a, a.minion ? 18 : 26);
      fire = !!foe && Math.random() < 0.35 && a.cd <= 0;
      if (a.minion && foe && Math.hypot(foe.x - a.x, foe.z - a.z) < 2.4) fire = true;
      if (!a.minion && a.abilityCd <= 0) {
        const ab = ch.ability;
        const nearBody = corpses.some((c) => !c.used && Math.hypot(c.x - a.x, c.z - a.z) < 8);
        if ((ab === "voodoo" || ab === "mummy" || ab === "necro") && nearBody) useAbility(a);
        else if ((ab === "aura" || ab === "bestie") && Math.random() < 0.03) useAbility(a);
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
        if (d < 7 && d > 0.2) {
          o.vx += ((a.x - o.x) / d) * 8 * dt;
          o.vz += ((a.z - o.z) / d) * 8 * dt;
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
      const fy = bot ? 0.15 : Math.sin(pitch);
      const fz = -Math.cos(a.yaw) * (bot ? 1 : cy);
      a.vx = fx * 22;
      a.vy = fy * 22;
      a.vz = fz * 22;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.z += a.vz * dt;
      const hit = rayAll(a.x, a.y + 0.6, a.z, Math.sign(a.vx) || 0, 0, Math.sign(a.vz) || 0, 0.8);
      const bumped = actors.some((o) => o !== a && o.state === "live" && o.team !== a.team && Math.hypot(o.x - a.x, o.z - a.z) < 1.2);
      if (hit || bumped || a.y < 0.2 || a.sheep <= 0) {
        explode(a.x, a.y + 0.5, a.z, 4.5, 48, a.id, 0);
        a.sheep = 0;
        a.vy = 12;
        a.vx *= 0.25;
        a.vz *= 0.25;
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
      a.x = wall.x + wall.nx * 0.5;
      a.z = wall.z + wall.nz * 0.5;
      const tx = -wall.nz;
      const tz = wall.nx;
      a.x += tx * str * 3.2 * dt;
      a.z += tz * str * 3.2 * dt;
      a.jumps = 0;
      if (a.y >= wall.top - 0.05) {
        a.y = wall.top;
        a.climb = false;
        a.grounded = true;
        a.vy = 0;
      }
    } else {
      a.climb = false;
      if (dash && a.dashCd <= 0 && wm > 0.15) {
        const dashSp = a.puff > 0 ? 22 : 16.5;
        a.vx = wx * dashSp;
        a.vz = wz * dashSp;
        a.dashCd = 0.72;
        a.lunge = 0.18;
        if (a.puff > 0) a.flat = 0.45;
        if (ch.ability === "shadow") a.shade = 0.3;
        say(a, "dash");
      }
      if (a.lunge > 0) a.lunge -= dt;
      const glide = ch.ability === "glide" && jumpHeld && a.vy < 0 && !a.grounded;
      if (ch.ability === "jet" && jumpHeld && !a.grounded && a.fuel > 0) {
        a.vy += 24 * dt;
        a.vy = Math.min(a.vy, 9);
        a.fuel -= dt * 0.35;
      }
      if (ch.ability === "bird" && jumpHeld && !a.grounded && a.fuel > 0 && a.jumps >= ch.jumps) {
        a.vy += 20 * dt;
        a.vy = Math.min(a.vy, 7.5);
        a.fuel -= dt * 0.25;
      }
      if (a.hover && a.fuel > 0) {
        a.vy += (0 - a.vy) * (1 - Math.exp(-6 * dt));
        if (jumpHeld) a.vy += 8 * dt;
        a.fuel -= dt * 0.18;
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
      if (!a.minion && !a.grounded && wall && fwd > 0.2) {
        const into = a.vx * -wall.nx + a.vz * -wall.nz;
        if (into > 0) {
          a.vx += wall.nx * into;
          a.vz += wall.nz * into;
        }
        const ride = ch.ability === "wall" ? 0.35 : 3.1;
        if (a.vy < -ride) a.vy = -ride;
        if (a === player && Math.random() < 0.02) a.pendingXp += 1;
      }
      if (!bot && actEdge) {
        if (BUILD_ACTIONS[a.build]?.id === "ability" || a.build === 0) useAbility(a);
        else place(a);
      }
    }

    if (a.grounded) {
      a.sinceLand += dt;
      a.fuel = Math.min(1, a.fuel + dt * 0.4);
      if (!a.wasGround && a.vy <= 0) {
        if (a === player) audio.jump(180);
        burst(a.x, a.y, a.z, 0xffffff, 4);
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
        const d = Math.hypot(a.x - tr.x, a.z - tr.z);
        if (d < 3.1 && a.y > tr.y - 0.2 && a.y < tr.y + 2.4) {
          a.riding = true;
          say(a, "ride");
        }
      }
    }
    if (a.inWater && !beforeWater) {
      audio.splashAt(a.x, a.y, a.z);
      say(a, "water");
      burst(a.x, 0.4, a.z, 0x9fe7ff, 8);
    }
    a.wasWater = a.inWater;
    a.wasGround = a.grounded;
    if (a.grounded && ch.ability === "bunny" && a.sinceLand > 0.28) a.bunny = Math.max(1, a.bunny - dt * 0.4);
    if (a.minion) {
      const moving = Math.hypot(a.vx, a.vz);
      if (a.grounded && moving > 0.35) a.anim += (moving / 1.28) * Math.PI * 2 * dt;
      else {
        const m = ((a.anim % Math.PI) + Math.PI) % Math.PI;
        a.anim += (Math.PI / 2 - m) * Math.min(1, dt * 8);
      }
    } else a.anim += Math.hypot(a.vx, a.vz) * dt * 1.6;
    if (!(qa && a === player)) {
      for (const o of actors) {
        if (o === a || o.state !== "live") continue;
        const dx = a.x - o.x;
        const dz = a.z - o.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.75 && dist > 0.01 && !a.climb && !a.riding) {
          const push = a.minion ? 1.6 : 6;
          a.vx += (dx / dist) * push * dt;
          a.vz += (dz / dist) * push * dt;
        }
      }
    }
    if (a.hp < (a.minion ? 90 : 100)) a.hp = Math.min(a.minion ? 90 : 100, a.hp + dt * (a.minion ? 0.3 : 1));
    for (let i = 0; i < medState.length; i++) {
      const m = world.meds[i]!;
      if (medState[i]! > 0) medState[i] = Math.max(0, medState[i]! - dt);
      else if (a.hp < 100 && Math.hypot(a.x - m.x, a.z - m.z) < 1.35 && Math.abs(a.y - m.y) < 2) {
        a.hp = Math.min(100, a.hp + 45);
        medState[i] = 60;
        burst(m.x, m.y + 0.4, m.z, 0xb6ff6a, 8);
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
          a.y = other.maxY + 0.1;
          a.teleCd = 1.1;
          burst(a.x, a.y, a.z, 0x7af0ff, 8);
        }
      }
      if (d.kind === "tangle" && d.team !== a.team && overlap(a, d)) a.slow = 2.2;
    }
    const weapons = loadout(ch);
    if (first && edges.slot >= 0 && !bot) a.weapon = edges.slot % weapons.length;
    const w = WEAPON_BY_ID[weapons[a.weapon % weapons.length] || "plasma"]!;
    if (a.minion) {
      const prey = nearestEnemy(a, 2.55);
      if (prey && a.cd <= 0) {
        a.cd = 0.82;
        hurt(prey, a.kind === "necro" ? 18 : 13, a, false);
        burst(prey.x, prey.y + 1, prey.z, 0x9dff4a, 7);
        say(a, "groan");
      }
    } else if (fire && a.cd <= 0 && w.kind !== "flame") {
      if (a === player) gunKick = 1;
      shoot(a, w.id);
    }
    if (!a.minion && fire && w.kind === "flame") {
      a.flame += dt;
      if (a.cd <= 0) {
        a.cd = 0.1;
        if (a === player) gunKick = 1;
        flame(a);
      }
    }
    if (a === player) scope = mouseScope && w.id === "sniper" && !menu;
    stepPickups(a);
  }

  function overlap(a: Actor, b: Solid) {
    return a.x > b.minX - 0.4 && a.x < b.maxX + 0.4 && a.z > b.minZ - 0.4 && a.z < b.maxZ + 0.4 && a.y + 1.4 > b.minY && a.y < b.maxY + 0.4;
  }

  function nearestEnemy(a: Actor, rad: number) {
    let best: Actor | null = null;
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

  function pickGoal(a: Actor) {
    if (a.hp < 40) {
      let best = world.meds[0]!;
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
      const b = world.bases[a.team]!;
      a.goalX = b.x;
      a.goalY = 8;
      a.goalZ = b.z;
      return;
    }
    const roll = (a.id * 13) % 10;
    if (roll < 3) {
      a.goalX = 0;
      a.goalY = 28;
      a.goalZ = 0;
      return;
    }
    let bestF = flags[0]!;
    let bd = 1e9;
    for (const f of flags) {
      if (f.team === a.team && f.home) continue;
      const d = Math.hypot(f.x - a.x, f.z - a.z) + (f.team === a.team ? -8 : 0);
      if (d < bd) {
        bd = d;
        bestF = f;
      }
    }
    a.goalX = bestF.x + ((a.id % 5) - 2);
    a.goalY = bestF.y;
    a.goalZ = bestF.z;
  }

  function aimDir(a: Actor, out: THREE.Vector3) {
    if (a === player) {
      camera.getWorldDirection(out);
      return;
    }
    out.set(-Math.sin(a.yaw), 0, -Math.cos(a.yaw));
  }

  function shoot(a: Actor, id: string) {
    const w = WEAPON_BY_ID[id]!;
    a.cd = w.cd * (a.burst > 0 ? 0.45 : 1);
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
      tracers.push({ x1: ox, y1: oy, z1: oz, x2: endX, y2: endY, z2: endZ, life: id === "sniper" ? 0.18 : 0.08, max: 0.18, color: TEAMS[a.team]!.hex });
      if (id === "dual") {
        tracers.push({ x1: ox + 0.2, y1: oy, z1: oz, x2: endX, y2: endY, z2: endZ, life: 0.08, max: 0.1, color: 0xff8ec8 });
      }
      if (hit?.actor) {
        hurt(hit.actor, hit.head ? w.head : w.dmg, a, hit.head);
        if (a === player) {
          hitMark = 0.12;
          hitHead = hit.head;
        }
      }
      if (a === player) pendingShots.push({ ox, oy, oz, dx: dir.x, dy: dir.y, dz: dir.z, dmg: w.dmg });
    } else if (w.kind === "rocket" || w.kind === "bounce" || w.kind === "laugh") {
      balls.push({
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
        dmg: w.dmg,
      });
    } else if (w.kind === "drone") {
      drones.push({ x: ox + dir.x, y: oy, z: oz + dir.z, team: a.team, life: 8, dmg: w.dmg, owner: a.id });
    }
  }

  function flame(a: Actor) {
    aimDir(a, dir);
    audio.shotAt(a.x, a.y + 1.2, a.z, "flame", a === player);
    burst(a.x + dir.x, a.y + 1.2, a.z + dir.z, 0xff6a2a, 3);
    for (const o of actors) {
      if (o.state !== "live" || o.team === a.team) continue;
      const dx = o.x - a.x;
      const dy = o.y + 0.8 - (a.y + 1.2);
      const dz = o.z - a.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 7 || dist < 0.01) continue;
      const dot = (dx / dist) * dir.x + (dy / dist) * dir.y + (dz / dist) * dir.z;
      if (dot > 0.75) hurt(o, 7, a, false);
    }
  }

  function trace(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, src: Actor) {
    const wall = rayAll(ox, oy, oz, dx, dy, dz, maxT);
    let bestT = wall ? wall.t : maxT;
    let hit: { actor: Actor; head: boolean; x: number; y: number; z: number } | null = null;
    for (const o of actors) {
      if (o === src || o.state !== "live") continue;
      const body = sphereT(ox, oy, oz, dx, dy, dz, o.x, o.y + 0.85, o.z, 0.55, bestT);
      const head = sphereT(ox, oy, oz, dx, dy, dz, o.x, o.y + 1.5, o.z, 0.38, bestT);
      const t = head ?? body;
      if (t == null) continue;
      if (t < bestT) {
        bestT = t;
        hit = { actor: o, head: head != null && (body == null || head <= body), x: ox + dx * t, y: oy + dy * t, z: oz + dz * t };
      }
    }
    if (wall && (!hit || wall.t < bestT)) return { actor: null as Actor | null, head: false, x: wall.x, y: wall.y, z: wall.z };
    return hit;
  }

  function sphereT(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, cy: number, cz: number, rad: number, maxT: number) {
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

  function useAbility(a: Actor) {
    const ch = charOf(a);
    if (a.abilityCd > 0) return;
    if (ch.ability === "shadow") {
      a.vx = -Math.sin(a.yaw) * 22;
      a.vz = -Math.cos(a.yaw) * 22;
      a.shade = 0.35;
      a.abilityCd = 3;
      say(a, "dash");
    } else if (ch.ability === "aura") {
      a.aura = 4.5;
      a.abilityCd = 8;
      say(a, "yay");
    } else if (ch.ability === "bestie") {
      for (const o of actors) {
        if (o.team === a.team && o.state === "live" && Math.hypot(o.x - a.x, o.z - a.z) < 8) o.hp = Math.min(100, o.hp + 28);
      }
      a.abilityCd = 10;
      burst(a.x, a.y + 1, a.z, 0xff8ec4, 10);
    } else if (ch.ability === "puff") {
      a.inhale = 0.7;
      a.abilityCd = 6;
      audio.shotAt(a.x, a.y + 1, a.z, "flame", a === player);
    } else if (ch.ability === "sheep") {
      a.sheep = 4.5;
      a.abilityCd = 11;
      say(a, "sheep");
    } else if (ch.ability === "drone") {
      a.hover = !a.hover;
      a.abilityCd = 0.4;
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
      a.abilityCd = 0.3;
    } else if (ch.ability === "dual") {
      a.burst = 2.5;
      a.abilityCd = 6;
    } else {
      a.abilityCd = 0.4;
      say(a, "yay");
    }
  }

  function minionCount(team: number) {
    return actors.filter((a) => a.minion && a.team === team && a.state === "live").length;
  }

  function raise(a: Actor) {
    let best: Corpse | null = null;
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
      hp: rite === "mummy" ? 90 : rite === "necro" ? 74 : 64,
    });
    actors.push(m);
    line(`${a.name} raised a mutant`, a === player);
    burst(best.x, best.y + 0.6, best.z, 0x8dff45, 12);
    return true;
  }

  function place(a: Actor) {
    const piece = BUILD_ACTIONS[a.build]?.id || "block";
    if (piece === "ability") {
      useAbility(a);
      return;
    }
    const counts = dyn.filter((d) => d.alive && d.kind === piece).length;
    const cap = (piece === "block" ? 36 : 8) + (charOf(a).ability === "builder" ? 8 : 0);
    if (counts >= cap) {
      if (a === player) line("No more of those");
      return;
    }
    const fx = -Math.sin(a.yaw);
    const fz = -Math.cos(a.yaw);
    let x = Math.round((a.x + fx * 2.5) / 2) * 2;
    let z = Math.round((a.z + fz * 2.5) / 2) * 2;
    const down = rayAll(x, a.y + 2.2, z, 0, -1, 0, 8);
    const floor = down ? down.y : 0;
    const spec = pieceSpec(piece, x, floor, z);
    const solid: Dyn = {
      ...spec,
      alive: true,
      kind: piece,
      team: a.team,
      cool: 0,
      link: -1,
      yaw: a.yaw,
    };
    if (piece === "tele") {
      if (openTele >= 0 && dyn[openTele]?.alive) {
        solid.link = openTele;
        dyn[openTele]!.link = dyn.length;
        openTele = -1;
      } else {
        solid.link = dyn.length;
        openTele = dyn.length;
      }
    }
    dyn.push(solid);
    if (piece === "block") {
      for (const b of bunkers) {
        if (!b.done && Math.hypot(b.x - x, b.z - z) < 9) {
          b.n += 1;
          if (b.n >= 3) {
            b.done = true;
            a.xp += 80;
            a.pendingXp += 80;
            line("Bunker established", true);
          }
        }
      }
    }
    if (a === player) line(`Placed ${BUILD_ACTIONS[a.build]?.name}`);
  }

  function pieceSpec(piece: string, x: number, floor: number, z: number): Solid {
    if (piece === "jump") return boxSolid(x, floor + 0.2, z, 2, 0.35, 2, { bounce: 15, color: 0xc6e35a });
    if (piece === "turbo") return boxSolid(x, floor + 0.2, z, 2, 0.35, 2, { turbo: 20, color: 0x7af0ff });
    if (piece === "turret") return boxSolid(x, floor + 0.7, z, 1.1, 1.4, 1.1, { color: 0x22282a });
    if (piece === "mine") return boxSolid(x, floor + 0.12, z, 0.8, 0.2, 0.8, { color: 0xff5a68 });
    if (piece === "tangle") return boxSolid(x, floor + 0.3, z, 1.6, 0.5, 1.6, { color: 0xb388ff });
    if (piece === "tele") return boxSolid(x, floor + 0.15, z, 1.6, 0.25, 1.6, { color: 0x3ec6ff });
    const sand = z < -50;
    return boxSolid(x, floor + 1, z, 2, 2, 2, { color: sand ? 0xe7d7a4 : 0x8dca55 });
  }

  function boxSolid(cx: number, cy: number, cz: number, w: number, h: number, d: number, extra: Partial<Solid>): Solid {
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
      color: 0xffffff,
      ...extra,
    };
  }

  function stepPickups(a: Actor) {
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
          line(`${a.name} captured the ${TEAMS[f.team]!.name} flag`, true);
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
          line(`${TEAMS[f.team]!.name} flag returned`, true);
        } else if (a.team !== f.team && a.flag < 0) {
          f.carrier = a.id;
          f.home = false;
          a.flag = f.team;
          line(`${a.name} took the ${TEAMS[f.team]!.name} flag`, true);
        }
      }
    }
  }

  function onBase(a: Actor, team: number) {
    const b = world.bases[team]!;
    return a.y > 6.5 && Math.hypot(a.x - b.x, a.z - b.z) < 15;
  }
  function ownHome(team: number) {
    const f = flags[team];
    return !!f && f.home && f.carrier < 0;
  }

  function stepDown(a: Actor, dt: number) {
    a.downT += dt;
    a.helpT -= dt;
    a.revive = 0;
    for (const o of actors) {
      if (o.state !== "live" || o.team !== a.team || o.minion) continue;
      if (Math.hypot(o.x - a.x, o.z - a.z) < 1.35 && Math.abs(o.y - a.y) < 2) {
        a.revive += dt;
        const need = charOf(o).ability === "bestie" ? 0.12 : 0.4;
        if (a.revive >= need) {
          a.state = "live";
          a.hp = 60;
          a.invuln = 0.8;
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
    const give = a === player ? spawnReq || (edges.jump && !menu) : a.downT > 8;
    if (give || a.downT > 22) {
      corpses.push({ x: a.x, y: a.y, z: a.z, team: a.team, charId: a.charId, life: 36, used: false });
      if (corpses.length > 24) corpses.shift();
      if (a.minion) a.state = "gone";
      else respawn(a);
      spawnReq = false;
    }
  }

  function respawn(a: Actor) {
    const spots = world.spawns.filter((s) => s.team === a.team);
    const s = spots[Math.floor(Math.random() * spots.length)] || world.spawns[0]!;
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

  function stepFly(dt: number, first: boolean) {
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
    if (held("KeyW") || touch.y > 0.2) fwd += 1;
    if (held("KeyS") || touch.y < -0.2) fwd -= 1;
    if (held("KeyD") || touch.x > 0.2) str += 1;
    if (held("KeyA") || touch.x < -0.2) str -= 1;
    if (touch.y) fwd += touch.y;
    if (touch.x) str += touch.x;
    fwd = clamp(fwd, -1, 1);
    str = clamp(str, -1, 1);
    if (held("Space") || touch.jump) up += 1;
    if (held("ControlLeft") || held("ControlRight") || held("KeyC")) up -= 1;
    const boost = held("ShiftLeft") || held("ShiftRight") || touch.dash ? 2.6 : 1;
    const sp = 16 * boost;
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
    fly.y = clamp(fly.y, 0.6, 86);
    fly.z = clamp(fly.z, -140, 140);
  }

  function earNow() {
    if (spectate) return fly;
    if (player) return { x: player.x, y: player.y + 1.6, z: player.z };
    return { x: 0, y: 22, z: 0 };
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
    const flavors = ["squad up", "watch the flank", "hold the flag", "nice and easy"];
    return flavors[Math.floor(performance.now() / 11000) % flavors.length] || "squad up";
  }

  function simulate(dt: number, first: boolean) {
    if (spectate) stepFly(dt, first);
    const c = clockParts();
    const sunY = Math.sin(((c.hoursF - 6) / 24) * Math.PI * 2);
    if (prevSun > 0 && sunY <= 0) audio.owl();
    if (prevSun <= 0.05 && sunY > 0.05) audio.birds();
    prevSun = sunY;
    weatherT -= dt;
    if (weatherT <= 0) {
      const optsW = ["clear", "cloudy", "sun", "rain", "snow"] as const;
      weather = optsW[Math.floor(Math.random() * optsW.length)]!;
      weatherT = 35 + Math.random() * 40;
      audio.weather(weather);
      line(`Weather ${weather}`);
    }
    trainAng += dt * 0.22;
    trainToot -= dt;
    if (trainToot <= 0) {
      trainToot = 7;
      const tr = trainPose(trainAng);
      audio.trainAt(tr.x, tr.y, tr.z);
      burst(tr.x, tr.y + 2.2, tr.z, 0xffffff, 4);
    }
    for (const f of flags) {
      if (f.carrier < 0 && !f.home) {
        f.drop += dt;
        if (f.drop > 20) {
          f.home = true;
          f.x = f.hx;
          f.y = f.hy;
          f.z = f.hz;
          line(`${TEAMS[f.team]!.name} flag returned`);
        }
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
      const b = balls[i]!;
      b.life -= dt;
      b.vy -= (b.kind === "rocket" ? 4 : 12) * dt;
      const nx = b.x + b.vx * dt;
      const ny = b.y + b.vy * dt;
      const nz = b.z + b.vz * dt;
      const dist = Math.hypot(b.vx, b.vy, b.vz) * dt;
      const hit = dist > 0.001 ? rayAll(b.x, b.y, b.z, b.vx / (Math.hypot(b.vx, b.vy, b.vz) || 1), b.vy / (Math.hypot(b.vx, b.vy, b.vz) || 1), b.vz / (Math.hypot(b.vx, b.vy, b.vz) || 1), dist) : null;
      let actorBounce = false;
      for (const a of actors) {
        if (a.id === b.owner || a.state !== "live") continue;
        if (Math.hypot(a.x - nx, a.y + 0.8 - ny, a.z - nz) < 0.8) actorBounce = true;
      }
      if (hit || actorBounce || b.life <= 0) {
        if (b.kind === "rocket" || b.life <= 0 || (b.bounces >= 2 && (hit || actorBounce))) {
          if (b.kind === "laugh") {
            burst(b.x, b.y, b.z, 0xffe14a, 8);
            explode(b.x, b.y, b.z, 3.2, b.dmg, b.owner, 0);
            for (let k = 0; k < 6; k++) {
              smiles.push({
                x: b.x,
                y: b.y,
                z: b.z,
                vx: (Math.random() - 0.5) * 8,
                vy: 4 + Math.random() * 4,
                vz: (Math.random() - 0.5) * 8,
                life: 10,
              });
            }
          } else explode(hit ? hit.x : b.x, hit ? hit.y : b.y, hit ? hit.z : b.z, 4.4, b.dmg, b.owner, 1);
          balls.splice(i, 1);
        } else {
          b.bounces += 1;
          const nxp = hit ? hit.nx : 0;
          const nyp = hit ? hit.ny : 1;
          const nzp = hit ? hit.nz : 0;
          const vn = b.vx * nxp + b.vy * nyp + b.vz * nzp;
          b.vx = (b.vx - 2 * vn * nxp) * 0.72;
          b.vy = (b.vy - 2 * vn * nyp) * 0.72;
          b.vz = (b.vz - 2 * vn * nzp) * 0.72;
          if (hit) {
            b.x = hit.x + nxp * 0.3;
            b.y = hit.y + nyp * 0.3;
            b.z = hit.z + nzp * 0.3;
          }
        }
      } else {
        b.x = nx;
        b.y = ny;
        b.z = nz;
      }
    }
    for (let i = drones.length - 1; i >= 0; i--) {
      const d = drones[i]!;
      d.life -= dt;
      let foe: Actor | null = null;
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
        d.x += ((foe.x - d.x) / (bd || 1)) * 10 * dt;
        d.y += ((foe.y + 1 - d.y) * 2) * dt;
        d.z += ((foe.z - d.z) / (bd || 1)) * 10 * dt;
        if (bd < 1.3) {
          explode(d.x, d.y, d.z, 3.2, d.dmg, d.owner, 0);
          burst(d.x, d.y, d.z, 0xffffff, 12);
          drones.splice(i, 1);
          continue;
        }
      }
      if (d.life <= 0) drones.splice(i, 1);
    }
    smileSnd -= dt;
    for (let i = smiles.length - 1; i >= 0; i--) {
      const s = smiles[i]!;
      s.life -= dt;
      s.vy -= 10 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      if (s.y < 0.3) {
        s.y = 0.3;
        s.vy = Math.abs(s.vy) * 0.6;
        s.vx *= 0.8;
        s.vz *= 0.8;
      }
      if (s.life <= 0) smiles.splice(i, 1);
    }
    if (smiles.length && smileSnd <= 0) {
      smileSnd = 0.7;
      audio.laughAt(smiles[0]!.x, smiles[0]!.y, smiles[0]!.z);
    }
    for (const d of dyn) {
      if (!d.alive) continue;
      if (d.kind === "turret") {
        d.cool -= dt;
        d.yaw += dt;
        const cx = (d.minX + d.maxX) / 2;
        const cy = d.maxY + 0.4;
        const cz = (d.minZ + d.maxZ) / 2;
        let foe: Actor | null = null;
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
          d.cool = 0.38;
          const dx = foe.x - cx;
          const dy = foe.y + 1 - cy;
          const dz = foe.z - cz;
          const L = Math.hypot(dx, dy, dz) || 1;
          const hit = trace(cx, cy, cz, dx / L, dy / L, dz / L, 28, foe);
          tracers.push({ x1: cx, y1: cy, z1: cz, x2: foe.x, y2: foe.y + 1, z2: foe.z, life: 0.06, max: 0.06, color: TEAMS[d.team as TeamId]!.hex });
          if (hit?.actor) hurt(hit.actor, 8, null, false);
        }
      }
      if (d.kind === "mine") {
        for (const a of actors) {
          if (a.state !== "live" || a.team === d.team) continue;
          if (Math.hypot(a.x - (d.minX + d.maxX) / 2, a.z - (d.minZ + d.maxZ) / 2) < 1.35) {
            explode((d.minX + d.maxX) / 2, d.maxY, (d.minZ + d.maxZ) / 2, 3.6, 50, -1, 0);
            d.alive = false;
          }
        }
      }
    }
    const counts = [0, 0, 0];
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
        line(`${TEAMS[team]!.name} holds the hill`, true);
      } else hillTime += dt;
      hillEmpty = 0;
      if (hillTime >= 10) {
        hillScore[team] += dt / 10;
      }
      if (hillTime >= 120 && !surged) {
        surged = true;
        boost = true;
        line(`${TEAMS[team]!.name} speed surge`, true);
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
      for (const a of actors) {
        if (a.team === hillOwner && a.state === "live" && Math.random() < 0.3) {
          parts.push({ x: a.x, y: a.y + 1.2, z: a.z, vx: 0, vy: 1.5, vz: 0, life: 0.6, max: 0.6, color: 0xb6ff6a });
        }
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]!;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 2 * dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (let i = tracers.length - 1; i >= 0; i--) {
      tracers[i]!.life -= dt;
      if (tracers[i]!.life <= 0) tracers.splice(i, 1);
    }
    for (const c of corpses) c.life -= dt;
    for (let i = corpses.length - 1; i >= 0; i--) if (corpses[i]!.life <= 0 || corpses[i]!.used) corpses.splice(i, 1);
    for (let i = actors.length - 1; i >= 0; i--) if (actors[i]!.state === "gone") actors.splice(i, 1);
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
      const cam = spectate ? fly : player || { x: 0, y: 10, z: 0 };
      if (parts.length < 300 && Math.random() < 0.8) {
        parts.push({
          x: cam.x + (Math.random() - 0.5) * 30,
          y: cam.y + 12,
          z: cam.z + (Math.random() - 0.5) * 30,
          vx: weather === "snow" ? 0.2 : -1,
          vy: weather === "snow" ? -2 : -14,
          vz: 0,
          life: 1.2,
          max: 1.2,
          color: weather === "snow" ? 0xffffff : 0x9fd4ff,
        });
      }
    }
    netAcc += dt;
    if (netAcc > 0.28 && token && player) {
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
      void netPulse({
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
          shots,
        })
        .then((res) => {
          if (!res.ok || !player) {
            player && (player.pendingXp += dxp);
            return;
          }
          player.xp = Math.max(player.xp, res.xp + player.pendingXp);
          syncHumans(res.humans);
          for (const s of res.shots) {
            if (seenShots.has(s.id) || !player) continue;
            seenShots.add(s.id);
            const t = sphereT(s.ox, s.oy, s.oz, s.dx, s.dy, s.dz, player.x, player.y + 0.9, player.z, 1.5, 80);
            if (t != null && s.team !== player.team) hurt(player, s.dmg, null, false);
            tracers.push({ x1: s.ox, y1: s.oy, z1: s.oz, x2: s.ox + s.dx * 20, y2: s.oy + s.dy * 20, z2: s.oz + s.dz * 20, life: 0.08, max: 0.08, color: TEAMS[s.team as TeamId]?.hex || 0xffffff });
          }
        })
        .catch(() => {
          if (player) player.pendingXp += dxp;
        });
    }
  }

  function syncHumans(humans: { nick: string; team: number; charId: string; x: number; y: number; z: number; yaw: number; hp: number; lvl: number }[]) {
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
          team: h.team as TeamId,
          charId: CHAR_BY_ID[h.charId] ? h.charId : "angel",
          remote: true,
          x: h.x,
          y: h.y,
          z: h.z,
          yaw: h.yaw,
          xp: h.lvl * 80,
          hp: h.hp,
        });
        actors.push(a);
      }
      a.tx = h.x;
      a.ty = h.y;
      a.tz = h.z;
      a.tyaw = h.yaw;
      a.hp = h.hp;
      a.team = h.team as TeamId;
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
      line(BUILD_ACTIONS[player.build]!.name);
    }
    was.jump = jump;
    was.act = act;
    was.cycle = cycle;
    shiftWas = held("ShiftLeft") || held("ShiftRight") || touch.dash;
    edges.slot = -1;
    for (let i = 0; i < 4; i++) if (held(`Digit${i + 1}`)) edges.slot = i;
  }
  let shiftWas = false;

  const humanMeshes = [bodyM, headM, hairM, hairBackM, hairLM, hairRM, handM, handRM, footM, footRM, haloM, blobM, skirtM, wingLM, wingRM, packM, gunM];
  function park(i: number) {
    for (const mesh of humanMeshes) pose(mesh, i, 0, -80, 0, 0, 0, 0, 0.001, 0.001, 0.001);
    pose(faceM, i, 0, -80, 0, 0, 0, 0, 0.001, 0.001, 0.001);
  }
  function drawMutant(i: number, a: Actor, x: number, y: number, z: number, down: boolean, flash: number) {
    const yaw = a.yaw;
    const face = yaw + Math.PI;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rxx = Math.cos(yaw);
    const rzz = -Math.sin(yaw);
    const sway = down ? 0 : Math.cos(a.anim) * 0.055;
    x += rxx * sway;
    z += rzz * sway;
    const step = Math.sin(a.anim);
    const bob = down ? 0 : Math.abs(Math.cos(a.anim)) * 0.05;
    const skin = a.kind === "mummy" ? 0xf4f0dc : a.kind === "necro" ? 0xd8ff9a : 0xc8f56a;
    const rag = a.kind === "mummy" ? 0xf7f1e4 : 0x6a7844;
    const boneC = 0xf0ead8;
    const wound = 0x3a2014;
    const hang = (pitch: number, len: number) => ({ y: -Math.cos(pitch) * len, f: Math.sin(pitch) * len });
    const bodyPitch = down ? 1.15 : 0.5 + step * 0.05;
    const bodyY = y + (down ? 0.32 : 0.84 + bob);
    poseYP(zBody, i, x + fx * 0.08, bodyY, z + fz * 0.08, bodyPitch, face, step * 0.09, 0.68, 0.5, 0.4);
    paint(zBody, i, rag, flash);
    poseYP(zHump, i, x - fx * 0.16, bodyY + 0.16, z - fz * 0.16, bodyPitch - 0.25, face, 0, 0.34, 0.26, 0.28);
    paint(zHump, i, skin, flash);
    poseYP(zSpike, i, x - fx * 0.2, bodyY + 0.12, z - fz * 0.2, bodyPitch - 0.9, face, 0, 0.06, 0.18, 0.06);
    paint(zSpike, i, boneC, flash);
    poseYP(zBump, i, x - fx * 0.18, bodyY - 0.02, z - fz * 0.18, bodyPitch - 0.45, face, 0, 0.09, 0.16, 0.09);
    paint(zBump, i, boneC, flash);
    poseYP(zRib, i, x + fx * 0.22, bodyY + 0.02, z + fz * 0.22, bodyPitch, face, 0, 0.42, 0.06, 0.1);
    paint(zRib, i, wound, flash);
    const neckY = y + (down ? 0.4 : 1.02 + bob);
    poseYP(zNeck, i, x + fx * 0.22, neckY, z + fz * 0.22, bodyPitch * 0.65, face, step * 0.1, 0.14, 0.16, 0.14);
    paint(zNeck, i, skin, flash);
    const headY = y + (down ? 0.48 : 1.24 + bob);
    const headPitch = down ? 0.85 : 0.36 + Math.sin(a.anim * 0.5) * 0.07;
    poseYP(zHead, i, x + fx * 0.34, headY, z + fz * 0.34, headPitch, face, step * 0.05, 0.5, 0.46, 0.48);
    paint(zHead, i, skin, flash);
    poseYP(zJaw, i, x + fx * 0.52, headY - 0.18, z + fz * 0.52, headPitch + 0.42 + Math.abs(step) * 0.12, face, 0, 0.22, 0.06, 0.16);
    paint(zJaw, i, 0x10200c, flash);
    poseYP(zBrow, i, x + fx * 0.56, headY + 0.1, z + fz * 0.56, headPitch - 0.2, face, 0, 0.4, 0.07, 0.1);
    paint(zBrow, i, 0x1a3010, flash);
    poseYP(zEye, i, 0, -80, 0, 0, 0, 0, 0.001, 0.001, 0.001);
    poseYP(zFace, i, x + fx * 0.6, headY - 0.02, z + fz * 0.6, headPitch, face, 0, down ? 0.001 : 0.5, down ? 0.001 : 0.54, 1);
    poseYP(zEarL, i, x + rxx * 0.27 + fx * 0.24, headY + 0.02, z + rzz * 0.27 + fz * 0.24, headPitch, face, 0.7, 0.06, 0.2, 0.04);
    paint(zEarL, i, skin, flash);
    poseYP(zEarR, i, x - rxx * 0.27 + fx * 0.24, headY + 0.02, z - rzz * 0.27 + fz * 0.24, headPitch, face, -0.7, 0.06, 0.2, 0.04);
    paint(zEarR, i, skin, flash);
    poseYP(zBand, i, x - fx * 0.02, bodyY + 0.04, z - fz * 0.02, bodyPitch, face, 0, 0.14, 0.09, 0.48);
    paint(zBand, i, TEAMS[a.team]!.hex, 0);

    const solve = (df: number, dy: number, L1: number, L2: number) => {
      let f = df;
      let d = dy;
      let dist = Math.hypot(f, d) || 0.001;
      const maxR = L1 + L2 - 0.02;
      if (dist > maxR) {
        const k = maxR / dist;
        f *= k;
        d *= k;
        dist = maxR;
      }
      const to = Math.atan2(f, -d);
      const cosA = Math.min(1, Math.max(-1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist || 1)));
      const bend = Math.acos(cosA);
      const upper = to + bend;
      const kF = Math.sin(upper) * L1;
      const kY = -Math.cos(upper) * L1;
      const lower = Math.atan2(f - kF, -(d - kY));
      return { upper, lower };
    };
    const span = (mesh: THREE.InstancedMesh, hx: number, hy: number, hz: number, pitch: number, len: number, sx: number, sy: number, sz: number, color: number) => {
      const mid = hang(pitch, len * 0.5);
      poseYP(mesh, i, hx + fx * mid.f, hy + mid.y, hz + fz * mid.f, Math.PI - pitch, face, 0, sx, sy, sz);
      paint(mesh, i, color, flash);
      const end = hang(pitch, len);
      return { x: hx + fx * end.f, y: hy + end.y, z: hz + fz * end.f };
    };

    const swipe = !down && a.cd > 0.45;
    const arm = (
      side: number,
      phase: number,
      upper: THREE.InstancedMesh,
      fore: THREE.InstancedMesh,
      hand: THREE.InstancedMesh,
      claw0: THREE.InstancedMesh,
      clawA: THREE.InstancedMesh,
      clawB: THREE.InstancedMesh,
      shoulder: THREE.InstancedMesh,
    ) => {
      const sx = x + rxx * 0.4 * side;
      const sy = y + (down ? 0.38 : 0.98 + bob);
      const sz = z + rzz * 0.4 * side;
      poseYP(shoulder, i, sx, sy + 0.06, sz, bodyPitch, face, side * 0.4, 0.22, 0.14, 0.2);
      paint(shoulder, i, a.kind === "mummy" ? rag : skin, flash);
      const lift = down ? 0 : Math.max(0, Math.cos(phase));
      let handF = down ? 0.05 : 0.06 + Math.sin(phase) * 0.4;
      let handY = down ? y + 0.08 : sy - 0.8 + lift * 0.18;
      if (swipe && side < 0) {
        handF = 0.72;
        handY = sy - 0.15;
      }
      const sol = solve(handF, handY - sy, 0.36, 0.34);
      const elbow = span(upper, sx, sy, sz, sol.upper, 0.36, 0.15, 0.36, 0.15, skin);
      const wrist = span(fore, elbow.x, elbow.y, elbow.z, sol.lower, 0.34, 0.12, 0.34, 0.12, skin);
      poseYP(hand, i, wrist.x, wrist.y, wrist.z, Math.PI - sol.lower, face, 0, 0.15, 0.11, 0.13);
      paint(hand, i, skin, flash);
      const claws = [clawA, claw0, clawB];
      for (let k = -1; k <= 1; k++) {
        const ox = wrist.x + rxx * side * k * 0.055;
        const oy = wrist.y;
        const oz = wrist.z + rzz * side * k * 0.055;
        span(claws[k + 1]!, ox, oy, oz, sol.lower + 0.25, 0.16, 0.035, 0.16, 0.03, boneC);
      }
    };
    arm(1, a.anim + Math.PI, zArmL, zForeL, zHandL, zClawL, zClawL2, zClawL3, zShoulderL);
    arm(-1, a.anim, zArmR, zForeR, zHandR, zClawR, zClawR2, zClawR3, zShoulderR);

    const leg = (side: number, phase: number, thigh: THREE.InstancedMesh, shin: THREE.InstancedMesh, foot: THREE.InstancedMesh) => {
      const hx = x + rxx * 0.15 * side;
      const hy = y + (down ? 0.18 : 0.56 + bob * 0.4);
      const hz = z + rzz * 0.15 * side;
      const lift = down ? 0 : Math.max(0, Math.cos(phase));
      const footF = down ? 0.05 : Math.sin(phase) * 0.32;
      const footY = down ? y + 0.05 : y + 0.05 + lift * 0.24;
      const sol = solve(footF, footY - hy, 0.34, 0.32);
      const knee = span(thigh, hx, hy, hz, sol.upper, 0.34, 0.17, 0.34, 0.17, skin);
      const ankle = span(shin, knee.x, knee.y, knee.z, sol.lower, 0.32, 0.13, 0.32, 0.13, a.kind === "necro" ? boneC : skin);
      poseYP(foot, i, ankle.x + fx * 0.08, Math.max(y + 0.04, ankle.y), ankle.z + fz * 0.08, down ? 1.15 : 0.12, face, 0, 0.16, 0.07, 0.3);
      paint(foot, i, 0x1a2c12, flash);
    };
    leg(1, a.anim, zLegL, zShinL, zFootL);
    leg(-1, a.anim + Math.PI, zLegR, zShinR, zFootR);

    const ragW = a.kind === "mummy" ? 1.35 : 0.9;
    const flap = (side: number, mesh: THREE.InstancedMesh, phase: number) => {
      const hx = x + rxx * 0.2 * side + fx * 0.02;
      const hy = y + (down ? 0.26 : 0.58);
      const hz = z + rzz * 0.2 * side + fz * 0.02;
      const p = down ? 1.15 : 0.28 + Math.sin(phase) * 0.5;
      span(mesh, hx, hy, hz, p, 0.4 * ragW, 0.12 * ragW, 0.4 * ragW, 0.04, rag);
    };
    flap(1, zRagL, a.anim);
    flap(-1, zRagR, a.anim + 1.4);
  }

  function render() {
    const c = clockParts();
    const t = ((c.hoursF - 6) / 24) * Math.PI * 2;
    const sunV = tmp.set(Math.cos(t), Math.sin(t), 0.25).normalize();
    const day = THREE.MathUtils.smoothstep(sunV.y, -0.25, 0.45);
    skyMat.color.setRGB(0.22 + day * 0.78, 0.28 + day * 0.72, 0.55 + day * 0.45);
    hemi.intensity = 0.28 + day * 0.4;
    hemi.color.set(day > 0.4 ? 0xcfe6ff : 0x223044);
    sun.intensity = 0.35 + day * 1.35;
    sun.position.copy(sunV).multiplyScalar(70);
    sunDisc.position.copy(sunV).multiplyScalar(300);
    (sunDisc.material as THREE.MeshBasicMaterial).color.set(day > 0.25 ? 0xfff3b0 : 0xffb07a);
    clouds.position.x = Math.sin(performance.now() / 8000) * 6;
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
    const fog = scene.fog as THREE.Fog;
    fog.color.set(day > 0.35 ? 0x8ec4ee : 0x1a2744);
    fog.near = weather === "rain" ? 70 : 130;
    fog.far = weather === "rain" ? 220 : 380;
    const tr = trainPose(trainAng);
    train.position.set(tr.x, tr.y + 0.4, tr.z);
    train.rotation.y = -trainAng;
    flags.forEach((f, i) => {
      const pole = flagMeshes[i * 2]!;
      const cloth = flagMeshes[i * 2 + 1]!;
      pole.position.set(f.x, f.y + 0.4, f.z);
      cloth.position.set(f.x + 0.6, f.y + 1.1, f.z);
      cloth.rotation.y = performance.now() / 400 + i;
    });
    world.meds.forEach((m, i) => {
      const up = medState[i]! <= 0;
      mat.compose(pos.set(m.x, up ? m.y + 0.7 + Math.sin(performance.now() / 300 + i) * 0.08 : -20, m.z), quat.identity(), scl.set(up ? 1 : 0.01, up ? 1 : 0.01, up ? 1 : 0.01));
      medBox.setMatrixAt(i, mat);
      col.setHex(0xff5a68);
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

    const draw: { a: Actor | null; corpse?: Corpse }[] = [];
    for (const a of actors) if (a.state !== "gone") draw.push({ a });
    for (const c of corpses) if (!c.used) draw.push({ a: null, corpse: c });
    const n = Math.min(MAX, draw.length);
    let zi = 0;
    for (let i = 0; i < n; i++) {
      const slot = draw[i]!;
      const a = slot.a;
      const corpse = slot.corpse;
      const ch = CHAR_BY_ID[(a?.charId || corpse?.charId || "angel")] || CHARACTERS[0]!;
      const team = a?.team ?? (corpse?.team as TeamId) ?? 0;
      const x = a?.x ?? corpse!.x;
      const y = a?.y ?? corpse!.y;
      const z = a?.z ?? corpse!.z;
      const face = (a?.yaw ?? 0) + Math.PI;
      const down = a?.state === "down" || !!corpse;
      const sheep = (a?.sheep || 0) > 0;
      const flash = a?.flash || 0;
      const gray = !!corpse || (a?.hp === 0 && a?.state !== "down");
      if (a?.minion) {
        park(i);
        if (zi < ZMAX) drawMutant(zi++, a, x, y, z, down, flash);
        continue;
      }
      const swing = a ? Math.sin(a.anim) * (a.grounded ? 0.7 : 0.2) : 0;
      const bob = a && a.grounded ? Math.abs(Math.sin(a.anim)) * 0.06 : 0;
      const roll = a ? (a.roll > 0 ? (1 - a.roll / 0.48) * Math.PI * 2 : 0) : 0;
      const rx = down ? 1.25 : roll;
      const hy = down ? 0.4 : 0;
      const look = lookOf(ch);
      const yaw = a?.yaw ?? 0;
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const rxx = -Math.cos(face);
      const rzz = Math.sin(face);
      const sc = (ch.style === "round" || sheep ? 1.15 : look.petite) * (a?.flat ? 1.15 : 1);
      const human = sheep ? 0.001 : 1;
      const cloth = gray ? 0x8a8a8a : sheep ? 0xfff6ea : a?.minion ? 0x6d8a62 : ch.cloth;
      const skin = gray ? 0x9a9a9a : ch.skin;
      const hair = gray ? 0x777777 : ch.hair;
      const bodyY = y + (down ? 0.45 : 1.02 + bob);
      const headY = y + (down ? 0.72 : 1.58 + bob) + hy;
      pose(bodyM, i, x, bodyY, z, rx, face, 0, 0.52 * sc * (a?.flat ? 1.25 : 1), (down ? 0.36 : 0.58) * (sheep ? 0.85 : 1) * (a?.flat ? 0.4 : 1), 0.36 * sc);
      paint(bodyM, i, cloth, flash);
      const headS = sheep || ch.style === "round" ? 0.78 : ch.style === "doll" || ch.style === "goth" ? 0.62 : 0.56;
      pose(headM, i, x, headY, z, 0, face, 0, headS, headS * (ch.style === "doll" ? 1.05 : 1), headS);
      paint(headM, i, sheep ? 0xfff6ea : skin, flash);
      const bang = look.bangs;
      pose(hairM, i, x + fx * 0.16, headY + 0.16, z + fz * 0.16, down ? 0.6 : 0, face, 0, bang[0] * human, bang[1] * human, bang[2] * human);
      paint(hairM, i, hair, flash);
      const hb = look.hair;
      pose(hairBackM, i, x - fx * 0.2, headY + hb[3], z - fz * 0.2, down ? 1.1 : 0, face, 0, hb[0] * human, hb[1] * human, hb[2] * human);
      paint(hairBackM, i, hair, flash);
      const ps = Math.max(0.001, look.puff * human);
      pose(hairLM, i, x + rxx * look.puffX, headY + look.puffY, z + rzz * look.puffX, 0, face, 0, ps, ps, ps);
      paint(hairLM, i, hair, flash);
      pose(hairRM, i, x - rxx * look.puffX, headY + look.puffY, z - rzz * look.puffX, 0, face, 0, ps, ps, ps);
      paint(hairRM, i, hair, flash);
      const sk = Math.max(0.001, look.skirt * human);
      pose(skirtM, i, x, y + (down ? 0.28 : 0.58), z, down ? 1.2 : 0, face, 0, 0.92 * sk, down ? 0.12 : 0.34 * Math.min(sk, 1), 0.66 * sk);
      paint(skirtM, i, gray ? 0x8a8a8a : look.skirtColor || cloth, flash);
      const ws = look.wings > 0 && !sheep && !gray ? look.wings : 0.001;
      const flap = Math.sin(performance.now() / 160 + i) * 0.45;
      pose(wingLM, i, x + rxx * 0.32 - fx * 0.12, bodyY + 0.28, z + rzz * 0.32 - fz * 0.12, 0.15 + flap * 0.35, face, 0.35, 0.05 * ws, 0.28 * ws, 0.62 * ws);
      paint(wingLM, i, look.wingColor, 0);
      pose(wingRM, i, x - rxx * 0.32 - fx * 0.12, bodyY + 0.28, z - rzz * 0.32 - fz * 0.12, 0.15 + flap * 0.35, face, -0.35, 0.05 * ws, 0.28 * ws, 0.62 * ws);
      paint(wingRM, i, look.wingColor, 0);
      const pk = look.pack > 0 && !sheep ? look.pack : 0.001;
      pose(packM, i, x - fx * 0.28, bodyY + 0.08, z - fz * 0.28, 0, face, 0, 0.36 * pk, 0.42 * pk, 0.22 * pk);
      paint(packM, i, look.packColor, flash);
      const wid = a ? loadout(ch)[a.weapon % loadout(ch).length] || "plasma" : "plasma";
      const gunLen = wid === "sniper" || wid === "rocket" ? 0.72 : wid === "knife" || wid === "melee" ? 0.28 : 0.46;
      const showGun = !down && !sheep && !gray;
      pose(gunM, i, x + rxx * 0.48 + fx * 0.28, bodyY + Math.sin(swing) * 0.12, z + rzz * 0.48 + fz * 0.28, -0.2, face, 0, showGun ? 0.1 : 0.001, showGun ? 0.1 : 0.001, showGun ? gunLen : 0.001);
      paint(gunM, i, wid === "flame" ? 0xff6a3d : wid === "sniper" ? 0xd7e7c4 : 0x8ea0b8, flash);
      pose(handM, i, x + rxx * 0.4, y + (down ? 0.4 : 1.02) + Math.sin(swing) * 0.2, z + rzz * 0.4, swing, face, 0, down || sheep ? 0.001 : 0.32, 0.32, 0.32);
      paint(handM, i, TEAMS[team]!.hex, flash);
      pose(handRM, i, x - rxx * 0.4, y + (down ? 0.38 : 1.05) - Math.sin(swing) * 0.2, z - rzz * 0.4, -swing, face, 0, down || sheep ? 0.001 : 0.32, 0.32, 0.32);
      paint(handRM, i, skin, flash);
      pose(footM, i, x + rxx * 0.16, y + (down ? 0.15 : 0.14 + Math.max(0, -Math.sin(swing)) * 0.1), z + rzz * 0.16, -swing, face, 0, down ? 0.001 : 0.32, 0.16, 0.46);
      paint(footM, i, ch.ability === "shadow" ? 0x111018 : 0x2a241c, flash);
      pose(footRM, i, x - rxx * 0.16, y + (down ? 0.15 : 0.14 + Math.max(0, Math.sin(swing)) * 0.1), z - rzz * 0.16, swing, face, 0, down ? 0.001 : 0.32, 0.16, 0.46);
      paint(footRM, i, ch.ability === "shadow" ? 0x111018 : 0x2a241c, flash);
      const halo = ch.ability === "glide" && !gray && !down && !sheep;
      pose(haloM, i, x, headY + 0.55, z, Math.PI / 2.4, performance.now() / 900, 0, halo ? 1.05 : 0.001, halo ? 1.05 : 0.001, halo ? 1.05 : 0.001);
      paint(haloM, i, 0xffe98a, 0);
      const faceS = sheep || gray ? 0.001 : down ? 0.55 : headS * 0.92;
      pose(faceM, i, x + fx * (headS * 0.42), headY + 0.02, z + fz * (headS * 0.42), down ? 0.5 : 0, face, 0, faceS, faceS * 1.08, 1);
      pose(blobM, i, x, y + 0.06, z, -Math.PI / 2, 0, 0, 0.85, 0.85, 0.85);
      paint(blobM, i, 0x000000, 0);
    }
    for (const mesh of [bodyM, headM, hairM, hairBackM, hairLM, hairRM, handM, handRM, footM, footRM, haloM, blobM, skirtM, wingLM, wingRM, packM, gunM]) {
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    faceM.count = n;
    faceM.instanceMatrix.needsUpdate = true;
    for (const mesh of [zBody, zHump, zHead, zJaw, zArmL, zArmR, zForeL, zForeR, zHandL, zHandR, zClawL, zClawR, zClawL2, zClawR2, zClawL3, zClawR3, zLegL, zLegR, zShinL, zShinR, zFootL, zFootR, zNeck, zBrow, zEarL, zEarR, zRib, zSpike, zBump, zBand, zShoulderL, zShoulderR, zRagL, zRagR]) {
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
      col.setHex(b.kind === "rocket" ? 0xff6a3d : b.kind === "laugh" ? 0xffe14a : 0x7af0ff);
      ballM.setColorAt(i, col);
    });
    ballM.count = Math.min(40, balls.length);
    ballM.instanceMatrix.needsUpdate = true;
    if (ballM.instanceColor) ballM.instanceColor.needsUpdate = true;
    drones.forEach((d, i) => {
      if (i >= 16) return;
      mat.compose(pos.set(d.x, d.y, d.z), quat.identity(), scl.set(1, 1, 1));
      droneM.setMatrixAt(i, mat);
      col.setHex(0x222a33);
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
    (tGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (tGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
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
    (pGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (pGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;

    const w = view.clientWidth || 1;
    const h = view.clientHeight || 1;
    if (camera.aspect !== w / h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if (spectate) {
      camera.position.set(fly.x, fly.y, fly.z);
      camera.lookAt(
        fly.x - Math.sin(fly.yaw) * Math.cos(fly.pitch),
        fly.y + Math.sin(fly.pitch),
        fly.z - Math.cos(fly.yaw) * Math.cos(fly.pitch),
      );
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
      let cx = player.x - lx * dist + rx * 0.65;
      let cyw = lookYh - ly * dist + 0.45;
      let cz = player.z - lz * dist + rz * 0.65;
      const dx = cx - player.x;
      const dy = cyw - lookYh;
      const dz = cz - player.z;
      const len = Math.hypot(dx, dy, dz) || 1;
      const block = rayAll(player.x, lookYh, player.z, dx / len, dy / len, dz / len, len);
      if (block && block.t < len) {
        cx = player.x + (dx / len) * Math.max(0.6, block.t - 0.3);
        cyw = lookYh + (dy / len) * Math.max(0.6, block.t - 0.3);
        cz = player.z + (dz / len) * Math.max(0.6, block.t - 0.3);
      }
      const bob = player.grounded ? Math.sin(player.anim * 2) * 0.04 : 0;
      camera.position.set(cx + (Math.random() - 0.5) * shake, cyw + bob + (Math.random() - 0.5) * shake, cz);
      camera.lookAt(player.x, lookYh, player.z);
      const fov = scope ? 18 : 74;
      if (camera.fov !== fov) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      shake *= 0.9;
      const id = loadout(charOf(player))[player.weapon] || "plasma";
      if (id !== gunId) {
        gunId = id;
        gun.clear();
        const matG = new THREE.MeshBasicMaterial({ color: id === "flame" ? 0xff6a3d : 0x9aa7bd });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.7), matG);
        body.position.set(0.32, -0.24, -0.55);
        gun.add(body);
        if (id === "dual" || id === "sniper") {
          const b2 = new THREE.Mesh(new THREE.BoxGeometry(id === "sniper" ? 0.08 : 0.16, 0.14, id === "sniper" ? 1.05 : 0.55), matG);
          b2.position.set(id === "dual" ? 0.12 : 0.34, -0.22, id === "sniper" ? -0.85 : -0.5);
          gun.add(b2);
        }
      }
      gun.visible = !scope;
      viewCam.aspect = w / h;
      viewCam.fov = camera.fov;
      viewCam.updateProjectionMatrix();
    } else {
      const tt = performance.now() / 1000;
      const ang = tt * 0.07;
      camera.position.set(Math.sin(ang) * 46, 26, Math.cos(ang) * 46);
      camera.lookAt(0, 7, -6);
      gun.visible = false;
    }
    renderer.setSize(w, h, false);
    audio.setListener(camera.position.x, camera.position.y, camera.position.z);
    renderer.render(scene, camera);
    drawOverlay(w, h);
  }

  function drawOverlay(w: number, h: number) {
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
      hitMark -= 0.016;
    }
    if (scope) {
      ctx.fillStyle = "rgba(6,8,10,0.62)";
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.arc(cx, cy, Math.min(w, h) * 0.28, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.strokeStyle = "rgba(198,227,90,0.85)";
      ctx.stroke();
    }
    if (player.hp < 40 && player.state === "live") {
      const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.min(w, h) * 0.7);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(120,20,24,0.45)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    for (const slot of actors.concat([])) {
      if (slot.state === "gone") continue;
      tmp.set(slot.x, slot.y + 2.15, slot.z).project(camera);
      if (tmp.z > 1) continue;
      const sx = (tmp.x * 0.5 + 0.5) * w;
      const jitter = ((slot.name.charCodeAt(0) + slot.name.length * 3) % 5) * 4;
      const sy = (-tmp.y * 0.5 + 0.5) * h - jitter;
      if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue;
      const rank = rankForLevel(xpToLevel(slot.xp).lvl);
      const lvl = xpToLevel(slot.xp).lvl;
      ctx.font = "600 12px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = TEAMS[slot.team]!.color;
      const label = `${rank.id}  ${slot.name}  ${lvl}`;
      ctx.fillText(label, sx, sy);
      const bw = 64;
      const hp = clamp(slot.hp / 100, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(sx - bw / 2, sy + 4, bw, 5);
      ctx.fillStyle = slot.state === "down" ? "#111" : hp > 0.6 ? "#7dce4a" : hp > 0.3 ? "#f0a040" : "#e04b4b";
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
    if (!spectate) drawWeaponWheel(ctx, w, h);
    drawMini(ctx, w, h);
  }

  function drawWeaponWheel(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!player) return;
    const list = loadout(charOf(player));
    const n = list.length;
    if (!n) return;
    const sel = ((player.weapon % n) + n) % n;
    let delta = sel - wheelShown;
    if (delta > n / 2) delta -= n;
    if (delta < -n / 2) delta += n;
    wheelShown += delta * 0.22;
    if (Math.abs(delta) < 0.01) wheelShown = sel;
    gunKick *= 0.86;
    const cx = w / 2;
    const cy = h - 168;
    const t = performance.now() / 1000;
    for (let i = 0; i < n; i++) {
      let off = i - wheelShown;
      if (off > n / 2) off -= n;
      if (off < -n / 2) off += n;
      if (Math.abs(off) > 2.2) continue;
      const near = Math.abs(off) < 0.35;
      const scale = (near ? 1.2 : 0.62) - Math.abs(off) * 0.08;
      const x = cx + off * 86;
      const y = cy + Math.abs(off) * 10 - (near ? Math.sin(t * 7) * 3 + gunKick * 14 : 0);
      drawWeaponIcon(ctx, list[i] || "plasma", x, y, scale, off * 0.42, near);
      ctx.font = "700 11px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1a140c";
      ctx.fillStyle = near ? "#ffe14a" : "#f4f1e4";
      const num = String((i % 4) + 1);
      ctx.strokeText(num, x, y + 28 * Math.max(scale, 0.5));
      ctx.fillText(num, x, y + 28 * Math.max(scale, 0.5));
    }
    const name = WEAPON_BY_ID[list[sel] || "plasma"]!.name;
    ctx.font = "700 18px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1a140c";
    ctx.fillStyle = "#fff6e4";
    ctx.strokeText(name, cx, cy - 46);
    ctx.fillText(name, cx, cy - 46);
  }

  function drawWeaponIcon(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, s: number, tilt: number, hot: boolean) {
    ctx.save();
    ctx.translate(x, y + (hot ? 0 : 4));
    ctx.rotate(tilt);
    ctx.scale(s, s);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#1a140c";
    ctx.fillStyle = hot ? "#fff6e4" : "#d9d3c4";
    const accent = id === "flame" ? "#ff6a3d" : id === "rocket" ? "#ff5a68" : id === "sniper" ? "#c6e35a" : id === "laugh" ? "#ffe14a" : id === "bounce" ? "#3ec6ff" : "#7ec8ff";
    const mark = () => {
      ctx.fill();
      ctx.stroke();
    };
    if (id === "dual") {
      ctx.save();
      ctx.translate(-8, 2);
      ctx.rotate(-0.4);
      ctx.fillRect(-4, -3, 16, 7);
      ctx.strokeRect(-4, -3, 16, 7);
      ctx.fillRect(8, -2, 8, 4);
      ctx.strokeRect(8, -2, 8, 4);
      ctx.restore();
      ctx.save();
      ctx.translate(6, 6);
      ctx.rotate(0.35);
      ctx.fillRect(-4, -3, 16, 7);
      ctx.strokeRect(-4, -3, 16, 7);
      ctx.fillRect(8, -2, 8, 4);
      ctx.strokeRect(8, -2, 8, 4);
      ctx.restore();
    } else if (id === "sniper") {
      ctx.fillRect(-18, -3, 34, 6);
      ctx.strokeRect(-18, -3, 34, 6);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(4, -7, 5, 0, Math.PI * 2);
      mark();
      ctx.fillStyle = "#fff6e4";
      ctx.fillRect(14, -2, 10, 4);
      ctx.strokeRect(14, -2, 10, 4);
    } else if (id === "rocket") {
      ctx.fillRect(-16, -5, 26, 10);
      ctx.strokeRect(-16, -5, 26, 10);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(10, -7);
      ctx.lineTo(22, 0);
      ctx.lineTo(10, 7);
      ctx.closePath();
      mark();
      ctx.fillStyle = "#fff6e4";
      ctx.fillRect(-18, -8, 6, 4);
      ctx.strokeRect(-18, -8, 6, 4);
      ctx.fillRect(-18, 4, 6, 4);
      ctx.strokeRect(-18, 4, 6, 4);
    } else if (id === "bounce") {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      mark();
      ctx.fillStyle = "#fff6e4";
      ctx.fillRect(-12, -3, 24, 6);
      ctx.strokeRect(-12, -3, 24, 6);
    } else if (id === "laugh") {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      mark();
      ctx.fillStyle = "#1a140c";
      ctx.beginPath();
      ctx.arc(-4, -2, 1.6, 0, Math.PI * 2);
      ctx.arc(4, -2, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 2, 5, 0.15, Math.PI - 0.15);
      ctx.stroke();
    } else if (id === "flame") {
      ctx.fillRect(-3, 2, 6, 14);
      ctx.strokeRect(-3, 2, 6, 14);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.quadraticCurveTo(12, -2, 0, 6);
      ctx.quadraticCurveTo(-12, -2, 0, -16);
      mark();
    } else if (id === "knife") {
      ctx.fillStyle = "#e7eef2";
      ctx.beginPath();
      ctx.moveTo(-4, 8);
      ctx.lineTo(2, -16);
      ctx.lineTo(6, 8);
      ctx.closePath();
      mark();
      ctx.fillStyle = "#8a5a32";
      ctx.fillRect(-3, 8, 8, 8);
      ctx.strokeRect(-3, 8, 8, 8);
    } else if (id === "melee" || id === "bat") {
      ctx.rotate(-0.6);
      ctx.fillStyle = "#e7c48a";
      ctx.beginPath();
      ctx.roundRect(-4, -16, 8, 28, 4);
      mark();
      ctx.fillStyle = "#8a5a32";
      ctx.fillRect(-3, 10, 6, 8);
      ctx.strokeRect(-3, 10, 6, 8);
    } else if (id === "drone") {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      mark();
      for (const [dx, dy] of [[-10, -8], [10, -8], [-10, 8], [10, 8]] as [number, number][]) {
        ctx.fillStyle = "#fff6e4";
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        mark();
      }
    } else {
      ctx.fillRect(-14, -4, 22, 8);
      ctx.strokeRect(-14, -4, 22, 8);
      ctx.fillStyle = accent;
      ctx.fillRect(6, -3, 12, 5);
      ctx.strokeRect(6, -3, 12, 5);
      ctx.fillStyle = "#fff6e4";
      ctx.fillRect(-6, 4, 5, 8);
      ctx.strokeRect(-6, 4, 5, 8);
    }
    ctx.restore();
  }

  function drawMini(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!player) return;
    const R = Math.min(68, w * 0.11);
    const cx = w - 18 - R;
    const cy = Math.min(h * 0.36, h - 240);
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
    const blot = (x: number, z: number, color: string, rad: number) => {
      const dx = x - player!.x;
      const dz = z - player!.z;
      const localR = dx * rx + dz * rz;
      const localF = dx * fx + dz * fz;
      const dist = Math.hypot(localR, localF);
      let px = localR;
      let py = localF;
      if (dist > 40) {
        px = (localR / dist) * 40;
        py = (localF / dist) * 40;
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx + px * scale, cy - py * scale, rad, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const f of flags) blot(f.x, f.z, TEAMS[f.team]!.color, 4);
    blot(0, 0, "#ffe14a", 3);
    for (const a of actors) {
      if (a === player || a.state === "gone") continue;
      const dx = a.x - player.x;
      const dz = a.z - player.z;
      const dist = Math.hypot(dx, dz);
      blot(a.x, a.z, a.state === "down" ? "#111" : TEAMS[a.team]!.color, dist > 40 ? 3 : 4);
      if (dist < 22) {
        const localR = dx * rx + dz * rz;
        const localF = dx * fx + dz * fz;
        ctx.fillStyle = TEAMS[a.team]!.color;
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

  function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = "rgba(10,12,8,0.72)";
    ctx.fillRect(0, 0, w, h);
    const s = Math.min(w, h) * 0.36;
    const cx = w / 2;
    const cy = h / 2;
    const project = (x: number, z: number) => ({ x: cx + (x / 120) * s, y: cy + (z / 120) * s });
    ctx.strokeStyle = "rgba(244,241,228,0.25)";
    ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const x = -100 + i * 10;
      const p = project(x, 8 + Math.sin(x * 0.045) * 7);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "rgba(62,198,255,0.7)";
    ctx.stroke();
    for (const f of flags) {
      const p = project(f.x, f.z);
      ctx.fillStyle = TEAMS[f.team]!.color;
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
      ctx.fillStyle = a.state === "down" ? "#111" : TEAMS[a.team]!.color;
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

  function blankHud(): HudState {
    return {
      phase: "attract",
      locked: false,
      hp: 100,
      maxHp: 100,
      weapon: "Plasma Rifle",
      action: "Signature",
      cd: 0,
      teams: TEAMS.map((t) => ({ name: t.name, color: t.color, caps: 0, hill: 0 })),
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
      sens: 0.0022,
      volume: 0.7,
      now: 0,
      build: "Signature",
      score: false,
      map: false,
      console: false,
      menu: false,
      spectate: false,
    };
  }

  function emit() {
    pumpBanner();
    const c = clockParts();
    const rows = actors
      .filter((a) => a.state !== "gone")
      .map((a) => ({
        team: a.team,
        name: a.name,
        lvl: xpToLevel(a.xp).lvl,
        rank: rankForLevel(xpToLevel(a.xp).lvl).id,
        k: a.kills,
        d: a.deaths,
        xp: Math.floor(a.xp),
        me: a === player,
      }));
    const weapon = player ? WEAPON_BY_ID[loadout(charOf(player))[player.weapon] || "plasma"]!.name : "Plasma Rifle";
    hud = {
      phase: playing ? "play" : "attract",
      locked: document.pointerLockElement === view,
      hp: player ? Math.ceil(player.hp) : 100,
      maxHp: 100,
      weapon,
      action: player ? BUILD_ACTIONS[player.build]?.name || "Signature" : "Signature",
      cd: player ? player.abilityCd : 0,
      teams: TEAMS.map((t) => ({ name: t.name, color: t.color, caps: caps[t.id] || 0, hill: Math.floor(hillScore[t.id] || 0) })),
      hillText: hillOwner < 0 ? "Hill open" : `${TEAMS[hillOwner]!.name} ${Math.floor(hillTime)}s${boost ? " · surge" : ""}`,
      boost,
      feed: feed.slice(-5),
      log: log.slice(-40),
      banner: banner,
      rows,
      time: `${String(c.hours).padStart(2, "0")}:${String(c.mins).padStart(2, "0")}`,
      date: c.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
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
      spectate,
    };
    for (const s of subs) s();
  }

  function applyQuality(q: Quality) {
    quality = q;
    const pr = q === "low" ? 0.8 : q === "high" ? Math.min(1.6, window.devicePixelRatio || 1) : 1;
    renderer.setPixelRatio(pr);
    renderer.shadowMap.enabled = false;
    sun.castShadow = false;
    flowerM.count = q === "low" ? Math.min(40, world.flowers.length) : world.flowers.length;
    grassM.count = q === "low" ? Math.min(30, world.grass.length) : world.grass.length;
  }

  function onKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.repeat) return;
    keys.add(e.code);
    if (playing && (e.code === "Tab" || e.code === "Space")) e.preventDefault();
    const now = performance.now() / 1000;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE"].includes(e.code)) {
      if (now - (tapAt[e.code] || -10) < 0.28) {
        queuedDash = {
          f: e.code === "KeyW" ? 1 : e.code === "KeyS" ? -1 : 0,
          s: e.code === "KeyD" ? 1 : e.code === "KeyA" ? -1 : e.code === "KeyE" ? 1 : e.code === "KeyQ" ? -1 : 0,
        };
      }
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
    } else if (e.code === "KeyV") {
      toggleSpectate();
    }
  }
  let showScore = false;
  let showConsole = false;
  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.code);
  }
  function onMouse(e: MouseEvent) {
    if (document.pointerLockElement !== view) return;
    lookX += e.movementX;
    lookY += e.movementY;
    touch.lookX += e.movementX;
  }
  function onDown(e: MouseEvent) {
    if (e.button === 0) mouseFire = true;
    if (e.button === 2) mouseScope = true;
  }
  function onUp(e: MouseEvent) {
    if (e.button === 0) mouseFire = false;
    if (e.button === 2) mouseScope = false;
  }
  function onLock() {
    emit();
  }
  function onWheel(e: WheelEvent) {
    if (!player || menu) return;
    const len = loadout(charOf(player)).length;
    player.weapon = (player.weapon + (e.deltaY > 0 ? 1 : len - 1)) % len;
  }
  function onClick() {
    audio.unlock();
    if (!playing || menu || showMap || showScore || showConsole) return;
    if (document.pointerLockElement !== view) {
      const req = view.requestPointerLock as (o?: { unadjustedMovement?: boolean }) => Promise<void> | void;
      try {
        const ret = req.call(view, { unadjustedMovement: true });
        if (ret && typeof (ret as Promise<void>).catch === "function") void (ret as Promise<void>).catch(() => view.requestPointerLock());
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
    if (!Number.isFinite(dt) || dt < 0) dt = 0.016;
    dt = Math.min(0.05, dt);
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
    if (uiAcc > 0.12) {
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
      fly.pitch = -0.28;
      line("Spectator camera. Sounds fade as you fly off.");
    } else line("Back on your pilot.");
    emit();
  }

  function installProbe() {
    if (!(import.meta.env.DEV || qa)) return;
    window.__controlsTest = {
      getYaw: () => (player ? player.yaw : yaw),
      getSpeed: () => (player ? Math.hypot(player.vx, player.vz) : 0),
      setKeys: (codes: string[]) => {
        qaKeys = codes;
      },
      getPos: () => ({ x: player?.x || 0, y: player?.y || 0, z: player?.z || 0 }),
      getRight: () => {
        const y = player?.yaw || 0;
        return { x: Math.cos(y), z: -Math.sin(y) };
      },
      getMinion: () => {
        let m: Actor | null = null;
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
        return { id: m.id, x: m.x, z: m.z, yaw: m.yaw, speed: best };
      },
      getMinions: () =>
        actors
          .filter((a) => a.minion && a.state === "live")
          .map((a) => ({ id: a.id, x: a.x, z: a.z, yaw: a.yaw, speed: Math.hypot(a.vx, a.vz) })),
      toggleSpectate: () => toggleSpectate(),
      getFly: () => ({ x: fly.x, y: fly.y, z: fly.z, yaw: fly.yaw, pitch: fly.pitch, on: spectate }),
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
    deploy(info: { nick: string; team: number; charId: string; token: string; xp: number; qa?: boolean }) {
      if (player) return;
      token = info.token;
      qa = !!info.qa || opts.qa;
      const spots = world.spawns.filter((s) => s.team === info.team);
      const s = spots[0] || world.spawns[0]!;
      const ch = CHAR_BY_ID[info.charId] ? info.charId : "angel";
      player = makeActor({
        id: 1,
        name: info.nick,
        team: info.team as TeamId,
        charId: ch,
        bot: false,
        x: qa ? world.qa.x : s.x,
        y: qa ? world.qa.y : s.y,
        z: qa ? world.qa.z : s.z,
        yaw: qa ? world.qa.yaw : s.yaw,
        xp: info.xp,
      });
      actors.push(player);
      yaw = player.yaw;
      playing = true;
      globalCall(`${info.nick} joined ${TEAMS[info.team]!.name}.`);
      globalCall("Instructor: Steal an enemy flag and bring it home. Guard your own.");
      globalCall("Instructor: Hold the yellow hill in the center for two minutes. Your team then runs faster.");
      installProbe();
      if (qa) {
        const kinds = ["voodoo", "mummy", "necro"];
        for (let i = 0; i < 3; i++) {
          const m = makeActor({
            name: i === 1 ? "Wrapmutant" : i === 2 ? "Bonemutant" : "Mutant",
            team: i as TeamId,
            charId: "bone",
            bot: true,
            minion: true,
            kind: kinds[i],
            x: world.qa.x + (i - 1) * 1.45,
            y: world.qa.y,
            z: world.qa.z + 2.1,
            yaw: Math.PI,
            hp: 80,
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
    subscribe(fn: () => void) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    getHud: () => hud,
    setQuality(q: Quality) {
      applyQuality(q);
      emit();
    },
    setVolume(v: number) {
      volume = v;
      audio.setVolume(v);
    },
    setSens(v: number) {
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
    setMenu(v: boolean) {
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
    setTouch(t: TouchState) {
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
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen?.();
    },
    pushLine(s: string) {
      line(s);
      emit();
    },
    pushAnnounce(s: string) {
      line(s, true);
      emit();
    },
    failed: failWebgl,
  };

  onResize();
  return api;
}

export type GameHandle = ReturnType<typeof createGame>;

function buildLogo(scene: THREE.Scene) {
  const group = new THREE.Group();
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(15.5, 5.6, 0.55), new THREE.MeshLambertMaterial({ color: 0x2c3a18 }));
  group.add(plaque);
  const word = "MOUNT DEW";
  let cursor = -6.2;
  const yellow = new THREE.MeshLambertMaterial({ color: 0xffe14a });
  const green = new THREE.MeshLambertMaterial({ color: 0xc6e35a });
  for (const ch of word) {
    if (ch === " ") {
      cursor += 0.7;
      continue;
    }
    const rows = GLYPH[ch];
    if (!rows) continue;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== "1") continue;
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.22), (x + y) % 2 ? yellow : green);
        cube.position.set(cursor + x * 0.3, 1.7 - y * 0.3, 0.38);
        group.add(cube);
      }
    });
    cursor += 1.7;
  }
  group.position.set(0, 8.1, -61.2);
  group.rotation.y = Math.PI;
  scene.add(group);
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      getPos: () => { x: number; y: number; z: number };
      getRight: () => { x: number; z: number };
      getMinion?: () => { id?: number; x: number; z: number; yaw: number; speed: number } | null;
      getMinions?: () => { id: number; x: number; z: number; yaw: number; speed: number }[];
      toggleSpectate?: () => void;
      getFly?: () => { x: number; y: number; z: number; yaw: number; pitch: number; on: boolean };
    };
  }
}
