// Opt-in scenery and lighting for City Dash, Crowd Cascade and Skyward Flight.
// Other games keep their existing renderer and artwork.
import {T,box,cylinder,mat} from './scene-kit.js';

export function lighting(v,top='#3287cc',horizon='#e4f4f5'){
 const canvas=document.createElement('canvas');canvas.width=32;canvas.height=256;
 const c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,0,256);
 g.addColorStop(0,top);g.addColorStop(.62,horizon);g.addColorStop(1,'#f2eee0');c.fillStyle=g;c.fillRect(0,0,32,256);
 v.scene.background=v.renderer.isWebGLRenderer?new T.CanvasTexture(canvas):new T.Color(horizon);
 const env=document.createElement('canvas');env.width=256;env.height=128;const e=env.getContext('2d'),eg=e.createLinearGradient(0,0,0,128);
 eg.addColorStop(0,'#8abade');eg.addColorStop(.46,'#e4f4ff');eg.addColorStop(.52,'#d7cfba');eg.addColorStop(1,'#536572');e.fillStyle=eg;e.fillRect(0,0,256,128);e.fillStyle='#fff9e8';e.fillRect(42,15,35,35);e.fillStyle='#ffffff';e.fillRect(180,23,25,24);
 const texture=new T.CanvasTexture(env);texture.mapping=T.EquirectangularReflectionMapping;v.scene.environment=texture;v.renderer.toneMappingExposure=1.12;
}

export function smooth(parent,r,color,x=0,y=0,z=0){const m=new T.Mesh(new T.SphereGeometry(r,20,12),typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}

export function pine(parent,x,z,size=1,kind=0){
 const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);cylinder(g,.1,.24,2.9,'#79503a',0,1.3,0);
 if(kind===1){for(let i=0;i<6;i++){const a=i*2.399,m=smooth(g,1.15,['#d27732','#e6ac3d','#b65631'][i%3],Math.sin(a)*.72,2.5+i%3*.55,Math.cos(a)*.72);m.scale.set(1,.85,1);} }
 else for(let i=0;i<5;i++){
  const geo=new T.ConeGeometry(1.55-i*.235,1.75,12,2);const a=geo.attributes.position;
  for(let k=0;k<a.count;k++){const y=a.getY(k);if(y<.65){const wave=1+.075*Math.sin(Math.atan2(a.getZ(k),a.getX(k))*7+i);a.setXYZ(k,a.getX(k)*wave,y,a.getZ(k)*wave);}}
  geo.computeVertexNormals();const m=new T.Mesh(geo,mat(['#29634e','#347f58','#409365','#57a66b','#76b778'][i]));m.position.y=1.7+i*.65;m.rotation.y=i*.83;m.castShadow=true;g.add(m);
 }
 parent.add(g);return g;
}

export function ridge(parent,x,z,index=0){
 const g=new T.Group(),geo=new T.PlaneGeometry(100,100,22,18);geo.rotateX(-Math.PI/2);const a=geo.attributes.position;
 for(let i=0;i<a.count;i++){const xx=a.getX(i),zz=a.getZ(i),edge=Math.max(0,1-Math.pow(xx/50,2))*Math.max(0,1-Math.pow(zz/50,2));const crest=27+9*Math.sin(xx*.13+index)+5*Math.sin(zz*.17+xx*.08);a.setY(i,edge*crest);}
 geo.computeVertexNormals();const mesh=new T.Mesh(geo,mat(['#779d88','#8bad99','#6e9686'][index%3]));mesh.receiveShadow=true;g.add(mesh);g.position.set(x,-.3,z);parent.add(g);return g;
}

export function sign(parent,text,width=8,color='#125c75'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,512,128);c.strokeStyle='#f1f9e2';c.lineWidth=5;c.strokeRect(9,9,494,110);c.fillStyle='#fff';c.font='bold 48px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,66,475);const tex=new T.CanvasTexture(canvas);const m=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));m.rotation.y=Math.PI;parent.add(m);return m;
}

export function wing(parent,span,depth,color,y,z,sweep=.4){
 const s=new T.Shape();s.moveTo(-span/2,-depth*.25);s.lineTo(-span*.46,depth*.18);s.lineTo(-.45,depth*.5);s.lineTo(.45,depth*.5);s.lineTo(span*.46,depth*.18);s.lineTo(span/2,-depth*.25);s.lineTo(.5,-depth*.5+sweep);s.lineTo(-.5,-depth*.5+sweep);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.1,bevelEnabled:true,bevelSegments:2,bevelSize:.035,bevelThickness:.025});geo.rotateX(-Math.PI/2);const m=new T.Mesh(geo,color);m.position.set(0,y,z);m.castShadow=true;parent.add(m);return m;
}
