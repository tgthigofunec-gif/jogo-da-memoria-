const TOTAL_PAIRS = 8;
const BEST_KEY = "correndo-do-atacadao-melhor-tempo";

const cards = document.querySelectorAll(".card");
const timerEl = document.getElementById("timer");
const pairsEl = document.getElementById("pairs");
const restartBtn = document.getElementById("restart");
const playAgainBtn = document.getElementById("play-again");
const modal = document.getElementById("modal");
const modalMessageEl = document.getElementById("modal-message");
const finalTimeEl = document.getElementById("final-time");
const bestTimeEl = document.getElementById("best-time");

let matched = 0;
let cardOne = null;
let cardTwo = null;
let lockBoard = false;
let won = false;

let timerId = null;
let startTime = 0;
let elapsed = 0;

let pending = [];

/* ---------- Agendador com cancelamento (evita bugs ao reiniciar no meio de um timeout) ---------- */
function later(fn, ms) {
  const id = setTimeout(() => {
    pending = pending.filter(t => t !== id);
    fn();
  }, ms);
  pending.push(id);
}

function clearPending() {
  pending.forEach(clearTimeout);
  pending = [];
}

/* ---------- Cronômetro ---------- */
function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const min = String(Math.floor(total / 60)).padStart(2, "0");
  const sec = String(total % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function startTimer() {
  if (timerId !== null) return;
  startTime = Date.now() - elapsed;
  timerId = setInterval(() => {
    elapsed = Date.now() - startTime;
    timerEl.textContent = formatTime(elapsed);
  }, 250);
}

function stopTimer() {
  if (timerId === null) return;
  clearInterval(timerId);
  timerId = null;
  elapsed = Date.now() - startTime;
  timerEl.textContent = formatTime(elapsed);
}

function resetTimer() {
  stopTimer();
  elapsed = 0;
  timerEl.textContent = "00:00";
}

/* ---------- Melhor tempo (localStorage funciona aqui porque é um site estático seu) ---------- */
function loadBest() {
  try {
    const value = localStorage.getItem(BEST_KEY);
    return value === null ? null : Number(value);
  } catch {
    return null;
  }
}

function saveBest(ms) {
  try {
    localStorage.setItem(BEST_KEY, String(ms));
  } catch {
    /* ignora se o navegador bloquear o armazenamento */
  }
}

/* ---------- Lógica das cartas ---------- */
function resetSelection() {
  cardOne = null;
  cardTwo = null;
  lockBoard = false;
}

function flipCard() {
  if (lockBoard || won) return;
  if (this === cardOne || this.classList.contains("flip")) return;

  startTimer();
  this.classList.add("flip");

  if (!cardOne) {
    cardOne = this;
    return;
  }

  cardTwo = this;
  lockBoard = true;

  if (cardOne.dataset.value === cardTwo.dataset.value) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleMatch() {
  const a = cardOne;
  const b = cardTwo;

  a.removeEventListener("click", flipCard);
  b.removeEventListener("click", flipCard);
  a.classList.add("matched");
  b.classList.add("matched");

  matched++;
  pairsEl.textContent = `${matched}/${TOTAL_PAIRS}`;
  resetSelection();

  if (matched === TOTAL_PAIRS) {
    later(win, 600);
  }
}

function handleMismatch() {
  const a = cardOne;
  const b = cardTwo;

  later(() => {
    a.classList.add("shake");
    b.classList.add("shake");
  }, 400);

  later(() => {
    a.classList.remove("shake", "flip");
    b.classList.remove("shake", "flip");
    resetSelection();
  }, 1200);
}

/* ---------- Vitória ---------- */
function win() {
  won = true;
  stopTimer();

  const time = elapsed;
  const best = loadBest();
  const newRecord = best === null || time < best;

  if (newRecord) saveBest(time);

  if (best !== null && newRecord) {
    modalMessageEl.textContent = "Novo recorde! Você bateu seu melhor tempo.";
  } else {
    modalMessageEl.textContent = "Você encontrou todos os pares!";
  }

  finalTimeEl.textContent = formatTime(time);
  bestTimeEl.textContent = `Melhor tempo: ${formatTime(newRecord ? time : best)}`;

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

/* ---------- Embaralhar e reiniciar ---------- */
function shuffleCards() {
  const values = [];
  for (let i = 1; i <= TOTAL_PAIRS; i++) {
    values.push(i, i);
  }

  // Fisher-Yates: embaralhamento justo
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  cards.forEach((card, i) => {
    const value = values[i];
    card.dataset.value = value;
    card.querySelector(".back-view img").src = `assets/img/img-${value}.png`;
    card.classList.remove("flip", "matched", "shake");
    card.addEventListener("click", flipCard);
  });

  resetSelection();
}

function resetGame() {
  clearPending();
  resetTimer();

  won = false;
  matched = 0;
  pairsEl.textContent = `0/${TOTAL_PAIRS}`;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");

  lockBoard = true;
  cardOne = null;
  cardTwo = null;

  cards.forEach(card => card.classList.remove("flip", "matched", "shake"));

  // Espera a animação de desvirar terminar antes de trocar as imagens
  later(shuffleCards, 400);
}

/* ---------- Inicialização ---------- */
restartBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);

pairsEl.textContent = `0/${TOTAL_PAIRS}`;
shuffleCards();
