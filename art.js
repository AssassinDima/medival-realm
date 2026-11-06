'use strict';
/* =====================================================================
   art.js - shared pixel-art helpers (loaded first)
   - mk / rect / ell : basic canvas + shape helpers
   - aTri / aLine / apx : pixel triangle, line, pixel
   - shadeSprite : rim light on top edges, shadow on bottom edges
   - outlineSprite : 1px dark outline around a sprite (gives everything the
                     same "inked" look as Nina)
   ===================================================================== */
function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}
function rect(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }
// filled pixel ellipse
function ell(g, c, cx, cy, rx, ry) {
  g.fillStyle = c;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const dy = (y + 0.5 - cy) / ry;
    if (Math.abs(dy) > 1) continue;
    const half = rx * Math.sqrt(1 - dy * dy);
    const x0 = Math.round(cx - half), x1 = Math.round(cx + half);
    if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
  }
}
function apx(g, c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
function aTri(g, col, x0, y0, x1, y1, x2, y2) {
  g.fillStyle = col;
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  if (!d) return;
  const minX = Math.floor(Math.min(x0, x1, x2)), maxX = Math.ceil(Math.max(x0, x1, x2));
  const minY = Math.floor(Math.min(y0, y1, y2)), maxY = Math.ceil(Math.max(y0, y1, y2));
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5;
    const a = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) / d;
    const b = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) / d;
    if (a >= 0 && b >= 0 && 1 - a - b >= 0) g.fillRect(x, y, 1, 1);
  }
}
function aLine(g, col, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1;
  for (let i = 0; i <= n; i++) apx(g, col, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function dk(h, k) {
  const f = v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
  const [r, g, b] = hexRgb(h); return '#' + f(r) + f(g) + f(b);
}

// light from the top-left: lighten top/left edges, darken bottom/right edges
function shadeSprite(c, o = {}) {
  const w = c.width, h = c.height, g = c.getContext('2d');
  const img = g.getImageData(0, 0, w, h), d = img.data, src = new Uint8ClampedArray(d);
  const top = o.top === undefined ? 16 : o.top, bot = o.bottom === undefined ? -34 : o.bottom;
  const rgt = o.right === undefined ? -14 : o.right, lft = o.left === undefined ? 6 : o.left;
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : src[(y * w + x) * 4 + 3];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (src[i + 3] < 128) continue;
    let k = 0;
    if (!A(x, y - 1)) k += top;
    if (!A(x, y + 1)) k += bot;
    if (!A(x + 1, y)) k += rgt;
    if (!A(x - 1, y)) k += lft;
    if (!k) continue;
    for (let j = 0; j < 3; j++) d[i + j] = Math.max(0, Math.min(255, src[i + j] + k));
  }
  g.putImageData(img, 0, 0);
  return c;
}

// returns a NEW canvas, 2px bigger in each dimension, with a 1px outline (img.pad = 1)
function outlineSprite(c, col = '#1a1226') {
  const w = c.width, h = c.height;
  const [out, g] = mk(w + 2, h + 2), [t, tg] = mk(w + 2, h + 2);
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) tg.drawImage(c, dx, dy);
  tg.globalCompositeOperation = 'source-in'; tg.fillStyle = col; tg.fillRect(0, 0, w + 2, h + 2);
  g.drawImage(t, 0, 0); g.drawImage(c, 1, 1);
  out.pad = 1;
  return out;
}

/* =====================================================================
   Hi-res support: sprites are drawn at HS x the logic resolution.
   ===================================================================== */
const HS = 2;
function prng(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function mixc(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
// draw a hi-res sprite at logic coordinates (x, y = top-left of its content; img.pad is outline room)
function blit(img, x, y, sc = 1) {
  const p = (img.pad || 0) * sc;
  ctx.drawImage(img, x - p, y - p, img.width / HS * sc, img.height / HS * sc);
}
// automatic colour-matched outline + rim light / shade (opt.clip: no outline outside the canvas, for tiles)
function polish(src, opt = {}) {
  const w = src.width, h = src.height, pad = opt.clip ? 0 : 1, W2 = w + 2 * pad, H2 = h + 2 * pad;
  const d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const [out, g] = mk(W2, H2);
  const od = g.createImageData(W2, H2), o = od.data;
  const al = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3];
  const ink = opt.ink || [26, 18, 38], k = opt.inkMix === undefined ? 0.3 : opt.inkMix;
  for (let y = -pad; y < h + pad; y++) for (let x = -pad; x < w + pad; x++) {
    const oi = ((y + pad) * W2 + (x + pad)) * 4;
    if (al(x, y) >= 128) {
      const si = (y * w + x) * 4;
      let r = d[si], gg = d[si + 1], b = d[si + 2];
      if (opt.shade !== false) {
        const top = al(x, y - 1) < 128 || al(x - 1, y) < 128, bot = al(x, y + 1) < 128 || al(x + 1, y) < 128;
        if (top && !bot) { r += (255 - r) * 0.16; gg += (255 - gg) * 0.16; b += (255 - b) * 0.16; }
        else if (bot && !top) { r *= 0.82; gg *= 0.82; b *= 0.86; }
      }
      o[oi] = r; o[oi + 1] = gg; o[oi + 2] = b; o[oi + 3] = 255;
    } else if (!opt.noOutline && pad) {
      let nx = -1, ny = -1;
      if (al(x, y + 1) >= 128) { nx = x; ny = y + 1; } else if (al(x - 1, y) >= 128) { nx = x - 1; ny = y; }
      else if (al(x + 1, y) >= 128) { nx = x + 1; ny = y; } else if (al(x, y - 1) >= 128) { nx = x; ny = y - 1; }
      if (nx >= 0) {
        const si = (ny * w + nx) * 4;
        o[oi] = d[si] * k + ink[0] * (1 - k) * 0.9; o[oi + 1] = d[si + 1] * k + ink[1] * (1 - k) * 0.9; o[oi + 2] = d[si + 2] * k + ink[2] * (1 - k) * 0.9; o[oi + 3] = 255;
      }
    }
  }
  g.putImageData(od, 0, 0);
  out.pad = pad / HS;
  return out;
}
function mirrorImg(src) {
  const [o, og] = mk(src.width, src.height);
  og.translate(src.width, 0); og.scale(-1, 1); og.drawImage(src, 0, 0);
  o.pad = src.pad; return o;
}
