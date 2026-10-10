(function(){'use strict';
const BUILD='1.2.0',R=TimberRules,$=id=>document.getElementById(id),svg=$('board'),KEY='goobs.timberTumble.save.v1';
if(R.build!==BUILD)return;
let level,state,history=[],moves=0,unlocked=1,best={},sound=false,selected=-1,hintPair=null,busy=false,anim=null,drag=null,worker=null,workerTimer=null,request=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const colors={oak:['#ead09a','#b2793c','#805128'],cedar:['#e8a16d','#af5334','#71311e'],teal:['#a0c5ad','#427b67','#244c42'],walnut:['#bf946d','#7c5035','#4b3026'],honey:['#f5d590','#c79743','#836025'],red:['#dda493','#a84f48','#602e2a']};
let grain='';for(let i=0;i<32;i++){let y=i*3.9;grain+=`<path d="M-30 ${y} C60 ${y-12} 160 ${y+13} 245 ${y-2} S370 ${y-10} 440 ${y+4}" stroke="${i%3?'#4b270d':'#fff0b9'}" stroke-width="${i%4===0?1.1:.55}" opacity="${i%3?.17:.26}" fill="none"/>`;}
const defs=`<defs>
<linearGradient id="frame" x2="1" y2="1"><stop stop-color="#ad7442"/><stop offset=".3" stop-color="#805132"/><stop offset=".7" stop-color="#583824"/><stop offset="1" stop-color="#ad7a49"/></linearGradient>
<linearGradient id="boardWood" x2=".8" y2="1"><stop stop-color="#d7b581"/><stop offset=".48" stop-color="#c39d6c"/><stop offset="1" stop-color="#a78053"/></linearGradient>
<radialGradient id="boardLight" cx=".3" cy=".05" r="1"><stop stop-color="#fff4c1" stop-opacity=".18"/><stop offset="1" stop-color="#211308" stop-opacity=".2"/></radialGradient>
<pattern id="grain" width="400" height="125" patternUnits="userSpaceOnUse">${grain}</pattern>
<linearGradient id="steel" x1="0" y1="0" x2=".1" y2="1"><stop stop-color="#45535b"/><stop offset=".16" stop-color="#d7e3e5"/><stop offset=".25" stop-color="#8faaa9"/><stop offset=".46" stop-color="#f6f8eb"/><stop offset=".52" stop-color="#99b0b3"/><stop offset=".8" stop-color="#b6c9c7"/><stop offset="1" stop-color="#495d62"/></linearGradient>
<pattern id="brush" width="95" height="4" patternUnits="userSpaceOnUse"><path d="M0 .5H95M20 2.5H82" stroke="#fff" opacity=".15" stroke-width=".6"/></pattern>
<radialGradient id="brass" cx=".3" cy=".25" r=".8"><stop stop-color="#fff4ca"/><stop offset=".23" stop-color="#f0d493"/><stop offset=".58" stop-color="#b18743"/><stop offset=".72" stop-color="#e7c174"/><stop offset=".92" stop-color="#865e2f"/><stop offset="1" stop-color="#513822"/></radialGradient>
<radialGradient id="socket"><stop stop-color="#201e19"/><stop offset=".68" stop-color="#30291e"/><stop offset=".85" stop-color="#53422c"/><stop offset="1" stop-color="#d8b680"/></radialGradient>
<filter id="shadow" x="-20%" y="-60%" width="150%" height="240%"><feDropShadow dx="2" dy="5" stdDeviation="3" flood-color="#251408" flood-opacity=".48"/></filter>
${Object.entries(colors).map(([n,c])=>`<linearGradient id="${n}" x2="0" y2="1"><stop stop-color="${c[0]}"/><stop offset=".13" stop-color="${c[1]}"/><stop offset=".65" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>`).join('')}
<clipPath id="boardClip"><rect x="14" y="14" width="572" height="681" rx="24"/></clipPath>
</defs>`;
function screw(x,y,sel=false,rotation=0){return `<g transform="translate(${x} ${y}) rotate(${rotation})" pointer-events="none">${sel?'<circle r="25" fill="#f7d97b33" stroke="#fff2b2" stroke-width="3"/>':''}<ellipse cy="5" rx="17" ry="16" fill="#29150966"/><circle r="17" fill="url(#brass)" stroke="#624c2e" stroke-width="1.2"/><circle r="13" fill="none" stroke="#fff3c7" opacity=".5"/><path d="M-9 -2H-2V-9H2V-2H9V2H2V9H-2V2H-9Z" fill="#655038" stroke="#f5d599" stroke-width=".65"/><path d="M-11 -8Q-5 -14 4 -12" fill="none" stroke="#fff6d8" stroke-width="1.6" opacity=".8"/></g>`;}
function pose(st,i){const g=R.geometry(level,st,i);return{x:g.x1,y:g.y1,angle:Math.atan2(g.y2-g.y1,g.x2-g.x1)*180/Math.PI,len:g.len};}
function plank(i,t){const p=level.planks[i],b=state.bars[i],prior=anim&&anim.old.bars[i];if(!b.mode&&!(prior&&prior.mode))return '';
 let q=pose(state,i),opacity=1;
 if(anim&&prior&&prior.mode){
  const phase=anim.swinging?.18:.32;
  const u=Math.max(0,Math.min(1,(t-phase)/(1-phase)));let old=pose(anim.old,i);
  if(b.mode===1){
   if(prior.mode===2&&b.pivot===p.b){old={...old,x:level.holes[p.b].x,y:level.holes[p.b].y,angle:old.angle+180};}
   let delta=q.angle-old.angle;while(delta>180)delta-=360;while(delta< -180)delta+=360;
   // Accelerate under gravity, then swing back through the hanging position.
   // Collision-limited planks rebound on their own side of the supporting peg.
   let ease;
   if(b.stop>=0){ease=1-Math.abs(Math.cos(2.5*Math.PI*u))*Math.pow(1-u,3);}
   else{
    ease=1-Math.exp(-3.5*u)*Math.cos(3*Math.PI*u)*(1-u);
    if(ease>1){
     const base=R.geometry(level,state,i),cap=R.capsule(base,p.width),radius=p.width/2+R.PEG_RADIUS;
     const obstacles=level.holes.filter((h,j)=>state.pins[j]&&j!==b.pivot&&R.distance(h.x,h.y,cap)>=radius-.001);
     // Sweep the overshoot, rather than testing only its endpoint.
     const desired=delta*(ease-1);let safe=0;
     for(let step=1;step<=Math.ceil(Math.abs(desired));step++){
      const extra=Math.sign(desired)*Math.min(step,Math.abs(desired)),a=(q.angle+extra)*Math.PI/180;
      const g={x1:q.x,y1:q.y,x2:q.x+q.len*Math.cos(a),y2:q.y+q.len*Math.sin(a),len:q.len};
      if(obstacles.some(h=>R.distance(h.x,h.y,R.capsule(g,p.width))<radius))break;
      safe=extra;
     }
     ease=1+(delta?safe/delta:0);
    }
   }
   q={...q,angle:old.angle+delta*ease};
  }else{
   if(b.trace&&b.trace.length>1){
    const poses=[old,...b.trace.map(g=>({x:g.x1,y:g.y1,angle:Math.atan2(g.y2-g.y1,g.x2-g.x1)*180/Math.PI,len:g.len}))];
    const lengths=[0];for(let k=1;k<poses.length;k++){let da=poses[k].angle-poses[k-1].angle;while(da>180)da-=360;while(da< -180)da+=360;poses[k].angle=poses[k-1].angle+da;lengths.push(lengths[k-1]+Math.min(160,Math.hypot(poses[k].x-poses[k-1].x,poses[k].y-poses[k-1].y)+Math.abs(da)*Math.PI/180*q.len*.5));}
    const at=u*lengths[lengths.length-1];let k=1;while(k<lengths.length-1&&lengths[k]<at)k++;const f=(at-lengths[k-1])/Math.max(.0001,lengths[k]-lengths[k-1]),a=poses[k-1],z=poses[k];q={...q,x:a.x+(z.x-a.x)*f,y:a.y+(z.y-a.y)*f,angle:a.angle+(z.angle-a.angle)*f};
   }else{const ease=u*u;q={...old,x:old.x+(q.x-old.x)*ease,y:old.y+(q.y-old.y)*ease};}
   if(!b.mode)opacity=1-Math.max(0,(u-.65)/.35);
  }
 }

 const w=p.width,L=q.len,fill=p.finish,mask=`m${i}`;
 return `<g data-plank="${i}" data-stop="${b.stop??-1}" opacity="${opacity}" transform="translate(${q.x} ${q.y}) rotate(${q.angle})" pointer-events="none"><defs><mask id="${mask}" maskUnits="userSpaceOnUse" x="-30" y="-40" width="${L+65}" height="90"><rect x="-25" y="-${w/2}" width="${L+50}" height="${w}" rx="${w/2}" fill="white"/><circle r="11.5" fill="black"/><circle cx="${L}" r="11.5" fill="black"/></mask></defs><g filter="url(#shadow)"><rect x="-25" y="-${w/2}" width="${L+50}" height="${w}" rx="${w/2}" fill="url(#${fill})" stroke="${fill==='steel'?'#56696b':colors[fill][2]}" stroke-width="2" mask="url(#${mask})"/></g><g mask="url(#${mask})"><rect x="-25" y="-${w/2}" width="${L+50}" height="${w}" fill="url(#${fill==='steel'?'brush':'grain'})"/><path d="M-11 ${-w/2+3}H${L+10}" stroke="#fff4c0" opacity=".4" stroke-width="1.5"/><path d="M-11 ${w/2-3}H${L+10}" stroke="#3d291a" opacity=".35" stroke-width="2"/>${fill!=='steel'?`<ellipse cx="${L*.53}" cy="4" rx="17" ry="3.1" fill="none" stroke="#4a2d21" opacity=".19"/><ellipse cx="${L*.53}" cy="4" rx="7" ry="1.6" fill="#4a2d2122"/>`:''}</g><circle r="12" fill="none" stroke="#533c24" opacity=".65" stroke-width="1.5"/><circle cx="${L}" r="12" fill="none" stroke="#533c24" opacity=".65" stroke-width="1.5"/></g>`;
}
function render(t=1){
 let out=defs+`<rect x="5" y="11" width="590" height="692" rx="29" fill="#211a15"/><rect x="6" y="4" width="588" height="692" rx="27" fill="url(#frame)" stroke="#d9b17a" stroke-width="1.5"/><rect x="18" y="17" width="564" height="664" rx="18" fill="url(#boardWood)" stroke="#4e3422" stroke-width="3"/><rect x="19" y="18" width="562" height="661" rx="18" fill="url(#grain)"/><rect x="19" y="18" width="562" height="661" rx="18" fill="url(#boardLight)"/><path d="M30 679H566" stroke="#e9c994" opacity=".5"/><text x="300" y="54" text-anchor="middle" font-size="12" letter-spacing="4" fill="#62492f" font-family="Georgia,serif">TIMBER TUMBLE · ${String(level.level).padStart(2,'0')}</text>`;
 for(const [x,y]of [[31,32],[569,32],[31,665],[569,665]])out+=`<circle cx="${x}" cy="${y}" r="4" fill="#74553b"/><path d="M${x-2} ${y}h4" stroke="#d2b17c"/>`;
 for(let i=0;i<level.holes.length;i++){const h=level.holes[i];out+=`<circle cx="${h.x}" cy="${h.y}" r="14" fill="url(#socket)" stroke="#694d2f" stroke-width="1"/>`;}
 out+='<g clip-path="url(#boardClip)">';for(let i=0;i<level.planks.length;i++)out+=plank(i,t);out+='</g>';
 for(let i=0;i<level.holes.length;i++){
  const h=level.holes[i],open=R.accessible(level,state,i),pin=state.pins[i];if(!open)continue;
  if(!pin)out+=`<circle cx="${h.x}" cy="${h.y}" r="${selected>=0?21:15}" fill="none" stroke="${selected>=0?'#ffeba1':'#e3c081'}" stroke-width="${selected>=0?3:1.5}" opacity="${selected>=0?1:.7}"/>`;
  if(pin&&!(anim&&anim.to===i)&&!(drag&&drag.active&&drag.from===i))out+=screw(h.x,h.y,i===selected);
  if(hintPair&&(hintPair[0]===i||hintPair[1]===i))out+=`<circle cx="${h.x}" cy="${h.y}" r="27" fill="none" stroke="#f9ffca" stroke-width="3" stroke-dasharray="5 4"/><text x="${h.x+23}" y="${h.y-21}" font-size="19" font-weight="bold" fill="#153e31" stroke="#fff1be" stroke-width=".5">${hintPair[0]===i?'1':'2'}</text>`;
  out+=`<g class="hole-target" role="button" tabindex="${busy?-1:0}" aria-label="${pin?'Screw':'Empty hole'} ${i+1}" data-hole="${i}"><circle class="focus-ring" cx="${h.x}" cy="${h.y}" r="26" fill="none" stroke="#fff4b8" stroke-width="3"/><circle cx="${h.x}" cy="${h.y}" r="29" fill="transparent"/></g>`;
 }
 if(anim){const a=level.holes[anim.from],b=level.holes[anim.to],u=Math.min(1,t/(anim.swinging?.18:.32)),ease=u*u*(3-2*u);out+=screw(a.x+(b.x-a.x)*ease,a.y+(b.y-a.y)*ease-Math.sin(u*Math.PI)*40,true,720*u);}
 if(drag&&drag.active)out+=screw(drag.x,drag.y-16,true,20);
 svg.innerHTML=out;
 $('levelButton').textContent='Level '+level.level;$('difficulty').textContent=level.level<=4?'Apprentice':level.level<12?'Craftsman':level.level<24?'Artisan':'Masterwork';$('remaining').textContent=state.bars.filter(b=>b.mode).length+' planks';$('moves').textContent=moves+' moves';$('undo').disabled=busy||!history.length;$('hint').disabled=busy||R.won(state);$('restart').disabled=busy;$('menu').disabled=busy;$('levelButton').disabled=busy;$('help').disabled=busy;
}
function say(s){$('message').textContent=s;}
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:2,level,state,history,moves,unlocked,best,sound}));}catch(e){say('Progress could not be saved on this device.');}}
function ping(f=340){if(!sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=ping.ctx||(ping.ctx=new C());c.resume();const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,c.currentTime);o.frequency.exponentialRampToValueAtTime(f*.55,c.currentTime+.15);g.gain.setValueAtTime(.065,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.2);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.22);}catch(e){}}
function dialog(html){$('dialogContent').innerHTML=html;if(!$('dialog').open)GoobsDialog.open($('dialog'));}
function close(){GoobsDialog.close($('dialog'));}
function reset(l){request++;clearTimeout(workerTimer);if(worker){worker.terminate();worker=null;}level=JSON.parse(JSON.stringify(l));state=R.initial(level);history=[];moves=0;selected=-1;hintPair=null;busy=false;anim=null;drag=null;render();save();say(level.level<=4?'Tap a brass screw, then an exposed empty hole.':'Plan ahead: swinging planks can cover your next hole.');}
function askWorker(data,callback){
 if(worker)worker.terminate();clearTimeout(workerTimer);worker=new Worker('timber-worker.js');const id=++request;
 const finish=result=>{if(id!==request)return;clearTimeout(workerTimer);if(worker)worker.terminate();worker=null;callback(result);};
 worker.onmessage=e=>{if(e.data.id===id)finish(e.data);};
 worker.onerror=()=>finish({error:'The puzzle helper could not start. Please try again.'});
 workerTimer=setTimeout(()=>finish({error:'That search needs more time. Try Undo, or try the helper again.'}),15000);
 worker.postMessage({...data,id});
}
function start(n){close();if(n<=60){reset(TIMBER_LEVELS[n-1]);return;}busy=true;say('Preparing a new masterwork…');render();askWorker({type:'generate',number:n},result=>{if(result.level)reset(result.level);else{busy=false;render();say(result.error||'Could not prepare that board. Try again.');}});}
function won(){unlocked=Math.max(unlocked,level.level+1);best[level.level]=Math.min(best[level.level]||Infinity,moves);save();ping(680);dialog(`<div class="eyebrow">WORKSHOP COMPLETE</div><div class="win-mark">✧</div><h2>Beautifully undone.</h2><p>Level ${level.level} cleared in <strong>${moves} moves</strong>.<br>Best: ${best[level.level]} moves.</p><button class="primary" data-action="next">Next puzzle →</button><button data-action="levels">Choose a level</button><a href="index.html" class="exit">Screwball menu</a><a href="../../index.html">Exit to Goobs Games</a>`);}
function act(h){if(busy||R.won(state)||h<0)return;if(!R.accessible(level,state,h)){say('That hole is covered. Release the plank in front first.');return;}
 if(state.pins[h]){selected=selected===h?-1:h;say(selected<0?'Tap a screw to pick it up.':'Choose an exposed empty hole. Tap the screw again to cancel.');render();ping(430);return;}
 if(selected<0){say('Pick up a brass screw first, then tap this empty hole.');return;}doMove(selected,h);
}
function doMove(a,b){const next=R.move(level,state,a,b,true);if(!next){say('Choose a clear, empty hole.');return;}history.push({state:R.clone(state),moves});if(history.length>200)history.shift();const old=state;state=next;moves++;selected=-1;hintPair=null;busy=true;anim={old,from:a,to:b,swinging:state.bars.some((bar,i)=>bar.mode===1&&JSON.stringify(R.geometry(level,old,i))!==JSON.stringify(R.geometry(level,state,i)))};save();ping(300);
 const finish=()=>{for(const b of state.bars)delete b.trace;anim=null;busy=false;render();save();if(R.won(state)){won();return;}const choices=R.choices(level,state);if(!choices.length)say('No moves left. Undo to free up a hole, or restart.');else if(state.bars.some(b=>b.mode&&b.stop>=0))say('Resting on a screw. Shift its support to let it continue.');else say('Keep an empty hole available. Every screw matters.');};
 if(reduced){finish();return;}const begin=performance.now();function frame(now){let t=Math.min(1,(now-begin)/(anim.swinging?2000:1100));render(t);if(t<1)requestAnimationFrame(frame);else finish();}requestAnimationFrame(frame);
}
function hint(){if(busy)return;busy=true;selected=-1;say('Studying the grain…');render();const snapshot=R.key(state);askWorker({type:'hint',level,state},result=>{busy=false;if(R.key(state)!==snapshot){render();return;}const path=result.result&&result.result.path;if(path&&path.length){hintPair=path[0];say('Move screw 1 to hole 2. Follow the bright rings.');}else{hintPair=null;say(result.error||'No solution found from here. Undo a move, or restart this board.');}render();});}
function help(){dialog(`<div class="eyebrow">THE ART OF LETTING GO</div><h2>A screw at a time.</h2><p><strong>1.</strong> Tap a brass screw, then an exposed empty hole. You can also drag it there.</p><p><strong>2.</strong> With one screw left, a plank swings down until it hits an installed screw. With none, it drops, slides, and tips around screws beneath it.</p><p><strong>3.</strong> Clear every plank. A balanced plank can rest on a screw; an unbalanced one can slide or tip past it. Screws holding other boards and parked screws both stay solid.</p><p>Undo and hints are always free. No timer, lives, or paid holes. The first four puzzles are practice; level 5 starts the real workshop.</p><button class="primary" data-action="close">Back to the board</button><p class="build-detail" id="versionInfo">Timber Tumble · Version ${BUILD}</p>`);}
function diagnostics(){
 const states=history.map(h=>h.state).concat([state]),sequence=[];
 for(let i=1;i<states.length;i++){const old=states[i-1].pins,now=states[i].pins;sequence.push([old.findIndex((p,j)=>p&&!now[j]),old.findIndex((p,j)=>!p&&now[j])]);}
 const report=JSON.stringify({game:'Timber Tumble',version:BUILD,rules:R.physics,level:level.level,layout:level,moveSequence:sequence,state,moves},null,2);
 dialog('<h2>Puzzle details</h2><p>Copy these details and paste them into our chat if a screw disappears. This captures your board and recent moves.</p><textarea id="puzzleDetails" readonly aria-label="Puzzle diagnostic details" rows="6"></textarea><button class="primary" id="copyDetails">Copy details</button><p id="copyStatus" role="status"></p><button data-action="close">Back to puzzle</button>');
 $('puzzleDetails').value=report;
 $('copyDetails').onclick=async()=>{try{await navigator.clipboard.writeText(report);$('copyStatus').textContent='Copied. Paste into our chat.';}catch(e){$('puzzleDetails').focus();$('puzzleDetails').select();$('copyStatus').textContent='Select and copy the text above.';}};
}
function menu(){dialog(`<div class="eyebrow">SCREWBALL · TIMBER TUMBLE</div><h2>The workshop</h2><button class="primary" data-action="close">Resume puzzle</button><button data-action="levels">Choose a level</button><button data-action="sound">Sound: ${sound?'on':'off'}</button><button data-action="help">How to play</button><button data-action="diagnostics">Copy puzzle details</button><a href="index.html" class="exit">Screwball menu · both games</a><a href="../../index.html">Exit to Goobs Games</a>`);}
function levels(){dialog(`<div class="eyebrow">FROM APPRENTICE TO MASTER</div><h2>Your workbench</h2><p>60 workshop puzzles, then endless new boards. Your current puzzle is saved when you leave; choosing another level starts that board fresh.</p><div class="levels-grid">${TIMBER_LEVELS.map(l=>`<button data-level="${l.level}" ${l.level>unlocked?'disabled':''} class="${best[l.level]?'done ':''}${l.level===level.level?'current':''}">${l.level}</button>`).join('')}</div>${unlocked>60?`<button data-level="${Math.max(61,unlocked)}">Endless · Level ${Math.max(61,unlocked)}</button>`:''}<button data-action="close">Back to puzzle</button>`);}
$('dialogContent').onclick=e=>{const el=e.target.closest('[data-action],[data-level]');if(!el)return;if(el.dataset.level){start(+el.dataset.level);return;}switch(el.dataset.action){case'close':close();break;case'next':start(level.level+1);break;case'levels':levels();break;case'help':help();break;case'diagnostics':diagnostics();break;case'sound':sound=!sound;save();menu();ping();break;case'reset':close();reset(level);break;}};
$('menu').onclick=menu;$('help').onclick=help;$('levelButton').onclick=levels;$('hint').onclick=hint;
$('restart').onclick=()=>dialog('<h2>Start this board again?</h2><p>Your unlocked levels and best scores stay saved.</p><button class="primary" data-action="reset">Restart puzzle</button><button data-action="close">Keep playing</button>');
$('undo').onclick=()=>{if(busy||!history.length)return;const h=history.pop();state=h.state;moves=h.moves;selected=-1;hintPair=null;render();save();say('One move back. Try a different screw or parking hole.');};
function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
function nearest(p){let best=-1,d=38;level.holes.forEach((h,i)=>{let n=Math.hypot(h.x-p.x,h.y-p.y);if(n<d){best=i;d=n;}});return best;}
svg.addEventListener('pointerdown',e=>{if(busy||e.button>0)return;e.preventDefault();const p=point(e),h=nearest(p);drag={id:e.pointerId,from:h,x:p.x,y:p.y,startX:e.clientX,startY:e.clientY,active:false};svg.setPointerCapture(e.pointerId);});
svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||busy)return;const p=point(e);if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>7&&drag.from>=0&&state.pins[drag.from]&&R.accessible(level,state,drag.from)){drag.active=true;selected=drag.from;}if(drag.active){drag.x=p.x;drag.y=p.y;render();}});
svg.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag,p=point(e),h=nearest(p);drag=null;if(d.active){if(h>=0&&h!==d.from&&!state.pins[h]&&R.accessible(level,state,h))doMove(d.from,h);else{selected=d.from;render();say('Release over an exposed empty hole, or tap one now.');}}else act(h);});
svg.addEventListener('pointercancel',()=>{drag=null;render();});
svg.addEventListener('keydown',e=>{const el=e.target.closest('[data-hole]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();act(+el.dataset.hole);}});
window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
let stored;try{stored=JSON.parse(localStorage.getItem(KEY));}catch(e){}
if(stored&&stored.version===2&&stored.level&&stored.state&&stored.level.holes.length===stored.state.pins.length&&stored.level.planks.length===stored.state.bars.length){({level,state,history=[],moves=0,unlocked=1,best={},sound=false}=stored);render();if(R.won(state))won();else say('Welcome back. Your workbench is just as you left it.');}else if(stored&&stored.level){unlocked=Math.max(1,stored.unlocked||1);best=stored.best||{};sound=!!stored.sound;const n=Math.max(1,stored.level.level||1);reset(TIMBER_LEVELS[Math.min(n,60)-1]);if(n>60)start(n);else say('Physics updated. This puzzle restarted; your unlocked levels are saved.');}else{reset(TIMBER_LEVELS[0]);}
// Read-only inspection for troubleshooting and automated validation.
window.TimberGame={build:BUILD,physics:R.physics,snapshot:()=>JSON.parse(JSON.stringify({level,state,moves,unlocked,history,busy,selected})),storageKey:KEY};
})();
