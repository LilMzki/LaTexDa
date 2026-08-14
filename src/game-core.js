export const MODES = Object.freeze({
  trial: Object.freeze({
    id: "trial",
    name: "お試しコース",
    durationSeconds: 30,
    promptBaseSeconds: 10,
    levels: Object.freeze(["easy"]),
    scoreMultiplier: 1
  }),
  standard: Object.freeze({
    id: "standard",
    name: "修行コース",
    durationSeconds: 60,
    promptBaseSeconds: 8.5,
    levels: Object.freeze(["easy", "medium"]),
    scoreMultiplier: 1.2
  }),
  master: Object.freeze({
    id: "master",
    name: "達人コース",
    durationSeconds: 120,
    promptBaseSeconds: 7,
    levels: Object.freeze(["easy", "medium", "hard"]),
    scoreMultiplier: 1.45
  })
});

const LEVEL_SCORE = Object.freeze({
  easy: 60,
  medium: 150,
  hard: 280
});

const LEVEL_TIME_BONUS = Object.freeze({
  easy: 0,
  medium: 1.4,
  hard: 3.2
});

export function createInitialStats() {
  return {
    score: 0,
    correctAnswers: 0,
    missedAnswers: 0,
    combo: 0,
    maxCombo: 0,
    correctKeystrokes: 0,
    totalKeystrokes: 0
  };
}

export function commonPrefixLength(target, typed) {
  const limit = Math.min(target.length, typed.length);
  let index = 0;

  while (index < limit && target[index] === typed[index]) {
    index += 1;
  }

  return index;
}

export function getMatchState(target, typed) {
  const commonLength = commonPrefixLength(target, typed);
  const isPrefix = commonLength === typed.length;

  return {
    commonLength,
    isPrefix,
    isComplete: typed === target,
    expectedCharacter: target[typed.length] ?? ""
  };
}

export function calculateAccuracy(correctKeystrokes, totalKeystrokes) {
  if (totalKeystrokes <= 0) {
    return 100;
  }

  return Math.round((correctKeystrokes / totalKeystrokes) * 1000) / 10;
}

export function calculateQuestionScore(question, combo, promptRemainingRatio, modeId) {
  const mode = MODES[modeId] ?? MODES.standard;
  const levelScore = LEVEL_SCORE[question.level] ?? LEVEL_SCORE.easy;
  const lengthScore = question.answer.length * 12;
  const safeRatio = Math.min(1, Math.max(0, promptRemainingRatio));
  const speedBonus = Math.round((levelScore + lengthScore) * safeRatio * 0.55);
  const comboMultiplier = Math.min(2.5, 1 + Math.max(0, combo - 1) * 0.08);

  return Math.round(
    (levelScore + lengthScore + speedBonus) * comboMultiplier * mode.scoreMultiplier
  );
}

export function calculatePromptDuration(question, modeId) {
  const mode = MODES[modeId] ?? MODES.standard;
  const levelBonus = LEVEL_TIME_BONUS[question.level] ?? 0;
  const lengthBonus = Math.min(6, question.answer.length * 0.075);

  return Math.round((mode.promptBaseSeconds + levelBonus + lengthBonus) * 1000);
}

export function pickNextQuestion(questionBank, modeId, recentIds = [], random = Math.random) {
  const mode = MODES[modeId] ?? MODES.standard;
  const eligible = questionBank.filter((question) => mode.levels.includes(question.level));

  if (eligible.length === 0) {
    throw new Error("選択したモードで出題できる問題がありません。");
  }

  const withoutRecent = eligible.filter((question) => !recentIds.includes(question.id));
  const pool = withoutRecent.length > 0 ? withoutRecent : eligible;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));

  return pool[index];
}

export function formatTime(milliseconds) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalTenths = Math.ceil(safeMilliseconds / 100);
  const seconds = Math.floor(totalTenths / 10);
  const tenths = totalTenths % 10;

  return `${seconds}.${tenths}`;
}

export function calculateCharactersPerMinute(correctKeystrokes, elapsedMilliseconds) {
  if (elapsedMilliseconds <= 0) {
    return 0;
  }

  return Math.round((correctKeystrokes / elapsedMilliseconds) * 60000);
}
