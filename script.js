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
const choiceButtons = document.querySelectorAll(".choice-card");

const savedProfile = JSON.parse(localStorage.getItem("rpsProfile") || "{}");
if (savedProfile.username) {
  usernameInput.value = savedProfile.username;
}
if (savedProfile.difficulty && difficulty[savedProfile.difficulty]) {
  selectDifficulty(savedProfile.difficulty);
}

difficultyOptions.forEach((option) => {
  option.addEventListener("click", () => selectDifficulty(option.dataset.difficulty));
});

playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim() || "Player";

  state.username = username.slice(0, 18);
  localStorage.setItem(
    "rpsProfile",
    JSON.stringify({ username: state.username, difficulty: state.difficulty }),
  );

  entryScreen.hidden = true;
  gameScreen.hidden = false;
  resetScore();
  syncPlayerText();
});

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => playRound(button.dataset.move));
});

resetButton.addEventListener("click", resetScore);

changePlayerButton.addEventListener("click", () => {
  gameScreen.hidden = true;
  entryScreen.hidden = false;
  usernameInput.focus();
});

function selectDifficulty(nextDifficulty) {
  state.difficulty = nextDifficulty;
  localStorage.setItem(
    "rpsProfile",
    JSON.stringify({
      username: usernameInput.value.trim() || savedProfile.username || "",
      difficulty: state.difficulty,
    }),
  );

  difficultyOptions.forEach((option) => {
    const isActive = option.dataset.difficulty === nextDifficulty;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-checked", String(isActive));
  });

  if (difficultyBadge) {
    difficultyBadge.textContent = difficulty[nextDifficulty].badge;
  }
}

function playRound(playerMove) {
  if (state.locked) return;

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
    resultText.textContent = "Você venceu!";
    resultText.classList.add("win");
    playerFighter.classList.add("is-winner");
    botFighter.classList.add("is-loser");
    burst(["#6ff08f", "#41e5d2", "#ffd166"]);
  } else if (round.winner === "bot") {
    state.score.bot += 1;
    resultText.textContent = "Bot venceu!";
    resultText.classList.add("loss");
    botFighter.classList.add("is-winner");
    playerFighter.classList.add("is-loser");
  } else {
    state.score.draws += 1;
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

window.rpsGame = {
  buildRound,
  pickTargetOutcome,
  difficulty,
  moves,
};
