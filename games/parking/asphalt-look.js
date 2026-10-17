/* Lot Escape 2.2: visual layer only. Grid, collision and save formats stay intact. */
(function () {
  'use strict';
  var fallback=LArt.car, atlas=new Image(), ready=false, cuts=[], surface=null, surfaceKey='';
  var old=LotLook;
  function rr(c,x,y,w,h,r,fill){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();c.fillStyle=fill;c.fill();}
  function random(seed){return function(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  atlas.onload=function(){
    var cv=document.createElement('canvas');cv.width=atlas.naturalWidth;cv.height=atlas.naturalHeight;var ctx=cv.getContext('2d');ctx.drawImage(atlas,0,0);
    try{var pixels=ctx.getImageData(0,0,cv.width,cv.height).data,cw=cv.width/3,ch=cv.height/2;
      for(var n=0;n<6;n++){var left=Math.floor(n%3*cw),top=Math.floor(Math.floor(n/3)*ch),right=Math.floor(left+cw),bottom=Math.floor(top+ch),x0=right,y0=bottom,x1=left,y1=top;
        for(var y=top;y<bottom;y++)for(var x=left;x<right;x++)if(pixels[(y*cv.width+x)*4+3]>65){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
        cuts.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});
      }ready=cuts.every(function(r){return r.w>10&&r.h>10;});if(ready)LotLook.revision++;
    }catch(e){ready=false;}
  };
  atlas.src='assets/vehicles-v2.png';
  var mapping=[0,5,1,4,2,2,3,3,1,0];
  LArt.car=function(c,color,len,s){
    if(!ready){fallback(c,color,len,s);return;}
    var r=cuts[mapping[color%10]],w=.86*s,h=len*s-.14*s;
    c.save();c.shadowColor='#0009';c.shadowBlur=s*.11;c.shadowOffsetX=s*.04;c.shadowOffsetY=s*.075;
    if(len<3)c.drawImage(atlas,r.x,r.y,r.w,r.h,-w/2,-h/2,w,h);
    else {
      // A distinct delivery truck uses the painted cab and a separate ribbed cargo body.
      c.drawImage(atlas,r.x,r.y,r.w,r.h,-w/2,-h/2,w,s*1.8);c.shadowBlur=0;
      var g=c.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#8a9da8');g.addColorStop(.18,'#e9f1f4');g.addColorStop(.5,'#fff');g.addColorStop(.9,'#b1c3ca');g.addColorStop(1,'#607482');
      rr(c,-w/2,-h/2+s*.9,w,h-s*.9,s*.045,g);c.strokeStyle='#7a8d9770';c.lineWidth=s*.025;
      for(var j=0;j<9;j++){var yy=-h/2+s*(1+j*.18);c.beginPath();c.moveTo(-w*.41,yy);c.lineTo(w*.41,yy);c.stroke();}
      rr(c,-w*.38,h/2-s*.1,s*.14,s*.06,1,'#ff2e43');rr(c,w*.23,h/2-s*.1,s*.14,s*.06,1,'#ff2e43');
    }c.restore();
  };
  function makeSurface(W,H,g,s,x,y){
    var cv=document.createElement('canvas');cv.width=Math.ceil(W*1.5);cv.height=Math.ceil(H*1.5);var c=cv.getContext('2d');c.scale(1.5,1.5);var rand=random(8293);
    var shade=c.createLinearGradient(0,0,W,H);shade.addColorStop(0,'#596168');shade.addColorStop(.45,'#737a7e');shade.addColorStop(1,'#454d54');c.fillStyle=shade;c.fillRect(0,0,W,H);
    for(var i=0;i<W*H*.22;i++){var v=rand(),px=rand()*W,py=rand()*H;c.fillStyle=v>.5?'rgba(239,242,235,'+(.035+rand()*.11)+')':'rgba(5,17,25,'+(.035+rand()*.12)+')';c.fillRect(px,py,.4+rand()*1.1,.4+rand()*.8);}
    // Fine cracks and old tire marks give the asphalt depth without hiding cars.
    c.lineWidth=.65;for(var k=0;k<14;k++){var ax=rand()*W,ay=rand()*H;c.strokeStyle='#19252d35';c.beginPath();c.moveTo(ax,ay);for(var z=0;z<5;z++){ax+=(rand()-.5)*12;ay+=rand()*10;c.lineTo(ax,ay);}c.stroke();}
    var w=g.w*s,h=g.h*s;c.fillStyle='#ffffff04';c.fillRect(x,y,w,h);c.strokeStyle='#ecede323';c.lineWidth=.7;
    for(var a=1;a<g.w;a++){c.beginPath();c.moveTo(x+a*s,y);c.lineTo(x+a*s,y+h);c.stroke();}for(var b=1;b<g.h;b++){c.beginPath();c.moveTo(x,y+b*s);c.lineTo(x+w,y+b*s);c.stroke();}
    // Boundary paint is decorative in Classic; all four edges remain open.
    c.strokeStyle='#f5efd6bb';c.lineWidth=Math.max(2,s*.045);c.setLineDash([s*.52,s*.19]);c.strokeRect(x-s*.12,y-s*.16,w+s*.24,h+s*.32);c.setLineDash([]);
    if(y>35){var dx=W*.82,dy=Math.min(H-22,y+h+22);rr(c,dx-10,dy-10,20,20,2,'#252f36');c.strokeStyle='#a3a999';c.lineWidth=1;for(var q=0;q<5;q++){c.beginPath();c.moveTo(dx-7+q*3.5,dy-7);c.lineTo(dx-7+q*3.5,dy+7);c.stroke();}}
    return cv;
  }
  LotLook={revision:0,draw:function(c,W,H,g,s,x,y){
    var key=[W,H,g.w,g.h,g.challenge,s,x,y].join(':');if(!surface||key!==surfaceKey){surface=makeSurface(W,H,g,s,x,y);surfaceKey=key;}c.drawImage(surface,0,0,W,H);
    if(g.challenge){var w=g.w*s,h=g.h*s;c.strokeStyle='#ffd36b';c.lineWidth=4;c.beginPath();c.moveTo(x+w,y+2*s);c.lineTo(x+w,y);c.lineTo(x,y);c.lineTo(x,y+h);c.lineTo(x+w,y+h);c.lineTo(x+w,y+3*s);c.stroke();c.fillStyle='#163f3c';c.fillRect(x+w,y+2*s,W-x-w,s);c.fillStyle='#a3ffe0';c.font='900 '+Math.max(10,s*.21)+'px system-ui';c.textAlign='center';c.fillText('EXIT',(W+x+w)/2,y+2.45*s);c.font='900 '+s*.45+'px system-ui';c.fillText('→',(W+x+w)/2,y+2.85*s);}
  },arrow:function(c,s){
    c.save();c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(-s*.09,s*.2);c.lineTo(s*.09,s*.2);c.lineTo(s*.09,-s*.04);c.lineTo(s*.21,-s*.04);c.lineTo(0,-s*.29);c.lineTo(-s*.21,-s*.04);c.lineTo(-s*.09,-s*.04);c.closePath();c.strokeStyle='#15304099';c.lineWidth=Math.max(1.5,s*.045);c.stroke();c.fillStyle='#fff';c.fill();c.restore();
  }};
})();
