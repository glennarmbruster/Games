/* Opt-in Batch 4 navigation and presentation. Original game handlers remain authoritative. */
(function(){'use strict';const configs={"barrage": ["Ball Barrage", "1.7.0"], "bricks": ["Brickyard", "1.4.0"], "bubbles": ["Fizz Pop", "1.5.0"], "pegs": ["Peg Lagoon", "0.4.0"], "blocks": ["Tumbledown", "1.4.0"], "aliens": ["Star Siege", "1.3.0"], "digger": ["Tunnel Pop", "1.3.0"], "maze": ["Cheese Chase", "1.3.0"], "snake": ["Noodle", "1.3.0"], "triple": ["Triple Treat", "2.1.0"], "homerun": ["Moonshot", "1.8.0"], "meanbirds": ["Mean Birds", "1.3.0"], "beacon": ["Beacon Bound", "0.6.0"], "stranded": ["Stranded", "1.1.0"], "containment": ["Containment", "1.1.0"], "bowling": ["Strike Alley", "0.4.0"], "golf": ["Pin High", "0.6.0"], "minigolf": ["Seaside Putt", "2.2.0"], "hoops": ["Pool Party Hoops", "1.4.0"], "skeehop": ["Skee-Hop", "1.5.0"]};
const key=Object.keys(configs).find(k=>location.pathname.includes('/games/'+k+'/'));if(!key)return;
const [title,version]=configs[key],$=id=>document.getElementById(id);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
function setup(){
 document.documentElement.classList.add('collection-ui','batch4-ui');if(!['homerun','meanbirds','beacon'].includes(key))document.documentElement.classList.add('gg-landscape');document.body.classList.add('collection-page');document.body.dataset.collection=key;
 const nav=el('nav','collection-nav');nav.setAttribute('aria-label','Game navigation');const exit=el('button','collection-exit','Exit');exit.id='collectionExit';exit.type='button';exit.onclick=()=>{if($('btnHome'))$('btnHome').click();else{if($('app').classList.contains('playing'))$('pause').click();$('home').click();}};
 const choose=el('button','collection-choose','Choose Game');choose.id='collectionChoose';choose.type='button';choose.hidden=true;nav.append(exit,el('span','collection-nav-title',title),choose);document.body.append(nav);
 if(key==='golf'){
  choose.onclick=()=>{for(const id of ['btnCloseHelp','btnCloseSettings','btnCloseCard','btnClosePlayers']){const b=$(id);if(b?.closest('.overlay.show'))b.click();}$('ggMenu')?.classList.remove('show');$('btnMenu').click();};
  const sync=()=>choose.hidden=$('ovMenu').classList.contains('show');new MutationObserver(sync).observe($('ovMenu'),{attributes:true,attributeFilter:['class']});sync();
  for(const [id,label,desc]of [['goRound','New Round','Choose players, a game and a course.'],['goHole','Practice Hole','Work on your shots at Willow Bend.'],['goRange','Driving Range','Take a few swings and find your rhythm.']]){const b=$(id);b.classList.add('collection-mode-card');b.replaceChildren(el('strong','',label),el('span','',desc));}
 }
 const help=document.querySelector('#ovHelp .sheet,#ovHelp .card');if(help){help.querySelectorAll('p').forEach(p=>{if(/^.+ · Version \d/.test(p.textContent.trim()))p.remove();});help.append(el('p','collection-build',title+' · Version '+version));}
 if(['stranded','containment'].includes(key)){const label=()=>{if(!$('panel').querySelector('.collection-build'))$('panel').append(el('p','collection-build',title+' · Version '+version));};new MutationObserver(label).observe($('panel'),{childList:true});label();}
 const cleanExits=()=>document.querySelectorAll('.overlay button').forEach(b=>{if(/^(All games|Exit to Games|Exit to main menu)$/i.test(b.textContent.trim()))b.hidden=true;});document.querySelectorAll('.overlay').forEach(o=>new MutationObserver(cleanExits).observe(o,{childList:true,subtree:true}));cleanExits();
 window.GoobsCollection={version};window.dispatchEvent(new Event('resize'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();})();
