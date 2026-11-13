import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";
import { createPrismaQuestionRepository } from "../src/repositories/questionRepository.js";

const SECRET = "q".repeat(40);

function makeQuestionRepo() {
  const pools = [{ id: "pool-1", name: "Question pool" }];
  const questions = [];
  return {
    questions,
    async findQuestionPoolById(id) { return pools.find((pool) => pool.id === id) ?? null; },
    async createQuestion(data) {
      const question = { id: `question-${questions.length + 1}`, ...data, questionPool: pools.find((pool) => pool.id === data.questionPoolId) };
      questions.push(question);
      return question;
    },
    async listQuestions(poolId) { return questions.filter((question) => question.questionPoolId === poolId); },
  };
}

function token(role = "TEACHER") {
  return signToken({ id: 1, role }, { secret: SECRET });
}

async function start(repo = makeQuestionRepo()) {
  const app = createApp({ userRepo: {}, examRepo: {}, questionRepo: repo, jwtSecret: SECRET });
  const server = await new Promise((resolve) => { const listener = app.listen(0, () => resolve(listener)); });
  const base = `http://127.0.0.1:${server.address().port}/api/questions`;
  const call = async (method, path, body, auth = token()) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { ...(auth ? { authorization: `Bearer ${auth}` } : {}), ...(body ? { "content-type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  return { call, repo, close: () => new Promise((resolve) => server.close(resolve)) };
}

const validQuestion = { text: "  Which is a prime number? ", options: [" 4 ", " 5 "], correctAnswer: "5", questionPoolId: " pool-1 ", difficulty: "EASY" };

test("teacher creates an objective question and can list it from its pool", async () => {
  const { call, repo, close } = await start();
  try {
    const created = await call("POST", "/", validQuestion);
    assert.equal(created.status, 201);
    assert.equal(created.body.question.text, "Which is a prime number?");
    assert.deepEqual(created.body.question.options, ["4", "5"]);
    assert.equal(created.body.question.correctAnswer, "5");
    assert.equal(created.body.question.questionPoolId, "pool-1");
    assert.equal(created.body.question.difficulty, "EASY");
    assert.equal(repo.questions.length, 1);
    const listed = await call("GET", "?questionPoolId=pool-1");
    assert.equal(listed.status, 200);
    assert.equal(listed.body.questions.length, 1);
    assert.equal(listed.body.questions[0].id, created.body.question.id);
  } finally { await close(); }
});

test("invalid question fields return 400 without persistence", async () => {
  const { call, repo, close } = await start();
  try {
    const result = await call("POST", "/", { text: " ", options: ["one"], correctAnswer: "nope", questionPoolId: " " });
    assert.equal(result.status, 400);
    assert.ok(result.body.details.text);
    assert.ok(result.body.details.options);
    assert.ok(result.body.details.correctAnswer);
    assert.ok(result.body.details.questionPoolId);
    assert.equal(repo.questions.length, 0);
  } finally { await close(); }
});

test("difficulty is required and restricted to the documented implementation values", async () => {
  const { call, repo, close } = await start();
  try {
    const missing = { ...validQuestion };
    delete missing.difficulty;
    const invalid = await call("POST", "/", { ...validQuestion, difficulty: "EXTREME" });
    const absent = await call("POST", "/", missing);
    assert.equal(invalid.status, 400);
    assert.ok(invalid.body.details.difficulty);
    assert.equal(absent.status, 400);
    assert.ok(absent.body.details.difficulty);
    assert.equal(repo.questions.length, 0);
  } finally { await close(); }
});

test("all supported difficulties persist and are returned by the listing endpoint", async () => {
  const { call, close } = await start();
  try {
    for (const difficulty of ["EASY", "MEDIUM", "HARD"]) {
      const result = await call("POST", "/", { ...validQuestion, difficulty });
      assert.equal(result.status, 201);
      assert.equal(result.body.question.difficulty, difficulty);
    }
    const listed = await call("GET", "?questionPoolId=pool-1");
    assert.deepEqual(listed.body.questions.map((question) => question.difficulty), ["EASY", "MEDIUM", "HARD"]);
  } finally { await close(); }
});

test("unknown pool returns 404 and listing requires a pool", async () => {
  const { call, repo, close } = await start();
  try {
    assert.equal((await call("POST", "/", { ...validQuestion, questionPoolId: "missing" })).status, 404);
    assert.equal((await call("GET", "?questionPoolId=missing")).status, 404);
    assert.equal((await call("GET", "")).status, 400);
    assert.equal(repo.questions.length, 0);
  } finally { await close(); }
});

test("question creation and listing require an authenticated teacher", async () => {
  const { call, repo, close } = await start();
  try {
    assert.equal((await call("POST", "/", validQuestion, null)).status, 401);
    assert.equal((await call("GET", "?questionPoolId=pool-1", undefined, token("STUDENT"))).status, 403);
    assert.equal(repo.questions.length, 0);
  } finally { await close(); }
});

test("Prisma question repository uses injected client and lists by pool", async () => {
  const calls = [];
  const prisma = {
    questionPool: { findUnique: async (args) => { calls.push(["pool", args]); return { id: args.where.id }; } },
    question: {
      create: async (args) => { calls.push(["create", args]); return { id: "q1" }; },
      findMany: async (args) => { calls.push(["list", args]); return []; },
    },
  };
  const repo = createPrismaQuestionRepository({ getClient: () => prisma });
  await repo.findQuestionPoolById("pool-1");
  await repo.createQuestion({ text: "Q?", options: ["a", "b"], correctAnswer: "a", questionPoolId: "pool-1", difficulty: "EASY" });
  await repo.listQuestions("pool-1");
  assert.deepEqual(calls.map(([name]) => name), ["pool", "create", "list"]);
  assert.deepEqual(calls[2][1], { where: { questionPoolId: "pool-1" }, include: { questionPool: true }, orderBy: { createdAt: "asc" } });
});
