export const W=600,H=850;
export const vectors=[[0,-1],[1,0],[0,1],[-1,0]];
export function rng(seed){return function(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function pathFor(car,map){
 const v=vectors[car.d],axis=car.d%2?map.xs:map.ys,pos=car.d%2?car.x:car.y,sign=v[car.d%2?0:1];
 const ahead=axis.filter(n=>(n-pos)*sign>1).sort((a,b)=>(a-b)*sign);
 const points=[{x:car.x,y:car.y}];let d=car.d;
 function line(x,y){const a=points[points.length-1],n=Math.max(1,Math.ceil(Math.hypot(x-a.x,y-a.y)/4));for(let i=1;i<=n;i++)points.push({x:a.x+(x-a.x)*i/n,y:a.y+(y-a.y)*i/n});}
 if(ahead.length){let j={x:car.x,y:car.y};j[car.d%2?'x':'y']=ahead[0];d=(d+car.turn+4)%4;const out=vectors[d],r=22;
 if(car.turn===0)line(j.x,j.y);
 else if(car.turn===2){line(j.x-v[0]*r,j.y-v[1]*r);const base=points[points.length-1],side=[v[1],-v[0]];
 // A tight three-point U-turn within the junction; returns to the same road.
 for(let i=1;i<=32;i++){let t=i/32*Math.PI;points.push({x:base.x+v[0]*r*Math.sin(t)+side[0]*r*Math.sin(t)*Math.sin(t),y:base.y+v[1]*r*Math.sin(t)+side[1]*r*Math.sin(t)*Math.sin(t)});}
 }else{line(j.x-v[0]*r,j.y-v[1]*r);let a=points[points.length-1],b={x:j.x+out[0]*r,y:j.y+out[1]*r};for(let i=1;i<=20;i++){let t=i/20;points.push({x:(1-t)*(1-t)*a.x+2*(1-t)*t*j.x+t*t*b.x,y:(1-t)*(1-t)*a.y+2*(1-t)*t*j.y+t*t*b.y});}}
 }
 const end=points[points.length-1],out=vectors[d];line(out[0]===0?end.x:(out[0]>0?W+65:-65),out[1]===0?end.y:(out[1]>0?H+65:-65));
 let length=0;points.forEach((p,i)=>{if(i)length+=Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y);p.s=length;});return {points,length,d};
}
export function blocker(car,cars,map){const p=pathFor(car,map).points;for(let i=1;i<p.length;i++){let a=p[i-1],b=p[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,hx=32*Math.abs(dx/len)+18*Math.abs(dy/len),hy=32*Math.abs(dy/len)+18*Math.abs(dx/len);for(const c of cars){if(c.id===car.id)continue;const cx=c.d%2?32:18,cy=c.d%2?18:32;if(Math.abs(b.x-c.x)<hx+cx+2&&Math.abs(b.y-c.y)<hy+cy+2)return c;}}return null;}
export function makeLevel(level){const rand=rng(level*91771+343),map={xs:level<5?[130,470]:[90,300,510],ys:level<10?[130,425,720]:[105,320,535,750]},slots=[];
 function along(fixed,edges,vertical){for(let i=0;i<edges.length-1;i++){const start=edges[i]+65,end=edges[i+1]-65,n=Math.floor((end-start)/83)+1;for(let j=0;j<n;j++){const p=n===1?(start+end)/2:start+(end-start)*j/(n-1);if(p>40&&p<(vertical?H:W)-40)slots.push({x:vertical?fixed:p,y:vertical?p:fixed,vertical});}}}
 map.xs.forEach(x=>along(x,[0,...map.ys,H],true));map.ys.forEach(y=>along(y,[0,...map.xs,W],false));
 const target=Math.min(28,6+Math.floor(level*1.2)),cars=[];let id=0;
 for(let k=0;k<target;k++){let choices=[];for(const s of slots){if(cars.some(c=>Math.hypot(c.x-s.x,c.y-s.y)<74))continue;for(const d of (s.vertical?[0,2]:[1,3]))for(const turn of (level===1?[0,-1,1]:[0,-1,1,2])){const c={x:s.x,y:s.y,d,turn,id,color:Math.floor(rand()*7),model:Math.floor(rand()*3)};if(!blocker(c,cars,map)){let score=rand();for(const other of cars)if(!blocker(other,cars,map)&&blocker(other,[...cars,c],map))score+=3;choices.push({c,score});}}}
 if(!choices.length)break;choices.sort((a,b)=>b.score-a.score);cars.push(choices[0].c);id++;}
 return {map,cars};}
