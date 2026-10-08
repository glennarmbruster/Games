/* Timber Tumble 1.2 — gravity-driven sliding and screw contacts; shared by play, hints and generation. */
(function(root){
'use strict';
const PEG_RADIUS=17,EPS=.0001,TAU=Math.PI*2;
const clone=s=>({pins:s.pins.slice(),bars:s.bars.map(b=>({...b,trace:undefined}))});
const initial=l=>({pins:l.holes.map(h=>!!h.pin),bars:l.planks.map(()=>({mode:2,pivot:-1}))});
function geometry(l,s,i){
 const p=l.planks[i],b=s.bars[i],a=l.holes[p.a],z=l.holes[p.b],len=Math.hypot(z.x-a.x,z.y-a.y);
 if(b.x1!==undefined)return {x1:b.x1,y1:b.y1,x2:b.x2,y2:b.y2,len};
 return {x1:a.x,y1:a.y,x2:z.x,y2:z.y,len};
}
function distance(x,y,g){const dx=g.x2-g.x1,dy=g.y2-g.y1,t=Math.max(0,Math.min(1,((x-g.x1)*dx+(y-g.y1)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-g.x1-t*dx,y-g.y1-t*dy);}
function capsule(g,width){const e=25-width/2,ux=(g.x2-g.x1)/g.len,uy=(g.y2-g.y1)/g.len;return{x1:g.x1-e*ux,y1:g.y1-e*uy,x2:g.x2+e*ux,y2:g.y2+e*uy,len:g.len+2*e};}
function accessible(l,s,h){
 const at=l.holes[h];
 for(let i=0;i<l.planks.length;i++){
  const b=s.bars[i],p=l.planks[i];if(!b.mode)continue;
  if((b.mode===2&&(p.a===h||p.b===h))||(b.mode===1&&b.pivot===h))continue;
  if(distance(at.x,at.y,capsule(geometry(l,s,i),p.width))<p.width/2+(s.pins[h]?11:PEG_RADIUS))return false;
 }
 return true;
}
function obstaclePins(l,s,g,width,except=-1){
 const cap=capsule(g,width),radius=width/2+PEG_RADIUS;
 const result=[];
 for(let j=0;j<l.holes.length;j++)if(s.pins[j]&&j!==except){
  const h=l.holes[j];
  // Pins already concealed behind an overlapping layer do not suddenly jump
  // in front of it. Once the layer clears them, subsequent motion collides.
  if(distance(h.x,h.y,cap)<radius-.001)continue;
  result.push(j);
 }
 return result;
}
function swing(l,s,g,width,pivot){
 const h=l.holes[pivot];let start=Math.atan2(g.y2-g.y1,g.x2-g.x1),delta=Math.PI/2-start;
 while(delta>Math.PI)delta-=TAU;while(delta< -Math.PI)delta+=TAU;
 if(Math.abs(delta)<EPS)return {g,stop:-1};
 const sign=Math.sign(delta),radius=width/2+PEG_RADIUS,L=g.len+25-width/2;
 let travel=Math.abs(delta),stop=-1;
 for(const j of obstaclePins(l,s,g,width,pivot)){
  const p=l.holes[j],dx=p.x-h.x,dy=p.y-h.y,d=Math.hypot(dx,dy);if(d>L+radius||d<radius)continue;
  const theta=Math.atan2(dy,dx);
  const beta=d<=Math.hypot(L,radius)?Math.asin(radius/d):Math.acos(Math.max(-1,Math.min(1,(d*d+L*L-radius*radius)/(2*d*L))));
  for(let k=-2;k<=2;k++){
   const low=theta-beta+k*TAU,high=theta+beta+k*TAU;
   const entry=sign>0?low:high,dt=(entry-start)*sign;
   // At contact: allow a motion away, but never continue through the peg.
   if(dt>=-EPS&&dt<=travel){travel=Math.max(0,dt);stop=j;}
  }
 }
 const angle=start+sign*Math.max(0,travel-(stop>=0?.000002:0));
 return {g:{x1:h.x,y1:h.y,x2:h.x+g.len*Math.cos(angle),y2:h.y+g.len*Math.sin(angle),len:g.len},stop};
}
function fall(l,s,g,width){
 const cap=capsule(g,width),ux=(cap.x2-cap.x1)/cap.len,uy=(cap.y2-cap.y1)/cap.len,radius=width/2+PEG_RADIUS;
 let travel=900,stop=-1;
 function hit(t,j){if(t>=-EPS&&t<travel){travel=Math.max(0,t);stop=j;}}
 for(const j of obstaclePins(l,s,g,width)){
  const p=l.holes[j],rx=p.x-cap.x1,ry=p.y-cap.y1;
  const u=rx*ux+ry*uy,v=-rx*uy+ry*ux;
  // Swept side faces of the capsule.
  if(Math.abs(ux)>EPS)for(const side of [-radius,radius]){const t=(v-side)/ux,along=u-uy*t;if(along>=0&&along<=cap.len)hit(t,j);}
  // Swept rounded ends. First contact prevents even very long falls tunnelling.
  for(const [x,y]of [[cap.x1,cap.y1],[cap.x2,cap.y2]]){const dx=p.x-x;if(Math.abs(dx)<=radius)hit(p.y-y-Math.sqrt(Math.max(0,radius*radius-dx*dx)),j);}
 }
 const dy=Math.max(0,travel-(stop>=0?.0001:0));
 return{g:{...g,y1:g.y1+dy,y2:g.y2+dy},stop};
}
// A loose plank is a rigid capsule, not a latch. Resolve gravity against round
// screw heads with translation AND rotation. Low-friction contact allows sliding;
// two supports (or a perfectly balanced support) can still hold a plank at rest.
function slide(l,s,g,width,record=true){
 const first=fall(l,s,g,width),trace=record?[{...g},{...first.g}]:[];
 if(first.stop<0)return{...first,trace};
 const radius=width/2+PEG_RADIUS,half=g.len/2,capHalf=half+25-width/2;
 const invI=12/(g.len*g.len+width*width),active=new Set(obstaclePins(l,s,g,width));
 let x=(first.g.x1+first.g.x2)/2,y=(first.g.y1+first.g.y2)/2,a=Math.atan2(g.y2-g.y1,g.x2-g.x1),stop=first.stop,still=0;
 const pose=()=>({x1:x-half*Math.cos(a),y1:y-half*Math.sin(a),x2:x+half*Math.cos(a),y2:y+half*Math.sin(a),len:g.len});
 function contact(j){const h=l.holes[j],ux=Math.cos(a),uy=Math.sin(a),t=Math.max(-capHalf,Math.min(capHalf,(h.x-x)*ux+(h.y-y)*uy)),px=x+t*ux,py=y+t*uy,dx=px-h.x,dy=py-h.y,d=Math.hypot(dx,dy);return{t,ux,uy,dx,dy,d};}
 for(let step=0;step<1800;step++){
  const ox=x,oy=y,oa=a;y+=1.5;
  // Short advances bound the sweep to less than a screw-head radius. Iterative
  // impulses share the correction between center translation and angular motion.
  for(let iteration=0;iteration<32;iteration++){
   let penetration=0,dx=0,dy=0,da=0,count=0;
   for(const j of active){const q=contact(j),depth=radius+.002-q.d;if(depth<=0)continue;
    const nx=q.d>EPS?q.dx/q.d:0,ny=q.d>EPS?q.dy/q.d:-1;
    const arm=q.t*(q.ux*ny-q.uy*nx),amount=depth/(1+arm*arm*invI);
    dx+=nx*amount;dy+=ny*amount;da+=arm*amount*invI;count++;penetration=Math.max(penetration,depth);stop=j;
   }
   if(count){x+=dx/count;y+=dy/count;a+=da/count;}
   if(penetration<.0005)break;
  }
  // A screw concealed behind a layer becomes a future obstacle once uncovered.
  for(let j=0;j<l.holes.length;j++)if(s.pins[j]&&!active.has(j)&&contact(j).d>=radius+.02)active.add(j);
  const motion=Math.hypot(x-ox,y-oy)+Math.abs(a-oa)*half;
  if(motion<.004)still++;else still=0;
  if(record&&step%2===0)trace.push(pose());
  if(still>=5){const out=pose();if(record)trace.push(out);return{g:out,stop,trace};}
  let touching=false;for(const j of active)if(contact(j).d<radius+.06){touching=true;break;}
  if(!touching){const next=fall(l,s,pose(),width);x=(next.g.x1+next.g.x2)/2;y=(next.g.y1+next.g.y2)/2;if(record)trace.push(next.g);if(next.stop<0)return{...next,trace};stop=next.stop;}
  if(y>850+half){const out=pose();if(record)trace.push(out);return{g:out,stop:-1,trace};}
 }
 const out=pose();if(record)trace.push(out);return{g:out,stop,trace};
}

function setGeometry(b,g){b.x1=g.x1;b.y1=g.y1;b.x2=g.x2;b.y2=g.y2;}
function settle(l,s,record=false){
 for(let i=0;i<l.planks.length;i++){
  const b=s.bars[i],p=l.planks[i];if(!b.mode)continue;
  let g=geometry(l,s,i);
  if(b.mode===2){
   const a=s.pins[p.a],z=s.pins[p.b];if(a&&z)continue;
   if(a||z){b.mode=1;b.pivot=a?p.a:p.b;if(z)g={x1:g.x2,y1:g.y2,x2:g.x1,y2:g.y1,len:g.len};}
   else{b.mode=3;b.pivot=-1;}
  }
  if(b.mode===1&&!s.pins[b.pivot]){b.mode=3;b.pivot=-1;}
  const next=b.mode===1?swing(l,s,g,p.width,b.pivot):slide(l,s,g,p.width,record);
  b.stop=next.stop;b.trace=next.trace;setGeometry(b,next.g);
  if(b.mode===3&&next.stop<0)b.mode=0;
 }
 return s;
}
function move(l,s,from,to,record=false){
 if(from===to||!s.pins[from]||s.pins[to]||!accessible(l,s,from)||!accessible(l,s,to))return null;
 const n=clone(s);n.pins[from]=false;n.pins[to]=true;return settle(l,n,record);
}
const won=s=>s.bars.every(b=>b.mode===0);
const key=s=>s.pins.map(Number).join('')+'/'+s.bars.map(b=>!b.mode?'0':[b.mode,b.pivot,...['x1','y1','x2','y2'].map(k=>Math.round((b[k]||0)*1000))].join(':')).join(',');
function choices(l,s){
 const sources=[],dest=[];
 for(let h=0;h<l.holes.length;h++)if(accessible(l,s,h))(s.pins[h]?sources:dest).push(h);
 const result=[];
 for(const a of sources)for(const b of dest){const n=move(l,s,a,b);let rank=0;
 for(let i=0;i<s.bars.length;i++){
  if(s.bars[i].mode&&n.bars[i].mode===0)rank+=110;
  else if(s.bars[i].mode===2&&n.bars[i].mode!==2)rank+=25;
  if(s.bars[i].stop===a)rank+=18;
 }
 rank+=l.holes.reduce((v,h,j)=>v+(!n.pins[j]&&accessible(l,n,j)?1:0),0)*4;
 result.push({from:a,to:b,state:n,rank});}
 return result.sort((a,b)=>b.rank-a.rank);
}
function solve(l,start,limit=6000){
 const first=start||initial(l);if(won(first))return{path:[],visited:0};
 const score=s=>s.bars.reduce((v,b)=>v+(b.mode===2?180:b.mode===1?100:b.mode===3?65:0)+(b.mode&&b.stop>=0?8:0),0);
 const heap=[],seen=new Set([key(first)]);let visited=0;
 function push(n){heap.push(n);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].score<=n.score)break;heap[i]=heap[p];i=p;}heap[i]=n;}
 function pop(){const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].score<heap[c].score)c++;if(heap[c].score>=last.score)break;heap[i]=heap[c];i=c;}heap[i]=last;}return top;}
 push({s:first,depth:0,score:score(first),parent:null,move:null});
 while(heap.length&&visited++<limit){
  const at=pop();if(at.depth>l.planks.length*4+20)continue;
  for(const m of choices(l,at.s)){
   const k=key(m.state);if(seen.has(k))continue;seen.add(k);
   const node={s:m.state,depth:at.depth+1,parent:at,move:[m.from,m.to],score:score(m.state)+(at.depth+1)*1.5};
   if(won(m.state)){const path=[];for(let p=node;p.parent;p=p.parent)path.push(p.move);return{path:path.reverse(),visited};}
   push(node);
  }
 }
 return null;
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
  if(dx&&dy&&Math.abs(dx)!==Math.abs(dy))continue;
  const pa=ay*grid+ax,pb=by*grid+bx,k=Math.min(pa,pb)+','+Math.max(pa,pb);if(pairs.has(k))continue;pairs.add(k);
  const a=hole(off+ax*gap,110+ay*gap),b=hole(off+bx*gap,110+by*gap);
  planks.push({a,b,width:level<3?49:42,finish:level>=8&&planks.length%6===4?'steel':['oak','cedar','teal','walnut','honey','red'][Math.floor(r()*6)]});
 }
 // Two exposed parking holes; advanced boards add a third, obstructed reserve socket.
 if(level<=4){hole(64,58,false);hole(536,58,false);}
 else {
  hole(64,58,false);hole(536,58,false);if(level>=13)hole(300,650,false);
  // A reserve hole is physically concealed under a plank until that layer moves.
  const p=planks[Math.floor(r()*planks.length)],a=holes[p.a],b=holes[p.b];
  hole((a.x+b.x)/2,(a.y+b.y)/2,false);
 }
 return {level,seed,holes,planks};
}
function replay(l,path){let s=initial(l);for(const m of path){s=move(l,s,...m);if(!s)return false;}return won(s);}
function remix(base,number,variant){
 const r=rng(number*2179+variant*571+711),l=JSON.parse(JSON.stringify(base));
 l.level=number;l.seed=variant;l.family=base.family||base.level;
 const changes=1+Math.floor(r()*3),available=l.holes.map((h,i)=>h.pin?i:-1).filter(i=>i>=0);
 for(let k=0;k<changes;k++){
  const index=Math.floor(r()*l.planks.length),p=l.planks[index],a=available[Math.floor(r()*available.length)],b=available[Math.floor(r()*available.length)];
  const len=Math.hypot(l.holes[a].x-l.holes[b].x,l.holes[a].y-l.holes[b].y);
  if(a===b||len<80||len>330||l.planks.some((q,j)=>j!==index&&((q.a===a&&q.b===b)||(q.a===b&&q.b===a))))return null;
  p.a=a;p.b=b;
 }
 if(l.planks.every((p,i)=>(p.a===base.planks[i].a&&p.b===base.planks[i].b)||(p.a===base.planks[i].b&&p.b===base.planks[i].a)))return null;
 const finishes=['oak','cedar','teal','walnut','honey','red'];for(let i=0;i<l.planks.length;i++)l.planks[i].finish=i%6===4?'steel':finishes[Math.floor(r()*finishes.length)];
 return replay(l,l.solution)?l:null;
}
root.TimberRules={build:'1.2.0',physics:'sliding-contacts-1.2',initial,clone,geometry,accessible,settle,move,won,key,choices,solve,generate,remix,replay,swing,fall,slide,PEG_RADIUS,distance,capsule};
if(typeof module!=='undefined')module.exports=root.TimberRules;
})(typeof globalThis!=='undefined'?globalThis:this);
