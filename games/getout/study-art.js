/* Room 1's photographic scenery. Geometry, puzzles and storage remain in the original game. */
var GOStudy=(function(){
  'use strict';
  var images={},base=['door','shelf','desk','fire'],details=['coatz','doorz','drawer1','drawer2','clockz','deskz','hearth','bookopen','mantelz','globez','events','items','lane'],names=base.concat(details);
  names.forEach(function(k){var im=new Image();im.onload=function(){images[k]=im;window.dispatchEvent(new Event('gomaterialready'));};im.src='assets/study-'+k+'-'+(base.indexOf(k)>=0?'v1':'v2')+'.webp';});
  function wall(c,k,e){var im=images[k];if(!im)return false;
    c.save();c.fillStyle='#342b20';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);
    // A subdued, blurred room backdrop fills extra screen area without stretching furniture.
    var w=e.x1-e.x0,h=e.y1-e.y0,z=Math.max(w/1000,h/1400);
    c.save();c.filter='blur(18px)';c.drawImage(im,(e.x0+e.x1-1000*z)/2,(e.y0+e.y1-1400*z)/2,1000*z,1400*z);c.restore();
    c.fillStyle='rgba(20,15,10,.58)';c.fillRect(e.x0,e.y0,w,h);
    c.drawImage(im,0,0,1000,1400);c.restore();return true;
  }
  function crop(c,k,s,d){var im=images[k];if(!im)return false;c.drawImage(im,s[0],s[1],s[2],s[3],d[0],d[1],d[2],d[3]);return true;}
  var eventNames=['kite','pie','boat','rose','bird','letter','umbrella','bike'];
  function eventPhoto(c,k,x,y,w,h){var im=images.events,i=eventNames.indexOf(k);if(!im||i<0)return false;var cell=im.width/4; c.drawImage(im,(i%4)*cell,Math.floor(i/4)*cell,cell,cell,x,y,w,h);return true;}
  function texture(c,k,x,y,w,h){
    var key=k==='paper'?'bookopen':k==='metal'?'drawer1':k==='wall'?'deskz':'doorz';
    var rect=k==='paper'?[130,390,300,520]:k==='metal'?[145,355,690,220]:k==='wall'?[460,40,330,450]:[160,1140,630,220];
    return crop(c,key,rect,[x,y,w,h]);
  }
  var spriteRects={torch:[10,150,470,220],batteries:[558,86,220,324],lens:[930,96,330,320],poker:[1290,195,480,112],key:[8,514,450,220],bow:[493,497,300,280],blade:[895,580,410,160],rusty:[1328,546,420,206]};
  function sprite(c,id,x,y,s){var im=images.items,k=id==='torchOn'||id==='uv'?'torch':id,r=spriteRects[k];if(!im||!r)return false;var a=im.width/1774,h=s*r[3]/r[2];c.drawImage(im,r[0]*a,r[1]*a,r[2]*a,r[3]*a,x-s/2,y-h/2,s,h);
    if(id==='uv'||id==='torchOn'){c.save();c.globalAlpha=.5;c.fillStyle=id==='uv'?'#9b67dd':'#fff1ad';c.beginPath();c.ellipse(x+s*.40,y+s*.025,s*.07,s*.17,0,0,Math.PI*2);c.fill();c.restore();}return true;}
  return {eventPhoto:eventPhoto,texture:texture,sprite:sprite,wall:wall,crop:crop,has:function(k){return !!images[k];},ready:function(){return names.every(function(k){return !!images[k];});}};
})();
