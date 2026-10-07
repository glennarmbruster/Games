/* Stranded: The Last Signal — original Goobs Games arcade adventure. */
(function(root){'use strict';
const FLOOR=454, W=960,H=540;
const THEMES=[
 {sky:['#121d38','#567b8a','#d6ab90'],rock:'#243846',top:'#829c9e',dark:'#122633',accent:'#74e9dd',moon:'#e3d3ba'},
 {sky:['#0b192b','#18454c','#5d7f70'],rock:'#183b43',top:'#709587',dark:'#0b242c',accent:'#6bf0c6',moon:'#b3dcbb'},
 {sky:['#211b36','#754955','#d78b65'],rock:'#493749',top:'#b58a81',dark:'#262436',accent:'#ffb37c',moon:'#f6c09c'},
 {sky:['#101e33','#264b6b','#85979d'],rock:'#293e58',top:'#8babb4',dark:'#12273e',accent:'#96d9ff',moon:'#d3e9ee'},
 {sky:['#211b31','#663d51','#bc735f'],rock:'#46303e',top:'#a97474',dark:'#241d32',accent:'#ffa886',moon:'#ecc5a7'},
 {sky:['#0c1731','#354b79','#9a8198'],rock:'#2b3457',top:'#939bbb',dark:'#131d39',accent:'#a2edff',moon:'#eee0cd'}];
// Platforms are one-way ledges. Switch-operated bridges are solid while powered.
const LEVELS=[
 {name:'THE FALL',sub:'A world that was never on the map.',tip:'Move with ← → or A / D. Jump with Space or ↑.',width:2700,spawn:100,checkpoint:1360,
 grounds:[[0,630],[775,1440],[1590,2700]],ledges:[[385,365,110],[1070,365,150],[1880,357,155],[2180,335,150]],
 cells:[[430,330],[1130,330],[2220,300]],enemies:[[980,'walker'],[1820,'walker'],[2360,'drone']],switches:[[1290,454]],gates:[[2500,0]],hazards:[],bridges:[],lore:'The survey ship is gone. A signal is still coming from the ridge.'},
 {name:'GLASS MARSH',sub:'The water remembers everything.',tip:'Hold Shield (C) to stop incoming fire. Release to recharge.',width:2920,spawn:95,checkpoint:1490,
 grounds:[[0,540],[715,1270],[1440,2090],[2250,2920]],ledges:[[310,350,130],[930,350,160],[1700,338,140],[2440,354,150]],
 cells:[[365,315],[1000,315],[1765,303]],enemies:[[860,'walker'],[1670,'drone'],[2490,'walker']],switches:[[1130,454]],gates:[[2700,0]],hazards:[[1860,454,60]],bridges:[],lore:'The ruins are drawing power from below. Follow the lights.'},
 {name:'THE FOUNDRY',sub:'Something is still building an army.',tip:'E / Use activates consoles. Cyan pads mark checkpoints.',width:3060,spawn:95,checkpoint:1540,
 grounds:[[0,650],[810,1390],[1550,2160],[2330,3060]],ledges:[[360,355,150],[1040,355,140],[1800,352,150],[2570,340,140]],
 cells:[[430,320],[1105,320],[2635,305]],enemies:[[930,'walker'],[1850,'walker'],[2460,'drone'],[2780,'walker']],switches:[[530,454],[2020,454]],gates:[[2830,1]],hazards:[[1220,454,65]],bridges:[[650,810,0]],lore:'Two relays. One opens the bridge. The other releases the containment door.'},
 {name:'THE HIGH ROAD',sub:'Above the clouds, nowhere to hide.',tip:'Fire with X or J. A red sightline means a shot is coming.',width:3160,spawn:95,checkpoint:1630,
 grounds:[[0,540],[705,1310],[1480,2180],[2340,3160]],ledges:[[330,344,130],[960,349,150],[1820,342,160],[2650,334,160]],
 cells:[[390,309],[1035,314],[2720,299]],enemies:[[860,'drone'],[1170,'walker'],[1750,'drone'],[2520,'walker'],[2840,'drone']],switches:[[2050,454]],gates:[[2940,0]],hazards:[],bridges:[],lore:'A rescue skiff is docked at the far tower. Its beacon has gone dark.'},
 {name:'THE ENGINE',sub:'Wake the sleeping city.',tip:'Keep moving between cover. Your shield cannot last forever.',width:3250,spawn:95,checkpoint:1660,
 grounds:[[0,620],[780,1370],[1530,2230],[2390,3250]],ledges:[[370,352,140],[1050,340,140],[1850,350,155],[2640,335,160]],
 cells:[[440,317],[1115,305],[2710,300]],enemies:[[925,'walker'],[1200,'drone'],[1830,'walker'],[2560,'walker'],[2860,'drone']],switches:[[520,454],[2130,454]],gates:[[3000,1]],hazards:[[1950,454,65]],bridges:[[1370,1530,0]],lore:'Bring the reactor online. The extraction beacon needs every last volt.'},
 {name:'LAST LIGHT',sub:'One signal. One way home.',tip:'Power the beacon, cross the final span, reach the skiff.',width:3370,spawn:95,checkpoint:1720,
 grounds:[[0,570],[730,1420],[1580,2240],[2400,3370]],ledges:[[350,345,140],[1050,345,150],[1900,343,150],[2670,337,150]],
 cells:[[420,310],[1120,310],[2740,302]],enemies:[[875,'drone'],[1240,'walker'],[1830,'drone'],[2530,'walker'],[2900,'drone']],switches:[[2100,454]],gates:[[3100,0]],hazards:[[1980,454,55]],bridges:[[2240,2400,0]],lore:'Transmission received. The skiff is yours. Get off this world.'}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class Game{
 constructor(opts={}){this.mode=opts.mode||'arcade';this.emit=opts.emit||(()=>{});this.best=0;this.reset();}
 reset(){this.score=0;this.deaths=0;this.lives=3;this.time=0;this.totalCells=0;this.status='playing';this.load(0);}
 load(i){this.startScore=this.score;this.startCells=this.totalCells;this.level=i;this.def=LEVELS[i];this.x=this.def.spawn;this.y=FLOOR;this.vx=0;this.vy=0;this.facing=1;this.ground=true;this.coyote=.12;this.jumpBuffer=0;this.shield=100;this.hp=this.mode==='story'?5:3;this.invuln=1.5;this.cooldown=0;this.shielding=false;this.overheated=false;this.shots=[];this.particles=[];this.switches=this.def.switches.map(()=>false);this.cells=this.def.cells.map(()=>false);this.enemies=this.def.enemies.map(([x,type],n)=>({x,y:type==='drone'?386:FLOOR,base:x,type,hp:type==='drone'?2:3,dir:-1,t:.7+n*.45,state:'patrol',fire:1+n*.5,flash:0,dead:false}));this.camera=0;this.checkpoint=false;this.checkstate=null;this.deadTimer=0;this.levelTime=0;this.exitDelay=0;this.emit('sector',this.def);}
 snapshot(){return {version:1,mode:this.mode,level:this.level,score:this.checkpoint?this.checkstate.score:this.startScore,deaths:this.deaths,lives:this.lives,time:this.time,totalCells:this.checkpoint?this.checkstate.totalCells:this.startCells,checkpoint:this.checkpoint,checkstate:this.checkstate};}
 restore(s){if(!s||s.version!==1||!Number.isInteger(s.level)||s.level<0||s.level>=LEVELS.length)return false;this.mode=['story','arcade'].includes(s.mode)?s.mode:'arcade';this.load(s.level);this.score=Math.max(0,Number(s.score)||0);this.deaths=s.deaths||0;this.lives=clamp(Number.isFinite(s.lives)?s.lives:3,0,3);this.time=s.time||0;this.totalCells=s.totalCells||0;this.startScore=this.score;this.startCells=this.totalCells;if(s.checkpoint&&s.checkstate){this.checkpoint=true;this.checkstate=s.checkstate;this.restoreCheckpoint();}if(this.lives===0&&this.mode==='arcade')this.status='gameover';return true;}
 restoreCheckpoint(){if(this.checkpoint&&this.checkstate){this.x=this.def.checkpoint;this.switches=this.checkstate.switches.slice();this.cells=this.checkstate.cells.slice();this.enemies.forEach((e,i)=>{e.dead=this.checkstate.dead[i];if(e.dead)e.hp=0;});this.score=this.checkstate.score;this.totalCells=this.checkstate.totalCells;}else{this.x=this.def.spawn;}this.y=FLOOR;this.camera=clamp(this.x-250,0,this.def.width-W);}
 retry(){let old={checkpoint:this.checkpoint,checkstate:this.checkstate,score:this.checkpoint?this.checkstate.score:this.startScore,totalCells:this.checkpoint?this.checkstate.totalCells:this.startCells};this.score=old.score;this.totalCells=old.totalCells;this.load(this.level);Object.assign(this,old);this.restoreCheckpoint();this.status='playing';this.emit('saved');}
 continue(){this.lives=3;this.score=Math.max(0,this.score-1000);this.startScore=Math.max(0,this.startScore-1000);if(this.checkstate)this.checkstate.score=Math.max(0,this.checkstate.score-1000);this.retry();}
 spark(x,y,color,n=10){for(let i=0;i<n;i++)this.particles.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*210,life:.3+Math.random()*.5,color});}
 hurt(){if(this.invuln>0||this.status!=='playing')return;this.hp--;this.invuln=1.25;this.spark(this.x,this.y-30,'#ffac88',13);this.emit('hurt');if(this.hp<=0)this.die();}
 die(){if(this.status!=='playing')return;this.status='dead';this.deaths++;if(this.mode==='arcade')this.lives--;this.deadTimer=1.15;this.shielding=false;this.emit('death');}
 surfaces(){let a=this.def.grounds.map(([x,r])=>({x,r,y:FLOOR}));this.def.ledges.forEach(([x,y,w])=>a.push({x,r:x+w,y}));this.def.bridges.forEach(([x,r,s])=>{if(this.switches[s])a.push({x,r,y:FLOOR});});return a;}
 update(dt,k={}){dt=Math.min(dt,.04);this.particles=this.particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.life-=dt;return p.life>0;});
 if(this.status==='dead'){this.deadTimer-=dt;if(this.deadTimer<=0){if(this.lives<=0&&this.mode==='arcade'){this.status='gameover';this.emit('gameover');}else this.retry();}return;}
 if(this.status!=='playing')return;
 this.time+=dt;this.levelTime+=dt;this.invuln=Math.max(0,this.invuln-dt);this.cooldown-=dt;
 if(this.overheated&&this.shield>=35)this.overheated=false;
 this.shielding=!!k.shield&&this.shield>1&&!this.overheated;
 this.shield=clamp(this.shield+(this.shielding?-24:22)*dt,0,100);if(this.shield<=1)this.overheated=true;
 let dir=(k.right?1:0)-(k.left?1:0);if(dir)this.facing=dir;let target=dir*(this.shielding?125:255);this.vx+=(target-this.vx)*Math.min(1,dt*18);
 if(k.jump)this.jumpBuffer=.14;else this.jumpBuffer-=dt;
 this.coyote=this.ground?.12:this.coyote-dt;if(this.jumpBuffer>0&&this.coyote>0){this.vy=-600;this.ground=false;this.coyote=0;this.jumpBuffer=0;this.emit('jump');}
 const oldY=this.y;this.vy+=1500*dt;this.x=clamp(this.x+this.vx*dt,18,this.def.width-25);this.y+=this.vy*dt;this.ground=false;
 for(let s of this.surfaces())if(this.x+12>s.x&&this.x-12<s.r&&oldY<=s.y+3&&this.y>=s.y&&this.vy>=0){this.y=s.y;this.vy=0;this.ground=true;}
 this.def.gates.forEach(([x,s])=>{if(!this.switches[s]&&this.x>x-30&&this.x<x+45){this.x=x-30;this.vx=0;}});
 if(this.y>H+100){this.die();return;}
 for(let [x,y,w]of this.def.hazards)if(this.x>x-10&&this.x<x+w+10&&this.y>y-15&&this.y<=y+5)this.hurt();
 if(k.fire&&this.cooldown<=0&&!this.shielding){this.cooldown=.23;this.shots.push({x:this.x+this.facing*24,y:this.y-35,vx:this.facing*770,enemy:false,life:1.15});this.spark(this.x+this.facing*27,this.y-35,'#b0fff4',3);this.emit('shot');}
 if(k.use){this.def.switches.forEach(([x,y],i)=>{if(!this.switches[i]&&Math.abs(this.x-x)<76&&Math.abs(this.y-y)<70){this.switches[i]=true;this.score+=250;this.spark(x,y-42,'#89ffe4',20);this.emit('switch');this.emit('saved');}});}
 this.def.cells.forEach(([x,y],i)=>{if(!this.cells[i]&&Math.abs(this.x-x)<30&&Math.abs(this.y-28-y)<42){this.cells[i]=true;this.totalCells++;this.score+=150;this.shield=Math.min(100,this.shield+25);this.emit('cell');this.spark(x,y,'#ffc88e',14);}});
 if(!this.checkpoint&&this.x>=this.def.checkpoint&&this.ground){this.checkpoint=true;this.hp=this.mode==='story'?5:3;this.shield=100;this.checkstate={switches:this.switches.slice(),cells:this.cells.slice(),dead:this.enemies.map(e=>e.dead),score:this.score,totalCells:this.totalCells};this.emit('checkpoint');this.emit('saved');}
 for(let e of this.enemies){if(e.dead)continue;e.t+=dt;e.flash=Math.max(0,e.flash-dt);let distance=this.x-e.x;let active=Math.abs(distance)<590&&this.y<H;if(e.type==='drone')e.y=382+Math.sin(e.t*2)*13;
 if(active){e.dir=Math.sign(distance)||-1;e.fire-=dt;if(e.fire<.48)e.state='aim';if(e.fire<=0){this.shots.push({x:e.x+e.dir*20,y:e.y-32,vx:e.dir*(this.mode==='story'?275:330),enemy:true,life:2.7});e.fire=this.mode==='story'?2.4:1.65;e.state='patrol';this.emit('enemyshot');}}
 else {e.state='patrol';e.x=e.base+Math.sin(e.t*.6)*45;}
 if(Math.abs(distance)<28&&Math.abs(this.y-e.y)<52)this.hurt();
 }
 this.shots=this.shots.filter(s=>{let oldX=s.x;s.x+=s.vx*dt;s.life-=dt;if(s.life<=0)return false;
 if(s.enemy){if(Math.min(oldX,s.x)<this.x+18&&Math.max(oldX,s.x)>this.x-18&&s.y>this.y-63&&s.y<this.y+1){if(this.shielding){this.shield=Math.max(0,this.shield-12);this.spark(this.x+this.facing*24,s.y,'#8bfff3',8);this.emit('block');}else this.hurt();return false;}}
 else for(let e of this.enemies){if(e.dead)continue;if(Math.min(oldX,s.x)<e.x+23&&Math.max(oldX,s.x)>e.x-23&&Math.abs(s.y-(e.y-30))<32){e.hp--;e.flash=.1;this.spark(e.x,e.y-30,'#ffbd86',8);if(e.hp<=0){e.dead=true;this.score+=100;this.spark(e.x,e.y-25,'#b2fff4',22);this.emit('kill');}return false;}}
 for(let [x,i]of this.def.gates)if(!this.switches[i]&&Math.min(oldX,s.x)<x+12&&Math.max(oldX,s.x)>x-12)return false;
 return true;});
 this.camera+=(clamp(this.x-320+this.vx*.18,0,this.def.width-W)-this.camera)*Math.min(1,dt*5);
 if(this.x>this.def.width-100&&this.switches.every(Boolean)){this.score+=1000+Math.max(0,Math.floor(120-this.levelTime))*10;this.status='sectorClear';this.emit('clear');}
 }
 next(){if(this.level===LEVELS.length-1){this.status='won';this.emit('won');}else{this.load(this.level+1);this.status='playing';this.emit('saved');}}
}
const api={Game,LEVELS,THEMES,W,H,FLOOR,clamp};if(typeof module!=='undefined')module.exports=api;root.Stranded=api;
})(typeof globalThis!=='undefined'?globalThis:this);
