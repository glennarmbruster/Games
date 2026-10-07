/* Goobs-Games service worker: keeps the menu and every game on the phone for offline play.
   Each part has its own version and its own cache. To publish an update, bump ONLY the
   version of the part that changed; unchanged parts are not downloaded again. */
const VERSIONS = {
  shell: '2.96.0',     // menu, manifest, icons, /shared (ads, themes, storage)
  zoodoku: '1.9.0',
  woodpile: '1.2.0',
  patchwork: '2.2.0',
  cubecorral: '3.3.0',
  screwball: '2.4.0',
  skeehop: '1.4.0',
  merge: '1.2.0',
  tapaway: '1.2.0',
  homerun: '1.6.1',
  match3: '1.1.0',
  snake: '1.2.0',
  solitaire: '1.1.1',
  meanbirds: '1.2.0',
  aliens: '1.2.0',
  worddice: '1.2.0',
  digger: '1.2.0',
  blocks: '1.3.0',
  maze: '1.1.0',
  mahjong: '1.3.1',
  dice: '1.2.0',
  daily: '1.3.3',
  mines: '1.1.0',
  bubbles: '1.4.0',
  bricks: '1.3.2',
  topple: '1.9.0',
  barrage: '1.6.0',
  siege: '1.3.0',
  hoops: '1.3.1',
  beacon: '0.4.0',
  sort: '1.2.0',
  triple: '1.1.0',
  pinball: '2.1.0',
  parking: '1.1.0',
  minigolf: '2.1.0',
  board: '1.1.1',
  buzz: '2.2.0',
  golf: '0.5.1',
  shelf: '1.2.0',
  castle: '1.7.0',
  outpost: '0.6.1',
  getout: '0.19.0',
  stranded: '1.0.0',
  sudoku: '0.1.0',
  wordwheel: '0.3.0',
  trivia: '0.3.0',
  links: '0.2.0',
  bowling: '0.3.0',
  deck: '0.3.1',
  wordboard: '0.1.2',
  nonogram: '0.1.0',
  getout2: '1.1.0',
  huddle: '0.1.0',
  wickway: '1.0.0',
  pegs: '0.3.0',
  perch: '0.1.0',
  knotty: '0.1.0',
  casino: '0.1.1',
  spotdiff: '0.4.0',
  hidden: '0.3.0',
  cases: '0.1.0',
  spin: '0.1.1',
  three: '0.186.1',  // shared 3D library; bump only when three.js itself changes
  planck: '1.5.0',   // shared 2D physics library (planck.js); bump only when planck itself changes
  cannon: '0.20.0'   // shared 3D physics library (cannon-es) for Number Nook's Chain Cube
};
const GROUPS = {
  stranded: ['games/stranded/', 'games/stranded/index.html', 'games/stranded/engine.js', 'games/stranded/game.js'],
  shell: [
    './', 'index.html', 'manifest.json',
    'icons/games/stranded-v1.webp', 'icons/games/aliens-v1.webp', 'icons/games/barrage-v1.webp', 'icons/games/beacon-v1.webp', 'icons/games/blocks-v1.webp', 'icons/games/board-v1.webp', 'icons/games/bowling-v1.webp', 'icons/games/bricks-v1.webp', 'icons/games/bubbles-v1.webp', 'icons/games/buzz-v1.webp', 'icons/games/cases-v1.webp', 'icons/games/casino-v1.webp', 'icons/games/castle-v1.webp', 'icons/games/cubecorral-v1.webp', 'icons/games/daily-v1.webp', 'icons/games/deck-v1.webp', 'icons/games/dice-v1.webp', 'icons/games/digger-v1.webp', 'icons/games/getout-v1.webp', 'icons/games/getout2-v1.webp', 'icons/games/golf-v1.webp', 'icons/games/hidden-v1.webp', 'icons/games/homerun-v1.webp', 'icons/games/hoops-v1.webp', 'icons/games/huddle-v1.webp', 'icons/games/knotty-v1.webp', 'icons/games/links-v1.webp', 'icons/games/mahjong-v1.webp', 'icons/games/match3-v1.webp', 'icons/games/maze-v1.webp', 'icons/games/meanbirds-v1.webp', 'icons/games/merge-v1.webp', 'icons/games/mines-v1.webp', 'icons/games/minigolf-v1.webp', 'icons/games/nonogram-v1.webp', 'icons/games/outpost-v1.webp', 'icons/games/parking-v1.webp', 'icons/games/patchwork-v1.webp', 'icons/games/pegs-v1.webp', 'icons/games/perch-v1.webp', 'icons/games/pinball-v1.webp', 'icons/games/pinball-v2.webp', 'icons/games/screwball-v1.webp', 'icons/games/shelf-v1.webp', 'icons/games/siege-v1.webp', 'icons/games/skeehop-v1.webp', 'icons/games/snake-v1.webp', 'icons/games/solitaire-v1.webp', 'icons/games/sort-v1.webp', 'icons/games/spin-v1.webp', 'icons/games/spotdiff-v1.webp', 'icons/games/sudoku-v1.webp', 'icons/games/tapaway-v1.webp', 'icons/games/topple-v1.webp', 'icons/games/triple-v1.webp', 'icons/games/trivia-v1.webp', 'icons/games/wickway-v1.webp', 'icons/games/woodpile-v1.webp', 'icons/games/wordboard-v1.webp', 'icons/games/worddice-v1.webp', 'icons/games/wordwheel-v1.webp', 'icons/games/zoodoku-v1.webp',
    'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
    'shared/goobs.js', 'shared/goobs.css', 'shared/collection.css', 'shared/ads.js', 'shared/animals.svg'
  ],
  zoodoku: ['games/zoodoku/', 'games/zoodoku/index.html'],
  woodpile: ['games/woodpile/', 'games/woodpile/index.html'],
  patchwork: ['games/patchwork/', 'games/patchwork/index.html'],
  cubecorral: ['games/cubecorral/', 'games/cubecorral/index.html'],
  screwball: ['games/screwball/', 'games/screwball/index.html'],
  skeehop: ['games/skeehop/', 'games/skeehop/index.html'],
  merge: ['games/merge/', 'games/merge/index.html'],
  tapaway: ['games/tapaway/', 'games/tapaway/index.html'],
  homerun: ['games/homerun/', 'games/homerun/index.html', 'games/homerun/assets/stadium-day-v1.webp', 'games/homerun/assets/stadium-dusk-v1.webp', 'games/homerun/assets/stadium-night-v1.webp', 'games/homerun/assets/turf-v1.webp', 'games/homerun/assets/grandstand-v1.webp', 'games/homerun/assets/pitching-machine-v1.webp', 'games/homerun/assets/batting-close-day-v3.webp', 'games/homerun/assets/batting-close-night-v3.webp'],
  match3: ['games/match3/', 'games/match3/index.html'],
  snake: ['games/snake/', 'games/snake/index.html'],
  solitaire: ['games/solitaire/', 'games/solitaire/index.html', 'games/solitaire/assets/cloth-v1.webp'],
  meanbirds: ['games/meanbirds/', 'games/meanbirds/index.html', 'games/meanbirds/assets/farm-v1.webp', 'games/meanbirds/assets/woods-v1.webp', 'games/meanbirds/assets/sea-v1.webp', 'games/meanbirds/assets/snow-v1.webp', 'games/meanbirds/assets/mine-v1.webp', 'games/meanbirds/assets/fair-v1.webp'],
  aliens: ['games/aliens/', 'games/aliens/index.html'],
  worddice: ['games/worddice/', 'games/worddice/index.html', 'games/worddice/assets/wood-v1.webp', 'games/worddice/words.txt'],
  digger: ['games/digger/', 'games/digger/index.html'],
  blocks: ['games/blocks/', 'games/blocks/index.html'],
  maze: ['games/maze/', 'games/maze/index.html'],
  mahjong: ['games/mahjong/', 'games/mahjong/index.html', 'games/mahjong/assets/cloth-v1.webp'],
  dice: ['games/dice/', 'games/dice/index.html'],
  daily: ['games/daily/', 'games/daily/index.html'],
  mines: ['games/mines/', 'games/mines/index.html'],
  bubbles: ['games/bubbles/', 'games/bubbles/index.html'],
  bricks: ['games/bricks/', 'games/bricks/index.html'],
  topple: ['games/topple/', 'games/topple/index.html', 'games/topple/assets/wood-v1.webp', 'games/topple/assets/fabric-v1.webp', 'games/topple/assets/grass-v1.webp', 'games/topple/assets/metal-v1.webp'],
  barrage: ['games/barrage/', 'games/barrage/index.html'],
  siege: ['games/siege/', 'games/siege/index.html'],
  hoops: ['games/hoops/', 'games/hoops/index.html', 'games/hoops/assets/sunny-yard-v1.webp', 'games/hoops/assets/blue-water-v1.webp'],
  beacon: ['games/beacon/', 'games/beacon/index.html'],
  sort: ['games/sort/', 'games/sort/index.html'],
  triple: ['games/triple/', 'games/triple/index.html'],
  pinball: ['games/pinball/', 'games/pinball/index.html', 'games/pinball/cabinet.js', 'games/pinball/assets/goober-playfield-v1.webp', 'games/pinball/assets/goober-playfield-v2.webp', 'games/pinball/assets/harbor-playfield-v1.webp'],
  parking: ['games/parking/', 'games/parking/index.html'],
  minigolf: ['games/minigolf/', 'games/minigolf/index.html', 'games/minigolf/course-art.js', 'games/minigolf/adventure.js', 'games/minigolf/assets/coastal-garden-v1.webp'],
  board: ['games/board/', 'games/board/index.html', 'games/board/assets/wood-v1.webp'],
  buzz: ['games/buzz/', 'games/buzz/index.html', 'games/buzz/assets/woodland-garden-v1.webp', 'games/buzz/assets/meadow-v1.webp', 'games/buzz/assets/brook-v1.webp', 'games/buzz/assets/biscuit-v1.webp', 'games/buzz/assets/hive-v1.webp', 'games/buzz/assets/bee-v1.webp'],
  golf: ['games/golf/', 'games/golf/index.html', 'games/golf/course-art.js', 'games/golf/assets/oak-v1.webp', 'games/golf/assets/pine-v1.webp', 'games/golf/assets/sky-v1.webp', 'games/golf/assets/canopy-v1.webp'],
  shelf: ['games/shelf/', 'games/shelf/index.html'],
  castle: ['games/castle/', 'games/castle/index.html'],
  outpost: ['games/outpost/', 'games/outpost/index.html', 'games/outpost/assets/meadow-v1.webp', 'games/outpost/assets/sand-v1.webp', 'games/outpost/assets/snow-v1.webp', 'games/outpost/assets/basalt-v1.webp', 'games/outpost/assets/spruce-v1.webp'],
  getout: ['games/getout/', 'games/getout/index.html', 'games/getout/materials.js', 'games/getout/assets/fabric-v1.webp', 'games/getout/assets/leather-v1.webp', 'games/getout/assets/plaster-v1.webp', 'games/getout/assets/wood-v1.webp', 'games/getout/study-art.js', 'games/getout/assets/study-door-v1.webp', 'games/getout/assets/study-shelf-v1.webp', 'games/getout/assets/study-desk-v1.webp', 'games/getout/assets/study-fire-v1.webp', 'games/getout/study-ui.css', 'games/getout/assets/study-coatz-v2.webp', 'games/getout/assets/study-doorz-v2.webp', 'games/getout/assets/study-drawer1-v2.webp', 'games/getout/assets/study-drawer2-v2.webp', 'games/getout/assets/study-clockz-v2.webp', 'games/getout/assets/study-deskz-v2.webp', 'games/getout/assets/study-hearth-v2.webp', 'games/getout/assets/study-bookopen-v2.webp', 'games/getout/assets/study-mantelz-v2.webp', 'games/getout/assets/study-globez-v2.webp', 'games/getout/assets/study-events-v2.webp', 'games/getout/assets/study-items-v2.webp', 'games/getout/assets/study-lane-v2.webp', 'games/getout/levels23-art.js', 'games/getout/assets/room3-ropez-v1.webp', 'games/getout/assets/room2-boothz-v1.webp', 'games/getout/assets/room2-counter-v1.webp', 'games/getout/assets/room2-counterz-v1.webp', 'games/getout/assets/room2-door-v1.webp', 'games/getout/assets/room2-doorz-v1.webp', 'games/getout/assets/room2-fusez-v1.webp', 'games/getout/assets/room2-gratez-v1.webp', 'games/getout/assets/room2-gumz-v1.webp', 'games/getout/assets/room2-juke-v1.webp', 'games/getout/assets/room2-jukez-v1.webp', 'games/getout/assets/room2-kitchen-v1.webp', 'games/getout/assets/room2-piez-v1.webp', 'games/getout/assets/room2-regz-v1.webp', 'games/getout/assets/room2-shakez-v1.webp', 'games/getout/assets/room2-wheelz-v1.webp', 'games/getout/assets/room3-cabz-v1.webp', 'games/getout/assets/room3-chestz-v1.webp', 'games/getout/assets/room3-desk-v1.webp', 'games/getout/assets/room3-deskz-v1.webp', 'games/getout/assets/room3-door-v1.webp', 'games/getout/assets/room3-doorz-v1.webp', 'games/getout/assets/room3-farview-v1.webp', 'games/getout/assets/room3-lens-v1.webp', 'games/getout/assets/room3-lensz-v1.webp', 'games/getout/assets/room3-lockerz-v1.webp', 'games/getout/assets/room3-scopez-v1.webp', 'games/getout/assets/room3-signalz-v1.webp', 'games/getout/assets/room3-window-open-v1.webp', 'games/getout/assets/room3-window-v1.webp'], 
  sudoku: ['games/sudoku/', 'games/sudoku/index.html'],
  wordwheel: ['games/wordwheel/', 'games/wordwheel/index.html', 'games/wordwheel/assets/coast-v1.webp', 'games/wordwheel/assets/mountains-v1.webp', 'games/wordwheel/assets/dunes-v1.webp', 'games/wordwheel/assets/hills-v1.webp', 'games/wordwheel/assets/wood-v1.webp'],
  trivia: ['games/trivia/', 'games/trivia/index.html', 'games/trivia/assets/quiet-cove-v1.webp', 'games/trivia/assets/coastal-dunes-v1.webp', 'games/trivia/assets/misty-headland-v1.webp', 'games/trivia/assets/harbor-dusk-v1.webp'],
  links: ['games/links/', 'games/links/index.html'],
  bowling: ['games/bowling/', 'games/bowling/index.html', 'games/bowling/assets/lane-grain-v1.webp'],
  deck: ['games/deck/', 'games/deck/index.html', 'games/deck/assets/teak-v1.webp', 'games/deck/assets/maritime-sky-v1.webp'],
  wordboard: ['games/wordboard/', 'games/wordboard/index.html', 'games/wordboard/assets/wood-v1.webp'],
  nonogram: ['games/nonogram/', 'games/nonogram/index.html'],
  getout2: ['games/getout2/', 'games/getout2/index.html', 'games/getout2/materials.js', 'games/getout2/assets/fabric-v1.webp', 'games/getout2/assets/leather-v1.webp', 'games/getout2/assets/plaster-v1.webp', 'games/getout2/assets/wood-v1.webp'],
  huddle: ['games/huddle/', 'games/huddle/index.html'],
  wickway: ['games/wickway/', 'games/wickway/index.html'],
  pegs: ['games/pegs/', 'games/pegs/index.html', 'games/pegs/photo-art.js', 'games/pegs/assets/beach-v1.webp', 'games/pegs/assets/blossom-v1.webp', 'games/pegs/assets/canyon-v1.webp', 'games/pegs/assets/coral-v1.webp', 'games/pegs/assets/deck-v1.webp', 'games/pegs/assets/ember-v1.webp', 'games/pegs/assets/fire-v1.webp', 'games/pegs/assets/jungle-v1.webp', 'games/pegs/assets/kelp-v1.webp', 'games/pegs/assets/light-v1.webp', 'games/pegs/assets/maple-v1.webp', 'games/pegs/assets/meadow-v1.webp', 'games/pegs/assets/moon-v1.webp', 'games/pegs/assets/shoals-v1.webp', 'games/pegs/assets/snow-v1.webp', 'games/pegs/assets/tide-v1.webp', 'games/pegs/assets/volcano-v1.webp', 'games/pegs/assets/wreck-v1.webp'],
  perch: ['games/perch/', 'games/perch/index.html'],
  knotty: ['games/knotty/', 'games/knotty/index.html'],
  casino: ['games/casino/', 'games/casino/index.html', 'games/casino/assets/cloth-v1.webp'],
  spotdiff: ['games/spotdiff/photo-tour-data.js', 'games/spotdiff/photo-tour.js', 'games/spotdiff/assets/photo-tour/cafe/awning-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/chair-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/flowers-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/hat-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/juice-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/menu-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/mug-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/napkin-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/ring-color-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/scene-v1.webp', 'games/spotdiff/assets/photo-tour/cafe/shade-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/book-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/can-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/cushion-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/door-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/flowers-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/napkin-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/planter-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/pot-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/scene-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/shade-color-v1.webp', 'games/spotdiff/assets/photo-tour/courtyard/shutters-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/book-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/bowl-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/can-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/chair-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/flowers-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/hat-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/lantern-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/mug-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/scene-v1.webp', 'games/spotdiff/assets/photo-tour/garden/shade-color-v1.webp', 'games/spotdiff/assets/photo-tour/garden/towel-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/book-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/box-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/cup-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/curtain-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/cushion-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/flowers-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/lamp-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/mug-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/scene-v1.webp', 'games/spotdiff/assets/photo-tour/study/seat-color-v1.webp', 'games/spotdiff/assets/photo-tour/study/vase-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/bluecushion-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/book-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/case-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/cup-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/curtain-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/flowers-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/juice-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/lamp-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/scene-v1.webp', 'games/spotdiff/assets/photo-tour/train/seat-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/vase-color-v1.webp', 'games/spotdiff/assets/photo-tour/train/yellowcushion-color-v1.webp', 'games/spotdiff/', 'games/spotdiff/index.html', 'games/spotdiff/cruise-art.js', 'games/spotdiff/assets/cruise-deck.webp', 'games/spotdiff/photo-cruise.js', 'games/spotdiff/assets/photo-cruise/scene-v1.webp', 'games/spotdiff/assets/photo-cruise/book-absent-v1.webp', 'games/spotdiff/assets/photo-cruise/ball-absent-v1.webp', 'games/spotdiff/assets/photo-cruise/hat-absent-v1.webp', 'games/spotdiff/assets/photo-cruise/shade-color-v1.webp', 'games/spotdiff/assets/photo-cruise/upper-color-v1.webp', 'games/spotdiff/assets/photo-cruise/ring-color-v1.webp', 'games/spotdiff/assets/photo-cruise/chair-color-v1.webp', 'games/spotdiff/assets/photo-cruise/towel-color-v1.webp', 'games/spotdiff/assets/photo-cruise/flower-color-v1.webp', 'games/spotdiff/assets/photo-cruise/hat-color-v1.webp', 'games/spotdiff/assets/photo-cruise/book-color-v1.webp', 'games/spotdiff/assets/photo-cruise/drink-color-v1.webp', 'games/spotdiff/assets/photo-cruise/paper-color-v1.webp'],
  hidden: ['games/hidden/', 'games/hidden/index.html', 'games/hidden/materials.js', 'games/hidden/assets/wood-v1.webp', 'games/hidden/assets/fabric-v1.webp', 'games/hidden/assets/plaster-v1.webp'],
  cases: ['games/cases/', 'games/cases/index.html'],
  spin: ['games/spin/', 'games/spin/index.html', 'games/spin/assets/cloth-v1.webp'],
  three: ['shared/three.module.min.js'],
  planck: ['shared/planck.min.js'],
  cannon: ['shared/cannon-es.min.js']
};
const PREFIX = 'goobs-';
const cacheName = (g) => PREFIX + g + '-' + VERSIONS[g];
const CURRENT = Object.keys(GROUPS).map(cacheName);

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all(Object.keys(GROUPS).map(async (g) => {
    const cache = await caches.open(cacheName(g));
    const missing = [];
    for (const url of GROUPS[g]) if (!(await cache.match(url))) missing.push(url);
    // Fetch each file fresh: cache: 'reload' skips the phone's HTTP cache, and the ?v= query skips GitHub's web cache,
    // which can hand out the old copy of a file for a few minutes after an upload (that once left a phone with a new
    // menu and an old goobs.js stored together). Stored under the plain address. Any failure = try again next time.
    if (missing.length) await Promise.all(missing.map(async (u) => {
      const res = await fetch(new Request(u + (u.indexOf('?') < 0 ? '?' : '&') + 'v=' + VERSIONS[g] + '-' + Date.now(), { cache: 'reload' }));
      if (!res.ok) throw new Error('fetch ' + u + ' ' + res.status);
      await cache.put(u, res);
    }));
  })));
  // no skipWaiting: the page shows "Update available" and the player chooses when to reload
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && !CURRENT.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'VERSION' && event.source) event.source.postMessage({ versions: VERSIONS });
});

async function fromCache(req) {
  for (const name of CURRENT) {
    const cache = await caches.open(name);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
  }
  return null;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    let hit = await fromCache(req);
    if (!hit && url.pathname.endsWith('/')) hit = await fromCache(new Request(url.href + 'index.html'));
    if (hit) return hit;
    try {
      return await fetch(req);
    } catch (e) {
      if (req.mode === 'navigate') {
        const home = await fromCache(new Request(new URL('./index.html', self.registration.scope).href));
        if (home) return home;
      }
      throw e;
    }
  })());
});
