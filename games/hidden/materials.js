/* Visual materials only. Pattern fills keep the current path and its alpha
 * silhouette; procedural placement, camouflage colors and hit shapes are intact. */
var HOMaterial=(function(){
  'use strict';
  var images={},patterns=new WeakMap(),keys=['wood','fabric','plaster'];
  keys.forEach(function(k){var im=new Image();im.onload=function(){images[k]=im;window.dispatchEvent(new Event('homaterialready'));};im.src='assets/'+k+'-v1.webp';});
  function pattern(c,k){if(!images[k])return null;var ps=patterns.get(c);if(!ps){ps={};patterns.set(c,ps);}if(!ps[k]){var p=c.createPattern(images[k],'repeat');if(p.setTransform&&typeof DOMMatrix!=='undefined')p.setTransform(new DOMMatrix().scale(.2));ps[k]=p;}return ps[k];}
  function fill(c,k,amount){var p=pattern(c,k);if(!p)return;c.save();c.globalCompositeOperation='soft-light';c.globalAlpha*=amount;c.fillStyle=p;c.fill();c.restore();}
  function rect(c,k,x,y,w,h,amount){var p=pattern(c,k);if(!p)return;c.save();c.globalCompositeOperation='soft-light';c.globalAlpha*=amount;c.fillStyle=p;c.fillRect(x,y,w,h);c.restore();}
  return {fill:fill,rect:rect,ready:function(){return keys.every(function(k){return !!images[k];});}};
})();
