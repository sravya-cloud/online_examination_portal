import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "nfr04-availability-test-secret-at-least-32-chars";
const SIMULATED_WINDOW_MS = 10_000;
const PROBE_INTERVAL_MS = 250;

function tokenForStudent() {
  return signToken({ id: 101, role: "STUDENT" }, { secret: SECRET });
}

test("NFR-04: health and active exam questions stay available throughout the simulated exam window", { timeout: 15_000 }, async () => {
  const examRepo = {
    async findExamById(id) {
      if (id !== "exam-1") return null;
      return {
        id,
        title: "Availability test",
        isPublished: true,
        durationMinutes: 30,
        startTime: new Date(Date.now() - 60_000),
        endTime: new Date(Date.now() + 60_000),
      };
    },
    async getExamQuestions() {
      return [{ id: "question-1", text: "Availability check", options: ["A", "B"] }];
    },
    async findActiveAttempt(examId, studentId) {
      return { id: `active-${examId}-${studentId}`, examId, studentId, status: "IN_PROGRESS", startedAt: new Date() };
    },
  };
  const app = createApp({ userRepo: {}, examRepo, jwtSecret: SECRET });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const headers = { Authorization: `Bearer ${tokenForStudent()}` };
  const endAt = Date.now() + SIMULATED_WINDOW_MS;
  let probes = 0;

  try {
    while (Date.now() < endAt) {
      const [healthResponse, examResponse] = await Promise.all([
        fetch(`${baseUrl}/api/health`),
        fetch(`${baseUrl}/api/exams/exam-1/questions`, { headers }),
      ]);

      assert.equal(healthResponse.status, 200, "health endpoint must respond during the exam window");
      assert.deepEqual(await healthResponse.json(), { status: "ok" });
      assert.equal(examResponse.status, 200, "students must be able to retrieve active exam questions");
      const examBody = await examResponse.json();
      assert.deepEqual(examBody.questions.map(({ id }) => id), ["question-1"]);
      probes += 1;
      await delay(PROBE_INTERVAL_MS);
    }

    assert.ok(probes >= 30, `expected continuous availability probes, received ${probes}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
