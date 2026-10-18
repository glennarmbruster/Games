// Original neighborhood illustrations, shared by the two traffic games.
const image=new Image();export let artRevision=0;
image.onload=()=>{artRevision++;};image.src='../arcade4/neighborhood-v3.webp';
let grain;
export function asphalt(c,w,h){
 if(!grain){grain=document.createElement('canvas');grain.width=grain.height=256;const p=grain.getContext('2d');p.fillStyle='#343b42';p.fillRect(0,0,256,256);let s=8721;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};for(let i=0;i<23500;i++){p.fillStyle=i%2?'rgba(230,237,240,'+(.025+r()*.14)+')':'rgba(5,13,20,'+(.05+r()*.2)+')';p.fillRect(r()*256,r()*256,.4+r()*.9,.4+r()*.8);}p.strokeStyle='#09121c26';p.lineWidth=.7;for(let n=0;n<5;n++){let x=r()*256,y=r()*256;p.beginPath();p.moveTo(x,y);for(let i=0;i<8;i++){x+=(r()-.5)*13;y+=r()*9;p.lineTo(x,y);}p.stroke();}}
 c.fillStyle=c.createPattern(grain,'repeat');c.fillRect(0,0,w,h);
}
export function district(c,index,x,y,w,h){
 if(!image.complete||!image.naturalWidth){c.fillStyle='#73a950';c.fillRect(x,y,w,h);return;}
 const n=((index%4)+4)%4,sw=image.naturalWidth/2,sh=image.naturalHeight/2;
 const k=Math.max(w/sw,h/sh),cw=w/k,ch=h/k;
 c.drawImage(image,n%2*sw+(sw-cw)/2,Math.floor(n/2)*sh+(sh-ch)/2,cw,ch,x,y,w,h);
}
