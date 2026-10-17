import {T,view,box,mat,disposeGroup} from '../arcade4/scene-kit.js';
import {formation,bridge,crate,truck} from './visuals.js';
const A=window.Arcade,END=252,MAX=160;
let V,hero,heroRoot,events=[],deco=[],shots=[],fx=[],labels=[],phase='ready',count=10,x=0,target=0,dist=0,clock=0,gunLevel=1,coins=0,shootClock=0,steps=0;
let fingerX=0,fingerTarget=0,progress,badge,bonusTruck,bonusTime=0,bonusHits=0,bonusAward=0,formationWidth=2;
const shotGeo=new T.BoxGeometry(.075,.075,.8),shotMats=['#fff9c2','#a8ff68','#65f5ff','#e57eff'].map(c=>new T.MeshBasicMaterial({color:c}));
function label(text,color){const el=document.createElement('div');el.className='world-label';el.textContent=text;el.style.background=color;document.getElementById('stage').appendChild(el);labels.push(el);return el;}
function placeLabel(el,p){const v=p.clone().project(V.camera);el.hidden=v.z>1||v.z<0||v.y>.94||v.y<-.94||Math.abs(v.x)>1.05;el.style.left=(v.x*.5+.5)*A.w+'px';el.style.top=(-v.y*.5+.5)*A.h+'px';el.style.fontSize=Math.max(13,Math.min(23,650/p.distanceTo(V.camera.position)))+'px';}
function init(){if(!A.data.unified){try{const old=JSON.parse(localStorage.getItem('goobs.squadsprint.v1'));A.data.level=Math.max(A.data.level||1,old&&old.level||1);}catch(e){}A.data.unified=true;A.save();}A.data.level=Math.max(1,Number(A.data.level)||1);
 V=view(document.getElementById('board'),'#3185c6');V.scene.fog=new T.Fog('#3185c6',85,190);V.sun.intensity=2;deco=bridge(V.scene);
 hero=formation(V.scene,'#1676ec',MAX,!!V.renderer.isWebGLRenderer);heroRoot=hero.root;
 bonusTruck=truck(V.scene);bonusTruck.visible=false;
 progress=document.createElement('div');progress.className='course-progress';progress.innerHTML='<span></span>';progress.setAttribute('aria-label','Course progress');document.getElementById('stage').appendChild(progress);
 badge=document.createElement('div');badge.className='crowd-badge';document.getElementById('stage').appendChild(badge);
 fresh(false);A.show('Crowd Cascade','<p>Lead your blue squad across the bridge. Drag to aim and steer — your team fires automatically.</p><p>Shoot blue gates to grow their reward, break weapon crates, and clear the red squads. Reach the gold truck for a bonus volley!</p>',[['Run course '+A.data.level,()=>{phase='running';},'primary']]);
}
function clear(){events.forEach(e=>{if(e.team)e.team.dispose();disposeGroup(e.root);});events=[];labels.forEach(el=>el.remove());labels=[];shots.forEach(s=>s.m.removeFromParent());shots=[];fx.forEach(p=>disposeGroup(p.m));fx=[];}
function add(type,z,xx,data={}){const root=new T.Group();root.position.set(xx,0,z);V.scene.add(root);const e={type,z,x:xx,root,done:false,...data};events.push(e);
 if(type==='gate'){const color=e.op==='×'?'#9060f2':'#2699f4';const glass=mat(color);glass.transparent=true;glass.opacity=.22;glass.depthWrite=false;if(V.renderer.isWebGLRenderer)box(root,4.8,2.5,.1,glass,0,1.3,0);for(let side of [-1,1]){box(root,.14,3,.2,'#6ceec9',side*2.4,1.5,0);box(root,.33,.12,.7,'#aeff90',side*2.4,.1,0);}box(root,4.9,.14,.2,color,0,2.8,0);e.label=label(e.op+e.value,e.op==='×'?'#7742c9':'#1477d7');e.base=e.value;e.hits=0;}
 else if(type==='crate'){e.weapon=crate(root);e.label=label(e.hp+'',' #dc8b17');}
 else if(type==='enemy'||type==='boss'){e.maxHp=e.hp;e.team=formation(root,'#f23a4d',type==='boss'?1:64,!!V.renderer.isWebGLRenderer);if(type==='boss')e.team.root.scale.setScalar(3.5);else e.team.root.rotation.y=Math.PI;e.label=label(e.hp+'',type==='boss'?'#a51e4b':'#cd3249');}
 return e;
}
function fresh(start=true){clear();phase=start?'running':'ready';count=10;x=0;target=0;dist=0;clock=0;gunLevel=1;coins=0;shootClock=0;bonusTime=0;bonusHits=0;bonusAward=0;bonusTruck.visible=false;const level=A.data.level;
 for(let i=0;i<6;i++){const z=20+i*35,side=(i+level)%2?1:-1;
  add('gate',z,side*3,{op:'+',value:10+i*3});add('gate',z,-side*3,{op:i===2||i===4?'×':'+',value:i===2||i===4?2:8+i*2});
  add('crate',z+10,side*2.6,{hp:12+i*5+Math.min(8,level*2)});
  add('enemy',z+23,-side*2.1,{hp:20+i*13+Math.min(60,level*3)});
 }
 add('enemy',233,-3.1,{hp:55+Math.min(70,level*5)});add('enemy',233,3.1,{hp:55+Math.min(70,level*5)});add('boss',245,0,{hp:140+Math.min(200,level*12)});
 heroRoot.position.set(0,0,0);hero.update(count,0);hud();
}
function hud(){A.hud(count+' runners','Lv '+A.data.level+' · Power '+gunLevel);badge.textContent=phase==='bonus'?'BONUS · '+Math.ceil(bonusTime)+'s':count+' RUNNERS';}
function burst(px,pz,color,n=10){for(let i=0;i<n;i++){const m=box(V.scene,.12,.12,.12,color,px,1,pz);fx.push({m,vx:(Math.random()-.5)*5,vy:2+Math.random()*4,vz:(Math.random()-.5)*4,life:.65});}}
function kill(e){e.done=true;e.root.visible=false;e.label.hidden=true;burst(e.x,e.z-dist,e.type==='crate'?'#ffe17a':'#ff6478',16);if(e.type==='crate'){gunLevel=Math.min(4,gunLevel+1);count=Math.min(MAX,count+4);A.toast('POWER '+gunLevel+' · +4 RUNNERS');A.beep(750,.08);}else{coins+=e.type==='boss'?60:10;A.beep(240,.06);}hud();}
function hit(e,damage){if(e.done)return;if(e.type==='gate'){if(e.op==='+'){e.hits+=damage;const increase=Math.floor(e.hits/3);e.value=Math.min(e.base+30,e.base+increase);}return;}e.hp-=damage;if(e.hp<=0)kill(e);}
function fire(){const lanes=Math.min(12,Math.max(2,Math.ceil(count/7))),width=Math.min(5.6,formationWidth*.85);const damage=Math.max(1,count/lanes/4)*(.7+gunLevel*.3);
 for(let i=0;i<lanes;i++){const px=x+(i-(lanes-1)/2)*(width/Math.max(1,lanes-1));const m=new T.Mesh(shotGeo,shotMats[gunLevel-1]);m.position.set(px,1.03,.5);V.scene.add(m);shots.push({m,damage,travel:0});}shootClock=.23;
}
function fail(){phase='lost';A.show('Squad stopped','<p>Build up through blue gates, aim at weapon crates, and move around red formations that are still too strong.</p>',[['Try again',()=>fresh(),'primary']]);}
function finish(){phase='bonus';bonusTime=7;bonusHits=0;bonusTruck.visible=true;bonusTruck.position.set(0,0,16);target=0;shots.forEach(s=>s.m.removeFromParent());shots=[];A.toast('BONUS TIME · AIM AT THE GOLD TRUCK');}
function award(){phase='won';bonusAward=coins+Math.round(bonusHits)+count;A.data.coins=(A.data.coins||0)+bonusAward;A.data.level++;A.save();A.show('Bridge cleared!','<p>'+count+' survivors · Power '+gunLevel+'</p><p>Bonus volley: '+Math.round(bonusHits)+' stars<br>Total earned: '+bonusAward+' stars</p>',[['Next course',()=>fresh(),'primary'],['Play again',()=>{A.data.level=Math.max(1,A.data.level-1);A.save();fresh();}]]);}
function tick(dt){clock+=dt;for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.life-=dt;p.vy-=10*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;if(p.life<=0){disposeGroup(p.m);fx.splice(i,1);}}
 if(phase!=='running'&&phase!=='bonus')return;
 if(A.held.left)target+=dt*6;if(A.held.right)target-=dt*6;const edge=Math.max(.9,6.2-formationWidth/2);target=Math.max(-edge,Math.min(edge,target));x+=(target-x)*Math.min(1,dt*12);heroRoot.position.set(x,0,0);
 const speed=phase==='running'?7.6:2.3;if(phase==='running')dist+=dt*speed;deco.forEach(d=>{d.position.z-=dt*speed;if(d.position.z<-30)d.position.z+=252;});
 shootClock-=dt;if(shootClock<=0)fire();
 if(phase==='running')for(const e of events){e.root.position.z=e.z-dist;if(e.done)continue;
  if(e.z<=dist){e.done=true;e.root.visible=false;e.label.hidden=true;if(e.type==='gate'){if((x>=0?1:-1)===(e.x>=0?1:-1)){count=Math.min(MAX,e.op==='×'?count*e.value:count+e.value);A.toast(e.op+e.value+' RUNNERS');A.beep(640,.08);}}
   else if((e.type==='enemy'||e.type==='boss')&&Math.abs(e.x-x)<(e.type==='boss'?2.8:1.8)+formationWidth*.22){const loss=Math.min(count,Math.ceil(e.hp*.55));count-=loss;burst(x,0,'#ff6a7e',16);A.toast('−'+loss+' RUNNERS');}hud();if(count<=0){fail();return;}}
 }
 for(let i=shots.length-1;i>=0;i--){const s=shots[i],before=s.m.position.z;s.m.position.z+=dt*46;s.travel+=dt*46;let used=false;
  if(phase==='bonus'){if(before<14&&s.m.position.z>=14&&Math.abs(s.m.position.x-bonusTruck.position.x)<1.9){bonusHits+=s.damage;used=true;if(i%3===0)burst(bonusTruck.position.x,15,'#ffe65f',3);}}
  else{const hitList=events.filter(e=>!e.done&&e.z-dist>=before-.5&&e.z-dist<=s.m.position.z+.5&&Math.abs(e.x-s.m.position.x)<(e.type==='gate'?2.4:e.type==='crate'?1:e.type==='boss'?1.4:2.1)).sort((a,b)=>a.z-b.z);if(hitList.length){hit(hitList[0],s.damage);used=true;}}
  if(used||s.travel>65){s.m.removeFromParent();shots.splice(i,1);}
 }
 if(phase==='bonus'){bonusTime=Math.max(0,bonusTime-dt);bonusTruck.position.x=Math.sin(clock*.65)*1.5;bonusTruck.rotation.z=Math.sin(clock*10)*.012;hud();if(bonusTime<=0)award();}else if(dist>END)finish();
}
function draw(){const portrait=A.h>A.w;const fov=portrait?49:43;if(V.camera.fov!==fov){V.camera.fov=fov;V.camera.updateProjectionMatrix();}
 const layout=hero.update(count,clock,.52);formationWidth=layout.width;
 // Keep the complete formation on screen as it grows; the track stays readable ahead.
 const depth=Math.min(7,layout.depth),cameraBack=portrait?17+depth*.45:21+depth*.45;
 V.camera.position.set(x*.85,portrait?16:17,-cameraBack);V.camera.lookAt(x*.65,0,portrait?8:8);V.camera.updateMatrixWorld();
 for(const e of events){const z=e.z-dist;e.root.visible=!e.done&&z>-2&&z<85;if(e.label){e.label.hidden=true;if(e.root.visible){e.label.textContent=e.type==='gate'?e.op+e.value:e.type==='crate'?'⚡ '+Math.ceil(e.hp):e.type==='boss'?'BOSS · '+Math.ceil(e.hp):Math.ceil(e.hp)+'';placeLabel(e.label,new T.Vector3(e.x,e.type==='boss'?5.5:3.3,z));}}
  if(e.team&&e.root.visible)e.team.update(e.type==='boss'?1:Math.min(64,Math.max(1,Math.ceil(e.hp*.55))),clock,.53);
  if(e.weapon)e.weapon.rotation.y=Math.sin(clock*1.5)*.25;
 }
 if(progress&&progress.firstChild)progress.firstChild.style.width=Math.min(100,dist/END*100)+'%';badge.textContent=phase==='bonus'?'BONUS · '+Math.ceil(bonusTime)+'s · '+Math.round(bonusHits)+' ★':count+' RUNNERS';V.draw();
}
function down(px){fingerX=px;fingerTarget=target;}function drag(px){target=fingerTarget-(px-fingerX)/A.w*13;}
A.start({context:'webgl',key:'goobs.crowdcascade.v1',defaults:()=>({level:1,coins:0,best:0,unified:false}),init,restart:()=>fresh(),tick,draw,down,drag,steer:true,resize:(w,h)=>V.resize(w,h),help:'<ul><li>Drag left or right to steer and aim. Your blue squad fires automatically.</li><li>Choose a blue recruit gate or purple multiplier. Shooting a blue gate increases its reward, up to 30 extra recruits.</li><li>Break gold weapon crates to upgrade your shots through four power levels and recruit four more runners.</li><li>Clear red squads before reaching them, or steer around them. A collision costs runners. Keep at least one alive.</li><li>Survive the boss and shoot the moving gold truck during the seven-second bonus round. Your surviving crowd and shots earn stars.</li><li>Later courses have tougher enemies. Your existing level and earned stars are preserved.</li></ul>'});
