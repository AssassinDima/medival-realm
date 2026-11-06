'use strict';
/* =====================================================================
   npcart.js - pixel art for the villagers, the village buildings, the
   Wolfclan camp and the hidden entrances. Everything is drawn in code at
   HS x the logic resolution, then run through polish() for the outline.
   ===================================================================== */
const NpcArt = { ready: false, spr: {}, bld: {}, misc: {} };

// ---------------------------------------------------------------- people
// canvas 32x60 device px (16x30 logic). feet at y=58.
const NPC_DEF = {
  elyra: { skin: '#f1d9c8', hair: '#b4cfe6', hairHi: '#e4f2ff', cloth: '#3f7a58', cloth2: '#d8e8d0', trim: '#2a5a40', pants: '#5a4a3a', boots: '#3e2e22', style: 'long', ears: true, w: 14, top: 4 },
  kai: { skin: '#e8c4a0', hair: '#1c1a24', hairHi: '#3a3a4c', cloth: '#2c4036', cloth2: '#3a5448', trim: '#6a5030', pants: '#222a2a', boots: '#161616', style: 'hood', hood: '#2a4a3a', w: 13, top: 4 },
  brennan: { skin: '#e0b896', hair: '#6a4228', hairHi: '#8a5a38', cloth: '#aab4c4', cloth2: '#2f5fb0', trim: '#e8c84a', pants: '#4a4a5a', boots: '#2e2e3a', style: 'short', beard: '#6a4228', w: 16, top: 3 },
  seraphina: { skin: '#f0d4b8', hair: '#e8c66a', hairHi: '#fff0a8', cloth: '#f4f0e4', cloth2: '#ffffff', trim: '#e0b84a', pants: '#e8e0d0', boots: '#c8a850', style: 'braid', w: 14, top: 4 },
  finn: { skin: '#ecc8a4', hair: '#a8502a', hairHi: '#c8703a', cloth: '#c85a4a', cloth2: '#f4ecd8', trim: '#e8c84a', pants: '#4a3a6a', boots: '#3a2a22', style: 'hat', hat: '#6a3a6a', w: 14, top: 4 },
  thorin: { skin: '#e0b090', hair: '#d8742a', hairHi: '#f0983a', cloth: '#7a4a2a', cloth2: '#8a94a4', trim: '#d8a43a', pants: '#4a3a30', boots: '#2e2a26', style: 'short', beard: '#d8742a', big: true, w: 18, top: 12, legs: -5 },
  raika: { skin: '#c89870', hair: '#1c2440', hairHi: '#3a4a7a', cloth: '#5a4a3a', cloth2: '#d8d0c0', trim: '#8aa8d8', pants: '#4a3a30', boots: '#d8d0c0', style: 'wolf', w: 16, top: 0 }
};

function personFrame(id, dir, fr) {
  const d = NPC_DEF[id], [c, g] = mk(32, 60);
  const cx = 16, top = d.top;                           // y of the top of the head area
  const bob = fr === 0 ? 0 : 1;
  const hy = top + 2 + bob;                              // head centre y
  const legTop = top + 36 + (d.legs || 0) * 0 + bob, legLen = 14 + (d.legs || 0);
  const feet = 58;
  const side = dir === 'left' || dir === 'right';
  const flip = dir === 'left';
  const X = x => flip ? 32 - x : x;                      // mirror helper (for side views we draw as 'right' then flip)
  const R = (col, x, y, w, h) => { if (flip) rect(g, col, 32 - x - w, y, w, h); else rect(g, col, x, y, w, h); };
  const bw = d.w, bx = cx - bw / 2;
  const legW = d.big ? 6 : 5;
  const step = fr === 1 ? 2 : fr === 2 ? -2 : 0;
  const lenA = d.legs ? legLen : 14;

  // --- legs
  const legsY = feet - 2 - lenA - (d.legs ? 0 : 0);
  if (!side) {
    const l1 = legsY + (step > 0 ? 0 : 2 * Math.abs(step) / 2), l2 = legsY + (step < 0 ? 0 : 2 * Math.abs(step) / 2);
    R(d.pants, cx - legW - 1, l1, legW, feet - l1 - 2); R(d.pants, cx + 1, l2, legW, feet - l2 - 2);
    R(d.boots, cx - legW - 1, feet - 5 - (step > 0 ? 0 : 1), legW, 5); R(d.boots, cx + 1, feet - 5 - (step < 0 ? 0 : 1), legW, 5);
  } else {
    R(d.pants, cx - 3 + step, legsY, legW, feet - legsY - 2); R(d.pants, cx - 3 - step, legsY, legW, feet - legsY - 2);
    R(d.boots, cx - 3 + step, feet - 5, legW + 1, 5); R(d.boots, cx - 3 - step, feet - 5, legW + 1, 5);
  }
  // --- torso
  const ty = hy + 7, th = legsY - ty + 2;
  if (!side) {
    R(d.cloth, bx, ty, bw, th);
    // tabard / front detail
    if (dir === 'down') {
      if (id === 'brennan') { R(d.cloth2, cx - 3, ty, 6, th + 2); R(d.trim, cx - 1, ty + 3, 2, 3); }
      else if (id === 'seraphina') { R(d.cloth2, cx - 3, ty, 6, th + 4); R(d.trim, cx - 1, ty + 1, 2, 8); R(d.trim, bx, ty, bw, 1); }
      else if (id === 'elyra') { R(d.cloth2, cx - 3, ty, 6, th - 2); R(d.trim, cx - 4, ty, 1, th); R(d.trim, cx + 3, ty, 1, th); }
      else if (id === 'kai') { R(d.cloth2, cx - 2, ty, 4, th); R(d.trim, bx, ty + th - 5, bw, 2); R('#b8c4cc', bx + 1, ty + th - 3, 2, 4); R('#b8c4cc', bx + bw - 3, ty + th - 3, 2, 4); }
      else if (id === 'finn') { R(d.cloth2, cx - 3, ty, 6, th); R(d.cloth, bx, ty, 4, th); R(d.cloth, bx + bw - 4, ty, 4, th); R(d.trim, cx - 1, ty + 2, 1, 1); R(d.trim, cx - 1, ty + 6, 1, 1); }
      else if (id === 'thorin') { R(d.cloth2, bx, ty, 3, th); R(d.cloth2, bx + bw - 3, ty, 3, th); R('#5a3a22', cx - 4, ty + 6, 8, th - 4); R(d.trim, cx - 4, ty + 6, 8, 1); }
      else if (id === 'raika') { R(d.cloth2, bx - 2, ty - 1, bw + 4, 6); R('#bcb4a4', bx, ty + 4, bw, 2); R(d.trim, cx - 1, ty + 8, 2, 2); }
    } else {
      if (id === 'brennan') R(d.cloth2, cx - 4, ty + 1, 8, th + 2);
      else if (id === 'seraphina') R(d.cloth2, cx - 4, ty + 1, 8, th + 4);
      else if (id === 'raika') R(d.cloth2, bx - 2, ty - 1, bw + 4, 8);
      else if (id === 'elyra') R(d.trim, bx, ty + th - 2, bw, 2);
    }
    // belt
    R('#4a3220', bx, ty + th - 3, bw, 2); R(d.trim, cx - 1, ty + th - 3, 2, 2);
    // arms
    const as = step ? 1 : 0;
    R(d.cloth, bx - 3, ty + 1 + (step > 0 ? as : 0), 3, 12); R(d.cloth, bx + bw, ty + 1 + (step < 0 ? as : 0), 3, 12);
    R(d.skin, bx - 3, ty + 13 + (step > 0 ? as : 0), 3, 3); R(d.skin, bx + bw, ty + 13 + (step < 0 ? as : 0), 3, 3);
    if (d.big || id === 'brennan') { R(d.cloth2, bx - 3, ty + 1, 3, 3); R(d.cloth2, bx + bw, ty + 1, 3, 3); }
  } else {
    R(d.cloth, cx - 6, ty, 12, th);
    if (id === 'brennan') R(d.cloth2, cx - 6, ty + 1, 12, th - 3);
    if (id === 'seraphina') R(d.cloth2, cx - 6, ty + 3, 12, th + 3);
    if (id === 'raika') R(d.cloth2, cx - 6, ty - 1, 11, 7);
    if (id === 'thorin') R('#5a3a22', cx - 6, ty + 6, 12, th - 4);
    R('#4a3220', cx - 6, ty + th - 3, 12, 2);
    R(d.cloth, cx - 2 + step, ty + 1, 4, 12); R(d.skin, cx - 2 + step, ty + 13, 4, 3);
  }

  // --- head
  const hw = 7;
  if (dir === 'up') {
    ell(g, d.skin, cx, hy, hw, 7);
  } else if (!side) {
    ell(g, d.skin, cx, hy, hw, 7);
  } else ell(g, d.skin, flip ? 32 - (cx + 1) : cx + 1, hy, 6.5, 7);
  if (d.ears && !side && dir !== 'up') { aTri(g, d.skin, cx - 6, hy - 1, cx - 12, hy - 5, cx - 6, hy + 3); aTri(g, d.skin, cx + 6, hy - 1, cx + 12, hy - 5, cx + 6, hy + 3); }
  if (d.ears && side) { R(d.skin, cx - 4, hy - 4, 4, 3); R(d.skin, cx - 6, hy - 6, 3, 3); }

  // --- face
  const ink = '#2a1a2a';
  if (dir === 'down') {
    R(ink, cx - 4, hy, 2, 3); R(ink, cx + 2, hy, 2, 3);
    R('#fff', cx - 4, hy, 1, 1); R('#fff', cx + 2, hy, 1, 1);
    R('#d88a7a', cx - 1, hy + 4, 2, 1);
    R('#f0a898', cx - 6, hy + 2, 2, 1); R('#f0a898', cx + 4, hy + 2, 2, 1);
  } else if (side) {
    R(ink, cx + 2, hy, 2, 3); R('#fff', cx + 2, hy, 1, 1);
    R('#d88a7a', cx + 3, hy + 4, 2, 1);
  }
  if (id === 'raika' && dir !== 'up') {                  // face paint
    if (dir === 'down') { R('#f2f2ee', cx - 6, hy + 1, 4, 1); R('#f2f2ee', cx - 6, hy + 3, 3, 1); R('#f2f2ee', cx + 2, hy + 1, 4, 1); R('#f2f2ee', cx + 3, hy + 3, 3, 1); }
    else { R('#f2f2ee', cx + 1, hy + 2, 4, 1); R('#f2f2ee', cx + 1, hy + 4, 3, 1); }
  }

  // --- beards
  if (d.beard && dir !== 'up') {
    if (id === 'thorin') {
      if (dir === 'down') { ell(g, d.beard, cx, hy + 7, 8, 7); R(d.skin, cx - 2, hy + 3, 4, 2); R(d.hairHi, cx - 2, hy + 9, 1, 4); R(d.hairHi, cx + 2, hy + 8, 1, 4); R('#b85a1a', cx - 4, hy + 12, 8, 2); }
      else ell(g, d.beard, X(cx + 3), hy + 7, 5, 6);
    } else {
      if (dir === 'down') { R(d.beard, cx - 6, hy + 2, 3, 6); R(d.beard, cx + 3, hy + 2, 3, 6); R(d.beard, cx - 4, hy + 5, 8, 4); R(d.skin, cx - 1, hy + 4, 2, 1); }
      else R(d.beard, cx - 1, hy + 3, 6, 6);
    }
  }

  // --- hair / headgear
  const hair = d.hair, hi = d.hairHi;
  const cap = (yy) => { ell(g, hair, cx, hy - 3, 8, 6); };
  if (d.style === 'long') {                              // elyra
    if (dir === 'up') { ell(g, hair, cx, hy, 8, 8); R(hair, cx - 8, hy, 16, 22); R(hi, cx - 3, hy + 2, 1, 16); R(hi, cx + 3, hy + 4, 1, 14); }
    else if (!side) { R(hair, cx - 8, hy - 2, 3, 22); R(hair, cx + 5, hy - 2, 3, 22); cap(); R(hair, cx - 7, hy - 3, 14, 4); R(hair, cx - 7, hy - 1, 5, 3); R(hair, cx + 2, hy - 1, 5, 3); R(hi, cx - 4, hy - 7, 3, 1); }
    else { R(hair, cx - 8, hy - 5, 11, 24); ell(g, hair, X(cx), hy - 3, 8, 6); R(hair, X(cx) - 4, hy - 3, 9, 4); R(hi, cx - 5, hy - 2, 1, 14); }
    if (dir !== 'up') { R('#e8c84a', cx - 7, hy - 4, 14, 1); R('#6cd8ff', cx - 1, hy - 5, 2, 3); }
  } else if (d.style === 'hood') {                       // kai
    const hc = d.hood;
    if (dir === 'up') { ell(g, hc, cx, hy - 1, 8, 8); R(hc, cx - 8, hy, 16, 7); R(dk(hc, 0.8), cx - 1, hy - 7, 2, 10); }
    else if (!side) { ell(g, hc, cx, hy - 2, 9, 8); R(hc, cx - 9, hy - 2, 4, 10); R(hc, cx + 5, hy - 2, 4, 10); R(hair, cx - 6, hy - 3, 12, 3); R(hair, cx - 7, hy - 1, 2, 3); R(hair, cx + 5, hy - 1, 2, 3); }
    else { ell(g, hc, X(cx), hy - 2, 9, 8); R(hc, X(cx) - 5 + (flip ? -3 : 0), hy - 2, 8, 9); R(hair, cx + 0, hy - 2, 5, 3); }
    R(d.trim, bx, ty - 1, bw, 2);
  } else if (d.style === 'short') {                      // brennan / thorin
    if (dir === 'up') { ell(g, hair, cx, hy - 1, 8, 7); R(hair, cx - 7, hy - 1, 14, 5); }
    else if (!side) { ell(g, hair, cx, hy - 3, 8, 5); R(hair, cx - 8, hy - 3, 3, 8); R(hair, cx + 5, hy - 3, 3, 8); R(hair, cx - 6, hy - 2, 12, 2); R(hi, cx - 4, hy - 6, 4, 1); }
    else { ell(g, hair, X(cx), hy - 2, 8, 6); R(hair, cx - 6, hy - 3, 7, 8); }
    if (id === 'thorin') {                               // goggles pushed up
      if (dir === 'down') { R('#8a6a2a', cx - 8, hy - 4, 16, 2); ell(g, '#d8a43a', cx - 4, hy - 4, 3, 3); ell(g, '#d8a43a', cx + 4, hy - 4, 3, 3); ell(g, '#8ad8f0', cx - 4, hy - 4, 1.5, 1.5); ell(g, '#8ad8f0', cx + 4, hy - 4, 1.5, 1.5); }
      else if (side) { ell(g, '#d8a43a', X(cx + 1), hy - 4, 3, 3); ell(g, '#8ad8f0', X(cx + 1), hy - 4, 1.5, 1.5); }
      else R('#8a6a2a', cx - 8, hy - 4, 16, 2);
    }
  } else if (d.style === 'braid') {                      // seraphina
    if (dir === 'up') { ell(g, hair, cx, hy, 8, 7); R(hair, cx - 7, hy, 14, 6); R(hair, cx - 2, hy + 6, 5, 18); R(hi, cx - 1, hy + 8, 1, 14); R(d.trim, cx - 2, hy + 22, 5, 2); }
    else if (!side) { ell(g, hair, cx, hy - 3, 8, 5); R(hair, cx - 8, hy - 3, 3, 8); R(hair, cx + 5, hy - 3, 3, 8); R(hair, cx - 6, hy - 2, 12, 2); R(hi, cx - 4, hy - 6, 4, 1); R(hair, cx + 4, hy + 4, 4, 18); R(hi, cx + 5, hy + 6, 1, 14); R(d.trim, cx + 4, hy + 20, 4, 2); R(d.trim, cx - 7, hy - 4, 14, 1); }
    else { ell(g, hair, X(cx), hy - 2, 8, 6); R(hair, cx - 8, hy - 3, 9, 10); R(hair, cx - 8, hy + 6, 4, 16); R(d.trim, cx - 8, hy + 20, 4, 2); }
  } else if (d.style === 'hat') {                        // finn
    if (dir === 'up') { ell(g, hair, cx, hy, 8, 6); R(hair, cx - 8, hy, 16, 5); }
    else if (!side) { R(hair, cx - 8, hy - 2, 3, 8); R(hair, cx + 5, hy - 2, 3, 8); R(hair, cx - 6, hy - 2, 12, 2); }
    else { R(hair, cx - 7, hy - 2, 7, 9); }
    ell(g, d.hat, cx, hy - 5, 13, 3.5);                  // brim
    R(d.hat, cx - 6, hy - 11, 12, 7); R(dk(d.hat, 0.7), cx - 6, hy - 6, 12, 2); R(d.trim, cx - 6, hy - 6, 12, 1);
    // feather
    aLine(g, '#e8f8f0', cx + 5, hy - 8, cx + 12, hy - 15); aLine(g, '#6adcc8', cx + 6, hy - 8, cx + 13, hy - 14); aLine(g, '#e8f8f0', cx + 5, hy - 9, cx + 11, hy - 15);
  } else if (d.style === 'wolf') {                       // raika
    if (dir === 'up') { ell(g, hair, cx, hy - 1, 8, 7); R(hair, cx - 8, hy, 16, 6); R(hair, cx - 6, hy + 5, 3, 18); R(hair, cx + 3, hy + 5, 3, 18); R(hi, cx - 5, hy + 7, 1, 14); R(hi, cx + 4, hy + 7, 1, 14); R(d.trim, cx - 6, hy + 21, 3, 2); R(d.trim, cx + 3, hy + 21, 3, 2); }
    else if (!side) { ell(g, hair, cx, hy - 3, 8, 5); R(hair, cx - 8, hy - 3, 3, 10); R(hair, cx + 5, hy - 3, 3, 10); R(hair, cx - 6, hy - 2, 12, 2); R(hair, cx - 8, hy + 6, 2, 12); R(hair, cx + 6, hy + 6, 2, 12); R(d.trim, cx - 8, hy + 16, 2, 2); R(d.trim, cx + 6, hy + 16, 2, 2); R(hi, cx - 4, hy - 6, 4, 1); }
    else { ell(g, hair, X(cx), hy - 2, 8, 6); R(hair, cx - 8, hy - 3, 9, 10); R(hair, cx - 8, hy + 6, 3, 14); R(d.trim, cx - 8, hy + 18, 3, 2); }
  }

  // --- character extras
  if (id === 'brennan' && !side) {                       // shield on the left arm, pauldrons
    R(d.cloth, bx - 4, ty - 1, 5, 4); R(d.cloth, bx + bw - 1, ty - 1, 5, 4);
    if (dir === 'down') { R('#274a8a', bx - 7, ty + 6, 6, 11); R('#e8c84a', bx - 6, ty + 8, 4, 1); R('#e8c84a', bx - 5, ty + 9, 2, 4); R('#aab4c4', bx - 7, ty + 6, 6, 1); }
  }
  if (id === 'brennan' && side) { R('#274a8a', cx - 1, ty + 6, 5, 11); R('#e8c84a', cx, ty + 8, 3, 1); }
  if (id === 'seraphina' && dir === 'down') { R('#8a6a3a', bx + bw + 2, ty + 8, 2, 14); R('#e8c84a', bx + bw + 1, ty + 4, 4, 5); R('#fff0a8', bx + bw + 2, ty + 5, 2, 2); }
  if (id === 'seraphina') { R(d.trim, bx - 3, ty - 1, 4, 3); R(d.trim, bx + bw - 1, ty - 1, 4, 3); }
  if (id === 'finn' && dir === 'down') { ell(g, '#a8642a', bx + 1, ty + 12, 5, 6); R('#6a3a1a', bx - 1, ty + 8, 2, 8); R('#2a1a10', bx, ty + 12, 3, 3); aLine(g, '#6a3a1a', bx + 2, ty + 7, bx + 8, ty - 1); }
  if (id === 'kai' && dir === 'up') { R('#b8c4cc', cx - 7, ty + 2, 1, 8); R('#b8c4cc', cx + 6, ty + 2, 1, 8); }
  if (id === 'thorin' && dir === 'down') { R('#8a94a4', bx - 3, ty + 12, 3, 4); R('#8a94a4', bx + bw, ty + 12, 3, 4); }
  if (id === 'raika' && dir === 'up') { R('#6a4a2a', cx - 1, ty - 6, 2, 22); R('#c8d0d8', cx - 6, ty - 8, 7, 6); R('#8a94a4', cx - 6, ty - 3, 7, 1); }
  if (id === 'raika' && dir === 'down') { R('#6a4a2a', bx + bw + 1, ty + 4, 2, 20); R('#c8d0d8', bx + bw - 1, ty, 6, 6); R('#8a94a4', bx + bw - 1, ty + 5, 6, 1); }
  if (id === 'elyra' && dir === 'down') { R(d.trim, cx - 5, ty - 1, 10, 2); R('#e8c84a', cx - 1, ty, 2, 2); }

  return polish(c);
}

function buildNpcSprites() {
  for (const id in NPC_DEF) {
    const set = {};
    for (const dir of ['down', 'up', 'left', 'right']) {
      set[dir] = [0, 1, 2].map(f => {
        if (dir === 'left') return mirrorImg(personFrame(id, 'right', f));
        return personFrame(id, dir, f);
      });
    }
    NpcArt.spr[id] = set;
  }
}
// feet position (x, y) in logic px
function drawNpcSprite(id, dir, fr, x, y) {
  const img = NpcArt.spr[id][dir][fr];
  blit(img, Math.round(x) - 8, Math.round(y) - 29);
}

// ---------------------------------------------------------------- buildings (96x64 logic = 192x128 device)
function buildingSprite(kind) {
  const [c, g] = mk(192, 128);
  const W2 = 192;
  const wall = { forge: '#8a8a94', chapel: '#ece4d4', tavern: '#b8844a', watch: '#9a9aa8' }[kind];
  const roof = { forge: '#4a4a58', chapel: '#6a8ac8', tavern: '#a8452f', watch: '#2f5fb0' }[kind];
  const roofHi = mixc(roof, '#ffffff', 0.22), roofLo = dk(roof, 0.72);
  const wy = 48;                                           // top of the wall
  // wall
  rect(g, wall, 8, wy, 176, 78);
  const r = prng(kind.length * 977 + 11);
  if (kind === 'tavern') {                                  // timber planks
    for (let x = 8; x < 184; x += 8) rect(g, '#9a6c3a', x, wy, 2, 78);
    for (let i = 0; i < 60; i++) rect(g, '#a87a46', 8 + Math.floor(r() * 176), wy + Math.floor(r() * 78), 3, 1);
    rect(g, '#6a4220', 8, wy + 26, 176, 3);
  } else {                                                  // stone courses
    for (let y = wy; y < wy + 78; y += 10) { rect(g, dk(wall, 0.84), 8, y, 176, 1); for (let x = 8 + ((y / 10) % 2) * 8; x < 184; x += 16) rect(g, dk(wall, 0.84), x, y, 1, 10); }
    for (let i = 0; i < 40; i++) rect(g, dk(wall, 0.92), 8 + Math.floor(r() * 176), wy + Math.floor(r() * 78), 3, 2);
  }
  rect(g, dk(wall, 0.7), 8, wy + 74, 176, 4);               // plinth
  rect(g, dk(wall, 0.8), 8, wy, 2, 78); rect(g, dk(wall, 0.8), 182, wy, 2, 78);
  // roof (trapezoid) + overhang
  for (let y = 0; y < 50; y++) {
    const inset = Math.round((50 - y) * 0.55), x0 = 2 + inset, x1 = 190 - inset;
    rect(g, y % 8 < 1 ? roofLo : y % 8 < 4 ? roof : mixc(roof, roofLo, 0.35), x0, y, x1 - x0, 1);
  }
  for (let y = 0; y < 50; y += 8) for (let x = 6 + (y / 8 % 2) * 6; x < 186; x += 12) { const inset = Math.round((50 - y) * 0.55); if (x > 4 + inset && x < 188 - inset) rect(g, roofLo, x, y + 1, 1, 7); }
  rect(g, roofLo, 2, 48, 188, 3); rect(g, roofHi, 2, 47, 188, 1);
  // door (bottom centre, 20x28 logic -> 40x56 device) at x 76..116, y 72..128
  const dx = 76, dy = 76;
  rect(g, '#2a1a10', dx - 3, dy - 3, 46, 55); rect(g, '#6a4220', dx, dy, 40, 52);
  for (let x = dx; x < dx + 40; x += 8) rect(g, '#5a3818', x, dy, 1, 52);
  rect(g, '#8a5a2a', dx, dy, 40, 2); rect(g, '#d8b050', dx + 31, dy + 26, 3, 4);
  // windows
  const win = (x, y, w, h) => {
    rect(g, '#2a1a10', x - 2, y - 2, w + 4, h + 4); rect(g, kind === 'chapel' ? '#9ad0ff' : '#ffe08a', x, y, w, h);
    rect(g, 'rgba(255,255,255,0.35)', x, y, w, 3); rect(g, '#2a1a10', x + w / 2 - 1, y, 2, h); rect(g, '#2a1a10', x, y + h / 2, w, 2);
    rect(g, '#6a4220', x - 3, y + h + 2, w + 6, 3);
  };
  win(26, 70, 24, 28); win(142, 70, 24, 28);
  // per-kind details
  if (kind === 'forge') {
    rect(g, '#3a3a46', 150, 6, 22, 44); rect(g, '#2a2a34', 148, 4, 26, 6); rect(g, '#5a5a68', 150, 6, 4, 44);   // chimney
    for (const [x, y, a] of [[160, -2, 0.5], [164, -8, 0.35]]) { g.globalAlpha = a; ell(g, '#c8c8d4', x, y + 4, 6, 4); g.globalAlpha = 1; }
    rect(g, '#2a1a10', 18, 104, 18, 20); rect(g, '#ff9a3a', 20, 106, 14, 16);   // furnace glow by the wall
    rect(g, '#ffd86a', 24, 112, 6, 10);
    rect(g, '#5a5a68', 150, 112, 28, 6); rect(g, '#3a3a46', 156, 106, 16, 6); rect(g, '#3a3a46', 150, 118, 4, 10); rect(g, '#3a3a46', 174, 118, 4, 10); // anvil
  } else if (kind === 'chapel') {
    rect(g, '#d8d0c0', 78, 4, 36, 46); rect(g, roof, 72, 0, 48, 8); rect(g, '#2a2a3a', 88, 14, 16, 22);   // bell tower
    rect(g, '#e8c84a', 94, 20, 4, 10); rect(g, '#e8c84a', 91, 23, 10, 3);
    for (let i = 0; i < 6; i++) rect(g, '#e8c84a', 94 - i, 0 - i + 2, 4 + 2 * i, 1);
    rect(g, '#fff0a8', 94, 110, 4, 12);                                                                      // lamp over door
    ell(g, '#9ad0ff', 96, 66, 11, 14);                                                                       // rose window
    ell(g, '#fff6c8', 96, 66, 6, 8); rect(g, '#2a1a10', 95, 52, 2, 28); rect(g, '#2a1a10', 85, 65, 22, 2);
  } else if (kind === 'tavern') {
    rect(g, '#3a2a1a', 20, 22, 6, 28); rect(g, '#3a2a1a', 14, 24, 18, 4);                                    // bracket
    rect(g, '#2a1a10', 134, 90, 46, 20); rect(g, '#d8a84a', 136, 92, 42, 16); rect(g, '#6a3a1a', 142, 95, 30, 3); rect(g, '#6a3a1a', 148, 101, 18, 3);  // sign board
    rect(g, '#d8a84a', 150, 82, 3, 8); rect(g, '#d8a84a', 164, 82, 3, 8);
    rect(g, '#6a4220', 20, 108, 20, 16); rect(g, '#d8a84a', 20, 108, 20, 3); rect(g, '#d8a84a', 20, 118, 20, 3); // barrel
    rect(g, '#3a3a46', 144, 8, 18, 38); rect(g, '#2a2a34', 142, 6, 22, 5);                                    // chimney
    ell(g, 'rgba(255,200,120,0.18)', 96, 120, 60, 16);
  } else if (kind === 'watch') {
    rect(g, '#2f5fb0', 20, 68, 22, 50); rect(g, '#e8c84a', 20, 68, 22, 3); rect(g, '#e8c84a', 28, 84, 6, 14); rect(g, '#e8c84a', 24, 90, 14, 4);   // banner
    rect(g, '#2f5fb0', 156, 68, 22, 50); rect(g, '#e8c84a', 156, 68, 22, 3); rect(g, '#e8c84a', 164, 84, 6, 14); rect(g, '#e8c84a', 160, 90, 14, 4);
    for (let x = 8; x < 184; x += 24) rect(g, wall, x, wy - 10, 14, 10);                                      // crenellations behind the roof line
    rect(g, '#6a4a2a', 70, 112, 6, 14); rect(g, '#c8d0d8', 68, 100, 10, 12); // spear rack
  }
  // sill lamp
  rect(g, '#ffd56a', 44, 118, 4, 6);
  const out = polish(c);
  out.isBuilding = true;
  return out;
}

// ---------------------------------------------------------------- camp + entrances
function tentSprite() {
  const [c, g] = mk(64, 52);
  for (let y = 0; y < 40; y++) { const w = Math.round(y * 0.8) + 2; rect(g, y % 6 < 3 ? '#8a7a68' : '#7a6a58', 32 - w / 2, 4 + y, w, 1); }
  rect(g, '#3a2a1c', 20, 30, 24, 14); rect(g, '#1a0e08', 24, 34, 16, 10);
  aTri(g, '#d8d0c0', 32, 4, 22, 22, 42, 22); rect(g, '#8aa8d8', 26, 22, 12, 2);
  rect(g, '#6a4a2a', 31, 0, 2, 8); rect(g, '#c8d0d8', 29, 0, 6, 2);
  for (let i = 0; i < 20; i++) rect(g, '#9a8a76', 8 + (i * 7) % 48, 24 + (i * 5) % 18, 1, 2);
  return polish(c);
}
function campfireSprite(f) {
  const [c, g] = mk(32, 36);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ell(g, '#7a7a86', 16 + Math.cos(a) * 9, 28 + Math.sin(a) * 4, 2.5, 2); }
  rect(g, '#6a4220', 8, 24, 16, 3); rect(g, '#4a2a14', 10, 28, 12, 3);
  const h = 14 + (f ? 3 : 0);
  aTri(g, '#e8522a', 16, 28 - h, 8, 27, 24, 27); aTri(g, '#ff9a3a', 16, 28 - h + 4, 11, 27, 21, 27); aTri(g, '#ffe27a', 16, 28 - h + 9, 13, 27, 19, 27);
  return polish(c);
}
function totemSprite() {
  const [c, g] = mk(24, 64);
  rect(g, '#5a4028', 7, 8, 10, 54); rect(g, '#6a4a30', 7, 8, 3, 54);
  rect(g, '#d8d0c0', 3, 10, 18, 14); rect(g, '#2a1a10', 6, 14, 4, 4); rect(g, '#2a1a10', 14, 14, 4, 4); aTri(g, '#d8d0c0', 3, 10, 6, 2, 9, 10); aTri(g, '#d8d0c0', 15, 10, 18, 2, 21, 10);
  rect(g, '#8aa8d8', 7, 30, 10, 3); rect(g, '#c85a4a', 7, 40, 10, 3); rect(g, '#8aa8d8', 7, 50, 10, 3);
  return polish(c);
}
function entranceSprite(kind) {
  const [c, g] = mk(40, 36);
  if (kind === 'hatch') {
    rect(g, '#2a1a10', 4, 12, 32, 20); rect(g, '#6a4a2a', 6, 14, 28, 16); for (let x = 6; x < 34; x += 7) rect(g, '#5a3a1c', x, 14, 1, 16);
    rect(g, '#8a8a94', 6, 20, 28, 2); rect(g, '#d8b050', 17, 22, 6, 4);
  } else if (kind === 'tree') {
    ell(g, '#4a3a28', 20, 20, 15, 16); ell(g, '#120a14', 20, 24, 8, 11); rect(g, '#120a14', 12, 24, 16, 8);
    for (let i = 0; i < 6; i++) rect(g, '#9ad8ff', 9 + (i * 5) % 22, 6 + (i * 7) % 24, 1, 1);
  } else if (kind === 'cave') {
    ell(g, '#5a5a6a', 20, 22, 18, 15); ell(g, '#0c0a14', 20, 26, 11, 11); rect(g, '#0c0a14', 9, 26, 22, 8);
    for (let i = 0; i < 5; i++) rect(g, '#7a7a8a', 6 + i * 7, 8 + (i % 2) * 3, 3, 2);
  } else {
    ell(g, '#a8d0f0', 20, 22, 18, 15); ell(g, '#e8f6ff', 14, 14, 8, 5); ell(g, '#10243a', 20, 26, 10, 11); rect(g, '#10243a', 10, 26, 20, 8);
    for (let i = 0; i < 5; i++) aTri(g, '#d8f0ff', 10 + i * 5, 17, 12 + i * 5, 25 + (i % 2) * 3, 14 + i * 5, 17);
  }
  return polish(c);
}
function markSprite(kind) {
  const [c, g] = mk(12, 16);
  if (kind === '!') { rect(g, '#ffe27a', 4, 1, 4, 9); rect(g, '#ffe27a', 4, 12, 4, 3); }
  else { ell(g, '#ff7aa8', 3.5, 4, 3, 3); ell(g, '#ff7aa8', 8.5, 4, 3, 3); aTri(g, '#ff7aa8', 0.5, 6, 11.5, 6, 6, 13); }
  return polish(c);
}

function initNpcArt() {
  if (NpcArt.ready) return;
  buildNpcSprites();
  for (const k of ['forge', 'chapel', 'tavern', 'watch']) NpcArt.bld[k] = buildingSprite(k);
  NpcArt.misc.tent = tentSprite(); NpcArt.misc.fire = [campfireSprite(0), campfireSprite(1)]; NpcArt.misc.totem = totemSprite();
  NpcArt.misc.ent = {}; for (const k of ['hatch', 'tree', 'cave', 'icecave']) NpcArt.misc.ent[k] = entranceSprite(k);
  NpcArt.misc.mark = { '!': markSprite('!'), '<3': markSprite('h') };
  NpcArt.ready = true;
}
