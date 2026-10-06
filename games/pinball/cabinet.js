import * as T from '../../shared/three.module.min.js';

// All hardware uses the physics table's coordinates. No collision geometry is invented here.
export function create(stage, PB, machine) {
  const canvas=document.createElement('canvas');canvas.className='cabinet3d';canvas.setAttribute('aria-hidden','true');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  const scene=new T.Scene();scene.background=new T.Color('#11151a');
  const camera=new T.OrthographicCamera(-50,50,92,-92,.1,600);camera.position.set(50,280,92);camera.up.set(0,0,-1);camera.lookAt(50,0,92);
  const harbor=machine==='harbor',accent=harbor?0x00becb:0xffb627,red=harbor?0xe82c45:0xe62936;
  scene.add(new T.HemisphereLight(0xe9f1ff,0x253039,.65));
  const sun=new T.DirectionalLight(0xfff4dd,1.5);sun.position.set(-45,160,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-130,right:130,top:130,bottom:-130,near:1,far:400});sun.shadow.bias=-.0003;sun.shadow.normalBias=.12;scene.add(sun);
  const fill=new T.DirectionalLight(0xa9d5ed,.35);fill.position.set(125,65,140);scene.add(fill);
  // A small photographic-studio environment gives steel distinct light/dark reflections.
  const env=new T.Scene();env.background=new T.Color('#39424b');
  for(const [x,y,z,w,h,c] of [[-8,8,0,5,15,0xffffff],[9,6,-3,3,12,0xc8e3ff],[0,12,0,8,8,0xffffff],[0,-6,8,12,8,0x10151d]]){
    const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m);
  }
  const pm=new T.PMREMGenerator(renderer),environment=pm.fromScene(env,.04).texture;scene.environment=environment;pm.dispose();
  env.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
  const metal=new T.MeshStandardMaterial({color:0xdde1e3,metalness:1,roughness:.22,envMapIntensity:1.3});
  const steel=new T.MeshStandardMaterial({color:0xe1e7eb,metalness:1,roughness:.07,envMapIntensity:1.6});
  const rubber=new T.MeshStandardMaterial({color:0x15191c,roughness:.9});
  const ivory=new T.MeshPhysicalMaterial({color:0xf5f0dc,roughness:.24,clearcoat:1,clearcoatRoughness:.14});
  const redRubber=new T.MeshStandardMaterial({color:red,roughness:.72});
  const dark=new T.MeshStandardMaterial({color:0x111a22,roughness:.55,metalness:.35});
  const gold=new T.MeshStandardMaterial({color:0xc49a54,metalness:.8,roughness:.3});
  const assets=[],geometries=new Set(),materials=new Set();let disposed=false;
  function add(geo,mat,x,y,z,parent=scene){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function disk(r,h,mat,x,y,z,parent=scene){return add(new T.CylinderGeometry(r,r,h,40),mat,x,y,z,parent);}
  function line(x1,z1,x2,z2,r,y,mat,parent=scene){const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);const m=add(new T.CylinderGeometry(r,r,len,10),mat,(x1+x2)/2,y,(z1+z2)/2,parent);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(dx,0,dz).normalize());return m;}
  function plane(w,h,mat,x,y,z){const m=add(new T.PlaneGeometry(w,h),mat,x,y,z);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;}
  function texture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;assets.push(t);return t;}
  const shadowTex=texture(64,64,(c,w,h)=>{const g=c.createRadialGradient(32,32,3,32,32,32);g.addColorStop(0,'rgba(0,0,0,.72)');g.addColorStop(.5,'rgba(0,0,0,.32)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  const shadowMat=new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,toneMapped:false});
  function shadow(x,z,w,h=w){return plane(w,h,shadowMat,x+.6,.035,z+.9);}
  // Keep printed ink colors faithful: ambient/specular light must not wash the dark art gray.
  const artMat=new T.MeshBasicMaterial({color:0x152c40,toneMapped:false});
  artMat.onBeforeCompile=function(shader){shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>', 'float inkLuma=dot(gl_FragColor.rgb,vec3(0.2126,0.7152,0.0722)); gl_FragColor.rgb=max(vec3(0.0),mix(vec3(inkLuma),gl_FragColor.rgb,1.3));\n#include <tonemapping_fragment>');};
  plane(100,184,artMat,50,0,92);
  new T.TextureLoader().load('assets/'+(harbor?'harbor':'goober')+'-playfield-v1.webp',t=>{if(disposed){t.dispose();return;}t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());assets.push(t);artMat.map=t;artMat.color.set('#ffffff');artMat.needsUpdate=true;});
  // Black anodized shooter lane and cabinet edge, with narrow polished trim.
  plane(7.2,134,dark,95.6,.045,117);
  for(const x of [1.2,99.3]){add(new T.BoxGeometry(1.3,4,184),metal,x,1.5,92);}
  add(new T.BoxGeometry(100,4,1.4),metal,50,1.5,183.6);
  PB.segs.forEach((s,i)=>{if(['drop','standup','sling'].includes(s.kind))return;
    line(s.x1+.3,s.y1+.7,s.x2+.3,s.y2+.7,s.r+.45,.14,rubber);
    line(s.x1,s.y1,s.x2,s.y2,s.r,1.65,metal);
    if(i%5===0){disk(.7,.2,metal,s.x1,2.05,s.y1);}
  });
  PB.circles.filter(c=>c.kind!=='bumper').forEach(c=>{shadow(c.x,c.y,c.r*4);disk(c.r,1.4,redRubber,c.x,.75,c.y);disk(c.r*.8,.7,ivory,c.x,1.8,c.y);disk(c.r*.45,.25,metal,c.x,2.3,c.y);line(c.x-.3,c.y,c.x+.3,c.y,.09,2.46,dark);});
  function label(text,x,z,w,h,color='#f4e8cb',bg='transparent',size=38){const map=texture(512,128,(c,W,H)=>{if(bg!=='transparent'){c.fillStyle=bg;c.fillRect(0,0,W,H);}c.fillStyle=color;c.font='800 '+size+'px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2,W-24);});return plane(w,h,new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false}),x,.085,z);}
  label(harbor?'HARBOR LIGHTS':'GOOBER BALL',48,135,43,10,harbor?'#e1ecde':'#f6cf84','transparent',48);
  label(harbor?'COASTAL CLASSIC':'ORBITAL EDITION',48,143,35,4,'#b7c7ce');
  // Apron is an actual raised metal/plastic assembly, not decorative play area.
  for(const x of [20,74])add(new T.BoxGeometry(x===20?40:36,1,5.3),dark,x,.5,181.35);
  label(harbor?'HARBOR LIGHTS':'GOOBER BALL',20,181.2,34,3,'#d6c18c');label('3 BALLS  •  FREE PLAY',74,181.2,30,3,'#d6c18c');
  // Label planes above the apron rather than inside it.
  scene.children.slice(-2).forEach(m=>m.position.y=1.03);
  const lampGlow=texture(64,64,(c,w,h)=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.7)');g.addColorStop(.35,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
  function light(x,z,color,r=2.1){disk(r+.28,.12,dark,x,.12,z);const mat=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0,roughness:.3});disk(r,.13,mat,x,.2,z);const gm=new T.MeshBasicMaterial({map:lampGlow,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0,toneMapped:false});plane(r*4,r*4,gm,x,.29,z);return {set(on){mat.emissiveIntensity=on?1.25:.02;mat.color.setHex(color).multiplyScalar(on?1:.35);gm.opacity=on?.45:0;}};}
  const lanes=PB.LANES.map((x,i)=>{label((harbor?'SEA':'GBL')[i],x,46,4,3);return light(x,42,0xffbe4a);});
  const mult=[39,45,51,57].map((x,i)=>{label((i+2)+'X',x,154,4,2.7);return light(x,150,0xffc967,1.8);});
  const locks=[[72,88],[78,90],[84,88]].map(p=>light(...p,0x59d3ec,1.6));label('LOCK',78,94,12,3);
  const again=light(48,171,0xef5c59),kick=light(8.2,127,0xa587df,1.5),jack=light(81,83,0xffbc47,1.6);label('SHOOT AGAIN',48,175,18,2.6);label(harbor?'LIGHTHOUSE':'POWER CORE',80,64,19,3);
  const bumpers=PB.bumpers.map((b,i)=>{shadow(b.x,b.y,17);disk(b.r,1.4,rubber,b.x,.85,b.y);disk(b.r*.98,.4,metal,b.x,1.7,b.y);disk(b.r*.85,.9,ivory,b.x,2.35,b.y);
    const mat=new T.MeshPhongMaterial({color:i===1?accent:red,shininess:65,specular:0x666666,emissive:i===1?accent:red,emissiveIntensity:.08});disk(b.r*.83,1.1,mat,b.x,3.25,b.y);disk(b.r*.38,.2,gold,b.x,3.86,b.y);
    const tx=label('100',b.x,b.y,5,2.5,'#fff0cb');tx.position.y=4;return mat;});
  const slingMats=[];
  PB.slings.forEach(s=>{const shape=new T.Shape();shape.moveTo(s.x1,s.y1);shape.lineTo(s.x2,s.y2);shape.lineTo(s.side?77:19,140.5);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:1.2,bevelEnabled:true,bevelSize:.35,bevelThickness:.2,bevelSegments:2,steps:1});geo.rotateX(Math.PI/2);
    const mat=new T.MeshPhongMaterial({color:accent,shininess:45,specular:0x555555,emissive:accent,emissiveIntensity:.08});add(geo,mat,0,2,0);line(s.x1,s.y1,s.x2,s.y2,s.r,1.4,ivory);slingMats.push(mat);});
  const drops=PB.drops.map(d=>{const s=d.seg;const m=add(new T.BoxGeometry(2,2.8,s.y2-s.y1),new T.MeshStandardMaterial({color:0xe2b747,roughness:.3}),s.x1,1.5,(s.y1+s.y2)/2);return m;});
  const standups=PB.standups.map(s=>add(new T.BoxGeometry(2,2,s.y2-s.y1),new T.MeshStandardMaterial({color:0x2faa94,roughness:.3}),s.x1,1.2,(s.y1+s.y2)/2));
  disk(PB.SAUCER.r+.6,.22,metal,PB.SAUCER.x,.23,PB.SAUCER.y);disk(PB.SAUCER.r,.24,rubber,PB.SAUCER.x,.37,PB.SAUCER.y);disk(PB.SAUCER.r*.7,.25,dark,PB.SAUCER.x,.51,PB.SAUCER.y);
  function flipperShape(len,r1,r2){const s=new T.Shape();s.absarc(0,0,r1,Math.PI/2,Math.PI*1.5,false);s.lineTo(len,-r2);s.absarc(len,0,r2,-Math.PI/2,Math.PI/2,false);s.closePath();return s;}
  const flips=PB.flippers.map(f=>{const group=new T.Group();group.position.set(f.px,0,f.py);scene.add(group);
    for(const [r1,r2,depth,y,mat] of [[PB.P.flipR1,PB.P.flipR2,1.4,1.7,redRubber],[PB.P.flipR1-.4,PB.P.flipR2-.25,.8,2.4,ivory]]){const geo=new T.ExtrudeGeometry(flipperShape(f.len,r1,r2),{depth,bevelEnabled:true,bevelSegments:3,bevelSize:.2,bevelThickness:.15,steps:1,curveSegments:20});geo.rotateX(Math.PI/2);add(geo,mat,0,y,0,group);}disk(.7,.2,metal,0,2.66,0,group);line(-.35,0,.35,0,.08,2.8,dark,group);return group;});
  const balls=[],ballShadows=[];
  const spring=new T.Group();spring.position.set(PB.PLUNGER.x,1.15,PB.PLUNGER.y+1);scene.add(spring);
  const springPoints=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*16;springPoints.push(new T.Vector3(Math.cos(a)*1.4,Math.sin(a)*.5,i/100*7));}
  add(new T.TubeGeometry(new T.CatmullRomCurve3(springPoints),100,.18,6,false),metal,0,0,0,spring);
  const plunger=disk(2.2,1,gold,PB.PLUNGER.x,1.2,PB.PLUNGER.y);plunger.rotation.x=Math.PI/2;
  // Small real bulbs, not a moving spotlight sweeping over the ball.
  const arch=[];for(let i=0;i<26;i++){const a=Math.PI*.03-Math.PI*1.06*(i+.5)/26;arch.push(light(51.6+Math.cos(a)*44.6,46+Math.sin(a)*44.6,i%2?0xefaf5a:0x76c2cf,.55));}
  stage.insertBefore(canvas,stage.firstChild);
  function resize(w,h){renderer.setSize(w,h,false);}
  function render(g){if(disposed||!g)return;
    PB.flippers.forEach((f,i)=>flips[i].rotation.y=-f.a);PB.bumpers.forEach((b,i)=>bumpers[i].emissiveIntensity=.15+b.flash*2);
    PB.slings.forEach((s,i)=>slingMats[i].emissiveIntensity=.12+(s.flash||0)*1.5);
    PB.drops.forEach((d,i)=>{drops[i].position.y=d.down?-1:1.5;});PB.standups.forEach((s,i)=>standups[i].material.emissive.setHex(s.flash>.2?0x3cbd9a:0x000000));
    lanes.forEach((l,i)=>l.set(g.lanes[i]));mult.forEach((l,i)=>l.set(g.mult>=i+2));locks.forEach((l,i)=>l.set(g.locks>i));again.set(g.saveT>0||g.extra>0);kick.set(g.kickback);jack.set(g.multiball);
    arch.forEach((l,i)=>l.set(Math.floor(g.t*(g.multiball?12:5)-i)%5===0));
    while(balls.length<g.balls_.length){balls.push(add(new T.SphereGeometry(PB.R,32,24),steel,0,PB.R,0));ballShadows.push(shadow(0,0,PB.R*3.2));}
    balls.forEach((m,i)=>{const b=g.balls_[i];m.visible=!!b;ballShadows[i].visible=!!b;if(b){m.position.set(b.x,b.held?1.3:PB.R+.08,b.y);ballShadows[i].position.set(b.x+.6,.04,b.y+.9);}});
    plunger.position.z=PB.PLUNGER.y+(g.plunge||0)*6;spring.position.z=plunger.position.z+1;spring.scale.z=Math.max(.12,1-(g.plunge||0)*.85);
    renderer.render(scene,camera);
  }
  function dispose(){disposed=true;scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());assets.forEach(t=>t.dispose());environment.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
  canvas.addEventListener('webglcontextlost',e=>e.preventDefault());
  return {render,resize,dispose};
}
