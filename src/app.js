import { GAME_STATUS, GameSession, MODES } from "./game-engine.js";
import { QUESTIONS } from "./questions.js";

const session = new GameSession({ questions: QUESTIONS });
const storagePrefix = "latex-da:best:";
const answerPreferenceKey = "latex-da:answer-visible";

const elements = {
  screens: [...document.querySelectorAll(".screen")],
  startScreen: document.querySelector("#startScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  resultScreen: document.querySelector("#resultScreen"),
  brandButton: document.querySelector("#brandButton"),
  courseButtons: [...document.querySelectorAll("[data-mode]")],
  bestScores: [...document.querySelectorAll("[data-best-score]")],
  answerToggle: document.querySelector("#answerToggle"),
  answerToggleIcon: document.querySelector("#answerToggleIcon"),
  answerToggleLabel: document.querySelector("#answerToggleLabel"),
  inlineAnswerToggle: document.querySelector("#inlineAnswerToggle"),
  timeValue: document.querySelector("#timeValue"),
  scoreValue: document.querySelector("#scoreValue"),
  comboValue: document.querySelector("#comboValue"),
  accuracyValue: document.querySelector("#accuracyValue"),
  overallTimeBar: document.querySelector("#overallTimeBar"),
  questionCategory: document.querySelector("#questionCategory"),
  questionDifficulty: document.querySelector("#questionDifficulty"),
  formulaPlate: document.querySelector("#formulaPlate"),
  formulaDisplay: document.querySelector("#formulaDisplay"),
  plateTimeBar: document.querySelector("#plateTimeBar"),
  plateTimeValue: document.querySelector("#plateTimeValue"),
  answerRow: document.querySelector("#answerRow"),
  answerText: document.querySelector("#answerText"),
  typedText: document.querySelector("#typedText"),
  mistakeKey: document.querySelector("#mistakeKey"),
  typingStack: document.querySelector("#typingStack"),
  gameStatusCopy: document.querySelector("#gameStatusCopy"),
  pauseButton: document.querySelector("#pauseButton"),
  quitButton: document.querySelector("#quitButton"),
  pauseOverlay: document.querySelector("#pauseOverlay"),
  resumeButton: document.querySelector("#resumeButton"),
  resultTitle: document.querySelector("#resultTitle"),
  resultCourse: document.querySelector("#resultCourse"),
  resultScore: document.querySelector("#resultScore"),
  resultSolved: document.querySelector("#resultSolved"),
  resultCorrectKeys: document.querySelector("#resultCorrectKeys"),
  resultMistakes: document.querySelector("#resultMistakes"),
  resultExpired: document.querySelector("#resultExpired"),
  resultAccuracy: document.querySelector("#resultAccuracy"),
  resultMaxCombo: document.querySelector("#resultMaxCombo"),
  newRecord: document.querySelector("#newRecord"),
  retryButton: document.querySelector("#retryButton"),
  menuButton: document.querySelector("#menuButton"),
  keyboardCapture: document.querySelector("#keyboardCapture"),
  demoFormula: document.querySelector(".demo-formula")
};

let currentModeKey = "standard";
let animationFrameId = null;
let mistakeTimerId = null;
let statusTimerId = null;
let answerVisible = readAnswerPreference();
let resultWasAborted = false;

function readAnswerPreference() {
  try {
    const saved = window.localStorage.getItem(answerPreferenceKey);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

function saveAnswerPreference() {
  try {
    window.localStorage.setItem(answerPreferenceKey, String(answerVisible));
  } catch {
    // Storage may be disabled. The game remains fully playable without it.
  }
}

function getBestScore(modeKey) {
  try {
    const value = Number(window.localStorage.getItem(`${storagePrefix}${modeKey}`));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function setBestScore(modeKey, score) {
  try {
    window.localStorage.setItem(`${storagePrefix}${modeKey}`, String(score));
  } catch {
    // Ignore storage failures; the current result is still shown.
  }
}

function formatScore(value) {
  return Math.round(value).toLocaleString("ja-JP");
}

function showScreen(target) {
  for (const screen of elements.screens) {
    const isActive = screen === target;
    screen.classList.toggle("is-active", isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateBestScoreLabels() {
  for (const element of elements.bestScores) {
    element.textContent = formatScore(getBestScore(element.dataset.bestScore));
  }
}

function setAnswerVisibility(nextValue) {
  answerVisible = Boolean(nextValue);
  saveAnswerPreference();

  elements.answerToggle.setAttribute("aria-pressed", String(answerVisible));
  elements.answerToggleIcon.textContent = answerVisible ? "◉" : "◎";
  elements.answerToggleLabel.textContent = answerVisible ? "正答を隠す" : "正答を表示";
  elements.inlineAnswerToggle.textContent = answerVisible ? "隠す" : "表示";
  elements.answerRow.classList.toggle("is-hidden", !answerVisible);

  renderTyping(session.snapshot());
}

function renderMath(latex, target, displayMode = true) {
  if (!latex) {
    target.textContent = "";
    return;
  }

  if (window.katex?.render) {
    window.katex.render(latex, target, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false
    });
    return;
  }

  target.textContent = latex;
}

function renderDemoFormula() {
  renderMath(String.raw`\displaystyle \int_0^1 x^2\,dx`, elements.demoFormula, true);
}

function renderQuestion(snapshot) {
  if (!snapshot.question) return;

  elements.questionCategory.textContent = snapshot.question.category;
  elements.questionDifficulty.textContent = `LEVEL ${snapshot.question.difficulty}`;
  elements.formulaPlate.dataset.difficulty = String(snapshot.question.difficulty);
  renderMath(snapshot.question.latex, elements.formulaDisplay, true);
  renderTyping(snapshot);

  elements.formulaPlate.classList.remove("is-entering", "is-complete", "is-expired", "is-mistake");
  void elements.formulaPlate.offsetWidth;
  elements.formulaPlate.classList.add("is-entering");
}

function appendCodeSpan(target, text, className) {
  if (!text) return;
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  target.append(span);
}

function renderTyping(snapshot) {
  elements.answerText.replaceChildren();

  if (answerVisible) {
    appendCodeSpan(elements.answerText, snapshot.typed, "answer-matched");
    appendCodeSpan(elements.answerText, snapshot.remaining, "answer-remaining");
    if (!snapshot.expected) {
      appendCodeSpan(elements.answerText, "コースを選ぶと正答が表示されます", "answer-hidden-copy");
    }
  } else {
    appendCodeSpan(elements.answerText, "正答は非表示です — F2で切り替え", "answer-hidden-copy");
  }

  elements.typedText.replaceChildren();
  if (snapshot.typed) {
    appendCodeSpan(elements.typedText, snapshot.typed, "typed-value");
  } else {
    appendCodeSpan(elements.typedText, "入力を開始してください", "input-placeholder");
  }

  const cursor = document.createElement("span");
  cursor.className = "typing-cursor";
  cursor.setAttribute("aria-hidden", "true");
  elements.typedText.append(cursor);
}

function renderHud(snapshot) {
  if (!snapshot.mode) return;

  const remainingSeconds = snapshot.remainingMs / 1_000;
  const totalRatio = Math.max(0, snapshot.remainingMs / snapshot.mode.durationMs);
  const plateRatio = snapshot.questionDurationMs
    ? Math.max(0, snapshot.questionRemainingMs / snapshot.questionDurationMs)
    : 0;

  elements.timeValue.textContent = remainingSeconds.toFixed(1);
  elements.scoreValue.textContent = formatScore(snapshot.stats.score);
  elements.comboValue.textContent = String(snapshot.stats.combo);
  elements.accuracyValue.textContent = snapshot.accuracy.toFixed(1);
  elements.overallTimeBar.style.width = `${totalRatio * 100}%`;
  elements.plateTimeBar.style.width = `${plateRatio * 100}%`;
  elements.plateTimeValue.textContent = `${(snapshot.questionRemainingMs / 1_000).toFixed(1)}s`;

  const travel = 11 - (1 - plateRatio) * 22;
  elements.formulaPlate.style.transform = `translateX(${travel}%)`;
  elements.gameScreen.classList.toggle("is-time-danger", remainingSeconds <= 10);
  elements.formulaPlate.classList.toggle("is-plate-danger", plateRatio <= 0.2);
}

function setStatus(message, tone = "normal", resetAfterMs = 0) {
  window.clearTimeout(statusTimerId);
  elements.gameStatusCopy.textContent = message;
  elements.gameStatusCopy.dataset.tone = tone;

  if (resetAfterMs > 0) {
    statusTimerId = window.setTimeout(() => {
      elements.gameStatusCopy.textContent =
        "半角英数で入力してください。誤打は赤く表示され、正しい文字だけが進みます。";
      elements.gameStatusCopy.dataset.tone = "normal";
    }, resetAfterMs);
  }
}

function flashMistake(character, expectedCharacter) {
  window.clearTimeout(mistakeTimerId);
  elements.mistakeKey.textContent = character === " " ? "␠" : character;
  elements.mistakeKey.classList.remove("is-visible");
  void elements.mistakeKey.offsetWidth;
  elements.mistakeKey.classList.add("is-visible");
  elements.formulaPlate.classList.add("is-mistake");
  elements.typingStack.classList.add("is-mistake");

  const shownExpected = expectedCharacter === " " ? "スペース" : expectedCharacter;
  setStatus(`ミス：次の文字は「${shownExpected || "—"}」です。`, "danger", 1_200);

  mistakeTimerId = window.setTimeout(() => {
    elements.mistakeKey.classList.remove("is-visible");
    elements.formulaPlate.classList.remove("is-mistake");
    elements.typingStack.classList.remove("is-mistake");
  }, 420);
}

function handleEngineEvent(event) {
  const snapshot = event.snapshot;

  if (event.type === "finished") {
    finishGame(false);
    return false;
  }

  if (event.type === "expired") {
    elements.formulaPlate.classList.add("is-expired");
    setStatus("プレートが流れました。次の数式へ！", "warning", 1_300);
    renderQuestion(snapshot);
  }

  return true;
}

function handleInputResult(result) {
  const snapshot = result.snapshot;

  switch (result.type) {
    case "accepted":
      renderTyping(snapshot);
      break;
    case "mistake":
      flashMistake(result.character, result.expectedCharacter);
      break;
    case "completed":
      elements.formulaPlate.classList.add("is-complete");
      setStatus(
        `正解！ ${result.question.category} をクリア。${snapshot.stats.combo}コンボ！`,
        "success",
        1_100
      );
      renderQuestion(snapshot);
      break;
    default:
      break;
  }

  renderHud(snapshot);
}

function gameLoop(now) {
  const event = session.tick(now);
  if (!handleEngineEvent(event)) return;

  renderHud(event.snapshot);
  if (session.status === GAME_STATUS.PLAYING) {
    animationFrameId = window.requestAnimationFrame(gameLoop);
  }
}

function focusKeyboard() {
  elements.keyboardCapture.value = "";
  try {
    elements.keyboardCapture.focus({ preventScroll: true });
  } catch {
    elements.keyboardCapture.focus();
  }
}

function startGame(modeKey) {
  if (!MODES[modeKey]) return;

  window.cancelAnimationFrame(animationFrameId);
  currentModeKey = modeKey;
  resultWasAborted = false;
  const snapshot = session.start(modeKey, performance.now());

  elements.pauseOverlay.hidden = true;
  elements.gameScreen.classList.remove("is-time-danger");
  showScreen(elements.gameScreen);
  renderQuestion(snapshot);
  renderHud(snapshot);
  setStatus("スタート！ 数式のLaTeX記法を入力してください。", "success", 1_500);
  focusKeyboard();
  animationFrameId = window.requestAnimationFrame(gameLoop);
}

function pauseGame(message = "ゲームを一時停止しました。") {
  if (session.status !== GAME_STATUS.PLAYING) return;

  const snapshot = session.pause(performance.now());
  window.cancelAnimationFrame(animationFrameId);
  renderHud(snapshot);
  elements.pauseOverlay.hidden = false;
  setStatus(message, "warning");
  elements.resumeButton.focus();
}

function resumeGame() {
  if (session.status !== GAME_STATUS.PAUSED) return;

  session.resume(performance.now());
  elements.pauseOverlay.hidden = true;
  setStatus("再開しました。", "success", 800);
  focusKeyboard();
  animationFrameId = window.requestAnimationFrame(gameLoop);
}

function finishGame(aborted) {
  window.cancelAnimationFrame(animationFrameId);
  window.clearTimeout(mistakeTimerId);
  resultWasAborted = aborted;

  if (session.status === GAME_STATUS.PLAYING) {
    session.pause(performance.now());
  }

  const snapshot = session.snapshot();
  const previousBest = getBestScore(currentModeKey);
  const isNewRecord = snapshot.stats.score > previousBest;
  if (isNewRecord) {
    setBestScore(currentModeKey, snapshot.stats.score);
  }

  elements.resultTitle.textContent = aborted ? "途中結果" : "結果発表";
  elements.resultCourse.textContent = snapshot.mode?.name ?? "";
  elements.resultScore.textContent = formatScore(snapshot.stats.score);
  elements.resultSolved.textContent = String(snapshot.stats.solved);
  elements.resultCorrectKeys.textContent = String(snapshot.stats.correctKeys);
  elements.resultMistakes.textContent = String(snapshot.stats.mistakes);
  elements.resultExpired.textContent = String(snapshot.stats.expired);
  elements.resultAccuracy.textContent = snapshot.accuracy.toFixed(1);
  elements.resultMaxCombo.textContent = String(snapshot.stats.maxCombo);
  elements.newRecord.hidden = !isNewRecord;

  updateBestScoreLabels();
  showScreen(elements.resultScreen);
  elements.retryButton.focus();
}

function goToMenu({ askBeforeLeaving = false } = {}) {
  if (
    askBeforeLeaving &&
    (session.status === GAME_STATUS.PLAYING || session.status === GAME_STATUS.PAUSED) &&
    !window.confirm("現在のゲームを終了してコース選択へ戻りますか？")
  ) {
    focusKeyboard();
    return;
  }

  window.cancelAnimationFrame(animationFrameId);
  window.clearTimeout(mistakeTimerId);
  session.reset();
  elements.pauseOverlay.hidden = true;
  elements.gameScreen.classList.remove("is-time-danger");
  showScreen(elements.startScreen);
  updateBestScoreLabels();
}

function processCharacter(character) {
  if (session.status !== GAME_STATUS.PLAYING) return;

  const tickEvent = session.tick(performance.now());
  if (!handleEngineEvent(tickEvent)) return;

  const result = session.input(character);
  handleInputResult(result);
  focusKeyboard();
}

function handleKeydown(event) {
  if (event.key === "F2") {
    event.preventDefault();
    setAnswerVisibility(!answerVisible);
    focusKeyboard();
    return;
  }

  if (event.key === "Escape") {
    if (session.status === GAME_STATUS.PLAYING) {
      event.preventDefault();
      pauseGame();
    } else if (session.status === GAME_STATUS.PAUSED) {
      event.preventDefault();
      resumeGame();
    }
    return;
  }

  if (session.status !== GAME_STATUS.PLAYING) return;
  if (event.isComposing || event.key === "Process") {
    setStatus("IMEをオフにして半角英数で入力してください。", "warning", 1_500);
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    setStatus("誤入力は自動で弾かれるため、Backspaceは不要です。", "normal", 1_000);
    return;
  }

  if (
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    Array.from(event.key).length !== 1
  ) {
    return;
  }

  event.preventDefault();
  processCharacter(event.key);
}

for (const button of elements.courseButtons) {
  button.addEventListener("click", () => startGame(button.dataset.mode));
}

elements.answerToggle.addEventListener("click", () => {
  setAnswerVisibility(!answerVisible);
  focusKeyboard();
});

elements.inlineAnswerToggle.addEventListener("click", () => {
  setAnswerVisibility(!answerVisible);
  focusKeyboard();
});

elements.pauseButton.addEventListener("click", () => pauseGame());
elements.resumeButton.addEventListener("click", resumeGame);
elements.quitButton.addEventListener("click", () => finishGame(true));
elements.retryButton.addEventListener("click", () => startGame(currentModeKey));
elements.menuButton.addEventListener("click", () => goToMenu());
elements.brandButton.addEventListener("click", () =>
  goToMenu({ askBeforeLeaving: true })
);

elements.gameScreen.addEventListener("pointerdown", (event) => {
  if (!event.target.closest("button") && session.status === GAME_STATUS.PLAYING) {
    focusKeyboard();
  }
});

elements.keyboardCapture.addEventListener("beforeinput", (event) => {
  if (session.status !== GAME_STATUS.PLAYING) return;

  if (event.inputType === "insertText" && event.data) {
    event.preventDefault();
    for (const character of Array.from(event.data)) {
      processCharacter(character);
    }
    return;
  }

  event.preventDefault();
});

elements.keyboardCapture.addEventListener("input", () => {
  if (session.status !== GAME_STATUS.PLAYING) {
    elements.keyboardCapture.value = "";
    return;
  }

  const value = elements.keyboardCapture.value;
  elements.keyboardCapture.value = "";
  for (const character of Array.from(value)) {
    processCharacter(character);
  }
});

elements.keyboardCapture.addEventListener("paste", (event) => {
  event.preventDefault();
  setStatus("貼り付けは使えません。一文字ずつ入力してください。", "warning", 1_300);
});

elements.keyboardCapture.addEventListener("compositionstart", () => {
  setStatus("IMEをオフにして半角英数で入力してください。", "warning");
});

elements.keyboardCapture.addEventListener("compositionend", () => {
  elements.keyboardCapture.value = "";
});

document.addEventListener("keydown", handleKeydown);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && session.status === GAME_STATUS.PLAYING) {
    pauseGame("タブが非表示になったため自動で一時停止しました。");
  }
});

window.addEventListener("load", renderDemoFormula);

updateBestScoreLabels();
setAnswerVisibility(answerVisible);
renderDemoFormula();
showScreen(elements.startScreen);
