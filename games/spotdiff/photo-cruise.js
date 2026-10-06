/* Photographic cruise v1. Frozen art/seed contract for existing saved puzzles.
 * Local photographs + bounded object layers; generation never calls a server.
 * The original DT generator remains available for legacy saves and scenes.
 */
var PhotoCruise = (function () {
  'use strict';
  var ID = 'photo-cruise-v1', SW = 1536, SH = 1024, S = 900 / SW;
  var DIR = 'assets/photo-cruise/', base, layers = {}, ready = false, loading;
  // Each region is one semantic target with authored photographic variants.
  // Removal layers include the object's shadow/reflection. Files and ordering
  // are frozen with ID; future environments must use new renderer versions.
  var REGIONS = [
  {
    "id": "shade",
    "label": "foreground parasol",
    "box": [
      0,
      0,
      600,
      113
    ],
    "states": 2,
    "color": "shade-color-v1.webp"
  },
  {
    "id": "upper",
    "label": "upper-deck parasol",
    "box": [
      659,
      54,
      239,
      86
    ],
    "states": 2,
    "color": "upper-color-v1.webp"
  },
  {
    "id": "ring",
    "label": "life ring",
    "box": [
      325,
      334,
      104,
      115
    ],
    "states": 2,
    "color": "ring-color-v1.webp"
  },
  {
    "id": "chair",
    "label": "left lounger cushions",
    "box": [
      437,
      354,
      181,
      107
    ],
    "states": 2,
    "color": "chair-color-v1.webp"
  },
  {
    "id": "towel",
    "label": "folded towel",
    "box": [
      674,
      406,
      113,
      61
    ],
    "states": 2,
    "color": "towel-color-v1.webp",
    "minLevel": 6
  },
  {
    "id": "flower",
    "label": "hibiscus blossom",
    "box": [
      230,
      418,
      76,
      95
    ],
    "states": 2,
    "color": "flower-color-v1.webp"
  },
  {
    "id": "ball",
    "label": "pool ball",
    "box": [
      1118,
      485,
      122,
      169
    ],
    "states": 2,
    "absent": "ball-absent-v1.webp"
  },
  {
    "id": "hat",
    "label": "sunhat",
    "box": [
      355,
      683,
      447,
      260
    ],
    "states": 3,
    "absent": "hat-absent-v1.webp",
    "color": "hat-color-v1.webp"
  },
  {
    "id": "book",
    "label": "book",
    "box": [
      1023,
      792,
      308,
      161
    ],
    "states": 3,
    "absent": "book-absent-v1.webp",
    "color": "book-color-v1.webp"
  },
  {
    "id": "drink",
    "label": "cocktail",
    "box": [
      1014,
      642,
      105,
      132
    ],
    "states": 2,
    "color": "drink-color-v1.webp",
    "conflict": "paper"
  },
  {
    "id": "paper",
    "label": "cocktail parasol",
    "box": [
      966,
      576,
      113,
      70
    ],
    "states": 2,
    "color": "paper-color-v1.webp",
    "conflict": "drink",
    "minLevel": 6
  }
];
  function rng(seed) { var a = seed >>> 0; return function () { a += 0x6D2B79F5; var t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a,r) { for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),v=a[i];a[i]=a[j];a[j]=v;}return a; }
  function sceneBox(region, mirror) { var b=region.box;return {x:(mirror?SW-b[0]-b[2]:b[0])*S,y:b[1]*S,w:b[2]*S,h:b[3]*S}; }
  function level(n,d) {
    n=Math.max(1,Math.floor(n)||1); d=Math.max(0,Math.min(3,d|0));
    var r=rng(Math.imul(n,2654435761)^Math.imul(d+1,2246822519)^0x504331);
    var mirror=n>1&&r()<.5, a={},b={},count=DT.diffCount(n,d),selected=[];
    // Exclude one of the close cocktail targets before shuffling. Ten independent
    // targets remain even on Normal; nearby changes never count as two finds.
    var skip=r()<.5?'paper':'drink';if(n<6&&d<2)skip='paper';
    var pool=shuffle(REGIONS.filter(function(z){return (z.minDifficulty||0)<=d&&z.id!==skip&&(d>=2||n>=(z.minLevel||1));}).slice(),r);
    // Guarantee one bold presence change on early/relaxed boards.
    if(d<2){var first=pool.findIndex(function(z){return z.id==='ball'||z.id==='book';});if(first>0){var v=pool.splice(first,1)[0];pool.unshift(v);}}
    REGIONS.forEach(function(z){var state=Math.floor(r()*z.states);a[z.id]=n===1?0:state;b[z.id]=a[z.id];});
    pool.slice(0,count).forEach(function(z){
      var from=a[z.id],to=(from+1+Math.floor(r()*(z.states-1)))%z.states;
      if(d<2&&z.absent){var reverse=r()<.5;from=n===1?0:reverse?0:1;to=1-from;a[z.id]=from;}
      b[z.id]=to;
      selected.push({id:z.id,k:z.id,kind:z.absent&&(from===1||to===1)?'gone':'color',side:'b',box:sceneBox(z,mirror),label:z.label,easy:!z.minDifficulty});
    });
    selected.sort(function(x,y){return x.box.y+x.box.h/2-y.box.y-y.box.h/2||x.box.x-y.box.x;});
    selected.forEach(function(z,i){z.i=i;});
    return {n:n,d:d,s:null,theme:'cruise',attempt:0,renderer:ID,scene:{theme:'cruise',renderer:ID,mirror:mirror,a:a,b:b},diffs:selected};
  }
  function signature(l) { return ID+':'+l.n+':'+l.d+':'+(l.scene.mirror?1:0)+':'+REGIONS.map(function(z){return l.scene.a[z.id]+''+l.scene.b[z.id];}).join('.'); }
  function canvas(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function image(file){return new Promise(function(resolve,reject){var im=new Image(),timer=setTimeout(fail,20000);function fail(){clearTimeout(timer);reject(new Error('The cruise artwork could not be loaded. Reconnect once to finish installing this update.'));}im.onload=function(){clearTimeout(timer);resolve(im);};im.onerror=fail;im.src=DIR+file;});}
  function layer(z,im){
    var b=z.box,c=canvas(b[2],b[3]),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);
    var pixels=ctx.getImageData(0,0,c.width,c.height),feather=6;
    for(var y=0;y<c.height;y++)for(var x=0;x<c.width;x++){
      // Do not fade at the photograph's own edges (e.g. the foreground canopy).
      var edge=Math.min(b[0]===0?999:x,b[1]===0?999:y,b[0]+b[2]===SW?999:c.width-1-x,b[1]+b[3]===SH?999:c.height-1-y);
      pixels.data[(y*c.width+x)*4+3]=Math.round(255*Math.min(1,edge/feather));
    }
    ctx.putImageData(pixels,0,0);return c;
  }
  var FILES=['scene-v1.webp'];
  REGIONS.forEach(function(z){if(z.absent)FILES.push(z.absent);if(z.color)FILES.push(z.color);});
  function load(){
    if(loading)return loading;
    loading=Promise.all(FILES.map(image)).then(function(images){
      base=images[0];var byName={};FILES.forEach(function(f,i){byName[f]=images[i];});
      REGIONS.forEach(function(z){var arr=[null];if(z.absent)arr.push(layer(z,byName[z.absent]));if(z.color)arr.push(layer(z,byName[z.color]));layers[z.id]=arr;});ready=true;
    });return loading;
  }
  function draw(ctx,sc,side){
    if(!ready)throw new Error('Photographic artwork is not ready');
    ctx.save();if(sc.mirror){ctx.translate(900,0);ctx.scale(-1,1);}ctx.drawImage(base,0,0,900,600);
    var values=sc[side==='b'?'b':'a'];REGIONS.forEach(function(z){var im=layers[z.id][values[z.id]];if(im){var b=z.box;ctx.drawImage(im,b[0]*S,b[1]*S,b[2]*S,b[3]*S);}});ctx.restore();
  }
  return {ID:ID,REGIONS:REGIONS,FILES:FILES,level:level,signature:signature,load:load,draw:draw,get ready(){return ready;}};
})();
if(typeof module!=='undefined')module.exports=PhotoCruise;
