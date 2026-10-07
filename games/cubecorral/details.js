(function(){'use strict';
CC.legacyLevelSpec=CC.levelSpec;
var generate=CC.newGame;CC.newGame=function(spec){if(spec.gallery&&CC.galleryBoards){return CC.unpack(JSON.parse(JSON.stringify(CC.galleryBoards[spec.gallery-1])));}return generate(spec);};
CC.studioSpec=function(n){var s=CC.legacyLevelSpec(8+n);s.gallery=n;s.model=CCModels.DETAIL[(n-1)%6];s.res=1.55;s.maxCubes=2600;s.fill=.82;s.design=5;s.inner=2;s.amin=20;s.amax=55;s.careless=.65;s.attempts=3;s.decoy=.8;s.seed=CC.mix32(n*924173+19);return s;};
CC.levelSpec=function(n){var s=CC.legacyLevelSpec(n);if(n%3===1){s.model=CCModels.DETAIL[Math.floor((n-1)/3)%6];s.maxCubes=Math.max(1800,s.maxCubes);s.res=Math.max(1.4,s.res);s.fill=.8;}return s;};
})();
