import { questionsForDifficulty } from "./questions.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function commonPrefixLength(left, right) {
  const limit = Math.min(left.length, right.length);
  let index = 0;
  while (index < limit && left[index] === right[index]) index += 1;
  return index;
}

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export class GameEngine {
  constructor({ questions = null, random = Math.random, now = () => performance.now() } = {}) {
    this.sourceQuestions = questions;
    this.random = random;
    this.now = now;
    this.reset();
  }

  reset() {
    this.status = "idle";
    this.durationMs = 60_000;
    this.difficulty = "standard";
    this.startedAt = null;
    this.endsAt = null;
    this.finishedAt = null;
    this.questionStartedAt = null;
    this.currentQuestion = null;
    this.previousQuestionId = null;
    this.queue = [];
    this.pool = [];
    this.input = "";
    this.answerVisible = true;
    this.score = 0;
    this.correctCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctKeystrokes = 0;
    this.missKeystrokes = 0;
    this.completedCharacters = 0;
    this.lastAward = 0;
  }

  start({ durationSeconds = 60, difficulty = "standard", answerVisible = true } = {}) {
    this.reset();

    const duration = Number(durationSeconds);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new TypeError("durationSeconds must be a positive number");
    }

    const candidates = this.sourceQuestions ?? questionsForDifficulty(difficulty);
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error("At least one question is required to start a game");
    }

    this.status = "playing";
    this.durationMs = duration * 1000;
    this.difficulty = difficulty;
    this.answerVisible = Boolean(answerVisible);
    this.pool = [...candidates];
    this.startedAt = this.now();
    this.endsAt = this.startedAt + this.durationMs;
    this.questionStartedAt = this.startedAt;
    this.currentQuestion = this.takeNextQuestion();

    return this.transition([{ type: "started", question: this.currentQuestion }], this.startedAt);
  }

  tick(at = this.now()) {
    if (this.status === "playing" && at >= this.endsAt) {
      return this.finish(at);
    }
    return this.transition([], at);
  }

  setInput(nextValue, at = this.now()) {
    if (this.status !== "playing") return this.transition([], at);
    if (at >= this.endsAt) return this.finish(at);

    const answer = this.currentQuestion.answer;
    const nextInput = String(nextValue).replace(/[\r\n]/g, "").slice(0, 240);
    const prefixLength = commonPrefixLength(this.input, nextInput);
    const events = [];
    let newMisses = 0;

    for (let index = prefixLength; index < nextInput.length; index += 1) {
      if (nextInput[index] === answer[index]) {
        this.correctKeystrokes += 1;
      } else {
        this.missKeystrokes += 1;
        newMisses += 1;
      }
    }

    if (newMisses > 0) {
      this.combo = 0;
      events.push({ type: "miss", count: newMisses });
    }

    this.input = nextInput;

    if (nextInput === answer) {
      events.push(this.completeQuestion(at));
    }

    return this.transition(events, at);
  }

  toggleAnswer(at = this.now()) {
    this.answerVisible = !this.answerVisible;
    return this.transition(
      [{ type: "answer-visibility", visible: this.answerVisible }],
      at,
    );
  }

  finish(at = this.now()) {
    if (this.status === "finished") return this.transition([], at);

    this.status = "finished";
    this.finishedAt = Math.min(at, this.endsAt ?? at);
    this.input = "";

    return this.transition([{ type: "finished", result: this.getResult() }], at);
  }

  completeQuestion(at) {
    const question = this.currentQuestion;
    const elapsedMs = Math.max(1, at - this.questionStartedAt);
    const baseScore = 80 + question.answer.length * 18 + question.level * 70;
    const referenceMs = 1000 + question.answer.length * 260 + question.level * 300;
    const speedRatio = clamp(referenceMs / elapsedMs, 0.55, 1.8);

    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const comboMultiplier = 1 + Math.min(this.combo - 1, 20) * 0.04;
    const award = Math.round(baseScore * speedRatio * comboMultiplier);

    this.score += award;
    this.correctCount += 1;
    this.completedCharacters += question.answer.length;
    this.lastAward = award;
    this.previousQuestionId = question.id;
    this.input = "";
    this.currentQuestion = this.takeNextQuestion();
    this.questionStartedAt = at;

    return {
      type: "correct",
      points: award,
      combo: this.combo,
      elapsedMs,
      completedQuestion: question,
      nextQuestion: this.currentQuestion,
    };
  }

  takeNextQuestion() {
    if (this.queue.length === 0) {
      this.queue = shuffle(this.pool, this.random);

      if (
        this.queue.length > 1 &&
        this.previousQuestionId &&
        this.queue[0].id === this.previousQuestionId
      ) {
        [this.queue[0], this.queue[1]] = [this.queue[1], this.queue[0]];
      }
    }

    return this.queue.shift();
  }

  transition(events, at) {
    return {
      events,
      snapshot: this.getSnapshot(at),
    };
  }

  getSnapshot(at = this.now()) {
    const remainingMs =
      this.status === "playing"
        ? Math.max(0, this.endsAt - at)
        : this.status === "finished"
          ? 0
          : this.durationMs;
    const totalKeystrokes = this.correctKeystrokes + this.missKeystrokes;
    const accuracy = totalKeystrokes
      ? (this.correctKeystrokes / totalKeystrokes) * 100
      : 100;

    return {
      status: this.status,
      durationMs: this.durationMs,
      remainingMs,
      progress: this.durationMs ? remainingMs / this.durationMs : 0,
      difficulty: this.difficulty,
      question: this.currentQuestion,
      input: this.input,
      answerVisible: this.answerVisible,
      score: this.score,
      correctCount: this.correctCount,
      combo: this.combo,
      maxCombo: this.maxCombo,
      correctKeystrokes: this.correctKeystrokes,
      missKeystrokes: this.missKeystrokes,
      accuracy,
      completedCharacters: this.completedCharacters,
      lastAward: this.lastAward,
    };
  }

  getResult() {
    const elapsedMs = Math.max(
      1,
      (this.finishedAt ?? this.now()) - (this.startedAt ?? this.now()),
    );
    const minutes = elapsedMs / 60_000;
    const totalKeystrokes = this.correctKeystrokes + this.missKeystrokes;

    return {
      score: this.score,
      correctCount: this.correctCount,
      maxCombo: this.maxCombo,
      accuracy: totalKeystrokes
        ? (this.correctKeystrokes / totalKeystrokes) * 100
        : 100,
      cpm: Math.round(this.completedCharacters / minutes),
      correctKeystrokes: this.correctKeystrokes,
      missKeystrokes: this.missKeystrokes,
      completedCharacters: this.completedCharacters,
      durationSeconds: this.durationMs / 1000,
      difficulty: this.difficulty,
    };
  }
}

export const internals = Object.freeze({ commonPrefixLength, shuffle });
