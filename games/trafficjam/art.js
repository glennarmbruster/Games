import {W,H,rng} from './engine.js';
import {drawVehicle} from '../arcade4/vehicle-art.js';
import {district,asphalt,artRevision} from '../arcade4/neighborhood-art.js';
export {artRevision};
const colors=['#20c9e0','#ff535b','#ffd344','#8b72ef','#42d390','#ff963f','#3888ed'];
function round(c,x,y,w,h,r,color){Arcade.round(c,x,y,w,h,r,color);}
function tree(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#143d3833';c.beginPath();c.ellipse(7,7,21,17,0,0,7);c.fill();round(c,-3,0,6,19,2,'#a47649');for(const a of [[-9,0,14,'#228b61'],[9,-4,15,'#2ba66a'],[0,-12,16,'#58c778'],[-5,-15,9,'#8bdf7b']]){c.fillStyle=a[3];c.beginPath();c.arc(a[0],a[1],a[2],0,7);c.fill();}c.restore();}
function building(c,x,y,w,h,color){round(c,x+5,y+7,w,h,5,'#194d3c35');round(c,x,y,w,h,5,'#fff2db');round(c,x+3,y+3,w-6,h-6,4,color);round(c,x+8,y+8,w-16,h-16,2,'#ffedcf');round(c,x+13,y+13,w-26,h-26,2,color);for(let a=x+10;a<x+w-10;a+=15)round(c,a,y+h-7,8,7,1,'#366385');round(c,x+w/2-9,y+10,18,12,2,'#b9cbd0');round(c,x+w/2-7,y+10,14,4,1,'#e4f2ee');if(w>70&&h>55){for(let i=0;i<3;i++){round(c,x+18+i*16,y+h/2-2,12,16,2,'#385b78');round(c,x+19+i*16,y+h/2-1,10,6,1,'#74a5bc');}c.strokeStyle='#f8ecd5';c.lineWidth=2;c.strokeRect(x+9,y+9,w-18,h-18);}}
export const PAD=320;
export function scenery(map,level){const cv=document.createElement('canvas');cv.width=(W+PAD*2)*1.5;cv.height=(H+PAD*2)*1.5;const c=cv.getContext('2d');c.scale(1.5,1.5);asphalt(c,W+PAD*2,H+PAD*2);c.translate(PAD,PAD);
 const xs=[-PAD-50,...map.xs,W+PAD+50],ys=[-PAD-50,...map.ys,H+PAD+50];
 for(let ix=0;ix<xs.length-1;ix++)for(let iy=0;iy<ys.length-1;iy++){
  const x=xs[ix]+38,y=ys[iy]+38,w=xs[ix+1]-xs[ix]-76,h=ys[iy+1]-ys[iy]-76;if(w<=0||h<=0)continue;
  c.save();c.shadowColor='#071e2790';c.shadowBlur=8;c.shadowOffsetY=3;round(c,x,y,w,h,9,'#b8b8a8');c.shadowBlur=0;c.shadowOffsetY=0;
  round(c,x+2,y+2,w-4,h-4,7,'#ded9c7');c.clip();district(c,(ix+iy*2+Math.floor((level-1)/4))%4,x+3,y+3,w-6,h-6);c.restore();
  c.strokeStyle='#fffae58c';c.lineWidth=1;c.beginPath();c.moveTo(x+9,y+1);c.lineTo(x+w-9,y+1);c.stroke();
 }
 // Worn edge paint stays outside the vehicles. Crossings mark entrances only.
 c.strokeStyle='#e8e6d477';c.lineWidth=1.4;c.setLineDash([12,9]);
 map.xs.forEach(x=>{for(const dx of [-31,31])for(let i=0,edges=[-20,...map.ys,H+20];i<edges.length-1;i++){c.beginPath();c.moveTo(x+dx,edges[i]+36);c.lineTo(x+dx,edges[i+1]-36);c.stroke();}});
 map.ys.forEach(y=>{for(const dy of [-31,31])for(let i=0,edges=[-20,...map.xs,W+20];i<edges.length-1;i++){c.beginPath();c.moveTo(edges[i]+36,y+dy);c.lineTo(edges[i+1]-36,y+dy);c.stroke();}});c.setLineDash([]);
 c.fillStyle='#fff3d9c4';map.xs.forEach(x=>{for(let i=-2;i<=2;i++){c.fillRect(x+i*10-3,8,6,14);c.fillRect(x+i*10-3,H-22,6,14);}});map.ys.forEach(y=>{for(let i=-2;i<=2;i++){c.fillRect(8,y+i*10-3,14,6);c.fillRect(W-22,y+i*10-3,14,6);}});
 // Flush metal drain grates are decoration, not obstacles.
 for(const x of map.xs)for(const y of map.ys){c.fillStyle='#1c252c';c.fillRect(x+26,y+23,7,12);c.strokeStyle='#889597';c.lineWidth=.7;for(let j=1;j<6;j++){c.beginPath();c.moveTo(x+27,y+23+j*2);c.lineTo(x+32,y+23+j*2);c.stroke();}}
 return cv;}
export function arrow(c,turn){c.save();c.lineCap='round';c.lineJoin='round';let pts=turn===0?[[0,17],[0,-16]]:turn===2?[[-9,16],[-9,-5],[-6,-12],[3,-12],[9,-6],[9,12]]:turn===1?[[0,17],[0,-6],[15,-6]]:[[0,17],[0,-6],[-15,-6]];let end=pts[pts.length-1],head=turn===0?[[-7,-8],[0,-16],[7,-8]]:turn===2?[[3,5],[9,12],[15,5]]:turn===1?[[8,-13],[15,-6],[8,1]]:[[-8,-13],[-15,-6],[-8,1]];
 for(const style of [['#092f45',10],['#ffffff',5]]){c.strokeStyle=style[0];c.lineWidth=style[1];for(const line of [pts,head]){c.beginPath();line.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}}c.restore();}
export function car(c,a,x=a.x,y=a.y,angle=a.d*Math.PI/2,glow=null){c.save();c.translate(x,y);c.rotate(angle);if(glow){c.shadowColor=glow;c.shadowBlur=14;round(c,-24,-39,48,78,16,glow);c.shadowBlur=0;}
 c.shadowColor="#05131c99";c.shadowBlur=6;c.shadowOffsetX=2;c.shadowOffsetY=4;if(drawVehicle(c,[2,0,1,3,4,5,2][a.color%7],42,68)){c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;arrow(c,a.turn);c.restore();return;}
 round(c,-18,-29,40,67,13,'#101d2855');for(const xx of [-21,14])for(const yy of [-23,16])round(c,xx,yy,7,13,3,'#152434');
 const base=colors[a.color%colors.length];round(c,-18,-33,36,66,a.model===1?8:12,'#153b4b');const g=c.createLinearGradient(-17,0,18,0);g.addColorStop(0,base);g.addColorStop(.25,'#e9ffff');g.addColorStop(.34,base);g.addColorStop(1,base);round(c,-17,-32,34,63,a.model===1?7:11,g);round(c,-13,-19,26,39,7,'#174255');round(c,-11,-17,22,13,4,'#76bfd3');round(c,-11,9,22,9,4,'#37798e');round(c,-12,-4,24,14,3,base);c.fillStyle='#c0f1fa99';c.beginPath();c.moveTo(-9,-16);c.lineTo(5,-16);c.lineTo(-8,-5);c.closePath();c.fill();
 round(c,-14,-29,8,5,2,'#fff9bf');round(c,6,-29,8,5,2,'#fff9bf');round(c,-13,26,7,3,1,'#ff4b4e');round(c,6,26,7,3,1,'#ff4b4e');round(c,-6,29,12,2,1,'#f2e9db');round(c,-21,-8,5,6,2,base);round(c,16,-8,5,6,2,base);arrow(c,a.turn);c.restore();}
