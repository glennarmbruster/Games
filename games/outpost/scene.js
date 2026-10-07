
/* Outpost Rush scenery (three.js). Three regions with their own ground, border and props: a sunny meadow (pine hedges,
   crates, logs), a desert with a railroad along the top (sand, cacti, rocks, tires), a snowy tundra (snowy pines,
   snowmen, ice blocks). Buildings: round toy barracks that gain floors as they grow, factories with a smoking chimney,
   lattice sniper towers with their range circle on the ground, rocket launchers that turn to their target, and big
   forts; the number on a team-coloured cube on top with 1-3 link dots. Map elements: rocks / trees / ponds / ice
   blocks, rivers and ravines with broken bridges (planks appear as troops build them), wooden fences (they burst into
   planks), mine fields (black mines with a blinking red light), gold bar stacks. See-through lanes with marching
   chevrons; soldiers, tanks, paratroopers and rockets are instanced (hundreds stay smooth); capture bursts, hit puffs,
   explosions, level-up arrows and the drag line. The camera is orthographic at a fixed 3/4 angle and frames the field.
   0.3.0 adds five regions: a lava wasteland (dark basalt, lava rivers and pools that glow, cube rocks, skulls), a
   tropical jungle (palms, ferns, water inlets, treasure chests), an autumn forest (orange / red / yellow trees, leaf
   piles, logs, pumpkins), a canyon mesa (red rock mesas, a dry riverbed, boulders) and a night harbor (cobbles, canals,
   houses with lit windows, lanterns, boats; night-toned but bright enough to read). Numbers over 63 (levels that raise
   the cap to 120) are drawn in gold.
   0.4.0: drawn paths (Draw Mode) are see-through ribbons along the drawn line (and the finger's line while drawing);
   gates are arches with a see-through blue (+, x) or red (-) panel and a big label; the horde are toy rust bots (olive
   bodies, rusty heads, a glowing visor) with pulsing markers where a wave comes in; the boss citadel is a big stone
   keep with a mortar on top whose shells fly in high arcs onto warning rings.
   OPScene.build(THREE, canvas, OP) returns what the app needs. Drawing only: the rules live in logic.js. */
var OPScene = (function () {
  'use strict';
  var TEAM = [
    { main: '#a3abb8', dark: '#6f7785', light: '#d7dce4', win: '#4a5160' },   // gray (neutral)
    { main: '#287cf5', dark: '#2356b8', light: '#9cc2ff', win: '#1b2f66' },   // blue (you)
    { main: '#f4674b', dark: '#be3e2e', light: '#ffc4a9', win: '#5a1418' },   // red
    { main: '#38b68d', dark: '#23893a', light: '#a6ecb2', win: '#124d1f' },   // green
    { main: '#a47bf3', dark: '#7140be', light: '#d9c2ff', win: '#44256e' },   // yellow
    { main: '#8c9a62', dark: '#5e6a3c', light: '#cdd8a0', win: '#2a3118' }    // the horde (0.4.0): olive rust bots
  ];
  // the regions: ground, field, light, border
  var REG = [
    { name: 'Meadow', bg: '#94ba8c', ground: ['#a9c798', [154, 186, 139]], hemi: [0xf4fbff, 0x5d8f45, 1.55], sun: 1.9, blob: '20,50,10', stripe: ['rgba(255,255,255,.07)', 'rgba(40,90,20,.05)'] },
    { name: 'Desert', bg: '#f0c77e', ground: ['#f2cd86', [236, 196, 120]], hemi: [0xfff8ec, 0xb08850, 1.5], sun: 1.95, blob: '90,55,10', stripe: ['rgba(255,255,255,.08)', 'rgba(160,110,40,.06)'] },
    { name: 'Tundra', bg: '#dfeefa', ground: ['#e4f1fb', [206, 226, 244]], hemi: [0xf4f8ff, 0x8aa8c8, 1.45], sun: 1.7, blob: '40,70,110', stripe: ['rgba(255,255,255,.18)', 'rgba(120,160,210,.07)'] },
    { name: 'Lava', bg: '#3b302e', ground: ['#4a3c39', [80, 62, 58]], hemi: [0xfff0e6, 0x7a3a24, 1.7], sun: 1.9, sunC: 0xffe0c4, blob: '0,0,0', stripe: ['rgba(255,150,70,.05)', 'rgba(0,0,0,.09)'] },
    { name: 'Jungle', bg: '#91bd96', ground: ['#99c6a2', [136, 183, 150]], hemi: [0xf4fff4, 0x3f7d45, 1.55], sun: 1.9, blob: '10,50,20', stripe: ['rgba(255,255,255,.06)', 'rgba(10,70,30,.07)'] },
    { name: 'Autumn', bg: '#c4a462', ground: ['#c9ae6a', [186, 152, 88]], hemi: [0xfff6e6, 0x8a6a3a, 1.55], sun: 1.9, sunC: 0xffe8c8, blob: '70,45,10', stripe: ['rgba(255,255,255,.07)', 'rgba(120,70,20,.06)'] },
    { name: 'Canyon', bg: '#d98a5c', ground: ['#de9466', [206, 128, 88]], hemi: [0xfff2e8, 0x9a5030, 1.5], sun: 1.95, blob: '100,40,15', stripe: ['rgba(255,255,255,.07)', 'rgba(140,50,20,.06)'] },
    { name: 'Harbor', bg: '#2b3656', ground: ['#46557a', [74, 88, 124]], hemi: [0xf0f0f8, 0x3c4058, 1.8], sun: 1.3, sunC: 0xfff0dc, blob: '0,0,20', stripe: ['rgba(255,255,255,.05)', 'rgba(0,0,30,.08)'] }
  ];
  var PITCH = 56 * Math.PI / 180;

  function build(T, canvas, OP) {
    var W = OP.W, H = OP.H;
    function X(x) { return x - W / 2; }
    function Z(y) { return y - H / 2; }
    function lam(c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c, flatShading: false }, o || {})); }
    function ctex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
    var R = OP.rng(424242); function rnd(a, b) { return a + (b - a) * R(); }
    var mtx = new T.Matrix4(), q = new T.Quaternion(), v3 = new T.Vector3(), sc3 = new T.Vector3(), up = new T.Vector3(0, 1, 0), eul = new T.Euler();
    // merge several (geometry, matrix) pairs into one geometry (one draw call per instanced unit type)
    function merge(list) {
      var parts = list.map(function (it) { var g = (it[0].index ? it[0].toNonIndexed() : it[0].clone()); if (it[1]) g.applyMatrix4(it[1]); return g; });
      var n = 0; parts.forEach(function (g) { n += g.attributes.position.count; });
      var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), o = 0;
      parts.forEach(function (g) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; });
      var out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); return out;
    }
    function M(x, y, z, rx, ry, rz, s) { eul.set(rx || 0, ry || 0, rz || 0); q.setFromEuler(eul); return new T.Matrix4().compose(new T.Vector3(x, y, z), q.clone(), new T.Vector3(s || 1, s || 1, s || 1)); }

    // ---------------- renderer, camera, light ----------------
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    var DPR = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(DPR);
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
    var scene = new T.Scene(); scene.background = new T.Color(REG[0].bg);
    var camera = new T.OrthographicCamera(-5, 5, 5, -5, 0.1, 200);
    var CD = 60; camera.position.set(0, Math.sin(PITCH) * CD, Math.cos(PITCH) * CD); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    var hemi = new T.HemisphereLight(0xf4fbff, 0x5d8f45, 1.55); scene.add(hemi);
    var sun = new T.DirectionalLight(0xfff4e0, 1.9); sun.position.set(-6, 14, 8); scene.add(sun); sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    Object.assign(sun.shadow.camera,{left:-11,right:11,top:14,bottom:-14,near:1,far:40});sun.shadow.bias=-.001;sun.shadow.normalBias=.04;sun.shadow.camera.updateProjectionMatrix();

    // ---------------- ground per region ----------------
    var groundTex = REG.map(function (g, ri) {
      var t = ctex(512, 512, function (x, w, h) {
        x.fillStyle = g.ground[0]; x.fillRect(0, 0, w, h); var c = g.ground[1];
        for (var i = 0; i < 1800; i++) { var l = rnd(0.96, 1.04); x.fillStyle = 'rgba(' + Math.round(c[0] * l) + ',' + Math.round(c[1] * l) + ',' + Math.round(c[2] * l) + ',.45)'; if (ri === 1) x.fillRect(rnd(0, w), rnd(0, h), rnd(6, 16), rnd(1, 2)); else x.fillRect(rnd(0, w), rnd(0, h), rnd(2, 5), rnd(2, 6)); }
        if (ri === 2) for (var k = 0; k < 160; k++) { x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
        if (ri === 3) { // glowing cracks in the basalt
          x.lineCap = 'round';
          for (var q2 = 0; q2 < 22; q2++) { var cx = rnd(0, w), cy = rnd(0, h); x.strokeStyle = 'rgba(255,' + Math.round(rnd(90, 150)) + ',40,' + rnd(0.35, 0.7).toFixed(2) + ')'; x.lineWidth = rnd(1.5, 3); x.beginPath(); x.moveTo(cx, cy); for (var sgi = 0; sgi < 4; sgi++) { cx += rnd(-22, 22); cy += rnd(-22, 22); x.lineTo(cx, cy); } x.stroke(); }
        }
        if (ri === 5) { var lc = ['#e0662a', '#c93c28', '#f0a42a', '#b8752e']; for (var q3 = 0; q3 < 420; q3++) { x.fillStyle = lc[q3 % 4]; x.globalAlpha = 0.55; x.beginPath(); x.ellipse(rnd(0, w), rnd(0, h), rnd(2, 4), rnd(1, 2), rnd(0, 3), 0, 7); x.fill(); } x.globalAlpha = 1; }
        if (ri === 6) for (var q4 = 0; q4 < 14; q4++) { x.fillStyle = q4 % 2 ? 'rgba(160,70,30,.10)' : 'rgba(255,220,180,.10)'; x.fillRect(0, rnd(0, h), w, rnd(4, 14)); }
        if (ri === 7) { x.strokeStyle = 'rgba(20,26,50,.35)'; x.lineWidth = 2; for (var cyy = 0; cyy < h; cyy += 16) for (var cxx = (cyy / 16) % 2 ? 0 : -12; cxx < w; cxx += 24) { x.beginPath(); if (x.roundRect) x.roundRect(cxx + 1, cyy + 1, 22, 14, 5); else x.rect(cxx + 1, cyy + 1, 22, 14); x.stroke(); } }
      });
      t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(20, 20); return t;
    });
    var groundM = new T.MeshLambertMaterial({ map: groundTex[0] });
    var ground = new T.Mesh(new T.PlaneGeometry(120, 120), groundM); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground); ground.receiveShadow=true;
    var fieldTex = REG.map(function (g) { return ctex(64, 512, function (x, w, h) { for (var i = 0; i < 12; i++) { x.fillStyle = i % 2 ? g.stripe[0] : g.stripe[1]; x.fillRect(0, i * h / 12, w, h / 12); } }); });
    var fieldM = new T.MeshBasicMaterial({ map: fieldTex[0], transparent: true, depthWrite: false });
    var field = new T.Mesh(new T.PlaneGeometry(W + 0.4, H + 0.4), fieldM); field.rotation.x = -Math.PI / 2; field.position.y = -0.01; field.visible=false; scene.add(field);

    // blob shadow texture (under buildings and props)
    var blobTex = REG.map(function (g) { return ctex(64, 64, function (x) { var gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(' + g.blob + ',.42)'); gr.addColorStop(1, 'rgba(' + g.blob + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }); });
    var blobM = new T.MeshBasicMaterial({ map: blobTex[0], transparent: true, depthWrite: false });
    var blobG = new T.PlaneGeometry(1, 1); blobG.rotateX(-Math.PI / 2);
    function blob(x, y, r, parent) { var m = new T.Mesh(blobG, blobM); m.scale.set(r * 2, 1, r * 2 * 0.9); m.position.set(parent ? 0.12 : X(x) + 0.12, 0.004, parent ? 0.1 : Z(y) + 0.1); (parent || scene).add(m); return m; }

    // shared materials
    var woodM = lam('#b07a45'), woodDark = lam('#8a5a30'), metalM = lam('#6f6a64'), bushM = lam('#4fb246'), bushM2 = lam('#63c257'), stoneM = lam('#d9d2c3'), rockM = lam('#9aa0a8'), rockM2 = lam('#b5bac1');
    var snowM = lam('#f7fbff'), iceM = new T.MeshLambertMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.82, flatShading: true }), cactusM = lam('#4c9e4a'), tireM = lam('#2f3136'), boneM = lam('#efe6d2');
    var pineM1 = lam('#316956'), pineM2 = lam('#568c66'), trunkM = lam('#7a5232'), goldM = new T.MeshLambertMaterial({ color: '#ffc83d', emissive: '#6b4a00', flatShading: true });
    var crateTex = ctex(64, 64, function (x, w, h) { x.fillStyle = '#c98f52'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a5a30'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); x.lineWidth = 5; x.beginPath(); x.moveTo(6, 6); x.lineTo(w - 6, h - 6); x.stroke(); x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, h / 2, w, 2); });
    var crateM = new T.MeshLambertMaterial({ map: crateTex });
    // 0.3.0 regions
    var basaltM = lam('#2f2729'), basaltM2 = lam('#403538'), lavaGlowM = new T.MeshBasicMaterial({ color: '#ff7a1a' }), emberM = new T.MeshBasicMaterial({ color: '#ffb23a' });
    var palmTrunkM = lam('#9a6a3c'), palmLeafM = lam('#2fa34a'), palmLeafM2 = lam('#46bd5a'), fernM = lam('#2e9a48');
    var autumnM = [lam('#e8742a'), lam('#d2412c'), lam('#f2b233'), lam('#c9602a')], barkM = lam('#6b4a2e');
    var mesaM = lam('#b85a36'), mesaTopM = lam('#d98556'), mesaBandM = lam('#9c4528'), boulderM = lam('#c2754a');
    var quayM = lam('#8a93a8'), hullM = lam('#7a4b2a'), lampM = new T.MeshBasicMaterial({ color: '#ffe08a' }), postM = lam('#2b2f3a');
    var lavaTex = ctex(128, 128, function (x, w, h) { var gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff5a14'); gr.addColorStop(0.5, '#ff9a2a'); gr.addColorStop(1, '#ff5a14'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 26; i++) { x.fillStyle = i % 3 ? 'rgba(255,230,120,.55)' : 'rgba(150,30,0,.45)'; x.beginPath(); x.ellipse(rnd(0, w), rnd(0, h), rnd(6, 18), rnd(2, 5), 0, 0, 7); x.fill(); } });
    lavaTex.wrapS = lavaTex.wrapT = T.RepeatWrapping;
    var lavaM = new T.MeshBasicMaterial({ map: lavaTex });
    var glowTex = ctex(64, 64, function (x) { var g = x.createRadialGradient(32, 32, 1, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
    function glow(parent, x, y, z, s, color, op) { var m = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: color, transparent: true, opacity: op || 0.55, depthWrite: false, blending: T.AdditiveBlending })); m.position.set(x, y, z); m.scale.set(s, s, 1); parent.add(m); return m; }
    // houses: a wall with windows (some lit), the lit ones glow in the dark (emissive map)
    function winTex(lit) { return ctex(128, 128, function (x, w, h) { x.fillStyle = lit ? '#000' : '#8f7a6a'; x.fillRect(0, 0, w, h); if (!lit) { x.fillStyle = 'rgba(0,0,0,.12)'; for (var r = 0; r < 8; r++) x.fillRect(0, r * 16, w, 2); }
      var R2 = OP.rng(lit ? 99 : 99); for (var yy = 0; yy < 3; yy++) for (var xx = 0; xx < 3; xx++) { var on = R2() < 0.62; x.fillStyle = lit ? (on ? '#ffd873' : '#000') : (on ? '#ffe7a0' : '#2a3048'); x.fillRect(14 + xx * 38, 14 + yy * 38, 24, 26); } }); }
    var houseM = new T.MeshLambertMaterial({ map: winTex(false), emissiveMap: winTex(true), emissive: '#ffffff', emissiveIntensity: 1 });
    var roofMs = [lam('#b8433a'), lam('#3f5f8a'), lam('#5a6e4a'), lam('#8a5a3a')];
    var palmTrunkG = merge([[new T.CylinderGeometry(0.055, 0.075, 0.42, 6), M(0, 0.21, 0)], [new T.CylinderGeometry(0.05, 0.06, 0.42, 6), M(0.035, 0.6, 0, 0, 0, -0.14)], [new T.CylinderGeometry(0.045, 0.055, 0.4, 6), M(0.1, 0.97, 0, 0, 0, -0.24)]]);
    var palmLeafG = (function () { var fr = new T.BoxGeometry(0.62, 0.025, 0.16); fr.translate(0.3, 0, 0); var l = []; for (var i = 0; i < 7; i++) l.push([fr, M(0.14, 1.15, 0, 0, i / 7 * 6.283 + 0.3, -0.42 - (i % 2) * 0.15)]); l.push([new T.IcosahedronGeometry(0.08, 0), M(0.14, 1.13, 0)]); return merge(l); })();
    var oakTrunkG = new T.CylinderGeometry(0.06, 0.085, 0.5, 6); oakTrunkG.translate(0, 0.25, 0);
    var oakTopG = merge([[new T.IcosahedronGeometry(0.36, 0), M(0, 0.72, 0)], [new T.IcosahedronGeometry(0.26, 0), M(0.2, 0.62, 0.1)], [new T.IcosahedronGeometry(0.24, 0), M(-0.18, 0.66, -0.08)]]);
    var mesaG = new T.CylinderGeometry(0.85, 1.0, 0.7, 7); mesaG.translate(0, 0.35, 0);
    var mesaTopG = new T.CylinderGeometry(0.72, 0.85, 0.36, 7); mesaTopG.translate(0, 0.88, 0);
    var mesaBandG = new T.CylinderGeometry(0.855, 0.9, 0.12, 7); mesaBandG.translate(0, 0.52, 0);
    var cubeRockG = new T.BoxGeometry(0.5, 0.5, 0.5); cubeRockG.translate(0, 0.22, 0);
    var pineLow = new T.ConeGeometry(0.48, 0.78, 12); pineLow.translate(0, 0.62, 0);
    var pineTop = new T.ConeGeometry(0.34, 0.72, 12); pineTop.translate(0, 1.05, 0);
    var trunkG = new T.CylinderGeometry(0.07, 0.09, 0.3, 6); trunkG.translate(0, 0.15, 0);

    // ---------------- borders (per region, rebuilt when the region changes) ----------------
    var border = new T.Group(); scene.add(border); var borderReg = -1;
    function instanced(geo, mat, spots) {
      var im = new T.InstancedMesh(geo, mat, Math.max(1, spots.length)); im.count = spots.length;
      spots.forEach(function (p, i) { q.setFromAxisAngle(up, p[3] !== undefined ? p[3] : rnd(0, 6)); mtx.compose(v3.set(X(p[0]), p[4] || 0, Z(p[1])), q, sc3.set(p[2], p[2] * (p[5] || 1), p[2])); im.setMatrixAt(i, mtx); });
      im.castShadow=true;im.receiveShadow=true;border.add(im); return im;
    }
    function outside(n, pad, far) { var o = []; for (var i = 0; i < n * 3 && o.length < n; i++) { var fx = rnd(-far, W + far), fy = rnd(-far, H + far); if (fx > -pad && fx < W + pad && fy > -pad && fy < H + pad) continue; o.push([fx, fy, rnd(0.9, 1.5)]); } return o; }
    function buildBorder(ri) {
      while (border.children.length) border.remove(border.children[0]);
      borderReg = ri; anim.length = 0;
      var spots = [], k;
      function hedge(x0, y0, x1, y1, step) { var len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step)); for (var i = 0; i <= n; i++) { var f = i / n; spots.push([x0 + (x1 - x0) * f + rnd(-0.08, 0.08), y0 + (y1 - y0) * f + rnd(-0.08, 0.08), rnd(0.85, 1.05)]); } }
      var E = 0.4;
      if (ri === 0) {
        for(k=0;k<115;k++){
          var side=k%4,yy=side<2?rnd(-1.1,H+1.1):side===2?rnd(-2.6,-.7):rnd(H+.7,H+2.6);
          var xx=side===0?rnd(-2.7,-.6):side===1?rnd(W+.6,W+2.7):rnd(-1.5,W+1.5);
          spots.push([xx,yy,rnd(.7,1.35)]);
        }
        spots=spots.concat(outside(140,2.8,14));
        instanced(pineLow,pineM1,spots);instanced(pineTop,pineM2,spots);instanced(trunkG,trunkM,spots);
        var stones=outside(45,.8,5);instanced(new T.IcosahedronGeometry(.22,1),stoneM,stones);
      } else if (ri === 1) {
        // the railroad along the top: two rails on sleepers, a little wagon; rocks, cacti and tires around the field
        var y0 = -1.35, ties = [], rocks = [], cacti = [];
        for (k = -14; k <= W + 14; k += 0.42) ties.push([k, y0, 1, Math.PI / 2]);
        var tieG = new T.BoxGeometry(0.72, 0.06, 0.13); tieG.translate(0, 0.03, 0); instanced(tieG, woodDark, ties);
        [-0.22, 0.22].forEach(function (dz) { var r = new T.Mesh(new T.BoxGeometry(W + 30, 0.05, 0.05), metalM); r.position.set(0, 0.09, Z(y0) + dz); border.add(r); });
        var wag = new T.Group(); var wb = new T.Mesh(new T.BoxGeometry(1.1, 0.42, 0.62), lam('#8a5a30')); wb.position.y = 0.33; wag.add(wb);
        var wt = new T.Mesh(new T.BoxGeometry(1.16, 0.08, 0.68), lam('#5b3b1f')); wt.position.y = 0.56; wag.add(wt);
        [-0.35, 0.35].forEach(function (wx) { [-0.3, 0.3].forEach(function (wz) { var wh = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.06, 10), metalM); wh.rotation.x = Math.PI / 2; wh.position.set(wx, 0.13, wz); wag.add(wh); }); });
        var ore = new T.Mesh(new T.IcosahedronGeometry(0.26, 0), goldM); ore.position.set(0.1, 0.62, 0); ore.scale.set(1.4, 0.6, 0.9); wag.add(ore);
        wag.position.set(X(W * 0.72), 0, Z(y0)); border.add(wag);
        var tank = new T.Group(); var tb = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 1.0, 12), lam('#c0392b')); tb.rotation.z = Math.PI / 2; tb.position.y = 0.45; tank.add(tb);
        var tb2 = new T.Mesh(new T.BoxGeometry(1.1, 0.1, 0.6), lam('#5b3b1f')); tb2.position.y = 0.12; tank.add(tb2); tank.position.set(X(W * 0.72 - 1.3), 0, Z(y0)); border.add(tank);
        for (k = 0; k < 180; k++) { var fx = rnd(-12, W + 12), fy = rnd(-12, H + 12); if (fx > -0.9 && fx < W + 0.9 && fy > -2.2 && fy < H + 0.9) continue; if (Math.abs(fy - y0) < 0.6) continue; if (R() < 0.6) rocks.push([fx, fy, rnd(0.5, 1.2), rnd(0, 6), 0.1, rnd(0.6, 1)]); else cacti.push([fx, fy, rnd(0.8, 1.3)]); }
        var rockG = new T.IcosahedronGeometry(0.4, 0); rockG.translate(0, 0.2, 0); instanced(rockG, lam('#d49a5a'), rocks);
        var cacG = merge([[new T.CylinderGeometry(0.1, 0.12, 0.8, 7), M(0, 0.4, 0)], [new T.CylinderGeometry(0.06, 0.06, 0.3, 6), M(0.16, 0.45, 0, 0, 0, Math.PI / 2)], [new T.CylinderGeometry(0.06, 0.06, 0.28, 6), M(0.28, 0.6, 0)], [new T.CylinderGeometry(0.05, 0.05, 0.22, 6), M(-0.13, 0.35, 0, 0, 0, -Math.PI / 2)], [new T.CylinderGeometry(0.05, 0.05, 0.2, 6), M(-0.22, 0.48, 0)]]);
        instanced(cacG, cactusM, cacti);
        // a low wooden rail along the field's sides
        var posts = []; for (k = 0; k <= H; k += 1.0) { posts.push([-0.5, k, 1, 0]); posts.push([W + 0.5, k, 1, 0]); }
        var postG = new T.BoxGeometry(0.08, 0.34, 0.08); postG.translate(0, 0.17, 0); instanced(postG, woodDark, posts);
        [-0.5, W + 0.5].forEach(function (px) { var rl = new T.Mesh(new T.BoxGeometry(0.05, 0.06, H), woodM); rl.position.set(X(px), 0.26, Z(H / 2)); border.add(rl); });
      } else if (ri >= 3) { lateBorder(ri, hedge, E);
      } else {
        hedge(-E, -0.45, W + E, -0.45, 0.62); hedge(-E, H + 0.45, W + E, H + 0.45, 0.62); hedge(-E, -0.1, -E, H + 0.1, 0.7); hedge(W + E, -0.1, W + E, H + 0.1, 0.7);
        spots = spots.concat(outside(420, 1.3, 14));
        instanced(pineLow, lam('#2f7f5a'), spots); instanced(pineTop, snowM, spots); instanced(trunkG, trunkM, spots);
        var mounds = outside(80, 1.6, 12).map(function (p) { return [p[0], p[1], rnd(0.8, 1.8), 0, 0, 0.45]; });
        var moundG = new T.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); instanced(moundG, snowM, mounds);
        for (k = 0; k < 6; k++) { var sm = snowman(); var a = k / 6 * 6.28; sm.position.set(X(k % 2 ? -1.5 - R() * 2 : W + 1.5 + R() * 2), 0, Z(1 + k * 3)); sm.rotation.y = a; border.add(sm); }
      }
    }
    // 0.3.0's regions round the field (the space above and below the field shows on a tall phone, so both get scenery)
    var anim = []; // things that move: lava textures, glows that flicker, boats that bob
    function flat(x, y, w, h, mat, yy) { var m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.rotation.x = -Math.PI / 2; m.position.set(X(x), yy || 0.0, Z(y)); border.add(m); return m; }
    function lateBorder(ri, hedge, E) {
      var spots = [], k, a, b, c, d;
      function split(list, n) { var out = []; for (var i = 0; i < n; i++) out.push([]); list.forEach(function (p, i) { out[i % n].push(p); }); return out; }
      if (ri === 3) {
        // lava wasteland: a rim of dark cube rocks, basalt boulders, lava pools and a lava river below, volcanoes and a big skull above
        hedge(-E, -0.5, W + E, -0.5, 0.5); hedge(-E, H + 0.5, W + E, H + 0.5, 0.5); hedge(-E - 0.1, -0.1, -E - 0.1, H + 0.1, 0.5); hedge(W + E + 0.1, -0.1, W + E + 0.1, H + 0.1, 0.5);
        spots.forEach(function (p) { p[2] *= 0.75; p[3] = rnd(0, 1.5); }); instanced(cubeRockG, basaltM2, spots);
        var rocks = outside(300, 1.2, 14).map(function (p) { return [p[0], p[1], rnd(0.5, 1.4), rnd(0, 6), 0.05, rnd(0.6, 1.1)]; });
        var rg = new T.DodecahedronGeometry(0.4, 0); rg.translate(0, 0.2, 0); instanced(rg, basaltM, rocks);
        instanced(cubeRockG, basaltM2, outside(90, 1.4, 12).map(function (p) { return [p[0], p[1], rnd(0.6, 1.3), rnd(0, 1.5)]; }));
        var river = flat(W / 2, H + 3.2, W + 30, 1.6, lavaM, 0.004); anim.push({ tex: lavaTex, sx: 0.03, sy: 0.02 });
        flat(W / 2, H + 3.2, W + 30, 2.0, basaltM, 0.001);
        for (k = 0; k < 7; k++) { a = [[-2.2, 3], [W + 2.4, 6], [-2.6, 11], [W + 2.2, 13.5], [1.5, -3.6], [W - 1.2, -4.2], [-2.8, H + 1.2]][k]; var pl = new T.Mesh(new T.CircleGeometry(rnd(0.5, 0.9), 12), lavaM); pl.rotation.x = -Math.PI / 2; pl.scale.set(1.4, 1, 1); pl.position.set(X(a[0]), 0.006, Z(a[1])); border.add(pl); glow(border, X(a[0]), 0.3, Z(a[1]), 2.2, 0xff7a2a, 0.35); }
        glow(border, 0, 0.4, Z(H + 3.2), 3.5, 0xff7a2a, 0.3);
        [[-3.5, -3.2, 1.6], [W / 2 + 0.5, -4.6, 2.2], [W + 3.4, -3, 1.4]].forEach(function (v) { var vc = new T.Mesh(new T.CylinderGeometry(0.45 * v[2], 1.5 * v[2], 1.3 * v[2], 9), basaltM); vc.position.set(X(v[0]), 0.65 * v[2], Z(v[1])); border.add(vc); var cr = new T.Mesh(new T.CylinderGeometry(0.34 * v[2], 0.34 * v[2], 0.05, 9), lavaM); cr.position.set(X(v[0]), 1.31 * v[2], Z(v[1])); border.add(cr); glow(border, X(v[0]), 1.5 * v[2], Z(v[1]), 1.6 * v[2], 0xff8a3a, 0.5); });
        var sk = skull(1.0); sk.position.set(X(-1.9), 0, Z(-1.6)); sk.rotation.y = 0.5; border.add(sk);
        var sk2 = skull(0.8); sk2.position.set(X(W + 1.8), 0, Z(H + 1.4)); sk2.rotation.y = -0.6; border.add(sk2);
      } else if (ri === 4) {
        // jungle: a bush hedge, palms and ferns round the field, a sandy beach and a lagoon below, treasure chests
        hedge(-E, -0.45, W + E, -0.45, 0.5); hedge(-E, H + 0.45, W + E, H + 0.45, 0.5); hedge(-E, -0.1, -E, H + 0.1, 0.5); hedge(W + E, -0.1, W + E, H + 0.1, 0.5);
        var bushG = merge([[new T.IcosahedronGeometry(0.3, 0), M(0, 0.2, 0)], [new T.IcosahedronGeometry(0.22, 0), M(0.24, 0.15, 0.08)], [new T.IcosahedronGeometry(0.2, 0), M(-0.22, 0.14, -0.06)]]);
        var hs = split(spots, 2); instanced(bushG, bushM, hs[0]); instanced(bushG, fernM, hs[1]);
        var palms = outside(230, 1.3, 14); instanced(palmTrunkG, palmTrunkM, palms); var ps = split(palms, 2); instanced(palmLeafG, palmLeafM, ps[0]); instanced(palmLeafG, palmLeafM2, ps[1]);
        instanced(bushG, fernM, outside(120, 1.2, 12).map(function (p) { return [p[0], p[1], rnd(0.8, 1.4)]; }));
        flat(W / 2, H + 2.6, W + 30, 1.8, lam('#f0dc9c'), 0.003);
        var lag = flat(W / 2, H + 5.5, W + 30, 4.4, new T.MeshLambertMaterial({ color: '#58c4d8', map: waterTex }), 0.005);
        for (k = 0; k < 3; k++) { var ch = chest(); ch.position.set(X([-1.6, W + 1.5, -1.4][k]), 0, Z([4, 9, 14.5][k])); ch.rotation.y = rnd(-0.6, 0.6); border.add(ch); }
      } else if (ri === 5) {
        // autumn forest: a row of orange / red / yellow trees round the field, a deep forest beyond, leaf piles
        hedge(-E, -0.5, W + E, -0.5, 0.6); hedge(-E, H + 0.5, W + E, H + 0.5, 0.6); hedge(-E - 0.1, -0.1, -E - 0.1, H + 0.1, 0.62); hedge(W + E + 0.1, -0.1, W + E + 0.1, H + 0.1, 0.62);
        var trees = spots.concat(outside(420, 1.3, 14));
        instanced(oakTrunkG, barkM, trees); split(trees, 4).forEach(function (g4, i) { instanced(oakTopG, autumnM[i], g4); });
        var pileG = new T.SphereGeometry(0.4, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2); pileG.scale(1, 0.35, 1);
        split(outside(60, 1.4, 10).map(function (p) { return [p[0], p[1], rnd(0.7, 1.3)]; }), 2).forEach(function (g2, i) { instanced(pileG, autumnM[i ? 2 : 0], g2); });
      } else if (ri === 6) {
        // canyon mesa: boulders along the rim, red rock mesas and a few cacti beyond
        hedge(-E, -0.5, W + E, -0.5, 0.7); hedge(-E, H + 0.5, W + E, H + 0.5, 0.7); hedge(-E - 0.1, -0.1, -E - 0.1, H + 0.1, 0.7); hedge(W + E + 0.1, -0.1, W + E + 0.1, H + 0.1, 0.7);
        var bg = new T.DodecahedronGeometry(0.3, 0); bg.translate(0, 0.16, 0); spots.forEach(function (p) { p[5] = 0.7; }); instanced(bg, boulderM, spots);
        var mesas = [], m0 = []; for (k = 0; k < 400 && mesas.length < 46; k++) { var fx = rnd(-14, W + 14), fy = rnd(-14, H + 14); if (fx > -2.2 && fx < W + 2.2 && fy > -2.4 && fy < H + 2.4) continue; var sc = rnd(1.0, 2.4); if (mesas.some(function (mm) { return Math.hypot(mm[0] - fx, mm[1] - fy) < (mm[2] + sc) * 0.9; })) continue; mesas.push([fx, fy, sc, rnd(0, 6), 0, rnd(0.8, 1.6)]); }
        instanced(mesaG, mesaM, mesas); instanced(mesaTopG, mesaTopM, mesas); instanced(mesaBandG, mesaBandM, mesas);
        instanced(bg, boulderM, outside(160, 1.3, 13).map(function (p) { return [p[0], p[1], rnd(0.8, 1.8), rnd(0, 6), 0, 0.8]; }));
        var cacG2 = merge([[new T.CylinderGeometry(0.1, 0.12, 0.8, 7), M(0, 0.4, 0)], [new T.CylinderGeometry(0.06, 0.06, 0.3, 6), M(0.16, 0.45, 0, 0, 0, Math.PI / 2)], [new T.CylinderGeometry(0.06, 0.06, 0.28, 6), M(0.28, 0.6, 0)]]);
        instanced(cacG2, cactusM, outside(40, 1.4, 10));
      } else {
        // night harbor: a stone quay round the field, water on three sides with boats, lamp posts, houses with lit windows above
        var hwM = new T.MeshLambertMaterial({ color: '#4f79b8', map: waterTex });
        flat(-15.6, H / 2, 30, H + 40, hwM, 0.005); flat(W + 15.6, H / 2, 30, H + 40, hwM, 0.005); flat(W / 2, H + 15.7, W + 1.2, 30, hwM, 0.005);
        [[-0.45, H / 2, 0.3, H + 1.2], [W + 0.45, H / 2, 0.3, H + 1.2], [W / 2, H + 0.45, W + 1.2, 0.3]].forEach(function (q2) { var qm = new T.Mesh(new T.BoxGeometry(q2[2], 0.16, q2[3]), quayM); qm.position.set(X(q2[0]), 0.06, Z(q2[1])); border.add(qm); });
        var bol = []; for (k = 0.8; k < H; k += 1.6) { bol.push([-0.45, k, 1]); bol.push([W + 0.45, k, 1]); }
        var bolG = new T.CylinderGeometry(0.07, 0.09, 0.22, 8); bolG.translate(0, 0.25, 0); instanced(bolG, postM, bol);
        for (k = 1.6; k < H; k += 3.2) [-0.45, W + 0.45].forEach(function (lx) { border.add(lamp(lx, k)); });
        for (k = 0; k < 6; k++) { var bt = boat(); bt.position.set(X(k % 2 ? W + 1.6 + rnd(0, 2) : -1.6 - rnd(0, 2)), 0, Z(1.5 + k * 2.8)); bt.rotation.y = rnd(-0.3, 0.3) + (k % 2 ? Math.PI : 0); border.add(bt); anim.push({ mesh: bt, bob: rnd(0, 6) }); }
        for (k = 0; k < 3; k++) { var bt2 = boat(); bt2.position.set(X(1.5 + k * 3), 0, Z(H + 2.2 + (k % 2) * 1.2)); bt2.rotation.y = Math.PI / 2 + rnd(-0.3, 0.3); border.add(bt2); anim.push({ mesh: bt2, bob: rnd(0, 6) }); }
        // houses in rows above the field (the quay street), lit windows
        for (var row = 0; row < 3; row++) for (var hx = -8; hx < W + 8; hx += 1.35 + rnd(0, 0.4)) { var hs2 = house(rnd(0.9, 1.25), rnd(0.8, 1.6)); hs2.position.set(X(hx), 0, Z(-1.3 - row * 1.7 - rnd(0, 0.3))); border.add(hs2); }
        for (k = 0; k < W; k += 2.2) border.add(lamp(k + 0.6, -0.55));
      }
    }
    function skull(sz) {
      var g = new T.Group(), bm = boneM, dk = lam('#2a2226');
      var cr = new T.Mesh(new T.SphereGeometry(0.42 * sz, 12, 9), bm); cr.scale.set(1, 0.9, 1.05); cr.position.y = 0.5 * sz; g.add(cr);
      var jaw = new T.Mesh(new T.BoxGeometry(0.46 * sz, 0.2 * sz, 0.34 * sz), bm); jaw.position.set(0, 0.16 * sz, 0.2 * sz); g.add(jaw);
      [-0.15, 0.15].forEach(function (ex) { var e = new T.Mesh(new T.SphereGeometry(0.11 * sz, 8, 6), dk); e.position.set(ex * sz, 0.5 * sz, 0.35 * sz); e.scale.set(1, 1.1, 0.6); g.add(e); });
      var ns = new T.Mesh(new T.ConeGeometry(0.05 * sz, 0.1 * sz, 3), dk); ns.rotation.x = Math.PI; ns.position.set(0, 0.36 * sz, 0.4 * sz); g.add(ns);
      for (var t = 0; t < 4; t++) { var th = new T.Mesh(new T.BoxGeometry(0.07 * sz, 0.07 * sz, 0.03 * sz), bm); th.position.set((-0.12 + t * 0.08) * sz, 0.27 * sz, 0.38 * sz); g.add(th); }
      blob(0, 0, 0.55 * sz, g); return g;
    }
    function chest() {
      var g = new T.Group(), wd = lam('#8a5328'), band = lam('#e0b43a');
      var bx = new T.Mesh(new T.BoxGeometry(0.5, 0.26, 0.32), wd); bx.position.y = 0.13; g.add(bx);
      var lid = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.5, 10, 1, false, 0, Math.PI), wd); lid.rotation.z = Math.PI / 2; lid.position.set(0, 0.26, -0.02); lid.rotation.x = -0.9; g.add(lid);
      [-0.18, 0.18].forEach(function (bx2) { var b = new T.Mesh(new T.BoxGeometry(0.05, 0.27, 0.33), band); b.position.set(bx2, 0.135, 0); g.add(b); });
      for (var i = 0; i < 5; i++) { var gb = new T.Mesh(new T.BoxGeometry(0.14, 0.06, 0.07), goldM); gb.position.set(-0.14 + i * 0.07, 0.28 + (i % 2) * 0.04, 0.02); gb.rotation.y = rnd(-0.4, 0.4); g.add(gb); }
      blob(0, 0, 0.4, g); return g;
    }
    function lamp(x, y) {
      var g = new T.Group(); var po = new T.Mesh(new T.CylinderGeometry(0.03, 0.045, 0.9, 6), postM); po.position.y = 0.45; g.add(po);
      var hd = new T.Mesh(new T.BoxGeometry(0.14, 0.16, 0.14), lampM); hd.position.y = 0.95; g.add(hd);
      var cap = new T.Mesh(new T.ConeGeometry(0.12, 0.08, 4), postM); cap.rotation.y = Math.PI / 4; cap.position.y = 1.07; g.add(cap);
      glow(g, 0, 0.95, 0, 1.3, 0xffd07a, 0.55);
      var pool = new T.Mesh(new T.CircleGeometry(0.55, 16), new T.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.16, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.012; g.add(pool);
      g.position.set(X(x), 0, Z(y)); return g;
    }
    function boat() {
      var g = new T.Group(); var hl = new T.Mesh(new T.BoxGeometry(1.1, 0.2, 0.42), hullM); hl.position.y = 0.08; g.add(hl);
      var bow = new T.Mesh(new T.CylinderGeometry(0.21, 0.21, 0.2, 3), hullM); bow.rotation.y = Math.PI / 6; bow.position.set(0.55, 0.08, 0); bow.scale.set(1.3, 1, 1); g.add(bow);
      var cab = new T.Mesh(new T.BoxGeometry(0.34, 0.22, 0.3), houseM); cab.position.set(-0.15, 0.29, 0); g.add(cab);
      var rf = new T.Mesh(new T.BoxGeometry(0.4, 0.04, 0.36), lam('#e8e2d6')); rf.position.set(-0.15, 0.42, 0); g.add(rf);
      var ml = new T.Mesh(new T.SphereGeometry(0.035, 6, 5), lampM); ml.position.set(0.3, 0.3, 0); g.add(ml);
      return g;
    }
    function house(wd, ht) {
      var g = new T.Group(), body = new T.Mesh(new T.BoxGeometry(wd, ht, 0.9), houseM); body.position.y = ht / 2; g.add(body);
      var rf = new T.Mesh(new T.CylinderGeometry(0.01, wd * 0.62, 0.45, 4, 1), roofMs[Math.floor(rnd(0, 4))]); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.75); rf.position.y = ht + 0.22; g.add(rf);
      return g;
    }
    function snowman() {
      var g = new T.Group();
      [[0.26, 0.24], [0.19, 0.6], [0.14, 0.88]].forEach(function (b) { var m = new T.Mesh(new T.SphereGeometry(b[0], 12, 9), snowM); m.position.y = b[1]; g.add(m); });
      var nose = new T.Mesh(new T.ConeGeometry(0.035, 0.16, 6), lam('#f08a24')); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.88, 0.18); g.add(nose);
      var hat = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.14, 10), lam('#2b2b33')); hat.position.y = 1.06; g.add(hat);
      var brim = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.025, 12), lam('#2b2b33')); brim.position.y = 0.99; g.add(brim);
      var scarf = new T.Mesh(new T.TorusGeometry(0.15, 0.035, 5, 12), lam('#e0474c')); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.76; g.add(scarf);
      blob(0, 0, 0.35, g); return g;
    }

    // ---------------- props (decoration) ----------------
    var propGroup = new T.Group(); scene.add(propGroup);
    function makeProp(p) {
      var g = new T.Group(), k = p[0];
      if (k === 'crates') {
        var n = 1 + Math.floor(rnd(1, 3.9)), spots = [[0, 0, 0], [0.46, 0, 0.05], [0.22, 0.42, 0.02], [-0.44, 0, -0.08]];
        for (var c = 0; c < n; c++) { var b = new T.Mesh(new T.BoxGeometry(0.42, 0.42, 0.42), crateM); b.position.set(spots[c][0], 0.21 + spots[c][1], spots[c][2]); b.rotation.y = rnd(-0.2, 0.2); g.add(b); }
        blob(0, 0, 0.55, g);
      } else if (k === 'barrel') {
        for (var bi = 0; bi < 2; bi++) { var br = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.42, 10), woodM); br.position.set(bi * 0.38, 0.21, bi * 0.1); g.add(br);
          [0.08, 0.34].forEach(function (y) { var band = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.04, 10), metalM); band.position.set(br.position.x, y, br.position.z); g.add(band); }); }
        blob(0.2, 0, 0.45, g);
      } else if (k === 'logs') {
        [[0, 0.1, 0], [0, 0.1, 0.22], [0, 0.29, 0.11]].forEach(function (l) { var m = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 1.0, 8), woodM); m.rotation.z = Math.PI / 2; m.position.set(l[0], l[1], l[2] - 0.1); g.add(m);
          var end = new T.Mesh(new T.CircleGeometry(0.085, 8), lam('#e2b77f')); end.position.set(0.501, l[1], l[2] - 0.1); end.rotation.y = Math.PI / 2; g.add(end); });
        blob(0, 0, 0.6, g).scale.set(1.3, 1, 0.6);
      } else if (k === 'cactus') {
        var cm = new T.Mesh(merge([[new T.CylinderGeometry(0.1, 0.12, 0.8, 7), M(0, 0.4, 0)], [new T.CylinderGeometry(0.06, 0.06, 0.3, 6), M(0.16, 0.45, 0, 0, 0, Math.PI / 2)], [new T.CylinderGeometry(0.06, 0.06, 0.28, 6), M(0.28, 0.6, 0)]]), cactusM); g.add(cm); blob(0, 0, 0.3, g);
      } else if (k === 'tires') {
        [[0, 0.08, 0], [0, 0.24, 0], [0.42, 0.08, 0.1]].forEach(function (t) { var m = new T.Mesh(new T.TorusGeometry(0.16, 0.07, 6, 12), tireM); m.rotation.x = Math.PI / 2; m.position.set(t[0], t[1], t[2]); g.add(m); }); blob(0.2, 0, 0.45, g);
      } else if (k === 'bones') {
        var sk = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), boneM); sk.position.set(0, 0.12, 0); sk.scale.set(1.2, 0.9, 1); g.add(sk);
        [-0.2, 0.25].forEach(function (x) { var bn = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.45, 5), boneM); bn.rotation.z = Math.PI / 2; bn.rotation.y = x; bn.position.set(x + 0.2, 0.04, 0.2); g.add(bn); }); blob(0, 0, 0.35, g);
      } else if (k === 'skullp') { var sk = skull(0.45); g.add(sk); [-0.2, 0.25].forEach(function (x) { var bn = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.45, 5), boneM); bn.rotation.z = Math.PI / 2; bn.rotation.y = x; bn.position.set(x + 0.25, 0.04, 0.3); g.add(bn); });
      } else if (k === 'cuberock') { [[0, 0, 0.5], [0.4, 0.1, 0.32], [-0.3, 0.25, 0.28]].forEach(function (b, i) { var m = new T.Mesh(new T.BoxGeometry(b[2], b[2], b[2]), i ? basaltM2 : basaltM); m.position.set(b[0], b[2] / 2, b[1]); m.rotation.y = rnd(0, 1.5); g.add(m); }); blob(0, 0, 0.5, g);
      } else if (k === 'vent') { var rim = new T.Mesh(new T.CylinderGeometry(0.34, 0.4, 0.1, 9), basaltM); rim.position.y = 0.05; g.add(rim); var lv = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.02, 9), lavaM); lv.position.y = 0.1; g.add(lv); glow(g, 0, 0.3, 0, 1.2, 0xff7a2a, 0.45);
      } else if (k === 'palmp') { var pt2 = new T.Mesh(palmTrunkG, palmTrunkM), pl2 = new T.Mesh(palmLeafG, palmLeafM2); g.add(pt2); g.add(pl2); blob(0, 0, 0.45, g);
      } else if (k === 'goldstack') { g.add(chest());
      } else if (k === 'fern') { for (var fi = 0; fi < 6; fi++) { var fr = new T.Mesh(new T.BoxGeometry(0.34, 0.02, 0.1), fernM); fr.geometry.translate(0.17, 0, 0); fr.rotation.set(0, fi / 6 * 6.28, 0.5); fr.position.y = 0.05; g.add(fr); } blob(0, 0, 0.35, g);
      } else if (k === 'leaves') { [[0, 0, 0.36, 0], [0.34, 0.1, 0.26, 2], [-0.26, 0.14, 0.24, 1]].forEach(function (b) { var m = new T.Mesh(new T.SphereGeometry(b[2], 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), autumnM[b[3]]); m.scale.y = 0.4; m.position.set(b[0], 0, b[1]); g.add(m); });
      } else if (k === 'pumpkin') { [[0, 0, 0.17], [0.3, 0.1, 0.12]].forEach(function (b) { var m = new T.Mesh(new T.SphereGeometry(b[2], 10, 7), lam('#f08a1c')); m.scale.y = 0.75; m.position.set(b[0], b[2] * 0.7, b[1]); g.add(m); var stm = new T.Mesh(new T.CylinderGeometry(0.02, 0.025, 0.08, 5), lam('#5a7a2a')); stm.position.set(b[0], b[2] * 1.45, b[1]); g.add(stm); }); blob(0.1, 0, 0.35, g);
      } else if (k === 'oakp') { var ot = new T.Mesh(oakTrunkG, barkM), oc = new T.Mesh(oakTopG, autumnM[Math.floor(rnd(0, 4))]); g.add(ot); g.add(oc); blob(0, 0, 0.5, g);
      } else if (k === 'mushroom') { [[0, 0, 1], [0.18, 0.1, 0.7], [-0.14, 0.12, 0.6]].forEach(function (b) { var st2 = new T.Mesh(new T.CylinderGeometry(0.04 * b[2], 0.05 * b[2], 0.14 * b[2], 6), boneM); st2.position.set(b[0], 0.07 * b[2], b[1]); g.add(st2); var cp = new T.Mesh(new T.SphereGeometry(0.1 * b[2], 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), lam('#d23a2a')); cp.position.set(b[0], 0.13 * b[2], b[1]); g.add(cp); }); blob(0, 0, 0.3, g);
      } else if (k === 'boulder') { [[0, 0, 0.3], [0.34, 0.1, 0.18]].forEach(function (b) { var m = new T.Mesh(new T.DodecahedronGeometry(b[2], 0), boulderM); m.position.set(b[0], b[2] * 0.7, b[1]); m.rotation.set(rnd(0, 3), rnd(0, 3), 0); g.add(m); }); blob(0, 0, 0.45, g);
      } else if (k === 'wheel') { var wh = new T.Mesh(new T.TorusGeometry(0.24, 0.035, 5, 14), woodDark); wh.rotation.x = Math.PI / 2; wh.position.y = 0.04; g.add(wh); for (var sp = 0; sp < 4; sp++) { var spk = new T.Mesh(new T.BoxGeometry(0.46, 0.025, 0.03), woodM); spk.rotation.y = sp * Math.PI / 4; spk.position.y = 0.04; g.add(spk); }
      } else if (k === 'lantern') { var ln2 = lamp(0, 0); ln2.position.set(0, 0, 0); g.add(ln2);
      } else if (k === 'anchor') { var am = lam('#3a4150'); var sh = new T.Mesh(new T.BoxGeometry(0.06, 0.03, 0.5), am); sh.position.y = 0.03; g.add(sh); var ar = new T.Mesh(new T.TorusGeometry(0.2, 0.03, 5, 12, Math.PI), am); ar.rotation.x = -Math.PI / 2; ar.position.set(0, 0.03, 0.22); g.add(ar); var rg2 = new T.Mesh(new T.TorusGeometry(0.06, 0.02, 5, 10), am); rg2.rotation.x = Math.PI / 2; rg2.position.set(0, 0.03, -0.28); g.add(rg2);
      } else if (k === 'rope') { var rm = lam('#d8c08a'); for (var ri2 = 0; ri2 < 3; ri2++) { var tr4 = new T.Mesh(new T.TorusGeometry(0.2 - ri2 * 0.05, 0.03, 5, 14), rm); tr4.rotation.x = Math.PI / 2; tr4.position.y = 0.03 + ri2 * 0.04; g.add(tr4); } blob(0, 0, 0.3, g);
      } else if (k === 'snowman') { g.add(snowman());
      } else if (k === 'snowbank') { var sb = new T.Mesh(new T.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), snowM); sb.scale.set(1.2, 0.45, 0.8); g.add(sb);
      } else if (k === 'pine') {
        var pl = new T.Mesh(pineLow, lam('#2f7f5a')), pt = new T.Mesh(pineTop, snowM), tr = new T.Mesh(trunkG, trunkM); g.add(pl); g.add(pt); g.add(tr); blob(0, 0, 0.45, g);
      } else {
        [[0, 0.2, 0, 0.32], [0.3, 0.15, 0.1, 0.24], [-0.26, 0.14, 0.08, 0.22]].forEach(function (s, i) { var m = new T.Mesh(new T.IcosahedronGeometry(s[3], 0), i ? bushM2 : bushM); m.position.set(s[0], s[1], s[2]); g.add(m); });
        blob(0, 0, 0.5, g);
      }
      g.position.set(X(p[1]), 0, Z(p[2])); g.rotation.y = p[3];
      propGroup.add(g);
    }

    // ---------------- map elements ----------------
    var elGroup = new T.Group(); scene.add(elGroup);
    var waterTex = ctex(128, 128, function (x, w, h) { x.fillStyle = '#4fb3e8'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; for (var i = 0; i < 9; i++) { var yy = rnd(0, h), xx = rnd(0, w); x.beginPath(); x.moveTo(xx, yy); x.quadraticCurveTo(xx + 10, yy - 5, xx + 22, yy); x.stroke(); } });
    waterTex.wrapS = waterTex.wrapT = T.RepeatWrapping;
    var waterM = new T.MeshLambertMaterial({ map: waterTex }), iceWaterM = new T.MeshLambertMaterial({ color: '#9fd4f5', map: waterTex }), chasmM = lam('#5a3a22'), chasmDeep = lam('#2b1a0e');
    var bankM = [lam('#8fd46a'), lam('#e0b36b'), lam('#ffffff'), lam('#231c1e'), lam('#ecd79a'), lam('#8f9a48'), lam('#b0603a'), lam('#8a93a8')];
    var harborWaterM = new T.MeshLambertMaterial({ color: '#4f79b8', map: waterTex }), dryM = lam('#c98a5a'), dryDeep = lam('#a8683e'), pebbleM = lam('#e8c7a0');
    // the stuff under a river / a broken bridge per region
    function riverBed(g, w, h, reg, kind) {
      if (kind === 'chasm' || (!kind && reg === 1)) { var ch = new T.Mesh(new T.BoxGeometry(w, 0.05, h), chasmM); ch.position.y = 0.01; g.add(ch); var dp = new T.Mesh(new T.BoxGeometry(w, 0.05, h * 0.55), chasmDeep); dp.position.y = 0.02; g.add(dp); return; }
      if (kind === 'lava' || (!kind && reg === 3)) { var lv = new T.Mesh(new T.BoxGeometry(w, 0.05, h), lavaM); lv.position.y = 0.012; g.add(lv); glow(g, 0, 0.25, 0, Math.max(w, h) * 1.1, 0xff7a2a, 0.22); return; }
      if (kind === 'dry' || (!kind && reg === 6)) { var dr = new T.Mesh(new T.BoxGeometry(w, 0.05, h), dryM); dr.position.y = 0.01; g.add(dr); var dd = new T.Mesh(new T.BoxGeometry(w, 0.05, h * 0.5), dryDeep); dd.position.y = 0.015; g.add(dd);
        for (var pb = 0; pb < w * 3; pb++) { var pe = new T.Mesh(new T.DodecahedronGeometry(rnd(0.04, 0.08), 0), pebbleM); pe.position.set(rnd(-w / 2 + 0.1, w / 2 - 0.1), 0.04, rnd(-h / 3, h / 3)); g.add(pe); } return; }
      var wm = new T.Mesh(new T.BoxGeometry(w, 0.05, h), reg === 2 ? iceWaterM : reg === 7 ? harborWaterM : waterM); wm.position.y = 0.012; g.add(wm);
      if (reg === 2) for (var fl = 0; fl < w / 1.2; fl++) { var floe = new T.Mesh(new T.CylinderGeometry(rnd(0.08, 0.16), rnd(0.1, 0.18), 0.05, 6), snowM); floe.position.set(rnd(-w / 2 + 0.2, w / 2 - 0.2), 0.04, rnd(-h / 3, h / 3)); g.add(floe); }
    }
    var fences = [], gaps = [], bars = [], mineMesh = null, mineLight = null, mineList = [];
    function obstacle(o, reg) {
      var g = new T.Group(), k = o[0];
      if (o.length >= 5) { // a box: water / ravine strip
        var w = o[3], h = o[4];
        var bank = new T.Mesh(new T.BoxGeometry(w + (k === 'lava' ? 0.12 : 0), 0.04, h + 0.16), bankM[reg]); bank.position.y = 0.0; g.add(bank);
        riverBed(g, w, h, reg, k);
        if (reg === 7 && k === 'water') { // a harbor canal / basin: stone edges
          [-1, 1].forEach(function (sz) { var qe = new T.Mesh(new T.BoxGeometry(w, 0.12, 0.1), quayM); qe.position.set(0, 0.05, sz * (h / 2 + 0.05)); g.add(qe); });
        }
        g.position.set(X(o[1]), 0, Z(o[2])); elGroup.add(g); return;
      }
      var r = o[3];
      if (k === 'rock') { [[0, 0, 1], [0.45, 0.1, 0.6], [-0.4, 0.15, 0.55]].forEach(function (b, i) { var m = new T.Mesh(new T.DodecahedronGeometry(r * b[2] * 0.9, 0), i ? rockM2 : rockM); m.position.set(b[0] * r, r * b[2] * 0.55, b[1] * r); m.rotation.set(rnd(0, 3), rnd(0, 3), 0); g.add(m); }); }
      else if (k === 'tree' || k === 'pine') { [[0, 0, 1.15], [0.45, 0.25, 0.85], [-0.4, 0.3, 0.8]].forEach(function (b) { var s = r * b[2] * 1.6; var pl = new T.Mesh(pineLow, k === 'pine' ? lam('#2f7f5a') : pineM1), pt = new T.Mesh(pineTop, k === 'pine' ? snowM : pineM2), tr = new T.Mesh(trunkG, trunkM); [pl, pt, tr].forEach(function (m) { m.scale.set(s, s, s); m.position.set(b[0] * r, 0, b[1] * r); g.add(m); }); }); }
      else if (k === 'pond') { var pb = new T.Mesh(new T.CylinderGeometry(r + 0.1, r + 0.14, 0.04, 20), bankM[0]); g.add(pb); var pw = new T.Mesh(new T.CylinderGeometry(r, r, 0.05, 20), waterM); pw.position.y = 0.01; g.add(pw); var lily = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.02, 8), bushM); lily.position.set(r * 0.3, 0.04, -r * 0.2); g.add(lily); }
      else if (k === 'cactus') { [[0, 0, 1.3], [0.5, 0.3, 0.9]].forEach(function (b) { var cm = new T.Mesh(merge([[new T.CylinderGeometry(0.1, 0.12, 0.8, 7), M(0, 0.4, 0)], [new T.CylinderGeometry(0.06, 0.06, 0.3, 6), M(0.16, 0.45, 0, 0, 0, Math.PI / 2)], [new T.CylinderGeometry(0.06, 0.06, 0.28, 6), M(0.28, 0.6, 0)]]), cactusM); var s = r * b[2] * 1.5; cm.scale.set(s, s, s); cm.position.set(b[0] * r, 0, b[1] * r); g.add(cm); });
        var rk = new T.Mesh(new T.DodecahedronGeometry(r * 0.5, 0), lam('#d49a5a')); rk.position.set(-r * 0.45, r * 0.2, 0.1); g.add(rk); }
      else if (k === 'cube') { [[0, 0, 1.0], [0.55, 0.25, 0.66], [-0.5, 0.3, 0.6], [0.1, -0.55, 0.5]].forEach(function (b, i) { var sz = r * b[2] * 1.05; var m = new T.Mesh(new T.BoxGeometry(sz, sz, sz), i % 2 ? basaltM2 : basaltM); m.position.set(b[0] * r, sz / 2, b[1] * r); m.rotation.y = rnd(-0.5, 0.5); g.add(m); });
        var ember = new T.Mesh(new T.BoxGeometry(r * 0.3, 0.02, r * 0.05), emberM); ember.position.set(0.1, 0.012, r * 0.55); ember.rotation.y = 0.4; g.add(ember); }
      else if (k === 'skull') { var skl = skull(r * 1.7); g.add(skl); g.rotation.y = rnd(-0.4, 0.4); }
      else if (k === 'palm') { [[0, 0, 1.3], [0.55, 0.3, 1.0], [-0.45, 0.35, 0.9]].forEach(function (b, i) { var sz = r * b[2] * 1.5; var tr2 = new T.Mesh(palmTrunkG, palmTrunkM), lf = new T.Mesh(palmLeafG, i % 2 ? palmLeafM2 : palmLeafM); [tr2, lf].forEach(function (m) { m.scale.set(sz, sz, sz); m.position.set(b[0] * r, 0, b[1] * r); m.rotation.y = i * 2.1; g.add(m); }); });
        var fn = new T.Mesh(new T.IcosahedronGeometry(r * 0.45, 0), fernM); fn.position.set(-r * 0.3, r * 0.2, -r * 0.4); fn.scale.y = 0.6; g.add(fn); }
      else if (k === 'oak') { [[0, 0, 1.3], [0.5, 0.3, 1.0], [-0.45, 0.3, 0.95]].forEach(function (b, i) { var sz = r * b[2] * 1.45; var tr3 = new T.Mesh(oakTrunkG, barkM), tp = new T.Mesh(oakTopG, autumnM[Math.floor(rnd(0, 4))]); [tr3, tp].forEach(function (m) { m.scale.set(sz, sz, sz); m.position.set(b[0] * r, 0, b[1] * r); g.add(m); }); }); }
      else if (k === 'stump') { var st = new T.Mesh(new T.CylinderGeometry(r * 0.55, r * 0.62, r * 0.6, 10), barkM); st.position.y = r * 0.3; g.add(st); var rg = new T.Mesh(new T.CylinderGeometry(r * 0.5, r * 0.5, 0.02, 10), lam('#e2b77f')); rg.position.y = r * 0.61; g.add(rg);
        var lg = new T.Mesh(new T.CylinderGeometry(r * 0.22, r * 0.22, r * 1.6, 8), woodM); lg.rotation.z = Math.PI / 2; lg.rotation.y = 0.6; lg.position.set(r * 0.3, r * 0.22, r * 0.6); g.add(lg);
        var lf2 = new T.Mesh(new T.SphereGeometry(r * 0.5, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), autumnM[0]); lf2.scale.y = 0.35; lf2.position.set(-r * 0.6, 0, -r * 0.2); g.add(lf2); }
      else if (k === 'mesa') { var ms = r * 0.95; [[mesaG, mesaM], [mesaTopG, mesaTopM], [mesaBandG, mesaBandM]].forEach(function (pr) { var m = new T.Mesh(pr[0], pr[1]); m.scale.set(ms, ms * 1.25, ms); g.add(m); }); g.rotation.y = rnd(0, 6); }
      else if (k === 'house') { var hs = house(r * 1.9, r * 1.7); hs.rotation.y = rnd(-0.2, 0.2); g.add(hs); var lp = lamp(0, 0); lp.position.set(r * 1.1, 0, r * 0.9); g.add(lp); }
      else if (k === 'stack') { [[0, 0, 0], [0.5, 0, 0.05], [0.25, 0.46, 0.02], [-0.5, 0, -0.05], [-0.25, 0.46, 0]].forEach(function (c) { var b = new T.Mesh(new T.BoxGeometry(0.46, 0.46, 0.46), crateM); b.scale.setScalar(r * 1.6); b.position.set(c[0] * r * 1.6, (0.23 + c[1]) * r * 1.6, c[2] * r * 1.6); b.rotation.y = rnd(-0.15, 0.15); g.add(b); }); }
      else if (k === 'ice') { [[0, 0, 0.9], [0.5, 0.2, 0.62], [-0.45, 0.25, 0.58], [0.1, -0.45, 0.5]].forEach(function (b, i) { var s = r * b[2]; var m = new T.Mesh(new T.BoxGeometry(s, s, s), iceM); m.position.set(b[0] * r, s / 2 + (i === 3 ? 0 : 0), b[1] * r); m.rotation.y = rnd(-0.4, 0.4); g.add(m); }); }
      blob(0, 0, r * 1.1, g);
      g.position.set(X(o[1]), 0, Z(o[2])); elGroup.add(g);
    }
    var fenceRail = new T.BoxGeometry(1, 0.07, 0.05), fencePost = new T.BoxGeometry(0.09, 0.44, 0.09); fencePost.translate(0, 0.22, 0);
    function fence(f, i) {
      var g = new T.Group(), n = Math.max(2, Math.round(f.len / 0.4));
      for (var k = 0; k <= n; k++) { var p = new T.Mesh(fencePost, woodDark); p.position.set(-f.len / 2 + k * f.len / n, 0, 0); p.rotation.y = rnd(-0.1, 0.1); g.add(p); }
      [0.15, 0.32].forEach(function (y) { var r = new T.Mesh(fenceRail, woodM); r.scale.x = f.len; r.position.set(0, y, 0.04); g.add(r); });
      // a cross brace so it reads as a barricade
      var br = new T.Mesh(fenceRail, woodM); br.scale.x = f.len * 0.9; br.rotation.z = 0.28; br.position.set(0, 0.24, -0.03); g.add(br);
      blob(0, 0, 0.3, g).scale.set(f.len * 1.1, 1, 0.4);
      g.position.set(X(f.x), 0, Z(f.y)); g.rotation.y = -f.ang;
      elGroup.add(g); fences[i] = { g: g, hp: f.hp, hp0: f.hp0, shake: 0, f: f };
    }
    var plankG = new T.BoxGeometry(1, 0.05, 0.13);
    function gap(G, i, reg) {
      var g = new T.Group();
      var bank = new T.Mesh(new T.BoxGeometry(G.w, 0.04, G.h + 0.16), bankM[reg]); g.add(bank);
      riverBed(g, G.w, G.h, reg, null);
      // planks (they appear as troops build) and two side beams, a post at each corner
      var n = Math.max(4, Math.round((G.h + 0.3) / 0.15)), planks = [];
      for (var k = 0; k < n; k++) { var p = new T.Mesh(plankG, k % 2 ? woodM : lam('#c08850')); p.scale.x = G.w * 0.86; p.position.set(rnd(-0.03, 0.03), 0.07, -(G.h + 0.3) / 2 + (k + 0.5) * (G.h + 0.3) / n); p.rotation.y = rnd(-0.04, 0.04); p.visible = false; g.add(p); planks.push(p); }
      [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sz) { var post = new T.Mesh(fencePost, woodDark); post.scale.y = 0.6; post.position.set(sx * G.w * 0.45, 0, sz * (G.h / 2 + 0.2)); g.add(post); }); });
      var rails = [-1, 1].map(function (sx) { var r = new T.Mesh(new T.BoxGeometry(0.05, 0.05, G.h + 0.4), woodDark); r.position.set(sx * G.w * 0.45, 0.25, 0); r.visible = false; g.add(r); return r; });
      g.position.set(X(G.x), 0, Z(G.y)); elGroup.add(g);
      gaps[i] = { g: g, planks: planks, rails: rails, shown: 0, G: G };
    }
    var barG = new T.BoxGeometry(0.22, 0.09, 0.11);
    function barStack(B, i) {
      var g = new T.Group();
      [[0, 0, 0], [0.24, 0, 0], [0.12, 0, 0.13], [-0.12, 0, 0.13], [0.06, 0.09, 0.02], [0.18, 0.09, 0.08]].forEach(function (p) { var m = new T.Mesh(barG, goldM); m.position.set(p[0] - 0.06, 0.045 + p[1], p[2] - 0.06); g.add(m); });
      blob(0, 0, 0.3, g); g.position.set(X(B.x), 0, Z(B.y)); g.rotation.y = rnd(0, 3);
      elGroup.add(g); bars[i] = { g: g, taken: false };
    }
    var mineBodyG = new T.SphereGeometry(0.13, 10, 7); mineBodyG.scale(1, 0.55, 1); mineBodyG.translate(0, 0.06, 0);
    var mineLightG = new T.SphereGeometry(0.045, 8, 6); mineLightG.translate(0, 0.13, 0);
    var mineLightM = new T.MeshBasicMaterial({ color: '#ff2a2a' });
    // 0.4.0 gates: an arch (two posts and a top bar) with a see-through panel, blue (+, x: they help) or red (-: it
    // hurts), a label over it ("+3", "x2", "-2") and a coloured strip on the ground
    var gatePostG = new T.CylinderGeometry(0.06, 0.07, 0.78, 8); gatePostG.translate(0, 0.39, 0);
    var gateTex = {};
    function gateLabel(G) {
      var txt = (G.op === 'add' ? '+' : G.op === 'mul' ? '\u00d7' : '\u2212') + G.n, key = G.op + G.n;
      if (gateTex[key]) return gateTex[key];
      return (gateTex[key] = ctex(160, 96, function (x, w, h) {
        x.fillStyle = G.op === 'sub' ? '#e8383e' : '#2f7cf0'; x.strokeStyle = '#fff'; x.lineWidth = 8;
        x.beginPath(); if (x.roundRect) x.roundRect(6, 6, w - 12, h - 12, 26); else x.rect(6, 6, w - 12, h - 12); x.fill(); x.stroke();
        x.fillStyle = '#fff'; x.font = '900 62px system-ui, -apple-system, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 3);
      }));
    }
    var gatesV = [];
    function gateMesh(G, i) {
      var g = new T.Group(), red = G.op === 'sub', col = red ? '#ff4d52' : '#4a95ff';
      var postM = lam('#ffffff'), capM = lam(red ? '#d8262e' : '#2364d8');
      [-1, 1].forEach(function (sx) { var pst = new T.Mesh(gatePostG, postM); pst.position.x = sx * G.w / 2; g.add(pst); var cap = new T.Mesh(new T.SphereGeometry(0.09, 10, 8), capM); cap.position.set(sx * G.w / 2, 0.8, 0); g.add(cap); });
      var bar = new T.Mesh(new T.BoxGeometry(G.w, 0.08, 0.08), capM); bar.position.y = 0.76; g.add(bar);
      var panelM = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.36, side: T.DoubleSide, depthWrite: false });
      var panel = new T.Mesh(new T.PlaneGeometry(G.w - 0.1, 0.7), panelM); panel.position.y = 0.38; panel.renderOrder = 4; g.add(panel);
      var stripM = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, depthWrite: false });
      var strip = new T.Mesh(new T.PlaneGeometry(G.w + 0.1, 0.26), stripM); strip.rotation.x = -Math.PI / 2; strip.position.y = 0.012; g.add(strip);
      var lab = new T.Sprite(new T.SpriteMaterial({ map: gateLabel(G), depthTest: false, depthWrite: false, transparent: true })); lab.scale.set(0.78, 0.47, 1); lab.position.y = 1.15; lab.renderOrder = 9; g.add(lab);
      g.position.set(X(G.x), 0, Z(G.y)); g.rotation.y = -G.ang; elGroup.add(g);
      gatesV[i] = { g: g, panel: panelM, lab: lab, flash: 0, pop: 0 };
    }
    // 0.4.0 horde: a pulsing marker where a wave marches in (from 3 s before it starts until it has all come in)
    var hordeIconTex = ctex(96, 96, function (x, w) {
      x.fillStyle = '#5e6a3c'; x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); if (x.roundRect) x.roundRect(10, 16, 76, 64, 16); else x.rect(10, 16, 76, 64); x.fill(); x.stroke();
      x.fillStyle = '#ffe14a'; x.fillRect(22, 38, 52, 14); x.fillStyle = '#c8682e'; x.fillRect(44, 4, 8, 14); x.beginPath(); x.arc(48, 6, 7, 0, 7); x.fill();
      x.fillStyle = '#2a3118'; x.fillRect(30, 60, 36, 8);
    });
    var hordeMarks = [];
    function hordeMarkers(sim) {
      hordeMarks = [];
      if (!sim.horde) return;
      sim.horde.waves.forEach(function (w) {
        var g = new T.Group(), mx = Math.max(0.45, Math.min(W - 0.45, w.x)), my = Math.max(0.5, Math.min(H - 0.5, w.y));
        var rg = new T.Mesh(new T.RingGeometry(0.42, 0.6, 32), new T.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.8, depthWrite: false })); rg.rotation.x = -Math.PI / 2; rg.position.y = 0.03; g.add(rg);
        var ic = new T.Sprite(new T.SpriteMaterial({ map: hordeIconTex, depthTest: false, transparent: true })); ic.scale.set(0.7, 0.7, 1); ic.position.y = 0.75; ic.renderOrder = 9; g.add(ic);
        g.position.set(X(mx), 0, Z(my)); g.visible = false; elGroup.add(g); hordeMarks.push({ g: g, rg: rg, ic: ic, w: w });
      });
    }
    function setElements(sim, reg) {
      while (elGroup.children.length) elGroup.remove(elGroup.children[0]);
      fences = []; gaps = []; bars = []; mineList = []; gatesV = [];
      sim.gates.forEach(gateMesh);
      hordeMarkers(sim);
      sim.obs.forEach(function (o) { obstacle(o, reg); });
      sim.fences.forEach(fence);
      sim.gaps.forEach(function (G, i) { gap(G, i, reg); });
      sim.bars.forEach(barStack);
      var nm = sim.mines.length;
      mineMesh = new T.InstancedMesh(mineBodyG, lam('#26272c', { flatShading: false }), Math.max(1, nm)); mineLight = new T.InstancedMesh(mineLightG, mineLightM, Math.max(1, nm));
      mineMesh.count = mineLight.count = nm;
      sim.mines.forEach(function (m, i) { mineList.push({ x: m.x, y: m.y, s: 1, ph: rnd(0, 6) }); });
      elGroup.add(mineMesh); elGroup.add(mineLight);
      if (nm) { var bl = new T.InstancedMesh(blobG, blobM, nm); sim.mines.forEach(function (m, i) { mtx.compose(v3.set(X(m.x) + 0.04, 0.003, Z(m.y) + 0.04), q.identity(), sc3.set(0.34, 1, 0.3)); bl.setMatrixAt(i, mtx); }); elGroup.add(bl); }
    }
    function syncElements(sim, dt) {
      var i;
      for (i = 0; i < gatesV.length; i++) { var gv = gatesV[i]; if (gv.flash > 0) { gv.flash = Math.max(0, gv.flash - dt * 3); gv.panel.opacity = 0.36 + gv.flash * 0.5; } if (gv.pop > 0) { gv.pop = Math.max(0, gv.pop - dt * 4); var ls = 1 + Math.sin(gv.pop * Math.PI) * 0.25; gv.lab.scale.set(0.78 * ls, 0.47 * ls, 1); } }
      for (i = 0; i < hordeMarks.length; i++) { var hm = hordeMarks[i], w = hm.w, on = sim.t >= w.t - 3 && w.sent < w.n; hm.g.visible = on; if (on) { var pu = 1 + Math.sin(clock * 7) * 0.15; hm.rg.scale.set(pu, 1, pu); hm.ic.position.y = 0.75 + Math.abs(Math.sin(clock * 4)) * 0.12; } }
      for (i = 0; i < fences.length; i++) { var F = fences[i]; if (!F) continue; if (F.shake > 0) { F.shake = Math.max(0, F.shake - dt * 5); F.g.position.x = X(F.f.x) + Math.sin(F.shake * 40) * 0.04 * F.shake; } }
      for (i = 0; i < gaps.length; i++) {
        var G = gaps[i], k = Math.min(G.planks.length, Math.ceil(G.G.got / G.G.need * G.planks.length - 1e-6));
        if (G.G.got >= G.G.need) k = G.planks.length;
        while (G.shown < k) { G.planks[G.shown].visible = true; G.shown++; }
        if (G.G.got >= G.G.need && !G.rails[0].visible) { G.rails[0].visible = G.rails[1].visible = true; }
      }
      if (mineMesh && mineList.length) {
        for (i = 0; i < mineList.length; i++) {
          var mm = mineList[i], m = sim.mines[i], want = m.armed ? 1 : 0;
          mm.s += (want - mm.s) * Math.min(1, dt * 6);
          mtx.compose(v3.set(X(mm.x), 0, Z(mm.y)), q.identity(), sc3.set(mm.s, mm.s, mm.s)); mineMesh.setMatrixAt(i, mtx);
          var bl = m.armed ? (Math.sin(clock * 5 + mm.ph) > 0.2 ? 1.25 : 0.55) : 0;
          mtx.compose(v3.set(X(mm.x), 0, Z(mm.y)), q.identity(), sc3.set(mm.s * bl, mm.s * bl, mm.s * bl)); mineLight.setMatrixAt(i, mtx);
        }
        mineMesh.instanceMatrix.needsUpdate = true; mineLight.instanceMatrix.needsUpdate = true;
      }
    }

    // ---------------- buildings ----------------
    // a floor: team wall with a band of dark windows (canvas texture, one per team); a light ledge between floors
    var floorTex = TEAM.map(function (c) {
      return ctex(256, 64, function (x, w, h) {
        x.fillStyle = c.main; x.fillRect(0, 0, w, h);
        x.fillStyle = c.light; x.globalAlpha = 0.45; x.fillRect(0, 0, w, 7); x.globalAlpha = 1;
        x.fillStyle = c.win; for (var i = 0; i < 8; i++) { var wx = i * 32 + 8; x.beginPath(); if (x.roundRect) x.roundRect(wx, 20, 16, 24, 4); else x.rect(wx, 20, 16, 24); x.fill(); }
        x.fillStyle = 'rgba(255,255,255,.35)'; for (var j = 0; j < 8; j++) x.fillRect(j * 32 + 10, 22, 4, 9);
      });
    });
    var FLOOR_H = 0.34, TOWER_R = 0.47;
    var floorG = new T.CylinderGeometry(TOWER_R, TOWER_R, FLOOR_H, 16, 1, true); floorG.translate(0, FLOOR_H / 2, 0);
    var ledgeG = new T.CylinderGeometry(TOWER_R + 0.035, TOWER_R + 0.035, 0.055, 16); ledgeG.translate(0, 0.0275, 0);
    var baseG = new T.CylinderGeometry(0.62, 0.68, 0.16, 18); baseG.translate(0, 0.08, 0);
    var doorG = new T.BoxGeometry(0.2, 0.26, 0.06);
    var floorM = floorTex.map(function (t) { return new T.MeshLambertMaterial({ map: t }); });
    var teamM = TEAM.map(function (c) { return lam(c.main); }), teamDarkM = TEAM.map(function (c) { return lam(c.dark); });
    var ledgeLM = TEAM.map(function (c) { return lam(c.light); }), baseM = lam('#cbd2bb'), doorM = lam('#4a3322');
    // the cube the number sits on: a rounded box
    var cubeShape = new T.Shape(), cs = 0.36, cr = 0.1;
    cubeShape.moveTo(-cs + cr, -cs); cubeShape.lineTo(cs - cr, -cs); cubeShape.quadraticCurveTo(cs, -cs, cs, -cs + cr); cubeShape.lineTo(cs, cs - cr); cubeShape.quadraticCurveTo(cs, cs, cs - cr, cs); cubeShape.lineTo(-cs + cr, cs); cubeShape.quadraticCurveTo(-cs, cs, -cs, cs - cr); cubeShape.lineTo(-cs, -cs + cr); cubeShape.quadraticCurveTo(-cs, -cs, -cs + cr, -cs);
    var cubeG = new T.ExtrudeGeometry(cubeShape, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 4 });
    cubeG.rotateX(-Math.PI / 2); cubeG.translate(0, 0.06, 0);
    var cubeTopM = TEAM.map(function (c) { return new T.MeshLambertMaterial({ color: c.main }); });
    function beam(g, a, b, th, mat) { var d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length(); var m = new T.Mesh(new T.BoxGeometry(th, len, th), mat); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(up, d.normalize()); g.add(m); return m; }

    var ivoryM=lam('#edf0dc'),glassM=lam('#244957');
    var towers = [];
    function labelDraw(tw) {
      var c=tw.lc,x=c.getContext('2d'),S=c.width/160;
      x.clearRect(0,0,c.width,c.height);x.save();x.scale(S,S);
      x.shadowColor='rgba(20,43,42,.25)';x.shadowBlur=6;x.shadowOffsetY=4;
      x.fillStyle=tw.o?TEAM[tw.o].main:'#758478';x.beginPath();x.roundRect(22,22,116,102,24);x.fill();
      x.shadowBlur=0;x.shadowOffsetY=0;x.strokeStyle='rgba(255,255,255,.6)';x.lineWidth=3;x.stroke();
      x.fillStyle='#fff';x.font='800 58px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(String(tw.n),80,65);
      var k=OP.slots(tw.n,tw.type);
      for(var i=0;i<k;i++){x.beginPath();x.arc(80+(i-(k-1)/2)*22,105,5,0,Math.PI*2);x.fillStyle=i<tw.used?'#fff':'rgba(255,255,255,.24)';x.fill();x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=1.5;x.stroke();}
      if(!k){x.font='bold 13px system-ui';x.fillText('AUTO',80,105);}
      x.restore();tw.tex.needsUpdate=true;
    }
    // the height of a building's top (where its number cube sits)
    function topY(type, f) {
      if (type === 'f') return 0.62 + f * 0.05;
      if (type === 's') return 1.3 + f * 0.07;
      if (type === 'r') return 0.78;
      if (type === 'F') return 0.3 + f * (FLOOR_H + 0.055) * 1.1;
      if (type === 'X') return 3.05;
      return 0.16 + f * (FLOOR_H + 0.055);
    }
    function buildBody(tw) {
      var g = tw.fl; while (g.children.length) {var gone=g.children[0];gone.traverse(function(m){if(m.isMesh&&m.geometry&&m.geometry!==floorG&&m.geometry!==ledgeG&&m.geometry!==doorG)m.geometry.dispose();});g.remove(gone);}
      var o = tw.o, f = tw.f, type = tw.type, i, y;
      if (type === 'b') {
        function block(w,h,d,x,y,z,mat){var m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
        block(1.08,.12,1.04,0,.1,0,baseM);
        for(i=0;i<f;i++){
          y=.16+i*(FLOOR_H+.055);
          block(.84,FLOOR_H,.8,0,y+FLOOR_H/2,0,ivoryM);
          block(.91,.055,.87,0,y+FLOOR_H+.0275,0,i===f-1?teamM[o]:ledgeLM[o]);
          block(.65,.12,.014,0,y+.21,.408,glassM);
          block(.014,.12,.56,.428,y+.21,0,glassM);
          block(.014,.12,.56,-.428,y+.21,0,glassM);
          block(.035,.13,.018,-.17,y+.21,.419,ivoryM);block(.035,.13,.018,.17,y+.21,.419,ivoryM);
        }
        block(.2,.23,.025,0,.275,.429,teamDarkM[o]);
        var roofY=.16+f*(FLOOR_H+.055);
        block(.25,.13,.22,-.18,roofY+.065,-.18,metalM);
        block(.018,.42,.018,.34,roofY+.21,-.28,ivoryM);
        block(.25,.14,.012,.21,roofY+.33,-.28,teamM[o]);
      } else if (type === 'F') {
        var sc = type === 'F' ? 1.18 : 1, y0 = type === 'F' ? 0.3 : 0.16;
        for (i = 0; i < f; i++) {
          y = y0 + i * (FLOOR_H + 0.055) * sc;
          var fm = new T.Mesh(floorG, floorM[o]); fm.position.y = y; fm.rotation.y = i * 0.4; fm.scale.set(sc, sc, sc); g.add(fm);
          var lg = new T.Mesh(ledgeG, i ? ledgeLM[o] : teamDarkM[o]); lg.position.y = y + FLOOR_H * sc; lg.scale.set(sc, 1, sc); g.add(lg);
        }
        if (type === 'b') { var dr = new T.Mesh(doorG, doorM); dr.position.set(0, 0.29, TOWER_R - 0.01); g.add(dr); }
        if (type === 'F') {
          // the fort: a stone yard with team walls, battlements, four corner towers and a gate
          var yard = new T.Mesh(new T.BoxGeometry(1.8, 0.14, 1.8), stoneM); yard.position.y = 0.07; g.add(yard);
          [[0, -0.84, 1.62, 0.16], [0, 0.84, 1.62, 0.16], [-0.84, 0, 0.16, 1.62], [0.84, 0, 0.16, 1.62]].forEach(function (wl, k) {
            var wm = new T.Mesh(new T.BoxGeometry(wl[2], 0.36, wl[3]), teamM[o]); wm.position.set(wl[0], 0.32, wl[1]); g.add(wm);
            for (var mI = 0; mI < 5; mI++) { var mer = new T.Mesh(new T.BoxGeometry(0.14, 0.12, 0.18), teamDarkM[o]); var t = -0.64 + mI * 0.32; mer.position.set(wl[2] > wl[3] ? t : wl[0], 0.56, wl[2] > wl[3] ? wl[1] : t); g.add(mer); }
          });
          [[-0.84, -0.84], [0.84, -0.84], [-0.84, 0.84], [0.84, 0.84]].forEach(function (c) { var ct = new T.Mesh(new T.CylinderGeometry(0.22, 0.24, 0.72, 10), floorM[o]); ct.position.set(c[0], 0.36 + 0.14, c[1]); g.add(ct); var roof = new T.Mesh(new T.ConeGeometry(0.28, 0.32, 10), teamDarkM[o]); roof.position.set(c[0], 1.0, c[1]); g.add(roof); });
          var gate = new T.Mesh(new T.BoxGeometry(0.4, 0.34, 0.06), doorM); gate.position.set(0, 0.31, 0.93); g.add(gate);
        }
      } else if (type === 'X') {
        // 0.4.0 the boss citadel: an octagonal stone base, a wide keep of three team floors with battlements, a big
        // mortar on top (it fires the volleys) and a pennant
        var bsc = 1.9, base2 = new T.Mesh(new T.CylinderGeometry(1.15, 1.28, 0.34, 8), stoneM); base2.position.y = 0.17; g.add(base2);
        for (i = 0; i < 3; i++) {
          y = 0.34 + i * (FLOOR_H + 0.055) * bsc * 0.9;
          var kf = new T.Mesh(floorG, floorM[o]); kf.position.y = y; kf.scale.set(bsc * (1 - i * 0.08), bsc * 0.9, bsc * (1 - i * 0.08)); kf.rotation.y = i * 0.5; g.add(kf);
          var kl = new T.Mesh(ledgeG, i === 2 ? teamDarkM[o] : ledgeLM[o]); kl.position.y = y + FLOOR_H * bsc * 0.9; kl.scale.set(bsc * (1 - i * 0.08), 1.4, bsc * (1 - i * 0.08)); g.add(kl);
        }
        var topR = TOWER_R * bsc * 0.84, ty0 = 0.34 + 3 * (FLOOR_H + 0.055) * bsc * 0.9;
        for (i = 0; i < 10; i++) { var mer2 = new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.12), teamDarkM[o]); var a2 = i / 10 * Math.PI * 2; mer2.position.set(Math.cos(a2) * topR, ty0 + 0.08, Math.sin(a2) * topR); mer2.rotation.y = -a2; g.add(mer2); }
        var mort = new T.Group(); mort.position.set(0.22, ty0 + 0.05, -0.12); g.add(mort);
        var mb = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.16, 10), lam('#3a3d44')); mb.position.y = 0.08; mort.add(mb);
        var barrel = new T.Mesh(new T.CylinderGeometry(0.12, 0.15, 0.5, 12), lam('#2e3036')); barrel.rotation.x = -0.6; barrel.position.set(0, 0.32, 0.08); mort.add(barrel);
        var mouth2 = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.02, 10), lam('#111')); mouth2.rotation.x = -0.6; mouth2.position.set(0, 0.32 + Math.cos(0.6) * 0.25, 0.08 - Math.sin(0.6) * 0.25); mort.add(mouth2);
        var pole = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.8, 6), lam('#e8e2d6')); pole.position.set(-0.35, ty0 + 0.4, 0.1); g.add(pole);
        var flag = new T.Mesh(new T.BoxGeometry(0.34, 0.2, 0.02), teamM[o]); flag.position.set(-0.18, ty0 + 0.7, 0.1); g.add(flag);
        var gate2 = new T.Mesh(new T.BoxGeometry(0.42, 0.4, 0.06), doorM); gate2.position.set(0, 0.5, TOWER_R * bsc - 0.01); g.add(gate2);
        tw.smokeAt = [0.22, ty0 + 0.6, -0.3]; tw.mortar = mort;
      } else if (type === 'f') {
        // the factory: a stone plate, a team hall with windows, a saw-tooth roof, a chimney (it smokes while it works)
        var hh = 0.36 + f * 0.05;
        var plate = new T.Mesh(new T.BoxGeometry(1.12, 0.1, 0.92), stoneM); plate.position.y = 0.05; g.add(plate);
        var hall = new T.Mesh(new T.BoxGeometry(0.96, hh, 0.72), [floorM[o], floorM[o], teamM[o], teamM[o], floorM[o], floorM[o]]); hall.position.y = 0.1 + hh / 2; g.add(hall);
        for (i = 0; i < 3; i++) { var tooth = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.72, 3), teamDarkM[o]); tooth.rotation.x = Math.PI / 2; tooth.rotation.y = 0; tooth.rotation.z = Math.PI / 2 * 0; tooth.rotation.set(Math.PI / 2, 0, Math.PI / 6); tooth.position.set(-0.32 + i * 0.32, 0.1 + hh + 0.06, 0); g.add(tooth); }
        var door = new T.Mesh(new T.BoxGeometry(0.34, 0.26, 0.04), lam('#3a3f4a')); door.position.set(0.12, 0.23, 0.37); g.add(door);
        for (i = 0; i < 3; i++) { var st = new T.Mesh(new T.BoxGeometry(0.32, 0.02, 0.045), lam('#f2c230')); st.position.set(0.12, 0.13 + i * 0.08, 0.38); st.rotation.z = 0.5; g.add(st); }
        var chim = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.75, 8), lam('#55565e')); chim.position.set(-0.3, 0.1 + hh + 0.3, -0.2); g.add(chim);
        var band = new T.Mesh(new T.CylinderGeometry(0.095, 0.095, 0.08, 8), teamM[o]); band.position.set(-0.3, 0.1 + hh + 0.55, -0.2); g.add(band);
        tw.smokeAt = [-0.3, 0.1 + hh + 0.72, -0.2];
      } else if (type === 's') {
        // the sniper tower: an open lattice (4 legs, cross braces), a platform, a pointed roof
        var h = 1.0 + f * 0.07, b0 = 0.36, b1 = 0.2, legM = ledgeLM[o], brM = teamM[o];
        var foot = new T.Mesh(new T.CylinderGeometry(0.55, 0.6, 0.08, 16), stoneM); foot.position.y = 0.04; g.add(foot);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { beam(g, [c[0] * b0, 0.05, c[1] * b0], [c[0] * b1, h, c[1] * b1], 0.06, legM); });
        [0.28, 0.62].forEach(function (fy) {
          var yA = h * fy, yB = h * (fy + 0.3), wA = b0 + (b1 - b0) * fy, wB = b0 + (b1 - b0) * (fy + 0.3);
          [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]].forEach(function (sd) {
            beam(g, [sd[0][0] * wA, yA, sd[0][1] * wA], [sd[1][0] * wB, yB, sd[1][1] * wB], 0.035, brM);
            beam(g, [sd[1][0] * wA, yA, sd[1][1] * wA], [sd[0][0] * wB, yB, sd[0][1] * wB], 0.035, brM);
          });
        });
        var plat = new T.Mesh(new T.BoxGeometry(0.62, 0.08, 0.62), teamDarkM[o]); plat.position.y = h; g.add(plat);
        var rail = new T.Mesh(new T.BoxGeometry(0.62, 0.16, 0.62), teamM[o]); rail.position.y = h + 0.12; rail.scale.set(1, 1, 1); g.add(rail);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { var p = new T.Mesh(new T.BoxGeometry(0.04, 0.3, 0.04), legM); p.position.set(c[0] * 0.27, h + 0.3, c[1] * 0.27); g.add(p); });
        var roof = new T.Mesh(new T.ConeGeometry(0.52, 0.3, 4), teamDarkM[o]); roof.rotation.y = Math.PI / 4; roof.position.y = h + 0.6; g.add(roof);
        var scope = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.36, 6), lam('#2b2b33')); scope.rotation.x = Math.PI / 2; scope.position.set(0.12, h + 0.24, 0.3); g.add(scope);
      } else if (type === 'r') {
        // the rocket launcher: a stone ring, a team base and a turret with two tubes (it turns to its target)
        var ring = new T.Mesh(new T.CylinderGeometry(0.55, 0.6, 0.12, 16), stoneM); ring.position.y = 0.06; g.add(ring);
        var bs = new T.Mesh(new T.CylinderGeometry(0.4, 0.46, 0.26, 10), teamM[o]); bs.position.y = 0.25; g.add(bs);
        var tur = new T.Group(); tur.position.y = 0.4; g.add(tur);
        var hub = new T.Mesh(new T.BoxGeometry(0.4, 0.16, 0.34), teamDarkM[o]); hub.position.y = 0.06; tur.add(hub);
        [-0.1, 0.1].forEach(function (dx) {
          var tube = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.56, 10), ledgeLM[o]); tube.rotation.x = Math.PI / 2 - 0.55; tube.position.set(dx, 0.22, 0.05); tur.add(tube);
          var mouth = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.02, 8), lam('#222')); mouth.rotation.x = Math.PI / 2 - 0.55; mouth.position.set(dx, 0.22 + Math.cos(0.55) * 0.28, 0.05 + Math.sin(0.55) * 0.28); tur.add(mouth);
        });
        tw.turret = tur;
      }
      g.traverse(function(m){if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});
      var top = topY(type, f);
      tw.cube.visible=false; tw.cube.position.y = top; tw.cube.material = cubeTopM[o];
      tw.label.position.set(0, top + (type === 'X' ? 0.85 : 0.70), 0.18);
      if (type === 'X') { tw.cube.scale.set(1.3, 1.3, 1.3); tw.label.scale.set(1.4, 1.4, 1); }
      if (tw.range) { tw.range.material.color.set(o ? TEAM[o].light : '#ffffff'); tw.rangeRing.material.color.set(o ? TEAM[o].main : '#ffffff'); }
    }
    var rangeG = new T.CircleGeometry(1, 64); rangeG.rotateX(-Math.PI / 2);
    var rangeRingG = new T.RingGeometry(0.975, 1, 72); rangeRingG.rotateX(-Math.PI / 2);
    function setTowers(sim) {
      towers.forEach(function (tw) { scene.remove(tw.g); tw.tex.dispose();tw.label.material.dispose(); if (tw.range) { scene.remove(tw.range); scene.remove(tw.rangeRing); } });
      towers = sim.towers.map(function (t) {
        var g = new T.Group(); g.position.set(X(t.x), 0, Z(t.y)); scene.add(g);
        blob(0, 0, t.type === 'F' ? 1.45 : t.type === 'X' ? 1.6 : 0.8, g);
        var apron=new T.Mesh(new T.CylinderGeometry(.77,.81,.07,8),baseM);apron.position.y=.015;apron.receiveShadow=true;g.add(apron);if (t.type === 'b') { var base = new T.Mesh(baseG, baseM); g.add(base); }
        var fl = new T.Group(); g.add(fl);
        var cube = new T.Mesh(cubeG, cubeTopM[t.o]); g.add(cube);
        var lc = document.createElement('canvas'); lc.width = lc.height = Math.round(160 * Math.min(1.6, Math.max(1, DPR / 1.9)));
        var tex = new T.CanvasTexture(lc); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
        var label = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true, toneMapped:false })); label.scale.set(1.35, 1.35, 1); label.renderOrder = 10; g.add(label);
        var tw = { i: t.i, g: g, fl: fl, cube: cube, label: label, lc: lc, tex: tex, o: t.o, n: t.n, cap: t.cap, type: t.type, used: t.links.length, f: OP.floors(t.n), pop: 0, x: t.x, y: t.y, smokeT: rnd(0, 1), aim: 0 };
        if (t.type === 's') {
          // the range circle on the ground (grows at 10 and 30)
          tw.range = new T.Mesh(rangeG, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false }));
          tw.rangeRing = new T.Mesh(rangeRingG, new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }));
          tw.range.position.set(X(t.x), 0.008, Z(t.y)); tw.rangeRing.position.set(X(t.x), 0.009, Z(t.y)); tw.range.renderOrder = 0; tw.rangeRing.renderOrder = 0;
          tw.rr = OP.snipeRange(t.n); tw.range.scale.set(tw.rr, 1, tw.rr); tw.rangeRing.scale.set(tw.rr, 1, tw.rr);
          scene.add(tw.range); scene.add(tw.rangeRing);
        }
        buildBody(tw); labelDraw(tw);
        return tw;
      });
    }

    // ---------------- lanes ----------------
    var laneVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
    var laneFS = 'uniform vec3 col; uniform float len; uniform float time; uniform float op; uniform float flow; uniform float dash; varying vec2 vUv;\n' +
      'void main(){ float u = vUv.x * len; float v = vUv.y - 0.5; float edge = 1.0 - smoothstep(0.40, 0.5, abs(v));\n' +
      ' float ph = fract((u - abs(v) * 0.7 - time * flow) / 0.62); float ch = smoothstep(0.0, 0.07, ph) * (1.0 - smoothstep(0.22, 0.3, ph));\n' +
      ' float rim = smoothstep(0.34, 0.42, abs(v)) * edge; vec3 c = mix(col, vec3(1.0), 0.22 + ch * 0.5); c = mix(c, col * 0.75, rim);\n' +
      ' float dd = dash > 0.5 ? step(0.45, fract(u / 0.36 - time * flow * 1.5)) : 1.0;\n' +
      ' gl_FragColor = vec4(c, min(1.0, op * edge * dd * (0.95 + 0.2 * ch + 0.2 * rim)));\n#include <colorspace_fragment>\n}';
    var laneG = new T.PlaneGeometry(1, 1); laneG.rotateX(-Math.PI / 2); laneG.translate(0.5, 0, 0); // x from 0 to 1 along the lane
    (function () { var uv = laneG.attributes.uv, pos = laneG.attributes.position; for (var i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i) + 0.5); uv.needsUpdate = true; })();
    function laneMat(team) { return new T.ShaderMaterial({ vertexShader: laneVS, fragmentShader: laneFS, transparent: true, depthWrite: false,
      uniforms: { col: { value: new T.Color(TEAM[team].main) }, len: { value: 1 }, time: { value: 0 }, op: { value: 0.72 }, flow: { value: 1.0 }, dash: { value: 0 } } }); }
    var lanes = {}; // link id -> { mesh, mat }
    var meets = {}; // pair key -> meeting point (distance from the lower-numbered tower)
    function laneMesh(team) { var m = laneMat(team), me = new T.Mesh(laneG, m); me.renderOrder = 1; scene.add(me); return { mesh: me, mat: m }; }
    // 0.4.0: a polyline cut to start d0 after its first point and end d1 before its last
    function trimPoly(pts, d0, d1) {
      var cum = [0], k; for (k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      var tot = cum[cum.length - 1], a = d0, b = tot - d1, out = []; if (b - a < 0.05) return [];
      function at(d) { for (var j = 1; j < pts.length; j++) if (cum[j] >= d) { var f = (d - cum[j - 1]) / Math.max(1e-9, cum[j] - cum[j - 1]); return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]; } return pts[pts.length - 1]; }
      out.push(at(a)); for (k = 1; k < pts.length - 1; k++) if (cum[k] > a && cum[k] < b) out.push(pts[k]); out.push(at(b)); return out;
    }
    // a lane ribbon along a polyline (uv.x = distance along it, so the chevrons march at the same pace as on straight lanes)
    function ribbon(pts, w) {
      var n = pts.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = [], cum = 0, k;
      for (k = 0; k < n; k++) {
        var p = pts[Math.max(0, k - 1)], q = pts[Math.min(n - 1, k + 1)], tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl * w / 2, ny = tx / tl * w / 2;
        if (k) cum += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
        pos.set([X(pts[k][0] + nx), 0.02, Z(pts[k][1] + ny), X(pts[k][0] - nx), 0.02, Z(pts[k][1] - ny)], k * 6); uv.set([cum, 0, cum, 1], k * 4);
        if (k) { var a = (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.setIndex(idx); return g;
    }
    function polyLane(team, pts, w) { var m = laneMat(team), me = new T.Mesh(ribbon(pts, w), m); m.uniforms.len.value = 1; m.side = T.DoubleSide; me.renderOrder = 1; me.frustumCulled = false; scene.add(me); return { mesh: me, mat: m, poly: true }; }
    function placeLane(ln, ax, ay, bx, by, w) {
      var dx = bx - ax, dy = by - ay, len = Math.max(0.01, Math.hypot(dx, dy));
      ln.mesh.position.set(X(ax), 0.02, Z(ay)); ln.mesh.rotation.y = -Math.atan2(dy, dx); ln.mesh.scale.set(len, 1, w || 0.4); ln.mat.uniforms.len.value = len;
    }
    // a rocket launcher's target: a crosshair on the ground round the building (ring + four ticks)
    var crossG = new T.PlaneGeometry(1.9, 1.9); crossG.rotateX(-Math.PI / 2);
    var crossTex = ctex(128, 128, function (x, w) {
      x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = 7; x.beginPath(); x.arc(64, 64, 44, 0, 7); x.stroke();
      x.lineWidth = 8; [[64, 4, 64, 34], [64, 94, 64, 124], [4, 64, 34, 64], [94, 64, 124, 64]].forEach(function (l) { x.beginPath(); x.moveTo(l[0], l[1]); x.lineTo(l[2], l[3]); x.stroke(); });
    });

    // ---------------- troops: soldiers, tanks, paratroopers, rockets (instanced) ----------------
    var MAXU = 900, MAXT = 260, MAXP = 200, MAXR = 80;
    var bodyG=merge([[new T.BoxGeometry(.13,.16,.10),M(0,.19,0)],[new T.CapsuleGeometry(.029,.085,2,6),M(-.085,.19,.01,0,0,-.2)],[new T.CapsuleGeometry(.029,.085,2,6),M(.085,.19,.035,.35,0,.2)],[new T.BoxGeometry(.047,.09,.05),M(-.038,.075,0)],[new T.BoxGeometry(.047,.09,.05),M(.038,.075,0)],[new T.BoxGeometry(.09,.11,.055),M(0,.19,-.065)]]);
    var headG=merge([[new T.SphereGeometry(.085,12,8),M(0,.34,0)],[new T.CylinderGeometry(.094,.094,.025,12),M(0,.325,0)],[new T.BoxGeometry(.03,.035,.20),M(.09,.17,.09)],[new T.BoxGeometry(.055,.04,.085),M(-.038,.03,.015)],[new T.BoxGeometry(.055,.04,.085),M(.038,.03,.015)]]);
    var tankG = merge([[new T.BoxGeometry(0.36, 0.12, 0.26), M(0, 0.12, 0)], [new T.BoxGeometry(0.2, 0.1, 0.18), M(-0.02, 0.23, 0)], [new T.CylinderGeometry(0.028, 0.028, 0.24, 6), M(0.15, 0.24, 0, 0, 0, Math.PI / 2)]]);
    var trackG = merge([[new T.BoxGeometry(0.4, 0.09, 0.07), M(0, 0.06, 0.13)], [new T.BoxGeometry(0.4, 0.09, 0.07), M(0, 0.06, -0.13)]]);
    var canopyG = new T.SphereGeometry(0.26, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); canopyG.scale(1, 0.55, 1); canopyG.translate(0, 0.74, 0);
    var cordG = merge([[new T.CylinderGeometry(0.006, 0.006, 0.4, 3), M(0.14, 0.55, 0, 0, 0, 0.35)], [new T.CylinderGeometry(0.006, 0.006, 0.4, 3), M(-0.14, 0.55, 0, 0, 0, -0.35)]]);
    var rocketG = merge([[new T.CylinderGeometry(0.045, 0.045, 0.3, 8), M(0, 0, 0)], [new T.ConeGeometry(0.045, 0.1, 8), M(0, 0.2, 0)], [new T.BoxGeometry(0.16, 0.06, 0.012), M(0, -0.12, 0)], [new T.BoxGeometry(0.012, 0.06, 0.16), M(0, -0.12, 0)]]);
    function inst(geo, mat, n) { var m = new T.InstancedMesh(geo, mat, n); m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m); return m; }
    var uBody = [], uHead = [], uTank = [], uCanopy = [];
    [0, 1, 2, 3, 4, 5].forEach(function (o) {
      uBody[o] = inst(bodyG, lam(TEAM[o].main, { flatShading: false }), MAXU + MAXP); uHead[o] = inst(headG, lam(TEAM[o].dark, { flatShading: false }), MAXU + MAXP);
      uTank[o] = inst(tankG, lam(TEAM[o].main), MAXT); uCanopy[o] = inst(canopyG, lam(TEAM[o].light, { side: T.DoubleSide }), MAXP);
    });
    var uTrack = inst(trackG, lam('#3a3d44'), MAXT * 3), uCord = inst(cordG, lam('#ffffff'), MAXP * 3), uRocket = inst(rocketG, lam('#f4f1ea'), MAXR);
    // 0.4.0 the horde's rust bots (olive body and legs, a rusty head with an antenna, a glowing visor) and the boss's shells
    var MAXH = 700;
    var botBodyG = merge([[new T.BoxGeometry(0.2, 0.17, 0.15), M(0, 0.17, 0)], [new T.BoxGeometry(0.06, 0.09, 0.07), M(-0.06, 0.045, 0)], [new T.BoxGeometry(0.06, 0.09, 0.07), M(0.06, 0.045, 0)], [new T.BoxGeometry(0.05, 0.12, 0.05), M(-0.13, 0.17, 0, 0, 0, 0.3)], [new T.BoxGeometry(0.05, 0.12, 0.05), M(0.13, 0.17, 0, 0, 0, -0.3)]]);
    var botHeadG = merge([[new T.BoxGeometry(0.17, 0.13, 0.15), M(0, 0.32, 0)], [new T.CylinderGeometry(0.01, 0.01, 0.1, 4), M(0, 0.43, 0)], [new T.SphereGeometry(0.028, 6, 4), M(0, 0.49, 0)]]);
    var botEyeG = new T.BoxGeometry(0.12, 0.04, 0.02); botEyeG.translate(0, 0.33, 0.078);
    var uBotBody = inst(botBodyG, lam('#8c9a62'), MAXH), uBotHead = inst(botHeadG, lam('#c8682e'), MAXH), uBotEye = inst(botEyeG, new T.MeshBasicMaterial({ color: '#ffe14a' }), MAXH);
    var shellG = new T.SphereGeometry(0.13, 10, 8), uShell = inst(shellG, lam('#2e3036', { flatShading: false }), 60);

    // ---------------- effects ----------------
    var puffTex = ctex(64, 64, function (x) { var g = x.createRadialGradient(32, 32, 1, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
    var arrowTex = ctex(64, 64, function (x) { x.fillStyle = '#39d353'; x.strokeStyle = '#fff'; x.lineWidth = 5; x.lineJoin = 'round'; x.beginPath(); x.moveTo(32, 6); x.lineTo(56, 32); x.lineTo(42, 32); x.lineTo(42, 58); x.lineTo(22, 58); x.lineTo(22, 32); x.lineTo(8, 32); x.closePath(); x.stroke(); x.fill(); });
    var starTex = ctex(64, 64, function (x) { x.fillStyle = '#ffe066'; x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); for (var i = 0; i < 10; i++) { var a = i / 10 * 6.283 - Math.PI / 2, r = i % 2 ? 11 : 27; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } x.closePath(); x.stroke(); x.fill(); });
    var fxs = [];
    function sprite(tex, x, y, z, s, color, life, kind) {
      var m = new T.Sprite(new T.SpriteMaterial({ map: tex, color: color || 0xffffff, transparent: true, depthWrite: false, depthTest: kind === 'arrow' ? false : true }));
      m.position.set(x, y, z); m.scale.set(s, s, 1); m.renderOrder = kind === 'arrow' ? 11 : 5; scene.add(m);
      fxs.push({ m: m, t: 0, life: life, s: s, kind: kind }); return m;
    }
    function puff(x, y, big, color, h) { if (fxs.length > 160) return; sprite(puffTex, X(x) + rnd(-0.05, 0.05), h || 0.3, Z(y), big ? 0.5 : 0.32, color || 0xffffff, big ? 0.45 : 0.32, 'puff'); }
    var ringG = new T.RingGeometry(0.5, 0.62, 32); ringG.rotateX(-Math.PI / 2);
    var chipG = new T.BoxGeometry(0.1, 0.1, 0.1), plankChipG = new T.BoxGeometry(0.42, 0.05, 0.1);
    function ring(px, pz, color, life, grow) { var r = new T.Mesh(ringG, new T.MeshBasicMaterial({ color: color, transparent: true, depthWrite: false })); r.position.set(px, 0.05, pz); scene.add(r); fxs.push({ m: r, t: 0, life: life || 0.6, s: 1, kind: 'ring', grow: grow || 2.2 }); }
    function chips(px, py, pz, mat, n, geo, sp) { for (var k = 0; k < n; k++) { if (fxs.length > 200) return; var ch = new T.Mesh(geo || chipG, mat), a = k / n * 6.283 + rnd(-0.3, 0.3), v = rnd(1.2, 2.8) * (sp || 1); ch.position.set(px, py, pz); scene.add(ch); fxs.push({ m: ch, t: 0, life: 0.9, kind: 'chip', vx: Math.cos(a) * v, vy: rnd(2.5, 4.5), vz: Math.sin(a) * v }); } }
    function burst(i, o) {
      var tw = towers[i]; if (!tw) return;
      var p = tw.g.position, top = topY(tw.type, tw.f);
      sprite(puffTex, p.x, top * 0.6, p.z, tw.type === 'F' ? 3.6 : tw.type === 'X' ? 4.8 : 2.6, new T.Color(TEAM[o].light), 0.5, 'flash');
      ring(p.x, p.z, TEAM[o].light, 0.6);
      chips(p.x, top * 0.7, p.z, teamM[o], 12);
      tw.pop = 1;
    }
    function levelUp(i) { var tw = towers[i]; if (!tw) return; var p = tw.g.position; sprite(arrowTex, p.x + (tw.type === 'F' || tw.type === 'X' ? 1.0 : 0.55), topY(tw.type, tw.f) * 0.6 + 0.3, p.z, 0.42, 0xffffff, 0.8, 'arrow'); }
    // a sniper shot: a bright tracer from the platform to the troop and a puff
    var tracerM = new T.LineBasicMaterial({ color: 0xfff6c0, transparent: true });
    function shot(i, x, y) {
      var tw = towers[i]; if (!tw || fxs.length > 170) return;
      var h = topY('s', tw.f) - 0.2, g = new T.BufferGeometry().setFromPoints([new T.Vector3(tw.g.position.x, h, tw.g.position.z), new T.Vector3(X(x), 0.25, Z(y))]);
      var ln = new T.Line(g, tracerM.clone()); scene.add(ln); fxs.push({ m: ln, t: 0, life: 0.14, kind: 'tracer' });
      puff(x, y, false, 0xffe9a8);
    }
    function boom(x, y) {
      sprite(puffTex, X(x), 0.35, Z(y), 1.6, 0xffa23a, 0.4, 'flash');
      for (var k = 0; k < 4; k++) sprite(puffTex, X(x) + rnd(-0.3, 0.3), 0.3, Z(y) + rnd(-0.3, 0.3), 0.7, 0x55504a, 0.9, 'puff');
      ring(X(x), Z(y), 0xffd27a, 0.5, 2.8);
      chips(X(x), 0.2, Z(y), lam('#3a3a40'), 6);
    }
    function rocketHit(i) { var tw = towers[i]; if (!tw) return; var p = tw.g.position, h = topY(tw.type, tw.f) * 0.6; sprite(puffTex, p.x + rnd(-0.2, 0.2), h, p.z + 0.2, 1.1, 0xff8a3a, 0.35, 'flash'); sprite(puffTex, p.x, h + 0.2, p.z, 0.6, 0x77726a, 0.7, 'puff'); tw.pop = Math.max(tw.pop, 0.5); }
    function fenceHit(i) { var F = fences[i]; if (!F) return; F.shake = 1; chips(F.g.position.x, 0.25, F.g.position.z, woodM, 2, plankChipG, 0.6); }
    function fenceBreak(i) { var F = fences[i]; if (!F) return; elGroup.remove(F.g); chips(F.g.position.x, 0.3, F.g.position.z, woodM, 9, plankChipG, 1.1); puff(F.f.x, F.f.y, true, 0xe8c9a0); fences[i] = null; }
    function buildFx(i, x, y) { puff(x, y, false, 0xe8c9a0, 0.12); }
    function bridgeDone(i) { var G = gaps[i]; if (!G) return; ring(G.g.position.x, G.g.position.z, 0xffffff, 0.6, 2.5); }
    function goldPick(i, src) {
      var B = bars[i]; if (!B || B.taken) return; B.taken = true; elGroup.remove(B.g);
      for (var k = 0; k < 6; k++) sprite(starTex, B.g.position.x + rnd(-0.3, 0.3), 0.3 + rnd(0, 0.4), B.g.position.z + rnd(-0.3, 0.3), 0.3, 0xffffff, 0.7, 'spark');
      if (src >= 0) levelUp(src);
    }
    function gateFx(i, x, y, n) { var gv = gatesV[i]; if (!gv) return; gv.flash = 1; if (n > 0) gv.pop = 1; if (fxs.length < 150) puff(x, y, false, n > 0 ? 0xbfe0ff : 0xffb0b0, 0.35); }
    // a shell's landing spot: a red ring that tightens until it lands
    function warn(x, y, dur) { var r = new T.Mesh(ringG, new T.MeshBasicMaterial({ color: 0xff3b30, transparent: true, depthWrite: false })); r.position.set(X(x), 0.04, Z(y)); r.renderOrder = 2; scene.add(r); fxs.push({ m: r, t: 0, life: dur, s: 1, kind: 'warn' }); }
    function shellHit(x, y) { boom(x, y); }
    function volleyFx(i) { var tw = towers[i]; if (!tw) return; tw.pop = Math.max(tw.pop, 0.6); if (tw.mortar) { var p = tw.g.position; var my = tw.smokeAt[1]; for (var k = 0; k < 3; k++) sprite(puffTex, p.x + 0.22 + rnd(-0.15, 0.15), my + rnd(-0.1, 0.3), p.z - 0.1, 0.6, 0xd8d4cc, 0.9, 'smoke'); sprite(puffTex, p.x + 0.22, my - 0.1, p.z, 1.2, 0xffb24a, 0.25, 'flash'); } }
    function smoke(tw) { if (fxs.length > 150) return; var p = tw.g.position, s = tw.smokeAt; sprite(puffTex, p.x + s[0], s[1], p.z + s[2], 0.28, 0xd8d8dc, 1.6, 'smoke'); }
    function updateFx(dt) {
      fxs = fxs.filter(function (f) {
        f.t += dt; var k = f.t / f.life;
        if (k >= 1) { scene.remove(f.m); if (f.kind === 'tracer') f.m.geometry.dispose(); if (f.m.material && f.m.material.dispose && f.kind !== 'chip') f.m.material.dispose(); return false; }
        if (f.kind === 'puff') { var s = f.s * (1 + k * 1.2); f.m.scale.set(s, s, 1); f.m.material.opacity = 1 - k; f.m.position.y += dt * 0.5; }
        else if (f.kind === 'smoke') { var s4 = f.s * (1 + k * 2.2); f.m.scale.set(s4, s4, 1); f.m.material.opacity = 0.75 * (1 - k); f.m.position.y += dt * 0.55; f.m.position.x += dt * 0.12; }
        else if (f.kind === 'flash') { var s2 = f.s * (0.5 + k); f.m.scale.set(s2, s2, 1); f.m.material.opacity = (1 - k) * 0.9; }
        else if (f.kind === 'ring') { var s3 = 1 + k * f.grow; f.m.scale.set(s3, 1, s3); f.m.material.opacity = 1 - k; }
        else if (f.kind === 'arrow') { f.m.position.y += dt * 0.9; f.m.material.opacity = k < 0.7 ? 1 : (1 - k) / 0.3; }
        else if (f.kind === 'spark') { f.m.position.y += dt * 0.8; f.m.material.rotation += dt * 3; f.m.material.opacity = 1 - k * k; }
        else if (f.kind === 'tracer') { f.m.material.opacity = 1 - k; }
        else if (f.kind === 'warn') { var ws = 2.2 - 1.3 * k; f.m.scale.set(ws, 1, ws); f.m.material.opacity = 0.55 + 0.4 * Math.abs(Math.sin(f.t * 10)); }
        else if (f.kind === 'chip') { f.vy -= 12 * dt; f.m.position.x += f.vx * dt; f.m.position.y = Math.max(0.03, f.m.position.y + f.vy * dt); f.m.position.z += f.vz * dt; if (f.m.position.y > 0.031) { f.m.rotation.x += dt * 8; f.m.rotation.z += dt * 6; } var cs2 = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; f.m.scale.set(cs2, cs2, cs2); }
        return true;
      });
    }

    // ---------------- drag feedback ----------------
    var dragLane = laneMesh(1); dragLane.mat.uniforms.op.value = 0.85; dragLane.mat.uniforms.flow.value = 2; dragLane.mesh.visible = false; dragLane.mesh.renderOrder = 3;
    var ringM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
    var selRing = new T.Mesh(new T.RingGeometry(0.66, 0.8, 36), ringM); selRing.geometry.rotateX(-Math.PI / 2); selRing.visible = false; selRing.renderOrder = 2; scene.add(selRing);
    var tgtRingM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false });
    var tgtRing = new T.Mesh(new T.RingGeometry(0.66, 0.84, 36), tgtRingM); tgtRing.geometry.rotateX(-Math.PI / 2); tgtRing.visible = false; tgtRing.renderOrder = 2; scene.add(tgtRing);
    function dragShow(from, wx, wy, snap, valid) {
      var A = towers[from]; if (!A) return dragHide();
      var bx = wx, by = wy; if (snap >= 0) { bx = towers[snap].x; by = towers[snap].y; }
      var rA = A.type === 'F' ? OP.FORT_EDGE : OP.EDGE, rB = snap >= 0 ? edgeR(towers[snap].type) : OP.EDGE;
      var dx = bx - A.x, dy = by - A.y, d = Math.hypot(dx, dy), e = Math.min(d, rA);
      var end = snap >= 0 ? Math.max(e, d - rB) : d;
      if (d < 0.05) { dragLane.mesh.visible = false; } else {
        placeLane(dragLane, A.x + dx / d * e, A.y + dy / d * e, A.x + dx / d * end, A.y + dy / d * end, 0.3);
        dragLane.mat.uniforms.col.value.set(valid ? (A.type === 'r' ? '#ffd27a' : TEAM[1].light) : '#ff3b3b'); dragLane.mat.uniforms.dash.value = A.type === 'r' ? 1 : 0; dragLane.mesh.visible = true;
      }
      var sa = ringS(A.type), sb = snap >= 0 ? ringS(towers[snap].type) : 1;
      selRing.visible = true; selRing.position.set(X(A.x), 0.03, Z(A.y)); selRing.scale.set(sa, 1, sa); ringM.color.set(valid || snap < 0 ? '#ffffff' : '#ff3b3b');
      tgtRing.visible = snap >= 0; if (snap >= 0) { tgtRing.position.set(X(bx), 0.03, Z(by)); tgtRing.scale.set(sb, 1, sb); tgtRingM.color.set(valid ? (A.type === 'r' ? '#ffd27a' : '#ffffff') : '#ff3b3b'); }
    }
    function dragHide() { dragLane.mesh.visible = false; selRing.visible = false; tgtRing.visible = false; drawLane.mesh.visible = false; }
    function edgeR(type) { return type === 'F' ? OP.FORT_EDGE : type === 'X' ? 1.0 : OP.EDGE; }
    function ringS(type) { return type === 'F' ? 1.75 : type === 'X' ? 2.0 : 1; }
    // 0.4.0 Draw Mode: the finger's path while drawing (from the tower through the points to the finger or the target)
    var drawLane = { mesh: new T.Mesh(new T.BufferGeometry(), laneMat(1)), mat: null }; drawLane.mat = drawLane.mesh.material; drawLane.mat.side = T.DoubleSide; drawLane.mat.uniforms.len.value = 1; drawLane.mat.uniforms.op.value = 0.85; drawLane.mat.uniforms.flow.value = 2; drawLane.mesh.renderOrder = 3; drawLane.mesh.visible = false; drawLane.mesh.frustumCulled = false; scene.add(drawLane.mesh);
    function drawShow(from, pts, snap, valid) {
      var A = towers[from]; if (!A) return dragHide();
      var all = [[A.x, A.y]].concat(pts); if (snap >= 0) all.push([towers[snap].x, towers[snap].y]);
      var tp = trimPoly(all, edgeR(A.type), snap >= 0 ? edgeR(towers[snap].type) : 0);
      if (tp.length >= 2) { drawLane.mesh.geometry.dispose(); drawLane.mesh.geometry = ribbon(tp, 0.3); drawLane.mat.uniforms.col.value.set(valid ? TEAM[1].light : '#ff3b3b'); drawLane.mesh.visible = true; } else drawLane.mesh.visible = false;
      dragLane.mesh.visible = false;
      selRing.visible = true; selRing.position.set(X(A.x), 0.03, Z(A.y)); selRing.scale.set(ringS(A.type), 1, ringS(A.type)); ringM.color.set(valid || snap < 0 ? '#ffffff' : '#ff3b3b');
      tgtRing.visible = snap >= 0; if (snap >= 0) { var sb2 = ringS(towers[snap].type); tgtRing.position.set(X(towers[snap].x), 0.03, Z(towers[snap].y)); tgtRing.scale.set(sb2, 1, sb2); tgtRingM.color.set(valid ? '#ffffff' : '#ff3b3b'); }
    }

    // ---------------- per frame ----------------
    var clock = 0, dummy = new T.Object3D();
    function sync(sim, dt, paused) {
      if (!paused) clock += dt;
      var i, o;
      // buildings: owner, floors, label, sniper circle, rocket turret, factory smoke
      for (i = 0; i < towers.length; i++) {
        var tw = towers[i], t = sim.towers[i], f = OP.floors(t.n), used = t.links.length;
        if (t.o !== tw.o || f !== tw.f) { tw.o = t.o; tw.f = f; buildBody(tw); }
        if (t.n !== tw.n || used !== tw.used || tw.o !== tw.lo) { tw.n = t.n; tw.used = used; tw.lo = tw.o; labelDraw(tw); }
        if (tw.pop > 0) { tw.pop = Math.max(0, tw.pop - dt * 2.5); var ps = 1 + Math.sin(tw.pop * Math.PI) * 0.18; tw.fl.scale.set(ps, 1 + Math.sin(tw.pop * Math.PI) * 0.1, ps); } else tw.fl.scale.set(1, 1, 1);
        var hit = sim.t - t.lastHit < 0.12 ? 0.94 : 1; tw.cube.scale.set(hit, hit, hit);
        if (tw.range) { var rr = OP.snipeRange(t.n); tw.rr += (rr - tw.rr) * Math.min(1, dt * 4); tw.range.scale.set(tw.rr, 1, tw.rr); tw.rangeRing.scale.set(tw.rr, 1, tw.rr); tw.range.material.opacity = t.o ? 0.17 : 0.08; tw.rangeRing.material.opacity = t.o ? 0.6 : 0.3; }
        if (tw.turret) { var want = tw.aim; if (t.links.length) { var B = sim.towers[t.links[0].b]; want = -Math.atan2(B.y - t.y, B.x - t.x) + Math.PI / 2; } var da = ((want - tw.turret.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; tw.turret.rotation.y += da * Math.min(1, dt * 6); tw.aim = want; }
        if (tw.smokeAt && t.o && !paused) { tw.smokeT -= dt * (t.links.length ? 2.2 : 0.9); if (tw.smokeT <= 0) { tw.smokeT = 1; smoke(tw); } }
      }
      // lanes (rocket targets: a dashed line with a ring on the target)
      var seen = {};
      for (i = 0; i < sim.links.length; i++) {
        var L = sim.links[i], ln = lanes[L.id]; seen[L.id] = 1;
        if (!ln && L.pl) { ln = lanes[L.id] = polyLane(L.o, trimPoly(L.pl, sim.towers[L.a].r, sim.towers[L.b].r), 0.4); }
        if (L.pl) { ln.mat.uniforms.time.value = clock; ln.mat.uniforms.op.value = 0.8; continue; }
        if (!ln) { ln = lanes[L.id] = laneMesh(L.o); ln.grow = 0; if (L.rk) { ln.mat.uniforms.dash.value = 1; ln.tgt = new T.Mesh(crossG, new T.MeshBasicMaterial({ map: crossTex, color: TEAM[L.o].main, transparent: true, opacity: 0.95, depthWrite: false })); ln.tgt.renderOrder = 2; scene.add(ln.tgt); } }
        var A = sim.towers[L.a], Bt = sim.towers[L.b], len = L.len, dx = (Bt.x - A.x) / len, dy = (Bt.y - A.y) / len;
        var end = len - Bt.r;
        var rev = OP.linkFrom(sim, L.b, L.a);
        if (rev && rev.o !== L.o && !L.rk && !rev.rk && !L.fly && !rev.fly) { var lo = Math.min(L.a, L.b), key = lo * 1024 + Math.max(L.a, L.b), m = meets[key]; var mp = m == null ? len / 2 : m; end = L.a === lo ? mp : len - mp; end = Math.max(A.r + 0.05, Math.min(len - Bt.r, end)); }
        ln.grow = Math.min(1, ln.grow + dt * 5);
        var e2 = A.r + (end - A.r) * ln.grow;
        placeLane(ln, A.x + dx * A.r, A.y + dy * A.r, A.x + dx * e2, A.y + dy * e2, L.rk ? 0.18 : L.fly ? 0.3 : 0.4);
        ln.mat.uniforms.time.value = clock;
        ln.mat.uniforms.op.value = L.rk ? 0.75 : L.fly ? 0.5 : 0.8;
        if (ln.tgt) { var ps2 = ringS(Bt.type) * (1 + Math.sin(clock * 6) * 0.06); ln.tgt.position.set(X(Bt.x), 0.035, Z(Bt.y)); ln.tgt.scale.set(ps2, 1, ps2); ln.tgt.rotation.y = clock * 0.8; }
      }
      for (var id in lanes) if (!seen[id]) { scene.remove(lanes[id].mesh); lanes[id].mat.dispose(); if (lanes[id].poly) lanes[id].mesh.geometry.dispose(); if (lanes[id].tgt) { scene.remove(lanes[id].tgt); lanes[id].tgt.material.dispose(); } delete lanes[id]; }
      // troops
      var cB = [0, 0, 0, 0, 0, 0], cT = [0, 0, 0, 0, 0, 0], cC = [0, 0, 0, 0, 0, 0], nTr = 0, nCo = 0, nBot = 0;
      for (i = 0; i < sim.units.length; i++) {
        var u = sim.units[i]; o = u.o;
        var side = ((u.id * 37) % 7 - 3) * (u.k === 1 ? 0.012 : 0.025), ph = clock * 11 + u.id;
        var px = u.ax + u.dx * u.d - u.dy * side, py = u.ay + u.dy * u.d + u.dx * side, rot = -Math.atan2(u.dy, u.dx) + Math.PI / 2;
        if (u.k === 3) { // a rust bot: stomps along (big ones are bigger)
          if (nBot >= MAXH) continue;
          var bs2 = u.big ? 2.0 : 1.6;
          dummy.position.set(X(px), Math.abs(Math.sin(ph * 0.8)) * 0.04, Z(py)); dummy.rotation.set(0, rot, Math.sin(ph * 0.8) * 0.1); dummy.scale.set(bs2, bs2, bs2); dummy.updateMatrix();
          uBotBody.setMatrixAt(nBot, dummy.matrix); uBotHead.setMatrixAt(nBot, dummy.matrix); uBotEye.setMatrixAt(nBot++, dummy.matrix); continue;
        }
        if (u.k === 1) { // a tank: rolls, a little rumble
          if (cT[o] >= MAXT) continue;
          dummy.position.set(X(px), Math.abs(Math.sin(ph * 1.7)) * 0.012, Z(py)); dummy.rotation.set(0, rot - Math.PI / 2, 0); dummy.scale.set(1.45, 1.45, 1.45); dummy.updateMatrix();
          uTank[o].setMatrixAt(cT[o]++, dummy.matrix); uTrack.setMatrixAt(nTr++, dummy.matrix); continue;
        }
        if (cB[o] >= MAXU + MAXP) continue;
        if (u.k === 2) { // a paratrooper: an arc through the air under a canopy
          var p = Math.max(0, Math.min(1, (u.d - OP.FORT_EDGE) / Math.max(0.1, u.end - OP.FORT_EDGE))), hgt = 0.15 + 1.5 * Math.sin(p * Math.PI) * (p < 0.5 ? 1 : 0.8 + 0.2 * (1 - p));
          dummy.position.set(X(px), hgt, Z(py)); dummy.rotation.set(0, rot, Math.sin(clock * 3 + u.id) * 0.12); dummy.scale.set(1.35, 1.35, 1.35); dummy.updateMatrix();
          uBody[o].setMatrixAt(cB[o], dummy.matrix); uHead[o].setMatrixAt(cB[o]++, dummy.matrix);
          if (cC[o] < MAXP) { uCanopy[o].setMatrixAt(cC[o]++, dummy.matrix); uCord.setMatrixAt(nCo++, dummy.matrix); }
          continue;
        }
        var bob = Math.abs(Math.sin(ph)) * 0.05;
        dummy.position.set(X(px), bob, Z(py)); dummy.rotation.set(0, rot, Math.sin(ph) * 0.12); dummy.scale.set(1.35, 1.35, 1.35); dummy.updateMatrix();
        uBody[o].setMatrixAt(cB[o], dummy.matrix); uHead[o].setMatrixAt(cB[o]++, dummy.matrix);
      }
      uBotBody.count = uBotHead.count = uBotEye.count = nBot; if (nBot || uBotBody.wasOn) { uBotBody.instanceMatrix.needsUpdate = uBotHead.instanceMatrix.needsUpdate = uBotEye.instanceMatrix.needsUpdate = true; } uBotBody.wasOn = nBot > 0;
      for (o = 0; o < 6; o++) {
        uBody[o].count = uHead[o].count = cB[o]; uTank[o].count = cT[o]; uCanopy[o].count = cC[o];
        if (cB[o] || uBody[o].wasOn) { uBody[o].instanceMatrix.needsUpdate = true; uHead[o].instanceMatrix.needsUpdate = true; } uBody[o].wasOn = cB[o] > 0;
        if (cT[o]) uTank[o].instanceMatrix.needsUpdate = true; if (cC[o]) uCanopy[o].instanceMatrix.needsUpdate = true;
      }
      uTrack.count = nTr; if (nTr) uTrack.instanceMatrix.needsUpdate = true;
      uCord.count = nCo; if (nCo) uCord.instanceMatrix.needsUpdate = true;
      // rockets: an arc from the launcher to the target
      var nR = 0, nSh = 0;
      for (i = 0; i < sim.rockets.length && nR < MAXR; i++) {
        var r = sim.rockets[i], k = Math.min(1, r.t / r.dur), hx = r.x0 + (r.x1 - r.x0) * k, hy = r.y0 + (r.y1 - r.y0) * k, hh = 0.75 + 1.4 * Math.sin(k * Math.PI);
        if (r.boss) { // a boss shell: a high arc from the mortar
          if (nSh >= 60) continue; hh = 2.85 + 4.2 * Math.sin(k * Math.PI) - 2.7 * k;
          dummy.position.set(X(hx), Math.max(0.1, hh), Z(hy)); dummy.rotation.set(0, 0, 0); dummy.scale.set(1.2, 1.2, 1.2); dummy.updateMatrix(); uShell.setMatrixAt(nSh++, dummy.matrix);
          if (!paused && ((r.id + Math.floor(clock * 20)) % 3 === 0)) sprite(puffTex, X(hx), hh, Z(hy), 0.22, 0x9a958c, 0.5, 'puff');
          continue;
        }
        var k2 = Math.min(1, k + 0.02), hx2 = r.x0 + (r.x1 - r.x0) * k2, hy2 = r.y0 + (r.y1 - r.y0) * k2, hh2 = 0.75 + 1.4 * Math.sin(k2 * Math.PI);
        dummy.position.set(X(hx), hh, Z(hy)); v3.set(X(hx2) - X(hx), hh2 - hh, Z(hy2) - Z(hy)).normalize(); dummy.quaternion.setFromUnitVectors(up, v3); dummy.scale.set(1.3, 1.3, 1.3); dummy.updateMatrix();
        uRocket.setMatrixAt(nR++, dummy.matrix);
        if (!paused && ((r.id + Math.floor(clock * 20)) % 3 === 0)) sprite(puffTex, X(hx), hh, Z(hy), 0.16, 0xe8e2da, 0.45, 'puff');
      }
      uRocket.count = nR; if (nR) uRocket.instanceMatrix.needsUpdate = true;
      uShell.count = nSh; if (nSh) uShell.instanceMatrix.needsUpdate = true;
      syncElements(sim, paused ? 0 : dt);
      updateFx(paused ? 0 : dt);
      // lava flows, boats bob
      if (!paused) { lavaTex.offset.x = (clock * 0.05) % 1; lavaTex.offset.y = (clock * 0.02) % 1; }
      for (i = 0; i < anim.length; i++) { var an = anim[i]; if (an.mesh && an.bob !== undefined) { an.mesh.position.y = Math.sin(clock * 1.6 + an.bob) * 0.025; an.mesh.rotation.z = Math.sin(clock * 1.1 + an.bob) * 0.04; } }
    }

    // ---------------- level, camera fit ----------------
    var view = { w: 10, h: 10, m: { top: 70, bottom: 20, side: 10 }, box: null };
    function setLevel(level, sim) {
      var reg = Math.max(0, Math.min(REG.length - 1, level.region || 0)), G = REG[reg];
      if (reg !== borderReg) {
        buildBorder(reg);
        scene.background.set(G.bg); groundM.map = groundTex[reg]; groundM.needsUpdate = true; fieldM.map = fieldTex[reg]; fieldM.needsUpdate = true; blobM.map = blobTex[reg]; blobM.needsUpdate = true;
        hemi.color.setHex(G.hemi[0]); hemi.groundColor.setHex(G.hemi[1]); hemi.intensity = G.hemi[2]; sun.intensity = G.sun; sun.color.setHex(G.sunC || 0xfff4e0);
      }
      while (propGroup.children.length) propGroup.remove(propGroup.children[0]);
      (level.props || []).forEach(makeProp);
      setElements(sim, reg);
      setTowers(sim);
      for (var id in lanes) { scene.remove(lanes[id].mesh); lanes[id].mat.dispose(); if (lanes[id].poly) lanes[id].mesh.geometry.dispose(); if (lanes[id].tgt) scene.remove(lanes[id].tgt); } lanes = {}; meets = {};
      fxs.forEach(function (f) { scene.remove(f.m); }); fxs = [];
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      level.towers.forEach(function (t) { var r = t[4] === 'F' ? 1.4 : t[4] === 'X' ? 1.6 : 0.9; x0 = Math.min(x0, t[0] - r); x1 = Math.max(x1, t[0] + r); y0 = Math.min(y0, t[1] - r); y1 = Math.max(y1, t[1] + r - 0.05); });
      view.box = { x0: Math.min(0.25, x0), x1: Math.max(W - 0.25, x1), y0: y0, y1: y1 };
      fit();
      return G;
    }
    // frame the whole battlefield (buildings at full height included) in the free space between the top HUD and the home bar
    var tmp = new T.Vector3();
    function fit() {
      if (!view.box) return;
      var b = view.box, pts = [], hTop = topY('b', 6) + 0.95;
      [b.x0, b.x1].forEach(function (x) { [b.y0, b.y1].forEach(function (y) { pts.push([x, 0, y]); pts.push([x, y === b.y0 ? hTop : 0.6, y]); }); });
      var inv = camera.matrixWorldInverse, cx0 = 1e9, cx1 = -1e9, cy0 = 1e9, cy1 = -1e9;
      pts.forEach(function (p) { tmp.set(X(p[0]), p[1], Z(p[2])).applyMatrix4(inv); cx0 = Math.min(cx0, tmp.x); cx1 = Math.max(cx1, tmp.x); cy0 = Math.min(cy0, tmp.y); cy1 = Math.max(cy1, tmp.y); });
      var m = view.m, aw = Math.max(50, view.w - 2 * m.side), ah = Math.max(50, view.h - m.top - m.bottom);
      var s = Math.max((cx1 - cx0) / aw, (cy1 - cy0) / ah);
      var cx = (cx0 + cx1) / 2, cy = (cy0 + cy1) / 2;
      var yc = m.top + ah / 2; // where the middle of the field goes (px from the top)
      camera.left = cx - s * view.w / 2; camera.right = cx + s * view.w / 2;
      camera.top = cy + yc * s; camera.bottom = camera.top - view.h * s;
      camera.updateProjectionMatrix();
      view.scale = s;
    }
    function resize(w, h, margins) { view.w = w; view.h = h; if (margins) view.m = margins; renderer.setSize(w, h, false); fit(); }
    // world (field) point -> CSS px in the canvas
    function project(x, y, h) { tmp.set(X(x), h || 0, Z(y)).project(camera); return [(tmp.x + 1) / 2 * view.w, (1 - tmp.y) / 2 * view.h]; }
    // CSS px -> field point on the ground
    var ray = new T.Raycaster(), ndc = new T.Vector2();
    function groundAt(px, py) {
      ndc.set(px / view.w * 2 - 1, -(py / view.h * 2 - 1)); ray.setFromCamera(ndc, camera);
      var o = ray.ray.origin, d = ray.ray.direction; if (Math.abs(d.y) < 1e-6) return null;
      var t = -o.y / d.y; return [o.x + d.x * t + W / 2, o.z + d.z * t + H / 2];
    }
    // a building on screen: its foot and the top of its number (for picking by finger)
    function towerScreen(i) { var tw = towers[i]; if (!tw) return null; var a = project(tw.x, tw.y, 0), b = project(tw.x, tw.y, topY(tw.type, tw.f) + 0.85); return { bx: a[0], by: a[1], tx: b[0], ty: b[1], r: (tw.type === 'F' ? 1.1 : tw.type === 'X' ? 1.25 : 0.62) / view.scale }; }
    function meet(lo, hi, p) { var k = lo * 1024 + hi, m = meets[k]; meets[k] = m == null ? p : m + (p - m) * 0.35; }
    function render() { renderer.render(scene, camera); }
    return { renderer: renderer, scene: scene, camera: camera, view: view, setLevel: setLevel, sync: sync, resize: resize, project: project, ground: groundAt,
      towerScreen: towerScreen, dragShow: dragShow, dragHide: dragHide, puff: puff, burst: burst, levelUp: levelUp, meet: meet, render: render, TEAM: TEAM,
      shot: shot, boom: boom, rocketHit: rocketHit, fenceHit: fenceHit, fenceBreak: fenceBreak, build: buildFx, bridgeDone: bridgeDone, goldPick: goldPick,
      drawShow: drawShow, gateFx: gateFx, warn: warn, shellHit: shellHit, volleyFx: volleyFx };
  }
  return { build: build, TEAM: TEAM, REG: REG };
})();
