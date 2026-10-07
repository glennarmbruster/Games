/* Photographic scenes and deterministic, removable search objects. */
(function(){'use strict';
var A=SceneArt,H=HO,oldThumb=A.thumb,images=[],objects=[],keys=[],names=['Silver safety pin','Turquoise paperclip','Red button','Purple feather','Green marble','Dragonfly brooch','Amber ring','Blue thimble','Brass padlock','Copper coin','Ivory bishop','Pink eraser','Black barrette','Goldfish figurine','Threaded needle','Silver heart'];
var titles=['Captain’s Cabin','Country Kitchen','The Greenhouse','Old Toy Shop','Beach Hut','Winter Cabin','Artist’s Attic','Railway Luggage Office','Watchmaker’s Workshop','Collector’s Study'];
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
[[8,79],[19,75],[28,83],[39,74],[49,84],[59,73],[69,83],[79,72],[89,78],[22,64],[36,62],[48,66],[61,63],[76,64],[92,62],[53,46],[64,48],[77,39],[89,38],[40,92]]];
function load(src){return new Promise(function(ok,no){var im=new Image();im.onload=function(){ok(im)};im.onerror=function(){no(new Error('Could not load '+src))};im.src=src})}
var tasks=[];titles.forEach(function(t,i){var id='photo'+i;A.THEMES[id]={name:t};tasks.push(load('assets/scene-'+i+'.webp').then(function(im){images[i]=im}))});A.THEME_IDS=titles.map(function(_,i){return 'photo'+i});
names.forEach(function(label,i){var k='photo_object_'+i;keys.push(k);A.OBJECTS[k]={label:label};tasks.push(load('assets/object-'+i+'.png').then(function(im){objects[i]=im}))});
H.LOST=H.LOST.concat(keys);
function shuffle(a,r){for(var j=a.length-1;j>0;j--){var k=Math.floor(r()*(j+1)),t=a[j];a[j]=a[k];a[k]=t}return a}
H.level=function(n,diff){n=Math.max(1,n|0);diff=diff||'normal';var d=['relaxed','normal','hard','expert'].indexOf(diff);if(d<0)d=1;var si=(n-1)%10,r=A.rng(n*93563+d*773+821),p=H.params(n,diff),available=keys.map(function(_,i){return i}).filter(function(i){return !(si===7&&i===9)&&!(si===8&&i===8)}),order=shuffle(available,r),spots=shuffle(anchors[si].slice(),r),count=Math.min([9,12,14,16][d],order.length),items=[],list=[],targets=[];
 p.count=count;p.type=d?'word':'pic';p.breather=false;p.parPer=[28,26,22,18][d];p.parAdd=40;
 order.forEach(function(id,i){var im=objects[id],size=[40,29,25,22][d]*(.93+r()*.14),w=size*im.width/Math.max(im.width,im.height),h=size*im.height/Math.max(im.width,im.height),x=spots[i][0]*9+(r()-.5)*6,y=spots[i][1]*6+(r()-.5)*4,rot=(r()-.5)*.55,box={x:x-w/2,y:y-h/2,w:w,h:h},it={k:keys[id],photo:id,x:x,y:y,w:w,h:h,s:1,rot:rot,flip:false,gone:false,box:box,vis:{frac:1,area:w*h,cx:x,cy:y,px:x,py:y,vbox:box}};items.push(it);if(i<count){list.push({k:it.k,ids:[i],need:1,i:i,label:names[id],show:p.type});targets.push({e:i,id:i})}});
 var bonus=null;if(order.length>count){var bi=count;bonus={k:items[bi].k,ids:[bi],need:1,label:names[items[bi].photo],show:'pic',bonus:true};targets.push({e:-1,id:bi})}
 return {n:n,diff:diff,p:p,decoys:[],theme:'photo'+si,attempt:210,type:p.type,breather:false,scene:{theme:'photo'+si,photo:si,pal:0,bgv:0,items:items,slots:[]},list:list,targets:targets,bonus:bonus};};
H.themeFor=function(n){return 'photo'+((n-1)%10)};
H.hit=function(lv,x,y,tol,done){var best=-1,dist=Infinity;lv.targets.forEach(function(t,j){if(done&&done[j])return;var it=lv.scene.items[t.id];if(it.gone)return;var dx=x-it.x,dy=y-it.y,c=Math.cos(it.rot),s=Math.sin(it.rot),xx=dx*c+dy*s,yy=-dx*s+dy*c,pad=Math.min(3,tol||0);if(Math.abs(xx)<=it.w/2+pad&&Math.abs(yy)<=it.h/2+pad){var dd=dx*dx+dy*dy;if(dd<dist){best=j;dist=dd}}});return best};
H.anyAt=function(l,x,y,t){return H.hit(l,x,y,t,null)>=0};
A.drawScene=function(c,sc){c.drawImage(images[sc.photo],0,0,900,600);sc.items.forEach(function(it){if(it.gone)return;c.save();c.translate(it.x,it.y);c.rotate(it.rot);c.shadowColor='rgba(24,17,10,.55)';c.shadowBlur=1.1;c.shadowOffsetY=.7;c.globalAlpha=.96;c.filter='saturate(0.78) brightness(0.92)';c.drawImage(objects[it.photo],-it.w/2,-it.h/2,it.w,it.h);c.restore()})};
A.thumb=function(c,k,x,y,size,look){var id=keys.indexOf(k);if(id<0)return oldThumb(c,k,x,y,size,look);var im=objects[id];if(!im)return;var f=size/Math.max(im.width,im.height);c.drawImage(im,x-im.width*f/2,y-im.height*f/2,im.width*f,im.height*f)};
window.PhotoHunt={ready:Promise.all(tasks),titles:titles};
})();
