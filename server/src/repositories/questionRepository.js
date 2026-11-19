import { getPrisma } from "../db.js";

export function createPrismaQuestionRepository({ getClient = getPrisma } = {}) {
  return {
    findQuestionPoolById(id) {
      return getClient().questionPool.findUnique({ where: { id } });
    },

    // FR-05: question pools that questions are uploaded into.
    findQuestionPoolByName(name) {
      return getClient().questionPool.findUnique({ where: { name } });
    },

    createQuestionPool({ name }) {
      return getClient().questionPool.create({ data: { name } });
    },

    async listQuestionPools() {
      const pools = await getClient().questionPool.findMany({
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { questions: true } } },
      });
      return pools.map(({ _count, ...pool }) => ({ ...pool, questionCount: _count.questions }));
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

    findQuestionById(id) {
      return getClient().question.findUnique({
        where: { id },
        include: { questionPool: true },
      });
    },

    updateQuestion(id, data) {
      return getClient().question.update({
        where: { id },
        data,
      });
    },

    deleteQuestion(id) {
      return getClient().question.delete({
        where: { id },
      });
    },
  };
}
