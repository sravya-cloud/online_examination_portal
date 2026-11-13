import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";
import { selectRandomQuestions } from "../src/services/questionSelection.js";

const SECRET = "test-secret-at-least-thirty-two-chars-long";

function tokenFor(role, id = 1) {
  return signToken({ id, role, email: `${role.toLowerCase()}@example.com` }, { secret: SECRET });
}

function makeFakeRepositories() {
  const pools = [
    {
      id: "pool-math",
      name: "Mathematics Pool",
      questions: [
        { id: "q1", poolId: "pool-math", text: "What is 2+2?", options: ["2", "3", "4", "5"], correctOption: 2, difficulty: "EASY" },
        { id: "q2", poolId: "pool-math", text: "What is 5*5?", options: ["10", "20", "25", "30"], correctOption: 2, difficulty: "EASY" },
        { id: "q3", poolId: "pool-math", text: "What is sqrt(16)?", options: ["2", "4", "8", "16"], correctOption: 1, difficulty: "MEDIUM" },
        { id: "q4", poolId: "pool-math", text: "What is 12/4?", options: ["2", "3", "4", "6"], correctOption: 1, difficulty: "EASY" },
        { id: "q5", poolId: "pool-math", text: "What is 2^3?", options: ["6", "8", "9", "12"], correctOption: 1, difficulty: "MEDIUM" },
      ],
    },
  ];

  const exams = [];
  const attempts = [];

  const examRepo = {
    async findQuestionPoolById(id) {
      const pool = pools.find((p) => p.id === id);
      if (!pool) return null;
      return {
        ...pool,
        questions: [...pool.questions],
      };
    },

    async createExam(data) {
      const exam = {
        id: `exam-${exams.length + 1}`,
        title: data.title,
        questionCount: data.questionCount,
        questionPoolId: data.questionPoolId,
        durationMinutes: data.durationMinutes ?? 60,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        resultReleaseTime: data.resultReleaseTime ? new Date(data.resultReleaseTime) : null,
        isPublished: false,
        publishedAt: null,
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      exams.push(exam);
      return exam;
    },

    async findExamById(id) {
      const exam = exams.find((e) => e.id === id);
      if (!exam) return null;
      return {
        ...exam,
        questionPool: pools.find((p) => p.id === exam.questionPoolId),
      };
    },

    async listExams() {
      return [...exams];
    },

    async updateExam(id, updateData) {
      const exam = exams.find((e) => e.id === id);
      if (!exam) return null;
      Object.assign(exam, updateData);
      return { ...exam };
    },

    async publishExam(id, selectedQuestionIds = []) {
      const exam = exams.find((e) => e.id === id);
      if (!exam) return null;
      exam.isPublished = true;
      exam.publishedAt = new Date();
      exam.questions = selectedQuestionIds.map((qId, idx) => {
        const q = pools.flatMap((p) => p.questions).find((item) => item.id === qId);
        return {
          id: `eq-${idx + 1}`,
          examId: id,
          questionId: qId,
          orderIndex: idx,
          question: q,
        };
      });
      return { ...exam };
    },

    async getExamQuestions(examId) {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) return [];
      return exam.questions.map((eq) => eq.question);
    },

    async isQuestionInPublishedExam(questionId) {
      return exams.some((e) => e.isPublished && e.questions.some((eq) => eq.questionId === questionId));
    },

    async isPoolInPublishedExam(poolId) {
      return exams.some((e) => e.isPublished && e.questionPoolId === poolId);
    },

    async listAttemptsByExam(examId) {
      return attempts.filter((a) => a.examId === examId);
    },

    async findAttempt(examId, studentId) {
      return attempts.find((a) => a.examId === examId && a.studentId === studentId) || null;
    },

    async recordAttempt(data) {
      const attempt = {
        id: `att-${attempts.length + 1}`,
        ...data,
        submittedAt: new Date(),
      };
      attempts.push(attempt);
      return attempt;
    },
  };

  const questionRepo = {
    async findQuestionById(id) {
      for (const pool of pools) {
        const found = pool.questions.find((q) => q.id === id);
        if (found) return { ...found, poolId: pool.id };
      }
      return null;
    },

    async createQuestion(data) {
      const pool = pools.find((p) => p.id === data.poolId);
      if (!pool) throw new Error("Pool not found");
      const question = {
        id: `q-${Date.now()}-${Math.random()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      pool.questions.push(question);
      return question;
    },

    async updateQuestion(id, data) {
      for (const pool of pools) {
        const idx = pool.questions.findIndex((q) => q.id === id);
        if (idx !== -1) {
          Object.assign(pool.questions[idx], data, { updatedAt: new Date() });
          return { ...pool.questions[idx] };
        }
      }
      return null;
    },

    async deleteQuestion(id) {
      for (const pool of pools) {
        const idx = pool.questions.findIndex((q) => q.id === id);
        if (idx !== -1) {
          const removed = pool.questions.splice(idx, 1)[0];
          return removed;
        }
      }
      return null;
    },

    async listQuestionsByPool(poolId) {
      const pool = pools.find((p) => p.id === poolId);
      return pool ? [...pool.questions] : [];
    },

    async countQuestionsByPool(poolId) {
      const pool = pools.find((p) => p.id === poolId);
      return pool ? pool.questions.length : 0;
    },
  };

  return { pools, exams, attempts, examRepo, questionRepo };
}

async function createTestServer(repos = makeFakeRepositories()) {
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

  return { request, close, repos };
}

// -------------------------------------------------------------
// Tests for FR-08: Configure exam duration and availability period
// -------------------------------------------------------------
test("FR-08: Teacher creates exam configuring duration, start time, and end time (VAL-F04)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");
    const startTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour in future
    const endTime = new Date(Date.now() + 7200000).toISOString();   // 2 hours in future

    const res = await request("/api/exams", {
      method: "POST",
      token: teacherToken,
      body: {
        title: "Calculus Final Exam",
        questionCount: 3,
        questionPoolId: "pool-math",
        durationMinutes: 45,
        startTime,
        endTime,
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.message, "Examination created successfully.");
    assert.equal(res.body.exam.title, "Calculus Final Exam");
    assert.equal(res.body.exam.durationMinutes, 45);
    assert.equal(new Date(res.body.exam.startTime).toISOString(), startTime);
    assert.equal(new Date(res.body.exam.endTime).toISOString(), endTime);
    assert.equal(repos.exams.length, 1);
  } finally {
    await close();
  }
});

test("FR-08: Validation rejects invalid timing, negative duration, or inverted windows", async () => {
  const { request, close } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");

    // Negative duration & inverted dates
    const res = await request("/api/exams", {
      method: "POST",
      token: teacherToken,
      body: {
        title: "Invalid Timing Exam",
        questionCount: 2,
        questionPoolId: "pool-math",
        durationMinutes: -15,
        startTime: "2026-11-20T12:00:00Z",
        endTime: "2026-11-20T10:00:00Z", // end before start!
      },
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.details.durationMinutes);
    assert.ok(res.body.details.endTime);
  } finally {
    await close();
  }
});

test("FR-08: Teacher can update exam duration and availability period via PUT (VAL-F04)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");
    const exam = await repos.examRepo.createExam({
      title: "Algebra Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      durationMinutes: 30,
    });

    const newStart = "2026-11-25T09:00:00.000Z";
    const newEnd = "2026-11-25T12:00:00.000Z";

    const res = await request(`/api/exams/${exam.id}`, {
      method: "PUT",
      token: teacherToken,
      body: {
        durationMinutes: 90,
        startTime: newStart,
        endTime: newEnd,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.exam.durationMinutes, 90);
    assert.equal(new Date(res.body.exam.startTime).toISOString(), newStart);
    assert.equal(new Date(res.body.exam.endTime).toISOString(), newEnd);
  } finally {
    await close();
  }
});

// -------------------------------------------------------------
// Tests for FR-07: Edit or remove questions before publishing
// -------------------------------------------------------------
test("FR-07: Teacher can edit question before exam is published (VAL-F13)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");

    const res = await request("/api/questions/q1", {
      method: "PUT",
      token: teacherToken,
      body: {
        text: "What is 2 + 2 equal to?",
        difficulty: "MEDIUM",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Question updated successfully.");
    assert.equal(res.body.question.text, "What is 2 + 2 equal to?");
    assert.equal(res.body.question.difficulty, "MEDIUM");

    // Verify in repository
    const q = await repos.questionRepo.findQuestionById("q1");
    assert.equal(q.text, "What is 2 + 2 equal to?");
  } finally {
    await close();
  }
});

test("FR-07: Teacher can remove question before exam is published (VAL-F13)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");

    const res = await request("/api/questions/q5", {
      method: "DELETE",
      token: teacherToken,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Question deleted successfully.");

    const q = await repos.questionRepo.findQuestionById("q5");
    assert.equal(q, null);
  } finally {
    await close();
  }
});

test("FR-07: Editing or deleting question is BLOCKED after exam is published (VAL-F13)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");

    // Create and publish an exam locking questions
    const exam = await repos.examRepo.createExam({
      title: "Published Exam",
      questionCount: 3,
      questionPoolId: "pool-math",
    });

    const publishRes = await request(`/api/exams/${exam.id}/publish`, {
      method: "POST",
      token: teacherToken,
    });
    assert.equal(publishRes.status, 200);
    assert.equal(publishRes.body.exam.isPublished, true);

    // Attempt to edit a question now that exam is published
    const editRes = await request("/api/questions/q1", {
      method: "PUT",
      token: teacherToken,
      body: { text: "Modified Question Text" },
    });

    assert.equal(editRes.status, 409);
    assert.equal(editRes.body.code, "EXAM_ALREADY_PUBLISHED");
    assert.ok(editRes.body.error.includes("cannot be edited after the examination is published"));

    // Attempt to delete a question now that exam is published
    const deleteRes = await request("/api/questions/q2", {
      method: "DELETE",
      token: teacherToken,
    });

    assert.equal(deleteRes.status, 409);
    assert.equal(deleteRes.body.code, "EXAM_ALREADY_PUBLISHED");
    assert.ok(deleteRes.body.error.includes("cannot be deleted after the examination is published"));
  } finally {
    await close();
  }
});

test("FR-07: Students cannot edit or delete questions (403 Forbidden)", async () => {
  const { request, close } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT");

    const editRes = await request("/api/questions/q1", {
      method: "PUT",
      token: studentToken,
      body: { text: "Student trying to edit" },
    });
    assert.equal(editRes.status, 403);

    const deleteRes = await request("/api/questions/q1", {
      method: "DELETE",
      token: studentToken,
    });
    assert.equal(deleteRes.status, 403);
  } finally {
    await close();
  }
});

// -------------------------------------------------------------
// Tests for FR-09: Random selection of questions from pool
// -------------------------------------------------------------
test("FR-09: selectRandomQuestions chooses exactly N items uniformly without replacement (VAL-F05)", () => {
  const pool = [
    { id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }
  ];

  const selected = selectRandomQuestions(pool, 3);
  assert.equal(selected.length, 3);

  // Assert distinct items (no duplicates)
  const ids = new Set(selected.map((item) => item.id));
  assert.equal(ids.size, 3);

  // Assert all chosen belong to pool
  for (const item of selected) {
    assert.ok(pool.some((p) => p.id === item.id));
  }
});

test("FR-09: Insufficient pool questions returns validation error", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");

    // Request 10 questions when pool only has 5
    const exam = await repos.examRepo.createExam({
      title: "Too Many Questions Exam",
      questionCount: 10,
      questionPoolId: "pool-math",
    });

    const res = await request(`/api/exams/${exam.id}/publish`, {
      method: "POST",
      token: teacherToken,
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes("Question pool only contains 5 questions, but 10 are required"));
  } finally {
    await close();
  }
});

// -------------------------------------------------------------
// Tests for FR-10: Same question set for all students
// -------------------------------------------------------------
test("FR-10: Question set is fixed upon publishing and identical for all student attempts (VAL-F05)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");
    const student1Token = tokenFor("STUDENT", 101);
    const student2Token = tokenFor("STUDENT", 102);

    const exam = await repos.examRepo.createExam({
      title: "Shared Chemistry Test",
      questionCount: 3,
      questionPoolId: "pool-math",
    });

    // Publish exam -> locks random selection of questions
    const pubRes = await request(`/api/exams/${exam.id}/publish`, {
      method: "POST",
      token: teacherToken,
    });
    assert.equal(pubRes.status, 200);

    // Student 1 fetches questions
    const res1 = await request(`/api/exams/${exam.id}/questions`, {
      token: student1Token,
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.body.questions.length, 3);

    // Student 2 fetches questions
    const res2 = await request(`/api/exams/${exam.id}/questions`, {
      token: student2Token,
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.body.questions.length, 3);

    // Assert that the questions received are IDENTICAL
    const student1Ids = res1.body.questions.map((q) => q.id);
    const student2Ids = res2.body.questions.map((q) => q.id);
    assert.deepEqual(student1Ids, student2Ids);

    // Assert security: correctOption is NOT leaked to students
    for (const q of res1.body.questions) {
      assert.equal(q.correctOption, undefined);
    }
  } finally {
    await close();
  }
});

test("FR-10: Student access denied outside availability period", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");
    const studentToken = tokenFor("STUDENT");

    // Exam starting in the future
    const futureExam = await repos.examRepo.createExam({
      title: "Future Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      startTime: new Date(Date.now() + 10000000).toISOString(),
      endTime: new Date(Date.now() + 20000000).toISOString(),
    });
    await request(`/api/exams/${futureExam.id}/publish`, { method: "POST", token: teacherToken });

    const futureRes = await request(`/api/exams/${futureExam.id}/questions`, { token: studentToken });
    assert.equal(futureRes.status, 403);
    assert.equal(futureRes.body.error, "Examination is not yet available.");

    // Exam ended in past
    const pastExam = await repos.examRepo.createExam({
      title: "Past Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      startTime: new Date(Date.now() - 20000000).toISOString(),
      endTime: new Date(Date.now() - 10000000).toISOString(),
    });
    await request(`/api/exams/${pastExam.id}/publish`, { method: "POST", token: teacherToken });

    const pastRes = await request(`/api/exams/${pastExam.id}/questions`, { token: studentToken });
    assert.equal(pastRes.status, 403);
    assert.equal(pastRes.body.error, "Examination availability window has ended.");
  } finally {
    await close();
  }
});
