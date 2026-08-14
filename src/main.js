import {
  MODES,
  calculateAccuracy,
  calculateCharactersPerMinute,
  calculatePromptDuration,
  calculateQuestionScore,
  commonPrefixLength,
  createInitialStats,
  formatTime,
  getMatchState,
  pickNextQuestion
} from "./game-core.js";
import { QUESTION_BANK } from "./questions.js";

const elements = {
  startScreen: document.querySelector("#start-screen"),
  gameScreen: document.querySelector("#game-screen"),
  resultScreen: document.querySelector("#result-screen"),
  answerToggle: document.querySelector("#answer-toggle"),
  courseButtons: [...document.querySelectorAll("[data-start-mode]")],
  quitButton: document.querySelector("#quit-button"),
  retryButton: document.querySelector("#retry-button"),
  shareButton: document.querySelector("#share-button"),
  coursesButton: document.querySelector("#courses-button"),
  timeValue: document.querySelector("#time-value"),
  scoreValue: document.querySelector("#score-value"),
  comboValue: document.querySelector("#combo-value"),
  accuracyValue: document.querySelector("#accuracy-value"),
  modeName: document.querySelector("#mode-name"),
  questionTopic: document.querySelector("#question-topic"),
  plate: document.querySelector("#plate"),
  renderedEquation: document.querySelector("#rendered-equation"),
  promptMeterFill: document.querySelector("#prompt-meter-fill"),
  expectedAnswer: document.querySelector("#expected-answer"),
  latexInput: document.querySelector("#latex-input"),
  inputMessage: document.querySelector("#input-message"),
  feedback: document.querySelector("#feedback"),
  answerHistory: document.querySelector("#answer-history"),
  resultCourse: document.querySelector("#result-course"),
  finalScore: document.querySelector("#final-score-value"),
  highScoreMessage: document.querySelector("#high-score-message"),
  resultCorrect: document.querySelector("#result-correct"),
  resultMissed: document.querySelector("#result-missed"),
  resultCombo: document.querySelector("#result-combo"),
  resultAccuracy: document.querySelector("#result-accuracy"),
  resultCpm: document.querySelector("#result-cpm")
};

const state = {
  phase: "idle",
  modeId: "standard",
  stats: createInitialStats(),
  currentQuestion: null,
  recentQuestionIds: [],
  history: [],
  startedAt: 0,
  gameEndsAt: 0,
  promptStartedAt: 0,
  promptEndsAt: 0,
  promptDuration: 0,
  promptToken: 0,
  transitionLocked: false,
  previousInput: "",
  animationFrame: 0
};

function showScreen(screenName) {
  elements.startScreen.hidden = screenName !== "start";
  elements.gameScreen.hidden = screenName !== "game";
  elements.resultScreen.hidden = screenName !== "result";
}

function setAnswerVisibility(isVisible) {
  document.body.classList.toggle("show-answer", isVisible);
  elements.answerToggle.checked = isVisible;
  localStorage.setItem("latex-da-show-answer", String(isVisible));
}

function renderEquation(latex) {
  elements.renderedEquation.textContent = latex;

  if (window.katex) {
    try {
      window.katex.render(latex, elements.renderedEquation, {
        displayMode: true,
        throwOnError: false,
        strict: false
      });
    } catch {
      elements.renderedEquation.textContent = latex;
    }
  }
}

function updateHud(remainingMilliseconds = state.gameEndsAt - performance.now()) {
  elements.timeValue.textContent = formatTime(remainingMilliseconds);
  elements.scoreValue.textContent = state.stats.score.toLocaleString("ja-JP");
  elements.comboValue.textContent = String(state.stats.combo);
  elements.accuracyValue.textContent = calculateAccuracy(
    state.stats.correctKeystrokes,
    state.stats.totalKeystrokes
  ).toFixed(1);
}

function resetInput() {
  state.previousInput = "";
  elements.latexInput.value = "";
  elements.latexInput.disabled = false;
  elements.latexInput.classList.remove("is-invalid", "is-correct");
  elements.inputMessage.className = "input-message";
  elements.inputMessage.textContent = "数式と同じLaTeX記法を入力してください。";
}

function focusInput() {
  requestAnimationFrame(() => {
    elements.latexInput.focus({ preventScroll: true });
  });
}

function nextQuestion() {
  if (state.phase !== "playing") {
    return;
  }

  const now = performance.now();
  if (now >= state.gameEndsAt) {
    endGame();
    return;
  }

  state.transitionLocked = false;
  state.currentQuestion = pickNextQuestion(
    QUESTION_BANK,
    state.modeId,
    state.recentQuestionIds
  );
  state.recentQuestionIds = [
    ...state.recentQuestionIds.slice(-3),
    state.currentQuestion.id
  ];
  state.promptDuration = calculatePromptDuration(state.currentQuestion, state.modeId);
  state.promptStartedAt = now;
  state.promptEndsAt = Math.min(now + state.promptDuration, state.gameEndsAt);
  state.promptToken += 1;

  elements.expectedAnswer.textContent = state.currentQuestion.answer;
  elements.questionTopic.textContent = state.currentQuestion.topic;
  renderEquation(state.currentQuestion.latex);
  resetInput();
  updatePlatePosition(1);
  updatePromptMeter(1);
  focusInput();
}

function updatePlatePosition(remainingRatio) {
  const progress = 1 - remainingRatio;
  const leftPercentage = 105 - progress * 140;
  elements.plate.style.left = `${leftPercentage}%`;
}

function updatePromptMeter(remainingRatio) {
  elements.promptMeterFill.style.transform = `scaleX(${remainingRatio})`;
  elements.promptMeterFill.style.background =
    remainingRatio < 0.25
      ? "linear-gradient(90deg, #cf3f50, #f06f56)"
      : "linear-gradient(90deg, #f06f56, #f3c969, #66c5ad)";
}

function updateInputStats(nextValue) {
  const target = state.currentQuestion.answer;
  const previousValue = state.previousInput;
  const insertedCount = Math.max(0, nextValue.length - previousValue.length);
  const previousCommon = commonPrefixLength(target, previousValue);
  const nextCommon = commonPrefixLength(target, nextValue);

  if (insertedCount > 0) {
    state.stats.totalKeystrokes += insertedCount;
    state.stats.correctKeystrokes += Math.max(0, nextCommon - previousCommon);
  }

  state.previousInput = nextValue;
}

function handleInput(event) {
  if (state.phase !== "playing" || state.transitionLocked || !state.currentQuestion) {
    return;
  }

  const typed = event.currentTarget.value;
  updateInputStats(typed);
  const match = getMatchState(state.currentQuestion.answer, typed);

  elements.latexInput.classList.toggle("is-invalid", typed.length > 0 && !match.isPrefix);
  elements.inputMessage.classList.toggle("is-error", typed.length > 0 && !match.isPrefix);

  if (typed.length === 0) {
    elements.inputMessage.textContent = "数式と同じLaTeX記法を入力してください。";
  } else if (!match.isPrefix) {
    const position = match.commonLength + 1;
    elements.inputMessage.textContent = `${position}文字目が正答と異なります。Backspaceで戻してください。`;
  } else {
    const remaining = state.currentQuestion.answer.length - typed.length;
    elements.inputMessage.textContent = remaining > 0 ? `あと ${remaining} 文字` : "完全一致！";
  }

  if (match.isComplete) {
    completeQuestion();
  }

  updateHud();
}

function completeQuestion() {
  if (state.transitionLocked || state.phase !== "playing") {
    return;
  }

  state.transitionLocked = true;
  const now = performance.now();
  const remainingRatio = Math.max(
    0,
    Math.min(1, (state.promptEndsAt - now) / state.promptDuration)
  );
  const nextCombo = state.stats.combo + 1;
  const earned = calculateQuestionScore(
    state.currentQuestion,
    nextCombo,
    remainingRatio,
    state.modeId
  );

  state.stats.score += earned;
  state.stats.correctAnswers += 1;
  state.stats.combo = nextCombo;
  state.stats.maxCombo = Math.max(state.stats.maxCombo, nextCombo);

  elements.latexInput.disabled = true;
  elements.latexInput.classList.remove("is-invalid");
  elements.latexInput.classList.add("is-correct");
  elements.inputMessage.className = "input-message is-success";
  elements.inputMessage.textContent = `正解！ +${earned.toLocaleString("ja-JP")}点`;
  showFeedback("success", `+${earned.toLocaleString("ja-JP")}`, `${nextCombo} combo`);
  addHistory("success", `+${earned.toLocaleString("ja-JP")}`, state.currentQuestion.answer);
  updateHud();

  const token = state.promptToken;
  window.setTimeout(() => {
    if (state.phase === "playing" && state.promptToken === token) {
      nextQuestion();
    }
  }, 260);
}

function missQuestion() {
  if (state.transitionLocked || state.phase !== "playing") {
    return;
  }

  state.transitionLocked = true;
  state.stats.missedAnswers += 1;
  state.stats.combo = 0;
  elements.latexInput.disabled = true;
  elements.inputMessage.className = "input-message is-error";
  elements.inputMessage.textContent = "お皿が流れてしまいました。次の数式へ進みます。";
  showFeedback("miss", "MISS", state.currentQuestion.topic);
  addHistory("miss", "TIME UP", state.currentQuestion.answer);
  updateHud();

  const token = state.promptToken;
  window.setTimeout(() => {
    if (state.phase === "playing" && state.promptToken === token) {
      nextQuestion();
    }
  }, 430);
}

function showFeedback(type, headline, detail) {
  elements.feedback.className = `feedback is-${type}`;
  elements.feedback.replaceChildren();

  const strong = document.createElement("strong");
  strong.textContent = headline;
  const span = document.createElement("span");
  span.textContent = detail;
  elements.feedback.append(strong, span);
}

function addHistory(type, status, answer) {
  state.history.unshift({ type, status, answer });
  state.history = state.history.slice(0, 3);
  elements.answerHistory.replaceChildren();

  for (const item of state.history) {
    const listItem = document.createElement("li");
    listItem.classList.toggle("is-miss", item.type === "miss");
    const statusElement = document.createElement("span");
    statusElement.textContent = item.status;
    const answerElement = document.createElement("code");
    answerElement.textContent = item.answer;
    listItem.append(statusElement, answerElement);
    elements.answerHistory.append(listItem);
  }
}

function gameLoop(now) {
  if (state.phase !== "playing") {
    return;
  }

  const gameRemaining = state.gameEndsAt - now;
  updateHud(gameRemaining);

  if (gameRemaining <= 0) {
    endGame();
    return;
  }

  if (!state.transitionLocked && state.currentQuestion) {
    const promptRemaining = state.promptEndsAt - now;
    const remainingRatio = Math.max(0, Math.min(1, promptRemaining / state.promptDuration));
    updatePlatePosition(remainingRatio);
    updatePromptMeter(remainingRatio);

    if (promptRemaining <= 0) {
      missQuestion();
    }
  }

  state.animationFrame = requestAnimationFrame(gameLoop);
}

function startGame(modeId) {
  const mode = MODES[modeId] ?? MODES.standard;
  cancelAnimationFrame(state.animationFrame);
  state.phase = "playing";
  state.modeId = mode.id;
  state.stats = createInitialStats();
  state.currentQuestion = null;
  state.recentQuestionIds = [];
  state.history = [];
  state.transitionLocked = false;
  state.previousInput = "";
  state.promptToken += 1;
  state.startedAt = performance.now();
  state.gameEndsAt = state.startedAt + mode.durationSeconds * 1000;

  elements.modeName.textContent = mode.name;
  elements.answerHistory.replaceChildren();
  elements.feedback.className = "feedback";
  elements.feedback.textContent = "数式が流れてくる前に、入力欄へフォーカスします。";
  updateHud(mode.durationSeconds * 1000);
  showScreen("game");
  nextQuestion();
  state.animationFrame = requestAnimationFrame(gameLoop);
}

function endGame() {
  if (state.phase !== "playing") {
    return;
  }

  state.phase = "result";
  state.promptToken += 1;
  cancelAnimationFrame(state.animationFrame);
  elements.latexInput.disabled = true;

  const mode = MODES[state.modeId];
  const elapsed = Math.min(performance.now() - state.startedAt, mode.durationSeconds * 1000);
  const accuracy = calculateAccuracy(
    state.stats.correctKeystrokes,
    state.stats.totalKeystrokes
  );
  const cpm = calculateCharactersPerMinute(state.stats.correctKeystrokes, elapsed);
  const storageKey = `latex-da-high-score-${state.modeId}`;
  const previousBest = Number(localStorage.getItem(storageKey) ?? 0);
  const isNewBest = state.stats.score > previousBest;
  const bestScore = Math.max(previousBest, state.stats.score);
  localStorage.setItem(storageKey, String(bestScore));

  elements.resultCourse.textContent = `${mode.name} / ${mode.durationSeconds}秒`;
  elements.finalScore.textContent = state.stats.score.toLocaleString("ja-JP");
  elements.highScoreMessage.textContent = isNewBest
    ? `NEW BEST — ${bestScore.toLocaleString("ja-JP")}`
    : `BEST ${bestScore.toLocaleString("ja-JP")}`;
  elements.resultCorrect.textContent = String(state.stats.correctAnswers);
  elements.resultMissed.textContent = String(state.stats.missedAnswers);
  elements.resultCombo.textContent = String(state.stats.maxCombo);
  elements.resultAccuracy.textContent = accuracy.toFixed(1);
  elements.resultCpm.textContent = String(cpm);
  elements.shareButton.textContent = "結果をコピー";
  showScreen("result");
}

async function copyResult() {
  const mode = MODES[state.modeId];
  const accuracy = calculateAccuracy(
    state.stats.correctKeystrokes,
    state.stats.totalKeystrokes
  );
  const text = [
    "LaTexDa — LaTeXタイピング結果",
    `${mode.name}: ${state.stats.score.toLocaleString("ja-JP")}点`,
    `正解 ${state.stats.correctAnswers} / 最大 ${state.stats.maxCombo} combo / 正確性 ${accuracy.toFixed(1)}%`
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    elements.shareButton.textContent = "コピーしました！";
  } catch {
    window.prompt("以下の結果をコピーしてください。", text);
  }
}

function returnToCourses() {
  cancelAnimationFrame(state.animationFrame);
  state.phase = "idle";
  state.promptToken += 1;
  showScreen("start");
}

elements.courseButtons.forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.startMode));
});

elements.answerToggle.addEventListener("change", (event) => {
  setAnswerVisibility(event.currentTarget.checked);
  if (state.phase === "playing") {
    focusInput();
  }
});

elements.latexInput.addEventListener("input", handleInput);
elements.latexInput.addEventListener("paste", (event) => {
  if (state.phase === "playing") {
    event.preventDefault();
    elements.inputMessage.className = "input-message is-error";
    elements.inputMessage.textContent = "タイピングゲームのため、貼り付けは使用できません。";
  }
});

elements.quitButton.addEventListener("click", endGame);
elements.retryButton.addEventListener("click", () => startGame(state.modeId));
elements.shareButton.addEventListener("click", copyResult);
elements.coursesButton.addEventListener("click", returnToCourses);

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  returnToCourses();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.phase === "playing") {
    focusInput();
  }
});

const storedAnswerPreference = localStorage.getItem("latex-da-show-answer");
setAnswerVisibility(storedAnswerPreference !== "false");
showScreen("start");
