import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";
import { shuffleQuestionsForAttempt } from "../src/services/questionSelection.js";

const SECRET = "test-secret-at-least-thirty-two-chars-long";

function tokenForStudent(id) {
  return signToken({ id, role: "STUDENT" }, { secret: SECRET });
}

const selectedQuestions = [
  { id: "q1", text: "Question one", options: ["A1", "B1"], correctOption: 0, difficulty: "EASY" },
  { id: "q2", text: "Question two", options: ["A2", "B2"], correctOption: 1, difficulty: "MEDIUM" },
  { id: "q3", text: "Question three", options: ["A3", "B3"], correctOption: 0, difficulty: "HARD" },
  { id: "q4", text: "Question four", options: ["A4", "B4"], correctOption: 1, difficulty: "MEDIUM" },
];

function createExamRepo() {
  const completedAttempts = new Map();
  return {
    completedAttempts,
    async findExamById(id) {
      return id === "exam-1" ? {
        id,
        title: "Shuffle test",
        isPublished: true,
        durationMinutes: 30,
        startTime: null,
        endTime: null,
      } : null;
    },
    async getExamQuestions() {
      return selectedQuestions;
    },
    async findActiveAttempt(examId, studentId) {
      return {
        id: `active-${examId}-${studentId}`,
        examId,
        studentId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      };
    },
    async countAttemptsByStudent(examId, studentId) {
      return completedAttempts.get(`${examId}:${studentId}`) ?? 0;
    },
  };
}

async function createTestServer(examRepo = createExamRepo()) {
  const app = createApp({
    userRepo: {},
    examRepo,
    questionRepo: {},
    jwtSecret: SECRET,
  });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return {
    examRepo,
    close: () => new Promise((resolve) => server.close(resolve)),
    async getQuestions(studentId) {
      const response = await fetch(`${baseUrl}/api/exams/exam-1/questions`, {
        headers: { Authorization: `Bearer ${tokenForStudent(studentId)}` },
      });
      return { status: response.status, body: await response.json() };
    },
  };
}

test("FR-11: each attempt has a stable shuffled order containing the unchanged selected set", async () => {
  const server = await createTestServer();
  const canonicalIds = selectedQuestions.map(({ id }) => id);
  try {
    const firstAttempt = await server.getQuestions(101);
    const refreshedAttempt = await server.getQuestions(101);
    const anotherStudentAttempt = await server.getQuestions(102);

    assert.equal(firstAttempt.status, 200);
    assert.equal(refreshedAttempt.status, 200);
    assert.equal(anotherStudentAttempt.status, 200);

    const firstOrder = firstAttempt.body.questions.map(({ id }) => id);
    assert.deepEqual(new Set(firstOrder), new Set(canonicalIds));
    assert.deepEqual(refreshedAttempt.body.questions.map(({ id }) => id), firstOrder);
    assert.deepEqual(
      new Set(anotherStudentAttempt.body.questions.map(({ id }) => id)),
      new Set(canonicalIds)
    );
    assert.notDeepEqual(anotherStudentAttempt.body.questions.map(({ id }) => id), firstOrder);
    assert.equal(firstAttempt.body.questions.some(({ correctOption }) => correctOption !== undefined), false);

    for (const question of anotherStudentAttempt.body.questions) {
      const source = selectedQuestions.find(({ id }) => id === question.id);
      assert.deepEqual(question.options, source.options);
      assert.equal(question.text, source.text);
    }
    assert.deepEqual(selectedQuestions.map(({ id }) => id), canonicalIds);
  } finally {
    await server.close();
  }
});

test("FR-11: a later completed attempt uses a new stable shuffle without changing membership", async () => {
  const server = await createTestServer();
  const canonicalIds = selectedQuestions.map(({ id }) => id);
  try {
    const initial = await server.getQuestions(101);
    const initialOrder = initial.body.questions.map(({ id }) => id);

    server.examRepo.completedAttempts.set("exam-1:101", 1);
    const retake = await server.getQuestions(101);
    const retakeRefresh = await server.getQuestions(101);
    const retakeOrder = retake.body.questions.map(({ id }) => id);

    assert.deepEqual(new Set(retakeOrder), new Set(canonicalIds));
    assert.notDeepEqual(retakeOrder, initialOrder);
    assert.deepEqual(retakeRefresh.body.questions.map(({ id }) => id), retakeOrder);
  } finally {
    await server.close();
  }
});

test("FR-11: shuffle copies the fixed set, keeps each question's fields together, and handles small sets", () => {
  const original = selectedQuestions.map((question) => ({ ...question }));
  const shuffled = shuffleQuestionsForAttempt(original, "exam-1:student-101:0");

  assert.notEqual(shuffled, original);
  assert.deepEqual(new Set(shuffled.map(({ id }) => id)), new Set(original.map(({ id }) => id)));
  assert.notDeepEqual(shuffled.map(({ id }) => id), original.map(({ id }) => id));
  assert.deepEqual(shuffleQuestionsForAttempt(original, "exam-1:student-101:0"), shuffled);
  for (const question of shuffled) {
    assert.deepEqual(question, original.find(({ id }) => id === question.id));
  }
  assert.deepEqual(original.map(({ id }) => id), selectedQuestions.map(({ id }) => id));

  assert.deepEqual(shuffleQuestionsForAttempt([], "empty-set"), []);
  const singleton = [{ id: "only", options: ["A"] }];
  assert.deepEqual(shuffleQuestionsForAttempt(singleton, "single-question"), singleton);
  assert.throws(() => shuffleQuestionsForAttempt(singleton), /attempt key is required/);
});
