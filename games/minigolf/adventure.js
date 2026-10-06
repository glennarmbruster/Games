/* Coastal Adventure: authored routes, using the original MG collision/shot engine. */
(function(){
  var H=MG.buildHole,R=function(x,y,X,Y){return [[x,y],[X,y],[X,Y],[x,Y]];};
  function hole(o){var h=H(o);h.tip=o.tip;return h;}
  var broad=[[26,12],[72,12],[86,26],[86,144],[72,166],[28,166],[14,150],[14,28]];
  var holes=[
    hole({name:'Welcome Cove',par:2,tee:[29,146],cup:[69,32],outline:[[28,14],[67,14],[83,30],[83,61],[65,82],[80,112],[78,148],[62,165],[29,165],[15,149],[15,113],[34,86],[16,59],[16,29]],walls:[[44,108,65,88]],sand:[[[16,37],[29,32],[34,53],[21,65]]],tip:'A gentle bank opens the cove.'}),
    hole({name:'Split Decision',par:3,tee:[50,150],cup:[50,27],outline:broad,blocks:[[41,57,59,116]],sand:[R(60,76,86,91)],water:[R(14,64,27,101)],tip:'Left is narrow; right has a sand trap.'}),
    hole({name:'Billiard Bay',par:3,tee:[27,148],cup:[72,31],outline:[[14,164],[14,26],[29,12],[72,12],[86,27],[86,164]],walls:[[14,107,59,82],[43,62,86,62]],tip:'Two angled banks, or patient lay-ups.'}),
    hole({name:'Lagoon Crossing',par:3,tee:[30,148],cup:[69,29],outline:broad,water:[R(14,63,44,115),R(57,63,86,115)],sand:[R(44,116,57,126)],tip:'Line up the bridge before committing.'}),
    hole({name:'Driftwood Run',par:3,tee:[29,148],cup:[71,29],outline:[[17,166],[17,94],[37,70],[37,16],[83,16],[83,76],[61,100],[61,166]],blocks:[[37,106,49,128]],posts:[[55,57,3]],tip:'Follow the bend; use the inner bank.'}),
    hole({name:'Windmill Court',par:3,tee:[50,148],cup:[50,29],outline:broad,mills:[{x:50,y:83,len:15,speed:1.2,blades:4,gap:12,hw:12}],sand:[R(14,72,29,97),R(71,72,86,97)],tip:'Time the center, or take the sandy bypass.'}),
    hole({name:'Shipwreck',par:4,tee:[26,148],cup:[71,29],outline:broad,walls:(function(){var p=[[46,54],[59,70],[64,93],[59,116],[49,129],[38,119],[34,94],[37,70]];return p.map(function(q,i){var n=p[(i+1)%p.length];return [q[0],q[1],n[0],n[1]];});})(),posts:[[72,118,2.5]],tip:'The hull shelters a shortcut around the bow.'}),
    hole({name:'Tidal Gate',par:3,tee:[50,151],cup:[68,28],outline:broad,walls:[[14,89,37,89],[63,89,86,89]],movers:[{x:27,y:86,w:14,h:6,dx:33,dy:0,speed:.42}],sand:[R(14,30,43,44)],tip:'Wait for the opening, then favor the right.'}),
    hole({name:'Smuggler’s Cut',par:3,tee:[26,147],cup:[73,29],outline:broad,water:[R(14,68,60,99)],walls:[[60,68,60,99]],portals:[{a:[32,116],b:[30,49],r:3.8}],sand:[R(63,69,86,94)],tip:'Take the tunnel or the long coastal route.'}),
    hole({name:'Crescent Beach',par:4,tee:[29,147],cup:[72,146],outline:[[17,164],[13,142],[13,57],[24,28],[41,14],[63,14],[82,31],[88,58],[88,145],[80,164],[62,164],[62,68],[56,51],[44,51],[37,69],[37,164]],sand:[[[14,56],[27,47],[38,59],[37,75],[14,80]]],tip:'Three measured shots around the crescent.'}),
    hole({name:'Kraken’s Reach',par:3,tee:[50,150],cup:[50,27],outline:broad,posts:[[50,88,7]],bumpers:[[39,119,4],[62,91,4],[38,62,4]],water:[R(14,78,25,110),R(75,45,86,78)],tip:'Buoys kick hard—bank around them or use the boost.'}),
    hole({name:'Dune Express',par:3,tee:[26,147],cup:[72,29],outline:broad,sand:[[[14,91],[44,68],[65,80],[86,61],[86,91],[62,110],[45,96],[14,120]]],slopes:[{poly:R(20,124,79,142),fx:10,fy:-8}],tip:'A diagonal sandy ridge rewards a firm, clean line.'}),
    hole({name:'Twin Harbors',par:3,tee:[29,145],cup:[70,29],outline:[[16,164],[16,111],[39,87],[16,65],[16,14],[84,14],[84,65],[61,87],[84,111],[84,164]],water:[R(16,14,37,44),R(63,134,84,164)],posts:[[50,87,2.5]],tip:'Choose a side of the neck before the upper harbor.'}),
    hole({name:'Cross Current',par:3,tee:[50,150],cup:[67,28],outline:broad,slopes:[{poly:R(15,106,85,131),fx:16,fy:0},{poly:R(15,58,85,83),fx:-14,fy:0}],water:[R(72,107,86,130),R(14,59,27,82)],tip:'Opposing slopes push toward the water.'}),
    hole({name:'The Switchback',par:4,tee:[27,148],cup:[71,28],outline:[[14,164],[14,99],[58,99],[58,68],[14,68],[14,14],[86,14],[86,43],[39,43],[39,46],[83,46],[83,123],[39,123],[39,164]],tip:'Control your stopping distance through three bends.'}),
    hole({name:'Keeper’s Garden',par:3,tee:[29,149],cup:[71,28],outline:broad,blocks:[[37,73,61,95]],deco:[{t:'lighthouse',x:49,y:84}],posts:[[29,59,3],[72,114,3]],sand:[R(63,64,86,88)],water:[R(14,88,26,111)],tip:'Two routes around the lighthouse garden.'}),
    hole({name:'Pearl Basin',par:2,tee:[50,151],cup:[50,57],outline:[[33,165],[67,165],[67,113],[83,95],[88,62],[80,32],[66,14],[34,14],[20,32],[12,62],[17,95],[33,113]],slopes:[{bowl:[50,57,30],k:18}],bumpers:[[37,101,3.2],[63,101,3.2]],sand:[R(44,119,56,132)],tip:'Get past the sentries and let the basin help.'}),
    hole({name:'Last Light',par:4,tee:[28,151],cup:[70,27],outline:broad,water:[R(39,97,60,134),R(14,48,37,69)],walls:[[14,83,48,83],[65,83,86,83]],movers:[{x:40,y:79,w:10,h:8,dx:20,dy:0,speed:.38}],portals:[{a:[73,125],b:[70,56],r:3.3}],sand:[R(60,135,86,145)],tip:'A narrow gate or a precise tunnel shot to the finish.'})
  ];
  holes[3].deco.push({t:'bridge',r:[44,63,57,115]});
  holes[6].deco.push({t:'ship',poly:[[46,54],[59,70],[64,93],[59,116],[49,129],[38,119],[34,94],[37,70]]});
  holes[8].deco.push({t:'caves'});
  holes[17].deco.push({t:'cascade',r:[39,97,60,134]});
  holes[10].deco.push({t:'octopus',x:50,y:88,r:7});
  MG.COURSES={classic:MG.HOLES,adventure:holes};
})();
