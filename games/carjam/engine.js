(function (root) {
  'use strict';
  var DIRS = [[0,-1],[1,0],[0,1],[-1,0]];
  var COLORS = ['#f45d58','#25a9e8','#f8bc36','#45c97b','#ad78e9'];
  function random(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
  function free(car, cars, size) {
    var d = DIRS[car.dir], x = car.x + d[0], y = car.y + d[1];
    while (x >= 0 && y >= 0 && x < size && y < size) {
      if (cars.some(function (v) { return v !== car && v.x === x && v.y === y; })) return false;
      x += d[0]; y += d[1];
    }
    return true;
  }
  function make(level) {
    var size = 8, target = Math.min(39, 19 + level * 2), countColors = level < 3 ? 4 : 5;
    var rng = random(31991 + level * 7919), cars = [], sequence = [], candidates, x, y, dir, i;
    for (i = 0; i < target; i++) {
      candidates = [];
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
        if (cars.some(function (v) { return v.x === x && v.y === y; })) continue;
        for (dir = 0; dir < 4; dir++) {
          var c = { x: x, y: y, dir: dir };
          if (free(c, cars, size)) candidates.push(c);
        }
      }
      if (!candidates.length) break;
      // Favor the central pile while preserving a proven route out of the lot.
      candidates.sort(function (a,b) {
        return (Math.abs(a.x-3.5)+Math.abs(a.y-3.5))-(Math.abs(b.x-3.5)+Math.abs(b.y-3.5));
      });
      var pool = Math.max(1, Math.ceil(candidates.length * .64));
      var chosen = candidates[Math.floor(rng() * pool)];
      var car = { id: i + 1, x: chosen.x, y: chosen.y, dir: chosen.dir, color: Math.floor(rng() * countColors) };
      cars.push(car); sequence.push(car);
    }
    return { level: level, size: size, cars: cars, queue: sequence.slice().reverse().map(function (c) { return c.color; }), bay: [], delivered: 0, total: cars.length };
  }
  function move(state, id) {
    var car = state.cars.find(function (v) { return v.id === id; });
    if (!car) return 'missing';
    if (!free(car, state.cars, state.size)) return 'blocked';
    if (state.bay.length >= 4 && car.color !== state.queue[0]) return 'full';
    state.cars.splice(state.cars.indexOf(car), 1);
    if (car.color === state.queue[0]) { state.queue.shift(); state.delivered++; }
    else state.bay.push(car);
    // A car waiting in a bay leaves as soon as its color reaches the front.
    var hit = true;
    while (hit && state.queue.length) {
      hit = state.bay.findIndex(function (v) { return v.color === state.queue[0]; });
      if (hit >= 0) { state.bay.splice(hit, 1); state.queue.shift(); state.delivered++; hit = true; }
      else hit = false;
    }
    return 'moved';
  }
  function hint(state) {
    var freeCars = state.cars.filter(function (v) { return free(v, state.cars, state.size); });
    return freeCars.find(function (v) { return v.color === state.queue[0]; }) ||
      (state.bay.length < 4 ? freeCars.find(function (v) { return state.queue.indexOf(v.color) >= 0; }) : null) || null;
  }
  root.Jam = { make: make, free: free, move: move, hint: hint, colors: COLORS };
})(typeof window !== 'undefined' ? window : globalThis);
