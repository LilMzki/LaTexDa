import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateAccuracy,
  calculateCharactersPerMinute,
  calculatePromptDuration,
  calculateQuestionScore,
  commonPrefixLength,
  formatTime,
  getMatchState,
  pickNextQuestion
} from "../src/game-core.js";

const easyQuestion = {
  id: "fraction",
  level: "easy",
  answer: "\\frac{1}{2}"
};

const hardQuestion = {
  id: "fourier",
  level: "hard",
  answer: "\\mathcal{F}\\{f(t)\\}(\\omega)"
};

test("commonPrefixLength は一致している先頭文字数を返す", () => {
  assert.equal(commonPrefixLength("\\frac{1}{2}", "\\fra"), 4);
  assert.equal(commonPrefixLength("abc", "ax"), 1);
  assert.equal(commonPrefixLength("abc", ""), 0);
});

test("getMatchState は途中・誤入力・完全一致を区別する", () => {
  assert.deepEqual(getMatchState("\\sqrt{x}", "\\sqr"), {
    commonLength: 4,
    isPrefix: true,
    isComplete: false,
    expectedCharacter: "t"
  });

  assert.equal(getMatchState("\\sqrt{x}", "\\sqx").isPrefix, false);
  assert.equal(getMatchState("\\sqrt{x}", "\\sqrt{x}").isComplete, true);
});

test("calculateAccuracy は小数1桁に丸め、入力前は100%とする", () => {
  assert.equal(calculateAccuracy(0, 0), 100);
  assert.equal(calculateAccuracy(8, 10), 80);
  assert.equal(calculateAccuracy(2, 3), 66.7);
});

test("calculateQuestionScore は速度・コンボ・難易度で増加する", () => {
  const base = calculateQuestionScore(easyQuestion, 1, 0, "trial");
  const fast = calculateQuestionScore(easyQuestion, 1, 1, "trial");
  const combo = calculateQuestionScore(easyQuestion, 8, 1, "trial");
  const hard = calculateQuestionScore(hardQuestion, 8, 1, "master");

  assert.ok(fast > base);
  assert.ok(combo > fast);
  assert.ok(hard > combo);
});

test("calculatePromptDuration は長い・難しい問題ほど猶予が長い", () => {
  assert.ok(
    calculatePromptDuration(hardQuestion, "master") >
      calculatePromptDuration(easyQuestion, "master")
  );
});

test("pickNextQuestion は直近問題を可能な限り避ける", () => {
  const bank = [
    { id: "a", level: "easy", answer: "a" },
    { id: "b", level: "easy", answer: "b" }
  ];

  const selected = pickNextQuestion(bank, "trial", ["a"], () => 0);
  assert.equal(selected.id, "b");
});

test("pickNextQuestion は対象問題がない場合に明示的なエラーを返す", () => {
  assert.throws(
    () => pickNextQuestion([{ id: "x", level: "hard", answer: "x" }], "trial"),
    /出題できる問題/
  );
});

test("formatTime は切り上げた0.1秒単位で表示する", () => {
  assert.equal(formatTime(60_000), "60.0");
  assert.equal(formatTime(59_951), "60.0");
  assert.equal(formatTime(59_901), "60.0");
  assert.equal(formatTime(59_899), "59.9");
  assert.equal(formatTime(-1), "0.0");
});

test("calculateCharactersPerMinute は経過時間からCPMを計算する", () => {
  assert.equal(calculateCharactersPerMinute(120, 60_000), 120);
  assert.equal(calculateCharactersPerMinute(40, 30_000), 80);
  assert.equal(calculateCharactersPerMinute(40, 0), 0);
});

import { QUESTION_BANK } from "../src/questions.js";

test("問題バンクは各難易度を含む36問で、IDが重複しない", () => {
  assert.equal(QUESTION_BANK.length, 36);
  assert.equal(new Set(QUESTION_BANK.map((question) => question.id)).size, 36);
  assert.deepEqual(
    new Set(QUESTION_BANK.map((question) => question.level)),
    new Set(["easy", "medium", "hard"])
  );
});

test("すべての問題に表示式・正答・トピックが設定されている", () => {
  for (const question of QUESTION_BANK) {
    assert.ok(question.latex.length > 0, `${question.id}: latex`);
    assert.ok(question.answer.length > 0, `${question.id}: answer`);
    assert.ok(question.topic.length > 0, `${question.id}: topic`);
    assert.equal(question.answer.includes("\n"), false, `${question.id}: single-line answer`);
  }
});
