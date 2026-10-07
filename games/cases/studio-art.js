/* Case Closed studio artwork. Rendering only: game values and offers stay in CL. */
(function(){
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function picture(file,klass){return '<svg viewBox="0 0 120 92" class="'+klass+'" aria-hidden="true"><image href="assets/'+file+'.webp" width="120" height="92" preserveAspectRatio="none"/></svg>';}
CA.caseSVG=function(num,opts){var s=picture('case-closed','casesvg');return s.replace('</svg>','<rect x="36" y="40" width="48" height="34" rx="3" fill="'+(opts&&opts.mine?'#d7bb7b':'#202a30')+'" stroke="#d9c99e" stroke-width=".7"/><text x="60" y="66" text-anchor="middle" font-family="Georgia,serif" font-size="30" font-weight="600" fill="'+(opts&&opts.mine?'#26323a':'#fff2d5')+'">'+esc(num)+'</text></svg>');};
CA.openSVG=function(label,big){return picture('case-open','casesvg').replace('</svg>','<rect x="14" y="54" width="92" height="25" rx="2" fill="#151c23" fill-opacity=".92"/><text x="60" y="72" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="'+(label.length>6?17:20)+'" fill="'+(big?'#edd49a':'#c1dfeb')+'">'+esc(label)+'</text></svg>');};
CA.bigInside=function(label,big){return CA.openSVG(label,big);};
CA.bigLid=function(num,mine){return CA.caseSVG(num,{mine:mine}).replace('class="casesvg"','class="casesvg lidsvg"');};
CA.host=function(){return '<svg viewBox="0 0 100 100" aria-hidden="true"><image href="assets/host.webp" width="100" height="100"/></svg>';};
CA.banker=function(){return '<svg viewBox="0 0 120 84" class="bankersvg" aria-hidden="true"><image href="assets/banker.webp" width="120" height="84" preserveAspectRatio="xMidYMid slice"/></svg>';};
CA.logo=function(){return CA.caseSVG('CC',{mine:true});};
})();
