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
  | "wall"
  | "tesla"
  | "winner"
  | "flux"
  | "elbow"
  | "spotlight"
  | "loud";

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
  { id: "angel", name: "Sugoimeg", blurb: "White angelic doll. Wings, halo, hold jump to glide. A hello to megqtxo.", hair: 0xfff6ea, cloth: 0xfff4d8, skin: 0xffe0c4, style: "doll", ability: "glide", abilityName: "Halo glide", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 620 },
  { id: "pickme", name: "Dizzydezzy", blurb: "Blue-haired doll. Speeds her squad and never stops spinning.", hair: 0x2f8cff, cloth: 0x7ec8ff, skin: 0xffd2b8, style: "doll", ability: "aura", abilityName: "Dizzy pulse", weapons: ["dual", "plasma", "laugh"], jumps: 2, voice: 540 },
  { id: "goth", name: "Gothgirl", blurb: "Straight black hair. Long shadow dash.", hair: 0x140e18, cloth: 0x3a2450, skin: 0xf3d0b8, style: "goth", ability: "shadow", abilityName: "Shadow dash", weapons: ["plasma", "knife", "laugh"], jumps: 2, voice: 300 },
  { id: "bestie", name: "PickMe", blurb: "Pink-haired friend of the goth. Fast revive and a shared heal.", hair: 0xff9ec4, cloth: 0xff5b93, skin: 0xffd0b0, style: "doll", ability: "bestie", abilityName: "Pick-me pulse", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 580 },
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
  { id: "laile", name: "Laile", blurb: "Pink rambler. She keeps talking while she fights. A nod to the pink Barbie.", hair: 0xff5ea8, cloth: 0xff8ec8, skin: 0xffd0c4, style: "doll", ability: "aura", abilityName: "Rambler", weapons: ["plasma", "laugh", "melee"], jumps: 2, voice: 520 },
  { id: "cloudy", name: "Cloudy", blurb: "Big-headed blonde. Flies, spills rainbows, and falls through the looking glass.", hair: 0xffe08a, cloth: 0x3ec6ff, skin: 0xffe0c8, style: "round", ability: "bird", abilityName: "Wonderflight", weapons: ["plasma", "laugh", "bounce"], jumps: 2, voice: 640 },
  { id: "donnie", name: "The Donald", blurb: "Cartoon showman. Killstreaks become Winner calls. Twenty is god mode.", hair: 0xf0d060, cloth: 0x1a2a6b, skin: 0xf0b070, style: "sport", ability: "winner", abilityName: "You're fired", weapons: ["plasma", "rocket", "melee"], jumps: 2, voice: 180 },
  { id: "elon", name: "The Elon", blurb: "Throws a different car every time and will not stop selling it.", hair: 0x6b4a32, cloth: 0x1a1a1a, skin: 0xf0c8a8, style: "sport", ability: "tesla", abilityName: "Throw a car", weapons: ["rocket", "plasma", "melee"], jumps: 2, voice: 240 },
  { id: "flux", name: "Ensign Flux", blurb: "Laser pistol. Boom. Fluxxed you right in the capaciter.", hair: 0xc9a06a, cloth: 0xc6a15a, skin: 0xf0d0b4, style: "sport", ability: "flux", abilityName: "Flux pistol", weapons: ["plasma", "sniper", "knife"], jumps: 2, voice: 360 },
  { id: "rock", name: "The Rock", blurb: "Most-followed movie star, 2026. Eyebrow, elbow, and a catchphrase you can smell.", hair: 0x1a120c, cloth: 0x1a1a1a, skin: 0xc68658, style: "sport", ability: "elbow", abilityName: "People's elbow", weapons: ["melee", "rocket", "plasma"], jumps: 2, voice: 110 },
  { id: "zendaya", name: "Zendaya", blurb: "Most-followed actress, 2026. Spotlight, long curls, and a line that holds the hill.", hair: 0x2a140c, cloth: 0x1f6b45, skin: 0xc48a62, style: "doll", ability: "spotlight", abilityName: "Spotlight", weapons: ["plasma", "sniper", "laugh"], jumps: 2, voice: 280 },
  { id: "jlo", name: "JLo", blurb: "Jenny from the block. Gets loud, dances the reload, and does not miss the drop.", hair: 0x1a0c08, cloth: 0xe6b325, skin: 0xd09a6a, style: "sport", ability: "loud", abilityName: "Let's get loud", weapons: ["dual", "plasma", "laugh"], jumps: 2, voice: 230 },
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
  down: "oooowh!",
  die: "aiaiai!",
  sheep: "baaaa!",
  yay: "jeehee!",
  ride: "chuchu!",
  puff: "whooo!",
  groan: "graaah!",
};

const DYING = ["oooowh!", "wergh!", "aiaiai!", "owowow!", "eep!"];

const FLIGHT: Record<string, string[]> = {
  angel: ["joohoo!", "joohoo halo!", "joohoo up we go"],
  pickme: ["joohoo dizzy!", "joohoo spin!", "joohoo!"],
  goth: ["joohoo...", "joohoo darkly", "joohoo"],
  bestie: ["joohoo bestie!", "joohoo with me!", "joohoo!"],
  puff: ["joohoo puff!", "joohoo float", "joohoo!"],
  bunny: ["joohoo hop!", "joohoo bounce", "joohoo!"],
  trips: ["joohoo three!", "joohoo mint", "joohoo!"],
  boomer: ["joohoo boom!", "joohoo rocket", "joohoo!"],
  buzz: ["joohoo buzz!", "joohoo hover", "joohoo!"],
  lark: ["joohoo bird!", "joohoo flap", "joohoo!"],
  pack: ["joohoo pack!", "joohoo thrust", "joohoo!"],
  pin: ["joohoo pin", "joohoo rite", "joohoo"],
  wrap: ["joohoo wrap", "joohoo linen", "joohoo"],
  bone: ["joohoo bones", "joohoo", "joohoo rattle"],
  glass: ["joohoo steady", "joohoo", "joohoo lens"],
  twin: ["joohoo twins!", "joohoo!", "joohoo both"],
  cinder: ["joohoo spark!", "joohoo fire", "joohoo!"],
  bleat: ["joohoo baa!", "joohoo!", "joohoo lamb"],
  blocky: ["joohoo block!", "joohoo!", "joohoo build"],
  wallaby: ["joohoo wall!", "joohoo ride", "joohoo!"],
  laile: ["joohoo and another thing", "joohoo wait listen", "joohoo!"],
  cloudy: ["joohoo curiouser", "joohoo rainbow", "joohoo!"],
  donnie: ["joohoo tremendous", "joohoo winner", "joohoo!"],
  elon: ["joohoo to mars", "joohoo buy this", "joohoo!"],
  flux: ["joohoo flux", "joohoo capaciter", "joohoo!"],
  rock: ["joohoo finally", "can you smell it", "joohoo bring it"],
  zendaya: ["joohoo watch this", "joohoo from oakland", "joohoo!"],
  jlo: ["joohoo get loud", "joohoo on the block", "joohoo!"],
};

const CHATTER: Record<string, string[]> = {
  angel: ["the light likes you", "wings stay polite", "halo on", "bless this flag"],
  pickme: ["spin with me", "blue hair don't care", "dizzy but accurate", "again again"],
  goth: ["this hill is mine", "don't smile", "shadows first", "how dreary and fun"],
  bestie: ["I saved you a spot", "pink team up", "hold my soda", "best friends score"],
  puff: ["inhale the desert", "so round so fast", "floaties out", "soft landing maybe"],
  bunny: ["hop hop hop", "the chain is the point", "ears up", "boing with intent"],
  trips: ["third jump is a lifestyle", "minty fresh air", "one two three", "leave them two"],
  boomer: ["rockets solve stairs", "count the boom", "up is a direction", "pardon the crater"],
  buzz: ["drone out", "I see you", "buzz off kindly", "hover tax"],
  lark: ["the wind owes me", "flap budget remains", "sky is open", "tweet no, fight yes"],
  pack: ["thruster warm", "backpack says yes", "fuel is a feeling", "hold jump, trust me"],
  pin: ["the pin finds a friend", "rise if you mean it", "doll of the rite", "careful, it listens"],
  wrap: ["stay wrapped", "linen holds", "the quiet kind of tough", "unwrap later"],
  bone: ["bones, politely", "the rattle is a greeting", "slower, harder", "mind the ribs"],
  glass: ["breath out, then the shot", "the lens doesn't lie", "hold still", "one clean look"],
  twin: ["both barrels agree", "left and right, same idea", "crosshair date", "twins don't miss twice"],
  cinder: ["a little flame", "toasty, not tragic", "cone of cute", "mind the eyebrows"],
  bleat: ["baa with purpose", "I come back", "lamb out", "pop then hop"],
  blocky: ["pad here", "wall there", "the map can be improved", "foreman on site"],
  wallaby: ["the wall is a road", "don't let go", "ride it out", "vertical is fine"],
  laile: ["so basically what happened was", "and then, wait, the good part", "I am still talking", "pink microphone on"],
  cloudy: ["down the wrong rabbit", "rainbows are tactical", "my head arrived first", "curiouser, fire"],
  donnie: ["tremendous pilot", "you're looking at a winner", "the best jump", "everybody says so"],
  elon: ["the car is the argument", "different model, same point", "they see me rollin", "mars can wait one flag"],
  flux: ["fluxxed in the capaciter", "laser says hello", "boom, politely", "ensign on the hill"],
  rock: ["Can you smell what the Rock is cooking", "Just bring it", "Know your role", "Finally the Rock has come back", "If you smell what I am cooking"],
  zendaya: ["Watch me", "I am still that girl from Oakland", "This is my light", "I make the spotlight", "Hold the hill with me"],
  jlo: ["Let's get loud", "Jenny from the block", "Love don't cost a thing", "I ain't going nowhere", "On the six"],
};

export function spokenLine(charId: string, key: string): string {
  if (key === "die" || key === "down") return DYING[Math.floor(Math.random() * DYING.length)]!;
  if (key === "jump" || key === "double" || key === "triple") {
    const set = FLIGHT[charId] || ["joohoo!"];
    return set[Math.floor(Math.random() * set.length)]!;
  }
  if (key === "idle") {
    const set = CHATTER[charId] || ["jeehee!"];
    return set[Math.floor(Math.random() * set.length)]!;
  }
  const own = CHATTER[charId];
  if (own && key !== "help" && key !== "groan" && key !== "sheep" && Math.random() < 0.55) return own[Math.floor(Math.random() * own.length)]!;
  return LINES[key] || key;
}
