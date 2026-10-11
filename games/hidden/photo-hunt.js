/* Photographic scenes and deterministic, removable search objects. */
(function(){'use strict';
var A=SceneArt,H=HO,oldThumb=A.thumb,images=[],objects=[],keys=[],names=['Silver safety pin','Turquoise paperclip','Red button','Purple feather','Green marble','Dragonfly brooch','Amber ring','Blue thimble','Brass padlock','Copper coin','Ivory bishop','Pink eraser','Black barrette','Goldfish figurine','Threaded needle','Silver heart'];
var titles=['Captain’s Cabin','Country Kitchen','The Greenhouse','Old Toy Shop','Beach Hut','Winter Cabin','Artist’s Attic','Railway Luggage Office','Watchmaker’s Workshop','Collector’s Study','Bicycle Workshop','Theater Dressing Room','Music Room','Natural History Gallery','Pottery Studio','Lighthouse Keeper’s Room','Antique Bookshop','Autumn Market','Mountain Observatory','Aquarium Research Room'];
var anchors=[
[[12,58],[20,66],[27,64],[38,52],[46,57],[56,66],[64,78],[74,69],[83,82],[91,63],[53,84],[35,75],[19,57],[72,53],[89,48],[66,43],[51,47],[79,45],[58,52],[41,72]],
[[7,61],[17,66],[24,79],[34,62],[44,77],[54,66],[64,82],[74,77],[87,79],[93,63],[39,53],[51,53],[62,58],[77,57],[88,52],[32,21],[43,24],[54,18],[13,82],[55,87]],
[[8,69],[18,78],[28,69],[39,81],[48,72],[59,81],[70,69],[80,82],[92,73],[16,61],[29,57],[44,63],[56,64],[76,60],[88,59],[61,25],[74,25],[86,25],[35,88],[63,90]],
[[8,64],[18,79],[27,68],[37,79],[49,70],[58,83],[69,76],[79,87],[91,75],[43,58],[58,59],[72,54],[87,59],[9,45],[22,44],[39,37],[59,38],[78,36],[34,88],[54,91]],
[[16,70],[26,80],[36,71],[46,82],[56,68],[66,80],[77,71],[87,83],[94,69],[27,57],[40,60],[52,54],[67,58],[82,59],[10,35],[24,37],[39,36],[16,23],[35,22],[60,91]],
[[29,68],[39,79],[49,70],[59,83],[70,73],[81,84],[92,72],[31,56],[42,52],[54,54],[66,59],[81,58],[92,60],[50,32],[62,32],[56,20],[68,21],[37,90],[56,91],[76,92]],
[[8,74],[19,86],[29,74],[39,85],[50,75],[61,86],[72,75],[84,86],[94,74],[14,62],[31,59],[43,55],[54,57],[70,60],[88,61],[9,36],[22,40],[59,32],[71,32],[46,94]],
[[8,63],[18,77],[28,67],[39,80],[50,70],[61,82],[73,77],[86,83],[94,64],[19,56],[33,54],[45,57],[58,54],[75,54],[90,50],[38,37],[67,46],[81,46],[55,23],[74,23]],
[[8,66],[19,79],[30,69],[40,82],[50,73],[61,86],[71,75],[82,88],[94,76],[17,56],[29,55],[42,60],[55,56],[69,57],[84,56],[24,42],[36,43],[66,45],[80,46],[92,45]],
[[8,79],[19,75],[28,83],[39,74],[49,84],[59,73],[69,83],[79,72],[89,78],[22,64],[36,62],[48,66],[61,63],[76,64],[92,62],[53,46],[64,48],[77,39],[89,38],[40,92]],
[[13,81],[25,76],[34,85],[47,78],[57,85],[70,76],[82,83],[94,77],[21,60],[39,60],[53,63],[67,61],[78,55],[90,57],[32,38],[47,43],[62,37],[76,41],[44,92],[67,92]],
[[8,67],[19,81],[30,70],[41,81],[53,72],[63,83],[76,76],[89,84],[96,68],[13,53],[27,59],[42,57],[55,61],[70,58],[84,59],[22,42],[38,41],[62,43],[78,44],[49,91]],
[[8,72],[20,78],[32,71],[44,82],[56,73],[68,82],[79,72],[90,81],[16,59],[28,58],[40,60],[52,59],[64,61],[76,58],[88,59],[19,43],[34,40],[49,42],[71,42],[59,90]],
[[9,72],[19,78],[30,69],[41,80],[52,73],[63,84],[75,71],[87,82],[96,71],[13,58],[26,59],[39,58],[53,61],[66,59],[80,58],[20,41],[34,43],[50,42],[68,42],[54,91]],
[[8,70],[20,80],[32,72],[44,83],[56,72],[68,82],[80,71],[92,80],[14,60],[27,61],[40,60],[53,60],[66,62],[79,60],[91,60],[23,45],[36,45],[49,44],[71,44],[56,91]],
[[10,75],[21,84],[33,72],[45,82],[57,75],[69,84],[81,74],[92,82],[15,61],[28,62],[40,61],[53,63],[65,61],[78,60],[90,62],[23,43],[36,45],[50,44],[72,44],[58,92]],
[[9,76],[21,84],[32,72],[44,82],[56,75],[68,84],[80,74],[92,81],[16,62],[28,62],[40,61],[52,60],[64,62],[77,61],[89,60],[23,44],[37,43],[49,45],[71,44],[56,92]],
[[9,76],[21,84],[33,74],[45,83],[57,74],[69,83],[81,75],[93,83],[15,61],[28,61],[40,60],[53,61],[65,60],[78,61],[90,61],[23,44],[36,44],[49,45],[72,44],[56,92]],
[[9,77],[21,84],[33,73],[45,84],[57,75],[69,85],[81,73],[93,81],[15,61],[28,60],[40,62],[52,60],[65,61],[77,60],[89,61],[23,43],[36,44],[50,43],[72,44],[56,92]],
[[9,77],[21,84],[33,74],[45,82],[57,75],[69,84],[81,72],[93,81],[15,61],[28,60],[40,62],[53,61],[65,60],[77,61],[89,60],[23,44],[36,44],[50,43],[72,45],[56,92]]];
function load(src){return new Promise(function(ok,no){var im=new Image();im.onload=function(){ok(im)};im.onerror=function(){no(new Error('Could not load '+src))};im.src=src})}
var tasks=[];titles.forEach(function(t,i){var id='photo'+i;A.THEMES[id]={name:t};tasks.push(load('assets/scene-'+i+'.webp').then(function(im){images[i]=im}))});A.THEME_IDS=titles.map(function(_,i){return 'photo'+i});
names.forEach(function(label,i){var k='photo_object_'+i;keys.push(k);A.OBJECTS[k]={label:label};tasks.push(load('assets/object-'+i+'.png').then(function(im){objects[i]=im}))});
H.LOST=H.LOST.concat(keys);
function shuffle(a,r){for(var j=a.length-1;j>0;j--){var k=Math.floor(r()*(j+1)),t=a[j];a[j]=a[k];a[k]=t}return a}
var sceneBags={};
function rawBag(cycle){return shuffle(titles.map(function(_,i){return i}),A.rng(Math.imul(cycle+1,15485863)+0x2d9f31))}
function sceneIndex(n){var cycle=Math.floor((n-1)/titles.length),bag=sceneBags[cycle];if(!bag){bag=rawBag(cycle);if(cycle&&bag[0]===rawBag(cycle-1)[titles.length-1]){var t=bag[0];bag[0]=bag[1];bag[1]=t}sceneBags[cycle]=bag}return bag[(n-1)%titles.length]}
H.level=function(n,diff,sceneOverride){n=Math.max(1,n|0);diff=diff||'normal';var d=['relaxed','normal','hard','expert'].indexOf(diff);if(d<0)d=1;var si=sceneOverride>=0&&sceneOverride<titles.length?sceneOverride:sceneIndex(n),r=A.rng(n*93563+d*773+821),p=H.params(n,diff),available=keys.map(function(_,i){return i}).filter(function(i){return !(si===7&&i===9)&&!(si===8&&i===8)}),order=shuffle(available,r),spots=shuffle(anchors[si].slice(),r),count=Math.min([9,12,14,16][d],order.length),items=[],list=[],targets=[];
 p.count=count;p.type=d?'word':'pic';p.breather=false;p.parPer=[28,26,22,18][d];p.parAdd=40;
 order.forEach(function(id,i){var im=objects[id],size=[40,29,25,22][d]*(.93+r()*.14),w=size*im.width/Math.max(im.width,im.height),h=size*im.height/Math.max(im.width,im.height),x=spots[i][0]*9+(r()-.5)*6,y=spots[i][1]*6+(r()-.5)*4,rot=(r()-.5)*.55,box={x:x-w/2,y:y-h/2,w:w,h:h},it={k:keys[id],photo:id,x:x,y:y,w:w,h:h,s:1,rot:rot,flip:false,gone:false,box:box,vis:{frac:1,area:w*h,cx:x,cy:y,px:x,py:y,vbox:box}};items.push(it);if(i<count){list.push({k:it.k,ids:[i],need:1,i:i,label:names[id],show:p.type});targets.push({e:i,id:i})}});
 var bonus=null;if(order.length>count){var bi=count;bonus={k:items[bi].k,ids:[bi],need:1,label:names[items[bi].photo],show:'pic',bonus:true};targets.push({e:-1,id:bi})}
 return {n:n,diff:diff,p:p,decoys:[],theme:'photo'+si,attempt:210,type:p.type,breather:false,scene:{theme:'photo'+si,photo:si,pal:0,bgv:0,items:items,slots:[]},list:list,targets:targets,bonus:bonus};};
H.themeFor=function(n){return 'photo'+sceneIndex(Math.max(1,n|0))};
H.hit=function(lv,x,y,tol,done){var best=-1,dist=Infinity;lv.targets.forEach(function(t,j){if(done&&done[j])return;var it=lv.scene.items[t.id];if(it.gone)return;var dx=x-it.x,dy=y-it.y,c=Math.cos(it.rot),s=Math.sin(it.rot),xx=dx*c+dy*s,yy=-dx*s+dy*c,pad=Math.min(3,tol||0);if(Math.abs(xx)<=it.w/2+pad&&Math.abs(yy)<=it.h/2+pad){var dd=dx*dx+dy*dy;if(dd<dist){best=j;dist=dd}}});return best};
H.anyAt=function(l,x,y,t){return H.hit(l,x,y,t,null)>=0};
A.drawScene=function(c,sc){c.drawImage(images[sc.photo],0,0,900,600);sc.items.forEach(function(it){if(it.gone)return;c.save();c.translate(it.x,it.y);c.rotate(it.rot);c.shadowColor='rgba(24,17,10,.55)';c.shadowBlur=1.1;c.shadowOffsetY=.7;c.globalAlpha=.96;c.filter='saturate(0.78) brightness(0.92)';c.drawImage(objects[it.photo],-it.w/2,-it.h/2,it.w,it.h);c.restore()})};
A.thumb=function(c,k,x,y,size,look){var id=keys.indexOf(k);if(id<0)return oldThumb(c,k,x,y,size,look);var im=objects[id];if(!im)return;var f=size/Math.max(im.width,im.height);c.drawImage(im,x-im.width*f/2,y-im.height*f/2,im.width*f,im.height*f)};
window.PhotoHunt={ready:Promise.all(tasks),titles:titles};
})();
