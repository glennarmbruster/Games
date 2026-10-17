import * as T from '../arcade4/three.module.min.js';
import {canvasRenderer} from './renderer.js';
import {vehicleTile} from '../arcade4/vehicle-art.js';
export {T};
const paints=['#f4162b','#00c2e9','#ffc40a','#04bf27','#8d28ee'];
const materials={};
export function material(color,rough=.4,metal=.08){const key=color+rough+metal;return materials[key]||(materials[key]=new T.MeshStandardMaterial({color,roughness:rough,metalness:metal}));}
function mesh(parent,geo,color,x=0,y=0,z=0){const m=new T.Mesh(geo,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function box(p,w,h,d,c,x=0,y=0,z=0){return mesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);}
export function sphere(p,r,c,x=0,y=0,z=0){return mesh(p,new T.SphereGeometry(r,16,12),c,x,y,z);}
function cylinder(p,r,h,c,x,y,z){return mesh(p,new T.CylinderGeometry(r,r,h,16),c,x,y,z);}
export function rounded(p,w,h,d,c,x=0,y=0,z=0,r=.12){r=Math.min(r,w*.25,d*.25);const s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,curveSegments:4});geo.rotateX(-Math.PI/2);geo.translate(0,-h/2,0);return mesh(p,geo,c,x,y,z);}
export function arrow(p,size=1){const s=new T.Shape();s.moveTo(-.13,-.32);s.lineTo(.13,-.32);s.lineTo(.13,.08);s.lineTo(.3,.08);s.lineTo(0,.42);s.lineTo(-.3,.08);s.lineTo(-.13,.08);s.closePath();const g=new T.ShapeGeometry(s);g.rotateX(Math.PI/2);g.scale(size,size,size);return mesh(p,g,material('#ffffff',.7),0,0,0);}
function cabin(parent,w,len,paint,glass,y,z){
 const stations=[[-len*.5,y,w*.47],[-len*.29,y+.42,w*.37],[len*.19,y+.42,w*.37],[len*.5,y,w*.47]],pos=[],idx=[];
 stations.forEach(q=>pos.push(-q[2],q[1],q[0]+z,q[2],q[1],q[0]+z));
 for(let i=0;i<3;i++){const j=i*2;idx.push(j,j+2,j+1,j+1,j+2,j+3);}idx.push(0,4,2,0,6,4,1,3,5,1,5,7);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const m=mesh(parent,geo,glass);m.material=glass;
 rounded(parent,w*.76,.11,len*.47,paint,0,y+.45,z-len*.05,.15);
 for(let side of [-1,1]){box(parent,.05,.38,.075,paint,side*w*.4,y+.21,z-.05);box(parent,.035,.045,len*.85,'#d7e6ef',side*w*.47,y+.025,z);}
}
const skinMaterials={};
function applyVehicleSkin(g){
 const v=g.userData.painting;if(!v)return;
 const tile=vehicleTile([0,2,1,4,3][v.color]);if(!tile)return;
 let mat=skinMaterials[v.color];if(!mat){const tex=new T.CanvasTexture(tile);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;mat=new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.08,side:T.DoubleSide});mat.userData.vehicleSkin=true;skinMaterials[v.color]=mat;}
 const positions=[],uv=[],indices=[],rows=12,cols=4;
 for(let y=0;y<=rows;y++){const t=y/rows,z=(.5-t)*v.len;let height;
   if(t<.2)height=.6+t*.6;else if(t<.36)height=.72+(t-.2)*2.5;else if(t<.68)height=1.12;else if(t<.84)height=1.12-(t-.68)*2.65;else height=.696-(t-.84)*.6;
   for(let x=0;x<=cols;x++){const u=x/cols,edge=Math.abs(u-.5)*2;positions.push((u-.5)*v.w,height-.12*Math.pow(edge,3),z);uv.push(u,1-t);}
 }
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const skin=mesh(g,geo,mat);skin.userData.vehicleSkin=true;skin.castShadow=false;
 v.cabin.visible=false;g.userData.painting=null;
}
export function vehicle(v){const g=new T.Group(),bus=v.capacity>=6,compact=v.capacity===2,len=v.length*1.7-(compact?.08:.22),w=compact?1.12:bus?1.35:1.3,color=paints[v.color],paint=material(color,.24,.08),glass=material('#143249',.22,.2);g.userData.wheels=[];g.userData.len=len;g.userData.carId=v.id;
 rounded(g,w,.35,len,paint,0,.47,0,.22);rounded(g,w*.94,.095,len*.96,'#28333e',0,.29,0,.18);
 if(bus){rounded(g,w*.94,.61,len*.91,glass,0,.94,-.02,.15);rounded(g,w*.99,.13,len*.94,paint,0,1.29,-.02,.17);for(let side of [-1,1]){box(g,.06,.61,.14,paint,side*w*.48,.96,-len*.4);box(g,.06,.61,.14,paint,side*w*.48,.96,len*.4);for(let k=1;k<(v.capacity===8?5:3);k++)box(g,.07,.63,.085,paint,side*w*.48,.96,-len*.4+k*(len*.8)/(v.capacity===8?5:3));box(g,.04,.065,len*.78,'#e9f0ed',side*w*.51,.64,0);box(g,.035,.35,.025,'#b7d4e2',side*w*.515,.85,len*.18);}rounded(g,w*.6,.05,.46,paint,0,1.4,-len*.25,.09);rounded(g,w*.5,.025,.29,'#8bc9d5',0,1.44,-len*.25,.05);}
 else{const bodyTop=new T.Group();g.add(bodyTop);cabin(bodyTop,w,compact?len*.77:len*.61,paint,glass,.65,-len*.06);rounded(bodyTop,w*.77,.055,len*.23,paint,0,.68,len*.33,.14);for(let side of [-1,1]){rounded(g,.15,.09,.18,paint,side*w*.56,.83,len*.13,.035);box(g,.035,.035,.12,'#e9f0ef',side*w*.51,.61,-len*.13);box(g,.025,.22,.025,'#2e5263',side*w*.51,.5,0);}g.userData.painting={color:v.color,w:w*1.05,len,cabin:bodyTop};applyVehicleSkin(g);}
 for(let side of [-1,1])for(let z of [-len*.31,len*.31]){const tire=cylinder(g,.245,.18,material('#17212a',.9),side*(w*.5+.025),.26,z);tire.rotation.z=Math.PI/2;const hub=cylinder(g,.14,.195,material('#d5e1e9',.32,.5),side*(w*.5+.035),.26,z);hub.rotation.z=Math.PI/2;const center=cylinder(g,.065,.205,'#394955',side*(w*.5+.04),.26,z);center.rotation.z=Math.PI/2;g.userData.wheels.push(tire,hub,center);}
 for(let side of [-1,1]){rounded(g,bus?.3:.36,.105,.035,'#f3fdff',side*w*.3,.6,len*.5+.035,.025);rounded(g,.28,.095,.035,'#b70e2e',side*w*.3,.56,-len*.5-.035,.025);}
 rounded(g,w*.5,.12,.04,'#182c38',0,.43,len*.5+.035,.025);box(g,w*.4,.025,.045,'#b6d2df',0,.44,len*.5+.06);box(g,.28,.085,.04,'#f4f1e9',0,.4,-len*.5-.04);
 if(bus){rounded(g,w*.73,.025,len*.16,glass,0,1.37,len*.32,.06);rounded(g,w*.63,.012,len*.035,'#b1deeb',0,1.39,len*.35,.025);for(let side of [-1,1])rounded(g,.035,.025,len*.55,'#dbe6e8',side*w*.39,1.38,-len*.03,.012);rounded(g,w*.37,.055,.34,'#e2eaf0',0,1.42,-len*.25,.045);for(let k=0;k<4;k++)box(g,w*.28,.012,.025,'#647f8a',0,1.455,-len*.25-.1+k*.065);}
 const a=arrow(g,compact?.85:1.02);a.position.set(0,bus?1.4:1.18,bus?len*.05:-len*.08);a.rotation.z=Math.PI;
 const shadow=mesh(g,new T.CircleGeometry(1,32),new T.MeshBasicMaterial({color:'#10171b',transparent:true,opacity:.23,depthWrite:false}),0,.02,0);shadow.rotation.x=-Math.PI/2;shadow.scale.set(w*.68,len*.58,1);shadow.castShadow=false;shadow.renderOrder=-2;return g;
}
export function passenger(color,index=0){const g=new T.Group(),paint=material(paints[color],.5),skin=['#ffcfac','#d99a70','#a96747'][index%3],hair=['#362526','#75422b','#d59b43'][index%3];
 rounded(g,.37,.38,.29,paint,0,.54,0,.105);box(g,.025,.26,.018,'#e3f2f8',0,.55,-.16);rounded(g,.26,.19,.2,'#243b55',0,.28,0,.055);
 sphere(g,.22,skin,0,.95,-.01);const cap=sphere(g,.23,hair,0,1.04,.01);cap.scale.set(1,.56,1);for(let side of [-1,1]){sphere(g,.052,skin,side*.215,.94,-.01);sphere(g,.024,'#152c40',side*.073,.97,-.211);sphere(g,.008,'#fff',side*.073-.006,.978,-.23);const arm=rounded(g,.11,.3,.12,paint,side*.25,.55,-.005,.05);arm.rotation.z=side*.12;sphere(g,.065,skin,side*.265,.38,-.01);rounded(g,.12,.2,.14,'#304f72',side*.105,.17,0,.035);rounded(g,.15,.09,.23,'#f6efe5',side*.105,.055,-.045,.045);}const nose=sphere(g,.035,skin,0,.91,-.22);box(g,.065,.014,.015,'#a75e50',0,.86,-.21);g.userData.phase=index*.75;return g;
}
function tree(p,x,z){const g=new T.Group();cylinder(g,.2,1.7,'#ad815e',0,.75,0);for(let i=0;i<5;i++){const a=i*2.4,s=sphere(g,.76,['#63b97e','#88cd8b','#a3d590'][i%3],Math.sin(a)*.55,1.8+i%2*.5,Math.cos(a)*.55);s.scale.y=1.05;}rounded(g,2.8,.2,2.8,'#ddd2c3',0,.02,0,.8);rounded(g,2.5,.13,2.5,'#9bb68c',0,.15,0,.75);g.position.set(x,0,z);g.userData.sceneryX=x;p.add(g);}
export function textSign(parent,text,w,color='#3da6c0'){const c=document.createElement('canvas');c.width=512;c.height=128;const a=c.getContext('2d');a.fillStyle=color;a.fillRect(0,0,512,128);a.fillStyle='white';a.font='bold 54px sans-serif';a.textAlign='center';a.textBaseline='middle';a.fillText(text,256,67,480);const m=mesh(parent,new T.PlaneGeometry(w,w/4),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.DoubleSide}));m.rotation.y=Math.PI;return m;}
export function createScene(canvas){let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.LinearToneMapping;renderer.toneMappingExposure=.92;}catch(e){renderer=canvasRenderer(canvas,T);}
 const scene=new T.Scene();scene.background=new T.Color('#344047');const camera=new T.OrthographicCamera(-10,10,10,-10,.1,160);scene.add(new T.HemisphereLight('#f1f6ff','#56606b',1.4));const sun=new T.DirectionalLight('#fff5e8',2.2);sun.position.set(-14,30,-10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-21,right:21,top:28,bottom:-22,far:100});sun.shadow.bias=-.0007;scene.add(sun);
 const env=document.createElement('canvas');env.width=256;env.height=128;const e=env.getContext('2d'),gr=e.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#a5d3f3');gr.addColorStop(.5,'#f4f2ea');gr.addColorStop(1,'#566873');e.fillStyle=gr;e.fillRect(0,0,256,128);e.fillStyle='#fff';e.fillRect(35,20,35,30);const texture=new T.CanvasTexture(env);texture.mapping=T.EquirectangularReflectionMapping;scene.environment=texture;
 return{scene,camera,renderer,draw(){scene.traverse(o=>{if(o.userData.painting)applyVehicleSkin(o);});renderer.render(scene,camera);},resize(w,h){renderer.setSize(w,h,false);}};
}
export function town(scene){const asphalt=material('#30363b',.97,0),grain=document.createElement('canvas');grain.width=grain.height=128;const ctx=grain.getContext('2d');ctx.fillStyle='#d8dde0';ctx.fillRect(0,0,128,128);let seed=9182;for(let i=0;i<2200;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%128;seed=(seed*1664525+1013904223)>>>0;ctx.fillStyle=i%3?'#b8c1c6':'#edf0f1';ctx.fillRect(x,seed%128,1,1);}const tex=new T.CanvasTexture(grain);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(28,26);tex.colorSpace=T.SRGBColorSpace;asphalt.map=tex;box(scene,70,.15,65,asphalt,0,-.2,5).renderOrder=-100;rounded(scene,36,.3,7,'#c9c5b7',0,0,19.7,.7).renderOrder=-90;box(scene,36,.1,.14,'#f8f2e9',0,.19,16.2).renderOrder=-80;
 for(let i=0;i<7;i++){const g=new T.Group(),colors=['#e66755','#2caba3','#586dc9','#e5993c','#378bc7','#cba64d','#a056a7'],w=4.3,height=6+i%3*.6;box(g,w,height,3.5,colors[i],0,height/2,0);for(let side of [-1,1])box(g,.2,height,.2,'#eee3d8',side*(w/2-.1),height/2,-1.8);box(g,w+.2,.25,3.7,'#f4e9de',0,height,0);for(let row=0;row<2;row++)for(let col=0;col<2;col++){const x=(col-.5)*1.85,y=2.8+row*1.7;rounded(g,1.28,1.38,.12,'#efebe3',x,y,-1.82,.08);rounded(g,1.04,1.14,.1,'#214a65',x,y,-1.91,.07);box(g,.06,1.1,.03,'#a9b7c4',x,y,-1.98);box(g,1.12,.08,.15,'#ddd9db',x,y-.58,-1.94);}rounded(g,3.7,1.6,.1,'#45657d',0,.83,-1.8,.12);for(let j=0;j<10;j++)box(g,.38,.15,.95,j%2?'#fff2dc':['#00b4cf','#e33656','#20ae72'][i%3],(j-4.5)*.38,1.85,-2.13);// Cornices, shop entrances, brick courses, window boxes and roof trim.
 box(g,w+.3,.18,3.9,'#fff1d8',0,height-.25,0);box(g,w+.2,.12,.25,'#e6c5a0',0,2.03,-1.88);
 for(let row=0;row<7;row++){const yy=2.2+row*.48;for(let col=0;col<4;col++)box(g,.65,.028,.02,'#ffffff',-1.65+col*1.08+(row%2)*.1,yy,-1.765).material=material('#f4dcb8',.95);}
 rounded(g,.8,1.5,.15,'#f2e5cd',1.27,.78,-1.94,.05);rounded(g,.62,1.27,.13,'#285671',1.27,.79,-2.04,.04);box(g,.035,.28,.04,'#ffd372',1.49,.8,-2.13);
 for(let col=0;col<2;col++){const xx=(col-.5)*1.85;rounded(g,1.36,.22,.42,'#ae6749',xx,2.06,-2.08,.07);for(let j=0;j<5;j++)sphere(g,.12,['#ff4271','#ffcc3d','#8d47f6'][(i+j)%3],xx-.5+j*.25,2.24,-2.13);}
 const sign=textSign(g,['BAKERY','MARKET','BOOKS','CAFE','STUDIO','FLORIST','GELATO'][i],3.35,['#bd343d','#096f69','#354482'][i%3]);sign.position.set(0,1.6,-2.62);sign.scale.y=.55;
 box(g,.55,1,.6,'#8a6657',1.3,height+.5,.5);g.position.set((i-3)*4.7,0,24.2);scene.add(g);}
 for(let side of [-1,1]){tree(scene,side*9,12.7);tree(scene,side*13.5,-4);for(let z of [15.6,-.5]){const lamp=new T.Group();cylinder(lamp,.09,3.5,'#77849b',0,1.75,0);sphere(lamp,.27,'#ffeab2',0,3.6,0);sphere(lamp,.31,'#b3a2a0',0,3.9,0).scale.y=.35;lamp.position.set(side*9.1,0,z);lamp.userData.sceneryX=side*9.1;scene.add(lamp);}}
 for(let i=0;i<18;i++){box(scene,.08,.85,.08,'#a3a3b8',-7.2+i*.85,.6,16.7);}box(scene,14.7,.07,.07,'#d3d0e0',0,.98,16.7);box(scene,14.7,.07,.07,'#d3d0e0',0,.55,16.7);
}
// Material instances are cached; dispose geometry only when rebuilding actors.
export function remove(g){if(!g)return;g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material.isMeshBasicMaterial&&!o.material.userData.vehicleSkin){if(o.material.map)o.material.map.dispose();o.material.dispose();}});if(g.parent)g.parent.remove(g);}
