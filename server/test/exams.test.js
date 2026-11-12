import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";
import { createPrismaExamRepository } from "../src/repositories/examRepository.js";

const SECRET = "x".repeat(40);

function makeExamRepo() {
  const pools = [{ id: "pool-1", name: "Question pool" }];
  const exams = [];
  let poolLookups = 0;
  return {
    pools,
    exams,
    get poolLookups() {
      return poolLookups;
    },
    async findQuestionPoolById(id) {
      poolLookups += 1;
      return pools.find((pool) => pool.id === id) ?? null;
    },
    async createExam(data) {
      const exam = {
        id: `exam-${exams.length + 1}`,
        ...data,
        questionPool: pools.find((pool) => pool.id === data.questionPoolId),
        createdAt: new Date("2026-11-12T00:00:00.000Z"),
        updatedAt: new Date("2026-11-12T00:00:00.000Z"),
      };
      exams.push(exam);
      return exam;
    },
  };
}

function tokenFor(role) {
  return signToken({ id: role === "TEACHER" ? 2 : 1, role }, { secret: SECRET });
}

async function start(examRepo = makeExamRepo()) {
  const app = createApp({ userRepo: {}, examRepo, jwtSecret: SECRET });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (body, token = tokenFor("TEACHER")) => {
    const response = await fetch(`${base}/api/exams`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  return { call, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())), examRepo };
}

test("teacher creates an exam and its data is persisted by the injected repository", async () => {
  const examRepo = makeExamRepo();
  const { call, close } = await start(examRepo);
  try {
    const response = await call({
      title: "  Midterm  ",
      questionCount: 12,
      questionPoolId: " pool-1 ",
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.message, "Examination created successfully.");
    assert.equal(response.body.exam.title, "Midterm");
    assert.equal(response.body.exam.questionCount, 12);
    assert.equal(response.body.exam.questionPoolId, "pool-1");
    assert.equal(response.body.exam.questionPool.id, "pool-1");
    assert.equal(examRepo.exams.length, 1);
    assert.equal(examRepo.exams[0].title, "Midterm");
  } finally {
    await close();
  }
});

test("invalid title, question count, and pool selection return field validation errors", async () => {
  const examRepo = makeExamRepo();
  const { call, close } = await start(examRepo);
  try {
    const response = await call({ title: "   ", questionCount: 1.5, questionPoolId: " " });

    assert.equal(response.status, 400);
    assert.deepEqual(Object.keys(response.body.details).sort(), ["questionCount", "questionPoolId", "title"]);
    assert.equal(examRepo.poolLookups, 0);
    assert.equal(examRepo.exams.length, 0);
  } finally {
    await close();
  }
});

test("a question pool that does not exist returns 404 and does not create an exam", async () => {
  const examRepo = makeExamRepo();
  const { call, close } = await start(examRepo);
  try {
    const response = await call({ title: "Midterm", questionCount: 12, questionPoolId: "missing-pool" });

    assert.equal(response.status, 404);
    assert.equal(response.body.error, "Selected question pool was not found.");
    assert.equal(examRepo.exams.length, 0);
  } finally {
    await close();
  }
});

test("exam creation requires authentication and the teacher role", async () => {
  const examRepo = makeExamRepo();
  const { call, close } = await start(examRepo);
  const input = { title: "Midterm", questionCount: 12, questionPoolId: "pool-1" };
  try {
    const unauthenticated = await call(input, null);
    const student = await call(input, tokenFor("STUDENT"));

    assert.equal(unauthenticated.status, 401);
    assert.equal(student.status, 403);
    assert.equal(examRepo.poolLookups, 0);
    assert.equal(examRepo.exams.length, 0);
  } finally {
    await close();
  }
});

test("Prisma repository delegates pool lookup and exam creation through the injected client", async () => {
  const calls = [];
  const prisma = {
    questionPool: {
      findUnique: async (args) => {
        calls.push(["findUnique", args]);
        return { id: args.where.id, name: "Question pool" };
      },
    },
    exam: {
      create: async (args) => {
        calls.push(["create", args]);
        return { id: "exam-1", ...args.data };
      },
    },
  };
  const repo = createPrismaExamRepository({ getClient: () => prisma });

  await repo.findQuestionPoolById("pool-1");
  await repo.createExam({ title: "Midterm", questionCount: 12, questionPoolId: "pool-1" });

  assert.deepEqual(calls, [
    ["findUnique", { where: { id: "pool-1" } }],
    ["create", {
      data: { title: "Midterm", questionCount: 12, questionPoolId: "pool-1" },
      include: { questionPool: true },
    }],
  ]);
});
