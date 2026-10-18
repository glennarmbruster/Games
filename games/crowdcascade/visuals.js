import {T,box,sphere,cylinder,mat} from '../arcade4/scene-kit.js';
// Rounded, articulated runners share geometry and use instancing on mobile GPUs.
const shapes={ball:new T.SphereGeometry(1,12,8),body:new T.CylinderGeometry(.83,1,1,10),cube:new T.BoxGeometry(1,1,1)};
export function formation(parent,color,capacity,instanced){
 const root=new T.Group();parent.add(root);
 const paint=mat(color,.22,.34),white=mat('#e9f6ff',.2,.36),dark=mat('#183454',.25,.36),sole=mat('#102137'),skin=mat('#f1bf95'),visor=mat('#61e9ef',.55,.18);
 const defs=[['ball',skin,0,1.25,.02,.23,.25,.22],['ball',paint,0,1.37,-.015,.26,.21,.25],['ball',visor,0,1.29,.205,.19,.085,.045],['body',paint,0,.84,0,.27,.51,.24],['cube',white,0,.92,.23,.18,.22,.035],['ball',dark,0,.89,-.24,.2,.26,.11],['body',dark,-.135,.34,0,.09,.48,.1],['body',dark,.135,.34,0,.09,.48,.1],['ball',paint,-.32,.93,.015,.12,.19,.13],['ball',paint,.32,.93,.015,.12,.19,.13],['body',white,-.32,.76,.14,.07,.27,.08],['body',white,.32,.76,.14,.07,.27,.08],['cube',dark,.30,.86,.39,.12,.12,.58],['cube',visor,.30,.87,.69,.065,.065,.045],['ball',sole,-.135,.1,.09,.125,.09,.21],['ball',sole,.135,.1,.09,.125,.09,.21]];
 const parts=defs.map(d=>{if(instanced){const m=new T.InstancedMesh(shapes[d[0]],d[1],capacity);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=true;m.frustumCulled=false;root.add(m);return m;}const a=[];for(let i=0;i<capacity;i++){const m=new T.Mesh(shapes[d[0]],d[1]);root.add(m);a.push(m);}return a;});
 const dummy=new T.Object3D();let shown=0;
 function update(n,time,spread=.58){n=Math.min(capacity,Math.max(0,n));shown=n;const cols=Math.max(1,Math.min(12,Math.ceil(Math.sqrt(n*1.65)))),rows=Math.ceil(n/cols);
  for(let k=0;k<defs.length;k++){const d=defs[k];if(instanced)parts[k].count=n;
   for(let i=0;i<(instanced?n:capacity);i++){if(!instanced&&i>=n){parts[k][i].visible=false;continue;}const row=Math.floor(i/cols),rowN=Math.min(cols,n-row*cols),px=(i%cols-(rowN-1)/2)*spread,pz=-row*spread*.87,swing=Math.sin(time*12+i*1.7),leg=k===6||k===7||k===14||k===15;
    const m=instanced?dummy:parts[k][i];m.visible=true;m.position.set(px+d[2],d[3]+Math.abs(swing)*.045,pz+d[4]+(leg?swing*(k%2?1:-1)*.16:0));m.rotation.set(leg?swing*(k%2?1:-1)*.4:0,0,0);m.scale.set(d[5],d[6],d[7]);if(instanced){m.updateMatrix();parts[k].setMatrixAt(i,m.matrix);}}
   if(instanced)parts[k].instanceMatrix.needsUpdate=true;
  }return {cols,rows,width:cols*spread,depth:rows*spread*.87};
 }
 return {root,update,get count(){return shown;},dispose(){root.removeFromParent();parts.forEach(p=>{if(instanced)p.dispose();});[paint,white,dark,sole,skin,visor].forEach(m=>m.dispose());}};
}
export function bridge(scene){
 const water=mat('#169ab7',.38,.29);box(scene,450,.1,450,water,0,-2,130).renderOrder=-40;
 box(scene,15,.8,390,'#49677d',0,-.48,150).renderOrder=-30;box(scene,14,.08,390,'#e3e8e9',0,-.035,150).renderOrder=-29;
 for(const s of [-1,1]){box(scene,.3,.025,390,'#47c4df',s*6.45,.025,150);box(scene,.07,.026,390,'#ffffff',s*6.1,.026,150);}
 const moving=[];
 for(let i=0;i<36;i++){const g=new T.Group();g.position.z=i*7-25;scene.add(g);for(const s of [-1,1]){
  box(g,.45,.5,7,'#2a5b78',s*7,.15,0);box(g,.24,.12,7,'#c6edf5',s*7,1.1,0);box(g,.12,.12,7,'#64b7c8',s*7,.6,0);box(g,.18,1.2,.18,'#d3e7eb',s*7,.6,0);
  if(i%4===0){cylinder(g,.055,.07,4.5,'#335a76',s*7.1,2.25,0);const arm=box(g,1,.08,.12,'#d7f3f7',s*6.7,4.45,0);box(g,.58,.08,.28,'#fcf1c8',s*6.4,4.38,0);}
 }for(const xx of [-2.2,2.2])box(g,.08,.02,2.1,'#adc2cc',xx,.025,0);box(g,13.8,.018,.045,'#acbdc6',0,.02,2.5);moving.push(g);}
 for(let i=0;i<32;i++){const g=new T.Group();g.position.set((i%2?1:-1)*(12+(i*7)%40),-1.91,i*8-20);scene.add(g);for(let j=0;j<3;j++)box(g,1.8+j*.7,.016,.07,j%2?'#4fc7cf':'#87e2de',j*.5,0,j*.22);moving.push(g);}
 // Distant islands frame the bridge; the playable surface stays uncluttered.
 for(let i=0;i<8;i++){const g=new T.Group();g.position.set((i%2?1:-1)*(26+i%3*8),-2,i*31);scene.add(g);const rock=sphere(g,5.5,'#638d78',0,-2,0);rock.scale.set(1.5,.65,1);for(let j=0;j<3;j++){cylinder(g,.1,.22,3.2,'#997347',j*1.6-1.5,1.4,0);for(let k=0;k<5;k++){const leaf=sphere(g,1,'#358f72',j*1.6-1.5+Math.cos(k*1.26)*1.2,3.1,Math.sin(k*1.26)*1.2);leaf.scale.set(1.3,.16,.45);leaf.rotation.y=-k*1.26;}}moving.push(g);}
 return moving;
}
export function crate(root){const casing=mat('#f6b735',.35,.3);box(root,1.8,1.65,1.6,casing,0,.86,0);box(root,1.86,.14,1.66,'#3c5570',0,.14,0);box(root,1.86,.17,1.66,'#ffe9a3',0,1.68,0);for(const x of [-.77,.77])box(root,.14,1.57,1.63,'#ffe4a1',x,.87,0);box(root,.74,.66,.06,'#1f4568',0,.88,-.83);box(root,.12,.47,.08,'#8ffaff',0,.9,-.87);box(root,.42,.12,.08,'#8ffaff',0,.9,-.88);const g=new T.Group();g.position.y=2.5;root.add(g);box(g,1.4,.22,.23,'#203553',0,0,0);box(g,.65,.08,.1,'#5dbfd1',-.8,.04,0);box(g,.15,.5,.18,'#263b58',.2,-.22,0);return g;}
export function barrier(root){box(root,4.3,.95,.65,'#233b50',0,.55,0);for(let i=0;i<7;i++){const stripe=box(root,.28,.82,.68,i%2?'#ffcf47':'#ff7455',-1.8+i*.6,.55,0);stripe.rotation.z=.28;}for(const s of [-1,1]){box(root,.3,.25,1.15,'#a9c4ce',s*1.8,.13,0);sphere(root,.13,'#ff6549',s*1.85,1.15,0);}}
export function truck(parent){const g=new T.Group();parent.add(g);box(g,3.5,1,5.5,'#ffbc29',0,.9,0);box(g,3.1,1.7,2,'#ef6650',0,2.15,1.6);box(g,2.65,.85,.08,'#58c4e5',0,2.48,.55);box(g,3.2,.3,3.6,'#ffc94b',0,1.65,-1);for(const s of [-1,1]){box(g,.22,1,3.6,'#ffdf70',s*1.55,2.1,-1);for(const z of [-1.8,1.8]){const w=cylinder(g,.6,.6,.4,'#263954',s*1.8,.65,z);w.rotation.z=Math.PI/2;cylinder(g,.26,.26,.42,'#b8dde2',s*1.8,.65,z).rotation.z=Math.PI/2;}}box(g,3.6,.22,.2,'#fff2ba',0,.85,-2.85);for(const s of [-1,1])box(g,.45,.24,.12,'#ff544d',s*1.2,1.1,-2.8);for(let i=0;i<15;i++)sphere(g,.28,'#ffe66c',(i%3-1)*.8,1.95+Math.floor(i/6)*.23,-2+(i%5)*.55);return g;}
