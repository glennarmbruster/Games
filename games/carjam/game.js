(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'goobs.carjam.v1', canvas = $('board'), ctx = canvas.getContext('2d');
  var scene=new Image();scene.src='lot.webp';var state, history = [], layout = { x: 0, y: 0, cell: 40 }, moving = [], glowing = 0, toastTimer = 0, raf = 0, modal = $('overlay');
  var colors = Jam.colors;
  function copy(v) { return JSON.parse(JSON.stringify(v)); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.size === 8 && Array.isArray(s.cars) && Array.isArray(s.queue) && Array.isArray(s.bay) && s.level > 0 && s.total > 0) return s;
    } catch (e) {} return Jam.make(1);
  }
  function rr(x,y,w,h,r) { r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath(); }
  function modalShow(title, body, buttons) {
    $('modalTitle').textContent = title; $('modalBody').innerHTML = body;
    var box = $('modalButtons'); box.innerHTML = '';
    buttons.forEach(function (item) { var b=document.createElement('button');b.textContent=item[0];b.className=item[2]||'';b.onclick=function(){modal.hidden=true;item[1]();};box.appendChild(b); });
    modal.hidden = false;
  }
  function toast(text) { var t=$('toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show');},1900); }
  function paintHUD() {
    $('level').textContent='Level '+state.level;
    $('count').textContent=state.delivered+' / '+state.total+' cleared';
    $('progress').style.width=(100*state.delivered/state.total)+'%';
    $('bayCount').textContent=(4-state.bay.length)+' free bay'+(state.bay.length===3?'':'s');
    var q=$('queue');q.innerHTML='';state.queue.slice(0,14).forEach(function(color,i){var s=document.createElement('i');s.className='token';s.style.setProperty('--c',colors[color]);s.setAttribute('aria-label',i?'waiting color':'next color');q.appendChild(s);});
    if(state.queue.length>14){var m=document.createElement('span');m.className='more';m.textContent='+'+(state.queue.length-14);q.appendChild(m);}
    var bays=$('bays');bays.innerHTML='';for(var i=0;i<4;i++){var b=document.createElement('div');b.className='bay'+(state.bay[i]?' filled':'');b.textContent=state.bay[i]?'WAIT':'OPEN';if(state.bay[i])b.style.setProperty('--c',colors[state.bay[i].color]);bays.appendChild(b);}
    $('undo').disabled=!history.length;
  }
  function resize() {
    var rect=canvas.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1);
    if (!rect.width||!rect.height)return;
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    var c=Math.min((rect.width-24)/8,(rect.height-24)/8);layout={x:(rect.width-c*8)/2,y:(rect.height-c*8)/2,cell:c,w:rect.width,h:rect.height};draw();
  }
  function drawCar(car,px,py,alpha) {
    var c=layout.cell,body=colors[car.color];ctx.save();ctx.globalAlpha=alpha==null?1:alpha;
    ctx.translate(px,py);ctx.rotate(car.dir*Math.PI/2);
    ctx.shadowColor='#000a';ctx.shadowBlur=c*.16;ctx.shadowOffsetY=c*.13;
    rr(-c*.33,-c*.44,c*.66,c*.88,c*.15);ctx.fillStyle='#0a1d30';ctx.fill();ctx.shadowColor='transparent';
    var coat=ctx.createLinearGradient(-c*.35,-c*.4,c*.35,c*.4);coat.addColorStop(0,'#ffffff');coat.addColorStop(.13,body);coat.addColorStop(.66,body);coat.addColorStop(1,'#243c5c');
    rr(-c*.32,-c*.42,c*.64,c*.84,c*.15);ctx.fillStyle=coat;ctx.fill();ctx.lineWidth=Math.max(1,c*.022);ctx.strokeStyle='#ffffffa0';ctx.stroke();
    rr(-c*.24,-c*.18,c*.48,c*.38,c*.1);ctx.fillStyle='#183c58';ctx.fill();
    rr(-c*.20,-c*.15,c*.40,c*.15,c*.035);ctx.fillStyle='#86d8f4';ctx.fill();
    rr(-c*.20,c*.07,c*.40,c*.09,c*.03);ctx.fillStyle='#5b99ad';ctx.fill();
    ctx.fillStyle='#fff4d0';ctx.fillRect(-c*.27,-c*.39,c*.13,c*.055);ctx.fillRect(c*.14,-c*.39,c*.13,c*.055);
    ctx.fillStyle='#ff715f';ctx.fillRect(-c*.25,c*.36,c*.11,c*.045);ctx.fillRect(c*.14,c*.36,c*.11,c*.045);
    ctx.fillStyle='#123047';ctx.fillRect(-c*.37,-c*.27,c*.05,c*.16);ctx.fillRect(c*.32,-c*.27,c*.05,c*.16);ctx.fillRect(-c*.37,c*.19,c*.05,c*.16);ctx.fillRect(c*.32,c*.19,c*.05,c*.16);
    ctx.beginPath();ctx.moveTo(0,-c*.35);ctx.lineTo(-c*.085,-c*.26);ctx.lineTo(-c*.035,-c*.26);ctx.lineTo(-c*.035,-c*.17);ctx.lineTo(c*.035,-c*.17);ctx.lineTo(c*.035,-c*.26);ctx.lineTo(c*.085,-c*.26);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.restore();
  }
  function draw() {
    var L=layout,w=L.w,h=L.h;if(!w)return;
    var bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#3b6277');bg.addColorStop(.3,'#263e57');bg.addColorStop(1,'#13263d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);if(scene.complete&&scene.naturalWidth)ctx.drawImage(scene,0,0,scene.naturalWidth,scene.naturalHeight,0,0,w,h);
    var c=L.cell,x=L.x,y=L.y,side=c*8;
    ctx.shadowColor='#020c1e';ctx.shadowBlur=24;ctx.shadowOffsetY=11;rr(x-8,y-8,side+16,side+16,14);ctx.fillStyle='#0c2238';ctx.fill();ctx.shadowColor='transparent';
    ctx.fillStyle='#162b3acc';ctx.fillRect(x,y,side,side);
    // Painted bays and asphalt grain provide depth without hiding the cars.
    for(var row=0;row<8;row++)for(var col=0;col<8;col++){
      var px=x+col*c,py=y+row*c;
      ctx.fillStyle=(row+col)%2?'#ffffff08':'#0000000b';ctx.fillRect(px,py,c,c);
      ctx.strokeStyle='#b6d1d735';ctx.lineWidth=Math.max(1,c*.017);ctx.setLineDash([c*.20,c*.12]);ctx.strokeRect(px+c*.08,py+c*.08,c*.84,c*.84);ctx.setLineDash([]);
    }
    ctx.strokeStyle='#f8c96e';ctx.lineWidth=5;ctx.strokeRect(x-2,y-2,side+4,side+4);
    ctx.fillStyle='#f7d06c';ctx.font='800 '+Math.max(10,c*.18)+'px system-ui';ctx.textAlign='center';
    ctx.fillText('EXIT',x+side/2,y-12);
    state.cars.forEach(function(car){
      var px=x+(car.x+.5)*c,py=y+(car.y+.5)*c;
      if(car.id===glowing){ctx.beginPath();ctx.arc(px,py,c*.49,0,Math.PI*2);ctx.strokeStyle='#ffe677';ctx.lineWidth=4;ctx.shadowColor='#ffe677';ctx.shadowBlur=12;ctx.stroke();ctx.shadowColor='transparent';}
      drawCar(car,px,py,Jam.free(car,state.cars,8)?1:.72);
    });
    var now=performance.now();moving=moving.filter(function(anim){return now-anim.time<430;});
    moving.forEach(function(anim){var t=Math.min(1,(now-anim.time)/430),ease=t*t*(3-2*t),d=[[0,-1],[1,0],[0,1],[-1,0]][anim.car.dir];
      drawCar(anim.car,x+(anim.car.x+.5+d[0]*8*ease)*c,y+(anim.car.y+.5+d[1]*8*ease)*c,1-t);});
    if(moving.length)raf=requestAnimationFrame(draw);
  }
  function selectAt(e) {
    if(!modal.hidden||moving.length)return;
    var r=canvas.getBoundingClientRect(),c=layout.cell,x=Math.floor((e.clientX-r.left-layout.x)/c),y=Math.floor((e.clientY-r.top-layout.y)/c);
    var car=state.cars.find(function(v){return v.x===x&&v.y===y;});if(!car)return;
    if(!Jam.free(car,state.cars,8)){toast('Another car blocks that direction.');return;}
    if(state.bay.length===4&&car.color!==state.queue[0]){toast('All four waiting bays are full.');return;}
    history.push(copy(state));if(history.length>30)history.shift();
    Jam.move(state,car.id);moving.push({car:car,time:performance.now()});glowing=0;save();paintHUD();draw();
    if(state.queue.length===0&&state.cars.length===0&&state.bay.length===0)setTimeout(win,490);
  }
  function win(){if(state.queue.length||state.cars.length||state.bay.length)return;modalShow('Lot cleared!', '<p>Every car found its way out. Ready for a tighter jam?</p>', [['Next level',function(){state=Jam.make(state.level+1);history=[];save();paintHUD();draw();},'primary'],['Stay here',function(){}]]);}
  function showMenu(){modalShow('Car Jam','<p><b>Level '+state.level+'</b> · '+state.delivered+' of '+state.total+' cars cleared</p><p>Choose an open car. Its arrow shows the direction it can leave. Match the next rider color or park it in a waiting bay.</p>',[['Resume',function(){} ,'primary'],['How to play',how],['Restart this lot',function(){state=Jam.make(state.level);history=[];moving=[];save();paintHUD();draw();}],['Exit',function(){location.href='../../index.html';},'leave']]);}
  function how(){modalShow('How to play','<ul><li>Tap a car whose arrow has a clear route to the edge.</li><li>The first color in the top line leaves immediately. Other cars wait in the four bays.</li><li>Waiting cars leave automatically when their color reaches the front.</li><li>Clear the entire lot to unlock the next level. Use Undo or Hint if you get stuck.</li></ul>',[['Play',function(){} ,'primary']]);}
  $('menu').onclick=showMenu;$('help').onclick=how;
  $('new').onclick=function(){modalShow('Restart this lot?','<p>Your progress on this level will reset.</p>',[['Restart',function(){state=Jam.make(state.level);history=[];moving=[];save();paintHUD();draw();},'primary'],['Cancel',function(){}]]);};
  $('undo').onclick=function(){if(!history.length)return;state=history.pop();moving=[];glowing=0;save();paintHUD();draw();};
  $('hint').onclick=function(){var car=Jam.hint(state);if(!car){toast('Use Undo or restart to free a route.');return;}glowing=car.id;draw();toast('Try the glowing car.');setTimeout(function(){glowing=0;draw();},2100);};
  canvas.addEventListener('pointerup',selectAt);window.addEventListener('resize',resize);
  scene.onload=draw;
  state=load();paintHUD();requestAnimationFrame(resize);
  if (!state.queue.length && !state.cars.length && !state.bay.length) setTimeout(win,100);
})();
