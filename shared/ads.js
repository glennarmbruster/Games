/* Goobs-Games "house ads": vintage-style joke cards shown between rounds, shared by every game.
   All rhymes and copy are original. No real slogans, jingles or logos.
   USE_REAL_BRANDS: true shows real brand names (private family use).
   Set to false before sharing publicly; every card then uses its made-up brand. */
var GoobsAds = (function () {
  'use strict';
  var USE_REAL_BRANDS = true;
  // ---- little vintage product drawings for the magazine cards (original art) ----
  var K = 'stroke="#2a1a10" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  var ART = {
    mug: '<g ' + K + '><path d="M22 34 H70 V74 Q70 86 58 86 H34 Q22 86 22 74Z" fill="#fffaf0"/><path d="M70 44 Q86 44 86 58 Q86 70 70 70" fill="none"/><path d="M22 46 H70" fill="none" stroke-width="2"/><path d="M36 26 Q32 18 38 12 M50 26 Q46 16 52 10 M62 26 Q58 18 64 12" fill="none" stroke-width="2.5"/><rect x="30" y="52" width="32" height="16" rx="3" fill="var(--accent2)"/></g>',
    bowl: '<g ' + K + '><path d="M12 50 H88 Q86 80 50 84 Q14 80 12 50Z" fill="#fffaf0"/><path d="M18 50 Q30 38 40 46 Q48 34 58 44 Q70 36 82 50" fill="#e8b04a"/><path d="M12 58 H88" fill="none" stroke="var(--accent2)" stroke-width="5"/><path d="M70 30 L86 12" stroke-width="5"/></g>',
    shaker: '<g ' + K + '><path d="M34 28 Q34 16 50 16 Q66 16 66 28" fill="#d6d9de"/><rect x="30" y="28" width="40" height="58" rx="8" fill="#fffaf0"/><rect x="30" y="48" width="40" height="20" fill="var(--accent2)"/><circle cx="44" cy="22" r="1.8" fill="#2a1a10"/><circle cx="50" cy="20" r="1.8" fill="#2a1a10"/><circle cx="56" cy="22" r="1.8" fill="#2a1a10"/></g>',
    can: '<g ' + K + '><ellipse cx="50" cy="22" rx="24" ry="7" fill="#d6d9de"/><path d="M26 22 V78 Q50 90 74 78 V22" fill="#fffaf0"/><path d="M26 22 V50 Q50 60 74 50 V22 Q50 30 26 22Z" fill="var(--accent2)"/><circle cx="50" cy="66" r="8" fill="#e8b04a"/></g>',
    jelly: '<g ' + K + '><path d="M16 78 H84" stroke-width="4"/><path d="M24 76 L30 36 Q50 26 70 36 L76 76Z" fill="var(--accent2)"/><path d="M34 36 V74 M50 32 V74 M66 36 V74" fill="none" stroke-width="2" opacity=".5"/><path d="M40 22 Q50 12 60 22" fill="#c0392b"/></g>',
    gum: '<g ' + K + '><rect x="16" y="34" width="68" height="34" rx="5" fill="#fffaf0"/><rect x="16" y="34" width="20" height="34" rx="3" fill="var(--accent2)"/><path d="M44 44 H76 M44 52 H70 M44 60 H74" stroke-width="2"/><rect x="26" y="22" width="52" height="14" rx="3" fill="#d6ead8"/></g>',
    bottle: '<g ' + K + '><path d="M42 10 H58 V26 Q70 36 68 56 L66 84 Q50 90 34 84 L32 56 Q30 36 42 26Z" fill="#6b3a2a"/><path d="M34 50 Q50 56 66 50 V64 Q50 70 34 64Z" fill="#fffaf0"/><rect x="40" y="6" width="20" height="8" rx="2" fill="#d6d9de"/></g>',
    catalog: '<g ' + K + '><path d="M24 14 H74 V86 H24Z" fill="#fffaf0"/><rect x="24" y="14" width="50" height="22" fill="var(--accent2)"/><rect x="32" y="44" width="16" height="16" fill="#e8b04a"/><rect x="52" y="44" width="16" height="16" fill="#9ec4e8"/><path d="M32 68 H68 M32 76 H60" stroke-width="2"/><path d="M74 14 L80 20 V90 L30 90 L24 86" fill="#e6d7b8"/></g>',
    tv: '<g ' + K + '><path d="M38 20 L28 6 M62 20 L72 6" fill="none"/><rect x="14" y="20" width="72" height="56" rx="10" fill="#8a5a3a"/><rect x="22" y="28" width="46" height="40" rx="8" fill="#bfe3f5"/><circle cx="77" cy="36" r="4" fill="#e8b04a"/><circle cx="77" cy="52" r="4" fill="#e8b04a"/><path d="M28 76 L24 88 M72 76 L76 88"/></g>',
    pitcher: '<g ' + K + '><path d="M28 20 H66 L60 84 Q46 90 34 84Z" fill="var(--accent2)"/><path d="M66 32 Q84 34 80 54 Q76 66 62 64" fill="none"/><path d="M28 20 L20 14" /><path d="M30 34 H64" stroke-width="2" opacity=".5"/><circle cx="46" cy="54" r="10" fill="#fff59d"/></g>',
    percolator: '<g ' + K + '><path d="M30 26 H64 L70 84 H24Z" fill="#d6d9de"/><path d="M64 36 Q84 40 78 62 Q74 72 66 70" fill="none"/><path d="M30 26 L24 18" /><path d="M40 26 Q40 12 47 10 Q54 12 54 26" fill="#8a5a3a"/><rect x="30" y="50" width="34" height="12" fill="var(--accent2)"/></g>',
    popcorn: '<g ' + K + '><path d="M26 36 H74 L66 88 H34Z" fill="#fffaf0"/><path d="M36 36 L40 88 M50 36 V88 M64 36 L60 88" stroke="var(--accent2)" stroke-width="6"/><circle cx="34" cy="30" r="8" fill="#fff3c4"/><circle cx="48" cy="24" r="9" fill="#fff3c4"/><circle cx="62" cy="28" r="8" fill="#fff3c4"/><circle cx="72" cy="34" r="6" fill="#fff3c4"/></g>'
  };

  var CARDS = [
    // ---- roadside rhyme signs (5 signs, last one is the brand) ----
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['HIS VIDEO CALL', 'FROZE MID-GRIN', 'THE WHOLE TEAM STARED', 'AT HIS FUZZY CHIN'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['HIS SELFIE SHOWED', 'A BRISTLY CHIN', 'SHE SWIPED IT LEFT', 'HE SHAVED AGAIN'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['THE SMART DOORBELL', 'RANG ONCE, THEN QUIT', 'IT SAW HIS BEARD', 'AND WOULDN\u2019T ADMIT'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['HE BOUGHT A ROBOT', 'TO MOW THE LAWN', 'IT MOWED HIS CHIN', 'BEFORE THE DAWN'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['THE ARCH IS TALL', 'THE TOWER\u2019S GRAND', 'BUT SMOOTHEST CHEEKS', 'RULE ALL THE LAND'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['HIS PHONE\u2019S FACE ID', 'SAID \u201cWHO ARE YOU?\u201d', 'HE SHAVED IT OFF', 'NOW IT KNOWS HIM TOO'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['IF DAD\u2019S BEARD', 'CAN HIDE THE REMOTE', 'IT\u2019S TIME TO SHAVE', 'SO SAYS THE VOTE'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['ROAD TRIP SNACKS', 'AND OPEN SKY', 'A SMOOTH CLEAN CHIN', 'FOR EVERY GUY'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['HIS SCRATCHY KISS', 'MADE HER SAY NAY', 'SHE KISSED THE CAT', 'IT PURRED OKAY'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['SPEED BUMPS AHEAD', 'SLOW DOWN, MY FRIEND', 'NICKS ON YOUR CHIN', 'ARE NOT A TREND'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['THE PENGUIN\u2019S SLEEK', 'THE CAT IS TOO', 'THE SQUIRREL\u2019S FUZZY', 'AND SO ARE YOU'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['SHE SOLVED THE PUZZLE', 'IN RECORD TIME', 'HE STILL HAD STUBBLE', 'AND HALF A RHYME'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['DON\u2019T RACE THE TRAIN', 'TO BEAT YOUR SCORE', 'THE GAME WILL WAIT', 'THE TRAIN WON\u2019T ANYMORE'] },
    { style: 'burma', brand: 'Burma-Shave', alt: 'Highway-Shave', lines: ['GRANDPA\u2019S BEARD', 'HID HALF THE BOARD', 'HE SHAVED IT OFF', 'AND FINALLY SCORED'] },

    // ---- 1950s magazine ads ----
    { style: 'mag', brand: 'Ovaltine', alt: 'Malto-Glow', art: 'mug', accent: '#b8322a',
      head: 'Is Your Family Getting Enough Pep?', body: 'One warm mug at bedtime, and you\u2019ll sleep like the champ you are.', tag: 'Stir up a mug tonight!' },
    { style: 'mag', brand: 'Quaker Oats', alt: 'Old Mill Oats', art: 'bowl', accent: '#1f5fa8',
      head: 'Start Your Engines!', body: 'Race drivers, rocket men and crossword champions all start with a hearty bowl.', tag: 'Fuel for the whole family!' },
    { style: 'mag', brand: 'Morton Salt', alt: 'Seaside Salt', art: 'shaker', accent: '#2a6db0',
      head: 'A Pinch of Pep!', body: 'Four out of five puzzle solvers prefer a well-seasoned snack. The fifth one ate the survey.', tag: 'Shake things up!' },
    { style: 'mag', brand: 'Campbell\u2019s', alt: 'Brightside Soup', art: 'can', accent: '#c0392b',
      head: 'Soup\u2019s On, Sport!', body: 'Ten ripe tomatoes in every can and a smile in every spoonful.', tag: 'Slurp it piping hot!' },
    { style: 'mag', brand: 'Jell-O', alt: 'Wiggle-O', art: 'jelly', accent: '#d35400',
      head: 'Wobble Your Way to Dessert!', body: 'Six shimmering flavors that jiggle and joggle right to the table.', tag: 'The dessert that dances!' },
    { style: 'mag', brand: 'Kellogg\u2019s Corn Flakes', alt: 'Sunny Flakes', art: 'bowl', accent: '#d9701e',
      head: 'Up Before the Alarm Clock?', body: 'Toasted golden flakes, crisp and ready before the first cup of coffee.', tag: 'Rise and crunch!' },
    { style: 'mag', brand: 'Wrigley\u2019s Spearmint', alt: 'Cool Breeze Gum', art: 'gum', accent: '#23894f',
      head: 'Chew Over Your Next Move!', body: 'Chess masters and crossword kings chew while they think. Try it for a week and see.', tag: 'Fresh as a spring morning.' },
    { style: 'mag', brand: 'Coca-Cola', alt: 'Fizzy Pop Cola', art: 'bottle', accent: '#b71c1c',
      head: 'Ice-Cold After the Big Game!', body: 'Crisp and bubbly after a long drive or a hard puzzle. Pour one for your co-pilot, too.', tag: 'Worth the wait!' },
    { style: 'mag', brand: 'Sears Catalog', alt: 'Big Book Catalog', art: 'catalog', accent: '#6d4c41',
      head: 'Everything for the Modern Home!', body: 'Toasters, hi-fi sets, lawn chairs and a genuine atomic-age lamp. Order by mail today.', tag: 'Delivered right to your door!' },
    { style: 'mag', brand: 'Philco', alt: 'Starlight TV', art: 'tv', accent: '#5e35b1',
      head: 'Now in Every Living Room!', body: 'A crystal-clear picture from coast to coast. Rabbit ears included at no extra charge.', tag: 'The whole family will watch!' },
    { style: 'mag', brand: 'Kool-Aid', alt: 'Pitcher-Pop', art: 'pitcher', accent: '#c2185b',
      head: 'Pour a Pitcher of Sunshine!', body: 'Stir, sip and smile. Even the cat comes back for seconds.', tag: 'Six sunny flavors!' },
    { style: 'mag', brand: 'Maxwell House', alt: 'Early Riser Roast', art: 'percolator', accent: '#4e342e',
      head: 'Up Before the Sun?', body: 'A hot cup for early starts, long crosswords and one more puzzle before breakfast.', tag: 'Brewed for early birds.' },
    { style: 'mag', brand: 'Cracker Jack', alt: 'Ballpark Crunch', art: 'popcorn', accent: '#c62828',
      head: 'Popcorn, Peanuts & Pure Fun', body: 'Sweet crunchy corn for the drive home from the ballgame.', tag: 'Crunch all the way home!' },

    // ---- neon roadside signs ----
    { style: 'neon', brand: 'Holiday Inn', alt: 'Starlite Motor Inn', top: 'STAY AT THE', bottom: 'COLOR TV \u00b7 POOL \u00b7 ICE', glow: '#35e0a1' },
    { style: 'neon', brand: 'Meramec Caverns', alt: 'Old Hollow Caverns', top: 'VISIT', bottom: 'NEXT EXIT \u00b7 COOL INSIDE', glow: '#ff5fa2' },
    { style: 'neon', brand: 'Dr Pepper', alt: 'Doc Fizz Soda', top: 'DRINK', bottom: 'ICE COLD \u00b7 5\u00a2', glow: '#ff5a4f' },
    { style: 'neon', brand: 'Texaco', alt: 'Tri-County Gas', top: 'FILL \u2019ER UP AT', bottom: 'FREE ROAD MAPS INSIDE', glow: '#ffd24a' },
    { style: 'neon', brand: 'Howard Johnson\u2019s', alt: 'Orange Roof Diner', top: 'EAT AT', bottom: 'PIE \u00b7 COFFEE \u00b7 OPEN LATE', glow: '#ff9b3d' }
  ];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function brandOf(c) { return USE_REAL_BRANDS ? c.brand : c.alt; }

  function fitText(x, y, size, text, maxW, extra) {
    var est = text.length * size * 0.62;
    var fit = est > maxW ? ' textLength="' + maxW + '" lengthAdjust="spacingAndGlyphs"' : '';
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle"' + fit + (extra || '') + '>' + esc(text) + '</text>';
  }

  function neonSvg(c) {
    var b = brandOf(c).toUpperCase(), g = c.glow;
    var bulbs = '';
    for (var i = 0; i < 16; i++) bulbs += '<circle cx="' + (40 + i * 14) + '" cy="30" r="3.2" fill="#fff4c2"/>';
    for (i = 0; i < 16; i++) bulbs += '<circle cx="' + (40 + i * 14) + '" cy="136" r="3.2" fill="#fff4c2"/>';
    return '<svg viewBox="0 0 300 220" aria-hidden="true"><defs><filter id="nglow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<rect x="146" y="140" width="10" height="80" fill="#2a2433"/>' +
      '<path d="M28 20 H262 L286 83 L262 146 H28Z" fill="#141022" stroke="#3b3350" stroke-width="4"/>' + bulbs +
      '<g filter="url(#nglow)" font-family="Georgia, Times New Roman, serif" font-weight="900" text-anchor="middle">' +
      '<g fill="#ffffff">' + fitText(150, 58, 15, c.top, 200) + '</g>' +
      '<g fill="' + g + '">' + fitText(150, 96, 30, b, 230) + '</g>' +
      '<g fill="#bfe8ff">' + fitText(150, 122, 12, c.bottom, 220) + '</g></g>' +
      '<g filter="url(#nglow)"><rect x="92" y="164" width="116" height="30" rx="6" fill="#141022" stroke="' + g + '" stroke-width="2.5"/>' +
      '<text class="blink" x="150" y="185" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-weight="900" font-size="16" fill="' + g + '">VACANCY</text></g>' +
      '</svg>';
  }

  /* Render a card into el. onShown() fires when the card is fully revealed. Returns a cancel function. */
  function render(c, el, onShown, onStep) {
    var timers = [];
    if (c.style === 'burma') {
      var signs = c.lines.map(function (l) { return '<div class="sign">' + esc(l) + '</div>'; }).join('') +
        '<div class="sign brand">' + esc(brandOf(c).toUpperCase()) + '</div>';
      el.innerHTML = '<div class="ad burma"><div class="road"></div><div class="signs">' + signs + '</div><span class="adv">ROADSIDE READING</span></div>';
      var list = el.querySelectorAll('.sign');
      Array.prototype.forEach.call(list, function (s, i) {
        timers.push(setTimeout(function () { s.classList.add('up'); if (onStep) onStep(i); if (i === list.length - 1) onShown(); }, 150 + i * 320));
      });
    } else if (c.style === 'mag') {
      el.innerHTML = '<div class="ad mag" style="--accent2:' + c.accent + '"><span class="adv">ADVERTISEMENT</span>' +
        '<div class="mhead">' + esc(c.head) + '</div>' +
        '<div class="mart"><svg viewBox="0 0 100 100">' + (ART[c.art] || '') + '</svg></div>' +
        '<div class="mbody">' + esc(c.body) + '</div>' +
        '<div class="mbrand">' + esc(brandOf(c)) + '</div>' +
        '<div class="mtag">' + esc(c.tag) + '</div></div>';
      timers.push(setTimeout(onShown, 350));
    } else {
      el.innerHTML = '<div class="ad neon">' + neonSvg(c) + '<span class="adv">OPEN ALL NIGHT</span></div>';
      timers.push(setTimeout(onShown, 350));
    }
    return function () { timers.forEach(clearTimeout); };
  }

  // Deck of indices; draw without repeats until the deck is used up, then reshuffle.
  function draw(deck, lastIdx) {
    if (!deck || !deck.length) {
      deck = [];
      for (var i = 0; i < CARDS.length; i++) deck.push(i);
      for (i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
      if (deck[deck.length - 1] === lastIdx && deck.length > 1) { t = deck[0]; deck[0] = deck[deck.length - 1]; deck[deck.length - 1] = t; }
    }
    var idx = deck.pop();
    return { idx: idx, deck: deck, card: CARDS[idx] };
  }

  // ---------- overlay: one shared card at a time, closes only with the X ----------
  var ov = null, cancel = null, doneCb = null;
  function ensureOverlay() {
    if (ov) return ov;
    ov = document.createElement('div');
    ov.className = 'overlay center adov';
    ov.id = 'ovAd';
    ov.innerHTML = '<div class="adframe"><button class="adclose" aria-label="Close ad"><svg viewBox="0 0 24 24"><path d="M5 5L19 19M19 5L5 19" stroke="#111" stroke-width="3.6" stroke-linecap="round" fill="none"/></svg></button><div class="adbody"></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('.adclose').addEventListener('click', close);
    return ov;
  }
  function loadDeck() { try { return JSON.parse(localStorage.getItem('goobs.adDeck') || 'null') || { deck: [], last: -1 }; } catch (e) { return { deck: [], last: -1 }; } }
  function saveDeck(d) { try { localStorage.setItem('goobs.adDeck', JSON.stringify(d)); } catch (e) { /* ignore */ } }
  /* show({onShow, onStep}, done): done() runs after the player taps the X */
  function show(hooks, done) {
    hooks = hooks || {};
    ensureOverlay();
    var d = loadDeck(), pick = draw(d.deck, d.last);
    saveDeck({ deck: pick.deck, last: pick.idx });
    doneCb = done || null;
    ov.classList.add('show');
    if (hooks.onShow) hooks.onShow();
    cancel = render(pick.card, ov.querySelector('.adbody'), function () {}, hooks.onStep);
  }
  function close() {
    if (!ov || !ov.classList.contains('show')) return;
    if (cancel) cancel();
    cancel = null;
    ov.classList.remove('show');
    ov.querySelector('.adbody').innerHTML = '';
    var d = doneCb; doneCb = null;
    if (d) d();
  }
  function isOpen() { return !!(ov && ov.classList.contains('show')); }

  return { CARDS: CARDS, render: render, draw: draw, show: show, close: close, isOpen: isOpen };
})();
