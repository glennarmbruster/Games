(function(){'use strict';
SB.legacyLevelSpec=SB.levelSpec;SB.legacyDailySpec=SB.dailySpec;SB.LEVEL_SCHEME=5;
SB.studioSpec=function(n){return {scheme:5,object:'furnished',detail:2,target:156,colors:Math.min(9,5+Math.floor((n-1)/2)),blur:n<3?4:8,shuffle:n<3?2:4,deep:.68,careless:n<3?.55:.35,seed:SB.mix32(n*731943+417)};};
SB.levelSpec=function(n){var s=SB.legacyLevelSpec(n);s.scheme=5;if(s.object==='house'){s.object='furnished';s.detail=2;s.target=Math.max(156,s.target);}return s;};
SB.dailySpec=function(day){var s=SB.legacyDailySpec(day);s.scheme=5;if(s.object==='house'){s.object='furnished';s.detail=2;s.target=156;}return s;};
})();
