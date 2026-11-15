import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "fr15-test-secret-at-least-thirty-two-characters";

function tokenFor(role, id) {
  return signToken({ id, role, email: `${role.toLowerCase()}@example.com` }, { secret: SECRET });
}

async function startServer(examRepo) {
  const app = createApp({ userRepo: {}, examRepo, jwtSecret: SECRET });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    async submit(token, attemptId = "attempt-1") {
      const response = await fetch(
        `${url}/api/exams/exam-1/attempts/${attemptId}/submit`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      return { status: response.status, body: await response.json() };
    },
    async autoSubmit(token, attemptId = "attempt-1") {
      const response = await fetch(
        `${url}/api/exams/exam-1/attempts/${attemptId}/auto-submit`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      return { status: response.status, body: await response.json() };
    },
    async getExam(token) {
      const response = await fetch(`${url}/api/exams/exam-1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: response.status, body: await response.json() };
    },
    async getResults(token) {
      const response = await fetch(`${url}/api/exams/exam-1/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: response.status, body: await response.json() };
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function makeExamRepo(questions = [
  { id: "question-1", options: ["Option A", "Option B"], correctAnswer: "Option A" },
]) {
  const attempt = {
    id: "attempt-1",
    examId: "exam-1",
    studentId: 7,
    status: "IN_PROGRESS",
    answers: { "question-1": "Option A" },
    startedAt: new Date(Date.now() - 120_000),
    submittedAt: null,
  };
  let submitCalls = 0;
  return {
    attempt,
    get submitCalls() { return submitCalls; },
    async findStudentAttempt(attemptId, examId, studentId) {
      return attemptId === attempt.id && examId === attempt.examId && studentId === attempt.studentId
        ? { ...attempt }
        : null;
    },
    async findAttempt(examId, studentId) {
      return examId === attempt.examId && studentId === attempt.studentId
        ? { ...attempt }
        : null;
    },
    async getExamQuestions() {
      return questions;
    },
    async findExamById(examId) {
      return examId === "exam-1"
        ? { id: examId, durationMinutes: 1, endTime: null, resultReleaseTime: null }
        : null;
    },
    async submitActiveAttempt(attemptId, result) {
      submitCalls += 1;
      if (attemptId !== attempt.id || attempt.status !== "IN_PROGRESS") return null;
      attempt.status = "SUBMITTED";
      attempt.submittedAt = new Date("2026-11-15T12:00:00.000Z");
      Object.assign(attempt, result);
      return { ...attempt };
    },
  };
}

test("FR-15: owning student can submit and saved answers remain on the attempt", async () => {
  const examRepo = makeExamRepo();
  const server = await startServer(examRepo);
  try {
    const response = await server.submit(tokenFor("STUDENT", 7));
    assert.equal(response.status, 200);
    assert.equal(response.body.submitted, true);
    assert.deepEqual(response.body.answers, { "question-1": "Option A" });
    assert.equal(examRepo.attempt.status, "SUBMITTED");
    assert.equal(examRepo.submitCalls, 1);
    assert.equal(examRepo.attempt.score, 1);
    assert.equal(examRepo.attempt.totalMarks, 1);
    assert.deepEqual(examRepo.attempt.evaluation, {
      "question-1": { answer: "Option A", isCorrect: true },
    });
    assert.equal(response.body.evaluation, undefined);
  } finally {
    await server.close();
  }
});

test("FR-16: submission scores correct answers and marks incorrect and blank answers", async () => {
  const examRepo = makeExamRepo([
    { id: "question-1", options: ["Option A", "Option B"], correctAnswer: "Option A" },
    { id: "question-2", options: ["Option A", "Option B"], correctAnswer: "Option A" },
    { id: "question-3", options: ["Option A", "Option B"], correctAnswer: "Option B" },
  ]);
  examRepo.attempt.answers = {
    "question-1": "Option A",
    "question-2": "Option B",
  };
  const server = await startServer(examRepo);
  try {
    const response = await server.submit(tokenFor("STUDENT", 7));
    assert.equal(response.status, 200);
    assert.equal(examRepo.attempt.score, 1);
    assert.equal(examRepo.attempt.totalMarks, 3);
    assert.deepEqual(examRepo.attempt.evaluation, {
      "question-1": { answer: "Option A", isCorrect: true },
      "question-2": { answer: "Option B", isCorrect: false },
      "question-3": { answer: null, isCorrect: false },
    });
    assert.equal(response.body.evaluation, undefined);
  } finally {
    await server.close();
  }
});

test("FR-17: calculated score and total marks are returned in the released result", async () => {
  const examRepo = makeExamRepo([
    { id: "question-1", options: ["Option A", "Option B"], correctAnswer: "Option A" },
    { id: "question-2", options: ["Option A", "Option B"], correctAnswer: "Option A" },
    { id: "question-3", options: ["Option A", "Option B"], correctAnswer: "Option B" },
  ]);
  examRepo.attempt.answers = {
    "question-1": "Option A",
    "question-2": "Option B",
  };
  const server = await startServer(examRepo);
  try {
    const token = tokenFor("STUDENT", 7);
    const submission = await server.submit(token);
    assert.equal(submission.status, 200);

    const result = await server.getResults(token);
    assert.equal(result.status, 200);
    assert.equal(result.body.isReleased, true);
    assert.equal(result.body.score, 1);
    assert.equal(result.body.totalMarks, 3);
    assert.equal(result.body.percentage, 33);
  } finally {
    await server.close();
  }
});

test("FR-16: automatic submission also evaluates and stores the result", async () => {
  const examRepo = makeExamRepo();
  const server = await startServer(examRepo);
  try {
    const response = await server.autoSubmit(tokenFor("STUDENT", 7));
    assert.equal(response.status, 200);
    assert.equal(examRepo.attempt.score, 1);
    assert.equal(examRepo.attempt.totalMarks, 1);
    assert.deepEqual(examRepo.attempt.evaluation, {
      "question-1": { answer: "Option A", isCorrect: true },
    });
    assert.equal(response.body.evaluation, undefined);
  } finally {
    await server.close();
  }
});

test("FR-16: students cannot retrieve internal exam details and stored evaluations", async () => {
  const examRepo = makeExamRepo();
  const server = await startServer(examRepo);
  try {
    const response = await server.getExam(tokenFor("STUDENT", 7));
    assert.equal(response.status, 403);
  } finally {
    await server.close();
  }
});

test("FR-15: teachers cannot submit a student attempt", async () => {
  const examRepo = makeExamRepo();
  const server = await startServer(examRepo);
  try {
    const response = await server.submit(tokenFor("TEACHER", 2));
    assert.equal(response.status, 403);
    assert.equal(examRepo.submitCalls, 0);
  } finally {
    await server.close();
  }
});

test("FR-15: a student cannot submit another student's attempt", async () => {
  const examRepo = makeExamRepo();
  const server = await startServer(examRepo);
  try {
    const response = await server.submit(tokenFor("STUDENT", 8));
    assert.equal(response.status, 404);
    assert.equal(examRepo.submitCalls, 0);
  } finally {
    await server.close();
  }
});
