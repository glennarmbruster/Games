
/* Outpost Rush sounds: synthesized with Web Audio (no audio files). Effects (march ticks, tank rumble, hits, capture
   fanfare, level-up blip, cut swish, sniper cracks, rocket whooshes, mine booms, fence cracks, bridge knocks, gold
   bar clinks, win / lose) and a light tune per region (made up as it plays: meadow plucks, desert oud and hand drum,
   tundra bells). Sound and music switch on and off separately. */
var OPSound = (function () {
  'use strict';
  var ac = null, master = null, fxBus = null, musBus = null, on = false, music = false, playing = false, last = {};
  function ctx() {
    if (!on && !music) return null;
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      try { ac = new AC(); } catch (e) { return null; }
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      fxBus = ac.createGain(); fxBus.gain.value = 1; fxBus.connect(master);
      musBus = ac.createGain(); musBus.gain.value = 0.32; musBus.connect(master);
    }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* ignore */ } }
    return ac;
  }
  function tone(bus, type, f0, f1, dur, gain, delay) {
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.03);
  }
  var nbuf = null;
  function noise(freq, q, dur, gain, delay) {
    var a = ctx(); if (!a) return;
    if (!nbuf) { nbuf = a.createBuffer(1, a.sampleRate, a.sampleRate); var d = nbuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var t = a.currentTime + (delay || 0), s = a.createBufferSource(); s.buffer = nbuf;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    var g = a.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(fxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  // effects that can come many times a second are rate-limited so a big battle isn't a wall of noise
  function limit(k, ms) { var n = performance.now(); if (n - (last[k] || 0) < ms) return false; last[k] = n; return true; }

  // ---------- the region tunes (made up as they play; one style per region) ----------
  // meadow: a plucked major-pentatonic tune over a soft bass; desert: a slower plucked tune in a Hijaz-like scale over
  // a hand-drum beat; tundra: bell tones in a minor scale with a light sleigh-bell tick
  var STYLES = [
    { scale: [0, 2, 4, 7, 9, 12, 14, 16], roots: [0, -5, -3, -7], bpm: 112, base: 392, voice: 'pluck', dens: [0.8, 0.3] },
    { scale: [0, 1, 4, 5, 7, 8, 10, 12], roots: [0, 0, -2, 1], bpm: 96, base: 330, voice: 'oud', dens: [0.7, 0.35], drum: true },
    { scale: [0, 3, 5, 7, 10, 12, 15], roots: [0, -4, -2, -5], bpm: 84, base: 440, voice: 'bell', dens: [0.55, 0.15], bells: true },
    // 0.3.0: lava: a low growling line in a Phrygian-dominant scale over a heavy drum; jungle: bright marimba over a
    // shaker and hand drum; autumn: a gentle harp in Dorian; canyon: a twangy western guitar with hoof clip-clops;
    // night harbor: soft vibraphone chords in a slow swing with a brushed tick
    { scale: [0, 1, 4, 5, 7, 8, 10, 12], roots: [0, 1, 0, -2], bpm: 118, base: 220, voice: 'oud', dens: [0.62, 0.25], drum: true, heavy: true },
    { scale: [0, 2, 4, 7, 9, 12, 14, 16], roots: [0, 5, -3, -5], bpm: 126, base: 523, voice: 'marimba', dens: [0.85, 0.45], drum: true, shaker: true },
    { scale: [0, 2, 3, 5, 7, 9, 10, 12], roots: [0, -2, -4, -5], bpm: 90, base: 392, voice: 'harp', dens: [0.72, 0.2] },
    { scale: [0, 3, 5, 7, 10, 12, 15], roots: [0, 0, -5, -7], bpm: 104, base: 294, voice: 'twang', dens: [0.66, 0.25], clop: true },
    { scale: [0, 2, 4, 7, 9, 10, 12, 14], roots: [0, -3, -5, -7], bpm: 76, base: 349, voice: 'vibes', dens: [0.58, 0.18], brush: true }
  ];
  var ST = STYLES[0], nextT = 0, beat = 0, timer = 0, R = 1;
  function rnd() { R = (R * 16807) % 2147483647; return R / 2147483647; }
  function note(semi) { return ST.base * Math.pow(2, semi / 12); }
  function pluck(f, t, dur, g, voice) {
    var a = ac, o = a.createOscillator(), o2 = a.createOscillator(), gn = a.createGain(), out = gn;
    voice = voice || 'pluck';
    o.type = voice === 'oud' || voice === 'twang' ? 'sawtooth' : voice === 'bell' || voice === 'marimba' || voice === 'vibes' ? 'sine' : 'triangle'; o2.type = 'sine'; o.frequency.value = f;
    o2.frequency.value = f * (voice === 'bell' ? 2.76 : voice === 'marimba' ? 4 : voice === 'vibes' ? 3 : 2);
    if (voice === 'bell') dur *= 2.2; else if (voice === 'harp' || voice === 'vibes') dur *= 1.8; else if (voice === 'marimba') dur *= 0.7;
    if (voice === 'twang') voice = 'oud'; // a brighter, shorter oud
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g * (voice === 'oud' ? 0.6 : 1), t + (voice === 'bell' ? 0.004 : 0.012)); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var g2 = a.createGain(); g2.gain.value = voice === 'bell' ? 0.35 : 0.25; o2.connect(g2); g2.connect(gn);
    if (voice === 'oud') { var lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(500, t + dur); gn.connect(lp); out = lp; }
    o.connect(gn); out.connect(musBus); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function tap(t, freq, dur, g) { // a drum or bell tick on the music bus
    var a = ac; if (!nbuf) return; var s = a.createBufferSource(); s.buffer = nbuf;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.2;
    var gn = a.createGain(); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(gn); gn.connect(musBus); s.start(t, rnd() * 0.5); s.stop(t + dur + 0.02);
  }
  function schedule() {
    if (!ac || !music || !playing) return;
    if (!nbuf) { nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); var d = nbuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var spb = 60 / ST.bpm / 2; // eighth notes
    while (nextT < ac.currentTime + 0.25) {
      var bar = Math.floor(beat / 8) % 4, root = ST.roots[bar], pos = beat % 8;
      if (pos === 0 || pos === 4) pluck(note(root - 24), nextT, 0.5, 0.22);          // bass
      if (pos === 2 || pos === 6) pluck(note(root - 12 + 7), nextT, 0.18, 0.07);     // offbeat chord tick
      if (ST.drum) { if (pos === 0 || pos === 3 || pos === 6) tap(nextT, pos ? 900 : 180, pos ? 0.08 : 0.16, pos ? 0.12 : 0.3); }
      if (ST.bells && pos % 2 === 1) tap(nextT, 7000, 0.06, 0.05);
      if (ST.heavy && (pos === 0 || pos === 4)) { pluck(note(root - 36), nextT, 0.35, 0.3); tap(nextT, 120, 0.2, 0.35); }
      if (ST.shaker) tap(nextT, 8000, 0.04, pos % 2 ? 0.05 : 0.08);
      if (ST.clop && (pos === 1 || pos === 2 || pos === 5 || pos === 6)) tap(nextT, pos % 4 === 1 ? 1300 : 950, 0.05, 0.12);
      if (ST.brush && (pos === 2 || pos === 6)) tap(nextT, 5000, 0.18, 0.06);
      var play = pos % 2 === 0 ? rnd() < ST.dens[0] : rnd() < ST.dens[1];
      if (play) pluck(note(root + ST.scale[Math.floor(rnd() * ST.scale.length)]), nextT, 0.28, 0.1, ST.voice);
      nextT += spb; beat++;
    }
  }
  function startMusic() {
    if (!music || !playing) return; var a = ctx(); if (!a) return;
    if (!timer) { nextT = a.currentTime + 0.1; timer = setInterval(schedule, 90); }
    musBus.gain.cancelScheduledValues(a.currentTime); musBus.gain.setTargetAtTime(0.32, a.currentTime, 0.2);
  }
  function stopMusic() { if (timer) { clearInterval(timer); timer = 0; } if (ac && musBus) { musBus.gain.cancelScheduledValues(ac.currentTime); musBus.gain.setTargetAtTime(0.0001, ac.currentTime, 0.05); } }

  return {
    setEnabled: function (v) { on = !!v; if (on) ctx(); },
    setRegion: function (r) { ST = STYLES[Math.max(0, Math.min(STYLES.length - 1, r | 0))]; beat = 0; },
    setMusic: function (v) { music = !!v; if (music) startMusic(); else stopMusic(); },
    // the tune plays only while a battle runs (not paused, not on a card)
    playing: function (v) { v = !!v; if (v === playing) return; playing = v; if (v) startMusic(); else stopMusic(); },
    unlock: function () { if (on || music) { ctx(); if (music && playing && !timer) startMusic(); } },
    send: function () { if (on && limit('send', 110)) tone(fxBus, 'square', 900 + Math.random() * 120, 700, 0.03, 0.035); },
    hit: function () { if (on && limit('hit', 70)) { noise(700 + Math.random() * 300, 1.4, 0.07, 0.25); tone(fxBus, 'sine', 180, 90, 0.07, 0.12); } },
    clash: function () { if (on && limit('clash', 90)) { noise(2400, 3, 0.05, 0.18); tone(fxBus, 'triangle', 1400, 900, 0.04, 0.05); } },
    reinf: function () { if (on && limit('reinf', 140)) tone(fxBus, 'sine', 660, 880, 0.06, 0.05); },
    capture: function (mine) {
      if (!on) return;
      if (mine) { [523, 659, 784, 1047].forEach(function (f, i) { tone(fxBus, 'triangle', f, 0, 0.16, 0.2, i * 0.07); }); noise(4000, 1, 0.3, 0.1, 0.22); }
      else { tone(fxBus, 'sawtooth', 330, 165, 0.35, 0.12); tone(fxBus, 'triangle', 262, 131, 0.4, 0.14, 0.05); }
    },
    levelUp: function () { if (on && limit('lvl', 120)) { tone(fxBus, 'sine', 880, 1320, 0.09, 0.09); tone(fxBus, 'sine', 1320, 0, 0.1, 0.06, 0.07); } },
    link: function () { if (on) { tone(fxBus, 'triangle', 520, 780, 0.08, 0.16); noise(3000, 2, 0.05, 0.1); } },
    cut: function () { if (on) { noise(3200, 1.2, 0.16, 0.3); tone(fxBus, 'sine', 900, 300, 0.12, 0.08); } },
    nope: function () { if (on) tone(fxBus, 'square', 200, 150, 0.12, 0.08); },
    win: function () { if (!on) return; [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { tone(fxBus, 'triangle', f, 0, i === 5 ? 0.6 : 0.18, 0.24, i * 0.09); }); noise(5000, 1, 0.5, 0.1, 0.45); },
    lose: function () { if (on) [440, 392, 330, 262].forEach(function (f, i) { tone(fxBus, 'triangle', f, 0, 0.25, 0.2, i * 0.18); }); },
    // Phase 2: tanks, paratroopers, sniper shots, rockets, mines, fences, bridges, gold bars
    tank: function () { if (on && limit('tank', 160)) { tone(fxBus, 'sawtooth', 70, 50, 0.12, 0.05); noise(300, 1, 0.1, 0.12); } },
    para: function () { if (on && limit('para', 180)) noise(1800, 0.8, 0.14, 0.08); },
    shot: function () { if (on && limit('shot', 90)) { noise(3500, 0.9, 0.05, 0.28); tone(fxBus, 'square', 1600, 400, 0.04, 0.05); } },
    rocket: function () { if (on && limit('rocket', 120)) { noise(900, 0.7, 0.35, 0.2); tone(fxBus, 'sawtooth', 220, 520, 0.3, 0.05); } },
    rhit: function () { if (on && limit('rhit', 100)) { noise(500, 0.8, 0.25, 0.35); tone(fxBus, 'sine', 120, 50, 0.25, 0.2); } },
    boom: function () { if (on && limit('boom', 80)) { noise(260, 0.6, 0.55, 0.5); tone(fxBus, 'sine', 90, 30, 0.5, 0.35); } },
    fence: function () { if (on && limit('fence', 90)) { noise(900, 2, 0.06, 0.25); tone(fxBus, 'triangle', 240, 160, 0.06, 0.1); } },
    fenceBreak: function () { if (on) { noise(1200, 1, 0.3, 0.35); [300, 220, 170].forEach(function (f, i) { tone(fxBus, 'triangle', f, f * 0.7, 0.08, 0.12, i * 0.05); }); } },
    build: function () { if (on && limit('build', 110)) { tone(fxBus, 'triangle', 520, 480, 0.05, 0.12); noise(1500, 3, 0.04, 0.1); } },
    bridge: function () { if (on) [392, 523, 659, 784].forEach(function (f, i) { tone(fxBus, 'triangle', f, 0, 0.14, 0.16, i * 0.06); }); },
    gold: function () { if (on) { tone(fxBus, 'square', 1319, 0, 0.08, 0.06); tone(fxBus, 'square', 1760, 0, 0.18, 0.06, 0.07); } },
    aim: function () { if (on) { tone(fxBus, 'square', 880, 660, 0.06, 0.07); tone(fxBus, 'square', 880, 660, 0.06, 0.07, 0.09); } },
    ding: function () { if (on) { tone(fxBus, 'sine', 1319, 0, 0.35, 0.22); tone(fxBus, 'sine', 1568, 0, 0.45, 0.18, 0.1); } },
    sign: function () { if (on) noise(900, 3, 0.07, 0.3); },
    // 0.4.0: a gate multiplies (a bright rising blip) or takes away (a low buzz); the boss mortar's volley (a deep thump
    // and a whistle); the horde's horn (two low brassy notes) when a wave is coming
    gateUp: function () { if (on && limit('gateUp', 90)) { tone(fxBus, 'triangle', 760, 1240, 0.07, 0.07); tone(fxBus, 'sine', 1520, 0, 0.06, 0.04, 0.05); } },
    gateDown: function () { if (on && limit('gateDn', 110)) tone(fxBus, 'sawtooth', 260, 140, 0.09, 0.05); },
    volley: function () { if (on) { noise(160, 0.5, 0.4, 0.5); tone(fxBus, 'sine', 70, 35, 0.35, 0.4); tone(fxBus, 'sine', 1400, 500, 0.9, 0.04, 0.2); } },
    horn: function () { if (on && limit('horn', 900)) { tone(fxBus, 'sawtooth', 147, 140, 0.32, 0.09); tone(fxBus, 'sawtooth', 110, 104, 0.45, 0.09, 0.3); } }
  };
})();
