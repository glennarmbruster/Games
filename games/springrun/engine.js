/* Spring Run — conservative grid fluid and diggable terrain. No external dependencies. */
(function(root){'use strict';
var W=96,H=144,N=W*H;
var titles=['A little spring','Around the bend','Split the stream','The stone shelf','Dry country','Two little detours','The long way home','Broken staircase','Thread the needle','Three islands','The spillway','A winding spring'];
function make(level){
 var s={level:level,w:W,h:H,terrain:new Uint8Array(N),water:new Float32Array(N),collected:0,lost:0,total:0,steps:0,stars:[],title:titles[(level-1)%12],goal:{x:37,y:130,w:22,h:10}};
 s.terrain.fill(1);
 function rect(x,y,w,h,type){for(var yy=y;yy<y+h;yy++)for(var xx=x;xx<x+w;xx++)if(xx>=0&&xx<W&&yy>=0&&yy<H)s.terrain[yy*W+xx]=type;}
 s.rect=rect;
 rect(0,0,W,3,2);rect(0,0,3,H,2);rect(W-3,0,3,H,2);rect(0,H-3,W,3,2);
 rect(30,5,36,19,0);rect(34,8,28,13,0);
 for(var y=8;y<21;y++)for(var x=34;x<62;x++){s.water[y*W+x]=1;s.total++;}
 rect(34,128,28,13,0);
 var k=(level-1)%12;
 var layouts=[[],[[3,50,57,5]],[[37,48,22,11]],[[3,66,69,5]],[[29,48,38,7]],[[3,43,54,5],[43,86,50,5]],[[25,40,5,68],[3,108,45,5]],[[3,43,53,5],[43,69,50,5],[3,95,51,5]],[[3,60,38,7],[55,60,38,7],[30,96,36,5]],[[38,40,20,12],[17,75,23,12],[58,100,20,12]],[[22,43,5,63],[68,43,5,63],[3,106,37,5],[56,106,37,5]],[[3,43,62,5],[29,73,64,5],[3,104,62,5]]];
 layouts[k].forEach(function(r){rect(r[0],r[1],r[2],r[3],2);});
 var tokens=[[[48,45],[48,80],[48,115]],[[72,44],[72,73],[48,112]],[[24,53],[73,65],[48,111]],[[25,47],[80,77],[49,113]],[[20,64],[77,86],[48,114]],[[69,54],[26,94],[48,117]],[[16,56],[16,92],[62,119]],[[70,52],[26,79],[69,108]],[[48,48],[18,91],[76,116]],[[22,53],[68,79],[40,115]],[[48,48],[48,84],[48,117]],[[76,53],[17,85],[76,115]]];
 s.stars=tokens[k].map(function(p){return{x:p[0],y:p[1],wet:0,got:false};});
 // Drain beds are optional side hazards, not invisible death boundaries.
 if(k>=4){rect(4,122,14,4,3);rect(78,122,14,4,3);}
 if(level>12){
 // Deterministic extra puzzles: each rock band has a reachable gap.
 for(var yy=27;yy<125;yy++)for(var xx=3;xx<W-3;xx++)s.terrain[yy*W+xx]=1;
 var seed=level*7919;function rng(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 var gaps=[],previous=48;for(var row=0;row<5;row++){var gx=Math.max(22,Math.min(74,previous+Math.floor(rng()*33)-16)),gy=34+row*17;previous=gx;rect(3,gy,W-6,4,2);rect(gx-10,gy,20,4,1);gaps.push({x:gx,y:gy+8,wet:0,got:false});}
 s.stars=[gaps[0],gaps[2],gaps[4]];s.title='Hidden springs · '+(level-12);
 }
 return s;
}
function dig(s,x,y,r){var count=0;for(var yy=Math.max(3,Math.floor(y-r));yy<=Math.min(H-4,Math.ceil(y+r));yy++)for(var xx=Math.max(3,Math.floor(x-r));xx<=Math.min(W-4,Math.ceil(x+r));xx++){var i=yy*W+xx;if((xx-x)*(xx-x)+(yy-y)*(yy-y)<=r*r&&s.terrain[i]===1){s.terrain[i]=0;count++;}}return count;}
function stroke(s,a,b,r){var d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(d/(r*.45)));for(var j=0;j<=n;j++)dig(s,a.x+(b.x-a.x)*j/n,a.y+(b.y-a.y)*j/n,r);}
function step(s){
 var a=s.water,t=s.terrain; s.steps++;
 function move(i,j,amount){if(t[j]===1||t[j]===2||amount<=0)return;amount=Math.min(a[i],amount);a[i]-=amount;a[j]+=amount;}
 for(var y=H-4;y>=3;y--){var reverse=(s.steps+y)%2;for(var z=3;z<W-3;z++){var x=reverse?W-1-z:z,i=y*W+x,v=a[i];if(v<.00001)continue;
 if(t[i]===3){s.lost+=v;a[i]=0;continue;}
 if(y>=s.goal.y&&y<s.goal.y+s.goal.h&&x>=s.goal.x&&x<s.goal.x+s.goal.w){s.collected+=v;a[i]=0;continue;}
 var below=i+W;if(!t[below]||t[below]===3)move(i,below,Math.max(0,1.03-a[below]));
 var first=reverse?-1:1;for(var j=0;j<2;j++){var side=i+(j?-first:first);move(i,side,Math.max(0,(a[i]-a[side])*.25));}
 if(a[i]>1.04)move(i,i-W,(a[i]-1.04)*.3);
 }}
 for(var n=0;n<s.stars.length;n++){var p=s.stars[n];if(p.got)continue;var wet=0;for(var yy=p.y-3;yy<=p.y+3;yy++)for(var xx=p.x-3;xx<=p.x+3;xx++)wet+=a[yy*W+xx];p.wet+=Math.min(wet,.7);if(p.wet>=2.5)p.got=true;}
}
function mass(s){var sum=s.collected+s.lost;for(var i=0;i<N;i++)sum+=s.water[i];return sum;}
root.SpringFluid={make:make,dig:dig,stroke:stroke,step:step,mass:mass,W:W,H:H};
if(typeof module!=='undefined')module.exports=root.SpringFluid;
})(typeof window!=='undefined'?window:globalThis);
