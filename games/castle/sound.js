
/* Castle Crumble sounds: synthesized with Web Audio (no audio files). */
var CCSound = (function () {
  'use strict';
  var ac = null, master = null, on = false, lastHit = 0;
  function ctx() {
    if (!on) return null;
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ac = new AC(); } catch (e) { return null; }
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
    }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* ignore */ } }
    return ac;
  }
  function tone(type, f0, f1, dur, gain, delay) {
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(freq, q, dur, gain, delay) {
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0), len = Math.floor(a.sampleRate * dur);
    var buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    var s = a.createBufferSource(); s.buffer = buf;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    var g = a.createGain(); g.gain.value = gain;
    s.connect(bp); bp.connect(g); g.connect(master); s.start(t);
  }
  return {
    setEnabled: function (v) { on = !!v; if (on) ctx(); },
    unlock: function () { if (on) ctx(); },
    // the cannon: a deep boom
    shoot: function () { if (on) { noise(180, 0.8, 0.35, 0.9); tone('sine', 110, 40, 0.3, 0.5); } },
    // stone knocking stone, wood knocking (limited so a big collapse isn't a wall of noise)
    hit: function (m, v) {
      if (!on) return;
      var now = performance.now(); if (now - lastHit < 55) return; lastHit = now;
      var vol = Math.min(0.35, 0.05 + v * 0.02);
      if (m === 'wood') { tone('triangle', 260 + Math.random() * 60, 160, 0.08, vol); noise(900, 3, 0.06, vol * 0.8); }
      else { noise(500 + Math.random() * 500, 1.5, 0.12, vol); tone('sine', 120 + Math.random() * 60, 70, 0.1, vol * 0.5); }
    },
    rumble: function () { if (on) noise(160, 0.7, 0.8, 0.35); },
    boom: function () { if (!on) return; noise(120, 0.6, 1.1, 1.0); noise(900, 1, 0.3, 0.5); tone('sine', 70, 30, 0.6, 0.6); },
    splash: function () { if (on) { noise(1800, 0.8, 0.35, 0.3); noise(600, 1, 0.25, 0.2, 0.05); } },
    win: function () { if (!on) return; [523, 659, 784, 1047, 1319, 1568].forEach(function (f, i) { tone('triangle', f, 0, i === 5 ? 0.6 : 0.18, 0.26, i * 0.09); }); noise(5000, 1, 0.5, 0.12, 0.4); },
    lose: function () { if (on) [440, 392, 330, 262].forEach(function (f, i) { tone('triangle', f, 0, 0.25, 0.2, i * 0.18); }); },
    ding: function () { if (on) { tone('sine', 1319, 0, 0.4, 0.25); tone('sine', 1568, 0, 0.5, 0.2, 0.12); } },
    sign: function () { if (on) noise(900, 3, 0.07, 0.3); }
  };
})();
