/* Perch Pals wildlife edition. Visual species map is deterministic per level;
   original colour IDs, puzzles, solver and save format are untouched. */
(function(){
'use strict';
var names=['American goldfinch','Eastern bluebird','American robin','Black-capped chickadee','House finch','White-breasted nuthatch','Cedar waxwing','Red-winged blackbird','Mourning dove','Baltimore oriole','Downy woodpecker','Mallard','Northern cardinal','Blue jay','Bald eagle','Sleeping bird','House sparrow','European starling','Great horned owl','Eastern gray squirrel'];
var colors=['#d8b724','#437aa9','#bb673e','#545b57','#ab665e','#879fa5','#b8a875','#392f27','#99877c','#e39126','#565852','#477b68','#c94330','#548bb7','#6f5740','#92938c','#96806c','#464f54','#865a34','#a3917b'];
var birds=[],flights=[],scenes=[],branch,level=1,map=[],visitors=[],jobs=[];
function image(src){var im=new Image();jobs.push(new Promise(function(resolve,reject){im.onload=resolve;im.onerror=function(){reject(Error('Unable to load '+src));};}));im.src='assets/'+src;return im;}
for(var i=0;i<18;i++)birds.push(image('bird-'+i+'.webp'));
for(i=0;i<18;i++)flights.push(image('flight-'+i+'.webp'));
birds.push(image('owl-v1.png'),image('squirrel-v1.png'));flights.push(birds[18],birds[19]);
for(i=0;i<3;i++)scenes.push(image('habitat-'+i+'.webp'));
branch=image('branch-0.webp');
PA.SCENES=[{id:'woodland',name:'Sunlit woodland',leaves:['#6b8051','#849660','#455c37']},{id:'lake',name:'Mountain lake',leaves:['#50684c','#77826a','#394e42']},{id:'autumn',name:'Autumn grove',leaves:['#b58c48','#b87737','#8a6036']}];
function speciesFor(n,nc){var base=[0,1,2,3,4,5,6,7,8,9,10,11,16,17],shift=Math.floor((n-1)/3)*3%14,out=base.map(function(_,i){return base[(i+shift)%14];}),v=[];
 // About one level in five for cardinals/jays; an eagle flock every 19 levels.
 if(n%5===3){out[0]=12;v.push('Northern cardinal');}
 if(n%7===5){out[Math.min(1,nc-1)]=13;v.push('Blue jay');}
 if(n%19===12){out[Math.min(2,nc-1)]=14;v.push('Bald eagle');}
 if(n%6===2){out[0]=18;v.push('Great horned owl');}
 if(n%8===4){out[Math.min(1,nc-1)]=19;v.push('Eastern gray squirrel');}
 v=out.slice(0,nc).filter(function(id){return id===12||id===13||id===14||id===18||id===19;}).map(function(id){return names[id];});
 return {map:out,visitors:v};
}
PA.setLevel=function(n,nc){level=n;var a=speciesFor(n,nc);map=a.map;visitors=a.visitors;for(var j=0;j<14;j++){PA.NAMES[j]=names[map[j]];PA.COLORS[j]=colors[map[j]];}var h=document.getElementById('habitat');if(h){h.innerHTML='<span>'+PA.SCENES[Math.floor((n-1)/3)%3].name+'</span>'+(visitors.length?'<b>'+(visitors.indexOf('Bald eagle')>=0?'Rare visitor · ':'Visiting flock · ')+visitors.join(' · ')+'</b>':'<b>Gather matching wildlife. Watch for owls and squirrels.</b>');}};
PA.wildlife={speciesFor:speciesFor,names:names,get map(){return map.slice();},get visitors(){return visitors.slice();}};
PA.scene=function(x,W,H,n){var im=scenes[n%3];if(!im.complete||!im.naturalWidth){x.fillStyle='#71806c';x.fillRect(0,0,W,H);return;}var scale=Math.max(W/im.width,H/im.height);x.drawImage(im,(W-im.width*scale)/2,(H-im.height*scale)/2,im.width*scale,im.height*scale);x.fillStyle='rgba(24,37,28,.10)';x.fillRect(0,0,W,H);};
PA.fxInit=function(){};PA.fxDraw=function(){};
PA.branch=function(x,x0,x1,y,th,dir){if(!branch.complete||!branch.naturalWidth)return;x.save();x.translate(x0,y-th*1.35);x.scale(dir,1);x.shadowColor='#14231955';x.shadowBlur=3;x.shadowOffsetY=3;x.drawImage(branch,0,0,Math.abs(x1-x0),th*2.5);x.restore();};
PA.trunk=function(x,pos,w,H){if(!branch.complete||!branch.naturalWidth)return;x.save();x.translate(pos+w/2,-30);x.rotate(Math.PI/2);x.drawImage(branch,branch.width*.1,branch.height*.35,branch.width*.65,branch.height*.5,0,0,H+60,w);x.restore();};
PA.bird=function(x,px,py,s,c,o){o=o||{};var hidden=o.sleepy&&(o.wake||0)<.5,id=hidden?15:(map[c]===undefined?c:map[c]),im=birds[id];var flying=!!o.fly&&!hidden;if(flying)im=flights[id];if(!im||!im.complete||!im.naturalWidth)return;var scale=id===14?1.12:1,hh=s*1.12*scale,ww=hh*im.width/im.height;if(ww>s*1.2*scale){ww=s*1.2*scale;hh=ww*im.height/im.width;}if(flying){ww*=1.3;hh*=1.3;}var hop=(o.hop||0)*s*.32;
x.save();x.translate(px,py-hop);if(o.alpha!=null)x.globalAlpha=o.alpha;if(o.face<0)x.scale(-1,1);if(o.tilt)x.rotate(o.tilt*.5);if(o.glow){x.shadowColor='#fff2b6';x.shadowBlur=10;}else{x.shadowColor='#1d241e66';x.shadowBlur=1.5;x.shadowOffsetY=1;}
if(flying&&id!==19){var flap=o.flap==null?.5:o.flap;x.scale(1, .88+flap*.16);}
x.drawImage(im,-ww*.58,-hh,ww,hh);x.restore();
if(o.sym&&!hidden)PA.symbol(x,c,px,py-hop-s*.25,s*.30);
if(hidden){x.save();x.fillStyle='#f6f1df';x.strokeStyle='#405044';x.lineWidth=2;x.font='600 '+Math.max(9,s*.22)+'px Georgia';x.strokeText('z',px+s*.2,py-s*.9);x.fillText('z',px+s*.2,py-s*.9);x.restore();}
};
var cover=document.createElement('div');cover.className='wildlife-loading';cover.innerHTML='<strong>Perch Pals</strong><span>Opening the woodland…</span>';document.body.appendChild(cover);
PA.ready=Promise.all(jobs).then(function(){cover.remove();}).catch(function(e){cover.innerHTML='<strong>The birds couldn’t load</strong><span>Please reopen the game after the update finishes.</span><button onclick="location.reload()">Try again</button>';throw e;});
})();
