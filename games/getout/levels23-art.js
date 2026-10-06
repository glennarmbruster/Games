/* Photographic sets for Starlight Diner and Lighthouse Lamp Room.
   Puzzle state and hit testing remain authoritative in the original room modules. */
var GOLevels = (function () {
  'use strict';
  var images={}, names={2:['door','counter','juke','kitchen','doorz','gumz','regz','piez','counterz','shakez','gratez','jukez','boothz','wheelz','fusez'],3:['door','lens','desk','window','window-open','doorz','cabz','ropez','lensz','chestz','deskz','scopez','signalz','lockerz','farview']};
  Object.keys(names).forEach(function(id){names[id].forEach(function(v){var k=id+'-'+v,im=new Image();im.onload=function(){images[k]=im;window.dispatchEvent(new Event('gomaterialready'));};im.src='assets/room'+k+'-v1.webp';});});
  function has(k){return !!images[k];}
  function crop(c,k,s,d){var im=images[k];if(!im)return false;c.drawImage(im,s[0]*im.width/1000,s[1]*im.height/1400,s[2]*im.width/1000,s[3]*im.height/1400,d[0],d[1],d[2],d[3]);return true;}
  function wall(c,k,e){var im=images[k];if(!im)return false;c.save();var w=e.x1-e.x0,h=e.y1-e.y0,z=Math.max(w/1000,h/1400);c.fillStyle='#182422';c.fillRect(e.x0,e.y0,w,h);c.save();c.filter='blur(20px)';c.drawImage(im,(e.x0+e.x1-1000*z)/2,(e.y0+e.y1-1400*z)/2,1000*z,1400*z);c.restore();c.fillStyle='rgba(15,17,18,.5)';c.fillRect(e.x0,e.y0,w,h);if(k==='2-regz'){c.drawImage(im,50,115,900,1260);}else{c.drawImage(im,0,0,1000,1400);}c.restore();return true;}
  var grain;
  function texture(c,id,type,x,y,w,h,alpha){if(w<18||h<16)return; c.save();c.globalAlpha=alpha==null?.18:alpha;c.globalCompositeOperation='soft-light';
    var k=id===2?'2-regz':'3-deskz',s=id===2?[155,600,680,380]:[50,80,880,380];
    if(type==='paper'){k='2-wheelz';s=[374,610,220,270];}
    if(type==='wall'){k=id===2?'2-counter':'3-door';s=id===2?[20,110,170,280]:[325,130,340,120];}
    if(type==='metal'){k='2-kitchen';s=[100,780,130,200];}
    if(!crop(c,k,s,[x,y,w,h])){if(!grain){grain=document.createElement('canvas');grain.width=grain.height=128;var g=grain.getContext('2d'),d=g.createImageData(128,128),seed=591;for(var i=0;i<d.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;var n=100+(seed>>>26);d.data[i]=d.data[i+1]=d.data[i+2]=n;d.data[i+3]=255;}g.putImageData(d,0,0);}c.fillStyle=c.createPattern(grain,'repeat');c.fillRect(x,y,w,h);}c.restore();}
  function skin(c,id,x,y,w,h,r,fill){if(!fill||w<25||h<20)return;c.save();GOArt.H.rr(c,x,y,w,h,r||0);c.clip();var paper=typeof fill==='string'&&/^#(fff|fbf|f3e|f6e|f5f)/i.test(fill);texture(c,id,paper?'paper':'metal',x,y,w,h,paper?.21:.16);c.restore();}
  function background(c,id,type,e){c.save();c.fillStyle=id===2?'#85bbae':'#c6b998';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);var k=id===2?'2-counter':'3-deskz',s=id===2?[15,110,175,290]:[50,40,880,440];if(type==='wood'){k='3-deskz';s=[60,40,840,420];}crop(c,k,s,[e.x0,e.y0,e.x1-e.x0,e.y1-e.y0]);c.fillStyle='rgba(15,15,13,.16)';c.fillRect(e.x0,e.y0,e.x1-e.x0,e.y1-e.y0);c.restore();return has(k);}
  // Regions contain only changing machinery, live clues, or difficulty-dependent props.
  // Everything outside them comes from the photographed set.
  function regions(id,v,X){var f=X.st.f,d=X.st.done,P=X.P,E=X.diff==='e',H=X.diff==='h',a=[];
    function add(x,y,w,h){a.push([x,y,w,h]);}function circle(x,y,r){a.push({c:[x,y,r]});}
    if(id===2){switch(v){
      case 'door':if(f['f:doorOpen']||X.doorT>0)add(365,312,285,800);if(f['f:regOpen'])add(687,610,250,60);break;
      case 'counter':if(E)add(575,639,140,30);if(!H)add(416,1146,210,90);break;
      case 'juke':break;
      case 'kitchen':break;
      case 'doorz':if(!H||f['f:chainOff'])add(30,405,740,365);if(f['f:keyTurned'])add(370,890,245,185);break;
      case 'gumz':if(f['f:gumball'])add(394,1044,212,142);break;
      case 'regz':add(325,294,350,180);if(f['f:regOpen'])add(145,993,710,244);break;
      case 'piez':if(!H)add(98,1033,805,255);if(f['f:pieCut'])add(280,555,600,290);if(f['f:pieOpen'])add(48,472,112,470);break;
      case 'counterz':if(E)add(253,1000,497,160);if(!H)add(425,490,180,94);break;
      case 'shakez':if(E||d.take_server)add(610,420,310,190);break;
      case 'gratez':if(d.use_sticky)add(518,869,91,91);break;
      case 'jukez':if(!H){add(100,160,800,470);add(100,740,800,230);}if(f['f:played'])add(335,1155,330,160);if(f['f:credit'])add(865,1009,31,31);break;
      case 'boothz':if(E||d.take_knife)add(531,681,359,109);if(!H||d.take_gum||f['f:gumLoose'])add(285,894,143,88);if(X.diff==='m')add(680,1090,95,51);break;
      case 'wheelz':if(!P.receipts.wheel)add(330,500,340,485);break;
      case 'fusez':if(f['f:fbOpen']||E)add(132,242,736,896);break;
    }}else{switch(v){
      case 'door':if(!H)add(733,636,180,207);if(E||d.take_crank)add(810,909,109,83);if(f['f:doorOpen']||X.doorT>0)add(350,275,310,840);break;
      case 'lens':if(f['f:lensLit'])add(427,428,148,148);if(f['f:chestOpen'])add(690,878,281,232);break;
      case 'desk':circle(185,395,82);circle(825,345,82);circle(825,530,46);add(433,615,194,22);if(d.take_lantern)add(422,285,156,257);break;
      case 'window':break;
      case 'doorz':if(!H||f['f:boltOff'])add(0,0,895,776);if(f['f:keyTurned'])add(360,870,270,195);break;
      case 'cabz':if(f['f:cabOpen'])add(35,175,840,1140);else if(!H)add(151,285,698,334);break;
      case 'ropez':if(d.take_crank)add(439,545,327,259);if(!H||d.take_clapper)add(168,998,265,158);if(!(P.pages&&P.pages.door))add(570,970,320,300);break;
      case 'lensz':circle(500,560,380);add(68,1090,258,270);add(377,1117,250,182);add(759,1093,164,193);break;
      case 'chestz':if(f['f:chestOpen'])add(76,285,850,982);else if(!H)add(205,493,590,378);break;
      case 'deskz':add(550,596,158,120);if(!H||d.take_wick)add(588,982,47,103);if(!H)add(60,870,244,211);if(!(P.pages&&P.pages.desk))add(700,895,240,237);break;
      case 'scopez':if(E||f['f:shutters'])add(0,0,1000,1000);else if(f['f:scope'])add(445,392,228,139);if(!(P.pages&&P.pages.window))add(72,970,300,261);break;
      case 'signalz':if(E||f['f:shutters'])add(0,0,1000,160);if(f['f:lever'])add(677,544,228,233);if(f['f:signalOK'])add(360,1150,284,185);break;
      case 'lockerz':if(!H)add(106,109,785,180);if(!H||d.take_lever)add(584,744,235,161);if(!(P.pages&&P.pages.locker))add(120,1001,330,251);break;
    }}return a;}
  function details(c,id,v,X){var H=GOArt.H,st=X.st;
    if(id===2&&v==='piez'&&X.diff==='h'){var p=X.R.puzzles.pie,n=p.shapes.length,tw=Math.min(150,680/n),x0=500-tw*n/2;for(var i=0;i<n;i++){var col=GORoom2.FLAVORS.filter(function(f){return f.id===p.set[st.pz.pie.s[i]];})[0];GOArt2.shape(c,p.shapes[i],x0+tw*(i+.5),1160,(tw-12)*.7,col.hex,'#7a4a26');}}
    if(id===2&&v==='jukez'){var p=X.R.puzzles.juke,on=X.diff==='e'||st.f['f:power'];for(var i=0;i<p.answer.length/2;i++)H.circ(c,500+(i-(p.answer.length/2-1)/2)*44,714,11,st.done.solve_juke||st.pz.juke.got.length>=(i+1)*2?'#7dff9a':on?'#ffe9a8':'#384245','#201b15',2);}
    if(id===3&&v==='signalz'&&X.R.puzzles.signal){var p=X.R.puzzles.signal;for(var i=0;i<p.answer.length;i++)H.circ(c,500+(i-(p.answer.length-1)/2)*56,854,13,st.done.solve_signal||st.pz.signal.got.length>i?'#7dff9a':'#27383a','#182020',2);}
  }
  var textProps=['font','textAlign','textBaseline','fillStyle','strokeStyle','lineWidth','globalAlpha','shadowColor','shadowBlur','shadowOffsetX','shadowOffsetY'];
  function render(c,id,v,X,original){var k=id+'-'+v;if(id===3&&v==='window'&&(X.diff==='e'||X.st.f['f:shutters'])&&has('3-window-open'))k='3-window-open';if(!has(k))return false;
    var cv=document.createElement('canvas');cv.width=1000;cv.height=1400;var g=cv.getContext('2d'),texts=[];
    ['fillText','strokeText'].forEach(function(method){var fn=g[method].bind(g);g[method]=function(){var q={method:method,args:Array.prototype.slice.call(arguments),matrix:g.getTransform(),props:{}};textProps.forEach(function(p){q.props[p]=g[p];});texts.push(q);return fn.apply(g,arguments);};});
    original(g,v,X);wall(c,k,X.ext);
    if(!(id===2&&v==='door'))texts.forEach(function(q){c.save();var m=q.matrix;c.transform(m.a,m.b,m.c,m.d,m.e,m.f);textProps.forEach(function(p){c[p]=q.props[p];});c[q.method].apply(c,q.args);c.restore();});
    regions(id,v,X).forEach(function(r){c.save();c.beginPath();if(r.c)c.arc(r.c[0],r.c[1],r.c[2],0,Math.PI*2);else c.rect(r[0],r[1],r[2],r[3]);c.clip();c.drawImage(cv,0,0);if(r.c){c.globalCompositeOperation='soft-light';c.globalAlpha=.32;crop(c,k,[0,0,1000,1400],[0,0,1000,1400]);}c.restore();});
    details(c,id,v,X);
    // Match live controls to the set's soft warm light, without changing clue colors.
    return true;
  }
  return {render:render,wall:wall,crop:crop,skin:skin,texture:texture,background:background,has:has,names:names};
})();
