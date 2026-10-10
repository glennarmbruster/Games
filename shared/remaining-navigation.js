/* Integrated navigation for the final 30 collection icons. Existing handlers own saves and rules. */
(()=>{'use strict';const key=location.pathname.split('/games/')[1]?.split('/')[0];const targets={casino:'.top',solitaire:'.toolbar',board:'.toolbar',wordwheel:'.top',daily:'.top',sudoku:'#sdtools',nonogram:'.toolrow',trivia:'.top',mahjong:'.toolbar',wordboard:'.ttbar',worddice:'.toolbar',castle:'#hud',bubbles:'.toolbar',pinball:'.dmdrow',deck:'.top',pegs:'.toolbar',hoops:'.toolbar',aliens:'.top',bowling:'.top',blocks:'.toolbar',outpost:'#status',cases:'.top',links:'.toolbar',cubecorral:'.toolbar',tapaway:'.toolbar',knotty:'.toolbar',parking:'.toolbar',merge:'.toolbar',sort:'.toolbar',wickway:'#playbar'};if(!targets[key])return;
function setup(){if(document.getElementById('integratedGameNav'))return;if(!document.getElementById('collectionExit')){const wait=new MutationObserver(()=>{if(document.getElementById('collectionExit')){wait.disconnect();setup();}});wait.observe(document.body,{childList:true,subtree:true});return;}const root=document.documentElement,body=document.body,$=id=>document.getElementById(id);root.classList.add('remaining-navigation');body.dataset.remainingGame=key;
if(key==='wordwheel'){const top=document.querySelector('.top'),hud=document.querySelector('.wwhud');if(top&&hud)top.prepend(hud);}
const oldExit=$('collectionExit');if(!oldExit)return;const dock=document.createElement('nav');dock.id='integratedGameNav';dock.setAttribute('aria-label','Game navigation');oldExit.textContent='Exit';oldExit.className='remaining-exit';dock.append(oldExit);const help=document.createElement('button');help.id='integratedHelp';help.type='button';help.textContent='How to Play';dock.append(help);const choose=$('collectionChoose');if(choose){choose.textContent='Modes';choose.className='remaining-modes';dock.append(choose);}body.append(dock);
const last=a=>a[a.length-1];
const visible=e=>!!e&&!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
function sourceHelp(){if(key==='tapaway'&&root.classList.contains('k-lines'))return $('btnHelpL');return $(key==='aliens'?'bHelp':key==='pinball'?'btnHelp2':key==='outpost'?'help':key==='castle'?'hubHelp':'btnHelp');}
function fallbackHelp(){const d=document.createElement('dialog');d.className='remaining-guide';const h=document.createElement('h2');h.textContent='How to Play';const p=document.createElement('p');p.textContent=key==='outpost'?'Choose Outpost Rush to connect towers and capture rival outposts, or Frontline Regions to command units across neighboring regions. Each battlefield has its own How to Play guide.':'Use the game controls to play. Open Menu for the game’s rules and options.';const close=document.createElement('button');close.textContent='Back';close.onclick=()=>GoobsDialog.close(d);d.append(h,p,close);d.addEventListener('close',()=>d.remove());body.append(d);GoobsDialog.open(d);}
help.onclick=()=>{const b=sourceHelp();if(b){b.click();return;}if(key==='castle'&&$('menu')){$('menu').click();const b=[...document.querySelectorAll('#dialogActions button')].find(b=>/how to play/i.test(b.textContent));if(b)b.click();return;}fallbackHelp();};
// Keep original help handlers in place but expose one readable button with the integrated actions.
for(const id of ['btnHelp','btnHelpL',...(key==='aliens'?['bHelp']:[]),...(key==='castle'?['hubHelp','allGames']:[])]){const b=$(id);if(b)b.classList.add('remaining-original-help');}
if(key==='castle')document.querySelector('header>a.exit')?.classList.add('remaining-original-help');
function addClass(e,c){if(!e.classList.contains(c))e.classList.add(c);}
function gameTarget(){
 const selector=[...document.querySelectorAll('.collection-selector')].find(visible);if(selector)return selector.querySelector('.collection-lobby')||selector;
 if(key==='castle'){if(visible($('hub')))return $('hub').querySelector('footer')||$('hub');return document.querySelector('.console .aim')||$('hud');}
 if(key==='outpost'){return document.querySelector('#app>footer')||$('status')||document.querySelector('main.collection-lobby');}
 const choices=[...document.querySelectorAll(targets[key])].filter(e=>!e.closest('.overlay,dialog'));return choices.find(e=>visible(e)&&(e.id==='sdtools'||e.classList.contains('ttbar')||[...e.querySelectorAll('button')].some(b=>!b.closest('#integratedGameNav')&&!b.classList.contains('remaining-original-help')&&visible(b))))||document.querySelector('.top')||choices[0]||body;
}
let frame=0;function schedule(){if(frame)return;frame=requestAnimationFrame(sync);}
function sync(){frame=0;
 const selector=[...document.querySelectorAll('.collection-selector')].find(visible);const modal=last([...document.querySelectorAll('dialog[open]')].filter(visible))||(!selector&&last([...document.querySelectorAll('.overlay.show,#sheet:not([hidden])')].filter(visible)));
 let target=modal?(modal.querySelector('.sheet,.card,#panel,.titlebox,.mapwrap')||modal):gameTarget();if(!target)return;
 const menu=!!modal||target.matches('.collection-lobby')||!!target.closest('.collection-selector,#hub');
 dock.classList.toggle('remaining-menu-nav',menu);if(menu){if(dock.parentElement!==target||target.firstElementChild!==dock)target.prepend(dock);}else{addClass(target,target.matches('.top,.dmdrow,#hud')?'remaining-header':'remaining-controls');if(key==='daily'&&target.matches('.top')){const buttons=target.querySelector('.topbtns');if(dock.parentElement!==target||dock.nextElementSibling!==buttons)target.insertBefore(dock,buttons);}else if(dock.parentElement!==target)target.append(dock);}
 const full=document.fullscreenElement||document.webkitFullscreenElement;if(full&&!full.contains(dock)&&!modal){addClass(full,'remaining-fullscreen');full.append(dock);}
 if(key==='castle'&&visible($('hud')))root.style.setProperty('--remaining-hud-bottom',$('hud').getBoundingClientRect().bottom+'px');
 const top=document.querySelector('.top');if(top&&visible(top)){const h=top.getBoundingClientRect().height;root.style.setProperty('--remaining-top-height',h+'px');}
}
// DOM updates can replace dialog contents; reattach without observing our own text updates.
new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'?(r.target!==dock&&r.target!==root&&r.target!==body):[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&n!==dock)))schedule();}).observe(body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open']});
window.addEventListener('resize',schedule);document.addEventListener('fullscreenchange',schedule);document.addEventListener('webkitfullscreenchange',schedule);sync();window.dispatchEvent(new Event('resize'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,0));else setup();})();
