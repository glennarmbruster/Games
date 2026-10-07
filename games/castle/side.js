/* Side-view siege: a counterweight swing, timed release, and planar rigid bodies. */
var CastleSling=(function(){
  'use strict';
  var titles=['Border Watch','The Timber Hall','Broken Bridge','The Twin Keeps','Powder House','High Command','Stone & Oak','Royal Redoubt'];
  function level(n){
    var k=(n-1)%8,tier=Math.min(4,Math.floor((n-1)/8)),p=[],guards=[],R=CC.rng(n*307+9);
    function add(t,x,y,w,h){p.push([t,x,y,0,w,h,.7]);}
    function column(x,h,wood){if(wood){add('door',x,h/2,.48,h);return;}for(var y=0;y<h-.01;y+=.6)add('b1',x,y+.3,.62,.6);}
    function floor(x,y,w){add('door',x,y,w,.26);}
    function knight(x,y){guards.push(p.length);add('guard',x,y+.58,.46,1.16);}
    function fort(x,stories,wood){for(var f=0;f<stories;f++){var y=f*2.4;
      if(wood){add('door',x-1.8,y+1.1,.42,2.2);add('door',x+1.8,y+1.1,.42,2.2);}
      else for(var j=0;j<4;j++){add('b1',x-1.8,y+.3+j*.6,.64,.6);add('b1',x+1.8,y+.3+j*.6,.64,.6);}
      floor(x,y+2.32,4.4);knight(x+(f%2?.5:-.5),y+.14);
    }for(var xx=-2;xx<=2;xx++)add('m',x+xx,stories*2.4+.35,.55,.6);}
    if(k===0)fort(5,2,false);
    if(k===1){fort(3,2,true);fort(9,1,false);}
    if(k===2){column(1,3,false);column(9,3,false);floor(5,3.15,9);knight(3,3.3);knight(7,3.3);fort(11,1,true);}
    if(k===3){fort(2,2,false);fort(9,3,false);}
    if(k===4){fort(5,3,true);add('tnt',3.9,.5,.8,1);add('tnt',6.2,2.85,.8,.8);}
    if(k===5){fort(5,4,false);knight(9,.05);column(10,2,false);}
    if(k===6){fort(2,2,false);fort(8,3,true);floor(5,4.8,3);knight(5,4.94);}
    if(k===7){fort(1,3,false);fort(9,3,false);floor(5,4.8,4);knight(5,4.94);add('tnt',1.6,.5,.8,1);}
    if(tier>0&&k!==2){add('tnt',6.2,.4,.7,.8);}
    return {n:n,name:titles[k],region:SiegeLevels.regions[Math.floor((n-1)/8)%5],theme:Math.floor((n-1)/8)%5,seed:n*307+9,pieces:p,banners:[],guards:guards,balls:5+Math.floor(guards.length/2),bot:Math.max(2,Math.ceil(guards.length/2)),target:.65,height:11,hint:'Tap to start the swing. Tap again to release. Bring down every guard.'};
  }
  function constrain(sim){sim.pieces.forEach(function(p){p.b.linearFactor.set(1,1,0);p.b.angularFactor.set(0,0,p.t==='guard'?0:1);});}
  function fire(C,sim,phase,ammo){
    if(sim.ballsLeft<=0)return[];
    var angle=(78-64*phase)*Math.PI/180, speed=23.7, out=[],num=ammo==='scatter'?3:1;
    for(var i=0;i<num;i++){var a=angle+(i-(num-1)/2)*.075,r=ammo==='scatter'?.3:.48;
      var b=new C.Body({mass:ammo==='scatter'?1.8:3.5,shape:new C.Sphere(r),linearDamping:.004});
      var theta=-.45+phase*2.45;b.position.set(-15+3*Math.cos(theta)+1.1*Math.sin(theta),3+3*Math.sin(theta)-1.1*Math.cos(theta),0);b.velocity.set(Math.cos(a)*speed,Math.sin(a)*speed,0);b.linearFactor.set(1,1,0);b.angularFactor.set(0,0,1);b.isBall=true;b.isSide=true;
      var ball={b:b,born:sim.t,gone:false,ammo:ammo,r:r};b.addEventListener('collide',function(e){if(e.body.piece&&this.ammo==='bomb')this.explode=true;}.bind(ball));
      sim.world.addBody(b);sim.balls.push(ball);out.push(ball);
    }sim.ballsLeft--;sim.shots++;sim.lastShotT=sim.t;return out;
  }
  function blast(sim,ball){var c=ball.b.position;sim.events.push({t:'boom',x:c.x,y:c.y,z:c.z});sim.pieces.forEach(function(p){if(p.gone)return;var dx=p.b.position.x-c.x,dy=p.b.position.y-c.y,d=Math.hypot(dx,dy);if(d>3.4)return;p.b.wakeUp();var f=1-d/3.4;p.b.velocity.x+=dx/Math.max(d,.4)*15*f;p.b.velocity.y+=Math.max(3,dy/Math.max(d,.4)*12)*f;p.b.angularVelocity.z+=(sim.R()-.5)*12*f;if(p.t==='tnt')p.boom=true;});ball.gone=true;ball.goneT=sim.t;if(ball.b.world)sim.world.removeBody(ball.b);}
  function rig(T,scene){
    var g=new T.Group(),wood=new T.MeshStandardMaterial({color:0x654936,roughness:.85}),iron=new T.MeshStandardMaterial({color:0x343e44,metalness:.55,roughness:.5}),rope=new T.MeshStandardMaterial({color:0xb6a075,roughness:1});
    function beam(a,b,w,mat,parent){var v1=new T.Vector3(...a),v2=new T.Vector3(...b),d=v2.clone().sub(v1);var m=new T.Mesh(new T.BoxGeometry(w,d.length(),w),mat);m.position.copy(v1.add(v2).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.castShadow=true;(parent||g).add(m);return m;}
    [-.55,.55].forEach(function(z){beam([-18,0,z],[-15,3,z],.24,wood);beam([-12,0,z],[-15,3,z],.24,wood);beam([-18,.2,z],[-12,.2,z],.28,wood);});
    beam([-15,3,-.7],[-15,3,.7],.22,iron);
    var arm=new T.Group();arm.position.set(-15,3,0);g.add(arm);beam([-1.2,0,0],[3,0,0],.17,wood,arm);
    var counter=new T.Mesh(new T.BoxGeometry(.8,1,.8),iron);counter.position.set(-1,-.5,0);arm.add(counter);
    var sling=beam([3,0,0],[3,-1.1,0],.035,rope,arm),stone=new T.Mesh(new T.SphereGeometry(.35,12,8),new T.MeshStandardMaterial({color:0x686c6b,roughness:1}));stone.position.set(3,-1.1,0);arm.add(stone);
    var ground=new T.Mesh(new T.BoxGeometry(100,120,5),new T.MeshStandardMaterial({color:0x626951,roughness:1}));ground.position.set(0,-60.03,-.5);ground.receiveShadow=true;g.add(ground);
    var turf=new T.Mesh(new T.BoxGeometry(100,.12,5.04),new T.MeshStandardMaterial({color:0x879276,roughness:1}));turf.position.set(0,-.08,-.5);g.add(turf);
    var detailRandom=CC.rng(817);for(var j=0;j<100;j++){var rock=new T.Mesh(new T.DodecahedronGeometry(.09+detailRandom()*.16,0),new T.MeshStandardMaterial({color:j%2?0x727363:0x8b8876,roughness:1}));rock.scale.set(2,.55,.7);rock.position.set(-45+detailRandom()*90,-.45-detailRandom()*3,2.06);g.add(rock);}
    scene.add(g);
    // Side-view scenery uses layered silhouettes so the trajectory stays readable.
    for(var layer=0;layer<3;layer++){var shape=new T.Shape();shape.moveTo(-45,-2);for(var x=-45;x<=45;x+=3){var peak=7+(2-layer)*3+Math.sin(x*.2+layer)*3+Math.sin(x*.67+layer)*1.2;shape.lineTo(x,peak);}shape.lineTo(45,-5);shape.closePath();var mountain=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:[0x9cafad,0x7d9690,0x58766d][layer]}));mountain.position.z=-30+layer*5;g.add(mountain);}
    for(var i=0;i<18;i++){var tree=new T.Mesh(new T.ConeGeometry(.35+(i%3)*.1,1.5+(i%4)*.3,7),new T.MeshStandardMaterial({color:0x37584f,roughness:1}));tree.position.set(-28+i*3.3,1+(i%3)*.4,-4);g.add(tree);}
    return {group:g,update:function(p,loaded){arm.rotation.z=-.45+p*2.45;stone.visible=loaded;}};
  }
  return {level:level,constrain:constrain,fire:fire,blast:blast,rig:rig};
})();
