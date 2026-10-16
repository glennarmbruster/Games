(function (root) {
  'use strict';
  var COLORS = ['#fb5b6b','#36aaf6','#f7bc40','#39cfa4','#a77af5'];
  function rng(seed) { var s=seed>>>0||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;}; }
  function shuffle(a,rand) { for(var i=a.length-1;i>0;i--){var j=Math.floor(rand()*(i+1)),v=a[i];a[i]=a[j];a[j]=v;}return a; }
  function stage(level,index) {
    var rand=rng(level*1709+index*4139+7261), n=level<4?3:(level<9?4:5), colors=[];
    var start=(level+index-1)%5;for(var i=0;i<n;i++)for(var k=0;k<3;k++)colors.push((start+i)%5);shuffle(colors,rand);
    var positions=n===3?[[.34,.32,-.20],[.66,.38,.19],[.50,.65,-.12]]:
      n===4?[[.35,.29,-.23],[.66,.32,.21],[.37,.66,.14],[.66,.65,-.16]]:
      [[.34,.26,-.17],[.69,.30,.22],[.49,.48,-.08],[.31,.70,.19],[.68,.70,-.23]];
    return positions.map(function(p,i){return {id:i,x:p[0],y:p[1],angle:p[2]+(rand()-.5)*.12,shape:(i+index+level)%4,plateColor:(i+level+index)%5,
      screws:[{color:colors[i*3],removed:false},{color:colors[i*3+1],removed:false},{color:colors[i*3+2],removed:false}],gone:false};});
  }
  function make(level){return {level:level,stage:0,stageCount:Math.min(6,2+Math.floor((level-1)/2)),plates:stage(level,0),trays:[{color:-1,count:0},{color:-1,count:0}],reserve:[],moves:0,win:false};}
  function add(s,color) {
    var tray=s.trays.find(function(t){return t.color===color&&t.count>0;})||s.trays.find(function(t){return t.count===0;});
    if(!tray){if(s.reserve.length>=5)return false;s.reserve.push(color);return true;}
    tray.color=color;tray.count++;
    if(tray.count===3){tray.count=0;tray.color=-1;}
    return true;
  }
  function drain(s) {
    // A spare tray stays open until a matching screw arrives or a full trio is waiting.
    var changed=true;
    while(changed){changed=false;
      for(var i=0;i<s.reserve.length;i++){
        var color=s.reserve[i],tray=s.trays.find(function(t){return t.color===color&&t.count>0;});
        if(!tray){var trio=s.reserve.filter(function(c){return c===color;}).length;
          if(trio>=3)tray=s.trays.find(function(t){return t.count===0;});}
        if(!tray)continue;
        s.reserve.splice(i,1);tray.color=color;tray.count++;
        if(tray.count===3){tray.count=0;tray.color=-1;}
        changed=true;break;
      }
    }
  }
  function remove(s,plateId,index) {
    if(s.win)return 'won';var plate=s.plates.find(function(p){return p.id===plateId;});
    if(!plate||plate.gone||!plate.screws[index]||plate.screws[index].removed)return 'missing';
    var color=plate.screws[index].color;if(!add(s,color))return 'full';
    plate.screws[index].removed=true;s.moves++;drain(s);
    if(plate.screws.every(function(v){return v.removed;}))plate.gone=true;
    if(s.plates.every(function(v){return v.gone;})){
      drain(s);
      if(s.reserve.length||s.trays.some(function(t){return t.count;}))return 'sort';
      s.stage++;
      if(s.stage>=s.stageCount){s.win=true;return 'win';}
      s.plates=stage(s.level,s.stage);return 'stage';
    }
    return plate.gone?'plate':'removed';
  }
  function hint(s) {
    var screws=[];s.plates.forEach(function(p){if(!p.gone)p.screws.forEach(function(v,i){if(!v.removed)screws.push({plate:p.id,index:i,color:v.color});});});
    return screws.find(function(v){return s.trays.some(function(t){return t.color===v.color&&t.count>0;});}) || screws[0] || null;
  }
  root.ScrewSort={make:make,remove:remove,hint:hint,colors:COLORS};
})(typeof window!=='undefined'?window:globalThis);
