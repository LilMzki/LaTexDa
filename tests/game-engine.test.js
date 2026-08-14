import test from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../src/game-engine.js";

const QUESTIONS = [
  { id: "one", level: 1, category: "test", answer: "x^2", render: "x^2" },
  { id: "two", level: 2, category: "test", answer: "\\frac{1}{2}", render: "\\frac{1}{2}" },
];

function clock(start = 0) {
  let current = start;
  return {
    now: () => current,
    set: (value) => {
      current = value;
    },
  };
}

test("starts a timed game with a question", () => {
  const time = clock(1_000);
  const engine = new GameEngine({ questions: QUESTIONS, now: time.now, random: () => 0.9 });
  const { snapshot, events } = engine.start({ durationSeconds: 60 });

  assert.equal(snapshot.status, "playing");
  assert.equal(snapshot.remainingMs, 60_000);
  assert.ok(QUESTIONS.some((question) => question.id === snapshot.question.id));
  assert.equal(events[0].type, "started");
});

test("an exact answer scores and advances to another question", () => {
  const time = clock();
  const engine = new GameEngine({ questions: QUESTIONS, now: time.now, random: () => 0.9 });
  const started = engine.start();
  const first = started.snapshot.question;

  time.set(1_200);
  const result = engine.setInput(first.answer);

  assert.equal(result.events.at(-1).type, "correct");
  assert.equal(result.snapshot.correctCount, 1);
  assert.equal(result.snapshot.combo, 1);
  assert.ok(result.snapshot.score > 0);
  assert.equal(result.snapshot.input, "");
  assert.notEqual(result.snapshot.question.id, first.id);
});

test("wrong inserted characters count as misses and break the combo", () => {
  const time = clock();
  const engine = new GameEngine({ questions: QUESTIONS, now: time.now, random: () => 0.9 });
  const started = engine.start();
  const first = started.snapshot.question;

  time.set(900);
  engine.setInput(first.answer);
  assert.equal(engine.getSnapshot().combo, 1);

  const wrong = engine.setInput("!");
  assert.equal(wrong.snapshot.missKeystrokes, 1);
  assert.equal(wrong.snapshot.combo, 0);
  assert.equal(wrong.events[0].type, "miss");
});

test("backspace does not add a keystroke", () => {
  const time = clock();
  const engine = new GameEngine({ questions: QUESTIONS, now: time.now, random: () => 0.9 });
  const { snapshot } = engine.start();
  const firstCharacter = snapshot.question.answer[0];

  engine.setInput(firstCharacter);
  const beforeDelete = engine.getSnapshot();
  engine.setInput("");
  const afterDelete = engine.getSnapshot();

  assert.equal(afterDelete.correctKeystrokes, beforeDelete.correctKeystrokes);
  assert.equal(afterDelete.missKeystrokes, beforeDelete.missKeystrokes);
});

test("answer visibility can be changed while playing", () => {
  const time = clock();
  const engine = new GameEngine({ questions: QUESTIONS, now: time.now });
  engine.start({ answerVisible: true });

  const toggled = engine.toggleAnswer();
  assert.equal(toggled.snapshot.answerVisible, false);
  assert.deepEqual(toggled.events[0], { type: "answer-visibility", visible: false });
});

test("the game finishes when the deadline is reached", () => {
  const time = clock(500);
  const engine = new GameEngine({ questions: QUESTIONS, now: time.now });
  engine.start({ durationSeconds: 10 });

  time.set(10_500);
  const finished = engine.tick();

  assert.equal(finished.snapshot.status, "finished");
  assert.equal(finished.snapshot.remainingMs, 0);
  assert.equal(finished.events[0].type, "finished");
});

test("accuracy includes corrected mistakes", () => {
  const time = clock();
  const engine = new GameEngine({ questions: QUESTIONS, now: time.now, random: () => 0.9 });
  const { snapshot } = engine.start();
  const answer = snapshot.question.answer;

  engine.setInput("!");
  engine.setInput("");
  engine.setInput(answer[0]);

  const state = engine.getSnapshot();
  assert.equal(state.missKeystrokes, 1);
  assert.equal(state.correctKeystrokes, 1);
  assert.equal(state.accuracy, 50);
});
