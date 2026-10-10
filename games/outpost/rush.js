import * as THREE from "../../shared/three.module.min.js";
const $ = (id) => document.getElementById(id), OP = window.OP, S = window.OPSound;
const levels = window.OP_LEVELS.filter((l) => !l.mission), store = Goobs.store("outpost");
const names = ["Evergreen valley", "Sunstone dunes", "Alpine frontier", "Ember ridge", "Emerald islands", "Amber woodland", "Redrock pass", "Moonlit harbor"];
const types = { b: "Barracks", f: "Tank factory", s: "Guard tower", r: "Rocket battery", F: "Airborne fortress", X: "Citadel" };
const meta = Object.assign({ level: 1, open: 1, stars: {}, best: {}, gold: 0, up: {}, finished: 0, tips: {}, ms: {}, mbest: {} }, store.get("meta", {}) || {});
meta.open = Math.max(1, meta.open | 0);
meta.level = Math.max(1, Math.min(meta.open, meta.level | 0));
meta.stars || (meta.stars = {});
meta.best || (meta.best = {});
meta.up || (meta.up = {});
const prefs = Object.assign({ sound: true, speed: 1 }, store.get("rushPrefs", {}) || {});
if (prefs.pacingVersion !== "2.1") {
  prefs.speed = 1;
  prefs.pacingVersion = "2.1";
}
const stats = Object.assign({ tries: 0, wins: 0, losses: 0, captured: 0, lost: 0, sent: 0, links: 0, cuts: 0, goldEarned: 0, playSec: 0, upgrades: 0, goldSpent: 0 }, store.get("stats", {}) || {});
function save() {
  store.set("meta", meta);
  store.set("stats", stats);
  store.set("rushPrefs", prefs);
}
let basePosition, baseCamera, scene, sim, level, no = meta.level, state = "ready", selected = -1, drag = null, last = 0, acc = 0, hudTick = 0, toastTimer, loadToken = 0, resultTimer, started = false;
let cached = store.get("rushGenerated21", {}) || {}, worker, pending = /* @__PURE__ */ new Map();
const cvs = $("battle"), ink = $("ink"), ctx = ink.getContext("2d");
const clock = (t) => Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");
const paused = () => !$("sheet").hidden || document.hidden || state !== "play";
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2800);
}
function close() {
  if (state === "won" || state === "lost") {
    map();
    return;
  }
  if (state === "ready") {
    state = "play";
    started = true;
    stats.tries++;
    save();
  }
  $("sheet").hidden = true;
}
function modal(content, wide = false) {
  clearDrag();
  $("card").className = "card" + (wide ? " wide" : "");
  $("card").innerHTML = content;
  $("sheet").hidden = false;
  S.playing(false);
  $("card").querySelector("button")?.focus();
}
function button(id, text, cls = "") {
  return `<button id="${id}" class="${cls}">${text}</button>`;
}
function bind(id, fn) {
  $(id)?.addEventListener("click", fn);
}
function dismiss() {
  return button("dismiss", "\xD7", "close");
}
function title(label, text) {
  return `<div class="eyebrow">${label}</div><h2 id="sheetTitle">${text}</h2>`;
}
function menu(welcome = false) {
  modal(`${welcome ? "" : dismiss()}<div class="eyebrow">A LITTLE STRATEGY. A LOT OF CONQUEST.</div><h2 id="sheetTitle" class="heroTitle">OUTPOST<br><span>RUSH.</span></h2><p class="subtitle">One connection can turn the battle. Build your front. Break theirs.</p><div class="operationCard"><b>${String(no).padStart(2, "0")}</b><div><strong>${names[level?.region || 0]}</strong><small>${meta.stars[no] ? "\u2605".repeat(meta.stars[no]) + " \xB7 Replay operation" : "Your next conquest"}</small></div></div><div class="actions">${button("resume", welcome ? "Deploy troops \u2192" : "Resume battle \u2192", "primary")}<div class="row">${button("campaign", "Operations")}${button("upgrades", "Armory")}</div><div class="row">${button("guide", "How to Play")}${button("sound", prefs.sound ? "Sound on" : "Sound off")}</div>${welcome ? "" : button("restart", "Restart this operation", "quiet small")}</div><a class="textlink" href="index.html">\u2190 Back to War Games</a><a class="textlink" href="legacy.html">Previous interface & special missions \u2197</a>`);
  bind("dismiss", close);
  bind("resume", () => {
    if (!started) {
      stats.tries++;
      save();
    }
    started = true;
    state = "play";
    close();
    S.unlock();
  });
  bind("campaign", () => map());
  bind("guide", help);
  bind("upgrades", armory);
  bind("sound", () => {
    prefs.sound = !prefs.sound;
    S.setEnabled(prefs.sound);
    save();
    $("sound").textContent = prefs.sound ? "Sound on" : "Sound off";
  });
  bind("restart", () => start(no, true));
}
function help() {
  modal(`${dismiss()}${title("FIELD GUIDE", "Simple orders.<br>Big consequences.")}<div class="guide"><article><b>Connect and conquer</b><p>Drag from a blue tower to any other tower. Or tap your tower, then tap its target. A line keeps sending troops until you cut it. Friendly arrivals reinforce; enemy arrivals reduce the number until the tower turns your color.</p></article><article><b>Cut to change your plan</b><p>Swipe across a blue line, tap the same source and target again, or select a tower and choose <strong>Stop sending</strong>. Troops already marching carry on.</p></article><article><b>Grow, then overwhelm</b><p>Sending does not spend your tower\u2019s number, but it pauses natural growth. Idle towers grow. Reach <strong>10</strong> for two outgoing lines and <strong>30</strong> for three. Filled dots show lines in use. Converge on one target to break a stalemate.</p></article><article><b>Know your buildings</b><p><strong>Factories</strong> send tanks worth two soldiers. <strong>Guard towers</strong> automatically shoot nearby enemies. <strong>Rocket batteries</strong> bombard a chosen enemy tower; send troops to capture it. <strong>Fortresses</strong> send paratroopers over obstacles.</p></article><article><b>Watch the terrain</b><p>Rocks and water block routes. Troops break wooden fences and rebuild bridges. Mines damage nearby troops. Every rival color also fights the others.</p></article></div>${button("back", "Back to battle", "primary")}<p class="collection-build">War Games \xB7 Version 3.1.0</p>`);
  bind("dismiss", close);
  bind("back", () => {
    started = true;
    state = "play";
    close();
  });
}
function map(page = Math.floor((no - 1) / 40)) {
  const first = page * 40 + 1, lastN = Math.min(first + 39, Math.max(levels.length, meta.open)), lastPage = Math.floor((Math.max(levels.length, meta.open) - 1) / 40);
  modal(`${dismiss()}${title("CAMPAIGN", "Choose your operation")}<p>${meta.open - 1} operations cleared \xB7 Your progress and armory carry over.</p><div class="levelgrid">${Array.from({ length: lastN - first + 1 }, (_, i) => {
    let n = first + i;
    return `<button data-level="${n}" class="${n === no ? "active" : ""}" ${n > meta.open ? "disabled" : ""}>${n}<small>${n > meta.open ? "\u2014" : meta.stars[n] ? "\u2605".repeat(meta.stars[n]) : "\xB7"}</small></button>`;
  }).join("")}</div><div class="row">${button("prev", "\u2190 Previous")}${button("next", "Next \u2192")}</div><p class="small">160 campaign operations, followed by generated battles. Special missions remain in the previous interface.</p>`, true);
  $("prev").disabled = page === 0;
  $("next").disabled = page >= lastPage;
  bind("prev", () => map(page - 1));
  bind("next", () => map(page + 1));
  bind("dismiss", close);
  $("card").querySelectorAll("[data-level]").forEach((b) => b.onclick = () => start(+b.dataset.level, true));
}
function armory() {
  const labels = { sol: "Infantry strength", tank: "Tank strength", prod: "Production speed", start: "Starting garrison" };
  modal(`${dismiss()}${title("ARMORY", `${meta.gold} gold`)}<p>Earn gold by completing operations. Existing upgrades are already active.</p><div class="upgrades">${OP.UP_KEYS.map((k) => {
    let n = meta.up[k] || 0, cost = OP.upCost(n + 1), max = n >= OP.UP_MAX;
    return `<div class="upgrade"><div><strong>${labels[k]}</strong><small>Level ${n} / ${OP.UP_MAX}</small></div><button data-up="${k}" ${max || meta.gold < cost ? "disabled" : ""}>${max ? "MAX" : cost + " gold"}</button></div>`;
  }).join("")}</div><p class="small">New purchases take effect on your next deployment.</p>${button("backMenu", "Back", "quiet")}`);
  bind("dismiss", close);
  bind("backMenu", () => menu(!started));
  $("card").querySelectorAll("[data-up]").forEach((b) => b.onclick = () => {
    const k = b.dataset.up, n = meta.up[k] || 0, cost = OP.upCost(n + 1);
    if (n >= OP.UP_MAX || cost > meta.gold) return;
    meta.gold -= cost;
    meta.up[k] = n + 1;
    stats.upgrades++;
    stats.goldSpent += cost;
    save();
    S.ding();
    armory();
  });
}
async function getLevel(n) {
  if (n <= levels.length) return levels[n - 1];
  if (cached[n]) return cached[n];
  if (!worker) {
    worker = new Worker("generator.js");
    worker.onmessage = (e) => {
      const { n: n2, level: level2, error } = e.data, p = pending.get(n2);
      if (!p) return;
      pending.delete(n2);
      if (error) p.reject(Error(error));
      else {
        cached[n2] = level2;
        const keys = Object.keys(cached);
        if (keys.length > 8) delete cached[keys[0]];
        store.set("rushGenerated21", cached);
        p.resolve(level2);
      }
    };
    worker.onerror = (e) => {
      for (const p of pending.values()) p.reject(Error(e.message));
      pending.clear();
      worker.terminate();
      worker = null;
    };
  }
  return new Promise((resolve, reject) => {
    pending.set(n, { resolve, reject });
    worker.postMessage(n);
  });
}
async function start(n, play = false) {
  const token = ++loadToken;
  clearTimeout(resultTimer);
  clearDrag();
  selected = -1;
  state = "loading";
  $("loading").hidden = false;
  $("loading").textContent = n > levels.length ? "Building your next battlefield\u2026" : "Preparing the battlefield\u2026";
  $("sheet").hidden = true;
  try {
    const L = await getLevel(n);
    if (token !== loadToken) return;
    no = n;
    level = n <= levels.length ? { ...L, target: Math.round((L.target || 60) * 2.2) } : L;
    sim = OP.create(L, { seed: n * 4729 + 11, ai: OP.cpuAI(L), up: meta.up });
    scene.setLevel(L, sim);
    acc = 0;
    started = play;
    state = play ? "play" : "ready";
    meta.level = n;
    if (play) stats.tries++;
    save();
    $("levelTag").textContent = "OPERATION " + String(n).padStart(2, "0");
    $("regionName").textContent = names[L.region || 0];
    S.setRegion(L.region || 0);
    resize();
    hud();
    status();
    $("loading").hidden = true;
    if (!play) menu(true);
    else if (n <= 4) toast(["", "Connect your blue tower to a neutral outpost.", "Swipe across the blue line to cut it.", "A tower with 30 troops can send along three lines.", "Connect to your own tower to reinforce it."][n]);
  } catch (e) {
    if (token !== loadToken) return;
    $("loading").textContent = "This battlefield could not load. Reload to try again.";
    console.error(e);
  }
}
function resize() {
  const r = cvs.getBoundingClientRect(), desktop = r.width > 760 && r.height > 480, left = desktop ? 300 : 12, right = desktop ? 30 : 12, top = r.height < 480 ? 65 : 99, bottom = r.height < 480 ? 68 : 105;
  scene.camera.position.copy(basePosition);
  scene.camera.quaternion.copy(baseCamera);
  if (r.width / r.height > 1.7 && r.height < 600) {
    scene.camera.position.set(basePosition.z, basePosition.y, 0);
    scene.camera.lookAt(0, 0, 0);
  }
  scene.camera.updateMatrixWorld(true);
  scene.resize(r.width - left - right, r.height, { top, bottom, side: 12 });
  const scale = scene.view.scale, cam = scene.camera, halfExtra = (left + right) * scale / 2;
  cam.left -= halfExtra + (left - right) * scale / 2;
  cam.right += halfExtra - (left - right) * scale / 2;
  cam.updateProjectionMatrix();
  scene.view.w = r.width;
  scene.renderer.setSize(r.width, r.height, false);
  ink.width = Math.round(r.width * devicePixelRatio);
  ink.height = Math.round(r.height * devicePixelRatio);
  ink.style.width = r.width + "px";
  ink.style.height = r.height + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  clearDrag();
}
function point(e) {
  const r = cvs.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}
function hit(p, except = -1, slack = 14) {
  let best = -1, dist = Infinity;
  sim.towers.forEach((t, i) => {
    if (i === except) return;
    const q = scene.towerScreen(i), d = OP.segDist(p[0], p[1], q.bx, q.by, q.tx, q.ty) - q.r;
    if (d < slack && d < dist) {
      best = i;
      dist = d;
    }
  });
  return best;
}
function clearDrag() {
  if (scene) scene.dragHide();
  drag = null;
  ctx.clearRect(0, 0, ink.width, ink.height);
}
function choose(i) {
  selected = i;
  if (i >= 0) {
    const t = sim.towers[i];
    scene.dragShow(i, t.x, t.y, -1, true);
  } else scene.dragHide();
  status();
}
function status() {
  const t = sim?.towers[selected];
  if (t && t.o === 1) {
    $("statusKicker").textContent = `${types[t.type]} \xB7 ${t.n} troops \xB7 ${t.links.length}/${OP.slots(t.n, t.type)} lines`;
    $("statusText").textContent = t.type === "s" ? "Automatically defending nearby routes" : "Tap a target to send. Tap it again to cut.";
    $("stop").hidden = !t.links.length;
  } else {
    selected = -1;
    $("stop").hidden = true;
    $("statusKicker").textContent = sim ? `CAPTURE ALL RIVAL TOWERS \xB7 ${clock(sim.t)}` : "READY TO COMMAND";
    $("statusText").textContent = no === 2 ? "Swipe across a blue line to redirect your troops" : "Drag between towers \xB7 or tap a source, then a target";
  }
}
function command(a, b) {
  if (a === b) {
    choose(a);
    return;
  }
  const A = sim.towers[a];
  if (A?.o !== 1) return;
  const existing = OP.linkFrom(sim, a, b);
  if (existing) {
    OP.cut(sim, existing, "cut");
    stats.cuts++;
    S.cut();
    toast("Route cut. Troops already marching carry on.");
    choose(a);
    return;
  }
  const why = OP.playerLink(sim, a, b);
  if (why) {
    S.nope();
    const messages = { slots: `All ${OP.slots(A.n, A.type)} lines in use. Cut one${A.n < 30 ? " or reinforce this tower" : ""}.`, blocked: "That route is blocked. Choose a clear approach.", own: "Aim the rocket battery at another color.", dup: "Already sending to that tower.", owner: "Choose one of your blue towers." };
    toast(messages[why] || "This building cannot send troops.");
  } else {
    stats.links++;
    S.link();
    if (navigator.vibrate) navigator.vibrate(12);
  }
  choose(a);
  events();
}
cvs.addEventListener("pointerdown", (e) => {
  if (paused() || drag) return;
  e.preventDefault();
  S.unlock();
  const p = point(e), i = hit(p);
  drag = { id: e.pointerId, p, last: p, start: i, from: i >= 0 && sim.towers[i].o === 1 ? i : -1, moved: false, snap: -1, trail: [p] };
  cvs.setPointerCapture(e.pointerId);
});
cvs.addEventListener("pointermove", (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const p = point(e), d = drag;
  if (Math.hypot(p[0] - d.p[0], p[1] - d.p[1]) > 8) d.moved = true;
  if (d.moved && d.from >= 0) {
    const A = sim.towers[d.from];
    if (A.o !== 1) {
      clearDrag();
      return;
    }
    d.snap = hit(p, d.from, 25);
    const w = scene.ground(...p);
    scene.dragShow(d.from, w[0], w[1], d.snap, d.snap < 0 || !OP.whyNot(sim, d.from, d.snap, 1) || !!OP.linkFrom(sim, d.from, d.snap));
  } else if (d.moved) {
    cutBetween(d.last, p);
    d.trail.push(p);
    if (d.trail.length > 18) d.trail.shift();
    ctx.clearRect(0, 0, ink.width, ink.height);
    ctx.beginPath();
    d.trail.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q));
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.shadowBlur = 9;
    ctx.shadowColor = "#173f3d";
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  d.last = p;
});
cvs.addEventListener("pointerup", (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const d = drag, p = point(e), i = hit(p, d.moved ? d.from : -1, d.moved ? 25 : 14);
  clearDrag();
  if (paused()) return;
  if (d.moved) {
    if (d.from >= 0 && i >= 0) command(d.from, i);
    else choose(-1);
  } else if (selected >= 0 && i >= 0 && i !== selected) {
    command(selected, i);
  } else if (i >= 0 && sim.towers[i].o === 1) {
    choose(selected === i ? -1 : i);
  } else choose(-1);
});
cvs.addEventListener("pointercancel", () => {
  clearDrag();
  choose(-1);
});
cvs.addEventListener("lostpointercapture", () => {
  if (drag) {
    clearDrag();
    choose(-1);
  }
});
function cutBetween(a, b) {
  for (const L of [...sim.links]) {
    if (L.o !== 1) continue;
    const A = sim.towers[L.a], B = sim.towers[L.b], dx = (B.x - A.x) / L.len, dy = (B.y - A.y) / L.len, c = scene.project(A.x + dx * A.r, A.y + dy * A.r), d = scene.project(B.x - dx * B.r, B.y - dy * B.r);
    if (OP.segCross(a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]) >= 0) {
      OP.cut(sim, L, "cut");
      stats.cuts++;
      S.cut();
      choose(-1);
    }
  }
}
function events() {
  for (const e of OP.takeEvents(sim)) {
    if (e.t === "cap") {
      scene.burst(e.i, e.o);
      S.capture(e.o === 1);
      if (e.o === 1) stats.captured++;
      else if (e.from === 1) stats.lost++;
      if (selected === e.i && e.o !== 1) choose(-1);
    } else if (e.t === "hit") {
      scene.puff(e.x, e.y, false);
      S.hit();
    } else if (e.t === "clash") {
      scene.puff(e.x, e.y, true, 16772544);
      if (e.lo >= 0) scene.meet(e.lo, e.hi, e.p);
      S.clash();
    } else if (e.t === "die") scene.puff(e.x, e.y, false);
    else if (e.t === "lvl") {
      scene.levelUp(e.i);
      if (sim.towers[e.i].o === 1) S.levelUp();
    } else if (e.t === "shot") {
      scene.shot(e.i, e.x, e.y);
      S.shot();
    } else if (e.t === "rocket") S.rocket();
    else if (e.t === "rhit") {
      scene.rocketHit(e.i);
      S.rhit();
    } else if (e.t === "boom") {
      scene.boom(e.x, e.y);
      S.boom();
    } else if (e.t === "fhit") {
      scene.fenceHit(e.i);
      S.fence();
    } else if (e.t === "fbreak") {
      scene.fenceBreak(e.i);
      S.fenceBreak();
    } else if (e.t === "build") scene.build(e.i, e.x, e.y);
    else if (e.t === "bridge") {
      scene.bridgeDone(e.i);
      S.bridge();
    } else if (e.t === "gold") {
      scene.goldPick(e.i, e.src);
      if (e.o === 1) {
        S.gold();
        toast("Gold secured \u2014 production boosted.");
      }
    } else if (e.t === "send" && e.o === 1) stats.sent++;
  }
}
function hud() {
  const strength = OP.strength(sim), cols = [1, ...OP.cpuColors(level)], total = cols.reduce((n, o) => n + strength[o], 0) || 1;
  const html = cols.map((o) => `<i style="--color:${scene.TEAM[o].main};flex-grow:${strength[o] / total}"></i>`).join("");
  $("power").innerHTML = html;
  $("mobilePower").innerHTML = html;
  $("blueCount").textContent = sim.towers.filter((t) => t.o === 1).length;
  $("enemyCount").textContent = sim.towers.filter((t) => t.o > 1).length;
  status();
}
function finish() {
  state = sim.over === 1 ? "won" : "lost";
  clearDrag();
  selected = -1;
  const won = state === "won", t = sim.t, target = level.target || 60, stars = t <= target ? 3 : t <= target * 1.5 ? 2 : 1, first = !meta.stars[no];
  let gold = sim.coins?.[1] || 0;
  stats.playSec += Math.round(t);
  meta.finished++;
  if (won) {
    stats.wins++;
    const base = first ? level.gold || 30 : Math.round((level.gold || 30) / 2);
    gold += base + Math.round(base * (stars === 3 ? 0.5 : stars === 2 ? 0.2 : 0));
    meta.stars[no] = Math.max(meta.stars[no] || 0, stars);
    meta.best[no] = Math.min(meta.best[no] || Infinity, t);
    meta.open = Math.max(meta.open, no + 1);
    S.win();
  } else {
    stats.losses++;
    S.lose();
  }
  meta.gold += gold;
  stats.goldEarned += gold;
  save();
  hud();
  resultTimer = setTimeout(() => {
    modal(`${title(won ? "OPERATION COMPLETE" : "REGROUP & RETURN", won ? "Ground secured." : "A new plan awaits.")}<p>${won ? "Every rival outpost is flying your colors." : "Concentrate several towers on one target. Cut unproductive lines so your towers can grow."}</p>${won ? `<div class="stars">${"\u2605".repeat(stars)}<span style="opacity:.22">${"\u2605".repeat(3 - stars)}</span></div>` : ""}<div class="resultStats"><div>BATTLE TIME<b>${clock(t)}</b></div><div>GOLD EARNED<b>+${gold}</b></div></div><div class="actions">${button("continue", won ? "Next operation \u2192" : "Try again \u2192", "primary")}<div class="row">${button("replay", "Replay")}${button("operations", "Operations")}</div></div>`);
    bind("continue", () => start(won ? no + 1 : no, true));
    bind("replay", () => start(no, true));
    bind("operations", () => map());
  }, 850);
}
function frame(ms) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, last ? (ms - last) / 1e3 : 0);
  last = ms;
  if (!sim) return;
  const pause = paused();
  S.playing(!pause);
  if (!pause) {
    acc += dt * prefs.speed;
    let count = 0;
    while (acc >= OP.DT && count < 8 && state === "play") {
      OP.step(sim);
      events();
      acc -= OP.DT;
      count++;
      if (sim.over) finish();
    }
    if (count >= 8) acc = 0;
  }
  scene.sync(sim, dt, pause);
  scene.render();
  hudTick += dt;
  if (hudTick > 0.25) {
    hudTick = 0;
    hud();
  }
}
bind("pause", () => {
  if (state === "play" || state === "ready") menu(!started);
});
bind("help", help);
bind("stop", () => {
  const A = sim?.towers[selected];
  if (A?.o !== 1) return;
  for (const L of [...A.links]) {
    OP.cut(sim, L, "cut");
    stats.cuts++;
  }
  S.cut();
  toast("Tower resting. Natural growth resumed.");
  status();
});
bind("speed", () => {
  prefs.speed = prefs.speed === 1 ? 1.5 : 1;
  $("speed").textContent = prefs.speed + "\xD7";
  save();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!$("sheet").hidden) close();
    else menu(!started);
  }
  if (e.key === " " && e.target === document.body) {
    e.preventDefault();
    if ($("sheet").hidden) menu(!started);
    else close();
  }
});
$("sheet").addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const list = [...$("card").querySelectorAll("button:not(:disabled),a[href]")];
  if (!list.length) return;
  if (e.shiftKey && document.activeElement === list[0]) {
    e.preventDefault();
    list[list.length - 1].focus();
  } else if (!e.shiftKey && document.activeElement === list[list.length - 1]) {
    e.preventDefault();
    list[0].focus();
  }
});
document.addEventListener("visibilitychange", () => {
  clearDrag();
  last = 0;
  acc = 0;
  S.playing(!paused());
});
window.addEventListener("pagehide", save);
window.addEventListener("resize", () => {
  if (scene) resize();
});
(async function boot() {
  try {
    scene = window.OPScene.build(THREE, cvs, OP);
    baseCamera = scene.camera.quaternion.clone();
    basePosition = scene.camera.position.clone();
    S.setEnabled(prefs.sound);
    $("speed").textContent = prefs.speed + "\xD7";
    Goobs.markPlayed("outpost");
    Goobs.initUpdates();
    await start(no);
    requestAnimationFrame(frame);
    window.__op = { get sim() {
      return sim;
    }, get SC() {
      return scene;
    }, get state() {
      return state;
    }, get levelNo() {
      return no;
    }, get level() {
      return level;
    }, get selected() {
      return selected;
    }, get ready() {
      return true;
    }, OP, startLevel: (n) => start(n, true), towerScreen: (i) => scene.towerScreen(i), link: command, meta: () => meta, pause: () => menu(), close, finish };
    window.__opReady = true;
  } catch (e) {
    $("loading").hidden = false;
    $("loading").textContent = "Unable to start 3D graphics. Please reload or try another browser.";
    console.error(e);
  }
})();
