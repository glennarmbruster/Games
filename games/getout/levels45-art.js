/* Photographic workshop/conservatory sets. Original modules own puzzle state and hits. */
var GOPhoto45=(function(){'use strict';
var images={},names={4:['door','bench','cuckoos','drawers','cuckooz','apronz','regz','skylight','boardz','magz','magview','toolz','visez','benchz','notez','ticketz','clocksz','rackz','musicz','cabz','dialz','trayz','testerz','pricez'],5:['door','fountain','panes','potting','roof','doorz','potz','fernz','fountainz','valvez','pipesz','casez','lightz','benchz','catalogz','potsz','chartz','seedz','cardz','chestz','frostz']};
Object.keys(names).forEach(function(id){names[id].forEach(function(v){var im=new Image(),k=id+'-'+v;im.onload=function(){images[k]=im;window.dispatchEvent(new Event('gomaterialready'))};im.src='assets/room'+k+'-v1.webp';})});
function photo(c,id,v,e){var im=images[id+'-'+v];if(!im)return false;c.save();c.fillStyle=id===4?'#23343d':'#162d2c';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);c.save();c.filter='blur(22px)';c.drawImage(im,e.x0-25,e.y0-25,e.x1-e.x0+50,e.y1-e.y0+50);c.restore();c.fillStyle='rgba(9,13,15,.35)';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);c.drawImage(im,0,0,1000,1400);c.restore();return true;}
function regions(id,v,X){var f=X.st.f,d=X.st.done,P=X.P,L=(id===4?GORoom4:GORoom5).L,a=[],E=X.diff==='e',H=X.diff==='h';function add(x,y,w,h){a.push([x,y,w,h])}function rect(r,pad){pad=pad||0;add(r[0]-pad,r[1]-pad,r[2]+pad*2,r[3]+pad*2)}function cir(x,y,r){a.push({c:[x,y,r]})}
if(id===4){switch(v){
case 'door':if(f['f:doorOpen']||X.doorT!=null)rect(L.door,2);if(f['f:birdIn']||X.doorT!=null)add(459,61,95,145);if(H&&!f['f:weight'])add(606,716,70,200);break;
case 'bench':if(H&&!f['f:moon'])add(105,0,790,230);if(H&&d.take_sd)rect(L.tools);if(H&&d.take_mouse)rect(L.benchtop);if(E&&f['f:train'])add(315,890,385,200);break;
case 'cuckoos':if(f['f:musicOpen'])rect(L.music,12);break;
case 'drawers':rect(L.tester);if(!E)add(220,470,340,150);if(H)rect(L.prices);break;
case 'cuckooz':if(f['f:birdIn']||f['f:cuckoo'])add(400,300,235,350);if(!H||f['f:weight'])add(800,1130,150,270);break;
case 'apronz':if(E||d.take_watch)add(310,710,390,340);break;
case 'regz':add(340,650,320,420);if(f['f:regOpen'])rect(L.regDrawer,25);cir(416,400,32);cir(584,400,32);break;
case 'skylight':if(!H||f['f:moon'])add(0,0,1000,1400);break;
case 'boardz':if(!H||f['f:coverOff'])rect(L.motor);X.R.puzzles.gears.lay.pegs.forEach(function(p){cir(p.x,p.y,15)});cir(X.R.puzzles.gears.lay.out.x,X.R.puzzles.gears.lay.out.y,15);add(130,1090,730,180);break;
case 'magz':if(d.use_watch)rect(L.stage,5);break;
case 'toolz':if(H&&d.take_sd)rect(L.sd,10);break;
case 'visez':if(d.take_gear)cir(500,700,120);break;
case 'benchz':if(!H||d.take_mouse)rect(L.mouse,12);if(H)rect(L.ticket,8);if(E&&f['f:train'])rect(L.bDrawer,25);break;
case 'rackz':if(E)add(175,245,650,650);if(!E)add(300,1100,400,115);for(var k=0;k<(X.R.puzzles.pend?X.R.puzzles.pend.answer.length:0);k++)cir(500+(k-(X.R.puzzles.pend.answer.length-1)/2)*50,1270,15);break;
case 'musicz':if(f['f:musicOpen'])add(180,440,640,540);else for(var k=0;k<5;k++)cir(200+600*(.15+k*.175),600+320*.62,22);break;
case 'cabz':add(235,535,530,110);break;
case 'dialz':add(500-Math.min(110,540/X.R.puzzles.dial.answer.length)*X.R.puzzles.dial.answer.length/2-30,500,Math.min(110,540/X.R.puzzles.dial.answer.length)*X.R.puzzles.dial.answer.length+60,360);if(f['f:dialOpen'])add(140,900,720,340);break;
case 'trayz':add(200,360,780,600);break;
case 'testerz':add(110,360,780,690);if(f['f:springsOK'])rect(L.testerBase,25);break;
}}
else{switch(v){
case 'door':if(d.take_can||H)rect(L.can,15);if(H)rect(L.lantern,10);if(f['f:planted'])add(120,660,240,220);if(f['f:grown']||X.doorT!=null)add(180,190,540,730);if(f['f:doorOpen']||X.doorT!=null)rect(L.door,5);break;
case 'fountain':if(f['f:valve']||H)rect(L.valve,10);rect(L.bcase,5);break;
case 'panes':if(X.R.puzzles.light){add(245,575,515,115);rect(L.dial)}if(H)add(50,870,235,135);break;
case 'potting':add(65,470,550,240);if(H){rect(L.frost);rect(L.chest)}break;
case 'roof':if(E)add(250,350,500,400);break;
case 'potz':if(f['f:dug']||f['f:planted'])add(200,480,600,255);break;
case 'fernz':if(!H||d.take_bulb)rect(L.bulb,10);break;
case 'fountainz':if(X.R.clues.flies)add(60,980,880,340);break;
case 'valvez':if(!H||f['f:cut'])rect(L.brambles,20);if(f['f:valve'])cir(500,620,145);break;
case 'pipesz':add(0,330,1000,700);break;
case 'casez':if(E)add(130,350,740,780);else if(f['f:caseOpen'])add(100,280,800,1000);break;
case 'lightz':if(E)add(130,100,740,700);else{if(f['f:dialOpen'])rect(L.drawerFood,35)}break;
case 'benchz':if(!H||d.take_bell)rect(L.bell,10);if(!H)add(210,520,180,210);else add(570,730,260,150);break;
case 'catalogz':add(185,405,630,230);break;
case 'potsz':add(40,460,920,460);if(f['f:potOpen'])rect(L.potDrawer,25);break;
case 'chartz':add(60,270,880,1030);break;
case 'seedz':rect(L.seedRow);if(f['f:seedOpen'])rect(L.seedOpen,45);break;
case 'chestz':if(f['f:chestOpen'])add(110,860,780,390);else add(190,500,620,360);break;
}}
return a;}
var COL={red:'#ff4a4a',green:'#3ee07a',blue:'#4a7bff',yellow:'#ffe14a',teal:'#3ee0d8',pink:'#ff6ad5',cream:'#f6efd8',orange:'#f59a2a',purple:'#9a5ae0'};
function enamel(c,x,y,r,col){c.save();c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=6;c.shadowOffsetY=4;var rim=c.createLinearGradient(x-r,y-r,x+r,y+r);rim.addColorStop(0,'#e3c78c');rim.addColorStop(.5,'#80613a');rim.addColorStop(1,'#d4b470');c.fillStyle=rim;c.beginPath();c.arc(x,y,r+3,0,Math.PI*2);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;var g=c.createRadialGradient(x-r*.35,y-r*.35,2,x,y,r*1.1);g.addColorStop(0,GOArt.H.shade(col,.28));g.addColorStop(.5,col);g.addColorStop(1,GOArt.H.shade(col,-.4));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle='rgba(255,242,207,.45)';c.lineWidth=1.2;c.beginPath();c.arc(x,y,r-3,Math.PI*1.1,Math.PI*1.8);c.stroke();c.restore()}
function controls(c,id,v,X){if(id!==5)return;var st=X.st;
if(v==='casez'&&X.R.puzzles.wings&&!st.f['f:caseOpen']){var p=X.R.puzzles.wings,s=st.pz.wings;for(var r=0;r<p.rows;r++)for(var k=0;k<p.cols;k++){var i=r*p.cols+k;enamel(c,150+k*98+49,440+r*98+49,40,COL[p.left[i]]);enamel(c,550+k*98+49,440+r*98+49,40,COL[p.set[s.s[i]]])}}
if(v==='lightz'&&X.R.puzzles.light){var p=X.R.puzzles.light,s=st.pz.light,L=GORoom5.L,n=p.answer.length,pw=Math.min(170,L.panes[2]/n),cur=s.s.map(function(k){return p.set[k]}),spots=GORoom5.spotsOf(cur),sw=L.spots[2]/spots.length;
 spots.forEach(function(col,k){var sx=L.spots[0]+sw*(k+.5),ax=500+(k-(n-1)/2)*pw,bx=ax+pw;c.save();var g=c.createLinearGradient(0,420,0,980);g.addColorStop(0,COL[col]+'66');g.addColorStop(1,COL[col]+'05');c.fillStyle=g;c.beginPath();c.moveTo(ax-20,420);c.lineTo(bx+20,420);c.lineTo(sx+50,980);c.lineTo(sx-50,980);c.closePath();c.fill();c.restore();enamel(c,sx,980,39,COL[col]);GOArt.H.sym(c,p.spots[k],sx,980,48,'#332c22')});
 for(var i=0;i<n;i++){var x=500+(i-(n-1)/2)*pw,w=pw-22,y=L.panes[1],h=L.panes[3];c.save();GOArt.H.rr(c,x-w/2,y,w,h,28);c.clip();var g=c.createLinearGradient(x-w/2,y,x+w/2,y+h);g.addColorStop(0,GOArt.H.shade(COL[cur[i]],.2));g.addColorStop(.45,COL[cur[i]]+'ba');g.addColorStop(1,GOArt.H.shade(COL[cur[i]],-.35));c.fillStyle=g;c.fillRect(x-w/2,y,w,h);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x-w/2+10,y+12,7,h-24);c.restore();c.save();c.strokeStyle='#977448';c.lineWidth=5;GOArt.H.rr(c,x-w/2,y,w,h,28);c.stroke();c.restore()}
}}
var props=['font','textAlign','textBaseline','fillStyle','strokeStyle','lineWidth','globalAlpha','shadowColor','shadowBlur','shadowOffsetX','shadowOffsetY'];
function render(c,id,v,X,original){if(!images[id+'-'+v])return false;var cv=document.createElement('canvas');cv.width=1000;cv.height=1400;var g=cv.getContext('2d'),texts=[],clocks=[];
['fillText','strokeText'].forEach(function(n){var fn=g[n].bind(g);g[n]=function(){var q={n:n,a:Array.prototype.slice.call(arguments),m:g.getTransform(),p:{}};props.forEach(function(p){q.p[p]=g[p]});texts.push(q);return fn.apply(g,arguments)}});
var old=X._photoClocks;X._photoClocks=clocks;try{original(g,v,X)}finally{X._photoClocks=old}
photo(c,id,v,X.ext);
// Never paint seed-specific answers into a static image. Replay live text and live controls.
regions(id,v,X).forEach(function(r){c.save();c.beginPath();if(r.c)c.arc(r.c[0],r.c[1],r.c[2],0,Math.PI*2);else c.rect(r[0],r[1],r[2],r[3]);c.clip();c.drawImage(cv,0,0);c.restore()});
if(id===4&&v==='cuckoos'){c.save();var g=c.createLinearGradient(0,938,0,973);g.addColorStop(0,'#d1ad65');g.addColorStop(1,'#866029');c.fillStyle=g;c.fillRect(335,938,400,35);c.restore()}
clocks.forEach(function(q){c.save();var m=q[5];c.transform(m.a,m.b,m.c,m.d,m.e,m.f);hands(c,q[0],q[1],q[2],q[3],q[4]);c.restore()});
texts.forEach(function(q){if(id===4&&v==='door'&&q.a[0]==='W. & Co.')return;if(id===4&&(v==='door'||v==='cuckoos')&&/^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/.test(String(q.a[0])))return;c.save();var m=q.m;c.transform(m.a,m.b,m.c,m.d,m.e,m.f);props.forEach(function(p){c[p]=q.p[p]});c[q.n].apply(c,q.a);c.restore()});
controls(c,id,v,X);
if(id===5&&v==='roof'&&X.st.f['k:moth']){c.save();c.fillStyle='rgba(140,65,210,.15)';c.fillRect(0,0,1000,1400);var digits=X.R.clues.moth.digits;c.fillStyle='#f4ddff';c.shadowColor='#a55dff';c.shadowBlur=18;c.textAlign='center';c.font='bold 48px Georgia';c.fillText(digits.join(' '),500,590);c.restore()}
return true;}
function hands(c,x,y,r,h,m){if(h==null)return;c.save();c.lineCap='round';c.strokeStyle='#271b12';c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=2;c.shadowOffsetY=2;[[((h%12)+m/60)*Math.PI/6-Math.PI/2,r*.53,r*.065],[m*Math.PI/30-Math.PI/2,r*.8,r*.035]].forEach(function(q){c.lineWidth=Math.max(2,q[2]);c.beginPath();c.moveTo(x-Math.cos(q[0])*r*.12,y-Math.sin(q[0])*r*.12);c.lineTo(x+Math.cos(q[0])*q[1],y+Math.sin(q[0])*q[1]);c.stroke()});c.shadowBlur=0;c.fillStyle='#b18b45';c.beginPath();c.arc(x,y,Math.max(3,r*.055),0,Math.PI*2);c.fill();c.restore()}
return {render:render,names:names,images:images,regions:regions};})();
