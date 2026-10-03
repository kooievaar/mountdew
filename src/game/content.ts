export type TeamId = 0 | 1 | 2;

export type TeamDef = {
  id: TeamId;
  name: string;
  short: string;
  color: string;
  hex: number;
  base: [number, number];
};

export const TEAMS: TeamDef[] = [
  { id: 0, name: "Citrus", short: "CIT", color: "#c6e35a", hex: 0xc6e35a, base: [0, -88] },
  { id: 1, name: "Voltage", short: "VLT", color: "#3ec6ff", hex: 0x3ec6ff, base: [-76, 44] },
  { id: 2, name: "Code Red", short: "RED", color: "#ff5a68", hex: 0xff5a68, base: [76, 44] },
];

export type WeaponKind = "trace" | "rocket" | "bounce" | "laugh" | "flame" | "melee" | "drone";

export type WeaponDef = {
  id: string;
  name: string;
  kind: WeaponKind;
  dmg: number;
  head: number;
  cd: number;
  speed: number;
  auto: boolean;
};

export const WEAPONS: WeaponDef[] = [
  { id: "plasma", name: "Plasma Rifle", kind: "trace", dmg: 11, head: 18, cd: 0.11, speed: 0, auto: true },
  { id: "dual", name: "Twin Popguns", kind: "trace", dmg: 16, head: 26, cd: 0.18, speed: 0, auto: false },
  { id: "sniper", name: "Glass Rifle", kind: "trace", dmg: 72, head: 140, cd: 0.95, speed: 0, auto: false },
  { id: "rocket", name: "Rocket Tube", kind: "rocket", dmg: 54, head: 54, cd: 0.85, speed: 26, auto: false },
  { id: "bounce", name: "Bounce Ball", kind: "bounce", dmg: 28, head: 28, cd: 0.55, speed: 18, auto: false },
  { id: "laugh", name: "Laugh Grenade", kind: "laugh", dmg: 26, head: 26, cd: 0.9, speed: 14, auto: false },
  { id: "flame", name: "Party Torch", kind: "flame", dmg: 28, head: 28, cd: 0.08, speed: 0, auto: true },
  { id: "melee", name: "Bat", kind: "melee", dmg: 42, head: 58, cd: 0.42, speed: 0, auto: false },
  { id: "knife", name: "Knife", kind: "melee", dmg: 48, head: 70, cd: 0.36, speed: 0, auto: false },
  { id: "drone", name: "Drone Launcher", kind: "drone", dmg: 46, head: 46, cd: 1.1, speed: 12, auto: false },
];

export const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

export type AbilityId =
  | "glide"
  | "aura"
  | "shadow"
  | "bestie"
  | "puff"
  | "bunny"
  | "triple"
  | "rocket"
  | "drone"
  | "bird"
  | "jet"
  | "voodoo"
  | "mummy"
  | "necro"
  | "snipe"
  | "dual"
  | "flame"
  | "sheep"
  | "builder"
  | "wall";

export type CharDef = {
  id: string;
  name: string;
  blurb: string;
  hair: number;
  cloth: number;
  skin: number;
  style: "doll" | "round" | "goth" | "sport" | "bird";
  ability: AbilityId;
  abilityName: string;
  weapons: string[];
  jumps: number;
  voice: number;
};

export const CHARACTERS: CharDef[] = [
  { id: "angel", name: "Seraph Doll", blurb: "Petite white-haired angel. Wings, halo, hold jump to glide.", hair: 0xfff6ea, cloth: 0xfff4d8, skin: 0xffe0c4, style: "doll", ability: "glide", abilityName: "Halo glide", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 620 },
  { id: "pickme", name: "Bluebelle", blurb: "Blue-haired spark. Speeds her squad and never stops cheering.", hair: 0x2f8cff, cloth: 0xff7eb8, skin: 0xffd2b8, style: "sport", ability: "aura", abilityName: "Pick-me pulse", weapons: ["dual", "plasma", "laugh"], jumps: 2, voice: 540 },
  { id: "goth", name: "Noir Nyx", blurb: "Petite, straight black hair, long shadow dash.", hair: 0x140e18, cloth: 0x3a2450, skin: 0xf3d0b8, style: "goth", ability: "shadow", abilityName: "Shadow dash", weapons: ["plasma", "knife", "laugh"], jumps: 2, voice: 300 },
  { id: "bestie", name: "Bestie Bea", blurb: "The goth's best friend. Fast revive, shared heal, everybody happy.", hair: 0xff9ec4, cloth: 0xff5b93, skin: 0xffd0b0, style: "doll", ability: "bestie", abilityName: "Bestie pulse", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 580 },
  { id: "puff", name: "Puffstar", blurb: "Inhale, float, then flatten into a slide. Original, not a copy.", hair: 0xff8ad4, cloth: 0xff5fa2, skin: 0xffb7d5, style: "round", ability: "puff", abilityName: "Inhale", weapons: ["bounce", "plasma", "melee"], jumps: 2, voice: 700 },
  { id: "bunny", name: "Hopscotch", blurb: "Chain jumps to run faster and bounce higher, up to a cap.", hair: 0xfff0c2, cloth: 0xff8a3d, skin: 0xffd2b0, style: "sport", ability: "bunny", abilityName: "Bunny chain", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 640 },
  { id: "trips", name: "Triple Mint", blurb: "Three jumps. Everyone else still gets two.", hair: 0xb8ffcf, cloth: 0x63d6a0, skin: 0xffe0c8, style: "sport", ability: "triple", abilityName: "Triple jump", weapons: ["plasma", "bounce", "melee"], jumps: 3, voice: 600 },
  { id: "boomer", name: "Boomer", blurb: "Rockets that shove you skyward when they pop.", hair: 0xff6a3d, cloth: 0xf0c14a, skin: 0xf0c0a0, style: "sport", ability: "rocket", abilityName: "Rocket jump", weapons: ["rocket", "plasma", "melee"], jumps: 2, voice: 280 },
  { id: "buzz", name: "Buzz", blurb: "Hovers like a drone and launches stalking buzzbombs.", hair: 0x9fd4ff, cloth: 0x2a3344, skin: 0xd8c4b0, style: "sport", ability: "drone", abilityName: "Hover", weapons: ["drone", "plasma", "melee"], jumps: 2, voice: 480 },
  { id: "lark", name: "Skylark", blurb: "Flaps like a bird. Fuel comes back when you land.", hair: 0xffe08a, cloth: 0x7ec8ff, skin: 0xffd8bc, style: "bird", ability: "bird", abilityName: "Flap", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 720 },
  { id: "pack", name: "Packrat", blurb: "Backpack thruster. Hold jump in the air.", hair: 0xc8b6a0, cloth: 0x6b8f71, skin: 0xe8c2a4, style: "sport", ability: "jet", abilityName: "Backpack", weapons: ["plasma", "rocket", "melee"], jumps: 2, voice: 360 },
  { id: "pin", name: "Pinpop", blurb: "Voodoo rite. Raises a fallen body as a friendly soldier.", hair: 0x6b3cff, cloth: 0x241830, skin: 0xc89878, style: "goth", ability: "voodoo", abilityName: "Rise", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 260 },
  { id: "wrap", name: "Wrapley", blurb: "Mummy rite. Tougher risen soldiers.", hair: 0xf4ecd8, cloth: 0xe6d7b8, skin: 0xd8c29a, style: "doll", ability: "mummy", abilityName: "Unwrap", weapons: ["plasma", "melee", "laugh"], jumps: 2, voice: 240 },
  { id: "bone", name: "Bonecaller", blurb: "Necromancer rite. Slower risen, harder hits.", hair: 0xd7ffe8, cloth: 0x203028, skin: 0xead8c4, style: "goth", ability: "necro", abilityName: "Call bones", weapons: ["plasma", "bounce", "knife"], jumps: 2, voice: 220 },
  { id: "glass", name: "Glasseye", blurb: "Sniper. Right mouse is a lens, not a spray.", hair: 0xc9d6e8, cloth: 0x1e2a24, skin: 0xf0d0b4, style: "doll", ability: "snipe", abilityName: "Steady lens", weapons: ["sniper", "plasma", "knife"], jumps: 2, voice: 400 },
  { id: "twin", name: "Twinstitch", blurb: "Dual popguns. Both shots meet on the crosshair.", hair: 0xff5ea8, cloth: 0x20262e, skin: 0xffd0b8, style: "sport", ability: "dual", abilityName: "Twin burst", weapons: ["dual", "plasma", "laugh"], jumps: 2, voice: 560 },
  { id: "cinder", name: "Cinderpop", blurb: "Short cute flamethrower cone.", hair: 0xff4d2e, cloth: 0x3a2018, skin: 0xf0b898, style: "sport", ability: "flame", abilityName: "Torch", weapons: ["flame", "plasma", "laugh"], jumps: 2, voice: 340 },
  { id: "bleat", name: "Superbleat", blurb: "Fly as a kamikaze lamb, pop, then hop out alive.", hair: 0xfff6ea, cloth: 0xf7f7f2, skin: 0xffe8d8, style: "round", ability: "sheep", abilityName: "Superbleat", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 660 },
  { id: "blocky", name: "Blocky", blurb: "Places pads, walls, turrets and traps faster.", hair: 0x8fd14f, cloth: 0x4a7a32, skin: 0xf0c8a8, style: "sport", ability: "builder", abilityName: "Foreman", weapons: ["plasma", "bounce", "melee"], jumps: 2, voice: 420 },
  { id: "wallaby", name: "Wallaby", blurb: "Wallrides almost without falling.", hair: 0xffd27a, cloth: 0xef5b3c, skin: 0xf8d2b4, style: "sport", ability: "wall", abilityName: "Long ride", weapons: ["plasma", "melee", "laugh"], jumps: 2, voice: 500 },
];

export const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

export const BUILD_ACTIONS = [
  { id: "ability", name: "Signature" },
  { id: "block", name: "Block" },
  { id: "jump", name: "Jump pad" },
  { id: "turbo", name: "Turbo pad" },
  { id: "turret", name: "Turret" },
  { id: "mine", name: "Mine" },
  { id: "tangle", name: "Tangle" },
  { id: "tele", name: "Telepad" },
] as const;

export const RANKS: { id: string; name: string; lvl: number }[] = [
  { id: "Rct", name: "Recruit", lvl: 1 },
  { id: "Pvt", name: "Private", lvl: 3 },
  { id: "PFC", name: "Private FC", lvl: 6 },
  { id: "Cpl", name: "Corporal", lvl: 10 },
  { id: "Sgt", name: "Sergeant", lvl: 15 },
  { id: "SSgt", name: "Staff Sergeant", lvl: 22 },
  { id: "SFC", name: "Sergeant FC", lvl: 30 },
  { id: "MSgt", name: "Master Sergeant", lvl: 40 },
  { id: "1SG", name: "First Sergeant", lvl: 52 },
  { id: "SGM", name: "Sergeant Major", lvl: 66 },
  { id: "2LT", name: "Second Lieutenant", lvl: 82 },
  { id: "1LT", name: "First Lieutenant", lvl: 100 },
  { id: "Cpt", name: "Captain", lvl: 122 },
  { id: "Maj", name: "Major", lvl: 148 },
  { id: "LTC", name: "Lt. Colonel", lvl: 178 },
  { id: "Col", name: "Colonel", lvl: 214 },
  { id: "BGen", name: "Brigadier", lvl: 256 },
  { id: "MGen", name: "Major General", lvl: 306 },
  { id: "LGen", name: "Lt. General", lvl: 366 },
  { id: "Gen", name: "General", lvl: 440 },
];

export function xpToLevel(xp: number): { lvl: number; into: number; need: number } {
  let lvl = 1;
  let need = 80;
  let left = Math.max(0, xp);
  while (left >= need && lvl < 500) {
    left -= need;
    lvl += 1;
    need = Math.floor(need * 1.14 + 22);
  }
  return { lvl, into: left, need };
}

export function rankForLevel(lvl: number): { id: string; name: string; lvl: number; index: number } {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (lvl >= RANKS[i]!.lvl) index = i;
  }
  const row = RANKS[index]!;
  return { ...row, index };
}

export const BOT_NAMES = [
  "Limewire", "Fizz", "Coco", "Halo", "Nim", "Pebble", "Soda", "Juniper", "Dewdrop", "Zest", "Mango", "Kiwi",
  "Volt", "Neon", "Glint", "Byte", "Orbit", "Pixel", "Quark", "Lumen", "Static", "Comet", "Nova", "Ion",
  "Chili", "Brick", "Ruby", "Ember", "Salsa", "Rouge", "Coral", "Mars", "Pepper", "Brickie", "Rook", "Hex",
];

export const LINES: Record<string, string> = {
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
  groan: "graaah!",
};
