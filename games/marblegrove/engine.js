export const R=22,GAP=44;
export function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function makePath(w,h,level){const pts=[],turns=[1.28,1.42,1.34,1.48][(level-1)%4],start=[.17,.62,1.12,1.65][(level-1)%4]*Math.PI;let length=0;
 for(let i=0;i<=1000;i++){const t=i/1000,a=start+t*Math.PI*2*turns,r=.445-t*.30,warp=level%3===0?Math.sin(a*3)*.012:0;const p={x:w*.5+Math.cos(a)*(r+warp)*w,y:h*.5+Math.sin(a)*(r+warp)*h,s:0};if(i)length+=Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y);p.s=length;pts.push(p);}return {pts,length,w,h};}
export function at(path,s){const p=path.pts;if(s<=0)return {...p[0]};if(s>=path.length)return {...p[p.length-1]};let lo=0,hi=p.length-1;while(hi-lo>1){let m=(lo+hi)>>1;if(p[m].s<s)lo=m;else hi=m;}const a=p[lo],b=p[hi],t=(s-a.s)/(b.s-a.s);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
export function create(level,w=850,h=1100){const path=makePath(w,h,level),rand=random(level*7919),colors=Math.min(5,3+Math.floor((level-1)/4)),n=34+Math.min(46,level*3),head=Math.min(path.length*.40,25*GAP),balls=[];let color=0,run=0;
 for(let i=0;i<n;i++){if(run===0){color=Math.floor(rand()*colors);run=2+Math.floor(rand()*2);}run--;balls.push({s:head-(n-1-i)*GAP,c:color,id:i});}
 return {level,path,balls,score:0,combo:0,cleared:0,total:n,nextId:n,slow:0,slowUsed:false,state:'playing',bursts:[],speed:15+Math.min(15,level*.65)};
}
export function resize(s,w,h){const old=s.path.length,positions=s.balls.map(b=>b.s);s.path=makePath(w,h,s.level);const ratio=s.path.length/old,n=s.balls.length;if(!n)return;s.balls[n-1].s=positions[n-1]*ratio;for(let i=n-2;i>=0;i--){const gap=Math.max(0,positions[i+1]-positions[i]-GAP);s.balls[i].s=s.balls[i+1].s-GAP-gap*ratio;}}
function match(s,index,chain=false){const a=s.balls;if(!a[index])return 0;let lo=index,hi=index;while(lo>0&&a[lo-1].c===a[index].c&&a[lo].s-a[lo-1].s<=GAP+2)lo--;while(hi+1<a.length&&a[hi+1].c===a[index].c&&a[hi+1].s-a[hi].s<=GAP+2)hi++;if(hi-lo<2)return 0;
 const removed=a.splice(lo,hi-lo+1);s.combo=chain?s.combo+1:1;s.score+=removed.length*10*s.combo;s.cleared+=removed.length;s.bursts.push({balls:removed.map(b=>({...at(s.path,b.s),c:b.c})),combo:s.combo});return removed.length;
}
export function insert(s,index,side,color){const a=s.balls,i=index+(side>0?1:0),position=i===0?a[0].s-GAP:a[i-1].s+GAP;a.splice(i,0,{s:position,c:color,id:s.nextId++});for(let j=i+1;j<a.length;j++)a[j].s=Math.max(a[j].s,a[j-1].s+GAP);s.combo=0;return match(s,i,false);}
export function step(s,dt){if(s.state!=='playing')return;s.slow=Math.max(0,s.slow-dt);const a=s.balls,base=s.speed*(s.slow>0?.28:1),vel=a.map(()=>base),joins=[];
 for(let i=1;i<a.length;i++){const gap=a[i].s-a[i-1].s-GAP;if(gap>1){const same=a[i].c===a[i-1].c;const extra=Math.min(185,gap/dt);if(same){for(let j=i;j<a.length;j++)vel[j]-=extra;}else{for(let j=0;j<i;j++)vel[j]+=extra;}joins.push(i);}}
 for(let i=0;i<a.length;i++){a[i].s+=vel[i]*dt;if(i&&a[i].s<a[i-1].s+GAP)a[i].s=a[i-1].s+GAP;}
 for(let k=joins.length-1;k>=0;k--){let i=joins[k];if(a[i]&&a[i].s-a[i-1].s<=GAP+2)match(s,i,true);}
 if(!a.length)s.state='won';else if(a[a.length-1].s>=s.path.length-R)s.state='lost';
}
export function hitSegment(s,ax,ay,bx,by){let best=null;const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
 s.balls.forEach((b,i)=>{if(b.s<0||b.s>s.path.length)return;const p=at(s.path,b.s),t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/(len||1)));if(Math.hypot(ax+dx*t-p.x,ay+dy*t-p.y)<=R*1.84&&(!best||t<best.t)){const tangent=at(s.path,b.s+5),past=at(s.path,b.s-5);const side=(ax+dx*t-p.x)*(tangent.x-past.x)+(ay+dy*t-p.y)*(tangent.y-past.y)>0?1:-1;best={i,t,side,x:p.x,y:p.y};}});return best;
}
