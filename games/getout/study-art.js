/* Room 1's photographic scenery. Geometry, puzzles and storage remain in the original game. */
var GOStudy=(function(){
  'use strict';
  var images={},names=['door','shelf','desk','fire'];
  names.forEach(function(k){var im=new Image();im.onload=function(){images[k]=im;window.dispatchEvent(new Event('gomaterialready'));};im.src='assets/study-'+k+'-v1.webp';});
  function wall(c,k,e){var im=images[k];if(!im)return false;
    c.save();c.fillStyle='#342b20';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);
    // A subdued, blurred room backdrop fills extra screen area without stretching furniture.
    var w=e.x1-e.x0,h=e.y1-e.y0,z=Math.max(w/1000,h/1400);
    c.save();c.filter='blur(18px)';c.drawImage(im,(e.x0+e.x1-1000*z)/2,(e.y0+e.y1-1400*z)/2,1000*z,1400*z);c.restore();
    c.fillStyle='rgba(20,15,10,.58)';c.fillRect(e.x0,e.y0,w,h);
    c.drawImage(im,0,0,1000,1400);c.restore();return true;
  }
  function crop(c,k,s,d){var im=images[k];if(!im)return false;c.drawImage(im,s[0],s[1],s[2],s[3],d[0],d[1],d[2],d[3]);return true;}
  return {wall:wall,crop:crop,has:function(k){return !!images[k];},ready:function(){return names.every(function(k){return !!images[k];});}};
})();
