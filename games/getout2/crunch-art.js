/* Crunch Time photographic scenery. Visual only: original rules, coordinates and save schema remain authoritative. */
(function(){'use strict';
  var H = GOArt.H, A1 = GOArt.scene1, L = GORoom1.L, PI = Math.PI, TAU = PI * 2;
  var rr = H.rr, lin = H.lin, rad = H.rad, box = H.box, circ = H.circ, line = H.line, txt = H.txt, seeded = H.seeded, wrap = H.wrap;
  var chrome = H.chrome, stripes = H.stripes, sticky = H.sticky, dropShadow = H.dropShadow, noShadow = H.noShadow, gloss = H.gloss, burst = H.burst;
  var SANS = H.SANS, SERIF = H.SERIF, HAND = H.HAND, COMIC = H.COMIC;
  var C = A1.C, INK = C.INK, CREAM = C.CREAM, PIPE = C.PIPE, poly = A1.poly, fillExt = A1.fillExt;
  var V = {};
  var COLHEX = GORoom1.COLHEX;

  function dashBg(c, e) { fillExt(c, e, '#2a1012'); c.fillStyle = A1.paint(c, 0, e.y0, 0, e.y1); c.fillRect(e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0); }
  function paper(c, x, y, w, h, col, rot) { c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot || 0); dropShadow(c, 18, 8, 0.45); box(c, -w / 2, -h / 2, w, h, 6, col || '#fbfaf4'); noShadow(c); c.restore(); }
  function lines(c, arr, x, y, size, col, o) { arr.forEach(function (l, i) { txt(c, l, x, y + i * size * 1.25, size, col, o); }); }


  var art={},pending={},names=['front','pass','back','door','dash','radio','wheel','console','foot','glove','visor','manual','pseat','bseat-open','battery','pocket','toolbox','toolbox-open'];
  function request(k){if(art[k]||pending[k])return;pending[k]=true;var im=new Image();im.onload=function(){art[k]=im;window.dispatchEvent(new Event('gomaterialready'));};im.onerror=function(){delete pending[k];};im.src='assets/crunch-'+k+'-v2.webp';}
  function photo(c,k,e){var im=art[k]; if(!im)return false;c.save();c.fillStyle='#160d0c';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);
    // Texture the extra phone height as cabin trim, without duplicating props.
    c.fillStyle='#211411';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);
    if(typeof GOMaterial!=='undefined')GOMaterial.paint(c,'leather',e.x0,e.y0,e.x1-e.x0,e.y1-e.y0,false,.28);
    c.drawImage(im,0,0,1000,1400);c.restore();return true;}
  function crop(c,k,s,d){var im=art[k];if(!im)return; c.drawImage(im,s[0]*im.width/1000,s[1]*im.height/1400,s[2]*im.width/1000,s[3]*im.height/1400,d[0],d[1],d[2],d[3]);}
  // Real paper grain under live ink, with deterministic shading (never game RNG).
  var rawBox=box;
  box=function(c,x,y,w,h,r,fill,stroke,lw){rawBox(c,x,y,w,h,r,fill,stroke,lw);
    if(typeof fill==='string'&&['#fbfaf4','#fbf6e6','#fff07a','#e8f0ff','#e9e0b8','#ffb06a','#e6d9a8'].indexOf(fill)>=0&&w>120&&h>90&&art.manual){c.save();rr(c,x,y,w,h,r);c.clip();c.globalCompositeOperation='multiply';c.globalAlpha=.3;crop(c,'manual',[80,230,380,930],[x,y,w,h]);c.restore();}
  };
  // Make text readable at phone scale; original text content is unchanged.
  txt=function(c,s,x,y,size,col,o){o=Object.assign({},o||{});if(o.font===COMIC)o.font='Arial, sans-serif';if(o.font===HAND)o.font='Georgia, serif';H.txt(c,s,x,y,size,col,o);};
  function label(c,s,x,y,size){c.save();c.shadowColor='#000';c.shadowBlur=5;txt(c,s,x,y,size||28,'#fff3d4',{weight:800,font:'Arial, sans-serif'});c.restore();}
  function dryText(c,fn,X,filter){var texts=[],g=document.createElement('canvas');g.width=1000;g.height=1400;var q=g.getContext('2d'),ft=q.fillText.bind(q),st=q.strokeText.bind(q);
    q.fillText=function(s,x,y){texts.push({s:s,x:x,y:y,t:q.getTransform(),font:q.font,fill:q.fillStyle,align:q.textAlign,base:q.textBaseline});};q.strokeText=function(){};
    fn(q,Object.assign({},X,{hit:null}));texts.forEach(function(t){if(filter&&!filter(t))return;c.save();c.transform(t.t.a,t.t.b,t.t.c,t.t.d,t.t.e,t.t.f);c.font=t.font.replace(/"Arial Black"/g,'Arial');c.fillStyle=t.fill;c.textAlign=t.align;c.textBaseline=t.base;c.fillText(t.s,t.x,t.y);c.restore();});g.width=g.height=1;
  }
  function roadSign(c, kind, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.lineJoin = 'round';
    if (kind === 'stop') { c.beginPath(); for (var i = 0; i < 8; i++) { var a = PI / 8 + i * PI / 4; c.lineTo(Math.cos(a) * 50, Math.sin(a) * 50); } c.closePath(); c.fillStyle = '#d8312b'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke(); txt(c, 'STOP', 0, 2, 24, '#fff', { font: COMIC }); }
    else if (kind === 'yield') { c.beginPath(); c.moveTo(-50, -40); c.lineTo(50, -40); c.lineTo(0, 46); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#d8312b'; c.lineWidth = 12; c.stroke(); }
    else if (kind === 'arrow') { box(c, -50, -26, 100, 52, 4, '#1d1d22', '#fff', 4); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-36, -8); c.lineTo(20, -8); c.lineTo(20, -20); c.lineTo(40, 0); c.lineTo(20, 20); c.lineTo(20, 8); c.lineTo(-36, 8); c.closePath(); c.fill(); }
    else if (kind === 'rail') { c.save(); c.rotate(PI / 4); box(c, -54, -9, 108, 18, 2, '#fff', '#1d1d22', 3); c.restore(); c.save(); c.rotate(-PI / 4); box(c, -54, -9, 108, 18, 2, '#fff', '#1d1d22', 3); c.restore(); }
    else if (kind === 'fuel') { box(c, -42, -42, 84, 84, 8, '#2f6fd6', '#fff', 4); box(c, -20, -22, 26, 44, 4, '#fff'); line(c, 6, -10, 20, 0, '#fff', 5); line(c, 20, 0, 20, 18, '#fff', 5); }
    else {
      c.save(); c.rotate(PI / 4); box(c, -36, -36, 72, 72, 6, '#f2c230', '#1d1d22', 4); c.restore();
      c.strokeStyle = '#1d1d22'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath();
      if (kind === 'curve') { c.moveTo(-8, 24); c.quadraticCurveTo(-8, -10, 14, -18); c.stroke(); c.beginPath(); c.moveTo(6, -26); c.lineTo(18, -18); c.lineTo(8, -6); c.stroke(); }
      else if (kind === 'bump') { c.moveTo(-26, 12); c.quadraticCurveTo(0, -20, 26, 12); c.stroke(); }
      else { c.moveTo(0, 26); c.lineTo(-10, 12); c.lineTo(10, -2); c.lineTo(-6, -14); c.lineTo(4, -26); c.stroke(); }
    }
    c.restore();
  }
var original={};Object.keys(A1.CLOSE).forEach(function(k){original[k]=A1.CLOSE[k];});
V.manual=function(c,X){var e=X.ext,cl=X.R.clues.manual;
    // left page: the gear gate with its numbers (reverse in red)
    txt(c, 'GEARS', 275, 270, 54, '#2f5aa0', { font: COMIC });
    var gx = 120, gy = 360, gw = 310, gh = 420, S = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]];
    box(c, gx, gy, gw, gh, 20, '#e6e2d6', '#8a8a9a', 3);
    c.save(); c.lineCap = 'round'; c.strokeStyle = '#3a3a44'; c.lineWidth = 26; c.beginPath();
    for (var k = 0; k < 3; k++) { var x = gx + 60 + k * 95; c.moveTo(x, gy + 60); c.lineTo(x, gy + gh - 60); } c.moveTo(gx + 60, gy + gh / 2); c.lineTo(gx + 250, gy + gh / 2); c.stroke(); c.restore();
    cl.gears.forEach(function (gname, i) {
      var x = gx + 60 + S[i][0] * 95, y = S[i][1] ? gy + gh - 60 : gy + 60, isR = gname === 'R';
      circ(c, x, y, 40, isR ? '#d8312b' : '#fbfaf4', INK, 4); txt(c, gname, x, y + 2, 46, isR ? '#fff' : INK, { font: COMIC });
    });
    txt(c, 'N', gx + gw / 2 - 10, gy + gh / 2 + 44, 30, '#5a5a6a', { weight: 900 });
    lines(c, ['Slot the lever into', 'a gear. REVERSE is', 'the red one.'], 275, 850, 34, '#2a2a4a', { weight: 700 });
    lines(c, ['R is never where', 'you’d guess. — B'], 275, 1040, 32, '#c43a2b', { font: HAND, italic: true, weight: 700 });
    txt(c, '12', 275, 1180, 24, '#8a8a9a');
    // right page: the battery leads (Medium, Hard) and the fuel tap; Easy: a friendly page
    if (cl.wiring) {
      txt(c, 'BATTERY LEADS', 725, 270, 46, '#2f5aa0', { font: COMIC });
      if (X.diff === 'm') cl.wiring.forEach(function (d, i) { var y = 370 + i * 95; box(c, 540, y - 28, 64, 56, 10, COLHEX[d.color], INK, 3); txt(c, d.color, 690, y, 38, INK, { weight: 800 }); txt(c, '→ ' + d.term, 860, y, 40, '#c43a2b', { weight: 900 }); });
      else {
        // Hard: a picture only: lead colours on the left, terminals on the right, lines between them
        var terms = cl.wiring.map(function (d) { return d.term; }).slice().sort();
        cl.wiring.forEach(function (d, i) {
          var y1 = 360 + i * 95, y2 = 360 + terms.indexOf(d.term) * 95, hx = COLHEX[d.color] === '#f4f1e6' ? '#b8b4a8' : COLHEX[d.color];
          c.save(); c.strokeStyle = INK; c.lineWidth = 13; c.beginPath(); c.moveTo(575, y1); c.bezierCurveTo(680, y1, 700, y2, 790, y2); c.stroke(); c.strokeStyle = hx; c.lineWidth = 8; c.stroke(); c.restore();
          circ(c, 560, y1, 28, COLHEX[d.color], INK, 4);
        });
        terms.forEach(function (t, i) { var y = 360 + i * 95; box(c, 790, y - 32, 140, 64, 10, '#fbfaf4', INK, 3); txt(c, t, 860, y, t.length > 3 ? 30 : 40, INK, { weight: 900 }); });
      }
      var fy = 360 + cl.wiring.length * 95 + 50;
      box(c, 540, fy, 370, 230, 12, '#fff3c4', '#c4a24a', 3);
      lines(c, ['LOW ON FUEL?', 'Flip the fuel tap', 'under the dash', 'to RESERVE.'], 725, fy + 48, 34, '#5a3a10', { weight: 800 });
    } else {
      txt(c, 'WELCOME!', 725, 270, 46, '#2f5aa0', { font: COMIC });
      lines(c, ['Your Swallow is', 'a lady. Treat her', 'kindly. Keep the', 'handbrake on when', 'she’s parked.'], 725, 380, 36, '#2a2a4a', { weight: 700 });
      lines(c, ['Battery wiring:', 'see the sticker', 'on the battery.'], 725, 760, 36, '#c43a2b', { weight: 800 });
    }
    txt(c, '13', 725, 1180, 24, '#8a8a9a');
};
V.pseat=function(c,X){var e=X.ext,st=X.st,cl=X.R.clues.script;
    var s = L.sheet;
    c.save(); c.translate(s[0] + s[2] / 2, s[1] + s[3] / 2); c.rotate(-0.04);
    dropShadow(c, 20, 8, 0.5); box(c, -s[2] / 2, -s[3] / 2, s[2], s[3], 6, '#fbfaf4'); noShadow(c);
    box(c, -s[2] / 2, -s[3] / 2, s[2], 80, 6, '#c43a2b'); txt(c, 'CALL SHEET', 0, -s[3] / 2 + 42, 46, '#fff', { font: COMIC });
    var y0 = -s[3] / 2 + 120;
    lines(c, ['MAYHEM PICTURES', 'Scene 1: CRUNCH TIME'], 0, y0, 36, '#1d1d26', { weight: 900 });
    lines(c, ['STUNT: drive out of the', 'Squashinator. BACKWARDS!'], 0, y0 + 115, 35, '#1d1d26', { weight: 700 });
    lines(c, ['Starting the engine starts', 'the crusher. You get ' + cl.secs + ' s.'], 0, y0 + 230, 35, '#c43a2b', { weight: 900 });
    lines(c, ['CAST: Rookie (you),', 'Bernie (retired)'], 0, y0 + 345, 32, '#1d1d26', { weight: 700, italic: true });
    txt(c, 'Break a leg! — M.M.', 0, y0 + 455, 34, '#2a2a6a', { font: HAND, italic: true, weight: 700 });
    c.restore();
    if (X.diff === 'h') {
      if (!st.done.take_umbrella) { var u = L.umbS; c.save(); c.beginPath(); c.rect(e.x0, u[1], e.x1 - e.x0, 400); c.clip(); A1.item(c, 'umbrella', u[0] + u[2] / 2, u[1] + u[3] / 2 + 20, 300, false, X); c.restore(); box(c, e.x0, 1250, e.x1 - e.x0, 20, 0, 'rgba(0,0,0,.4)'); }
      if (!st.done.take_toykey) A1.item(c, 'toykey', L.toyS[0] + 115, L.toyS[1] + 60, 200, false, X);
    }
};
V.battery=function(c,X){var e=X.ext,st=X.st,pz=X.R.puzzles.wires,s=st.pz.wires;
    // Bernie's warning
    var bo = L.bolt; sticky(c, bo[0], bo[1], bo[2], bo[3], ['WRONG WIRES = BIG SPARKS!', 'Check twice. — B'], -0.02, 30);
    var y0 = L.wireY0, dy = L.wireDY, px = L.plugX, sx = L.sockX, n = pz.plugs.length;
    // terminals on the right
    pz.sockets.forEach(function (t, j) { var y = y0 + j * dy; box(c, sx - 40, y - 40, 80, 80, 16, chrome(c, sx - 40, y - 40, sx + 40, y + 40), INK, 3); circ(c, sx, y, 18, '#3a3f48'); txt(c, t, sx + 110, y, t.length > 3 ? 32 : 52, '#fff', { weight: 900 }); if (X.hit && !st.done.solve_wires) X.hit({ pz: 'wires', r: j }, [sx - 70, y - 55, 190, 110]); });
    // the leads from the left, plugged or hanging
    pz.plugs.forEach(function (col, k) {
      var y = y0 + k * dy, to = s.c[k], hex = COLHEX[col];
      c.save(); c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 26;
      c.beginPath(); c.moveTo(e.x0, y + 20); c.lineTo(px - 40, y);
      if (to >= 0) { var ty = y0 + to * dy; c.moveTo(px, y); c.bezierCurveTo(px + 260, y, sx - 260, ty, sx, ty); }
      c.stroke(); c.strokeStyle = hex; c.lineWidth = 18; c.stroke(); c.restore();
      var sel = s.sel === k;
      if (sel) { c.save(); c.shadowColor = '#ffd23f'; c.shadowBlur = 30; circ(c, px, y, 50, 'rgba(255,210,63,.6)'); c.restore(); }
      box(c, px - 56, y - 34, 112, 68, 16, hex, INK, 4); txt(c, { Red: 'RED', Black: 'BLK', Yellow: 'YEL', Green: 'GRN', Blue: 'BLU', White: 'WHT' }[col], px, y + 2, 32, col === 'White' || col === 'Yellow' ? INK : '#fff', { font: COMIC });
      if (X.hit && !st.done.solve_wires) X.hit({ pz: 'wires', l: k }, [px - 80, y - 55, 160, 110]);
    });
    if (st.done.solve_wires) txt(c, 'POWER!', 500, 300, 50, '#9be15d', { font: COMIC });
    // Easy: the wiring diagram is on the lid sticker
    if (X.diff === 'e') {
      var cl = X.R.clues.lid; box(c, 180, 1010, 640, 300, 16, '#fbfaf4', INK, 4); txt(c, 'WIRING', 500, 1050, 34, '#2f5aa0', { font: COMIC });
      cl.wiring.forEach(function (d, i) { var y = 1110 + i * 64; box(c, 240, y - 22, 60, 44, 8, COLHEX[d.color], INK, 2); txt(c, d.color, 400, y, 34, INK, { weight: 800 }); txt(c, '→  ' + d.term, 640, y, 40, '#c43a2b', { weight: 900 }); });
    }
};
V.pocket=function(c,X){var e=X.ext,st=X.st;
    if (X.diff === 'e') {
      paper(c, 160, 420, 260, 380, '#fbfaf4', -0.1); for (var i = 0; i < 7; i++) line(c, 190, 470 + i * 40, 380, 470 + i * 40, '#9a9aaa', 4);
      c.save(); c.translate(600, 640); c.rotate(0.5); box(c, -150, -12, 300, 24, 6, '#f2c230', INK, 3); c.restore();
      circ(c, 700, 900, 50, '#fbfaf4', '#d8312b', 10);
      return;
    }
    if (X.diff === 'm') {
      var cd = L.pCard; paper(c, cd[0], cd[1], cd[2], cd[3], '#fbfaf4', -0.05);
      c.save(); c.translate(cd[0] + cd[2] / 2, cd[1] + cd[3] / 2); c.rotate(-0.05);
      txt(c, 'MAYHEM RADIO', 0, -56, 32, '#c43a2b', { font: COMIC }); txt(c, GORoom1.fq(X.R.clues.card.freq) + ' FM', 0, 10, 58, '#1d1d26', { font: COMIC }); txt(c, 'Your station for danger', 0, 66, 22, '#555', { italic: true });
      c.restore();
      if (!st.done.take_umbrella) { var u = L.pUmb; c.save(); c.translate(u[0] + u[2] / 2, u[1] + u[3] / 2); c.rotate(-0.6); A1.item(c, 'umbrella', 0, 0, 520, false, X); c.restore(); }
      return;
    }
    // Hard: the torn card half, the road map, the parking ticket
    if (!st.done.take_cardB) A1.item(c, 'cardB', L.pCard[0] + L.pCard[2] / 2, L.pCard[1] + L.pCard[3] / 2, 300, false, X);
    var m = L.pMap; paper(c, m[0], m[1], m[2], m[3], '#e6d9a8', 0.06); c.save(); c.translate(m[0] + m[2] / 2, m[1] + m[3] / 2); c.rotate(0.06);
    line(c, -150, 60, 150, -60, '#9a8a5a', 6); line(c, -150, -40, 150, 40, '#9a8a5a', 6); txt(c, 'ROAD MAP', 0, 0, 40, '#5a4a1a', { font: COMIC }); c.restore();
    var tk = L.pTicket; paper(c, tk[0], tk[1], tk[2], tk[3], '#ff9a3c', -0.08); c.save(); c.translate(tk[0] + tk[2] / 2, tk[1] + tk[3] / 2); c.rotate(-0.08); txt(c, 'PARKING', 0, -30, 36, '#fff', { font: COMIC }); txt(c, 'TICKET', 0, 20, 36, '#fff', { font: COMIC }); c.restore();
};
V.visor=function(c,X){var e=X.ext,st=X.st,P=X.P;if(!st.f["f:visor"]){txt(c,"PULL",500,786,30,"#4a3828");return;}
 crop(c,"visor",[100,200,800,560],[80,180,840,760]);
    var n = L.bnote, cl = X.R.clues.bnote;
    c.save(); c.translate(n[0] + n[2] / 2, n[1] + n[3] / 2); c.rotate(-0.03);
    dropShadow(c, 12, 5, 0.35); box(c, -n[2] / 2, -n[3] / 2, n[2], n[3] + 40, 4, '#fff07a'); noShadow(c);
    for (var k = 0; k < 9; k++) line(c, -n[2] / 2 + 10, -n[3] / 2 + 40 + k * 44, n[2] / 2 - 10, -n[3] / 2 + 40 + k * 44, 'rgba(80,110,180,.35)', 2);
    cl.lines.forEach(function(l,i){var size=i===cl.lines.length-1?30:34;c.font='italic 700 '+size+'px Georgia';while(c.measureText(l).width>n[2]-26&&size>23){size--;c.font='italic 700 '+size+'px Georgia';}txt(c,l,0,-n[3]/2+28+i*54,size,'#1d2a6a',{font:HAND,italic:true,weight:700});});
    c.restore();
    if (X.diff === 'h') {
      if (!st.done.take_cardA) { c.save(); c.translate(L.cardA[0] + 125, L.cardA[1] + 75); A1.item(c, 'cardA', 0, 0, 240, false, X); c.restore(); }
      var s = L.sched; paper(c, s[0], s[1], s[2], s[3], '#e8f0ff', 0.05);
      txt(c, 'RADIO TONIGHT', s[0] + s[2] / 2, s[1] + 34, 26, '#1d2a6a', { weight: 900 }); for (var q = 0; q < 3; q++) line(c, s[0] + 30, s[1] + 76 + q * 32, s[0] + s[2] - 30, s[1] + 76 + q * 32, '#8a8aaa', 3);
    }
    box(c, 80, 600, 840, 44, 6, 'rgba(40,30,20,.55)');   // the elastic band
};
V.glove=function(c,X){var e=X.ext,st=X.st,ld=L.lid;
    if (st.f['f:gloveOpen']) {
      box(c, ld[0], ld[1], ld[2], ld[3], 30, '#1b1012', chrome(c, ld[0], ld[1], ld[0] + ld[2], ld[1] + ld[3]), 8);
      c.save(); c.globalAlpha = 0.25; for (var i = 0; i < 20; i++) line(c, ld[0] + i * 40, ld[1], ld[0] + i * 40 - 60, ld[1] + ld[3], '#5a2a30', 6); c.restore();
      // the lid hangs open below
      box(c, ld[0] + 20, ld[1] + ld[3] + 10, ld[2] - 40, 230, 20, A1.paint(c, 0, ld[1] + ld[3], 0, ld[1] + ld[3] + 230), INK, 4);
      crop(c,'pocket',[40,380,900,640],[ld[0]+10,ld[1]+10,ld[2]-20,ld[3]-20]);
      crop(c,'glove',[140,400,700,330],[ld[0]+20,ld[1]+ld[3]+10,ld[2]-40,230]);
      // the owner's manual
      var m = L.gManual; c.save(); c.translate(m[0] + m[2] / 2, m[1] + m[3] / 2); c.rotate(-0.05); dropShadow(c, 14, 6, 0.5); box(c, -m[2] / 2, -m[3] / 2, m[2], m[3], 8, '#2f5aa0', '#1a2f5a', 4); noShadow(c);
      txt(c, 'PEMBERTON', 0, -m[3] / 2 + 60, 34, '#f2c230', { font: SERIF, weight: 900 }); A1.swallow(c, 0, 0, 90, '#f2c230'); txt(c, 'Owner’s Manual', 0, m[3] / 2 - 50, 30, '#fff', { font: SERIF, italic: true }); c.restore();
      var gi = L.gItem, tk = X.diff === 'e' ? 'take_key' : 'take_fuse';
      if (!st.done[tk]) A1.item(c, X.diff === 'e' ? 'key' : 'fuse', gi[0] + gi[2] / 2, gi[1] + gi[3] / 2, 220, false, X);
      if (X.diff === 'h') { c.save(); c.translate(720, 700); c.rotate(0.4); circ(c, 0, 0, 60, '#a8261e', INK, 4); for (var z = 0; z < 4; z++) line(c, 40 + z * 14, 30 + (z % 2) * 20, 50 + z * 14, 50 - (z % 2) * 20, '#9aa3ad', 6); c.restore(); }
      return;
    }
    // the number lock
    var lk = L.lock, pz = X.R.puzzles.glove, s = st.pz.glove, n = pz.answer.length, ww = lk[2] / n;
    box(c, lk[0] - 20, lk[1] - 20, lk[2] + 40, lk[3] + 40, 20, chrome(c, lk[0], lk[1], lk[0] + lk[2], lk[1] + lk[3]), INK, 4);
    for (var w = 0; w < n; w++) {
      var wx = lk[0] + w * ww;
      box(c, wx + 6, lk[1] + 50, ww - 12, lk[3] - 100, 10, lin(c, 0, lk[1] + 50, 0, lk[1] + lk[3] - 50, [[0, '#1b1b1f'], [0.5, '#fbfaf4'], [1, '#1b1b1f']]), INK, 3);
      txt(c, String(s.d[w]), wx + ww / 2, lk[1] + lk[3] / 2 + 3, 76, INK, { font: COMIC });
      txt(c, '▲', wx + ww / 2, lk[1] + 24, 26, INK); txt(c, '▼', wx + ww / 2, lk[1] + lk[3] - 22, 26, INK);
      if (X.hit && !st.done.solve_glove) { X.hit({ pz: 'glove', i: w, dir: 1 }, [wx, lk[1] - 20, ww, lk[3] / 2 + 20]); X.hit({ pz: 'glove', i: w, dir: -1 }, [wx, lk[1] + lk[3] / 2, ww, lk[3] / 2 + 20]); }
    }
    if (X.diff === 'h') {
      // the slot in the lid: through it, a coiled spring and a boxing glove (snipped once the cutters have been at it)
      var sp = L.spring, safe = st.f['f:gloveSafe'];
      box(c, sp[0], sp[1], sp[2], sp[3], 14, '#0c0a0c', chrome(c, sp[0], sp[1], sp[0] + sp[2], sp[1] + sp[3]), 5);
      c.save(); rr(c, sp[0], sp[1], sp[2], sp[3], 14); c.clip();
      circ(c, sp[0] + 100, sp[1] + 60, 46, '#a8261e'); c.strokeStyle = '#9aa3ad'; c.lineWidth = 6; c.beginPath();
      for (var k = 0; k < 6; k++) { var yy = sp[1] + 100 + k * 9; c.moveTo(sp[0] + 20, yy); c.lineTo(sp[0] + (safe && k > 2 ? 40 : 90), yy + 6); } c.stroke();
      c.restore();
      if (safe) txt(c, 'SNIP!', sp[0] + sp[2] / 2, sp[1] + sp[3] + 30, 28, '#9be15d', { font: COMIC });
      txt(c, 'POW!', sp[0] + sp[2] / 2, sp[1] - 26, 26, '#ffd23f', { font: COMIC, stroke: ['#1b1b1b', 4] });
      var hd = L.gHandle; box(c, hd[0], hd[1], hd[2], hd[3], 30, chrome(c, hd[0], hd[1], hd[0] + hd[2], hd[1] + hd[3]), INK, 4); box(c, hd[0] + 30, hd[1] + 30, hd[2] - 60, hd[3] - 60, 16, '#3a3f48');
      txt(c, 'OPEN', hd[0] + hd[2] / 2, hd[1] + hd[3] + 34, 28, '#ffe7a8', { weight: 900 });
    }
};
V.console=function(c,X){var e=X.ext,st=X.st,pz=X.R.puzzles.gear,gs=st.pz.gear,S=L.gateSlots;
    // the lever's knob, in its slot
    var p = gs ? gs.p : 6, kp = S[p];
    dropShadow(c, 20, 10, 0.6); circ(c, kp[0], kp[1], 58, rad(c, kp[0] - 18, kp[1] - 22, 4, 64, [[0, '#fffaf0'], [1, '#cdbf9e']]), '#8a7a5a', 4); noShadow(c);
    circ(c, kp[0], kp[1], 64, null, chrome(c, kp[0] - 64, kp[1] - 64, kp[0] + 64, kp[1] + 64), 6);
    if (X.hit && !st.done.solve_gear) S.forEach(function (s, k) { X.hit({ pz: 'gear', p: k }, [s[0] - 75, s[1] - 75, 150, 150]); });
    // the clamp (Medium, Hard): a steel bar from the lever to a letter lock
    if (X.diff !== 'e') {
      var cz = X.R.puzzles.clamp, cs = st.pz.clamp, cb = L.clamp;
      if (!st.f['f:clampOff']) {
        box(c, kp[0] - 30, kp[1], 60, cb[1] - kp[1] + 20, 10, chrome(c, kp[0] - 30, 0, kp[0] + 30, 0), INK, 3);
        dropShadow(c, 20, 8, 0.5); box(c, cb[0], cb[1], cb[2], cb[3], 24, lin(c, 0, cb[1], 0, cb[1] + cb[3], [[0, '#8c96a5'], [1, '#4a5260']]), INK, 4); noShadow(c);
        var n = cz.answer.length, ww = (cb[2] - 40) / n;
        for (var w = 0; w < n; w++) {
          var wx = cb[0] + 20 + w * ww;
          box(c, wx + 6, cb[1] + 60, ww - 12, 130, 10, lin(c, 0, cb[1] + 60, 0, cb[1] + 190, [[0, '#2a2a30'], [0.5, '#fbfaf4'], [1, '#2a2a30']]), INK, 3);
          txt(c, cz.sets[w][cs.s[w]], wx + ww / 2, cb[1] + 128, 70, INK, { font: COMIC });
          txt(c, '▲', wx + ww / 2, cb[1] + 32, 26, '#ffe7a8'); txt(c, '▼', wx + ww / 2, cb[1] + 222, 26, '#ffe7a8');
          if (X.hit) { X.hit({ pz: 'clamp', i: w, dir: 1 }, [wx, cb[1], ww, cb[3] / 2]); X.hit({ pz: 'clamp', i: w, dir: -1 }, [wx, cb[1] + cb[3] / 2, ww, cb[3] / 2]); }
        }
      } else { c.save(); c.translate(520, 1260); c.rotate(0.2); box(c, -150, -40, 300, 80, 16, '#6a7280', INK, 3); txt(c, 'OPEN', 0, 0, 40, '#ffe7a8', { font: COMIC }); c.restore(); }
    }

var off=st.f['f:brakeOff'];label(c,off?'RELEASED':'HANDBRAKE ON',810,1200,26);
 if(X.diff!=='h'&&!off)sticky(c,700,1260,250,95,['KEEP ON','until engine starts'],0,23);

};
V.toolbox=function(c,X){var e=X.ext,st=X.st,pz=X.R.puzzles.toolbox,s=st.pz.toolbox;
    if (st.f['f:toolOpen']) {


      if (!st.done.take_cutters) A1.item(c, 'cutters', L.tbCut[0] + L.tbCut[2] / 2, L.tbCut[1] + L.tbCut[3] / 2, 300, false, X);
      if (!st.done.take_key) A1.item(c, 'key', L.tbKey[0] + L.tbKey[2] / 2, L.tbKey[1] + L.tbKey[3] / 2, 240, false, X);
      return;
    }
    txt(c, 'M.M. TOOLS', 500, 480, 44, '#ffe7a8', { font: COMIC });
    box(c, 170, 530, 660, 230, 20, '#3a3f48', INK, 4);
    L.tbTiles.forEach(function (p, i) {
      box(c, p[0] - 85, p[1] - 85, 170, 170, 16, '#e9e0b8', INK, 4);
      roadSign(c, pz.set[s.s[i]], p[0], p[1], 120);
      if (X.hit) X.hit({ pz: 'toolbox', i: i, dir: 1 }, [p[0] - 85, p[1] - 85, 170, 170]);
    });
    txt(c, 'tap a sign to change it', 500, 820, 30, '#ffe7a8', { italic: true });
};
V.map=function(c,X){
    var e = X.ext, cl = X.R.clues.map; 
    box(c, 60, 200, 880, 1040, 10, '#e9e0b8', '#8a7a4a', 4);
    c.save(); c.globalAlpha = 0.3; line(c, 360, 200, 360, 1240, '#8a7a4a', 3); line(c, 640, 200, 640, 1240, '#8a7a4a', 3); line(c, 60, 720, 940, 720, '#8a7a4a', 3); c.restore();
    txt(c, 'MORTIMER’S DRIVE TO THE STUDIO', 500, 250, 34, '#5a4a1a', { font: COMIC });
    // roads
    c.save(); c.strokeStyle = '#b8b0a0'; c.lineWidth = 34; c.lineCap = 'round'; c.beginPath(); c.moveTo(120, 1150); c.bezierCurveTo(300, 900, 200, 700, 480, 620); c.bezierCurveTo(700, 560, 820, 420, 880, 320); c.moveTo(120, 420); c.lineTo(860, 1100); c.stroke(); c.restore();
    // the route, dotted red, with HOME and STUDIO
    c.save(); c.strokeStyle = '#d8312b'; c.lineWidth = 8; c.setLineDash([20, 16]); c.beginPath(); c.moveTo(120, 1150); c.bezierCurveTo(300, 900, 200, 700, 480, 620); c.bezierCurveTo(700, 560, 820, 420, 880, 320); c.stroke(); c.restore();
    txt(c, 'HOME', 150, 1200, 32, '#1d1d26', { weight: 900 }); txt(c, 'STUDIO', 860, 290, 32, '#1d1d26', { weight: 900 });
    var on = [[230, 960], [430, 640], [760, 470]], off = [[230, 500], [560, 820], [760, 1010]];
    cl.route.forEach(function (k, i) { var p = on[i]; roadSign(c, k, p[0], p[1], 120); circ(c, p[0] + 70, p[1] - 60, 30, '#d8312b', '#fff', 4); txt(c, String(i + 1), p[0] + 70, p[1] - 58, 36, '#fff', { font: COMIC }); });
    cl.other.forEach(function (k, i) { var p = off[i]; roadSign(c, k, p[0], p[1], 100); });
};
V.ticket=function(c,X){
    var e = X.ext, cl = X.R.clues.ticket; 
    paper(c, 140, 240, 720, 900, '#ffb06a', -0.02);
    txt(c, 'RUSTBUCKET CITY', 500, 340, 48, '#fff', { font: COMIC });
    txt(c, 'PARKING VIOLATION', 500, 410, 40, '#5a2a0a', { weight: 900 });
    txt(c, 'FINE No.', 500, 560, 44, '#5a2a0a', { weight: 900 }); txt(c, cl.digits.join(''), 500, 650, 96, '#1d1d26', { font: COMIC });
    lines(c, ['Parked inside a car crusher.', 'Very silly. Pay $25.'], 500, 820, 38, '#5a2a0a', { weight: 700, italic: true });
};
V.sched=function(c,X){
    var e = X.ext, cl = X.R.clues.sched; 
    paper(c, 120, 260, 760, 760, '#e8f0ff', -0.02);
    txt(c, 'RADIO TONIGHT', 500, 360, 58, '#1d2a6a', { font: COMIC });
    var shows = ['Polka Party', 'Smooth Moves', 'The Farm Report'];
    cl.freqs.forEach(function (f, i) { txt(c, GORoom1.fq(f) + ' FM', 300, 520 + i * 150, 54, '#c43a2b', { weight: 900 }); txt(c, shows[i], 640, 520 + i * 150, 42, '#1d2a6a', { weight: 700, italic: true }); });
};
V.radio=function(c,X){var e=X.ext,st=X.st,pz=X.R.puzzles.radio,on=X.diff==='e'||(st.f['f:fuse']&&st.f['f:battery']);
    // the scale: the printed numbers and the stations
    var sx = 200, sw = 600, sy = 420;
    if(!on){c.save();c.fillStyle='rgba(0,0,0,.35)';c.fillRect(200,425,600,160);c.restore();}
    for (var m = 88; m <= 108; m += 2) { var x0 = sx + (m - 88) / 20 * sw; line(c, x0, sy + 10, x0, sy + 40, INK, 3); if (m % 4 === 0) txt(c, String(m), x0, sy + 64, 28, INK, { weight: 800 }); }
    var freqs = pz ? pz.freqs : null, v = pz ? st.pz.radio.v : 4;
    if (freqs) freqs.forEach(function (fq, i) { var x1 = sx + (fq / 10 - 88) / 20 * sw; line(c, x1, sy + 100, x1, sy + 126, '#7a4a2a', 5); });
    var cur = freqs ? freqs[v] / 10 : 97.1, nx = sx + (cur - 88) / 20 * sw;
    line(c, nx, sy + 6, nx, sy + 164, '#d8312b', 7);
    // the station readout
    box(c, 360, 610, 280, 96, 14, '#0c0a0c', '#6f7884', 4);
    txt(c, pz ? GORoom1.fq(freqs[v]) : 'MAYHEM FM', 500, 660, pz ? 64 : 40, on ? '#ffb347' : '#3a3434', { font: SANS, weight: 900 });

 [[L.rLeft,-1,'◀ TUNE'],[L.rRight,1,'TUNE ▶']].forEach(function(k){var r=k[0];label(c,k[2],r[0]+r[2]/2,r[1]+r[3]+16,28);if(pz&&X.hit)X.hit({pz:'radio',dir:k[1]},r);});
    if (X.diff === 'e') { txt(c, '♪ ♫ ♪', 500, 1080, 70, '#ffe7a8', { weight: 900 }); txt(c, 'Mortimer’s theme tune, played badly', 500, 1170, 32, '#ffe7a8', { italic: true }); return; }
    if (st.done.solve_radio) {
      var mb = L.msgBox, msg = X.R.clues.msg;
      dropShadow(c, 20, 8, 0.5); box(c, mb[0], mb[1], mb[2], mb[3], 30, '#fbfaf4', INK, 5); noShadow(c);
      c.fillStyle = '#fbfaf4'; c.beginPath(); c.moveTo(470, mb[1]); c.lineTo(500, mb[1] - 50); c.lineTo(540, mb[1]); c.fill();
      txt(c, 'MAYHEM RADIO:', 500, mb[1] + 46, 34, '#c43a2b', { font: COMIC });
      if (msg.spell) { txt(c, '“The clamp word? First letters only!”', 500, mb[1] + 104, 32, INK, { weight: 700, italic: true }); lines(c, [msg.spell.slice(0, 3).join(', ') + ',', msg.spell.slice(3).join(', ') + '.'], 500, mb[1] + 170, 42, '#1d2a6a', { weight: 900 }); }
      else { txt(c, '“Psst, Rookie! The gear clamp opens', 500, mb[1] + 110, 34, INK, { weight: 700, italic: true }); txt(c, 'with today’s secret word:”', 500, mb[1] + 160, 34, INK, { weight: 700, italic: true }); txt(c, msg.word.split('').join(' - '), 500, mb[1] + 245, 70, '#1d2a6a', { font: COMIC }); }
    }
};
V.wheel=function(c,X){var e=X.ext,st=X.st,hc=L.hornC;label(c,"OFF",656,930,23);label(c,"ON",790,888,23);label(c,"START",868,1055,23);txt(c,"HORN",500,610,38,"#795b35",{font:SERIF});if(st.f["f:engine"]){A1.item(c,"key",760,1030,180,false,X);circ(c,650,1130,14,"#75e390");}
    if (X.diff !== 'h') sticky(c, 600, 300, 230, 170, ['DON’T', 'HONK!', '— Bernie'], 0.1, 38);
    else {
      // a red wire from behind the horn, out through the windshield, with Mortimer's tag
      c.save(); c.strokeStyle = '#d8312b'; c.lineWidth = 12; c.beginPath(); c.moveTo(hc[0] + 150, hc[1] - 120); c.bezierCurveTo(780, 260, 820, 160, 930, e.y0 - 10); c.stroke(); c.restore();
      paper(c, 660, 150, 300, 120, '#fbfaf4', 0.12);
      c.save(); c.translate(810, 210); c.rotate(0.12); txt(c, 'HORN →', 0, -24, 32, '#c43a2b', { font: COMIC }); txt(c, 'SQUASHINATOR', 0, 22, 32, '#c43a2b', { font: COMIC }); c.restore();
    }
};
V.dash=function(c,X){var e=X.ext;dryText(c,original.dash,X,function(t){return t.s!=='Seriously.'&&t.s!=='— B';});if(X.diff==='e')sticky(c,210,1080,190,105,['Seriously.','— B'],-.1,28);
};
V.foot=function(c,X){var st=X.st,e=X.ext;txt(c,'FUSES',390,276,36,'#382519');['LAMPS','WIPER','HORN'].forEach(function(s,i){txt(c,s,205+i*130,309,24,'#382519');});txt(c,'HEATER',335,540,23,'#382519');txt(c,'RADIO',465,540,23,'#382519');
box(c,520,498,172,55,6,'#9c271b','#e5c887',2);txt(c,'SQUASHINATOR',606,525,17,'#fff5db');
txt(c,'FUEL TAP',825,400,29,'#382519');txt(c,'MAIN',762,452,22,'#382519');txt(c,'RESERVE',871,452,22,'#382519');
if(X.diff==='e'){A1.item(c,'fuse',465,635,120,false,X);A1.item(c,'fuse',595,635,120,false,X);}
if(st.f['f:fuse']){A1.item(c,'fuse',465,635,120,false,X);label(c,'RADIO READY',390,855,26);}
if(st.f['f:reserve']){box(c,732,686,210,65,10,'#183e2d','#95c8a7',2);txt(c,'RESERVE ON',837,719,25,'#e5ffe9');}
if(X.diff==='m')sticky(c,495,765,220,100,['← NOPE!','— B'],.06,28);

};
V.bseat=function(c,X){var e=X.ext,up=X.st.f['f:cushion'];if(up){label(c,'BATTERY',500,800,34);}else{crop(c,'back',[55,425,890,475],[80,160,840,750]);box(c,440,888,120,65,10,'#8c2f22','#d8b99a',2);label(c,'LIFT',500,922,27);}
};
V.bfloor=function(c,X){var e=X.ext,st=X.st;crop(c,'pocket',[0,400,1000,1000],[0,300,1000,1100]);crop(c,'back',[80,445,840,260],[0,120,1000,260]);label(c,'too far to reach',500,520,30);
if(X.diff==='m'&&!st.done.use_umbrella)A1.item(c,'key',570,880,200,false,X);
if(X.diff==='h'&&!st.f['f:toolbox'])crop(c,'toolbox',[90,410,820,670],[380,680,330,230]);
};

var bg={map:'pocket',ticket:'pocket',sched:'pocket',bfloor:'pocket',bseat:'bseat-open'};
Object.keys(V).forEach(function(k){A1.CLOSE[k]=function(c,X){var key=bg[k]||k;if(k==='toolbox'&&X.st.f['f:toolOpen'])key='toolbox-open';
var needs=[key];if(k==='glove')needs.push('pocket');if(['manual','pseat','visor','pocket','map','ticket','sched','battery'].indexOf(k)>=0)needs.push('manual');if(k==='bseat'||k==='bfloor')needs.push('back');if(k==='bfloor')needs.push('toolbox');
needs.forEach(request);if(needs.some(function(n){return !art[n];}))return original[k](c,X);photo(c,key,X.ext);V[k](c,X);};});
var walls=A1.V;
['front','pass','back','door'].forEach(function(k){var old=walls[k];walls[k]=function(c,X){request(k);if(!art[k])return old(c,X);photo(c,k,X.ext);var f=X.st.f,st=X.st;
if(k==='front'){
 if(X.diff!=='h')sticky(c,270,870,120,70,['DON’T','HONK!'],-.12,24);
 else{c.save();c.strokeStyle='#c83d28';c.lineWidth=5;c.beginPath();c.moveTo(380,890);c.bezierCurveTo(460,860,480,700,560,560);c.stroke();c.restore();}
 if(f['f:visor']){box(c,110,24,330,190,16,'#d9c59b','#9d8259',3);sticky(c,155,65,205,112,['Bernie’s','note'],0,23);}
 if(X.diff!=='e'&&!f['f:clampOff'])box(c,650,1060,100,40,6,chrome(c,650,1060,750,1100),'#302929',3);
 if(f['f:engine']){A1.item(c,'key',485,800,58,false,X);label(c,'ENGINE RUNNING',670,810,22);}
 if(f['f:brakeOff'])label(c,'BRAKE OFF',810,1230,22);
 if(X.diff==='h'&&f['f:clutch'])label(c,'IN',217,1225,22);
}
if(k==='pass'){
 if(f['f:gloveOpen']){box(c,95,475,370,180,12,'#1a0e0c','#ae9980',5);box(c,125,505,145,100,4,'#254876','#927650',2);label(c,'MANUAL',198,555,22);}
 if(X.diff==='h'&&!st.done.take_toykey)A1.item(c,'toykey',470,1060,105,false,X);
 if(X.diff==='h'&&!st.done.take_umbrella){c.save();c.translate(810,1180);c.rotate(1.1);A1.item(c,'umbrella',0,0,165,false,X);c.restore();}
}
if(k==='back'){
 if(f['f:cushion']){request('bseat-open');if(art['bseat-open'])crop(c,'bseat-open',[100,400,800,610],[110,575,780,325]);}
 if(X.diff==='h'&&!f['f:toolbox']){request('toolbox');if(art.toolbox)crop(c,'toolbox',[90,410,820,670],[600,1060,140,100]);}
 if(X.diff==='h'&&f['f:toolbox']){request('toolbox');if(art.toolbox)crop(c,'toolbox',[90,410,820,670],[560,520,280,170]);}
 if(X.diff==='m'&&!st.done.use_umbrella)A1.item(c,'key',655,1110,45,false,X);
}
// Keep the advancing trap visible in the four photographic wall views.
if(X.hz!=null){var w=75*Math.max(0,X.hz);c.save();c.fillStyle='rgba(25,28,32,.88)';c.fillRect(0,170,w,365);c.fillRect(1000-w,170,w,365);c.restore();}
};});
request('front');
window.CrunchArt={ready:function(){return names.filter(function(k){return !!art[k];});},loadAll:function(){names.forEach(request);}};
})();
