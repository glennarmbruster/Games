/* Photographic sets for Deep Wren, Tumbletop Toys, and the Magician's Dressing Room.
   Room modules remain authoritative for clues, controls, actions and animations. */
var GOPhoto678=(function(){'use strict';
var names={6:['hatch','helm','ports','lab','hatchz','scopez','notez','bilgez','sonarz','ballastz','planz','port1z','port2z','bunkz','logz','lockerz','clockz','cabz','bellsz','viewz','jarsz','guidez','powerz','leafz'],7:['door','counter','house','train','windowz','doorz','teddyz','horsez','tillz','jackz','pricez','dollz','chestz','standz','abcz','trainz','runz','quizz','ventz'],8:['door','mirror','costume','cabinet','doorz','callz','stubz','posterz','capez','bucketz','mirrorz','cardsz','drawerz','fortunez','railz','hatz','trunkz','tablez','cabinetz','mirror-off','mirrorz-off']},images={},sprites={},scratch;
function preload(key,url,into){var im=new Image();im.onload=function(){into[key]=im;window.dispatchEvent(new Event('gomaterialready'));};im.src=url;}
Object.keys(names).forEach(function(id){names[id].forEach(function(v){preload(id+'-'+v,'assets/room'+id+'-'+v+'-v1.webp',images);});});
['marine','toys','props'].forEach(function(k){preload(k,'assets/levels678-'+k+'-v1.webp',sprites);});
function crop(c,key,s,d){var im=images[key];if(!im)return false;c.drawImage(im,s[0]*im.width/1000,s[1]*im.height/1400,s[2]*im.width/1000,s[3]*im.height/1400,d[0],d[1],d[2],d[3]);return true;}
function photo(c,id,v,e,X){var key=id+'-'+v;if(id===8&&X&&X.diff!=='e'&&!X.st.f['f:lit']&&images[key+'-off'])key+='-off';var im=images[key];c.save();c.fillStyle='#1c2022';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);c.save();c.filter='blur(22px)';c.drawImage(im,e.x0-25,e.y0-25,e.x1-e.x0+50,e.y1-e.y0+50);c.restore();c.fillStyle='rgba(9,13,15,.4)';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);c.drawImage(im,0,0,1000,1400);c.restore();}
function backdrop(c,id,v,e,X){if(X&&Object.keys(X.st.done).some(function(k){return X.st.done[k]&&/^(take_|use_|solve_)/.test(k);}))return false;if(!images[id+'-'+v])return false;photo(c,id,v,e,X);return true;}
function skin(c,id,x,y,w,h,r,fill){if(!fill||w<25||h<20)return;c.save();GOArt.H.rr(c,x,y,w,h,r||0);c.clip();c.globalAlpha=(id===6&&w>250&&h>250&&typeof fill!=='string')?.92:.32;c.globalCompositeOperation=(id===6&&w>250&&h>250&&typeof fill!=='string')?'source-over':'soft-light';crop(c,id===6?'6-powerz':id===7?'7-tillz':'8-trunkz',id===6?[170,450,170,550]:id===7?[180,1080,650,120]:[120,840,730,300],[x,y,w,h]);c.restore();}
function cloth(c,x,y,w,h,col){c.save();c.clip();c.globalCompositeOperation='luminosity';c.globalAlpha=.85;crop(c,'8-costume',[78,420,48,245],[x-w*.55,y+h*.1,w*1.1,h*.9]);c.restore();}
var marine=['fish','crab','jelly','star','seahorse','turtle','snail','urchin','squid','octopus'],toys=['soldier','duck','ball','bear','boat','rocket'],colors=['red','blue','yellow','green'];
function sprite(c,im,col,row,cols,rows,x,y,s,flip,rot,sh){var cw=im.width/cols,ch=im.height/rows;c.save();c.translate(x,y);if(rot)c.rotate(rot*Math.PI/2);if(flip<0)c.scale(-1,1);if(sh){var cv=document.createElement('canvas');cv.width=Math.round(cw);cv.height=Math.round(ch);var g=cv.getContext('2d');g.drawImage(im,col*cw,row*ch,cw,ch,0,0,cv.width,cv.height);g.globalCompositeOperation='source-in';g.fillStyle=sh;g.fillRect(0,0,cv.width,cv.height);c.drawImage(cv,-s/2,-s/2,s,s);cv.width=cv.height=1;}else c.drawImage(im,col*cw,row*ch,cw,ch,-s/2,-s/2,s,s);c.restore();}
function critter(c,k,x,y,s,f){var i=marine.indexOf(k),im=sprites.marine;if(!im||i<0)return false;sprite(c,im,i%5,Math.floor(i/5),5,2,x,y,s*1.15,f,0,null);return true;}
function toy(c,k,x,y,s,col,sh,rot){var i=toys.indexOf(k),j=colors.indexOf(col),im=sprites.toys;if(!im)return false;if(i<0){var pi=['horse','plane','robot','drum','doll','frog'].indexOf(k);if(pi<0||!sprites.props)return false;sprite(c,sprites.props,pi%3,2+Math.floor(pi/3),3,4,x,y,s*1.2,1,rot,sh);return true;}if(j<0){if(s>300&&!sh)return false;j=0;}sprite(c,im,j<0?0:j,i,4,6,x,y,s*1.22,1,rot,sh);return true;}
function miniRoom(c,x,y,w,h){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.globalCompositeOperation='luminosity';c.globalAlpha=.28;crop(c,'7-dollz',[295,430,70,220],[x,y,w,h]);c.globalCompositeOperation='source-over';var g=c.createLinearGradient(x,y,x+w,y);g.addColorStop(0,'rgba(32,17,8,.5)');g.addColorStop(.18,'rgba(32,17,8,.04)');g.addColorStop(.8,'rgba(32,17,8,.04)');g.addColorStop(1,'rgba(32,17,8,.3)');c.fillStyle=g;c.fillRect(x,y,w,h);c.restore();}
function furniture(c,k,x,y,s){var i=['bed','stove','tub','piano','easel','books'].indexOf(k);if(i<0||!sprites.props)return false;sprite(c,sprites.props,i%3,Math.floor(i/3),3,4,x,y-s*.48,s*1.18,1,0,null);return true;}
function street(c,x0,y0,x1,y1,X){if(X._photoView==='windowz'&&images['7-windowz']){photo(c,7,'windowz',X.ext,X);return true;}return crop(c,'7-doorz',[228,68,544,484],[x0,y0,x1-x0,y1-y0]);}
function sea(c,which){return crop(c,'6-port'+which+'z',[90,250,820,820],[90,250,820,820]);}
function regions(id,v,X){var f=X.st.f,d=X.st.done,E=X.diff==='e',H=X.diff==='h',L=(id===6?GORoom6:id===7?GORoom7:GORoom8).L,a=[];
function add(x,y,w,h){a.push([x,y,w,h]);}function rect(r,p){p=p||0;add(r[0]-p,r[1]-p,r[2]+2*p,r[3]+2*p);}function cir(x,y,r){a.push({c:[x,y,r]});}
if(id===6){switch(v){
case'hatch':cir(185,365,97);cir(285,572,35);if(f['f:doorOpen']||X.doorT!=null)add(340,20,320,165);if(f['f:scopeUp'])rect(L.scope,5);if(!H)rect(L.bilge,10);break;
case'helm':cir(250,430,120);rect(L.ballast,3);if(d.take_phones)rect(L.phones,8);if(f['f:drawerOpen'])add(145,780,210,95);break;
case'ports':cir(270,350,130);cir(730,350,130);if(E||d.take_cord)add(470,675,75,45);if(f['f:lockerOpen'])rect(L.locker,80);if(f['f:clockOpen']||f['f:cabOpen'])rect(L.cab,5);if(!H)rect(L.bells,4);break;
case'lab':rect(L.shelf,6);if(!H||d.take_torch)rect(L.torch,12);rect(L.power,3);if(f['f:jarsOpen'])add(210,560,285,160);break;
case'hatchz':if(f['f:wheel'])cir(500,470,180);cir(790,758,42);break;
case'scopez':if(f['f:scopeUp'])add(240,325,520,620);break;
case'bilgez':if(f['f:bilgeLit'])add(90,305,820,900);break;
case'sonarz':cir(500,560,340);if(f['f:drawerOpen'])rect(L.sonarDrawer,25);break;
case'ballastz':add(70,300,860,620);if(!E&&!f['f:panelFree'])rect(L.lockBar,25);else add(90,940,820,90);break;
case'planz':add(150,930,700,210);break;
case'port1z':case'port2z':cir(500,660,410);break;
case'bunkz':if(E||d.take_cord)rect(L.bunkCord,15);break;
case'lockerz':if(f['f:lockerOpen'])add(100,640,800,600);else add(500-110*X.R.puzzles.locker.answer.length/2-35,580,110*X.R.puzzles.locker.answer.length+70,345);break;
case'clockz':if(H&&f['f:clockOpen'])add(250,220,700,490);if(!H&&f['f:clockOpen'])rect(L.cabDoors,5);cir(380,790,42);cir(620,790,42);break;
case'cabz':if(f['f:cabOpen'])add(130,390,740,920);else add(245,520,510,345);break;
case'viewz':cir(500,640,400);break;
case'jarsz':rect(L.jarRow,10);if(f['f:jarsOpen'])rect(L.jarCab,6);break;
case'guidez':add(75,210,150,850);break;
case'powerz':rect(L.fuseSocket,3);cir(500,960,38);break;
}}
if(id===7){switch(v){
case'door':add(70,430,240,400);if(f['f:doorOpen']||X.doorT!=null)rect(L.door,8);if(!H||d.take_card)add(760,550,62,42);if(E||d.take_track)add(820,878,85,58);break;
case'counter':rect(L.till,3);if(f['f:jackUp'])add(620,410,210,305);if(!H)rect(L.prices,3);break;
case'house':rect(L.house,2);if(f['f:chestOpen'])rect(L.chest,3);if(H)rect(L.abc,10);else{rect(L.abc,10);rect(L.stand,55);}break;
case'train':rect(L.quiz,3);if(f['f:trainRun']||f['f:track'])add(300,660,610,130);cir(550,644,12);if(f['f:ventOpen'])rect(L.vent,3);break;
case'windowz':add(70,240,860,1040);break;
case'doorz':if(f['f:unlocked'])rect(L.lock,8);break;
case'teddyz':if(!H||d.take_card)rect(L.card,5);break;
case'horsez':add(410,570,260,280);break;
case'tillz':rect(L.abacus,5);if(f['f:tillOpen'])rect(L.tillDrawer,25);break;
case'jackz':if(f['f:jackUp'])add(45,90,910,810);if(f['f:crank'])rect(L.crank,15);break;
case'dollz':add(50,100,900,1120);break;
case'chestz':rect(L.bars,15);if(f['f:chestOpen'])add(120,900,760,400);break;
case'standz':add(120,380,780,340);break;
case'abcz':rect(L.blocks,65);if(f['f:abcOpen'])rect(L.abcItem,40);break;
case'trainz':add(420,725,130,80);if(f['f:trainRun'])add(580,560,380,235);if(!E)rect(L.signal,5);break;
case'runz':if(f['f:signal'])add(190,990,300,210);break;
case'quizz':add(70,270,850,870);if(f['f:quizOpen'])rect(L.quizItem,40);break;
case'ventz':if(f['f:ventOpen']||d.use_rod)rect(L.grate,5);break;
}}
if(id===8){switch(v){
case'door':if(f['f:doorOpen']||f['f:unlocked']||X.doorT!=null)rect(L.door,4);if(!H||d.take_cup)rect(L.bucket,8);break;
case'mirror':if(f['f:drawerOpen'])rect(L.drawer,5);if(H&&d.take_scissors)add(735,705,105,60);if(!H)rect(L.fortune,5);break;
case'costume':add(60,210,500,500);if(f['f:awake']||d.take_hat)add(145,745,410,355);if(f['f:trunkOpen'])rect(L.trunk,5);if(!H||d.take_bouquet)rect(L.vase,8);break;
case'cabinet':if(f['f:cabOpen'])rect(L.cabinet,10);if(d.take_oil)rect(L.oil,10);break;
case'doorz':rect(L.bolt,15);if(f['f:unlocked'])rect(L.lock,5);break;
case'callz':rect(L.order,45);if(!H)rect(L.stub,5);break;
case'capez':rect(L.pocket,5);break;
case'bucketz':if(d.take_cup)add(370,510,310,285);break;
case'mirrorz':if(E||f['f:lit'])add(240,270,530,330);if(H&&d.take_scissors)rect(L.tin,12);break;
case'cardsz':break;
case'drawerz':if(f['f:drawerOpen'])add(90,740,820,510);else add(140,260,720,390);break;
case'railz':add(20,170,960,1100);break;
case'hatz':if(f['f:awake']||d.take_hat)add(180,490,770,750);break;
case'trunkz':if(f['f:trunkOpen'])add(80,700,840,630);else rect(L.trunkLock,20);break;
case'tablez':rect(L.cupRow,65);if(d.take_body)rect(L.wandBox,3);if(E)add(450,920,350,350);break;
case'cabinetz':if(f['f:cabOpen'])rect(L.cabDoor,10);else add(70,590,860,280);break;
}}
return a;}
function cards(c,v,X){var cl=X.R.clues.cards.cards,L=GORoom8.L;
if(v==='mirror'){var m=L.mirror;cl.forEach(function(cd,k){GOArt8.playingCard(c,m[0]-4+k*(cl.length>4?13:20),m[1]+m[3]-110+(k%2)*6,46,64,cd,-.25+k*.08);});}
if(v==='mirrorz'){var ca=L.cardsAt;cl.forEach(function(cd,k){GOArt8.playingCard(c,ca[0]-10+k*(cl.length>4?22:38),ca[1]+100+(k%2)*10,96,134,cd,-.3+k*(cl.length>4?.07:.14));});}
if(v==='cardsz'){var r=L.cardRow,n=cl.length,cw=Math.min(200,r[2]/n-10),ch=cw*1.4,gap=(r[2]-cw*n)/Math.max(1,n-1);if(n>5){cw=124;ch=174;gap=(r[2]-cw*n)/(n-1);}c.save();var g=c.createLinearGradient(0,330,0,740);g.addColorStop(0,'#332830');g.addColorStop(1,'#1d171c');c.fillStyle=g;c.fillRect(20,270,960,480);c.globalCompositeOperation='soft-light';c.globalAlpha=.32;crop(c,'8-cardsz',[100,170,800,170],[20,270,960,480]);c.restore();cl.forEach(function(cd,k){GOArt8.playingCard(c,r[0]+k*(cw+gap),r[1]+(k%2)*14,cw,ch,cd,(k-(n-1)/2)*.03);});}}
var props=['font','textAlign','textBaseline','fillStyle','strokeStyle','lineWidth','globalAlpha','shadowColor','shadowBlur','shadowOffsetX','shadowOffsetY'];
function transformed(c,m,fn){c.save();c.transform(m.a,m.b,m.c,m.d,m.e,m.f);fn();c.restore();}
function hands(c,q){transformed(c,q[5],function(){var x=q[0],y=q[1],r=q[2],hd=GOArt.hands(q[3],q[4]);c.lineCap='round';c.strokeStyle='#16181a';[[hd.h,.48,.065],[hd.m,.78,.04]].forEach(function(a){c.lineWidth=r*a[2];c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(a[0])*r*a[1],y-Math.cos(a[0])*r*a[1]);c.stroke();});GOArt.H.circ(c,x,y,r*.06,'#b83128');});}
function render(c,id,v,X,original){if(!images[id+'-'+v])return false;if(!scratch){scratch=document.createElement('canvas');scratch.width=1000;scratch.height=1400;}var g=scratch.getContext('2d'),texts=[],clocks=[],gauges=[],oldC=X._photoClocks,oldG=X._photoGauges;g.resetTransform();g.clearRect(0,0,1000,1400);
var methods={};['fillText','strokeText'].forEach(function(n){methods[n]=g[n];g[n]=function(){var q={n:n,a:Array.prototype.slice.call(arguments),m:g.getTransform(),p:{}};props.forEach(function(p){q.p[p]=g[p];});texts.push(q);return methods[n].apply(g,arguments);};});
X._photoClocks=clocks;X._photoGauges=gauges;try{original(g,v,X);}finally{X._photoClocks=oldC;X._photoGauges=oldG;Object.keys(methods).forEach(function(n){g[n]=methods[n];});}
photo(c,id,v,X.ext,X);var liveRegions=regions(id,v,X);liveRegions.forEach(function(r){c.save();c.beginPath();if(r.c)c.arc(r.c[0],r.c[1],r.c[2],0,Math.PI*2);else c.rect(r[0],r[1],r[2],r[3]);c.clip();c.drawImage(scratch,0,0);c.restore();});
if(id===6){if(!(v==='clockz'&&X.diff==='h'&&X.st.f['f:clockOpen']))clocks.forEach(function(q){hands(c,q);});gauges.forEach(function(q){if(v!=='hatch')return;transformed(c,q[4],function(){var a=Math.PI*.75+Math.PI*1.5*Math.max(0,Math.min(1,q[3]));c.strokeStyle='#ba3028';c.lineWidth=q[2]*.07;c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[0]+Math.cos(a)*q[2]*.8,q[1]+Math.sin(a)*q[2]*.8);c.stroke();});});}
if(id===8&&v==='mirrorz'){var wn=GORoom8.L.wrenNote;c.save();c.translate(wn[0]+wn[2]/2,wn[1]+wn[3]/2);c.rotate(.1);c.fillStyle='#fbf3dc';c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=8;c.shadowOffsetY=4;GOArt.H.rr(c,-wn[2]/2,-wn[3]/2,wn[2],wn[3],4);c.fill();c.restore();}
texts.forEach(function(q){if(id===8&&['mirror','mirrorz','cardsz'].indexOf(v)>=0&&/^\d$/.test(String(q.a[0])))return;var px=q.m.a*q.a[1]+q.m.c*q.a[2]+q.m.e,py=q.m.b*q.a[1]+q.m.d*q.a[2]+q.m.f;if(liveRegions.some(function(r){return r.c?Math.hypot(px-r.c[0],py-r.c[1])<r.c[2]:px>r[0]&&px<r[0]+r[2]&&py>r[1]&&py<r[1]+r[3];}))return;c.save();var m=q.m;c.transform(m.a,m.b,m.c,m.d,m.e,m.f);props.forEach(function(p){c[p]=q.p[p];});c[q.n].apply(c,q.a);c.restore();});
if(id===8&&['mirror','mirrorz','cardsz'].indexOf(v)>=0)cards(c,v,X);
if(id===6&&!X.st.f['f:power']&&['hatch','helm','ports','lab','ballastz','powerz'].indexOf(v)>=0){c.save();c.fillStyle='rgba(0,8,15,.28)';c.fillRect(X.ext.x0,X.ext.y0,X.ext.x1-X.ext.x0,X.ext.y1-X.ext.y0);c.restore();}
return true;}
return{render:render,names:names,images:images,sprites:sprites,regions:regions,backdrop:backdrop,skin:skin,furniture:furniture,miniRoom:miniRoom,critter:critter,toy:toy,sea:sea,street:street,cloth:cloth};})();
