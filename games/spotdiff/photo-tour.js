/* Local photographic tour. New renderer IDs isolate new art from saved cruise
 * and original procedural puzzles. No storage keys or DT rules change here. */
var PhotoTour = (function () {
  'use strict';
  var S = 900 / 1536, cache = {}, loading, ready = false;
  function definition(id) { return PhotoTourData.find(function (e) { return e.id === id; }); }
  function known(id) { return id === PhotoCruise.ID || !!definition(id); }
  function rng(seed) { var a = seed >>> 0; return function () { a += 0x6D2B79F5; var t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function level(n, d, id) {
    n = Math.max(1, Math.floor(n) || 1); d = Math.max(0, Math.min(3, d | 0));
    if (!id) { var slot = (n - 1) % 6; id = slot ? PhotoTourData[slot - 1].id : PhotoCruise.ID; }
    if (id === PhotoCruise.ID) return PhotoCruise.level(n, d);
    var e = definition(id); if (!e) return null;
    var seed = 0; for (var k = 0; k < id.length; k++) seed = Math.imul(seed, 31) + id.charCodeAt(k) | 0;
    var r = rng(Math.imul(n, 2654435761) ^ Math.imul(d + 1, 2246822519) ^ seed);
    var mirror = r() < .5, a = {}, b = {}, pool = e.regions.slice(), diffs = [];
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    e.regions.forEach(function (z) { a[z.id] = Math.floor(r() * 2); b[z.id] = a[z.id]; });
    pool.slice(0, DT.diffCount(n, d)).forEach(function (z) {
      b[z.id] = 1 - a[z.id]; var q = z.box;
      diffs.push({id:z.id,k:z.id,kind:'color',side:'b',box:{x:(mirror ? 1536-q[0]-q[2] : q[0])*S,y:q[1]*S,w:q[2]*S,h:q[3]*S},label:z.label,easy:true});
    });
    diffs.sort(function (x,y) { return x.box.y+x.box.h/2-y.box.y-y.box.h/2 || x.box.x-y.box.x; });
    diffs.forEach(function (z,i) { z.i=i; });
    return {n:n,d:d,s:null,theme:e.key,attempt:0,renderer:id,scene:{theme:e.key,renderer:id,mirror:mirror,a:a,b:b},diffs:diffs};
  }
  function signature(l) {
    if (l.renderer === PhotoCruise.ID) return PhotoCruise.signature(l);
    var e = definition(l.renderer);
    return l.renderer+':'+l.n+':'+l.d+':'+(l.scene.mirror?1:0)+':'+e.regions.map(function(z){return l.scene.a[z.id]+''+l.scene.b[z.id];}).join('.');
  }
  function image(file) { return new Promise(function(resolve,reject){var im=new Image(),timer=setTimeout(fail,20000);function fail(){clearTimeout(timer);reject(new Error('Photographic artwork is not installed'));}im.onload=function(){clearTimeout(timer);resolve(im);};im.onerror=fail;im.src=file;}); }
  function layer(z,im) {
    var q=z.box,c=document.createElement('canvas');c.width=q[2];c.height=q[3];var x=c.getContext('2d',{willReadFrequently:true});
    if(z.poly){x.beginPath();z.poly.forEach(function(p,i){if(i)x.lineTo(p[0]-q[0],p[1]-q[1]);else x.moveTo(p[0]-q[0],p[1]-q[1]);});x.closePath();x.clip();}
    x.drawImage(im,0,0);var pixels=x.getImageData(0,0,c.width,c.height);
    for(var y=0;y<c.height;y++)for(var xx=0;xx<c.width;xx++){
      var edge=Math.min(q[0]===0?999:xx,q[1]===0?999:y,q[0]+q[2]===1536?999:c.width-1-xx,q[1]+q[3]===1024?999:c.height-1-y),p=(y*c.width+xx)*4+3;
      pixels.data[p]=Math.round(pixels.data[p]*Math.min(1,edge/4));
    }x.putImageData(pixels,0,0);return c;
  }
  function load() {
    if(loading)return loading;
    loading=Promise.all([PhotoCruise.load()].concat(PhotoTourData.map(function(e){
      var dir='assets/photo-tour/'+e.key+'/';
      return Promise.all([image(dir+'scene-v1.webp')].concat(e.regions.map(function(z){return image(dir+z.file);}))).then(function(images){
        var item={base:images[0],layers:{}};e.regions.forEach(function(z,i){item.layers[z.id]=layer(z,images[i+1]);});cache[e.id]=item;
      });
    }))).then(function(){ready=true;});return loading;
  }
  function draw(ctx,sc,side){
    if(sc.renderer===PhotoCruise.ID)return PhotoCruise.draw(ctx,sc,side);
    var e=definition(sc.renderer),item=cache[sc.renderer];if(!item)throw new Error('Photographic artwork is not ready');
    ctx.save();if(sc.mirror){ctx.translate(900,0);ctx.scale(-1,1);}ctx.drawImage(item.base,0,0,900,600);
    var values=sc[side==='b'?'b':'a'];e.regions.forEach(function(z){if(values[z.id]){var q=z.box;ctx.drawImage(item.layers[z.id],q[0]*S,q[1]*S,q[2]*S,q[3]*S);}});ctx.restore();
  }
  function name(id){return id===PhotoCruise.ID?'Cruise deck':definition(id).name;}
  return {known:known,level:level,signature:signature,load:load,draw:draw,name:name,get ready(){return ready;}};
})();
