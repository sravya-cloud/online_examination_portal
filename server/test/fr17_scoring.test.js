import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";
import { scoreObjectiveAnswers } from "../src/services/objectiveScoring.js";

const SECRET = "fr17-scoring-test-secret-at-least-thirty-two-chars";
const questions = [
  { id: "q1", options: ["A", "B"], correctAnswer: "A" },
  { id: "q2", options: ["C", "D"], correctAnswer: "C" },
  { id: "q3", options: ["A", "B"], correctAnswer: "B" },
];

function tokenForStudent() {
  return signToken({ id: 17, role: "STUDENT" }, { secret: SECRET });
}

async function startServer(examRepo) {
  const app = createApp({ userRepo: {}, examRepo, jwtSecret: SECRET });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  return {
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
    async record(body) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/exams/exam-1/attempts`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${tokenForStudent()}`,
        },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    },
  };
}

test("FR-17: score is the sum of correct answers and unanswered questions count as zero", () => {
  assert.deepEqual(
    scoreObjectiveAnswers(questions, { q1: "A", q2: "wrong", unknown: "B" }),
    { score: 1, totalMarks: 3 },
  );
  assert.deepEqual(scoreObjectiveAnswers(questions, { q1: "A", q2: "C", q3: "B" }), {
    score: 3,
    totalMarks: 3,
  });
  assert.deepEqual(scoreObjectiveAnswers([], {}), { score: 0, totalMarks: 0 });
});

test("FR-17: invalid question or answer containers are rejected", () => {
  assert.throws(() => scoreObjectiveAnswers({}, {}), /Questions must be an array/);
  assert.throws(() => scoreObjectiveAnswers(questions, []), /Answers must be an object/);
});

test("FR-17: scoring preserves option-index and case-insensitive answer compatibility", () => {
  const legacyQuestion = { id: "legacy", options: ["Yes", "No"], correctOption: 0 };
  assert.deepEqual(scoreObjectiveAnswers([legacyQuestion], { legacy: 0 }), { score: 1, totalMarks: 1 });
  assert.deepEqual(scoreObjectiveAnswers([legacyQuestion], { legacy: "YES" }), { score: 1, totalMarks: 1 });
});

test("FR-17: API persists server-calculated score rather than a client-supplied score", async () => {
  const saved = [];
  const examRepo = {
    async findExamById(examId) {
      return examId === "exam-1" ? { id: examId, isPublished: true } : null;
    },
    async findAttempt() {
      return null;
    },
    async getExamQuestions(examId) {
      assert.equal(examId, "exam-1");
      return questions;
    },
    async recordAttempt(attempt) {
      saved.push(attempt);
      return { id: "attempt-1", ...attempt };
    },
  };
  const server = await startServer(examRepo);
  try {
    const response = await server.record({
      answers: { q1: "A", q2: "D" },
      score: 999,
      totalMarks: 999,
    });
    assert.equal(response.status, 201);
    assert.equal(saved[0].score, 1);
    assert.equal(saved[0].totalMarks, 3);
    assert.deepEqual(saved[0].answers, { q1: "A", q2: "D" });
  } finally {
    await server.close();
  }
});
