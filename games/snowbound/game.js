import * as T from '../../shared/three.module.min.js';

const $ = id => document.getElementById(id);
const canvas = $('game');
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,t) => a+(b-a)*t;
const STORE = 'goobs.snowbound.v1';
let save = {bestLaunch:0,bestEndless:0,tokens:0,up:{launch:0,glide:0,rocket:0,steer:0,armor:0}};
try {
  const prior = JSON.parse(localStorage.getItem(STORE)||'null');
  if (prior && typeof prior === 'object') {
    save.bestLaunch = Number(prior.bestLaunch)||0;
    save.bestEndless = Number(prior.bestEndless)||0;
    save.tokens = Math.max(0, Number(prior.tokens)||0);
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
let scene,camera,renderer,rider,wings,flame,gate,particles,skyGroup;
const chunks=new Map(), objects=[], materials={}, turbines=[], mountains=[];
let mode='launch', phase='menu', beforeHelp='menu', z=4, lateral=0, target=0, speed=0, air=0, vy=0, hearts=3, flakes=0, invuln=0, boostTime=0, boostCharges=1, jumpCooldown=0, hitFlash=0, power=85, pull=null, pointer=false, last=0, clock=0, runId=0, introT=0;
let noticeTimer;
function notice(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('toast').classList.remove('show'),1450)}
function rng(n){const v=Math.sin(n*127.1+64.7)*43758.5453;return v-Math.floor(v)}
function center(q){return Math.sin(q*.012)*3.8+Math.sin(q*.004+1)*4.2}
function base(q){return 13-q*.115+Math.sin(q*.025)*1.8+Math.sin(q*.061)*.42}
function ground(q,offset=0){const edge=Math.max(0,Math.abs(offset)-8);return base(q)+edge*edge*.009+Math.sin(q*.074+offset*.13)*Math.min(edge*.025,.25)}
function mat(color,opts={}){return new T.MeshStandardMaterial({color,roughness:.73,metalness:.02,...opts})}
function box(w,h,d,m){return new T.Mesh(new T.BoxGeometry(w,h,d),m)}
function ball(r,m,segments=14){return new T.Mesh(new T.SphereGeometry(r,segments,10),m)}
function tube(a,b,r,m,parent){const va=new T.Vector3(...a),vb=new T.Vector3(...b),dir=vb.clone().sub(va);const mesh=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),8),m);mesh.position.copy(va.add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());parent.add(mesh);return mesh}
function put(parent,mesh,x,y,z,scale=1){mesh.position.set(x,y,z);mesh.scale.setScalar(scale);parent.add(mesh);return mesh}
function pine(parent,x,z,s=1){const y=ground(z,x-center(z));const g=new T.Group();g.position.set(x,y,z);parent.add(g);const trunk=box(.52*s,2*s,.52*s,materials.wood);put(g,trunk,0,1*s,0);for(let k=0;k<3;k++){const c=new T.Mesh(new T.ConeGeometry((1.32-k*.19)*s,2.45*s,7),k===1?materials.pine2:materials.pine);put(g,c,0,(1.25+k*.83)*s,0);const snow=new T.Mesh(new T.ConeGeometry((.98-k*.13)*s,.67*s,7),materials.snow);put(g,snow,0,(2.27+k*.83)*s,0)}return g}
function makeMesh(start,len,track=false){const offsets=track?[-9,-8,-6,0,6,8,9]:[-55,-38,-24,-15,-9,-6,0,6,9,15,24,38,55],steps=Math.ceil(len/4),v=[],colors=[],idx=[];
  const palette=track?['#ecfbff','#a8e6fa','#d5f5ff','#edfaff','#d5f5ff','#a8e6fa','#ecfbff']:['#c1e8f2','#d5eff7','#e9f8fb','#fbffff','#e4f7fa','#e2f6fa','#e8f9fc','#e2f6fa','#e4f7fa','#fbffff','#e9f8fb','#d5eff7','#c1e8f2'];
  for(let i=0;i<=steps;i++){let zz=start+len*i/steps;for(let j=0;j<offsets.length;j++){const off=offsets[j];v.push(center(zz)+off,ground(zz,off)+(track?.08:0),zz);const c=new T.Color(palette[j]);colors.push(c.r,c.g,c.b)}}
  for(let i=0;i<steps;i++)for(let j=0;j<offsets.length-1;j++){const a=i*offsets.length+j,b=a+1,c=a+offsets.length,d=c+1;idx.push(a,c,b,b,c,d)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();return new T.Mesh(geo,materials.terrain)
}
function trailMarks(start,len){const v=[];for(let q=Math.ceil(start/6)*6;q<start+len;q+=6){const c=center(q),y=ground(q,0)+.13;for(const side of [-1,1])v.push(c+side*1.4,y,q-1.65,c+side*1.4,y,q+1.65)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));return new T.LineSegments(geo,materials.trail)}
function createRamp(group,x,q){const g=new T.Group();g.position.set(x,ground(q,x-center(q)),q);group.add(g);const deck=box(6.3,.42,4.7,materials.ramp);deck.rotation.x=-.17;put(g,deck,0,.48,0);for(let k=-1;k<=1;k++){const stripe=box(.52,.04,4.2,materials.rampStripe);stripe.rotation.x=-.17;put(g,stripe,k*1.9,.76,0)}const flag=box(6.7,.32,.2,materials.rampStripe);put(g,flag,0,.52,-2.3);return g}
function createRock(group,x,q){const y=ground(q,x-center(q));const rock=put(group,new T.Mesh(new T.DodecahedronGeometry(1.1,0),materials.rock),x,y+.7,q);rock.scale.set(1.15,.75,1);return rock}
function createCrystal(group,x,q){const y=ground(q,x-center(q));const g=new T.Group();g.position.set(x,y+1.8,q);group.add(g);const gem=put(g,new T.Mesh(new T.OctahedronGeometry(.78),materials.crystal),0,0,0);gem.rotation.z=.28;put(g,ball(.18,materials.white),0,.7,0);return g}
function iceSpire(group,x,q,s=1){const y=ground(q,x-center(q));const g=new T.Group();g.position.set(x,y,q);group.add(g);for(let k=0;k<3;k++){const shard=new T.Mesh(new T.ConeGeometry((.6+k*.15)*s,(2.2+k*.5)*s,5),materials.ice);shard.position.set((k-1)*.65*s,(1.1+k*.25)*s,(k-1)*.4*s);shard.rotation.z=(k-1)*.16;g.add(shard)}return g}
function turbine(group,x,q){const y=ground(q,x-center(q));const g=new T.Group();g.position.set(x,y,q);group.add(g);tube([0,0,0],[0,17,0],.36,materials.white,g);const hub=put(g,ball(.65,materials.chrome),0,17,0);const rotor=new T.Group();rotor.position.set(0,17,.65);g.add(rotor);for(let k=0;k<3;k++){const arm=box(.48,6.4,.17,materials.white);arm.position.set(0,3.5,0);const blade=new T.Group();blade.rotation.z=k*Math.PI*2/3;blade.add(arm);rotor.add(blade)}turbines.push({rotor,group});return g}
function createChunk(i){const g=new T.Group(),start=i*88;g.add(makeMesh(start,88));g.add(makeMesh(start,88,true));g.add(trailMarks(start,88));scene.add(g);
  for(let k=0;k<10;k++){const q=start+3+k*8.6;for(const side of [-1,1]){const n=i*140+k*7+(side+1);const x=center(q)+side*(14+rng(n)*29);pine(g,x,q,.8+rng(n+4)*1.4);if(rng(n+10)>.68)pine(g,x+side*3,q+4,.55+rng(n+5)*.6);if(k===3&&i>0)iceSpire(g,center(q)+side*11.8,q,.8+rng(n+11)*.9)}}
  if(i>0&&i%3===0)turbine(g,center(start+50)+35,start+50);
  if(i>=1){const q=start+26+rng(i*12)*32, lane=(Math.floor(rng(i*17)*3)-1)*5.2,x=center(q)+lane;let type=i%5===0?'ramp':i%4===0?'rock':i%7===0?'tree':'flake';if(type==='ramp')createRamp(g,x,q);if(type==='rock')createRock(g,x,q);if(type==='tree')pine(g,x,q,1.1);if(type==='flake')createCrystal(g,x,q);objects.push({q,x,type,used:false,group:g});
    const cq=start+70,cx=center(cq)+(rng(i*23)-.5)*9;createCrystal(g,cx,cq);objects.push({q:cq,x:cx,type:'flake',used:false,group:g})}
  chunks.set(i,g)
}
function maintainChunks(){const first=Math.max(-1,Math.floor(z/88)-1),lastChunk=Math.floor(z/88)+6;for(let i=first;i<=lastChunk;i++)if(!chunks.has(i))createChunk(i);for(const [i,g] of chunks){if(i<first||i>lastChunk){scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()});chunks.delete(i)}}for(let i=objects.length-1;i>=0;i--)if(!chunks.has(Math.floor(objects[i].q/88)))objects.splice(i,1);for(let i=turbines.length-1;i>=0;i--)if(!turbines[i].group.parent?.parent)turbines.splice(i,1)}
function createGate(){const g=new T.Group();scene.add(g);g.position.set(center(7),ground(7,0),7);for(const s of [-1,1]){tube([s*4.4,0,0],[s*4.4,5.2,0],.35,materials.hot,g);put(g,ball(.52,materials.pink),s*4.4,5.1,0);tube([s*4.4,5,0],[s*4.4,3.3,-1.2],.15,materials.white,g)}tube([-4.4,4.45,0],[4.4,4.45,0],.13,materials.pink,g);const arch=box(8.8,.4,.4,materials.white);put(g,arch,0,5.7,0);for(let k=-3;k<=3;k++){let flag=new T.Mesh(new T.ConeGeometry(.38,.9,3),k%2?materials.gold:materials.hot);flag.rotation.z=Math.PI;put(g,flag,k*1.1,5.15,0)}return g}
function makeRider(){const g=new T.Group(),sled=new T.Group();g.add(sled);const baseBoard=box(2.3,.28,3.5,materials.red);put(sled,baseBoard,0,.34,0);const nose=put(sled,ball(1,materials.red),0,.34,1.38);nose.scale.set(1.1,.16,.55);for(const s of [-1,1]){tube([s*.85,.13,-1.5],[s*.85,.13,1.62],.12,materials.chrome,sled);tube([s*.85,.13,1.6],[s*.65,.5,1.98],.11,materials.chrome,sled)}
  const body=put(g,ball(.95,materials.fox),0,1.13,-.25);body.scale.set(.78,1.12,.7);const belly=put(g,ball(.63,materials.white),0,1.03,.3);belly.scale.set(.8,1.05,.4);const head=put(g,ball(.73,materials.fox),0,2.27,.05);head.scale.set(1,.85,.88);for(const s of [-1,1]){const ear=new T.Mesh(new T.ConeGeometry(.29,.64,6),materials.fox);put(g,ear,s*.46,2.92,-.13);put(g,ball(.1,materials.dark),s*.31,2.37,.61);const arm=put(g,ball(.27,materials.fox),s*.74,1.48,.4);arm.scale.set(.8,1.4,.8);tube([s*.73,1.28,.48],[s*.63,.83,1.03],.12,materials.dark,g)}
  put(g,ball(.16,materials.dark),0,2.19,.68);const scarf=put(g,new T.Mesh(new T.TorusGeometry(.54,.14,8,20),materials.gold),0,1.85,.05);scarf.rotation.x=Math.PI/2;const tail=put(g,ball(.48,materials.fox),0,.94,-.93);tail.scale.set(.65,.72,1.45);put(g,ball(.27,materials.white),0,.98,-1.57);
  const wingL=new T.Group(),wingR=new T.Group();for(const [s,wing] of [[-1,wingL],[1,wingR]]){wing.position.set(s*1.1,.53,-.2);const plate=box(1.65,.09,1.45,materials.wing);put(wing,plate,s*.72,0,0);const trim=box(1.65,.06,.18,materials.gold);put(wing,trim,s*.72,.07,.54);g.add(wing)}
  const engine=new T.Group();engine.position.set(0,.55,-1.68);put(engine,new T.Mesh(new T.CylinderGeometry(.46,.35,1.12,12),materials.chrome),0,0,0).rotation.x=Math.PI/2;const nozzle=new T.Mesh(new T.CylinderGeometry(.39,.3,.22,12),materials.dark);nozzle.rotation.x=Math.PI/2;put(engine,nozzle,0,0,-.55);const fire=new T.Mesh(new T.ConeGeometry(.33,1.65,8),materials.flame);fire.rotation.x=-Math.PI/2;put(engine,fire,0,0,-1.2);g.add(engine);flame=fire;wings=[wingL,wingR];g.userData.engine=engine;g.userData.sled=sled;scene.add(g);return g}
function setup(){try{
  renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.42;
  scene=new T.Scene();scene.background=new T.Color('#91d9f9');scene.fog=new T.Fog('#b3e4f6',185,650);
  camera=new T.PerspectiveCamera(66,innerWidth/innerHeight,.2,900);
  scene.add(new T.HemisphereLight('#fff8e4','#70aaca',2.5));const sun=new T.DirectionalLight('#fff2dc',2.7);sun.position.set(-30,80,70);scene.add(sun);
  Object.assign(materials,{terrain:new T.MeshStandardMaterial({vertexColors:true,roughness:.9,side:T.DoubleSide}),trail:new T.LineBasicMaterial({color:'#61bad5',transparent:true,opacity:.45}),snow:mat('#f9fdff'),pine:mat('#128d96'),pine2:mat('#0c6d8d'),wood:mat('#765957'),rock:mat('#879eae'),ice:mat('#91eaff',{metalness:.11,roughness:.25}),crystal:mat('#8dfff5',{emissive:'#22a1ab',emissiveIntensity:.38,metalness:.12}),white:mat('#ffffff'),ramp:mat('#ffbd31'),rampStripe:mat('#ff7f4f'),hot:mat('#f6638e'),pink:mat('#ff9dc0'),gold:mat('#ffc94d'),red:mat('#eb4750',{roughness:.43}),fox:mat('#f6a552'),dark:mat('#173e57'),chrome:mat('#bddce5',{metalness:.67,roughness:.23}),wing:mat('#39b9d9',{metalness:.3,roughness:.32}),flame:new T.MeshBasicMaterial({color:'#ffb633'})});
  // The distant peaks stay outside the playable corridor and move with the vista.
  for(let k=0;k<8;k++){const peak=new T.Group(),body=new T.Mesh(new T.ConeGeometry(30+rng(k)*17,60+rng(k+9)*38,5),mat(k%2?'#77aecb':'#8bbfd8'));peak.add(body);const cap=new T.Mesh(new T.ConeGeometry(13+rng(k)*8,15,5),materials.snow);cap.position.y=body.geometry.parameters.height*.42;peak.add(cap);scene.add(peak);mountains.push(peak)}
  skyGroup=new T.Group();const sunDisc=new T.Mesh(new T.SphereGeometry(18,16,12),new T.MeshBasicMaterial({color:'#fff0be'}));skyGroup.add(sunDisc);for(let i=0;i<6;i++){const puff=ball(1,new T.MeshBasicMaterial({color:'#effbff',transparent:true,opacity:.75}));puff.scale.set(11+rng(i)*9,2.1+rng(i+4)*2,4);puff.position.set((i-2.5)*25,6+(i%2)*4,-8);skyGroup.add(puff)}scene.add(skyGroup);
  const sprayPositions=new Float32Array(48*3);const sprayGeo=new T.BufferGeometry();sprayGeo.setAttribute('position',new T.BufferAttribute(sprayPositions,3));particles=new T.Points(sprayGeo,new T.PointsMaterial({color:'#faffff',size:.45,transparent:true,opacity:.84,depthWrite:false}));scene.add(particles);
  gate=createGate();rider=makeRider();maintainChunks();resize();requestAnimationFrame(frame);
} catch(e){console.error(e);$('error').hidden=false}}
function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=innerHeight>innerWidth?73:62;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);
function updateHud(){$('dist').textContent=Math.max(0,Math.floor(z-4))+' m';$('speed').textContent=Math.round(speed*2.237)+' mph';$('life').textContent=mode==='endless'?'♥ '+hearts:'Best '+Math.floor(save.bestLaunch)+' m';$('boostCount').textContent=boostCharges}
function display(id){for(const key of ['menu','paused','result','help'])$(key).hidden=key!==id}
function applyUpgrades(){const gl=save.up.glide;wings[0].visible=wings[1].visible=gl>0;rider.userData.engine.visible=true;flame.visible=false}
function reset(m){mode=m;phase='ready';z=4;lateral=target=0;speed=air=vy=flakes=invuln=boostTime=jumpCooldown=hitFlash=0;hearts=3;boostCharges=1+Math.floor(save.up.rocket/4);introT=0;runId++;for(const [i,g] of chunks){scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()})}chunks.clear();objects.length=0;turbines.length=0;maintainChunks();applyUpgrades();gate.visible=true;display('');$('ready').hidden=false;$('pullGuide').hidden=m!=='launch';$('readyTitle').textContent=m==='launch'?'Pull back to launch':'Ready to ride?';$('readyText').textContent=m==='launch'?'Drag downward on the snow, then release. The button works too.':'Dodge, jump and boost your way down the mountain.';$('powerBox').hidden=m!=='launch';$('go').textContent=m==='launch'?'Launch':'Start riding';$('pause').hidden=true;$('jump').hidden=true;$('boost').hidden=true;updateHud()}
function begin(){if(phase!=='ready')return;phase='running';$('ready').hidden=true;$('pullGuide').hidden=true;$('pause').hidden=false;$('jump').hidden=false;$('boost').hidden=false;$('steerHint').hidden=false;speed=mode==='launch'?(53+save.up.launch*3.3)*(power/100):42;air=.36;vy=mode==='launch'?3:0;gate.visible=true;tone(560,.22,'sawtooth',.11);setTimeout(()=>{if(phase==='running')$('steerHint').hidden=true},3000);last=performance.now()}
function finish(){if(phase!=='running')return;phase='result';$('pause').hidden=true;$('jump').hidden=true;$('boost').hidden=true;$('steerHint').hidden=true;const dist=Math.floor(z-4),key=mode==='launch'?'bestLaunch':'bestEndless',record=dist>save[key];save[key]=Math.max(save[key],dist);if(mode==='launch')save.tokens++;persist();$('resultLabel').textContent=mode==='launch'?'Launch & Glide':'Endless Ride';$('resultTitle').textContent=record?'New best!':'Run complete';$('resultDistance').textContent=dist+' m';$('resultDetail').textContent=(record?'Personal record · ':'')+flakes+' snowflakes collected · best '+Math.floor(save[key])+' m';$('upgradeBox').hidden=mode!=='launch';refreshUpgrade();display('result');tone(720,.28)}
function refreshUpgrade(){$('upgradePrompt').textContent=save.tokens?'Choose an upgrade · '+save.tokens+' available':'All upgrades used for now';for(const key of Object.keys(save.up)){$(key+'Level').textContent=save.up[key]+'/12';document.querySelector('[data-up="'+key+'"]').disabled=!save.tokens||save.up[key]>=12}}
function upgrade(key){if(!save.tokens||save.up[key]>=12)return;save.tokens--;save.up[key]++;persist();refreshUpgrade();applyUpgrades();notice(key[0].toUpperCase()+key.slice(1)+' upgraded');tone(870,.18)}
function jump(){if(phase!=='running'||jumpCooldown>0||air>.6)return;vy=7+save.up.glide*.2;air=Math.max(air,.05);jumpCooldown=1.15;tone(510,.14)}
function boost(){if(phase!=='running'||boostCharges<1||boostTime>0)return;boostCharges--;boostTime=1.5+save.up.rocket*.12;speed+=9+save.up.rocket*1.5;vy+=2.2;air=Math.max(.2,air);notice('Rocket boost!');tone(210,.45,'sawtooth',.1);updateHud()}
function pause(){if(phase!=='running')return;phase='paused';$('pauseStats').textContent=Math.floor(z-4)+' m · '+Math.round(speed*2.237)+' mph';$('jump').hidden=true;$('boost').hidden=true;display('paused')}
function resume(){phase='running';display('');$('jump').hidden=false;$('boost').hidden=false;last=performance.now()}
function back(){phase='menu';$('ready').hidden=true;$('pullGuide').hidden=true;$('pause').hidden=true;$('jump').hidden=true;$('boost').hidden=true;$('steerHint').hidden=true;display('menu');updateHud()}
function help(){beforeHelp=phase;display('help')}
function closeHelp(){display(beforeHelp==='menu'?'menu':beforeHelp==='paused'?'paused':beforeHelp==='result'?'result':'')}
function simulate(dt){clock+=dt;hitFlash=Math.max(0,hitFlash-dt*3);if(phase!=='running')return;
  const oldZ=z;z+=speed*dt;target=clamp(target,-7.1,7.1);lateral=lerp(lateral,target,Math.min(1,dt*(2.8+save.up.steer*.28)));maintainChunks();invuln=Math.max(0,invuln-dt);jumpCooldown=Math.max(0,jumpCooldown-dt);
  if(boostTime>0){boostTime=Math.max(0,boostTime-dt);speed+=dt*(1.5+save.up.rocket*.3)}
  if(mode==='launch'){speed=Math.max(0,speed-dt*Math.max(.6,.85+speed*.022-save.up.glide*.04))}else speed=lerp(speed,Math.min(86,45+z/120),Math.min(1,dt*.55));
  if(air>0||vy>0){const grav=save.up.glide>0?Math.max(8,16-save.up.glide*.56):16;vy-=grav*dt;air+=vy*dt;if(air<=0){air=vy=0;tone(150,.09,'triangle',.04)}}
  // Check the whole swept path: a fast sled may travel over three meters in one frame.
  for(const o of objects){if(o.used||o.q>z+2||o.q<oldZ-2)continue;if(Math.abs(o.x-(center(o.q)+lateral))>2.0)continue;o.used=true;
    if(o.type==='flake'){flakes++;speed+=2.2;tone(920,.12);if(flakes%5===0)notice('Snowflake streak · speed up')}
    else if(o.type==='ramp'){air=Math.max(air,.3);vy=10+save.up.glide*.34;speed+=2.5;notice('Air time!');tone(470,.22)}
    else if(invuln<=0&&air<1.1){invuln=1.5;hitFlash=1;tone(150,.28,'triangle');if(mode==='endless'){hearts--;speed=Math.max(20,speed*.58);notice(hearts?'Crash · '+hearts+' chances left':'Run complete');if(hearts<=0){finish();return}}else if(save.up.armor>0){speed*=clamp(.28+save.up.armor*.045,.28,.72);notice('Armor absorbed the crash')}else{speed=0;notice('Crash!');finish();return}}
  }
  if(mode==='launch'&&speed<2.4&&z>45)finish();updateHud()
}
function render(dt){if(!renderer)return;introT+=dt;const x=center(z)+lateral,level=ground(z,lateral);rider.position.set(x,level+.1+air,z-(phase==='ready'&&pull?Math.min(2.2,pull.amount/100):0));rider.rotation.z=lerp(rider.rotation.z,(target-lateral)*-.055,Math.min(1,dt*6));rider.rotation.y=lerp(rider.rotation.y,(center(z+6)-center(z))*.018+(target-lateral)*.04,Math.min(1,dt*5));rider.userData.sled.rotation.x=air>0?-.08:Math.sin(clock*24)*.012;
  for(let k=0;k<mountains.length;k++){const side=k%2?-1:1,step=Math.floor(k/2),q=z+330+step*29,peak=mountains[k];peak.position.set(center(q)+side*(95+step*42),base(q)+peak.children[0].geometry.parameters.height*.45-4,q)}
  skyGroup.position.set(center(z+330)+80,base(z+330)+105,z+330);
  const p=particles.geometry.attributes.position,active=phase==='running'?clamp(speed/75,.35,1):0;for(let i=0;i<48;i++){const back=(i/48*12+clock*(16+speed*.27))%12,side=(rng(i+7)*2-1)*(1+back*.17),yy=ground(z-back,lateral)+.1+rng(i+33)*.75*active;p.setXYZ(i,x+side,yy,z-back)}p.needsUpdate=true;particles.visible=phase==='running';
  for(const entry of turbines)entry.rotor.rotation.z+=dt*.7;
  const wingAngle=air>0?-.11:.1;wings[0].rotation.z=lerp(wings[0].rotation.z,wingAngle,Math.min(1,dt*7));wings[1].rotation.z=-wings[0].rotation.z;
  flame.visible=boostTime>0;flame.scale.set(1+Math.sin(clock*38)*.12,1+Math.sin(clock*31)*.24,1);
  gate.visible=z<22;
  const portrait=innerHeight>innerWidth,back=portrait?10.8:15,high=portrait?5.8:6.6,look=portrait?22:30;
  const desired=new T.Vector3(x+(center(z-back)-center(z))*.25,level+high+air*.32,z-back);camera.position.lerp(desired,Math.min(1,dt*(phase==='menu'||phase==='ready'?2.7:5.5)));
  camera.lookAt(center(z+look)+lateral*.36,ground(z+look,0)+1.8+air*.22,z+look);
  camera.fov=(portrait?72:61)+Math.min(12,speed*.15);camera.updateProjectionMatrix();
  renderer.render(scene,camera);
}
let dragging=false,dragStartY=0,lastPointerX=0;
canvas.addEventListener('pointerdown',e=>{if(phase==='ready'&&mode==='launch'){dragging=true;dragStartY=e.clientY;pull={amount:0};canvas.setPointerCapture(e.pointerId)}else if(phase==='running'){pointer=true;lastPointerX=e.clientX;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointermove',e=>{if(dragging&&phase==='ready'){pull.amount=Math.max(0,e.clientY-dragStartY);power=clamp(Math.round(35+pull.amount*.38),35,100);$('power').value=power;$('powerValue').textContent=power+'%'}else if(pointer&&phase==='running'){const dx=e.clientX-lastPointerX;lastPointerX=e.clientX;target=clamp(target-dx/innerWidth*23,-7.1,7.1)}});
canvas.addEventListener('pointerup',e=>{if(dragging&&pull?.amount>22)begin();dragging=false;pull=null;pointer=false});canvas.addEventListener('pointercancel',()=>{dragging=false;pull=null;pointer=false});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){phase==='running'?pause():phase==='paused'?resume():null;return}if(phase!=='running')return;if(['ArrowLeft','a','A'].includes(e.key)){target+=1.8;e.preventDefault()}if(['ArrowRight','d','D'].includes(e.key)){target-=1.8;e.preventDefault()}if(e.key===' '){jump();e.preventDefault()}if(['b','B'].includes(e.key))boost()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='running')pause()});
function bind(id,fn){$(id).addEventListener('click',fn)}
bind('launchMode',()=>reset('launch'));bind('endlessMode',()=>reset('endless'));bind('go',begin);bind('readyBack',back);bind('menuHelp',help);bind('pauseHelp',help);bind('closeHelp',closeHelp);bind('pause',pause);bind('resume',resume);bind('jump',jump);bind('boost',boost);for(const id of ['exit','menuExit','pauseExit'])bind(id,()=>location.href='../../index.html');bind('resultBack',back);bind('retry',()=>reset(mode));
$('power').addEventListener('input',e=>{power=Number(e.target.value);$('powerValue').textContent=power+'%'});
for(const button of document.querySelectorAll('[data-up]'))button.addEventListener('click',()=>upgrade(button.dataset.up));
bind('sound',()=>{soundOn=!soundOn;$('sound').textContent=soundOn?'Sound':'Muted';try{localStorage.setItem('goobs.snowbound.sound',soundOn?'on':'off')}catch{}});$('sound').textContent=soundOn?'Sound':'Muted';
function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;simulate(dt);render(dt);requestAnimationFrame(frame)}
setup();
window.__snowbound={reset,begin,simulate,finish,state:()=>({phase,mode,dist:z-4,speed,hearts,air,boostCharges,lateral,target,up:save.up})};
