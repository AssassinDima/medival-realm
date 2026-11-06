'use strict';
/* =====================================================================
   world.js - the big explorable realm: regions, landmarks, world sprites,
   fog-of-war map, weather and the house interior.
   Loaded after animals.js, before game.js. Anything from game.js (G, T, SPR,
   rect, text, ...) is only used at runtime, never at load.
   ===================================================================== */
const OX = 24, OY = 18;                 // the old village sits in the middle of the big map
// ground ids: 0 grass, 1 dirt, 2 water, 3 soil, 4 snow, 5 sand, 6 dark grass, 7 stone
const REGION_C = [[48, 36, 1.55], [14, 10, 1], [48, 8, 1], [82, 10, 1], [12, 38, 1], [84, 38, 1], [24, 62, 1], [74, 60, 1]];
const REGION_COL = ['#7ec850', '#3f7a58', '#2f6a44', '#dcecf8', '#9a9aa8', '#5eb0ea', '#e8c84a', '#e8d49a'];
const LANDMARKS = [
  { id: 'tree', name: 'GIANT HOLLOW TREE', x: 14, y: 11, reg: 1, reward: 'redpanda' },
  { id: 'well', name: 'MOON WELL', x: 57, y: 9, reg: 2, reward: 'spiritstag' },
  { id: 'shrine', name: 'FROZEN SHRINE', x: 82, y: 11, reg: 3, reward: 'frostdrake' },
  { id: 'ruins', name: 'ANCIENT ARCH', x: 12, y: 34, reg: 4, reward: 'griffin' },
  { id: 'altar', name: 'ISLAND ALTAR', x: 84, y: 38, reg: 5, reward: 'moonrabbit' },
  { id: 'light', name: 'SUNSET LIGHTHOUSE', x: 80, y: 62, reg: 7, reward: 'pegasus' }
];

// ---------------------------------------------------------------- sprites
function mkGround(seed, base, cols, blades) {
  const [c, g] = mk(16, 16), r = mulberry32(seed);
  rect(g, base, 0, 0, 16, 16);
  for (let i = 0; i < 14; i++) rect(g, cols[Math.floor(r() * cols.length)], Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
  if (blades) for (let i = 0; i < 2; i++) {
    const x = Math.floor(r() * 13) + 1, y = Math.floor(r() * 11) + 3;
    rect(g, blades[0], x, y, 1, 2); rect(g, blades[1], x + 1, y - 1, 1, 1);
  }
  return c;
}
function mkPine(snow) {
  const [c, g] = mk(26, 48);
  const o = snow ? '#2a4a56' : '#143a24', m = snow ? '#3f7a78' : '#1f5a34', l = snow ? '#6aa8a4' : '#2f7a44', h = snow ? '#e8f4fa' : '#4a9a5a';
  rect(g, '#4a2e16', 11, 42, 4, 5); rect(g, '#6a4524', 12, 42, 2, 5);
  for (let i = 0; i < 4; i++) {
    const y0 = 3 + i * 10, w = 7 + i * 3;
    aTri(g, o, 13 - w - 1, y0 + 17, 13 + w + 1, y0 + 17, 13, y0 - 1);
    aTri(g, m, 13 - w, y0 + 16, 13 + w, y0 + 16, 13, y0);
    aTri(g, l, 13 - w + 2, y0 + 14, 13 + 1, y0 + 14, 13, y0 + 1);
    if (snow) { rect(g, h, 13 - 2, y0 + 3, 4, 1); rect(g, h, 13 - w + 2, y0 + 15, w, 1); rect(g, h, 13 + 2, y0 + 12, 3, 1); }
    else { rect(g, h, 13 - 1, y0 + 4, 2, 1); rect(g, h, 13 - w + 3, y0 + 14, 2, 1); }
  }
  return c;
}
function mkShroom(v) {
  const [c, g] = mk(16, 16);
  const cap = ['#d9433f', '#c8501e'][v], dot = '#fff6e0';
  for (const [x, y, s] of [[5, 10, 1], [11, 11, 0.7], [8, 7, 0.55]]) {
    rect(g, '#f0e4c8', x - 1, y, 2, Math.round(3 * s) + 1);
    ell(g, '#5a1a18', x, y - 0.5, 3.4 * s + 1, 2.4 * s + 1); ell(g, cap, x, y - 0.5, 3.4 * s, 2.4 * s);
    rect(g, dot, x - 1, y - 2, 1, 1); rect(g, dot, x + 1, y - 1, 1, 1);
  }
  return c;
}
function mkGlowShroom() {
  const [c, g] = mk(16, 16);
  for (const [x, y, s] of [[5, 11, 1], [10, 10, 0.8], [8, 7, 0.6]]) {
    rect(g, '#bfe8ff', x - 1, y, 2, Math.round(3 * s) + 1);
    ell(g, '#2a3a8a', x, y - 0.5, 3.4 * s + 1, 2.4 * s + 1); ell(g, '#6ac8ff', x, y - 0.5, 3.4 * s, 2.4 * s); ell(g, '#d8f4ff', x - 1, y - 1.5, 1.4 * s, 0.9 * s);
  }
  return c;
}
function mkFern() {
  const [c, g] = mk(16, 16);
  for (const a of [-1.1, -0.5, 0, 0.5, 1.1]) {
    for (let i = 0; i < 7; i++) apx(g, i > 4 ? '#6ac864' : '#2f8a48', 8 + Math.sin(a) * i * 1.1, 13 - Math.cos(a) * i * 1.2, 1, 1);
  }
  return c;
}
function mkPillar(v) {
  const [c, g] = mk(16, 32);
  const h = v ? 18 : 28, top = 32 - h;
  rect(g, '#5a5c68', 2, 29, 12, 3); rect(g, '#9a9caa', 3, top, 10, h - 2); rect(g, '#c0c2ce', 3, top, 3, h - 2); rect(g, '#767884', 10, top, 3, h - 2);
  rect(g, '#767884', 4, top + 6, 8, 1); rect(g, '#767884', 4, top + 13, 8, 1);
  rect(g, '#5a5c68', 2, 29, 12, 1);
  if (v) { aTri(g, '#9a9caa', 3, top, 13, top, 9, top - 3); rect(g, '#4a8a3a', 3, top + 1, 4, 2); rect(g, '#4a8a3a', 8, 25, 5, 3); }
  else { rect(g, '#b4b6c4', 1, top - 2, 14, 3); rect(g, '#767884', 1, top + 1, 14, 1); rect(g, '#4a8a3a', 4, 20, 2, 5); rect(g, '#4a8a3a', 10, 14, 2, 4); }
  return c;
}
function mkReed() {
  const [c, g] = mk(16, 16);
  for (const [x, h] of [[4, 11], [7, 14], [10, 10], [12, 12]]) { rect(g, '#5a9a3a', x, 15 - h, 1, h); rect(g, '#7a4a28', x - 0, 15 - h, 2, 3); }
  return c;
}
function mkSunflower() {
  const [c, g] = mk(16, 24);
  for (const [x, y] of [[4, 8], [11, 12]]) {
    rect(g, '#3f8a3a', x, y + 3, 1, 11); rect(g, '#5dbb4a', x - 2, y + 8, 2, 1); rect(g, '#5dbb4a', x + 1, y + 6, 2, 1);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; apx(g, '#ffd23a', x + Math.cos(a) * 3 - 0.5, y + Math.sin(a) * 3 - 0.5, 2, 2); }
    ell(g, '#7a4a20', x, y, 2, 2); rect(g, '#4a2c14', x - 1, y - 1, 1, 1);
  }
  return c;
}
function mkHay() {
  const [c, g] = mk(16, 16);
  ell(g, '#8a6a20', 8, 9.5, 7, 6); ell(g, '#d8b040', 8, 9, 6, 5); ell(g, '#f0d060', 6.5, 7.5, 3, 2);
  for (const y of [6, 9, 12]) rect(g, '#b8902c', 3, y, 10, 1);
  rect(g, '#8a4a28', 7, 5, 2, 9);
  return c;
}
function mkPalm() {
  const [c, g] = mk(32, 44);
  for (let i = 0; i < 24; i++) { const x = 15 + Math.sin(i * 0.1) * 2 + i * 0.12, y = 42 - i; rect(g, i % 4 < 2 ? '#8a6030' : '#6a4824', Math.round(x), y, 3, 1); }
  const cx = 18, cy = 18;
  for (const a of [-2.7, -2.1, -1.5, -0.9, -0.3, 0.3]) {
    for (let i = 0; i < 12; i++) {
      const x = cx + Math.cos(a) * i * 1.2, y = cy + Math.sin(a) * i * 0.8 + i * i * 0.04 * (Math.abs(Math.cos(a)) + 0.3);
      apx(g, i % 3 === 0 ? '#2f7a3a' : '#4aa84a', x, y, 2, 2);
    }
  }
  ell(g, '#6a4a24', cx - 1, cy + 2, 1.5, 1.5); ell(g, '#6a4a24', cx + 2, cy + 2.5, 1.5, 1.5);
  return c;
}
function mkShell() {
  const [c, g] = mk(16, 16);
  ell(g, '#f4b8c4', 5, 11, 2.2, 1.6); rect(g, '#fff0f0', 4, 10, 2, 1);
  ell(g, '#f4e4c4', 11, 8, 2, 1.5); rect(g, '#ffffff', 10, 7, 2, 1);
  return c;
}
function mkCrystal(big) {
  const [c, g] = mk(20, 28);
  const poly = (col, pts) => { for (let i = 1; i < pts.length - 1; i++) aTri(g, col, pts[0][0], pts[0][1], pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); };
  poly('#2a5a8a', [[2, 27], [5, 8], [8, 2], [11, 8], [13, 27]]);
  poly('#6ac8f4', [[3, 26], [6, 9], [8, 4], [10, 9], [12, 26]]);
  poly('#d8f8ff', [[4, 24], [6, 10], [8, 5], [8, 24]]);
  poly('#2a5a8a', [[10, 27], [13, 14], [15, 11], [17, 15], [19, 27]]);
  poly('#8ad8f8', [[11, 26], [14, 15], [15, 12], [17, 16], [18, 26]]);
  rect(g, '#ffffff', 8, 6, 1, 3);
  return c;
}
function mkSnowRock() {
  const [c, g] = mk(16, 16);
  ell(g, '#5a6a80', 8, 10.5, 7.5, 5.5); ell(g, '#9aa8bc', 8, 9.5, 6.5, 4.5); ell(g, '#eef6fb', 8, 7.5, 5.5, 2.6); rect(g, '#ffffff', 5, 6, 3, 1);
  return c;
}
function mkSeaRock() {
  const [c, g] = mk(16, 16);
  ell(g, '#4a5a60', 8, 10.5, 7.5, 5.5); ell(g, '#7a8c92', 8, 9.5, 6.5, 4.5); ell(g, '#a8bcc0', 6.5, 8, 3.5, 2.5); rect(g, '#5a9a58', 10, 12, 3, 1);
  return c;
}

// ---- landmarks
function mkGiantTree() {
  const [c, g] = mk(72, 92);
  rect(g, '#3a2410', 22, 86, 28, 4);
  for (let y = 40; y < 90; y++) { const w = 14 + (y > 74 ? (y - 74) * 0.9 : 0); rect(g, '#4a2e16', 36 - w, y, w * 2, 1); rect(g, '#6a4524', 36 - w + 2, y, w * 2 - 6, 1); rect(g, '#8a5e34', 36 - w + 3, y, 3, 1); }
  // hollow door with warm light
  ell(g, '#20120a', 36, 76, 6, 9); rect(g, '#20120a', 30, 76, 12, 12); ell(g, '#ffcf70', 36, 77, 4, 6); rect(g, '#ffcf70', 32, 77, 8, 11); rect(g, '#fff0b8', 34, 80, 4, 5);
  rect(g, '#5a3a1c', 35, 70, 2, 18);
  const blobs = [[36, 20, 18], [18, 30, 15], [54, 30, 15], [36, 36, 19], [12, 44, 10], [60, 44, 10]];
  for (const [x, y, r] of blobs) ell(g, '#1f4a2a', x, y, r + 1, r + 1);
  for (const [x, y, r] of blobs) ell(g, '#35893f', x, y, r, r);
  for (const [x, y, r] of blobs) ell(g, '#2a7034', x + 1, y + 4, r - 2, r - 5);
  for (const [x, y, r] of blobs) ell(g, '#63c05a', x - 3, y - 4, r - 7, r - 8);
  for (const [x, y] of [[26, 12], [44, 18], [14, 28], [56, 28], [36, 30], [24, 38], [48, 40]]) { rect(g, '#9ae87a', x, y, 3, 1); }
  for (const [x, y] of [[20, 22], [50, 34], [30, 44], [42, 14]]) { rect(g, '#ffd0e8', x, y, 2, 2); rect(g, '#ff8fb8', x, y, 1, 1); }
  return c;
}
function mkMoonWell() {
  const [c, g] = mk(32, 32);
  ell(g, '#4a4e5a', 16, 22, 15, 9); ell(g, '#868b98', 16, 21, 14, 8); ell(g, '#a9aeba', 15, 19, 11, 5);
  ell(g, '#1a2a5a', 16, 20, 11, 5.2); ell(g, '#5a8ae8', 16, 20, 10, 4.4); ell(g, '#b8d8ff', 14, 19, 6, 2.2); rect(g, '#ffffff', 11, 18, 3, 1);
  for (let x = 2; x < 30; x += 5) { rect(g, '#6a6f7a', x, 27, 1, 3); rect(g, '#6a6f7a', x + 2, 14, 1, 2); }
  rect(g, '#5a3a1c', 4, 4, 2, 17); rect(g, '#5a3a1c', 26, 4, 2, 17); rect(g, '#7a4d26', 3, 3, 26, 2);
  rect(g, '#8a8fa0', 14, 4, 4, 4); ell(g, '#e8f0ff', 16, 9, 1.6, 1.6);
  return c;
}
function mkFrostShrine() {
  const [c, g] = mk(36, 56);
  ell(g, '#5a6a80', 18, 50, 16, 6); ell(g, '#9aa8bc', 18, 49, 15, 5); ell(g, '#eef6fb', 18, 47, 12, 3);
  const poly = (col, pts) => { for (let i = 1; i < pts.length - 1; i++) aTri(g, col, pts[0][0], pts[0][1], pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); };
  poly('#2a5a8a', [[10, 50], [14, 18], [18, 2], [22, 18], [26, 50]]);
  poly('#6ac8f4', [[12, 48], [15, 20], [18, 5], [21, 20], [24, 48]]);
  poly('#d8f8ff', [[13, 46], [15, 22], [18, 7], [18, 46]]);
  poly('#8ad8f8', [[4, 50], [7, 36], [9, 33], [11, 38], [12, 50]]);
  poly('#8ad8f8', [[24, 50], [26, 38], [29, 30], [31, 38], [32, 50]]);
  rect(g, '#ffffff', 17, 8, 1, 6);
  return c;
}
function mkRuinsArch() {
  const [c, g] = mk(64, 56);
  const col = (x, h) => {
    rect(g, '#5a5c68', x, 50, 14, 5); rect(g, '#9a9caa', x + 1, 56 - h, 12, h - 4); rect(g, '#c0c2ce', x + 1, 56 - h, 3, h - 4); rect(g, '#767884', x + 10, 56 - h, 3, h - 4);
    for (let y = 56 - h + 8; y < 50; y += 9) rect(g, '#767884', x + 2, y, 10, 1);
    rect(g, '#b4b6c4', x - 1, 56 - h - 2, 16, 4); rect(g, '#767884', x - 1, 56 - h + 1, 16, 1);
  };
  col(2, 42); col(48, 36);
  // broken lintel
  rect(g, '#9a9caa', 8, 12, 30, 7); rect(g, '#c0c2ce', 8, 12, 30, 2); rect(g, '#767884', 8, 18, 30, 1);
  aTri(g, '#9a9caa', 38, 12, 38, 19, 46, 19); aTri(g, '#9a9caa', 8, 19, 14, 19, 8, 24);
  for (const [x, y, w] of [[4, 11, 5], [20, 9, 8], [30, 9, 5], [50, 17, 6]]) { rect(g, '#4a8a3a', x, y, w, 3); rect(g, '#6ac85a', x + 1, y, w - 2, 1); }
  rect(g, '#4a8a3a', 6, 30, 2, 10); rect(g, '#4a8a3a', 52, 32, 2, 8); rect(g, '#6ac85a', 6, 30, 1, 8);
  return c;
}
function mkAltar() {
  const [c, g] = mk(32, 44);
  ell(g, '#4a4e5a', 16, 36, 15, 7); ell(g, '#868b98', 16, 35, 14, 6); ell(g, '#a9aeba', 16, 33, 11, 4);
  rect(g, '#767884', 8, 22, 16, 12); rect(g, '#a9aeba', 8, 22, 16, 3); rect(g, '#5a5c68', 8, 31, 16, 3); rect(g, '#9a9caa', 10, 25, 3, 6);
  ell(g, '#1a2a5a', 16, 14, 5, 5); ell(g, '#8ad8ff', 16, 14, 4, 4); ell(g, '#ffffff', 15, 13, 1.6, 1.6);
  for (const [x, y] of [[4, 28], [26, 30], [6, 34]]) { rect(g, '#6ac85a', x, y, 2, 2); }
  return c;
}
function mkLighthouse() {
  const [c, g] = mk(36, 96);
  ell(g, '#5a5c68', 18, 90, 16, 5); ell(g, '#868b98', 18, 89, 15, 4);
  for (let y = 24; y < 90; y++) {
    const w = 11 - (y - 24) * 0.03, band = Math.floor((y - 24) / 11) % 2;
    rect(g, band ? '#d9433f' : '#f4f0e6', 18 - w, y, w * 2, 1); rect(g, band ? '#a02a2a' : '#c8c2b2', 18 + w - 5, y, 5, 1); rect(g, band ? '#f08a80' : '#ffffff', 18 - w, y, 2, 1);
  }
  rect(g, '#3a3a48', 18 - 12, 20, 24, 4); rect(g, '#5a5a6a', 18 - 12, 20, 24, 1);
  rect(g, '#3a3a48', 18 - 9, 6, 18, 14); rect(g, '#ffe48a', 18 - 7, 8, 14, 10); rect(g, '#ffffff', 18 - 5, 10, 5, 4);
  rect(g, '#3a3a48', 18 - 1, 8, 2, 10);
  aTri(g, '#3a3a48', 18 - 10, 6, 18 + 10, 6, 18, -1 < 0 ? 0 : 0); rect(g, '#d9433f', 18 - 9, 4, 18, 3); rect(g, '#3a3a48', 18 - 1, 0, 2, 4);
  rect(g, '#3a2412', 18 - 4, 78, 8, 12); rect(g, '#7a4a26', 18 - 3, 79, 6, 11);
  rect(g, '#8fd3f4', 18 - 2, 42, 4, 6); rect(g, '#8fd3f4', 18 - 2, 60, 4, 6);
  return c;
}

function initWorldSprites() {
  SPR.gnd = [];
  SPR.gnd[0] = SPR.grass; SPR.gnd[1] = SPR.dirt;
  SPR.gnd[4] = [1, 2, 3, 4].map(s => mkGround(s * 71, '#eaf2f8', ['#d8e6f2', '#ffffff', '#c8dcea'], null));
  SPR.gnd[5] = [1, 2, 3, 4].map(s => mkGround(s * 53, '#ecd8a0', ['#e0c88a', '#f4e4b8', '#d4bc7c'], null));
  SPR.gnd[6] = [1, 2, 3, 4].map(s => mkGround(s * 89, '#4e8a45', ['#437a3b', '#5a9a50', '#386a32'], ['#356a30', '#6aaa5a']));
  SPR.gnd[7] = [1, 2, 3, 4].map(s => mkGround(s * 37, '#8e909c', ['#7e808c', '#a0a2ae', '#6e707c'], null));
  SPR.pine = mkPine(false); SPR.snowPine = mkPine(true);
  SPR.shroom = [0, 1].map(mkShroom); SPR.glowShroom = mkGlowShroom(); SPR.fern = mkFern();
  SPR.pillar = [0, 1].map(mkPillar); SPR.reed = mkReed(); SPR.sunflower = mkSunflower(); SPR.hay = mkHay(); SPR.palm = mkPalm(); SPR.shell = mkShell();
  SPR.crystal = mkCrystal(); SPR.snowRock = mkSnowRock(); SPR.seaRock = mkSeaRock();
  SPR.lm = { tree: mkGiantTree(), well: mkMoonWell(), shrine: mkFrostShrine(), ruins: mkRuinsArch(), altar: mkAltar(), light: mkLighthouse() };
}

// ---------------------------------------------------------------- world generation
function smoothNoise(x, y) { return (Math.sin(x * 0.31 + 1.7) + Math.sin(y * 0.27 + 0.4) + Math.sin((x + y) * 0.17 + 2.1) + Math.sin((x - y) * 0.23)) / 4; }

function buildWorld() {
  const r = mulberry32(20261101);
  const N = MW * MH;
  const ground = new Uint8Array(N), solid = new Uint8Array(N), occ = new Uint8Array(N), region = new Uint8Array(N);
  const I = (x, y) => y * MW + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const objects = [], flowers = [], crops = [], shadows = [], glows = [], lamps = [];
  let w_fire = null;

  // ---- regions: nearest centre (village has a bigger basin), jittered edges
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const fx = x + smoothNoise(x, y * 1.3) * 7, fy = y + smoothNoise(x * 1.2 + 9, y + 4) * 7;
    let best = 0, bd = 1e9;
    REGION_C.forEach(([cx, cy, s], k) => { const d = Math.hypot(fx - cx, (fy - cy) * 1.15) / s; if (d < bd) { bd = d; best = k; } });
    region[I(x, y)] = best;
  }
  const base = [0, 6, 6, 4, 0, 0, 0, 5];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const reg = region[I(x, y)], n = smoothNoise(x * 1.7, y * 1.7);
    let g = base[reg];
    if (reg === 4 && n > 0.12) g = 7;               // ruins: patches of old stone
    if (reg === 3 && n > 0.45) g = 7;               // bare rock in the highlands
    if (reg === 1 && n < -0.35) g = 0;
    ground[I(x, y)] = g;
  }
  const fillG = (v, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y) && ground[I(x, y)] !== 2) ground[I(x, y)] = v; };

  // ---- water: village pond, crystal lake with an island, frozen pond, the sea
  const ellW = (cx, cy, rx, ry, jit) => {
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, n = (h2(x, y) % 100) / 100 * jit;
      if (dx * dx + dy * dy < 0.85 + n) ground[I(x, y)] = 2;
    }
  };
  const pond = { x: 37 + OX, y: 11 + OY };
  ellW(pond.x, pond.y, 6.3, 4.3, 0.3);
  // lake shore sand + water + island
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const dx = (x - 84) / 13.5, dy = (y - 38) / 10; if (dx * dx + dy * dy < 1 && ground[I(x, y)] !== 2) ground[I(x, y)] = 5;
  }
  ellW(84, 38, 11, 8, 0.25);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const dx = (x - 84) / 3.6, dy = (y - 38) / 3.1; if (dx * dx + dy * dy < 1) ground[I(x, y)] = 5;
  }
  ellW(76, 16, 4.2, 2.8, 0.3);                                   // frozen pond
  for (let x = 44; x < MW; x++) for (let y = 0; y < MH; y++) {   // sea along the south-east
    const lim = 66 + smoothNoise(x, 3) * 2;
    if (y >= lim) ground[I(x, y)] = 2; else if (y >= lim - 4 && ground[I(x, y)] !== 2 && region[I(x, y)] === 7) ground[I(x, y)] = 5;
  }

  // ---- roads
  fillG(1, 23 + OX, 11 + OY, 25 + OX, 21 + OY);   // path from the house door
  fillG(1, 2, 38, 93, 39);                         // main east-west road
  fillG(1, 12 + OX, 12 + OY, 22 + OX, 13 + OY);   // branch to the farm
  fillG(1, 26 + OX, 13 + OY, 30 + OX, 14 + OY);   // branch toward the pond
  fillG(1, 52, 2, 53, 37);                         // north road
  fillG(1, 52, 40, 53, 65);                        // south road
  fillG(1, 14, 10, 51, 11);                        // to the hollow
  fillG(1, 54, 10, 81, 11);                        // to the frostpeak
  fillG(1, 20, 60, 51, 61);                        // to the sunflower fields
  fillG(1, 54, 62, 79, 63);                        // to the shore
  fillG(3, 5 + OX, 9 + OY, 11 + OX, 13 + OY);     // farm soil
  const road = i => ground[i] === 1;

  // ---- village farm fence (gate on the east)
  const fenceSet = new Set();
  for (let x = 4; x <= 12; x++) for (let y = 8; y <= 14; y++) {
    if (x === 4 || x === 12 || y === 8 || y === 14) { if (x === 12 && y >= 11 && y <= 13) continue; fenceSet.add(I(x + OX, y + OY)); }
  }
  for (const i of fenceSet) {
    const x = i % MW, y = (i / MW) | 0; let m = 0;
    if (fenceSet.has(i - MW)) m |= 1; if (fenceSet.has(i + 1)) m |= 2; if (fenceSet.has(i + MW)) m |= 4; if (fenceSet.has(i - 1)) m |= 8;
    objects.push({ img: SPR.fence[m], x: x * T, y: y * T, sy: (y + 1) * T, mc: '#9c6b38' });
    solid[i] = 1; occ[i] = 1;
  }
  for (let y = 9; y <= 13; y++) for (let x = 5; x <= 11; x++) if (r() < 0.82) crops.push({ x: x + OX, y: y + OY, type: Math.floor(r() * 3), stage: Math.floor(r() * 4) });

  // ---- house
  const hx = 21 + OX, hy = 11 + OY;
  objects.push({ img: SPR.house, x: hx * T, y: hy * T - 96, sy: hy * T, mc: '#a03c2b' });
  for (let y = hy - 4; y <= hy - 1; y++) for (let x = hx; x <= hx + 6; x++) { solid[I(x, y)] = 1; occ[I(x, y)] = 1; }
  shadows.push({ x: (hx + 3.5) * T, y: hy * T - 2, rx: 56, ry: 5 });

  // ---- lamps
  const addLamp = (x, y) => {
    const i = I(x, y);
    if (!inb(x, y) || occ[i] || ground[i] === 2) return;
    objects.push({ img: SPR.lamp[0], lamp: true, x: x * T, y: (y + 1) * T - 32, sy: (y + 1) * T, mc: '#ffd56a' });
    solid[i] = 1; occ[i] = 1;
    shadows.push({ x: x * T + 8, y: (y + 1) * T - 2, rx: 5, ry: 2 });
    lamps.push({ x: x * T + 8, y: (y + 1) * T - 32 + 7 });
  };
  for (let x = 6; x < 92; x += 6) { if (x > 44 && x < 62) continue; addLamp(x, 37); }                 // along the main road (north side)
  for (const x of [9, 15, 21, 27, 33, 39].map(v => v + OX)) addLamp(x, 22 + OY);
  for (const y of [15, 18]) { addLamp(22 + OX, y + OY); addLamp(26 + OX, y + OY); }
  addLamp(15 + OX, 11 + OY); addLamp(19 + OX, 14 + OY);
  for (let y = 4; y < 36; y += 6) addLamp(51, y);                                                      // north road
  for (let y = 42; y < 66; y += 6) addLamp(51, y);                                                     // south road
  for (let x = 18; x < 50; x += 7) addLamp(x, 9);
  for (let x = 58; x < 80; x += 7) addLamp(x, 9);
  for (let x = 24; x < 50; x += 7) addLamp(x, 59);
  for (let x = 58; x < 78; x += 7) addLamp(x, 61);

  // ---- village buildings, the Wolfclan camp, and clear ground for NPC posts / hidden places
  initNpcArt();
  fillG(1, 32, 44, 70, 45);                                    // front path linking the shops
  for (const b of BUILDINGS) {
    for (let y = b.y - 1; y <= b.y + 2; y++) for (let x = b.x; x <= b.x + 5; x++) { if (!inb(x, y)) continue; solid[I(x, y)] = 1; occ[I(x, y)] = 1; if (ground[I(x, y)] === 2) ground[I(x, y)] = 0; }
    for (let x = b.x + 1; x <= b.x + 4; x++) occ[I(x, b.y + 3)] = 1;
    objects.push({ img: NpcArt.bld[b.kind], hs: true, x: b.x * T, y: (b.y + 3) * T - 64, sy: (b.y + 3) * T, mc: '#8a7a6a' });
    shadows.push({ x: (b.x + 3) * T, y: (b.y + 3) * T - 2, rx: 50, ry: 5 });
    b.door = { x: (b.x + 3) * T, y: (b.y + 3) * T + 4 };
    for (const wx of [b.x + 1.9, b.x + 4.1]) glows.push({ x: wx * T, y: (b.y + 1.6) * T, r: 22, c: '#ffc870' });
  }
  for (let y = 14; y < 28; y++) for (let x = 60; x < 84; x++) { const dx = (x - 71) / 9.5, dy = (y - 21) / 5.2; if (dx * dx + dy * dy < 1 && ground[I(x, y)] !== 2 && ground[I(x, y)] !== 1) ground[I(x, y)] = 4; }   // a frosty clearing
  fillG(1, 69, 19, 73, 22);                                    // camp ground
  const campSolid = (x, y) => { if (inb(x, y) && ground[I(x, y)] !== 2) { solid[I(x, y)] = 1; occ[I(x, y)] = 1; } };
  for (const [tx, ty] of [[66, 19], [75, 21], [67, 23]]) {
    objects.push({ img: NpcArt.misc.tent, hs: true, x: tx * T, y: (ty + 1) * T - 26, sy: (ty + 1) * T, mc: '#8a7a68' });
    campSolid(tx, ty); campSolid(tx + 1, ty); shadows.push({ x: (tx + 1) * T, y: (ty + 1) * T - 2, rx: 14, ry: 3 });
  }
  objects.push({ img: NpcArt.misc.totem, hs: true, x: 73 * T - 4, y: 20 * T - 24, sy: 20 * T, mc: '#6a4a30' }); campSolid(73, 19); shadows.push({ x: 73.5 * T, y: 20 * T - 2, rx: 6, ry: 2 });
  w_fire = { x: 70 * T + 8, y: 21 * T + 8 };
  glows.push({ x: w_fire.x, y: w_fire.y - 6, r: 46, c: '#ff9a3c' });
  campSolid(70, 21); occ[I(71, 20)] = 1;
  for (const id of NPC_ORDER) {                                // keep scatter away from posts + hidden places
    for (const po of POSTS[id]) for (let dy = 0; dy <= 0; dy++) occ[I(Math.floor(po[2]), Math.floor(po[3]))] = 1;
    const pl = NPCS[id].place; const px0 = Math.floor(pl.x), py0 = Math.floor(pl.y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = px0 + dx, y = py0 + dy; if (!inb(x, y) || solid[I(x, y)]) continue; occ[I(x, y)] = 1; if (ground[I(x, y)] === 2) ground[I(x, y)] = 5; }
  }

  // ---- helpers for placing things
  const lamps0 = lamps.length;
  const shadow = (x, y, rx, ry) => shadows.push({ x: x * T + 8, y: (y + 1) * T - 3, rx, ry });
  const nearGround = (x, y, v, rad) => {
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (inb(x + dx, y + dy) && ground[I(x + dx, y + dy)] === v) return true;
    return false;
  };
  const free = (x, y) => inb(x, y) && !occ[I(x, y)] && ground[I(x, y)] !== 2 && ground[I(x, y)] !== 1 && ground[I(x, y)] !== 3;
  const tree = (x, y, img, mc, sx = 8, sh = 11) => {
    objects.push({ img, x: x * T - (img.width - 16) / 2, y: (y + 1) * T - img.height, sy: (y + 1) * T, mc });
    solid[I(x, y)] = 1; occ[I(x, y)] = 1; shadow(x, y, sh, 4);
  };
  const small = (x, y, img, mc, blocks = true, glow) => {
    objects.push({ img, x: x * T, y: y * T, sy: (y + 1) * T, mc });
    if (blocks) { solid[I(x, y)] = 1; } occ[I(x, y)] = 1;
    if (blocks) shadow(x, y, 7, 3);
    if (glow) glows.push({ x: x * T + 8, y: y * T + 8, r: glow.r, c: glow.c });
  };
  const deco = (x, y, img, mc) => { objects.push({ img, x: x * T, y: y * T, sy: (y + 1) * T - 6, mc }); occ[I(x, y)] = 1; };   // walk-through decoration
  const treeFor = reg => {
    const k = r();
    if (reg === 3) return [SPR.snowPine, '#7ab0ac'];
    if (reg === 2 || reg === 1) return reg === 2 ? [SPR.pine, '#1f5a34'] : [SPR.tree[k < 0.6 ? 0 : 1], '#2f6a3a'];
    return [SPR.tree[k < 0.55 ? 0 : k < 0.8 ? 1 : 2], '#3f9a47'];
  };

  // ---- landmarks (placed before scatter so nothing grows on them)
  const lmStamp = (lm) => {
    const { x, y } = lm, img = SPR.lm[lm.id];
    if (lm.id === 'tree') { objects.push({ img, x: x * T + 8 - 36, y: (y + 1) * T - 92, sy: (y + 1) * T, mc: '#35893f' }); for (const dx of [-1, 0, 1]) solid[I(x + dx, y)] = 1; shadow(x, y, 26, 6); }
    if (lm.id === 'well') { objects.push({ img, x: x * T, y: (y + 1) * T - 32, sy: (y + 1) * T, mc: '#5a8ae8' }); solid[I(x, y)] = 1; solid[I(x + 1, y)] = 1; shadow(x, y, 14, 4); glows.push({ x: x * T + 16, y: y * T - 2, r: 40, c: '#7aa8ff' }); }
    if (lm.id === 'shrine') { objects.push({ img, x: x * T + 8 - 18, y: (y + 1) * T - 56, sy: (y + 1) * T, mc: '#6ac8f4' }); solid[I(x, y)] = 1; solid[I(x - 1, y)] = 1; shadow(x, y, 16, 5); glows.push({ x: x * T + 8, y: y * T - 20, r: 52, c: '#8ad8ff' }); }
    if (lm.id === 'ruins') { objects.push({ img, x: x * T - 24, y: (y + 1) * T - 56, sy: (y + 1) * T, mc: '#9a9caa' }); solid[I(x - 2, y)] = 1; solid[I(x + 1, y)] = 1; shadow(x - 1, y, 28, 5); }
    if (lm.id === 'altar') { objects.push({ img, x: x * T, y: (y + 1) * T - 44, sy: (y + 1) * T, mc: '#8ad8ff' }); solid[I(x, y)] = 1; solid[I(x + 1, y)] = 1; shadow(x, y, 14, 4); glows.push({ x: x * T + 16, y: y * T - 20, r: 46, c: '#8ad8ff' }); }
    if (lm.id === 'light') { objects.push({ img, x: x * T + 8 - 18, y: (y + 1) * T - 96, sy: (y + 1) * T, mc: '#d9433f' }); solid[I(x, y)] = 1; solid[I(x - 1, y)] = 1; shadow(x, y, 16, 5); glows.push({ x: x * T + 8, y: y * T - 80, r: 60, c: '#ffe48a' }); }
    for (let dy = -3; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) if (inb(lm.x + dx, lm.y + dy)) occ[I(lm.x + dx, lm.y + dy)] = 1;
  };
  for (const lm of LANDMARKS) {
    if (lm.id !== 'altar') { // clear any water under the landmark; give it a patch of ground
      for (let dy = -2; dy <= 1; dy++) for (let dx = -3; dx <= 3; dx++) if (inb(lm.x + dx, lm.y + dy) && ground[I(lm.x + dx, lm.y + dy)] === 2) ground[I(lm.x + dx, lm.y + dy)] = 5;
    }
    lmStamp(lm);
  }
  // clear a plaza of stone in front of the ruins and frozen shrine
  fillG(7, 9, 35, 14, 36); fillG(7, 80, 12, 84, 12); fillG(7, 55, 10, 59, 10);

  // ---- village scatter (the original meadow)
  let trees = 0, rocks = 0, bushes = 0, tries = 0;
  while ((trees < 40 || rocks < 14 || bushes < 16) && tries++ < 6000) {
    const x = 3 + OX + Math.floor(r() * 42), y = 3 + OY + Math.floor(r() * 30), i = I(x, y);
    if (occ[i] || ground[i] !== 0 || region[i] !== 0) continue;
    if (Math.hypot(x - (24 + OX), y - (12 + OY)) < 5) continue;
    if (nearGround(x, y, 1, 2) || nearGround(x, y, 2, 1) || nearGround(x, y, 3, 2)) continue;
    if (x >= 3 + OX && x <= 13 + OX && y >= 7 + OY && y <= 15 + OY) continue;
    if (x >= 19 + OX && x <= 29 + OX && y >= 5 + OY && y <= 12 + OY) continue;
    const k = r();
    if (k < 0.55 && trees < 40) { const [im, mc] = treeFor(0); tree(x, y, im, mc); trees++; }
    else if (k < 0.75 && rocks < 14) { small(x, y, SPR.rock, '#868b96'); rocks++; }
    else if (bushes < 16) { small(x, y, SPR.bush, '#3f9a47'); bushes++; }
  }

  // ---- regional scatter
  const clearOfRoad = (x, y) => !nearGround(x, y, 1, 1) && !nearGround(x, y, 2, 0) && !(inb(x, y) && ground[I(x, y)] === 3);
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    const i = I(x, y), reg = region[i], g = ground[i];
    if (occ[i] || g === 2 || g === 1 || g === 3) continue;
    const k = r(), edge = Math.min(x, y, MW - 1 - x, MH - 1 - y);
    // dense forest wall around the whole realm
    if (edge <= 2) {
      const p = edge === 0 ? 1 : edge === 1 ? 0.95 : 0.55;
      if (k < p) { const [im, mc] = treeFor(reg === 0 ? 2 : reg); tree(x, y, im, mc); }
      continue;
    }
    if (reg === 0 || !clearOfRoad(x, y)) continue;
    if (reg === 1) {                                                // mushroom hollow
      if (k < 0.12) { const [im, mc] = treeFor(1); tree(x, y, im, mc); }
      else if (k < 0.2) small(x, y, SPR.shroom[k < 0.16 ? 0 : 1], '#d9433f', false);
      else if (k < 0.255) small(x, y, SPR.glowShroom, '#6ac8ff', false, { r: 26, c: '#6ac8ff' });
      else if (k < 0.31) deco(x, y, SPR.fern, '#2f8a48');
      else if (k < 0.33) small(x, y, SPR.bush, '#2f6a3a');
    } else if (reg === 2) {                                         // whispering pines
      if (k < 0.2) { tree(x, y, SPR.pine, '#1f5a34', 5, 9); }
      else if (k < 0.24) small(x, y, SPR.rock, '#868b96');
      else if (k < 0.3) deco(x, y, SPR.fern, '#2f8a48');
      else if (k < 0.32) small(x, y, SPR.shroom[0], '#d9433f', false);
    } else if (reg === 3) {                                         // frostpeak
      if (k < 0.13) tree(x, y, SPR.snowPine, '#7ab0ac', 5, 9);
      else if (k < 0.18) small(x, y, SPR.snowRock, '#9aa8bc');
      else if (k < 0.215) small(x, y, SPR.crystal, '#6ac8f4', true, { r: 24, c: '#8ad8ff' });
    } else if (reg === 4) {                                         // old ruins
      if (k < 0.04) small(x, y, SPR.pillar[k < 0.02 ? 0 : 1], '#9a9caa');
      else if (k < 0.075) small(x, y, SPR.rock, '#868b96');
      else if (k < 0.1) small(x, y, SPR.bush, '#3f7a3a');
      else if (k < 0.13) { const [im, mc] = treeFor(4); tree(x, y, im, mc); }
    } else if (reg === 5) {                                         // crystal lake
      const nearW = nearGround(x, y, 2, 1);
      if (nearW && k < 0.3) deco(x, y, SPR.reed, '#5a9a3a');
      else if (!nearW && k < 0.09) { const [im, mc] = treeFor(5); tree(x, y, im, mc); }
      else if (k > 0.97) small(x, y, SPR.rock, '#868b96');
    } else if (reg === 6) {                                         // sunflower fields
      if (k < 0.3) deco(x, y, SPR.sunflower, '#ffd23a');
      else if (k < 0.33) small(x, y, SPR.hay, '#d8b040');
      else if (k < 0.37) { const [im, mc] = treeFor(6); tree(x, y, im, mc); }
      else if (k < 0.39) small(x, y, SPR.bush, '#3f9a47');
    } else if (reg === 7) {                                         // sunset shore
      if (g === 5) {
        if (k < 0.05) tree(x, y, SPR.palm, '#4aa84a', 8, 9);
        else if (k < 0.09) deco(x, y, SPR.shell, '#f4b8c4');
        else if (k < 0.12) small(x, y, SPR.seaRock, '#7a8c92');
      } else if (k < 0.1) { const [im, mc] = treeFor(0); tree(x, y, im, mc); }
    }
  }
  // flowers in meadows and fields
  for (let n = 0; n < 700; n++) {
    const x = 2 + Math.floor(r() * (MW - 4)), y = 2 + Math.floor(r() * (MH - 4)), i = I(x, y);
    if (ground[i] === 0 && !occ[i] && (region[i] === 0 || region[i] === 6 || region[i] === 5 || r() < 0.2)) flowers.push({ x: x * T, y: y * T, v: Math.floor(r() * 5) });
  }
  objects.sort((a, b) => a.sy - b.sy);

  // ---- ground colours + object dots for the map
  const mapCol = new Array(N);
  const GC = ['#7ec850', '#b98e5a', '#3e8fd0', '#7b5234', '#f2f8fc', '#ecd8a0', '#4e8a45', '#9a9ca8'];
  for (let i = 0; i < N; i++) mapCol[i] = GC[ground[i]];
  for (const o of objects) {
    const tx = Math.floor((o.x + o.img.width / 2) / T), ty = Math.floor((o.sy - 1) / T);
    if (inb(tx, ty) && o.mc && !o.lamp) mapCol[I(tx, ty)] = o.mc;
  }
  const altar = { x: 84, y: 38 };
  return { ground, solid, region, objects, flowers, crops, shadows, lamps, glows, pond, altar, mapCol, hx: hx * T, hy: hy * T,
    fire: w_fire, spawn: { x: (24.5 + OX) * T, y: (12.5 + OY) * T }, door: { x: (24.5 + OX) * T, y: (11 + OY) * T } };
}

function bakeGround(w) {
  const [c, g] = mk(MW * T, MH * T);
  const gi = (x, y) => w.ground[clamp(y, 0, MH - 1) * MW + clamp(x, 0, MW - 1)];
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const t = w.ground[ty * MW + tx], px = tx * T, py = ty * T, h = h2(tx, ty);
    if (t === 2) { rect(g, '#3e8fd0', px, py, T, T); continue; }
    if (t === 3) {
      g.drawImage(SPR.soil, px, py);
      if (gi(tx, ty - 1) !== 3) rect(g, '#4a301c', px, py, T, 1);
      if (gi(tx, ty + 1) !== 3) rect(g, '#4a301c', px, py + 15, T, 1);
      if (gi(tx - 1, ty) !== 3) rect(g, '#4a301c', px, py, 1, T);
      if (gi(tx + 1, ty) !== 3) rect(g, '#4a301c', px + 15, py, 1, T);
      continue;
    }
    const set = SPR.gnd[t] || SPR.grass;
    g.drawImage(set[h % set.length], px, py);
    if (t === 1) {
      const edge = (nx, ny, fn) => { if (gi(tx + nx, ty + ny) !== 1) fn(); };
      const gcol = (nx, ny) => { const o = gi(tx + nx, ty + ny); return o === 4 ? '#c8d8e6' : o === 5 ? '#d4bc7c' : o === 6 ? '#3a6a34' : o === 7 ? '#7a7c88' : '#5e9a3a'; };
      edge(0, -1, () => { rect(g, '#97703f', px, py, T, 1); for (let i = 0; i < T; i++) if (h2(tx * 16 + i, ty) % 4 === 0) rect(g, gcol(0, -1), px + i, py, 1, 1); });
      edge(0, 1, () => { rect(g, '#97703f', px, py + 15, T, 1); for (let i = 0; i < T; i++) if (h2(tx * 16 + i, ty + 99) % 4 === 0) rect(g, gcol(0, 1), px + i, py + 15, 1, 1); });
      edge(-1, 0, () => { rect(g, '#97703f', px, py, 1, T); for (let i = 0; i < T; i++) if (h2(tx, ty * 16 + i) % 4 === 0) rect(g, gcol(-1, 0), px, py + i, 1, 1); });
      edge(1, 0, () => { rect(g, '#97703f', px + 15, py, 1, T); for (let i = 0; i < T; i++) if (h2(tx + 77, ty * 16 + i) % 4 === 0) rect(g, gcol(1, 0), px + 15, py + i, 1, 1); });
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (const s of w.shadows) for (let y = -s.ry; y <= s.ry; y++) {
    const half = Math.round(s.rx * Math.sqrt(1 - (y / s.ry) ** 2));
    g.fillRect(Math.round(s.x - half), Math.round(s.y + y), half * 2, 1);
  }
  for (const f of w.flowers) g.drawImage(SPR.flowers[f.v], f.x, f.y);
  for (const cr of w.crops) g.drawImage(SPR.crops[cr.type][cr.stage], cr.x * T, cr.y * T);
  return c;
}

// ================================================================ EXPLORATION + MAP
const MAP_KEY = 'medieval_realm_map';
const MAPX = 12, MAPY = 24, MAPS = 2.5;      // map screen: logic position and px per tile
function exploreTotal() { let n = 0; for (let y = 3; y < MH - 3; y++) for (let x = 3; x < MW - 3; x++) n++; return n; }
function initExplore() {
  const w = G.w;
  G.reveal = new Uint8Array(MW * MH);
  G.regSeen = new Array(8).fill(0); G.lmSeen = {}; G.lastReg = -1; G.regBanner = null; G.exT = 0; G.saveT = 0; G.map = false; G.journal = false;
  G.mapC = mk(MW, MH);
  G.mapPix = new Uint8ClampedArray(MW * MH * 4); G.mapDirty = true; G.expPct = 0; G.expMile = 0;
  try {
    const d = JSON.parse(localStorage.getItem(MAP_KEY) || 'null');
    if (d && d.rev && d.rev.length === MW * MH) {
      for (let i = 0; i < d.rev.length; i++) if (d.rev[i] === '1') G.reveal[i] = 1;
      G.regSeen = d.reg || G.regSeen; G.lmSeen = d.lm || {};
    }
  } catch (e) { /* ignore */ }
  for (let i = 0; i < MW * MH; i++) if (G.reveal[i]) paintMapTile(i);
  recountExplore();
  G.expMile = Math.floor(G.expPct / 25);
}
function paintMapTile(i) {
  const [r, g, b] = hexRgb(G.w.mapCol[i]), o = i * 4;
  G.mapPix[o] = r; G.mapPix[o + 1] = g; G.mapPix[o + 2] = b; G.mapPix[o + 3] = 255; G.mapDirty = true;
}
function recountExplore() {
  let n = 0;
  for (let y = 3; y < MH - 3; y++) for (let x = 3; x < MW - 3; x++) if (G.reveal[y * MW + x]) n++;
  G.expPct = Math.min(100, Math.floor(n / exploreTotal() * 100));
}
function saveExplore() {
  try {
    let rev = ''; for (let i = 0; i < G.reveal.length; i++) rev += G.reveal[i] ? '1' : '0';
    localStorage.setItem(MAP_KEY, JSON.stringify({ rev, reg: G.regSeen, lm: G.lmSeen }));
  } catch (e) { /* ignore */ }
}
function spawnReward(lm) {
  const sp = SPECIES_BY_ID[lm.reward];
  if (!sp || G.pets.some(a => a.s === sp) || G.animals.some(a => a.s === sp)) return;
  const cx = lm.x + 0.5, cy = lm.y + 2;
  for (let n = 0; n < 200; n++) {
    const tx = Math.round(cx + (Math.random() - 0.5) * 11), ty = Math.round(cy + (Math.random() - 0.5) * 8), i = ty * MW + tx;
    if (tx < 1 || ty < 1 || tx >= MW - 1 || ty >= MH - 1 || G.w.solid[i] || G.w.ground[i] === 2) continue;
    if (Math.hypot(tx - cx, ty - cy) < 3.5) continue;
    const a = Animals.make(sp, tx * T + 8, ty * T + 12); a.keep = true; G.animals.push(a);
    emit(a.x, a.y - 8, 24, { sp: 50, life: 0.8, c: (SPARK_COL[sp.r] || ['#ffffff', '#c8a0ff']) });
    return;
  }
}
function updateExplore(dt) {
  G.exT += dt; G.saveT += dt;
  if (G.exT < 0.12) return;
  G.exT = 0;
  const p = G.p, px = Math.floor(p.x / T), py = Math.floor(p.y / T), fog = wxS('fog');
  const R = Math.round((9 - 3.5 * fog) * (G.inside ? 0 : 1));
  let added = 0;
  for (let y = py - R; y <= py + R; y++) for (let x = px - R; x <= px + R; x++) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
    const i = y * MW + x;
    if (!G.reveal[i] && (x - px) * (x - px) + (y - py) * (y - py) <= R * R + 1) { G.reveal[i] = 1; paintMapTile(i); added++; }
  }
  if (G.inside) return;
  const reg = G.w.region[py * MW + px];
  if (reg !== G.lastReg) {
    G.lastReg = reg; G.regBanner = G.regSeen[reg] ? { name: REGION_NAMES[reg], t: 3.2 } : null;
    if (!G.regSeen[reg]) { G.regSeen[reg] = 1; Animals.toast('NEW AREA DISCOVERED', REGION_NAMES[reg], REGION_COL[reg]); saveExplore(); }
  }
  for (const lm of LANDMARKS) {
    if (G.lmSeen[lm.id]) continue;
    if (Math.hypot(p.x - (lm.x + 0.5) * T, p.y - lm.y * T) < 3.6 * T) {
      G.lmSeen[lm.id] = 1;
      Animals.toast('LANDMARK FOUND!', lm.name, '#ffd35a');
      emit(p.x, p.y - 12, 26, { sp: 60, life: 0.9, c: ['#ffd35a', '#ffffff', '#fff2a0'] });
      setTimeout(() => { if (G && G.w) { spawnReward(lm); Animals.toast('SOMETHING STIRS NEARBY...', 'LOOK AROUND THE ' + lm.name.split(' ').slice(-1)[0], '#c8a0ff'); } }, 1800);
      saveExplore();
    }
  }
  if (added) {
    recountExplore();
    const m = Math.floor(G.expPct / 25);
    if (m > G.expMile) { G.expMile = m; Animals.toast('EXPLORER!', G.expPct + '% OF THE REALM DISCOVERED', '#7affb0'); sfx.ok(); saveExplore(); }
  }
  if (G.saveT > 15) { G.saveT = 0; saveExplore(); }
}
function drawMap() {
  const p = G.p;
  rect(ctx, 'rgba(12,6,28,0.95)', 0, 0, W, H);
  box(ctx, 4, 4, W - 8, H - 8, '#f0c94d');
  text(ctx, 'MAP OF THE REALM', MAPX, 10, '#f6d365', 1, '#5a2a10');
  // unexplored = dark unknown with a faint grid
  rect(ctx, '#241a36', MAPX, MAPY, MW * MAPS, MH * MAPS);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i <= MW; i += 8) rect(ctx, '#34284a', MAPX + i * MAPS, MAPY, 1, MH * MAPS);
  for (let i = 0; i <= MH; i += 8) rect(ctx, '#34284a', MAPX, MAPY + i * MAPS, MW * MAPS, 1);
  ctx.globalAlpha = 1;
  if (G.mapDirty) { G.mapC[1].putImageData(new ImageData(G.mapPix, MW, MH), 0, 0); G.mapDirty = false; }
  ctx.drawImage(G.mapC[0], MAPX, MAPY, MW * MAPS, MH * MAPS);
  box(ctx, MAPX - 1, MAPY - 1, MW * MAPS + 2, MH * MAPS + 2, '#8a6a3a');
  const mx = tx => MAPX + tx * MAPS, my = ty => MAPY + ty * MAPS;
  // region names
  for (let k = 0; k < 8; k++) if (G.regSeen[k]) {
    const [cx, cy] = REGION_C[k], nm = REGION_NAMES[k], yy = k === 0 ? cy + 9 : cy;
    textC(ctx, nm, Math.round(mx(cx)), Math.round(my(yy)) - 3, '#ffffff', 1, '#1d1030');
  }
  // landmarks: gold star when found, "?" when you have been to the area but not yet found it
  for (const lm of LANDMARKS) {
    const x = Math.round(mx(lm.x + 0.5)), y = Math.round(my(lm.y));
    if (G.lmSeen[lm.id]) { rect(ctx, '#1d1030', x - 3, y - 3, 7, 7); rect(ctx, '#ffd35a', x - 2, y, 5, 1); rect(ctx, '#ffd35a', x, y - 2, 1, 5); rect(ctx, '#fff6c0', x - 1, y - 1, 3, 3); }
    else if (G.regSeen[lm.reg]) { rect(ctx, '#1d1030', x - 3, y - 4, 7, 9); textC(ctx, '?', x, y - 3, (Math.floor(G.t * 2) % 2) ? '#ffffff' : '#c8a0ff'); }
  }
  Npcs.drawMap(mx, my);
  // house + you
  const hx = Math.round(mx(G.w.door.x / T)), hy = Math.round(my(G.w.door.y / T)) - 3;
  rect(ctx, '#1d1030', hx - 3, hy - 3, 7, 7); rect(ctx, '#d9433f', hx - 2, hy - 2, 5, 2); rect(ctx, '#f4e0b0', hx - 2, hy, 5, 3);
  const ux = Math.round(mx(p.x / T)), uy = Math.round(my(p.y / T));
  if (Math.floor(G.t * 3) % 2 === 0) { rect(ctx, '#1d1030', ux - 3, uy - 3, 7, 7); rect(ctx, '#ff5a8a', ux - 2, uy - 2, 5, 5); rect(ctx, '#ffffff', ux - 1, uy - 1, 3, 3); }
  // side panel
  const x0 = MAPX + MW * MAPS + 10, w0 = W - 12 - x0;
  rect(ctx, '#241540', x0, MAPY, w0, MH * MAPS); box(ctx, x0, MAPY, w0, MH * MAPS, '#5a4a8a');
  text(ctx, 'EXPLORED', x0 + 5, MAPY + 5, '#ffffff'); textR(ctx, G.expPct + '%', x0 + w0 - 5, MAPY + 5, '#7affb0');
  rect(ctx, '#0d0820', x0 + 5, MAPY + 15, w0 - 10, 6); rect(ctx, '#5fd078', x0 + 6, MAPY + 16, Math.round((w0 - 12) * G.expPct / 100), 4);
  text(ctx, 'AREAS', x0 + 5, MAPY + 27, '#f6d365');
  for (let k = 0; k < 8; k++) {
    const y = MAPY + 37 + k * 9;
    rect(ctx, G.regSeen[k] ? REGION_COL[k] : '#3f3060', x0 + 5, y, 5, 5);
    text(ctx, G.regSeen[k] ? REGION_NAMES[k] : '???', x0 + 14, y - 1, G.regSeen[k] ? '#ffffff' : '#6a5a90');
  }
  const found = LANDMARKS.filter(l => G.lmSeen[l.id]).length;
  text(ctx, 'LANDMARKS ' + found + '/' + LANDMARKS.length, x0 + 5, MAPY + 113, '#f6d365');
  text(ctx, found === LANDMARKS.length ? 'YOU FOUND THEM ALL!' : 'LOOK FOR ? MARKS', x0 + 5, MAPY + 124, '#b9a6d8');
  text(ctx, 'HOUSE', x0 + 14, MAPY + 140, '#b9a6d8'); rect(ctx, '#d9433f', x0 + 5, MAPY + 140, 5, 5);
  text(ctx, 'YOU', x0 + 14, MAPY + 151, '#b9a6d8'); rect(ctx, '#ff5a8a', x0 + 5, MAPY + 151, 5, 5);
  textC(ctx, 'M / ESC: CLOSE', Math.round(x0 + w0 / 2), MAPY + MH * MAPS - 12, '#7a6aa0');
}

// ================================================================ WEATHER
const WX = {
  clear: { name: 'CLEAR', dark: 0 }, cloudy: { name: 'CLOUDY', dark: 0.12 }, rain: { name: 'RAIN', dark: 0.22 },
  storm: { name: 'STORM', dark: 0.38 }, fog: { name: 'FOG', dark: 0.1 }, windy: { name: 'BREEZY', dark: 0 }
};
const WX_NEXT = {
  clear: { cloudy: 0.3, windy: 0.25, fog: 0.15, rain: 0.1, clear: 0.2 }, cloudy: { rain: 0.4, clear: 0.25, fog: 0.1, windy: 0.1, storm: 0.15 },
  rain: { storm: 0.2, cloudy: 0.3, clear: 0.4, fog: 0.1 }, storm: { rain: 0.6, cloudy: 0.4 },
  fog: { clear: 0.5, cloudy: 0.3, rain: 0.2 }, windy: { clear: 0.45, cloudy: 0.4, rain: 0.15 }
};
let rainNode = null;
function initWeather() {
  G.wx = { type: 'clear', prev: 'clear', mix: 1, t: 110, fl: 0, lt: 6 };
  G.rainbow = 0; G.drops = null; G.leaves = null; G.wisps = null;
}
function wxS(type) { const w = G && G.wx; if (!w) return 0; return (w.type === type ? w.mix : 0) + (w.prev === type ? 1 - w.mix : 0); }
function wxDark() { let d = 0; for (const k in WX) d += WX[k].dark * wxS(k); return d; }
function wxWet() { return Math.max(wxS('rain'), wxS('storm')); }
function setWeather(type, dur) {
  const w = G.wx, h = G.min / 60;
  if ((w.type === 'rain' || w.type === 'storm') && (type === 'clear' || type === 'cloudy' || type === 'windy') && h >= 7 && h < 18) {
    G.rainbow = 75; if (!G.inside) Animals.toast('A RAINBOW APPEARS!', 'MAGICAL ANIMALS ARE STIRRING', '#ffd0f0');
  }
  w.prev = w.type; w.type = type; w.mix = 0;
  w.t = dur || (type === 'storm' ? 45 + Math.random() * 40 : type === 'cloudy' ? 50 + Math.random() * 40 : 70 + Math.random() * 70);
}
function rollWeather() {
  const tbl = WX_NEXT[G.wx.type]; let x = Math.random(), pick = 'clear';
  for (const k in tbl) { x -= tbl[k]; if (x <= 0) { pick = k; break; } }
  setWeather(pick);
}
function updateWeather(dt) {
  const w = G.wx;
  w.mix = Math.min(1, w.mix + dt / 6); w.t -= dt;
  if (w.t <= 0) rollWeather();
  G.rainbow = Math.max(0, G.rainbow - dt);
  const st = wxS('storm');
  if (st > 0.3) {
    w.lt -= dt;
    if (w.lt <= 0) { w.fl = 1; w.lt = 4 + Math.random() * 9; setTimeout(() => beep(70, 1.3, 'sawtooth', 0.07, -30), 350 + Math.random() * 500); }
  }
  w.fl = Math.max(0, w.fl - dt * 2.6);
  // rain sound (quiet when you are indoors)
  if (actx) {
    try {
      if (!rainNode) {
        const len = actx.sampleRate * 2, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = actx.createBufferSource(); src.buffer = b; src.loop = true;
        const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1700;
        const gn = actx.createGain(); gn.gain.value = 0; src.connect(f); f.connect(gn); gn.connect(actx.destination); src.start(); rainNode = gn;
      }
      const v = (0.035 * wxS('rain') + 0.06 * st) * (G.inside ? 0.35 : 1);
      rainNode.gain.setTargetAtTime(v, actx.currentTime, 0.4);
    } catch (e) { /* no audio */ }
  }
}
function drawWeather(cx, cy) {
  const w = G.wx, p = G.p, dark = wxDark(), rain = wxS('rain'), storm = wxS('storm'), fog = wxS('fog'), wind = wxS('windy');
  const reg = G.w.region[Math.floor(p.y / T) * MW + Math.floor(p.x / T)], snowy = reg === 3;
  // rainbow
  if (G.rainbow > 0) {
    const a = Math.min(1, G.rainbow / 10, (75 - G.rainbow) / 6) * 0.3;
    ctx.globalAlpha = a;
    ['#ff5a5a', '#ffa04a', '#ffe14a', '#6ad86a', '#5ab4ff', '#7a6aff', '#c06aff'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W * 0.72, H + 60, 150 - i * 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  if (dark > 0.005) { ctx.fillStyle = `rgba(30,40,80,${dark * 1.1})`; ctx.fillRect(0, 0, W, H); }
  // fog
  if (fog > 0.01) {
    const px = Math.round(p.x) - cx, py = Math.round(p.y) - 12 - cy;
    const gr = ctx.createRadialGradient(px, py, 38, px, py, 150);
    gr.addColorStop(0, 'rgba(214,224,236,0)'); gr.addColorStop(1, `rgba(214,224,236,${0.72 * fog})`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    if (!G.wisps) G.wisps = Array.from({ length: 7 }, (_, i) => ({ x: i * 60, y: 20 + (i * 53) % 180, s: 8 + i * 2, r: 50 + (i * 17) % 40 }));
    ctx.globalAlpha = 0.14 * fog;
    for (const q of G.wisps) { q.x = (q.x + q.s * 0.016 + W + 160) % (W + 160); ell(ctx, '#e8eef6', q.x - 80, q.y, q.r, q.r * 0.3); }
    ctx.globalAlpha = 1;
  }
  // rain / snow
  const wet = rain * 0.7 + storm, cnt = Math.floor(wet * 190);
  if (cnt > 0) {
    if (!G.drops) G.drops = Array.from({ length: 260 }, () => ({ x: Math.random() * (W + 80), y: Math.random() * H, v: 0.8 + Math.random() * 0.5 }));
    const fall = (snowy ? 40 : 230 + storm * 90), dt = 1 / 60;
    for (let i = 0; i < Math.min(cnt, 260); i++) {
      const d = G.drops[i];
      d.y += fall * d.v * dt; d.x += (snowy ? Math.sin(G.t * 1.5 + i) * 0.4 : -(40 + storm * 40) * d.v * dt) - cx * 0 ;
      if (d.y > H) { d.y = -6; d.x = Math.random() * (W + 80); if (!snowy && Math.random() < 0.35) emit(cx + d.x, cy + H - 4 - Math.random() * 40, 0, {}); }
      if (d.x < -4) d.x += W + 80;
      if (snowy) { rect(ctx, 'rgba(255,255,255,0.9)', Math.round(d.x), Math.round(d.y), 2, 2); }
      else { ctx.globalAlpha = 0.8; rect(ctx, '#cfe0ff', Math.round(d.x), Math.round(d.y), 1, 5 + storm * 3); ctx.globalAlpha = 1; }
    }
  }
  // wind: drifting leaves / petals
  if (wind > 0.05) {
    if (!G.leaves) G.leaves = Array.from({ length: 36 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 0.8, ph: Math.random() * 6 }));
    const cols = reg === 3 ? ['#ffffff', '#d8ecf8'] : reg === 6 ? ['#ffd23a', '#f4a82a'] : reg === 1 ? ['#c8a0ff', '#7ad0ff'] : ['#ffb8d0', '#9ae87a', '#e8c84a'];
    const n = Math.floor(36 * wind);
    for (let i = 0; i < n; i++) {
      const q = G.leaves[i];
      q.x += 60 * q.v / 60; q.y += Math.sin(G.t * 2 + q.ph) * 0.5 + 0.25;
      if (q.x > W + 4) { q.x = -4; q.y = Math.random() * H; } if (q.y > H) q.y = -4; if (q.y < -6) q.y = H;
      rect(ctx, cols[i % cols.length], Math.round(q.x), Math.round(q.y), 2, 1);
    }
  }
  if (w.fl > 0.01) { ctx.globalAlpha = w.fl * 0.6; rect(ctx, '#f4f8ff', 0, 0, W, H); ctx.globalAlpha = 1; }
}

// ================================================================ HOUSE INTERIOR
const RM = { x0: 80, x1: 304, wallT: 44, floorT: 92, floorB: 184 };
const RM_SOLID = [
  [88, 94, 130, 132],     // bed
  [131, 96, 146, 110],    // nightstand
  [188, 88, 228, 104],    // hearth
  [268, 88, 300, 100],    // bookshelf base
  [92, 143, 134, 162],    // table
  [280, 150, 296, 172]    // plant
];
function bakeRoom() {
  const [c, g] = mk(W, H);
  rect(g, '#150c20', 0, 0, W, H);
  // outer frame
  rect(g, '#3d2412', RM.x0 - 16, RM.wallT - 8, RM.x1 - RM.x0 + 32, RM.floorB - RM.wallT + 26);
  rect(g, '#5e3a1c', RM.x0 - 14, RM.wallT - 6, RM.x1 - RM.x0 + 28, RM.floorB - RM.wallT + 22);
  // back wall plaster + beams + wainscot
  rect(g, '#e8d6ac', RM.x0, RM.wallT, RM.x1 - RM.x0, RM.floorT - RM.wallT);
  for (let x = RM.x0; x < RM.x1; x += 4) rect(g, x % 8 ? '#e0cc9e' : '#ecdcb4', x, RM.wallT, 1, 30);
  rect(g, '#7a4b26', RM.x0, RM.wallT, RM.x1 - RM.x0, 4); rect(g, '#5e3a1c', RM.x0, RM.wallT + 3, RM.x1 - RM.x0, 1);
  for (const x of [RM.x0, 146, 184, 232, 266, RM.x1 - 5]) { rect(g, '#7a4b26', x, RM.wallT, 5, 48); rect(g, '#5e3a1c', x + 4, RM.wallT, 1, 48); }
  rect(g, '#8a5a34', RM.x0, 76, RM.x1 - RM.x0, 16); rect(g, '#a8743f', RM.x0, 76, RM.x1 - RM.x0, 2); rect(g, '#6a4424', RM.x0, 91, RM.x1 - RM.x0, 1);
  for (let x = RM.x0 + 8; x < RM.x1; x += 14) rect(g, '#74492a', x, 78, 1, 13);
  // floor planks
  for (let y = RM.floorT; y < RM.floorB; y += 8) for (let x = RM.x0; x < RM.x1; x += 28) {
    const off = ((y - RM.floorT) / 8) % 2 ? 14 : 0, xx = x - off, shade = h2(xx, y) % 3;
    const w0 = Math.max(0, RM.x0 - xx), w1 = Math.min(28, RM.x1 - xx);
    rect(g, ['#b07a48', '#a8723f', '#b88050'][shade], Math.max(xx, RM.x0), y, w1 - w0, 8);
    rect(g, '#7a4f2a', Math.max(xx, RM.x0), y + 7, w1 - w0, 1); if (xx > RM.x0) rect(g, '#7a4f2a', xx, y, 1, 8);
  }
  rect(g, '#5a3a1c', RM.x0, RM.floorB, RM.x1 - RM.x0, 4); rect(g, '#3d2412', RM.x0, RM.floorB + 3, RM.x1 - RM.x0, 1);
  // side shading
  g.globalAlpha = 0.3; rect(g, '#000', RM.x0, RM.floorT, 10, RM.floorB - RM.floorT); rect(g, '#000', RM.x1 - 10, RM.floorT, 10, RM.floorB - RM.floorT); g.globalAlpha = 1;
  // rug
  rect(g, '#6a2a34', 140, 120, 120, 54); rect(g, '#a03c4a', 142, 122, 116, 50); rect(g, '#e8d6ac', 146, 126, 108, 42); rect(g, '#a03c4a', 148, 128, 104, 38);
  for (let x = 152; x < 248; x += 12) { rect(g, '#e8d6ac', x, 142, 6, 6); rect(g, '#f4c64a', x + 2, 144, 2, 2); }
  for (let y = 120; y < 174; y += 4) { rect(g, '#e8d6ac', 138, y, 2, 2); rect(g, '#e8d6ac', 260, y, 2, 2); }
  // bed
  rect(g, '#4a2a14', 86, 92, 44, 42); rect(g, '#7a4b26', 88, 94, 40, 38);
  rect(g, '#f4ecdc', 90, 96, 36, 10); rect(g, '#ffffff', 92, 97, 14, 7); rect(g, '#ffffff', 108, 97, 14, 7); rect(g, '#d8cdb8', 92, 103, 14, 1);
  rect(g, '#6a3a8a', 90, 108, 36, 22); rect(g, '#8a5ab0', 90, 108, 36, 5); rect(g, '#52286e', 90, 126, 36, 4);
  for (let x = 94; x < 124; x += 8) { rect(g, '#a888d0', x, 116, 4, 1); rect(g, '#a888d0', x + 2, 120, 4, 1); }
  rect(g, '#3d2412', 86, 132, 44, 2);
  // nightstand + lamp
  rect(g, '#5e3a1c', 131, 100, 15, 12); rect(g, '#8a5a34', 132, 100, 13, 3); rect(g, '#3d2412', 131, 111, 15, 1); rect(g, '#f0c94d', 137, 106, 3, 2);
  rect(g, '#d8d0c0', 138, 92, 2, 8); rect(g, '#ffe8a0', 134, 88, 10, 6);
  // windows + curtains (sky is drawn live)
  for (const x of [152, 240]) {
    rect(g, '#3d2412', x - 2, 52, 28, 32); rect(g, '#5e3a1c', x - 1, 53, 26, 30);
    rect(g, '#3d2412', x + 11, 54, 2, 28); rect(g, '#3d2412', x, 67, 24, 2);
    rect(g, '#8a5a34', x - 4, 82, 32, 3);
    rect(g, '#a03c4a', x - 3, 53, 4, 28); rect(g, '#c85a64', x - 3, 53, 1, 28); rect(g, '#a03c4a', x + 23, 53, 4, 28);
  }
  // fireplace
  rect(g, '#5a5c68', 186, 52, 44, 52); rect(g, '#8a8f98', 188, 54, 40, 48); rect(g, '#6a6f7a', 188, 70, 40, 1);
  for (let y = 56; y < 100; y += 8) for (let x = 188 + ((y / 8) % 2) * 5; x < 228; x += 10) rect(g, '#6a6f7a', x, y, 1, 8);
  rect(g, '#2a1a14', 196, 72, 24, 28); rect(g, '#14100c', 198, 74, 20, 26);
  rect(g, '#7a4b26', 182, 48, 52, 5); rect(g, '#a8743f', 182, 48, 52, 2);
  rect(g, '#d9433f', 192, 38, 4, 10); rect(g, '#f4c64a', 205, 41, 6, 7); rect(g, '#8fd3f4', 218, 40, 4, 8);   // mantel decor
  rect(g, '#5e3a1c', 196, 98, 24, 4);
  // bookshelf
  rect(g, '#3d2412', 266, 48, 36, 54); rect(g, '#7a4b26', 268, 50, 32, 50);
  for (const y of [50, 62, 74, 88]) rect(g, '#4a2a14', 268, y + 10, 32, 2);
  const bk = ['#d9433f', '#4a9eff', '#f0c94d', '#5fd078', '#b06ad8', '#ff8a5a', '#8fd3f4'];
  for (let row = 0; row < 4; row++) { let x = 270; const by = [60, 72, 84, 98][row]; for (let i = 0; i < 7 && x < 296; i++) { const w0 = 2 + (h2(row, i) % 3), h0 = 7 + (h2(i, row) % 4); rect(g, bk[(i + row) % 7], x, by - h0, w0, h0); x += w0 + 1; } }
  rect(g, '#3d2412', 266, 100, 36, 3);
  // table + chairs
  ell(g, 'rgba(0,0,0,0.25)', 113, 163, 22, 4);
  rect(g, '#4a2a14', 92, 143, 42, 17); rect(g, '#a8743f', 93, 144, 40, 12); rect(g, '#c8955a', 93, 144, 40, 2); rect(g, '#6a4424', 96, 158, 3, 5); rect(g, '#6a4424', 127, 158, 3, 5);
  rect(g, '#f4ecdc', 102, 146, 14, 7); rect(g, '#d9433f', 118, 145, 5, 5); rect(g, '#ff7a6a', 119, 145, 2, 2); rect(g, '#f0c94d', 105, 140, 6, 6); rect(g, '#fff0a0', 106, 140, 3, 3);
  for (const x of [84, 136]) { rect(g, '#5e3a1c', x, 148, 7, 12); rect(g, '#8a5a34', x + 1, 149, 5, 4); rect(g, '#5e3a1c', x + 1, 160, 2, 3); rect(g, '#5e3a1c', x + 4, 160, 2, 3); }
  // plant
  ell(g, 'rgba(0,0,0,0.25)', 288, 172, 9, 2.5);
  rect(g, '#8a4a28', 282, 160, 12, 12); rect(g, '#a8643c', 282, 160, 12, 3); rect(g, '#6a3a1c', 283, 171, 10, 1);
  for (const [x, y, w0] of [[283, 144, 4], [289, 140, 4], [292, 148, 3], [280, 152, 4], [286, 150, 5]]) { ell(g, '#2f7a3a', x + 2, y + 6, w0 + 2, 6); ell(g, '#4aa84a', x + 1, y + 4, w0, 4); }
  // wall pictures
  rect(g, '#3d2412', 104, 54, 22, 16); rect(g, '#a8d8f4', 106, 56, 18, 12); rect(g, '#5a9a3a', 106, 63, 18, 5); aTri(g, '#7a8a9a', 108, 63, 114, 57, 120, 63); rect(g, '#ffffff', 112, 57, 3, 2);
  // door + mat
  rect(g, '#3d2412', 172, 184, 40, 22); rect(g, '#5e3a1c', 174, 186, 36, 20);
  rect(g, '#7a4b26', 178, 168, 28, 16); rect(g, '#5e3a1c', 180, 170, 24, 12);
  rect(g, '#a03c4a', 176, 172, 32, 10); rect(g, '#e8d6ac', 178, 174, 28, 6);
  return c;
}
function roomHits(x, y) {
  if (x < RM.x0 + 8 || x > RM.x1 - 8 || y < RM.floorT + 12 || y > RM.floorB + 18) return true;
  for (const [a, b, c2, d] of RM_SOLID) if (x > a - 4 && x < c2 + 4 && y > b && y < d + 7) return true;
  return false;
}
function houseEnter() {
  G.fx = { mode: 'out', t: 0, dur: 0.35, cb: () => { G.inside = true; G.outPos = { x: G.p.x, y: G.p.y }; G.p.x = 192; G.p.y = 168; G.p.dir = 'up'; G.p.moving = false; G.room = G.room || bakeRoom(); G.cooldown = 0.6; } };
}
function houseExit() {
  G.fx = { mode: 'out', t: 0, dur: 0.35, cb: () => { G.inside = false; G.journal = false; G.p.x = G.w.door.x; G.p.y = G.w.door.y + 16; G.p.dir = 'down'; G.p.moving = false; G.cooldown = 0.6; G.trail.length = 0; for (const a of G.pets) { a.x = G.p.x + (Math.random() - 0.5) * 20; a.y = G.p.y + 6; } G.cam.x = clamp(G.p.x - W / 2, 0, MW * T - W); G.cam.y = clamp(G.p.y - H / 2, 0, MH * T - H); } };
}
function sleepNow() {
  G.fx = { mode: 'out', t: 0, dur: 1.1, label: 'ZZZ...', cb: () => {
    G.min = 360; G.day++; G.banner = 3; G.p.mana = G.hero.maxMana; G.sleptMsg = 4; rollWeather(); G.wx.mix = 1; G.wx.prev = G.wx.type;
    G.animals = G.animals.filter(a => a.keep); G.spawnT = 0; saveExplore();
  } };
}
function nearRect(r, pad) { const p = G.p; return p.x > r[0] - pad && p.x < r[2] + pad && p.y > r[1] - pad && p.y < r[3] + pad + 8; }
function updateInside(dt) {
  const p = G.p;
  G.cooldown = Math.max(0, G.cooldown - dt);
  if (G.journal) { if (hit('KeyE', 'Escape', 'Enter')) { G.journal = false; sfx.move(); } return; }
  const ix = (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
  const iy = (down('KeyS', 'ArrowDown') ? 1 : 0) - (down('KeyW', 'ArrowUp') ? 1 : 0);
  p.moving = !!(ix || iy); p.run = false;
  if (p.moving) {
    const l = Math.hypot(ix, iy), sp = G.hero.speed * 0.8;
    const nx = p.x + ix / l * sp * dt, ny = p.y + iy / l * sp * dt;
    if (!roomHits(nx, p.y)) p.x = nx;
    if (!roomHits(p.x, ny)) p.y = ny;
    p.ax = ix / l; p.ay = iy / l;
    if (ix && !iy) p.dir = ix < 0 ? 'left' : 'right'; else if (iy && !ix) p.dir = iy < 0 ? 'up' : 'down'; else p.dir = ix < 0 ? 'left' : 'right';
    p.anim += dt * 7.5;
  } else p.anim = 0;
  // leave through the door mat
  if (G.cooldown <= 0 && p.y > RM.floorB + 3 && p.x > 176 && p.x < 208 && iy > 0) { houseExit(); return; }
  p.mana = Math.min(G.hero.maxMana, p.mana + 20 * dt);
  G.prompt = null;
  const nearBed = nearRect(RM_SOLID[0], 16), nearFire = nearRect(RM_SOLID[2], 14), nearBooks = nearRect(RM_SOLID[3], 14);
  if (nearBed) G.prompt = G.min >= 17 * 60 ? 'E: SLEEP UNTIL MORNING' : 'NOT TIRED YET (AFTER 5 PM)';
  else if (nearFire) G.prompt = 'E: WARM UP BY THE FIRE';
  else if (nearBooks) G.prompt = 'E: OPEN YOUR JOURNAL';
  if (hit('KeyE', 'Enter')) {
    if (nearBed) { if (G.min >= 17 * 60) { sleepNow(); sfx.ok(); } else sfx.no(); }
    else if (nearFire) { p.mana = G.hero.maxMana; G.warm = 3; emit(p.x, p.y - 20, 12, { sp: 30, life: 0.8, c: ['#ffd070', '#ff9a40'], vy: -20 }); Animals.toast('SO COZY...', 'MANA FULLY RESTORED', '#ffb070'); sfx.ok(); }
    else if (nearBooks) { G.journal = true; sfx.ok(); }
  }
  for (const q of G.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; }
  G.parts = G.parts.filter(q => q.life > 0);
  G.warm = Math.max(0, (G.warm || 0) - dt);
}
function skyColors() {
  const h = G.min / 60;
  if (h >= 7 && h < 17) return ['#8fd3f4', '#cdeefc'];
  if (h >= 17 && h < 19) return ['#f4a06a', '#ffd9a0'];
  if (h >= 19 || h < 5) return ['#141c48', '#26306a'];
  return ['#f4b88a', '#ffe0b8'];
}
function drawInside() {
  const p = G.p, night = nightStrength();
  ctx.drawImage(G.room, 0, 0);
  const [s1, s2] = skyColors(), wet = wxWet();
  for (const x of [152, 240]) {
    rect(ctx, wet > 0.4 ? '#7a8aa0' : s1, x, 54, 24, 28); rect(ctx, wet > 0.4 ? '#9aaac0' : s2, x, 54, 24, 8);
    if (G.min / 60 >= 19 || G.min / 60 < 5) { for (const [sx, sy] of [[4, 6], [16, 12], [10, 20], [19, 5]]) rect(ctx, '#fff', x + sx, 54 + sy, 1, 1); ell(ctx, '#f4f0d8', x + 17, 62, 3, 3); }
    if (wet > 0.3) for (let i = 0; i < 6; i++) rect(ctx, '#d0e0ff', x + 2 + ((i * 7 + Math.floor(G.t * 30)) % 20), 56 + ((i * 11 + Math.floor(G.t * 60)) % 24), 1, 3);
    rect(ctx, '#3d2412', x + 11, 54, 2, 28); rect(ctx, '#3d2412', x, 67, 24, 2);
  }
  // fire
  const fl = Math.floor(G.t * 8);
  ell(ctx, '#d9433f', 208, 96, 8, 6); ell(ctx, '#ff9a30', 208, 96, 6, 5 + (fl % 2)); ell(ctx, '#ffe27a', 208, 98, 3, 3 + ((fl >> 1) % 2));
  aTri(ctx, '#ff9a30', 203, 98, 213, 98, 208 + (fl % 3 - 1), 82 + (fl % 2) * 2);
  aTri(ctx, '#ffe27a', 205, 98, 211, 98, 208, 88 + (fl % 2));
  rect(ctx, '#5a3a1c', 200, 98, 16, 3);
  // pets rest on the rug
  G.pets.forEach((a, i) => {
    const sp = Animals.spr[a.s.id], x = 160 + i * 28, y = 150 + (i % 2) * 9;
    ell(ctx, 'rgba(0,0,0,0.25)', x, y, sp.w * 0.38, 2);
    ctx.drawImage(sp.frames[i % 2 ? 'left' : 'right'][0], Math.round(x - sp.w / 2), y - sp.h + Math.round(Math.sin(G.t * 2 + i) * 0.5));
    if (Math.floor(G.t / 2 + i) % 3 === 0) textC(ctx, 'Z', x + 6, y - sp.h - 8 - Math.floor(G.t * 3) % 4, '#c8d8ff');
  });
  // player (and sprites standing below the player draw after)
  ell(ctx, 'rgba(0,0,0,0.28)', Math.round(p.x), Math.round(p.y), 6, 2.5);
  ctx.drawImage(G.spr.frames[p.dir][playerFrame()], Math.round(p.x) - 10 * NS, Math.round(p.y) - 37 * NS, 20 * NS, 38 * NS);
  for (const q of G.parts) { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); rect(ctx, q.c, Math.round(q.x), Math.round(q.y), q.s, q.s); } ctx.globalAlpha = 1;
  // warm light + dusk dimming
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, a] of [[208, 96, 90, 0.34], [138, 90, 46, 0.2], [113, 140, 30, 0.12]]) {
    const gr = ctx.createRadialGradient(x, y, 2, x, y, r * (0.95 + 0.05 * Math.sin(G.t * 9)));
    gr.addColorStop(0, `rgba(255,170,80,${a + (G.warm > 0 ? 0.12 : 0)})`); gr.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (night > 0.05) { ctx.globalAlpha = night * 0.28; rect(ctx, '#0a1040', RM.x0, RM.wallT, RM.x1 - RM.x0, RM.floorB - RM.wallT); ctx.globalAlpha = 1; }
  if (G.prompt) textC(ctx, G.prompt, W / 2, 196, '#ffffff', 1, '#1d1030');
  textC(ctx, 'WALK DOWN THROUGH THE DOOR TO GO OUTSIDE', W / 2, 206, '#9a88c0');
  if (G.journal) drawJournal();
  drawHUD();
}
function drawJournal() {
  rect(ctx, 'rgba(12,6,28,0.9)', 0, 0, W, H);
  rect(ctx, '#e8d6ac', 70, 24, 244, 168); box(ctx, 70, 24, 244, 168, '#5e3a1c'); rect(ctx, '#5e3a1c', 191, 26, 2, 164);
  text(ctx, "NINA'S JOURNAL", 82, 32, '#5a2a10', 1);
  const dk = '#3d2412', ink = '#6a4424';
  text(ctx, 'ANIMALS TAMED', 82, 48, dk); text(ctx, Object.keys(G.col).length + ' / ' + SPECIES.length, 82, 58, '#a03c4a');
  text(ctx, 'REALM EXPLORED', 82, 74, dk); text(ctx, G.expPct + '%', 82, 84, '#a03c4a');
  text(ctx, 'DAYS PASSED', 82, 100, dk); text(ctx, String(G.day), 82, 110, '#a03c4a');
  text(ctx, 'TODAY: ' + WX[G.wx.type].name, 82, 126, dk);
  text(ctx, 'TIP: RAINBOWS BRING', 82, 144, ink); text(ctx, 'MAGICAL ANIMALS.', 82, 153, ink);
  text(ctx, 'STORMS CALL THE', 82, 165, ink); text(ctx, 'THUNDER WOLF.', 82, 174, ink);
  text(ctx, 'LANDMARKS', 202, 32, '#5a2a10');
  LANDMARKS.forEach((l, i) => {
    const got = G.lmSeen[l.id], y = 48 + i * 22;
    rect(ctx, got ? '#ffd35a' : '#a89870', 202, y, 6, 6);
    text(ctx, got ? l.name : '??? ' + REGION_NAMES[l.reg].split(' ').slice(-1)[0], 214, y - 1, got ? dk : '#8a7a58');
    if (got) text(ctx, 'FOUND', 214, y + 8, '#4a8a3a');
  });
  textC(ctx, 'E / ESC: CLOSE', W / 2, 182, '#8a7a58');
}
