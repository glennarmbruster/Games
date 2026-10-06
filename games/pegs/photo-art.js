/* Local scenic photographs. Cache at most two decoded images; never touch PL state. */
var PegPhoto = (function () {
  'use strict';
  var keys = ['shoals','kelp','coral','wreck','moon','ember','meadow','beach','maple','jungle','blossom','tide','light','snow','fire','deck','canyon','volcano'];
  var cache = {}, order = [], pending = {}, failed = {};
  function request(key) {
    if (pending[key] || failed[key]) return;
    pending[key] = true;
    var im = new Image();
    im.onload = function () {
      delete pending[key]; cache[key] = im; order.push(key);
      while(order.length > 2) delete cache[order.shift()];
      window.dispatchEvent(new Event('pegphotoready'));
    };
    im.onerror = function () { delete pending[key]; failed[key] = true; };
    im.src = 'assets/' + key + '-v1.webp';
  }
  function backdrop(n,w,h,halloween) {
    var key = keys[n], im = cache[key]; if (!key) return null;
    if (!im) { request(key); return null; }
    var c = document.createElement('canvas'); c.width=w; c.height=h;
    var x=c.getContext('2d'),s=Math.max(w/im.width,h/im.height),dw=im.width*s,dh=im.height*s;
    x.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
    // Restrained exposure falloff keeps the HUD and bright targets legible.
    var shade=x.createLinearGradient(0,0,0,h);shade.addColorStop(0,'rgba(3,12,23,.5)');shade.addColorStop(.2,'rgba(3,12,23,.1)');shade.addColorStop(.75,'rgba(3,12,23,.08)');shade.addColorStop(1,'rgba(3,12,23,.4)');x.fillStyle=shade;x.fillRect(0,0,w,h);
    if(halloween){x.fillStyle='rgba(47,12,58,.16)';x.fillRect(0,0,w,h);}
    c.photo=true; return c;
  }
  function launcher(x,cx,cy,angle) {
    x.save();x.translate(cx,cy);x.rotate(-angle);
    x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=4;x.shadowOffsetY=3;
    var metal=x.createLinearGradient(-15,0,15,0);metal.addColorStop(0,'#3b3c3d');metal.addColorStop(.2,'#909fa4');metal.addColorStop(.43,'#eef6f4');metal.addColorStop(.6,'#657b84');metal.addColorStop(1,'#243b43');
    x.fillStyle=metal;x.beginPath();x.moveTo(-4,-16);x.arcTo(11,-16,11,23,7);x.arcTo(11,23,-11,23,7);x.arcTo(-11,23,-11,-16,7);x.arcTo(-11,-16,11,-16,7);x.closePath();x.fill();x.shadowBlur=0;x.shadowOffsetY=0;
    x.fillStyle='#10252e';x.beginPath();x.ellipse(0,21,9,4,0,0,Math.PI*2);x.fill();
    x.strokeStyle='#bfd9dc';x.lineWidth=1.4;x.stroke();
    var base=x.createRadialGradient(-5,-9,1,0,-6,18);base.addColorStop(0,'#f3e6bf');base.addColorStop(.35,'#c9aa68');base.addColorStop(.75,'#7e6032');base.addColorStop(1,'#352b1c');x.fillStyle=base;x.beginPath();x.arc(0,-9,16,0,Math.PI*2);x.fill();
    x.fillStyle='#e8f0ec';x.beginPath();x.arc(0,-9,4,0,Math.PI*2);x.fill();x.restore();
  }
  return {backdrop:backdrop,launcher:launcher,keys:keys,loaded:function(){return Object.keys(cache);}};
})();
