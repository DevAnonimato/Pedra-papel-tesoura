const moves = {
  rock: {
    label: "Pedra",
    image: "assets/rock.svg",
    beats: "scissors",
    losesTo: "paper",
  },
  paper: {
    label: "Papel",
    image: "assets/paper.svg",
    beats: "rock",
    losesTo: "scissors",
  },
  scissors: {
    label: "Tesoura",
    image: "assets/scissors.svg",
    beats: "paper",
    losesTo: "rock",
  },
};

const difficulty = {
  easy: {
    label: "Fácil",
    badge: "Fácil",
    playerWinChance: 0.75,
    drawChance: 0.12,
  },
  medium: {
    label: "Médio",
    badge: "Médio",
    playerWinChance: 0.2,
    drawChance: 0.2,
  },
  impossible: {
    label: "Impossível",
    badge: "Impossível",
    playerWinChance: 0.01,
    drawChance: 0.09,
  },
};

const state = {
  username: "",
  difficulty: "easy",
  score: {
    player: 0,
    bot: 0,
    draws: 0,
    rounds: 0,
  },
  locked: false,
  soundOn: true,
};

const entryScreen = document.querySelector("#entryScreen");
const gameScreen = document.querySelector("#gameScreen");
const playerForm = document.querySelector("#playerForm");
const usernameInput = document.querySelector("#username");
const difficultyOptions = document.querySelectorAll(".difficulty-option");
const arena = document.querySelector("#arena");
const playerFighter = document.querySelector("#playerFighter");
const botFighter = document.querySelector("#botFighter");
const playerHand = document.querySelector("#playerHand");
const botHand = document.querySelector("#botHand");
const resultText = document.querySelector("#resultText");
const difficultyBadge = document.querySelector("#difficultyBadge");
const roundPill = document.querySelector("#roundPill");
const playerGreeting = document.querySelector("#playerGreeting");
const playerNameScore = document.querySelector("#playerNameScore");
const playerArenaName = document.querySelector("#playerArenaName");
const playerScore = document.querySelector("#playerScore");
const botScore = document.querySelector("#botScore");
const drawScore = document.querySelector("#drawScore");
const burstLayer = document.querySelector("#burstLayer");
const resetButton = document.querySelector("#resetButton");
const changePlayerButton = document.querySelector("#changePlayerButton");
const soundButton = document.querySelector("#soundButton");
const choiceButtons = document.querySelectorAll(".choice-card");
const audio = createAudioEngine();

const savedProfile = JSON.parse(localStorage.getItem("rpsProfile") || "{}");
if (typeof savedProfile.soundOn === "boolean") {
  state.soundOn = savedProfile.soundOn;
}
audio.setEnabled(state.soundOn);
syncSoundButton();
if (savedProfile.username) {
  usernameInput.value = savedProfile.username;
}
if (savedProfile.difficulty && difficulty[savedProfile.difficulty]) {
  selectDifficulty(savedProfile.difficulty);
}

difficultyOptions.forEach((option) => {
  option.addEventListener("click", () => {
    audio.play("ui");
    selectDifficulty(option.dataset.difficulty);
  });
});

playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  audio.play("start");
  const username = usernameInput.value.trim() || "Player";

  state.username = username.slice(0, 18);
  saveProfile();

  entryScreen.hidden = true;
  gameScreen.hidden = false;
  resetScore();
  syncPlayerText();
});

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => playRound(button.dataset.move));
});

resetButton.addEventListener("click", () => {
  audio.play("reset");
  resetScore();
});

changePlayerButton.addEventListener("click", () => {
  audio.play("ui");
  gameScreen.hidden = true;
  entryScreen.hidden = false;
  usernameInput.focus();
});

soundButton.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  audio.setEnabled(state.soundOn);
  saveProfile();
  syncSoundButton();
  audio.play("ui");
});

function selectDifficulty(nextDifficulty) {
  state.difficulty = nextDifficulty;
  saveProfile();

  difficultyOptions.forEach((option) => {
    const isActive = option.dataset.difficulty === nextDifficulty;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-checked", String(isActive));
  });

  if (difficultyBadge) {
    difficultyBadge.textContent = difficulty[nextDifficulty].badge;
  }
}

function saveProfile() {
  localStorage.setItem(
    "rpsProfile",
    JSON.stringify({
      username: state.username || usernameInput.value.trim() || savedProfile.username || "",
      difficulty: state.difficulty,
      soundOn: state.soundOn,
    }),
  );
}

function syncSoundButton() {
  soundButton.setAttribute("aria-pressed", String(state.soundOn));
  soundButton.setAttribute("aria-label", state.soundOn ? "Desligar som" : "Ligar som");
}

function playRound(playerMove) {
  if (state.locked) return;

  audio.play("select");
  state.locked = true;
  setChoicesEnabled(false);
  clearRoundClasses();
  markSelected(playerMove);
  arena.classList.add("is-playing");
  resultText.className = "result-text";
  resultText.textContent = "Duelo!";
  playerHand.src = moves[playerMove].image;

  let reelIndex = 0;
  const moveKeys = Object.keys(moves);
  const reel = window.setInterval(() => {
    botHand.src = moves[moveKeys[reelIndex % moveKeys.length]].image;
    audio.play("shuffle");
    reelIndex += 1;
  }, 105);

  window.setTimeout(() => {
    window.clearInterval(reel);
    const round = buildRound(playerMove, state.difficulty);
    finishRound(round);
  }, 860);
}

function buildRound(playerMove, currentDifficulty) {
  const targetOutcome = pickTargetOutcome(difficulty[currentDifficulty]);
  let botMove = playerMove;

  if (targetOutcome === "player") {
    botMove = moves[playerMove].beats;
  }

  if (targetOutcome === "bot") {
    botMove = moves[playerMove].losesTo;
  }

  return {
    playerMove,
    botMove,
    winner: targetOutcome,
  };
}

function pickTargetOutcome(config) {
  const roll = Math.random();

  if (roll < config.playerWinChance) {
    return "player";
  }

  if (roll < config.playerWinChance + config.drawChance) {
    return "draw";
  }

  return "bot";
}

function finishRound(round) {
  state.score.rounds += 1;
  botHand.src = moves[round.botMove].image;
  arena.classList.remove("is-playing");

  if (round.winner === "player") {
    state.score.player += 1;
    audio.play("win");
    resultText.textContent = "Você venceu!";
    resultText.classList.add("win");
    playerFighter.classList.add("is-winner");
    botFighter.classList.add("is-loser");
    burst(["#6ff08f", "#41e5d2", "#ffd166"]);
  } else if (round.winner === "bot") {
    state.score.bot += 1;
    audio.play("loss");
    resultText.textContent = "Bot venceu!";
    resultText.classList.add("loss");
    botFighter.classList.add("is-winner");
    playerFighter.classList.add("is-loser");
  } else {
    state.score.draws += 1;
    audio.play("draw");
    resultText.textContent = "Empate!";
    resultText.classList.add("draw");
    burst(["#ffd166", "#ffffff", "#41e5d2"]);
  }

  syncScore();
  window.setTimeout(() => {
    state.locked = false;
    setChoicesEnabled(true);
  }, 360);
}

function syncPlayerText() {
  playerGreeting.textContent = `Boa sorte, ${state.username}`;
  playerNameScore.textContent = state.username;
  playerArenaName.textContent = state.username;
}

function syncScore() {
  playerScore.textContent = state.score.player;
  botScore.textContent = state.score.bot;
  drawScore.textContent = state.score.draws;
  roundPill.textContent = `Rodada ${state.score.rounds}`;
}

function resetScore() {
  state.score = {
    player: 0,
    bot: 0,
    draws: 0,
    rounds: 0,
  };
  resultText.className = "result-text";
  resultText.textContent = "Escolha sua jogada";
  playerHand.src = moves.rock.image;
  botHand.src = moves.paper.image;
  clearRoundClasses();
  choiceButtons.forEach((button) => button.classList.remove("is-selected"));
  syncScore();
}

function markSelected(move) {
  choiceButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.move === move);
  });
}

function setChoicesEnabled(isEnabled) {
  choiceButtons.forEach((button) => {
    button.disabled = !isEnabled;
  });
}

function clearRoundClasses() {
  playerFighter.classList.remove("is-winner", "is-loser");
  botFighter.classList.remove("is-winner", "is-loser");
}

function burst(colors) {
  burstLayer.textContent = "";

  for (let i = 0; i < 26; i += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 26;
    const distance = 120 + Math.random() * 130;
    spark.className = "spark";
    spark.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    spark.style.setProperty("--spark-color", colors[i % colors.length]);
    spark.style.animationDelay = `${Math.random() * 80}ms`;
    burstLayer.appendChild(spark);
  }

  window.setTimeout(() => {
    burstLayer.textContent = "";
  }, 1100);
}

function createAudioEngine() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  let context;
  let master;
  let ambientGain;
  let ambientStarted = false;
  let enabled = true;

  function setupContext() {
    if (!AudioContextConstructor) return null;

    if (!context) {
      context = new AudioContextConstructor();
      master = context.createGain();
      master.gain.value = enabled ? 0.62 : 0.0001;
      master.connect(context.destination);
    }

    return context;
  }

  function unlock() {
    const currentContext = setupContext();
    if (!currentContext) return null;

    if (currentContext.state === "suspended") {
      currentContext.resume();
    }

    if (enabled) {
      startAmbient();
    }

    return currentContext;
  }

  function setEnabled(nextEnabled) {
    enabled = nextEnabled;
    if (!context || !master) return;

    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(enabled ? 0.62 : 0.0001, context.currentTime, 0.05);

    if (enabled) {
      unlock();
    }
  }

  function connectOutput(source, gain, pan = 0) {
    if (context.createStereoPanner) {
      const panner = context.createStereoPanner();
      panner.pan.value = pan;
      source.connect(gain);
      gain.connect(panner);
      panner.connect(master);
      return;
    }

    source.connect(gain);
    gain.connect(master);
  }

  function tone(frequency, duration, options = {}) {
    if (!enabled) return;
    const currentContext = unlock();
    if (!currentContext) return;

    const start = currentContext.currentTime + (options.delay || 0);
    const oscillator = currentContext.createOscillator();
    const gain = currentContext.createGain();
    const peak = options.gain || 0.08;

    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    if (options.to) {
      oscillator.frequency.exponentialRampToValueAtTime(options.to, start + duration);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    connectOutput(oscillator, gain, options.pan || 0);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  function thump(delay = 0, force = 1) {
    tone(138, 0.22, {
      delay,
      gain: 0.16 * force,
      type: "sine",
      to: 48,
    });
  }

  function noise(duration, options = {}) {
    if (!enabled) return;
    const currentContext = unlock();
    if (!currentContext) return;

    const start = currentContext.currentTime + (options.delay || 0);
    const buffer = currentContext.createBuffer(
      1,
      Math.max(1, Math.floor(currentContext.sampleRate * duration)),
      currentContext.sampleRate,
    );
    const samples = buffer.getChannelData(0);

    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    }

    const source = currentContext.createBufferSource();
    const filter = currentContext.createBiquadFilter();
    const gain = currentContext.createGain();

    source.buffer = buffer;
    filter.type = options.filter || "highpass";
    filter.frequency.value = options.frequency || 1500;
    filter.Q.value = options.q || 0.8;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(options.gain || 0.07, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    source.connect(filter);
    connectOutput(filter, gain, options.pan || 0);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  function startAmbient() {
    if (!context || !master || ambientStarted) return;

    ambientStarted = true;
    const filter = context.createBiquadFilter();
    const lowDrone = context.createOscillator();
    const midDrone = context.createOscillator();
    const lowGain = context.createGain();
    const midGain = context.createGain();
    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();

    ambientGain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 620;
    lowDrone.type = "sine";
    lowDrone.frequency.value = 82;
    midDrone.type = "triangle";
    midDrone.frequency.value = 146;
    lowGain.gain.value = 0.026;
    midGain.gain.value = 0.012;
    ambientGain.gain.value = 0.024;
    lfo.type = "sine";
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = 0.01;

    lowDrone.connect(lowGain);
    midDrone.connect(midGain);
    lowGain.connect(filter);
    midGain.connect(filter);
    filter.connect(ambientGain);
    lfo.connect(lfoDepth);
    lfoDepth.connect(ambientGain.gain);
    ambientGain.connect(master);

    lowDrone.start();
    midDrone.start();
    lfo.start();
  }

  function play(name) {
    if (!enabled) return;

    if (name === "ui") {
      tone(540, 0.07, { gain: 0.035, type: "triangle" });
      tone(760, 0.08, { delay: 0.035, gain: 0.025, type: "sine" });
    }

    if (name === "start") {
      thump(0, 0.7);
      tone(220, 0.28, { delay: 0.02, gain: 0.08, type: "sawtooth", to: 440 });
      tone(660, 0.2, { delay: 0.22, gain: 0.055, type: "triangle" });
    }

    if (name === "select") {
      thump(0, 0.45);
      noise(0.08, { delay: 0.03, gain: 0.045, frequency: 1200, filter: "bandpass" });
      tone(320, 0.12, { delay: 0.03, gain: 0.045, type: "square", to: 420 });
    }

    if (name === "shuffle") {
      tone(300 + Math.random() * 240, 0.045, {
        gain: 0.025,
        pan: Math.random() * 0.8 - 0.4,
        type: "square",
      });
    }

    if (name === "win") {
      noise(0.22, { gain: 0.065, frequency: 2400 });
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        tone(frequency, 0.28, {
          delay: index * 0.07,
          gain: 0.065 - index * 0.006,
          type: "triangle",
        });
      });
    }

    if (name === "loss") {
      thump(0, 0.9);
      [392, 311.13, 246.94].forEach((frequency, index) => {
        tone(frequency, 0.26, {
          delay: index * 0.1,
          gain: 0.055,
          type: "sawtooth",
          to: frequency * 0.86,
        });
      });
    }

    if (name === "draw") {
      tone(440, 0.12, { gain: 0.045, type: "triangle" });
      tone(440, 0.16, { delay: 0.16, gain: 0.045, type: "triangle" });
      noise(0.14, { delay: 0.06, gain: 0.035, frequency: 900, filter: "bandpass" });
    }

    if (name === "reset") {
      tone(620, 0.18, { gain: 0.045, type: "triangle", to: 240 });
      noise(0.16, { delay: 0.02, gain: 0.035, frequency: 700, filter: "lowpass" });
    }
  }

  return {
    play,
    setEnabled,
  };
}

window.rpsGame = {
  buildRound,
  pickTargetOutcome,
  difficulty,
  moves,
};
