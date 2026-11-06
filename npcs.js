'use strict';
/* =====================================================================
   npcs.js - the people of Lanternfall: schedules, walking, dialogue with
   choices, trust, gifts, hidden places + memory scenes, and the People book.
   Data lives in lore.js, pictures in npcart.js / portraits.js.
   ===================================================================== */
const STORY_KEY = 'medieval_realm_story';
const WHERE_TXT = {
  brennan: "THE LION'S WATCH BY DAY, THE LAMPS AT DUSK", seraphina: "DAWN'S CHAPEL, SOUTH OF THE MAIN ROAD", elyra: 'THE MOON WELL ON THE NORTH ROAD',
  kai: 'UNDER THE LAMPLIGHT, AFTER DARK', finn: 'THE POND BY MORNING, THE GOLDEN TAVERN AFTER', thorin: 'THE FORGE BY DAY, THE TAVERN AT NIGHT', raika: 'THE WOLFCLAN CAMP IN FROSTPEAK'
};
const HEART_ROWS = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const GIFT_D = { love: 6, like: 3, meh: 1, dislike: -2, hate: -8 };

const Npcs = {
  ents: [], near: null, nearEnt: null, claimE: false, portCache: {}, mark: 0,

  // ------------------------------------------------------------ state
  load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(STORY_KEY) || 'null'); } catch (e) { s = null; }
    G.story = Object.assign({ trust: {}, seen: {}, flags: {}, talked: {}, gift: {}, met: {} }, s || {});
    G.dlg = null; G.gift = null; G.codex = null; G.mem = null;
  },
  save() { try { localStorage.setItem(STORY_KEY, JSON.stringify(G.story)); } catch (e) { /* ignore */ } },
  F(f) { return !!G.story.flags[f]; },
  setFlag(f) {
    if (G.story.flags[f]) return;
    G.story.flags[f] = 1;
    if (NPC_ORDER.every(id => G.story.flags['piece_' + id]) && !G.story.flags.all_pieces) {
      G.story.flags.all_pieces = 1;
      Animals.toast('THE SEVEN PIECES ARE GATHERED', 'THE NEXT CHAPTER STIRS...', '#ffd35a');
    }
  },
  trust(id) { return G.story.trust[id] || 0; },
  lvl(id) { const t = this.trust(id); let l = 0; TRUST_LV.forEach((v, i) => { if (t >= v) l = i; }); return l; },
  addTrust(id, n) {
    const before = this.lvl(id);
    G.story.trust[id] = Math.max(0, Math.min(100, this.trust(id) + n));
    const after = this.lvl(id), np = NPCS[id];
    if (after > before) { Animals.toast(np.name + ' TRUSTS YOU MORE', 'FRIENDSHIP LEVEL ' + after, np.col); sfx.ok(); }
    this.save();
  },
  nextTopic(id) {
    const np = NPCS[id], lv = this.lvl(id);
    for (const t of np.topics) {
      if (G.story.seen[t.id]) continue;
      if (lv < t.trust) continue;
      if (t.flags && !t.flags.every(f => this.F(f))) continue;
      if (t.not && t.not.some(f => this.F(f))) continue;
      return t;
    }
    return null;
  },

  // ------------------------------------------------------------ world setup
  hour() { return G.min / 60; },
  postFor(id, h) {
    for (const p of POSTS[id]) if (h >= p[0] && h < p[1]) return p;
    return null;
  },
  postPos(p) {
    const w = G.w;
    const ok = (tx, ty) => tx >= 0 && ty >= 0 && tx < MW && ty < MH && !w.solid[ty * MW + tx] && w.ground[ty * MW + tx] !== 2;
    let tx = Math.floor(p[2]), ty = Math.floor(p[3]);
    if (ok(tx, ty)) return { x: p[2] * T, y: p[3] * T };
    for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(tx + dx, ty + dy)) return { x: (tx + dx + 0.5) * T, y: (ty + dy + 0.9) * T };
    return { x: p[2] * T, y: p[3] * T };
  },
  init() {
    this.load();
    this.ents = NPC_ORDER.map(id => {
      const e = { id, x: 0, y: 0, dir: 'down', moving: false, anim: 0, path: null, post: null, hidden: true, t: Math.random() * 6 };
      const p = this.postFor(id, this.hour()) || POSTS[id][0];
      const q = this.postPos(p); e.x = q.x; e.y = q.y; e.dir = p[4]; e.post = p; e.hidden = !this.postFor(id, this.hour());
      return e;
    });
    this.near = null; this.nearEnt = null;
  },
  bfs(sx, sy, gx, gy) {
    const w = G.w, N = MW * MH, prev = new Int32Array(N).fill(-2), q = [sy * MW + sx];
    prev[sy * MW + sx] = -1;
    const free = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && !w.solid[y * MW + x] && w.ground[y * MW + x] !== 2;
    const goal = gy * MW + gx;
    for (let h = 0; h < q.length; h++) {
      const c = q[h]; if (c === goal) break;
      const cx = c % MW, cy = (c / MW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, ni = ny * MW + nx;
        if (free(nx, ny) && prev[ni] === -2) { prev[ni] = c; q.push(ni); }
      }
    }
    if (prev[goal] === -2) return null;
    const path = []; let c = goal;
    while (c !== -1) { path.push({ x: (c % MW + 0.5) * T, y: (((c / MW) | 0) + 0.9) * T }); c = prev[c]; }
    return path.reverse();
  },
  visible(e) { return Math.abs(e.x - (G.cam.x + W / 2)) < W / 2 + 40 && Math.abs(e.y - (G.cam.y + H / 2)) < H / 2 + 40; },

  // ------------------------------------------------------------ per-frame
  update(dt) {
    this.claimE = false; this.near = null; this.nearEnt = null;
    if (G.inside) return;
    const p = G.p, h = this.hour();
    this.mark += dt;
    for (const e of this.ents) {
      const post = this.postFor(e.id, h);
      if (!post) { if (e.id === 'kai') e.hidden = true; }
      else {
        if (e.hidden) {                                    // appears at its post
          const q = this.postPos(post); e.x = q.x; e.y = q.y; e.dir = post[4]; e.post = post; e.path = null; e.hidden = false;
          if (this.visible(e)) emit(e.x, e.y - 12, 10, { sp: 30, life: 0.5, c: ['#8a7aa8', '#3a2a5a'] });
        } else if (post !== e.post) {
          const q = this.postPos(post); e.post = post;
          const near = this.visible(e) && Math.hypot(q.x - e.x, q.y - e.y) < 700;
          const path = near ? this.bfs(Math.floor(e.x / T), Math.floor(e.y / T), Math.floor(q.x / T), Math.floor(q.y / T)) : null;
          if (path && path.length < 90) { e.path = path; e.goal = { q, dir: post[4] }; }
          else { e.x = q.x; e.y = q.y; e.dir = post[4]; e.path = null; }
        }
      }
      e.moving = false;
      if (e.path && e.path.length) {
        const wp = e.path[0], dx = wp.x - e.x, dy = wp.y - e.y, d = Math.hypot(dx, dy), st = 30 * dt;
        if (d <= st) { e.x = wp.x; e.y = wp.y; e.path.shift(); if (!e.path.length) { e.path = null; e.dir = e.goal.dir; } }
        else { e.x += dx / d * st; e.y += dy / d * st; e.moving = true; if (Math.abs(dx) > Math.abs(dy)) e.dir = dx < 0 ? 'left' : 'right'; else e.dir = dy < 0 ? 'up' : 'down'; e.anim += dt * 7; }
      }
      if (e.hidden) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < 7 && !e.path) { const dx = p.x - e.x, dy = p.y - e.y, l = d || 1; moveEntity(p, dx / l * (7 - d), 0, 4, 4); moveEntity(p, 0, dy / l * (7 - d), 4, 4); }
      if (d < 26 && (!this.near || d < Math.hypot(this.near.x - p.x, this.near.y - p.y))) this.near = e;
    }
    // hidden places
    for (const id of NPC_ORDER) {
      if (!this.F('place_' + id)) continue;
      const pl = NPCS[id].place;
      if (Math.hypot(pl.x * T - p.x, pl.y * T - p.y) < 22) this.nearEnt = id;
    }
    this.claimE = !!(this.near || this.nearEnt);
    if (hit('KeyP')) { this.openCodex(); return; }
    if (this.near && hit('KeyE')) this.startTalk(this.near);
    else if (this.near && hit('KeyG')) this.openGift(this.near);
    else if (this.nearEnt && hit('KeyE')) this.enterPlace(this.nearEnt);
  },
  active() { return !!(G.dlg || G.gift || G.codex || G.mem); },

  // ------------------------------------------------------------ talking
  clean(s) { return String(s).replace(/[‘’]/g, "'").replace(/[“”"]/g, "'").replace(/[—–]/g, '-').replace(/…/g, '...').replace(/;/g, ',').replace(/&/g, 'AND'); },
  wrap(s, n) {
    const out = []; let line = '';
    for (const wd of s.split(/\s+/)) {
      if (!wd) continue;
      if ((line + ' ' + wd).trim().length > n) { out.push(line); line = wd; } else line = (line + ' ' + wd).trim();
    }
    if (line) out.push(line);
    return out;
  },
  pages(beats) {
    const out = [];
    for (let b of beats) {
      if (typeof b !== 'string') { if (b.if && !this.F(b.if)) continue; if (b.not && this.F(b.not)) continue; b = b.t; }
      let who = 'npc';
      if (b.startsWith('N:')) { who = 'nina'; b = b.slice(2); } else if (b[0] === '~') { who = 'narr'; b = b.slice(1); }
      const lines = this.wrap(this.clean(b).toUpperCase().trim(), 48);
      for (let i = 0; i < lines.length; i += 4) out.push({ who, lines: lines.slice(i, i + 4) });
    }
    return out.length ? out : [{ who: 'npc', lines: ['...'] }];
  },
  startTalk(e) {
    const id = e.id, np = NPCS[id], p = G.p;
    const dx = p.x - e.x, dy = p.y - e.y;
    e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); e.path = null;
    G.story.met[id] = 1;
    if (G.story.talked[id] !== G.day) { G.story.talked[id] = G.day; this.addTrust(id, 2); Bonds.pop(e.x, e.y - 34, '+2 TRUST', '#ff9ac0'); }
    const topic = this.nextTopic(id);
    let beats;
    if (topic) beats = topic.beats;
    else {
      const lv = this.lvl(id), tier = lv <= 1 ? 0 : lv <= 3 ? 1 : 2, list = np.chatter[tier];
      beats = (wxWet() > 0.5 && Math.random() < 0.5) ? [np.rain] : [list[Math.floor(Math.random() * list.length)]];
    }
    G.dlg = { id, pages: this.pages(beats), pi: 0, ch: 0, mode: 'text', topic, stage: 'main', opts: null, sel: 0, chosen: null, flash: 0 };
    sfx.move(); this.save();
  },
  openGift(e) {
    const list = [];
    for (const id of ITEM_ORDER) if ((G.bag[id] || 0) > 0) list.push(id);
    for (const f of FISH) if ((G.bag['f_' + f.id] || 0) > 0) list.push('f_' + f.id);
    G.gift = { id: e.id, e, list, sel: 0, msg: '' };
    sfx.move();
  },
  haveNeed(n) {
    if (!n) return true;
    if (n.kind === 'fish') { let c = 0; for (const k in G.bag) if (k.startsWith('f_')) c += G.bag[k]; return c >= n.n; }
    return (G.bag[n.item] || 0) >= n.n;
  },
  takeNeed(n) {
    if (!n) return;
    let left = n.n;
    for (const k of Object.keys(G.bag)) {
      if (left <= 0) break;
      if (n.kind === 'fish' ? k.startsWith('f_') : k === n.item) { const t = Math.min(left, G.bag[k]); G.bag[k] -= t; left -= t; }
    }
    try { Bonds.save(); } catch (e) { /* ignore */ }
  },
  needTxt(n) { return n.kind === 'fish' ? n.n + ' FISH' : n.n + ' ' + Bonds.itemName(n.item).toUpperCase(); },
  chooseOpt(o) {
    const d = G.dlg;
    if (!this.haveNeed(o.need)) { sfx.no(); d.flash = 1; return; }
    if (o.need) this.takeNeed(o.need);
    if (o.trust) { this.addTrust(d.id, o.trust); Bonds.pop(G.p.x, G.p.y - 40, (o.trust > 0 ? '+' : '') + o.trust + ' TRUST', o.trust > 0 ? '#ff9ac0' : '#9aa8d8'); }
    if (o.also) for (const k in o.also) this.addTrust(k, o.also[k]);
    if (o.set) o.set.forEach(f => this.setFlag(f));
    d.chosen = o; d.stage = 'reply'; d.pages = this.pages(o.beats); d.pi = 0; d.ch = 0; d.mode = 'text'; d.opts = null;
    sfx.ok(); this.save();
  },
  finishDlg() {
    const d = G.dlg, t = d.topic;
    if (t && !d.replay && !(d.chosen && d.chosen.done === false)) {
      G.story.seen[t.id] = 1;
      if (t.set) t.set.forEach(f => this.setFlag(f));
      if (t.place) { this.setFlag('place_' + t.place); Animals.toast('A NEW PLACE IS REVEALED', NPCS[t.place].place.name, NPCS[t.place].col); }
      const nx = this.nextTopic(d.id);
      if (nx) Bonds.pop(G.p.x, G.p.y - 48, 'THERE IS MORE TO HEAR...', '#ffe27a');
    }
    G.dlg = null; this.save();
  },
  updateDlg(dt) {
    const d = G.dlg, adv = hit('KeyE', 'Enter', 'Space');
    d.flash = Math.max(0, d.flash - dt * 2);
    if (d.mode === 'text') {
      const pg = d.pages[d.pi], len = pg.lines.join('').length;
      d.ch = Math.min(len, d.ch + dt * 55);
      if (adv) {
        if (d.ch < len) d.ch = len;
        else if (d.pi < d.pages.length - 1) { d.pi++; d.ch = 0; sfx.move(); }
        else if (d.stage === 'main' && d.topic && d.topic.ask && !d.replay) { d.mode = 'choice'; d.opts = d.topic.ask.opts; d.sel = 0; sfx.move(); }
        else this.finishDlg();
      }
    } else {
      const n = d.opts.length;
      if (hit('KeyW', 'ArrowUp')) { d.sel = (d.sel + n - 1) % n; sfx.move(); }
      if (hit('KeyS', 'ArrowDown')) { d.sel = (d.sel + 1) % n; sfx.move(); }
      if (adv) this.chooseOpt(d.opts[d.sel]);
    }
  },
  updateGift(dt) {
    const g = G.gift, n = g.list.length;
    if (hit('Escape', 'KeyG', 'KeyQ')) { G.gift = null; return; }
    if (!n) return;
    if (hit('KeyW', 'ArrowUp')) { g.sel = (g.sel + n - 1) % n; sfx.move(); }
    if (hit('KeyS', 'ArrowDown')) { g.sel = (g.sel + 1) % n; sfx.move(); }
    if (hit('KeyE', 'Enter', 'Space')) {
      const id = g.list[g.sel], np = NPCS[g.id];
      if (G.story.gift[g.id] === G.day) { g.msg = 'ALREADY GAVE A GIFT TODAY'; sfx.no(); return; }
      let kind = 'meh';
      if (np.loves.includes(id)) kind = 'love';
      else if (np.likes.includes(id) || (id.startsWith('f_') && np.likes.includes('fish'))) kind = 'like';
      else if (np.dislikes.includes(id)) kind = 'dislike';
      else if (np.hates.includes(id)) kind = 'hate';
      G.bag[id]--; try { Bonds.save(); } catch (e) { /* ignore */ }
      G.story.gift[g.id] = G.day; G.story.met[g.id] = 1;
      this.addTrust(g.id, GIFT_D[kind]);
      const lines = np.giftLines[kind], e = g.e;
      Bonds.pop(e.x, e.y - 34, (GIFT_D[kind] > 0 ? '+' : '') + GIFT_D[kind] + ' TRUST', GIFT_D[kind] > 0 ? '#ff9ac0' : '#9aa8d8');
      if (kind === 'love' || kind === 'like') emit(e.x, e.y - 24, kind === 'love' ? 16 : 8, { sp: 36, life: 0.9, vy: -22, c: ['#ff7aa8', '#ffc0d8', '#ffffff'] });
      G.gift = null;
      G.dlg = { id: g.id, pages: this.pages([lines[Math.floor(Math.random() * lines.length)]]), pi: 0, ch: 0, mode: 'text', topic: null, stage: 'main', opts: null, sel: 0, chosen: null, flash: 0 };
      sfx.ok();
    }
  },

  // ------------------------------------------------------------ hidden places
  enterPlace(id) {
    const pl = NPCS[id].place;
    G.mem = { id, pages: NPCS[id].memory.map(s => this.pages([s])[0]), pi: 0, ch: 0, t: 0, pl };
    sfx.ok();
  },
  updateMem(dt) {
    const m = G.mem; m.t += dt;
    if (m.t < 0.8) return;
    const pg = m.pages[m.pi], len = pg.lines.join('').length;
    m.ch = Math.min(len, m.ch + dt * 40);
    if (m.out) { m.out += dt; if (m.out > 0.8) G.mem = null; return; }
    if (hit('KeyE', 'Enter', 'Space')) {
      if (m.ch < len) m.ch = len;
      else if (m.pi < m.pages.length - 1) { m.pi++; m.ch = 0; sfx.move(); }
      else {
        if (!this.F('mem_' + m.id)) {
          this.setFlag('mem_' + m.id); Animals.toast('MEMORY FRAGMENT', 'THE NIGHT OF THE HOLLOW MOON', '#c8a0ff'); sfx.ok();
          const nx = this.nextTopic(m.id); if (nx) setTimeout(() => { if (G) Bonds.pop(G.p.x, G.p.y - 48, NPCS[m.id].name + ' HAS MORE TO SAY', '#ffe27a'); }, 1200);
          this.save();
        }
        m.out = 0.01;
      }
    }
  },

  // ------------------------------------------------------------ people book
  openCodex() { G.codex = { sel: 0, ts: 0, page: 0 }; sfx.move(); },
  updateCodex(dt) {
    const c = G.codex, id = NPC_ORDER[c.sel], np = NPCS[id];
    if (hit('Escape', 'KeyP')) { G.codex = null; return; }
    if (hit('Tab')) { c.page = 1 - c.page; sfx.move(); }
    if (c.page === 0) {
      if (hit('KeyW', 'ArrowUp')) { c.sel = (c.sel + 6) % 7; c.ts = 0; sfx.move(); }
      if (hit('KeyS', 'ArrowDown')) { c.sel = (c.sel + 1) % 7; c.ts = 0; sfx.move(); }
      if (hit('KeyA', 'ArrowLeft')) { c.ts = (c.ts + np.topics.length - 1) % np.topics.length; sfx.move(); }
      if (hit('KeyD', 'ArrowRight')) { c.ts = (c.ts + 1) % np.topics.length; sfx.move(); }
      if (hit('KeyE', 'Enter')) {
        const t = np.topics[c.ts];
        if (t && G.story.seen[t.id]) {
          G.codex = null;
          G.dlg = { id, pages: this.pages(t.beats), pi: 0, ch: 0, mode: 'text', topic: t, replay: true, stage: 'main', opts: null, sel: 0, chosen: null, flash: 0 };
        } else sfx.no();
      }
    }
  },
  updateUI(dt) {
    G.t += dt;
    if (G.dlg) this.updateDlg(dt);
    else if (G.gift) this.updateGift(dt);
    else if (G.mem) this.updateMem(dt);
    else if (G.codex) this.updateCodex(dt);
  },

  // ------------------------------------------------------------ world drawing
  pushItems(items, cx, cy) {
    for (const e of this.ents) {
      if (e.hidden) continue;
      if (e.x < cx - 30 || e.x > cx + W + 30 || e.y < cy - 20 || e.y > cy + H + 50) continue;
      items.push({ y: e.y, draw: () => {
        const sx = Math.round(e.x) - cx, sy = Math.round(e.y) - cy;
        ell(ctx, 'rgba(0,0,0,0.28)', sx, sy, e.id === 'thorin' ? 7 : 6, 2.5);
        const fr = e.moving ? [0, 1, 0, 2][Math.floor(e.anim) % 4] : 0;
        const bob = !e.moving && Math.floor((G.t + e.t) * 1.2) % 2 ? 0.5 : 0;
        const img = NpcArt.spr[e.id][e.dir][fr];
        blit(img, sx - 8, sy - 29 - bob);
        const tp = this.nextTopic(e.id);
        if (tp && !(G.dlg && G.dlg.id === e.id)) blit(NpcArt.misc.mark['!'], sx - 3.5, sy - 42 + Math.round(Math.sin((G.t + e.t) * 4) * 1.5));
      } });
    }
    for (const id of NPC_ORDER) {
      if (!this.F('place_' + id)) continue;
      const pl = NPCS[id].place;
      if (pl.x * T < cx - 30 || pl.x * T > cx + W + 30 || pl.y * T < cy - 30 || pl.y * T > cy + H + 40) continue;
      items.push({ y: pl.y * T, draw: () => {
        const sx = Math.round(pl.x * T) - cx, sy = Math.round(pl.y * T) - cy, im = NpcArt.misc.ent[pl.kind];
        ell(ctx, 'rgba(0,0,0,0.25)', sx, sy, 9, 3);
        blit(im, sx - 10, sy - 17);
        if (!this.F('mem_' + id)) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 4); rect(ctx, '#ffe27a', sx - 1, sy - 26 + Math.round(Math.sin(G.t * 3) * 2), 2, 5); rect(ctx, '#ffe27a', sx - 1, sy - 19 + Math.round(Math.sin(G.t * 3) * 2), 2, 2); ctx.globalAlpha = 1; }
      } });
    }
    if (G.w.fire) {
      const fx = Math.round(G.w.fire.x) - cx, fy = Math.round(G.w.fire.y) - cy;
      if (fx > -20 && fx < W + 20 && fy > -20 && fy < H + 30) items.push({ y: G.w.fire.y, draw: () => blit(NpcArt.misc.fire[Math.floor(G.t * 5) % 2], fx - 8, fy - 14) });
    }
  },
  drawWorld(cx, cy) {
    const e = this.near;
    if (e) {
      const sx = Math.round(e.x) - cx, sy = Math.round(e.y) - cy, np = NPCS[e.id];
      textC(ctx, np.name, sx, sy - 40, '#ffffff', 1, '#1d1030');
      for (let i = 0; i < 5; i++) this.heart(sx - 18 + i * 8, sy - 33, i < this.lvl(e.id));
    }
  },
  drawHUD() {
    if (G.dlg || G.gift || G.mem || G.codex) return;
    const by = H - 34;
    const py = G.hint > 0 ? by - 58 : by - 12;
    if (this.near) textC(ctx, 'E: TALK   G: GIVE GIFT', W / 2, py, '#ffe27a', 1, '#1d1030');
    else if (this.nearEnt) textC(ctx, 'E: ENTER ' + NPCS[this.nearEnt].place.name, W / 2, py, '#c8a0ff', 1, '#1d1030');
    if (G.hint > 0 && !G.inside) { ctx.globalAlpha = Math.min(1, G.hint); textC(ctx, 'E: TALK TO VILLAGERS   G: GIFT   P: PEOPLE BOOK', W / 2, by - 44, '#ffe27a', 1, '#1d1030'); ctx.globalAlpha = 1; }
  },
  drawMap(mx, my) {
    for (const id of NPC_ORDER) {
      const np = NPCS[id];
      if (G.story.met[id]) { const p = POSTS[id][POSTS[id].length > 1 && id === 'finn' ? 1 : 0], x = Math.round(mx(p[2])), y = Math.round(my(p[3])); rect(ctx, '#1d1030', x - 2, y - 2, 5, 5); rect(ctx, np.col, x - 1, y - 1, 3, 3); }
      if (this.F('place_' + id)) { const pl = np.place, x = Math.round(mx(pl.x)), y = Math.round(my(pl.y)); rect(ctx, '#1d1030', x - 3, y - 3, 7, 7); rect(ctx, this.F('mem_' + id) ? '#9ad8ff' : '#c8a0ff', x - 1, y - 1, 3, 3); rect(ctx, '#ffffff', x, y - 2, 1, 5); rect(ctx, '#ffffff', x - 2, y, 5, 1); }
    }
  },

  // ------------------------------------------------------------ UI drawing
  heart(x, y, full) { HEART_ROWS.forEach((r, j) => { for (let i = 0; i < 7; i++) if (r[i] === '#') rect(ctx, full ? (j === 1 && i < 3 ? '#ffb0c8' : '#ff5a8a') : '#4a3a6a', x + i, y + j, 1, 1); }); },
  portrait(id) {
    if (this.portCache[id]) return this.portCache[id];
    let cv;
    if (id === 'nina') {
      const f = G.spr.frames.down[0], fw = f.width, fh = f.height; const [c, g] = mk(112, 112);
      g.drawImage(f, fw * 0.12, 0, fw * 0.76, fw * 0.76, 0, 0, 112, 112);
      cv = c;
    } else cv = decodePortrait(id);
    this.portCache[id] = cv; return cv;
  },
  panel(x, y, w, h, col) { rect(ctx, '#140a28', x, y, w, h); box(ctx, x, y, w, h, col || '#f0c94d'); box(ctx, x + 2, y + 2, w - 4, h - 4, '#3a2a5a'); },
  drawUI() {
    if (G.dlg) this.drawDlg();
    else if (G.gift) this.drawGift();
    else if (G.mem) this.drawMem();
    else if (G.codex) this.drawCodex();
  },
  drawDlg() {
    const d = G.dlg, np = NPCS[d.id], x = 6, y = 126, w = 372, h = 84;
    const pg = d.pages[d.pi], who = d.mode === 'choice' ? 'npc' : pg.who;
    this.panel(x, y, w, h, np.col);
    // portrait
    rect(ctx, '#120a22', x + 6, y + 6, 58, 58); box(ctx, x + 6, y + 6, 58, 58, who === 'narr' ? '#3a2a5a' : (who === 'nina' ? '#b79cf0' : np.col));
    const pid = who === 'nina' ? 'nina' : d.id;
    if (who === 'narr') ctx.globalAlpha = 0.35;
    ctx.drawImage(this.portrait(pid), x + 7, y + 7, 56, 56); ctx.globalAlpha = 1;
    const nm = who === 'nina' ? 'NINA' : who === 'narr' ? '' : np.name;
    text(ctx, nm, x + 72, y + 8, who === 'nina' ? '#d9c2ff' : '#ffffff', 1, '#1d1030');
    if (who !== 'nina') { text(ctx, np.title, x + 72, y + 18 - 0, '#8a7aa8'); }
    else text(ctx, 'THE WITCH OF LANTERNFALL', x + 72, y + 18, '#8a7aa8');
    // trust hearts + bar
    const lv = this.lvl(d.id);
    for (let i = 0; i < 5; i++) this.heart(x + w - 52 + i * 9, y + 8, i < lv);
    const t = this.trust(d.id), a = TRUST_LV[Math.min(lv, 5)], b = TRUST_LV[Math.min(lv + 1, 5)];
    rect(ctx, '#0d0820', x + w - 52, y + 18, 44, 4);
    rect(ctx, '#ff5a8a', x + w - 52, y + 18, lv >= 5 ? 44 : Math.round(44 * (t - a) / Math.max(1, b - a)), 4);
    if (d.mode === 'text') {
      const col = who === 'nina' ? '#e6d8ff' : who === 'narr' ? '#9fb4d8' : '#ffffff';
      let left = Math.floor(d.ch);
      pg.lines.forEach((ln, i) => { const s = ln.slice(0, Math.max(0, left)); left -= ln.length; if (s) text(ctx, s, x + 72, y + 32 + i * 10, col, 1, '#1d1030'); });
      if (d.ch >= pg.lines.join('').length && Math.floor(G.t * 3) % 2) text(ctx, d.pi < d.pages.length - 1 || (d.topic && d.topic.ask && !d.replay && d.stage === 'main') ? '>' : 'E', x + w - 14, y + h - 14, '#ffe27a');
      if (d.replay) text(ctx, 'REPLAY', x + w - 46, y + h - 14, '#6a5a90');
    } else {
      d.opts.forEach((o, i) => {
        const ok = this.haveNeed(o.need), on = i === d.sel, yy = y + 30 + i * 13;
        if (on) { rect(ctx, 'rgba(255,226,122,0.14)', x + 70, yy - 3, w - 80, 12); text(ctx, '>', x + 74, yy, '#ffe27a'); }
        text(ctx, this.clean(o.t) + (o.need && !ok ? '  (NEED ' + this.needTxt(o.need) + ')' : ''), x + 84, yy, ok ? (on ? '#ffffff' : '#c8b8e8') : '#6a5a7a', 1, '#1d1030');
      });
      if (d.flash > 0) textC(ctx, 'YOU DO NOT HAVE THAT YET', x + w / 2 + 30, y + h - 12, '#ff8a8a');
    }
  },
  drawGift() {
    const g = G.gift, np = NPCS[g.id], x = 92, y = 28, w = 200, h = 160;
    rect(ctx, 'rgba(10,5,25,0.6)', 0, 0, W, H);
    this.panel(x, y, w, h, np.col);
    textC(ctx, 'GIVE A GIFT TO ' + np.name, x + w / 2, y + 8, '#ffffff', 1, '#1d1030');
    if (!g.list.length) { textC(ctx, 'YOUR BACKPACK IS EMPTY', x + w / 2, y + 70, '#b9a6d8'); textC(ctx, 'GATHER, FISH OR FEED PETS', x + w / 2, y + 82, '#8a7aa8'); }
    const per = 9, top = Math.max(0, Math.min(g.sel - 4, g.list.length - per));
    for (let i = 0; i < per && top + i < g.list.length; i++) {
      const id = g.list[top + i], on = top + i === g.sel, yy = y + 22 + i * 12;
      if (on) rect(ctx, 'rgba(255,226,122,0.16)', x + 6, yy - 2, w - 12, 12);
      const ic = Bonds.itemIcon(id); if (ic) { const sc = Math.min(1, 10 / Math.max(ic.width, ic.height)); ctx.drawImage(ic, x + 10, yy - 1, ic.width * sc, ic.height * sc); }
      text(ctx, Bonds.itemName(id).toUpperCase(), x + 26, yy, on ? '#ffffff' : '#c8b8e8');
      textR(ctx, 'X' + G.bag[id], x + w - 10, yy, '#ffe27a');
    }
    if (g.msg) textC(ctx, g.msg, x + w / 2, y + h - 22, '#ff8a8a');
    textC(ctx, 'W/S: CHOOSE   E: GIVE   ESC: CANCEL', x + w / 2, y + h - 11, '#7a6aa0');
  },
  drawMem() {
    const m = G.mem, np = NPCS[m.id], k = m.pl.kind;
    const top = { hatch: '#1a0f08', tree: '#071a14', cave: '#07101f', icecave: '#0a1a2e' }[k], bot = { hatch: '#4a2a14', tree: '#14402c', cave: '#10305a', icecave: '#2a5a8a' }[k];
    const fade = m.out ? Math.max(0, 1 - m.out / 0.8) : Math.min(1, m.t / 0.8);
    ctx.globalAlpha = fade;
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = fade * 0.22; ctx.drawImage(this.portrait(m.id), 136, 14, 112, 112); ctx.globalAlpha = fade;
    for (let i = 0; i < 40; i++) {
      const px = (i * 97 + Math.sin(G.t * 0.4 + i) * 14 + G.t * 6 * (i % 3 + 1)) % W, py = H - ((i * 53 + G.t * (8 + i % 5 * 3)) % (H + 20));
      ctx.globalAlpha = fade * (0.25 + 0.2 * Math.sin(G.t * 2 + i)); rect(ctx, np.col, Math.round(px), Math.round(py), 1 + (i % 2), 1 + (i % 2));
    }
    ctx.globalAlpha = fade;
    textC(ctx, m.pl.name, W / 2, 10, '#ffffff', 2, '#000000');
    textC(ctx, 'A MEMORY NOT QUITE YOURS', W / 2, 30, '#c8a0ff');
    const pg = m.pages[m.pi];
    this.panel(30, 140, 324, 62, '#5a4a8a');
    let left = Math.floor(m.ch);
    pg.lines.forEach((ln, i) => { const s = ln.slice(0, Math.max(0, left)); left -= ln.length; if (s) text(ctx, s, 42, 152 + i * 10, '#d8e4ff', 1, '#000000'); });
    for (let i = 0; i < m.pages.length; i++) rect(ctx, i <= m.pi ? '#c8a0ff' : '#3a2a5a', W / 2 - m.pages.length * 4 + i * 8, 194, 5, 2);
    if (m.ch >= pg.lines.join('').length && Math.floor(G.t * 3) % 2) text(ctx, 'E', 340, 188, '#ffe27a');
    ctx.globalAlpha = 1;
  },
  drawCodex() {
    const c = G.codex;
    rect(ctx, '#0c061c', 0, 0, W, H); box(ctx, 4, 4, W - 8, H - 8, '#f0c94d');
    text(ctx, 'PEOPLE OF LANTERNFALL', 12, 10, '#f6d365', 1, '#5a2a10');
    textR(ctx, 'TAB: ' + (c.page ? 'PEOPLE' : 'MEMORIES') + '   P: CLOSE', W - 12, 10, '#7a6aa0');
    if (c.page === 1) return this.drawMemories();
    NPC_ORDER.forEach((id, i) => {
      const np = NPCS[id], y = 24 + i * 25, on = i === c.sel, met = G.story.met[id];
      rect(ctx, on ? '#3a2a5a' : '#241540', 10, y, 112, 23); box(ctx, 10, y, 112, 23, on ? np.col : '#4a3a6a');
      if (met) ctx.drawImage(this.portrait(id), 13, y + 2, 19, 19); else { rect(ctx, '#120a22', 13, y + 2, 19, 19); text(ctx, '?', 20, y + 8, '#6a5a90'); }
      text(ctx, met ? np.name : '???', 36, y + 4, met ? '#ffffff' : '#6a5a90');
      if (met) for (let j = 0; j < 5; j++) this.heart(36 + j * 8, y + 13, j < this.lvl(id));
    });
    const id = NPC_ORDER[c.sel], np = NPCS[id], met = G.story.met[id];
    const x0 = 130, w0 = W - 140;
    rect(ctx, '#241540', x0, 24, w0, 176); box(ctx, x0, 24, w0, 176, '#5a4a8a');
    if (!met) {
      text(ctx, 'SOMEONE YOU HAVE NOT MET YET', x0 + 8, 34, '#8a7aa8');
      text(ctx, 'FIND THEM:', x0 + 8, 52, '#f6d365'); text(ctx, WHERE_TXT[id], x0 + 8, 64, '#ffffff');
      return;
    }
    ctx.drawImage(this.portrait(id), x0 + 6, 30, 40, 40);
    text(ctx, np.full.toUpperCase(), x0 + 52, 32, '#ffffff', 1, '#1d1030'); text(ctx, np.title, x0 + 52, 43, np.col);
    const lv = this.lvl(id), t = this.trust(id);
    text(ctx, 'TRUST', x0 + 52, 56, '#8a7aa8'); for (let j = 0; j < 5; j++) this.heart(x0 + 86 + j * 9, 56, j < lv);
    textR(ctx, t + '/' + TRUST_LV[5], x0 + w0 - 8, 56, '#ff9ac0');
    text(ctx, 'FOUND:', x0 + 8, 75, '#8a7aa8');
    this.wrap(WHERE_TXT[id], 30).forEach((ln, j) => text(ctx, ln, x0 + 50, 75 + j * 9, '#c8b8e8'));
    text(ctx, 'CONVERSATIONS  (A/D: SELECT, E: REPLAY)', x0 + 8, 96, '#f6d365');
    np.topics.forEach((tp, i) => {
      const seen = G.story.seen[tp.id], on = i === c.ts, y = 107 + i * 10;
      if (on) rect(ctx, 'rgba(255,226,122,0.14)', x0 + 6, y - 2, w0 - 12, 10);
      let label;
      if (seen) { const b = tp.beats.map(b => typeof b === 'string' ? b : b.t).find(s => s[0] !== '~' && !s.startsWith('N:')) || tp.beats[0]; label = this.clean(typeof b === 'string' ? b : b.t).replace(/^[N~]:?/, '').toUpperCase(); if (label.length > 34) label = label.slice(0, 32) + '..'; }
      else if (this.lvl(id) < tp.trust) label = '??? NEEDS FRIENDSHIP LEVEL ' + tp.trust;
      else if (tp.flags) label = '??? SOMETHING MUST BE SEEN FIRST';
      else label = '??? READY TO BE HEARD';
      text(ctx, (i + 1) + '.', x0 + 10, y, seen ? '#7affb0' : '#6a5a90'); text(ctx, label, x0 + 22, y, seen ? '#ffffff' : (this.lvl(id) >= tp.trust ? '#ffe27a' : '#6a5a90'));
    });
    const py = 172;
    text(ctx, 'HIDDEN PLACE:', x0 + 8, py, '#f6d365');
    text(ctx, this.F('place_' + id) ? np.place.name + (this.F('mem_' + id) ? ' (VISITED)' : ' (NOT VISITED)') : '???', x0 + 8, py + 9, this.F('place_' + id) ? '#c8a0ff' : '#6a5a90');
    text(ctx, 'LOVES: ' + np.loves.map(i => (i.startsWith('f_') ? i.slice(2) : i)).join(', ').toUpperCase(), x0 + 8, py + 19, '#ff9ac0');
    if (this.F('piece_' + id)) rect(ctx, '#ffd35a', x0 + w0 - 14, 30, 6, 6);
  },
  drawMemories() {
    text(ctx, "NINA'S NIGHTMARE: WHAT SHE REMEMBERS OF THE HOLLOW MOON", 12, 26, '#c8a0ff');
    NIGHT_FRAGMENTS.forEach((f, i) => {
      const got = this.F(f.need), y = 40 + i * 22;
      rect(ctx, got ? '#2a1a4a' : '#1a1030', 10, y, W - 20, 20); box(ctx, 10, y, W - 20, 20, got ? '#7a5ab8' : '#3a2a5a');
      const np = NPCS[NPC_ORDER[i]];
      rect(ctx, np.col, 14, y + 4, 3, 12);
      if (got) { const ls = this.wrap(this.clean(f.t).toUpperCase(), 58); ls.slice(0, 2).forEach((ln, j) => text(ctx, ln, 22, y + 3 + j * 8, '#e8dcff')); }
      else text(ctx, '??? A MEMORY HIDDEN IN ' + (this.F('place_' + NPC_ORDER[i]) ? np.place.name : 'A PLACE ' + np.name + ' HAS NOT SHOWN YOU'), 22, y + 7, '#6a5a90');
    });
    const n = NPC_ORDER.filter(id => this.F('piece_' + id)).length;
    text(ctx, 'THE SEVEN PIECES: ' + n + '/7', 12, 196, '#ffd35a');
    NPC_ORDER.forEach((id, i) => { const on = this.F('piece_' + id); rect(ctx, '#1d1030', 200 + i * 14, 194, 11, 11); rect(ctx, on ? NPCS[id].col : '#3a2a5a', 202 + i * 14, 196, 7, 7); });
  }
};
