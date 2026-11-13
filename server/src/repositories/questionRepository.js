import { getPrisma } from "../db.js";

export function createPrismaQuestionRepository({ getClient = getPrisma } = {}) {
  return {
    findQuestionPoolById(id) {
      return getClient().questionPool.findUnique({ where: { id } });
    },
    createQuestion({ text, options, correctAnswer, questionPoolId, difficulty }) {
      return getClient().question.create({
        data: { text, options, correctAnswer, questionPoolId, difficulty },
        include: { questionPool: true },
      });
    },
    listQuestions(questionPoolId) {
      return getClient().question.findMany({
        where: { questionPoolId },
        include: { questionPool: true },
        orderBy: { createdAt: "asc" },
      });
    },
  };
}
