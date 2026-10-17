// Orthographic Canvas fallback: map a textured 3D triangle to its screen triangle.
export function textureFace(c,face){
 const s=face.screen,t=face.texPoints,img=face.image;if(!img||!t||s.length!==3)return false;
 const x0=t[0].x,y0=t[0].y,x1=t[1].x-x0,y1=t[1].y-y0,x2=t[2].x-x0,y2=t[2].y-y0,det=x1*y2-x2*y1;
 if(Math.abs(det)<.00001)return true;
 const X1=s[1].x-s[0].x,Y1=s[1].y-s[0].y,X2=s[2].x-s[0].x,Y2=s[2].y-s[0].y;
 const a=(X1*y2-X2*y1)/det,b=(Y1*y2-Y2*y1)/det,d=(Y2*x1-Y1*x2)/det,e=(X2*x1-X1*x2)/det;
 c.save();c.beginPath();s.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();c.transform(a,b,e,d,s[0].x-a*x0-e*y0,s[0].y-b*x0-d*y0);c.drawImage(img,0,0);c.restore();return true;
}
