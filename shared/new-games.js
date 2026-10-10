window.NewGameUI = {
  boot({ key, title, help, pause = () => {
  }, resume = () => {
  }, save = () => {
  }, newGame = () => {
  }, options = "", home = "../../index.html", extra = "" }) {
    const $ = (id) => document.getElementById(id), store = Goobs.store(key);
    let sound = store.get("sound", false), audio;
    const dialog = document.createElement("dialog");
    dialog.id = "gameDialog";
    document.body.append(dialog);
    function close() {
      GoobsDialog.close(dialog);
      resume();
    }
    function show(kind) {
      pause();
      save();
      const intro = kind === "start";
      dialog.innerHTML = '<div class="dialog-top"><span>GOOBS GAMES \xB7 ' + (intro ? "CHOOSE YOUR GAME" : "TAKE YOUR TIME") + '</span><button id="dialogExit">Exit</button></div><h2>' + (kind === "help" ? "How to Play" : intro ? title : "Paused") + "</h2>" + (kind === "help" ? help : intro ? "<p>" + extra + '</p><div class="options">' + options + "</div>" : "<p>Your progress is saved. Pick up whenever you\u2019re ready.</p>") + '<div class="choices">' + (intro ? '<button class="primary" id="startNew">Start new game</button>' : "") + "<button " + (!intro ? 'class="primary"' : "") + ' id="resumeGame">' + (kind === "help" ? "Back" : intro ? "Continue" : "Resume") + "</button>" + (!intro && kind !== "help" ? '<button id="chooseNew">New game</button>' : "") + "</div>";
      dialog.querySelector("#dialogExit").onclick = exit;
      dialog.querySelector("#resumeGame").onclick = close;
      dialog.querySelector("#chooseNew")?.addEventListener("click", () => show("start"));
      dialog.querySelector("#startNew")?.addEventListener("click", () => {
        const values = Object.fromEntries([...dialog.querySelectorAll("select")].map((e) => [e.name, e.value]));
        newGame(values);
        close();
      });
      if (!dialog.open) GoobsDialog.open(dialog);
    }
    function exit() {
      save();
      location.href = home;
    }
    $("exit").onclick = exit;
    $("help").onclick = () => show("help");
    $("pause").onclick = () => show("pause");
    $("sound").onclick = () => {
      sound = !sound;
      store.set("sound", sound);
      paintSound();
      beep(620);
    };
    function paintSound() {
      $("sound").textContent = sound ? "\u266A On" : "\u266A Off";
      $("sound").setAttribute("aria-pressed", sound);
    }
    function beep(hz = 440, duration = 0.06) {
      if (!sound) return;
      try {
        audio ?? (audio = new (window.AudioContext || window.webkitAudioContext)());
        audio.resume();
        let o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = hz;
        o.type = "sine";
        g.gain.setValueAtTime(0.045, audio.currentTime);
        g.gain.exponentialRampToValueAtTime(1e-3, audio.currentTime + duration);
        o.connect(g);
        g.connect(audio.destination);
        o.start();
        o.stop(audio.currentTime + duration);
      } catch {
      }
    }
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pause();
        save();
        if (!dialog.open) show("pause");
      }
    });
    addEventListener("pagehide", save);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !dialog.open) show("pause");
    });
    paintSound();
    Goobs.markPlayed(key === "reversi" ? "board" : key);
    Goobs.initUpdates({ beforeReload: save });
    return { show, close, beep, get paused() {
      return dialog.open;
    }, store };
  }
};
