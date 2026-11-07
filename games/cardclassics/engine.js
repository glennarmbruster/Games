/* Pure rules shared by the UI and rule tests. */
const Rules=(()=>{
const suits=['♣','♦','♥','♠'];
const deck=(pin=false)=>{let d=[];for(let k=0;k<(pin?2:1);k++)for(let s=0;s<4;s++)for(let r of pin?[9,11,12,13,10,1]:Array.from({length:13},(_,i)=>i+1))d.push({id:`${k}-${s}-${r}`,s,r});return d};
const shuffle=(d,rng=Math.random)=>{d=[...d];for(let i=d.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d};
const value=c=>Math.min(c.r,10),sum=h=>h.reduce((n,c)=>n+value(c),0);
const label=c=>({1:'A',11:'J',12:'Q',13:'K'}[c.r]||c.r)+suits[c.s];
const valid=h=>h.length>=3&&((h.length<=4&&h.every(c=>c.r===h[0].r)&&new Set(h.map(c=>c.s)).size===h.length)||(h.every(c=>c.s===h[0].s)&&[...h].sort((a,b)=>a.r-b.r).every((c,i,a)=>!i||c.r===a[i-1].r+1)));
function partitions(h){let candidates=[];for(let m=1;m<(1<<h.length);m++){let a=h.filter((_,i)=>m>>i&1);if(valid(a))candidates.push({m,a})}let memo=new Map();function solve(mask){if(memo.has(mask))return memo.get(mask);let out={dead:h.filter((_,i)=>mask>>i&1),melds:[]};out.points=sum(out.dead);for(let c of candidates)if((mask&c.m)===c.m){let b=solve(mask^c.m);if(b.points<out.points)out={dead:b.dead,points:b.points,melds:[c.a,...b.melds]}}memo.set(mask,out);return out}return solve((1<<h.length)-1)}
function discardChoice(h,forbidden){let best;h.forEach((c,i)=>{if(c.id===forbidden)return;let p=partitions(h.filter((_,j)=>i!==j));let score=p.points*100-value(c);if(!best||score<best.score)best={i,p,score}});return best}
function layoff(dead,melds){let best={dead,points:sum(dead)};for(let i=0;i<dead.length;i++)for(let j=0;j<melds.length;j++)if(valid([...melds[j],dead[i]])){let ms=melds.map((m,k)=>k===j?[...m,dead[i]]:m);let b=layoff(dead.filter((_,k)=>k!==i),ms);if(b.points<best.points)best=b}return best}
function defense(h,melds){let best=layoff(h,melds);for(let mask=1;mask<(1<<h.length);mask++){let m=h.filter((_,i)=>mask>>i&1);if(valid(m)){let b=defense(h.filter((_,i)=>!(mask>>i&1)),melds);if(b.points<best.points)best=b}}return best}
const power=c=>[9,11,12,13,10,1].indexOf(c.r);
const beats=(a,b,trump)=>a.s===b.s?power(a)>power(b):a.s===trump;
function legal(h,trick,trump){if(!trick.length)return h;let lead=trick[0].c.s,win=trick.reduce((w,x)=>beats(x.c,w.c,trump)?x:w);let same=h.filter(c=>c.s===lead);let allowed=same.length?same:h.filter(c=>c.s===trump);if(!allowed.length)return h;let higher=allowed.filter(c=>beats(c,win.c,trump));return higher.length?higher:allowed}
function meldScore(h,t){let count=(s,r)=>h.filter(c=>c.s===s&&c.r===r).length;let rows=[];let add=(name,n)=>{if(n)rows.push({name,n})};let runs=Math.min(...[1,10,13,12,11].map(r=>count(t,r)));add('Trump run',runs===2?150:runs*15);for(let s=0;s<4;s++){let n=Math.min(count(s,13),count(s,12));add(suits[s]+' marriage',Math.max(0,n-(s===t?runs:0))*(s===t?4:2))}add('Dix (trump nine)',count(t,9));for(let [r,n] of [[1,10],[13,8],[12,6],[11,4]]){let qty=Math.min(...suits.map((_,s)=>count(s,r)));add(({1:'Aces',13:'Kings',12:'Queens',11:'Jacks'}[r])+' around',qty===2?n*10:qty*n)}let pin=Math.min(count(3,12),count(1,11));add('Pinochle',pin===2?30:pin*4);return {points:rows.reduce((a,r)=>a+r.n,0),rows}}
return {suits,deck,shuffle,value,sum,label,valid,partitions,discardChoice,layoff,defense,power,beats,legal,meldScore};})();
if(typeof module!=='undefined')module.exports=Rules;
