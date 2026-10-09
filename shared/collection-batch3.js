/* Batch 3: navigation and presentation. Original game handlers retain saves and mode behavior. */
(function(){'use strict';
const base=new URL('.',document.currentScript.src);
const configs={"sudoku": ["Ninefold", "0.3.0"], "nonogram": ["Pixel Pier", "0.3.0"], "mines": ["Mine Meadow", "1.3.0"], "links": ["Color Link", "0.4.0"], "woodpile": ["Woodpile", "1.4.0"], "zoodoku": ["Zoodoku", "1.11.0"], "huddle": ["Huddle", "0.3.0"], "daily": ["Lettermind", "1.4.0"], "patchwork": ["Picture Perfect", "3.1.0"], "spotdiff": ["Double Take", "0.5.0"], "getout": ["Get Out!", "0.23.0"], "getout2": ["Get Out 2!", "1.5.0"], "perch": ["Perch Pals", "1.1.0"], "hidden": ["Lost & Found", "1.1.0"], "knotty": ["Knotty", "1.1.0"], "shelf": ["Shelf Life", "2.1.0"], "parking": ["Lot Escape", "2.1.0"], "cubecorral": ["Cube Pop", "4.1.0"], "tapaway": ["Fly Away", "2.1.0"], "match3": ["Garden Swap", "2.1.0"]};
const key=Object.keys(configs).find(k=>location.pathname.includes('/games/'+k+'/'));if(!key)return;
const [title,version]=configs[key],$=id=>document.getElementById(id);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
function setup(){
 document.documentElement.classList.add('collection-ui','gg-landscape','batch3-ui');document.body.classList.add('collection-page');document.body.dataset.collection=key;
 const nav=el('nav','collection-nav');nav.setAttribute('aria-label','Game navigation');
 const exit=el('button','collection-exit','Exit');exit.type='button';exit.id='collectionExit';exit.onclick=()=>$('btnHome').click();
 const choose=el('button','collection-choose','Choose Game');choose.type='button';choose.id='collectionChoose';choose.hidden=true;
 nav.append(exit,el('span','collection-nav-title',title),choose);document.body.append(nav);
 if(key==='getout'||key==='getout2'){
  choose.textContent='Choose Room';choose.onclick=()=>$('btnLane').click();
  const sync=()=>choose.hidden=document.documentElement.classList.contains('go-lane');sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 }
 if(key==='tapaway'){
  const selector=el('section','collection-selector');selector.setAttribute('role','dialog');selector.setAttribute('aria-modal','true');selector.setAttribute('aria-labelledby','collectionTitle');
  const inner=el('div','collection-lobby'),intro=el('div','collection-intro');intro.append(el('span','collection-eyebrow','TWO WAYS TO FLY'));const h=el('h1','',title);h.id='collectionTitle';intro.append(h,el('p','','Choose your puzzle. Pick up where you left off.'));inner.append(intro);
  const grid=el('div','collection-grid');grid.dataset.count='2';
  const close=()=>{selector.hidden=true;choose.hidden=false;document.documentElement.classList.remove('collection-open');window.dispatchEvent(new Event('resize'));};
  const open=()=>{selector.hidden=false;choose.hidden=true;document.documentElement.classList.add('collection-open');selector.querySelector('button').focus({preventScroll:true});};
  for(const [id,name,desc,art]of [['kindLines','Lines','Turn the sculpture and find a clear path for each line.','↗'],['kindBlocks','Blocks','Rotate the shape and send each block flying.','▧']]){
   const b=el('button','collection-card');b.type='button';b.dataset.pick=id;const illustration=el('img','collection-art');illustration.alt='';illustration.src=new URL('collection-art-b3/'+(id==='kindLines'?'lines':'blocks')+'.svg',base).href;
   const copy=el('span','collection-card-body');copy.append(el('strong','collection-card-title',name),el('span','collection-description',desc),el('span','collection-play','Play / Resume →'));b.append(illustration,copy);b.onclick=()=>{close();document.querySelectorAll('.overlay.show').forEach(o=>o.classList.remove('show'));$('ggMenu')?.classList.remove('show');$(id).click();};grid.append(b);
  }
  inner.append(grid,el('p','collection-note','Your existing puzzles, levels and progress stay with each mode.'));selector.append(inner);document.body.append(selector);choose.onclick=open;open();
  document.addEventListener('keydown',e=>{if(selector.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();choose.focus();}if(e.key==='Tab'){const a=[exit,...selector.querySelectorAll('button')],i=a.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();a.at(-1).focus();}else if(!e.shiftKey&&i===a.length-1){e.preventDefault();exit.focus();}}},true);
 }
 const help=document.querySelector('#ovHelp .sheet,#ovHelp .card,#help .sheet,#help .card');if(help)help.append(el('p','collection-build',title+' · Version '+version));
 document.querySelectorAll('.overlay button').forEach(b=>{if(/^(All games|Exit to Games|Exit to main menu)$/i.test(b.textContent.trim()))b.hidden=true;});
 window.GoobsCollection={version};window.dispatchEvent(new Event('resize'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
