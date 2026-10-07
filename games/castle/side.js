/* Side-view siege: a counterweight swing, timed release, and planar rigid bodies. */
var CastleSling=(function(){
  'use strict';
  var titles=['Border Watch','The Timber Hall','Broken Bridge','The Twin Keeps','Powder House','High Command','Stone & Oak','Royal Redoubt'];
  function level(n){
    var k=(n-1)%8,tier=Math.min(4,Math.floor((n-1)/8)),p=[],guards=[],banners=[],R=CC.rng(n*307+9);
    function add(t,x,y,w,h){p.push([t,x,y,0,w,h,.7]);}
    function column(x,h,wood){if(wood){add('door',x,h/2,.48,h);return;}for(var y=0;y<h-.01;y+=.6)add('b1',x,y+.3,.62,.6);}
    function floor(x,y,w){add('door',x,y,w,.26);}
    function knight(x,y){guards.push(p.length);add('guard',x,y+.58,.46,1.16);}
    function fort(x,stories,wood){for(var f=0;f<stories;f++){var y=f*2.4;
      if(wood){add('door',x-1.8,y+1.1,.42,2.2);add('door',x+1.8,y+1.1,.42,2.2);}
      else for(var j=0;j<4;j++){add('b1',x-1.8,y+.3+j*.6,.64,.6);add('b1',x+1.8,y+.3+j*.6,.64,.6);}
      floor(x,y+2.32,4.4);knight(x+(f%2?.5:-.5),y+.14);
    }for(var xx=-2;xx<=2;xx++)add('m',x+xx,stories*2.4+.35,.55,.6);banners.push({x:x-1.8,y:stories*2.4-.5,z:.35});}
    if(k===0)fort(5,2,false);
    if(k===1){fort(3,2,true);fort(9,1,false);}
    if(k===2){column(1,3,false);column(9,3,false);floor(5,3.15,9);knight(3,3.3);knight(7,3.3);fort(11,1,true);}
    if(k===3){fort(2,2,false);fort(9,3,false);}
    if(k===4){fort(5,3,true);add('tnt',3.9,.5,.8,1);add('tnt',6.2,2.85,.8,.8);}
    if(k===5){fort(5,4,false);knight(9,.05);column(10,2,false);}
    if(k===6){fort(2,2,false);fort(8,3,true);floor(5,4.8,3);knight(5,4.94);}
    if(k===7){fort(1,3,false);fort(9,3,false);floor(5,4.8,4);knight(5,4.94);add('tnt',1.6,.5,.8,1);}
    if(tier>0&&k!==2){add('tnt',6.2,.4,.7,.8);}
    return {n:n,name:titles[k],region:SiegeLevels.regions[Math.floor((n-1)/8)%5],theme:Math.floor((n-1)/8)%5,seed:n*307+9,pieces:p,banners:banners,guards:guards,balls:5+Math.floor(guards.length/2),bot:Math.max(2,Math.ceil(guards.length/2)),target:.65,height:11,hint:'Choose a low angle or tap a target. Check the dotted arc, then Fire sling.'};
  }
  function constrain(sim){sim.pieces.forEach(function(p){p.b.linearFactor.set(1,1,0);p.b.angularFactor.set(0,0,p.t==='guard'?0:1);});}
  function fire(C,sim,degrees,ammo){
    if(sim.ballsLeft<=0)return[];
    var angle=Math.max(0,Math.min(65,degrees))*Math.PI/180, speed=30, out=[],num=ammo==='scatter'?3:1;
    for(var i=0;i<num;i++){var a=angle+(i-(num-1)/2)*.075,r=ammo==='scatter'?.3:.48;
      var b=new C.Body({mass:ammo==='scatter'?1.8:3.5,shape:new C.Sphere(r),linearDamping:.004});
      b.position.set(-12,2.2,0);b.velocity.set(Math.cos(a)*speed,Math.sin(a)*speed,0);b.linearFactor.set(1,1,0);b.angularFactor.set(0,0,1);b.isBall=true;b.isSide=true;
      var ball={b:b,born:sim.t,gone:false,ammo:ammo,r:r};b.addEventListener('collide',function(e){if(e.body.piece&&this.ammo==='bomb')this.explode=true;}.bind(ball));
      sim.world.addBody(b);sim.balls.push(ball);out.push(ball);
    }sim.ballsLeft--;sim.shots++;sim.lastShotT=sim.t;return out;
  }
  function predict(degrees,sim){var a=degrees*Math.PI/180,x=-12,y=2.2,vx=30*Math.cos(a),vy=30*Math.sin(a),dt=1/60,points=[[x,y]],damp=Math.pow(1-.004,dt);
    for(var i=0;i<210;i++){vx*=damp;vy*=damp;vy-=18*dt;x+=vx*dt;y+=vy*dt;if(y<.2||x>24)break;if(i%3===0)points.push([x,y]);if(sim&&sim.pieces.some(function(p){if(p.gone)return false;var dx=x-p.b.position.x,dy=y-p.b.position.y;return Math.abs(dx)<p.size[0]/2+.25&&Math.abs(dy)<p.size[1]/2+.25;}))break;}return points;}
  function angleTo(x,y){var dx=x+12,dy=y-2.2,g=18,v2=900,disc=v2*v2-g*(g*dx*dx+2*dy*v2);if(dx<=0||disc<0)return null;return Math.max(0,Math.min(65,Math.round(Math.atan((v2-Math.sqrt(disc))/(g*dx))*180/Math.PI)));}
  function blast(sim,ball){var c=ball.b.position;sim.events.push({t:'boom',x:c.x,y:c.y,z:c.z});sim.pieces.forEach(function(p){if(p.gone)return;var dx=p.b.position.x-c.x,dy=p.b.position.y-c.y,d=Math.hypot(dx,dy);if(d>3.4)return;p.b.wakeUp();var f=1-d/3.4;p.b.velocity.x+=dx/Math.max(d,.4)*15*f;p.b.velocity.y+=Math.max(3,dy/Math.max(d,.4)*12)*f;p.b.angularVelocity.z+=(sim.R()-.5)*12*f;if(p.t==='tnt')p.boom=true;});ball.gone=true;ball.goneT=sim.t;if(ball.b.world)sim.world.removeBody(ball.b);}
  function rig(T,scene){
    var g=new T.Group(),R=CC.rng(761),motion=1;
    function texture(draw){var c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'));var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
    var woodTex=texture(function(x){x.fillStyle='#876342';x.fillRect(0,0,256,256);for(var i=0;i<180;i++){x.strokeStyle=i%2?'#65493266':'#b4976966';x.lineWidth=.5+R()*2;x.beginPath();var y=R()*256;x.moveTo(0,y);x.bezierCurveTo(75,y+R()*9,180,y-R()*9,256,y);x.stroke();}for(var j=0;j<8;j++){x.strokeStyle='#4b392c88';x.beginPath();x.ellipse(R()*256,R()*256,12,3,0,0,7);x.stroke();}});
    var wood=new T.MeshStandardMaterial({map:woodTex,color:0xc1a983,roughness:.8}),iron=new T.MeshStandardMaterial({color:0x39434a,metalness:.7,roughness:.38}),rope=new T.MeshStandardMaterial({color:0xc8b993,roughness:1}),brass=new T.MeshStandardMaterial({color:0xbda170,metalness:.65,roughness:.4});
    function mesh(geo,mat,x,y,z,parent){var m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(parent||g).add(m);return m;}
    function beam(a,b,w,mat,parent){var v1=new T.Vector3(...a),v2=new T.Vector3(...b),d=v2.clone().sub(v1);var m=mesh(new T.BoxGeometry(w,d.length(),w),mat,0,0,0,parent);m.position.copy(v1.add(v2).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
    [-.62,.62].forEach(function(z){beam([-17.7,.45,z],[-15,3,z],.34,wood);beam([-12.6,.45,z],[-15,3,z],.34,wood);beam([-18,.5,z],[-12,.5,z],.32,wood);beam([-17.2,1,z],[-13.3,1.8,z],.17,wood);
      [-17.1,-12.8].forEach(function(x){var tire=mesh(new T.TorusGeometry(.42,.065,8,24),iron,x,.46,z);for(var j=0;j<8;j++){var a=j*Math.PI/4;beam([x,.46,z],[x+Math.cos(a)*.4,.46+Math.sin(a)*.4,z],.075,wood);}var hub=mesh(new T.CylinderGeometry(.12,.12,.25,12),brass,x,.46,z);hub.rotation.x=Math.PI/2;});
      [[-15,3],[-17.65,.5],[-12.5,.5],[-16.1,1.85],[-13.9,1.85]].forEach(function(p){var plate=mesh(new T.BoxGeometry(.42,.36,.045),iron,p[0],p[1],z+.19);[-.12,.12].forEach(function(dx){mesh(new T.SphereGeometry(.035,6,4),brass,p[0]+dx,p[1],z+.23);});});
    });
    beam([-15,3,-.85],[-15,3,.85],.25,iron);
    var arm=new T.Group();arm.position.set(-15,3,0);g.add(arm);beam([-1.4,0,0],[3,0,0],.24,wood,arm);[-1,.2,1.9,2.8].forEach(function(x){mesh(new T.BoxGeometry(.16,.28,.28),iron,x,0,0,arm);});
    var counter=mesh(new T.BoxGeometry(1,1.2,.9),wood,-1.1,-.55,0,arm);[-.8,-.3].forEach(function(y){mesh(new T.BoxGeometry(1.04,.12,.94),iron,-1.1,y,0,arm);});
    beam([3,0,0],[3,-.8,-.18],.045,rope,arm);beam([3,0,0],[3,-.8,.18],.045,rope,arm);
    var pouch=mesh(new T.SphereGeometry(.38,16,8),new T.MeshStandardMaterial({color:0x5d4737,roughness:1}),3,-.88,0,arm);pouch.scale.set(1,.3,.75);
    var stone=mesh(new T.IcosahedronGeometry(.34,1),new T.MeshStandardMaterial({color:0x878c86,roughness:.9}),3,-.8,0,arm);
    var crank=mesh(new T.CylinderGeometry(.3,.3,.65,16),wood,-16,.9,0);crank.rotation.x=Math.PI/2;beam([-16,.9,.6],[-16,1.45,.6],.1,iron);beam([-16,1.45,.6],[-16,1.45,.9],.1,wood);
    // Detailed terrain remains behind every hit-tested object.
    var dirtTex=texture(function(x){var grd=x.createLinearGradient(0,0,0,256);grd.addColorStop(0,'#5f654b');grd.addColorStop(.12,'#414b3d');grd.addColorStop(1,'#15292b');x.fillStyle=grd;x.fillRect(0,0,256,256);for(var i=0;i<600;i++){x.fillStyle=i%2?'#998a6826':'#17232655';x.fillRect(R()*256,R()*256,2+R()*12,1+R()*3);}});dirtTex.wrapS=T.RepeatWrapping;dirtTex.repeat.set(14,1);
    var ground=mesh(new T.BoxGeometry(100,80,5),new T.MeshStandardMaterial({color:0x273b35,roughness:1}),0,-40.06,-.5);
    mesh(new T.BoxGeometry(100,3.2,.06),new T.MeshStandardMaterial({map:dirtTex,roughness:1}),0,-1.65,2.02);
    mesh(new T.BoxGeometry(100,.12,5.02),new T.MeshStandardMaterial({color:0x7e8a57,roughness:1}),0,-.08,-.5);
    var grassMat=new T.MeshStandardMaterial({color:0x829465,roughness:1,side:T.DoubleSide}),flowerMat=new T.MeshStandardMaterial({color:0xcdbb84,roughness:1});
    for(var i=0;i<160;i++){var x=-35+R()*75,y=R()*.07,z=-.9-R()*2;var tuft=mesh(new T.ConeGeometry(.055+R()*.09,.22+R()*.3,3),grassMat,x,y+.12,z);tuft.rotation.z=(R()-.5)*.7;if(i%9===0)mesh(new T.SphereGeometry(.055,6,4),flowerMat,x,y+.32,z);}
    var rockMat=new T.MeshStandardMaterial({color:0x788074,roughness:1});for(var j=0;j<55;j++){var rock=mesh(new T.DodecahedronGeometry(.1+R()*.22,0),rockMat,-35+R()*75,-.24-R()*2.8,2.1);rock.scale.set(1.8,.55,.55);}
    // Dimensional broadleaf trees and layered pines at the edges of the playing field.
    var leaves=[0x405d49,0x536d4b,0x738456].map(c=>new T.MeshStandardMaterial({color:c,roughness:1,flatShading:true}));
    [-26,-22,-19,15,19,24,29].forEach(function(x,i){var h=2.7+R()*2.4,z=-5-R()*3;mesh(new T.CylinderGeometry(.13,.22,h*.75,7),wood,x,h*.35,z);for(var k=0;k<6;k++){var crown=mesh(new T.IcosahedronGeometry(.65+R()*.55,1),leaves[k%3],x+(R()-.5)*1.3,h*.55+R()*h*.4,z+(R()-.5)*.8);crown.scale.y=.9;} });
    var loader=new T.TextureLoader();var backdropTex=loader.load('assets/sling-valley-v1.webp');backdropTex.colorSpace=T.SRGBColorSpace;
    var backdrop=mesh(new T.PlaneGeometry(100,66.667),new T.MeshBasicMaterial({map:backdropTex,depthWrite:false,fog:false}),0,13,-45);backdrop.castShadow=false;backdrop.receiveShadow=false;
    scene.add(g);
    return {group:g,fire:function(){motion=0;stone.visible=false;},update:function(angle,loaded,dt){motion=Math.min(1,motion+(dt||0)*2.8);arm.rotation.z=loaded?0:Math.sin(motion*Math.PI)*.9;stone.visible=loaded;pouch.visible=true;}};
  }
  return {predict:predict,angleTo:angleTo,level:level,constrain:constrain,fire:fire,blast:blast,rig:rig};
})();
