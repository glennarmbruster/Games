/* Photographic material detail only: no hit regions, clues, state or RNG changes. */
var GOMaterial=(function(){
  'use strict';
  var images={},keys=['wood','fabric','plaster','leather'],patterns=new WeakMap();
  keys.forEach(function(k){var im=new Image();im.onload=function(){images[k]=im;window.dispatchEvent(new Event('gomaterialready'));};im.src='assets/'+k+'-v1.webp';});
  function paint(c,k,x,y,w,h,vertical,strength){
    if(!images[k]||w<=0||h<=0)return false;
    var ps=patterns.get(c);if(!ps){ps={};patterns.set(c,ps);}var p=ps[k]||(ps[k]=c.createPattern(images[k],'repeat'));
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.translate(x,y);if(vertical){c.rotate(Math.PI/2);c.translate(0,-w);}
    c.scale(.75,.75);c.globalCompositeOperation='soft-light';c.globalAlpha*=strength==null?.65:strength;c.fillStyle=p;c.fillRect(0,0,(vertical?h:w)/.75,(vertical?w:h)/.75);c.restore();return true;
  }
  function wood(c,x,y,w,h,base,vertical){
    if(!images.wood)return false;c.save();c.fillStyle=base;c.fillRect(x,y,w,h);paint(c,'wood',x,y,w,h,vertical,.85);
    var g=c.createLinearGradient(x,y,vertical?x+w:x,vertical?y:y+h);g.addColorStop(0,'rgba(255,238,211,.16)');g.addColorStop(.35,'rgba(255,238,211,.02)');g.addColorStop(1,'rgba(20,10,3,.25)');c.fillStyle=g;c.fillRect(x,y,w,h);
    c.fillStyle='rgba(255,242,215,.28)';c.fillRect(x,y,w,Math.min(2,h*.04));c.fillStyle='rgba(20,10,3,.23)';c.fillRect(x,y+h-Math.min(2,h*.04),w,Math.min(2,h*.04));c.restore();return true;
  }
  return{paint:paint,wood:wood,ready:function(){return keys.every(function(k){return !!images[k];});}};
})();
