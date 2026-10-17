import {T,box,sphere,cylinder,mat} from '../arcade4/scene-kit.js';

// Shared geometry and instancing keep large crowds affordable on mobile GPUs.
const shapes={ball:new T.SphereGeometry(1,8,6),body:new T.CylinderGeometry(.8,1,1,8),cube:new T.BoxGeometry(1,1,1)};
export function formation(parent,color,capacity,instanced){
 const root=new T.Group();parent.add(root);
 const paint=mat(color,.12,.42),white=mat('#edf7ff'),dark=mat('#203955'),sole=mat('#10284b');
 const defs=[['ball',paint,0,1.22,0,.24,.27,.23],['body',paint,0,.77,0,.25,.5,.23],['cube',white,0,.51,0,.42,.13,.32],['cube',paint,-.13,.28,0,.16,.45,.19],['cube',paint,.13,.28,0,.16,.45,.19],['cube',white,-.31,.76,.12,.13,.32,.16],['cube',white,.31,.76,.12,.13,.32,.16],['cube',dark,.31,.89,.36,.12,.12,.62],['cube',sole,-.13,.08,.08,.2,.13,.3],['cube',sole,.13,.08,.08,.2,.13,.3]];
 const parts=defs.map(d=>{if(instanced){const m=new T.InstancedMesh(shapes[d[0]],d[1],capacity);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=true;m.frustumCulled=false;root.add(m);return m;}const a=[];for(let i=0;i<capacity;i++){const m=new T.Mesh(shapes[d[0]],d[1]);root.add(m);a.push(m);}return a;});
 const dummy=new T.Object3D();let shown=0;
 function update(n,time,spread=.58){n=Math.min(capacity,Math.max(0,n));shown=n;const cols=Math.max(1,Math.min(12,Math.ceil(Math.sqrt(n*1.65)))),rows=Math.ceil(n/cols);
  for(let k=0;k<defs.length;k++){const d=defs[k];if(instanced)parts[k].count=n;
   for(let i=0;i<(instanced?n:capacity);i++){if(!instanced&&i>=n){parts[k][i].visible=false;continue;}const row=Math.floor(i/cols),rowN=Math.min(cols,n-row*cols),px=(i%cols-(rowN-1)/2)*spread,pz=-row*spread*.83;const swing=Math.sin(time*12+i*1.7),leg=k===3||k===4||k===8||k===9;
    const m=instanced?dummy:parts[k][i];m.visible=true;m.position.set(px+d[2],d[3]+Math.abs(swing)*.035,pz+d[4]+(leg?swing*(k%2?1:-1)*.13:0));m.rotation.set(leg?swing*(k%2?1:-1)*.3:0,0,0);m.scale.set(d[5],d[6],d[7]);if(instanced){m.updateMatrix();parts[k].setMatrixAt(i,m.matrix);}}
   if(instanced)parts[k].instanceMatrix.needsUpdate=true;
  }return {cols,rows,width:cols*spread,depth:rows*spread*.83};
 }
 return {root,update,get count(){return shown;},dispose(){root.removeFromParent();parts.forEach(p=>{if(instanced)p.dispose();});[paint,white,dark,sole].forEach(m=>m.dispose());}};
}
export function bridge(scene){
 box(scene,450,.1,450,'#237bc1',0,-2,130).renderOrder=-40;
 box(scene,15,.8,390,'#b3b8bc',0,-.48,150).renderOrder=-30;box(scene,14,.08,390,'#e1ded7',0,-.035,150).renderOrder=-29;
 const moving=[];
 for(let i=0;i<36;i++){let g=new T.Group();g.position.z=i*7-25;scene.add(g);for(let s of [-1,1]){box(g,.55,.85,7,'#acb7bb',s*7,.25,0);box(g,.72,.16,7,'#d7dddc',s*7,.76,0);box(g,1.05,1.35,1.1,'#a3afb4',s*7,.5,0);box(g,1.15,.17,1.2,'#dbe0df',s*7,1.2,0);}box(g,.14,.02,2.1,'#fff9e8',0,.025,0);box(g,13.8,.018,.045,'#c1c2bd',0,.02,2.5);moving.push(g);}
 for(let i=0;i<34;i++){const m=box(scene,2+i%4,.015,.08,'#4095d0',(i%2?1:-1)*(11+(i*7)%40),-1.92,i*7-20);moving.push(m);}
 return moving;
}
export function crate(root){box(root,1.8,1.8,1.6,'#f5a12a',0,.9,0);for(let x of [-.8,.8])box(root,.12,1.85,1.68,'#ffe28c',x,.95,0);box(root,1.9,.15,1.7,'#ffe28c',0,1.85,0);const g=new T.Group();g.position.y=2.65;root.add(g);box(g,1.4,.22,.23,'#203553',0,0,0);box(g,.65,.08,.1,'#385f87',-.8,.04,0);box(g,.15,.5,.18,'#263b58',.2,-.22,0);return g;}
export function truck(parent){const g=new T.Group();parent.add(g);box(g,3.5,1,5.5,'#ffbc29',0,.9,0);box(g,3.1,1.7,2,'#ef6650',0,2.15,1.6);box(g,2.65,.85,.08,'#58c4e5',0,2.48,.55);box(g,3.2,.3,3.6,'#ffc94b',0,1.65,-1);for(let s of [-1,1]){box(g,.22,1,3.6,'#ffdf70',s*1.55,2.1,-1);for(let z of [-1.8,1.8]){let w=cylinder(g,.6,.6,.4,'#263954',s*1.8,.65,z);w.rotation.z=Math.PI/2;}}box(g,3.6,.22,.2,'#fff2ba',0,.85,-2.85);for(let s of [-1,1])box(g,.45,.24,.12,'#ff544d',s*1.2,1.1,-2.8);for(let i=0;i<15;i++)sphere(g,.28,'#ffe66c',(i%3-1)*.8,1.95+Math.floor(i/6)*.23,-2+(i%5)*.55);return g;}
