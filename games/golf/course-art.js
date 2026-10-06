/* Pin High course presentation. Local assets only; never alters course geometry used by physics. */
window.PinHighArt = function (T, renderer) {
  'use strict';
  var crowns = null, forest = [], water = [], ready = 0, loader = new T.TextureLoader();
  function treeTex(name) {
    var t = loader.load('assets/' + name + '-v1.webp', function () { ready++; });
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    t.userData.shared = true; return t;
  }
  var oak = treeTex('oak'), pine = treeTex('pine'), canopy=treeTex('canopy');
  var noise = `
    float phHash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float phNoise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(phHash(i),phHash(i+vec2(1.,0.)),f.x),mix(phHash(i+vec2(0.,1.)),phHash(i+1.),f.x),f.y); }
  `;
  function turf(extra) {
    var m = new T.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:1},extra||{}));
    m.onBeforeCompile = function (s) {
      s.vertexShader = 'varying vec3 phWorld;\n'+s.vertexShader;
      s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n phWorld=(modelMatrix*vec4(position,1.0)).xyz;');
      s.fragmentShader='varying vec3 phWorld;\n'+noise+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec2 p=phWorld.xz;
        float grain=phNoise(p*22.0), blades=phNoise(p*vec2(85.,12.));
        float broad=phNoise(p*.23)*.5+phNoise(p*.73)*.3+phNoise(p*2.1)*.2;
        float fade=1.-smoothstep(25.,160.,length(cameraPosition-phWorld));
        diffuseColor.rgb*=.90+broad*.17+(grain-.5)*.13*fade+(blades-.5)*.12*fade;
      `);
    };
    m.customProgramCacheKey=function(){return 'pin-high-turf-v1';}; return m;
  }
  function lake() {
    var m=new T.MeshStandardMaterial({color:0x287d89,roughness:.28,metalness:.24,transparent:true,opacity:.94});
    m.onBeforeCompile=function(s){
      s.uniforms.phTime={value:0};water.push(s.uniforms.phTime);
      s.vertexShader='varying vec3 phWorld;\n'+s.vertexShader;
      s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n phWorld=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader='varying vec3 phWorld; uniform float phTime;\n'+noise+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float ripple=sin(phWorld.x*3.+phWorld.z*5.+phTime*.8)*sin(phWorld.z*4.-phTime*.6);
        float glint=pow(max(0.,ripple),12.);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.53,.77,.79),.16+glint*.25);
      `);
      s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        normal=normalize(normal+vec3(sin(phWorld.z*5.+phTime)*.075,cos(phWorld.x*4.-phTime)*.075,0.));
      `);
    };m.customProgramCacheKey=function(){return 'pin-high-water-v1';};return m;
  }
  function trees(group,H) {
    forest=[];
    [false,true].forEach(function(isPine){
      var list=H.trees.filter(function(t){return !!t.pine===isPine;});if(!list.length)return;
      var geo=new T.PlaneGeometry(1,1);geo.translate(0,.5,0);
      var mat=new T.MeshBasicMaterial({map:isPine?pine:oak,alphaTest:.42,side:T.DoubleSide,color:0xffffff});
      var mesh=new T.InstancedMesh(geo,mat,list.length);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;
      mesh.castShadow=true;group.add(mesh);forest.push({mesh:mesh,list:list,pine:isPine});
      var c=new T.Color();list.forEach(function(t,i){c.setRGB(.92+.08*Math.abs(Math.sin(t.x)),.95+.05*Math.abs(Math.sin(t.z)),.89+.11*Math.abs(Math.sin(t.x+t.z)));mesh.setColorAt(i,c);});
    });

    if(H.trees.length){
      var topGeo=new T.PlaneGeometry(1,1);topGeo.rotateX(-Math.PI/2);
      crowns=new T.InstancedMesh(topGeo,new T.MeshBasicMaterial({map:canopy,alphaTest:.42,side:T.DoubleSide}),H.trees.length);
      var m=new T.Matrix4(),p=new T.Vector3(),sc=new T.Vector3(),qt=new T.Quaternion();
      H.trees.forEach(function(t,i){p.set(t.x,t.y+t.h*.8,t.z);sc.set(t.r*2.2,1,t.r*2.2);qt.setFromAxisAngle(new T.Vector3(0,1,0),t.x);m.compose(p,qt,sc);crowns.setMatrixAt(i,m);});
      crowns.frustumCulled=false;crowns.castShadow=true;crowns.visible=false;group.add(crowns);
    }
  }
  var viewDir=new T.Vector3(),mat4=new T.Matrix4(),pos=new T.Vector3(),scale=new T.Vector3(),q=new T.Quaternion(),axis=new T.Vector3(0,1,0);
  function update(time,camera){
    water.forEach(function(u){u.value=time;});
    camera.getWorldDirection(viewDir);var overhead=viewDir.y<-.65;if(crowns)crowns.visible=overhead;
    forest.forEach(function(f){f.mesh.visible=!overhead;if(overhead)return;f.list.forEach(function(t,i){
      // Upright camera-facing foliage; bottoms stay at the actual collision-tree bases.
      var h=t.h*1.08;pos.set(t.x,t.y-h*.043,t.z);scale.set(f.pine?Math.max(t.r*2.05,h*.55):Math.max(t.r*2.15,h*.88),h,1);
      q.setFromAxisAngle(axis,Math.atan2(camera.position.x-t.x,camera.position.z-t.z));mat4.compose(pos,q,scale);f.mesh.setMatrixAt(i,mat4);
    });f.mesh.instanceMatrix.needsUpdate=true;});
  }
  function hills(group,H){
    var b=H.bounds,cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,base=H.heightAt(0,0)-7;
    var geo=new T.BufferGeometry(),P=[],C=[],I=[],cols=[new T.Color(0x526e63),new T.Color(0x799c91)],n=128,rings=9;
    for(var j=0;j<rings;j++)for(var i=0;i<=n;i++){
      var a=i/n*Math.PI*2,r=260+j*65;
      var ridge=Math.sin(a*3+.7)*.22+Math.sin(a*7+1.9)*.15+Math.cos(a*11)*.08;
      var h=Math.sin(j/(rings-1)*Math.PI)*(30+ridge*70);
      P.push(cx+Math.cos(a)*r,base+h,cz+Math.sin(a)*r*1.25);
      var col=cols[0].clone().lerp(cols[1],j/(rings-1));col.multiplyScalar(.9+.15*Math.sin(a*39+j*8)*Math.sin(a*13-j*5));C.push(col.r,col.g,col.b);
      if(j&&i){var k=j*(n+1)+i;I.push(k,k-1,k-n-1,k-1,k-n-2,k-n-1);}
    }
    geo.setAttribute('position',new T.Float32BufferAttribute(P,3));geo.setAttribute('color',new T.Float32BufferAttribute(C,3));geo.setIndex(I);geo.computeVertexNormals();
    group.add(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide,fog:false})));
  }
  function details(group,H){
    // A discreet tee-side course sign and a slatted bench, safely outside the playable corridor.
    if(!H.tees)return;var tee=H.tees.mid||Object.values(H.tees)[0],x=tee[0]-7,z=tee[1]+1,y=H.heightAt(x,z);
    var wood=new T.MeshStandardMaterial({color:0x776047,roughness:.8}),metal=new T.MeshStandardMaterial({color:0x233e35,roughness:.5});
    function box(w,h,d,px,py,pz,mat){var m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
    [-.6,.6].forEach(function(dx){box(.09,.9,.09,x+dx,y+.45,z,metal);});
    var c=document.createElement('canvas');c.width=512;c.height=256;var g=c.getContext('2d');g.fillStyle='#163d30';g.fillRect(0,0,512,256);g.strokeStyle='#cbb985';g.lineWidth=4;g.strokeRect(14,14,484,228);g.fillStyle='#f9f4dc';g.textAlign='center';g.font='28px Georgia';g.fillText('PIN HIGH',256,57);g.font='bold 54px Georgia';g.fillText(H.range?'PRACTICE':('HOLE '+(H.n||1)),256,137);g.font='23px system-ui';g.fillText(H.range?'DRIVING RANGE':('PAR '+H.par),256,194);
    var tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;var sign=new T.Mesh(new T.BoxGeometry(1.9,.95,.06),new T.MeshStandardMaterial({map:tex,roughness:.8}));sign.position.set(x,y+1.05,z);sign.castShadow=true;group.add(sign);
    x=tee[0]+8;z=tee[1]+3;y=H.heightAt(x,z);
    for(var j=0;j<4;j++)box(2,.065,.1,x,y+.48,z+j*.13,wood);
    for(j=0;j<3;j++)box(2,.10,.06,x,y+.7+j*.14,z+.48,wood);
    [-.75,.75].forEach(function(dx){box(.09,.5,.5,x+dx,y+.23,z+.22,metal);});
  }
  return {turf:turf,lake:lake,trees:trees,hills:hills,details:details,update:update,reset:function(){forest=[];crowns=null;water=[];},get ready(){return ready;}};
};
