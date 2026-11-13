import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "test-secret-at-least-thirty-two-chars-long";
const SLA_LIMIT_MS = 3000; // NFR-03 requirement: 3 seconds or less (VAL-N03)

function tokenFor(role, id = 1) {
  return signToken({ id, role, email: `${role.toLowerCase()}@example.com` }, { secret: SECRET });
}

function makePerformanceMockRepos() {
  const pools = [
    {
      id: "pool-perf",
      name: "Perf Question Pool",
      questions: Array.from({ length: 50 }, (_, i) => ({
        id: `q-${i + 1}`,
        poolId: "pool-perf",
        text: `Question ${i + 1}?`,
        options: ["A", "B", "C", "D"],
        correctOption: 0,
        difficulty: i % 3 === 0 ? "EASY" : i % 3 === 1 ? "MEDIUM" : "HARD",
      })),
    },
  ];

  const exams = Array.from({ length: 10 }, (_, i) => ({
    id: `exam-perf-${i + 1}`,
    title: `Exam Title ${i + 1}`,
    questionCount: 10,
    durationMinutes: 60,
    isPublished: true,
    resultReleaseTime: new Date(Date.now() - 10000),
    questions: pools[0].questions.slice(0, 10).map((q, idx) => ({
      id: `eq-${i}-${idx}`,
      examId: `exam-perf-${i + 1}`,
      questionId: q.id,
      orderIndex: idx,
      question: q,
    })),
  }));

  const attempts = Array.from({ length: 50 }, (_, i) => ({
    id: `att-${i + 1}`,
    examId: "exam-perf-1",
    studentId: 100 + i,
    score: (i % 10) + 1,
    totalMarks: 10,
    student: { id: 100 + i, name: `Student ${i}`, email: `student${i}@test.com` },
    submittedAt: new Date(),
  }));

  const examRepo = {
    async findQuestionPoolById(id) {
      return pools.find((p) => p.id === id) || null;
    },
    async listExams() {
      return exams;
    },
    async findExamById(id) {
      return exams.find((e) => e.id === id) || null;
    },
    async getExamQuestions(id) {
      const e = exams.find((x) => x.id === id);
      return e ? e.questions.map((eq) => eq.question) : [];
    },
    async findAttempt(examId, studentId) {
      return attempts.find((a) => a.examId === examId && a.studentId === studentId) || null;
    },
    async listAttemptsByExam(examId) {
      return attempts.filter((a) => a.examId === examId);
    },
  };

  return { examRepo };
}

test("NFR-03: Common actions respond in 3 seconds or less (VAL-N03)", async () => {
  const { examRepo } = makePerformanceMockRepos();
  const app = createApp({
    userRepo: {},
    examRepo,
    jwtSecret: SECRET,
  });

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const teacherToken = tokenFor("TEACHER");
  const studentToken = tokenFor("STUDENT", 100);

  const timedRequest = async (name, path, token) => {
    const start = performance.now();
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const duration = performance.now() - start;
    assert.equal(res.status, 200);
    assert.ok(
      duration <= SLA_LIMIT_MS,
      `Action ${name} took ${duration.toFixed(2)}ms, exceeding SLA of ${SLA_LIMIT_MS}ms`
    );
    return duration;
  };

  try {
    const listDuration = await timedRequest("List Exams", "/api/exams", teacherToken);
    const questionsDuration = await timedRequest("Fetch Questions", "/api/exams/exam-perf-1/questions", studentToken);
    const resultsDuration = await timedRequest("Fetch Results", "/api/exams/exam-perf-1/results", studentToken);
    const reportDuration = await timedRequest("Generate Report", "/api/exams/exam-perf-1/report", teacherToken);

    // Assert every common action is fast
    assert.ok(listDuration < 1000, `List exams took ${listDuration}ms`);
    assert.ok(questionsDuration < 1000, `Fetch questions took ${questionsDuration}ms`);
    assert.ok(resultsDuration < 1000, `Fetch results took ${resultsDuration}ms`);
    assert.ok(reportDuration < 1000, `Generate report took ${reportDuration}ms`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
