/* Photographic product sprites and a warm, fitted shop interior. */
(function(){'use strict';var items=[],wall,wood;
function load(src){return new Promise(function(ok,no){var im=new Image();im.onload=function(){ok(im)};im.onerror=function(){no(Error('Could not load '+src))};im.src=src})}
var jobs=[];for(var i=0;i<40;i++)(function(i){jobs.push(load('assets/good-'+i+'.png').then(function(im){items[i]=im}))})(i);
jobs.push(load('assets/shop-wall.webp').then(function(im){wall=im}));jobs.push(load('assets/wood.webp').then(function(im){wood=im}));
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function shade(c,x,y,w,h,a,b){var g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;c.fillRect(x,y,w,h)}
function timber(c,x,y,w,h,dark){c.save();rr(c,x,y,w,h,3);c.clip();c.drawImage(wood,0,0,wood.width,wood.height,x,y,w,h);c.globalCompositeOperation='multiply';c.fillStyle=dark?'#826544':'#b18d63';c.fillRect(x,y,w,h);c.restore()}
SArt.draw=function(c,k){var im=items[k%40],f=Math.min(78/im.width,99/im.height),w=im.width*f,h=im.height*f;c.drawImage(im,-w/2,-h,w,h)};
SArt.item=function(c,k){c.save();c.fillStyle='rgba(30,22,12,.22)';c.beginPath();c.ellipse(0,-1,25,4,0,0,Math.PI*2);c.fill();SArt.draw(c,k);c.restore()};
function storeSign(c,W,top){
 var w=Math.min(W*.82,400),h=Math.min(82,top-18),x=(W-w)/2,y=Math.max(6,(top-h)/2);
 c.save();c.shadowColor='rgba(20,12,5,.65)';c.shadowBlur=9;c.shadowOffsetY=5;
 rr(c,x,y,w,h,5);c.fillStyle='#3d2818';c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 timber(c,x+2,y+2,w-4,h-4,true);
 var g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(32,18,9,.2)');g.addColorStop(.5,'rgba(66,36,15,.15)');g.addColorStop(1,'rgba(20,10,4,.55)');c.fillStyle=g;rr(c,x+2,y+2,w-4,h-4,4);c.fill();
 c.strokeStyle='#ba945a';c.lineWidth=1.5;rr(c,x+6,y+6,w-12,h-12,2);c.stroke();
 c.strokeStyle='rgba(235,204,147,.45)';c.lineWidth=.7;rr(c,x+9,y+9,w-18,h-18,1);c.stroke();
 // Painted lettering, restrained flourishes and aged brass fasteners.
 c.textAlign='center';c.textBaseline='middle';var fs=Math.min(h*.43,w*.073);c.font='bold '+fs+'px Georgia,serif';
 c.shadowColor='#211309';c.shadowBlur=1;c.shadowOffsetY=1.5;c.fillStyle='#f2dfb2';c.fillText('GENERAL STORE',W/2,y+h*.5,w-48);c.shadowBlur=0;c.shadowOffsetY=0;
 c.strokeStyle='#c3a16c';c.lineWidth=.8;[.23,.77].forEach(function(t){var yy=y+h*t;c.beginPath();c.moveTo(W/2-w*.22,yy);c.lineTo(W/2-7,yy);c.moveTo(W/2+7,yy);c.lineTo(W/2+w*.22,yy);c.stroke();c.save();c.translate(W/2,yy);c.rotate(Math.PI/4);c.fillStyle='#d7b97f';c.fillRect(-1.7,-1.7,3.4,3.4);c.restore()});
 [x+14,x+w-14].forEach(function(xx){[y+14,y+h-14].forEach(function(yy){var g=c.createLinearGradient(xx-2,yy-2,xx+2,yy+2);g.addColorStop(0,'#e2c58e');g.addColorStop(1,'#70512b');c.fillStyle=g;c.beginPath();c.arc(xx,yy,2.2,0,Math.PI*2);c.fill();c.strokeStyle='#51402d';c.beginPath();c.moveTo(xx-1,yy+1);c.lineTo(xx+1,yy-1);c.stroke()})});c.restore();
}
function paint(c,front,W,H,sw,rows,boxes,frame,dark){var s=Math.max(W/wall.width,H/wall.height);c.save();c.filter='saturate(1.25)';c.drawImage(wall,(W-wall.width*s)/2,(H-wall.height*s)/2,wall.width*s,wall.height*s);c.filter='none';c.globalCompositeOperation='color';c.fillStyle='#547ac0';c.globalAlpha=.4;c.fillRect(0,0,W,H);c.restore();if(dark){c.fillStyle='rgba(13,21,18,.3)';c.fillRect(0,0,W,H)}if(!rows.length)return;var top=frame(rows[0]).Y;if(top>60)storeSign(c,W,top);

rows.forEach(function(row,ri){var f=frame(row),fw=f.X1-f.X,fh=f.Yb-f.Y;c.save();c.shadowColor='rgba(21,17,11,.45)';c.shadowBlur=sw*.32;c.shadowOffsetY=sw*.18;rr(c,f.X,f.Y,fw,fh,3);c.fillStyle='#755936';c.fill();c.restore();timber(c,f.X,f.Y,fw,fh,true);c.strokeStyle='#e4c798';c.lineWidth=.7;rr(c,f.X+.5,f.Y+.5,fw-1,fh-1,3);c.stroke();
 row.idx.forEach(function(i){var b=boxes[i],x=b.x,y=b.y,w=b.w,fl=b.floor,h=fl-y,side=sw*.12,floor=sw*.33;c.save();rr(c,x,y,w,h+sw*.06,2);c.clip();c.drawImage(wood,x,y,w,h);c.fillStyle='rgba(63,53,33,.28)';c.fillRect(x,y,w,h);shade(c,x,y,w,h,'rgba(25,22,14,.48)','rgba(48,37,21,.03)');shade(c,x,fl-floor,w,floor,'#8f7757','#c2a77b');c.fillStyle='#65543b';c.beginPath();c.moveTo(x,y);c.lineTo(x+side,y+side);c.lineTo(x+side,fl-floor);c.lineTo(x,fl);c.fill();c.fillStyle='#7c684a';c.beginPath();c.moveTo(x+w,y);c.lineTo(x+w-side,y+side);c.lineTo(x+w-side,fl-floor);c.lineTo(x+w,fl);c.fill();shade(c,x,y,w,sw*.4,'rgba(22,18,12,.42)','rgba(22,18,12,0)');c.fillStyle='rgba(255,225,164,.5)';c.fillRect(x+side,y+1,w-side*2,1);c.restore();c.strokeStyle='rgba(37,27,13,.65)';c.lineWidth=.8;rr(c,x,y,w,h+sw*.05,2);c.stroke()});
 var lipY=row.floor-sw*.03,lipH=sw*.25;front.save();front.shadowColor='rgba(20,15,7,.4)';front.shadowBlur=sw*.12;front.shadowOffsetY=sw*.08;front.fillStyle='#725334';rr(front,f.X-1,lipY,fw+2,lipH,2);front.fill();front.restore();timber(front,f.X-1,lipY,fw+2,lipH,false);shade(front,f.X-1,lipY,fw+2,lipH,'rgba(255,231,178,.22)','rgba(49,28,12,.38)');front.fillStyle='#dbc297';front.fillRect(f.X,lipY,fw,1);
 row.idx.forEach(function(i){var b=boxes[i],ww=sw*.65,hh=Math.max(6,lipH*.63),xx=b.x+b.w/2-ww/2,yy=lipY+(lipH-hh)/2;front.fillStyle='#b69b64';rr(front,xx-1,yy-1,ww+2,hh+2,1);front.fill();front.fillStyle='#ede5d3';front.fillRect(xx,yy,ww,hh);front.fillStyle='#605c4d';front.font=Math.max(4,hh*.65)+'px system-ui,sans-serif';front.textAlign='center';front.textBaseline='middle';front.fillText(String(i+1).padStart(2,'0'),xx+ww/2,yy+hh/2+.2)});
 });}
window.ShelfStudio={ready:Promise.all(jobs),paint:paint};})();
