import { getPrisma } from "../db.js";

export function createPrismaQuestionRepository({ getClient = getPrisma } = {}) {
  return {
    async findQuestionById(id) {
      return getClient().question.findUnique({
        where: { id },
        include: { pool: true },
      });
    },

    async createQuestion({ poolId, text, options, correctOption, difficulty = "MEDIUM" }) {
      return getClient().question.create({
        data: {
          poolId,
          text,
          options,
          correctOption,
          difficulty,
        },
      });
    },

    async updateQuestion(id, { text, options, correctOption, difficulty }) {
      const data = {};
      if (text !== undefined) data.text = text;
      if (options !== undefined) data.options = options;
      if (correctOption !== undefined) data.correctOption = correctOption;
      if (difficulty !== undefined) data.difficulty = difficulty;

      return getClient().question.update({
        where: { id },
        data,
      });
    },

    async deleteQuestion(id) {
      return getClient().question.delete({
        where: { id },
      });
    },

    async listQuestionsByPool(poolId) {
      return getClient().question.findMany({
        where: { poolId },
        orderBy: { createdAt: "asc" },
      });
    },

    async countQuestionsByPool(poolId) {
      return getClient().question.count({
        where: { poolId },
      });
    },
  };
}
