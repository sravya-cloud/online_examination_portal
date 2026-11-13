import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "test-secret-at-least-thirty-two-chars-long";

function tokenFor(role, id) {
  return signToken({ id, role, email: `user${id}@example.com` }, { secret: SECRET });
}

test("NFR-10: System handles concurrent users without workflow interruption (VAL-N10)", async () => {
  const attempts = [];
  const questions = [
    { id: "q1", text: "Q1", options: ["A", "B"], correctOption: 0, difficulty: "EASY" },
    { id: "q2", text: "Q2", options: ["A", "B"], correctOption: 1, difficulty: "EASY" },
  ];

  const exam = {
    id: "exam-scale-1",
    title: "Scalability Test Exam",
    durationMinutes: 60,
    questionCount: 2,
    isPublished: true,
  };

  const examRepo = {
    async findExamById(id) {
      return id === exam.id ? exam : null;
    },
    async getExamQuestions(id) {
      return id === exam.id ? questions : [];
    },
    async recordAttempt({ examId, studentId, score, totalMarks }) {
      const att = { id: `att-${attempts.length + 1}`, examId, studentId, score, totalMarks, submittedAt: new Date() };
      attempts.push(att);
      return att;
    },
    async listAttemptsByExam(id) {
      return attempts.filter((a) => a.examId === id);
    },
  };

  const app = createApp({ userRepo: {}, examRepo, jwtSecret: SECRET });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const CONCURRENT_USERS = 50;

    // Concurrently fetch questions for 50 distinct students
    const fetchPromises = Array.from({ length: CONCURRENT_USERS }, async (_, i) => {
      const studentId = 1000 + i;
      const token = tokenFor("STUDENT", studentId);
      const res = await fetch(`${baseUrl}/api/exams/${exam.id}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.questions.length, 2);
    });

    await Promise.all(fetchPromises);

    // Concurrently submit attempts for 50 distinct students
    const submitPromises = Array.from({ length: CONCURRENT_USERS }, async (_, i) => {
      const studentId = 1000 + i;
      const token = tokenFor("STUDENT", studentId);
      const res = await fetch(`${baseUrl}/api/exams/${exam.id}/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score: 2, totalMarks: 2 }),
      });
      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.attempt.score, 2);
    });

    await Promise.all(submitPromises);

    // Verify all 50 attempts recorded correctly without data corruption
    assert.equal(attempts.length, CONCURRENT_USERS);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
