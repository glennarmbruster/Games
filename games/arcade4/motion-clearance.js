// Time-aware clearance for several vehicles sharing a board.
export function track(points){let length=0;const p=points.map((a,i)=>{if(i)length+=Math.hypot(a.x-points[i-1].x,a.y-points[i-1].y);return{x:a.x,y:a.y,s:length};});return{points:p,length};}
export function pose(route,distance){const p=route.points,d=Math.max(0,Math.min(route.length,distance));let i=1;while(i<p.length-1&&p[i].s<d)i++;const a=p[i-1],b=p[i],q=(d-a.s)/(b.s-a.s||1);return{x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q,angle:Math.atan2(b.y-a.y,b.x-a.x)};}
export function overlaps(a,b,pad=0){
 const ax={x:Math.cos(a.angle),y:Math.sin(a.angle)},ay={x:-ax.y,y:ax.x},bx={x:Math.cos(b.angle),y:Math.sin(b.angle)},by={x:-bx.y,y:bx.x};
 for(const u of [ax,ay,bx,by]){const ra=Math.abs(u.x*ax.x+u.y*ax.y)*a.length/2+Math.abs(u.x*ay.x+u.y*ay.y)*a.width/2,rb=Math.abs(u.x*bx.x+u.y*bx.y)*b.length/2+Math.abs(u.x*by.x+u.y*by.y)*b.width/2;if(Math.abs((b.x-a.x)*u.x+(b.y-a.y)*u.y)>=ra+rb+pad)return false;}return true;
}
export function conflicts(candidate,others,pad=0){
 const step=Math.min(.02,Math.max(.002,Math.min(candidate.width,...others.map(o=>o.width))/(4*Math.max(candidate.speed,...others.map(o=>o.speed),1))));
 const end=candidate.route.length/candidate.speed;
 for(const other of others){for(let t=0;t<=end+step;t+=step){const d=other.distance+t*other.speed;if(d>other.route.length&&!other.hold)continue;const a=pose(candidate.route,Math.min(t,end)*candidate.speed),b=pose(other.route,d);if(d>=other.route.length&&other.endAngle!==undefined)b.angle=other.endAngle;if(overlaps({...a,length:candidate.length,width:candidate.width},{...b,length:other.length,width:other.width},pad))return true;}}
 return false;
}
