import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPrismaExamRepository } from "../src/repositories/examRepository.js";

const connectionString = process.env.TEST_DATABASE_URL;
const integrationOptions = connectionString
  ? {}
  : { skip: "Set TEST_DATABASE_URL to run the PostgreSQL data-integrity test." };

function createClient() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

test("NFR-11: exam questions, student attempt, answers, and score remain relationally consistent", integrationOptions, async () => {
  const prisma = createClient();
  let userId;
  let poolId;
  let examId;
  const questionIds = [];
  let attemptId;

  try {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const user = await prisma.user.create({
      data: {
        email: `nfr11-${suffix}@example.invalid`,
        name: "NFR-11 integration test",
        passwordHash: "test-only-not-a-credential",
        role: "STUDENT",
      },
    });
    userId = user.id;

    const pool = await prisma.questionPool.create({ data: { name: `NFR-11 integrity ${suffix}` } });
    poolId = pool.id;

    const exam = await prisma.exam.create({
      data: { title: `NFR-11 integrity ${suffix}`, questionCount: 2, questionPoolId: pool.id },
    });
    examId = exam.id;

    const questions = await Promise.all([
      prisma.question.create({
        data: {
          text: "Integrity question one",
          options: ["A", "B"],
          correctAnswer: "A",
          difficulty: "EASY",
          questionPoolId: pool.id,
        },
      }),
      prisma.question.create({
        data: {
          text: "Integrity question two",
          options: ["C", "D"],
          correctAnswer: "D",
          difficulty: "MEDIUM",
          questionPoolId: pool.id,
        },
      }),
    ]);
    questionIds.push(...questions.map(({ id }) => id));

    const repository = createPrismaExamRepository({ getClient: () => prisma });
    const published = await repository.publishExam(exam.id, questionIds);
    assert.deepEqual(
      published.questions.map(({ questionId }) => questionId).sort(),
      [...questionIds].sort(),
      "published exam must link every selected question exactly once",
    );

    const answers = { [questionIds[0]]: "A", [questionIds[1]]: "D" };
    const savedAttempt = await repository.recordAttempt({
      examId: exam.id,
      studentId: user.id,
      score: 2,
      totalMarks: 2,
      answers,
    });
    attemptId = savedAttempt.id;

    const persisted = await prisma.examAttempt.findUnique({
      where: { id: savedAttempt.id },
      include: {
        exam: { include: { questions: { include: { question: true } } } },
        student: true,
      },
    });
    assert.ok(persisted);
    assert.equal(persisted.examId, exam.id);
    assert.equal(persisted.studentId, user.id);
    assert.equal(persisted.exam.questionPoolId, pool.id);
    assert.equal(persisted.student.email, user.email);
    assert.deepEqual(persisted.answers, answers);
    assert.equal(persisted.score, 2);
    assert.equal(persisted.totalMarks, 2);
    assert.equal(persisted.exam.questions.length, 2);
    assert.deepEqual(
      persisted.exam.questions.map(({ questionId, question }) => question.id === questionId && question.questionPoolId === pool.id),
      [true, true],
    );

    const counts = await Promise.all([
      prisma.examQuestion.count({ where: { examId: exam.id } }),
      prisma.examAttempt.count({ where: { examId: exam.id, studentId: user.id } }),
      prisma.question.count({ where: { id: { in: questionIds }, questionPoolId: pool.id } }),
    ]);
    assert.deepEqual(counts, [2, 1, 2]);
  } finally {
    await prisma.$disconnect().catch(() => {});
    const cleanup = createClient();
    try {
      if (attemptId) await cleanup.examAttempt.deleteMany({ where: { id: attemptId } });
      if (examId) await cleanup.exam.deleteMany({ where: { id: examId } });
      if (questionIds.length) await cleanup.question.deleteMany({ where: { id: { in: questionIds } } });
      if (userId) await cleanup.user.deleteMany({ where: { id: userId } });
      if (poolId) await cleanup.questionPool.deleteMany({ where: { id: poolId } });
    } finally {
      await cleanup.$disconnect();
    }
  }
});
