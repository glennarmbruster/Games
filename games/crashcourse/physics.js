import * as C from '../arcade4/cannon-es.min.js';
export function createSimulation(onImpact){
 const world=new C.World({gravity:new C.Vec3(0,-14,0)});world.broadphase=new C.SAPBroadphase(world);world.solver.iterations=12;world.defaultContactMaterial.friction=.55;world.defaultContactMaterial.restitution=.12;
 const entities=[];function box(x,y,z,w,h,d,color,mass=0,rx=0,ry=0,rz=0,type='box'){const body=new C.Body({mass,shape:new C.Box(new C.Vec3(w/2,h/2,d/2)),position:new C.Vec3(x,y,z)});body.quaternion.setFromEuler(rx,ry,rz,'XYZ');body.aabbNeedsUpdate=true;body.updateAABB();body.linearDamping=.04;body.angularDamping=.12;body.tag=type;world.addBody(body);const e={body,w,h,d,color,type};entities.push(e);return e;}
 const floor=new C.Body({mass:0,shape:new C.Box(new C.Vec3(140,.5,140)),position:new C.Vec3(0,-.5,0)});world.addBody(floor);
 box(0,1,-115,230,2,2,'#e0eaf1');box(0,1,115,230,2,2,'#e0eaf1');box(-115,1,0,2,2,230,'#e0eaf1');box(115,1,0,2,2,230,'#e0eaf1');
 box(0,1.45,27,8,.6,14,'#f68d35',0,-.25,0,0,'ramp');box(-34,2.25,-35,10,.65,18,'#ed8544',0,-.29,.6,0,'ramp');box(52,1.95,55,9,.65,17,'#24b9d0',0,-.27,-.8,0,'ramp');
 for(let i=0;i<16;i++){let a=i*Math.PI*2/16;box(33+Math.cos(a)*6,6+Math.sin(a)*6,12,2.5,.35,23,i%2?'#f0a553':'#2086b0',0,0,0,a+Math.PI/2,'tube');}
 for(let row=0;row<4;row++)for(let col=0;col<5-row;col++)box(-29+col*2.3+row*1.15,1.1+row*2.2,24,2.1,2.1,2.1,['#2e9fe0','#ed9d35','#eb5462'][row%3],9,0,0,0,'crate');
 for(let i=0;i<10;i++)box(-12+i*2.8,.8,-35,2,1.6,1.6,i%2?'#ffd65b':'#ef8954',6,0,0,0,'crate');
 for(let i=0;i<5;i++)box(55,1.8+i*3.6,-27,9,3.5,2.5,i%2?'#38465a':'#f6c957',0,0,0,0,'wall');
 box(-60,3.5,0,4,7,4,'#4b668b');box(-40,3.5,0,4,7,4,'#4b668b');box(-50,7.5,0,24,1,4,'#fcbe4f');
 const sweeper=box(15,1.6,-68,20,.65,1.4,'#ed537b',0,0,0,0,'sweeper');sweeper.body.type=C.Body.KINEMATIC;sweeper.body.angularVelocity.set(0,.65,0);
 const chassis=new C.Body({mass:180});chassis.addShape(new C.Box(new C.Vec3(.96,.4,2.05)),new C.Vec3(0,.18,0));chassis.position.set(0,1.5,-18);chassis.angularDamping=.6;chassis.linearDamping=.02;world.addBody(chassis);
 const vehicle=new C.RaycastVehicle({chassisBody:chassis,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
 const wheelOptions={radius:.48,directionLocal:new C.Vec3(0,-1,0),suspensionStiffness:32,suspensionRestLength:.45,frictionSlip:4.5,dampingRelaxation:2.5,dampingCompression:4.4,maxSuspensionForce:10000,rollInfluence:.12,axleLocal:new C.Vec3(-1,0,0),maxSuspensionTravel:.32,customSlidingRotationalSpeed:-25,useCustomSlidingRotationalSpeed:true};
 [[-1.03,0,1.35],[1.03,0,1.35],[-1.03,0,-1.35],[1.03,0,-1.35]].forEach(p=>vehicle.addWheel({...wheelOptions,chassisConnectionPointLocal:new C.Vec3(...p)}));vehicle.addToWorld(world);
 let cooldown=0;chassis.addEventListener('collide',ev=>{let impact=Math.abs(ev.contact.getImpactVelocityAlongNormal());if(impact>3.5&&cooldown<=0){cooldown=.4;if(onImpact)onImpact(impact,ev.body.tag||'ground');}});
 function reset(){chassis.position.set(0,1.6,-18);chassis.quaternion.set(0,0,0,1);chassis.velocity.set(0,0,0);chassis.angularVelocity.set(0,0,0);chassis.force.set(0,0,0);chassis.torque.set(0,0,0);chassis.wakeUp();for(let i=0;i<4;i++){vehicle.applyEngineForce(0,i);vehicle.setBrake(0,i);}}
 function step(dt,input){cooldown=Math.max(0,cooldown-dt);let steering=(input.left?1:0)-(input.right?1:0);vehicle.setSteeringValue(steering*.48,0);vehicle.setSteeringValue(steering*.48,1);let force=input.gas?-430:input.reverse?240:0;for(let i=0;i<4;i++){vehicle.applyEngineForce(force*(input.power||1),i);vehicle.setBrake(input.brake?18:force?0:.3,i);}world.step(1/60,Math.min(.05,dt),4);for(let i=0;i<4;i++)vehicle.updateWheelTransform(i);}
 return{world,entities,chassis,vehicle,step,reset};
}
