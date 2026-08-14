import { GameEngine } from "./game-engine.js";
import { DIFFICULTIES } from "./questions.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  brandButton: $("#brandButton"),
  menuScreen: $("#menuScreen"),
  gameScreen: $("#gameScreen"),
  resultScreen: $("#resultScreen"),
  menuSample: $("#menuSample"),
  durationButtons: $$("#durationOptions [data-duration]"),
  difficultyButtons: $$("#difficultyOptions [data-difficulty]"),
  startButton: $("#startButton"),
  scoreValue: $("#scoreValue"),
  timerValue: $("#timerValue"),
  timerProgress: $("#timerProgress"),
  comboValue: $("#comboValue"),
  correctValue: $("#correctValue"),
  accuracyValue: $("#accuracyValue"),
  answerToggle: $("#answerToggle"),
  answerToggleText: $("#answerToggleText"),
  soundToggle: $("#soundToggle"),
  soundIcon: $("#soundIcon"),
  finishButton: $("#finishButton"),
  arena: $("#arena"),
  problemCard: $("#problemCard"),
  questionCategory: $("#questionCategory"),
  questionLevel: $("#questionLevel"),
  formulaDisplay: $("#formulaDisplay"),
  answerPanel: $("#answerPanel"),
  answerText: $("#answerText"),
  inputRow: $("#inputRow"),
  typedVisual: $("#typedVisual"),
  typingInput: $("#typingInput"),
  focusHint: $("#focusHint"),
  scorePop: $("#scorePop"),
  questionCounter: $("#questionCounter"),
  gameAnnouncer: $("#gameAnnouncer"),
  resultGrade: $("#resultGrade"),
  finalScore: $("#finalScore"),
  newRecordBadge: $("#newRecordBadge"),
  resultCorrect: $("#resultCorrect"),
  resultAccuracy: $("#resultAccuracy"),
  resultCombo: $("#resultCombo"),
  resultCpm: $("#resultCpm"),
  bestScore: $("#bestScore"),
  retryButton: $("#retryButton"),
  copyButton: $("#copyButton"),
  menuButton: $("#menuButton"),
  toast: $("#toast"),
};

const SETTINGS_KEY = "latexda:settings:v1";
const SAMPLE_FORMULA = String.raw`x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}`;

const ui = {
  duration: 60,
  difficulty: "standard",
  soundEnabled: true,
  animationFrame: null,
  lastQuestionId: null,
  latestResult: null,
  toastTimer: null,
};

class SoundBoard {
  constructor() {
    this.context = null;
  }

  ensureContext() {
    if (!ui.soundEnabled) return null;
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") this.context.resume().catch(() => {});
    return this.context;
  }

  tone(frequency, duration, { delay = 0, gain = 0.035, type = "sine" } = {}) {
    const context = this.ensureContext();
    if (!context) return;

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  correct() {
    this.tone(620, 0.08, { type: "triangle" });
    this.tone(880, 0.12, { delay: 0.07, type: "triangle" });
  }

  miss() {
    this.tone(150, 0.08, { gain: 0.025, type: "square" });
  }

  finish() {
    this.tone(523, 0.14, { type: "triangle" });
    this.tone(659, 0.14, { delay: 0.1, type: "triangle" });
    this.tone(784, 0.25, { delay: 0.2, type: "triangle" });
  }
}

const sound = new SoundBoard();
const engine = new GameEngine();

function safeReadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        duration: ui.duration,
        difficulty: ui.difficulty,
        soundEnabled: ui.soundEnabled,
      }),
    );
  } catch {
    // The game remains fully playable when storage is unavailable.
  }
}

function bestKey() {
  return `latexda:best:${ui.difficulty}:${ui.duration}`;
}

function readBest() {
  try {
    return Number(localStorage.getItem(bestKey()) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function writeBest(score) {
  const previous = readBest();
  const best = Math.max(previous, score);
  try {
    localStorage.setItem(bestKey(), String(best));
  } catch {
    // Ignore storage failures; the current result is still shown.
  }
  return { best, isRecord: score > previous };
}

function setScreen(activeScreen) {
  for (const screen of [elements.menuScreen, elements.gameScreen, elements.resultScreen]) {
    const isActive = screen === activeScreen;
    screen.hidden = !isActive;
    screen.classList.toggle("is-active", isActive);
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

function selectDuration(duration) {
  ui.duration = Number(duration);
  for (const button of elements.durationButtons) {
    const selected = Number(button.dataset.duration) === ui.duration;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("is-selected", selected);
  }
  saveSettings();
}

function selectDifficulty(difficulty) {
  if (!DIFFICULTIES[difficulty]) difficulty = "standard";
  ui.difficulty = difficulty;
  for (const button of elements.difficultyButtons) {
    const selected = button.dataset.difficulty === ui.difficulty;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("is-selected", selected);
  }
  saveSettings();
}

function setSoundEnabled(enabled) {
  ui.soundEnabled = Boolean(enabled);
  elements.soundToggle.setAttribute("aria-pressed", String(ui.soundEnabled));
  elements.soundIcon.textContent = ui.soundEnabled ? "♪" : "×";
  elements.soundToggle.title = ui.soundEnabled ? "効果音 ON" : "効果音 OFF";
  saveSettings();
}

function renderLatex(element, expression, { displayMode = true } = {}) {
  element.replaceChildren();
  element.classList.remove("latex-fallback");
  if (window.katex) {
    window.katex.render(expression, element, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
      output: "htmlAndMathml",
    });
  } else {
    element.textContent = expression;
    element.classList.add("latex-fallback");
  }
}

function renderQuestion(question) {
  if (!question || question.id === ui.lastQuestionId) return;
  ui.lastQuestionId = question.id;

  elements.questionCategory.textContent = question.category;
  elements.questionLevel.textContent = `LEVEL ${question.level}`;
  elements.formulaDisplay.classList.toggle("is-long", question.answer.length > 45);
  elements.formulaDisplay.classList.toggle("is-very-long", question.answer.length > 80);
  renderLatex(elements.formulaDisplay, question.render);

  elements.problemCard.classList.remove("is-entering");
  void elements.problemCard.offsetWidth;
  elements.problemCard.classList.add("is-entering");
}

function renderTyped(input, answer) {
  elements.typedVisual.replaceChildren();

  if (!input) {
    const placeholder = document.createElement("span");
    placeholder.className = "typed-placeholder";
    placeholder.textContent = "ここにLaTeX記法を入力";
    elements.typedVisual.append(placeholder);
  } else {
    [...input].forEach((character, index) => {
      const span = document.createElement("span");
      span.className = character === answer[index] ? "typed-correct" : "typed-wrong";
      span.textContent = character;
      elements.typedVisual.append(span);
    });
  }

  const caret = document.createElement("span");
  caret.className = "visual-caret";
  caret.setAttribute("aria-hidden", "true");
  elements.typedVisual.append(caret);
}

function formatRemaining(milliseconds) {
  if (milliseconds <= 10_000) return (milliseconds / 1000).toFixed(1);
  return String(Math.ceil(milliseconds / 1000));
}

function renderSnapshot(snapshot) {
  if (!snapshot.question) return;

  renderQuestion(snapshot.question);
  elements.scoreValue.textContent = snapshot.score.toLocaleString("ja-JP");
  elements.timerValue.textContent = formatRemaining(snapshot.remainingMs);
  elements.timerProgress.style.transform = `scaleX(${snapshot.progress})`;
  elements.comboValue.textContent = `×${snapshot.combo}`;
  elements.correctValue.textContent = String(snapshot.correctCount);
  elements.accuracyValue.textContent = `${snapshot.accuracy.toFixed(1)}%`;
  elements.questionCounter.textContent = `${snapshot.correctCount} CLEAR`;

  const danger = snapshot.remainingMs <= 10_000;
  elements.timerValue.classList.toggle("is-danger", danger);
  elements.timerProgress.classList.toggle("is-danger", danger);

  elements.answerToggle.setAttribute("aria-pressed", String(snapshot.answerVisible));
  elements.answerToggleText.textContent = snapshot.answerVisible ? "正答 ON" : "正答 OFF";
  elements.answerPanel.classList.toggle("is-hidden-answer", !snapshot.answerVisible);
  elements.answerText.textContent = snapshot.answerVisible
    ? snapshot.question.answer
    : "正答は非表示です — Alt+A で表示";

  renderTyped(snapshot.input, snapshot.question.answer);
  elements.inputRow.classList.toggle(
    "has-error",
    Boolean(snapshot.input) && !snapshot.question.answer.startsWith(snapshot.input),
  );

  if (elements.typingInput.value !== snapshot.input) {
    elements.typingInput.value = snapshot.input;
  }
}

function animateAward(points) {
  elements.scorePop.textContent = `+${points.toLocaleString("ja-JP")}`;
  elements.scorePop.classList.remove("is-visible");
  void elements.scorePop.offsetWidth;
  elements.scorePop.classList.add("is-visible");
}

function announce(message) {
  elements.gameAnnouncer.textContent = "";
  window.setTimeout(() => {
    elements.gameAnnouncer.textContent = message;
  }, 10);
}

function processTransition(transition) {
  for (const event of transition.events) {
    if (event.type === "correct") {
      sound.correct();
      animateAward(event.points);
      elements.arena.classList.remove("is-correct");
      void elements.arena.offsetWidth;
      elements.arena.classList.add("is-correct");
      announce(`正解。${event.points}ポイント獲得。コンボ${event.combo}。`);
    }

    if (event.type === "miss") {
      sound.miss();
      elements.problemCard.classList.remove("is-shaking");
      void elements.problemCard.offsetWidth;
      elements.problemCard.classList.add("is-shaking");
    }

    if (event.type === "finished") {
      finishGame(event.result);
      return;
    }
  }

  renderSnapshot(transition.snapshot);
}

function gameLoop() {
  const transition = engine.tick();
  processTransition(transition);

  if (transition.snapshot.status === "playing") {
    ui.animationFrame = requestAnimationFrame(gameLoop);
  }
}

function focusTypingInput() {
  if (engine.getSnapshot().status !== "playing") return;
  elements.typingInput.focus({ preventScroll: true });
  const end = elements.typingInput.value.length;
  elements.typingInput.setSelectionRange(end, end);
}

function startGame() {
  cancelAnimationFrame(ui.animationFrame);
  ui.lastQuestionId = null;
  ui.latestResult = null;
  elements.typingInput.disabled = false;
  elements.typingInput.value = "";
  elements.copyButton.textContent = "結果をコピー";
  sound.ensureContext();
  setScreen(elements.gameScreen);

  const transition = engine.start({
    durationSeconds: ui.duration,
    difficulty: ui.difficulty,
    answerVisible: true,
  });
  processTransition(transition);
  requestAnimationFrame(() => focusTypingInput());
  ui.animationFrame = requestAnimationFrame(gameLoop);
}

function scoreRank(result) {
  const scorePerMinute = result.score / (result.durationSeconds / 60);
  if (scorePerMinute >= 12_000) return "S";
  if (scorePerMinute >= 8_000) return "A";
  if (scorePerMinute >= 5_000) return "B";
  if (scorePerMinute >= 2_500) return "C";
  return "D";
}

function finishGame(result) {
  cancelAnimationFrame(ui.animationFrame);
  elements.typingInput.disabled = true;
  ui.latestResult = result;
  sound.finish();

  const { best, isRecord } = writeBest(result.score);
  elements.resultGrade.textContent = scoreRank(result);
  elements.finalScore.textContent = result.score.toLocaleString("ja-JP");
  elements.resultCorrect.textContent = String(result.correctCount);
  elements.resultAccuracy.textContent = result.accuracy.toFixed(1);
  elements.resultCombo.textContent = String(result.maxCombo);
  elements.resultCpm.textContent = String(result.cpm);
  elements.bestScore.textContent = `${best.toLocaleString("ja-JP")} pts`;
  elements.newRecordBadge.hidden = !isRecord;
  setScreen(elements.resultScreen);
}

function goToMenu() {
  cancelAnimationFrame(ui.animationFrame);
  if (engine.getSnapshot().status === "playing") engine.finish();
  ui.lastQuestionId = null;
  setScreen(elements.menuScreen);
}

function toggleAnswer() {
  const snapshot = engine.getSnapshot();
  if (snapshot.status !== "playing") return;
  processTransition(engine.toggleAnswer());
  focusTypingInput();
}

function showToast(message) {
  clearTimeout(ui.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  ui.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 1800);
}

async function copyResult() {
  if (!ui.latestResult) return;
  const result = ui.latestResult;
  const difficulty = DIFFICULTIES[result.difficulty]?.label ?? result.difficulty;
  const text = [
    `LaTexDa ${result.durationSeconds}秒 / ${difficulty}`,
    `Score: ${result.score.toLocaleString("ja-JP")}`,
    `Clear: ${result.correctCount}問`,
    `Accuracy: ${result.accuracy.toFixed(1)}%`,
    `Max Combo: ${result.maxCombo}`,
    `Speed: ${result.cpm} CPM`,
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    elements.copyButton.textContent = "コピーしました";
    showToast("結果をクリップボードにコピーしました");
  } catch {
    showToast("クリップボードを利用できませんでした");
  }
}

function restoreSettings() {
  const settings = safeReadSettings();
  selectDuration([60, 90, 120].includes(Number(settings.duration)) ? settings.duration : 60);
  selectDifficulty(DIFFICULTIES[settings.difficulty] ? settings.difficulty : "standard");
  setSoundEnabled(settings.soundEnabled !== false);
}

for (const button of elements.durationButtons) {
  button.addEventListener("click", () => selectDuration(button.dataset.duration));
}

for (const button of elements.difficultyButtons) {
  button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
}

elements.startButton.addEventListener("click", startGame);
elements.retryButton.addEventListener("click", startGame);
elements.menuButton.addEventListener("click", goToMenu);
elements.brandButton.addEventListener("click", goToMenu);
elements.finishButton.addEventListener("click", () => processTransition(engine.finish()));
elements.answerToggle.addEventListener("click", toggleAnswer);
elements.copyButton.addEventListener("click", copyResult);

elements.soundToggle.addEventListener("click", () => {
  setSoundEnabled(!ui.soundEnabled);
  if (ui.soundEnabled) sound.tone(660, 0.1, { type: "triangle" });
  focusTypingInput();
});

elements.typingInput.addEventListener("input", (event) => {
  processTransition(engine.setInput(event.currentTarget.value));
});

elements.typingInput.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "Home", "End", "Delete"].includes(event.key)) {
    event.preventDefault();
  }
});

elements.typingInput.addEventListener("paste", (event) => {
  event.preventDefault();
  showToast("練習モードのため貼り付けは使えません");
});

elements.typingInput.addEventListener("drop", (event) => event.preventDefault());
elements.typingInput.addEventListener("blur", () => elements.focusHint.classList.add("is-visible"));
elements.typingInput.addEventListener("focus", () => elements.focusHint.classList.remove("is-visible"));

elements.typingInput.addEventListener("click", () => {
  const end = elements.typingInput.value.length;
  elements.typingInput.setSelectionRange(end, end);
});

elements.arena.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  requestAnimationFrame(() => focusTypingInput());
});

document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key.toLowerCase() === "a") {
    event.preventDefault();
    toggleAnswer();
    return;
  }

  if (event.key === "Enter" && !elements.resultScreen.hidden) {
    event.preventDefault();
    startGame();
  }
});

window.addEventListener("load", () => {
  renderLatex(elements.menuSample, SAMPLE_FORMULA);
  if (engine.getSnapshot().question) renderQuestion(engine.getSnapshot().question);
});

restoreSettings();
renderLatex(elements.menuSample, SAMPLE_FORMULA);
