/* Double Take cruise pilot. Presentation only; never consumes the level RNG.
 * All coordinates stay in the original 900 x 600 scene and object ink boxes.
 * No object, variant, difference, hit region or storage schema is replaced.
 */
var CruiseArt = (function () {
  'use strict';
  var image = new Image(), ready = false, requested = false;
  image.onload = function () { ready = true; window.dispatchEvent(new Event('cruiseartready')); };
  // The original procedural backdrop remains available if this file is missing.
  var C, TAU = Math.PI * 2;
  function mix(a, b, t) { return SceneArt.mix(a, b, t); }
  function grad(x0, y0, x1, y1, colors) {
    var g = C.createLinearGradient(x0, y0, x1, y1);
    colors.forEach(function (c, i) { g.addColorStop(i / (colors.length - 1), c); }); return g;
  }
  function path(p) { C.beginPath(); C.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) C.lineTo(p[i], p[i + 1]); }
  function line(p, c, w) { path(p); C.strokeStyle = c; C.lineWidth = w; C.lineJoin = 'round'; C.lineCap = 'round'; C.stroke(); }
  function poly(p, c) { path(p); C.closePath(); C.fillStyle = c; C.fill(); }
  function rect(x, y, w, h, c) { C.fillStyle = c; C.fillRect(x, y, w, h); }
  function ellipse(x, y, rx, ry, c) { C.beginPath(); C.ellipse(x, y, rx, ry, 0, 0, TAU); C.fillStyle = c; C.fill(); }
  function cloth(p, c, pat, bounds) {
    path(p); C.closePath(); C.save(); C.clip();
    var x = bounds[0], y = bounds[1], w = bounds[2], h = bounds[3];
    rect(x, y, w, h, grad(x, y, x + w, y + h, [mix(c, '#fffbe9', .23), c, mix(c, '#14222c', .32)]));
    if (pat === 1) for (var i = x; i < x + w; i += 13) rect(i, y, 6, h, '#fffdf5');
    if (pat === 2) for (var j = y + 5; j < y + h; j += 12) for (var k = x + 4; k < x + w; k += 12) ellipse(k, j, 3.4, 3.4, '#fffdf5');
    // Fine weave is static and restrained: it does not create new differences.
    for (var yy = y; yy < y + h; yy += 2.4) line([x, yy, x + w, yy], 'rgba(255,255,255,.09)', .45);
    for (var xx = x; xx < x + w; xx += 3) line([xx, y, xx, y + h], 'rgba(25,30,30,.07)', .4);
    C.restore(); path(p); C.closePath(); C.strokeStyle = mix(c, '#16212a', .4); C.lineWidth = .85; C.stroke();
  }
  function wood(p, width) {
    line(p, '#6a4b2f', width); line(p.map(function (v, i) { return i % 2 ? v - .8 : v; }), '#b8986b', Math.max(1, width - 2));
    line(p.map(function (v, i) { return i % 2 ? v - 1.6 : v; }), '#d9c099', .8);
  }
  function metal(p, width) {
    line(p, '#687d87', width); line(p, '#d9e3e6', width * .65); line(p, '#fffdf2', Math.max(.6, width * .18));
  }
  function deckchair(o) {
    // Same asymmetric footprint and sling area as the original folding chair.
    wood([-36, 0, 8, -46], 5); wood([30, 0, -2, -40], 5);
    wood([-11, -5, -35, -81], 5); wood([6, -10, -20, -77], 4);
    cloth([-39,-78,-23,-81,-3,-44,6,-37,35,-52,42,-39,7,-22,-8,-28], o.col, o.pat, [-42,-83,86,65]);
    line([-29,-74,-11,-38,1,-32,33,-44], 'rgba(255,250,226,.65)', 1.1);
    wood([-24,-42,28,-36], 4); wood([31,0,37,-49], 4);
    ellipse(-7, -33, 1.8, 1.8, '#576064'); ellipse(27, -36, 1.6, 1.6, '#576064');
  }
  function lounger(o) {
    [-58,-10,52].forEach(function (x) { metal([x,-24,x+2,0], 4); });
    poly([-69,-31,62,-31,71,-25,-61,-25], '#76878b');
    poly([-60,-25,71,-25,71,-21,-59,-21], '#dce3e1');
    cloth([-58,-60,-45,-64,-21,-47,68,-47,71,-37,-27,-37,-45,-45], o.col, o.pat, [-62,-68,137,36]);
    poly([-27,-37,71,-37,70,-32,-26,-32], mix(o.col, '#283d48', .28));
    line([-58,-59,-27,-39,68,-39], 'rgba(255,255,245,.65)', 1.2);
    metal([-65,-65,-48,-36,70,-31], 3);
    line([-37,-52,-49,-58], 'rgba(255,255,255,.38)', 1);
    for (var i = -16; i < 62; i += 18) line([i,-45,i+2,-38], 'rgba(20,30,30,.13)', .8);
  }
  function parasol(o) {
    ellipse(0, -4, 22, 5, grad(-22, -4, 22, -4, ['#929d9d','#f6f3df','#b5b8af']));
    metal([0,-130,0,-6], 4);
    // Six curved fabric panels, with the same solid / alternate-panel variants.
    for (var i = 0; i < 6; i++) {
      var x = -70 + i * 140 / 6, end = x + 140 / 6;
      C.beginPath(); C.moveTo(0,-150); C.quadraticCurveTo(x*.82,-142,x,-104);
      C.quadraticCurveTo((x+end)/2,-95,end,-104); C.quadraticCurveTo(end*.82,-142,0,-150);
      var c = o.pat && i % 2 ? '#f5edda' : o.col;
      C.fillStyle = grad(x,-150,end,-100,[mix(c,'#fffbe3',.28),c,mix(c,'#283b40',.22)]); C.fill();
      C.strokeStyle = mix(c,'#344344',.2); C.lineWidth=.65; C.stroke();
      line([0,-149,x,-104], 'rgba(255,255,240,.3)', .7);
    }
    ellipse(0,-153,3.5,3.5,'#c3b38e');
  }
  function palm(o) {
    wood([0,-43,-2,-96], 5);
    var fronds=[[-42,-119],[-38,-143],[-15,-146],[18,-139],[44,-115],[37,-94],[-35,-92]];
    fronds.forEach(function (p,i) {
      var sx=-2,sy=-96,ex=p[0],ey=p[1],mx=(sx+ex)/2,my=Math.min(sy,ey)-12;
      C.beginPath(); C.moveTo(sx,sy); C.quadraticCurveTo(mx,my,ex,ey);
      C.strokeStyle=i%2?'#3d6b3d':'#5a803d'; C.lineWidth=1.8; C.stroke();
      for(var k=1;k<11;k++) {
        var t=k/11, x=(1-t)*(1-t)*sx+2*(1-t)*t*mx+t*t*ex, y=(1-t)*(1-t)*sy+2*(1-t)*t*my+t*t*ey;
        var len=9*Math.sin(t*Math.PI)+1, c=i%2?'#547e43':'#73954e';
        line([x,y,x-3,y+len],c,1.6); line([x,y,x+4,y+len*.75],mix(c,'#21472d',.25),1.5);
      }
    });
    poly([-30,-44,30,-44,22,0,-22,0], grad(-30,0,30,0,[mix(o.col,'#fff8e8',.27),o.col,mix(o.col,'#263334',.35)]));
    for(var x=-24;x<26;x+=3) line([x,-42,x*.74,-2],'rgba(255,255,255,.1)',.6);
    ellipse(0,-47,32,4.4,mix(o.col,'#fffbe8',.24)); ellipse(0,-48,26,2.4,'#4b4735');
  }
  function bucket(o) {
    if(o.det) {
      rect(-7,-82,14,34,grad(-7,0,7,0,['#20533e','#6a9260','#173f32']));
      rect(-3,-92,6,14,'#496d46'); rect(-4,-94,8,5,'#ceb277');
      rect(-7,-72,14,10,'#e9e0c4'); line([-4,-70,4,-70],'#837b61',.7);
    }
    poly([-26,-54,26,-54,20,0,-20,0],grad(-26,0,26,0,[mix(o.col,'#21333e',.3),mix(o.col,'#fff9e6',.45),o.col,mix(o.col,'#142832',.4)]));
    ellipse(0,-54,26,5,mix(o.col,'#eef5f4',.5)); ellipse(0,-54,22,3,'#667e83');
    [[-12,-56],[7,-55],[-1,-51]].forEach(function(p){poly([p[0]-5,p[1]-3,p[0]+2,p[1]-6,p[0]+7,p[1],p[0]+1,p[1]+4],grad(0,p[1]-6,0,p[1]+4,['#e2f4ee','#accbd1']));});
    line([-23,-42,-26,-40,-23,-28,-19,-27],'#b9c5c5',2);
    line([23,-42,26,-40,23,-28,19,-27],'#8fa3a9',2);
    line([-17,-47,-14,-5],'rgba(255,255,255,.35)',1);
    line([-19,-1,19,-1],'#82999e',1);
  }
  function table(o) {
    ellipse(0,-2,26,5,grad(-26,0,26,0,['#7c959e','#e1e8e6','#92a8ad']));
    metal([0,-49,0,-5],6);
    ellipse(0,-52,52,8,mix(o.col,'#294453',.32));
    ellipse(0,-55,52,6,grad(-52,-61,52,-50,[mix(o.col,'#fffce9',.5),o.col,mix(o.col,'#52727b',.2)]));
    for(var i=0;i<o.n;i++) {
      var x=-36+i*34,dc=['#efae45','#db6a81','#62b5cb'][i];
      poly([x-13,-88,x+13,-88,x+2,-70,x-2,-70],'rgba(226,244,241,.7)');
      poly([x-10,-84,x+10,-84,x+2,-72,x-2,-72],grad(x-10,-84,x+10,-71,[mix(dc,'#ffe7c3',.3),dc,mix(dc,'#69323b',.2)]));
      line([x-12,-88,x-2,-70,x,-57],'rgba(245,255,246,.9)',1.1);
      line([x+12,-88,x+2,-70,x,-57],'rgba(75,121,135,.55)',.75);
      ellipse(x,-57,8,2,'rgba(234,248,243,.78)');
      line([x+4,-86,x+9,-100],'#8d7555',1);
      poly([x+2,-96,x+9,-100,x+20,-96],i%2?'#e2c473':'#d58899');
      ellipse(x-9,-88,3.8,3.8,'#8ba955'); ellipse(x-9,-88,2.8,2.8,'#dbdb8c');
    }
  }
  function lifeboat(o) {
    rect(-74,-14,8,14,'#8b9b9f'); rect(66,-14,8,14,'#8b9b9f');
    poly([-95,-40,95,-40,81,-21,60,-12,-70,-12,-85,-20],grad(0,-40,0,-12,[mix(o.col,'#ffeaca',.4),o.col,mix(o.col,'#503727',.3)]));
    poly([-82,-40,-71,-62,-39,-79,37,-79,69,-64,84,-40],grad(-60,-80,60,-40,['#fffcf0','#e6e5d9','#afb9b5']));
    line([-38,-76,-47,-43],'#a9b6b6',.8); line([36,-76,43,-43],'#a9b6b6',.8);
    for(var i=0;i<o.n;i++) {
      var x=-62+i*30;
      poly([x-9,-63,x+9,-63,x+9,-49,x-9,-49],'#7f9ba4');
      rect(x-7,-61,14,10,grad(x,-61,x,-51,['#24485b','#729ba8']));
      line([x-5,-60,x+5,-60],'#b0c9c8',.7);
    }
    line([-94,-42,94,-42],'#575d58',3);
    line([-90,-39,90,-39],mix(o.col,'#fff5ce',.3),1);
    line([-60,-24,60,-24],'rgba(255,243,210,.4)',1);
  }
  function gull(o,standing) {
    if(!standing) {
      var up=o.v?-6:0;
      C.beginPath();C.moveTo(-36,-18+up);C.quadraticCurveTo(-20,-34+up,-4,-16);C.quadraticCurveTo(0,-12,4,-16);C.quadraticCurveTo(20,-34+up,36,-18+up);
      C.quadraticCurveTo(18,-24+up,4,-8);C.quadraticCurveTo(0,-4,-4,-8);C.quadraticCurveTo(-18,-24+up,-36,-18+up);C.closePath();
      C.fillStyle=grad(0,-33,0,-5,['#edf0e9','#c4cfd2','#f5f5e9']);C.fill();
      C.strokeStyle='#526b79';C.lineWidth=1.4;C.stroke();
      line([-36,-18+up,-29,-23+up],'#4c606b',2.3);line([36,-18+up,29,-23+up],'#4c606b',2.3);
      ellipse(0,-11,3,6,'#f1f3e8');poly([0,-6,2,-4,0,-3],'#beaa6c');return;
    }
    line([-4,0,-2,-12],'#b59850',1.7);line([5,0,4,-12],'#b59850',1.7);
    line([-6,0,-2,0],'#967b3d',1);line([3,0,7,0],'#967b3d',1);
    C.beginPath();C.moveTo(-22,-24);C.quadraticCurveTo(-7,-9,10,-14);C.quadraticCurveTo(18,-19,15,-31);C.lineTo(12,-42);C.lineTo(6,-42);C.quadraticCurveTo(3,-29,-22,-24);
    C.fillStyle=grad(-20,-35,12,-12,['#f5f6ec','#dce4e0','#aebcc0']);C.fill();
    C.strokeStyle='#72848a';C.lineWidth=1;C.stroke();
    poly([-21,-24,8,-27,0,-18,-14,-18],grad(-20,-27,4,-16,['#b5c3ca','#6c8796']));
    line([-19,-23,0,-21],'#d2dce0',.8);
    ellipse(11,-39,8,8,'#f2f4ea');poly([18,-41,29,-38,18,-36],'#c6a44e');
    ellipse(13,-41,1.4,1.4,'#222e35');
  }
  function cloud(o) {
    var variants=[[[-40,-18,22],[-14,-32,28],[18,-28,26],[42,-16,20]],[[-44,-16,18],[-20,-30,24],[8,-38,26],[36,-24,22]],[[-36,-20,24],[-6,-34,26],[28,-22,24]]];
    variants[o.v%3].forEach(function(p,i){
      var g=C.createRadialGradient(p[0]-4,p[1]-5,2,p[0],p[1],p[2]);
      g.addColorStop(0,'rgba(255,253,246,.95)');g.addColorStop(.65,'rgba(242,247,244,.8)');g.addColorStop(1,'rgba(224,235,237,0)');
      ellipse(p[0],p[1],p[2],p[2],g);
    });
  }
  function sun(o) {
    // Keep all three expression differences: a metallic sun-shaped balloon,
    // rather than deleting a detail that an existing saved level may require.
    var c=o.col;
    for(var i=0;i<12;i++) { C.save();C.translate(0,-48);C.rotate(i*TAU/12);poly([-6,-30,6,-30,0,-47],grad(-6,-45,6,-30,[mix(c,'#fff8df',.65),c,mix(c,'#715229',.25)]));C.restore(); }
    ellipse(0,-48,33,33,grad(-25,-74,26,-23,[mix(c,'#fff9e3',.7),c,mix(c,'#8e6029',.3)]));
    C.beginPath();C.ellipse(0,-48,30.5,30.5,0,0,TAU);C.strokeStyle='rgba(126,83,22,.22)';C.lineWidth=.8;C.stroke();
    ellipse(-14,-65,9,3,'rgba(255,255,244,.5)');
    if(o.mood===2) {
      [-1,1].forEach(function(k){ellipse(k*9.36,-51.64,5.46,5.46,'#fffdf1');C.strokeStyle='#825522';C.lineWidth=1.3;C.stroke();ellipse(k*9.36,-51.12,2.6,2.6,'#825522');});
    } else {
      if(o.mood===1) {C.beginPath();C.arc(-9.36,-52.68,3.64,Math.PI*.15,Math.PI*.85);C.strokeStyle='#825522';C.lineWidth=2.1;C.stroke();}
      else ellipse(-9.36,-51.12,3.38,3.38,'#825522');
      ellipse(9.36,-51.12,3.38,3.38,'#825522');
    }
    C.beginPath();
    if(o.mood===2) {C.ellipse(0,-37.8,6.7,8.6,0,0,TAU);C.fillStyle='#633326';C.fill();ellipse(0,-34.7,3.2,2.1,'#c87365');}
    else {C.arc(0,-44,9.4,Math.PI*.15,Math.PI*.85);C.strokeStyle='#825522';C.lineWidth=2.8;C.lineCap='round';C.stroke();if(o.mood===1){ellipse(1,-31,6.2,7.7,'#c87365');line([1,-33,1,-28],'#884e3e',1);}}
  }
  function pool(sc) {
    var left=sc.bgv===1,x0=left?34:606,x1=left?294:866,y0=452,y1=572;
    function shape(g) { path([x0+30+g,y0-g,x1-30-g,y0-g,x1+g,y1+g,x0-g,y1+g]); C.closePath(); }
    shape(12); C.fillStyle=grad(x0,y0,x1,y1,['#faf8ec','#d4d6cd']); C.fill();
    C.strokeStyle='rgba(77,63,41,.32)'; C.lineWidth=1.2; C.stroke();
    // Grout joints confined to the coping, never across the water.
    C.save(); shape(12); C.clip();
    for(var i=1;i<14;i++)line([x0-12+(x1-x0+24)*i/14,y1+12,x0+18+(x1-x0-36)*i/14,y0-12],'#b8c2bb',.7);
    C.restore(); shape(0); C.fillStyle=grad(0,y0,0,y1,['#157e9e','#27b3c2','#7bd3d5']); C.fill();
    C.save(); shape(0); C.clip();
    C.globalAlpha=.22; C.drawImage(image,100,420,1100,140,x0,y0,x1-x0,120); C.globalAlpha=1;
    rect(x0,y0,x1-x0,11,'rgba(7,53,68,.35)');
    // Deterministic caustic mesh; no animated water to distract from differences.
    var r=SceneArt.rng(829+sc.pal*7+sc.bgv),rows=[];
    for(var row=0;row<9;row++) {
      var points=[];
      for(var col=0;col<17;col++) points.push([x0-15+col*20+r()*13,y0-12+row*19+r()*11]);
      rows.push(points);
    }
    rows.forEach(function(points,row){points.forEach(function(p,col){
      var q=points[Math.min(16,col+1)],s=rows[Math.min(8,row+1)][col];
      C.beginPath();C.moveTo(p[0],p[1]);C.quadraticCurveTo((p[0]+q[0])/2,p[1]+4,q[0],q[1]);
      C.strokeStyle='rgba(220,255,235,.24)';C.lineWidth=.9;C.stroke();
      C.beginPath();C.moveTo(p[0],p[1]);C.quadraticCurveTo(p[0]+4,(p[1]+s[1])/2,s[0],s[1]);
      C.strokeStyle='rgba(219,255,242,.19)';C.lineWidth=.8;C.stroke();
    });});
    for(var j=0;j<44;j++) {var x=x0+r()*(x1-x0),y=y0+r()*120;line([x,y,x+5+r()*16,y-.7],'rgba(242,255,245,.38)',.6);}
    C.restore(); shape(0); C.strokeStyle='#a5e2de'; C.lineWidth=1.4; C.stroke();
    var lx=left?x1-46:x0+46;
    [lx-12,lx+12].forEach(function(x){metal([x,y0+26,x,y0-14,x+3,y0-21,x+7,y0-20],3.5);});
    [8,22].forEach(function(y){metal([lx-12,y0+y,lx+12,y0+y],2.6);});
  }
  function background(ctx,p,sc) {
    if(!ready) { if(!requested){requested=true;image.src='assets/cruise-deck.webp';} return false; }
    C=ctx; C.save();
    // Align the photographed handrail and deck with the existing object slots.
    C.drawImage(image,0,0,1536,462,0,0,900,293);
    C.drawImage(image,0,462,1536,138,0,293,900,41);
    C.drawImage(image,0,600,1536,424,0,334,900,266);
    if(sc.pal%3===1)rect(0,0,900,600,'rgba(255,174,94,.13)');
    if(sc.pal%3===2)rect(0,0,900,600,'rgba(195,242,244,.07)');
    pool(sc); C.restore(); return true;
  }
  var objects={deckchair:deckchair,lounger:lounger,parasol:parasol,palmpot:palm,icebucket:bucket,drinkstable:table,lifeboat:lifeboat,gull:function(o){gull(o,false);},gullstand:function(o){gull(o,true);},cloud:cloud,sun:sun};
  function object(ctx,o,d) {
    if(!objects[o.k]) return false;
    C=ctx; C.save();
    // Maintain the old ink bounds for placement, occlusion and saved hit targets.
    var b=SceneArt.localBox(d); C.beginPath(); C.rect(b[0],b[1],b[2]-b[0],b[3]-b[1]); C.clip();
    objects[o.k](o); C.restore(); return true;
  }
  return {background:background,object:object,get ready(){return ready;}};
})();
