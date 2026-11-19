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
        { id: "q1", poolId: "pool-math", text: "What is 2+2?", options: ["2", "3", "4", "5"], correctAnswer: "4", correctOption: 2, difficulty: "EASY" },
        { id: "q2", poolId: "pool-math", text: "What is 5*5?", options: ["10", "20", "25", "30"], correctAnswer: "25", correctOption: 2, difficulty: "EASY" },
        { id: "q3", poolId: "pool-math", text: "What is sqrt(16)?", options: ["2", "4", "8", "16"], correctAnswer: "4", correctOption: 1, difficulty: "MEDIUM" },
        { id: "q4", poolId: "pool-math", text: "What is 12/4?", options: ["2", "3", "4", "6"], correctAnswer: "3", correctOption: 1, difficulty: "EASY" },
        { id: "q5", poolId: "pool-math", text: "What is 2^3?", options: ["6", "8", "9", "12"], correctAnswer: "8", correctOption: 1, difficulty: "HARD" },
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

    async startAttempt({ examId, studentId, startedAt = new Date() }) {
      const existing = attempts.find((a) => a.examId === examId && a.studentId === studentId);
      if (existing) return existing;
      const attempt = {
        id: `att-${attempts.length + 1}`,
        examId,
        studentId,
        status: "IN_PROGRESS",
        startedAt,
      };
      attempts.push(attempt);
      return attempt;
    },

    async recordAttempt(data) {
      const existingIndex = attempts.findIndex(
        (a) => a.examId === data.examId && a.studentId === data.studentId && a.status === "IN_PROGRESS"
      );
      if (existingIndex !== -1) {
        attempts[existingIndex] = {
          ...attempts[existingIndex],
          ...data,
          status: "SUBMITTED",
          submittedAt: new Date(),
        };
        return attempts[existingIndex];
      }
      const attempt = {
        id: `att-${attempts.length + 1}`,
        status: "SUBMITTED",
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

// --------------------------------------------------------------------------
// Tests for Attempt Submission Security & Server-Side Scoring
// --------------------------------------------------------------------------

test("Attempt submission: only students can submit (teachers, admins, and unauthenticated rejected)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const exam = await repos.examRepo.createExam({
      title: "Physics Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
    });

    const teacherToken = tokenFor("TEACHER", 1);
    const adminToken = tokenFor("ADMIN", 2);

    // 1. Teacher cannot submit
    const teacherRes = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: teacherToken,
      body: { answers: { q1: "4" } },
    });
    assert.equal(teacherRes.status, 403);
    assert.equal(teacherRes.body.error, "Only students can submit examination attempts.");

    // 2. Admin cannot submit
    const adminRes = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: adminToken,
      body: { answers: { q1: "4" } },
    });
    assert.equal(adminRes.status, 403);
    assert.equal(adminRes.body.error, "Only students can submit examination attempts.");

    // 3. Unauthenticated cannot submit
    const unauthRes = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      body: { answers: { q1: "4" } },
    });
    assert.equal(unauthRes.status, 401);
  } finally {
    await close();
  }
});

test("Attempt submission: server compares submitted answers with correct answers and computes score itself", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT", 601);
    const exam = await repos.examRepo.createExam({
      title: "Arithmetic Exam",
      questionCount: 3,
      questionPoolId: "pool-math",
    });

    // Student starts attempt
    const startRes = await request(`/api/exams/${exam.id}/start`, {
      method: "POST",
      token: studentToken,
    });
    assert.equal(startRes.status, 201);

    // Student attempts to submit with a forged score: 100
    // Correct answers in pool-math: q1: "4", q2: "25", q3: "4"
    // Student provides: q1: "4" (correct), q2: "25" (correct), q3: "999" (wrong)
    const res = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: studentToken,
      body: {
        answers: { q1: "4", q2: "25", q3: "999" },
        score: 100,      // Forged score
        totalMarks: 500, // Forged totalMarks
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.message, "Attempt recorded successfully.");
    // Server must compute score itself: 2 correct out of 3 questions
    assert.equal(res.body.attempt.score, 2);
    assert.equal(res.body.attempt.totalMarks, 3);

    // Verify stored attempt in repository has calculated score
    const stored = await repos.examRepo.findAttempt(exam.id, 601);
    assert.equal(stored.score, 2);
    assert.equal(stored.totalMarks, 3);
  } finally {
    await close();
  }
});

test("Attempt submission: exam must be published and within availability window", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT", 602);

    // 1. Unpublished exam
    const unpublishedExam = await repos.examRepo.createExam({
      title: "Draft Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
    });
    // Set isPublished to false
    unpublishedExam.isPublished = false;

    const unpubRes = await request(`/api/exams/${unpublishedExam.id}/attempts`, {
      method: "POST",
      token: studentToken,
      body: { answers: { q1: "4" } },
    });
    assert.equal(unpubRes.status, 403);
    assert.equal(unpubRes.body.error, "Examination is not published.");

    // 2. Exam before availability start time
    const futureExam = await repos.examRepo.createExam({
      title: "Future Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
    });

    const futureRes = await request(`/api/exams/${futureExam.id}/attempts`, {
      method: "POST",
      token: studentToken,
      body: { answers: { q1: "4" } },
    });
    assert.equal(futureRes.status, 403);
    assert.equal(futureRes.body.error, "Examination is not yet available.");

    // 3. Exam after availability end time
    const pastExam = await repos.examRepo.createExam({
      title: "Expired Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      startTime: new Date(Date.now() - 7200000).toISOString(),
      endTime: new Date(Date.now() - 3600000).toISOString(),
    });

    const pastRes = await request(`/api/exams/${pastExam.id}/attempts`, {
      method: "POST",
      token: studentToken,
      body: { answers: { q1: "4" } },
    });
    assert.equal(pastRes.status, 403);
    assert.equal(pastRes.body.error, "Examination availability period has ended.");
  } finally {
    await close();
  }
});

test("Attempt submission: a student can only submit once per exam", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT", 603);
    const exam = await repos.examRepo.createExam({
      title: "One-Time Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
    });

    // Student starts attempt
    const startRes = await request(`/api/exams/${exam.id}/start`, {
      method: "POST",
      token: studentToken,
    });
    assert.equal(startRes.status, 201);

    // First attempt succeeds
    const firstRes = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: studentToken,
      body: { answers: { q1: "4" } },
    });
    assert.equal(firstRes.status, 201);

    // Second attempt by same student rejected with 409 Conflict
    const secondRes = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: studentToken,
      body: { answers: { q1: "4" } },
    });
    assert.equal(secondRes.status, 409);
    assert.equal(secondRes.body.error, "You have already submitted an attempt for this examination.");
  } finally {
    await close();
  }
});

test("Attempt submission: student id comes only from login token (ignoring body spoofing)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const realStudentId = 777;
    const studentToken = tokenFor("STUDENT", realStudentId);

    const exam = await repos.examRepo.createExam({
      title: "Integrity Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
    });

    // Student starts attempt
    const startRes = await request(`/api/exams/${exam.id}/start`, {
      method: "POST",
      token: studentToken,
    });
    assert.equal(startRes.status, 201);

    // Student tries to spoof studentId: 999 in body
    const res = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: studentToken,
      body: {
        answers: { q1: "4" },
        studentId: 999, // Attempted spoof
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.attempt.studentId, realStudentId);

    // Stored attempt must belong to realStudentId, not 999
    const spoofedLookup = await repos.examRepo.findAttempt(exam.id, 999);
    assert.equal(spoofedLookup, null);

    const realLookup = await repos.examRepo.findAttempt(exam.id, realStudentId);
    assert.ok(realLookup);
    assert.equal(realLookup.studentId, realStudentId);
  } finally {
    await close();
  }
});

test("Attempt start: only students can start examinations (FR-08 duration enforcement)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const exam = await repos.examRepo.createExam({
      title: "Duration Gated Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      durationMinutes: 30,
    });

    // Unauthenticated
    const unauthRes = await request(`/api/exams/${exam.id}/start`, { method: "POST" });
    assert.equal(unauthRes.status, 401);

    // Teacher
    const teacherRes = await request(`/api/exams/${exam.id}/start`, {
      method: "POST",
      token: tokenFor("TEACHER", 10),
    });
    assert.equal(teacherRes.status, 403);

    // Student starts successfully
    const studentRes = await request(`/api/exams/${exam.id}/start`, {
      method: "POST",
      token: tokenFor("STUDENT", 501),
    });
    assert.equal(studentRes.status, 201);
    assert.equal(studentRes.body.message, "Examination started.");
    assert.ok(studentRes.body.attempt.startedAt);
  } finally {
    await close();
  }
});

test("Attempt duration enforcement: submissions within duration succeed, late submissions are rejected", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const onTimeStudent = 801;
    const lateStudent = 802;
    const durationMins = 30;

    const exam = await repos.examRepo.createExam({
      title: "Strict Timed Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      durationMinutes: durationMins,
    });

    // 1. On-time student starts exam now
    const startOnTime = await request(`/api/exams/${exam.id}/start`, {
      method: "POST",
      token: tokenFor("STUDENT", onTimeStudent),
    });
    assert.equal(startOnTime.status, 201);

    // Submits on time
    const submitOnTime = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: tokenFor("STUDENT", onTimeStudent),
      body: { answers: { q1: "4", q2: "6" } },
    });
    assert.equal(submitOnTime.status, 201);
    assert.equal(submitOnTime.body.attempt.status, "SUBMITTED");

    // 2. Late student started 35 minutes ago (duration is 30 mins, exceeded past grace period)
    const thirtyFiveMinsAgo = new Date(Date.now() - 35 * 60 * 1000);
    await repos.examRepo.startAttempt({
      examId: exam.id,
      studentId: lateStudent,
      startedAt: thirtyFiveMinsAgo,
    });

    // Attempting late submission
    const submitLate = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: tokenFor("STUDENT", lateStudent),
      body: { answers: { q1: "4", q2: "6" } },
    });
    assert.equal(submitLate.status, 403);
    assert.ok(submitLate.body.error.includes("Examination duration has expired"));
  } finally {
    await close();
  }
});

test("Fix 1: /start uses server clock only and ignores client-supplied startedAt", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT", 810);
    const exam = await repos.examRepo.createExam({
      title: "Clock Security Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      durationMinutes: 30,
    });

    const beforeCall = Date.now();
    // Student passes a backdated startedAt in the request body
    const res = await request(`/api/exams/${exam.id}/start`, {
      method: "POST",
      token: studentToken,
      body: { startedAt: "2020-01-01T00:00:00.000Z" },
    });
    const afterCall = Date.now();

    assert.equal(res.status, 201);
    const recordedStart = new Date(res.body.attempt.startedAt).getTime();
    // Server must use its own clock (between beforeCall and afterCall), not 2020
    assert.ok(recordedStart >= beforeCall - 1000 && recordedStart <= afterCall + 1000);
    assert.notEqual(res.body.attempt.startedAt, "2020-01-01T00:00:00.000Z");

    const stored = await repos.examRepo.findAttempt(exam.id, 810);
    const storedStart = new Date(stored.startedAt).getTime();
    assert.ok(storedStart >= beforeCall - 1000 && storedStart <= afterCall + 1000);
  } finally {
    await close();
  }
});

test("Fix 2: Submit requires an existing IN_PROGRESS attempt (skipping /start is rejected)", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const studentToken = tokenFor("STUDENT", 820);
    const exam = await repos.examRepo.createExam({
      title: "Start Enforcement Exam",
      questionCount: 2,
      questionPoolId: "pool-math",
      durationMinutes: 30,
    });

    // Student skips /start and directly calls /attempts
    const res = await request(`/api/exams/${exam.id}/attempts`, {
      method: "POST",
      token: studentToken,
      body: { answers: { q1: "4" } },
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.error.includes("No active examination attempt found"));

    // No attempt should have been created
    const attempt = await repos.examRepo.findAttempt(exam.id, 820);
    assert.equal(attempt, null);
  } finally {
    await close();
  }
});

test("Fix 3: GET /:id/report counts only SUBMITTED attempts and ignores IN_PROGRESS attempts", async () => {
  const { request, close, repos } = await createTestServer();
  try {
    const teacherToken = tokenFor("TEACHER", 1);
    const exam = await repos.examRepo.createExam({
      title: "Reports Filter Exam",
      questionCount: 3,
      questionPoolId: "pool-math",
      durationMinutes: 60,
    });

    // 1. Student 901 completes and submits attempt with score 3
    await repos.examRepo.recordAttempt({
      examId: exam.id,
      studentId: 901,
      score: 3,
      totalMarks: 3,
      status: "SUBMITTED",
      submittedAt: new Date(),
    });

    // 2. Student 902 completes and submits attempt with score 1
    await repos.examRepo.recordAttempt({
      examId: exam.id,
      studentId: 902,
      score: 1,
      totalMarks: 3,
      status: "SUBMITTED",
      submittedAt: new Date(),
    });

    // 3. Student 903 is IN_PROGRESS (score 0, not submitted yet)
    await repos.examRepo.startAttempt({
      examId: exam.id,
      studentId: 903,
      startedAt: new Date(),
    });

    const res = await request(`/api/exams/${exam.id}/report`, {
      token: teacherToken,
    });

    assert.equal(res.status, 200);
    const report = res.body.report;

    // Report must ONLY count the 2 submitted attempts, ignoring student 903's in-progress attempt
    assert.equal(report.statistics.totalAttempts, 2);
    // Average of 3 and 1 is 2.0 (if in-progress score 0 were counted, it would be 4/3 = 1.33)
    assert.equal(report.statistics.averageScore, 2);
    assert.equal(report.statistics.highestScore, 3);
    assert.equal(report.statistics.lowestScore, 1);
    assert.equal(report.statistics.passCount, 1); // >= 1.5
    assert.equal(report.statistics.failCount, 1);
    assert.equal(report.statistics.passRate, 50);
    assert.equal(report.attempts.length, 2);
    assert.ok(report.attempts.every((a) => a.studentId !== 903));
  } finally {
    await close();
  }
});
