import { getPrisma } from "../db.js";

export function createPrismaExamRepository({ getClient = getPrisma } = {}) {
  return {
    findQuestionPoolById(id) {
      return getClient().questionPool.findUnique({ where: { id } });
    },

    createExam({
      title,
      questionCount,
      questionPoolId,
      durationMinutes,
      startTime,
      endTime,
      resultReleaseTime,
    }) {
      const data = { title, questionCount, questionPoolId };
      if (durationMinutes !== undefined) data.durationMinutes = durationMinutes;
      if (startTime !== undefined) data.startTime = startTime ? new Date(startTime) : null;
      if (endTime !== undefined) data.endTime = endTime ? new Date(endTime) : null;
      if (resultReleaseTime !== undefined) data.resultReleaseTime = resultReleaseTime ? new Date(resultReleaseTime) : null;

      return getClient().exam.create({
        data,
        include: { questionPool: true },
      });
    },

    findExamById(id) {
      return getClient().exam.findUnique({
        where: { id },
        include: {
          questionPool: { include: { questions: true } },
          questions: {
            include: { question: true },
            orderBy: { orderIndex: "asc" },
          },
          attempts: true,
        },
      });
    },

    listExams() {
      return getClient().exam.findMany({
        include: {
          questionPool: true,
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    updateExam(id, data) {
      const updateData = { ...data };
      if (updateData.startTime !== undefined) {
        updateData.startTime = updateData.startTime ? new Date(updateData.startTime) : null;
      }
      if (updateData.endTime !== undefined) {
        updateData.endTime = updateData.endTime ? new Date(updateData.endTime) : null;
      }
      if (updateData.resultReleaseTime !== undefined) {
        updateData.resultReleaseTime = updateData.resultReleaseTime ? new Date(updateData.resultReleaseTime) : null;
      }
      return getClient().exam.update({
        where: { id },
        data: updateData,
        include: {
          questionPool: true,
          questions: { include: { question: true } },
        },
      });
    },

    async publishExam(id, selectedQuestionIds = []) {
      const prisma = getClient();
      return prisma.$transaction(async (tx) => {
        await tx.examQuestion.deleteMany({ where: { examId: id } });

        if (selectedQuestionIds.length > 0) {
          await tx.examQuestion.createMany({
            data: selectedQuestionIds.map((qId, idx) => ({
              examId: id,
              questionId: qId,
              orderIndex: idx,
            })),
          });
        }

        return tx.exam.update({
          where: { id },
          data: {
            isPublished: true,
            publishedAt: new Date(),
          },
          include: {
            questions: {
              include: { question: true },
              orderBy: { orderIndex: "asc" },
            },
          },
        });
      });
    },

    async getExamQuestions(examId) {
      const records = await getClient().examQuestion.findMany({
        where: { examId },
        include: { question: true },
        orderBy: { orderIndex: "asc" },
      });
      return records.map((r) => r.question);
    },

    async isQuestionInPublishedExam(questionId) {
      const count = await getClient().examQuestion.count({
        where: {
          questionId,
          exam: { isPublished: true },
        },
      });
      return count > 0;
    },

    async isPoolInPublishedExam(poolId) {
      const count = await getClient().exam.count({
        where: {
          questionPoolId: poolId,
          isPublished: true,
        },
      });
      return count > 0;
    },

    listAttemptsByExam(examId) {
      return getClient().examAttempt.findMany({
        where: { examId },
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      });
    },

    findAttempt(examId, studentId) {
      return getClient().examAttempt.findFirst({
        where: { examId, studentId },
      });
    },

    recordAttempt({ examId, studentId, score, totalMarks, answers = null }) {
      return getClient().examAttempt.create({
        data: {
          examId,
          studentId,
          status: "SUBMITTED",
          score,
          totalMarks,
          answers,
          submittedAt: new Date(),
        },
      });
    },
  };
}
