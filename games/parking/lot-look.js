var LotLook=(function(){'use strict';var bg=new Image();bg.src='assets/marina-v1.webp';
function box(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function draw(c,W,H,g,s,x,y){c.fillStyle='#203b3d';c.fillRect(0,0,W,H);if(bg.complete&&bg.naturalWidth){var k=Math.max(W/bg.width,H/bg.height);c.drawImage(bg,(W-bg.width*k)/2,(H-bg.height*k)/2,bg.width*k,bg.height*k);}var w=g.w*s,h=g.h*s;
c.save();c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=20;c.shadowOffsetY=8;box(c,x-7,y-7,w+14,h+14,10,'#d4cbb5');c.restore();box(c,x,y,w,h,5,'#303b40');
// Quiet, deterministic asphalt grain; no visual randomness from frame to frame.
for(var i=0;i<650;i++){var xx=(i*73.719%997)/997*w,yy=(i*137.51%991)/991*h;c.fillStyle=i%2?'rgba(240,245,231,.065)':'rgba(0,0,0,.09)';c.fillRect(x+xx,y+yy,1.4,1.4);}
c.strokeStyle='rgba(218,223,201,.2)';c.lineWidth=1;c.setLineDash([3,5]);for(var a=1;a<g.w;a++){c.beginPath();c.moveTo(x+a*s,y+5);c.lineTo(x+a*s,y+h-5);c.stroke();}for(var b=1;b<g.h;b++){c.beginPath();c.moveTo(x+5,y+b*s);c.lineTo(x+w-5,y+b*s);c.stroke();}c.setLineDash([]);
if(g.challenge){c.fillStyle='rgba(85,214,170,.10)';c.fillRect(x,y+2*s,w,s);c.fillStyle='#183f3b';c.fillRect(x+w,y+2*s,W-x-w,s);c.strokeStyle='#73ecc2';c.lineWidth=3;c.beginPath();c.moveTo(x+w+2,y+2*s+3);c.lineTo(W,y+2*s+3);c.moveTo(x+w+2,y+3*s-3);c.lineTo(W,y+3*s-3);c.stroke();c.fillStyle='#abffe1';c.font='900 '+Math.max(9,s*.19)+'px system-ui';c.textAlign='center';c.fillText('EXIT',(W+x+w)/2,y+2.48*s);c.font='900 '+s*.42+'px system-ui';c.fillText('→',(W+x+w)/2,y+2.85*s);
// Solid curb identifies closed edges; the opening on the right is the only exit.
c.strokeStyle='#e9bd64';c.lineWidth=4;c.beginPath();c.moveTo(x+w,y+2*s);c.lineTo(x+w,y);c.lineTo(x,y);c.lineTo(x,y+h);c.lineTo(x+w,y+h);c.lineTo(x+w,y+3*s);c.stroke();}
c.textAlign='center';c.fillStyle='#fff7df';c.shadowColor='#152b2e';c.shadowBlur=8;c.font='800 '+Math.min(17,W*.043)+'px system-ui';c.fillText(g.challenge?'HARBOR EXIT • LOT '+g.n:'HARBOR PARKING • CLASSIC',W/2,Math.max(24,y-27));c.font='600 12px system-ui';c.fillStyle='#ecf5df';c.fillText(g.challenge?'Free the striped red car. Swipe to position vehicles.':'Clear the lot. Every open edge is an exit.',W/2,Math.min(H-12,y+h+36));c.shadowBlur=0;
}
var paint=['#d64135','#d99936','#c1ac61','#4d9373','#44a8a7','#427ba9','#77649a','#ad6e85','#c5d0d0','#52616a'];
function car(c,color,len,s){var w=.76*s,h=len*s-.18*s,t=-h/2,body=paint[color%10];c.save();c.shadowColor='#0009';c.shadowBlur=s*.14;c.shadowOffsetX=s*.055;c.shadowOffsetY=s*.1;box(c,-w/2,t,w,h,s*.15,'#111c22');c.restore();
c.fillStyle='#0c1218';for(var y of [t+s*.3,t+h-s*.4]){box(c,-w/2-s*.055,y,s*.12,s*.26,2,'#10171a');box(c,w/2-s*.065,y,s*.12,s*.26,2,'#10171a');}
var gr=c.createLinearGradient(-w/2,0,w/2,0);gr.addColorStop(0,'#17252c');gr.addColorStop(.09,body);gr.addColorStop(.36,body);gr.addColorStop(.48,'#ffffffa0');gr.addColorStop(.58,body);gr.addColorStop(.89,body);gr.addColorStop(1,'#18272b');c.lineWidth=1;box(c,-w/2,t,w,h,s*.15,gr,'#102229');
if(len===3){box(c,-w*.43,t+s*.77,w*.86,h-s*.86,s*.035,'#c8cecd','#536368');c.strokeStyle='#8c999d';for(var a=0;a<8;a++){c.beginPath();c.moveTo(-w*.36,t+s*.9+a*s*.22);c.lineTo(w*.36,t+s*.9+a*s*.22);c.stroke();}}
var front=t+(len===3?s*.18:h*.23),roof=len===3?s*.27:h*.25;
var glass=c.createLinearGradient(-w*.4,front,w*.4,front+s*.3);glass.addColorStop(0,'#163447');glass.addColorStop(.5,'#84bac5');glass.addColorStop(.54,'#285062');glass.addColorStop(1,'#102633');box(c,-w*.38,front,w*.76,s*.28,s*.05,glass,'#bdcaca');
if(len===2){box(c,-w*.34,front+s*.32,w*.68,roof,s*.065,body,'#ffffff55');box(c,-w*.33,t+h*.7,w*.66,h*.13,s*.04,glass,'#acbcc1');}
c.strokeStyle='#ffffff65';c.lineWidth=1;c.beginPath();c.moveTo(-w*.38,t+s*.13);c.lineTo(-w*.38,t+h-s*.14);c.stroke();c.fillStyle='#fcf4c7';for(var side of [-1,1]){box(c,side*w*.3-s*.085,t+s*.07,s*.17,s*.07,2,'#fff2b9');box(c,side*w*.3-s*.07,t+h-s*.1,s*.14,s*.045,1,'#ff5742');box(c,side*w*.5-s*.025,front+s*.23,s*.09,s*.065,2,body,'#192c35');}
box(c,-w*.18,t+h-s*.095,w*.36,s*.055,1,'#e9e6d4');
}
LArt.car=car;return {draw:draw};})();
