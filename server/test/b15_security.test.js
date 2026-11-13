import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "test-secret-at-least-thirty-two-chars-long";

function tokenFor(role, id = 1) {
  return signToken({ id, role, email: `${role.toLowerCase()}@example.com` }, { secret: SECRET });
}

function makeSecurityMockRepos() {
  const pool = {
    id: "pool-sec",
    name: "Sec Pool",
    questions: [
      { id: "q1", poolId: "pool-sec", text: "Sec Q1", options: ["A", "B"], correctOption: 0, difficulty: "EASY" },
    ],
  };

  const exams = [
    {
      id: "exam-sec-1",
      title: "Security Exam",
      questionPoolId: "pool-sec",
      questionCount: 1,
      durationMinutes: 60,
      startTime: new Date(Date.now() - 3600000), // Active now
      endTime: new Date(Date.now() + 3600000),
      resultReleaseTime: new Date(Date.now() + 7200000), // In future (locked)
      isPublished: true,
      questions: [{ id: "eq1", questionId: "q1", question: pool.questions[0] }],
    },
  ];

  const examRepo = {
    async findQuestionPoolById(id) {
      return id === pool.id ? pool : null;
    },
    async findExamById(id) {
      return exams.find((e) => e.id === id) || null;
    },
    async listExams() {
      return exams;
    },
    async getExamQuestions(id) {
      const e = exams.find((x) => x.id === id);
      return e ? e.questions.map((eq) => eq.question) : [];
    },
    async findAttempt() {
      return { id: "att-1", studentId: 101, score: 1, totalMarks: 1, submittedAt: new Date() };
    },
    async isQuestionInPublishedExam() {
      return true;
    },
    async isPoolInPublishedExam() {
      return true;
    },
  };

  const questionRepo = {
    async findQuestionById(id) {
      return pool.questions.find((q) => q.id === id) || null;
    },
    async updateQuestion() {
      return null;
    },
    async deleteQuestion() {
      return null;
    },
  };

  return { examRepo, questionRepo };
}

async function startServer() {
  const repos = makeSecurityMockRepos();
  const app = createApp({
    userRepo: {},
    examRepo: repos.examRepo,
    questionRepo: repos.questionRepo,
    jwtSecret: SECRET,
  });

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const request = async (path, { method = "GET", body, token } = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, body: json };
  };

  const close = () => new Promise((resolve) => server.close(resolve));
  return { request, close };
}

// -------------------------------------------------------------
// B-15 Security Test Suite
// -------------------------------------------------------------
test("B-15: Authentication required on all protected exam & question endpoints", async () => {
  const { request, close } = await startServer();
  try {
    const endpoints = [
      ["/api/exams", "GET"],
      ["/api/exams", "POST"],
      ["/api/exams/exam-sec-1/questions", "GET"],
      ["/api/exams/exam-sec-1/report", "GET"],
      ["/api/exams/exam-sec-1/results", "GET"],
      ["/api/questions/q1", "PUT"],
      ["/api/questions/q1", "DELETE"],
    ];

    for (const [path, method] of endpoints) {
      const res = await request(path, { method });
      assert.equal(res.status, 401, `Expected 401 for unauthenticated ${method} ${path}`);
      assert.equal(res.body.error, "Authentication required");
    }
  } finally {
    await close();
  }
});

test("B-15: Role-based authorization blocks privilege escalation (Students cannot perform Teacher actions)", async () => {
  const { request, close } = await startServer();
  try {
    const studentToken = tokenFor("STUDENT", 201);

    // 1. Student attempts to create exam
    const createRes = await request("/api/exams", {
      method: "POST",
      token: studentToken,
      body: { title: "Hack", questionCount: 1, questionPoolId: "pool-sec" },
    });
    assert.equal(createRes.status, 403);

    // 2. Student attempts to publish exam
    const pubRes = await request("/api/exams/exam-sec-1/publish", {
      method: "POST",
      token: studentToken,
    });
    assert.equal(pubRes.status, 403);

    // 3. Student attempts to edit question
    const editRes = await request("/api/questions/q1", {
      method: "PUT",
      token: studentToken,
      body: { text: "Hacked" },
    });
    assert.equal(editRes.status, 403);

    // 4. Student attempts to delete question
    const delRes = await request("/api/questions/q1", {
      method: "DELETE",
      token: studentToken,
    });
    assert.equal(delRes.status, 403);

    // 5. Student attempts to view examination report (VAL-F14)
    const reportRes = await request("/api/exams/exam-sec-1/report", {
      token: studentToken,
    });
    assert.equal(reportRes.status, 403);
  } finally {
    await close();
  }
});

test("B-15: Input validation prevents malformed payloads and boundary attacks", async () => {
  const { request, close } = await startServer();
  try {
    const teacherToken = tokenFor("TEACHER");

    // Negative questionCount and negative duration
    const res = await request("/api/exams", {
      method: "POST",
      token: teacherToken,
      body: {
        title: "   ",
        questionCount: -5,
        questionPoolId: "   ",
        durationMinutes: -100,
        startTime: "not-a-date",
        endTime: "2026-01-01",
      },
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.details.title);
    assert.ok(res.body.details.questionCount);
    assert.ok(res.body.details.questionPoolId);
    assert.ok(res.body.details.durationMinutes);
    assert.ok(res.body.details.startTime);
  } finally {
    await close();
  }
});

test("B-15: Information leakage prevention (SEC-06)", async () => {
  const { request, close } = await startServer();
  try {
    const studentToken = tokenFor("STUDENT", 101);

    // 1. Result requested before release time: score is not returned
    const resResult = await request("/api/exams/exam-sec-1/results", { token: studentToken });
    assert.equal(resResult.status, 200);
    assert.equal(resResult.body.isReleased, false);
    assert.equal(resResult.body.score, undefined);

    // 2. Questions fetched by student do NOT leak correctOption
    const resQ = await request("/api/exams/exam-sec-1/questions", { token: studentToken });
    assert.equal(resQ.status, 200);
    for (const q of resQ.body.questions) {
      assert.equal(q.correctOption, undefined, "Security violation: correctOption leaked to student!");
    }
  } finally {
    await close();
  }
});
