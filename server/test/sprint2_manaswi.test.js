import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

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
        { id: "q5", poolId: "pool-math", text: "What is 2^3?", options: ["6", "8", "9", "12"], correctOption: 1, difficulty: "HARD" },
      ],
    },
  ];

  const exams = [];
  const attempts = [];

  const examRepo = {
    async findQuestionPoolById(id) {
      const pool = pools.find((p) => p.id === id);
      return pool ? { ...pool, questions: [...pool.questions] } : null;
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
        isPublished: true,
        publishedAt: new Date(),
        questions: pools[0].questions.slice(0, data.questionCount).map((q, idx) => ({
          id: `eq-${idx + 1}`,
          examId: `exam-${exams.length + 1}`,
          questionId: q.id,
          orderIndex: idx,
          question: q,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      exams.push(exam);
      return exam;
    },

    async findExamById(id) {
      const exam = exams.find((e) => e.id === id);
      return exam ? { ...exam } : null;
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

    async publishExam(id) {
      const exam = exams.find((e) => e.id === id);
      if (!exam) return null;
      exam.isPublished = true;
      return { ...exam };
    },

    async getExamQuestions(examId) {
      const exam = exams.find((e) => e.id === examId);
      return exam ? exam.questions.map((eq) => eq.question) : [];
    },

    async isQuestionInPublishedExam(questionId) {
      return exams.some((e) => e.isPublished && e.questions.some((eq) => eq.questionId === questionId));
    },

    async isPoolInPublishedExam(poolId) {
      return exams.some((e) => e.isPublished && e.questionPoolId === poolId);
    },

    async listAttemptsByExam(examId) {
      return attempts
        .filter((a) => a.examId === examId)
        .map((a) => ({
          ...a,
          student: { id: a.studentId, name: `Student ${a.studentId}`, email: `student${a.studentId}@example.com` },
        }));
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

// --------------------------------------------------------------------------
// Tests for FR-19: Automatic result release at configured time
// --------------------------------------------------------------------------
test("FR-19: Student results are HIDDEN before scheduled release time (VAL-F09, VAL-F10; SEC-06)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT", 501);

    // Exam with release time 1 hour in the future
    const exam = await repos.examRepo.createExam({
      title: "Midterm Biology",
      questionCount: 3,
      questionPoolId: "pool-math",
      resultReleaseTime: new Date(Date.now() + 3600000).toISOString(),
    });

    // Student completes attempt
    await repos.examRepo.recordAttempt({
      examId: exam.id,
      studentId: 501,
      score: 3,
      totalMarks: 3,
    });

    // Student requests result before release time
    const res = await request(`/api/exams/${exam.id}/results`, { token: studentToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.isReleased, false);
    assert.equal(res.body.score, undefined); // Does NOT leak score!
    assert.ok(res.body.message.includes("Results are not yet released"));
    assert.equal(new Date(res.body.releaseTime).toISOString(), exam.resultReleaseTime.toISOString());
  } finally {
    await close();
  }
});

test("FR-19: Student results are VISIBLE once scheduled release time arrives (VAL-F09, VAL-F10; SEC-06)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT", 502);

    // Exam with release time 10 minutes in the past
    const exam = await repos.examRepo.createExam({
      title: "Past Biology Test",
      questionCount: 3,
      questionPoolId: "pool-math",
      resultReleaseTime: new Date(Date.now() - 600000).toISOString(),
    });

    // Student completed attempt
    await repos.examRepo.recordAttempt({
      examId: exam.id,
      studentId: 502,
      score: 2,
      totalMarks: 3,
    });

    // Student requests result
    const res = await request(`/api/exams/${exam.id}/results`, { token: studentToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.isReleased, true);
    assert.equal(res.body.score, 2);
    assert.equal(res.body.totalMarks, 3);
    assert.equal(res.body.percentage, 67);
  } finally {
    await close();
  }
});

// --------------------------------------------------------------------------
// Tests for FR-20: View examination reports
// --------------------------------------------------------------------------
test("FR-20: Students are FORBIDDEN from viewing examination reports (VAL-F14)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT", 503);
    const exam = await repos.examRepo.createExam({
      title: "History Quiz",
      questionCount: 2,
      questionPoolId: "pool-math",
    });

    const res = await request(`/api/exams/${exam.id}/report`, { token: studentToken });
    assert.equal(res.status, 403);
    assert.ok(res.body.error.includes("Forbidden: only teachers and administrators may view examination reports"));
  } finally {
    await close();
  }
});

test("FR-20: Teachers and Administrators can view examination reports with statistics (VAL-F14)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER");
    const adminToken = tokenFor("ADMIN");

    const exam = await repos.examRepo.createExam({
      title: "Mathematics Exam",
      questionCount: 3,
      questionPoolId: "pool-math",
    });

    // Record sample student attempts
    await repos.examRepo.recordAttempt({ examId: exam.id, studentId: 101, score: 3, totalMarks: 3 });
    await repos.examRepo.recordAttempt({ examId: exam.id, studentId: 102, score: 2, totalMarks: 3 });
    await repos.examRepo.recordAttempt({ examId: exam.id, studentId: 103, score: 1, totalMarks: 3 });

    // Teacher opens report
    const teacherRes = await request(`/api/exams/${exam.id}/report`, { token: teacherToken });
    assert.equal(teacherRes.status, 200);
    const report = teacherRes.body.report;
    assert.equal(report.examId, exam.id);
    assert.equal(report.title, "Mathematics Exam");
    assert.equal(report.statistics.totalAttempts, 3);
    assert.equal(report.statistics.averageScore, 2);
    assert.equal(report.statistics.highestScore, 3);
    assert.equal(report.statistics.lowestScore, 1);
    assert.equal(report.statistics.passCount, 2); // score >= 1.5
    assert.equal(report.statistics.passRate, 66.7);
    assert.equal(report.attempts.length, 3);

    // Admin opens report
    const adminRes = await request(`/api/exams/${exam.id}/report`, { token: adminToken });
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.body.report.statistics.totalAttempts, 3);
  } finally {
    await close();
  }
});
