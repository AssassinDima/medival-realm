'use strict';
/* =====================================================================
   game.js  -  MEDIEVAL REALM  (pure canvas + JS, no engine)
   Scenes: title -> select -> loading -> play
   Internal resolution 384x216, 16px tiles, scaled up with crisp pixels.
   ===================================================================== */
const W = 384, H = 216, T = 16, TAU = Math.PI * 2, MW = 96, MH = 72;

const canvas = document.getElementById('game');
canvas.width = W * HS; canvas.height = H * HS;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.setTransform(HS, 0, 0, HS, 0, 0);
function fitCanvas() {
  const f = Math.min(innerWidth / W, innerHeight / H);
  const s = (typeof TouchUI !== 'undefined' && TouchUI.on) ? Math.max(1, f) : Math.max(1, Math.floor(f) || 1);
  canvas.style.width = W * s + 'px';
  canvas.style.height = H * s + 'px';
}
addEventListener('resize', fitCanvas); fitCanvas();

// ---------------------------------------------------------------- utils
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function h2(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
function box(g, x, y, w, h, c) {
  rect(g, c, x, y, w, 1); rect(g, c, x, y + h - 1, w, 1);
  rect(g, c, x, y, 1, h); rect(g, c, x + w - 1, y, 1, h);
}
function fromRows(rows, pal) {
  const [c, g] = mk(rows[0].length, rows.length);
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (pal[r[x]]) rect(g, pal[r[x]], x, y, 1, 1); });
  return c;
}

// ---------------------------------------------------------------- input
const keys = new Set(), pressed = new Set();
const BLOCK = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];
addEventListener('keydown', e => {
  if (BLOCK.includes(e.code)) e.preventDefault();
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
  initAudio();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const down = (...c) => c.some(k => keys.has(k));
const hit = (...c) => c.some(k => pressed.has(k));

// ---------------------------------------------------------------- audio (tiny synth beeps)
let actx = null;
function initAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    else if (actx.state === 'suspended') actx.resume();
  } catch (e) { /* no audio */ }
}
function beep(f, d, type = 'square', vol = 0.035, slide = 0) {
  if (!actx) return;
  try {
    const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t0 + d);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(t0 + d);
  } catch (e) { /* ignore */ }
}
const sfx = {
  move: () => beep(520, 0.05),
  ok: () => { beep(660, 0.08); setTimeout(() => beep(990, 0.12), 70); },
  no: () => beep(130, 0.15, 'sawtooth'),
  cast: () => beep(900, 0.18, 'triangle', 0.05, 700),
  freeze: () => beep(1400, 0.5, 'sine', 0.05, -1000),
  hit: () => beep(300, 0.12, 'sawtooth', 0.04, -150),
  pop: () => beep(500, 0.2, 'triangle', 0.05, 400)
};
sfx.tame = ri => { [0, 4, 7, 12, 16].slice(0, 3 + Math.min(2, ri >> 1)).forEach((n, i) => setTimeout(() => beep(523 * Math.pow(2, (n + ri) / 12), 0.35, 'triangle', 0.05), i * 90)); };
sfx.toast = () => beep(880, 0.12, 'sine', 0.03);
// calm generative music: soft pentatonic plucks, lower and sparser at night
let musicOn = true, noteT = 2, noteN = 0;
const PENT_DAY = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
const PENT_NIGHT = [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0];
function musicTick(dt) {
  if (!actx || !musicOn) return;
  noteT -= dt;
  if (noteT > 0) return;
  const night = G.min / 60 >= 19 || G.min / 60 < 6, sc = night ? PENT_NIGHT : PENT_DAY;
  noteT = (night ? 2.2 : 1.4) + Math.random() * 2.4;
  const f = sc[Math.floor(Math.random() * sc.length)];
  beep(f, 3.2, 'sine', 0.022);
  if (Math.random() < 0.35) setTimeout(() => beep(f * 1.5, 2.6, 'sine', 0.014), 650);
  if (++noteN % 6 === 0) beep(sc[0] / 2, 5, 'triangle', 0.016);
}

// ---------------------------------------------------------------- bitmap font (5x7)
const FONT_SRC = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.###.', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '####.|....#|....#|.###.|....#|....#|####.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '.###.|#....|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|....#|.###.',
  '.': '.....|.....|.....|.....|.....|.##..|.##..', ',': '.....|.....|.....|.....|.##..|..#..|.#...',
  ':': '.....|.##..|.##..|.....|.##..|.##..|.....', '-': '.....|.....|.....|#####|.....|.....|.....',
  '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  "'": '..#..|..#..|.#...|.....|.....|.....|.....', '/': '....#|....#|...#.|..#..|.#...|#....|#....',
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....', '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.',
  ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...', '*': '.....|.....|.##..|.##..|.....|.....|.....',
  '%': '##..#|##..#|...#.|..#..|.#...|#..##|#..##',
  '>': '#....|.#...|..#..|...#.|..#..|.#...|#....', '<': '....#|...#.|..#..|.#...|..#..|...#.|....#'
};
const GLYPHS = {};
for (const k in FONT_SRC) GLYPHS[k] = FONT_SRC[k].split('|');
const glyphCache = new Map();
function glyph(ch, col) {
  const key = ch + col;
  let c = glyphCache.get(key);
  if (!c) {
    const rows = GLYPHS[ch];
    if (!rows) return null;
    const [cv, g] = mk(5, 7);
    g.fillStyle = col;
    rows.forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] === '#') g.fillRect(x, y, 1, 1); });
    c = cv; glyphCache.set(key, c);
  }
  return c;
}
const textW = (s, sc = 1) => Math.max(0, String(s).length * 6 * sc - sc);
function drawStr(g, s, x, y, col, sc) {
  let cx = Math.round(x);
  for (const ch of s) {
    const gl = glyph(ch, col);
    if (gl) g.drawImage(gl, cx, Math.round(y), 5 * sc, 7 * sc);
    cx += 6 * sc;
  }
}
function text(g, s, x, y, col = '#fff', sc = 1, sh = null) {
  s = String(s).toUpperCase();
  if (sh) drawStr(g, s, x + sc, y + sc, sh, sc);
  drawStr(g, s, x, y, col, sc);
}
const textC = (g, s, cx, y, col, sc = 1, sh = null) => text(g, s, Math.round(cx - textW(s, sc) / 2), y, col, sc, sh);
const textR = (g, s, rx, y, col, sc = 1, sh = null) => text(g, s, Math.round(rx - textW(s, sc)), y, col, sc, sh);

// ---------------------------------------------------------------- sprites / tiles
const SPR = {};
function mkGrass(seed) {
  const [c, g] = mk(16, 16), r = mulberry32(seed);
  rect(g, '#74b64b', 0, 0, 16, 16);
  const cols = ['#68a940', '#82c658', '#5e9a3a'];
  for (let i = 0; i < 14; i++) rect(g, cols[Math.floor(r() * 3)], Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
  for (let i = 0; i < 2; i++) {
    const x = Math.floor(r() * 13) + 1, y = Math.floor(r() * 11) + 3;
    rect(g, '#5a9437', x, y, 1, 2); rect(g, '#8fd25f', x + 1, y - 1, 1, 1);
  }
  return c;
}
function mkDirt(seed) {
  const [c, g] = mk(16, 16), r = mulberry32(seed);
  rect(g, '#b98e5a', 0, 0, 16, 16);
  const cols = ['#a57a48', '#cba372', '#9a6f3f'];
  for (let i = 0; i < 16; i++) rect(g, cols[Math.floor(r() * 3)], Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
  for (let i = 0; i < 2; i++) rect(g, '#8d6a44', Math.floor(r() * 14), Math.floor(r() * 15), 2, 1);
  return c;
}
function mkWater(f) {
  const [c, g] = mk(16, 16);
  rect(g, '#3e8fd0', 0, 0, 16, 16);
  rect(g, '#3a86c6', 0, 5, 16, 1); rect(g, '#3a86c6', 0, 12, 16, 1);
  for (const [x, y] of [[1, 2], [9, 6], [4, 10], [11, 14]]) {
    const xx = (x + f * 3) % 13;
    rect(g, '#86caf5', xx, y, 3, 1); rect(g, '#5eb0ea', xx + 1, y + 1, 2, 1);
  }
  return c;
}
function mkIce(v) {
  const [c, g] = mk(16, 16), r = mulberry32(55 + v * 7);
  rect(g, '#a8dff2', 0, 0, 16, 16); rect(g, '#c4eefa', 1, 1, 14, 14);
  for (let i = 0; i < 5; i++) rect(g, '#effcff', Math.floor(r() * 12), Math.floor(r() * 14), 3 + Math.floor(r() * 3), 1);
  let x = Math.floor(r() * 10) + 2, y = 2;
  for (let i = 0; i < 12; i++) { rect(g, '#7cbad6', x, y, 1, 1); if (r() < 0.5) x += r() < 0.5 ? 1 : -1; y++; }
  rect(g, '#ffffff', 3 + v * 6, 3, 1, 1);
  return c;
}
function mkSoil() {
  const [c, g] = mk(16, 16);
  rect(g, '#7b5234', 0, 0, 16, 16);
  for (let y = 2; y < 16; y += 4) { rect(g, '#5f3f27', 0, y, 16, 1); rect(g, '#8f6340', 0, y + 1, 16, 1); }
  const r = mulberry32(9);
  for (let i = 0; i < 10; i++) rect(g, '#6b452b', Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
  return c;
}
const TREE_PALS = [
  { o: '#1f4d2a', d: '#2f7a3a', m: '#3f9a47', l: '#63c05a', h: '#8fe07a' },
  { o: '#2b5a24', d: '#4a8a30', m: '#62a83a', l: '#8ccc4a', h: '#b4e86a' },
  { o: '#6a2a14', d: '#b8501c', m: '#e07a24', l: '#f4a63a', h: '#ffd070' }
];
function mkTree(p) {
  const [c, g] = mk(32, 40);
  rect(g, '#4a2e16', 11, 37, 10, 2);
  rect(g, '#5a3a1c', 12, 26, 8, 12); rect(g, '#7a4d26', 13, 26, 6, 11); rect(g, '#9a6a3a', 13, 26, 2, 9);
  const blobs = [[16, 11, 9], [9, 18, 8], [23, 18, 8], [16, 19, 10]];
  for (const [x, y, r] of blobs) ell(g, p.o, x, y, r + 1, r + 1);
  for (const [x, y, r] of blobs) ell(g, p.m, x, y, r, r);
  for (const [x, y, r] of blobs) ell(g, p.d, x + 1, y + 3, r - 2, r - 4);
  for (const [x, y, r] of blobs) ell(g, p.l, x - 2, y - 3, r - 4, r - 5);
  for (const [x, y] of [[12, 8], [20, 14], [8, 16], [16, 20], [24, 20], [14, 13]]) rect(g, p.h, x, y, 2, 1);
  return c;
}
function mkRock() {
  const [c, g] = mk(16, 16);
  ell(g, '#4a4e57', 8, 10.5, 7.5, 5.5); ell(g, '#868b96', 8, 9.5, 6.5, 4.5); ell(g, '#a9aeb9', 6.5, 8, 3.5, 2.5);
  rect(g, '#6a6f7a', 10, 11, 3, 1); rect(g, '#d0d4dc', 5, 7, 2, 1);
  return c;
}
function mkBush() {
  const [c, g] = mk(16, 16);
  ell(g, '#245a2c', 8, 10, 7.5, 5.5); ell(g, '#3f9a47', 8, 9.5, 6.5, 4.5); ell(g, '#63c05a', 6, 8, 3.5, 2.5);
  for (const [x, y] of [[4, 10], [10, 8], [11, 11], [7, 12]]) rect(g, '#d9433f', x, y, 1, 1);
  return c;
}
function mkFlowers(v) {
  const [c, g] = mk(16, 16);
  const cols = ['#ffffff', '#ff8fb8', '#ffd84a', '#8fb8ff', '#c08aff'];
  const pos = [[[4, 6], [11, 11]], [[10, 4], [5, 11]], [[3, 10], [12, 6]], [[7, 4], [11, 12]], [[5, 5], [10, 10]]][v];
  for (const [x, y] of pos) {
    rect(g, '#3f8a3a', x, y + 1, 1, 2);
    rect(g, cols[v], x, y - 1, 1, 3); rect(g, cols[v], x - 1, y, 3, 1);
    rect(g, '#ffe27a', x, y, 1, 1);
  }
  return c;
}
function mkFence(m) {
  const [c, g] = mk(16, 16);
  const wood = '#9c6b38', woodL = '#c8955a', woodD = '#6e4724';
  const hRail = (x, w) => { rect(g, woodD, x, 5, w, 2); rect(g, wood, x, 5, w, 1); rect(g, woodD, x, 10, w, 2); rect(g, wood, x, 10, w, 1); };
  if (m & 2) hRail(10, 6);
  if (m & 8) hRail(0, 6);
  if (m & 1) { rect(g, wood, 7, 0, 2, 6); rect(g, woodD, 8, 0, 1, 6); }
  if (m & 4) { rect(g, wood, 7, 12, 2, 4); rect(g, woodD, 8, 12, 1, 4); }
  rect(g, woodD, 6, 3, 4, 11); rect(g, wood, 6, 3, 3, 10); rect(g, woodL, 6, 3, 1, 10); rect(g, woodL, 6, 2, 4, 1);
  return c;
}
function mkHouse() {
  const [c, g] = mk(112, 96);
  // walls
  rect(g, '#e9d8a8', 6, 56, 100, 40); rect(g, '#cdb982', 6, 56, 100, 3);
  for (const x of [6, 34, 62, 90, 102]) { rect(g, '#7a4b26', x, 59, 4, 29); rect(g, '#5e3a1c', x + 3, 59, 1, 29); }
  rect(g, '#7a4b26', 6, 70, 100, 3);
  rect(g, '#8a8f98', 6, 88, 100, 8); rect(g, '#6a6f7a', 6, 88, 100, 1);
  for (let x = 10; x < 106; x += 10) rect(g, '#6a6f7a', x, 89, 1, 7);
  // door
  rect(g, '#3d2412', 47, 69, 18, 27); rect(g, '#7a4a26', 48, 70, 16, 26);
  rect(g, '#5e3a1c', 56, 70, 1, 26); rect(g, '#5e3a1c', 52, 70, 1, 26); rect(g, '#5e3a1c', 60, 70, 1, 26);
  rect(g, '#f0c94d', 59, 84, 2, 2);
  // windows
  for (const x of [16, 80]) {
    rect(g, '#3d2412', x, 74, 18, 14);
    rect(g, '#8fd3f4', x + 2, 76, 14, 10); rect(g, '#cdeefc', x + 2, 76, 14, 2);
    rect(g, '#3d2412', x + 8, 76, 2, 10); rect(g, '#3d2412', x + 2, 80, 14, 2);
  }
  // roof
  for (let y = 0; y < 56; y++) {
    const inset = y < 20 ? Math.round((20 - y) * 0.6) : 0;
    const l = 2 + inset, r = 110 - inset, band = Math.floor(y / 7);
    rect(g, band % 2 ? '#a03c2b' : '#b04532', l, y, r - l, 1);
    if (y % 7 === 0) rect(g, '#c85a44', l, y, r - l, 1);
    if (y % 7 === 6) rect(g, '#6e2519', l, y, r - l, 1);
    for (let x = l + ((band % 2) * 4); x < r; x += 8) rect(g, '#8a2e20', x, y, 1, 1);
    rect(g, '#4d1d16', l - 1, y, 1, 1); rect(g, '#4d1d16', r, y, 1, 1);
  }
  rect(g, '#4d1d16', 2, 55, 108, 1);
  // chimney
  rect(g, '#7a7f88', 84, 4, 10, 22); rect(g, '#5c6068', 82, 2, 14, 3);
  for (let y = 8; y < 26; y += 4) rect(g, '#5c6068', 84, y, 10, 1);
  return c;
}
function mkSlime(pal, f) {
  const [c, g] = mk(16, 12);
  const rx = f ? 7.5 : 6.5, ry = f ? 3.5 : 4.5, cy = f ? 7.5 : 6.5;
  ell(g, pal.o, 8, cy + 0.5, rx + 1, ry + 1); ell(g, pal.m, 8, cy, rx, ry);
  ell(g, pal.l, 6, cy - ry * 0.4, rx * 0.4, ry * 0.4);
  rect(g, '#1f2a3a', 5, Math.round(cy) - 1, 1, 2); rect(g, '#1f2a3a', 10, Math.round(cy) - 1, 1, 2);
  return c;
}
function mkCrop(type, stage) {
  const [c, g] = mk(16, 16);
  const fruit = ['#f08a24', '#d9433f', '#b06ad8'][type];
  if (stage === 0) { rect(g, '#5dbb4a', 7, 10, 2, 3); rect(g, '#8fe07a', 6, 9, 1, 1); rect(g, '#8fe07a', 9, 9, 1, 1); }
  else if (stage === 1) { rect(g, '#4aa83a', 7, 7, 2, 6); rect(g, '#5dc04a', 4, 8, 3, 2); rect(g, '#5dc04a', 9, 8, 3, 2); }
  else if (stage === 2) { ell(g, '#3f9a3a', 8, 9, 6, 4); ell(g, '#63c05a', 7, 8, 4, 2.5); rect(g, '#ffffff', 8, 6, 1, 1); }
  else { ell(g, '#3f9a3a', 8, 9, 6, 4); ell(g, fruit, 8, 10, 3.5, 3); rect(g, '#ffffff', 7, 9, 1, 1); rect(g, '#3a7a2a', 8, 6, 1, 2); }
  return c;
}
function mkLamp(on) {
  const [c, g] = mk(16, 32), iron = '#2a2a35', ironL = '#4a4a5c';
  rect(g, iron, 5, 29, 6, 3); rect(g, ironL, 5, 29, 6, 1); rect(g, iron, 6, 27, 4, 2);
  rect(g, iron, 7, 13, 2, 15); rect(g, ironL, 7, 13, 1, 15);
  rect(g, iron, 4, 12, 8, 1); rect(g, iron, 6, 13, 4, 1);
  rect(g, iron, 4, 4, 1, 8); rect(g, iron, 11, 4, 1, 8);
  rect(g, on ? '#ffd56a' : '#707e8c', 5, 4, 6, 8);
  rect(g, on ? '#fff4c0' : '#8c9aa6', 6, 5, 3, 5);
  if (on) rect(g, '#ffffff', 7, 6, 1, 3);
  rect(g, iron, 7, 4, 2, 8); rect(g, iron, 3, 3, 10, 1); rect(g, iron, 4, 2, 8, 1); rect(g, iron, 5, 1, 6, 1); rect(g, iron, 7, 0, 2, 1);
  rect(g, ironL, 4, 2, 4, 1);
  return c;
}
function initSprites() {
  SPR.grass = [1, 2, 3, 4].map(s => mkGrass(s * 97));
  SPR.dirt = [1, 2, 3].map(s => mkDirt(s * 131));
  SPR.water = [0, 1, 2, 3].map(mkWater);
  SPR.ice = [0, 1].map(mkIce);
  SPR.soil = mkSoil();
  SPR.tree = TREE_PALS.map(mkTree);
  SPR.rock = mkRock(); SPR.bush = mkBush();
  SPR.flowers = [0, 1, 2, 3, 4].map(mkFlowers);
  SPR.fence = []; for (let m = 0; m < 16; m++) SPR.fence.push(mkFence(m));
  SPR.house = mkHouse();
  SPR.lamp = [mkLamp(false), mkLamp(true)];
  Animals.init();
  const sl = { o: '#2a6b3a', m: '#5fd078', l: '#b6f5c0' }, fz = { o: '#3a7fa8', m: '#bfe8f7', l: '#ffffff' };
  initWorldSprites();
  Bonds.init();
  SPR.slime = [mkSlime(sl, 0), mkSlime(sl, 1)];
  SPR.slimeFrozen = [mkSlime(fz, 0), mkSlime(fz, 1)];
  SPR.crops = [0, 1, 2].map(t => [0, 1, 2, 3].map(s => mkCrop(t, s)));
  SPR.star = fromRows([
    '....a....', '....a....', '...aba...', '..abbba..', 'aabbwbbaa', '..abbba..', '...aba...', '....a....', '....a....'
  ], { a: '#7fd4ff', b: '#c9f0ff', w: '#ffffff' });
  SPR.snow = fromRows([
    '....a....', '.a..a..a.', '..a.a.a..', '...aaa...', 'aaaaaaaaa', '...aaa...', '..a.a.a..', '.a..a..a.', '....a....'
  ], { a: '#bfefff' });
  SPR.snowDim = fromRows([
    '....a....', '.a..a..a.', '..a.a.a..', '...aaa...', 'aaaaaaaaa', '...aaa...', '..a.a.a..', '.a..a..a.', '....a....'
  ], { a: '#7fa8b8' });
}

// ---------------------------------------------------------------- scene management
let scene = 'title', fadeA = 0, fade = null, pickedHero = null;
function goto(name) { if (!fade) fade = { name, phase: 'out' }; }

// ================================================================ TITLE
const title = {
  t: 0, sel: 0, showControls: false, stars: [], bands: null, spr: null,
  enter() {
    this.t = 0; this.sel = 0; this.showControls = false;
    if (!this.stars.length) {
      const r = mulberry32(7);
      for (let i = 0; i < 90; i++) this.stars.push({ x: Math.floor(r() * W), y: Math.floor(r() * 120), p: r() * TAU });
    }
    if (!this.spr) this.spr = CHARACTERS.find(c => c.id === 'nina').buildSprites();
  },
  update(dt) {
    this.t += dt;
    if (this.showControls) { if (hit('Enter', 'Escape', 'Space')) { this.showControls = false; sfx.move(); } return; }
    if (hit('ArrowUp', 'KeyW')) { this.sel = (this.sel + 1) % 2; sfx.move(); }
    if (hit('ArrowDown', 'KeyS')) { this.sel = (this.sel + 1) % 2; sfx.move(); }
    if (hit('Enter', 'Space')) {
      sfx.ok();
      if (this.sel === 0) goto('select'); else this.showControls = true;
    }
  },
  draw() {
    const cols = ['#120b2a', '#190f3a', '#22134b', '#2c185c', '#391e6d', '#4a267d', '#60308c', '#7b3d98', '#9a4c9e', '#bb5e9a', '#d97790'];
    const bh = Math.ceil(150 / cols.length);
    cols.forEach((c, i) => rect(ctx, c, 0, i * bh, W, bh));
    rect(ctx, '#d97790', 0, 150, W, H - 150);
    for (const s of this.stars) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 1.5 + s.p));
      ctx.globalAlpha = a; rect(ctx, '#fff6d8', s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;
    // moon
    ell(ctx, '#e8eaf5', 334, 84, 17, 17); ell(ctx, '#c5c9e0', 338, 88, 14, 14); ell(ctx, '#f6f7ff', 332, 82, 14, 14);
    rect(ctx, '#d3d6ea', 326, 78, 4, 3); rect(ctx, '#d3d6ea', 338, 90, 5, 3); rect(ctx, '#d3d6ea', 329, 92, 3, 2);
    // far hills
    for (let x = 0; x < W; x++) {
      const y = Math.round(150 + Math.sin(x * 0.025 + 1) * 8 + Math.sin(x * 0.07) * 3);
      rect(ctx, '#3a2060', x, y, 1, H - y);
    }
    for (let x = 0; x < W; x++) {
      const y = Math.round(172 + Math.sin(x * 0.03 + 4) * 7 + Math.sin(x * 0.11) * 2);
      rect(ctx, '#1e1038', x, y, 1, H - y);
    }
    // pine silhouettes
    for (const px of [18, 44, 70, 330, 354, 372]) {
      const by = 176 + Math.round(Math.sin(px * 0.03 + 4) * 6);
      for (let i = 0; i < 4; i++) rect(ctx, '#140a28', px - 3 - i * 2, by - 6 - i * 7 + 7, 7 + i * 4, 7);
      rect(ctx, '#140a28', px, by + 1, 2, 4);
    }
    // Nina on the hill with a glowing staff
    const hx = 176, hy = 164;
    const fr = this.spr.frames.down[0], bob = Math.round(Math.sin(this.t * 2) * 0.6);
    ctx.drawImage(fr, hx + 4, hy - 47 + bob, 25, 47.5);
    const ox = hx + 4 + 15 * 1.25, oy = hy - 47 + 22 * 1.25 + bob;
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(ox, oy, 1, ox, oy, 26 + Math.sin(this.t * 3) * 3);
    gr.addColorStop(0, 'rgba(170,120,255,0.55)'); gr.addColorStop(1, 'rgba(170,120,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(ox - 32, oy - 32, 64, 64);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 5; i++) {
      const k = (this.t * 0.6 + i * 0.2) % 1;
      ctx.globalAlpha = 1 - k; rect(ctx, '#e6d8ff', Math.round(ox + Math.sin(i * 2 + this.t) * 8), Math.round(oy - k * 22), 1, 1);
    }
    ctx.globalAlpha = 1;

    // title
    textC(ctx, 'MEDIEVAL REALM', W / 2, 20, '#f6d365', 3, '#5a2a10');
    textC(ctx, 'A PIXEL ADVENTURE', W / 2, 50, '#e8d9ff', 1, '#2b1840');
    // menu
    const items = ['START GAME', 'CONTROLS'];
    items.forEach((s, i) => {
      const y = 78 + i * 14, on = this.sel === i;
      textC(ctx, s, W / 2, y, on ? '#fff2a8' : '#b9a6d8', 1, '#2b1840');
      if (on && Math.floor(this.t * 3) % 2 === 0) {
        text(ctx, '>', W / 2 - textW(s) / 2 - 12, y, '#f6d365');
        text(ctx, '<', W / 2 + textW(s) / 2 + 8, y, '#f6d365');
      }
    });
    textC(ctx, 'W/S + ENTER', W / 2, H - 12, '#e8b8c8', 1, '#3a1a40');

    if (this.showControls) {
      rect(ctx, 'rgba(10,5,25,0.9)', 40, 28, W - 80, 160);
      box(ctx, 40, 28, W - 80, 160, '#f0c94d');
      textC(ctx, 'CONTROLS', W / 2, 36, '#f6d365', 2, '#5a2a10');
      const rows = [['W A S D', 'MOVE'], ['SHIFT', 'RUN'], ['HOLD F', 'BEFRIEND ANIMALS'], ['TAB', 'PETDEX'], ['SPACE', 'STARFROST SPELL'], ['E', 'ARCANE FROST'], ['M', 'MUSIC ON / OFF'], ['ESC', 'PAUSE / BACK']];
      rows.forEach((r, i) => { text(ctx, r[0], 70, 60 + i * 12, '#f0c94d'); text(ctx, r[1], 150, 60 + i * 12, '#ffffff'); });
      textC(ctx, 'PRESS ENTER', W / 2, 172, '#b9a6d8');
    }
  }
};

// ================================================================ CHARACTER SELECT
let parchment = null;
function makeParchment() {
  const [c, g] = mk(W, H), r = mulberry32(3);
  rect(g, '#e3d2a0', 0, 0, W, H);
  for (let i = 0; i < 500; i++) rect(g, r() < 0.5 ? '#d8c690' : '#ecdcae', Math.floor(r() * W), Math.floor(r() * H), 1 + Math.floor(r() * 2), 1);
  box(g, 0, 0, W, H, '#5c6068'); box(g, 1, 1, W - 2, H - 2, '#8a8f98'); box(g, 2, 2, W - 4, H - 4, '#6a6f7a');
  for (const [x, y] of [[3, 3], [W - 12, 3], [3, H - 12], [W - 12, H - 12]]) {
    for (let i = 0; i < 12; i++) rect(g, r() < 0.5 ? '#4c8a3a' : '#3a6a2c', x + Math.floor(r() * 9), y + Math.floor(r() * 9), 2, 1);
  }
  return c;
}
const select = {
  idx: 4, t: 0, shake: 0, msg: 0, spr: null,
  enter() {
    this.t = 0; this.idx = 4; this.shake = 0; this.msg = 0;
    if (!parchment) parchment = makeParchment();
    if (!this.spr) this.spr = CHARACTERS.find(c => c.id === 'nina').buildSprites();
  },
  update(dt) {
    this.t += dt; this.shake = Math.max(0, this.shake - dt); this.msg = Math.max(0, this.msg - dt);
    const col = this.idx % 4, row = (this.idx / 4) | 0;
    if (hit('ArrowLeft', 'KeyA')) { this.idx = row * 4 + (col + 3) % 4; sfx.move(); }
    if (hit('ArrowRight', 'KeyD')) { this.idx = row * 4 + (col + 1) % 4; sfx.move(); }
    if (hit('ArrowUp', 'KeyW', 'ArrowDown', 'KeyS')) { this.idx = (this.idx + 4) % 8; sfx.move(); }
    if (hit('Escape')) { goto('title'); return; }
    if (hit('Enter', 'Space')) {
      const ch = CHARACTERS[this.idx];
      if (ch.unlocked) { sfx.ok(); pickedHero = ch; goto('loading'); }
      else { this.shake = 0.35; this.msg = 1.8; sfx.no(); }
    }
  },
  drawCard(i, x, y) {
    const ch = CHARACTERS[i], sel = i === this.idx;
    const pulse = sel ? (Math.sin(this.t * 6) > 0 ? '#fff2a8' : '#f0c94d') : '#b8902a';
    rect(ctx, pulse, x - 2, y - 2, 88, 50);
    rect(ctx, '#3b2412', x - 1, y - 1, 86, 48);
    rect(ctx, '#7a4a28', x, y, 84, 46);
    for (let k = 1; k < 5; k++) rect(ctx, '#6a3f20', x, y + k * 9, 84, 1);
    ctx.globalAlpha = sel ? 0.4 : 0.22; rect(ctx, ch.color, x, y, 84, 46); ctx.globalAlpha = 1;
    for (const [cx, cy] of [[x, y], [x + 81, y], [x, y + 43], [x + 81, y + 43]]) rect(ctx, '#f0c94d', cx, cy, 3, 3);
    if (ch.unlocked) {
      const bob = sel ? Math.round(Math.sin(this.t * 4) * 0.7) : 0;
      ctx.drawImage(this.spr.frames.down[0], x + 30, y - 2 + bob, 24, 45.6);
      if (sel) {
        ctx.globalCompositeOperation = 'lighter';
        const ox = x + 26 + 29, oy = y - 3 + 5 + bob;
        const gr = ctx.createRadialGradient(ox, oy, 1, ox, oy, 18);
        gr.addColorStop(0, 'rgba(170,120,255,0.6)'); gr.addColorStop(1, 'rgba(170,120,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(ox - 20, oy - 20, 40, 40);
        ctx.globalCompositeOperation = 'source-over';
      }
    } else {
      rect(ctx, 'rgba(0,0,0,0.38)', x, y, 84, 46);
      textC(ctx, '?', x + 42, y + 10, '#cbbd9a', 4, '#2b1840');
      textC(ctx, 'LOCKED', x + 42, y + 37, '#cbbd9a', 1, '#2b1840');
    }
    textC(ctx, ch.short, x + 42, y + 49, sel ? '#7a2a10' : (ch.unlocked ? '#3b2412' : '#8a7a5a'));
  },
  draw() {
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.round(Math.sin(this.t * 80) * 2), 0);
    ctx.drawImage(parchment, 0, 0);
    // banner
    rect(ctx, '#b8902a', 78, 3, 228, 28); rect(ctx, '#3b2412', 79, 4, 226, 26); rect(ctx, '#7a4a28', 80, 5, 224, 24);
    rect(ctx, '#6a3f20', 80, 17, 224, 1);
    textC(ctx, 'CHARACTER SELECT', W / 2, 7, '#f6d365', 2, '#3b2412');
    textC(ctx, 'MEDIEVAL REALM * CHOOSE YOUR HERO', W / 2, 21, '#e8d9b0');
    for (let i = 0; i < 8; i++) {
      const col = i % 4, row = (i / 4) | 0;
      this.drawCard(i, 12 + col * 92, 35 + row * 60);
    }
    // detail panel
    const ch = CHARACTERS[this.idx], py = 156;
    rect(ctx, '#5c4020', 10, py - 1, W - 20, 50); rect(ctx, '#f1e4bc', 11, py, W - 22, 48);
    text(ctx, ch.name, 20, py + 5, '#3b2412', 2);
    text(ctx, ch.title, 20, py + 22, ch.color === '#e8c85a' ? '#8a6a10' : '#5a3690');
    text(ctx, 'ABILITY: ' + ch.ability, 20, py + 32, '#3b2412');
    if (ch.unlocked) {
      text(ctx, ch.blurb, 20, py + 40, '#6a5a3a');
      if (Math.floor(this.t * 2.5) % 2 === 0) textR(ctx, 'PRESS ENTER', W - 20, py + 8, '#2a7a3a');
    } else {
      text(ctx, 'COMING SOON - NOT YET PLAYABLE', 20, py + 40, '#8a4a3a');
    }
    textC(ctx, 'ARROWS / WASD: SELECT    ENTER: CONFIRM    ESC: BACK', W / 2, 207, '#5a4a30');
    if (this.msg > 0) {
      rect(ctx, 'rgba(20,10,30,0.85)', W / 2 - 80, 94, 160, 22);
      textC(ctx, 'THIS HERO IS NOT READY YET!', W / 2, 101, '#ffb0a0');
    }
    ctx.restore();
  }
};

// ================================================================ LOADING
const loading = {
  t: 0, built: false, spr: null,
  enter() { this.t = 0; this.built = false; if (!this.spr) this.spr = pickedHero.buildSprites(); },
  update(dt) {
    this.t += dt;
    if (!this.built && this.t > 0.2) { startPlay(); this.built = true; }
    if (this.t > 1.5) goto('play');
  },
  draw() {
    rect(ctx, '#140d2a', 0, 0, W, H);
    textC(ctx, 'LOADING...', W / 2, 90, '#f6d365', 2, '#5a2a10');
    const k = clamp(this.t / 1.5, 0, 1);
    rect(ctx, '#3b2412', 112, 120, 160, 10); rect(ctx, '#f0c94d', 111, 119, 162, 1); rect(ctx, '#f0c94d', 111, 130, 162, 1);
    rect(ctx, '#7e57c2', 114, 122, Math.round(156 * k), 6); rect(ctx, '#b79cf0', 114, 122, Math.round(156 * k), 2);
    const fr = this.spr.frames.right[[0, 1, 0, 2][Math.floor(this.t * 8) % 4]];
    ctx.drawImage(fr, Math.round(112 + 156 * k - 8), 90, 16, 30.4);
    textC(ctx, 'TIP: PRESS E NEAR WATER TO FREEZE IT INTO ICE', W / 2, 160, '#b9a6d8');
  }
};

// ================================================================ PLAY
let G = null;
const darkC = mk(W, H);
const SEQ = [0, 1, 0, 2];

function tileSolid(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true;
  const i = ty * MW + tx, w = G.w;
  if (w.solid[i]) return true;
  if (w.ground[i] === 2) { const ic = G.ice.get(i); return !(ic && ic.delay <= 0); }
  return false;
}
function boxHits(x, y, hw, hh) {
  const x0 = Math.floor((x - hw) / T), x1 = Math.floor((x + hw - 0.001) / T);
  const y0 = Math.floor((y - hh) / T), y1 = Math.floor((y - 0.001) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileSolid(tx, ty)) return true;
  return false;
}
function moveEntity(e, dx, dy, hw, hh) {
  if (dx) { const nx = e.x + dx; if (!boxHits(nx, e.y, hw, hh)) e.x = nx; else return false; }
  if (dy) { const ny = e.y + dy; if (!boxHits(e.x, ny, hw, hh)) e.y = ny; else return false; }
  return true;
}
function emit(x, y, n, o) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, sp = (o.sp || 30) * (0.4 + Math.random() * 0.8);
    const life = o.life * (0.6 + Math.random() * 0.6);
    G.parts.push({
      x, y, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0), life, max: life,
      c: o.c[Math.floor(Math.random() * o.c.length)], s: o.s || 1, g: o.g || 0
    });
  }
}
function findSpawn(minDist) {
  const w = G.w;
  for (let n = 0; n < 300; n++) {
    const tx = Math.floor(G.p.x / T) + Math.floor((Math.random() - 0.5) * 56), ty = Math.floor(G.p.y / T) + Math.floor((Math.random() - 0.5) * 40);
    if (tx < 3 || ty < 3 || tx >= MW - 3 || ty >= MH - 3) continue;
    const i = ty * MW + tx;
    if ((w.ground[i] !== 0 && w.ground[i] !== 6) || w.solid[i]) continue;
    const x = tx * T + 8, y = ty * T + 12;
    if (Math.hypot(x - G.p.x, y - G.p.y) < minDist * T) continue;
    return { x, y };
  }
  return { x: 10 * T, y: 26 * T };
}
function newSlime() {
  const s = { dead: false };
  respawnSlime(s, 8); return s;
}
function respawnSlime(s, minDist) {
  const p = findSpawn(minDist);
  Object.assign(s, { x: p.x, y: p.y, hp: 3, vx: 0, vy: 0, kx: 0, ky: 0, t: Math.random() * 2, moving: false, frozen: 0, flash: 0, dead: false, respawn: 0, hop: Math.random() * 6 });
}
function startPlay() {
  const hero = pickedHero, w = buildWorld();
  w.canvas = bakeGround(w);
  G = {
    w, hero, spr: hero.buildSprites(), t: 0, min: 360, day: 1, paused: false, banner: 0, hint: 12, noMana: 0, killed: 0,
    p: { x: w.spawn.x, y: w.spawn.y, dir: 'down', anim: 0, moving: false, mana: hero.maxMana, cdBolt: 0, cdFrost: 0, ax: 0, ay: 1 },
    cam: { x: 0, y: 0 }, slimes: [], parts: [], proj: [], ice: new Map()
  };
  G.inside = false; G.fx = null; G.prompt = null; G.warm = 0; G.sleptMsg = 0; G.cooldown = 0;
  initWeather(); initExplore(); Bonds.load(); Npcs.init();
  for (let i = 0; i < 9; i++) G.slimes.push(newSlime());
  G.flies = Array.from({ length: 28 }, () => ({ bx: G.p.x + (Math.random() - 0.5) * W, by: G.p.y + (Math.random() - 0.5) * H, ph: Math.random() * TAU }));
  Animals.reset();
  G.cam.x = clamp(G.p.x - W / 2, 0, MW * T - W); G.cam.y = clamp(G.p.y - H / 2, 0, MH * T - H);
}
const NS = 0.85; // Nina's in-world scale
const playerFrame = () => { const p = G.p; return p.moving ? SEQ[Math.floor(p.anim) % 4] : 0; };
function orbWorld() {
  const p = G.p, o = G.spr.orb[p.dir], f = playerFrame();
  return { x: Math.round(p.x) - 10 * NS + o[0] * NS, y: Math.round(p.y) - 37 * NS + o[1] * NS + (f ? -1 : 0) };
}

function castBolt() {
  const p = G.p;
  if (p.cdBolt > 0) return;
  if (p.mana < 10) { G.noMana = 0.8; sfx.no(); return; }
  p.mana -= 10; p.cdBolt = 0.35;
  const l = Math.hypot(p.ax, p.ay) || 1, dx = p.ax / l, dy = p.ay / l;
  G.proj.push({ x: p.x + dx * 6, y: p.y - 2 + dy * 6, vx: dx * 170, vy: dy * 170, life: 1.1, t: 0 });
  const o = orbWorld();
  emit(o.x, o.y, 8, { sp: 40, life: 0.35, c: ['#bfefff', '#ffffff', '#7fd4ff'] });
  sfx.cast();
}
function castFrost() {
  const p = G.p;
  if (p.cdFrost > 0) return;
  if (p.mana < 30) { G.noMana = 0.8; sfx.no(); return; }
  p.mana -= 30; p.cdFrost = 2.0;
  const R = 4.6 * T, w = G.w;
  const x0 = Math.floor((p.x - R) / T), x1 = Math.floor((p.x + R) / T), y0 = Math.floor((p.y - R) / T), y1 = Math.floor((p.y + R) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) continue;
    const i = ty * MW + tx;
    if (w.ground[i] !== 2) continue;
    const d = Math.hypot(tx * T + 8 - p.x, ty * T + 8 - p.y);
    if (d > R) continue;
    const old = G.ice.get(i);
    G.ice.set(i, { t: 14 * (1 + 0.6 * wxWet() + (w.region[Math.floor(p.y / T) * MW + Math.floor(p.x / T)] === 3 ? 0.8 : 0)), delay: old && old.delay <= 0 ? 0 : d * 0.012 });
  }
  for (const s of G.slimes) if (!s.dead && Math.hypot(s.x - p.x, s.y - p.y) < R) {
    s.frozen = 3.5; emit(s.x, s.y - 5, 8, { sp: 30, life: 0.5, c: ['#bfefff', '#ffffff'] });
  }
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    G.parts.push({ x: p.x, y: p.y - 6, vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, life: 0.55, max: 0.55, c: ['#bfefff', '#ffffff', '#7fd4ff'][i % 3], s: 1, g: 0 });
  }
  sfx.freeze();
}
function hurtSlime(s, dx, dy) {
  // calm game: slimes just get a cute frosty wobble, nothing is hurt
  s.flash = 0.15; s.frozen = 2.2; s.kx = dx * 40; s.ky = dy * 40;
  emit(s.x, s.y - 5, 10, { sp: 40, life: 0.5, c: ['#bfefff', '#ffffff', '#b6f5c0'] });
  sfx.pop();
}

function updatePlay(dt) {
  const p = G.p;
  if (G.bagUI) { G.t += dt; Bonds.updateUI(dt); return; }
  if (Npcs.active()) { Npcs.updateUI(dt); return; }
  if (hit('KeyN')) { musicOn = !musicOn; }
  if (G.fx) {
    const f = G.fx; f.t += dt;
    if (f.mode === 'out' && f.t >= f.dur) { f.cb(); f.mode = 'in'; f.t = 0; f.dur = 0.45; }
    else if (f.mode === 'in' && f.t >= f.dur) G.fx = null;
    G.t += dt; G.min += dt * 1.7857; return;
  }
  if (hit('KeyI') && !G.paused && !G.dex && !G.journal && !G.map && !G.fx) { Bonds.openUI(); return; }
  if (hit('KeyM') && !G.paused && !G.dex && !G.journal) { G.map = !G.map; G.t0 = 0; sfx.move(); if (!G.map) saveExplore(); }
  if (G.map) { if (hit('Escape')) { G.map = false; saveExplore(); } G.t += dt; return; }
  if (hit('Tab') && !G.paused && !G.inside) { G.dex = !G.dex; Animals.dexT = 0; sfx.move(); }
  if (G.dex) { if (hit('Escape')) G.dex = false; Animals.updateDex(dt); return; }
  if (hit('Escape') && !G.journal) G.paused = !G.paused;
  if (G.paused) { if (hit('KeyQ')) goto('title'); return; }
  G.t += dt; G.hint = Math.max(0, G.hint - dt); G.banner = Math.max(0, G.banner - dt); G.noMana = Math.max(0, G.noMana - dt);

  // clock: 10 in-game minutes per ~5.6 real seconds
  G.min += dt * 1.7857;
  if (G.min >= 26 * 60) { G.min = 360; G.day++; G.banner = 3; if (G.wx.t > 30) G.wx.t = 30; }
  G.sleptMsg = Math.max(0, G.sleptMsg - dt);
  if (G.regBanner) { G.regBanner.t -= dt; if (G.regBanner.t <= 0) G.regBanner = null; }
  updateWeather(dt);
  updateExplore(dt);
  if (G.inside) { updateInside(dt); return; }

  // movement
  const lockF = Bonds.fishLock();
  const ix = lockF ? 0 : (down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0);
  const iy = lockF ? 0 : (down('KeyS', 'ArrowDown') ? 1 : 0) - (down('KeyW', 'ArrowUp') ? 1 : 0);
  p.moving = !!(ix || iy); p.run = false;
  if (p.moving) {
    const l = Math.hypot(ix, iy), run = down('ShiftLeft', 'ShiftRight');
    p.run = run;
    const sp = G.hero.speed * (run ? 1.6 : 1);
    moveEntity(p, ix / l * sp * dt, 0, 4, 4);
    moveEntity(p, 0, iy / l * sp * dt, 4, 4);
    p.ax = ix / l; p.ay = iy / l;
    if (ix && !iy) p.dir = ix < 0 ? 'left' : 'right';
    else if (iy && !ix) p.dir = iy < 0 ? 'up' : 'down';
    else {
      const horiz = p.dir === 'left' || p.dir === 'right';
      if (horiz && Math.sign(ix) === (p.dir === 'left' ? -1 : 1)) { /* keep */ }
      else if (!horiz && Math.sign(iy) === (p.dir === 'up' ? -1 : 1)) { /* keep */ }
      else p.dir = ix < 0 ? 'left' : 'right';
    }
    p.anim += dt * (run ? 11 : 7.5);
  } else p.anim = 0;

  // walk up into the front door to go inside
  const dr = G.w.door;
  if (p.moving && p.ay < -0.3 && Math.abs(p.x - dr.x) < 11 && p.y <= dr.y + 10 && p.y >= dr.y) houseEnter();
  const lt = G.trail[0];
  if (!lt || Math.hypot(lt.x - p.x, lt.y - p.y) >= 3) { G.trail.unshift({ x: p.x, y: p.y }); if (G.trail.length > 90) G.trail.pop(); }

  // spells + mana
  p.cdBolt = Math.max(0, p.cdBolt - dt); p.cdFrost = Math.max(0, p.cdFrost - dt);
  p.mana = Math.min(G.hero.maxMana, p.mana + 12 * (1 + 0.45 * wxS('rain') + 0.9 * wxS('storm')) * dt);
  if (!lockF && hit('Space', 'KeyJ')) castBolt();
  Npcs.update(dt);
  if (Npcs.active()) return;
  if (!lockF && (hit('KeyK') || (hit('KeyE') && !Npcs.claimE))) castFrost();
  Animals.update(dt); musicTick(dt); Bonds.update(dt);

  // projectiles
  for (const b of G.proj) {
    b.t += dt; b.life -= dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const tx = Math.floor(b.x / T), ty = Math.floor(b.y / T);
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH || G.w.solid[ty * MW + tx]) { b.life = 0; b.burst = true; }
    for (const s of G.slimes) {
      if (!s.dead && Math.hypot(b.x - s.x, b.y - s.y) < 9) { hurtSlime(s, b.vx / 170, b.vy / 170); b.life = 0; b.burst = true; break; }
    }
    if (Math.random() < dt * 60) emit(b.x, b.y - 14, 1, { sp: 8, life: 0.35, c: ['#bfefff', '#7fd4ff', '#ffffff'] });
    if (b.life <= 0) emit(b.x, b.y - 14, b.burst ? 12 : 4, { sp: 45, life: 0.35, c: ['#bfefff', '#ffffff', '#7fd4ff'] });
  }
  G.proj = G.proj.filter(b => b.life > 0);

  // ice tiles
  for (const [i, ic] of G.ice) {
    if (ic.delay > 0) {
      ic.delay -= dt;
      if (ic.delay <= 0) emit((i % MW) * T + 8, ((i / MW) | 0) * T + 8, 3, { sp: 25, life: 0.4, c: ['#ffffff', '#bfefff'] });
      continue;
    }
    ic.t -= dt;
    if (Math.random() < dt * 0.5) emit((i % MW) * T + Math.random() * T, ((i / MW) | 0) * T + Math.random() * T, 1, { sp: 3, life: 0.5, c: ['#ffffff'] });
    if (ic.t <= 0) {
      const tx = i % MW, ty = (i / MW) | 0;
      const px0 = Math.floor((p.x - 4) / T), px1 = Math.floor((p.x + 3.99) / T), py0 = Math.floor((p.y - 4) / T), py1 = Math.floor((p.y - 0.01) / T);
      if (tx >= px0 && tx <= px1 && ty >= py0 && ty <= py1) ic.t = 0.3;
      else { G.ice.delete(i); emit(tx * T + 8, ty * T + 8, 8, { sp: 30, life: 0.5, c: ['#bfefff', '#5eb0ea'], g: 40 }); }
    }
  }

  // slimes
  for (const s of G.slimes) {
    if (s.dead) { s.respawn -= dt; if (s.respawn <= 0) respawnSlime(s, 10); continue; }
    if (Math.hypot(s.x - p.x, s.y - p.y) > 34 * T) { respawnSlime(s, 14); continue; }
    s.flash = Math.max(0, s.flash - dt);
    if (s.kx || s.ky) {
      moveEntity(s, s.kx * dt, 0, 5, 4); moveEntity(s, 0, s.ky * dt, 5, 4);
      s.kx *= Math.max(0, 1 - 8 * dt); s.ky *= Math.max(0, 1 - 8 * dt);
      if (Math.abs(s.kx) < 2) s.kx = 0; if (Math.abs(s.ky) < 2) s.ky = 0;
    }
    if (s.frozen > 0) { s.frozen -= dt; continue; }
    s.t -= dt;
    if (s.t <= 0) {
      if (s.moving) { s.moving = false; s.t = 0.6 + Math.random() * 1.2; }
      else { s.moving = true; s.t = 0.5 + Math.random() * 0.8; const a = Math.random() * TAU; s.vx = Math.cos(a) * 18; s.vy = Math.sin(a) * 18; }
    }
    if (s.moving) {
      s.hop += dt * 8;
      const ok1 = moveEntity(s, s.vx * dt, 0, 5, 4), ok2 = moveEntity(s, 0, s.vy * dt, 5, 4);
      if (!ok1 || !ok2) { s.vx = -s.vx; s.vy = -s.vy; }
    }
  }

  // particles
  for (const q of G.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= 1 - 1.5 * dt; }
  G.parts = G.parts.filter(q => q.life > 0);
  if (G.parts.length > 600) G.parts.splice(0, G.parts.length - 600);

  // orb sparkles
  if (Math.random() < dt * 6) { const o = orbWorld(); emit(o.x + (Math.random() - 0.5) * 4, o.y, 1, { sp: 6, life: 0.7, c: ['#e6d8ff', '#b78cff'], vy: -10 }); }

  // camera
  const tx = clamp(p.x - W / 2, 0, MW * T - W), ty = clamp(p.y - H / 2, 0, MH * T - H);
  G.cam.x = lerp(G.cam.x, tx, Math.min(1, 8 * dt)); G.cam.y = lerp(G.cam.y, ty, Math.min(1, 8 * dt));
}

// ---------- play: drawing
function hole(g, x, y, r, a) {
  const gr = g.createRadialGradient(x, y, 2, x, y, r);
  gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
function nightStrength() {
  const h = G.min / 60;
  return h >= 17 ? clamp((h - 17) / 4, 0, 1) : 0;
}
function lampLevel() {
  if (!G) return 0;
  const h = G.min / 60, wl = G.wx ? clamp(wxDark() * 2.4, 0, 0.85) : 0;
  let t = 0;
  if (h >= 16.5) t = clamp((h - 16.5) / 1.5, 0, 1);
  else if (h < 7.5) t = clamp((7.5 - h) / 1.5, 0, 1);
  return Math.max(t, wl);
}
function drawLighting(cx, cy) {
  const h = G.min / 60, n = nightStrength(), L = lampLevel();
  let a = 0, col = [10, 16, 64];
  if (h < 8) { a = 0.28 * (1 - (h - 6) / 2); col = [255, 190, 120]; }
  else if (h >= 17) { a = 0.1 + n * 0.52; col = [lerp(255, 10, n), lerp(150, 16, n), lerp(80, 64, n)].map(Math.round); }
  const lamps = G.w.lamps.filter(l => l.x > cx - 70 && l.x < cx + W + 70 && l.y > cy - 70 && l.y < cy + H + 70);
  if (a >= 0.02) {
    const [dc, dg] = darkC;
    dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H);
    dg.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`; dg.fillRect(0, 0, W, H);
    dg.globalCompositeOperation = 'destination-out';
    const o = orbWorld();
    hole(dg, o.x - cx, o.y - cy, 64, 0.35 + n * 0.55);
    hole(dg, Math.round(G.p.x) - cx, Math.round(G.p.y) - 10 - cy, 40, 0.3 + n * 0.4);
    const WXS = [G.w.hx + 16 + 9, G.w.hx + 80 + 9], WY = G.w.hy - 96 + 81;
    if (n > 0.1) for (const wx of WXS) hole(dg, wx - cx, WY - cy, 36, n * 0.8);
    for (const gl of G.w.glows) if (gl.x > cx - 70 && gl.x < cx + W + 70 && gl.y > cy - 70 && gl.y < cy + H + 70) hole(dg, gl.x - cx, gl.y - cy, gl.r, 0.55 * Math.max(n, 0.35));
    if (L > 0.02) for (const l of lamps) hole(dg, l.x - cx, l.y + 14 - cy, 52, 0.9 * L);
    Animals.lightHoles(dg, cx, cy);
    ctx.drawImage(dc, 0, 0);
    if (n > 0.1) {
      ctx.fillStyle = `rgba(255,205,110,${0.7 * n})`;
      for (const wx of [G.w.hx + 16, G.w.hx + 80]) ctx.fillRect(wx + 2 - cx, G.w.hy - 96 + 76 - cy, 14, 10);
    }
  }
  if (L > 0.02) {
    const dk = clamp(0.3 + a * 1.2, 0.3, 1);
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lamps) {
      const x = l.x - cx, y = l.y - cy, fl = 0.92 + 0.08 * Math.sin(G.t * 5 + l.x);
      let gr = ctx.createRadialGradient(x, y, 1, x, y, 30 * fl);
      gr.addColorStop(0, `rgba(255,200,110,${0.55 * L * dk})`); gr.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 34, y - 34, 68, 68);
      gr = ctx.createRadialGradient(x, y + 17, 1, x, y + 17, 26);
      gr.addColorStop(0, `rgba(255,190,100,${0.28 * L * dk})`); gr.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 28, y - 10, 56, 56);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const gl of G.w.glows) {
    if (gl.x < cx - 70 || gl.x > cx + W + 70 || gl.y < cy - 70 || gl.y > cy + H + 70) continue;
    const x = gl.x - cx, y = gl.y - cy, al = (0.1 + 0.28 * n) * (0.85 + 0.15 * Math.sin(G.t * 2 + gl.x));
    const gr = ctx.createRadialGradient(x, y, 1, x, y, gl.r * 0.7);
    gr.addColorStop(0, gl.c + Math.round(al * 255).toString(16).padStart(2, '0')); gr.addColorStop(1, gl.c + '00');
    ctx.fillStyle = gr; ctx.fillRect(x - gl.r, y - gl.r, gl.r * 2, gl.r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}
function drawFireflies(cx, cy) {
  const k = lampLevel();
  if (k < 0.05) return;
  for (const f of G.flies) {
    if (f.bx < cx - 30 || f.bx > cx + W + 30 || f.by < cy - 30 || f.by > cy + H + 30) { f.bx = cx + Math.random() * W; f.by = cy + Math.random() * H; }
    const x = Math.round(f.bx + Math.sin(G.t * 0.6 + f.ph) * 10 - cx), y = Math.round(f.by + Math.cos(G.t * 0.5 + f.ph * 1.3) * 7 - cy);
    const a = k * (0.35 + 0.65 * Math.max(0, Math.sin(G.t * 2 + f.ph * 3)));
    ctx.globalAlpha = a * 0.25; rect(ctx, '#fff6a0', x - 1, y - 1, 3, 3);
    ctx.globalAlpha = a; rect(ctx, '#fffbd0', x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

function drawPlay() {
  if (G.inside) { drawInside(); return; }
  const cx = Math.round(G.cam.x), cy = Math.round(G.cam.y), p = G.p, w = G.w;
  ctx.drawImage(w.canvas, cx, cy, W, H, 0, 0, W, H);

  // animated water + shores + ice
  const tx0 = Math.max(0, Math.floor(cx / T)), tx1 = Math.min(MW - 1, Math.floor((cx + W) / T));
  const ty0 = Math.max(0, Math.floor(cy / T)), ty1 = Math.min(MH - 1, Math.floor((cy + H) / T));
  const isW = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && w.ground[y * MW + x] === 2;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (w.ground[ty * MW + tx] !== 2) continue;
    const px = tx * T - cx, py = ty * T - cy, hh = h2(tx, ty);
    ctx.drawImage(SPR.water[(Math.floor(G.t * 2.5) + hh) % 4], px, py);
    if (!isW(tx, ty - 1)) { rect(ctx, '#8a7348', px, py, T, 1); rect(ctx, '#d4c08a', px, py + 1, T, 1); }
    if (!isW(tx, ty + 1)) { rect(ctx, '#8a7348', px, py + 15, T, 1); rect(ctx, '#d4c08a', px, py + 14, T, 1); }
    if (!isW(tx - 1, ty)) { rect(ctx, '#8a7348', px, py, 1, T); rect(ctx, '#d4c08a', px + 1, py, 1, T); }
    if (!isW(tx + 1, ty)) { rect(ctx, '#8a7348', px + 15, py, 1, T); rect(ctx, '#d4c08a', px + 14, py, 1, T); }
    const ic = G.ice.get(ty * MW + tx);
    if (ic && ic.delay <= 0) {
      ctx.globalAlpha = ic.t < 2 ? 0.55 + 0.45 * Math.sin(G.t * 14) : 1;
      ctx.drawImage(SPR.ice[hh % 2], px, py);
      ctx.globalAlpha = 1;
    }
  }

  // y-sorted world
  const items = [];
  for (const o of w.objects) {
    if (o.x + o.img.width < cx || o.x > cx + W || o.y + o.img.height < cy || o.y > cy + H) continue;
    items.push({ y: o.sy, o });
  }
  const px = Math.round(p.x), py = Math.round(p.y);
  items.push({
    y: p.y, draw: () => {
      ell(ctx, 'rgba(0,0,0,0.28)', px - cx, py - cy, 6, 2.5);
      ctx.drawImage(G.spr.frames[p.dir][playerFrame()], px - 10 * NS - cx, py - 37 * NS - cy, 20 * NS, 38 * NS);
    }
  });
  for (const s of G.slimes) {
    if (s.dead) continue;
    items.push({
      y: s.y, draw: () => {
        const sx = Math.round(s.x) - cx, sy = Math.round(s.y) - cy;
        ell(ctx, 'rgba(0,0,0,0.25)', sx, sy, 6, 2);
        const fr = s.frozen > 0 ? SPR.slimeFrozen : SPR.slime;
        const f = s.moving && s.frozen <= 0 && Math.floor(s.hop) % 2 ? 1 : 0;
        const lift = s.moving && s.frozen <= 0 ? Math.round(Math.abs(Math.sin(s.hop * 1.5)) * 3) : 0;
        if (s.flash > 0) ctx.globalAlpha = 0.5;
        ctx.drawImage(fr[f], sx - 8, sy - 12 - lift);
        ctx.globalAlpha = 1;
      }
    });
  }
  Animals.pushItems(items, cx, cy);
  Npcs.pushItems(items, cx, cy);
  items.sort((a, b) => a.y - b.y);
  const lampOn = lampLevel() > 0.25 ? 1 : 0;
  for (const it of items) { if (it.o) { if (it.o.hs) blit(it.o.img, it.o.x - cx, it.o.y - cy); else ctx.drawImage(it.o.lamp ? SPR.lamp[lampOn] : it.o.img, it.o.x - cx, it.o.y - cy); } else it.draw(); }

  // projectiles
  for (const b of G.proj) {
    const sx = Math.round(b.x) - cx, sy = Math.round(b.y) - cy;
    ell(ctx, 'rgba(0,0,0,0.2)', sx, sy, 3, 1.2);
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(sx, sy - 14, 1, sx, sy - 14, 12);
    gr.addColorStop(0, 'rgba(150,220,255,0.55)'); gr.addColorStop(1, 'rgba(150,220,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(sx - 14, sy - 28, 28, 28);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(SPR.star, sx - 4, sy - 18 + Math.round(Math.sin(b.t * 20)));
  }
  // particles
  for (const q of G.parts) {
    ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
    rect(ctx, q.c, Math.round(q.x - cx), Math.round(q.y - cy), q.s, q.s);
  }
  ctx.globalAlpha = 1;

  drawLighting(cx, cy);
  drawWeather(cx, cy);

  // orb glow
  const o = orbWorld(), n = nightStrength();
  ctx.globalCompositeOperation = 'lighter';
  const gl = ctx.createRadialGradient(o.x - cx, o.y - cy, 1, o.x - cx, o.y - cy, 18);
  const ga = (0.28 + n * 0.3) * (0.85 + 0.15 * Math.sin(G.t * 4));
  gl.addColorStop(0, `rgba(170,120,255,${ga})`); gl.addColorStop(1, 'rgba(170,120,255,0)');
  ctx.fillStyle = gl; ctx.fillRect(o.x - cx - 20, o.y - cy - 20, 40, 40);
  ctx.globalCompositeOperation = 'source-over';

  Animals.drawGlows(cx, cy);
  drawFireflies(cx, cy);
  Bonds.drawWorld(cx, cy);
  Npcs.drawWorld(cx, cy);
  Animals.drawOverlay(cx, cy);
  drawHUD();
}

function slotHUD(x, y, key, icon, cost, cd, cdMax, ok) {
  rect(ctx, '#1d1030', x, y, 28, 28); box(ctx, x, y, 28, 28, ok ? '#f0c94d' : '#6b5a3a');
  text(ctx, key, x + 3, y + 3, '#f0c94d');
  if (!ok) ctx.globalAlpha = 0.5;
  ctx.drawImage(icon, x + 10, y + 11);
  ctx.globalAlpha = 1;
  textR(ctx, String(cost), x + 25, y + 20, '#6cc4ff');
  if (cd > 0) { ctx.globalAlpha = 0.6; rect(ctx, '#000', x + 1, y + 1, 26, Math.round(26 * cd / cdMax)); ctx.globalAlpha = 1; }
}
function drawHUD() {
  const p = G.p, hero = G.hero;
  // name + mana panel
  rect(ctx, 'rgba(24,12,44,0.82)', 4, 4, 92, 26); box(ctx, 4, 4, 92, 26, '#f0c94d');
  ctx.drawImage(G.spr.frames.down[0], 8, 0, 24, 24, 8, 7, 11, 11);
  text(ctx, hero.short, 22, 8, '#d9c2ff');
  text(ctx, 'MANA', 8, 20, '#8ec8ff');
  rect(ctx, '#0d0820', 34, 19, 58, 8); rect(ctx, '#2a78d0', 35, 20, Math.round(56 * p.mana / hero.maxMana), 6);
  rect(ctx, '#6cc4ff', 35, 20, Math.round(56 * p.mana / hero.maxMana), 2);
  text(ctx, 'PETDEX: ' + Object.keys(G.col).length + '/' + SPECIES.length, 6, 34, '#ffffff', 1, '#1d1030');
  if (musicOn === false) text(ctx, 'MUSIC OFF', 6, 44, '#b9a6d8', 1, '#1d1030');
  text(ctx, 'EXPLORED: ' + G.expPct + '%', 6, musicOn === false ? 54 : 44, '#7affb0', 1, '#1d1030');

  // clock
  const mins = Math.floor(G.min) % 1440, hr = Math.floor(mins / 60) % 24, mm = mins % 60;
  const ap = hr >= 12 && hr < 24 ? 'PM' : 'AM', h12 = hr % 12 === 0 ? 12 : hr % 12;
  rect(ctx, 'rgba(24,12,44,0.82)', W - 80, 4, 76, 26); box(ctx, W - 80, 4, 76, 26, '#f0c94d');
  text(ctx, 'DAY ' + G.day, W - 74, 8, '#f6d365');
  const m10 = mm - mm % 10;
  text(ctx, h12 + ':' + (m10 < 10 ? '0' : '') + m10 + ' ' + ap, W - 74, 18, '#ffffff');
  const wxn = WX[G.wx.type].name, regn = G.inside ? 'YOUR HOUSE' : REGION_NAMES[G.w.region[Math.floor(p.y / T) * MW + Math.floor(p.x / T)]];
  rect(ctx, 'rgba(24,12,44,0.75)', W - 120, 32, 116, 26); box(ctx, W - 120, 32, 116, 26, '#5a4a8a');
  const wc = { CLEAR: '#ffd84a', CLOUDY: '#c8c8d4', RAIN: '#6cc4ff', STORM: '#ffe85a', FOG: '#dfe8f4', BREEZY: '#9ae87a' }[wxn];
  rect(ctx, wc, W - 116, 36, 4, 4); text(ctx, wxn, W - 108, 35, wc);
  text(ctx, regn, W - 116, 46, '#d9c2ff');
  if (G.rainbow > 0) textR(ctx, 'RAINBOW!', W - 8, 35, '#ffd0f0');
  if (hr >= 6 && hr < 19) { ell(ctx, '#ffd84a', W - 12, 12, 4, 4); }
  else { ell(ctx, '#e8eaf5', W - 12, 12, 4, 4); ell(ctx, '#2a1a4a', W - 10, 11, 3, 3); }

  // ability bar
  const bx = (W - 60) / 2, by = H - 34;
  if (!G.inside) {
  slotHUD(bx, by, 'SPC', SPR.star, 10, p.cdBolt, 0.35, p.mana >= 10);
  slotHUD(bx + 32, by, 'E', SPR.snow, 30, p.cdFrost, 2, p.mana >= 30);
  }
  if (G.noMana > 0) textC(ctx, 'NOT ENOUGH MANA', W / 2, by - 12, '#ff8a8a', 1, '#2b1040');
  if (G.hint > 0 && !G.inside) {
    ctx.globalAlpha = Math.min(1, G.hint);
    textC(ctx, 'WASD: MOVE   SHIFT: RUN   HOLD F: BEFRIEND ANIMALS', W / 2, by - 34, '#ffffff', 1, '#1d1030');
    textC(ctx, 'TAB: PETDEX   I: BACKPACK   M: MAP   N: MUSIC', W / 2, by - 24, '#ffffff', 1, '#1d1030');
    textC(ctx, 'SPACE / E: SPELLS   R: FISH (FACE WATER)   G: FEED FRIENDS', W / 2, by - 14, '#d9c2ff', 1, '#1d1030');
    ctx.globalAlpha = 1;
  }
  if (G.banner > 0) {
    ctx.globalAlpha = Math.min(1, G.banner);
    textC(ctx, 'A NEW DAY BEGINS', W / 2, 70, '#f6d365', 2, '#3b2412');
    ctx.globalAlpha = 1;
  }
  if (G.regBanner && !G.inside) {
    ctx.globalAlpha = clamp(Math.min(G.regBanner.t, 3.2 - G.regBanner.t + 0.2) * 1.5, 0, 1);
    textC(ctx, G.regBanner.name, W / 2, 72, '#ffffff', 2, '#1d1030'); ctx.globalAlpha = 1;
  }
  if (G.sleptMsg > 0 && !G.fx) { ctx.globalAlpha = Math.min(1, G.sleptMsg); textC(ctx, 'GOOD MORNING, NINA!', W / 2, 90, '#f6d365', 2, '#3b2412'); ctx.globalAlpha = 1; }
  if (G.paused) {
    rect(ctx, 'rgba(10,5,25,0.75)', 0, 0, W, H);
    textC(ctx, 'PAUSED', W / 2, 80, '#f6d365', 3, '#5a2a10');
    textC(ctx, 'ESC: RESUME', W / 2, 116, '#ffffff');
    textC(ctx, 'Q: QUIT TO TITLE', W / 2, 130, '#b9a6d8');
  }
  if (!G.inside) { Bonds.drawHUD(); Npcs.drawHUD(); }
  Animals.drawToasts();
  if (G.dex) Animals.drawDex();
  if (G.map) drawMap();
  if (G.bagUI) Bonds.drawUI();
  Npcs.drawUI();
  if (G.fx) {
    const f = G.fx, a = f.mode === 'out' ? clamp(f.t / f.dur, 0, 1) : clamp(1 - f.t / f.dur, 0, 1);
    ctx.globalAlpha = a; rect(ctx, '#0a0614', 0, 0, W, H); ctx.globalAlpha = 1;
    if (f.label && a > 0.6) textC(ctx, f.label, W / 2, 100, '#c8d8ff', 3);
  }
}

const play = {
  enter() { if (!G) startPlay(); },
  update: updatePlay,
  draw: drawPlay
};

// ================================================================ main loop
const scenes = { title, select, loading, play };
function updateAll(dt) {
  if (fade) {
    if (fade.phase === 'out') {
      fadeA += dt * 3;
      if (fadeA >= 1) { fadeA = 1; scene = fade.name; scenes[scene].enter(); fade.phase = 'in'; }
    } else {
      fadeA -= dt * 3;
      if (fadeA <= 0) { fadeA = 0; fade = null; }
    }
    pressed.clear();
  }
  scenes[scene].update(dt);
}
function drawAll() {
  scenes[scene].draw();
  if (typeof TouchUI !== 'undefined') TouchUI.draw();
  if (fadeA > 0) { ctx.globalAlpha = fadeA; rect(ctx, '#000', 0, 0, W, H); ctx.globalAlpha = 1; }
}
let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  updateAll(dt);
  drawAll();
  pressed.clear();
  requestAnimationFrame(frame);
}
initSprites();
title.enter();
requestAnimationFrame(frame);
