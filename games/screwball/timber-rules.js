/* Timber Tumble — deterministic pin-and-plank rules, shared by game and solver. */
(function(root){
'use strict';
const clone=s=>({pins:s.pins.slice(),bars:s.bars.map(b=>({...b}))});
const initial=l=>({pins:l.holes.map(h=>!!h.pin),bars:l.planks.map(()=>({mode:2,pivot:-1}))});
function geometry(l,s,i){
 const p=l.planks[i],b=s.bars[i],a=l.holes[p.a],z=l.holes[p.b],len=Math.hypot(z.x-a.x,z.y-a.y);
 if(b.mode===1){const h=l.holes[b.pivot];return {x1:h.x,y1:h.y,x2:h.x,y2:h.y+len,len};}
 return {x1:a.x,y1:a.y,x2:z.x,y2:z.y,len};
}
function distance(x,y,g){const dx=g.x2-g.x1,dy=g.y2-g.y1,t=Math.max(0,Math.min(1,((x-g.x1)*dx+(y-g.y1)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-g.x1-t*dx,y-g.y1-t*dy);}
function accessible(l,s,h){
 const at=l.holes[h];
 for(let i=0;i<l.planks.length;i++){
  const b=s.bars[i],p=l.planks[i]; if(!b.mode)continue;
  // Every aligned drilled hole remains open through all layers.
  if((b.mode===2&&(p.a===h||p.b===h))||(b.mode===1&&b.pivot===h))continue;
  if(distance(at.x,at.y,geometry(l,s,i))<p.width/2+11)return false;
 }
 return true;
}
function settle(l,s){
 for(let i=0;i<l.planks.length;i++){
  const b=s.bars[i],p=l.planks[i];
  if(b.mode===2){const a=s.pins[p.a],z=s.pins[p.b];if(!a&&!z)b.mode=0;else if(!a||!z){b.mode=1;b.pivot=a?p.a:p.b;}}
  else if(b.mode===1&&!s.pins[b.pivot])b.mode=0;
 }
 return s;
}
function move(l,s,from,to){
 if(from===to||!s.pins[from]||s.pins[to]||!accessible(l,s,from)||!accessible(l,s,to))return null;
 const n=clone(s);n.pins[from]=false;n.pins[to]=true;return settle(l,n);
}
const won=s=>s.bars.every(b=>b.mode===0);
const key=s=>s.pins.map(Number).join('')+'/'+s.bars.map(b=>b.mode===1?'h'+b.pivot:b.mode).join(',');
function choices(l,s){
 const sources=[],dest=[];
 for(let h=0;h<l.holes.length;h++)if(accessible(l,s,h))(s.pins[h]?sources:dest).push(h);
 const result=[];
 for(const a of sources)for(const b of dest){const n=move(l,s,a,b);let rank=0;
 for(let i=0;i<s.bars.length;i++){rank+=(s.bars[i].mode-n.bars[i].mode)*25;if(s.bars[i].mode&&n.bars[i].mode===0)rank+=80;}
 rank+=l.holes.reduce((v,h,j)=>v+(!n.pins[j]&&accessible(l,n,j)?1:0),0)*4;
 result.push({from:a,to:b,state:n,rank});}
 return result.sort((a,b)=>b.rank-a.rank);
}
function solve(l,start,limit=30000){
 let visited=0;const seen=new Set(),path=[];let exhausted=false;
 function walk(s,depth){if(won(s))return true;if(++visited>limit){exhausted=true;return false;}if(depth>l.planks.length*5+12)return false;const k=key(s);if(seen.has(k))return false;seen.add(k);
  for(const m of choices(l,s)){path.push([m.from,m.to]);if(walk(m.state,depth+1))return true;path.pop();if(exhausted)return false;}return false;
 }
 return walk(start||initial(l),0)?{path:path.slice(),visited}:null;
}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function generate(level,seed=0){
 const r=rng(level*7919+seed*104729+3187),holes=[],planks=[],lookup=new Map();
 const grid=level<3?3:5, gap=grid===3?160:98,off=(600-(grid-1)*gap)/2;
 function hole(x,y,pin=true){const k=x+','+y;if(lookup.has(k)){const id=lookup.get(k);if(pin)holes[id].pin=true;return id;}const id=holes.length;holes.push({x,y,pin});lookup.set(k,id);return id;}
 const count=level===1?2:level===2?3:level===3?4:level===4?5:Math.min(24,7+Math.floor((level-5)*.8));
 const pairs=new Set();let attempts=0;
 while(planks.length<count&&attempts++<500){
  let ax=Math.floor(r()*grid),ay=Math.floor(r()*grid),bx=Math.floor(r()*grid),by=Math.floor(r()*grid);
  if(level<3){ay=Math.min(ay,1);by=ay;bx=(ax+1)%grid;}
  const dx=bx-ax,dy=by-ay,dist=Math.hypot(dx,dy);if(dist<1||dist>3.1)continue;
  if(level<5&&dx&&dy&&Math.abs(dx)!==Math.abs(dy))continue;
  const pa=ay*grid+ax,pb=by*grid+bx,k=Math.min(pa,pb)+','+Math.max(pa,pb);if(pairs.has(k))continue;pairs.add(k);
  const a=hole(off+ax*gap,110+ay*gap),b=hole(off+bx*gap,110+by*gap);
  planks.push({a,b,width:level<3?49:42,finish:level>=8&&planks.length%6===4?'steel':['oak','cedar','teal','walnut','honey','red'][Math.floor(r()*6)]});
 }
 // Two exposed parking holes; advanced boards add a third, obstructed reserve socket.
 if(level<=4){hole(164,627,false);hole(436,627,false);}
 else {
  hole(164,627,false);
  // A reserve hole is physically concealed under a plank until that layer moves.
  const p=planks[Math.floor(r()*planks.length)],a=holes[p.a],b=holes[p.b];
  hole((a.x+b.x)/2,(a.y+b.y)/2,false);
 }
 return {level,seed,holes,planks};
}
root.TimberRules={initial,clone,geometry,accessible,settle,move,won,key,choices,solve,generate};
if(typeof module!=='undefined')module.exports=root.TimberRules;
})(typeof globalThis!=='undefined'?globalThis:this);
