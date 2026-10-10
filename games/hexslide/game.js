(function() {
  "use strict";
  const $ = (id) => document.getElementById(id), B = HEX, storage = window.Goobs ? Goobs.store("hexslide") : { get(k, d) {
    try {
      return JSON.parse(localStorage.getItem("hexslide." + k)) || d;
    } catch {
      return d;
    }
  }, set(k, v) {
    localStorage.setItem("hexslide." + k, JSON.stringify(v));
  } };
  const meta = Object.assign({ open: 1, level: 1, wins: {}, best: 0, theme: 0, sound: true, seen: false }, storage.get("meta", {}));
  let state = storage.get("game", null), history = storage.get("undo", []);
  if (!state || state.version !== 1 || state.board?.length !== 19 || state.tray?.length !== 3) {
    state = B.create(meta.level);
    history = [];
  }
  const canvas = $("board"), renderer = HexRenderer.make(canvas);
  let board = B.clone(state.board), score = state.score, selected = -1, target = -1, hint = null, drag = null, pointer = null, anim = null, queue = [], busy = false, hammerMode = false, messageUntil = 0, ac = null, lastFocus = null, awarded = false;
  function save() {
    storage.set("meta", meta);
    storage.set("game", state);
    storage.set("undo", history.slice(-15));
  }
  function sound(hz = 420, d = 0.06) {
    if (!meta.sound) return;
    try {
      ac || (ac = new (window.AudioContext || window.webkitAudioContext)());
      ac.resume();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.value = hz;
      g.gain.setValueAtTime(0.055, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(1e-3, ac.currentTime + d);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + d);
    } catch {
    }
  }
  function msg(text, notice = false) {
    $("message").textContent = text;
    $("message").classList.toggle("notice", notice);
    messageUntil = performance.now() + 3500;
  }
  function update() {
    const C = B.config(state.level, state.endless);
    $("levelLabel").textContent = state.endless ? "ENDLESS PLAY" : "BOARD " + String(state.level).padStart(2, "0");
    $("score").innerHTML = score + (state.endless ? "" : ` <small>/ ${C.goal}</small>`);
    $("fill").style.width = (state.endless ? Math.min(100, score / 300 * 100) : Math.min(100, score / C.goal * 100)) + "%";
    const next = state.locks.filter((n) => n > score).sort((a, b) => a - b)[0];
    $("nextLock").textContent = next ? "Next space \xB7 " + next : "All spaces unlocked";
    $("undo").disabled = !history.length || busy;
    $("hint").disabled = busy || state.status !== "playing";
    $("hammer").disabled = busy || !state.tools.hammer || state.status === "won";
    $("shuffle").disabled = busy || !state.tools.shuffle || state.status === "won";
    $("hammer").classList.toggle("active", hammerMode);
    $("hammer").querySelector("span").textContent = "Remove \xB7 " + state.tools.hammer;
    $("shuffle").querySelector("span").textContent = "Shuffle \xB7 " + state.tools.shuffle;
  }
  function resize() {
    const l = renderer.resize();
    $("message").style.top = l.messageY + "px";
    $("trayLabel").style.top = l.trayLabelY + "px";
    if (l.wide) {
      $("trayLabel").style.left = l.w * 0.63 + "px";
      $("message").style.left = l.w * 0.8 + "px";
      $("trayLabel").style.right = "8px";
    } else {
      $("message").style.left = "50%";
      $("trayLabel").style.left = "0";
      $("trayLabel").style.right = "0";
    }
    pointer = null;
    drag = null;
  }
  function button(id, text, cls = "") {
    return `<button id="${id}" class="${cls}">${text}</button>`;
  }
  function bind(id, fn) {
    $(id)?.addEventListener("click", fn);
  }
  function exit() {
    return '<a class="exitLink" href="../../index.html">\u2190 Back to Goobs Games</a>';
  }
  function modal(html) {
    lastFocus = document.activeElement;
    $("panel").innerHTML = html;
    $("modal").hidden = false;
    pointer = null;
    drag = null;
    $("panel").querySelector("button,a")?.focus();
  }
  function close() {
    $("modal").hidden = true;
    lastFocus?.focus?.();
  }
  function closeButton() {
    return button("close", "\xD7", "close");
  }
  function start(level = 1, endless = false) {
    state = B.create(level, Date.now(), endless);
    history = [];
    board = B.clone(state.board);
    score = 0;
    selected = -1;
    target = -1;
    hint = null;
    queue = [];
    anim = null;
    busy = false;
    hammerMode = false;
    awarded = false;
    meta.level = level;
    save();
    close();
    update();
    msg(level === 1 && !endless ? "Try the lagoon stack beside the matching stack on the board." : "Match top colors. Ten matching tiles clear.");
  }
  function guide() {
    modal(`${closeButton()}<div class="eyebrow">A LITTLE SORTING. A LOT OF SATISFACTION.</div><h2 id="modalTitle">Find your flow.</h2><div class="rule"><strong>1</strong><p><b>Place a stack.</b> Press a stack in the tray, drag it over an empty hex, and release. The highlighted hex is where it will land. Tap-to-select and tap-to-place also work.</p></div><div class="rule"><strong>2</strong><p><b>Match the top colors.</b> All touching stacks with matching tops combine that color before any group clears\u2014even when the total goes above 10. Only touching hexes can exchange tiles.</p></div><div class="rule"><strong>10</strong><p><b>Ten clears.</b> When a top group reaches 10 or more matching tiles, that whole color group clears. Colors underneath stay and can trigger another match.</p></div><div class="rule"><strong>\u2197</strong><p><b>Open more space.</b> The numbers on locked hexes are the total cleared tiles needed to unlock them. Reach the board\u2019s target to advance.</p></div><p>Undo takes back a whole move, including its chain reaction. Hints are unlimited. Each board has three removals and three tray shuffles. Removing tiles does not add to your score. There is no timer.</p><p class="tiny">Keyboard: 1\u20133 select a stack; arrow keys choose a space; Enter places it; U undoes.</p><div class="actions">${button("ready", "Let\u2019s play", "primary")}</div>`);
    bind("close", close);
    bind("ready", close);
  }
  function menu(welcome = false) {
    modal(`${welcome ? "" : closeButton()}<div class="eyebrow">GOOBS GAMES</div><h1 id="modalTitle">HEX <em>SLIDE.</em></h1><p>Color finds its way.<br>Build a stack of ten. Watch the board unfold.</p><div class="stats"><div><strong>10</strong>TILES TO CLEAR</div><div><strong>30</strong>CAMPAIGN BOARDS</div><div><strong>\u221E</strong>ENDLESS PLAY</div></div><div class="actions">${button("resume", meta.seen ? "Continue playing \u2192" : "Start sliding \u2192", "primary")}<div class="row">${button("campaign", "Choose board")}${button("endless", "Endless play")}</div><div class="row">${button("guide", "How to play")}${button("settings", "Look & sound")}</div>${button("restart", "Restart this board")}</div>${exit()}<p class="tiny">Offline. No ads. No timers. \xB7 Hex Slide 1.3</p>`);
    bind("close", close);
    bind("resume", () => {
      meta.seen = true;
      save();
      close();
      if (state.status !== "playing") result();
    });
    bind("campaign", campaign);
    bind("endless", () => confirmStart(meta.level, true));
    bind("guide", guide);
    bind("settings", settings);
    bind("restart", () => confirmStart(state.level, state.endless));
  }
  function confirmStart(level, endless = false) {
    if (state.moves === 0) {
      start(level, endless);
      return;
    }
    modal(`${closeButton()}<h2 id="modalTitle">Start a fresh board?</h2><p>This replaces your current board. Completed boards and your best endless score remain saved.</p><div class="actions">${button("newBoard", "Start fresh", "primary")}${button("keep", "Keep this board")}</div>`);
    bind("close", close);
    bind("keep", close);
    bind("newBoard", () => start(level, endless));
  }
  function campaign() {
    modal(`${closeButton()}<div class="eyebrow">THE COLLECTION</div><h2 id="modalTitle">One more board.</h2><p>New colors join as you progress. Take your time.</p><div class="levels">${Array.from({ length: 30 }, (_, i) => i + 1).map((n) => `<button data-level="${n}" ${n > meta.open ? "disabled" : ""}>${n}<small>${meta.wins[n] ? "\u2713" : "\xB7"}</small></button>`).join("")}</div>`);
    bind("close", close);
    $("panel").querySelectorAll("[data-level]").forEach((b) => b.onclick = () => confirmStart(+b.dataset.level));
  }
  function settings() {
    modal(`${closeButton()}<div class="eyebrow">MAKE IT YOURS</div><h2 id="modalTitle">Set the mood.</h2><p>Choose your tabletop.</p><div class="themeSwatches">${HexRenderer.THEMES.map((t, i) => `<button data-theme="${i}" class="${meta.theme === i ? "active" : ""}" style="background:${t.a}">${t.name}</button>`).join("")}</div><div class="actions">${button("sound", meta.sound ? "Sound: On" : "Sound: Off")}${button("done", "Done", "primary")}</div>`);
    bind("close", close);
    bind("done", close);
    bind("sound", () => {
      meta.sound = !meta.sound;
      save();
      $("sound").textContent = meta.sound ? "Sound: On" : "Sound: Off";
      sound();
    });
    $("panel").querySelectorAll("[data-theme]").forEach((b) => b.onclick = () => {
      meta.theme = +b.dataset.theme;
      renderer.setTheme(meta.theme);
      save();
      settings();
    });
  }
  function record() {
    if (state.endless) {
      meta.best = Math.max(meta.best, state.score);
    } else if (state.status === "won") {
      meta.wins[state.level] = Math.max(meta.wins[state.level] || 0, state.score);
      meta.open = Math.max(meta.open, Math.min(30, state.level + 1));
    }
    save();
  }
  function result() {
    if (state.status === "won") {
      record();
      modal(`<div class="eyebrow">BEAUTIFULLY SORTED</div><h2 id="modalTitle">Clear thinking.</h2><div class="stats"><div><strong>${state.score}</strong>TILES CLEARED</div><div><strong>${state.moves}</strong>MOVES</div><div><strong>${state.bestChain}</strong>BEST CHAIN</div></div><div class="actions">${state.level < 30 ? button("next", "Next board \u2192", "primary") : button("endlessNext", "Play endless \u2192", "primary")}${button("boards", "Choose board")}${button("look", "Look at my board")}</div>${exit()}`);
      bind("next", () => start(state.level + 1));
      bind("endlessNext", () => start(15, true));
      bind("boards", campaign);
      bind("look", close);
    } else if (state.status === "blocked") {
      record();
      modal(`<div class="eyebrow">NO EMPTY SPACES</div><h2 id="modalTitle">A little breathing room?</h2><p>Your score is ${state.score}. Undo a move or remove one stack to keep playing.</p><div class="actions">${history.length ? button("undoBlocked", "Undo last move", "primary") : ""}${state.tools.hammer ? button("removeBlocked", "Choose a stack to remove") : ""}${button("retry", "Try a fresh board")}${button("backMenu", "Menu")}</div>${exit()}`);
      bind("undoBlocked", () => {
        close();
        undo();
      });
      bind("removeBlocked", () => {
        close();
        hammerMode = true;
        update();
        msg("Tap any stack to remove it.", true);
      });
      bind("retry", () => start(state.level, state.endless));
      bind("backMenu", () => menu());
    }
  }
  function commit(r) {
    if (r.error) {
      msg(r.error, true);
      sound(180);
      return;
    }
    history.push(B.clone(state));
    if (history.length > 15) history.shift();
    state = r.state;
    selected = -1;
    hint = null;
    target = -1;
    hammerMode = false;
    queue = r.events.slice();
    busy = queue.length > 0;
    record();
    update();
    if (!busy) {
      board = B.clone(state.board);
      score = state.score;
      update();
      return;
    }
    advance();
  }
  function advance() {
    if (!queue.length) {
      anim = null;
      busy = false;
      board = B.clone(state.board);
      score = state.score;
      update();
      if (state.status !== "playing") result();
      return;
    }
    const e = queue.shift();
    if (e.type === "place") {
      board = B.clone(e.board);
      score = e.score;
      sound(430);
      advance();
      return;
    }
    anim = { event: e, start: performance.now(), duration: e.type === "slide" ? 340 : 450 };
    sound(e.type === "slide" ? 480 : 740, e.type === "slide" ? 0.05 : 0.13);
  }
  function undo() {
    if (busy || !history.length) return;
    state = history.pop();
    board = B.clone(state.board);
    score = state.score;
    selected = -1;
    target = -1;
    hint = null;
    hammerMode = false;
    save();
    update();
    msg("Move undone.");
  }
  function place(i) {
    if (busy || !$("modal").hidden) return;
    if (hammerMode) {
      commit(B.hammer(state, i));
      return;
    }
    if (selected < 0) {
      msg("Choose one of the three stacks below first.", true);
      return;
    }
    commit(B.place(state, selected, i));
  }
  function select(slot) {
    if (busy || state.status !== "playing") return;
    selected = slot;
    hammerMode = false;
    hint = null;
    sound(350);
    update();
    msg("Tap an empty hex to place this stack.");
  }
  function getPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (busy || !$("modal").hidden || pointer) return;
    e.preventDefault();
    const p = getPoint(e);
    const slot = renderer.trayAt(p.x, p.y);
    pointer = { id: e.pointerId, start: p, slot, moved: false };
    canvas.setPointerCapture(e.pointerId);
    if (slot >= 0) {
      select(slot);
      drag = { slot, x: p.x, y: p.y };
      msg("Drag onto an empty hex and release.");
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    const p = getPoint(e);
    if (Math.hypot(p.x - pointer.start.x, p.y - pointer.start.y) > 6) pointer.moved = true;
    if (pointer.moved && pointer.slot >= 0) {
      drag = { slot: pointer.slot, x: p.x, y: p.y };
      target = renderer.cellAt(p.x, p.y);
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    const g = pointer, p = getPoint(e);
    pointer = null;
    drag = null;
    target = -1;
    if (g.slot >= 0) {
      if (g.moved) {
        const i = renderer.cellAt(p.x, p.y);
        if (i >= 0) place(i);
        else {
          selected = -1;
          msg("Drop on an empty hex. Your stack is back in the tray.");
        }
      }
    } else if (!g.moved) {
      const i = hammerMode ? renderer.stackAt(state.board, g.start.x, g.start.y) : renderer.cellAt(g.start.x, g.start.y);
      if (i >= 0) place(i);
    }
  });
  function cancelDrag() {
    pointer = null;
    drag = null;
    target = -1;
  }
  canvas.addEventListener("pointercancel", cancelDrag);
  canvas.addEventListener("lostpointercapture", cancelDrag);
  bind("menu", () => menu());
  bind("help", guide);
  bind("undo", undo);
  bind("hint", () => {
    hint = B.hint(state);
    if (hint) {
      selected = hint.slot;
      msg(hint.clear ? `Try the highlighted space for a ${hint.clear}-tile clear.` : "Try the highlighted stack and space.", true);
    } else msg("No empty spaces. Undo or remove a stack.", true);
  });
  bind("hammer", () => {
    hammerMode = !hammerMode;
    selected = -1;
    hint = null;
    update();
    msg(hammerMode ? "Tap a stack to remove it. This does not earn points." : "Removal cancelled.", true);
  });
  bind("shuffle", () => {
    commit(B.shuffle(state));
    msg("Three fresh stacks.");
  });
  window.addEventListener("keydown", (e) => {
    if (!$("modal").hidden || busy) return;
    if (/^[123]$/.test(e.key)) {
      select(+e.key - 1);
      return;
    }
    if (e.key.toLowerCase() === "u") {
      undo();
      return;
    }
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const choices = B.empty(state);
      if (!choices.length) return;
      const n = choices.indexOf(target), dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
      target = choices[(Math.max(0, n) + dir + choices.length) % choices.length];
    }
    if (e.key === "Enter" && target >= 0) place(target);
  });
  function frame(ms) {
    requestAnimationFrame(frame);
    if (anim && ms - anim.start >= anim.duration && $("modal").hidden) {
      board = B.clone(anim.event.board);
      score = anim.event.score;
      update();
      advance();
    }
    if (ms > messageUntil && $("modal").hidden) {
      $("message").classList.remove("notice");
      $("message").textContent = hammerMode ? "Tap a stack to remove it." : busy ? "Follow the colors\u2026" : selected >= 0 ? "Tap an empty hex." : state.status === "won" ? "Board complete. Open the menu to choose another." : "Match the top colors. Ten matching tiles clear.";
    }
    renderer.draw({ state, board, score, selected, target, hint, drag, anim }, ms);
  }
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    pointer = null;
    drag = null;
    if (document.hidden) save();
  });
  window.addEventListener("pagehide", save);
  renderer.setTheme(meta.theme);
  resize();
  update();
  $("loading").hidden = true;
  menu(true);
  requestAnimationFrame(frame);
  if (window.Goobs) {
    Goobs.markPlayed("hexslide");
    Goobs.initUpdates();
  }
  window.__hex = { B, renderer, get state() {
    return state;
  }, get busy() {
    return busy;
  }, get history() {
    return history;
  }, get selected() {
    return selected;
  }, start, select, place, undo, close, finishAnimations() {
    while (busy) {
      if (anim) {
        board = B.clone(anim.event.board);
        score = anim.event.score;
      }
      advance();
    }
  }, setState(s) {
    state = B.clone(s);
    history = [];
    board = B.clone(s.board);
    score = s.score;
    busy = false;
    queue = [];
    anim = null;
    selected = -1;
    save();
    update();
  } };
})();
