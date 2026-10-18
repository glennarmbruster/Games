(function(root){'use strict';
var A={},g,cv,ctx,W=0,H=0,paused=false,muted=false,timer=0,last=0,held={};
function $(id){return document.getElementById(id)}
A.start=function(game){g=game;cv=$('board');ctx=game.context==='webgl'?null:cv.getContext('2d');A.ctx=ctx;A.held=held;A.data=A.read(game.key,game.defaults());g.init();
 $('help').onclick=function(){A.show('How to play',g.help,[['Play',function(){},'primary']]);};
 $('new').onclick=function(){A.show('New game?','<p>Restart this run or level?</p>',[['Restart',function(){g.restart();A.save();},'primary'],['Cancel',function(){}]]);};
 $('pause').onclick=function(){paused=!paused;$('pause').textContent=paused?'▶':'Ⅱ';if(paused)A.show('Paused','<p>Your game is paused.</p>',[['Resume',function(){paused=false;$('pause').textContent='Ⅱ';},'primary'],['How to play',function(){A.show('How to play',g.help,[['Resume',function(){paused=false;$('pause').textContent='Ⅱ';},'primary']]);}],['Exit',function(){location.href='../../index.html';},'secondary']]);};
 $('sound').onclick=function(){muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on';};
 ['left','right'].forEach(function(id){var b=$(id);if(!b)return;if(!game.steer)b.hidden=true;['pointerdown','pointerup','pointercancel','pointerleave'].forEach(function(ev){b.addEventListener(ev,function(e){e.preventDefault();held[id]=ev==='pointerdown';});});});
 cv.addEventListener('pointerdown',function(e){if(paused||A.dialogOpen())return;cv.setPointerCapture(e.pointerId);var p=point(e);if(g.down)g.down(p.x,p.y);});
 cv.addEventListener('pointermove',function(e){if(paused||A.dialogOpen()||!e.buttons)return;var p=point(e);if(g.drag)g.drag(p.x,p.y);});
 cv.addEventListener('pointerup',function(e){if(paused||A.dialogOpen())return;var p=point(e);if(g.up)g.up(p.x,p.y);});
 window.addEventListener('keydown',function(e){if(paused||A.dialogOpen())return;if(e.key==='ArrowLeft'||e.key==='a')held.left=true;if(e.key==='ArrowRight'||e.key==='d')held.right=true;if(e.key===' '){e.preventDefault();if(g.space)g.space();}});
 window.addEventListener('keyup',function(e){if(e.key==='ArrowLeft'||e.key==='a')held.left=false;if(e.key==='ArrowRight'||e.key==='d')held.right=false;});
 window.addEventListener('blur',function(){held.left=false;held.right=false;held.up=false;held.down=false;if(g.cancel)g.cancel();});cv.addEventListener('pointercancel',function(){if(g.cancel)g.cancel();});window.addEventListener('resize',resize);if(window.visualViewport)window.visualViewport.addEventListener('resize',resize);resize();
 // iOS can finish CSS layout after the window resize event. Follow the actual
 // canvas size so the backing pixels, draw dimensions and input agree.
 if(window.ResizeObserver){var canvasObserver=new ResizeObserver(function(){var r=cv.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);if(r.width&&r.height&&(r.width!==W||r.height!==H||(ctx&&(cv.width!==Math.round(r.width*d)||cv.height!==Math.round(r.height*d)))))resize();});canvasObserver.observe(cv);}
 requestAnimationFrame(frame);
};
function point(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function resize(){var r=cv.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);if(!r.width||!r.height)return;if(ctx){cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);}W=A.w=r.width;H=A.h=r.height;if(g.resize)g.resize(W,H);}
A.resize=resize;
function frame(t){if(!last)last=t;var dt=Math.min(.05,(t-last)/1000);last=t;if(!paused&&!A.dialogOpen()&&g.tick)g.tick(dt);if(g.draw&&W&&H){if(ctx)ctx.clearRect(0,0,W,H);g.draw(ctx,W,H);}requestAnimationFrame(frame);}
A.read=function(key,fallback){try{var v=JSON.parse(localStorage.getItem(key));if(v&&typeof v==='object')return v;}catch(e){}return fallback;};
A.save=function(){try{localStorage.setItem(g.key,JSON.stringify(A.data));}catch(e){}};
A.hud=function(primary,secondary){$('stat').innerHTML='<strong>'+primary+'</strong>'+secondary;};
A.toast=function(s){var el=$('toast');el.textContent=s;el.classList.add('show');clearTimeout(timer);timer=setTimeout(function(){el.classList.remove('show');},1900);};
A.show=function(title,body,buttons){held.left=false;held.right=false;if(g&&g.cancel)g.cancel();$('modalTitle').textContent=title;$('modalBody').innerHTML=body;var box=$('modalButtons');box.innerHTML='';buttons.forEach(function(a){var b=document.createElement('button');b.textContent=a[0];b.className=a[2]||'';b.onclick=function(){A.hide();a[1]();};box.appendChild(b);});$('overlay').hidden=false;};
A.hide=function(){$('overlay').hidden=true;};A.dialogOpen=function(){return !$('overlay').hidden;};
A.beep=function(freq,duration,type){if(muted)return;try{var AC=root.AudioContext||root.webkitAudioContext;if(!AC)return;var audio=A.audio||(A.audio=new AC()),o=audio.createOscillator(),v=audio.createGain();o.type=type||'sine';o.frequency.value=freq;v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch(e){}};
A.round=function(c,x,y,w,h,r,col){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();c.fillStyle=col;c.fill();};
A.label=function(c,s,x,y,size,color,align,weight){c.font=(weight||'800')+' '+size+'px system-ui';c.fillStyle=color||'#fff';c.textAlign=align||'center';c.textBaseline='middle';c.fillText(s,x,y);};root.Arcade=A;
})(window);
