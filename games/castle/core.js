
/* Castle Crumble logic: castles of stone bricks on a grassy island; fire cannonballs to knock them down. Knock down
   enough of the castle (the bar at the top) before the cannonballs run out. cannon-es does the physics (passed in
   with CC.use, so this file runs in the browser and in Node for the level checks).
   Castles are built from the level number (seeded): towers with cone roofs, walls with battlements, a keep with a
   pyramid roof, gatehouses with wooden doors, and TNT crates that blow up. Bricks are laid like real masonry
   (joints staggered), start asleep so a castle stands perfectly still, and wake when hit or when what holds them
   up goes (a moving brick wakes the ones near it). tools/gen.mjs proves every level: a bot knocks it down with the
   game's physics and the level gets more cannonballs than the bot needed.
   1.6.0 (Glenn: "individual bricks = good, but the bricks are huge - i was hoping they'd be smaller - so the
   explosions look better/bigger"): bricks are half as long and half as tall as before (a long brick 1 x 0.5 x 0.5,
   a half brick 0.5 x 0.5 x 0.5), so a castle of about the same size has three to four times as many; a grid
   broadphase keeps the physics cheap with that many. */
var CC = (function () {
  'use strict';
  var C = null;
  var GRAV = -18, ISLAND = 13, WATER = -1.2, BALLR = 0.45, BALLM = 5, SPEED = 44, BALL_LIFE = 4.5;
  var CAM = { D: 26, H: 14, LOOK: 3 };      // the camera orbits the island; the cannon fires from just below it
  // Castles are laid out on a grid of CELL-sized cells (a half brick); a long brick covers two cells. Walls and
  // towers are one cell thick.
  var CELL = 0.5, K = 1.6;                  // K: old layout units -> cells (0.8 of the 1.5.0 castle's size, 2 cells a unit)
  var TYPES = {
    guard: { mass: 0.7, mat: 'wood' },
    b2: { mass: 1, mat: 'stone' },    // long brick (1 x 0.5 x 0.5)
    b1: { mass: 0.5, mat: 'stone' },  // half brick (0.5 x 0.5 x 0.5)
    m: { mass: 0.2, mat: 'stone' },   // battlement (merlon)
    cone: { mass: 2, mat: 'roof' },   // a tower's pointed roof (a box in the physics)
    pyr: { mass: 4, mat: 'roof' },    // a keep's pyramid roof
    door: { mass: 0.8, mat: 'wood' },
    tnt: { mass: 0.6, mat: 'tnt' }
  };
  function use(c) { C = c; speedUp(); }
  // 1.6.0: three cannon-es hot spots, measured with a profiler on a 650-brick castle coming down (see the doc):
  // - separating-axis tests project every box corner onto every axis (30 projections a pair); a box's projection is
  //   its centre plus its half sizes along the axis, the same numbers with a third of the work;
  function speedUp() {
    var CP = C && C.ConvexPolyhedron; if (!CP || CP.__ccFast) return; CP.__ccFast = true;
    var orig = CP.project;
    CP.project = function (hull, axis, pos, quat, result) {
      var h = hull.__half; if (!h) return orig.call(CP, hull, axis, pos, quat, result);
      // the axis in the box's own frame: rotate by the inverse (conjugate) quaternion
      var qx = -quat.x, qy = -quat.y, qz = -quat.z, qw = quat.w, vx = axis.x, vy = axis.y, vz = axis.z;
      var tx = 2 * (qy * vz - qz * vy), ty = 2 * (qz * vx - qx * vz), tz = 2 * (qx * vy - qy * vx);
      var lx = vx + qw * tx + (qy * tz - qz * ty), ly = vy + qw * ty + (qz * tx - qx * tz), lz = vz + qw * tz + (qx * ty - qy * tx);
      var r = Math.abs(lx) * h.x + Math.abs(ly) * h.y + Math.abs(lz) * h.z, c0 = pos.x * vx + pos.y * vy + pos.z * vz;
      result[0] = c0 + r; result[1] = c0 - r;
    };
  }
  // - the world's collision matrices are arrays of n*n/2 flags cleared every step (180,000 for 600 bricks, most of
  //   the time spent asleep); a set of the pairs actually touching does the same job;
  function SparseMatrix() { this.s = new Set(); }
  SparseMatrix.prototype.key = function (a, b) { var i = a.index, j = b.index; return i > j ? i * 65536 + j : j * 65536 + i; };
  SparseMatrix.prototype.get = function (a, b) { return this.s.has(this.key(a, b)); };
  SparseMatrix.prototype.set = function (a, b, v) { if (v) this.s.add(this.key(a, b)); else this.s.delete(this.key(a, b)); };
  SparseMatrix.prototype.reset = function () { this.s.clear(); };
  SparseMatrix.prototype.setNumObjects = function () {};
  // - the overlap keepers (for beginContact/endContact events, which the game doesn't use) insert every contact
  //   into a sorted array one by one: O(contacts^2) a step. They are switched off.
  function fastWorld(world) {
    world.collisionMatrix = new SparseMatrix(); world.collisionMatrixPrevious = new SparseMatrix();
    world.bodyOverlapKeeper.set = function () {}; world.shapeOverlapKeeper.set = function () {};
  }
  function boxShape(half) { var s = new C.Box(half); s.convexPolyhedronRepresentation.__half = half; return s; }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------------- castle parts ----------------
  // a piece: [type, x, y, z, sx, sy, sz] (center and full size, in world units). Builders work in cells (x, z) and
  // rows (y), all CELL world units; P converts. Everything stands on the island (top at y = 0).
  function P(t, x, y, z, sx, sy, sz) { var f = function (v) { return +(v * CELL).toFixed(3); }; return [t, f(x), f(y), f(z), f(sx), f(sy), f(sz)]; }
  // the perimeter cells of an n x n ring (n odd) round (cx, cz), walking +x, +z, -x, -z from a corner: each side
  // is n-1 cells starting at its corner
  function ringCells(cx, cz, n) {
    var h = (n - 1) / 2, cells = [], dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]], x = -h, z = -h;
    for (var s = 0; s < 4; s++) for (var k = 0; k < n - 1; k++) { cells.push([cx + x, cz + z, dirs[s][0], dirs[s][1]]); x += dirs[s][0]; z += dirs[s][1]; }
    return cells;
  }
  // a hollow square ring of long bricks, rows high: cells are paired into long bricks along each side, and every
  // other row the pairing starts one cell later, so each corner belongs to the other side's brick (a pinwheel) and
  // no joint sits on the one below
  function ring(out, cx, cz, n, rows) {
    var cells = ringCells(cx, cz, n), N = cells.length;
    for (var r = 0; r < rows; r++) {
      var y = 0.5 + r, o = r % 2;
      for (var i = o; i < N + o; i += 2) {
        var a = cells[i % N], b = cells[(i + 1) % N], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, alongX = a[1] === b[1];
        out.push(P('b2', mx, y, mz, alongX ? 2 : 1, 1, alongX ? 1 : 2));
      }
    }
    return cells;
  }
  var MER = [0.8, 0.7, 0.8];  // a battlement, in cells
  function battlements(out, cells, rows) { for (var i = 0; i < cells.length; i += 2) out.push(P('m', cells[i][0], rows + MER[1] / 2, cells[i][1], MER[0], MER[1], MER[2])); }
  function tower(out, cx, cz, rows, roof) { // 5 cells (2.5) square
    var cells = ring(out, cx, cz, 5, rows);
    if (roof) out.push(P('cone', cx, rows + 2.2, cz, 5.8, 4.4, 5.8)); else battlements(out, cells, rows);
  }
  function keep(out, cx, cz, rows, roof) { // 9 cells (4.5) square
    var cells = ring(out, cx, cz, 9, rows);
    if (roof) out.push(P('pyr', cx, rows + 2.5, cz, 9.8, 5, 9.8)); else battlements(out, cells, rows);
  }
  // a straight wall from cell a to cell b (inclusive), one cell thick, rows high, battlements on every other cell.
  // Each row is laid in long bricks, starting one cell later every other row (running bond); a cell left over at an
  // end or beside the doorway gets a half brick. "door": a gap in the middle (3 or 4 cells, 3 rows) with a wooden
  // door in it; "tnt": a TNT crate on top between two battlements.
  function wall(out, ax, az, bx, bz, rows, door, tnt, R) {
    var dx = Math.sign(bx - ax), dz = Math.sign(bz - az), L = Math.abs(bx - ax) + Math.abs(bz - az) + 1;
    var gw = L % 2 ? 3 : 4, g0 = door && L >= gw + 2 ? (L - gw) / 2 : -1, DH = 3;
    for (var r = 0; r < rows; r++) {
      var y = 0.5 + r, k = 0;
      while (k < L) {
        if (g0 >= 0 && r < DH && k >= g0 && k < g0 + gw) { k++; continue; }
        var gapNext = g0 >= 0 && r < DH && k + 1 === g0;
        if ((k % 2) === (r % 2) && k + 1 < L && !gapNext) { out.push(P('b2', ax + dx * (k + 0.5), y, az + dz * (k + 0.5), dx ? 2 : 1, 1, dz ? 2 : 1)); k += 2; }
        else { out.push(P('b1', ax + dx * k, y, az + dz * k, 1, 1, 1)); k++; }
      }
    }
    if (g0 >= 0) { var c = g0 + (gw - 1) / 2; out.push(P('door', ax + dx * c, DH / 2, az + dz * c, dx ? gw - 0.1 : 0.5, DH, dz ? gw - 0.1 : 0.5)); }
    for (var m = 0; m < L; m += 2) out.push(P('m', ax + dx * m, rows + MER[1] / 2, az + dz * m, MER[0], MER[1], MER[2]));
    if (tnt && L >= 3) { var t = 1 + 2 * Math.floor(R() * Math.floor((L - 1) / 2)); if (t < L) out.push(P('tnt', ax + dx * t, rows + 0.58, az + dz * t, 1.16, 1.16, 1.16)); }
  }

  // ---------------- levels ----------------
  // 1.6.0: the phone budget (pieces per castle). Measured in Node (see the doc): the physics stays well inside a
  // 60 fps frame with this many bricks, most of them asleep.
  function levelMax(n) { return n <= 1 ? 170 : n <= 5 ? 360 : n <= 15 ? 460 : n <= 40 ? 560 : 680; }
  function target(n) { return n <= 3 ? 0.65 : n <= 15 ? 0.7 : n <= 60 ? 0.75 : 0.8; }
  var TEMPLATES = ['gatehouse', 'fort', 'rect', 'keepyard', 'citadel', 'twin', 'tall', 'watch'];
  function q(v) { return Math.round(v * K); } // 1.5.0 layout units -> cells
  var TW = 3, KW = 5; // from a tower's / keep's middle to the first wall cell next to it
  // a walled yard: towers at the front corners (and at the back ones if "back"), a wall with a gate at the front
  function yard(out, xl, xr, zb, zf, back, wh, gate, R, tnt, th, roofs) {
    tower(out, xl, zf, th(4, 8), roofs); tower(out, xr, zf, th(4, 8), roofs);
    wall(out, xl + TW, zf, xr - TW, zf, wh, gate, tnt(), R);
    if (back) {
      tower(out, xl, zb, th(4, 8), roofs); tower(out, xr, zb, th(4, 8), roofs);
      wall(out, xl + TW, zb, xr - TW, zb, wh, false, tnt(), R);
      wall(out, xl, zb + TW, xl, zf - TW, wh, false, tnt(), R); wall(out, xr, zb + TW, xr, zf - TW, wh, false, tnt(), R);
    } else {
      wall(out, xl, zb, xr, zb, wh, false, tnt(), R);
      wall(out, xl, zb + 1, xl, zf - TW, wh, false, false, R); wall(out, xr, zb + 1, xr, zf - TW, wh, false, false, R);
    }
  }
  // ex (1.7.0, only for the levels made past the bank; the banked levels pass nothing and build exactly as before):
  // { more: extra layouts in the pool, mirror: build it left-right flipped, tnt: extra TNT crates on the grass }
  function makeLevel(n, seed, ex) {
    var R = rng(seed || n * 9973 + 7), out = [], s = Math.min(1, (n - 1) / 40);
    // heights: 1.5.0's units scaled to rows (0.8 of the size, two rows a unit)
    var th = function (lo, hi) { return Math.max(2, Math.round(K * (lo + (hi - lo) * (0.35 + 0.65 * s) * (0.75 + R() * 0.25)))); };
    var wr = function (lo, hi) { return Math.max(4, th(lo, hi)); }; // walls: at least 4 rows (room for the door)
    var tnt = function () { return n >= 3 && R() < 0.25 + s * 0.4; };
    var pool = n < 8 ? ['watch', 'gatehouse', 'tall'] : n < 16 ? ['watch', 'gatehouse', 'fort', 'keepyard', 'tall'] : TEMPLATES;
    if (ex && ex.more) pool = pool.concat(ex.more);
    var tpl = n === 1 ? 'watch' : n === 2 ? 'gatehouse' : n === 3 ? 'watch' : n === 4 ? 'tall' : n === 5 ? 'gatehouse' : pool[Math.floor(R() * pool.length)];
    var roofs = R() < 0.75, g, d, tx, tz;
    if (tpl === 'watch') { // a tower with walls running off two ways (an open corner of a castle)
      tx = q(-2); tz = q(-2);
      tower(out, tx, tz, th(4, 8), roofs);
      wall(out, tx + TW, tz, tx + TW + th(3, 7), tz, wr(2, 4), n > 5 && R() < 0.5, tnt(), R);
      wall(out, tx, tz + TW, tx, tz + TW + th(3, 6), wr(2, 4), false, tnt(), R);
      if (n > 3 && R() < 0.6) tower(out, q(3), q(3), th(3, 6), roofs);
    } else if (tpl === 'gatehouse') { // two towers and a gate at the front, a walled yard behind
      g = q(3 + Math.floor(R() * (1 + 2 * s))); d = q(2 + Math.floor(R() * (1 + 2 * s)));
      yard(out, -g, g, -d, d, false, wr(2, 4), true, R, tnt, th, roofs);
    } else if (tpl === 'fort') { // four towers and four walls, something inside when it's big enough
      g = q(4 + Math.floor(R() * (1 + 2 * s))); d = g;
      yard(out, -g, g, -d, d, true, wr(2, 4), true, R, tnt, th, roofs);
      if (g >= 7 && R() < 0.6) keep(out, 0, 0, th(3, 6), R() < 0.7); else tower(out, 0, 0, th(4, 8), roofs);
    } else if (tpl === 'rect') { // a long fort with a tower in the middle
      g = q(6 + Math.floor(R() * 2)); d = q(3);
      yard(out, -g, g, -d, d, true, wr(2, 3), true, R, tnt, th, roofs);
      tower(out, 0, 0, th(5, 9), roofs);
    } else if (tpl === 'keepyard') { // a keep at the back, a yard with a gatehouse in front of it
      var kz = q(-3), fx = q(5), fz = q(3);
      keep(out, 0, kz, th(4, 7), R() < 0.75);
      tower(out, -fx, fz, th(4, 7), roofs); tower(out, fx, fz, th(4, 7), roofs);
      wall(out, -fx + TW, fz, fx - TW, fz, wr(2, 3), true, tnt(), R);
      var sw = wr(2, 3);
      wall(out, -fx, fz - TW, -fx, kz, sw, false, tnt(), R); wall(out, fx, fz - TW, fx, kz, sw, false, false, R);
      wall(out, -fx + 1, kz, -KW, kz, sw, false, false, R); wall(out, KW, kz, fx - 1, kz, sw, false, false, R);
    } else if (tpl === 'twin') { // two keeps behind a gate
      var kx = q(4), kz2 = q(-2), ox = q(5), oz = q(4);
      keep(out, -kx, kz2, th(4, 7), R() < 0.6); keep(out, kx, kz2, th(4, 7), R() < 0.6);
      tower(out, -ox, oz, th(3, 6), roofs); tower(out, ox, oz, th(3, 6), roofs);
      wall(out, -ox + TW, oz, ox - TW, oz, wr(2, 3), true, tnt(), R);
      var tw2 = wr(2, 3);
      wall(out, -ox, oz - TW, -ox, kz2 + KW, tw2, false, false, R); wall(out, ox, oz - TW, ox, kz2 + KW, tw2, false, false, R);
    } else if (tpl === 'tall') { // one tall keep with little towers round it
      keep(out, 0, 0, th(5, 9), R() < 0.8);
      var tk = s > 0.3 ? 4 : 2;
      [[-5, -5], [5, -5], [5, 5], [-5, 5]].slice(0, tk).forEach(function (c) { tower(out, q(c[0]), q(c[1] > 0 ? 4 : -4), th(3, 6), roofs); });
      if (n >= 3) wall(out, -q(3), q(5), q(3), q(5), Math.max(3, th(1, 2)), false, tnt(), R);
    } else if (tpl === 'curtain') { // 1.7.0: three towers in a row joined by two walls (one with a gate), a tall one in the middle
      var cx2 = q(6 + Math.floor(R() * 2)), cz = q(1), cwh = wr(2, 4);
      tower(out, -cx2, cz, th(4, 7), roofs); tower(out, 0, cz, th(5, 9), roofs); tower(out, cx2, cz, th(4, 7), roofs);
      var gl = R() < 0.5;
      wall(out, -cx2 + TW, cz, -TW, cz, cwh, gl, tnt(), R); wall(out, TW, cz, cx2 - TW, cz, cwh, !gl, tnt(), R);
      if (R() < 0.6) tower(out, 0, cz - q(4), th(3, 6), roofs); // a little tower behind
    } else if (tpl === 'cross') { // 1.7.0: a keep in the middle, four walls running out to four small towers
      var ca = q(7), cwh2 = wr(2, 3), kr = R() < 0.7;
      keep(out, 0, 0, th(4, 6), kr);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d2) {
        tower(out, d2[0] * ca, d2[1] * ca, th(3, 5), roofs);
        wall(out, d2[0] * KW, d2[1] * KW, d2[0] * (ca - TW), d2[1] * (ca - TW), cwh2, false, d2[1] > 0 && tnt(), R);
      });
    } else { // citadel: a keep inside four towers and walls
      var hc = q(7), cw = 4;
      [[-hc, -hc], [hc, -hc], [hc, hc], [-hc, hc]].forEach(function (c) { tower(out, c[0], c[1], th(4, 7), roofs); });
      wall(out, -hc + TW, hc, hc - TW, hc, cw, true, tnt(), R); wall(out, -hc + TW, -hc, hc - TW, -hc, cw, false, tnt(), R);
      wall(out, -hc, -hc + TW, -hc, hc - TW, cw, false, false, R); wall(out, hc, -hc + TW, hc, hc - TW, cw, false, false, R);
      keep(out, 0, 0, th(4, 6), true);
    }
    // a few TNT crates on the grass next to the walls (from level 6)
    if (n >= 6 && R() < 0.4 + s * 0.3) { var bx0 = out[Math.floor(R() * out.length)]; out.push(['tnt', Math.round(bx0[1] * 2) / 2, 0.375, Math.round(bx0[3] * 2) / 2 + (R() < 0.5 ? 1.25 : -1.25), 0.75, 0.75, 0.75]); }
    // 1.7.0 (made past the bank only): a powder store, a few more crates on the grass just in front of the castle
    // (where the player can see them from the start), spread along its front
    if (ex && ex.tnt) {
      var fz0 = -1e9, lx = 1e9, hx = -1e9;
      out.forEach(function (p) { fz0 = Math.max(fz0, p[3] + p[6] / 2); lx = Math.min(lx, p[1]); hx = Math.max(hx, p[1]); });
      for (var et = 0; et < ex.tnt; et++) out.push(['tnt', Math.round((lx + (hx - lx) * (et + 0.5 + (R() - 0.5) * 0.6) / ex.tnt) * 2) / 2, 0.375, Math.round((fz0 + 0.55 + R() * 0.4) * 4) / 4, 0.75, 0.75, 0.75]);
    }
    // 1.7.0 (made past the bank only): built the other way round (left and right swapped), for variety
    if (ex && ex.mirror) out.forEach(function (p) { p[1] = p[1] ? -p[1] : 0; });
    // keep it light enough for a phone: a castle over the budget is rolled again
    if (!PHYS.noBudget && out.length > levelMax(n)) return null;
    // parts must not overlap (walls meeting towers); a TNT crate that would sit inside something is left out
    for (var i = 0; i < out.length; i++) for (var j = i + 1; j < out.length; j++) { var p1 = out[i], p2 = out[j]; if (p1[0] !== 'tnt' && p2[0] !== 'tnt' && Math.abs(p1[1] - p2[1]) < (p1[4] + p2[4]) / 2 - 0.02 && Math.abs(p1[2] - p2[2]) < (p1[5] + p2[5]) / 2 - 0.02 && Math.abs(p1[3] - p2[3]) < (p1[6] + p2[6]) / 2 - 0.02) return null; }
    out = out.filter(function (p, i) { return p[0] !== 'tnt' || !out.some(function (q2, j) { return j !== i && Math.abs(p[1] - q2[1]) < (p[4] + q2[4]) / 2 - 0.02 && Math.abs(p[2] - q2[2]) < (p[5] + q2[5]) / 2 - 0.02 && Math.abs(p[3] - q2[3]) < (p[6] + q2[6]) / 2 - 0.02; }); });
    return { n: n, seed: seed || n * 9973 + 7, name: tpl, pieces: out, target: target(n) };
  }

  // the level the game plays: the layout roll that tools/gen.mjs proved
  // (LEVELS[n-1] = [the level number it was built as, layout roll, cannonballs, bot's shots]; inside each ten the
  // easier castles come first, so a level may be built as a neighbour's number)
  function level(n, table) {
    var row = table && table[n - 1], src = row ? row[0] : n, k = row ? row[1] : 0, L = makeLevel(src, src * 9973 + 7 + k * 31337);
    for (var j = k + 1; !L && j < k + 40; j++) L = makeLevel(src, src * 9973 + 7 + j * 31337);
    if (!L) return null;
    L.n = n; L.balls = row ? row[2] : 20; L.bot = row ? row[3] : 12; return L;
  }
  // what a piece counts toward the bar (a long brick 2, a half brick 1; roofs weigh about what the bricks under them do)
  function weight(t) { return t === 'b2' ? 2 : t === 'b1' || t === 'tnt' ? 1 : t === 'm' ? 0.5 : t === 'cone' ? 4 : t === 'pyr' ? 8 : 3; }

  // ---------------- physics settings (1.6.0, measured: see the doc) ----------------
  var PHYS = { iters: 8, sleepV: 0.45, sleepT: 0.35, grid: true, fricRed: true, rubble: true, rubbleV: 0.8, rubbleT: 0.25, friction: 0.45, settle: true, settleT: 0.4, moverV2: 1, moverW2: 4 };
  // A grid broadphase. cannon-es's NaiveBroadphase tests every pair of bodies every step (O(n^2): 180,000 pairs for
  // 600 bricks, even asleep), and its SAPBroadphase only works if handed the world when it is made (set later, it
  // sees no bodies: the "missed hits" seen in Topple Fair). This one bins every body by its bounding sphere into
  // cells and tests only the bodies that are awake against what shares a cell with them, with the very same sphere
  // test Naive uses, so it finds exactly the pairs Naive would (asleep-asleep pairs never collide anyway).
  function gridBroadphase(world) {
    var bp = new C.NaiveBroadphase(), CS = 1, SL = C.Body.SLEEPING, ST = C.Body.STATIC, stamp = 0, statics = [], dirty = true;
    // two grids: the sleeping bricks (rebuilt only when one falls asleep, wakes, or a body comes or goes: most of
    // the time nothing changes) and the awake ones (rebuilt every step, usually few)
    function Grid() { this.cells = new Map(); this.used = []; }
    Grid.prototype.clear = function () { for (var i = 0; i < this.used.length; i++) this.used[i].length = 0; this.used.length = 0; };
    Grid.prototype.add = function (b) {
      for (var ix = b.__g0; ix <= b.__g1; ix++) for (var iy = b.__g2; iy <= b.__g3; iy++) for (var iz = b.__g4; iz <= b.__g5; iz++) {
        var k = key(ix, iy, iz), arr = this.cells.get(k); if (!arr) { arr = []; this.cells.set(k, arr); }
        if (!arr.length) this.used.push(arr); arr.push(b);
      }
    };
    var sleepers = new Grid(), wakers = new Grid();
    function key(ix, iy, iz) { return ((ix + 512) * 1024 + (iy + 512)) * 1024 + (iz + 512); }
    function span(b) { var r = b.boundingRadius, p = b.position; b.__g0 = Math.floor((p.x - r) / CS); b.__g1 = Math.floor((p.x + r) / CS); b.__g2 = Math.floor((p.y - r) / CS); b.__g3 = Math.floor((p.y + r) / CS); b.__g4 = Math.floor((p.z - r) / CS); b.__g5 = Math.floor((p.z + r) / CS); }
    world.addEventListener('addBody', function () { dirty = true; }); world.addEventListener('removeBody', function () { dirty = true; });
    bp.collisionPairs = function (world, p1, p2) {
      var bodies = world.bodies, n = bodies.length, i, b, awake = [];
      for (i = 0; i < n; i++) { b = bodies[i]; if (b.type === ST) continue; var sl = b.sleepState === SL; if (b.__sl !== sl) { b.__sl = sl; dirty = true; } if (!sl) awake.push(b); }
      if (dirty) {
        dirty = false; sleepers.clear(); statics.length = 0;
        for (i = 0; i < n; i++) { b = bodies[i]; if (b.type === ST) { if (b.aabbNeedsUpdate) b.updateAABB(); statics.push(b); } else if (b.__sl) { span(b); sleepers.add(b); } }
      }
      wakers.clear();
      for (i = 0; i < awake.length; i++) { span(awake[i]); wakers.add(awake[i]); }
      for (i = 0; i < awake.length; i++) {
        b = awake[i];
        for (var g = 0; g < 2; g++) {
          var G = g ? sleepers : wakers; stamp++;
          for (var ix = b.__g0; ix <= b.__g1; ix++) for (var iy = b.__g2; iy <= b.__g3; iy++) for (var iz = b.__g4; iz <= b.__g5; iz++) {
            var arr = G.cells.get(key(ix, iy, iz)); if (!arr) continue;
            for (var j = 0; j < arr.length; j++) {
              var o = arr[j]; if (o.__st === stamp) continue; o.__st = stamp;
              if (!g && o.id <= b.id) continue; // an awake pair is taken once, from the lower id's side
              if (this.needBroadphaseCollision(b, o)) this.intersectionTest(b, o, p1, p2);
            }
          }
        }
        var r = b.boundingRadius;
        for (var s2 = 0; s2 < statics.length; s2++) {
          var A = statics[s2].aabb;
          if (b.position.x + r < A.lowerBound.x || b.position.x - r > A.upperBound.x || b.position.y + r < A.lowerBound.y || b.position.y - r > A.upperBound.y || b.position.z + r < A.lowerBound.z || b.position.z - r > A.upperBound.z) continue;
          if (this.needBroadphaseCollision(b, statics[s2])) this.intersectionTest(b, statics[s2], p1, p2);
        }
      }
    };
    return bp;
  }

  // ---------------- the physics world ----------------
  function create(level, opts) {
    opts = opts || {};
    var world = new C.World({ gravity: new C.Vec3(0, GRAV, 0) });
    world.allowSleep = true; if (PHYS.fast !== false) fastWorld(world);
    world.broadphase = PHYS.grid ? gridBroadphase(world) : new C.NaiveBroadphase();
    world.solver.iterations = PHYS.iters;
    world.narrowphase.enableFrictionReduction = !!PHYS.fricRed; // two friction equations a touching pair, not two a contact point
    world.defaultContactMaterial.friction = PHYS.friction; world.defaultContactMaterial.restitution = 0.04;
    world.defaultContactMaterial.contactEquationStiffness = 1e7; world.defaultContactMaterial.contactEquationRelaxation = 4;
    var island = new C.Body({ mass: 0, shape: boxShape(new C.Vec3(ISLAND, 1, ISLAND)) }); island.position.set(0, -1, 0); island.isGround = true; world.addBody(island);
    var sim = { world: world, pieces: [], balls: [], ballsLeft: level.balls || 99, shots: 0, t: 0, lastShotT: -99, events: [], level: level, total: 0, down: 0, R: rng((level.seed || 1) + 99) };
    level.pieces.forEach(function (p, idx) {
      var T = TYPES[p[0]], half = new C.Vec3(p[4] / 2, p[5] / 2, p[6] / 2);
      var b = new C.Body({ mass: T.mass, shape: PHYS.fast !== false ? boxShape(half) : new C.Box(half), linearDamping: 0.05, angularDamping: 0.1, allowSleep: true, sleepSpeedLimit: PHYS.sleepV, sleepTimeLimit: PHYS.sleepT });
      b.position.set(p[1], p[2], p[3]); world.addBody(b); b.sleep();
      var pc = { t: p[0], b: b, idx: idx, x0: p[1], y0: p[2], z0: p[3], size: [p[4], p[5], p[6]], w: weight(p[0]), down: false, gone: false, goneT: 0 };
      b.piece = pc; sim.pieces.push(pc); sim.total += pc.w;
      if (p[0] === 'tnt') b.addEventListener('collide', function (e) {
        var v = 0; try { v = Math.abs(e.contact.getImpactVelocityAlongNormal()); } catch (err) { v = 0; }
        if ((e.body && e.body.isBall) || v > 6) pc.boom = true;
      });
      b.addEventListener('collide', function (e) {
        if (pc.t === 'guard' && e.body && e.body.isBall) pc.struck = true;
        if (e.body && e.body.isBall && !sim.hitWake && (!e.body.__burst || e.body.velocity.lengthSquared() > 100)) sim.hitWake = [e.body.position.x, e.body.position.y, e.body.position.z, e.body]; // wake what's round the hit
        if (sim.events.length > 60) return;
        var v = 0; try { v = Math.abs(e.contact.getImpactVelocityAlongNormal()); } catch (err) { v = 0; }
        if (v > 3) sim.events.push({ t: 'hit', m: TYPES[p[0]].mat, v: v, x: b.position.x, y: b.position.y, z: b.position.z, ball: !!(e.body && e.body.isBall) });
      });
    });
    return sim;
  }
  // where the camera (and so the cannon) is for a given turn of the view
  function camAt(yaw) { return [Math.sin(yaw) * CAM.D, CAM.H, Math.cos(yaw) * CAM.D]; }
  function launchAt(yaw) { var c = camAt(yaw); return [c[0] * 0.9, c[1] - 2.2, c[2] * 0.9]; }
  // fire at a point from the cannon at this view angle (the arc allows for gravity)
  function shoot(sim, yaw, p, origin) {
    if (sim.ballsLeft <= 0) return null;
    var L = origin || launchAt(yaw), dx = p[0] - L[0], dy = p[1] - L[1], dz = p[2] - L[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz), t = d / SPEED;
    var b = new C.Body({ mass: BALLM, shape: new C.Sphere(BALLR), linearDamping: 0.01, angularDamping: 0.1 });
    b.position.set(L[0], L[1], L[2]); b.velocity.set(dx / t, dy / t - 0.5 * GRAV * t, dz / t); b.isBall = true;
    sim.world.addBody(b);
    var ball = { b: b, born: sim.t, gone: false };
    sim.balls.push(ball); sim.ballsLeft--; sim.shots++; sim.lastShotT = sim.t;
    return ball;
  }
  // blow up a TNT crate: everything near is thrown outward and up
  var BLAST = 3.0, BURST = { r: 1.3, back: 6, up: 5, side: 3 };
  function explode(sim, pc) {
    var c = pc.b.position, R = BLAST, ex = c.x, ey = c.y, ez = c.z;
    sim.events.push({ t: 'boom', x: ex, y: ey, z: ez });
    remove(sim, pc);
    sim.pieces.forEach(function (q) {
      if (q.gone) return; var p = q.b.position, dx = p.x - ex, dy = p.y - ey, dz = p.z - ez, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > R) return; var k = 16 * (1 - d / R) / Math.max(0.4, d);
      q.b.wakeUp(); q.b.velocity.x += dx * k; q.b.velocity.y += dy * k + 5 * (1 - d / R); q.b.velocity.z += dz * k;
      var f = 8 * (1 - d / R); q.b.angularVelocity.set((sim.R() - 0.5) * f, (sim.R() - 0.5) * f, (sim.R() - 0.5) * f);
      if (q.t === 'tnt' && d < R * 0.8) q.boom = true;
    });
  }
  function remove(sim, pc) { if (pc.gone) return; pc.gone = true; pc.goneT = sim.t; if (pc.b.world) sim.world.removeBody(pc.b); markDown(sim, pc); }
  // a piece that has come down is rubble: it may go to sleep sooner and at a higher speed (a pile of small bricks
  // otherwise jiggles awake for seconds, and awake bricks are what the physics pays for)
  function markDown(sim, pc) { if (!pc.down) { pc.down = true; sim.down += pc.w; sim.events.push({ t: 'down', p: pc }); if (PHYS.rubble && pc.b) { pc.b.sleepSpeedLimit = PHYS.rubbleV; pc.b.sleepTimeLimit = PHYS.rubbleT; } } }
  // bricks near a moving one wake up (so a brick whose support was knocked away falls). The sleeping bricks are
  // binned by column (x, z) so each mover only looks at the few columns round it.
  var WAKE = 1.0, cols = new Map(), colUsed = [];
  function wakeNear(sim) {
    var movers = [], i, pcs = sim.pieces;
    for (i = 0; i < pcs.length; i++) { var q = pcs[i]; if (!q.gone && q.b.sleepState !== 2 && (q.b.velocity.lengthSquared() > PHYS.moverV2 || q.b.angularVelocity.lengthSquared() > PHYS.moverW2)) movers.push(q.b); }
    sim.balls.forEach(function (bl) { if (!bl.gone) movers.push(bl.b); });
    if (!movers.length) return;
    for (i = 0; i < colUsed.length; i++) colUsed[i].length = 0;
    colUsed.length = 0;
    for (i = 0; i < pcs.length; i++) {
      var s = pcs[i]; if (s.gone || s.b.sleepState !== 2) continue;
      var k = (Math.floor(s.b.position.x) + 512) * 1024 + Math.floor(s.b.position.z) + 512, arr = cols.get(k);
      if (!arr) { arr = []; cols.set(k, arr); } if (!arr.length) colUsed.push(arr); arr.push(s.b);
    }
    for (i = 0; i < movers.length; i++) {
      var m = movers[i].position, cx = Math.floor(m.x), cz = Math.floor(m.z);
      for (var ax = cx - 1; ax <= cx + 1; ax++) for (var az = cz - 1; az <= cz + 1; az++) {
        var a2 = cols.get((ax + 512) * 1024 + az + 512); if (!a2 || !a2.length) continue;
        for (var j = 0; j < a2.length; j++) { var p = a2[j].position; if (a2[j].sleepState === 2 && Math.abs(m.x - p.x) < WAKE && Math.abs(m.z - p.z) < WAKE && Math.abs(m.y - p.y) < WAKE) a2[j].wakeUp(); }
      }
    }
  }
  function step(sim, dt) {
    dt = dt || 1 / 60;
    if(sim.level.guards)sim.pieces.forEach(function(p){var b=p.b;b.position.z=0;b.velocity.z=0;b.angularVelocity.x=b.angularVelocity.y=0;b.quaternion.x=b.quaternion.y=0;b.quaternion.normalize();});
    sim.world.step(dt); sim.t += dt; sim.frame = (sim.frame || 0) + 1;
    // a cannonball hit wakes every brick near it at once (a sleeping brick is as solid as the ground)
    if (sim.hitWake) {
      var hw = sim.hitWake, ball = hw[3]; sim.hitWake = null;
      sim.pieces.forEach(function (q) { if (q.gone || q.b.sleepState !== 2) return; var p = q.b.position; if (Math.abs(p.x - hw[0]) < 2 && Math.abs(p.y - hw[1]) < 2.6 && Math.abs(p.z - hw[2]) < 2) q.b.wakeUp(); });
      // 1.6.0: the ball's first hit bursts the bricks round it loose: they jump back out of the wall toward the
      // cannon and up (the only way they are free to go; pushed into the wall they would just stop against it), a
      // little to the sides, spinning, so a hit sprays small bricks about instead of only denting the wall (once a ball)
      if (ball && !ball.__burst) {
        ball.__burst = true;
        var bv = ball.velocity, sp = Math.sqrt(bv.x * bv.x + bv.y * bv.y + bv.z * bv.z) || 1, ux = bv.x / sp, uz = bv.z / sp, hl = Math.sqrt(ux * ux + uz * uz) || 1;
        ux /= hl; uz /= hl; // back along the shot, level
        sim.pieces.forEach(function (q) {
          if (q.gone) return; var p = q.b.position, dx = p.x - hw[0], dy = p.y - hw[1], dz = p.z - hw[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          var radius = ball.isSide ? .9 : BURST.r; if (d > radius) return; var f = (1 - d / radius) * (ball.isSide ? .22 : 1), side = (sim.R() - 0.5) * 2 * BURST.side;
          q.b.wakeUp();
          q.b.velocity.x += (-ux * BURST.back - uz * side) * f; q.b.velocity.y += (BURST.up + Math.max(0, dy) * 2) * f; q.b.velocity.z += (-uz * BURST.back + ux * side) * f;
          q.b.angularVelocity.set((sim.R() - 0.5) * 10 * f, (sim.R() - 0.5) * 10 * f, (sim.R() - 0.5) * 10 * f);
        });
      }
    }
    // a flying cannonball wakes the bricks just ahead of it, a few steps before it gets there: a sleeping brick is
    // as solid as the ground, so a ball arriving at a wall woken only where it touches would stop dead against the
    // sleeping bricks behind (found in 1.6.0 testing: a shot fired a step later did nothing at all)
    sim.balls.forEach(function (bl) {
      if (bl.gone) return; var b = bl.b, v = b.velocity; if (b.__burst || v.lengthSquared() < 25) return; // only on its way in
      var ax = b.position.x + v.x * 0.05, ay = b.position.y + v.y * 0.05, az = b.position.z + v.z * 0.05;
      sim.pieces.forEach(function (q) { if (q.gone || q.b.sleepState !== 2) return; var p = q.b.position; if (Math.abs(p.x - ax) < 1.8 && Math.abs(p.y - ay) < 2.2 && Math.abs(p.z - az) < 1.8) q.b.wakeUp(); });
    });
    wakeNear(sim);
    // settle: cannon-es puts a body to sleep only after its speed stays under the limit the whole time, and in a
    // pile of small bricks the solver's jitter keeps flicking them over it, so hundreds stay awake for seconds (the
    // physics cost). Here a smoothed speed is used: a piece whose average stays low for PHYS.settleT goes to sleep.
    if (PHYS.settle) sim.pieces.forEach(function (pc) {
      if (pc.gone) return; var b = pc.b; if (b.sleepState === 2) { pc.ez = 0; pc.slowT = 0; return; }
      var s2 = b.velocity.lengthSquared() + b.angularVelocity.lengthSquared(), lim = pc.down ? PHYS.rubbleV : PHYS.sleepV;
      pc.ez = (pc.ez || s2) * 0.8 + s2 * 0.2;
      if (pc.ez < lim * lim) { pc.slowT = (pc.slowT || 0) + dt; if (pc.slowT > PHYS.settleT) { b.sleep(); pc.slowT = 0; } } else pc.slowT = 0;
    });
    sim.pieces.forEach(function (pc) {
      if (pc.gone) return;
      if (pc.boom) { pc.boom = false; explode(sim, pc); return; }
      var p = pc.b.position;
      if (p.y < WATER || Math.abs(p.x) > ISLAND + 3 || Math.abs(p.z) > ISLAND + 3) { remove(sim, pc); sim.events.push({ t: 'splash', x: p.x, z: p.z }); return; }
      if (!pc.down && pc.b.sleepState !== 2) { var dx = p.x - pc.x0, dy = p.y - pc.y0, dz = p.z - pc.z0, qw = Math.abs(pc.b.quaternion.w); if (pc.t === 'guard' ? (pc.struck || dy < -.65 || dx * dx + dy * dy + dz * dz > 1.6) : (dy < -0.3 || dx * dx + dy * dy + dz * dz > 0.1 || qw < 0.97)) markDown(sim, pc); } // moved or tipped over
      // a TNT crate that falls blows up
      if (pc.t === 'tnt' && pc.down && !pc.boomed) { pc.boomed = true; pc.boom = true; }
    });
    sim.balls.forEach(function (bl) {
      if (!bl.gone && (sim.t - bl.born > BALL_LIFE || bl.b.position.y < WATER - 1)) { bl.gone = true; bl.goneT = sim.t; if (bl.b.world) sim.world.removeBody(bl.b); }
    });
    sim.balls = sim.balls.filter(function (bl) { return !bl.gone || sim.t - bl.goneT < 0.5; });
  }
  function progress(sim) { return sim.total ? sim.down / sim.total : 0; }
  function won(sim) { return progress(sim) >= sim.level.target; }
  function flying(sim) { return sim.balls.some(function (b) { return !b.gone; }); }
  function settled(sim) {
    if (flying(sim)) return false;
    return sim.pieces.every(function (pc) { if (pc.gone) return true; var b = pc.b; return b.sleepState === 2 || (b.velocity.lengthSquared() < 0.05 && b.angularVelocity.lengthSquared() < 0.1); });
  }
  function takeEvents(sim) { var e = sim.events; sim.events = []; return e; }

  // ---------------- bot ----------------
  // Aim at the bottom of whatever still stands tallest (or at a TNT crate), from the side it is on. (Standing bricks
  // are binned by column so this stays quick with hundreds of bricks.)
  function botAim(sim, R) {
    var up = sim.pieces.filter(function (pc) { return !pc.gone && !pc.down; });
    if (!up.length) return null;
    var colw = {}, best = null, bs = -1e9;
    up.forEach(function (q) { var p = q.b.position, k = Math.floor(p.x / 2.2) + ',' + Math.floor(p.z / 2.2); (colw[k] = colw[k] || []).push(q); });
    up.forEach(function (pc) {
      var p = pc.b.position, above = 0, gx = Math.floor(p.x / 2.2), gz = Math.floor(p.z / 2.2);
      for (var ax = gx - 1; ax <= gx + 1; ax++) for (var az = gz - 1; az <= gz + 1; az++) (colw[ax + ',' + az] || []).forEach(function (q) { var o = q.b.position; if (Math.abs(o.x - p.x) < 2.2 && Math.abs(o.z - p.z) < 2.2 && o.y > p.y) above += q.w; });
      var s = above / 4 - p.y * 1.5 + (pc.t === 'tnt' ? 6 : 0) + (R ? R() * 3 : 0);
      if (s > bs) { bs = s; best = pc; }
    });
    var p = best.b.position, yaw = Math.atan2(p.x, p.z) + (R ? (R() - 0.5) * 0.5 : 0);
    if (Math.hypot(p.x, p.z) < 1.5) yaw = R ? R() * Math.PI * 2 : 0;
    return { yaw: yaw, p: [p.x, Math.max(0.3, p.y), p.z] };
  }
  // 1.7.0: the bot game can be run a step at a time (botStart, then botTick until it says done), so the phone can
  // play it in slices; botPlay runs it to the end. Same moves, same physics, same answer as before.
  function botStart(level, max, seed) {
    var lv = { n: level.n, seed: level.seed, pieces: level.pieces, balls: max || 30, target: level.target };
    return { sim: create(lv), R: rng(seed || 5), guard: 0, done: false };
  }
  function botTick(st) {
    var sim = st.sim;
    if (won(sim) || st.guard >= 60 * 150) { st.done = true; return true; }
    if (sim.ballsLeft > 0 && sim.t - sim.lastShotT > 1.1) { var a = botAim(sim, st.R); if (a) shoot(sim, a.yaw, a.p); } // a shot every second or so, like a player
    if (sim.ballsLeft <= 0 && !flying(sim) && (settled(sim) || sim.t - sim.lastShotT > 5)) { st.done = true; return true; }
    step(sim); st.guard++; return false;
  }
  function botResult(st) { var sim = st.sim; return { won: won(sim), shots: sim.shots, t: sim.t, progress: progress(sim) }; }
  function botPlay(level, max, seed) { var st = botStart(level, max, seed); while (!botTick(st)) { /* play on */ } return botResult(st); }

  // ---------------- endless levels (1.7.0) ----------------
  // Glenn: "i would like 'unlimited' levels in the way most of the ios games offer unlimited". Levels 1-400 are the
  // banked, proven ones (src/levels.json). Past 400 a level is made on the phone from its number, the way tools/gen.mjs
  // made the bank: roll k's castle is makeLevel(n, n*9973 + 7 + k*31337) (the very same seed formula), it must stand
  // with every brick awake, the bot must knock it down with 40 cannonballs (seed 5), and then again (seed 17) with only
  // the cannonballs the level will give. The first roll that passes is the level. makeLevel's castles are already at
  // the top tier from level 41 (all eight layouts, tallest towers, biggest yards, most TNT, the 680-piece budget), so
  // the castles keep their variety for ever; what still grows, gently, is the spare cannonballs: half the bot's count
  // at 401, down to 40% by 700 (never fewer than 3 spare). Every level ending in 5 is a breather: a smaller castle
  // built as one of levels 16-30 (75% goal), so the run has the ups and downs the bank's "easier first in each ten" gave.
  // Variety for the top tier (endlessStyle, from the level number only): two more layouts join the eight (a curtain
  // wall of three towers, a cross of four walls round a keep), half the castles are built mirrored, about one in six
  // is a powder store (2-3 extra TNT crates on the grass), and the stone and roofs take one of five looks (grey stone
  // with slate, sandstone with red tiles, red brick with dark slate, dark basalt with copper green, pale limestone
  // with blue), never the same look two levels running.
  var BANKED = 400, GEN = { rolls: 8, bots: 40 }, MORE = ['curtain', 'cross'];
  function endlessBuildAs(n) { return n % 10 === 5 ? 16 + Math.floor(n / 10) % 15 : n; }
  function endlessSeed(n, k) { return (n * 9973 + 7 + k * 31337) % 4294967296; }
  function endlessStyle(n) {
    var h = Math.floor(rng(n * 7919 + 13)() * 1e6);
    return { more: MORE, mirror: (h & 1) === 1, tnt: h % 6 === 0 ? 2 + (h >> 1) % 2 : 0, theme: (3 * n + Math.floor(n / 7)) % 5 };
  }
  function endlessShape(n, k) { var ex = endlessStyle(n), L = makeLevel(endlessBuildAs(n), endlessSeed(n, k), ex); if (L) { L.n = n; L.theme = ex.theme; L.powder = ex.tnt > 0; } return L; }
  function endlessSpare(n, bot) { var f = n % 10 === 5 ? 0.5 : 0.5 - 0.1 * Math.min(1, Math.max(0, n - BANKED) / 300); return Math.max(3, Math.ceil(bot * f)); }
  // the level the game plays past the bank: row = [roll, cannonballs, bot's shots, 'p' proven / 'r' rule]
  function endlessLevel(n, row) { var L = endlessShape(n, row[0]); if (!L) return null; L.balls = row[1]; L.bot = row[2]; L.how = row[3]; return L; }
  // The safe rule, used only when no roll passes within GEN.rolls tries or the phone runs out of time: the first roll
  // that stood (else the first that built) with RULE cannonballs. Measured (see the doc): in the bank's levels
  // 41-400 the bot's first game (40 cannonballs) never needed more than 25 (95% needed 19 or fewer) and no level
  // gives more than 38; in the 28 sampled generated levels (tools/endless.mjs --rule) the bot won all 56 games (seeds 17 and 23) with 40.
  var RULE = { balls: 40, bot: 16 };
  // A job: makes level n a slice at a time. job.run(ms) works for about ms milliseconds and returns the row once
  // it's done (else null: call again); job.giveUp() returns the safe-rule row at once.
  function genJob(n) {
    var j = { n: n, k: -1, tried: 0, phase: 'next', L: null, sim: null, i: 0, st: null, a: null, balls: 0, firstK: -1, stoodK: -1, steps: 0, res: null };
    var now = typeof performance !== 'undefined' ? function () { return performance.now(); } : Date.now;
    j.giveUp = function () {
      if (j.res) return j.res;
      var k = j.stoodK >= 0 ? j.stoodK : j.firstK;
      for (var kk = 0; k < 0 && kk < 40; kk++) if (endlessShape(n, kk)) k = kk;
      j.res = [Math.max(0, k), RULE.balls, RULE.bot, 'r']; return j.res;
    };
    j.run = function (ms) {
      var t0 = now();
      while (!j.res) {
        if (j.phase === 'next') {
          if (j.tried >= GEN.rolls || j.k >= 39) return j.giveUp();
          j.k++; j.L = endlessShape(n, j.k); if (!j.L) continue;
          j.tried++; if (j.firstK < 0) j.firstK = j.k;
          // 1. it must stand on its own: every brick woken for 3 s (tools/gen.mjs's stands(), a step at a time)
          j.sim = create(j.L); j.sim.pieces.forEach(function (p) { p.b.wakeUp(); }); j.i = 0; j.phase = 'stand';
        } else if (j.phase === 'stand') {
          step(j.sim); j.steps++;
          var i = j.i++, asleep = i > 30 && j.sim.pieces.every(function (p) { return p.gone || p.b.sleepState === 2; });
          if (asleep || j.i >= 180) {
            if (progress(j.sim) > 0.005) j.phase = 'next';
            else { if (j.stoodK < 0) j.stoodK = j.k; j.st = botStart(j.L, GEN.bots, 5); j.phase = 'a'; }
            j.sim = null;
          }
        } else if (j.phase === 'a') { // 2. the bot with plenty of cannonballs
          j.steps++;
          if (botTick(j.st)) {
            j.a = botResult(j.st);
            if (!j.a.won || j.a.shots < 2) j.phase = 'next';
            else { j.balls = j.a.shots + endlessSpare(n, j.a.shots); j.st = botStart(j.L, j.balls, 17); j.phase = 'b'; }
          }
        } else { // 3. again, another way, with only the level's cannonballs
          j.steps++;
          if (botTick(j.st)) { var b = botResult(j.st); if (b.won) j.res = [j.k, j.balls, Math.min(j.a.shots, b.shots), 'p']; else j.phase = 'next'; j.st = null; }
        }
        if (!j.res && now() - t0 >= ms) return null;
      }
      return j.res;
    };
    return j;
  }

  return { BANKED: BANKED, GEN: GEN, RULE: RULE, endlessStyle: endlessStyle, endlessLevel: endlessLevel, endlessShape: endlessShape, endlessBuildAs: endlessBuildAs, endlessSpare: endlessSpare, genJob: genJob, botStart: botStart, botTick: botTick, botResult: botResult, use: use, rng: rng, TYPES: TYPES, CAM: CAM, ISLAND: ISLAND, WATER: WATER, BALLR: BALLR, GRAV: GRAV, SPEED: SPEED, CELL: CELL, PHYS: PHYS, levelMax: levelMax, makeLevel: makeLevel, level: level, create: create, camAt: camAt, launchAt: launchAt,
    setBall: function (m, r, v) { BALLM = m; if (r) BALLR = r; if (v) SPEED = v; }, BURST: BURST, shoot: shoot, step: step, progress: progress, won: won, flying: flying, settled: settled, takeEvents: takeEvents, botAim: botAim, botPlay: botPlay, target: target };
})();
if (typeof module !== 'undefined') module.exports = CC;
