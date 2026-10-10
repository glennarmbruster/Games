/* Native dialogs arrived after many still-used iPads. Keep menus usable there. */
var GoobsDialog = (function () {
  var nativeDialogs = !!(window.HTMLDialogElement && HTMLDialogElement.prototype.showModal);
  if (!nativeDialogs) {
    var css = document.createElement('style');
    css.textContent = 'dialog:not([open]){display:none!important}dialog[open]{display:block;position:fixed!important;top:50%!important;left:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;margin:0!important;max-width:calc(100vw - 24px)!important;max-height:calc(100vh - 24px)!important;overflow:auto!important;z-index:10001!important}.goobs-dialog-shade{position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.6);z-index:10000;touch-action:none}';
    document.head.appendChild(css);
  }
  function close(d) {
    if (nativeDialogs) { d.close(); return; }
    if (!d.open) return;
    d.open = false; d.removeAttribute('open');
    if (d._goobsShade) d._goobsShade.remove();
    document.removeEventListener('keydown', d._goobsKeys, true);
    if (d._goobsFocus && document.contains(d._goobsFocus)) d._goobsFocus.focus();
    d.dispatchEvent(new Event('close'));
  }
  function open(d) {
    if (nativeDialogs) { d.showModal(); return; }
    if (d.open) return;
    d._goobsFocus = document.activeElement;
    d.open = true; d.setAttribute('open', ''); d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    var shade = document.createElement('div'); shade.className = 'goobs-dialog-shade';
    document.body.appendChild(shade); d._goobsShade = shade;
    function buttons() { return Array.prototype.filter.call(d.querySelectorAll('button,input,select,textarea,a[href],[tabindex]'), function (e) { return !e.disabled && e.tabIndex >= 0 && e.getClientRects().length; }); }
    d._goobsKeys = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); if (d.dispatchEvent(new Event('cancel', {cancelable:true}))) close(d); }
      if (e.key === 'Tab') { var a = buttons(), i = a.indexOf(document.activeElement); if (!a.length) { e.preventDefault(); return; } if (e.shiftKey && i <= 0) { e.preventDefault(); a[a.length-1].focus(); } else if (!e.shiftKey && (i < 0 || i === a.length-1)) { e.preventDefault(); a[0].focus(); } }
    };
    document.addEventListener('keydown', d._goobsKeys, true);
    var focus = buttons()[0]; if (focus) focus.focus();
  }
  return {open:open, close:close};
})();

/* Older Safari has no Canvas roundRect. The collection uses circular numeric
   radii; keep native drawing untouched when it is available. */
(function () {
  if (!window.CanvasRenderingContext2D || CanvasRenderingContext2D.prototype.roundRect) return;
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    var r = Array.isArray(radii) ? radii.slice() : [radii == null ? 0 : radii];
    if (!r.length || r.length > 4) throw new RangeError('Expected one to four corner radii');
    for (var i = 0; i < r.length; i++) {
      r[i] = Number(r[i]);
      if (r[i] < 0) throw new RangeError('Corner radius must not be negative');
      if (!isFinite(r[i])) return;
    }
    if (r.length === 1) r = [r[0], r[0], r[0], r[0]];
    else if (r.length === 2) r = [r[0], r[1], r[0], r[1]];
    else if (r.length === 3) r.push(r[1]);
    if (w < 0) { x += w; w = -w; r = [r[1], r[0], r[3], r[2]]; }
    if (h < 0) { y += h; h = -h; r = [r[3], r[2], r[1], r[0]]; }
    var scale = Math.min(1, w / (r[0] + r[1] || 1), w / (r[2] + r[3] || 1), h / (r[0] + r[3] || 1), h / (r[1] + r[2] || 1));
    r = r.map(function (v) { return v * scale; });
    this.moveTo(x + r[0], y); this.lineTo(x + w - r[1], y);
    this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    this.lineTo(x + w, y + h - r[2]); this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    this.lineTo(x + r[3], y + h); this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    this.lineTo(x, y + r[0]); this.quadraticCurveTo(x, y, x + r[0], y); this.closePath();
  };
})();

/* Goobs-Games shared runtime: storage, global settings (theme, ads), recent/favorites,
   service worker + "Update available" bar. Load this in <head> so the theme applies before paint. */
var Goobs = (function () {
  'use strict';

  var ROOT = (function () {
    try { return new URL('../', document.currentScript.src).href; } catch (e) { return './'; }
  })();

  // Presentation only: share the opening-menu palette without changing game state.
  document.documentElement.dataset.menuGame = (location.pathname.split('/games/')[1] || '').split('/')[0];
  var menuStyle = document.createElement('link');
  menuStyle.rel = 'stylesheet';
  menuStyle.href = new URL('shared/menu-polish.css', ROOT).href;
  document.head.appendChild(menuStyle);

  // ---------- storage, namespaced per game, never throws ----------
  function store(ns) {
    var pre = ns + '.';
    return {
      get: function (k, d) {
        try { var v = localStorage.getItem(pre + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
      },
      set: function (k, v) { try { localStorage.setItem(pre + k, JSON.stringify(v)); } catch (e) { /* full or blocked */ } },
      del: function (k) { try { localStorage.removeItem(pre + k); } catch (e) { /* ignore */ } }
    };
  }
  var gs = store('goobs');

  // ---------- global settings ----------
  var THEMES = [
    { id: 'auto', label: 'Auto', sw: ['#f4f5f9', '#0f1116'] },
    { id: 'light', label: 'Light', sw: ['#ffffff', '#5a54f0'] },
    { id: 'dark', label: 'Dark', sw: ['#0f1116', '#7c77ff'] },
    { id: 'blue', label: 'Blue', sw: ['#0b1628', '#4f9dff'] },
    // seasonal themes (Glenn, 2026-10-05: "add another theme - for now a halloween theme"). A seasonal theme is a
    // dark theme plus a "skin": the page gets data-theme="dark" (so every game's own dark-mode rules apply, nothing
    // breaks) and data-skin="<id>", which goobs.css uses to recolour the shared palette and the menu decorates.
    { id: 'halloween', label: 'Halloween', sw: ['#1c1026', '#ff7a1a'], base: 'dark', skin: 'halloween' }
  ];
  var STATUSBAR = { light: '#5a54f0', dark: '#0f1116', blue: '#0b1628', halloween: '#1c1026' };
  var settings = { v: 1, theme: 'light', ads: true };
  (function () {
    var s = gs.get('settings', {}) || {};
    for (var k in settings) if (typeof s[k] === typeof settings[k]) settings[k] = s[k];
    if (!THEMES.some(function (t) { return t.id === settings.theme; })) settings.theme = 'light';
  })();
  function saveSettings() { gs.set('settings', settings); }

  // ---------- theme (one for the whole arcade) ----------
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var themeNow = 'light', skinNow = '', themeListeners = [];
  function applyTheme() {
    var t = null; THEMES.forEach(function (x) { if (x.id === settings.theme) t = x; });
    skinNow = t && t.skin ? t.skin : '';
    themeNow = settings.theme === 'auto' ? (darkQuery && darkQuery.matches ? 'dark' : 'light') : (t && t.base) || settings.theme;
    document.documentElement.setAttribute('data-theme', themeNow);
    if (skinNow) document.documentElement.setAttribute('data-skin', skinNow); else document.documentElement.removeAttribute('data-skin');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', STATUSBAR[skinNow || themeNow]);
    themeListeners.forEach(function (cb) { try { cb(themeNow); } catch (e) { /* ignore */ } });
  }
  if (darkQuery) {
    var onScheme = function () { if (settings.theme === 'auto') applyTheme(); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onScheme); else if (darkQuery.addListener) darkQuery.addListener(onScheme);
  }
  function setTheme(id) { settings.theme = id; saveSettings(); applyTheme(); }
  // Render the 4-button theme picker into el and keep it in sync
  function themePicker(el) {
    function draw() {
      el.innerHTML = THEMES.map(function (t) {
        return '<button data-theme="' + t.id + '" class="' + (settings.theme === t.id ? 'on' : '') + '"><span class="sw"><i style="background:' +
          t.sw[0] + '"></i><i style="background:' + t.sw[1] + '"></i></span>' + t.label + '</button>';
      }).join('');
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) setTheme(b.dataset.theme);
    });
    themeListeners.push(draw);
    draw();
  }
  applyTheme();

  // ---------- recently played / favorites ----------
  function markPlayed(id) {
    var r = gs.get('recent', []) || [];
    r = [id].concat(r.filter(function (x) { return x !== id; })).slice(0, 6);
    gs.set('recent', r);
  }
  function favs() { return gs.get('favs', []) || []; }
  function toggleFav(id) {
    var f = favs(), i = f.indexOf(id);
    if (i >= 0) f.splice(i, 1); else f.push(id);
    gs.set('favs', f);
    return i < 0;
  }

  // ---------- service worker: offline + "Update available" ----------
  function initUpdates(opts) {
    opts = opts || {};
    if (!('serviceWorker' in navigator) || !/^https?:/.test(location.protocol)) return;
    var bar = document.createElement('div');
    bar.className = 'updatebar';
    bar.setAttribute('role', 'button');
    bar.textContent = 'Update available \u2014 tap to reload';
    document.body.appendChild(bar);
    var wantReload = false, waitingWorker = null;
    function offer(w) { waitingWorker = w; bar.classList.add('show'); }
    bar.addEventListener('click', function () {
      if (!waitingWorker) return;
      if (opts.beforeReload) { try { opts.beforeReload(); } catch (e) { /* ignore */ } }
      wantReload = true;
      waitingWorker.postMessage('SKIP_WAITING');
      bar.textContent = 'Updating\u2026';
    });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (wantReload) { wantReload = false; location.reload(); }
    });
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.versions && opts.onVersions) opts.onVersions(e.data.versions);
    });
    navigator.serviceWorker.register(ROOT + 'sw.js', { scope: ROOT }).then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', function () {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
        });
      });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) { try { reg.update(); } catch (e) { /* offline */ } } });
      var sw = navigator.serviceWorker.controller;
      if (sw) sw.postMessage('VERSION');
      else navigator.serviceWorker.ready.then(function (r) { if (r.active) r.active.postMessage('VERSION'); });
    }).catch(function () { /* not fatal: games still work online */ });
  }

  function home() { location.href = ROOT; }

  // ---------- keep taps lined up with what's on screen (iPhone Home Screen apps) ----------
  // On iPhone, a Home Screen web app can be left shifted after the keyboard closes, or after the page scrolls a
  // little: what you see and where a tap lands drift apart (you have to tap below a button). Game pages never
  // scroll, and every page snaps back to the top whenever the keyboard closes or the visible area changes.
  var isGame = /\/games\//.test(location.pathname);
  if (isGame) document.documentElement.classList.add('gg-game');
  function snap() {
    var vv = window.visualViewport;
    if (window.scrollX || window.scrollY || (vv && (vv.offsetTop > 0.5 || vv.offsetLeft > 0.5))) window.scrollTo(0, 0);
    if (isGame) {
      if (document.documentElement.scrollTop) document.documentElement.scrollTop = 0;
      if (document.body && document.body.scrollTop) document.body.scrollTop = 0;
    }
  }
  function snapSoon() { snap(); setTimeout(snap, 120); setTimeout(snap, 450); }
  document.addEventListener('focusout', function (e) { var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) snapSoon(); }, true);
  document.addEventListener('change', function (e) { if (e.target && e.target.tagName === 'INPUT') snapSoon(); }, true); // e.g. back from the photo picker
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', snapSoon);
    if (isGame) window.visualViewport.addEventListener('scroll', snap);
  }
  if (isGame) window.addEventListener('scroll', snap, { passive: true });
  window.addEventListener('pageshow', snapSoon);
  window.addEventListener('orientationchange', snapSoon);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) snapSoon(); });

  // ---------- full screen (shell 2.44.0) ----------
  // Goobs.fullscreen({ menu: ['btnHelp', 'btnStats', ...], overlay: false, title: 'Name', info: function () { return 'html'; },
  //                    onOpen: fn, onClose: fn })
  // Puts the page in full-screen mode (html.gg-fs, see goobs.css), adds a round Menu button at the end of the top row and a
  // Menu sheet. The buttons named in `menu` are MOVED into the sheet (they keep their own click handlers; the sheet closes
  // first). The sheet also has "All games" and a big Play button. A toolbar left with no buttons is hidden.
  var MENU_ICON = '<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></g></svg>';
  var ALL_ICON = '<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h4.5v-5.5h3V20H18V9.5"/></g></svg>'; // a house: back to the arcade
  function fullscreen(opts) {
    opts = opts || {};
    var html = document.documentElement;
    html.classList.add('gg-fs'); if (opts.overlay) html.classList.add('gg-fs-over');
    var top = document.querySelector('.top'), h1 = top && top.querySelector('h1'), bsvg = top && top.querySelector('.brand svg');
    var ov = document.createElement('div'); ov.className = 'overlay ggmenu'; ov.id = 'ggMenu';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-label="Menu"><div class="ggmenu-top">' + (opts.icon || (bsvg ? bsvg.outerHTML : '')) +
      '<h2></h2></div><div class="ggmenu-info"></div><div class="ggmenu-list"></div><button class="btn red ggmenu-play">Play</button></div>';
    ov.querySelector('.ggmenu-top svg') && ov.querySelector('.ggmenu-top svg').removeAttribute('style');
    ov.querySelector('h2').textContent = opts.title || (h1 ? h1.textContent : document.title);
    var list = ov.querySelector('.ggmenu-list'), toolbars = [];
    (opts.menu || []).forEach(function (id) {
      var b = typeof id === 'string' ? document.getElementById(id) : id;
      if (!b) return;
      var tb = b.closest('.toolbar'); if (tb && toolbars.indexOf(tb) < 0) toolbars.push(tb);
      if (!b.querySelector('span') && b.getAttribute('aria-label')) { var sp = document.createElement('span'); sp.textContent = b.getAttribute('aria-label'); b.appendChild(sp); }
      list.appendChild(b);
    });
    if (opts.allGames !== false) {
      var all = document.createElement('button'); all.id = 'ggAllGames'; all.innerHTML = ALL_ICON + '<span>All games</span>';
      all.addEventListener('click', function () { home(); }); list.appendChild(all);
    }
    toolbars.forEach(function (tb) { if (!tb.querySelector('button')) tb.style.display = 'none'; });
    document.body.appendChild(ov);
    var btn = document.createElement('button'); btn.className = 'iconbtn ggmenu-btn'; btn.id = 'ggMenuBtn'; btn.setAttribute('aria-label', 'Menu'); btn.innerHTML = MENU_ICON;
    var tbtns = top && top.querySelector('.topbtns');
    if (opts.button) opts.button.appendChild(btn); else if (tbtns) tbtns.appendChild(btn); else if (top) top.appendChild(btn); else document.body.appendChild(btn);
    function info() { var el = ov.querySelector('.ggmenu-info'); try { el.innerHTML = opts.info ? (opts.info() || '') : ''; } catch (e) { el.innerHTML = ''; } }
    function open() { info(); ov.classList.add('show'); if (opts.onOpen) { try { opts.onOpen(); } catch (e) { /* ignore */ } } }
    function close() { if (!ov.classList.contains('show')) return; ov.classList.remove('show'); if (opts.onClose) { try { opts.onClose(); } catch (e) { /* ignore */ } } }
    btn.addEventListener('click', open);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.ggmenu-play').addEventListener('click', close);
    list.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && !b.disabled) close(); }, true); // close first; the button's own handler runs after
    return { open: open, close: close, isOpen: function () { return ov.classList.contains('show'); }, el: ov, button: btn, list: list, refresh: info };
  }

  // ---------- a way out from every end-of-game card (shell 2.54.0) ----------
  // Glenn: "In some games there's not always a direct path back to the main menu ... when you finish a game ...
  // there should also be an exit option that takes you to the main menu". A finished-game, results, start or pause
  // card covers the top row's back button, so each of those cards gets an "Exit to main menu" button under its own
  // buttons. Cards that already have one (Pinball's "All games", Beacon's "Games") are left alone, and Get Out!
  // is left out on purpose (Glenn: it does not need to change). The button taps the game's own back button when
  // there is one, so the game saves exactly as it does when you leave from the top row.
  var EXIT_CARDS = ['ovEnd', 'ovResults', 'ovPause', 'ovStart'];
  var HOME_TEXT = /^\s*(all games|games|exit to main menu|main menu|‹ games)\s*$/i;
  function exitCards() {
    if (!isGame || /\/games\/getout\//.test(location.pathname)) return;
    EXIT_CARDS.forEach(function (id) {
      var ov = document.getElementById(id);
      if (!ov) return;
      function ensure() {
        if (!ov.classList.contains('show')) return;
        var card = ov.querySelector('.card, .sheet');
        if (!card) return;
        var had = card.querySelector('.ggexit'), btns = card.querySelectorAll('button');
        // a card that has its own way home this time doesn't get a second one (cards are reused for different moments)
        for (var i = 0; i < btns.length; i++) if (btns[i] !== had && HOME_TEXT.test(btns[i].textContent)) { if (had) had.remove(); return; }
        if (had) { card.appendChild(had); return; } // keep it last if the game added buttons after it
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'ggexit'; b.innerHTML = ALL_ICON + '<span>Exit to main menu</span>';
        b.addEventListener('click', function () {
          var hb = document.getElementById('btnHome');
          if (hb && !ov.contains(hb)) hb.click(); else home();
        });
        card.appendChild(b);
      }
      // the card's buttons are often rebuilt just before it shows: check after the show, once the game's code has run
      new MutationObserver(ensure).observe(ov, { attributes: true, attributeFilter: ['class'] });
      ensure();
    });
  }
  if (isGame) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', exitCards);
    else exitCards();
  }

  // ---------- a way out of a broken game (shell 2.73.0) ----------
  // Glenn's phone once opened straight into a half-uploaded game page that couldn't start, with no way back to the
  // menu. If a game page hits an uncaught error, a small bar appears at the top: "All games" goes to the menu, × hides
  // it. Shown once per page; harmless browser noise is ignored.
  if (isGame) {
    var oopsShown = false;
    var oops = function (msg) {
      if (oopsShown) return;
      msg = String(msg || '');
      if (/ResizeObserver loop|^Script error\.?$/i.test(msg)) return;
      oopsShown = true;
      var put = function () {
        var d = document.createElement('div');
        d.setAttribute('role', 'alert');
        d.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top, 0px) + 8px);transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:8px;padding:8px 8px 8px 14px;border-radius:999px;background:#1b1f33;color:#fff;font:700 14px -apple-system,system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:calc(100vw - 24px)';
        d.innerHTML = '<span style="white-space:nowrap">Something went wrong.</span>';
        var go = document.createElement('button'); go.textContent = 'All games';
        go.style.cssText = 'white-space:nowrap;border:0;border-radius:999px;padding:8px 14px;background:#5a54f0;color:#fff;font:800 14px -apple-system,system-ui,sans-serif';
        go.addEventListener('click', function () { home(); });
        var x = document.createElement('button'); x.textContent = '\u00d7'; x.setAttribute('aria-label', 'Hide');
        x.style.cssText = 'border:0;background:transparent;color:#fff;font:700 20px -apple-system,system-ui,sans-serif;padding:4px 8px';
        x.addEventListener('click', function () { d.remove(); });
        d.appendChild(go); d.appendChild(x); document.body.appendChild(d);
      };
      if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
    };
    window.addEventListener('error', function (e) { if (e && e.target && e.target !== window && !e.message) return; oops(e && e.message); });
    window.addEventListener('unhandledrejection', function (e) { var r = e && e.reason; oops(r && (r.message || r)); });
  }

  return {
    ROOT: ROOT, store: store, settings: settings, THEMES: THEMES,
    theme: function () { return themeNow; }, skin: function () { return skinNow; }, setTheme: setTheme, onTheme: function (cb) { themeListeners.push(cb); }, themePicker: themePicker,
    adsOn: function () { return settings.ads; }, setAds: function (on) { settings.ads = !!on; saveSettings(); },
    markPlayed: markPlayed, recent: function () { return gs.get('recent', []) || []; }, favs: favs, toggleFav: toggleFav,
    initUpdates: initUpdates, home: home, snap: snapSoon, fullscreen: fullscreen
  };
})();
