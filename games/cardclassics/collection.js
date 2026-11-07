// Use the existing root worker without the legacy full-screen scroll lock.
let collectionStatus='Offline files download with the collection update';
function showCollectionStatus(){let el=document.getElementById('offlineState');if(el)el.textContent=collectionStatus}
try{let recent=JSON.parse(localStorage.getItem('goobs.recent')||'[]');if(!Array.isArray(recent))recent=[];localStorage.setItem('goobs.recent',JSON.stringify([game,...recent.filter(id=>id!==game)].slice(0,6)))}catch(e){}
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)){
 const root=new URL('../../',location.href);let waiting=null,reloading=false;
 const update=document.createElement('button');update.className='card-update';update.hidden=true;update.textContent='Update available — tap to reload';document.body.appendChild(update);
 function offer(worker){waiting=worker;update.hidden=false}
 update.onclick=()=>{if(waiting){save();reloading=true;waiting.postMessage('SKIP_WAITING');update.textContent='Updating…'}};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.reload();else navigator.serviceWorker.controller?.postMessage('VERSION')});
 navigator.serviceWorker.addEventListener('message',e=>{if(!e.data?.versions)return;collectionStatus=e.data.versions.cardclassics==='1.0.0'?'Offline game files installed':'Install the collection update for offline play';showCollectionStatus()});
 navigator.serviceWorker.register(new URL('sw.js',root).href,{scope:root.href}).then(reg=>{
   if(reg.waiting)offer(reg.waiting);
   reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offer(worker);if(worker.state==='redundant'){collectionStatus='Offline download incomplete — reconnect and reopen';showCollectionStatus()}})});
   if(navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage('VERSION');else navigator.serviceWorker.ready.then(r=>r.active?.postMessage('VERSION'));
 }).catch(()=>{collectionStatus='Offline download unavailable — reconnect and reopen';showCollectionStatus()});
}else collectionStatus='Offline installation requires the hosted collection';
showCollectionStatus();
