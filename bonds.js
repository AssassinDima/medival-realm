'use strict';
/* =====================================================================
   bonds.js - pet names + friendship, gift "jobs", feeding, fishing,
   the backpack (items / fish book / friends) and saving.
   Loaded after world.js, before game.js. Game globals (G, T, SPR, rect,
   text, ...) are only used at runtime, never at load.
   ===================================================================== */
const BOND_KEY = 'medieval_realm_bonds';
const LV = [0, 6, 16, 32, 56, 90];                 // friendship points needed for level 0..5
const NAMES = ['MOCHI', 'BEAN', 'PIP', 'NUTMEG', 'CLOVER', 'BISCUIT', 'POPPY', 'MAPLE', 'OLLIE', 'SUNNY', 'COCO', 'BUBBLES', 'WILLOW', 'TOFU', 'PEBBLE',
  'LUNA', 'MISO', 'HAZEL', 'JELLY', 'SPROUT', 'WAFFLE', 'ZIGGY', 'PUDDING', 'MARBLE', 'TWIG', 'BERRY', 'DUMPLING', 'FIZZ', 'ACORN', 'SNOWY', 'COMET', 'PEACH',
  'GINGER', 'SAGE', 'RIPPLE', 'EMBER', 'FABLE', 'ROSIE', 'MOSS', 'TANSY', 'PIXIE', 'NIMBUS', 'CUSTARD', 'BUTTON'];
const ITEMS = {
  bone: { n: 'BONE', food: 'meat' }, shell: { n: 'SHELL' }, gem: { n: 'CRYSTAL' }, feather: { n: 'FEATHER' }, wool: { n: 'WOOL' }, egg: { n: 'EGG' },
  acorn: { n: 'ACORN', food: 'plant' }, berry: { n: 'BERRIES', food: 'plant' }, truffle: { n: 'TRUFFLE', food: 'plant' }, clover: { n: 'CLOVER', food: 'plant' },
  honey: { n: 'HONEY', food: 'plant' }, stardust: { n: 'STARDUST' }, pinecone: { n: 'PINECONE', food: 'plant' }
};
const ITEM_ORDER = Object.keys(ITEMS);
// what each animal brings you once you are close friends (level 2+); dig = it digs for it
const JOBS = {
  dog: { it: 'bone', dig: 1 }, cat: { it: 'feather' }, bunny: { it: 'clover' }, duck: { it: 'egg' }, sheep: { it: 'wool' }, chick: { it: 'egg' }, squirrel: { it: 'acorn' },
  pig: { it: 'truffle', dig: 1 }, goose: { it: 'feather' }, fox: { it: 'berry' }, raccoon: { it: 'shell' }, goat: { it: 'clover' }, badger: { it: 'truffle', dig: 1 },
  seagull: { it: 'shell' }, otter: { it: 'f_minnow' }, pony: { it: 'clover' }, pheasant: { it: 'feather' }, blackcat: { it: 'feather' }, deer: { it: 'berry' }, owl: { it: 'feather' },
  redpanda: { it: 'berry' }, snowfox: { it: 'gem' }, lynx: { it: 'feather' }, swan: { it: 'feather' }, moose: { it: 'pinecone' }, penguin: { it: 'f_snowfin' },
  unicorn: { it: 'stardust' }, dragon: { it: 'gem' }, pegasus: { it: 'stardust' }, spiritstag: { it: 'stardust' }, griffin: { it: 'gem' }, jackalope: { it: 'clover' },
  phoenix: { it: 'stardust' }, frostdrake: { it: 'gem' }, thunderwolf: { it: 'gem' }, moonstag: { it: 'stardust' }, wolf: { it: 'bone', dig: 1 }, bear: { it: 'honey' },
  boar: { it: 'truffle', dig: 1 }, panther: { it: 'gem' }, polarbear: { it: 'f_sardine' }, kitsune: { it: 'stardust' }, ghostcat: { it: 'stardust' }, moonrabbit: { it: 'stardust' }
};
const RARE_GIFT = { common: 'clover', uncommon: 'berry', rare: 'shell', epic: 'gem', legendary: 'stardust', wild: 'gem', secret: 'stardust' };
const LOVES = {
  dog: ['meat'], wolf: ['meat', 'fish'], cat: ['fish'], blackcat: ['fish'], ghostcat: ['fish'], otter: ['fish'], penguin: ['fish'], seagull: ['fish'], fox: ['fish', 'plant'],
  snowfox: ['fish'], raccoon: ['fish', 'plant'], lynx: ['fish', 'meat'], bear: ['plant', 'fish'], polarbear: ['fish'], panther: ['fish', 'meat'], kitsune: ['fish'], owl: ['fish', 'meat'],
  thunderwolf: ['meat'], phoenix: ['plant'], dragon: ['meat', 'plant'], frostdrake: ['fish'], griffin: ['meat', 'fish'], boar: ['plant'], duck: ['plant', 'fish']
};

// ---------------------------------------------------------------- fish
// w: water types (pond = village pond, lake, frost = frozen pond, sea)
const FISH = [
  { id: 'minnow', n: 'MINNOW', r: 'common', w: ['pond', 'lake', 'frost', 'sea'], c: '#9ab8c8', l: '#d8ecf4', len: [4, 9] },
  { id: 'carp', n: 'CARP', r: 'common', w: ['pond', 'lake'], c: '#d89a4a', l: '#f4d8a0', len: [30, 60] },
  { id: 'sardine', n: 'SARDINE', r: 'common', w: ['sea'], c: '#7a9ab8', l: '#e0eaf4', len: [12, 20] },
  { id: 'snowfin', n: 'SNOWFIN', r: 'common', w: ['frost'], c: '#c8e0f0', l: '#ffffff', len: [8, 16] },
  { id: 'trout', n: 'TROUT', r: 'uncommon', w: ['lake', 'pond'], c: '#7aa868', l: '#e8e0b0', len: [25, 50], boost: ['rain'] },
  { id: 'bass', n: 'BIG BASS', r: 'uncommon', w: ['lake'], c: '#5a8a58', l: '#c8d8a0', len: [30, 55] },
  { id: 'mackerel', n: 'MACKEREL', r: 'uncommon', w: ['sea'], c: '#3a7a9a', l: '#c8e4f0', len: [25, 40] },
  { id: 'sunfish', n: 'SUNFISH', r: 'uncommon', w: ['pond', 'lake'], c: '#f4b43a', l: '#ffe49a', len: [10, 22], day: 1 },
  { id: 'icefish', n: 'ICEFISH', r: 'uncommon', w: ['frost'], c: '#8ad0e8', l: '#e8faff', len: [15, 30] },
  { id: 'moonkoi', n: 'MOON KOI', r: 'rare', w: ['pond', 'lake'], c: '#e8e4ff', l: '#ffffff', len: [40, 70], night: 1, spot: '#8a84d0' },
  { id: 'goldperch', n: 'GOLD PERCH', r: 'rare', w: ['lake'], c: '#f0b82a', l: '#fff0a0', len: [30, 45], day: 1 },
  { id: 'pike', n: 'ICE PIKE', r: 'rare', w: ['frost'], c: '#5ab0c8', l: '#d8f4ff', len: [50, 90] },
  { id: 'eel', n: 'CRYSTAL EEL', r: 'rare', w: ['sea', 'lake'], c: '#6a5ad0', l: '#c8c0ff', len: [60, 110], wx: ['storm', 'rain'] },
  { id: 'puffer', n: 'PUFFERFISH', r: 'rare', w: ['sea'], c: '#e8c86a', l: '#fff4c8', len: [15, 28] },
  { id: 'rainbowtrout', n: 'RAINBOW TROUT', r: 'epic', w: ['pond', 'lake', 'sea'], c: '#ff8ac8', l: '#8ad8ff', len: [35, 60], rainbow: 1, spot: '#ffe14a' },
  { id: 'auroracarp', n: 'AURORA CARP', r: 'epic', w: ['frost'], c: '#6affc8', l: '#c8a0ff', len: [40, 70], night: 1 },
  { id: 'starfish', n: 'STAR RAY', r: 'epic', w: ['sea'], c: '#ffd35a', l: '#fff6c0', len: [30, 50], night: 1 },
  { id: 'celestialkoi', n: 'CELESTIAL KOI', r: 'legendary', w: ['lake'], c: '#ffe27a', l: '#ffffff', len: [90, 140], night: 1, spot: '#ff7ad9' },
  { id: 'leviathan', n: 'LEVIATHAN PUP', r: 'legendary', w: ['sea'], c: '#2a5ab0', l: '#8ad8ff', len: [150, 220], wx: ['storm'] },
  { id: 'sturgeon', n: 'GLACIER STURGEON', r: 'legendary', w: ['frost'], c: '#a8c8e8', l: '#ffffff', len: [120, 180] }
];
const FISH_BY_ID = {}; FISH.forEach(f => { FISH_BY_ID[f.id] = f; });
const WATER_NAMES = { pond: 'VILLAGE POND', lake: 'CRYSTAL LAKE', frost: 'FROZEN POND', sea: 'THE SEA' };
const FISH_HINT = { pond: 'THE POND', lake: 'THE LAKE', frost: 'FROSTPEAK', sea: 'THE SEA' };

function mkFishSprite(f) {
  const [c, g] = mk(20, 11), d = dk(f.c, 0.55);
  aTri(g, d, 12, 5.5, 19, 0.5, 19, 10.5); aTri(g, f.c, 12.5, 5.5, 18, 1.5, 18, 9.5); aTri(g, f.l, 13, 5.5, 17.5, 4, 17.5, 7);
  ell(g, d, 8, 5.5, 8, 4.7); ell(g, f.c, 8, 5.5, 7.2, 4); ell(g, f.l, 7.5, 7.2, 5.6, 1.9);
  aTri(g, d, 5, 1.5, 11, 1.5, 9, 4.5); aTri(g, f.c, 6, 2, 10, 2, 9, 4);
  if (f.spot) for (const [x, y] of [[8, 4], [11, 5], [5, 5], [9, 7]]) apx(g, f.spot, x, y);
  apx(g, '#ffffff', 3, 4, 2, 2); apx(g, '#1a1424', 3, 5, 1, 1);
  return c;
}
function mkItemSprite(id) {
  const [c, g] = mk(12, 12);
  const o = '#1a1226';
  if (id === 'bone') { aLine(g, o, 2, 9, 9, 2); aLine(g, '#f4ecdc', 3, 8, 8, 3); for (const [x, y] of [[2, 3], [3, 2], [8, 10], [9, 9]]) ell(g, '#f4ecdc', x + 0.5, y + 0.5, 1.6, 1.6); }
  else if (id === 'shell') { ell(g, '#8a4a5a', 6, 7, 5.5, 4.5); ell(g, '#f4b8c4', 6, 7, 4.6, 3.8); for (const x of [3, 5, 7, 9]) aLine(g, '#d48a9a', 6, 10, x, 4); rect(g, '#fff0f0', 4, 5, 2, 1); }
  else if (id === 'gem') { aTri(g, '#2a5a8a', 6, 1, 1, 5, 11, 5); aTri(g, '#2a5a8a', 1, 5, 11, 5, 6, 11); aTri(g, '#6ac8f4', 6, 2, 2, 5, 10, 5); aTri(g, '#a8e8ff', 2, 5, 10, 5, 6, 10); aTri(g, '#ffffff', 6, 2, 4, 5, 6, 5); }
  else if (id === 'feather') { aLine(g, '#6a4a8a', 2, 10, 10, 2); for (let i = 0; i < 6; i++) { apx(g, '#b89ae8', 3 + i, 9 - i - 1, 2, 1); apx(g, '#d8c8ff', 4 + i, 9 - i, 1, 1); } }
  else if (id === 'wool') { for (const [x, y, r] of [[4, 6, 3], [8, 6, 3], [6, 4, 3], [6, 8, 3]]) ell(g, '#c8c4d0', x, y, r + 0.5, r + 0.5); for (const [x, y, r] of [[4, 6, 3], [8, 6, 3], [6, 4, 3], [6, 8, 3]]) ell(g, '#ffffff', x - 0.3, y - 0.3, r - 0.5, r - 0.5); }
  else if (id === 'egg') { ell(g, '#a89a7a', 6, 6.5, 4, 5); ell(g, '#fff4dc', 6, 6.5, 3.4, 4.4); apx(g, '#d8c8a0', 5, 8); apx(g, '#d8c8a0', 7, 5); apx(g, '#ffffff', 5, 4); }
  else if (id === 'acorn') { ell(g, '#6a4a24', 6, 7.5, 3.8, 4); ell(g, '#c8955a', 6, 7.5, 3, 3.4); ell(g, '#5a3a1c', 6, 4, 4.5, 2.4); ell(g, '#8a5a30', 6, 3.8, 3.8, 1.8); rect(g, '#5a3a1c', 6, 1, 1, 2); }
  else if (id === 'berry') { for (const [x, y] of [[4, 8], [8, 8], [6, 5]]) { ell(g, '#5a1a2a', x, y, 2.6, 2.6); ell(g, '#d9433f', x, y, 2, 2); apx(g, '#ffd0d0', x - 1, y - 1); } rect(g, '#3f8a3a', 6, 2, 1, 2); rect(g, '#5dbb4a', 7, 2, 2, 1); }
  else if (id === 'truffle') { ell(g, '#2a1a14', 6, 7, 5, 4); ell(g, '#5a3a2a', 6, 6.5, 4.2, 3.4); for (const [x, y] of [[4, 6], [7, 5], [6, 8], [8, 7]]) apx(g, '#7a5a42', x, y); }
  else if (id === 'clover') { for (const [x, y] of [[4, 4], [8, 4], [4, 8], [8, 8]]) { ell(g, '#2a6a30', x, y, 2.8, 2.8); ell(g, '#5dc04a', x, y, 2.2, 2.2); } rect(g, '#2a6a30', 6, 8, 1, 4); apx(g, '#b8f0a0', 3, 3); }
  else if (id === 'honey') { rect(g, '#6a4a14', 3, 3, 6, 8); rect(g, '#e8a820', 4, 5, 4, 5); rect(g, '#ffd86a', 4, 5, 2, 4); rect(g, '#8a5a24', 3, 1, 6, 3); rect(g, '#b8803a', 4, 1, 4, 1); }
  else if (id === 'stardust') { aTri(g, '#c8a0ff', 6, 0, 4, 6, 8, 6); aTri(g, '#c8a0ff', 6, 12, 4, 6, 8, 6); aTri(g, '#c8a0ff', 0, 6, 6, 4, 6, 8); aTri(g, '#c8a0ff', 12, 6, 6, 4, 6, 8); ell(g, '#fff6c0', 6, 6, 2, 2); apx(g, '#ffffff', 6, 6); apx(g, '#ff7ad9', 10, 2); apx(g, '#7affff', 1, 10); }
  else if (id === 'pinecone') { ell(g, '#4a2e16', 6, 7, 3.6, 5); for (let y = 3; y < 11; y += 2) for (let x = 3 + (y % 4 ? 0 : 1); x < 9; x += 2) { rect(g, '#8a6030', x, y, 2, 2); rect(g, '#b88848', x, y, 2, 1); } }
  return c;
}

// ================================================================ BONDS (friendship, jobs, feeding, fishing)
const Bonds = {
  init() {
    SPR.items = {}; for (const id of ITEM_ORDER) SPR.items[id] = mkItemSprite(id);
    SPR.fish = {}; for (const f of FISH) SPR.fish[f.id] = mkFishSprite(f);
  },
  // ---- save / load
  load() {
    G.bonds = {}; G.bag = {}; G.fishBook = {}; G.loot = []; G.pops = []; G.fs = { st: 'idle', t: 0 }; G.bagUI = null; G.catchPop = null; G.saveB = 0;
    try {
      const d = JSON.parse(localStorage.getItem(BOND_KEY) || 'null');
      if (d) { G.bonds = d.b || {}; G.bag = d.bag || {}; G.fishBook = d.fb || {}; }
    } catch (e) { /* ignore */ }
  },
  save() { try { localStorage.setItem(BOND_KEY, JSON.stringify({ b: G.bonds, bag: G.bag, fb: G.fishBook })); } catch (e) { /* ignore */ } },
  newName() {
    const used = new Set(Object.values(G.bonds).map(b => b.name)), free = NAMES.filter(n => !used.has(n));
    const pool = free.length ? free : NAMES; return pool[Math.floor(Math.random() * pool.length)];
  },
  bond(id) {
    let b = G.bonds[id];
    if (!b) b = G.bonds[id] = { name: this.newName(), pts: 0, d: 0, pet: 0, fed: 0 };
    if (b.d !== G.day) { b.d = G.day; b.pet = 0; b.fed = 0; }
    return b;
  },
  level(b) { let l = 0; for (let i = 0; i < LV.length; i++) if (b.pts >= LV[i]) l = i; return l; },
  addPts(a, n) {
    const b = this.bond(a.s.id), before = this.level(b);
    b.pts += n; const after = this.level(b);
    if (after > before) {
      const col = a.s.r === 'secret' ? '#ff7ad9' : RARITY[a.s.r].col;
      Animals.toast(b.name + ' TRUSTS YOU MORE!', 'FRIENDSHIP LEVEL ' + after + ' / 5', col);
      if (after === 2) setTimeout(() => { if (G && G.bonds) Animals.toast(b.name + ' WILL BRING YOU GIFTS!', 'KEEP ' + b.name + ' CLOSE', '#ffd35a'); }, 1600);
      emit(a.x, a.y - 10, 20, { sp: 50, life: 0.8, c: ['#ff9ac0', '#ffffff', '#ffd35a'] });
      this.save();
    }
  },
  pet(a) { const b = this.bond(a.s.id); if (b.pet < 6) { b.pet++; this.addPts(a, 1); } },
  onTame(a) {
    const b = this.bond(a.s.id); a.jobT = 35 + Math.random() * 30;
    this.pop(a.x, a.y - 24, 'MEET ' + b.name + '!', '#ffffff');
    this.save();
  },
  pop(x, y, txt, col = '#ffffff') { G.pops.push({ x, y, txt, col, t: 1.6 }); },
  add(id, n = 1) { G.bag[id] = (G.bag[id] || 0) + n; this.saveSoon(); },
  saveSoon() { G.saveB = 2.5; },
  itemName(id) { return id.startsWith('f_') ? FISH_BY_ID[id.slice(2)].n : ITEMS[id].n; },
  itemIcon(id) { return id.startsWith('f_') ? SPR.fish[id.slice(2)] : SPR.items[id]; },
  foodType(id) { return id.startsWith('f_') ? 'fish' : (ITEMS[id] && ITEMS[id].food) || null; },

  // ---- frame update (outdoors)
  update(dt) {
    const p = G.p;
    if (G.saveB > 0) { G.saveB -= dt; if (G.saveB <= 0) this.save(); }
    for (const q of G.pops) { q.t -= dt; q.y -= 10 * dt; } G.pops = G.pops.filter(q => q.t > 0);

    // gift jobs
    G.pets.forEach(a => {
      const b = this.bond(a.s.id), lv = this.level(b), job = JOBS[a.s.id] || { it: RARE_GIFT[a.s.r] };
      if (a.digT > 0) {
        a.digT -= dt; a.moving = false;
        if (job.dig && Math.random() < dt * 14) emit(a.x + (a.dir === 'left' ? -4 : 4), a.y - 1, 1, { sp: 20, life: 0.4, vy: -25, g: 90, c: ['#7b5234', '#a57a48', '#5a3a22'] });
        else if (!job.dig && Math.random() < dt * 10) emit(a.x, a.y - 8, 1, { sp: 10, life: 0.5, vy: -14, c: ['#ffd35a', '#ffffff'] });
        if (a.digT <= 0) this.dropGift(a, lv);
        return;
      }
      if (lv < 2) return;
      a.jobT = (a.jobT === undefined ? 40 : a.jobT) - dt;
      if (a.jobT <= 0 && Math.hypot(a.x - p.x, a.y - p.y) < 8 * T && !a.moving) { a.digT = job.dig ? 1.3 : 0.7; a.jobT = Math.max(35, 100 - lv * 13) + Math.random() * 25; }
    });
    // loot pickup
    for (const l of G.loot) {
      l.t += dt;
      if (l.t > 0.35 && Math.hypot(l.x - p.x, (l.y - 4) - p.y) < 13) {
        l.done = true; this.add(l.item); sfx.pop();
        this.pop(l.x, l.y - 14, '+1 ' + this.itemName(l.item), '#ffe27a');
        emit(l.x, l.y - 6, 8, { sp: 30, life: 0.4, c: ['#ffe27a', '#ffffff'] });
      }
    }
    G.loot = G.loot.filter(l => !l.done);

    // feed
    this.feedT = (this.feedT || 0) - dt;
    this.nearPet = null; let best = 30;
    for (const a of G.pets) { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < best) { best = d; this.nearPet = a; } }
    if (hit('KeyG') && this.nearPet && !Npcs.near) this.feed(this.nearPet);

    this.fishUpdate(dt);
  },
  dropGift(a, lv) {
    const job = JOBS[a.s.id] || { it: RARE_GIFT[a.s.r] };
    let it = job.it;
    if (Math.random() < 0.08 + lv * 0.04) it = RARE_GIFT[a.s.r === 'common' ? 'rare' : a.s.r];
    G.loot.push({ x: a.x + (a.dir === 'left' ? -9 : 9), y: a.y + 2, item: it, t: 0 });
    emit(a.x, a.y - 8, 10, { sp: 30, life: 0.5, c: ['#ffe27a', '#ffffff'] });
    this.pop(a.x, a.y - 22, this.bond(a.s.id).name + ' FOUND SOMETHING!', '#ffd0f0'); sfx.toast();
  },
  feed(a) {
    const b = this.bond(a.s.id), loves = LOVES[a.s.id] || ['plant'];
    if (b.fed >= 3) { this.pop(a.x, a.y - 24, b.name + ' IS FULL!', '#ffd0f0'); return; }
    let pick = null, score = -1;
    for (const id in G.bag) {
      if (G.bag[id] <= 0) continue;
      const ft = this.foodType(id); if (!ft) continue;
      const s = loves.includes(ft) ? 2 : 1;
      if (s > score) { score = s; pick = id; }
    }
    if (!pick) { this.pop(a.x, a.y - 24, 'NO FOOD IN BAG', '#ff9a9a'); sfx.no(); return; }
    G.bag[pick]--; if (!G.bag[pick]) delete G.bag[pick];
    b.fed++;
    this.addPts(a, score === 2 ? 8 : 3);
    this.pop(a.x, a.y - 24, score === 2 ? 'YUM! ' + b.name + ' LOVES IT!' : b.name + ' ATE IT', '#ff9ac0');
    for (let i = 0; i < 4; i++) Animals.heart1(a.x, a.y - Animals.spr[a.s.id].h - 2 - i * 2);
    sfx.ok(); this.saveSoon();
  },

  // ---- fishing
  waterKind(tx, ty) {
    if (ty >= 63 && tx >= 44) return 'sea';
    const reg = G.w.region[ty * MW + tx];
    return reg === 3 ? 'frost' : reg === 5 ? 'lake' : 'pond';
  },
  isOpenWater(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return false;
    const i = ty * MW + tx;
    if (G.w.ground[i] !== 2) return false;
    const ic = G.ice.get(i); return !(ic && ic.delay <= 0);
  },
  findCast() {
    const p = G.p, v = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[p.dir];
    if (this.isOpenWater(Math.floor(p.x / T), Math.floor((p.y - 2) / T))) return null;
    for (let d = 10; d <= 84; d += 6) {
      const x = p.x + v[0] * d, y = p.y - 2 + v[1] * d, tx = Math.floor(x / T), ty = Math.floor(y / T);
      if (this.isOpenWater(tx, ty)) return { x, y, tx, ty };
      if (tx < 0 || ty < 0 || tx >= MW || ty >= MH || G.w.solid[ty * MW + tx]) return null;
    }
    return null;
  },
  pickFish(kind) {
    const wx = G.wx.type, night = Animals.isNight(), rb = G.rainbow > 0, byR = {};
    for (const f of FISH) {
      if (!f.w.includes(kind)) continue;
      if (f.night && !night) continue;
      if (f.day && night) continue;
      if (f.wx && !f.wx.includes(wx)) continue;
      if (f.rainbow && !rb) continue;
      (byR[f.r] = byR[f.r] || []).push([f, f.boost && f.boost.includes(wx) ? 3 : 1]);
    }
    const rars = Object.keys(byR); if (!rars.length) return FISH[0];
    let tot = 0; for (const r of rars) tot += RARITY[r].w;
    let x = Math.random() * tot, rar = rars[0];
    for (const r of rars) { x -= RARITY[r].w; if (x <= 0) { rar = r; break; } }
    const pool = byR[rar]; let y = Math.random() * pool.reduce((q, e) => q + e[1], 0);
    for (const [f, w] of pool) { y -= w; if (y <= 0) return f; }
    return pool[0][0];
  },
  fishCancel(msg) { G.fs = { st: 'idle', t: 0 }; if (msg) this.pop(G.p.x, G.p.y - 40, msg, '#c8d8ff'); },
  fishLock() { return G.fs && G.fs.st !== 'idle'; },
  fishUpdate(dt) {
    const f = G.fs, p = G.p;
    if (f.st === 'idle') {
      this.cast = p.moving ? null : this.findCast();
      if (hit('KeyR') && this.cast) {
        G.fs = { st: 'cast', t: 0, bx: this.cast.x, by: this.cast.y, tx: this.cast.tx, ty: this.cast.ty, kind: this.waterKind(this.cast.tx, this.cast.ty) };
        beep(500, 0.15, 'triangle', 0.04, 400);
      }
      return;
    }
    f.t += dt;
    const mv = down('KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
    if (f.st === 'cast') {
      if (mv) return this.fishCancel();
      if (f.t >= 0.5) {
        f.st = 'wait'; f.t = 0;
        f.wait = (1.8 + Math.random() * 3.8) * (1 - 0.35 * wxWet());
        emit(f.bx, f.by, 6, { sp: 18, life: 0.4, c: ['#ffffff', '#bfe0ff'] }); beep(260, 0.12, 'sine', 0.04, -100);
      }
    } else if (f.st === 'wait') {
      if (mv) return this.fishCancel();
      if (hit('KeyR')) return this.fishCancel('NOTHING YET...');
      if (f.t >= f.wait) {
        f.st = 'bite'; f.t = 0; f.fish = this.pickFish(f.kind);
        emit(f.bx, f.by, 10, { sp: 30, life: 0.4, vy: -20, g: 80, c: ['#ffffff', '#8ac8ff'] }); beep(880, 0.12, 'square', 0.04); setTimeout(() => beep(880, 0.12, 'square', 0.04), 140);
      }
    } else if (f.st === 'bite') {
      if (hit('KeyR')) {
        const R = { common: 0.4, uncommon: 0.34, rare: 0.27, epic: 0.21, legendary: 0.16 }[f.fish.r] || 0.3;
        const sp = { common: 0.9, uncommon: 1.1, rare: 1.35, epic: 1.6, legendary: 1.9 }[f.fish.r] || 1;
        f.st = 'reel'; f.t = 0; f.m = 0; f.dm = 1; f.sp = sp; f.lives = 3; f.zone = [0.15 + Math.random() * (0.7 - R), 0]; f.zone[1] = f.zone[0] + R; f.note = '';
        sfx.pop();
      } else if (f.t > 1.1) { this.fishCancel('TOO SLOW... IT GOT AWAY'); }
    } else if (f.st === 'reel') {
      f.m += f.dm * f.sp * dt; if (f.m > 1) { f.m = 1; f.dm = -1; } if (f.m < 0) { f.m = 0; f.dm = 1; }
      if (hit('KeyR')) {
        if (f.m >= f.zone[0] && f.m <= f.zone[1]) this.catchFish(f);
        else { f.lives--; f.note = 'SO CLOSE!'; sfx.no(); if (f.lives <= 0) this.fishCancel('IT GOT AWAY...'); }
      } else if (f.t > 12) this.fishCancel('IT GOT AWAY...');
    } else if (f.st === 'pop') {
      if (f.t > 1 && (hit('KeyR', 'Space', 'Enter')) || f.t > 4.5) { G.fs = { st: 'idle', t: 0 }; G.catchPop = null; }
    }
  },
  catchFish(f) {
    const fish = f.fish, len = Math.round(fish.len[0] + Math.random() * (fish.len[1] - fish.len[0]));
    const bk = G.fishBook[fish.id], isNew = !bk;
    G.fishBook[fish.id] = { n: (bk ? bk.n : 0) + 1, max: Math.max(bk ? bk.max : 0, len) };
    this.add('f_' + fish.id);
    G.fs = { st: 'pop', t: 0 }; G.catchPop = { fish, len, isNew };
    emit(G.p.x, G.p.y - 16, 22, { sp: 60, life: 0.8, c: ['#ffffff', '#8ad8ff', '#ffe27a'] });
    sfx.tame(RARITY_ORDER.indexOf(fish.r)); this.save();
  },

  // ---- drawing (world space)
  drawWorld(cx, cy) {
    const p = G.p, f = G.fs;
    for (const l of G.loot) {
      const bob = Math.round(Math.sin(G.t * 4 + l.x) * 1.5), x = Math.round(l.x) - cx, y = Math.round(l.y) - cy;
      ell(ctx, 'rgba(0,0,0,0.25)', x, y, 4, 1.5);
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(x, y - 8, 1, x, y - 8, 12); gr.addColorStop(0, 'rgba(255,230,140,0.4)'); gr.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 12, y - 20, 24, 24); ctx.globalCompositeOperation = 'source-over';
      const ic = this.itemIcon(l.item), sc = l.item.startsWith('f_') ? 0.7 : 1;
      ctx.drawImage(ic, Math.round(x - ic.width * sc / 2), Math.round(y - 14 - bob), ic.width * sc, ic.height * sc);
    }
    // names + hearts above nearby pets
    for (const a of G.pets) {
      const d = Math.hypot(a.x - p.x, a.y - p.y); if (d > 5 * T) continue;
      const sp = Animals.spr[a.s.id], b = this.bond(a.s.id), lv = this.level(b), x = Math.round(a.x) - cx, y = Math.round(a.y - sp.h) - cy - 6;
      const col = a.s.r === 'secret' ? SECRET_CYCLE[Math.floor(G.t * 4) % 6] : RARITY[a.s.r].col;
      textC(ctx, b.name, x, y - 7, col, 1, '#1d1030');
      for (let i = 0; i < 5; i++) { ctx.globalAlpha = i < lv ? 1 : 0.28; ctx.drawImage(Animals.heart, x - 17 + i * 7, y + 1, 5, 4.3); }
      ctx.globalAlpha = 1;
      if (a.digT > 0) textC(ctx, '...', x, y - 15, '#ffffff', 1, '#1d1030');
    }
    // fishing line
    if (f.st !== 'idle' && f.st !== 'pop') {
      const v = { left: -1, right: 1, up: 0, down: 0 }[p.dir], hx = Math.round(p.x + v * 8) - cx, hy = Math.round(p.y - 24 * NS) - cy;
      let bx = f.bx - cx, by = f.by - cy;
      if (f.st === 'cast') { const k = clamp(f.t / 0.5, 0, 1); bx = hx + (bx - hx) * k; by = hy + (by - hy) * k - Math.sin(k * Math.PI) * 18; }
      const bob = f.st === 'bite' ? Math.round(Math.sin(G.t * 30) * 2) : Math.round(Math.sin(G.t * 3) * 0.7);
      by += bob;
      for (let i = 0; i <= 14; i++) { const t = i / 14, x = hx + (bx - hx) * t, y = hy + (by - hy) * t + Math.sin(t * Math.PI) * 5; rect(ctx, 'rgba(235,235,245,0.9)', Math.round(x), Math.round(y), 1, 1); }
      if (f.st === 'wait' || f.st === 'bite' || f.st === 'reel') {
        const k = (G.t * 0.8) % 1;
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(bx, by + 2, 3 + k * 7, 1.5 + k * 3, 0, 0, TAU); ctx.stroke();
      }
      ell(ctx, '#ffffff', bx, by, 2, 2); ell(ctx, '#e8433f', bx, by - 1, 2, 1.2);
      if (f.st === 'bite') { textC(ctx, '!', Math.round(p.x) - cx, Math.round(p.y - 46 * NS) - cy, '#ff5a5a', 2, '#ffffff'); }
    }
  },

  // ---- HUD prompts, minigame, catch card
  drawHUD() {
    const f = G.fs, by = H - 34;
    if (!G.inside && f.st === 'idle' && this.cast && !G.p.moving && !G.dex && !G.map) textC(ctx, 'R: CAST FISHING LINE', W / 2, by - 12, '#bfe8ff', 1, '#1d1030');
    if (!G.inside && this.nearPet && f.st === 'idle') {
      const b = this.bond(this.nearPet.s.id);
      textC(ctx, 'G: FEED ' + b.name, W / 2, by - (this.cast ? 22 : 12), '#ffd0f0', 1, '#1d1030');
    }
    if (f.st === 'wait') textC(ctx, 'WAITING FOR A BITE...  (MOVE TO STOP)', W / 2, by - 12, '#bfe8ff', 1, '#1d1030');
    if (f.st === 'bite') textC(ctx, 'PRESS R NOW!', W / 2, by - 12, '#ff9a9a', 1, '#1d1030');
    if (f.st === 'reel') {
      const x = Math.round(W / 2 - 62), y = by - 20;
      rect(ctx, 'rgba(24,12,44,0.9)', x - 6, y - 14, 136, 34); box(ctx, x - 6, y - 14, 136, 34, '#6cc4ff');
      text(ctx, 'HIT THE GREEN: R', x, y - 10, '#ffffff');
      rect(ctx, '#0d0820', x, y + 2, 124, 11); rect(ctx, '#3b2a5a', x + 1, y + 3, 122, 9);
      rect(ctx, '#5fd078', x + 1 + Math.round(f.zone[0] * 122), y + 3, Math.round((f.zone[1] - f.zone[0]) * 122), 9);
      rect(ctx, '#a8f0b8', x + 1 + Math.round(f.zone[0] * 122), y + 3, Math.round((f.zone[1] - f.zone[0]) * 122), 2);
      rect(ctx, '#ffffff', x + Math.round(f.m * 120), y, 3, 15);
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < f.lives ? 1 : 0.25; ctx.drawImage(Animals.heart, x + 100 + i * 8, y - 11, 6, 5.1); } ctx.globalAlpha = 1;
      if (f.note) text(ctx, f.note, x + 74, y - 10, '#ffe27a');
    }
    if (f.st === 'pop' && G.catchPop) {
      const c = G.catchPop, fi = c.fish, col = RARITY[fi.r].col, x = Math.round(W / 2 - 80), y = 46;
      rect(ctx, 'rgba(24,12,44,0.95)', x, y, 160, 74); box(ctx, x, y, 160, 74, col);
      textC(ctx, c.isNew ? 'NEW FISH!' : 'YOU CAUGHT', W / 2, y + 6, c.isNew ? '#ffe27a' : '#ffffff', 1);
      const ic = SPR.fish[fi.id], sc = 3; ctx.drawImage(ic, Math.round(W / 2 - ic.width * sc / 2), y + 17 + Math.round(Math.sin(G.t * 5)), ic.width * sc, ic.height * sc);
      textC(ctx, fi.n, W / 2, y + 52, col, 1, '#1d1030');
      textC(ctx, RARITY[fi.r].name + '   ' + c.len + ' CM', W / 2, y + 62, '#b9a6d8');
    }
    for (const q of G.pops) {
      const sx = Math.round(q.x - G.cam.x), sy = Math.round(q.y - G.cam.y);
      ctx.globalAlpha = clamp(q.t / 0.5, 0, 1); textC(ctx, q.txt, sx, sy, q.col, 1, '#1d1030'); ctx.globalAlpha = 1;
    }
  },
};

// ---------------------------------------------------------------- backpack UI
Bonds.entries = function (tab) {
  if (tab === 0) { const e = ITEM_ORDER.slice(); for (const f of FISH) if (G.bag['f_' + f.id] > 0) e.push('f_' + f.id); return e; }
  if (tab === 1) return FISH.map(f => f.id);
  return SPECIES.filter(s => G.col[s.id]).map(s => s.id);
};
Bonds.openUI = function () { G.bagUI = { tab: 0, sel: 0, rename: null }; sfx.move(); };
Bonds.updateUI = function (dt) {
  const u = G.bagUI;
  if (u.rename !== null) {
    for (const k of pressed) {
      if (/^Key[A-Z]$/.test(k) && u.rename.length < 9) u.rename += k[3];
      else if (k === 'Backspace') u.rename = u.rename.slice(0, -1);
      else if (k === 'Enter') {
        if (u.rename.length) { const id = this.entries(2)[u.sel]; G.bonds[id].name = u.rename; this.save(); sfx.ok(); }
        u.rename = null;
      } else if (k === 'Escape') u.rename = null;
    }
    return;
  }
  if (hit('KeyI', 'Escape')) { G.bagUI = null; this.save(); sfx.move(); return; }
  if (hit('KeyQ')) { u.tab = (u.tab + 2) % 3; u.sel = 0; sfx.move(); }
  if (hit('KeyE')) { u.tab = (u.tab + 1) % 3; u.sel = 0; sfx.move(); }
  const n = this.entries(u.tab).length; let i = u.sel;
  if (u.tab === 2) {
    if (hit('ArrowUp', 'KeyW')) i--; if (hit('ArrowDown', 'KeyS')) i++;
    if (hit('Enter') && n) { u.rename = ''; return; }
  } else {
    if (hit('ArrowLeft', 'KeyA')) i--; if (hit('ArrowRight', 'KeyD')) i++;
    if (hit('ArrowUp', 'KeyW')) i -= 5; if (hit('ArrowDown', 'KeyS')) i += 5;
  }
  i = clamp(i, 0, Math.max(0, n - 1)); if (i !== u.sel) { u.sel = i; sfx.move(); }
};
Bonds.fishInfo = function (f) {
  const where = f.w.map(w => FISH_HINT[w]).join(', '), when = f.night ? 'NIGHT ONLY' : f.day ? 'DAYTIME ONLY' : f.rainbow ? 'UNDER A RAINBOW' : f.wx ? (f.wx.includes('storm') && f.wx.length === 1 ? 'DURING STORMS' : 'WHEN IT RAINS') : 'ANY TIME';
  return where + '  -  ' + when;
};
Bonds.drawUI = function () {
  const u = G.bagUI, tabs = ['ITEMS', 'FISH', 'FRIENDS'];
  rect(ctx, 'rgba(12,6,28,0.95)', 0, 0, W, H); box(ctx, 6, 6, W - 12, H - 12, '#f0c94d');
  text(ctx, 'BACKPACK', 14, 12, '#f6d365', 2, '#5a2a10');
  tabs.forEach((t, i) => {
    const x = 124 + i * 62, on = i === u.tab;
    rect(ctx, on ? '#5a4a8a' : '#241540', x, 10, 58, 13); box(ctx, x, 10, 58, 13, on ? '#f0c94d' : '#3f3060');
    textC(ctx, t, x + 29, 14, on ? '#ffffff' : '#8a7ab0');
  });
  const list = this.entries(u.tab), sel = list[u.sel];
  let l1 = '', l2 = '', lc = '#ffffff', bestTxt = '';
  if (u.tab < 2) {
    const pg = Math.floor(u.sel / 15), pages = Math.max(1, Math.ceil(list.length / 15));
    G.bagUI.pageTxt = pages > 1 ? 'PAGE ' + (pg + 1) + '/' + pages + '   ' : '';
    list.forEach((id, i) => {
      if (Math.floor(i / 15) !== pg) return;
      const j = i % 15, x = 12 + (j % 5) * 72, y = 30 + ((j / 5) | 0) * 46, on = i === u.sel;
      let have = 0, got = true, icon, name, rc = '#5a4a8a';
      if (u.tab === 0) { have = G.bag[id] || 0; icon = this.itemIcon(id); name = this.itemName(id); got = have > 0; rc = id.startsWith('f_') ? RARITY[FISH_BY_ID[id.slice(2)].r].col : '#8a7ab0'; }
      else { const fb = G.fishBook[id], fi = FISH_BY_ID[id]; got = !!fb; have = G.bag['f_' + id] || 0; icon = SPR.fish[id]; name = got ? fi.n : '???'; rc = RARITY[fi.r].col; }
      rect(ctx, '#241540', x, y, 68, 44); box(ctx, x, y, 68, 44, on ? (Math.sin(G.t * 8) > 0 ? '#fff2a8' : '#f0c94d') : (got ? rc : '#3f3060'));
      const sc = icon.width > 14 ? 2 : 2, w = icon.width * sc, h = icon.height * sc;
      if (u.tab === 1 && !got) { ctx.globalAlpha = 0.9; ctx.drawImage(icon, Math.round(x + 34 - w / 2), y + 24 - h, w, h); ctx.globalCompositeOperation = 'source-atop'; rect(ctx, '#2b1d44', x, y, 68, 44); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
      else { ctx.globalAlpha = got ? 1 : 0.3; ctx.drawImage(icon, Math.round(x + 34 - w / 2), y + 24 - h, w, h); ctx.globalAlpha = 1; }
      textC(ctx, name, x + 34, y + 33, got ? '#ffffff' : '#6a5a90');
      if (have > 0) textR(ctx, 'X' + have, x + 65, y + 3, '#ffffff');
    });
    if (sel) {
      if (u.tab === 0) {
        const have = G.bag[sel] || 0, ft = this.foodType(sel);
        l1 = this.itemName(sel); l2 = have ? (ft ? 'FOOD: PRESS G NEAR A FRIEND TO FEED THEM.' : 'A NICE KEEPSAKE. YOU HAVE ' + have + '.') : 'NOT FOUND YET. YOUR FRIENDS BRING GIFTS!';
        if (!have) l1 = '???';
      } else {
        const fi = FISH_BY_ID[sel], fb = G.fishBook[sel];
        l1 = fb ? fi.n : '???'; lc = RARITY[fi.r].col;
        l2 = fb ? this.fishInfo(fi) : 'CAST A LINE AND SEE WHAT BITES.'; if (fb) bestTxt = 'BEST ' + fb.max + ' CM';
      }
    }
  } else {
    if (!list.length) textC(ctx, 'TAME AN ANIMAL TO MAKE A FRIEND!', W / 2, 90, '#9a88c0');
    const off = Math.max(0, Math.min(u.sel - 9, list.length - 10));
    list.forEach((id, i) => {
      if (i < off || i >= off + 10) return;
      const s = SPECIES_BY_ID[id], b = G.bonds[id] || this.bond(id), lv = this.level(b), y = 30 + (i - off) * 14, on = i === u.sel, sp = Animals.spr[id];
      rect(ctx, on ? '#3a2a60' : '#241540', 12, y, W - 24, 13); box(ctx, 12, y, W - 24, 13, on ? '#f0c94d' : '#3f3060');
      const sc = Math.min(1, 11 / sp.h, 22 / sp.w);
      ctx.drawImage(sp.frames.right[0], 16, Math.round(y + 12 - sp.h * sc), sp.w * sc, sp.h * sc);
      const col = s.r === 'secret' ? SECRET_CYCLE[Math.floor(G.t * 4) % 6] : RARITY[s.r].col;
      text(ctx, b.name, 44, y + 3, '#ffffff'); text(ctx, s.name.toUpperCase(), 100, y + 3, col);
      for (let k = 0; k < 5; k++) { ctx.globalAlpha = k < lv ? 1 : 0.25; ctx.drawImage(Animals.heart, 200 + k * 9, y + 4, 6, 5.1); } ctx.globalAlpha = 1;
      const job = JOBS[id] || { it: RARE_GIFT[s.r] };
      text(ctx, lv >= 2 ? 'GIFT: ' + this.itemName(job.it) : 'LEVEL ' + lv, 256, y + 3, lv >= 2 ? '#ffe27a' : '#8a7ab0');
    });
    if (sel) {
      const b = G.bonds[sel] || this.bond(sel), lv = this.level(b), nx = LV[lv + 1];
      l1 = b.name + ' THE ' + SPECIES_BY_ID[sel].name.toUpperCase();
      l2 = lv >= 5 ? 'BEST FRIENDS FOREVER!  ENTER: CHANGE NAME' : (lv < 2 ? 'REACH LEVEL 2 TO GET GIFTS.  ' : '') + (nx - b.pts) + ' MORE TO LEVEL ' + (lv + 1) + '.  ENTER: CHANGE NAME';
    }
  }
  rect(ctx, '#241540', 12, 169, W - 24, 28); box(ctx, 12, 169, W - 24, 28, '#5a4a8a');
  text(ctx, l1, 18, 173, lc); text(ctx, l2, 18, 184, '#d9c2ff'); if (bestTxt) textR(ctx, bestTxt, W - 18, 173, '#ffe27a');
  textC(ctx, (u.pageTxt || '') + (u.tab === 2 ? 'UP / DOWN: BROWSE' : 'ARROWS: BROWSE') + '   Q / E: TAB   I: CLOSE', W / 2, 200, '#7a6aa0');
  if (u.tab === 1) if (!bestTxt) textR(ctx, 'CAUGHT ' + Object.keys(G.fishBook).length + '/' + FISH.length, W - 18, 173, '#ffffff');
  if (u.rename !== null) {
    rect(ctx, 'rgba(0,0,0,0.6)', 0, 0, W, H); rect(ctx, '#241540', 92, 78, 200, 50); box(ctx, 92, 78, 200, 50, '#f0c94d');
    textC(ctx, 'NEW NAME FOR ' + (G.bonds[this.entries(2)[u.sel]] || {}).name, W / 2, 86, '#ffffff');
    rect(ctx, '#0d0820', 132, 100, 120, 14); textC(ctx, u.rename + (Math.floor(G.t * 2) % 2 ? '_' : ' '), W / 2, 104, '#f6d365');
    textC(ctx, 'TYPE LETTERS   ENTER: OK   ESC: CANCEL', W / 2, 118, '#7a6aa0');
  }
};
