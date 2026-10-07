
/* Outpost Rush rules: the battle simulation (buildings, lines, troops, fights, capture, map elements), the computer
   players and the level format. Fixed timestep (OP.DT), deterministic (seeded), no drawing: the page (app.js +
   scene.js) and the Node checks (tools/check.js, tools/gen.js) run the very same code.

   The map is W x H world units, x to the right, y down the screen (the player is at the bottom).
   Owners: 0 gray (neutral), 1 blue (the player), 2 red, 3 green, 4 yellow (computers; they fight each other too).
   Buildings: 'b' barracks (soldiers), 'f' factory (tanks), 's' sniper tower (shoots, sends nothing), 'r' rocket
   launcher (fires at one target you pick), 'F' fort (big, higher max, drops paratroopers).

   0.2.0 (Glenn): sending is free. A line emits troops at a rate set by the tower; the tower keeps its number while sending; only idle towers grow naturally and only enemy hits lower its number. Link slots: 1 below 10, 2 from 10, 3 from 30.
   0.3.0 (Glenn): gold upgrades for blue (soldier strength, tank strength, production speed, starting tower level).
   Troop strength can be fractional (a 1.15 soldier): buildings keep a fraction accumulator so the fractions add up
   (seven 1.15 hits take 8); without upgrades every number stays whole and the game plays exactly as 0.2.0.
   0.4.0 (Glenn's Phase 4): special missions and events. Draw Mode: a line can follow a path drawn with the finger
   (a polyline; troops walk it, it can go round obstacles; the computers still only use straight lines). Gates: + and
   x gates (blue, they help) turn each of your troops that walks through into several, - gates (red) take strength
   off it; they work on your troops only, and the computers don't aim for them. Events: a horde
   (owner 5, "rust bots") marching in waves from the edges at your buildings, and a giant boss citadel (type 'X') with
   a huge number that fires volleys of shells. Campaign levels have none of these and play exactly as 0.3.0. */
// 0.5.0: the whole rule book is one named function so the page can also run it in a Web Worker (built from this
// function's source; the endless levels are made and checked there without freezing the battle)
function OP_FACTORY() {
  'use strict';
  var DT = 1 / 30;          // 30 steps a second
  var W = 9, H = 17;        // the battlefield (world units)
  var CAP = 63;             // a tower's top number ("Max")
  var FORT_CAP = 99;        // a fort's top number (a level may raise it, e.g. 120)
  var SPEED = [1.45, 0.95, 2.1, 1.05]; // units a second: soldier, tank (slower), paratrooper (flies), rust bot (the horde, 0.4.0)
  var HP = [1, 2, 1, 1];    // a tank counts as 2 soldiers
  var HORDE = 5, NOWN = 6;  // owner 5: the horde of an event level (0.4.0); owners 0-5
  var BOSS_EDGE = 1.0, BOSS_CAP = 300, BOSS_GROW = 2.6; // the boss citadel: big, a huge number, grows slowly (s per +1)
  var MAXU = 1400;          // past this many troops a gate makes stronger troops instead of more (keeps the page smooth)
  var EDGE = 0.42;          // troops leave / arrive at this distance from a building's middle
  var FORT_EDGE = 0.9;      // a fort is about 4x the footprint
  var GROW_IDLE = 0.9;      // seconds per +1 for a tower with no outgoing lines (the original: idle towers level faster)
  var GROW_SEND = Infinity; // sending suspends natural growth (kept in the public rules interface)
  var SEND_LO = 0.62, SEND_HI = 0.4; // seconds between two troops on one line, at 0 and at 63 (bigger towers send faster)
  var TANK_GAP = 2.0, PARA_GAP = 1.2; // a factory sends a tank every 2 soldier-gaps (same strength per second), a fort a paratrooper every 1.2
  var CLASH = 0.16;         // two opposing troops closer than this fight
  var START_CAP = 1;        // a captured tower starts with the troop that took it
  var SNIPE_R = [2.0, 2.5, 3.0], SNIPE_GAP = [1.2, 0.95, 0.75]; // sniper range / seconds per shot below 10, 10-29, 30+
  var ROCKET_DMG = 3, ROCKET_SPEED = 5.5, ROCKET_LO = 1.5, ROCKET_HI = 0.7; // rocket: -3, flies 5.5/s, one every 1.5 s at 0 -> 0.7 s at 63 (faster than any line)
  var MINE_TRIG = 0.32, MINE_R = 0.6, MINE_RE = 12; // a mine goes off when a troop passes this close, kills troops within MINE_R, re-arms after 12 s
  var GOLD_R = 0.5, GOLD_BOOST = 15, GOLD_COIN = 10; // gold bar pick-up distance; the sender grows twice as fast for 15 s; +10 gold for you
  var BOOST = 2;            // growth speed-up while boosted
  var EPS = 1e-9;
  // gold upgrades (blue only): 20 steps per track; the cost of step k rises (60, 105, 165 ... 3,440) so an upgrade
  // costs a few levels' gold early and grows (the check bot plays with none: every level is proven without them)
  var UP_MAX = 20, UP_KEYS = ['sol', 'tank', 'prod', 'start'];
  function upCost(k) { k = Math.max(1, k | 0); return Math.round((60 + 45 * (k - 1) + 7 * (k - 1) * (k - 1)) / 5) * 5; }
  // what a track does at level k: soldiers hit for 1 + 5% a step, tanks 2 + 5% a step, production (send rate and
  // growth) +3% a step, starting towers +1 a step
  function upValue(key, k) { k = Math.max(0, Math.min(UP_MAX, k | 0)); return key === 'sol' ? 1 + 0.05 * k : key === 'tank' ? 2 * (1 + 0.05 * k) : key === 'prod' ? 1 + 0.03 * k : k; }

  function rng(seed) {
    var a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // link slots: 1 below 10, 2 from 10, 3 from 30 (the dots under the number). Snipers send nothing; a rocket launcher
  // has one target at a time.
  function slots(n, type) { if (type === 's') return 0; if (type === 'r') return 1; if (type === 'X') return 0; return n >= 30 ? 3 : n >= 10 ? 2 : 1; }
  // the number a tower needs to hold k lines (enemy hits pushing it under drop its newest lines)
  function floorFor(k) { return k >= 3 ? 30 : k >= 2 ? 10 : 0; }
  // floors drawn for a number (the tower visibly grows)
  function floors(n) { return n < 6 ? 1 : n < 14 ? 2 : n < 24 ? 3 : n < 36 ? 4 : n < 50 ? 5 : 6; }
  function band(n) { return n >= 30 ? 2 : n >= 10 ? 1 : 0; }
  function snipeRange(n) { return SNIPE_R[band(n)]; }
  function kindOf(type) { return type === 'f' ? 1 : type === 'F' ? 2 : 0; }
  function sender(type) { return type === 'b' || type === 'f' || type === 'F'; }
  // buildings whose troops walk (a drawn path makes sense for them; forts drop paratroopers, rockets fly). The boss
  // citadel ('X', 0.4.0) sends no troops: its attack is its volleys.
  function walker(type) { return type === 'b' || type === 'f'; }
  // seconds between two troops on one of this tower's lines
  // (s: the battle, for the owner's production upgrade; the checks call it without)
  function sendGap(T, s) { var g = SEND_LO - (SEND_LO - SEND_HI) * Math.min(1, T.n / CAP); g = T.type === 'f' ? g * TANK_GAP : T.type === 'F' ? g * PARA_GAP : g; return s ? g / s.prod[T.o] : g; }
  function rocketGap(T) { return ROCKET_LO - (ROCKET_LO - ROCKET_HI) * Math.min(1, T.n / CAP); }
  // troop strength a tower's line delivers per second (with the owner's upgrades when the battle is given)
  function rate(T, s) { return T.type === 'r' ? ROCKET_DMG / rocketGap(T) : (s ? s.hp[T.o][kindOf(T.type)] : HP[kindOf(T.type)]) / sendGap(T, s); }

  // ---------------- geometry ----------------
  function segDist(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - dx * t, py - ay - dy * t); }
  // where segment a->b first crosses segment c-d (0..1 along a->b), or -1
  function segCross(ax, ay, bx, by, cx, cy, dx, dy) {
    var rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy, den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) return -1;
    var t = ((cx - ax) * sy - (cy - ay) * sx) / den, u = ((cx - ax) * ry - (cy - ay) * rx) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : -1;
  }
  // where segment a->b enters an axis-aligned box (centre x, y, size w, h), 0..1, or -1 (slab method)
  function segBox(ax, ay, bx, by, x, y, w, h, pad) {
    pad = pad || 0; var x0 = x - w / 2 - pad, x1 = x + w / 2 + pad, y0 = y - h / 2 - pad, y1 = y + h / 2 + pad;
    var t0 = 0, t1 = 1, d = [bx - ax, by - ay], p = [ax, ay], lo = [x0, y0], hi = [x1, y1];
    for (var k = 0; k < 2; k++) {
      if (Math.abs(d[k]) < 1e-9) { if (p[k] < lo[k] || p[k] > hi[k]) return -1; continue; }
      var ta = (lo[k] - p[k]) / d[k], tb = (hi[k] - p[k]) / d[k]; if (ta > tb) { var q = ta; ta = tb; tb = q; }
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return -1;
    }
    return t0;
  }
  // obstacles: [kind, x, y, r] (round: rock, tree, pond, ice block, cactus) or [kind, x, y, w, h] (a box: water, lava, ice)
  function obsHit(o, ax, ay, bx, by) { return o.length >= 5 ? segBox(ax, ay, bx, by, o[1], o[2], o[3], o[4], 0.06) >= 0 : segDist(o[1], o[2], ax, ay, bx, by) < o[3] + 0.06; }

  // ---------------- a battle ----------------
  // level: { towers: [[x, y, owner, n, type?], ...], links: [[from, to], ...], ai: {...}, obs, fences, gaps, mines, bars, fortCap, cap }
  // opts.ai: { owner: params, ... } which owners the computer plays (the page: 2-4; the checks: 1 too)
  // opts.up: blue's gold upgrades { sol, tank, prod, start } (levels 0-20; none in the checks' proofs)
  function create(level, opts) {
    opts = opts || {};
    var s = { t: 0, tick: 0, towers: [], links: [], units: [], rockets: [], ev: [], nextId: 1, rng: rng(opts.seed || 12345),
      ai: {}, over: 0, paths: {}, lpaths: {}, coins: [0, 0, 0, 0, 0, 0],
      hp: [0, 1, 2, 3, 4, 5].map(function () { return HP.slice(); }), prod: [1, 1, 1, 1, 1, 1], up: null,
      obs: (level.obs || []).map(function (o) { return o.slice(); }),
      fences: (level.fences || []).map(function (f, i) { return { i: i, x: f[0], y: f[1], len: f[2], ang: f[3], hp: f[4], hp0: f[4] }; }),
      gaps: (level.gaps || []).map(function (g, i) { return { i: i, x: g[0], y: g[1], w: g[2], h: g[3], need: g[4], got: 0 }; }),
      mines: (level.mines || []).map(function (m, i) { return { i: i, x: m[0], y: m[1], armed: true, at: 0 }; }),
      bars: (level.bars || []).map(function (b, i) { return { i: i, x: b[0], y: b[1], taken: false }; }),
      // 0.4.0 gates: [x, y, width, angle, op ('add' | 'mul' | 'sub'), n]; add/mul are blue (help), sub is red (hurts)
      gates: (level.gates || []).map(function (g, i) { return { i: i, x: g[0], y: g[1], w: g[2], ang: g[3], op: g[4], n: g[5], hits: 0, by: [0, 0, 0, 0, 0, 0] }; }),
      // 0.4.0 horde: waves [start s, troops, x, y, troops a second] marching in from the edges
      horde: level.horde ? { waves: level.horde.waves.map(function (w, i) { return { i: i, t: w[0], n: w[1], x: w[2], y: w[3], rate: w[4] || 4, hp: w[5] || 1, sent: 0, acc: 0.99, on: false }; }), started: 0 } : null,
      boss: level.boss || null,
      stats: { sent: [0, 0, 0, 0, 0, 0], caps: [0, 0, 0, 0, 0, 0], lost: [0, 0, 0, 0, 0, 0], bars: [0, 0, 0, 0, 0, 0] } };
    level.towers.forEach(function (d, i) {
      var type = d[4] || 'b';
      // a level can raise the cap: forts (fortCap) or every building (cap), e.g. 120 ("some (few) levels have over 100")
      var cap = type === 'F' ? Math.max(level.fortCap || FORT_CAP, level.cap || 0) : type === 'X' ? ((level.boss && level.boss.cap) || BOSS_CAP) : (level.cap || CAP);
      var T0 = { i: i, x: d[0], y: d[1], o: d[2], n: d[3], type: type, cap: cap,
        r: type === 'F' ? FORT_EDGE : type === 'X' ? BOSS_EDGE : EDGE, g: 0, links: [], lastHit: -9, boost: 0, cd: 0.5, dacc: 0, racc: 0 };
      if (type === 'X') T0.vt = (level.boss && level.boss.first) || 10; // seconds to its first volley
      s.towers.push(T0);
    });
    if (opts.up) { setUp(s, 1, opts.up); var st = upValue('start', opts.up.start); if (st) s.towers.forEach(function (T) { if (T.o === 1) T.n = Math.min(T.cap, T.n + st); }); }
    (level.links || []).forEach(function (l) { addLink(s, l[0], l[1], true); });
    var ai = opts.ai || {};
    for (var o in ai) if (ai[o]) s.ai[o] = { P: ai[o], next: ai[o].delay || 0.5 + 0.2 * (+o) };
    return s;
  }
  // an owner's upgrades: troop strength (soldier / tank / paratrooper = soldier) and production speed. Strength and
  // speed can change mid-battle (bought on the Menu); the starting level counts only when a battle starts.
  function setUp(s, o, up) {
    up = up || {}; var sol = upValue('sol', up.sol), tank = upValue('tank', up.tank);
    s.hp[o] = [sol, tank, sol, 1]; s.prod[o] = upValue('prod', up.prod);
    if (o === 1) s.up = { sol: up.sol | 0, tank: up.tank | 0, prod: up.prod | 0, start: up.start | 0 };
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function linkFrom(s, a, b) { var L = s.towers[a].links; for (var i = 0; i < L.length; i++) if (L[i].b === b) return L[i]; return null; }
  // a straight line between two buildings is blocked by an obstacle (paratroopers and rockets fly over)
  function blocked(s, a, b) {
    var A = s.towers[a], B = s.towers[b], d = dist(A, B); if (d < 1e-6) return false;
    var ux = (B.x - A.x) / d, uy = (B.y - A.y) / d, ax = A.x + ux * A.r, ay = A.y + uy * A.r, bx = B.x - ux * B.r, by = B.y - uy * B.r;
    for (var i = 0; i < s.obs.length; i++) if (obsHit(s.obs[i], ax, ay, bx, by)) return true;
    return false;
  }
  // a drawn path (polyline from a's middle to b's middle) is blocked by an obstacle (the ends start at the buildings' edges)
  function plBlocked(s, pl, ra, rb) {
    var n = pl.length, cum = 0, tot = 0, k, i;
    for (k = 0; k + 1 < n; k++) tot += Math.hypot(pl[k + 1][0] - pl[k][0], pl[k + 1][1] - pl[k][1]);
    for (k = 0; k + 1 < n; k++) {
      var ax = pl[k][0], ay = pl[k][1], bx = pl[k + 1][0], by = pl[k + 1][1], l = Math.hypot(bx - ax, by - ay); if (l < 1e-6) continue;
      var t0 = Math.max(0, (ra - cum) / l), t1 = Math.min(1, (tot - rb - cum) / l); cum += l; if (t1 <= t0) continue;
      var x0 = ax + (bx - ax) * t0, y0 = ay + (by - ay) * t0, x1 = ax + (bx - ax) * t1, y1 = ay + (by - ay) * t1;
      for (i = 0; i < s.obs.length; i++) if (obsHit(s.obs[i], x0, y0, x1, y1)) return true;
    }
    return false;
  }
  function polyLen(pl) { var l = 0; for (var k = 0; k + 1 < pl.length; k++) l += Math.hypot(pl[k + 1][0] - pl[k][0], pl[k + 1][1] - pl[k][1]); return l; }
  var NOBLOCK = 'noblock';
  // why a new line from a to b isn't allowed for owner o ('' = fine). pl: a drawn path (0.4.0) instead of the straight line
  function whyNot(s, a, b, o, pl) {
    var A = s.towers[a]; if (!A || A.o !== o) return 'owner';
    if (a === b || !s.towers[b]) return 'same';
    if (A.type === 's') return 'sniper';
    if (A.type === 'X') return 'boss';
    if (A.type === 'r') { if (s.towers[b].o === o) return 'own'; return linkFrom(s, a, b) ? 'dup' : ''; } // retargets
    if (linkFrom(s, a, b)) return 'dup';
    if (A.links.length >= slots(A.n, A.type)) return 'slots';
    if (pl === NOBLOCK) return '';
    if (A.type !== 'F') { if (pl && walker(A.type) && pl.length > 2) { if (polyLen(pl) > 60 || plBlocked(s, pl, A.r, s.towers[b].r)) return 'blocked'; } else if (blocked(s, a, b)) return 'blocked'; }
    return '';
  }
  // pl: a drawn path for walking troops (0.4.0 Draw Mode); its ends are pinned to the two buildings' middles
  function addLink(s, a, b, free, pl) {
    var A = s.towers[a], B = s.towers[b];
    if (pl && (!walker(A.type) || pl.length <= 2)) pl = null;
    if (pl) { pl = pl.map(function (p) { return [p[0], p[1]]; }); pl[0] = [A.x, A.y]; pl[pl.length - 1] = [B.x, B.y]; }
    if (!free && whyNot(s, a, b, A.o, pl)) return null;
    var rk = A.type === 'r';
    if (rk) { while (A.links.length) cut(s, A.links[0], 'retarget'); }
    else { var rev = linkFrom(s, b, a); if (rev && rev.o === A.o && !rev.rk) cut(s, rev, 'turn'); } // your troops don't walk both ways
    var L = { id: s.nextId++, a: a, b: b, o: A.o, acc: rk ? 0.3 : 0.6, t0: s.t, len: dist(A, s.towers[b]), rk: rk, fly: A.type === 'F' };
    if (pl) { L.pl = pl; L.len = polyLen(pl); }
    A.links.push(L); s.links.push(L);
    s.ev.push({ t: 'link', a: a, b: b, o: A.o, id: L.id, rk: rk });
    return L;
  }
  function cut(s, L, why) {
    var A = s.towers[L.a], i = A.links.indexOf(L); if (i >= 0) A.links.splice(i, 1);
    i = s.links.indexOf(L); if (i >= 0) s.links.splice(i, 1);
    s.ev.push({ t: 'cut', a: L.a, b: L.b, o: L.o, id: L.id, why: why || 'cut', rk: L.rk });
  }
  function cutById(s, id) { for (var i = 0; i < s.links.length; i++) if (s.links[i].id === id) { cut(s, s.links[i], 'cut'); return true; } return false; }
  // drop the newest lines a tower can no longer hold (1 below 10, 2 below 30)
  function trim(s, T) { if (T.type === 'r') return; while (T.links.length > 1 && T.links.length > slots(T.n, T.type)) cut(s, T.links[T.links.length - 1], 'drop'); }

  // the ground path between two buildings with the map elements on it, in order (fences, gaps, mines, gold bars)
  function path(s, a, b) {
    var k = a * 1024 + b, P = s.paths[k]; if (P) return P;
    var A = s.towers[a], B = s.towers[b], len = dist(A, B), dx = (B.x - A.x) / len, dy = (B.y - A.y) / len, f = [], i, t;
    var d0 = A.r, d1 = len - B.r;
    for (i = 0; i < s.fences.length; i++) {
      var F = s.fences[i], hx = Math.cos(F.ang) * F.len / 2, hy = Math.sin(F.ang) * F.len / 2;
      t = segCross(A.x, A.y, B.x, B.y, F.x - hx, F.y - hy, F.x + hx, F.y + hy); if (t >= 0 && t * len > d0 && t * len < d1) f.push({ d: t * len - 0.12, k: 'fence', i: i });
    }
    for (i = 0; i < s.gaps.length; i++) { var G = s.gaps[i]; t = segBox(A.x, A.y, B.x, B.y, G.x, G.y, G.w, G.h, 0); if (t >= 0 && t * len < d1) f.push({ d: Math.max(d0, t * len - 0.05), k: 'gap', i: i }); }
    for (i = 0; i < s.mines.length; i++) { var M = s.mines[i], p = (M.x - A.x) * dx + (M.y - A.y) * dy; if (p > d0 && p < d1 && Math.abs((M.x - A.x) * dy - (M.y - A.y) * dx) < MINE_TRIG) f.push({ d: p, k: 'mine', i: i }); }
    for (i = 0; i < s.bars.length; i++) { var Bb = s.bars[i], q = (Bb.x - A.x) * dx + (Bb.y - A.y) * dy; if (q > d0 && q < d1 && Math.abs((Bb.x - A.x) * dy - (Bb.y - A.y) * dx) < GOLD_R) f.push({ d: q, k: 'gold', i: i }); }
    for (i = 0; i < s.gates.length; i++) { var Gt = s.gates[i], gx = Math.cos(Gt.ang) * Gt.w / 2, gy = Math.sin(Gt.ang) * Gt.w / 2; t = segCross(A.x, A.y, B.x, B.y, Gt.x - gx, Gt.y - gy, Gt.x + gx, Gt.y + gy); if (t >= 0 && t * len > d0 && t * len < d1) f.push({ d: t * len, k: 'gate', i: i }); }
    f.sort(function (x, y) { return x.d - y.d; });
    P = s.paths[k] = { len: len, dx: dx, dy: dy, d0: d0, d1: d1, f: f };
    return P;
  }
  // 0.4.0: the ground path along a polyline (a drawn path, or a horde troop's march): the map elements on it in order,
  // each element at most once (a path that crosses the same gate twice counts it once: no zig-zag multiplying)
  function polyPath(s, pts, d0, d1) {
    var cum = [0], f = [], seen = {}, k, i, t;
    for (k = 0; k + 1 < pts.length; k++) cum.push(cum[k] + Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]));
    var len = cum[cum.length - 1];
    if (d1 === undefined) d1 = len; else if (d1 < 0) d1 = len + d1;
    function add(d, kind, idx) { if (d <= d0 || d >= d1) return; var key = kind + idx; if (seen[key] !== undefined && f[seen[key]].d <= d) return; if (seen[key] !== undefined) f[seen[key]].d = d; else { seen[key] = f.length; f.push({ d: d, k: kind, i: idx }); } }
    for (k = 0; k + 1 < pts.length; k++) {
      var ax = pts[k][0], ay = pts[k][1], bx = pts[k + 1][0], by = pts[k + 1][1], l = cum[k + 1] - cum[k], c = cum[k]; if (l < 1e-9) continue;
      var dx = (bx - ax) / l, dy = (by - ay) / l;
      for (i = 0; i < s.fences.length; i++) { var F = s.fences[i], hx = Math.cos(F.ang) * F.len / 2, hy = Math.sin(F.ang) * F.len / 2; t = segCross(ax, ay, bx, by, F.x - hx, F.y - hy, F.x + hx, F.y + hy); if (t >= 0) add(c + t * l - 0.12, 'fence', i); }
      for (i = 0; i < s.gaps.length; i++) { var G = s.gaps[i]; t = segBox(ax, ay, bx, by, G.x, G.y, G.w, G.h, 0); if (t >= 0) add(Math.max(d0 + 1e-6, c + t * l - 0.05), 'gap', i); }
      for (i = 0; i < s.mines.length; i++) { var M = s.mines[i], p = Math.max(0, Math.min(l, (M.x - ax) * dx + (M.y - ay) * dy)); if (Math.hypot(ax + dx * p - M.x, ay + dy * p - M.y) < MINE_TRIG) add(c + p, 'mine', i); }
      for (i = 0; i < s.bars.length; i++) { var Bb = s.bars[i], q = Math.max(0, Math.min(l, (Bb.x - ax) * dx + (Bb.y - ay) * dy)); if (Math.hypot(ax + dx * q - Bb.x, ay + dy * q - Bb.y) < GOLD_R) add(c + q, 'gold', i); }
      for (i = 0; i < s.gates.length; i++) { var Gt = s.gates[i], gx = Math.cos(Gt.ang) * Gt.w / 2, gy = Math.sin(Gt.ang) * Gt.w / 2; t = segCross(ax, ay, bx, by, Gt.x - gx, Gt.y - gy, Gt.x + gx, Gt.y + gy); if (t >= 0) add(c + t * l, 'gate', i); }
    }
    f.sort(function (x, y) { return x.d - y.d; });
    return { len: len, pts: pts, cum: cum, d0: d0, d1: d1, f: f };
  }
  // a line's path: straight, or its drawn path (cached per line)
  function linkPath(s, L) {
    if (!L.pl) return path(s, L.a, L.b);
    var P = s.lpaths[L.id]; if (P) return P;
    return (s.lpaths[L.id] = polyPath(s, L.pl, s.towers[L.a].r, -s.towers[L.b].r));
  }
  // a troop on a polyline keeps ax/ay/dx/dy for its current piece so that (ax + dx * d, ay + dy * d) is its spot:
  // everything that places a troop (snipers, mines, fights, drawing) works the same on straight and drawn paths
  function setSeg(u) {
    var P = u.pl, k = u.seg, a = P.pts[k], b = P.pts[k + 1], l = Math.max(1e-9, P.cum[k + 1] - P.cum[k]);
    u.dx = (b[0] - a[0]) / l; u.dy = (b[1] - a[1]) / l; u.ax = a[0] - u.dx * P.cum[k]; u.ay = a[1] - u.dy * P.cum[k];
  }
  function segAdv(u) { var c = u.pl.cum, k0 = u.seg; while (u.seg < c.length - 2 && u.d > c[u.seg + 1]) u.seg++; if (u.seg !== k0) setSeg(u); }
  var NOFEAT = [];
  function spawn(s, L, T) {
    var P = L.pl ? linkPath(s, L) : path(s, L.a, L.b), k = kindOf(T.type);
    var u = { id: s.nextId++, o: L.o, k: k, hp: s.hp[L.o][k], a: L.a, b: L.b, ax: T.x, ay: T.y, dx: P.dx, dy: P.dy, len: P.len, d: P.d0, end: P.d1,
      f: k === 2 ? NOFEAT : P.f, fi: 0, dead: false };
    if (P.cum) { u.pl = P; u.seg = 0; setSeg(u); segAdv(u); }
    s.units.push(u);
    s.stats.sent[L.o]++;
  }
  // ---------------- 0.4.0 events: the horde and the boss ----------------
  // a horde troop marches from a point on the edge straight at the nearest blue building (any other if blue has none)
  function hordeUnit(s, w) {
    var best = null, bd = 1e9, i, T, pass;
    for (pass = 0; pass < 2 && !best; pass++) for (i = 0; i < s.towers.length; i++) { T = s.towers[i]; if (T.o === HORDE || (pass === 0 && T.o !== 1)) continue; var d = Math.hypot(T.x - w.x, T.y - w.y); if (d < bd) { bd = d; best = T; } }
    if (!best) return;
    var x = w.x + (s.rng() - 0.5) * 0.7, y = w.y + (s.rng() - 0.5) * 0.7, pts = [[x, y], [best.x, best.y]];
    var P = polyPath(s, pts, 0, -best.r);
    var u = { id: s.nextId++, o: HORDE, k: 3, hp: w.hp || 1, big: (w.hp || 1) > 1, a: -1, b: best.i, ax: x, ay: y, dx: 0, dy: 0, len: P.len, d: 0, end: P.d1, f: P.f, fi: 0, dead: false, pl: P, seg: 0 };
    setSeg(u); s.units.push(u); s.stats.sent[HORDE]++;
  }
  function hordeStep(s) {
    var H = s.horde;
    for (var i = 0; i < H.waves.length; i++) {
      var w = H.waves[i]; if (w.sent >= w.n) continue;
      if (!w.warned && s.t >= w.t - 3) { w.warned = true; s.ev.push({ t: 'hwarn', i: i, x: w.x, y: w.y }); }
      if (s.t < w.t) continue;
      if (!w.on) { w.on = true; H.started++; s.ev.push({ t: 'wave', i: i, n: H.started, of: H.waves.length, x: w.x, y: w.y }); }
      w.acc += DT * w.rate;
      while (w.acc >= 1 && w.sent < w.n) { w.acc -= 1; w.sent++; hordeUnit(s, w); }
    }
  }
  // every wave has marched in and no horde troop is left on the field
  function hordeDone(s) {
    var H = s.horde; if (!H) return true;
    for (var i = 0; i < H.waves.length; i++) if (H.waves[i].sent < H.waves[i].n) return false;
    for (i = 0; i < s.units.length; i++) if (s.units[i].o === HORDE && !s.units[i].dead) return false;
    return true;
  }
  // the boss citadel fires a volley of shells at the buildings of other colours (gray ones are left alone); each shell
  // takes dmg off the building it lands on (never captures) and knocks out the troops close by. The landing spots show a
  // warning ring while the shells fly (the page draws it), and it fires faster once it's down to a third.
  function volley(s, T) {
    var B = s.boss || {}, tg = [], i;
    for (i = 0; i < s.towers.length; i++) { var X = s.towers[i]; if (X.o && X.o !== T.o) tg.push(X); }
    T.vt = (B.every || 8) * (T.n < T.cap / 3 ? 0.7 : 1);
    if (!tg.length) return;
    s.ev.push({ t: 'volley', i: T.i, o: T.o });
    for (var k = 0; k < (B.shots || 3); k++) {
      var Y = tg[Math.floor(s.rng() * tg.length)], x1 = Y.x + (s.rng() - 0.5) * 0.5, y1 = Y.y + (s.rng() - 0.5) * 0.5, dur = (B.fly || 1.8) + k * 0.18;
      s.rockets.push({ id: s.nextId++, o: T.o, a: T.i, b: Y.i, x0: T.x, y0: T.y, x1: x1, y1: y1, t: 0, dur: dur, boss: 1, dmg: B.dmg || 4, aoe: 0.8 });
      s.ev.push({ t: 'warn', x: x1, y: y1, dur: dur, i: Y.i });
    }
  }
  function fire(s, L, T) {
    var B = s.towers[L.b], d = dist(T, B);
    s.rockets.push({ id: s.nextId++, o: L.o, a: L.a, b: L.b, x0: T.x, y0: T.y, x1: B.x, y1: B.y, t: 0, dur: 0.25 + d / ROCKET_SPEED });
    s.ev.push({ t: 'rocket', i: T.i, b: L.b, o: L.o });
  }
  function capture(s, T, o) {
    var from = T.o, i;
    for (i = T.links.length - 1; i >= 0; i--) cut(s, T.links[i], 'lost');
    T.o = o; T.n = START_CAP; T.g = 0; T.boost = 0; T.cd = 0.8; T.dacc = 0; T.racc = 0;
    // rocket launchers of the new owner stop firing at it
    for (i = s.links.length - 1; i >= 0; i--) { var L = s.links[i]; if (L.rk && L.b === T.i && L.o === o) cut(s, L, 'done'); }
    s.stats.caps[o]++; if (from) s.stats.lost[from]++;
    s.ev.push({ t: 'cap', i: T.i, from: from, o: o });
  }
  function levelEv(s, T, n0) { if (floors(T.n) > floors(n0) || (n0 < 10 && T.n >= 10) || (n0 < 30 && T.n >= 30)) s.ev.push({ t: 'lvl', i: T.i }); }
  // strength v hits a building: at 0 (or below) it is captured by the attacker. Fractions (upgraded troops) add up in
  // dacc until they make a whole troop.
  function damage(s, T, v, o, x, y) {
    T.dacc += v; var w = Math.floor(T.dacc + EPS); T.dacc = Math.max(0, T.dacc - w);
    T.n -= w; T.lastHit = s.t;
    s.ev.push({ t: 'hit', i: T.i, o: o, x: x, y: y });
    if (T.n <= 0) capture(s, T, o); else trim(s, T);
  }
  function arrive(s, u) {
    var T = s.towers[u.b];
    if (T.o === u.o) {
      T.racc += u.hp; var w = Math.floor(T.racc + EPS); T.racc = Math.max(0, T.racc - w);
      if (T.n < T.cap && w) { var n0 = T.n; T.n = Math.min(T.cap, T.n + w); levelEv(s, T, n0); } s.ev.push({ t: 'reinf', i: T.i, o: u.o }); return;
    }
    damage(s, T, u.hp, u.o, T.x - u.dx * T.r, T.y - u.dy * T.r);
  }
  function kill(s, u, why) { u.dead = true; s.ev.push({ t: 'die', x: u.ax + u.dx * u.d, y: u.ay + u.dy * u.d, o: u.o, k: u.k, why: why }); }
  // a mine goes off: every ground troop close to it falls
  function boom(s, M) {
    M.armed = false; M.at = s.t + MINE_RE;
    s.ev.push({ t: 'boom', i: M.i, x: M.x, y: M.y });
    for (var j = 0; j < s.units.length; j++) { var v = s.units[j]; if (v.dead || v.k === 2) continue; if (Math.hypot(v.ax + v.dx * v.d - M.x, v.ay + v.dy * v.d - M.y) < MINE_R) kill(s, v, 'mine'); }
  }
  // the map elements a troop reaches as it walks
  function features(s, u) {
    var f = u.f;
    while (u.fi < f.length && u.d >= f[u.fi].d) {
      var F = f[u.fi], x = u.ax + u.dx * F.d, y = u.ay + u.dy * F.d;
      if (F.k === 'fence') {
        var fe = s.fences[F.i];
        if (fe.hp > EPS) { var dm = Math.min(u.hp, fe.hp); fe.hp -= dm; u.hp -= dm; s.ev.push({ t: 'fhit', i: F.i, x: x, y: y, o: u.o }); if (fe.hp <= EPS) { fe.hp = 0; s.ev.push({ t: 'fbreak', i: F.i }); } if (u.hp <= EPS) { u.dead = true; return; } }
      } else if (F.k === 'gap') {
        var G = s.gaps[F.i];
        if (G.got < G.need - EPS) { var add = Math.min(u.hp, G.need - G.got); G.got += add; u.hp -= add; s.ev.push({ t: 'build', i: F.i, o: u.o, x: x, y: y }); if (G.got >= G.need - EPS) { G.got = G.need; s.ev.push({ t: 'bridge', i: F.i }); } if (u.hp <= EPS) { u.dead = true; return; } }
      } else if (F.k === 'mine') {
        var M = s.mines[F.i]; if (M.armed) { boom(s, M); if (u.dead) return; }
      } else if (F.k === 'gold') {
        var Bb = s.bars[F.i];
        if (!Bb.taken) { Bb.taken = true; var S = s.towers[u.a]; if (S && S.o === u.o) S.boost = s.t + GOLD_BOOST; s.coins[u.o] += GOLD_COIN; s.stats.bars[u.o]++; s.ev.push({ t: 'gold', i: F.i, o: u.o, src: u.a }); }
      } else if (F.k === 'gate') {
        // a gate (it works on your troops only: blue gates help you, red ones hurt you; the computers' troops walk
        // through unchanged): + n turns the troop into 1 + n, x n into n (the new ones walk on right behind it); - n takes
        // n strength off it (a soldier through -1 or more is gone)
        var Gt = s.gates[F.i]; Gt.hits++; Gt.by[u.o]++;
        if (u.o !== 1) { /* not your troop: it walks through unchanged */ }
        else if (Gt.op === 'sub') {
          u.hp -= Gt.n; s.ev.push({ t: 'gate', i: F.i, o: u.o, x: x, y: y, n: -Gt.n });
          if (u.hp <= EPS) { kill(s, u, 'gate'); return; }
        } else {
          var extra = Gt.op === 'add' ? Gt.n : Gt.n - 1;
          if (extra > 0) {
            if (s.units.length + extra > MAXU) u.hp *= extra + 1; // a crowded field: one stronger troop instead of more
            else for (var c = 0; c < extra; c++) { var v = {}; for (var key in u) v[key] = u[key]; v.id = s.nextId++; v.d = u.d - 0.07 * (c + 1); v.fi = u.fi + 1; s.units.push(v); }
          }
          s.ev.push({ t: 'gate', i: F.i, o: u.o, x: x, y: y, n: extra });
        }
      }
      u.fi++;
    }
  }
  // snipers shoot a random enemy troop inside their circle
  function snipe(s, T) {
    T.cd -= DT; if (T.cd > 0) return;
    var R = snipeRange(T.n), c = [], i;
    for (i = 0; i < s.units.length; i++) { var u = s.units[i]; if (u.dead || u.o === T.o) continue; if (Math.hypot(u.ax + u.dx * u.d - T.x, u.ay + u.dy * u.d - T.y) < R) c.push(u); }
    if (!c.length) { T.cd = 0.1; return; }
    var v = c[Math.floor(s.rng() * c.length)]; v.hp--;
    s.ev.push({ t: 'shot', i: T.i, o: T.o, x: v.ax + v.dx * v.d, y: v.ay + v.dy * v.d, k: v.k });
    if (v.hp <= EPS) kill(s, v, 'shot');
    T.cd = SNIPE_GAP[band(T.n)];
  }

  function step(s) {
    var i, j, T, L, u;
    s.t += DT; s.tick++;
    // computer players think
    for (var o in s.ai) { var A = s.ai[o]; if (s.t >= A.next) { A.next = s.t + A.P.think * (0.85 + 0.3 * s.rng()); think(s, +o, A.P); } }
    // mines re-arm
    for (i = 0; i < s.mines.length; i++) { var M = s.mines[i]; if (!M.armed && s.t >= M.at) { M.armed = true; s.ev.push({ t: 'arm', i: i }); } }
    // the horde marches in (event levels)
    if (s.horde) hordeStep(s);
    // growth, sending (free: the tower keeps its number), rockets, snipers
    for (i = 0; i < s.towers.length; i++) {
      T = s.towers[i]; if (!T.o) continue; // gray buildings never grow, send or shoot
      var busy = T.links.length > 0;
      if (T.type === 'X') { T.g += DT / BOSS_GROW * s.prod[T.o]; T.vt -= DT; if (T.vt <= 0) volley(s, T); } // the boss grows slowly and fires volleys
      else if (!busy) T.g += DT / GROW_IDLE * (T.boost > s.t ? BOOST : 1) * s.prod[T.o];
      if (!busy && T.g >= 1) { T.g -= 1; if (T.n < T.cap) { var n0 = T.n; T.n++; levelEv(s, T, n0); } else T.g = 0; }
      if (T.type === 's') { snipe(s, T); continue; }
      var gap = T.type === 'r' ? rocketGap(T) : sendGap(T, s);
      for (j = 0; j < T.links.length; j++) {
        L = T.links[j]; L.acc += DT / gap;
        if (L.acc >= 1) { L.acc -= 1; if (L.rk) fire(s, L, T); else { spawn(s, L, T); s.ev.push({ t: 'send', i: i, o: T.o, k: kindOf(T.type) }); } }
      }
    }
    // rockets fly
    if (s.rockets.length) {
      var rk = [];
      for (i = 0; i < s.rockets.length; i++) {
        var r = s.rockets[i]; r.t += DT;
        if (r.t < r.dur) { rk.push(r); continue; }
        T = s.towers[r.b];
        if (r.boss) { shell(s, r, T); continue; }
        s.ev.push({ t: 'rhit', i: r.b, o: r.o, x: T.x, y: T.y });
        if (T.o !== r.o && T.n > 0) { T.n = Math.max(0, T.n - ROCKET_DMG); T.lastHit = s.t; trim(s, T); } // rockets wear it down; troops take it
      }
      s.rockets = rk;
    }
    // walking and the map elements on the way
    for (i = 0; i < s.units.length; i++) { u = s.units[i]; if (u.dead) continue; u.d += SPEED[u.k] * DT; if (u.pl) segAdv(u); if (u.fi < u.f.length) features(s, u); }
    // troops meeting head-on on the same line fight (strength against strength)
    clashes(s);
    // arriving
    var keep = [];
    for (i = 0; i < s.units.length; i++) { u = s.units[i]; if (u.dead) continue; if (u.d >= u.end) arrive(s, u); else keep.push(u); }
    s.units = keep;
    // over?
    if (!s.over) {
      var blue = 0, other = 0, blueU = 0;
      for (i = 0; i < s.towers.length; i++) { if (s.towers[i].o === 1) blue++; else other++; }
      for (i = 0; i < s.units.length; i++) if (s.units[i].o === 1) blueU++;
      if (!other) { if (!s.horde || hordeDone(s)) s.over = 1; } // an event level is won once the horde is beaten too
      else if (!blue && !blueU) s.over = 2;
    }
  }
  function clashes(s) {
    var pairs = {}, i, u, k, any = false;
    var free = null;
    for (i = 0; i < s.units.length; i++) {
      u = s.units[i]; if (u.dead || u.k === 2) continue; // paratroopers fly over the fights
      if (u.pl) { (free || (free = [])).push(u); continue; } // drawn paths and the horde: fights by where they are (below)
      var lo = u.a < u.b ? u.a : u.b, hi = u.a < u.b ? u.b : u.a;
      k = lo * 1024 + hi; var P = pairs[k]; if (!P) P = pairs[k] = { up: [], dn: [], lo: lo, hi: hi };
      if (u.a === lo) { u.p = u.d; P.up.push(u); } else { u.p = u.len - u.d; P.dn.push(u); any = true; }
    }
    if (free) freeClash(s, free);
    if (!any) return;
    for (k in pairs) {
      var Q = pairs[k]; if (!Q.up.length || !Q.dn.length) continue;
      Q.up.sort(function (a, b) { return b.p - a.p; }); Q.dn.sort(function (a, b) { return a.p - b.p; });
      for (i = 0; i < Q.up.length; i++) {
        var a = Q.up[i];
        for (var j = 0; j < Q.dn.length && !a.dead; j++) {
          var b = Q.dn[j]; if (b.dead || b.o === a.o) continue;
          if (b.p > a.p + CLASH) break; // the nearest enemy coming the other way isn't here yet
          var dm = Math.min(a.hp, b.hp); a.hp -= dm; b.hp -= dm;
          s.ev.push({ t: 'clash', x: a.ax + a.dx * a.d, y: a.ay + a.dy * a.d, a: a.o, b: b.o, lo: Q.lo, hi: Q.hi, p: (a.p + b.p) / 2 });
          if (a.hp <= EPS) a.dead = true; if (b.hp <= EPS) b.dead = true;
        }
      }
    }
  }
  // 0.4.0: troops on drawn paths fight enemy troops they meet head on (close, coming the other way); the horde's rust
  // bots fight any enemy troop they bump into
  var MEET = 0.3;
  function freeClash(s, free) {
    var U = s.units, i, j;
    for (i = 0; i < free.length; i++) {
      var a = free[i]; if (a.dead) continue;
      var ax = a.ax + a.dx * a.d, ay = a.ay + a.dy * a.d;
      for (j = 0; j < U.length && !a.dead; j++) {
        var b = U[j]; if (b === a || b.dead || b.k === 2 || b.o === a.o) continue;
        var bx = b.ax + b.dx * b.d - ax, by = b.ay + b.dy * b.d - ay; if (bx * bx + by * by > MEET * MEET) continue;
        if (a.o !== HORDE && b.o !== HORDE && a.dx * b.dx + a.dy * b.dy > -0.3) continue; // crossing paths pass each other
        var dm = Math.min(a.hp, b.hp); a.hp -= dm; b.hp -= dm;
        s.ev.push({ t: 'clash', x: ax, y: ay, a: a.o, b: b.o, lo: -1, hi: -1, p: 0 });
        if (a.hp <= EPS) a.dead = true; if (b.hp <= EPS) b.dead = true;
      }
    }
  }
  // a boss shell lands: damage on the building (down to 0, never a capture) and the troops close by are knocked out
  function shell(s, r, T) {
    s.ev.push({ t: 'shell', i: r.b, o: r.o, x: r.x1, y: r.y1 });
    if (T.o && T.o !== r.o && T.n > 0) { T.n = Math.max(0, T.n - r.dmg); T.lastHit = s.t; trim(s, T); s.ev.push({ t: 'hit', i: T.i, o: r.o, x: T.x, y: T.y }); }
    for (var j = 0; j < s.units.length; j++) { var v = s.units[j]; if (v.dead || v.k === 2 || v.o === r.o) continue; if (Math.hypot(v.ax + v.dx * v.d - r.x1, v.ay + v.dy * v.d - r.y1) < r.aoe) kill(s, v, 'shell'); }
  }
  function takeEvents(s) { var e = s.ev; s.ev = []; return e; }
  // each colour's strength (buildings + troops on the way) for the bar at the top
  function strength(s) {
    var v = [0, 0, 0, 0, 0, 0], i;
    for (i = 0; i < s.towers.length; i++) v[s.towers[i].o] += s.towers[i].n;
    for (i = 0; i < s.units.length; i++) v[s.units[i].o] += s.units[i].hp;
    return v;
  }

  // ---------------- 0.4.0 Draw Mode: a finger path -> a clean polyline ----------------
  function rdp(pts, eps) {
    if (pts.length < 3) return pts.slice();
    var keep = [], st = [[0, pts.length - 1]], i; for (i = 0; i < pts.length; i++) keep.push(i === 0 || i === pts.length - 1);
    while (st.length) {
      var r = st.pop(), a = r[0], b = r[1], best = -1, bd = eps;
      for (i = a + 1; i < b; i++) { var d = segDist(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1]); if (d > bd) { bd = d; best = i; } }
      if (best >= 0) { keep[best] = true; st.push([a, best]); st.push([best, b]); }
    }
    return pts.filter(function (p, k) { return keep[k]; });
  }
  function chaikin(pts) {
    var out = [pts[0]];
    for (var i = 0; i + 1 < pts.length; i++) { var a = pts[i], b = pts[i + 1]; out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]); out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    out.push(pts[pts.length - 1]); return out;
  }
  // the path a finger drew from building a to building b (ground points): simplified, smoothed (corners rounded),
  // pinned to the two buildings' middles. null: it's (nearly) straight, so it's a plain straight line.
  function drawPath(s, a, b, raw) {
    var A = s.towers[a], B = s.towers[b], pts = [[A.x, A.y]];
    (raw || []).forEach(function (p) { if (Math.hypot(p[0] - A.x, p[1] - A.y) > A.r + 0.15 && Math.hypot(p[0] - B.x, p[1] - B.y) > B.r + 0.15) pts.push([p[0], p[1]]); });
    pts.push([B.x, B.y]);
    var r1 = rdp(pts, 0.14); if (r1.length <= 2) return null;
    var sm = rdp(chaikin(chaikin(r1)), 0.03); if (sm.length > 40) sm = rdp(sm, 0.08);
    if (plBlocked(s, sm, A.r, B.r) && !plBlocked(s, r1, A.r, B.r)) sm = r1; // smoothing must not cut into a rock the finger went round
    return sm.map(function (p) { return [+p[0].toFixed(3), +p[1].toFixed(3)]; });
  }

  // ---------------- 0.4.0: the checks' player draws detours and uses gates ----------------
  // Only the checks' blue player (P.draw / P.gates) uses this; the computers keep straight lines and ignore gates, as in
  // the original. A grid search (cells of 0.25) finds a way round obstacles, mines, red gates and enemy sniper circles,
  // or through a blue gate; the cell path is pulled tight into a few straight pieces.
  var CELL = 0.25;
  function grid(s) {
    if (s.grid) return s.grid;
    var nx = Math.floor(W / CELL) + 1, ny = Math.floor(H / CELL) + 1, N = nx * ny, blk = new Uint8Array(N), cost = new Float32Array(N), i, j, k;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var x = i * CELL, y = j * CELL, c = j * nx + i, b = x < 0.2 || x > W - 0.2 || y < 0.3 || y > H - 0.3, q = 1;
      for (k = 0; k < s.obs.length && !b; k++) { var o = s.obs[k]; if (o.length >= 5 ? Math.abs(x - o[1]) < o[3] / 2 + 0.2 && Math.abs(y - o[2]) < o[4] / 2 + 0.2 : Math.hypot(x - o[1], y - o[2]) < o[3] + 0.2) b = true; }
      for (k = 0; k < s.towers.length && !b; k++) if (Math.hypot(x - s.towers[k].x, y - s.towers[k].y) < s.towers[k].r + 0.15) b = 2 + k;
      for (k = 0; k < s.gates.length && !b; k++) { var G = s.gates[k], gx = Math.cos(G.ang) * G.w / 2, gy = Math.sin(G.ang) * G.w / 2; if (G.op === 'sub' && segDist(x, y, G.x - gx, G.y - gy, G.x + gx, G.y + gy) < 0.3) b = true; }
      for (k = 0; k < s.mines.length; k++) if (Math.hypot(x - s.mines[k].x, y - s.mines[k].y) < 0.6) q += 8;
      for (k = 0; k < s.fences.length; k++) { var F = s.fences[k], hx = Math.cos(F.ang) * F.len / 2, hy = Math.sin(F.ang) * F.len / 2; if (segDist(x, y, F.x - hx, F.y - hy, F.x + hx, F.y + hy) < 0.3) q += 5; }
      blk[c] = b === true ? 1 : b ? b : 0; cost[c] = q;
    }
    return (s.grid = { nx: nx, ny: ny, blk: blk, cost: cost });
  }
  // the enemy sniper towers (for owner o) as [x, y, range]
  function foeSnipers(s, o) { var r = []; s.towers.forEach(function (T) { if (T.type === 's' && T.o && T.o !== o) r.push([T.x, T.y, snipeRange(T.n) + 0.15]); }); return r; }
  // grid search from point p to point q; a and b: buildings whose ground is walkable (the ends)
  function astar(s, p, q, a, b, sn) {
    var G = grid(s), nx = G.nx, ny = G.ny, N = nx * ny;
    var ci = function (x, y) { return Math.max(0, Math.min(ny - 1, Math.round(y / CELL))) * nx + Math.max(0, Math.min(nx - 1, Math.round(x / CELL))); };
    var open = function (c) { var v = G.blk[c]; return !v || v === 2 + a || v === 2 + b; };
    var s0 = ci(p[0], p[1]), t0 = ci(q[0], q[1]); if (!open(s0) || !open(t0)) { if (G.blk[s0] === 1 || G.blk[t0] === 1) return null; }
    var gs = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), done = new Uint8Array(N), heap = [], hf = [];
    var tx = t0 % nx, ty = (t0 / nx) | 0;
    function h(c) { var dx = Math.abs(c % nx - tx), dy = Math.abs(((c / nx) | 0) - ty); return (dx + dy + (1.4142 - 2) * Math.min(dx, dy)); }
    function push(c, f) { heap.push(c); hf.push(f); var k = heap.length - 1; while (k) { var pa = (k - 1) >> 1; if (hf[pa] <= hf[k]) break; var tc = heap[pa]; heap[pa] = heap[k]; heap[k] = tc; var tf = hf[pa]; hf[pa] = hf[k]; hf[k] = tf; k = pa; } }
    function pop() { var top = heap[0], lc = heap.pop(), lf = hf.pop(); if (heap.length) { heap[0] = lc; hf[0] = lf; var k = 0; for (;;) { var l = 2 * k + 1, r = l + 1, m = k; if (l < heap.length && hf[l] < hf[m]) m = l; if (r < heap.length && hf[r] < hf[m]) m = r; if (m === k) break; var tc = heap[m]; heap[m] = heap[k]; heap[k] = tc; var tf = hf[m]; hf[m] = hf[k]; hf[k] = tf; k = m; } } return top; }
    function extra(c) { if (!sn.length) return 0; var x = (c % nx) * CELL, y = ((c / nx) | 0) * CELL, e = 0; for (var k = 0; k < sn.length; k++) if (Math.hypot(x - sn[k][0], y - sn[k][1]) < sn[k][2]) e += 2.5; return e; }
    gs[s0] = 0; push(s0, h(s0));
    while (heap.length) {
      var c = pop(); if (done[c]) continue; done[c] = 1; if (c === t0) break;
      var cx = c % nx, cy = (c / nx) | 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; var x2 = cx + dx, y2 = cy + dy; if (x2 < 0 || y2 < 0 || x2 >= nx || y2 >= ny) continue;
        var c2 = y2 * nx + x2; if (done[c2] || !open(c2)) continue;
        if (dx && dy && (!open(cy * nx + x2) || !open(y2 * nx + cx))) continue; // no cutting corners
        var g2 = gs[c] + (dx && dy ? 1.4142 : 1) * (G.cost[c2] + extra(c2));
        if (g2 < gs[c2]) { gs[c2] = g2; from[c2] = c; push(c2, g2 + h(c2)); }
      }
    }
    if (from[t0] < 0 && s0 !== t0) return null;
    var cells = []; for (var c3 = t0; c3 >= 0; c3 = from[c3]) { cells.push([(c3 % nx) * CELL, ((c3 / nx) | 0) * CELL]); if (c3 === s0) break; }
    cells.reverse(); cells[0] = [p[0], p[1]]; cells[cells.length - 1] = [q[0], q[1]];
    return cells;
  }
  // pull a cell path tight: straight pieces that keep clear of obstacles, other buildings, mines, red gates and fences,
  // and don't enter an enemy sniper circle the cell path stayed out of
  function pull(s, cells, a, b, sn) {
    var inS = cells.map(function (p) { var m = 0; for (var k = 0; k < sn.length; k++) if (Math.hypot(p[0] - sn[k][0], p[1] - sn[k][1]) < sn[k][2]) m |= 1 << k; return m; });
    function vis(i, j) {
      var p = cells[i], q = cells[j], k, ok = 0;
      for (k = i; k <= j; k++) ok |= inS[k];
      for (k = 0; k < sn.length; k++) if (!(ok & (1 << k)) && segDist(sn[k][0], sn[k][1], p[0], p[1], q[0], q[1]) < sn[k][2]) return false;
      for (k = 0; k < s.obs.length; k++) { var o = s.obs[k]; if (o.length >= 5 ? segBox(p[0], p[1], q[0], q[1], o[1], o[2], o[3], o[4], 0.14) >= 0 : segDist(o[1], o[2], p[0], p[1], q[0], q[1]) < o[3] + 0.14) return false; }
      for (k = 0; k < s.towers.length; k++) if (k !== a && k !== b && segDist(s.towers[k].x, s.towers[k].y, p[0], p[1], q[0], q[1]) < s.towers[k].r + 0.1) return false;
      for (k = 0; k < s.mines.length; k++) if (segDist(s.mines[k].x, s.mines[k].y, p[0], p[1], q[0], q[1]) < 0.5) return false;
      for (k = 0; k < s.gates.length; k++) { var G = s.gates[k]; if (G.op !== 'sub') continue; var gx = Math.cos(G.ang) * G.w / 2, gy = Math.sin(G.ang) * G.w / 2; if (segCross(p[0], p[1], q[0], q[1], G.x - gx - 0.2 * Math.cos(G.ang), G.y - gy - 0.2 * Math.sin(G.ang), G.x + gx + 0.2 * Math.cos(G.ang), G.y + gy + 0.2 * Math.sin(G.ang)) >= 0) return false; }
      for (k = 0; k < s.fences.length; k++) { var F = s.fences[k], hx = Math.cos(F.ang) * F.len / 2, hy = Math.sin(F.ang) * F.len / 2; if (segCross(p[0], p[1], q[0], q[1], F.x - hx, F.y - hy, F.x + hx, F.y + hy) >= 0) return false; }
      return true;
    }
    var out = [cells[0]], i = 0, last = cells.length - 1;
    while (i < last) { var j = last; while (j > i + 1 && !vis(i, j)) j--; out.push(cells[j]); i = j; }
    return out;
  }
  // a way from building a to b round what's in the way (optionally through gate g); null if none or it's just straight
  function detour(s, a, b, g, sn) {
    var A = s.towers[a], B = s.towers[b], pa = [A.x, A.y], pb = [B.x, B.y], pts;
    if (!g) { var c = astar(s, pa, pb, a, b, sn); if (!c) return null; pts = pull(s, c, a, b, sn); }
    else {
      var nxx = -Math.sin(g.ang) * 0.45, nyy = Math.cos(g.ang) * 0.45, e1 = [g.x - nxx, g.y - nyy], e2 = [g.x + nxx, g.y + nyy];
      if (Math.hypot(e2[0] - A.x, e2[1] - A.y) < Math.hypot(e1[0] - A.x, e1[1] - A.y)) { var t = e1; e1 = e2; e2 = t; }
      var c1 = astar(s, pa, e1, a, b, sn), c2 = c1 && astar(s, e2, pb, a, b, sn); if (!c1 || !c2) return null;
      pts = pull(s, c1, a, b, sn).concat(pull(s, c2, a, b, sn));
    }
    if (pts.length <= 2 || plBlocked(s, pts, A.r, B.r) || polyLen(pts) > 60) return null;
    return pts;
  }
  // the route kit for one think of a player that draws (P.draw) and / or aims for gates (P.gates)
  function routeKit(s, o, P) {
    var T = s.towers, sn = foeSnipers(s, o), sig = sn.map(function (x) { return x.join(','); }).join(';') + (P.draw ? 'd' : '') + (P.gates ? 'g' : '');
    var cache = s.rgeo || (s.rgeo = {}), geo = cache[sig] || (cache[sig] = {}), memo = {};
    function geos(a, b) {
      var key = a * 1024 + b; if (geo[key]) return geo[key];
      var A = T[a], c = [];
      if (A.type === 'F' || A.type === 'r' || !walker(A.type)) c.push(null);
      else {
        if (!blocked(s, a, b)) c.push(null);
        if (P.draw) {
          var d = detour(s, a, b, null, sn); if (d) c.push(d);
          if (P.gates) for (var k = 0; k < s.gates.length; k++) if (s.gates[k].op !== 'sub') { var v = detour(s, a, b, s.gates[k], sn); if (v) c.push(v); }
        }
      }
      return (geo[key] = c);
    }
    function evalG(a, b, pl) {
      var S = T[a], B = T[b], once = 0, per = 0, mult = 1, kd = kindOf(S.type), hp = HP[kd], k;
      if (S.type !== 'F' && S.type !== 'r') {
        var Pp = pl ? (pl._P || (pl._P = polyPath(s, pl, S.r, -B.r))) : path(s, a, b);
        for (k = 0; k < Pp.f.length; k++) {
          var F = Pp.f[k];
          if (F.k === 'fence') once += Math.max(0, s.fences[F.i].hp); else if (F.k === 'gap') once += s.gaps[F.i].need - s.gaps[F.i].got;
          else if (F.k === 'mine') { once += s.mines[F.i].armed ? 2 : 0; per += 0.12; }
          else if (F.k === 'gate' && P.gates) { var G = s.gates[F.i]; if (G.op === 'add') mult *= 1 + G.n; else if (G.op === 'mul') mult *= G.n; else { mult *= Math.max(0, hp - G.n) / hp; hp = Math.max(0, hp - G.n); } }
        }
      }
      var len = pl ? polyLen(pl) : dist(S, B);
      for (k = 0; k < T.length; k++) {
        var Sn = T[k]; if (Sn.type !== 's' || !Sn.o || Sn.o === o || S.type === 'r') continue;
        var R = snipeRange(Sn.n), near = false;
        if (pl) { for (var q = 0; q + 1 < pl.length && !near; q++) if (segDist(Sn.x, Sn.y, pl[q][0], pl[q][1], pl[q + 1][0], pl[q + 1][1]) < R) near = true; }
        else near = segDist(Sn.x, Sn.y, S.x, S.y, B.x, B.y) < R;
        if (near) per += 0.7 / SNIPE_GAP[band(Sn.n)];
      }
      var eff = Math.max(0, rate(S, s) * mult - per);
      return { pl: pl, once: once, per: per, mult: mult, eff: eff, len: len, score: len / SPEED[kd] + (once + 25) / Math.max(eff, 0.02) };
    }
    function best(a, b) {
      var key = a * 1024 + b; if (memo[key] !== undefined) return memo[key];
      var g = geos(a, b), bst = null;
      for (var k = 0; k < g.length; k++) { var e = evalG(a, b, g[k]); if (!bst || e.score < bst.score) bst = e; }
      return (memo[key] = bst);
    }
    return {
      best: best,
      link: function (L) { return evalG(L.a, L.b, L.pl || null).eff; },
      cant: function (a, b) { var w = whyNot(s, a, b, o, NOBLOCK); if (w) return w; return best(a, b) ? '' : 'blocked'; }
    };
  }

  // ---------------- the computer players ----------------
  // Each sees what the player sees (numbers, troops on the lines, lines, the map) and acts through the same moves (make
  // a line, cut a line, aim a rocket launcher). Every colour that isn't its own is a target, other computers included;
  // gray towers get an "expand" bonus so they grab neutrals early. Sending is free, so it reasons in rates: a target
  // falls when what my lines deliver per second beats what it grows and gets from its friends; the time that takes
  // (plus fences, bridges and mines on the way) decides whether an attack is worth a line.
  // P: think (seconds between moves), margin (spare strength it wants), commit (how much faster than the target's gain
  // its lines must deliver: >1 careful), patience (the longest capture it starts, seconds), expand (liking for gray
  // towers), attack (false: leaves coloured towers alone), attackBias (liking for coloured towers), defend, cut, acts
  // (moves per think), wait (seconds before its first attack on another colour), gang (towers per target).
  function think(s, o, P) {
    var T = s.towers, n = T.length, i, j, t, S, X, L, c;
    var mine = [], rockets = [], toU = [], inR = [];
    for (i = 0; i < n; i++) { toU.push([0, 0, 0, 0, 0, 0]); inR.push([0, 0, 0, 0, 0, 0]); if (T[i].o === o) { if (sender(T[i].type)) mine.push(T[i]); else if (T[i].type === 'r') rockets.push(T[i]); } }
    if (!mine.length && !rockets.length) return;
    for (i = 0; i < s.units.length; i++) { var u = s.units[i]; toU[u.b][u.o] += u.hp; }
    var memo = {};
    // a line's one-time losses (unbroken fences, unbuilt bridges, armed mines) and its loss rate (enemy snipers)
    function lineCost(a, b, q) {
      var key = a * 1024 + b; if (memo[key]) return memo[key];
      var A = T[a], B = T[b], once = 0, per = 0, k;
      if (A.type !== 'F' && A.type !== 'r') {
        var Pp = path(s, a, b);
        for (k = 0; k < Pp.f.length; k++) { var F = Pp.f[k]; if (F.k === 'fence') once += Math.max(0, s.fences[F.i].hp); else if (F.k === 'gap') once += s.gaps[F.i].need - s.gaps[F.i].got; else if (F.k === 'mine') { once += s.mines[F.i].armed ? 2 : 0; per += 0.12; } }
      }
      if (A.type !== 'r') for (k = 0; k < n; k++) { var Sn = T[k]; if (Sn.type !== 's' || !Sn.o || Sn.o === q) continue; if (segDist(Sn.x, Sn.y, A.x, A.y, B.x, B.y) < snipeRange(Sn.n)) per += 0.7 / SNIPE_GAP[band(Sn.n)]; }
      return (memo[key] = { once: once, per: per });
    }
    // what a line delivers per second after its losses
    function lineRate0(S, b) { return Math.max(0, rate(S, s) - lineCost(S.i, b, S.o).per); }
    // 0.4.0: the checks' player that draws detours / aims for gates rates its lines by the best route (see routeKit)
    var RT = (P.draw || P.gates) ? routeKit(s, o, P) : null;
    function lineRate(S, b) { return RT && S.o === o ? RT.best(S.i, b).eff : lineRate0(S, b); }
    function cant(a, b) { return RT ? RT.cant(a, b) : whyNot(s, a, b, o); }
    for (i = 0; i < s.links.length; i++) { L = s.links[i]; inR[L.b][L.o] += RT && L.o === o ? RT.link(L) : lineRate0(T[L.a], L.b); }
    function canStart(S) { return S.links.length < slots(S.n, S.type); }
    function growRate(X) { return X.o && X.n < X.cap && !X.links.length ? (X.type === 'X' ? 1 / BOSS_GROW : (X.boost > s.t ? BOOST : 1) / GROW_IDLE) * s.prod[X.o] : 0; }
    function others(arr, a, b) { var v = 0; for (var q = 1; q < NOWN; q++) if (q !== a && q !== b) v += arr[q]; return v; }
    var patience = P.patience || 35, acts = [];
    // how long (s) until X falls to what owner o sends at it with an extra delivery rate `add` (Infinity: never)
    function fallTime(X, add, once) {
      var i2 = X.i, gain = growRate(X) + (X.o ? inR[i2][X.o] : 0), hit = inR[i2][o] + add + others(inR[i2], o, X.o);
      var left = X.n + 1 + (X.o ? toU[i2][X.o] : 0) - toU[i2][o] - others(toU[i2], o, X.o) + once + P.margin;
      var net = hit - gain * P.commit;
      if (left <= 0) return 0;
      return net > 0.12 ? left / net : Infinity;
    }
    // 1. my towers under attack: help from a safe neighbour, a line back at the attacker (the streams meet head on),
    //    or cut its own lines (only an idle tower generates troops)
    if (P.defend !== false) {
      for (i = 0; i < n; i++) {
        t = T[i]; if (t.o !== o) continue;
        var foeR = others(inR[i], o, 0), foeU = others(toU[i], o, 0);
        if (!foeR && !foeU) continue;
        var lossR = foeR - growRate(t) - inR[i][o], left2 = t.n + toU[i][o] - foeU;
        var tFall = left2 <= 0 ? 0 : lossR > 0.05 ? left2 / lossR : Infinity;
        if (tFall > 25) continue;
        var threat = 25 - tFall;
        for (j = 0; j < mine.length; j++) {
          S = mine[j]; if (S === t || !canStart(S) || linkFrom(s, S.i, t.i) || linkFrom(s, t.i, S.i) || cant(S.i, t.i)) continue;
          if (S.n < 4 || others(inR[S.i], o, 0) > growRate(S) + inR[S.i][o]) continue;
          acts.push({ sc: 72 + threat - dist(S, t) * 2, k: 'link', a: S.i, b: t.i });
        }
        if (sender(t.type) && canStart(t)) for (j = 0; j < s.links.length; j++) { L = s.links[j]; if (L.b === i && L.o !== o && !L.rk && !L.fly && T[L.a].o === L.o && !linkFrom(s, i, L.a) && !cant(i, L.a)) acts.push({ sc: 70 + threat, k: 'link', a: i, b: L.a }); }
        if (tFall < 8) for (j = 0; j < t.links.length; j++) { L = t.links[j]; if (!L.rk && T[L.b].o !== o && s.t - L.t0 > 1.5 && fallTime(T[L.b], 0, 0) > tFall + 6) acts.push({ sc: 64 + threat, k: 'cut', L: L }); }
      }
    }
    // 2. attack: gray towers first (expand), then any other colour; several of my towers may gang up on one
    var attackOk = P.attack !== false && s.t >= (P.wait || 0);
    for (i = 0; i < n; i++) {
      X = T[i]; if (X.o === o || (X.o && !attackOk)) continue;
      var cands = [];
      for (j = 0; j < mine.length; j++) { S = mine[j]; if (canStart(S) && !linkFrom(s, S.i, X.i) && !cant(S.i, X.i)) cands.push(S); }
      if (!cands.length) continue;
      cands.sort(function (a, b) { return dist(a, X) - dist(b, X); });
      var add = 0, once = 0, tBest = Infinity, k2 = 0;
      for (j = 0; j < cands.length && j < (P.gang || 3); j++) {
        add += lineRate(cands[j], i); once = Math.max(once, RT ? RT.best(cands[j].i, i).once : lineCost(cands[j].i, i, o).once);
        var tt = fallTime(X, add, once) + (RT ? RT.best(cands[j].i, i).len : dist(cands[j], X)) / SPEED[kindOf(cands[j].type)];
        if (tt < tBest) { tBest = tt; k2 = j + 1; }
      }
      if (tBest > patience) continue;
      S = cands[0];
      var sc = 62 - dist(S, X) * 2.2 - tBest * 0.5 - (k2 - 1) * 3 + (X.o ? (P.attackBias || 0) + (X.n < 6 ? 8 : 0) : (P.expand || 0)) + (X.type !== 'b' ? 3 : 0);
      acts.push({ sc: sc, k: 'link', a: S.i, b: X.i });
    }
    // 3. cut lines that no longer pay: attacks that can't win (they stop the tower's growth and hold a slot), help
    //    that's no longer needed
    if (P.cut !== false) {
      for (i = 0; i < mine.length; i++) {
        S = mine[i];
        for (j = 0; j < S.links.length; j++) {
          L = S.links[j]; var B = T[L.b]; if (s.t - L.t0 < 4) continue;
          if (B.o !== o) { var ft = fallTime(B, 0, 0); if (ft > patience * 1.6) acts.push({ sc: 48 + Math.min(20, ft === Infinity ? 20 : ft / 10), k: 'cut', L: L }); }
          else {
            var danger = others(inR[B.i], o, 0) + others(toU[B.i], o, 0) * 0.2;
            if (danger < 0.3 && B.n >= B.cap - 1 && S.n < S.cap - 1) acts.push({ sc: 44, k: 'cut', L: L });
          }
        }
      }
    }
    // rocket launchers (a free move): fire at what my lines attack, else at whoever attacks me, else the strongest foe
    for (i = 0; i < rockets.length; i++) {
      var Rk = rockets[i], best = -1, bs = -1e9, cur = Rk.links.length ? Rk.links[0].b : -1;
      for (j = 0; j < n; j++) {
        X = T[j]; if (X.o === o || (X.o && !attackOk)) continue;
        var v = (X.o ? 20 : 4) + (inR[j][o] > 0 ? 30 - X.n * 0.2 : 0) + (X.type === 's' || X.type === 'r' ? 8 : 0) - dist(Rk, X) * 0.8;
        for (c = 0; c < X.links.length; c++) if (T[X.links[c].b].o === o) v += 12;
        if (X.n <= 0) v -= 25;
        if (j === cur) v += 6;
        if (v > bs) { bs = v; best = j; }
      }
      if (best >= 0 && best !== cur) addLink(s, Rk.i, best);
    }
    if (!acts.length) return;
    acts.sort(function (a, b) { return b.sc - a.sc || (a.a || 0) - (b.a || 0); });
    var done = 0, used = {};
    for (i = 0; i < acts.length && done < (P.acts || 1); i++) {
      var Ac = acts[i]; if (Ac.sc < (P.min || 20)) break;
      if (Ac.k === 'cut') { if (s.links.indexOf(Ac.L) < 0 || used['c' + Ac.L.id]) continue; cut(s, Ac.L, 'ai'); used['c' + Ac.L.id] = 1; done++; }
      else { if (used['a' + Ac.a] || cant(Ac.a, Ac.b)) continue; addLink(s, Ac.a, Ac.b, false, RT ? RT.best(Ac.a, Ac.b).pl : undefined); used['a' + Ac.a] = 1; done++; }
    }
  }
  // ================= endless levels (0.5.0) =================
  // Glenn: "i would like 'unlimited' levels in the way most of the ios games offer unlimited". Levels 1-160 stay the
  // banked ones in levels.json (saves and stars by number stay valid); from 161 on a level is made here from its
  // number by the rules tools/gen.js used for 61-160 (plan, layout, map elements, props), so level n is the same level
  // on every phone and every time it is opened. Each attempt (n, a) is played by the checks' bot (BLUE_BOT, the
  // moderate computer playing blue, no upgrades) for up to 3 minutes of game time; it is kept only if blue wins inside
  // the pacing band, otherwise attempt a + 1 is tried. There is no clock-based budget on purpose: a slow and a fast
  // phone must pick the same attempt, so the band only widens after a fixed number of attempts.
  // Difficulty: 161-260 keep growing a little past level 160 (the computers a bit quicker and bolder, a few more
  // troops on the field), then it holds at that top tier. Variety: the eight regions take turns in blocks of 20 (a
  // new seeded order every 8 blocks), each region's own mix of buildings and elements, and about every other level a
  // "twist" (forts, artillery, a mine belt, a gold rush, a river, walls, tanks, a crowd of three computers, a duel, big
  // towers to 120). Every tenth level (165, 175, ...) is a breather: fewer, slower computers.
  var BANK = 160, GEN_V = 1, GEN_BLOCK = 20, GEN_REGIONS = 8;
  // how often each region's elements show up (river = its river / ravine / lava / canal / dry riverbed with bridges);
  // 3-7 are tools/gen.js's FLAVOR; meadow, desert and tundra come back with everything mixed in
  var GEN_FLAVOR = [
    { river: 0.35, rocks: 0.75, inlet: 0.35, fences: 0.4, mines: 0.3, bars: 0.45, snipers: 0.45, rockets: 0.35, forts: 0.3, factories: 0.5 },
    { river: 0.35, rocks: 0.65, inlet: 0, fences: 0.55, mines: 0.6, bars: 0.35, snipers: 0.5, rockets: 0.4, forts: 0.3, factories: 0.6 },
    { river: 0.6, rocks: 0.75, inlet: 0.2, fences: 0.5, mines: 0.4, bars: 0.3, snipers: 0.5, rockets: 0.35, forts: 0.4, factories: 0.5 },
    { river: 0.6, rocks: 0.75, inlet: 0.45, fences: 0.3, mines: 0.4, bars: 0.3, snipers: 0.5, rockets: 0.35, forts: 0.3, factories: 0.5 },
    { river: 0.3, rocks: 0.6, inlet: 0.75, fences: 0.35, mines: 0.3, bars: 0.85, snipers: 0.5, rockets: 0.35, forts: 0.3, factories: 0.5 },
    { river: 0.4, rocks: 0.7, inlet: 0.15, fences: 0.65, mines: 0.35, bars: 0.35, snipers: 0.45, rockets: 0.4, forts: 0.35, factories: 0.6 },
    { river: 0.65, rocks: 0.7, inlet: 0.1, fences: 0.35, mines: 0.5, bars: 0.35, snipers: 0.5, rockets: 0.45, forts: 0.35, factories: 0.5 },
    { river: 0.55, rocks: 0.6, inlet: 0.4, fences: 0.4, mines: 0.4, bars: 0.4, snipers: 0.55, rockets: 0.45, forts: 0.4, factories: 0.55 }
  ];
  var TWISTS = ['forts', 'artillery', 'mines', 'gold', 'river', 'walls', 'tanks', 'crowd', 'duel', 'big'];
  function seedOf(a, b) { return (Math.imul(a + 1, 0x9E3779B1) ^ Math.imul(b + 7, 0x85EBCA77) ^ 0x2545F491) >>> 0; }
  // the region order for one round of 8 blocks (a seeded shuffle)
  function regionPerm(c) { var R = rng(seedOf(c, 99991)), a = [0, 1, 2, 3, 4, 5, 6, 7]; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // a level's region: 1-160 the bank's blocks of 20; then every block of 20 one region, all 8 in a seeded order per
  // round, never the same region twice in a row (round c's last region only depends on its own shuffle)
  function regionOf(n) {
    if (n <= BANK) return Math.floor((n - 1) / GEN_BLOCK);
    var b = Math.floor((n - BANK - 1) / GEN_BLOCK), c = Math.floor(b / GEN_REGIONS), p = regionPerm(c), last = c ? regionPerm(c - 1)[GEN_REGIONS - 1] : 7;
    if (p[0] === last) { var t = p[0]; p[0] = p[1]; p[1] = t; }
    return p[b % GEN_REGIONS];
  }
  function breather(n) { return n > BANK && n % 10 === 5; }
  // what a level has (tools/gen.js planLate at the top of its ramp, plus the twist)
  function genPlan(n, R) {
    var reg = regionOf(n), k = ((n - 1) % GEN_BLOCK) / (GEN_BLOCK - 1), F = GEN_FLAVOR[reg], easy = breather(n);
    var P = { no: n, reg: reg, k: k, p: Math.min(1, (n - BANK) / 100), easy: easy, tips: [] };
    var ch = function (x) { return R() < Math.min(0.95, x * 1.2); };
    P.enemies = easy ? (R() < 0.5 ? 1 : 2) : [1, 2, 2, 3, 3, 3][Math.floor(R() * 6)];
    if (n % GEN_BLOCK === 1 && P.enemies === 3) P.enemies = 2; // a new region starts a bit gentler
    P.total = Math.round(8.5 + k * 3 + 1.2 + (P.enemies - 1) * 0.5 + R() * 1.2);
    P.factories = ch(F.factories) ? 1 + (R() < 0.35 ? 1 : 0) : 0;
    P.fences = ch(F.fences) ? 2 + Math.floor(R() * 3) : 0;
    P.rocks = ch(F.rocks) ? 2 + Math.floor(R() * 4) : 0;
    P.bars = ch(F.bars) ? (reg === 4 ? 2 : 1) + Math.floor(R() * 3) : 0;
    P.snipers = ch(F.snipers) ? 1 + (R() < 0.35 ? 1 : 0) : 0;
    P.rockets = ch(F.rockets) ? 1 : 0;
    P.mines = ch(F.mines) ? 1 + Math.floor(R() * 3) : 0;
    P.forts = ch(F.forts) ? 1 : 0;
    P.bridge = R() < F.river;
    P.inlets = R() < F.inlet ? 1 + (R() < 0.4 ? 1 : 0) : 0;
    P.cap = 0; P.fortCap = 0;
    if (!easy && R() < 0.5) {
      var tw = P.twist = TWISTS[Math.floor(R() * TWISTS.length)];
      if (tw === 'forts') { P.forts = 1; if (R() < 0.5) P.fortCap = 120; }
      else if (tw === 'artillery') { P.rockets = 1; P.snipers = Math.max(P.snipers, 1); }
      else if (tw === 'mines') P.mines = 3;
      else if (tw === 'gold') P.bars = 3 + Math.floor(R() * 2);
      else if (tw === 'river') P.bridge = true;
      else if (tw === 'walls') { P.fences = 3 + Math.floor(R() * 2); P.rocks = Math.max(P.rocks, 3); }
      else if (tw === 'tanks') P.factories = 2;
      else if (tw === 'crowd') P.enemies = 3;
      else if (tw === 'duel') { P.enemies = 1; P.total += 1; }
      else if (tw === 'big') P.cap = 120; // "some (few) levels have over 100"
    }
    if (easy) { P.total -= 2; P.rockets = 0; P.snipers = Math.min(1, P.snipers); P.mines = Math.min(1, P.mines); }
    P.total = Math.min(13, P.total); // 10-13 like the late bank (gen.js allowed 14 but its layouts rarely fit one)
    return P;
  }
  // where the buildings stand (tools/gen.js layout: you at the bottom, computers at the top corners / a side, gray
  // buildings between, none right on a line between two near ones)
  function genLayout(P, R) {
    var k = P.k, pts = [], river = null;
    var minD = P.total > 13 ? 2.05 : P.total > 11 ? 2.1 : P.total > 8 ? 2.3 : 2.5;
    var rad = function (t) { return t[4] === 'F' ? 0.9 : 0.42; };
    if (P.bridge) river = { y: H / 2 + (R() - 0.5) * 3, h: 0.8 };
    function ok(x, y, type) {
      if (river && Math.abs(y - river.y) < 1.1 + (type === 'F' ? 0.5 : 0)) return false;
      var i, j;
      for (i = 0; i < pts.length; i++) if (Math.hypot(pts[i][0] - x, pts[i][1] - y) < minD + (type === 'F' || pts[i][4] === 'F' ? 0.9 : 0)) return false;
      // unlike tools/gen.js (which threw the whole layout away afterwards), a spot right on the line between two near
      // buildings, or one whose own lines would run through a building, is refused here: same rule, ~20x fewer
      // wasted layouts (it matters on a phone)
      var r0 = type === 'F' ? 0.9 : 0.42;
      for (i = 0; i < pts.length; i++) {
        var di = Math.hypot(pts[i][0] - x, pts[i][1] - y);
        for (j = i + 1; j < pts.length; j++) if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) <= 6.2 && segDist(x, y, pts[i][0], pts[i][1], pts[j][0], pts[j][1]) < r0 + 0.1) return false;
        if (di <= 6.2) for (j = 0; j < pts.length; j++) if (j !== i && segDist(pts[j][0], pts[j][1], x, y, pts[i][0], pts[i][1]) < rad(pts[j]) + 0.1) return false;
      }
      return true;
    }
    function place(x0, x1, y0, y1, o, n, type) {
      for (var t = 0; t < 400; t++) {
        var m = type === 'F' ? 1.4 : 1.0;
        // rounded before the checks, so the saved spot keeps its distance
        var x = +Math.max(m, Math.min(W - m, x0 + R() * (x1 - x0))).toFixed(2), y = +Math.max(1.3 + (m - 1), Math.min(H - 1.3 - (m - 1), y0 + R() * (y1 - y0))).toFixed(2);
        if (!ok(x, y, type)) continue;
        var p = [x, y, o, n]; if (type && type !== 'b') p.push(type); pts.push(p); return true;
      }
      return false;
    }
    // level 160 had computers starting at 27 and gray buildings up to 34: one / two more by 260, breathers less
    var blueStart = Math.round(14 - k * 3) + (P.easy ? 4 : 0), redStart = P.easy ? 20 : Math.round(27 + P.p), gmax = P.easy ? 24 : Math.round(34 + 2 * P.p);
    for (var i = 0; i < 2; i++) if (!place(1, W - 1, H - 3.4, H - 1.4, 1, i ? Math.round(blueStart * 0.5) : blueStart, i === 1 && P.factories > 1 ? 'f' : 'b')) return null;
    var cpu = [2, 3, 4].slice(0, P.enemies), eStart = Math.round(redStart * (P.enemies === 1 ? 1 : P.enemies === 2 ? 0.85 : 0.75));
    var spots = P.enemies === 1 ? [[1, W - 1, 1.4, 3.8]] : P.enemies === 2 ? [[1, 3.8, 1.4, 4.2], [5.2, W - 1, 1.4, 4.2]] : [[1, 3.6, 1.4, 3.8], [5.4, W - 1, 1.4, 3.8], [R() < 0.5 ? 1 : W - 2.4, R() < 0.5 ? 1 + 1.4 : W - 1, 6.4, 8.6]];
    if (P.enemies === 3 && spots[2][0] > 4) spots[2] = [W - 2.4, W - 1, 6.4, 8.6]; else if (P.enemies === 3) spots[2] = [1, 2.4, 6.4, 8.6];
    for (var e = 0; e < cpu.length; e++) {
      var sp = spots[e];
      if (!place(sp[0], sp[1], sp[2], sp[3], cpu[e], eStart, e === 0 && P.factories > 0 && R() < 0.4 ? 'f' : 'b')) return null;
      if (P.enemies === 1 && !place(1, W - 1, 1.4, 5.8, cpu[e], Math.round(eStart * 0.6), 'b')) return null;
    }
    var grays = P.total - pts.length, special = [], q;
    for (q = 0; q < P.forts; q++) special.push('F');
    for (q = 0; q < P.snipers; q++) special.push('s');
    for (q = 0; q < P.rockets; q++) special.push('r');
    var hasF = function (blue) { return pts.some(function (p) { return (blue ? p[2] === 1 : p[2] > 1) && p[4] === 'f'; }); };
    var facLeft = Math.max(0, P.factories - (hasF(true) ? 1 : 0) - (hasF(false) ? 1 : 0));
    for (q = 0; q < facLeft; q++) special.push('f');
    for (q = 0; q < special.length && grays > 0; q++) {
      var type = special[q];
      var n = type === 'F' ? 18 + Math.floor(R() * 20) : type === 's' ? 8 + Math.floor(R() * 12) : type === 'r' ? 5 + Math.floor(R() * 10) : 4 + Math.floor(R() * gmax * 0.7);
      var mid = type === 's' || type === 'F';
      if (!place(mid ? 2 : 1, mid ? W - 2 : W - 1, mid ? H / 2 - 3 : 4.2, mid ? H / 2 + 3 : H - 4, 0, n, type)) return null;
      grays--;
    }
    while (grays > 0) { if (!place(1, W - 1, 3.6, H - 3.6, 0, 2 + Math.floor(R() * gmax), 'b')) return null; grays--; }
    for (i = 0; i < pts.length; i++) if (pts[i][2] === 0 && pts[i][3] < 1) pts[i][3] = 1;
    for (i = 0; i < pts.length; i++) for (var j = i + 1; j < pts.length; j++) {
      if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) > 6.2) continue;
      for (q = 0; q < pts.length; q++) if (q !== i && q !== j && segDist(pts[q][0], pts[q][1], pts[i][0], pts[i][1], pts[j][0], pts[j][1]) < rad(pts[q]) + 0.1) return null;
    }
    return { pts: pts, river: river };
  }
  function genShuffle(arr, R) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // map elements (tools/gen.js elements): a river with broken bridges, inlets from the edges, obstacles, fences, mine
  // fields and gold bars on the lines between near buildings; every building must stay reachable
  function genElements(P, lay, R) {
    var pts = lay.pts, L = { obs: [], fences: [], gaps: [], mines: [], bars: [] }, near = [], used = [], i, j, placed, p, q, qq;
    for (i = 0; i < pts.length; i++) for (j = i + 1; j < pts.length; j++) { var d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < 6.8) near.push([i, j, d]); }
    near.sort(function (a, b) { return a[2] - b[2]; });
    var farFromTowers = function (x, y, r) { return pts.every(function (t) { return Math.hypot(t[0] - x, t[1] - y) >= r + (t[4] === 'F' ? 0.9 : 0.42) + 0.25; }); };
    var free = function (x, y, r) { return used.every(function (u) { return Math.hypot(u[0] - x, u[1] - y) >= r + u[2]; }); };
    var onPair = function (pr, t, off) { var A = pts[pr[0]], B = pts[pr[1]], dx = B[0] - A[0], dy = B[1] - A[1], dd = Math.hypot(dx, dy); return [A[0] + dx * t - dy / dd * off, A[1] + dy * t + dx / dd * off, Math.atan2(dy, dx)]; };
    if (lay.river) {
      var ry = lay.river.y, rh = lay.river.h, cross = [], opens = [];
      near.forEach(function (pr) { var A = pts[pr[0]], B = pts[pr[1]]; if ((A[1] - ry) * (B[1] - ry) < 0) { var t = (ry - A[1]) / (B[1] - A[1]); cross.push(A[0] + (B[0] - A[0]) * t); } });
      genShuffle(cross, R).forEach(function (x) { if (x > 0.9 && x < W - 0.9 && opens.length < 2 && opens.every(function (o) { return Math.abs(o - x) > 2.6; })) opens.push(x); });
      if (!opens.length) return null;
      opens.sort(function (a, b) { return a - b; });
      var ow = 1.3, kind = P.reg === 1 ? 'chasm' : P.reg === 3 ? 'lava' : P.reg === 6 ? 'dry' : 'water', x0 = -0.6;
      opens.forEach(function (x) { var a = x - ow / 2; if (a - x0 > 0.05) L.obs.push([kind, +((x0 + a) / 2).toFixed(2), +ry.toFixed(2), +(a - x0).toFixed(2), rh]); x0 = x + ow / 2; L.gaps.push([+x.toFixed(2), +ry.toFixed(2), ow, rh, 8 + Math.floor(R() * 5)]); });
      L.obs.push([kind, +((x0 + W + 0.6) / 2).toFixed(2), +ry.toFixed(2), +(W + 0.6 - x0).toFixed(2), rh]);
    }
    var nearBox = function (cx, cy, w, h, pad) { return pts.some(function (t) { return Math.abs(t[0] - cx) < w / 2 + pad + (t[4] === 'F' ? 0.9 : 0.42) && Math.abs(t[1] - cy) < h / 2 + pad + (t[4] === 'F' ? 0.9 : 0.42); }); };
    for (var nI = 0, tries = 0; nI < (P.inlets || 0) && tries < 60; tries++) {
      var left = R() < 0.5, len = 1.6 + R() * 1.8, ih = 0.8 + R() * 0.3, cy = 3.2 + R() * (H - 6.4), cx = left ? -0.6 + len / 2 : W + 0.6 - len / 2;
      if (nearBox(cx, cy, len, ih, 0.35)) continue;
      if (lay.river && Math.abs(cy - lay.river.y) < 2) continue;
      if (L.obs.some(function (o) { return o.length >= 5 && Math.abs(o[2] - cy) < 1.6; })) continue;
      L.obs.push([P.reg === 3 ? 'lava' : 'water', +cx.toFixed(2), +cy.toFixed(2), +len.toFixed(2), +ih.toFixed(2)]); used.push([cx, cy, len / 2]); nI++;
    }
    var rk = [['rock', 'tree', 'pond', 'rock'], ['rock', 'cactus', 'rock'], ['ice', 'pine', 'ice'], ['cube', 'cube', 'skull', 'cube'], ['palm', 'palm', 'rock', 'palm'],
      ['oak', 'oak', 'rock', 'stump'], ['mesa', 'mesa', 'rock', 'cactus'], ['house', 'stack', 'house']][P.reg];
    var sh = genShuffle(near, R);
    for (placed = 0, i = 0; i < sh.length && placed < P.rocks; i++) {
      q = onPair(sh[i], 0.4 + R() * 0.2, (R() - 0.5) * 0.2); var r = 0.38 + R() * 0.22;
      if (!farFromTowers(q[0], q[1], r + 0.3) || !free(q[0], q[1], r + 0.3)) continue;
      L.obs.push([rk[Math.floor(R() * rk.length)], +q[0].toFixed(2), +q[1].toFixed(2), +r.toFixed(2)]); used.push([q[0], q[1], r]); placed++;
    }
    sh = genShuffle(near, R);
    for (placed = 0, i = 0; i < sh.length && placed < P.fences; i++) {
      q = onPair(sh[i], 0.35 + R() * 0.3, 0);
      if (!farFromTowers(q[0], q[1], 0.75) || !free(q[0], q[1], 0.7)) continue;
      L.fences.push([+q[0].toFixed(2), +q[1].toFixed(2), 1.2, +(q[2] + Math.PI / 2).toFixed(3), 5 + Math.floor(R() * 10)]); used.push([q[0], q[1], 0.6]); placed++;
    }
    sh = genShuffle(near, R);
    for (placed = 0, i = 0; i < sh.length && placed < P.mines; i++) {
      q = onPair(sh[i], 0.5, 0); var cols = 3 + Math.floor(R() * 3), rows = 2 + Math.floor(R() * 2), spc = 0.46;
      if (!free(q[0], q[1], 1.0)) continue;
      var c = Math.cos(q[2]), sn = Math.sin(q[2]), cnt = 0;
      for (var a = 0; a < cols; a++) for (var b = 0; b < rows; b++) {
        var u = (a - (cols - 1) / 2) * spc, v = (b - (rows - 1) / 2) * spc + (a % 2 ? spc / 2 : 0) - spc / 4;
        var x = q[0] + u * c - v * sn, y = q[1] + u * sn + v * c;
        if (x < 0.3 || x > W - 0.3 || y < 0.5 || y > H - 0.5 || !farFromTowers(x, y, 0.35) || !free(x, y, 0.2)) continue;
        if (L.obs.some(function (o) { return o.length >= 5 ? Math.abs(x - o[1]) < o[3] / 2 + 0.3 && Math.abs(y - o[2]) < o[4] / 2 + 0.3 : Math.hypot(x - o[1], y - o[2]) < o[3] + 0.3; })) continue;
        if (L.gaps.some(function (o) { return Math.abs(x - o[0]) < o[2] / 2 + 0.3 && Math.abs(y - o[1]) < o[3] / 2 + 0.3; })) continue;
        L.mines.push([+x.toFixed(2), +y.toFixed(2)]); cnt++;
      }
      if (cnt) { used.push([q[0], q[1], 1.0]); placed++; }
    }
    sh = genShuffle(near, R);
    for (placed = 0, i = 0; i < sh.length && placed < P.bars; i++) {
      q = onPair(sh[i], 0.3 + R() * 0.4, (R() - 0.5) * 0.4);
      if (!farFromTowers(q[0], q[1], 0.5) || !free(q[0], q[1], 0.5)) continue;
      L.bars.push([+q[0].toFixed(2), +q[1].toFixed(2)]); used.push([q[0], q[1], 0.4]); placed++;
    }
    // every building reachable: senders joined by open lines, every other building open to a sender, each building
    // with at least 2 open neighbours (no dead ends)
    var tmp = create({ towers: pts, obs: L.obs }), snd = [];
    for (i = 0; i < pts.length; i++) if (sender(pts[i][4] || 'b')) snd.push(i);
    var openTo = function (a2, b2) { return pts[a2][4] === 'F' || !blocked(tmp, a2, b2); };
    var seen = [snd[0]];
    for (qq = 0; qq < seen.length; qq++) for (i = 0; i < snd.length; i++) if (seen.indexOf(snd[i]) < 0 && (openTo(seen[qq], snd[i]) || openTo(snd[i], seen[qq]))) seen.push(snd[i]);
    if (seen.length !== snd.length) return null;
    for (i = 0; i < pts.length; i++) if (!sender(pts[i][4] || 'b') && !snd.some(function (s2) { return openTo(s2, i); })) return null;
    for (i = 0; i < pts.length; i++) { var cn = 0; for (j = 0; j < pts.length; j++) if (j !== i && openTo(i, j)) cn++; if (cn < 2) return null; }
    return L;
  }
  // decoration (no rules): the region's props away from buildings, lines and elements (tools/gen.js props)
  function genProps(towers, L, reg, R, count) {
    var out = [], kinds = [['crates', 'barrel', 'logs', 'bush', 'bush', 'crates'], ['crates', 'barrel', 'cactus', 'tires', 'bones', 'crates'], ['snowman', 'crates', 'snowbank', 'pine', 'barrel', 'snowbank'],
      ['skullp', 'bones', 'cuberock', 'vent', 'cuberock', 'crates'], ['palmp', 'goldstack', 'fern', 'palmp', 'fern', 'crates'], ['leaves', 'logs', 'pumpkin', 'oakp', 'leaves', 'mushroom'],
      ['boulder', 'cactus', 'bones', 'boulder', 'wheel', 'barrel'], ['lantern', 'crates', 'barrel', 'anchor', 'lantern', 'rope']][reg];
    var pairs = [], i, j;
    for (i = 0; i < towers.length; i++) for (j = i + 1; j < towers.length; j++) if (Math.hypot(towers[i][0] - towers[j][0], towers[i][1] - towers[j][1]) < 9) pairs.push([towers[i], towers[j]]);
    var busy = [].concat((L.obs || []).map(function (o) { return [o[1], o[2], (o.length >= 5 ? Math.max(o[3], o[4]) / 2 : o[3]) + 0.5]; }), (L.fences || []).map(function (f) { return [f[0], f[1], 1.0]; }),
      (L.mines || []).map(function (m) { return [m[0], m[1], 0.6]; }), (L.bars || []).map(function (b) { return [b[0], b[1], 0.7]; }), (L.gaps || []).map(function (g) { return [g[0], g[1], 1.2]; }));
    for (var tries = 0; tries < 900 && out.length < count; tries++) {
      var x = 0.4 + R() * (W - 0.8), y = 0.9 + R() * (H - 1.8);
      if (towers.some(function (t) { return Math.hypot(t[0] - x, t[1] - y) < (t[4] === 'F' ? 1.9 : 1.25); })) continue;
      if (busy.some(function (b) { return Math.hypot(b[0] - x, b[1] - y) < b[2]; })) continue;
      var lane = pairs.some(function (p) { return segDist(x, y, p[0][0], p[0][1], p[1][0], p[1][1]) < 0.75; });
      if (lane && x > 1 && x < W - 1) continue;
      if (out.some(function (p) { return Math.hypot(p[1] - x, p[2] - y) < 1.5; })) continue;
      out.push([kinds[Math.floor(R() * kinds.length)], +x.toFixed(2), +y.toFixed(2), +(Math.floor(R() * 4) * Math.PI / 2 + R() * 0.5).toFixed(2)]);
    }
    return out;
  }
  // the computers' settings (tools/gen.js redAI): harder = quicker, bolder, earlier, never more knowledge. Level 160
  // was t = 1.3 (141-160: 0.98 - 1.3); past the bank t = 0.92 + 0.1 (growing over 161-260) + 0.25 inside each
  // region block, so 1.02 - 1.27 at the top tier; breathers 0.5 - 0.65 (like the late desert / tundra levels)
  function genAI(P) {
    var t = P.easy ? 0.5 + 0.15 * P.k : 0.92 + 0.1 * P.p + 0.25 * P.k;
    return { think: +(2.6 - 1.25 * t).toFixed(2), margin: +(3 - 1.8 * t).toFixed(1), commit: +(1.18 - 0.2 * t).toFixed(2), expand: 6, attackBias: Math.round(2 + 4 * t),
      wait: Math.round(16 - 10 * t + (P.enemies > 1 ? 6 : 0)), acts: t > 0.6 && P.enemies === 1 ? 2 : 1 };
  }
  // one attempt at level n (null when the layout doesn't work out; that costs next to nothing)
  function genTry(n, a) {
    var R = rng(seedOf(n, a)), P = genPlan(n, R), lay = genLayout(P, R); if (!lay) return null;
    var E = genElements(P, lay, R); if (!E) return null;
    var L = { region: P.reg, towers: lay.pts, links: [], ai: genAI(P) };
    ['obs', 'fences', 'gaps', 'mines', 'bars'].forEach(function (key) { if (E[key].length) L[key] = E[key]; });
    if (P.fortCap) L.fortCap = P.fortCap;
    if (P.cap) L.cap = P.cap;
    L.props = genProps(L.towers, L, P.reg, R, 8 + Math.floor(R() * 4));
    if (P.easy) L.breather = true;
    if (P.twist) L.twist = P.twist;
    return L;
  }
  // the checks' bot plays blue (seed 7, as tools/check.js); the result decides whether the attempt is kept
  // a breather must also be won by tools/gen.js's weaker, slower blue (a stand-in for a casual player), one game
  var WEAK_BOT = { think: 2.2, margin: 4, commit: 1.3, expand: 4, attackBias: 0, acts: 1 };
  function botPlay(L, maxT, bot, seed) {
    var s = create(L, { seed: seed || 7, ai: cpuAI(L, { 1: bot || BLUE_BOT }) }), n = Math.round(maxT / DT);
    for (var i = 0; i < n && !s.over; i++) { step(s); s.ev.length = 0; }
    return s;
  }
  // the pacing band for the bot's win (s): Glenn's "1-2 minutes ... typically" (tools/gen.js used 65-118 for 61-160);
  // it widens after 30 and 80 played attempts so a level always comes out
  function genBand(easy, tries) { return tries > 80 ? [0, 180] : tries > 30 ? [35, 150] : easy ? [35, 95] : [55, 118]; }
  // level n past the bank: attempts (n, 0), (n, 1) ... until the bot wins one in the band
  function makeLevel(n) {
    n = Math.max(BANK + 1, Math.floor(n));
    var played = 0, skipped = 0;
    for (var a = 0; a < 100000; a++) {
      var L = genTry(n, a); if (!L) { skipped++; continue; }
      played++;
      var band = genBand(!!L.breather, played), s = botPlay(L, 180);
      if (s.over !== 1 || s.t < band[0] || s.t > band[1]) continue;
      if (L.breather && played <= 30 && botPlay(L, 240, WEAK_BOT, 1).over !== 1) continue;
      L.target = Math.max(25, Math.ceil(s.t * 1.1 / 5) * 5); // 3 stars at or under this time (as the bank)
      L.gold = 20 + 5 * Math.min(n, 200);                    // as the bank (20 + 5 x level), held from level 200
      L.no = n; L.gen = { v: GEN_V, a: a, played: played, skipped: skipped, bot: Math.round(s.t * 10) / 10 };
      return L;
    }
    return null;
  }

  // ---------------- player moves ----------------
  function playerLink(s, a, b) { var w = whyNot(s, a, b, 1); if (w) return w; addLink(s, a, b); return ''; }

  // the computer's settings for a level's computer colour (levels.json may override any of them)
  function redParams(level, o) {
    var R = { think: 2.2, margin: 3, commit: 1.2, expand: 6, attackBias: 0, acts: 1, defend: true, cut: true, wait: 10 };
    var a = level.ai || {}, k; for (k in a) R[k] = a[k];
    var b = (level.ais || {})[o || 2] || {}; for (k in b) R[k] = b[k];
    return R;
  }
  // every computer colour on a level (the owners 2-4 that start with a building)
  function cpuColors(level) { var c = []; level.towers.forEach(function (t) { if (t[2] >= 2 && c.indexOf(t[2]) < 0) c.push(t[2]); }); return c.sort(); }
  function cpuAI(level, extra) { var ai = {}; cpuColors(level).forEach(function (o) { ai[o] = redParams(level, o); }); if (level.horde) ai[HORDE] = redParams(level, HORDE); if (extra) for (var k in extra) ai[k] = extra[k]; return ai; }
  // the checks' "player": the same computer at a moderate setting, playing blue
  var BLUE_BOT = { think: 1.0, margin: 2, commit: 1.0, expand: 4, attackBias: 4, acts: 1, defend: true, cut: true, wait: 0 };
  // 0.4.0: the same player for the special missions: it draws detours (Draw Mode) and aims for blue gates
  var DRAW_BOT = Object.assign({}, BLUE_BOT, { draw: true, gates: true });

  return { DT: DT, W: W, H: H, CAP: CAP, FORT_CAP: FORT_CAP, SPEED: SPEED, HP: HP, EDGE: EDGE, FORT_EDGE: FORT_EDGE, GROW_IDLE: GROW_IDLE, GROW_SEND: GROW_SEND,
    SEND_LO: SEND_LO, SEND_HI: SEND_HI, START_CAP: START_CAP, ROCKET_DMG: ROCKET_DMG, MINE_R: MINE_R, MINE_RE: MINE_RE, GOLD_BOOST: GOLD_BOOST, GOLD_COIN: GOLD_COIN,
    SNIPE_R: SNIPE_R, SNIPE_GAP: SNIPE_GAP, UP_MAX: UP_MAX, UP_KEYS: UP_KEYS, upCost: upCost, upValue: upValue, setUp: setUp,
    rng: rng, slots: slots, floorFor: floorFor, floors: floors, band: band, snipeRange: snipeRange, sendGap: sendGap, rocketGap: rocketGap, rate: rate, sender: sender, kindOf: kindOf,
    segDist: segDist, segCross: segCross, segBox: segBox, obsHit: obsHit, blocked: blocked, path: path,
    create: create, step: step, takeEvents: takeEvents, whyNot: whyNot, strength: strength,
    HORDE: HORDE, NOWN: NOWN, BOSS_CAP: BOSS_CAP, MEET: MEET, walker: walker, polyLen: polyLen, polyPath: polyPath, linkPath: linkPath, plBlocked: plBlocked, drawPath: drawPath,
    detour: detour, astar: astar, foeSnipers: foeSnipers, routeKit: routeKit, hordeDone: hordeDone, DRAW_BOT: DRAW_BOT, rdp: rdp,
    addLink: addLink, cut: cut, cutById: cutById, linkFrom: linkFrom, playerLink: playerLink, think: think, redParams: redParams, cpuColors: cpuColors, cpuAI: cpuAI, BLUE_BOT: BLUE_BOT, dist: dist,
    // 0.5.0 endless levels (and this rule book's own source, for the page's Web Worker)
    BANK: BANK, GEN_V: GEN_V, regionOf: regionOf, breather: breather, makeLevel: makeLevel, genTry: genTry, botPlay: botPlay, WEAK_BOT: WEAK_BOT, source: function () { return OP_FACTORY.toString(); } };
}
var OP = OP_FACTORY();
if (typeof module !== 'undefined') module.exports = OP;
