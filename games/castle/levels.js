/* Castle Crumble 2: deterministic architectural plans, built offline. */
var SiegeLevels = (function () {
  'use strict';
  var names=['The Watchgate','Twin Sentinels','Crown Keep','The Aqueduct','Seaward Bastion','High Citadel','Royal Courtyard','The Last Stronghold'];
  var regions=['The Emerald Coast','The Amber Reach','The Northern March','The Copper Isles','The Ivory Crown'];
  function make(n) {
    n=Math.max(1,Math.min(9999999,n|0));
    var kind=(n-1)%8, chapter=Math.floor((n-1)/8), theme=chapter%5, R=CC.rng(n*7919+31), cells=new Map(), extras=[], banners=[];
    var h=6+Math.min(3,Math.floor(chapter/2)), U=.65;
    function put(x,y,z,type){cells.set(x+','+y+','+z,{x:x,y:y,z:z,t:type||'stone'});}
    function wall(x0,x1,z,ymax,gate) {
      for(var y=0;y<ymax;y++)for(var x=x0;x<=x1;x++){
        if(gate&&Math.abs(x)<2&&y<3)continue;
        if(y>=3&&y<=4&&Math.abs(x)%4===2)continue;
        put(x,y,z);
      }
      for(var x=x0;x<=x1;x+=2)put(x,ymax,z);
    }
    function side(x,z0,z1,ymax){for(var z=z0;z<=z1;z++)for(var y=0;y<ymax;y++)if(!(y===3&&(z-z0)%4===2))put(x,y,z);for(var z=z0;z<=z1;z+=2)put(x,ymax,z);}
    function tower(cx,cz,height,width,roof){
      var r=width||2;
      for(var y=0;y<height;y++)for(var x=-r;x<=r;x++)for(var z=-r;z<=r;z++){
        if(Math.abs(x)!==r&&Math.abs(z)!==r)continue;
        if(y>=3&&y<=4&&((x===0&&Math.abs(z)===r)||(z===0&&Math.abs(x)===r)))continue;
        put(cx+x,y,cz+z);
      }
      for(var x=-r;x<=r;x++)for(var z=-r;z<=r;z++)if((Math.abs(x)===r||Math.abs(z)===r)&&((x+z)%2===0))put(cx+x,height,cz+z);
      if(roof)extras.push(['pyr',cx*U,(height+1.6)*U,cz*U,(2*r+1.4)*U,2.0*U,(2*r+1.4)*U]);
      banners.push({x:cx*U,y:(height-.3)*U,z:(cz+r)*U+.36});
      // Powder magazines are visible through the doorway/window, and reachable from the flanks.
      put(cx,0,cz+r,'tnt');put(cx,1,cz+r,'tnt');
    }
    if(kind===0){tower(-5,0,h+2,2,false);tower(5,0,h+2,2,false);wall(-2,2,0,h-1,true);}
    if(kind===1){tower(-4,0,h+4,2,true);tower(4,0,h+3,2,false);wall(-1,1,0,h-1,false);}
    if(kind===2){tower(0,-3,h+5,3,true);wall(-8,8,3,h-2,true);side(-8,-3,3,h-2);side(8,-3,3,h-2);}
    if(kind===3){tower(-8,0,h+2,2,false);tower(8,0,h+2,2,false);for(var x=-5;x<=5;x++)for(var y=0;y<h;y++)if(y>=h-2||x%4===0)put(x,y,0);for(var x=-5;x<=5;x+=2)put(x,h,0);}
    if(kind===4){tower(-5,3,h+2,2,false);tower(5,3,h+2,2,false);tower(0,-4,h+5,2,true);wall(-2,2,3,h-1,true);side(-5,-3,0,h-2);side(5,-3,0,h-2);}
    if(kind===5){tower(0,0,h+7,3,false);tower(-7,1,h,2,true);tower(7,1,h,2,true);wall(-4,4,4,h-2,true);}
    if(kind===6){tower(-5,-4,h+2,2,true);tower(5,-4,h+2,2,true);wall(-7,7,3,h-1,true);side(-7,-2,3,h-1);side(7,-2,3,h-1);}
    if(kind===7){tower(-6,3,h+2,2,false);tower(6,3,h+2,2,false);tower(0,-4,h+6,3,true);wall(-3,3,3,h,true);side(-6,-2,0,h-1);side(6,-2,0,h-1);}
    // Exposed powder at structural junctions creates optional chain-reaction targets.
    for(var x of [-2,2]){var key=x+',0,3';if(cells.has(key))cells.get(key).t='tnt';}
    var used=new Set(), pieces=[];
    var ordered=Array.from(cells.values()).sort(function(a,b){return a.y-b.y||a.z-b.z||a.x-b.x;});
    ordered.forEach(function(c){var key=c.x+','+c.y+','+c.z;if(used.has(key))return;used.add(key);
      var other=cells.get((c.x+1)+','+c.y+','+c.z), join=c.t==='stone'&&other&&other.t==='stone'&&!used.has((c.x+1)+','+c.y+','+c.z)&&((c.x+c.y)%2===0);
      if(join)used.add((c.x+1)+','+c.y+','+c.z);
      pieces.push([c.t==='tnt'?'tnt':join?'b2':'b1',(c.x+(join?.5:0))*U,(c.y+.5)*U,c.z*U,U*(join?2:1),U,U]);
    });
    pieces=pieces.concat(extras);
    var maxY=Math.max.apply(null,pieces.map(function(p){return p[2]+p[5]/2;}));
    // Small deterministic silhouette variations after the opening region.
    if(chapter%2===1){pieces.forEach(function(p){p[1]=-p[1];});banners.forEach(function(b){b.x=-b.x;});}
    var target=Math.min(.78,.58+kind*.018+Math.min(chapter,8)*.008);
    return {n:n,name:names[kind],region:regions[theme],theme:theme,seed:n*7919+31,pieces:pieces,banners:banners,height:maxY,target:target,balls:Math.ceil(pieces.length/65)+5,bot:Math.ceil(pieces.length/100)+2,yaw:(kind%2?-.24:.24),hint:n===1?'Aim low at the red powder magazines.':kind===3?'Break a bridge pier and let gravity do the rest.':'Break the lower walls. Falling stone can ignite the powder.'};
  }
  return {make:make,names:names,regions:regions};
})();
