import { getPrisma } from "../db.js";

export function createPrismaExamRepository({ getClient = getPrisma } = {}) {
  return {
    findQuestionPoolById(id) {
      return getClient().questionPool.findUnique({ where: { id } });
    },
    createExam({ title, questionCount, questionPoolId }) {
      return getClient().exam.create({
        data: { title, questionCount, questionPoolId },
        include: { questionPool: true },
      });
    },
  };
}
