export const GAME_STATUS = Object.freeze({
  IDLE: "idle",
  PLAYING: "playing",
  PAUSED: "paused",
  FINISHED: "finished"
});

export const MODES = Object.freeze({
  quick: Object.freeze({
    key: "quick",
    name: "お手軽コース",
    durationMs: 60_000,
    maxDifficulty: 1,
    plateTimeMultiplier: 1.35,
    description: "基礎記法を60秒で練習"
  }),
  standard: Object.freeze({
    key: "standard",
    name: "おすすめコース",
    durationMs: 90_000,
    maxDifficulty: 2,
    plateTimeMultiplier: 1,
    description: "基礎〜標準を90秒で攻略"
  }),
  expert: Object.freeze({
    key: "expert",
    name: "高級コース",
    durationMs: 120_000,
    maxDifficulty: 3,
    plateTimeMultiplier: 0.9,
    description: "発展問題まで120秒で挑戦"
  })
});

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export function normalizeTypedCharacter(character) {
  return /[¥￥＼]/.test(character) ? "\\" : character;
}

export function calculateAccuracy(correctKeys, mistakes) {
  const total = correctKeys + mistakes;
  if (total === 0) return 100;
  return (correctKeys / total) * 100;
}

export function calculateKeystrokeScore(difficulty, combo) {
  const comboBonus = Math.min(12, Math.max(0, combo));
  return difficulty * 10 + comboBonus;
}

export function calculateCompletionBonus(question, combo) {
  return question.difficulty * 100 + question.latex.length * 4 + combo * 20;
}

export function calculateQuestionTimeMs(question, mode) {
  const base = 5_500 + question.latex.length * 260;
  return Math.round(clamp(base * mode.plateTimeMultiplier, 7_000, 22_000));
}

export class TypingRound {
  constructor(question) {
    if (!question?.latex) {
      throw new TypeError("question.latex is required");
    }

    this.question = question;
    this.answer = question.latex;
    this.typed = "";
  }

  get remaining() {
    return this.answer.slice(this.typed.length);
  }

  input(character) {
    if (typeof character !== "string" || Array.from(character).length !== 1) {
      return {
        accepted: false,
        completed: false,
        expectedCharacter: this.answer[this.typed.length] ?? "",
        typed: this.typed
      };
    }

    const normalizedCharacter = normalizeTypedCharacter(character);
    const expectedCharacter = this.answer[this.typed.length];
    if (normalizedCharacter !== expectedCharacter) {
      return {
        accepted: false,
        completed: false,
        expectedCharacter: expectedCharacter ?? "",
        typed: this.typed
      };
    }

    this.typed += normalizedCharacter;
    return {
      accepted: true,
      completed: this.typed === this.answer,
      expectedCharacter: this.answer[this.typed.length] ?? "",
      typed: this.typed
    };
  }
}

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export class QuestionDeck {
  constructor(questions, maxDifficulty, random = Math.random) {
    const available = questions.filter(
      (question) => question.difficulty <= maxDifficulty
    );

    if (available.length === 0) {
      throw new RangeError("No questions are available for this mode");
    }

    this.questions = available;
    this.random = random;
    this.queue = [];
    this.previousId = null;
  }

  refill() {
    this.queue = shuffle(this.questions, this.random);

    if (
      this.queue.length > 1 &&
      this.previousId &&
      this.queue.at(-1)?.id === this.previousId
    ) {
      [this.queue[0], this.queue[this.queue.length - 1]] = [
        this.queue[this.queue.length - 1],
        this.queue[0]
      ];
    }
  }

  next() {
    if (this.queue.length === 0) {
      this.refill();
    }

    const question = this.queue.pop();
    this.previousId = question.id;
    return question;
  }
}

export class GameSession {
  constructor({ questions, modes = MODES, random = Math.random } = {}) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new TypeError("questions must be a non-empty array");
    }

    this.questions = questions;
    this.modes = modes;
    this.random = random;
    this.reset();
  }

  reset() {
    this.status = GAME_STATUS.IDLE;
    this.mode = null;
    this.deck = null;
    this.question = null;
    this.round = null;
    this.remainingMs = 0;
    this.questionDurationMs = 0;
    this.questionRemainingMs = 0;
    this.lastTickAt = null;
    this.stats = {
      score: 0,
      solved: 0,
      expired: 0,
      correctKeys: 0,
      mistakes: 0,
      combo: 0,
      maxCombo: 0,
      penaltyPoints: 0
    };
  }

  start(modeKey, now = 0) {
    const mode = this.modes[modeKey];
    if (!mode) {
      throw new RangeError(`Unknown mode: ${modeKey}`);
    }

    this.reset();
    this.status = GAME_STATUS.PLAYING;
    this.mode = mode;
    this.deck = new QuestionDeck(
      this.questions,
      mode.maxDifficulty,
      this.random
    );
    this.remainingMs = mode.durationMs;
    this.lastTickAt = now;
    this.advanceQuestion();
    return this.snapshot();
  }

  advanceQuestion() {
    this.question = this.deck.next();
    this.round = new TypingRound(this.question);
    this.questionDurationMs = calculateQuestionTimeMs(this.question, this.mode);
    this.questionRemainingMs = this.questionDurationMs;
  }

  tick(now) {
    if (this.status !== GAME_STATUS.PLAYING) {
      return { type: "noop", snapshot: this.snapshot() };
    }

    const safeNow = Number.isFinite(now) ? now : this.lastTickAt;
    const delta = Math.max(0, safeNow - this.lastTickAt);
    this.lastTickAt = safeNow;
    this.remainingMs = Math.max(0, this.remainingMs - delta);
    this.questionRemainingMs = Math.max(
      0,
      this.questionRemainingMs - delta
    );

    if (this.remainingMs <= 0) {
      this.status = GAME_STATUS.FINISHED;
      return { type: "finished", snapshot: this.snapshot() };
    }

    if (this.questionRemainingMs <= 0) {
      const expiredQuestion = this.question;
      this.stats.expired += 1;
      this.stats.combo = 0;
      this.advanceQuestion();
      return {
        type: "expired",
        question: expiredQuestion,
        snapshot: this.snapshot()
      };
    }

    return { type: "tick", snapshot: this.snapshot() };
  }

  input(character) {
    if (this.status !== GAME_STATUS.PLAYING) {
      return { type: "ignored", snapshot: this.snapshot() };
    }

    const outcome = this.round.input(character);
    if (!outcome.accepted) {
      const penalty = this.question.difficulty * 5;
      this.stats.mistakes += 1;
      this.stats.combo = 0;
      this.stats.penaltyPoints += penalty;
      this.stats.score = Math.max(0, this.stats.score - penalty);
      return {
        type: "mistake",
        character,
        expectedCharacter: outcome.expectedCharacter,
        snapshot: this.snapshot()
      };
    }

    this.stats.correctKeys += 1;
    this.stats.score += calculateKeystrokeScore(
      this.question.difficulty,
      this.stats.combo
    );

    if (!outcome.completed) {
      return { type: "accepted", snapshot: this.snapshot() };
    }

    const completedQuestion = this.question;
    this.stats.solved += 1;
    this.stats.combo += 1;
    this.stats.maxCombo = Math.max(
      this.stats.maxCombo,
      this.stats.combo
    );
    this.stats.score += calculateCompletionBonus(
      completedQuestion,
      this.stats.combo
    );
    this.advanceQuestion();

    return {
      type: "completed",
      question: completedQuestion,
      snapshot: this.snapshot()
    };
  }

  pause(now) {
    if (this.status !== GAME_STATUS.PLAYING) return this.snapshot();
    this.tick(now);
    if (this.status === GAME_STATUS.FINISHED) return this.snapshot();
    this.status = GAME_STATUS.PAUSED;
    return this.snapshot();
  }

  resume(now) {
    if (this.status !== GAME_STATUS.PAUSED) return this.snapshot();
    this.status = GAME_STATUS.PLAYING;
    this.lastTickAt = now;
    return this.snapshot();
  }

  snapshot() {
    return {
      status: this.status,
      mode: this.mode,
      question: this.question,
      expected: this.round?.answer ?? "",
      typed: this.round?.typed ?? "",
      remaining: this.round?.remaining ?? "",
      remainingMs: this.remainingMs,
      questionDurationMs: this.questionDurationMs,
      questionRemainingMs: this.questionRemainingMs,
      accuracy: calculateAccuracy(
        this.stats.correctKeys,
        this.stats.mistakes
      ),
      stats: { ...this.stats }
    };
  }
}
