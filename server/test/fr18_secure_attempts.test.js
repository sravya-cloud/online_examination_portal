import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "fr18-secure-attempts-test-secret-at-least-32-chars";
const questions = [
  { id: "q1", options: ["A", "B"], correctAnswer: "A" },
  { id: "q2", options: ["C", "D"], correctAnswer: "D" },
];

function tokenFor(role, id) {
  return signToken({ id, role }, { secret: SECRET });
}

async function startServer() {
  const saved = [];
  const examRepo = {
    async findExamById(id) {
      return id === "exam-1" ? { id, isPublished: true } : null;
    },
    async getExamQuestions(id) {
      assert.equal(id, "exam-1");
      return questions;
    },
    async recordAttempt(attempt) {
      const persisted = { id: `attempt-${saved.length + 1}`, ...attempt };
      saved.push(persisted);
      return persisted;
    },
  };
  const app = createApp({ userRepo: {}, examRepo, jwtSecret: SECRET });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return {
    saved,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
    async record(token, body) {
      const response = await fetch(`${baseUrl}/api/exams/exam-1/attempts`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    },
  };
}

test("FR-18: an authenticated student persists answers under their own identity", async () => {
  const server = await startServer();
  try {
    const response = await server.record(tokenFor("STUDENT", 17), {
      answers: { q1: "A" },
      studentId: 999,
      score: 999,
      totalMarks: 999,
    });
    assert.equal(response.status, 201);
    assert.equal(server.saved.length, 1);
    assert.equal(server.saved[0].studentId, 17);
    assert.equal(server.saved[0].score, 0);
    assert.equal(server.saved[0].totalMarks, 2);
    assert.deepEqual(server.saved[0].answers, { q1: "A" });
  } finally {
    await server.close();
  }
});

test("FR-18: unauthenticated requests and non-student roles cannot store attempts", async () => {
  const server = await startServer();
  try {
    assert.equal((await server.record(null, { answers: {} })).status, 401);
    assert.equal((await server.record(tokenFor("TEACHER", 2), { answers: {} })).status, 403);
    assert.equal((await server.record(tokenFor("ADMIN", 1), { answers: {} })).status, 403);
    assert.equal(server.saved.length, 0);
  } finally {
    await server.close();
  }
});

test("FR-18: malformed or out-of-exam answers are rejected without persistence", async () => {
  const server = await startServer();
  try {
    const token = tokenFor("STUDENT", 17);
    assert.equal((await server.record(token, { answers: ["A"] })).status, 400);
    assert.equal((await server.record(token, { answers: { q1: "not-an-option" } })).status, 400);
    assert.equal((await server.record(token, { answers: { unselected: "A" } })).status, 400);
    assert.equal(server.saved.length, 0);
  } finally {
    await server.close();
  }
});
