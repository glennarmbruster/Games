(function () {
  'use strict';
  var scene=new Image();scene.src='workshop.webp';var $=function(id){return document.getElementById(id);},KEY='goobs.unscrew.v1',cv=$('board'),ctx=cv.getContext('2d'),overlay=$('overlay');
  var s,history=[],L={scale:1,ox:0,oy:0,w:0,h:0},falling=[],flying=[],glow=null,toastTimer=0;
  var palette=ScrewSort.colors;
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
  function load(){try{var v=JSON.parse(localStorage.getItem(KEY));if(v&&v.level>0&&v.stage>=0&&Array.isArray(v.plates)&&Array.isArray(v.trays)&&Array.isArray(v.reserve))return v;}catch(e){}return ScrewSort.make(1);}
  function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function modal(title,html,buttons){$('modalTitle').textContent=title;$('modalBody').innerHTML=html;var b=$('modalButtons');b.innerHTML='';buttons.forEach(function(a){var btn=document.createElement('button');btn.textContent=a[0];btn.className=a[2]||'';btn.onclick=function(){overlay.hidden=true;a[1]();};b.appendChild(btn);});overlay.hidden=false;}
  function toast(msg){var t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show');},1900);}
  function paintHUD(){
    $('level').textContent='Level '+s.level;$('progress').textContent='LAYER '+Math.min(s.stage+1,s.stageCount)+' OF '+s.stageCount+'  ·  '+s.moves+' SCREWS';
    s.trays.forEach(function(t,i){var box=$('tray'+i),name=t.count?'<b>COLOR '+(t.color+1)+'</b>':'OPEN TRAY';box.innerHTML='<div class="name">'+name+'</div><div class="holes"></div>';
      for(var j=0;j<3;j++){var h=document.createElement('i');h.className='hole'+(j<t.count?' filled':'');h.textContent=j<t.count?'✚':'';if(j<t.count)h.style.setProperty('--c',palette[t.color]);box.querySelector('.holes').appendChild(h);}});
    var reserve=$('reserve');reserve.innerHTML='<div class="name">HOLDING</div><div class="holes"></div><div class="meta"><b>'+s.reserve.length+'</b> / 5</div>';
    for(var n=0;n<5;n++){var hole=document.createElement('i');hole.className='hole'+(n<s.reserve.length?' filled':'');if(n<s.reserve.length){hole.style.setProperty('--c',palette[s.reserve[n]]);hole.textContent='+';}reserve.querySelector('.holes').appendChild(hole);}
    $('undo').disabled=!history.length;
  }
  function resize(){var r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);if(!r.width||!r.height)return;cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);var top=document.querySelector('.top').getBoundingClientRect(),hud=document.querySelector('.hud').getBoundingClientRect(),actions=document.querySelector('.actions').getBoundingClientRect(),wide=r.width>r.height,left=8,y=(wide?top.bottom:hud.bottom)-r.top+12,right=wide?r.right-hud.left+10:8,bottom=wide?8:r.bottom-actions.top+10,aw=Math.max(100,r.width-left-right),ah=Math.max(100,r.height-y-bottom),sc=Math.min(aw/600,ah/690);L={w:r.width,h:r.height,scale:sc,ox:left+(aw-600*sc)/2,oy:y+(ah-690*sc)/2};document.body.style.setProperty('--board-top',y+'px');draw();}
  function shape(kind,w,h){ctx.beginPath();
    if(kind===0){ctx.moveTo(-w*.46,-h*.35);ctx.bezierCurveTo(-w*.1,-h*.75,w*.4,-h*.5,w*.49,-h*.15);ctx.lineTo(w*.51,h*.12);ctx.bezierCurveTo(w*.31,h*.56,-w*.28,h*.57,-w*.47,h*.19);ctx.bezierCurveTo(-w*.55,0,-w*.54,-h*.15,-w*.46,-h*.35);}
    else if(kind===1){ctx.moveTo(-w*.51,-h*.08);ctx.bezierCurveTo(-w*.3,-h*.55,w*.12,-h*.59,w*.37,-h*.39);ctx.lineTo(w*.52,0);ctx.lineTo(w*.28,h*.4);ctx.bezierCurveTo(-w*.05,h*.61,-w*.36,h*.37,-w*.51,-h*.08);}
    else if(kind===2){ctx.moveTo(-w*.52,0);ctx.bezierCurveTo(-w*.27,-h*.63,w*.16,-h*.58,w*.51,-h*.03);ctx.bezierCurveTo(w*.17,h*.52,-w*.27,h*.62,-w*.52,0);}
    else{ctx.moveTo(-w*.48,-h*.37);ctx.bezierCurveTo(-w*.2,-h*.51,-w*.1,-h*.22,w*.08,-h*.41);ctx.bezierCurveTo(w*.36,-h*.55,w*.52,-h*.16,w*.5,h*.1);ctx.bezierCurveTo(w*.48,h*.53,w*.25,h*.48,w*.05,h*.36);ctx.bezierCurveTo(-w*.16,h*.51,-w*.42,h*.38,-w*.48,-h*.37);}
    ctx.closePath();
  }
  function screw(x,y,color,rad,alpha){ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;ctx.shadowColor='#061131c0';ctx.shadowBlur=10;ctx.shadowOffsetY=5;
    var metal=ctx.createRadialGradient(-rad*.35,-rad*.4,1,0,0,rad*1.15);metal.addColorStop(0,'#fff9d9');metal.addColorStop(.47,'#d4d9eb');metal.addColorStop(.8,'#69799d');metal.addColorStop(1,'#263660');ctx.beginPath();ctx.arc(0,0,rad*1.18,0,Math.PI*2);ctx.fillStyle=metal;ctx.fill();ctx.shadowColor='transparent';
    var enamel=ctx.createRadialGradient(-rad*.35,-rad*.38,1,0,0,rad);enamel.addColorStop(0,'#fff');enamel.addColorStop(.18,palette[color]);enamel.addColorStop(.72,palette[color]);enamel.addColorStop(1,'#33436b');ctx.beginPath();ctx.arc(0,0,rad,0,Math.PI*2);ctx.fillStyle=enamel;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#ffffffd9';ctx.stroke();ctx.beginPath();ctx.arc(0,0,rad*.82,Math.PI*1.03,Math.PI*1.81);ctx.lineWidth=1.4;ctx.strokeStyle='#ffffffa0';ctx.stroke();ctx.beginPath();ctx.arc(-rad*.35,-rad*.4,rad*.12,0,Math.PI*2);ctx.fillStyle='#ffffffd9';ctx.fill();
    ctx.lineWidth=Math.max(2.5,rad*.26);ctx.lineCap='round';ctx.strokeStyle='#192747a8';ctx.beginPath();ctx.moveTo(-rad*.43,0);ctx.lineTo(rad*.43,0);ctx.moveTo(0,-rad*.43);ctx.lineTo(0,rad*.43);ctx.stroke();ctx.restore();
  }
  function screwPos(p,i){var px=[-.34,0,.34][i]*330,py=[-10,12,-8][i],a=p.angle;return{x:p.x*600+px*Math.cos(a)-py*Math.sin(a),y:p.y*690+px*Math.sin(a)+py*Math.cos(a)};}
  function plate(p,dy,rot,alpha){ctx.save();ctx.translate(p.x*600,p.y*690+dy);ctx.rotate(p.angle+rot);ctx.globalAlpha=alpha;
    var w=330,h=150;ctx.shadowColor='#08122dd9';ctx.shadowBlur=20;ctx.shadowOffsetY=15;ctx.save();ctx.translate(0,7);shape(p.shape,w,h);ctx.fillStyle='#152743';ctx.fill();ctx.lineWidth=6;ctx.strokeStyle='#8ca8c6';ctx.stroke();ctx.restore();ctx.shadowColor='transparent';
    var g=ctx.createLinearGradient(-w*.5,-h*.5,w*.5,h*.5);g.addColorStop(0,'#fff');g.addColorStop(.08,palette[p.plateColor]);g.addColorStop(.62,palette[p.plateColor]);g.addColorStop(.87,palette[p.plateColor]);g.addColorStop(1,'#213a65');shape(p.shape,w,h);ctx.globalAlpha=alpha*.92;ctx.fillStyle=g;ctx.fill();ctx.globalAlpha=alpha;ctx.lineWidth=5;ctx.strokeStyle='#dceeff';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#22385c';ctx.stroke();
    ctx.save();shape(p.shape,w*.88,h*.75);ctx.clip();var gloss=ctx.createLinearGradient(0,-h*.5,0,h*.3);gloss.addColorStop(0,'#ffffff87');gloss.addColorStop(.52,'#ffffff15');gloss.addColorStop(1,'#ffffff00');ctx.fillStyle=gloss;ctx.fillRect(-w/2,-h/2,w,h);ctx.rotate(-.28);var glint=ctx.createLinearGradient(-w*.6,0,w*.6,0);glint.addColorStop(0,'#ffffff00');glint.addColorStop(.42,'#ffffff00');glint.addColorStop(.46,'#ffffff55');glint.addColorStop(.57,'#ffffff11');glint.addColorStop(.61,'#ffffff00');ctx.fillStyle=glint;ctx.fillRect(-w,-h,w*2,h*2);ctx.restore();ctx.restore();
    p.screws.forEach(function(sc,i){var pos=screwPos(p,i);pos.y+=dy;
      if(rot){var dx=pos.x-p.x*600,yy=pos.y-(p.y*690+dy);pos.x=p.x*600+dx*Math.cos(rot)-yy*Math.sin(rot);pos.y=p.y*690+dy+dx*Math.sin(rot)+yy*Math.cos(rot);}
      if(!sc.removed)screw(pos.x,pos.y,sc.color,17,alpha);
      else{ctx.beginPath();ctx.arc(pos.x,pos.y,13,0,Math.PI*2);ctx.fillStyle='rgba(9,20,48,'+(alpha*.7)+')';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='rgba(244,246,255,'+(alpha*.7)+')';ctx.stroke();}
    });
  }
  function draw(){var w=L.w,h=L.h;if(!w)return;var bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#314d8d');bg.addColorStop(.5,'#21366f');bg.addColorStop(1,'#0b2155');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);if(scene.complete&&scene.naturalWidth)ctx.drawImage(scene,0,0,scene.naturalWidth,scene.naturalHeight,0,0,w,h);ctx.save();ctx.translate(L.ox,L.oy);ctx.scale(L.scale,L.scale);
    var panel=ctx.createLinearGradient(0,0,600,690);panel.addColorStop(0,'#28407699');panel.addColorStop(.5,'#21396b77');panel.addColorStop(1,'#102653aa');rr(8,8,584,674,29);ctx.fillStyle=panel;ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#d7b877';ctx.stroke();rr(20,20,560,650,22);ctx.lineWidth=2;ctx.strokeStyle='#ffffff50';ctx.stroke();
    ctx.strokeStyle='#ffffff12';ctx.lineWidth=1;for(var yy=48;yy<675;yy+=29){ctx.beginPath();ctx.moveTo(24,yy);ctx.lineTo(576,yy);ctx.stroke();}
    for(var k=0;k<10;k++){var xx=48+(k%5)*126,by=k<5?62:635;ctx.beginPath();ctx.arc(xx,by,5,0,Math.PI*2);ctx.fillStyle='#0f265b';ctx.fill();ctx.strokeStyle='#b8a677';ctx.lineWidth=2;ctx.stroke();}
    s.plates.forEach(function(p){if(!p.gone)plate(p,0,0,1);});
    var now=performance.now();falling=falling.filter(function(f){return now-f.time<520;});falling.forEach(function(f){var t=(now-f.time)/520;plate(f.plate,t*t*220,t*.42,1-t);});
    flying=flying.filter(function(f){return now-f.time<450;});flying.forEach(function(f){var t=(now-f.time)/450;screw(f.x+(300-f.x)*t,f.y-200*t,f.color,17*(1-t*.5),1-t);});
    if(glow){var target=s.plates.find(function(p){return p.id===glow.plate;});if(target&&!target.gone){var pos=screwPos(target,glow.index);ctx.beginPath();ctx.arc(pos.x,pos.y,28+4*Math.sin(now/110),0,Math.PI*2);ctx.strokeStyle='#ffe786';ctx.lineWidth=5;ctx.shadowColor='#ffe786';ctx.shadowBlur=15;ctx.stroke();ctx.shadowColor='transparent';}}
    ctx.restore();if(falling.length||flying.length||glow)requestAnimationFrame(draw);
  }
  function play(e){if(!overlay.hidden)return;var r=cv.getBoundingClientRect(),x=(e.clientX-r.left-L.ox)/L.scale,y=(e.clientY-r.top-L.oy)/L.scale;
    for(var p=s.plates.length-1;p>=0;p--){var plateObj=s.plates[p];if(plateObj.gone)continue;for(var i=2;i>=0;i--){var item=plateObj.screws[i];if(item.removed)continue;var pos=screwPos(plateObj,i);if(Math.hypot(pos.x-x,pos.y-y)>31)continue;
      var prev=clone(s),fallPlate=clone(plateObj),result=ScrewSort.remove(s,plateObj.id,i);if(result==='full'){toast('Holding space is full. Match a tray or use Undo.');return;}
      history.push(prev);if(history.length>40)history.shift();flying.push({x:pos.x,y:pos.y,color:item.color,time:performance.now()});
      if(plateObj.gone){fallPlate.screws[i].removed=true;falling.push({plate:fallPlate,time:performance.now()});}glow=null;save();paintHUD();draw();
      if(result==='stage')toast('Layer cleared!');if(result==='win')setTimeout(win,550);return;
    }}
  }
  function win(){if(!s.win)return;modal('Level '+s.level+' cleared!','<p>All plates are free and every screw is sorted. The next design is ready.</p>',[['Next level',function(){s=ScrewSort.make(s.level+1);history=[];falling=[];flying=[];save();paintHUD();draw();},'primary'],['Stay here',function(){}]]);}
  function how(){modal('How to play','<ul><li>Tap a colored screw to remove it. A plate slides away when all its screws are gone.</li><li>The two trays hold three screws each. Three matching colors clear a tray.</li><li>Other colors wait in the five holding holes. Plan the order so space stays open.</li><li>Clear every layer. Undo and Hint are always available.</li></ul>',[['Play',function(){},'primary']]);}
  $('menu').onclick=function(){modal('Unscrew It','<p><b>Level '+s.level+'</b> · layer '+Math.min(s.stage+1,s.stageCount)+' of '+s.stageCount+'</p><p>Remove screws, sort colors in groups of three, and free every plate.</p>',[['Resume',function(){},'primary'],['How to play',how],['Restart level',function(){s=ScrewSort.make(s.level);history=[];falling=[];flying=[];save();paintHUD();draw();}],['Modes',function(){location.href='index.html';},'leave'],['Exit',function(){location.href='../../index.html';},'leave']]);};
  $('help').onclick=how;$('reset').onclick=function(){modal('Restart level?','<p>This level will begin with fresh screws.</p>',[['Restart',function(){s=ScrewSort.make(s.level);history=[];falling=[];flying=[];save();paintHUD();draw();},'primary'],['Cancel',function(){}]]);};
  $('undo').onclick=function(){if(!history.length)return;s=history.pop();falling=[];flying=[];glow=null;save();paintHUD();draw();};
  $('hint').onclick=function(){var h=ScrewSort.hint(s);if(!h){toast('No screws left.');return;}glow=h;draw();toast('Try the glowing screw.');setTimeout(function(){glow=null;draw();},2100);};
  scene.onload=draw;
  cv.addEventListener('pointerup',play);window.addEventListener('resize',resize);s=load();paintHUD();requestAnimationFrame(resize);
  if(s.win)setTimeout(win,100);
})();
