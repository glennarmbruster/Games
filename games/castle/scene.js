
/* Castle Crumble scenery (three.js): sky, sea with ripples, a grassy island with a sandy beach and cliffs, low-poly
   trees, far islands and hills, and the castle itself: stone bricks, each physics brick drawn as one stone block
   (instanced, a few draw calls for hundreds of bricks), dark slate cone and pyramid roofs, wooden doors, red TNT
   crates; cannonballs, and (1.6.0) drawn-only effects: stone chips, dust, smoke, fire, sparks, splashes, a shock
   ring and a little camera shake. CCScene.build(THREE, canvas, CC, { fancy }) returns what the app needs. */
var CCScene = (function () {
  'use strict';
  function build(T, canvas, CC, opts) {
    var fancy = !opts || opts.fancy !== false;
    var R = CC.rng(20260930);
    function rnd(a, b) { return a + (b - a) * R(); }
    function tex(w, h, draw, srgb) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); if (srgb !== false) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
    function std(o) { return new T.MeshStandardMaterial(o); }

    // ---------------- renderer, camera, light ----------------
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    if (fancy) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap; }
    var scene = new T.Scene(), HORIZON = new T.Color('#cedbd9');
    scene.background = HORIZON; scene.fog = new T.Fog(HORIZON, 70, 190);
    var camera = new T.PerspectiveCamera(50, 1, 0.5, 500);
    var skyMat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color('#456e86') }, mid: { value: new T.Color('#91b1bd') }, bot: { value: HORIZON.clone() } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(mid, top, smoothstep(0.05, 0.6, h)); c = mix(bot, c, smoothstep(-0.02, 0.18, h)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' });
    scene.add(new T.Mesh(new T.SphereGeometry(400, 32, 16), skyMat));
    scene.add(new T.HemisphereLight(0xe4eef0, 0x536354, 1.15));
    var sun = new T.DirectionalLight(0xffe6bd, 2.6); sun.position.set(-15, 26, 14); scene.add(sun); scene.add(sun.target);
    if (fancy) { sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 5; sc.far = 80; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; }

    // clouds
    var cloudTex = tex(256, 128, function (x) { for (var i = 0; i < 24; i++) { var cx = rnd(40, 216), cy = rnd(55, 88), r = rnd(18, 36), g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } });
    var clouds = [];
    for (var ci = 0; ci < 10; ci++) { var cl = new T.Sprite(new T.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false })), a0 = rnd(0, 6.28), d0 = rnd(150, 220), sw = rnd(40, 70); cl.scale.set(sw, sw / 2, 1); cl.position.set(Math.cos(a0) * d0, rnd(40, 70), Math.sin(a0) * d0); scene.add(cl); clouds.push(cl); }

    // ---------------- the sea ----------------
    var waterTex = tex(256, 256, function (x, w, h) { x.fillStyle = '#316d7a'; x.fillRect(0, 0, w, h); for (var i = 0; i < 160; i++) { x.strokeStyle = 'rgba(255,255,255,' + rnd(0.06, 0.2).toFixed(2) + ')'; x.lineWidth = rnd(1, 2.5); var px = rnd(0, w), py = rnd(0, h), l = rnd(8, 26); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l / 2, py - 3, px + l, py); x.stroke(); } });
    waterTex.wrapS = waterTex.wrapT = T.RepeatWrapping; waterTex.repeat.set(40, 40);
    var water = new T.Mesh(new T.PlaneGeometry(600, 600), std({ map: waterTex, color: 0xffffff, roughness: 0.25, metalness: 0.1 })); water.rotation.x = -Math.PI / 2; water.position.y = CC.WATER + 0.3; water.receiveShadow = fancy; scene.add(water);

    // ---------------- the island ----------------
    var I = CC.ISLAND;
    var grassTex = tex(256, 256, function (x, w, h) { x.fillStyle = '#7d8971'; x.fillRect(0, 0, w, h); for (var i = 0; i < 2600; i++) { var l = rnd(0.8, 1.2); x.fillStyle = 'rgba(' + Math.round(90 * l) + ',' + Math.round(170 * l) + ',' + Math.round(60 * l) + ',.5)'; x.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(2, 5)); } });
    grassTex.wrapS = grassTex.wrapT = T.RepeatWrapping; grassTex.repeat.set(8, 8);
    var grassM = std({ map: grassTex, roughness: 1 }), dirtM = std({ color: 0x59616a, roughness: 1, flatShading: true }), sandM = std({ color: 0xbab39d, roughness: 1 });
    // the top: a slightly rounded square of grass
    var topShape = new T.Shape(), rc = 2.2;
    topShape.moveTo(-I + rc, -I); topShape.lineTo(I - rc, -I); topShape.quadraticCurveTo(I, -I, I, -I + rc); topShape.lineTo(I, I - rc); topShape.quadraticCurveTo(I, I, I - rc, I); topShape.lineTo(-I + rc, I); topShape.quadraticCurveTo(-I, I, -I, I - rc); topShape.lineTo(-I, -I + rc); topShape.quadraticCurveTo(-I, -I, -I + rc, -I);
    var topGeo = new T.ExtrudeGeometry(topShape, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.35, bevelSegments: 2, curveSegments: 8 });
    topGeo.rotateX(Math.PI / 2); topGeo.translate(0, -0.27, 0);
    var top = new T.Mesh(topGeo, [grassM, grassM]); top.receiveShadow = fancy; top.castShadow = false; scene.add(top);
    var cliffGeo = new T.ExtrudeGeometry(topShape, { depth: 2.6, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.7, bevelSegments: 1, curveSegments: 8 });
    cliffGeo.rotateX(Math.PI / 2); cliffGeo.translate(0, -0.7, 0);
    var cliff = new T.Mesh(cliffGeo, dirtM); cliff.receiveShadow = fancy; scene.add(cliff);
    var beach = new T.Mesh(new T.CylinderGeometry(I * 1.62, I * 1.75, 0.3, 40), sandM); beach.position.y = CC.WATER + 0.22; beach.receiveShadow = fancy; scene.add(beach);
    // low-poly trees round the edge (not in the castle's area) and far islands
    var leafM = [std({ color: 0x3f6357, roughness: 0.9, flatShading: true }), std({ color: 0x66816a, roughness: 0.9, flatShading: true }), std({ color: 0x314f4c, roughness: 0.9, flatShading: true })];
    var trunkM = std({ color: 0x7a5232, roughness: 1 });
    function tree(x, z, s, pine) {
      var g = new T.Group(), tr = new T.Mesh(new T.CylinderGeometry(0.12 * s, 0.18 * s, 1.2 * s, 6), trunkM); tr.position.y = 0.6 * s; g.add(tr);
      if (pine) { for (var i = 0; i < 3; i++) { var c = new T.Mesh(new T.ConeGeometry((1 - i * 0.22) * s, 1.3 * s, 7), leafM[2]); c.position.y = (1.3 + i * 0.7) * s; g.add(c); } }
      else { var b = new T.Mesh(new T.IcosahedronGeometry(0.95 * s, 0), leafM[Math.floor(R() * 2)]); b.position.y = 1.8 * s; b.scale.y = 1.1; g.add(b); var b2 = new T.Mesh(new T.IcosahedronGeometry(0.6 * s, 0), leafM[0]); b2.position.set(0.5 * s, 1.5 * s, 0.2 * s); g.add(b2); }
      g.traverse(function (o) { if (o.isMesh) o.castShadow = fancy; });
      g.position.set(x, 0, z); g.rotation.y = rnd(0, 6); scene.add(g); return g;
    }
    // trees only in the island's corners, small, so they never hide the castle
    for (var ti = 0; ti < 16; ti++) { var tx, tz, guard = 0; do { tx = rnd(-I + 0.8, I - 0.8); tz = rnd(-I + 0.8, I - 0.8); guard++; } while (guard < 80 && Math.min(Math.abs(tx), Math.abs(tz)) < 9.8); tree(tx, tz, rnd(0.6, 0.95), R() < 0.4); }
    function farIsland(x, z, r, h) {
      var g = new T.Group(), m = new T.Mesh(new T.CylinderGeometry(r * 0.8, r, h, 9), std({ color: 0x6b8075, roughness: 1, flatShading: true })); m.position.y = CC.WATER + h / 2; g.add(m);
      var s0 = new T.Mesh(new T.CylinderGeometry(r * 1.1, r * 1.2, 0.3, 12), sandM); s0.position.y = CC.WATER + 0.2; g.add(s0);
      g.position.set(x, 0, z); scene.add(g);
      for (var k = 0; k < Math.floor(r / 2); k++) { var a = rnd(0, 6.28), d = rnd(0, r * 0.6), t = tree(x + Math.cos(a) * d, z + Math.sin(a) * d, rnd(1.2, 2), R() < 0.5); t.position.y = CC.WATER + h; }
    }
    [[-60, -70, 9, 3], [70, -60, 12, 5], [-85, 30, 10, 4], [80, 50, 8, 3], [10, -110, 16, 7], [-30, 95, 9, 3]].forEach(function (f) { farIsland(f[0], f[1], f[2], f[3]); });
    var hillM = std({ color: 0x71877f, roughness: 1, flatShading: true });
    [[-120, -150, 50], [40, -170, 60], [150, -120, 40]].forEach(function (h) { var m = new T.Mesh(new T.SphereGeometry(h[2], 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), hillM); m.scale.y = 0.22; m.position.set(h[0], CC.WATER, h[1]); scene.add(m); });

    var paving=tex(256,256,function(x,w,h){x.fillStyle='#8e9386';x.fillRect(0,0,w,h);for(var yy=0;yy<8;yy++)for(var xx=0;xx<8;xx++){x.fillStyle=['#929589','#979a8e','#858f86'][(xx+yy*3)%3];x.fillRect(xx*32+1+(yy%2)*16,yy*32+1,30,30);}});
    paving.wrapS=paving.wrapT=T.RepeatWrapping;paving.repeat.set(5,5);
    var courtyard=new T.Mesh(new T.BoxGeometry(19,.16,18),std({map:paving,roughness:1}));courtyard.position.set(0,-.12,0);courtyard.receiveShadow=fancy;scene.add(courtyard);
    for(var ri=0;ri<13;ri++){var rock=new T.Mesh(new T.ConeGeometry(18+rnd(0,14),26+rnd(0,34),5),std({color:0x68818a,roughness:1,flatShading:true}));rock.position.set(-160+ri*27,5,-140-rnd(0,35));rock.rotation.y=rnd(0,4);scene.add(rock);}

    var environment = scene.children.filter(function(o){return !o.isLight && !(o.isMesh && o.material === skyMat);});
    // ---------------- castle materials ----------------
    // stone (1.5.0): each physics brick is drawn as ONE brick (Glenn: "the bricks ... aren't breaking apart as individual
    // bricks but instead as large sections"): before, every unit of wall was painted with four little bricks, so one
    // falling physics brick looked like a chunk of four to eight. Now the texture is a single stone block with a mortar
    // border and bevel, stretched once over each face, and every brick gets its own shade, so what you see come apart is
    // exactly what the physics moves: brick by brick.
    function brickTex(wu) { // wu: 1 for a square face, 2 for a long one (1.6.0: 0.5 or 1 wide), so the mortar border stays even
      return tex(128 * wu, 128, function (x, w, h) {
        var b = 2;
        x.fillStyle = '#8b8d87'; x.fillRect(0, 0, w, h); // mortar
        x.fillStyle = '#c9c7bb'; x.fillRect(b, b, w - 2 * b, h - 2 * b);
        var g = x.createLinearGradient(0, b, 0, h - b); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(0.18, 'rgba(255,255,255,0)'); g.addColorStop(0.8, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.16)');
        x.fillStyle = g; x.fillRect(b, b, w - 2 * b, h - 2 * b);
        x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(b, b, 4, h - 2 * b); x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(w - b - 5, b, 5, h - 2 * b);
        for (var i = 0; i < 90 * wu; i++) { x.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.08)'; x.fillRect(rnd(b, w - b), rnd(b, h - b), rnd(2, 5), rnd(2, 4)); }
        x.strokeStyle = 'rgba(0,0,0,.10)'; x.lineWidth = 2; x.beginPath(); x.moveTo(rnd(20, w - 40), rnd(20, 60)); x.lineTo(rnd(20, w - 20), rnd(60, 110)); x.stroke(); // a hairline crack
      });
    }
    var stoneTex = brickTex(1), stoneTex2 = brickTex(2);
    var stoneM = std({ map: stoneTex, bumpMap: stoneTex, bumpScale: 0.025, roughness: 0.88 }), stoneM2 = std({ map: stoneTex2, bumpMap: stoneTex2, bumpScale: 0.025, roughness: 0.88 });
    // one brick per face: a long face (2 units) takes the long brick picture, a square face the square one
    function brickBox(sx, sy, sz) {
      var bevel=Math.min(.025,sx*.04,sy*.04,sz*.04), shape=new T.Shape();
      var hx=sx/2-bevel, hy=sy/2-bevel;
      shape.moveTo(-hx,-hy);shape.lineTo(hx,-hy);shape.lineTo(hx,hy);shape.lineTo(-hx,hy);shape.closePath();
      var g=new T.ExtrudeGeometry(shape,{depth:sz-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1,curveSegments:1});
      g.translate(0,0,-sz/2+bevel);return g;
    }

    var roofM = std({ color: 0x3a4f5c, roughness: 0.7, flatShading: true });
    // 1.7.0: looks for the levels made past the bank (logic.js endlessStyle; the banked levels are all look 0): a tint
    // on every stone brick and its chips, and the roof colour. 0 grey stone, slate roofs; 1 sandstone, red tiles;
    // 2 red brick, dark slate; 3 dark basalt, copper green; 4 pale limestone, blue.
    var THEMES = [{ stone: [1, 1, 1], roof: 0x3a4f5c }, { stone: [1.06, 0.92, 0.7], roof: 0xa8492c }, { stone: [1.02, 0.6, 0.5], roof: 0x343c46 },
      { stone: [0.58, 0.6, 0.66], roof: 0x3f8c72 }, { stone: [1.12, 1.1, 1.04], roof: 0x2f5598 }], tint = THEMES[0].stone;
    var woodTex = tex(128, 128, function (x, w, h) { x.fillStyle = '#8a5a2e'; x.fillRect(0, 0, w, h); for (var i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#94633a' : '#7e5028'; x.fillRect(i * 32 + 2, 0, 28, h); } x.fillStyle = '#3a3f48'; x.fillRect(0, 20, w, 10); x.fillRect(0, h - 30, w, 10); });
    var woodM = std({ map: woodTex, roughness: 0.85 });
    var tntTex = tex(128, 128, function (x, w, h) { x.fillStyle = '#d42a2a'; x.fillRect(0, 0, w, h); x.fillStyle = '#8a1414'; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 10, w, 10); x.fillRect(0, 0, 10, h); x.fillRect(w - 10, 0, 10, h); x.fillStyle = '#fff3d0'; x.fillRect(10, 42, w - 20, 44); x.fillStyle = '#1b1b1b'; x.font = 'bold 38px sans-serif'; x.textAlign = 'center'; x.fillText('TNT', w / 2, 78); });
    var tntM = std({ map: tntTex, roughness: 0.6 });
    // a box whose texture repeats once per unit on every face
    function unitBox(sx, sy, sz) {
      var g = new T.BoxGeometry(sx, sy, sz), uv = g.attributes.uv, dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
      for (var f = 0; f < 6; f++) for (var v = 0; v < 4; v++) { var i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
      return g;
    }

    // ---------------- pieces (instanced by shape) ----------------
    var castle = new T.Group(); scene.add(castle);
    var groups = {}, slots = [], tmpM = new T.Matrix4(), tmpQ = new T.Quaternion(), tmpV = new T.Vector3(), tmpS = new T.Vector3(), col = new T.Color();
    function shapeFor(p) {
      var key = p[0] + ':' + p[4] + 'x' + p[5] + 'x' + p[6];
      if (groups[key]) return key;
      var geo, mat;
      if (p[0] === 'guard') { geo = new T.BoxGeometry(.01,.01,.01); mat = woodM; }
      else if (p[0] === 'cone') { geo = new T.ConeGeometry(p[4] * 0.56, p[5], 8); mat = roofM; }
      else if (p[0] === 'pyr') { geo = new T.ConeGeometry(p[4] * 0.72, p[5], 4); geo.rotateY(Math.PI / 4); mat = roofM; }
      else if (p[0] === 'door') { geo = unitBox(p[4], p[5], p[6]); mat = woodM; }
      else if (p[0] === 'tnt') { geo = new T.BoxGeometry(p[4], p[5], p[6]); mat = tntM; }
      else { geo = brickBox(p[4], p[5], p[6]); mat = [stoneM, stoneM2]; }
      groups[key] = { geo: geo, mat: mat, list: [] };
      return key;
    }
    function setPieces(pieces, theme) {
      clearDetails();
      var TH = THEMES[theme | 0] || THEMES[0]; tint = TH.stone; roofM.color.setHex(TH.roof);
      chips.length = 0; chipMesh.count = 0; // 1.7.0: the last castle's rubble chips don't lie about on the next one's grass
      Object.keys(groups).forEach(function (k) { if (groups[k].mesh) { castle.remove(groups[k].mesh); groups[k].mesh.dispose(); groups[k].mesh = null; } groups[k].list = []; });
      slots = [];
      pieces.forEach(function (p, i) { var k = shapeFor(p); slots[i] = { key: k, idx: groups[k].list.length, scale: 1, gone: false }; groups[k].list.push(i); });
      Object.keys(groups).forEach(function (k) {
        var G = groups[k]; if (!G.list.length) return;
        var m = new T.InstancedMesh(G.geo, G.mat, G.list.length); m.castShadow = fancy; m.receiveShadow = fancy; m.userData.key = k;
        G.list.forEach(function (pi, j) { var l = Array.isArray(G.mat) ? rnd(0.8, 1.08) : 1; m.setColorAt(j, Array.isArray(G.mat) ? col.setRGB(l * tint[0], l * tint[1], l * tint[2] * rnd(0.98, 1.03)) : col.setRGB(1, 1, 1)); });
        G.mesh = m; castle.add(m);
      });
      pieces.forEach(function (p, i) { tmpQ.identity(); place(i, p[1], p[2], p[3], tmpQ, 1); });
      Object.keys(groups).forEach(function (k) { var G = groups[k]; if (G.mesh) { G.mesh.instanceMatrix.needsUpdate = true; if (G.mesh.instanceColor) G.mesh.instanceColor.needsUpdate = true; G.mesh.computeBoundingSphere(); } });
    }
    function place(i, x, y, z, q, s) { var sl = slots[i], G = groups[sl.key]; tmpV.set(x, y, z); tmpS.set(s, s, s); tmpM.compose(tmpV, q, tmpS); G.mesh.setMatrixAt(sl.idx, tmpM); }
    // copy the physics into the instances; pieces that are gone shrink away
    function syncPieces(sim, dt) {
      syncDetails(sim);
      var dirty = {};
      sim.pieces.forEach(function (pc, i) {
        var sl = slots[i]; if (!sl) return;
        if (pc.gone) { if (sl.scale <= 0) return; sl.scale = Math.max(0, sl.scale - dt * 3); }
        else if (pc.b.sleepState === 2 && sl.synced) return;
        sl.synced = pc.b.sleepState === 2;
        var b = pc.b.position; tmpQ.set(pc.b.quaternion.x, pc.b.quaternion.y, pc.b.quaternion.z, pc.b.quaternion.w);
        place(i, b.x, b.y, b.z, tmpQ, sl.scale); dirty[sl.key] = 1;
      });
      Object.keys(dirty).forEach(function (k) { groups[k].mesh.instanceMatrix.needsUpdate = true; groups[k].mesh.computeBoundingSphere(); });
    }
    // which piece a ray hits (for aiming at a brick)
    function pickPiece(ray) {
      var meshes = Object.keys(groups).map(function (k) { return groups[k].mesh; }).filter(Boolean);
      var hit = ray.intersectObjects(meshes, false)[0];
      return hit ? hit.point : null;
    }

    var details=[], guardActors=[];
    function clearDetails(){details.concat(guardActors).forEach(function(d){scene.remove(d.mesh);d.mesh.traverse(function(o){if(o.isMesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(function(m){m.dispose();});else o.material.dispose();}});});details=[];guardActors=[];}
    function decoration(geo,mat,group,x,y,z){var m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=fancy;group.add(m);return m;}
    function addDetails(level){
      var colors=[0x2b666a,0x8c4034,0x354f74,0x447067,0x786044];
      (level.banners||[]).forEach(function(b){var idx=-1,dist=Infinity;level.pieces.forEach(function(p,i){if(p[0]==='tnt')return;var d=Math.hypot(p[1]-b.x,p[2]-b.y,p[3]-b.z);if(d<dist){dist=d;idx=i;}});if(idx<0)return;
        var p=level.pieces[idx],g=new T.Group(),pole=std({color:0xb69a62,metalness:.5,roughness:.45}),cloth=std({color:colors[level.theme%5],roughness:1,side:T.DoubleSide});
        decoration(new T.CylinderGeometry(.025,.025,1.4,6),pole,g,0,.3,.4);
        decoration(new T.BoxGeometry(.58,.82,.025),cloth,g,.27,.45,.42);
        decoration(new T.BoxGeometry(.045,.64,.03),std({color:0xe0c28a}),g,.28,.45,.445);
        scene.add(g);details.push({mesh:g,idx:idx});
      });
      level.pieces.forEach(function(p,i){if(p[0]!=='guard')return;var g=new T.Group(),armor=std({color:0x54646c,metalness:.55,roughness:.5}),helm=std({color:0xd0cec0,metalness:.65,roughness:.4}),cape=std({color:0x8f3f33,roughness:1});
        decoration(new T.BoxGeometry(.46,.55,.34),armor,g,0,-.05,0);decoration(new T.SphereGeometry(.22,10,8),helm,g,0,.4,0);decoration(new T.BoxGeometry(.31,.05,.1),std({color:0x17282d}),g,0,.4,.19);
        decoration(new T.BoxGeometry(.12,.3,.15),armor.clone(),g,-.13,-.43,0);decoration(new T.BoxGeometry(.12,.3,.15),armor.clone(),g,.13,-.43,0);decoration(new T.BoxGeometry(.52,.58,.045),cape,g,0,-.02,-.2);
        scene.add(g);guardActors.push({mesh:g,idx:i});
      });
    }
    function syncDetails(sim){details.concat(guardActors).forEach(function(d){var p=sim.pieces[d.idx];if(!p)return;d.mesh.visible=!p.gone;d.mesh.position.copy(p.b.position);d.mesh.quaternion.copy(p.b.quaternion);});}

    // ---------------- cannonballs and effects ----------------
    var ballGeo = new T.SphereGeometry(CC.BALLR, 20, 14), ballM = std({ color: 0x2a2d33, roughness: 0.35, metalness: 0.6 });
    function ballMesh() { var m = new T.Mesh(ballGeo, ballM); m.castShadow = fancy; scene.add(m); return m; }
    function soft(inner, outer) { return tex(64, 64, function (x, w, h) { var g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, w, h); }); }

    // ---------------- effects (1.6.0) ----------------
    // Glenn: smaller bricks "so the explosions look better/bigger". Drawn only (nothing here touches the physics, so
    // the level proofs don't depend on it): puffs of dust, smoke and fire as point sprites (one draw call per kind),
    // flying stone chips as one instanced mesh, sparks, a shock ring on the ground, and a little camera shake.
    var puffTex = soft('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
    var ptMax = 1; try { var gl0 = renderer.getContext(); ptMax = gl0.getParameter(gl0.ALIASED_POINT_SIZE_RANGE)[1] || 256; } catch (e) { ptMax = 256; }
    // a pool of point sprites: each particle has a position, a velocity, a size that grows, a colour and a fade
    function Puffs(max, additive) {
      var geo = new T.BufferGeometry(), pos = new Float32Array(max * 3), size = new Float32Array(max), alpha = new Float32Array(max), colr = new Float32Array(max * 3);
      geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('psize', new T.BufferAttribute(size, 1)); geo.setAttribute('palpha', new T.BufferAttribute(alpha, 1)); geo.setAttribute('pcol', new T.BufferAttribute(colr, 3));
      var mat = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending, fog: false,
        uniforms: { map: { value: puffTex }, uScale: { value: 400 }, uMax: { value: ptMax } },
        vertexShader: 'attribute float psize; attribute float palpha; attribute vec3 pcol; uniform float uScale; uniform float uMax; varying float vA; varying vec3 vC; void main(){ vA = palpha; vC = pcol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(psize * uScale / max(0.5, -mv.z), uMax); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform sampler2D map; varying float vA; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, t.a * vA);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' });
      var pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3; scene.add(pts);
      var list = [];
      return {
        mat: mat,
        add: function (x, y, z, vx, vy, vz, s0, s1, life, col, a0, grav, drag) {
          if (list.length >= max) list.shift();
          list.push({ x: x, y: y, z: z, vx: vx, vy: vy, vz: vz, s0: s0, s1: s1, life: life, t: 0, r: col[0], g: col[1], b: col[2], a0: a0, grav: grav || 0, drag: drag || 0 });
        },
        update: function (dt) {
          var n = 0;
          list = list.filter(function (p) { p.t += dt; return p.t < p.life; });
          for (var i = 0; i < list.length; i++) {
            var p = list[i], k = p.t / p.life, dk = Math.max(0, 1 - p.drag * dt);
            p.vx *= dk; p.vy = p.vy * dk + p.grav * dt; p.vz *= dk; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            if (p.grav && p.y < 0.05 && Math.abs(p.x) < CC.ISLAND && Math.abs(p.z) < CC.ISLAND) { p.y = 0.05; p.vy = Math.abs(p.vy) * 0.3; p.vx *= 0.5; p.vz *= 0.5; }
            pos[n * 3] = p.x; pos[n * 3 + 1] = p.y; pos[n * 3 + 2] = p.z;
            size[n] = p.s0 + (p.s1 - p.s0) * Math.sqrt(k); alpha[n] = p.a0 * (k < 0.1 ? k / 0.1 : 1 - (k - 0.1) / 0.9);
            colr[n * 3] = p.r; colr[n * 3 + 1] = p.g; colr[n * 3 + 2] = p.b; n++;
          }
          geo.setDrawRange(0, n);
          geo.attributes.position.needsUpdate = geo.attributes.psize.needsUpdate = geo.attributes.palpha.needsUpdate = geo.attributes.pcol.needsUpdate = true;
        }
      };
    }
    var soot = Puffs(260, false), glow = Puffs(220, true);
    var C_DUST = [0.93, 0.9, 0.84], C_DUST2 = [0.8, 0.76, 0.7], C_SMOKE = [0.36, 0.36, 0.4], C_FIRE = [1, 0.45, 0.08], C_FIRE2 = [1, 0.78, 0.3], C_SPARK = [1, 0.8, 0.35], C_WATER = [0.95, 0.98, 1];
    // stone chips: little tumbling blocks thrown out of a hit; they bounce once or twice on the grass and shrink away
    // 1.6.0 (Glenn: "the bricks are huge - i was hoping they'd be smaller - so the explosions look better/bigger"): the
    // chips are little bricks (2:1:1, the brick picture) and there are far more of them: a hit sprays a few dozen that
    // tumble, skid on the grass and lie there a few seconds before shrinking away. Drawn only: no effect on the physics.
    var CHIPS = 900, chipGeo = new T.BoxGeometry(1.7, 0.85, 1), chipM = std({ map: stoneTex2, color: 0xffffff, roughness: 0.9 }), chipMesh = new T.InstancedMesh(chipGeo, chipM, CHIPS);
    chipMesh.frustumCulled = false; chipMesh.count = 0; chipMesh.castShadow = false; scene.add(chipMesh);
    chipMesh.setColorAt(0, new T.Color(1, 1, 1));
    var chips = [], chipQ = new T.Quaternion(), chipE = new T.Euler();
    function chip(x, y, z, vx, vy, vz, s, c) {
      if (chips.length >= CHIPS) chips.shift();
      chips.push({ x: x, y: y, z: z, vx: vx, vy: vy, vz: vz, s: s, t: 0, life: s > 0.16 ? 3.2 + Math.random() * 2.2 : 1.1 + Math.random() * 0.9, rx: Math.random() * 6, ry: Math.random() * 6, wx: (Math.random() - 0.5) * 18, wy: (Math.random() - 0.5) * 18, c: c });
    }
    function burst(x, y, z, n, speed, up, sMin, sMax, tint2) { // tint2: some chips this colour (TNT crate red); the rest are stone in this level's look
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, h = Math.random(), sp = speed * (0.4 + Math.random() * 0.6);
        var l = 0.62 + Math.random() * 0.35, c = tint2 && Math.random() < 0.45 ? tint2 : [l * tint[0], l * tint[1], l * tint[2] * (0.97 + Math.random() * 0.06)];
        chip(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.3) * 0.3, z + (Math.random() - 0.5) * 0.3, Math.cos(a) * sp * (1 - h * 0.5), up * (0.5 + h) + Math.random() * 2, Math.sin(a) * sp * (1 - h * 0.5), sMin + Math.random() * (sMax - sMin), c);
      }
    }
    function updChips(dt) {
      var n = 0;
      chips = chips.filter(function (p) { p.t += dt; return p.t < p.life && p.y > CC.WATER - 0.5; });
      for (var i = 0; i < chips.length; i++) {
        var p = chips[i];
        p.vy += CC.GRAV * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rx += p.wx * dt; p.ry += p.wy * dt;
        var ly = p.s * 0.43;
        if (p.y < ly && Math.abs(p.x) < CC.ISLAND && Math.abs(p.z) < CC.ISLAND && p.vy < 0) {
          p.y = ly; p.vy = p.vy < -2 ? -p.vy * 0.3 : 0; p.vx *= 0.6; p.vz *= 0.6; p.wx *= 0.45; p.wy *= 0.45;
          if (!p.vy) { p.rx = Math.round(p.rx / 3.1416) * 3.1416; } // come to rest lying flat
        }
        if (p.y <= ly + 0.001 && !p.vy) { var fr = Math.max(0, 1 - dt * 5); p.vx *= fr; p.vz *= fr; p.wx *= fr; p.wy *= fr; }
        var k = p.t / p.life, sc = p.s * (k > 0.78 ? 1 - (k - 0.78) / 0.22 : 1);
        chipE.set(p.rx, p.ry, 0); chipQ.setFromEuler(chipE); tmpV.set(p.x, p.y, p.z); tmpS.set(sc, sc, sc); tmpM.compose(tmpV, chipQ, tmpS);
        chipMesh.setMatrixAt(n, tmpM); col.setRGB(p.c[0], p.c[1], p.c[2]); chipMesh.setColorAt(n, col); n++;
      }
      chipMesh.count = n; chipMesh.instanceMatrix.needsUpdate = true; if (chipMesh.instanceColor) chipMesh.instanceColor.needsUpdate = true;
    }
    // a flat ring that races out over the grass from a TNT blast
    var rings = [], ringGeo = new T.RingGeometry(0.8, 1, 40); ringGeo.rotateX(-Math.PI / 2);
    function shockRing(x, y, z) {
      var m = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
      m.position.set(x, Math.max(0.06, y - 0.3), z); m.renderOrder = 4; scene.add(m); rings.push({ m: m, t: 0 });
    }
    function updRings(dt) {
      rings = rings.filter(function (r) { r.t += dt; var k = r.t / 0.55; if (k >= 1) { scene.remove(r.m); r.m.material.dispose(); return false; } var s = 0.6 + k * 6.5; r.m.scale.set(s, s, s); r.m.material.opacity = 0.8 * (1 - k); return true; });
    }
    var shake = 0;
    function rnd2(a) { return (Math.random() - 0.5) * a; }
    // a cannonball smashes into the wall: a spray of chips and a burst of dust (big = a hard, fast hit)
    function impact(x, y, z, v, ball) {
      if (ball) {
        burst(x, y, z, 34, 7, 5, 0.17, 0.4); // little bricks
        burst(x, y, z, 12, 6, 4, 0.06, 0.13); // grit
        for (var i = 0; i < 7; i++) soot.add(x + rnd2(0.8), y + rnd2(0.5), z + rnd2(0.8), rnd2(2), 1 + Math.random() * 1.5, rnd2(2), 0.8, 2.6 + Math.random(), 0.9 + Math.random() * 0.4, i % 2 ? C_DUST : C_DUST2, 0.85, 0, 1.5);
        shake = Math.max(shake, 0.3);
      } else {
        burst(x, y, z, v > 8 ? 7 : 3, 3.5, 2.8, 0.14, 0.3);
        soot.add(x, y, z, rnd2(1), 0.8, rnd2(1), 0.5, v > 8 ? 2 : 1.4, 0.8, C_DUST, 0.7, 0, 1.5);
      }
    }
    function dust(x, y, z, big) { impact(x, y, z, big ? 9 : 5, false); }
    function boom(x, y, z) {
      var i, a, sp;
      // a fireball: a hot core and flames racing out
      glow.add(x, y, z, 0, 0, 0, 1.5, 7, 0.35, C_FIRE2, 0.85, 0, 0);
      for (i = 0; i < 10; i++) { a = Math.random() * 6.283; sp = 4 + Math.random() * 5; glow.add(x, y + 0.3, z, Math.cos(a) * sp, 2 + Math.random() * 4, Math.sin(a) * sp, 1.2, 3.5 + Math.random() * 2, 0.45 + Math.random() * 0.25, Math.random() < 0.7 ? C_FIRE : C_FIRE2, 0.55, 0, 3); }
      // sparks and chips (stone, red crate and wood) flying everywhere
      for (i = 0; i < 26; i++) { a = Math.random() * 6.283; sp = 6 + Math.random() * 9; glow.add(x, y + 0.3, z, Math.cos(a) * sp, 4 + Math.random() * 8, Math.sin(a) * sp, 0.25, 0.12, 0.6 + Math.random() * 0.5, C_SPARK, 1, CC.GRAV * 0.7, 0.5); }
      burst(x, y + 0.2, z, 90, 11, 8, 0.15, 0.45, [0.85, 0.2, 0.16]);
      burst(x, y + 0.2, z, 24, 9, 6, 0.06, 0.14);
      // a column of smoke that rolls up and hangs about
      for (i = 0; i < 12; i++) soot.add(x + rnd2(2.4), y + Math.random() * 1.2, z + rnd2(2.4), rnd2(1.5), 1.5 + Math.random() * 2.5, rnd2(1.5), 1.2, 4.5 + Math.random() * 2.5, 1.6 + Math.random() * 1.2, C_SMOKE, 0.75, 0, 1.2);
      for (i = 0; i < 6; i++) soot.add(x + rnd2(3), 0.3, z + rnd2(3), rnd2(4), 0.5, rnd2(4), 1, 3.5, 1.2, C_DUST2, 0.7, 0, 1.5);
      shockRing(x, y, z);
      flash = 1; shake = Math.max(shake, 0.6);
    }
    function splash(x, z) {
      for (var i = 0; i < 10; i++) { var a = Math.random() * 6.283, sp = 1 + Math.random() * 2.5; soot.add(x, CC.WATER + 0.4, z, Math.cos(a) * sp, 4 + Math.random() * 4, Math.sin(a) * sp, 0.35, 0.2, 0.6 + Math.random() * 0.3, C_WATER, 0.95, CC.GRAV * 0.8, 0); }
      soot.add(x, CC.WATER + 0.45, z, 0, 0.6, 0, 0.6, 2.4, 0.7, C_WATER, 0.8, 0, 0);
    }
    var flash = 0, flashLight = new T.PointLight(0xffa040, 0, 30); scene.add(flashLight);
    var reticle = (function () { var g = new T.Group(); var rm = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false }), dm = new T.MeshBasicMaterial({ color: 0x1b1f33, transparent: true, depthTest: false });
      g.add(new T.Mesh(new T.RingGeometry(0.55, 0.75, 32), dm)); g.add(new T.Mesh(new T.RingGeometry(0.75, 0.9, 32), rm)); g.add(new T.Mesh(new T.CircleGeometry(0.22, 20), dm));
      g.children.forEach(function (c) { c.renderOrder = 10; }); g.visible = false; scene.add(g); return g; })();

    // ---------------- per frame ----------------
    var time = 0;
    function update(dt) {
      time += dt; if (kick > 0) kick = Math.max(0, kick - dt * 5); waterTex.offset.set(time * 0.004, time * 0.006);
      clouds.forEach(function (c, i) { var a = Math.atan2(c.position.z, c.position.x) + dt * 0.004 * (1 + i % 3); var d = Math.hypot(c.position.x, c.position.z); c.position.x = Math.cos(a) * d; c.position.z = Math.sin(a) * d; });
      var uS = pxH * (renderer.getPixelRatio ? renderer.getPixelRatio() : 1) * 0.5 / Math.max(0.05, VIEW.tanV); soot.mat.uniforms.uScale.value = uS; glow.mat.uniforms.uScale.value = uS;
      soot.update(dt); glow.update(dt); updChips(dt); updRings(dt);
      if (shake > 0) shake = Math.max(0, shake - dt * 1.6);
      if (flash > 0) { flash = Math.max(0, flash - dt * 3); flashLight.intensity = flash * 60; } else flashLight.intensity = 0;
    }
    function setBoomLight(x, y, z) { flashLight.position.set(x, y + 1, z); }
    // ---------------- the view (1.2.0) ----------------
    // Glenn: "the camera view is off". Like the original, the camera stands behind the cannon at a moderate angle
    // (VIEW.PITCH down), the castle big and centred in the free space between the counters at the top and the home
    // bar, and the sky and horizon showing at the top. Every corner of every piece is projected (like Topple's
    // frameCam) and, for the current walk-round angle, the camera backs off until the castle fills the free space's
    // width (or height) exactly; an off-center frame then centres it. The camera orbits the castle's own middle, so a
    // lopsided castle (a watch corner) is centred too. The fit is redone whenever the angle changes, so the castle is
    // whole and centred from every side. The vertical view angle is set so the horizon sits VIEW.HOR from the top.
    // Only the picture moves: the cannon still fires from CC.launchAt (logic.js), so physics and level proofs hold.
    // 1.3.0 (Glenn: "the castle angle is still a bit too high - and it's a bit too close. It should be further away and
    // come closer as the cannon hits it"): a lower camera (17 degrees down, was 27); at the start the castle fills only
    // VIEW.fill (72%) of the free width, and as it comes down the camera re-frames what's still standing and fills more
    // (up to 92%), gliding in smoothly (the targets t* are eased toward in aimCamera).
    var VIEW = { PITCH: 17 * Math.PI / 180, HOR: 0.62, pts: null, piv: [0, 2, 0], D: 20, fitYaw: null, tanV: 0.6, sx: 0, sy: 0, push: 1,
      fill: 0.6, D0: 0, tD: 20, tTanV: 0.6, tSx: 0, tSy: 0, tPiv: [0, 2, 0], snap: true, zoom: 0, zp: [0, 0, 0] };
    // 1.4.0 (Glenn, with Castle Wreck screenshots: "these are further away - after the first shot it keeps moving closer
    // in the version you provided - it should remain a fixed distance when shooting (and zoom in as the cannon gets
    // closer) then zoom back out"): the frame is fixed for the level (the castle fills 60% of the width, further back
    // than 1.3.0, and no re-framing as it falls); each shot the camera rides in toward where the ball will land while
    // it flies (VIEW.zoom 0..1 toward VIEW.zp, driven by app.js), then pulls back out. A cannon sits at the bottom of
    // the screen like the original's.
    var marg = { top: 0, bottom: 0, side: 0 }, pxW = 1, pxH = 1, aspectNow = 0.5, pa = [], pb = [], pc = [];
    // the castle as it stands at the start: all piece corners (a cone's round base is a little wider than its box)
    function fitView(pieces, fill, keep) {
      var seen = {}, pts = [], x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, top = 0;
      pieces.forEach(function (p) {
        var k = p[0] === 'cone' ? 1.12 : 1, hx = p[4] * k / 2, hy = p[5] / 2, hz = p[6] * k / 2;
        for (var c = 0; c < 8; c++) {
          var x = p[1] + (c & 1 ? hx : -hx), y = p[2] + (c & 2 ? hy : -hy), z = p[3] + (c & 4 ? hz : -hz), key = x.toFixed(2) + ',' + y.toFixed(2) + ',' + z.toFixed(2);
          if (seen[key]) continue; seen[key] = 1; pts.push([x, y, z]);
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); top = Math.max(top, y);
        }
      });
      if (!pts.length) pts = [[-3, 0, -3], [3, 0, -3], [-3, 0, 3], [3, 0, 3], [0, 4, 0]];
      VIEW.pts = pts; VIEW.tPiv = [(x0 + x1) / 2 || 0, Math.max(1, top * 0.35), (z0 + z1) / 2 || 0]; VIEW.fitYaw = null;
      VIEW.fill = fill || 0.82;
      if (!keep) { VIEW.snap = true; VIEW.D0 = 0; VIEW.glide = false; } else VIEW.glide = true; // a new level: jump to the frame; a re-frame (keep): glide in
    }
    // frame the castle for one walk-round angle: the camera distance, the vertical view angle and the frame's offset
    function frameFor(yaw) {
      var pts = VIEW.pts; if (!pts) return;
      var cp = Math.cos(VIEW.PITCH), sp = Math.sin(VIEW.PITCH), tanP = sp / cp, sy = Math.sin(yaw), cy = Math.cos(yaw), P = VIEW.tPiv;
      // camera axes: back (from the castle to the camera), right, up
      var bx = sy * cp, by = sp, bz = cy * cp, rx = cy, rz = -sy, ux = -sy * sp, uy = cp, uz = -cy * sp, n = pts.length, cmax = -1e9;
      for (var i = 0; i < n; i++) { var q = pts[i], dx = q[0] - P[0], dy = q[1] - P[1], dz = q[2] - P[2]; pa[i] = dx * rx + dz * rz; pb[i] = dx * ux + dy * uy + dz * uz; pc[i] = dx * bx + dy * by + dz * bz; if (pc[i] > cmax) cmax = pc[i]; }
      // the free space in screen units (-1..1): below the cannonballs pill, above the home bar, small side margins
      var yb = -1 + 2 * marg.bottom / pxH, yt = 1 - 2 * marg.top / pxH, xs = (1 - 2 * marg.side / pxW) * VIEW.fill;
      if (yt - yb < 0.4) { yb = -0.9; yt = 0.9; } // tiny or odd canvas: a sane frame
      var yc = (yt + yb) / 2, hor = Math.max(yc + 0.3, Math.min(VIEW.HOR, yt + 0.12));
      var tMin = Math.tan(20 * Math.PI / 180), tMax = Math.tan(38 * Math.PI / 180), res = null;
      function at(D) {
        var ax0 = 1e9, ax1 = -1e9, ay0 = 1e9, ay1 = -1e9;
        for (var j = 0; j < n; j++) { var d = D - pc[j], x = pa[j] / d, y = pb[j] / d; if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (y < ay0) ay0 = y; if (y > ay1) ay1 = y; }
        // the vertical view angle that puts the horizon (tanP above the axis) at "hor" with the castle's middle at yc
        var tanV = Math.max(tMin, Math.min(tMax, (tanP - (ay0 + ay1) / 2) / (hor - yc)));
        var need = Math.max((ax1 - ax0) / 2 / (tanV * aspectNow * xs), (ay1 - ay0) / (tanV * (yt - yb) * Math.min(1, VIEW.fill + 0.12)));
        return { need: need, tanV: tanV, sx: (ax0 + ax1) / 2, sy: (ay0 + ay1) / 2 - yc * tanV };
      }
      // the nearest distance at which the castle fits (it shrinks on screen as the camera backs off)
      var lo = cmax + 3, hi = cmax + 200;
      if (at(lo).need <= 1) hi = lo;
      else for (var it = 0; it < 24; it++) { var mid = (lo + hi) / 2; if (at(mid).need <= 1) hi = mid; else lo = mid; }
      // never closer than 55% of the level's first distance (a last lone brick would otherwise fill the screen)
      if (VIEW.D0 && hi < VIEW.D0 * 0.55) hi = VIEW.D0 * 0.55;
      res = at(hi);
      if (!VIEW.D0) VIEW.D0 = hi;
      VIEW.tD = hi; VIEW.tTanV = res.tanV; VIEW.tSx = res.sx; VIEW.tSy = res.sy; VIEW.fitYaw = yaw;
      if (VIEW.snap) { VIEW.snap = false; VIEW.D = hi; VIEW.tanV = res.tanV; VIEW.sx = res.sx; VIEW.sy = res.sy; VIEW.piv = VIEW.tPiv.slice(); }
    }
    function applyFrame() {
      var nr = camera.near, tw = VIEW.tanV * aspectNow, zf = 1 - VIEW.zoom, sx = VIEW.sx * zf, sy = VIEW.sy * zf;
      camera.fov = 2 * Math.atan(VIEW.tanV) * 180 / Math.PI; camera.aspect = aspectNow;
      camera.projectionMatrix.makePerspective(nr * (sx - tw), nr * (sx + tw), nr * (sy + VIEW.tanV), nr * (sy - VIEW.tanV), nr, camera.far);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    }
    // place the camera for a walk-round angle; push > 1 stands it further back (the swing-in at the start of a level)
    function aimCamera(yaw, push, dt) {
      if (VIEW.pts && (VIEW.fitYaw === null || Math.abs(yaw - VIEW.fitYaw) > 1e-4)) frameFor(yaw);
      // ease toward the target frame (about 1.5 s to close in after a hit; instant when walking round)
      var k = Math.min(1, (dt || 0) * (VIEW.glide ? 1.6 : 10)), P = VIEW.piv, T = VIEW.tPiv;
      if (VIEW.glide && Math.abs(VIEW.tD - VIEW.D) < VIEW.D * 0.004) VIEW.glide = false;
      VIEW.D += (VIEW.tD - VIEW.D) * k; VIEW.tanV += (VIEW.tTanV - VIEW.tanV) * k; VIEW.sx += (VIEW.tSx - VIEW.sx) * k; VIEW.sy += (VIEW.tSy - VIEW.sy) * k;
      P[0] += (T[0] - P[0]) * k; P[1] += (T[1] - P[1]) * k; P[2] += (T[2] - P[2]) * k;
      applyFrame();
      var D = VIEW.D * (push || 1), cp = Math.cos(VIEW.PITCH), z = VIEW.zoom, Z = VIEW.zp;
      var bx = P[0] + Math.sin(yaw) * cp * D, by = P[1] + Math.sin(VIEW.PITCH) * D, bz = P[2] + Math.cos(yaw) * cp * D;
      // the shot zoom: the camera rides up to ZOOM_IN of the way toward the landing spot and turns to look at it
      var m = z * ZOOM_IN;
      camera.position.set(bx + (Z[0] - bx) * m, by + (Z[1] + 2 - by) * m, bz + (Z[2] - bz) * m);
      // a little shake on big hits and TNT (drawn only; it fades in about a third of a second)
      var sk = VIEW.reducedMotion ? 0 : shake * shake * VIEW.D * 0.035; if (sk > 0) camera.position.set(camera.position.x + rnd2(sk), camera.position.y + rnd2(sk), camera.position.z + rnd2(sk));
      camera.lookAt(P[0] + (Z[0] - P[0]) * z, P[1] + (Z[1] - P[1]) * z, P[2] + (Z[2] - P[2]) * z); camera.updateMatrixWorld(true);
      placeGun();
    }
    var ZOOM_IN = 0.22;
    // ---------------- the cannon at the bottom of the screen (1.4.0) ----------------
    // It rides with the camera (a child of it), sits at the bottom middle, turns toward each shot, kicks back when it
    // fires, and drops out of sight while the camera zooms in on a shot.
    var gun = new T.Group(), gunTurn = new T.Group(), barrel = new T.Group(), tip = new T.Object3D(), kick = 0, gunYaw = 0, gunPitch = 0.12;
    (function () {
      var iron = std({ color: 0x2c2f36, roughness: 0.45, metalness: 0.6 }), iron2 = std({ color: 0x3d414b, roughness: 0.4, metalness: 0.65 }),
        wood = std({ color: 0x8a5a2e, roughness: 0.85 }), wood2 = std({ color: 0x6d4422, roughness: 0.9 }), gold = std({ color: 0xd6a83a, roughness: 0.35, metalness: 0.7 });
      var base = new T.Mesh(new T.BoxGeometry(1.25, 0.34, 1.35), wood); base.position.y = 0.17; gunTurn.add(base);
      [-0.5, 0.5].forEach(function (x) {
        var cheek = new T.Mesh(new T.BoxGeometry(0.16, 0.5, 1.05), wood2); cheek.position.set(x * 0.9, 0.55, 0.05); gunTurn.add(cheek);
        var wheel = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.14, 20), wood2); wheel.rotation.z = Math.PI / 2; wheel.position.set(x * 1.45, 0.3, 0.35); gunTurn.add(wheel);
        var hub = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.18, 12), gold); hub.rotation.z = Math.PI / 2; hub.position.copy(wheel.position); gunTurn.add(hub);
      });
      var tube = new T.Mesh(new T.CylinderGeometry(0.2, 0.32, 1.7, 24), iron); tube.rotation.x = -Math.PI / 2; tube.position.z = -0.55; barrel.add(tube);
      var back = new T.Mesh(new T.SphereGeometry(0.33, 20, 14), iron); back.position.z = 0.3; barrel.add(back);
      [-0.05, -0.75].forEach(function (z) { var r = new T.Mesh(new T.TorusGeometry(0.29 - (z < -0.5 ? 0.05 : 0), 0.045, 8, 24), iron2); r.position.z = z; barrel.add(r); });
      var lip = new T.Mesh(new T.TorusGeometry(0.21, 0.07, 10, 24), iron2); lip.position.z = -1.4; barrel.add(lip);
      var bore = new T.Mesh(new T.CircleGeometry(0.15, 20), std({ color: 0x0b0c0f, roughness: 1 })); bore.position.z = -1.41; bore.rotation.y = Math.PI; barrel.add(bore);
      tip.position.z = -1.45; barrel.add(tip);
      barrel.position.set(0, 0.72, 0.1); gunTurn.add(barrel); gun.add(gunTurn);
      gun.traverse(function (o) { if (o.isMesh) { o.renderOrder = 5; } });
      camera.add(gun); scene.add(camera);
    })();
    var GUN_D = 5;
    function placeGun() {
      var z = VIEW.zoom, zf = 1 - VIEW.zoom, t = VIEW.tanV, sc = t * GUN_D * 0.29;
      gun.scale.set(sc, sc, sc);
      // bottom middle of the (off-centre) frame, sunk a little so the carriage sits on the screen's edge; down and out on a zoom
      gun.position.set(VIEW.sx * zf * GUN_D, (VIEW.sy * zf - t * 0.93) * GUN_D - z * z * sc * 3, -GUN_D);
      gun.rotation.x = 0.62; // seen from above and behind, so the barrel's length shows gun.visible = z < 0.9;
      gunTurn.rotation.y = gunYaw; barrel.rotation.x = gunPitch; barrel.position.z = 0.1 + kick * 0.35;
    }
    var gv = new T.Vector3();
    function aimGun(x, y, z) { // turn the cannon toward a world point (in the camera's frame; a little, so it stays on screen)
      gv.set(x, y, z); camera.worldToLocal(gv);
      gunYaw = Math.max(-0.6, Math.min(0.6, Math.atan2(-gv.x, -gv.z)));
      gunPitch = Math.max(0.02, Math.min(0.4, 0.1 + Math.atan2(gv.y, -gv.z) * 0.8));
    }
    function fireGun() { kick = 1; }
    function muzzle(out) { camera.updateMatrixWorld(true); return tip.getWorldPosition(out); }
    function resize(w, h, m) {
      renderer.setSize(w, h, false); pxW = w; pxH = h; if (m) marg = m;
      aspectNow = w / h; VIEW.fitYaw = null; VIEW.snap = true; VIEW.D0 = 0;
      if (!VIEW.pts) { camera.aspect = aspectNow; camera.fov = 60; camera.updateProjectionMatrix(); }
    }
    return { setEnvironment: function(side){environment.forEach(function(o){o.visible=!side;});}, gun: gun, addDetails: addDetails, view: VIEW, renderer: renderer, scene: scene, camera: camera, setPieces: setPieces, fitView: fitView, syncPieces: syncPieces, pickPiece: pickPiece, ballMesh: ballMesh,
      dust: dust, impact: impact, boom: function (x, y, z) { boom(x, y, z); setBoomLight(x, y, z); }, splash: splash, reticle: reticle, update: update, aimCamera: aimCamera, resize: resize, fancy: fancy, aimGun: aimGun, fireGun: fireGun, muzzle: muzzle };
  }
  return { build: build };
})();
