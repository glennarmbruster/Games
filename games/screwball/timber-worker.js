importScripts('timber-rules.js');
onmessage=function(e){
 const {id,type,level,state,number}=e.data;
 try{
  if(type==='hint'){
   // Reuse the verified witness whenever this state lies on its route.
   let at=TimberRules.initial(level),result=null;
   for(let i=0;i<(level.solution||[]).length;i++){
    if(TimberRules.key(at)===TimberRules.key(state)){result={path:level.solution.slice(i),visited:0};break;}
    at=TimberRules.move(level,at,...level.solution[i]);if(!at)break;
   }
   if(!result)result=TimberRules.solve(level,state,18000);
   postMessage({id,result});
  }else{
   // Vary certified masterwork structures, then replay the complete solution
   // against the new screw-stop geometry before accepting any endless board.
   self.window=self;importScripts('timber-levels.js');
   const masters=TIMBER_LEVELS.filter(l=>l.planks.length===24);
   for(let seed=0;seed<1000;seed++){
    const base=masters[(number*17+seed*7)%masters.length];
    const l=TimberRules.remix(base,number,seed);
    if(l){postMessage({id,level:l});return;}
   }
   postMessage({id,error:'This board needs another try.'});
  }
 }catch(err){postMessage({id,error:String(err.message)});}
};
