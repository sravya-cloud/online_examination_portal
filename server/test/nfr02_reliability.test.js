import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPrismaExamRepository } from "../src/repositories/examRepository.js";

const connectionString = process.env.TEST_DATABASE_URL;
const integrationOptions = connectionString
  ? {}
  : { skip: "Set TEST_DATABASE_URL to run the PostgreSQL persistence test." };

function createClient() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

test("NFR-02: submitted answers and attempt data survive a database client restart", integrationOptions, async () => {
  const firstClient = createClient();
  let userId;
  let poolId;
  let examId;

  try {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const user = await firstClient.user.create({
      data: {
        email: `nfr02-${suffix}@example.invalid`,
        name: "NFR-02 integration test",
        passwordHash: "test-only-not-a-credential",
        role: "STUDENT",
      },
    });
    userId = user.id;

    const pool = await firstClient.questionPool.create({
      data: { name: `NFR-02 integration test ${suffix}` },
    });
    poolId = pool.id;

    const exam = await firstClient.exam.create({
      data: {
        title: `NFR-02 persistence test ${suffix}`,
        questionCount: 2,
        questionPoolId: pool.id,
      },
    });
    examId = exam.id;

    const answers = { questionA: "option-2", questionB: "option-1" };
    const repository = createPrismaExamRepository({ getClient: () => firstClient });
    const saved = await repository.recordAttempt({
      examId: exam.id,
      studentId: user.id,
      score: 1,
      totalMarks: 2,
      answers,
    });

    await firstClient.$disconnect();
    const restartedClient = createClient();
    try {
      const restored = await restartedClient.examAttempt.findUnique({ where: { id: saved.id } });
      assert.ok(restored, "attempt should still exist after opening a fresh database client");
      assert.equal(restored.examId, exam.id);
      assert.equal(restored.studentId, user.id);
      assert.equal(restored.score, 1);
      assert.equal(restored.totalMarks, 2);
      assert.deepEqual(restored.answers, answers);
    } finally {
      await restartedClient.$disconnect();
    }
  } finally {
    await firstClient.$disconnect().catch(() => {});
    const cleanupClient = createClient();
    try {
      if (examId) {
        if (cleanupClient.examAttempt) {
          await cleanupClient.examAttempt.deleteMany({ where: { examId } });
        }
        await cleanupClient.exam.deleteMany({ where: { id: examId } });
      }
      if (userId) await cleanupClient.user.deleteMany({ where: { id: userId } });
      if (poolId) await cleanupClient.questionPool.deleteMany({ where: { id: poolId } });
    } finally {
      await cleanupClient.$disconnect();
    }
  }
});
