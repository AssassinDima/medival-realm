'use strict';
/* =====================================================================
   touch.js - phone controls: a floating joystick (left side) to move,
   tap the screen to talk / interact / advance dialogue / pick choices,
   plus a few small buttons. Turns on at the first touch; the keyboard
   keeps working. Everything just feeds the same key sets game.js reads.
   ===================================================================== */
const TouchUI = {
  on: false, joy: null, held: new Map(), taps: new Map(),
  btns: [
    { k: 'KeyE', l: 'E', x: W - 36, y: H - 62, w: 28, h: 28 }, { k: 'Space', l: 'SPC', x: W - 70, y: H - 44, w: 28, h: 28 },
    { k: 'KeyG', l: 'G', x: W - 36, y: H - 96, w: 28, h: 28 }, { k: 'KeyF', l: 'F', x: W - 70, y: H - 78, w: 28, h: 28, hold: true },
    { k: 'KeyI', l: 'BAG', x: W - 32, y: 62, w: 28, h: 15 }, { k: 'KeyM', l: 'MAP', x: W - 32, y: 79, w: 28, h: 15 },
    { k: 'KeyP', l: 'PPL', x: W - 32, y: 96, w: 28, h: 15 }, { k: 'Tab', l: 'DEX', x: W - 32, y: 113, w: 28, h: 15 },
    { k: 'Escape', l: 'ESC', x: W - 32, y: 130, w: 28, h: 15 }
  ],
  pt(t) { const r = canvas.getBoundingClientRect(); return { x: (t.clientX - r.left) / r.width * W, y: (t.clientY - r.top) / r.height * H }; },
  press(k) { pressed.add(k); },
  enable() { if (this.on) return; this.on = true; fitCanvas(); },
  btnAt(p) { if (scene !== 'play' || !G || G.bagUI && false) return null; return this.btns.find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h); },
  overlay() { return !!(G && (G.dlg || G.gift || G.codex || G.mem || G.map || G.dex || G.bagUI || G.paused)); },
  start(e) {
    e.preventDefault(); this.enable(); initAudio();
    for (const t of e.changedTouches) {
      const p = this.pt(t), b = this.btnAt(p);
      if (b) { if (b.hold) { keys.add(b.k); this.held.set(t.identifier, b); } else this.press(b.k); continue; }
      if (scene === 'play' && !this.joy && p.x < W * 0.45 && p.y > 40 && !this.overlay() && !(Npcs.near && false)) { this.joy = { id: t.identifier, x: p.x, y: p.y, dx: 0, dy: 0, t0: performance.now(), sx: p.x, sy: p.y, moved: false }; continue; }
      this.taps.set(t.identifier, { x: p.x, y: p.y, t0: performance.now() });
    }
  },
  move(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.joy && t.identifier === this.joy.id) {
        const p = this.pt(t), j = this.joy;
        let dx = p.x - j.x, dy = p.y - j.y; const d = Math.hypot(dx, dy), R = 22;
        if (d > R) { j.x += dx / d * (d - R); j.y += dy / d * (d - R); dx = p.x - j.x; dy = p.y - j.y; }
        j.dx = dx / R; j.dy = dy / R;
        if (Math.hypot(p.x - j.sx, p.y - j.sy) > 4) j.moved = true;
        this.setDir();
      }
    }
  },
  setDir() {
    const j = this.joy, th = 0.3, m = j ? Math.hypot(j.dx, j.dy) : 0;
    const set = (k, on) => { if (on) { if (!keys.has(k)) { keys.add(k); pressed.add(k); } } else keys.delete(k); };
    set('KeyA', j && j.dx < -th); set('KeyD', j && j.dx > th); set('KeyW', j && j.dy < -th); set('KeyS', j && j.dy > th);
    set('ShiftLeft', j && m > 1.2);
  },
  end(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.joy && t.identifier === this.joy.id) {
        const j = this.joy; this.joy = null; this.setDir();
        if (!j.moved && performance.now() - j.t0 < 300) this.tap({ x: j.sx, y: j.sy });
        continue;
      }
      const h = this.held.get(t.identifier); if (h) { keys.delete(h.k); this.held.delete(t.identifier); continue; }
      const s = this.taps.get(t.identifier);
      if (s) { this.taps.delete(t.identifier); const p = this.pt(t); if (performance.now() - s.t0 < 500 && Math.hypot(p.x - s.x, p.y - s.y) < 14) this.tap(p); }
    }
  },
  // ---- what a tap means
  tap(p) {
    if (scene !== 'play') { if (scene === 'title' || scene === 'select') this.press('Enter'); return; }
    if (!G) return;
    if (G.fx) return;
    if (G.dlg) {
      const d = G.dlg;
      if (d.mode === 'choice') { const i = Math.floor((p.y - 153) / 13); if (i >= 0 && i < d.opts.length) { d.sel = i; this.press('KeyE'); } }
      else this.press('KeyE');
      return;
    }
    if (G.gift) {
      const g = G.gift;
      if (p.x < 92 || p.x > 292 || p.y < 28 || p.y > 188) { this.press('Escape'); return; }
      const top = Math.max(0, Math.min(g.sel - 4, g.list.length - 9)), i = Math.floor((p.y - 48) / 12);
      if (i >= 0 && i < 9 && top + i < g.list.length) { if (g.sel === top + i) this.press('KeyE'); else g.sel = top + i; }
      return;
    }
    if (G.mem) { this.press('KeyE'); return; }
    if (G.codex) {
      const c = G.codex;
      if (p.y < 20 && p.x > W - 160) { this.press(p.x > W - 62 ? 'KeyP' : 'Tab'); return; }
      if (c.page === 0) {
        if (p.x < 124 && p.y >= 24) { const i = Math.floor((p.y - 24) / 25); if (i >= 0 && i < 7) { c.sel = i; c.ts = 0; } }
        else if (p.x > 130 && p.y >= 105 && p.y < 168) { const i = Math.floor((p.y - 105) / 10); const n = NPCS[NPC_ORDER[c.sel]].topics.length; if (i < n) { if (c.ts === i) this.press('KeyE'); else c.ts = i; } }
      }
      return;
    }
    if (G.bagUI) {
      if (p.x > W - 50 && p.y < 30) this.press('KeyI');
      else if (p.y < 30) this.press(p.x < W / 2 ? 'KeyQ' : 'KeyE');
      else if (p.x < W / 3) this.press('ArrowLeft'); else if (p.x > W * 2 / 3) this.press('ArrowRight');
      else this.press(p.y < H / 2 ? 'ArrowUp' : 'ArrowDown');
      return;
    }
    if (G.map || G.dex || G.paused) { this.press('Escape'); return; }
    if (G.inside) { this.press('KeyE'); return; }
    if (Npcs.near || Npcs.nearEnt) { this.press('KeyE'); return; }
    if (typeof Bonds !== 'undefined' && Bonds.nearPet) { this.press('KeyG'); return; }
  },
  draw() {
    if (!this.on || scene !== 'play' || !G) return;
    ctx.globalAlpha = 0.55;
    if (!G.dlg && !G.gift && !G.mem && !G.codex && !G.map && !G.dex && !G.bagUI) {
      const j = this.joy, bx = j ? j.x : 52, by = j ? j.y : H - 52;
      ell(ctx, 'rgba(20,10,40,0.6)', bx, by, 24, 24); ell(ctx, 'rgba(240,201,77,0.5)', bx, by, 22, 22); ell(ctx, 'rgba(20,10,40,0.8)', bx, by, 20, 20);
      ell(ctx, '#f6d365', bx + (j ? j.dx * 12 : 0), by + (j ? j.dy * 12 : 0), 8, 8);
      for (const b of this.btns) {
        const on = keys.has(b.k);
        rect(ctx, on ? '#f6d365' : '#1d1030', b.x, b.y, b.w, b.h); box(ctx, b.x, b.y, b.w, b.h, '#f0c94d');
        textC(ctx, b.l, b.x + b.w / 2, b.y + b.h / 2 - 3, on ? '#1d1030' : '#ffffff');
      }
    }
    ctx.globalAlpha = 1;
    if (G.dlg || G.gift || G.mem) textC(ctx, 'TAP TO CONTINUE', W / 2, 2, '#7a6aa0');
  }
};
{
  const o = { passive: false };
  canvas.addEventListener('touchstart', e => TouchUI.start(e), o);
  canvas.addEventListener('touchmove', e => TouchUI.move(e), o);
  canvas.addEventListener('touchend', e => TouchUI.end(e), o);
  canvas.addEventListener('touchcancel', e => TouchUI.end(e), o);
}
