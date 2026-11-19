import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "test-secret-at-least-thirty-two-chars-long";

function tokenFor(role, id = 1) {
  return signToken(
    { id, role, email: `${role.toLowerCase()}@example.com` },
    { secret: SECRET }
  );
}

async function createTestServer(exams = []) {
  const examRepo = {
    async listAvailableExams() {
      return exams;
    },
  };

  const app = createApp({
    userRepo: {},
    examRepo,
    jwtSecret: SECRET,
  });

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const request = async (path, token) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${baseUrl}${path}`, { headers });
    return {
      status: response.status,
      body: await response.json(),
    };
  };

  const close = () => new Promise((resolve) => server.close(resolve));

  return { request, close };
}

test("FR-21: Student can view currently available examinations", async () => {
  const exams = [
    {
      id: "exam-1",
      title: "Database Systems",
      questionCount: 20,
      durationMinutes: 60,
      startTime: null,
      endTime: null,
    },
  ];

  const { request, close } = await createTestServer(exams);

  try {
    const response = await request(
      "/api/student/exams",
      tokenFor("STUDENT")
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.exams, exams);
  } finally {
    await close();
  }
});

test("FR-21: Unauthenticated users cannot view available examinations", async () => {
  const { request, close } = await createTestServer();

  try {
    const response = await request("/api/student/exams");

    assert.equal(response.status, 401);
  } finally {
    await close();
  }
});

test("FR-21: Teachers cannot access the student examination listing", async () => {
  const { request, close } = await createTestServer();

  try {
    const response = await request(
      "/api/student/exams",
      tokenFor("TEACHER")
    );

    assert.equal(response.status, 403);
  } finally {
    await close();
  }
});

test("FR-21: Repository errors return a server error", async () => {
  const examRepo = {
    async listAvailableExams() {
      throw new Error("Database unavailable");
    },
  };

  const app = createApp({
    userRepo: {},
    examRepo,
    jwtSecret: SECRET,
  });

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/student/exams`,
      {
        headers: {
          Authorization: `Bearer ${tokenFor("STUDENT")}`,
        },
      }
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      error: "Unable to retrieve available examinations.",
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});