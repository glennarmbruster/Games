/* Compact original vector illustrations: no downloaded photograph pack. */
(function(){'use strict';
var original=PWScenes.svg, names=['alpine','canal','rail','reef'], titles=['Alpine Hideaway','Canal Café','Desert Express','Coral Lagoon'];
names.forEach(function(k,i){PWScenes.NAMES[k]=titles[i];});window.PWGallery={image:function(k){return names.indexOf(k)>=0?'assets/'+k+'-v1.webp':null;}};
var make=PW.makeLevel;PW.makeLevel=function(n){var spec=make(n);if(n%3!==0)spec.kind=names[(n-1)%names.length];return spec;};
function scene(kind,seed,W,H){var r=PW.rng(seed),s='',d='<linearGradient id="sky" x2="0" y2="1"><stop stop-color="#388fae"/><stop offset="1" stop-color="#f8dbac"/></linearGradient><linearGradient id="water" x2="0.2" y2="1"><stop stop-color="#91d5cb"/><stop offset=".5" stop-color="#329792"/><stop offset="1" stop-color="#174c63"/></linearGradient><linearGradient id="wall" x2="1" y2="1"><stop stop-color="#fce0b2"/><stop offset="1" stop-color="#bb784a"/></linearGradient><linearGradient id="roof" x2=".5" y2="1"><stop stop-color="#ef8a62"/><stop offset="1" stop-color="#743c43"/></linearGradient><radialGradient id="light"><stop stop-color="#fff1ca" stop-opacity=".5"/><stop offset="1" stop-color="#fff1ca" stop-opacity="0"/></radialGradient><linearGradient id="dark" x2="1" y2="1"><stop stop-color="#374b53"/><stop offset="1" stop-color="#172d35"/></linearGradient>';
function el(tag,a){s+='<'+tag+' '+a+'/>';}
function rect(x,y,w,h,c,extra){el('rect','x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'" '+(extra||''));}
function path(p,c,extra){el('path','d="'+p+'" fill="'+c+'" '+(extra||''));}
function line(x,y,x2,y2,c,w){path('M'+x+' '+y+'L'+x2+' '+y2,'none','stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round"');}
function circle(x,y,rr,c){el('circle','cx="'+x+'" cy="'+y+'" r="'+rr+'" fill="'+c+'"');}
function ellipse(x,y,rx,ry,c){el('ellipse','cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+c+'"');}
function pine(x,y,h){line(x,y,x,y-h,'#6c5547',h*.045);for(var j=0;j<4;j++){var yy=y-h+j*h*.21;path('M'+x+' '+yy+'l'+(-h*(.12+j*.035))+' '+h*.38+'h'+h*(.24+j*.07)+'Z',j%2?'#38665c':'#244d48');}}
function windowAt(x,y,w,h){rect(x-2,y-2,w+4,h+4,'#f5dbb0');rect(x,y,w,h,'#214954');path('M'+x+' '+(y+h)+'L'+(x+w)+' '+y+'v'+h+'Z','#406b76');line(x+w*.5,y,x+w*.5,y+h,'#ebbf8b',2);line(x,y+h*.5,x+w,y+h*.5,'#ebbf8b',2);}
rect(0,0,W,H,'url(#sky)');circle(W*.76,H*.16,W*.09,'#ffdf9f');circle(W*.76,H*.16,W*.3,'url(#light)');
for(var i=0;i<9;i++){var x=r()*W,y=H*(.06+r()*.27);ellipse(x,y,20+r()*50,3+r()*7,'#ffffff55');}
if(kind==='alpine'){
for(i=0;i<7;i++){x=i*W/5-W*.1;var peak=H*(.18+r()*.13);path('M'+(x-W*.3)+' '+H*.58+'L'+x+' '+peak+'L'+(x+W*.35)+' '+H*.58+'Z',i%2?'#91a9b0':'#718f9c');path('M'+x+' '+peak+'l'+(-W*.075)+' '+H*.10+'l'+W*.05+' '+(-H*.022)+'l'+W*.03+' '+H*.04+'l'+W*.015+' '+(-H*.052)+'l'+W*.07+' '+H*.04+'Z','#f2ede1');}
path('M0 '+H*.53+'Q'+W*.25+' '+H*.42+' '+W*.6+' '+H*.58+'T'+W+' '+H*.52+'V'+H+'H0Z','#659779');rect(0,H*.70,W,H*.3,'url(#water)');
for(i=0;i<18;i++)pine(r()*W,H*(.57+r()*.14),H*(.06+r()*.12));
x=W*.18;y=H*.51;var bw=W*.55,bh=H*.18;ellipse(x+bw*.5,y+bh+7,bw*.64,15,'#183f4e66');rect(x,y,bw,bh,'url(#wall)');path('M'+(x-15)+' '+y+'L'+(x+bw*.5)+' '+(y-H*.13)+'L'+(x+bw+16)+' '+y+'Z','url(#roof)','stroke="#572f35" stroke-width="4"');
for(i=0;i<8;i++)line(x,y+i*bh/8,x+bw,y+i*bh/8,'#8f573d55',2);for(i=0;i<3;i++)windowAt(x+bw*(.10+i*.30),y+bh*.26,bw*.18,bh*.34);rect(x+bw*.42,y+bh*.57,bw*.18,bh*.43,'#533e35');circle(x+bw*.56,y+bh*.78,2,'#e9b869');
path('M'+W*.16+' '+H*.75+'L'+W*.7+' '+H*.72+'L'+W*.83+' '+H*.84+'L'+W*.18+' '+H*.88+'Z','#b38758');for(i=0;i<9;i++)line(W*(.2+i*.064),H*.76,W*(.22+i*.064),H*.855,'#604c3c',2);
for(i=0;i<40;i++){x=r()*W;y=H*(.85+r()*.15);line(x,y,x+8+r()*25,y,'#a8ddcb77',1+r()*2);}path('M'+W*.2+' '+H*.94+'q'+W*.22+' '+H*.08+' '+W*.39+' '+(-H*.03)+'Z','#b9563e');line(W*.34,H*.86,W*.58,H*.97,'#dcc29a',4);
}else if(kind==='canal'){
rect(0,H*.63,W,H*.37,'url(#water)');var colors=['#db9777','#edc57d','#9ab9a0','#c48379','#e3cfaa'];
for(i=0;i<5;i++){x=i*W/4-W*.10;var top=H*(.22+r()*.12),ww=W*.25;rect(x+4,top+6,ww,H*.38,'#29495544');rect(x,top,ww-3,H*.64-top,colors[i]);path('M'+(x-3)+' '+top+'l'+ww*.5+' '+(-H*.065)+'l'+ww*.5+' '+H*.065+'Z','url(#roof)');rect(x,top+H*.014,ww-3,5,'#fff0d3');for(var row=0;row<3;row++)for(var col=0;col<2;col++){var wx=x+ww*(.12+col*.45),wy=top+H*.04+row*H*.085;windowAt(wx,wy,ww*.24,H*.046);rect(wx-5,wy,4,H*.047,'#3e6a62');rect(wx+ww*.24+2,wy,4,H*.047,'#3e6a62');}rect(x+ww*.34,H*.56,ww*.32,H*.08,'#23434c','rx="15"');}
path('M0 '+H*.64+'Q'+W*.5+' '+H*.55+' '+W+' '+H*.64+'L'+W+' '+H*.7+'Q'+W*.5+' '+H*.61+' 0 '+H*.7+'Z','#d9bea0');
for(i=0;i<12;i++){x=i*W/11;line(x,H*.635-24*Math.sin(i/11*Math.PI),x,H*.59-24*Math.sin(i/11*Math.PI),'#4c5650',3);}path('M0 '+H*.59+'Q'+W*.5+' '+H*.50+' '+W+' '+H*.59,'none','stroke="#59655b" stroke-width="4"');
for(i=0;i<70;i++){x=r()*W;y=H*(.70+r()*.3);line(x,y,x+4+r()*25,y,i%3?'#a9d9c755':'#efc79755',2);}
path('M'+W*.1+' '+H*.84+'Q'+W*.32+' '+H*.97+' '+W*.70+' '+H*.81+'Q'+W*.35+' '+H*.91+' '+W*.1+' '+H*.84+'Z','#24373d');line(W*.4,H*.81,W*.65,H*.91,'#7f573c',4);
for(i=0;i<8;i++){circle(W*(.04+i*.025),H*.92+r()*20,9,'#5c8251');circle(W*(.04+i*.025),H*.91+r()*16,4,i%2?'#e9ae83':'#cb5d72');}
}else if(kind==='rail'){
for(i=0;i<4;i++){var yy=H*(.32+i*.12);path('M0 '+yy+'Q'+W*.3+' '+(yy-H*.14)+' '+W*.6+' '+yy+'T'+W+' '+yy+'V'+H+'H0Z',['#c9a288','#b87966','#9d6553','#dfa977'][i]);}
for(i=0;i<11;i++){x=r()*W;y=H*(.57+r()*.25);line(x,y,x,y-H*.06,'#506b4b',6);path('M'+(x-8)+' '+(y-H*.05)+'v'+H*.025+'h16v'+(-H*.04),'none','stroke="#506b4b" stroke-width="5" stroke-linecap="round"');}
path('M0 '+H*.98+'L'+W*.8+' '+H*.64+'L'+W+' '+H*.68+'L'+W*.3+' '+H+'Z','#705c4d');for(i=0;i<16;i++){var t=i/16;line(W*(.02+t*.82),H*(.98-t*.32),W*(.32+t*.66),H*(1-t*.31),'#b99878',4);}
line(0,H*.96,W*.88,H*.66,'#d0d5cc',4);line(W*.28,H,W,H*.69,'#d0d5cc',4);
s+='<g transform="translate('+W*.11+' '+H*.70+') rotate(-13)">';rect(0,0,W*.52,H*.125,'url(#dark)','rx="9"');rect(-3,H*.075,W*.57,H*.024,'#d6ab54');rect(W*.32,-H*.06,W*.21,H*.1,'#c05f46','rx="4"');windowAt(W*.36,-H*.048,W*.11,H*.04);rect(W*.055,-H*.055,W*.055,H*.058,'#253f47');for(i=0;i<4;i++){circle(W*(.055+i*.13),H*.13,W*.052,'#172c33');circle(W*(.055+i*.13),H*.13,W*.035,'#9eaca2');circle(W*(.055+i*.13),H*.13,W*.010,'#dbb064');}s+='</g>';
for(i=0;i<7;i++)ellipse(W*(.12+i*.07),H*(.65-i*.035),12+i*4,8+i*3,'#f5e4cb88');
}else{
rect(0,0,W,H,'url(#water)');for(i=0;i<7;i++)path('M'+W*(.1+i*.15)+' 0L'+W*(.3+i*.18)+' '+H+'L'+W*(.5+i*.18)+' '+H+'Z','#d6ffe9','opacity=".06"');
path('M0 '+H*.8+'Q'+W*.3+' '+H*.66+' '+W*.6+' '+H*.84+'T'+W+' '+H*.76+'V'+H+'H0Z','#d3cca1');
for(i=0;i<17;i++){x=r()*W;y=H*(.75+r()*.24);var h=H*(.06+r()*.19),color=['#cf746c','#da9b66','#96618f','#649e85'][i%4];line(x,y,x,y-h,color,5);for(var j=0;j<4;j++){var sy=y-h*j/5;line(x,sy,x+(j%2?-1:1)*(12+j*4),sy-h*.25,color,4);}ellipse(x,y,12,4,'#576c6455');}
for(i=0;i<13;i++){x=W*(.12+r()*.77);y=H*(.13+r()*.52);var sz=9+r()*12;s+='<g transform="translate('+x+' '+y+') rotate('+(r()*30-15)+')">';path('M-8 0l'+(-sz*.9)+' '+(-sz*.6)+'v'+sz*1.2+'Z','#dc9b58');ellipse(0,0,sz,sz*.55,['#efc36a','#f19370','#b9d3b9'][i%3]);for(j=0;j<3;j++)line(-sz*.4+j*sz*.4,-sz*.4,-sz*.4+j*sz*.4,sz*.4,'#3c718366',2);circle(sz*.62,-sz*.1,2,'#173f50');s+='</g>';}
for(i=0;i<35;i++){x=r()*W;y=r()*H;el('circle','cx="'+x+'" cy="'+y+'" r="'+(1+r()*3)+'" fill="none" stroke="#c8e9d866"');}
}
// Fine paper flecks give tactile detail, generated once per puzzle.
for(i=0;i<320;i++){x=r()*W;y=r()*H;rect(x,y,.6+r()*1.2,.6+r()*1.2,i%2?'#fff6df':'#1c4350','opacity=".08"');}
return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><defs>'+d+'</defs>'+s.replace(/(fill|stroke)="#([0-9a-f]{6})([0-9a-f]{2})"/gi,function(_,a,rgb,alpha){return a+'="#'+rgb+'" '+a+'-opacity="'+(parseInt(alpha,16)/255)+'"';})+'</svg>';}
PWScenes.svg=function(k,seed,c,r,w,h){if(names.indexOf(k)<0)return original(k,seed,c,r,w,h);return scene(k,seed,w||c*100,h||r*100);};
})();
