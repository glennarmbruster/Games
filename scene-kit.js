import * as T from './three.module.min.js';
import {canvasRenderer} from '../crashcourse/software-renderer.js';
export {T};
export function mat(color,metal=.05,rough=.7){return new T.MeshStandardMaterial({color,metalness:metal,roughness:rough});}
export function box(parent,w,h,d,color,x=0,y=0,z=0){const m=new T.Mesh(new T.BoxGeometry(w,h,d),typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function sphere(parent,r,color,x=0,y=0,z=0){const m=new T.Mesh(new T.SphereGeometry(r,10,8),typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
export function cylinder(parent,top,bottom,h,color,x=0,y=0,z=0){const m=new T.Mesh(new T.CylinderGeometry(top,bottom,h,12),typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
export function view(canvas,sky='#9bd2ec'){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;}catch(e){renderer=canvasRenderer(canvas,T);}
 const scene=new T.Scene();scene.background=new T.Color(sky);scene.fog=new T.Fog(sky,100,300);scene.add(new T.HemisphereLight('#e1f2ff','#708078',2));const sun=new T.DirectionalLight('#fff4d9',2.8);sun.position.set(-30,70,-30);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-55,right:55,top:85,bottom:-45,far:180});sun.shadow.bias=-.0005;scene.add(sun);
 const camera=new T.PerspectiveCamera(57,1,.2,420);return{renderer,scene,camera,sun,resize(w,h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},draw(){renderer.render(scene,camera);}};
}
export function floor(scene,w,d,color,z=0){const level=scene.userData.floorLevel=(scene.userData.floorLevel||0)+1;const m=box(scene,w,.025,d,color,0,-.12+level*.02,z);m.renderOrder=-30+level;return m;}
export function tree(parent,x,z,size=1,kind=0){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);cylinder(g,.15,.24,2.8,'#76553b',0,1.4,0);const shades=kind===1?['#ce6749','#e9b358','#db8b42']:['#36845a','#51a86b','#6ab377'];for(let i=0;i<5;i++){const a=i*2.4,r=i?1.05:0;let m=sphere(g,i?1.1:1.45,shades[i%3],Math.sin(a)*r,2.6+(i%3)*.6,Math.cos(a)*r);m.scale.y=1.25;}parent.add(g);return g;}
function rounded(parent,w,h,d,color,x,y,z){const r=Math.min(.17,w/5,d/5),s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:2,curveSegments:3});geo.rotateX(-Math.PI/2);geo.translate(0,-h/2,0);const m=new T.Mesh(geo,color);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
export function car(parent,color='#e34c4c',type='sedan'){
 const g=new T.Group(),bus=type==='bus',van=type==='van',sport=type==='sport',len=bus?7.2:van?5.2:sport?4.2:4.7,paint=mat(color,.5,.3),glass=mat('#203d55',.55,.18),trim=mat('#d8e5ed',.7,.25);g.userData={w:bus?2.3:2.05,l:len,wheels:[]};
 rounded(g,2,.55,len,paint,0,.8,0);box(g,1.88,.28,len-.28,paint,0,1.12,0);box(g,1.7,.66,bus?len-1.1:van?3.5:2.1,glass,0,1.52,bus?-.1:van?-.25:-.12);rounded(g,1.85,.14,bus?len-1:van?3.6:2.2,paint,0,1.9,bus?-.1:van?-.25:-.12);
 if(bus||van){box(g,1.98,.85,.18,paint,0,1.5,-len/2+.17);for(let i=0;i<(bus?6:3);i++){let z=-len/2+.7+i*.9;box(g,2.01,.78,.08,paint,0,1.5,z);}}else{let wind=box(g,1.7,.66,.04,glass,0,1.48,1.02);wind.rotation.x=-.34;box(g,.12,.78,2.15,paint,-.88,1.48,-.12);box(g,.12,.78,2.15,paint,.88,1.48,-.12);box(g,1.82,.12,1.1,paint,0,1.12,len/2-.6);}
 box(g,2.04,.18,.16,trim,0,.65,len/2+.02);box(g,2.04,.18,.16,trim,0,.65,-len/2-.02);box(g,.65,.22,.05,'#f1f3eb',0,.8,-len/2-.12);box(g,.8,.2,.05,'#162432',0,.95,len/2+.1);
 for(const s of [-1,1]){box(g,.58,.16,.08,'#fff5d3',s*.64,1.02,len/2+.08);box(g,.54,.15,.08,'#ff4a52',s*.65,1.02,-len/2-.09);box(g,.21,.17,.33,paint,s*1.1,1.5,.72);box(g,.04,.04,.22,trim,s*1.02,1.1,-.5);for(const z of [-len*.32,len*.31]){const wheel=cylinder(g,.47,.47,.25,'#19242b',s*1.04,.48,z);wheel.rotation.z=Math.PI/2;const hub=cylinder(g,.27,.27,.28,trim,s*1.07,.48,z);hub.rotation.z=Math.PI/2;g.userData.wheels.push(wheel,hub);}}
 if(sport){box(g,2.15,.1,.37,'#172b40',0,1.46,-len/2+.08);for(let s of [-1,1])box(g,.08,.34,.12,'#172b40',s*.65,1.3,-len/2+.08);}
 g.scale.y=sport?.77:bus?1.13:van?1:.86;parent.add(g);return g;
}
export function person(parent,color='#25b5ed',armed=false){const g=new T.Group();const skin=mat('#f2bc91'),coat=mat(color,.2,.48),dark=mat('#17364d');const torso=cylinder(g,.22,.28,.65,coat,0,.83,0);sphere(g,.23,skin,0,1.44,0);if(armed){sphere(g,.24,coat,0,1.53,0);box(g,.45,.12,.24,dark,0,1.46,.14);box(g,.13,.14,.65,dark,.32,.95,.25);}else sphere(g,.24,coat,0,1.56,0).scale.y=.35;let limbs=[];for(const side of [-1,1]){const leg=cylinder(g,.085,.095,.48,dark,side*.13,.3,0);const arm=cylinder(g,.07,.08,.43,skin,side*.31,.9,0);limbs.push(leg,arm);}g.userData.limbs=limbs;parent.add(g);return g;}
export function runPerson(g,t){g.userData.limbs.forEach((m,i)=>m.rotation.x=Math.sin(t+(i<2?0:Math.PI))*(i%2?.5:.75));}
export function label(parent,text,color='#fff',w=3,h=1){
 // DOM labels remain readable above the 3D view; meshes use simple color codes.
 const g=box(parent,w,h,.08,color);return g;
}

export function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});if(g.parent)g.parent.remove(g);}
