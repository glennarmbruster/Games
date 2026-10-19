import * as T from '../../shared/three.module.min.js';

const $ = id => document.getElementById(id);
const canvas = $('game');
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,t) => a+(b-a)*t;
const STORE = 'goobs.snowbound.v1';
const LEVELS=[{name:'Alpine Village',target:7500},{name:'Aurora Pass',target:10000}];
let save = {bestLaunch:0,bestEndless:0,tokens:0,level:1,levelMeters:[0,0],levelTwoComplete:false,up:{launch:0,glide:0,rocket:0,steer:0,armor:0}};
try {
  const prior = JSON.parse(localStorage.getItem(STORE)||'null');
  if (prior && typeof prior === 'object') {
    save.bestLaunch = Number(prior.bestLaunch)||0;
    save.bestEndless = Number(prior.bestEndless)||0;
    save.tokens = Math.max(0, Number(prior.tokens)||0);
    save.level = prior.level===2?2:1;
    if(Array.isArray(prior.levelMeters))save.levelMeters=[clamp(Number(prior.levelMeters[0])||0,0,7500),clamp(Number(prior.levelMeters[1])||0,0,10000)];
    save.levelTwoComplete=!!prior.levelTwoComplete;
    for (const key of Object.keys(save.up)) save.up[key] = clamp(Number(prior.up?.[key])||0,0,12)|0;
  }
} catch {}
const persist = () => { try { localStorage.setItem(STORE,JSON.stringify(save)); } catch {} };
let soundOn = true;
try { soundOn = localStorage.getItem('goobs.snowbound.sound') !== 'off'; } catch {}
let audio;
function tone(f,d=.13,type='sine',gain=.09) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext||window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const o=audio.createOscillator(), g=audio.createGain(), t=audio.currentTime;
    o.type=type; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(Math.max(70,f*.64),t+d);
    g.gain.setValueAtTime(.001,t); g.gain.exponentialRampToValueAtTime(gain,t+.015); g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t+d+.02);
  } catch {}
}
let scene,camera,renderer,rider,wings,flames,engineSingle,engineDual,gate,particles,skyGroup;
const chunks=new Map(), objects=[], materials={}, turbines=[], mountains=[];
let mode='launch', phase='menu', beforeHelp='menu', z=4, lateral=0, target=0, speed=0, air=0, vy=0, hearts=3, stars=0, shieldTime=0, surgeTime=0, invuln=0, boostTime=0, boostCharges=1, jumpCooldown=0, hitFlash=0, power=85, pull=null, pointer=false, last=0, clock=0, runId=0, runLevel=1, introT=0;
let worldY=0, verticalSpeed=0, airborneTime=0, totalAir=0, runReward=0, flipAngle=0, flipping=false, finishReason='', hudTimer=0;
let elastic,snowfall,shadow,landingPulse=0,launchPulse=0,lastSection=-1;
let noticeTimer;
function notice(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('toast').classList.remove('show'),1450)}
function rng(n){const v=Math.sin(n*127.1+64.7)*43758.5453;return v-Math.floor(v)}
// Broad, banked terrain: long drops feed speed into rounded launch crests.
function center(q){return Math.sin(q*.004)*8+Math.sin(q*.009)*3}
function base(q){return 24-q*.055+11*Math.cos(q*Math.PI/155)+3*Math.cos(q*Math.PI/67)}
function slope(q){return (base(q+.5)-base(q-.5))}
function ground(q,offset=0){const edge=Math.max(0,Math.abs(offset)-9);return base(q)+edge*edge*.105}
function meters(){return Math.max(0,(z-4)*4)}
function section(q){return Math.floor(Math.max(0,q)/310)%3}
function mat(color,opts={}){return new T.MeshStandardMaterial({color,roughness:.73,metalness:.02,...opts})}
function box(w,h,d,m){return new T.Mesh(new T.BoxGeometry(w,h,d),m)}
function ball(r,m,segments=14){return new T.Mesh(new T.SphereGeometry(r,segments,10),m)}
function tube(a,b,r,m,parent){const va=new T.Vector3(...a),vb=new T.Vector3(...b),dir=vb.clone().sub(va);const mesh=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),8),m);mesh.position.copy(va.add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());parent.add(mesh);return mesh}
function put(parent,mesh,x,y,z,scale=1){mesh.position.set(x,y,z);mesh.scale.setScalar(scale);parent.add(mesh);return mesh}
function pine(parent,x,z,s=1){const y=ground(z,x-center(z));const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s);g.rotation.y=rng(x+z)*1.6;parent.add(g);
  put(g,new T.Mesh(new T.CylinderGeometry(.18,.27,1.85,8),materials.wood),0,.87,0);
  const profile=[[0,.2],[1.34,.42],[1.12,.66],[.63,.86],[1.14,.98],[.94,1.2],[.51,1.42],[.96,1.54],[.76,1.79],[.38,1.99],[.72,2.14],[.52,2.47],[.27,2.72],[.43,2.8],[.18,3.1],[0,3.45]].map(v=>new T.Vector2(...v));
  const foliage=put(g,new T.Mesh(new T.LatheGeometry(profile,12),runLevel===2?(rng(x*.2+z)>.5?materials.pineViolet:materials.pineBlue):(rng(x*.2+z)>.5?materials.pine2:materials.pine)),0,.55,0);
  foliage.rotation.z=(rng(x+z*3)-.5)*.045;
  for(const [r,yy] of [[1.34,.42],[1.14,.98],[.96,1.54],[.72,2.14],[.43,2.8]]){
    const snowProfile=[[r*.62,0],[r*.93,.03],[r, .12],[r*.78,.26]].map(v=>new T.Vector2(...v));
    put(g,new T.Mesh(new T.LatheGeometry(snowProfile,12),materials.snow),0,yy+.55,0);
  }
  const tip=put(g,new T.Mesh(new T.ConeGeometry(.21,.52,9),materials.snow),0,3.82,0);tip.rotation.z=foliage.rotation.z;
  return g
}
function makeMesh(start,len,track=false){const offsets=track?[-14,-12,-9,0,9,12,14]:[-55,-38,-24,-15,-9,-6,0,6,9,15,24,38,55],steps=Math.ceil(len/2),v=[],colors=[],idx=[];
  const palette=runLevel===2?(track?['#e4edff','#a3d3fa','#d9e9ff','#eff8ff','#d9e9ff','#a3d3fa','#e4edff']:['#b9d3f5','#c9dff7','#dceafb','#f8fcff','#dceefb','#dceefb','#e5f3ff','#dceefb','#dceefb','#f8fcff','#dceafb','#c9dff7','#b9d3f5']):(track?['#f9ffff','#b8e9ff','#69badf','#95d3ec','#69badf','#b8e9ff','#f9ffff']:['#b6e4ef','#d3f1f5','#ecfcfc','#ffffff','#e8fafb','#dff5f7','#f0ffff','#dff5f7','#e8fafb','#ffffff','#ecfcfc','#d3f1f5','#b6e4ef']);
  for(let i=0;i<=steps;i++){let zz=start+len*i/steps;for(let j=0;j<offsets.length;j++){const off=offsets[j];v.push(center(zz)+off,ground(zz,off)+(track?.08:0),zz);const c=new T.Color(palette[j]);colors.push(c.r,c.g,c.b)}}
  for(let i=0;i<steps;i++)for(let j=0;j<offsets.length-1;j++){const a=i*offsets.length+j,b=a+1,c=a+offsets.length,d=c+1;idx.push(a,c,b,b,c,d)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();return new T.Mesh(geo,track?materials.track:materials.terrain)
}
function trailMarks(start,len){const v=[];function line(x1,q1,x2,q2){v.push(center(q1)+x1,ground(q1,x1)+.16,q1,center(q2)+x2,ground(q2,x2)+.16,q2)}for(let q=start;q<start+len;q+=9){const x=(rng(q+7)-.5)*17;line(x,q,x+2,q+3);line(x+2,q+3,x-.8,q+7);line(x+2,q+3,x+5,q+5);line(x-.8,q+7,x-4,q+8)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));return new T.LineSegments(geo,materials.trail)}
function createRamp(group,x,q){const g=new T.Group();g.position.set(x,ground(q,x-center(q)),q);group.add(g);const deck=box(6.3,.42,4.7,materials.ramp);deck.rotation.x=-.17;put(g,deck,0,.48,0);for(let k=-1;k<=1;k++){const stripe=box(.52,.04,4.2,materials.rampStripe);stripe.rotation.x=-.17;put(g,stripe,k*1.9,.76,0)}const flag=box(6.7,.32,.2,materials.rampStripe);put(g,flag,0,.52,-2.3);return g}
function createRock(group,x,q){const y=ground(q,x-center(q));const rock=put(group,new T.Mesh(new T.DodecahedronGeometry(1.1,0),materials.rock),x,y+.7,q);rock.scale.set(1.15,.75,1);return rock}
function createStar(group,x,q,power){const y=ground(q,x-center(q));const g=new T.Group();g.position.set(x,y+1.22,q);group.add(g);
  const outline=new T.Shape();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?.47:1.03,px=Math.cos(a)*r,py=Math.sin(a)*r;i?outline.lineTo(px,py):outline.moveTo(px,py)}outline.closePath();
  const color=power==='shield'?materials.starBlue:power==='surge'?materials.starPink:materials.starGold;
  const gem=new T.Mesh(new T.ExtrudeGeometry(outline,{depth:.24,bevelEnabled:true,bevelSize:.1,bevelThickness:.08,bevelSegments:2,steps:1}),color);g.add(gem);
  const ring=new T.Mesh(new T.TorusGeometry(1.24,.055,5,24),materials.starRing);g.add(ring);g.userData.spin=true;g.userData.dynamic=true;return g
}
function lodge(group,x,q,roofColor){const y=ground(q,x-center(q));const g=new T.Group();g.position.set(x,y,q);g.rotation.y=.25;group.add(g);
  put(g,box(6,3.2,5,materials.cabin),0,1.6,0);const roof=new T.Mesh(new T.ConeGeometry(4.55,2.8,4),roofColor);roof.rotation.y=Math.PI/4;put(g,roof,0,4.27,0);
  for(const s of [-1,1]){const window=box(1.06,.95,.08,materials.window);put(g,window,s*1.55,2.15,2.55);const frame=box(1.24,.11,.13,materials.wood);put(g,frame,s*1.55,2.67,2.58)}
  put(g,box(1.2,2,.12,materials.door),0,1,2.59);put(g,box(.65,1.35,.65,materials.wood),1.6,5.15,-.9);return g
}
function flagPole(group,x,q,color){const y=ground(q,x-center(q));const g=new T.Group();g.position.set(x,y,q);group.add(g);tube([0,0,0],[0,4.1,0],.09,materials.chrome,g);const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(2.2,-.35);shape.lineTo(0,-.85);shape.closePath();const flag=new T.Mesh(new T.ShapeGeometry(shape),color);flag.position.y=3.85;flag.material.side=T.DoubleSide;g.add(flag);return g}
function iceSpire(group,x,q,s=1){const y=ground(q,x-center(q));const g=new T.Group();g.position.set(x,y,q);group.add(g);for(let k=0;k<3;k++){const shard=new T.Mesh(new T.ConeGeometry((.6+k*.15)*s,(2.2+k*.5)*s,5),materials.ice);shard.position.set((k-1)*.65*s,(1.1+k*.25)*s,(k-1)*.4*s);shard.rotation.z=(k-1)*.16;g.add(shard)}return g}
function turbine(group,x,q){const y=ground(q,x-center(q));const g=new T.Group();g.position.set(x,y,q);group.add(g);tube([0,0,0],[0,17,0],.36,materials.white,g);const hub=put(g,ball(.65,materials.chrome),0,17,0);const rotor=new T.Group();rotor.position.set(0,17,.65);g.add(rotor);for(let k=0;k<3;k++){const arm=box(.48,6.4,.17,materials.white);arm.position.set(0,3.5,0);const blade=new T.Group();blade.rotation.z=k*Math.PI*2/3;blade.add(arm);rotor.add(blade)}g.userData.dynamic=true;turbines.push({rotor,group});return g}
function batchScenery(group){
 group.updateMatrixWorld(true);const batches=new Map(),remove=[];
 group.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;for(let n=o;n&&n!==group;n=n.parent)if(n.userData.dynamic)return;
  let b=batches.get(o.material);if(!b){b={p:[],n:[],c:[]};batches.set(o.material,b)}
  const geo=o.geometry,ps=geo.attributes.position,ns=geo.attributes.normal,cs=geo.attributes.color,ind=geo.index,normalMatrix=new T.Matrix3().getNormalMatrix(o.matrixWorld),v=new T.Vector3();
  const count=ind?ind.count:ps.count;
  for(let k=0;k<count;k++){const i=ind?ind.getX(k):k;v.fromBufferAttribute(ps,i).applyMatrix4(o.matrixWorld);b.p.push(v.x,v.y,v.z);if(ns)v.fromBufferAttribute(ns,i).applyMatrix3(normalMatrix).normalize();else v.set(0,1,0);b.n.push(v.x,v.y,v.z);if(cs)b.c.push(cs.getX(i),cs.getY(i),cs.getZ(i));else b.c.push(1,1,1);}
  remove.push(o);
 });
 for(const o of remove){o.parent.remove(o);o.geometry.dispose()}
 for(const [material,b] of batches){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));if(material.vertexColors)geo.setAttribute('color',new T.Float32BufferAttribute(b.c,3));geo.computeBoundingSphere();group.add(new T.Mesh(geo,material));}
}
function snowArch(group,q){const cx=center(q),y=base(q);for(const side of [-1,1]){const rock=put(group,new T.Mesh(new T.DodecahedronGeometry(1,0),materials.rock),cx+side*17,y+9,q);rock.scale.set(5,13,8);put(group,new T.Mesh(new T.ConeGeometry(6,8,5),materials.snow),cx+side*17,y+23,q);}
 const arch=new T.Mesh(new T.TorusGeometry(17,2.1,5,18,Math.PI),materials.ice);arch.position.set(cx,y+8,q);group.add(arch);
}
function createChunk(i){const g=new T.Group(),start=i*88;g.add(makeMesh(start,88));g.add(makeMesh(start,88,true));g.add(trailMarks(start,88));scene.add(g);
  for(let k=0;k<6;k++){const q=start+3+k*14.2;for(const side of [-1,1]){const n=i*140+k*7+(side+1);const x=center(q)+side*(21+rng(n)*23);section(q)===1?iceSpire(g,x,q,1.6+rng(n+4)):pine(g,x,q,1.3+rng(n+4)*1.5);if(rng(n+10)>.9)pine(g,x+side*3,q+4,.55+rng(n+5)*.6);if((k===3||(runLevel===2&&k===7))&&i>0)iceSpire(g,center(q)+side*19.8,q,.8+rng(n+11)*.9)}}
  if(i>0){for(const side of [-1,1])flagPole(g,center(start+13)+side*16.9,start+13,runLevel===2?(side>0?materials.flagGold:materials.flagViolet):(side>0?materials.flagCoral:materials.flagGold))}
  if(i>0&&(runLevel===2?i%3===0:i%2===0))lodge(g,center(start+39)+(i%4===0?1:-1)*30,start+39,runLevel===2?materials.roofPurple:(i%4===0?materials.roofCoral:materials.roofGold));
  if(i>0&&i%5===0)turbine(g,center(start+50)+35,start+50);
  if(i>=1){
    const q=start+44,lane=(Math.floor(rng(i*17)*3)-1)*6,x=center(q)+lane;
    const type=i%3===0?'ramp':i%7===0?'rock':'star';
    if(type==='ramp')createRamp(g,x,q);
    if(type==='rock')createRock(g,x,q);
    if(type!=='star')objects.push({q,x,type,used:false,group:g});
    // Readable trails reward a chosen line without filling the whole view.
    for(let j=0;j<3;j++){const cq=start+12+j*8,cx=center(cq)+lane,power=j===2&&i%4===0?'boost':'coin',visual=createStar(g,cx,cq,power);visual.scale.setScalar(.6);objects.push({q:cq,x:cx,type:'star',power,visual,used:false,group:g})}
    if(section(start)===2){for(const side of [-1,1]){const px=center(start+40)+side*21;const tower=put(g,box(6,14,6,materials.cabin),px,ground(start+40,side*21)+7,start+40);put(g,new T.Mesh(new T.ConeGeometry(5,6,6),materials.roofPurple),px,tower.position.y+10,start+40);for(let k=-1;k<=1;k++)put(g,box(1,1.6,.2,materials.window),px+k*1.6,tower.position.y+3,start+36.9)}}
  }
  const end=4+LEVELS[runLevel-1].target/4;
  if(end>=start&&end<start+88){const cx=center(end),yy=ground(end,0);for(const side of [-1,1])tube([cx+side*13,yy,end],[cx+side*13,yy+12,end],.25,materials.hot,g);for(let k=0;k<18;k++)for(let j=0;j<2;j++)put(g,box(26/18,1.3,.18,(k+j)%2?materials.white:materials.dark),cx-13+(k+.5)*26/18,yy+11+j*1.3,end);}
  if(i>0&&i%7===3)snowArch(g,start+60);
  batchScenery(g);chunks.set(i,g)
}
function maintainChunks(){const first=Math.max(-1,Math.floor(z/88)-1),lastChunk=Math.floor(z/88)+8;for(let i=first;i<=lastChunk;i++)if(!chunks.has(i))createChunk(i);for(const [i,g] of chunks){if(i<first||i>lastChunk){scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()});chunks.delete(i)}}for(let i=objects.length-1;i>=0;i--)if(!chunks.has(Math.floor(objects[i].q/88)))objects.splice(i,1);for(let i=turbines.length-1;i>=0;i--)if(!turbines[i].group.parent)turbines.splice(i,1)}
function createGate(){const g=new T.Group();scene.add(g);g.position.set(center(7),ground(7,0),7);for(const s of [-1,1]){tube([s*4.4,0,0],[s*4.4,5.2,0],.35,materials.hot,g);put(g,ball(.52,materials.pink),s*4.4,5.1,0);tube([s*4.4,5,0],[s*4.4,3.3,-1.2],.15,materials.white,g)}tube([-4.4,4.45,0],[4.4,4.45,0],.13,materials.pink,g);const arch=box(8.8,.4,.4,materials.white);put(g,arch,0,5.7,0);for(let k=-3;k<=3;k++){let flag=new T.Mesh(new T.ConeGeometry(.38,.9,3),k%2?materials.gold:materials.hot);flag.rotation.z=Math.PI;put(g,flag,k*1.1,5.15,0)}return g}
function makeRider(){
  const g=new T.Group(),sled=new T.Group();g.add(sled);
  const hullGeo=new T.BoxGeometry(2.55,.36,3.85);const v=hullGeo.attributes.position;
  for(let i=0;i<v.count;i++){const zz=v.getZ(i);if(zz>.6)v.setX(i,v.getX(i)*(1-.19*(zz-.6)));if(zz>1.4)v.setY(i,v.getY(i)+.09)}v.needsUpdate=true;hullGeo.computeVertexNormals();
  put(sled,new T.Mesh(hullGeo,materials.red),0,.39,0);
  const nose=put(sled,ball(1,materials.red),0,.43,1.66);nose.scale.set(.96,.19,.49);
  put(sled,box(1.8,.055,2.65,materials.sledPanel),0,.61,.12);
  for(const side of [-1,1]){
    tube([side*1.03,.12,-1.85],[side*1.03,.12,1.82],.12,materials.chrome,sled);
    tube([side*1.03,.12,1.82],[side*.77,.53,2.16],.11,materials.chrome,sled);
    const trim=box(.11,.07,2.65,materials.gold);put(sled,trim,side*1.12,.61,.08);
    const light=box(.32,.11,.13,materials.headlamp);put(sled,light,side*.68,.55,1.95)
  }
  const seat=put(sled,box(1.55,.18,1.4,materials.dark),0,.74,-.38);seat.rotation.x=.07;
  const windshield=new T.Mesh(new T.SphereGeometry(.85,16,8,0,Math.PI*2,0,Math.PI*.55),materials.glass);windshield.scale.set(1,.58,.42);put(sled,windshield,0,.95,1.03);
  tube([-1.0,1.05,.78],[1.0,1.05,.78],.07,materials.chrome,sled);
  const jacket=put(g,ball(.88,materials.jacket),0,1.28,-.36);jacket.scale.set(.77,1.07,.73);
  const belly=put(g,ball(.64,materials.white),0,1.11,.25);belly.scale.set(.8,1.03,.43);
  const head=put(g,ball(.72,materials.fox,18),0,2.28,-.03);head.scale.set(1,.85,.9);
  for(const side of [-1,1]){
    const ear=new T.Mesh(new T.ConeGeometry(.3,.68,8),materials.fox);put(g,ear,side*.47,2.95,-.15);
    const inner=new T.Mesh(new T.ConeGeometry(.15,.37,8),materials.pink);put(g,inner,side*.47,2.92,.08);
    put(g,ball(.105,materials.dark),side*.32,2.34,.62);
    const glove=put(g,ball(.27,materials.fox),side*.72,1.48,.4);glove.scale.set(.8,1.2,.8);
    tube([side*.7,1.3,.48],[side*.62,.97,.95],.13,materials.jacket,g)
  }
  const muzzle=put(g,ball(.29,materials.white),0,2.15,.58);muzzle.scale.set(1.25,.57,.8);
  put(g,ball(.13,materials.dark),0,2.23,.81);
  const scarf=put(g,new T.Mesh(new T.TorusGeometry(.54,.14,8,24),materials.gold),0,1.86,.03);scarf.rotation.x=Math.PI/2;
  const scarfTail=box(.37,.08,1.45,materials.gold);put(g,scarfTail,-.35,1.86,-1.1);scarfTail.rotation.y=-.3;
  const tail=put(g,ball(.48,materials.fox),0,.98,-.96);tail.scale.set(.68,.7,1.46);put(g,ball(.28,materials.white),0,1,-1.6);
  const wingL=new T.Group(),wingR=new T.Group();for(const [side,wing] of [[-1,wingL],[1,wingR]]){
    wing.position.set(side*1.18,.56,-.35);
    const plate=box(1.7,.1,1.48,materials.wing);put(wing,plate,side*.76,0,0);
    put(wing,box(1.56,.05,.18,materials.gold),side*.72,.08,.52);g.add(wing)
  }
  function thruster(parent,x){const unit=new T.Group();unit.position.set(x,.55,-1.68);parent.add(unit);
    const motor=new T.Mesh(new T.CylinderGeometry(.39,.42,1.04,12),materials.chrome);motor.rotation.x=Math.PI/2;unit.add(motor);
    const ring=new T.Mesh(new T.TorusGeometry(.39,.08,8,16),materials.headlamp);ring.position.z=-.58;unit.add(ring);
    const nozzle=new T.Mesh(new T.CylinderGeometry(.31,.25,.2,12),materials.dark);nozzle.rotation.x=Math.PI/2;nozzle.position.z=-.58;unit.add(nozzle);
    const fire=new T.Mesh(new T.ConeGeometry(.32,1.65,10),materials.flame);fire.rotation.x=-Math.PI/2;fire.position.z=-1.37;unit.add(fire);flames.push(fire)
  }
  flames=[];engineSingle=new T.Group();g.add(engineSingle);thruster(engineSingle,0);
  engineDual=new T.Group();g.add(engineDual);thruster(engineDual,-.82);thruster(engineDual,.82);
  wings=[wingL,wingR];g.userData.sled=sled;scene.add(g);return g
}
function setup(){try{
  renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  scene=new T.Scene();scene.background=new T.Color('#91d9f9');scene.fog=new T.Fog('#b3e4f6',240,780);
  camera=new T.PerspectiveCamera(66,innerWidth/innerHeight,.2,900);
  scene.add(new T.HemisphereLight('#fff8e4','#70aaca',2.5));const sun=new T.DirectionalLight('#fff2dc',2.7);sun.position.set(-30,80,70);scene.add(sun);
  Object.assign(materials,{track:new T.MeshStandardMaterial({vertexColors:true,roughness:.24,metalness:.18,side:T.DoubleSide}),terrain:new T.MeshStandardMaterial({vertexColors:true,roughness:.9,side:T.DoubleSide}),trail:new T.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.48}),snow:mat('#f9fdff'),pine:mat('#177e4c'),pine2:mat('#2aac70'),pineBlue:mat('#176f9e'),pineViolet:mat('#7060a8'),wood:mat('#765957'),rock:mat('#879eae'),ice:mat('#91eaff',{metalness:.11,roughness:.25}),white:mat('#ffffff'),ramp:mat('#ffbd31'),rampStripe:mat('#ff7f4f'),hot:mat('#f6638e'),pink:mat('#ff9dc0'),gold:mat('#ffc94d'),red:mat('#eb4750',{roughness:.43}),sledPanel:mat('#ff7253',{roughness:.35}),jacket:mat('#2481a4'),fox:mat('#f6a552'),dark:mat('#173e57'),chrome:mat('#bddce5',{metalness:.67,roughness:.23}),glass:mat('#83e8ef',{transparent:true,opacity:.45,metalness:.2,roughness:.12}),headlamp:new T.MeshBasicMaterial({color:'#93f9ff'}),wing:mat('#39b9d9',{metalness:.3,roughness:.32}),flame:new T.MeshBasicMaterial({color:'#ffb633'}),cabin:mat('#c8855e'),window:new T.MeshBasicMaterial({color:'#ffe58b'}),door:mat('#3d607c'),roofCoral:mat('#ee664e'),roofPurple:mat('#7654bf'),roofGold:mat('#f1aa3d'),flagGold:mat('#ffc850',{side:T.DoubleSide}),flagCoral:mat('#ff724f',{side:T.DoubleSide}),flagViolet:mat('#a171d6',{side:T.DoubleSide}),starGold:mat('#ffd747',{metalness:.24,roughness:.2,emissive:'#ffaf1d',emissiveIntensity:.43,side:T.DoubleSide}),starBlue:mat('#6feaff',{metalness:.24,roughness:.2,emissive:'#2ac4ef',emissiveIntensity:.43,side:T.DoubleSide}),starPink:mat('#ff81c5',{metalness:.24,roughness:.2,emissive:'#ea359c',emissiveIntensity:.43,side:T.DoubleSide}),starRing:new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.62,side:T.DoubleSide})});
  // The distant peaks stay outside the playable corridor and move with the vista.
  for(let k=0;k<8;k++){const peak=new T.Group(),body=new T.Mesh(new T.ConeGeometry(30+rng(k)*17,60+rng(k+9)*38,5),mat(k%2?'#77aecb':'#8bbfd8'));peak.add(body);const cap=new T.Mesh(new T.ConeGeometry(13+rng(k)*8,15,5),materials.snow);cap.position.y=body.geometry.parameters.height*.42;peak.add(cap);scene.add(peak);mountains.push(peak)}
  skyGroup=new T.Group();const sunDisc=new T.Mesh(new T.SphereGeometry(18,16,12),new T.MeshBasicMaterial({color:'#fff0be'}));skyGroup.add(sunDisc);for(let i=0;i<6;i++){const puff=ball(1,new T.MeshBasicMaterial({color:'#effbff',transparent:true,opacity:.75}));puff.scale.set(11+rng(i)*9,2.1+rng(i+4)*2,4);puff.position.set((i-2.5)*25,6+(i%2)*4,-8);skyGroup.add(puff)}scene.add(skyGroup);
  const sprayPositions=new Float32Array(48*3);const sprayGeo=new T.BufferGeometry();sprayGeo.setAttribute('position',new T.BufferAttribute(sprayPositions,3));particles=new T.Points(sprayGeo,new T.PointsMaterial({color:'#faffff',size:.45,transparent:true,opacity:.84,depthWrite:false}));scene.add(particles);
  const snowGeo=new T.BufferGeometry();snowGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(140*3),3));snowfall=new T.Points(snowGeo,new T.PointsMaterial({color:'#ffffff',size:.16,transparent:true,opacity:.7,depthWrite:false}));scene.add(snowfall);
  shadow=new T.Mesh(new T.CircleGeometry(1,24),new T.MeshBasicMaterial({color:'#1c5275',transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  gate=createGate();elastic=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#ff5476'}));scene.add(elastic);rider=makeRider();applyUpgrades();applyLevelLook();maintainChunks();updateLevelUI();resize();requestAnimationFrame(frame);
} catch(e){console.error(e);$('error').hidden=false}}
function resize(){if(!renderer)return;camera.position.set(center(z)+lateral,ground(z,lateral)+10+air,z-18);renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=innerHeight>innerWidth?73:62;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);if(window.visualViewport)window.visualViewport.addEventListener('resize',resize);
function applyLevelLook(){const dusk=runLevel===2;scene.background.set(dusk?'#72b7df':'#91d9f9');scene.fog.color.set(dusk?'#a9cde9':'#b3e4f6');skyGroup.children[0].material.color.set(dusk?'#dff3ff':'#fff0be');for(let k=0;k<mountains.length;k++)mountains[k].children[0].material.color.set(dusk?(k%2?'#7c89bc':'#779dc5'):(k%2?'#79b4d2':'#91c7dc'))}
function updateLevelUI(){const index=save.level-1,level=LEVELS[index],meters=Math.floor(save.levelMeters[index]);$('levelName').textContent='Level '+save.level+' · '+level.name;$('levelMeters').textContent=save.levelTwoComplete?'Both levels cleared · replay freely':meters.toLocaleString()+' / '+level.target.toLocaleString()+' m total';$('levelFill').style.width=Math.min(100,meters/level.target*100)+'%'}
function addLevelDistance(meters){if(save.levelTwoComplete)return 'Both levels cleared · replay freely';let left=Math.max(0,meters),cleared='';while(left>0){const index=save.level-1,need=LEVELS[index].target-save.levelMeters[index],applied=Math.min(left,need);save.levelMeters[index]+=applied;left-=applied;if(save.levelMeters[index]<LEVELS[index].target)break;if(save.level===1){cleared='Level 1 clear! Aurora Pass unlocked.';save.level=2}else{save.levelTwoComplete=true;cleared='Level 2 clear! Both courses complete.';break}}return cleared||'Level '+save.level+': '+Math.floor(save.levelMeters[save.level-1]).toLocaleString()+' / '+LEVELS[save.level-1].target.toLocaleString()+' m'}
function updateHud(){$('dist').textContent=Math.max(0,Math.floor(meters()))+' m';$('speed').textContent=Math.round(speed*2.237)+' mph';$('stars').textContent='★ '+stars;$('life').textContent=(mode==='endless'?'♥ '+hearts:'Best '+Math.floor(save.bestLaunch)+' m')+(shieldTime>0?' 🛡':'');$('boostCount').textContent=boostCharges;$('courseFill').style.height=Math.min(100,meters()/LEVELS[runLevel-1].target*100)+'%';$('airtime').textContent=air>1?'AIR TIME '+airborneTime.toFixed(1)+'s':'';$('jump').disabled=air<2||flipping;const status=$('powerup');status.hidden=!(shieldTime>0||surgeTime>0);status.textContent=shieldTime>0?'🛡 SHIELD '+Math.ceil(shieldTime)+'s':'✦ STAR SURGE '+Math.ceil(surgeTime)+'s'}
function display(id){for(const key of ['menu','paused','result','help'])$(key).hidden=key!==id}
function applyUpgrades(){const gl=save.up.glide;wings[0].visible=wings[1].visible=gl>0;engineSingle.visible=save.up.rocket<3;engineDual.visible=save.up.rocket>=3;for(const f of flames)f.visible=false;$('rocketLabel').textContent=save.up.rocket>=3?'Dual Thrusters':'Rocket'}
function reset(m){mode=m;phase='ready';z=4;lateral=target=0;speed=air=vy=stars=shieldTime=surgeTime=invuln=boostTime=jumpCooldown=hitFlash=0;hearts=3;boostCharges=1+Math.floor(save.up.rocket/4);introT=0;worldY=ground(4,0);verticalSpeed=0;airborneTime=totalAir=runReward=flipAngle=0;flipping=false;finishReason='';landingPulse=launchPulse=0;lastSection=-1;runId++;runLevel=save.level;for(const [i,g] of chunks){scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()})}chunks.clear();objects.length=0;turbines.length=0;applyLevelLook();maintainChunks();applyUpgrades();updateLevelUI();gate.visible=true;display('');$('ready').hidden=false;$('pullGuide').hidden=m!=='launch';$('readyTitle').textContent=m==='launch'?'Pull back to launch':'Ready to ride?';$('readyText').textContent=m==='launch'?'Level '+runLevel+' · '+LEVELS[runLevel-1].name+' — drag down and release, or tap Launch.':'Level '+runLevel+' · '+LEVELS[runLevel-1].name+' — dodge, jump and boost downhill.';$('powerBox').hidden=m!=='launch';$('go').textContent=m==='launch'?'Launch':'Start riding';$('pause').hidden=true;$('jump').hidden=true;$('boost').hidden=true;updateHud()}
function begin(){if(phase!=='ready')return;phase='running';launchPulse=1;$('ready').hidden=true;$('pullGuide').hidden=true;$('pause').hidden=false;$('exit').hidden=true;$('jump').hidden=false;$('boost').hidden=false;$('steerHint').hidden=false;speed=mode==='launch'?(57+save.up.launch*3.4)*(.45+power*.0055):55;air=0;worldY=ground(z,lateral);verticalSpeed=slope(z)*speed;gate.visible=true;tone(560,.22,'sawtooth',.11);setTimeout(()=>{if(phase==='running')$('steerHint').hidden=true},3000);last=performance.now()}
function finish(){if(phase!=='running')return;phase='result';$('pause').hidden=true;$('jump').hidden=true;$('boost').hidden=true;$('steerHint').hidden=true;$('powerup').hidden=true;const dist=Math.floor(meters()),key=mode==='launch'?'bestLaunch':'bestEndless',record=dist>save[key];save[key]=Math.max(save[key],dist);if(mode==='launch')save.tokens+=1+Math.floor(stars/12)+Math.floor(totalAir/12);const levelMessage=addLevelDistance(dist);persist();updateLevelUI();$('levelResult').textContent=levelMessage;$('resultLabel').textContent=mode==='launch'?'Launch & Glide':'Endless Ride';$('resultTitle').textContent=levelMessage.includes('clear!')?'Level cleared!':finishReason|| (record?'New best!':'Run complete');$('resultDistance').textContent=dist+' m';$('resultDetail').textContent=(record?'Personal record · ':'')+stars+' stars · '+Math.floor(totalAir)+'s air time · best '+Math.floor(save[key])+' m';$('upgradeBox').hidden=mode!=='launch';refreshUpgrade();display('result');tone(720,.28)}
function refreshUpgrade(){$('upgradePrompt').textContent=save.tokens?'Choose an upgrade · '+save.tokens+' available':'All upgrades used for now';for(const key of Object.keys(save.up)){$(key+'Level').textContent=save.up[key]+'/12';document.querySelector('[data-up="'+key+'"]').disabled=!save.tokens||save.up[key]>=12}}
function upgrade(key){if(!save.tokens||save.up[key]>=12)return;save.tokens--;save.up[key]++;persist();refreshUpgrade();applyUpgrades();notice(key[0].toUpperCase()+key.slice(1)+' upgraded');tone(870,.18)}
function jump(){if(phase!=='running'||air<2||flipping)return;flipping=true;flipAngle=0;tone(510,.14)}
function boost(){if(phase!=='running'||boostCharges<1||boostTime>0)return;boostCharges--;boostTime=1.5+save.up.rocket*.12;speed+=11+save.up.rocket*1.6+(save.up.rocket>=3?5:0);if(air>0)verticalSpeed+=3;notice(save.up.rocket>=3?'Dual thrusters!':'Rocket boost!');tone(210,.45,'sawtooth',.1);updateHud()}
function pause(){if(phase!=='running')return;phase='paused';pointer=false;$('pauseStats').textContent=Math.floor(meters())+' m · '+Math.round(speed*2.237)+' mph';$('jump').hidden=true;$('boost').hidden=true;display('paused')}
function resume(){phase='running';display('');$('jump').hidden=false;$('boost').hidden=false;last=performance.now()}
function back(){phase='menu';$('exit').hidden=false;$('ready').hidden=true;$('pullGuide').hidden=true;$('pause').hidden=true;$('jump').hidden=true;$('boost').hidden=true;$('steerHint').hidden=true;display('menu');updateHud()}
function help(){beforeHelp=phase;display('help')}
function closeHelp(){display(beforeHelp==='menu'?'menu':beforeHelp==='paused'?'paused':beforeHelp==='result'?'result':'')}
function simulate(dt){clock+=dt;hitFlash=Math.max(0,hitFlash-dt*3);if(phase!=='running')return;
 const oldZ=z,oldGround=ground(z,lateral),wasAir=air>.1;
 target=clamp(target,-13,13);lateral=lerp(lateral,target,1-Math.exp(-dt*(4+save.up.steer*.25)));
 const grade=slope(z),drag=air>.1?.6:3.0;
 speed=clamp(speed+(-grade*17-drag-speed*speed*.00016+save.up.glide*.022)*dt,0,100);
 if(mode==='endless')speed=Math.max(speed,43);
 if(boostTime>0){boostTime=Math.max(0,boostTime-dt);speed=Math.min(110,speed+dt*(13+save.up.rocket*.7))}
 z+=speed*dt;const floor=ground(z,lateral);
 if(!wasAir){verticalSpeed=grade*speed;worldY=oldGround;}
 verticalSpeed-=(save.up.glide?9.5-save.up.glide*.25:11)*dt;worldY+=verticalSpeed*dt;
 if(worldY<=floor){worldY=floor;verticalSpeed=slope(z)*speed;
   if(wasAir){landingPulse=Math.min(1,airborneTime/2);if(flipping&&flipAngle<Math.PI*1.85){speed*=.8;notice('Rough landing')}else if(flipping){stars+=3;notice('Clean flip! +3 stars')}else if(airborneTime>.8){notice('Smooth landing · '+airborneTime.toFixed(1)+'s air')}
   airborneTime=0;flipping=false;flipAngle=0;tone(160,.08,'triangle',.03)}
 }else if(worldY-floor>.1){airborneTime+=dt;totalAir+=dt;}
 air=Math.max(0,worldY-floor);
 if(flipping)flipAngle=Math.min(Math.PI*2,flipAngle+dt*4.8);
 invuln=Math.max(0,invuln-dt);
 for(const o of objects){if(o.used||o.q>z+2||o.q<oldZ-2)continue;if(Math.abs(o.x-(center(o.q)+lateral))>2.6)continue;
  if(o.type==='star'&&air<3){o.used=true;o.visual.visible=false;stars++;tone(920,.08);if(o.power==='boost'){boostCharges=Math.min(5,boostCharges+1);notice('Rocket refilled')}}
  if(o.type==='ramp'&&air<1.2){o.used=true;verticalSpeed=Math.max(8,speed*.24);worldY=floor+.3;air=.3;tone(470,.15)}
  if(o.type==='rock'&&air<1.6&&invuln<=0){o.used=true;speed*=.45+save.up.armor*.02;invuln=1;notice('Impact — momentum lost');tone(100,.2,'triangle');if(mode==='endless'){hearts--;if(hearts<=0){finishReason='Run complete';finish();return}}}
 }
 if(Math.abs(lateral)>12&&air<3&&invuln<=0){speed*=.65;target*=.85;invuln=1;notice('Snowbank!');tone(130,.15)}
 maintainChunks();
 const currentSection=Math.floor(z/310);if(currentSection!==lastSection){lastSection=currentSection;if(z>30)notice(['Pine Valley','Crystal Gardens','Castle Ridge'][section(z)]);}
 if(mode==='launch'&&meters()>=LEVELS[runLevel-1].target){finishReason='Finish line reached!';finish();return}
 if(mode==='launch'&&speed<3&&z>12){finishReason='Out of momentum';finish();return}
 hudTimer+=dt;if(hudTimer>.1){updateHud();hudTimer=0}
}
function render(dt){if(!renderer)return;introT+=dt;landingPulse=Math.max(0,landingPulse-dt*2);launchPulse=Math.max(0,launchPulse-dt*1.2);const x=center(z)+lateral,level=ground(z,lateral);rider.position.set(x,level+.1+air-landingPulse*.13,z-(phase==='ready'&&pull?Math.min(2.2,pull.amount/100):0));rider.rotation.z=lerp(rider.rotation.z,(target-lateral)*-.055,Math.min(1,dt*6));rider.rotation.y=lerp(rider.rotation.y,(center(z+6)-center(z))*.018+(target-lateral)*.04,Math.min(1,dt*5));rider.rotation.x=flipping?-flipAngle:lerp(rider.rotation.x,(air>1?clamp(-verticalSpeed*.012,-.35,.25):-Math.atan(slope(z))),1-Math.exp(-dt*9));
  for(const o of objects)if(o.type==='star'&&!o.used){o.visual.rotation.y+=dt*1.6;o.visual.position.y=ground(o.q,o.x-center(o.q))+1.22+Math.sin(clock*3+o.q)*.12}
  for(let k=0;k<mountains.length;k++){const side=k%2?-1:1,step=Math.floor(k/2),q=z+330+step*29,peak=mountains[k];peak.position.set(center(q)+side*(95+step*42),base(q)+peak.children[0].geometry.parameters.height*.45-4,q)}
  skyGroup.position.set(center(z+330)+80,base(z+330)+105,z+330);
  shadow.position.set(x,level+.2,z);shadow.rotation.x=-Math.PI/2-Math.atan(slope(z));shadow.scale.set(1.5+air*.035,2.2+air*.025,1);shadow.material.opacity=Math.max(.04,.23-air*.004);
  const snowPos=snowfall.geometry.attributes.position;for(let i=0;i<140;i++){const sx=(rng(i*3)*2-1)*40,sz=(rng(i*3+1)*125+z*.4)%125-25,sy=(rng(i*3+2)*38-clock*2)%38;snowPos.setXYZ(i,x+sx,level+4+(sy+38)%38,z+sz);}snowPos.needsUpdate=true;
  const p=particles.geometry.attributes.position,active=phase==='running'?clamp(speed/75,.35,1):0;for(let i=0;i<48;i++){const back=(i/48*12+clock*(16+speed*.27))%12,side=(rng(i+7)*2-1)*(1+back*.17),yy=ground(z-back,lateral)+.1+rng(i+33)*.75*active;p.setXYZ(i,x+side,yy,z-back)}p.needsUpdate=true;particles.visible=phase==='running'&&(air<1.5||landingPulse>.1);particles.material.size=.35+landingPulse*.5;
  for(const entry of turbines)entry.rotor.rotation.z+=dt*.7;
  const wingAngle=air>1?-.15:.18;wings[0].rotation.z=lerp(wings[0].rotation.z,wingAngle,Math.min(1,dt*7));wings[1].rotation.z=-wings[0].rotation.z;
  for(const f of flames){f.visible=boostTime>0;f.scale.set(1+Math.sin(clock*38)*.12,1+Math.sin(clock*31)*.24,1)}
  gate.visible=z<22;
  elastic.visible=phase==='ready';if(elastic.visible){const e=elastic.geometry.attributes.position,yy=ground(7,0);e.setXYZ(0,center(7)-4.4,yy+4.4,7);e.setXYZ(1,rider.position.x,rider.position.y+1,rider.position.z-1.8);e.setXYZ(2,center(7)+4.4,yy+4.4,7);e.needsUpdate=true;elastic.geometry.computeBoundingSphere();}
  const portrait=innerHeight>innerWidth,back=portrait?17:21,high=portrait?9.5:11,look=portrait?39:48;
  const desired=new T.Vector3(x+(center(z-back)-center(z))*.25,Math.max(level+high+air*.85,ground(z-back,lateral)+3),z-back);
  camera.position.lerp(desired,1-Math.exp(-dt*(phase==='menu'||phase==='ready'?2.7:5.5)));
  camera.lookAt(center(z+look)+lateral*.36,lerp(level,ground(z+look,0),.55)+2+air*.7,z+look);
  camera.fov=lerp(camera.fov,(portrait?65:59)+Math.min(10,speed*.1)+launchPulse*3,1-Math.exp(-dt*3));camera.updateProjectionMatrix();
  renderer.render(scene,camera);
}
let dragging=false,dragStartY=0,lastPointerX=0;
canvas.addEventListener('pointerdown',e=>{if(phase==='ready'&&mode==='launch'){dragging=true;dragStartY=e.clientY;pull={amount:0};canvas.setPointerCapture(e.pointerId)}else if(phase==='running'){pointer=true;lastPointerX=e.clientX;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointermove',e=>{if(dragging&&phase==='ready'){pull.amount=Math.max(0,e.clientY-dragStartY);power=clamp(Math.round(35+pull.amount*.38),35,100);$('power').value=power;$('powerValue').textContent=power+'%'}else if(pointer&&phase==='running'){const dx=e.clientX-lastPointerX;lastPointerX=e.clientX;target=clamp(target-dx/innerWidth*23,-7.1,7.1)}});
canvas.addEventListener('pointerup',e=>{if(dragging&&pull?.amount>22)begin();dragging=false;pull=null;pointer=false});canvas.addEventListener('pointercancel',()=>{dragging=false;pull=null;pointer=false});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){phase==='running'?pause():phase==='paused'?resume():null;return}if(phase!=='running')return;if(['ArrowLeft','a','A'].includes(e.key)){target+=1.8;e.preventDefault()}if(['ArrowRight','d','D'].includes(e.key)){target-=1.8;e.preventDefault()}if(e.key===' '){jump();e.preventDefault()}if(['b','B'].includes(e.key))boost()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='running')pause()});
function bind(id,fn){$(id).addEventListener('click',fn)}
bind('garage',()=>{phase='result';$('resultLabel').textContent='Sled workshop';$('resultTitle').textContent='Your garage';$('resultDistance').textContent='';$('resultDetail').textContent='Permanent upgrades · saved automatically';$('levelResult').textContent='';$('upgradeBox').hidden=false;refreshUpgrade();display('result')});bind('launchMode',()=>reset('launch'));bind('endlessMode',()=>reset('endless'));bind('go',begin);bind('readyBack',back);bind('menuHelp',help);bind('pauseHelp',help);bind('closeHelp',closeHelp);bind('pause',pause);bind('resume',resume);bind('jump',jump);bind('boost',boost);for(const id of ['exit','menuExit','pauseExit'])bind(id,()=>{persist();location.href='../../index.html'});bind('resultBack',back);bind('retry',()=>reset(mode));
$('power').addEventListener('input',e=>{power=Number(e.target.value);$('powerValue').textContent=power+'%'});
for(const button of document.querySelectorAll('[data-up]'))button.addEventListener('click',()=>upgrade(button.dataset.up));
bind('sound',()=>{soundOn=!soundOn;$('sound').textContent=soundOn?'Sound':'Muted';try{localStorage.setItem('goobs.snowbound.sound',soundOn?'on':'off')}catch{}});$('sound').textContent=soundOn?'Sound':'Muted';
function frame(t){const dt=Math.min(.08,(t-last)/1000||0);last=t;let remaining=dt;while(remaining>0){const step=Math.min(remaining,1/120);simulate(step);remaining-=step}render(dt);requestAnimationFrame(frame)}
setup();
window.__snowbound={reset,begin,simulate,finish,state:()=>({phase,mode,dist:meters(),speed,hearts,air,boostCharges,lateral,target,up:save.up})};
