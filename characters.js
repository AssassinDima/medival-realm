'use strict';
/* =====================================================================
   characters.js  -  hero roster + hero sprites
   Each hero = data + a buildSprites() function. Add new heroes here,
   one at a time (set unlocked:true and give them a buildSprites()).
   Shared helpers (mk, rect, ell, outlineSprite...) live in art.js.
   ===================================================================== */

// ---------- hero roster (from your character-select image) ----------
const CHARACTERS = [
  { id: 'elyra', name: 'Elyra Moonveil', short: 'Elyra', color: '#4fa86a', unlocked: false,
    title: 'Ranger of the Whispering Woods', ability: "Marksman's Trace * Swift and Stealthy" },
  { id: 'kai', name: 'Kai Nightshade', short: 'Kai', color: '#5a6a8a', unlocked: false,
    title: 'Shadow Rogue of the Raven Cove', ability: 'Silent Step * Poison Blade' },
  { id: 'brennan', name: 'Sir Brennan Stoneward', short: 'Brennan', color: '#4a7ac8', unlocked: false,
    title: 'Holy Knight of the Blue Lion', ability: 'Valiant Ward * Protective Shield' },
  { id: 'seraphina', name: 'Seraphina Lightbrook', short: 'Seraphina', color: '#e8c85a', unlocked: false,
    title: "Paladin of Dawn's Mercy", ability: 'Holy Mend * Divine Shield' },
  { id: 'nina', name: 'Nina Starweave', short: 'Nina', color: '#9b72d6', unlocked: true,
    title: 'Goth Mage of the Silver Moon', ability: 'Starfrost Spell * Arcane Frost',
    blurb: 'Space: fire a frost star.  E: freeze nearby water into ice.',
    speed: 58, maxMana: 100, buildSprites: buildNinaSprites },
  { id: 'finn', name: 'Finn Melodric', short: 'Finn', color: '#c8803a', unlocked: false,
    title: 'Wandering Bard of the Golden Tavern', ability: 'Heroic Ballad * Inspiring Song' },
  { id: 'thorin', name: 'Thorin Grimbelt', short: 'Thorin', color: '#b0703a', unlocked: false,
    title: 'Master Tinker and Forgekeeper', ability: 'Clockwork Bolt * Mechanical Craft' },
  { id: 'raika', name: 'Raika Frostbane', short: 'Raika', color: '#5aa0d8', unlocked: false,
    title: 'Wolfclan Barbarian Chieftain', ability: 'Fury Howl * Beast Strength' }
];

// ---------- Nina: goth mage (from the new reference art) ----------
// Cell is 24x38 (outlined to 26x40). Facing: down / up / left (right = mirrored left).
// Frames: 0 = standing, 1 / 2 = walking steps.
const NP = {
  hair: '#17141f', hairM: '#272235', hairL: '#34304d', hairH: '#4f4b70', hairH2: '#6a6590',
  skin: '#f6dccf', skinS: '#e6bfb0', skinD: '#c99689',
  lips: '#1a1420', lipH: '#66557f',
  glass: '#0b0a10', lens: '#f7e9e3', liner: '#2a2030', white: '#f6f4fa', eye: '#16111c',
  shirt: '#f6f6f9', shirtD: '#d4d5e4', shirtDD: '#a7a9c3', print: '#17141f',
  pants: '#211d2e', pantsL: '#3a3656', pantsD: '#110e18',
  boot: '#15121d', bootL: '#4a4564', sole: '#6a6585'
};
const COMF = {
  C: ['XXX', 'X..', 'X..', 'X..', 'XXX'], O: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  M: ['X.X', 'XXX', 'XXX', 'X.X', 'X.X'], F: ['XXX', 'X..', 'XX.', 'X..', 'X..']
};
const SKULL = ['XXXXX', 'X.X.X', '.XXX.'];
const NW = 24;  // cell width (mirror axis)

function ninaToolkit(g) {
  const R = (c, x, y, w, h) => rect(g, c, x, y, w, h), E = (c, cx, cy, rx, ry) => ell(g, c, cx, cy, rx, ry);
  const M = (c, x, y, w, h) => { R(c, x, y, w, h); R(c, NW - x - w, y, w, h); };
  return { R, E, M };
}
function ninaLegsFront(g, f, back) {
  const P = NP, { R } = ninaToolkit(g), lu = f === 1 ? 1 : 0, ru = f === 2 ? 1 : 0;
  [[4, lu, 0], [13, ru, 1]].forEach(([x, l, i]) => {
    R(P.pants, x, 31, 7, 4 - l); R(P.pants, x - 1, 34 - l, 9, 1);
    R(P.pantsD, i ? x : x + 5, 31, 2, 4 - l); R(P.pantsL, i ? x + 5 : x + 1, 32, 1, 2);
    R(P.boot, x - 1, 35 - l, 9, 3); R(P.sole, x - 1, 37 - l, 9, 1);
    if (!back) R(P.bootL, i ? x + 4 : x, 35 - l, 3, 1);
  });
  R(P.pants, 10, 31, 4, 3);
}
function drawNinaFront(g, f) {
  const P = NP, { R, E, M } = ninaToolkit(g), sw = f === 1 ? [1, -1] : f === 2 ? [-1, 1] : [0, 0];
  ninaLegsFront(g, f, false);
  g.save(); g.translate(0, f ? -1 : 0);
  // back hair
  E(P.hair, 11.5, 9, 8.7, 9.4); R(P.hair, 4, 10, 16, 21); R(P.hair, 3, 16, 18, 14);
  // sleeves + arms
  [[1, 0], [19, 1]].forEach(([x, i]) => {
    const s = sw[i];
    R(P.shirt, x, 21, 4, 5); R(P.shirtD, i ? x + 2 : x, 22, 2, 4); R(P.shirtDD, x, 25, 4, 1);
    R(P.skin, i ? x + 1 : x, 26 + s, 3, 4); R(P.skinS, i ? x + 3 : x, 27 + s, 1, 3);
    R(P.skin, x, 30 + s, 4, 2); R(P.skinS, x, 31 + s, 4, 1);
  });
  // torso (oversized tee)
  R(P.shirt, 3, 20, 18, 11); R(P.shirtD, 17, 22, 4, 9); R(P.shirtD, 3, 29, 3, 2); R(P.shirtD, 3, 30, 18, 1); R(P.shirtDD, 5, 29, 6, 1);
  R(P.shirtD, 9, 25, 1, 3); R(P.shirtD, 14, 28, 1, 2);
  // neck + collar
  R(P.skinS, 10, 19, 4, 2); R(P.skin, 10, 20, 4, 1); R(P.shirtD, 9, 20, 1, 1); R(P.shirtD, 14, 20, 1, 1);
  // print: COMF + little skull
  let px = 5;
  for (const ch of 'COMF') { COMF[ch].forEach((row, y) => [...row].forEach((v, x) => { if (v === 'X') R(P.print, px + x, 22 + y, 1, 1); })); px += 4; }
  SKULL.forEach((row, y) => [...row].forEach((v, x) => { if (v === 'X') R(P.print, 9 + x, 27 + y, 1, 1); }));
  // face
  E(P.skin, 11.5, 12, 5.9, 6.6); E(P.skin, 11.5, 15.5, 4.9, 3.8); R(P.skinS, 5, 13, 1, 3); R(P.skinS, 18, 13, 1, 3); R(P.skinS, 9, 19, 6, 1);
  // bangs
  R(P.hair, 5, 3, 14, 6);
  M(P.hair, 5, 9, 3, 1); M(P.hair, 9, 9, 2, 1); M(P.hair, 5, 9, 2, 3);
  M(P.hairM, 8, 4, 1, 5); R(P.hairM, 11, 4, 1, 4); R(P.hairM, 12, 5, 1, 4);
  R(P.hairH, 7, 3, 3, 1); R(P.hairH2, 14, 4, 2, 1); R(P.hairL, 10, 1, 4, 1); R(P.hairH, 8, 1, 2, 1);
  // glasses + eyes
  [6].forEach(bx => {
    M(P.glass, bx, 10, 5, 1); M(P.glass, bx, 11, 1, 3); M(P.glass, bx + 4, 11, 1, 3); M(P.glass, bx + 1, 14, 3, 1);
    M(P.lens, bx + 1, 11, 3, 3); M(P.liner, bx + 1, 11, 3, 1);
    M(P.eye, bx + 2, 12, 2, 2); M(P.white, bx + 2, 12, 1, 1);
  });
  R(P.glass, 11, 11, 2, 1); M(P.glass, 5, 11, 1, 1);
  R(P.skinD, 11, 15, 2, 1);
  R(P.lips, 10, 17, 4, 1); R(P.lips, 11, 18, 2, 1); R(P.lipH, 11, 17, 1, 1);
  // front hair locks
  M(P.hair, 3, 10, 1, 17); M(P.hair, 2, 12, 1, 18); M(P.hairL, 3, 14, 1, 4); M(P.hairH, 3, 21, 1, 2);
  g.restore();
}

function drawNinaBack(g, f) {
  const P = NP, { R, E, M } = ninaToolkit(g), sw = f === 1 ? [-1, 1] : f === 2 ? [1, -1] : [0, 0];
  ninaLegsFront(g, f, true);
  g.save(); g.translate(0, f ? -1 : 0);
  [[1, 0], [19, 1]].forEach(([x, i]) => {
    const s = sw[i];
    R(P.shirt, x, 21, 4, 5); R(P.shirtD, i ? x + 2 : x, 22, 2, 4); R(P.shirtDD, x, 25, 4, 1);
    R(P.skin, i ? x + 1 : x, 26 + s, 3, 4); R(P.skin, x, 30 + s, 4, 2); R(P.skinS, x, 31 + s, 4, 1);
  });
  R(P.shirt, 3, 20, 18, 11); R(P.shirtD, 17, 22, 4, 9); R(P.shirtD, 3, 30, 18, 1);
  // big curtain of hair
  E(P.hair, 11.5, 9, 8.9, 9.5); R(P.hair, 4, 10, 16, 18); R(P.hair, 3, 16, 18, 12);
  for (let i = 0; i < 9; i++) R(P.hair, 3 + i * 2, 28, 2, 2 + ((i * 5) % 3));
  [6, 9, 12, 15, 18].forEach((x, i) => R(P.hairM, x, 12 + (i % 2) * 2, 1, 16));
  R(P.hairH, 8, 2, 5, 1); R(P.hairH2, 9, 3, 2, 1); R(P.hairH, 8, 14, 1, 6); R(P.hairL, 14, 10, 1, 8); R(P.hairH, 16, 20, 1, 5); R(P.hairL, 4, 14, 1, 10);
  g.restore();
}

function ninaLeg(g, col, x0, y0, y1, shear, w) {
  for (let y = y0; y <= y1; y++) rect(g, col, x0 + Math.round((y - y0) * shear), y, w, 1);
}
function drawNinaSide(g, f) {
  const P = NP, { R, E } = ninaToolkit(g), sway = f === 1 ? 1 : f === 2 ? -1 : 0, ax = f === 1 ? -2 : f === 2 ? 2 : 0;
  const boot = (x, y, w, hl, c) => { R(c || P.boot, x, y, w, 3); R(P.sole, x, y + 2, w, 1); if (hl) R(P.bootL, x + 1, y, 3, 1); };
  // legs: far leg (darker) first
  if (f === 0) {
    R(P.pantsD, 10, 31, 7, 4); R(P.pants, 9, 31, 7, 4); R(P.pants, 8, 34, 9, 1); R(P.pantsL, 10, 32, 1, 2);
    boot(4, 35, 13, true);
  } else {
    const leg = (forward, near) => {
      const c = near ? P.pants : P.pantsD;
      if (forward) { ninaLeg(g, c, 9, 31, 34, -1.1, 6); boot(2, 35, 10, near, near ? P.boot : P.pantsD); }
      else { ninaLeg(g, c, 10, 31, 33, 1.1, 6); boot(13, 34, 9, near, near ? P.boot : P.pantsD); }
    };
    leg(f === 2, false); leg(f === 1, true);
  }
  g.save(); g.translate(0, f ? -1 : 0);
  // back hair
  E(P.hair, 13, 9, 8.2, 9.6); R(P.hair, 13, 10, 8, 21); R(P.hair, 14, 16, 8, 15);
  for (let i = 0; i < 4; i++) R(P.hair, 14 + i * 2 + sway, 31, 2, 2 + ((i * 5) % 3));
  R(P.hairM, 16, 12, 1, 18); R(P.hairM, 19, 14, 1, 15); R(P.hairH, 15, 12, 1, 8); R(P.hairL, 20, 18, 1, 8);
  // far arm
  R(P.shirtD, 11 - ax, 21, 4, 5); R(P.skinS, 12 - ax, 26, 3, 4); R(P.skinS, 11 - ax, 30, 4, 2);
  // torso
  R(P.shirt, 6, 20, 12, 11); R(P.shirtD, 15, 21, 3, 10); R(P.shirtD, 6, 30, 12, 1); R(P.shirtDD, 7, 29, 4, 1);
  R(P.print, 7, 22, 1, 4); R(P.print, 8, 23, 1, 2); R(P.print, 7, 27, 3, 1); R(P.print, 8, 28, 2, 1);
  // near arm
  R(P.shirt, 8 + ax, 21, 5, 5); R(P.shirtD, 11 + ax, 22, 2, 4); R(P.shirtDD, 8 + ax, 25, 5, 1);
  R(P.skin, 9 + ax, 26, 3, 4); R(P.skinS, 11 + ax, 27, 1, 3); R(P.skin, 8 + ax, 30, 4, 2); R(P.skinS, 8 + ax, 31, 4, 1);
  // neck + head
  R(P.skinS, 8, 19, 4, 2);
  E(P.skin, 10, 12, 5.6, 6.6); E(P.skin, 9, 15.5, 4.7, 3.8);
  R(P.skin, 4, 13, 1, 2); R(P.skinD, 4, 15, 1, 1); R(P.lips, 4, 17, 2, 1); R(P.lips, 5, 18, 2, 1); R(P.lipH, 5, 17, 1, 1);
  R(P.skinS, 8, 19, 5, 1);
  // glasses in profile
  R(P.glass, 4, 10, 5, 1); R(P.glass, 4, 11, 1, 3); R(P.glass, 8, 11, 1, 3); R(P.glass, 5, 14, 3, 1);
  R(P.lens, 5, 11, 3, 3); R(P.liner, 5, 11, 3, 1); R(P.eye, 5, 12, 2, 2); R(P.white, 5, 12, 1, 1);
  R(P.glass, 9, 11, 6, 1);
  // cap, bangs, hair over the ear
  E(P.hair, 12, 6, 7.6, 5.4);
  R(P.hair, 4, 3, 13, 6); R(P.hair, 3, 5, 3, 4);
  R(P.hair, 4, 9, 3, 1); R(P.hair, 8, 9, 3, 1); R(P.hair, 12, 9, 2, 1);
  R(P.hair, 12, 9, 3, 12); R(P.hair, 12, 20, 2, 8);
  R(P.hairM, 8, 4, 1, 5); R(P.hairM, 12, 4, 1, 5); R(P.hairH, 6, 3, 3, 1); R(P.hairH2, 10, 4, 2, 1); R(P.hairL, 14, 12, 1, 8); R(P.hairH, 8, 1, 4, 1);
  g.restore();
}

function buildNinaSprites() {
  // exact art cut from the reference, stored as raw RGBA (40x76 device px = 20x38 logic px at HS=2)
  const D = NINA_DATA;
  const set = {
    frames: {}, w: D.w / HS, h: D.h / HS, ox: D.w / HS / 2, oy: D.h / HS - 1,
    // casting hand position (logic px inside the sprite)
    orb: { down: [15, 22], up: [5, 22], left: [6, 22], right: [14, 22] }
  };
  const dec = b64 => {
    const bin = atob(b64), u = new Uint8ClampedArray(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const [c, g] = mk(D.w, D.h);
    g.putImageData(new ImageData(u, D.w, D.h), 0, 0);
    c.pad = 0;
    return c;
  };
  for (const k of ['down', 'up', 'left', 'right']) set.frames[k] = D.frames[k].map(dec);
  return set;
}
