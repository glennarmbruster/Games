importScripts('rules.js');
onmessage=function(e){try{postMessage({n:e.data,level:OP.makeLevel(e.data)});}catch(err){postMessage({n:e.data,error:String(err)});}};
