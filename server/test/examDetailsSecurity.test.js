import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "exam-details-security-test-secret-at-least-32-characters";

test("FR-16: students cannot retrieve internal examination details", async () => {
  const app = createApp({
    userRepo: {},
    examRepo: {},
    questionRepo: {},
    jwtSecret: SECRET,
  });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const token = signToken(
    { id: 7, role: "STUDENT", email: "student@example.com" },
    { secret: SECRET },
  );

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/exams/exam-1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.equal(response.status, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
