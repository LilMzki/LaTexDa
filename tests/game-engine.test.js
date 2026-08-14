import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_STATUS,
  GameSession,
  QuestionDeck,
  TypingRound,
  calculateAccuracy,
  calculateQuestionTimeMs,
  normalizeTypedCharacter
} from "../src/game-engine.js";

const easyQuestion = {
  id: "easy",
  latex: "x^2",
  difficulty: 1,
  category: "test"
};

const hardQuestion = {
  id: "hard",
  latex: String.raw`\frac{a}{b}`,
  difficulty: 3,
  category: "test"
};

test("TypingRound accepts only the next correct character", () => {
  const round = new TypingRound(easyQuestion);

  assert.deepEqual(round.input("x"), {
    accepted: true,
    completed: false,
    expectedCharacter: "^",
    typed: "x"
  });

  assert.deepEqual(round.input("a"), {
    accepted: false,
    completed: false,
    expectedCharacter: "^",
    typed: "x"
  });

  round.input("^");
  const result = round.input("2");
  assert.equal(result.accepted, true);
  assert.equal(result.completed, true);
  assert.equal(round.typed, "x^2");
  assert.equal(round.remaining, "");
});

test("QuestionDeck filters by difficulty and avoids immediate repeats", () => {
  const deck = new QuestionDeck(
    [
      easyQuestion,
      { ...easyQuestion, id: "easy-2", latex: "a_n" },
      hardQuestion
    ],
    1,
    () => 0
  );

  const sequence = [deck.next(), deck.next(), deck.next(), deck.next()];
  assert.ok(sequence.every((question) => question.difficulty === 1));

  for (let index = 1; index < sequence.length; index += 1) {
    assert.notEqual(sequence[index].id, sequence[index - 1].id);
  }
});

test("GameSession scores correct input and penalizes mistakes", () => {
  const modes = {
    test: {
      key: "test",
      name: "test",
      durationMs: 30_000,
      maxDifficulty: 1,
      plateTimeMultiplier: 1
    }
  };
  const session = new GameSession({
    questions: [{ ...easyQuestion, latex: "ab" }],
    modes,
    random: () => 0
  });

  session.start("test", 0);
  assert.equal(session.input("a").type, "accepted");
  assert.equal(session.input("x").type, "mistake");
  const completed = session.input("b");

  assert.equal(completed.type, "completed");
  assert.equal(completed.snapshot.stats.solved, 1);
  assert.equal(completed.snapshot.stats.mistakes, 1);
  assert.equal(completed.snapshot.stats.combo, 1);
  assert.equal(completed.snapshot.stats.maxCombo, 1);
  assert.equal(completed.snapshot.stats.score, 143);
  assert.equal(completed.snapshot.accuracy, 2 / 3 * 100);
});

test("GameSession expires a plate independently of the overall timer", () => {
  const modes = {
    test: {
      key: "test",
      name: "test",
      durationMs: 60_000,
      maxDifficulty: 1,
      plateTimeMultiplier: 1
    }
  };
  const session = new GameSession({
    questions: [easyQuestion],
    modes,
    random: () => 0
  });

  const start = session.start("test", 0);
  const plateDuration = start.questionDurationMs;
  const event = session.tick(plateDuration + 1);

  assert.equal(event.type, "expired");
  assert.equal(event.snapshot.stats.expired, 1);
  assert.equal(event.snapshot.status, GAME_STATUS.PLAYING);
  assert.ok(event.snapshot.remainingMs > 0);
});

test("GameSession finishes exactly when the course timer reaches zero", () => {
  const modes = {
    test: {
      key: "test",
      name: "test",
      durationMs: 1_000,
      maxDifficulty: 1,
      plateTimeMultiplier: 1
    }
  };
  const session = new GameSession({ questions: [easyQuestion], modes });

  session.start("test", 100);
  const event = session.tick(1_100);

  assert.equal(event.type, "finished");
  assert.equal(event.snapshot.status, GAME_STATUS.FINISHED);
  assert.equal(event.snapshot.remainingMs, 0);
});

test("accuracy and per-question time helpers handle boundaries", () => {
  assert.equal(calculateAccuracy(0, 0), 100);
  assert.equal(calculateAccuracy(9, 1), 90);

  const mode = { plateTimeMultiplier: 1 };
  assert.equal(calculateQuestionTimeMs({ latex: "x", difficulty: 1 }, mode), 7_000);
  assert.equal(
    calculateQuestionTimeMs({ latex: "x".repeat(200), difficulty: 3 }, mode),
    22_000
  );
});


test("Japanese yen keys are treated as LaTeX backslashes", () => {
  assert.equal(normalizeTypedCharacter("¥"), "\\");
  assert.equal(normalizeTypedCharacter("￥"), "\\");

  const round = new TypingRound({
    id: "backslash",
    latex: String.raw`\alpha`,
    difficulty: 1,
    category: "test"
  });
  assert.equal(round.input("¥").accepted, true);
  assert.equal(round.typed, "\\");
});
