/* Goobs collection presentation 1.0.0. Opt-in only; never writes game saves. */
(function(){'use strict';
var script=document.currentScript,base=new URL('.',script.src),root=new URL('../',base),path=location.pathname;
var configs={
 board:{title:'Game Chest',theme:'chest',subtitle:'Three classics. A seat at every table.',version:'1.2.0',modes:[['checkers','Checkers','Jump, capture, and crown your kings.','checkers'],['chess','Chess','Plan your next move. Protect your king.','chess'],['four','Four in a Row','Drop a disc. Connect four to win.','four']]},
 merge:{title:'Number Nook',theme:'nook',subtitle:'A little room for your next big number.',version:'2.1.0',modes:[['classic','Classic 2048','Slide matching tiles into bigger numbers.','classic'],['trios','Trios','Match 1 + 2, then keep the numbers growing.','trios'],['chain','Chain Cube','Aim, merge, and start a chain reaction.','chain']]},
 deck:{title:'Lido Deck',theme:'lido',subtitle:'Two deck games. One perfect afternoon.',version:'0.4.0',modes:[['shuffle','Shuffleboard','Slide your discs into the scoring zones.','shuffle'],['corn','Cornhole','Toss a bag. Find the board—or the hole.','corn']]},
 sort:{title:'Splash Sort',theme:'splash',subtitle:'Beautiful colors. A satisfying little puzzle.',version:'2.2.0',modes:[['water','Water Sort','Pour the colors into their own bottles.','water'],['balls','Ball Sort','Gather matching marbles into each tube.','balls']]},
 castle:{title:'Castle Havoc',theme:'castle',version:'3.3.0'},outpost:{title:'War Games',theme:'war',version:'3.1.0'}};
var key=Object.keys(configs).find(function(k){return path.indexOf('/games/'+k+'/')!==-1;});if(!key)return;var cfg=configs[key],isRoot=/\/(?:index\.html)?$/.test(path)&&!path.includes('/regions/');
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
function setup(){
 document.documentElement.classList.add('collection-ui','gg-landscape');document.body.classList.add('collection-page');document.body.dataset.collection=key;document.body.dataset.collectionTheme=cfg.theme;
 var nav=el('nav','collection-nav');nav.setAttribute('aria-label','Game navigation');
 var exit=el('button','collection-exit','‹ Exit Game');exit.type='button';exit.id='collectionExit';exit.onclick=function(){var old=document.getElementById('btnHome');if(old)old.click();else location.href=new URL('index.html',root).href;};
 var title=el('span','collection-nav-title',cfg.title),choose=el('button','collection-choose','Choose Game');choose.type='button';choose.id='collectionChoose';nav.append(exit,title,choose);document.body.append(nav);
 var selector=null,returnFocus=null;function hide(){if(selector){selector.hidden=true;document.documentElement.classList.remove('collection-open');}choose.hidden=false;window.dispatchEvent(new Event('resize'));}
 function open(){if(!selector)return;returnFocus=document.activeElement;selector.hidden=false;document.documentElement.classList.add('collection-open');choose.hidden=true;selector.querySelector('button[data-pick]').focus({preventScroll:true});}
 function pick(mode){
  var old=document.querySelector('#modes button[data-mode="'+mode+'"],#modes button[data-m="'+mode+'"]');if(!old)return;
  // Use the game's original mode switch, including its save/resume and animation guards.
  var busy=key==='board'&&window.__gc&&window.__gc.anim||key==='sort'&&window.__ss&&window.__ss.anims.length;
  if(busy){selector.querySelector('.collection-note').textContent='Let this move finish, then choose your game.';return;}
  hide();var menu=document.getElementById('ggMenu');if(menu)menu.classList.remove('show');old.click();
  var primary=document.getElementById('ggMenuBtn');if(primary)primary.focus({preventScroll:true});
 }
 if(cfg.modes){
  selector=el('section','collection-selector');selector.setAttribute('role','dialog');selector.setAttribute('aria-modal','true');selector.setAttribute('aria-labelledby','collectionTitle');
  var inner=el('div','collection-lobby'),intro=el('div','collection-intro');intro.append(el('span','collection-eyebrow','GOOBS GAMES · PICK YOUR NEXT FAVORITE'));var h=el('h1','',cfg.title);h.id='collectionTitle';intro.append(h,el('p','',cfg.subtitle));inner.append(intro);
  var grid=el('div','collection-grid');grid.dataset.count=cfg.modes.length;cfg.modes.forEach(function(m){var b=el('button','collection-card');b.type='button';b.dataset.pick=m[0];var im=el('img','collection-art');im.src=new URL('collection-art/'+m[3]+'.svg',base).href;im.alt='';var body=el('span','collection-card-body');body.append(el('strong','collection-card-title',m[1]),el('span','collection-description',m[2]),el('span','collection-play','Play / Resume  →'));b.append(im,body);b.onclick=function(){pick(m[0]);};grid.append(b);});inner.append(grid,el('p','collection-note','Your saved games stay right where you left them.'));
  selector.append(inner);document.body.append(selector);choose.onclick=open;open();
 }else{
  var collectionURL=new URL('games/'+key+'/index.html',root).href;
  choose.onclick=function(){if(key==='castle'&&isRoot){var back=document.getElementById('back');if(back)back.click();}else location.href=collectionURL;};
  if(isRoot&&key==='outpost')choose.hidden=true;
  if(isRoot&&key==='castle'){
   var hub=document.getElementById('hub');function sync(){choose.hidden=hub&&!hub.hidden;}if(hub)new MutationObserver(sync).observe(hub,{attributes:true,attributeFilter:['hidden']});sync();
  }
 }
 document.addEventListener('keydown',function(e){if(!selector||selector.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();hide();if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});}if(e.key==='Tab'){var focusable=[exit].concat(Array.from(selector.querySelectorAll('button')));var i=focusable.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();focusable[focusable.length-1].focus();}else if(!e.shiftKey&&i===focusable.length-1){e.preventDefault();exit.focus();}}},true);
 // Native dialogs sit above the fixed header, so each gets its own single exit.
 document.querySelectorAll('dialog').forEach(function(d){var row=el('nav','collection-nav collection-dialog-nav'),ex=el('button','collection-exit','‹ Exit Game'),ch=el('button','collection-choose','Choose Game');ex.onclick=exit.onclick;ch.onclick=function(){location.href=new URL('games/'+key+'/index.html',root).href;};row.append(ex,el('span','collection-nav-title',cfg.title),ch);d.append(row);});
 var help=document.querySelector('#ovHelp .sheet,#ovHelp .card');if(help){var version=el('p','collection-build',cfg.title+' · Version '+cfg.version);help.append(version);}
 window.GoobsCollection={open:open,close:hide,get isOpen(){return !!selector&&!selector.hidden;},version:cfg.version};window.dispatchEvent(new Event('resize'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
