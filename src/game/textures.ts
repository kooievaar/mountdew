import * as THREE from "three";

function sheet(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  return { c, g };
}

function texOf(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function specks(g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = a * (0.3 + Math.random() * 0.7);
    g.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  g.globalAlpha = 1;
}

function cloth() {
  const { c, g } = sheet(128, 128);
  g.fillStyle = "#f6f3ec";
  g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 3) {
    g.fillStyle = y % 6 === 0 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.35)";
    g.fillRect(0, y, 128, 1);
  }
  for (let x = 0; x < 128; x += 5) {
    g.fillStyle = "rgba(0,0,0,0.035)";
    g.fillRect(x, 0, 1, 128);
  }
  g.fillStyle = "rgba(40,30,20,0.18)";
  g.fillRect(60, 0, 4, 128);
  g.fillRect(0, 96, 128, 3);
  specks(g, 128, 128, 80, 0.08);
  return texOf(c);
}

function skin() {
  const { c, g } = sheet(128, 128);
  const grd = g.createRadialGradient(64, 54, 10, 64, 64, 78);
  grd.addColorStop(0, "#fffdfb");
  grd.addColorStop(1, "#f3e4d8");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(255,140,150,0.16)";
  g.beginPath();
  g.ellipse(28, 78, 18, 10, 0, 0, Math.PI * 2);
  g.ellipse(100, 78, 18, 10, 0, 0, Math.PI * 2);
  g.fill();
  specks(g, 128, 128, 140, 0.06);
  return texOf(c);
}

function hair() {
  const { c, g } = sheet(64, 128);
  g.fillStyle = "#f7f4ef";
  g.fillRect(0, 0, 64, 128);
  for (let x = 0; x < 64; x += 3) {
    g.fillStyle = x % 6 === 0 ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.28)";
    g.fillRect(x, 0, 1, 128);
  }
  g.fillStyle = "rgba(0,0,0,0.08)";
  for (let i = 0; i < 12; i++) g.fillRect(Math.random() * 64, 0, 2, 128);
  return texOf(c);
}

function stone() {
  const { c, g } = sheet(256, 256);
  g.fillStyle = "#c9c2b6";
  g.fillRect(0, 0, 256, 256);
  const bw = 64;
  const bh = 32;
  for (let y = 0; y < 256; y += bh) {
    const off = (y / bh) % 2 ? bw / 2 : 0;
    for (let x = -bw; x < 256; x += bw) {
      const l = 236 + Math.floor(Math.random() * 16);
      g.fillStyle = `rgb(${l},${l - 4},${l - 10})`;
      g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.fillRect(x + off + 4, y + 4, bw - 12, 3);
    }
  }
  specks(g, 256, 256, 200, 0.07);
  return texOf(c);
}

function wood() {
  const { c, g } = sheet(64, 128);
  g.fillStyle = "#e7d3b4";
  g.fillRect(0, 0, 64, 128);
  for (let x = 0; x < 64; x += 1) {
    const n = Math.sin(x * 0.7) * 8 + Math.sin(x * 0.17) * 6;
    g.strokeStyle = `rgba(90,52,24,${0.08 + (x % 5) * 0.03})`;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + n, 40, x - n, 80, x + n * 0.3, 128);
    g.stroke();
  }
  g.fillStyle = "rgba(60,36,16,0.25)";
  g.fillRect(0, 0, 64, 3);
  return texOf(c);
}

function leaf() {
  const { c, g } = sheet(128, 128);
  g.fillStyle = "#e9ffe4";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(20,80,30,0.28)";
  for (let i = 0; i < 18; i++) {
    g.beginPath();
    g.moveTo(64, 118);
    g.quadraticCurveTo(20 + i * 5, 40, 10 + i * 6, 8);
    g.stroke();
  }
  specks(g, 128, 128, 60, 0.08);
  return texOf(c);
}

function metal() {
  const { c, g } = sheet(128, 64);
  const grd = g.createLinearGradient(0, 0, 0, 64);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.45, "#e4e7ee");
  grd.addColorStop(1, "#f7f8fb");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 64);
  g.fillStyle = "rgba(255,255,255,0.65)";
  g.fillRect(0, 8, 128, 6);
  g.fillStyle = "rgba(0,0,0,0.08)";
  for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 128, 1);
  return texOf(c);
}

function grit() {
  const { c, g } = sheet(256, 256);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(40,70,20,0.16)";
  g.lineWidth = 1;
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() - 0.5) * 4, y - 5 - Math.random() * 9);
    g.stroke();
  }
  specks(g, 256, 256, 500, 0.1);
  const t = texOf(c);
  t.repeat.set(28, 28);
  return t;
}

function caustic() {
  const { c, g } = sheet(128, 128);
  g.fillStyle = "#f3fbff";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(255,255,255,0.85)";
  g.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    g.beginPath();
    g.ellipse(Math.random() * 128, Math.random() * 128, 10 + Math.random() * 20, 4 + Math.random() * 8, Math.random() * 3, 0, Math.PI * 2);
    g.stroke();
  }
  const t = texOf(c);
  t.repeat.set(6, 1);
  return t;
}

function feather() {
  const { c, g } = sheet(128, 64);
  g.fillStyle = "#fffdf8";
  g.fillRect(0, 0, 128, 64);
  g.strokeStyle = "rgba(180,160,90,0.35)";
  for (let x = 8; x < 128; x += 6) {
    g.beginPath();
    g.moveTo(4, 32);
    g.lineTo(x, 4);
    g.moveTo(4, 32);
    g.lineTo(x, 60);
    g.stroke();
  }
  return texOf(c);
}

function rock() {
  const { c, g } = sheet(64, 64);
  g.fillStyle = "#f4f1ea";
  g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `rgba(80,70,60,${0.05 + Math.random() * 0.12})`;
    g.beginPath();
    g.ellipse(Math.random() * 64, Math.random() * 64, 8 + Math.random() * 16, 6, Math.random(), 0, Math.PI * 2);
    g.fill();
  }
  specks(g, 64, 64, 40, 0.12);
  return texOf(c);
}

function petal() {
  const { c, g } = sheet(64, 64);
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = "rgba(80,40,60,0.2)";
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.moveTo(32, 60);
    g.quadraticCurveTo(8 + i * 10, 20, 32, 4);
    g.stroke();
  }
  return texOf(c);
}

function blade() {
  const { c, g } = sheet(32, 64);
  g.fillStyle = "#f4ffe8";
  g.fillRect(0, 0, 32, 64);
  g.strokeStyle = "rgba(20,60,10,0.25)";
  g.beginPath();
  g.moveTo(16, 64);
  g.lineTo(16, 4);
  g.moveTo(10, 64);
  g.lineTo(8, 12);
  g.moveTo(22, 64);
  g.lineTo(24, 16);
  g.stroke();
  return texOf(c);
}

function zombieSkin() {
  const { c, g } = sheet(256, 256);
  g.fillStyle = "#6fce3c";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 36; i++) {
    const dark = i % 3 === 0;
    g.fillStyle = dark ? "#2f6a18" : i % 3 === 1 ? "#b6f56a" : "#8adf48";
    g.globalAlpha = 0.85;
    g.beginPath();
    g.ellipse(Math.random() * 256, Math.random() * 256, 12 + Math.random() * 36, 8 + Math.random() * 22, Math.random() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  g.strokeStyle = "#1c4a12";
  g.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    g.beginPath();
    const x = Math.random() * 256;
    g.moveTo(x, 0);
    g.bezierCurveTo(x + 30, 60, x - 40, 120, x + 10, 256);
    g.stroke();
  }
  for (let i = 0; i < 14; i++) {
    g.fillStyle = i % 2 ? "#dfe86a" : "#214014";
    g.beginPath();
    g.ellipse(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 7, 3 + Math.random() * 4, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "rgba(20,40,10,0.35)";
  g.fillRect(0, 150, 256, 8);
  g.strokeStyle = "rgba(18,12,8,0.55)";
  g.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = 20 + i * 28;
    const y = 40 + (i % 4) * 48;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 16, y + 4);
    g.moveTo(x + 8, y - 6);
    g.lineTo(x + 8, y + 10);
    g.stroke();
  }
  return texOf(c);
}

function zombieRag() {
  const { c, g } = sheet(128, 128);
  g.fillStyle = "#dfe8c8";
  g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) {
    g.fillStyle = y % 16 === 0 ? "rgba(40,30,16,0.18)" : "rgba(255,255,255,0.2)";
    g.fillRect(0, y, 128, 3);
  }
  g.fillStyle = "#5caa32";
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.moveTo(10 + i * 16, 20 + (i % 3) * 18);
    g.lineTo(28 + i * 12, 8);
    g.lineTo(36 + i * 10, 40);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = "rgba(20,16,8,0.45)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 40);
  g.lineTo(50, 70);
  g.lineTo(128, 48);
  g.stroke();
  g.fillStyle = "#3f8a28";
  g.beginPath();
  g.moveTo(18, 90);
  g.lineTo(46, 78);
  g.lineTo(40, 118);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(88, 24);
  g.lineTo(112, 16);
  g.lineTo(104, 48);
  g.closePath();
  g.fill();
  return texOf(c);
}

function boneTex() {
  const { c, g } = sheet(128, 128);
  g.fillStyle = "#f4f0e4";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(120,96,64,0.45)";
  g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.moveTo(8, 10 + i * 16);
    g.quadraticCurveTo(64, 4 + i * 16, 120, 18 + i * 16);
    g.stroke();
  }
  g.fillStyle = "rgba(90,70,40,0.18)";
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.ellipse(20 + i * 22, 30 + (i % 3) * 28, 6, 3, 0.4, 0, Math.PI * 2);
    g.fill();
  }
  return texOf(c);
}

function mutantFace() {
  const { c, g } = sheet(256, 256);
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = "#8ee85a";
  g.beginPath();
  g.ellipse(128, 136, 108, 116, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(24,60,12,0.38)";
  g.beginPath();
  g.ellipse(64, 162, 30, 38, 0.4, 0, Math.PI * 2);
  g.ellipse(192, 162, 30, 38, -0.4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f3ff86";
  g.shadowColor = "#d8ff48";
  g.shadowBlur = 16;
  g.beginPath();
  g.ellipse(86, 116, 30, 18, 0, 0, Math.PI * 2);
  g.ellipse(170, 116, 30, 18, 0, 0, Math.PI * 2);
  g.fill();
  g.shadowBlur = 0;
  g.fillStyle = "#101c08";
  g.fillRect(80, 100, 7, 32);
  g.fillRect(164, 100, 7, 32);
  g.fillStyle = "#163010";
  g.beginPath();
  g.moveTo(128, 134);
  g.lineTo(112, 170);
  g.lineTo(144, 170);
  g.fill();
  g.fillStyle = "#0c1808";
  g.beginPath();
  g.ellipse(128, 198, 48, 24, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f6f1e4";
  for (let i = 0; i < 4; i++) {
    g.fillRect(94 + i * 18, 180, 9, 14);
    g.fillRect(94 + i * 18, 204, 9, 12);
  }
  g.strokeStyle = "#1a140c";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(36, 74);
  g.lineTo(220, 92);
  g.stroke();
  for (let x = 48; x < 214; x += 24) {
    g.beginPath();
    g.moveTo(x, 64);
    g.lineTo(x + 6, 102);
    g.stroke();
  }
  g.strokeStyle = "rgba(50,18,12,0.8)";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(36, 148);
  g.lineTo(72, 176);
  g.lineTo(46, 208);
  g.stroke();
  const t = texOf(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function mutantEyes() {
  const { c, g } = sheet(128, 64);
  g.clearRect(0, 0, 128, 64);
  g.fillStyle = "#d9ff4a";
  g.shadowColor = "#c6ff3a";
  g.shadowBlur = 14;
  g.beginPath();
  g.ellipse(36, 32, 16, 11, 0, 0, Math.PI * 2);
  g.ellipse(92, 32, 16, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.shadowBlur = 0;
  g.fillStyle = "#142008";
  g.fillRect(33, 22, 4, 20);
  g.fillRect(89, 22, 4, 20);
  const t = texOf(c);
  return t;
}

export type TexPack = ReturnType<typeof bakeTextures>;

export function bakeTextures() {
  const eyes = mutantEyes();
  return {
    cloth: cloth(),
    skin: skin(),
    hair: hair(),
    stone: stone(),
    wood: wood(),
    leaf: leaf(),
    metal: metal(),
    grit: grit(),
    caustic: caustic(),
    feather: feather(),
    rock: rock(),
    petal: petal(),
    blade: blade(),
    zombieSkin: zombieSkin(),
    zombieRag: zombieRag(),
    bone: boneTex(),
    mutantFace: mutantFace(),
    eyes,
  };
}
