import express from "express";

export function createQuestionRouter({ questionRepo, examRepo }) {
  const router = express.Router();

  // Create question (FR-05, FR-06)
  router.post("/", async (req, res) => {
    const { text, options, correctAnswer, questionPoolId, poolId, difficulty } = req.body ?? {};
    const details = {};

    const targetPoolId = questionPoolId || poolId;

    if (typeof text !== "string" || !text.trim()) {
      details.text = "A non-empty question text is required.";
    }
    if (!Array.isArray(options) || options.length < 2 || options.some((option) => typeof option !== "string" || !option.trim())) {
      details.options = "At least two non-empty options are required.";
    }

    if (typeof correctAnswer !== "string" || !correctAnswer.trim()) {
      details.correctAnswer = "A correct answer is required.";
    } else if (Array.isArray(options) && !options.some((option) => typeof option === "string" && option.trim() === correctAnswer.trim())) {
      details.correctAnswer = "The correct answer must match one of the provided options.";
    }

    if (typeof targetPoolId !== "string" || !targetPoolId.trim()) {
      details.questionPoolId = "A question pool selection is required.";
    }
    if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      details.difficulty = "Difficulty must be EASY, MEDIUM, or HARD.";
    }

    if (Object.keys(details).length) {
      return res.status(400).json({ error: "Invalid question details.", details });
    }

    try {
      const normalizedPoolId = targetPoolId.trim();
      if (!(await questionRepo.findQuestionPoolById(normalizedPoolId))) {
        return res.status(404).json({ error: "Selected question pool was not found." });
      }
      const question = await questionRepo.createQuestion({
        text: text.trim(),
        options: options.map((option) => option.trim()),
        correctAnswer: correctAnswer.trim(),
        questionPoolId: normalizedPoolId,
        difficulty,
      });
      return res.status(201).json({ message: "Question created successfully.", question });
    } catch (error) {
      console.error("Create question failed:", error);
      return res.status(500).json({ error: "Unable to create question." });
    }
  });

  // List questions (by query parameter)
  router.get("/", async (req, res) => {
    const questionPoolId = req.query.questionPoolId;
    if (typeof questionPoolId !== "string" || !questionPoolId.trim()) {
      return res.status(400).json({ error: "A questionPoolId query parameter is required." });
    }
    try {
      const poolId = questionPoolId.trim();
      if (!(await questionRepo.findQuestionPoolById(poolId))) {
        return res.status(404).json({ error: "Selected question pool was not found." });
      }
      const questions = await questionRepo.listQuestions(poolId);
      return res.status(200).json({ questions });
    } catch (error) {
      console.error("List questions failed:", error);
      return res.status(500).json({ error: "Unable to list questions." });
    }
  });

  // FR-07: Edit question before publishing (VAL-F13)
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { text, options, correctAnswer, difficulty } = req.body ?? {};

    try {
      const existing = await questionRepo.findQuestionById(id);
      if (!existing) {
        return res.status(404).json({ error: "Question not found." });
      }

      const poolId = existing.questionPoolId || existing.poolId;
      if (examRepo) {
        const isLocked = (await examRepo.isQuestionInPublishedExam(id)) || (poolId && (await examRepo.isPoolInPublishedExam(poolId)));
        if (isLocked) {
          return res.status(409).json({
            error: "Questions cannot be edited after the examination is published.",
            code: "EXAM_ALREADY_PUBLISHED",
          });
        }
      }

      const updateData = {};
      const details = {};

      if (text !== undefined) {
        if (typeof text !== "string" || text.trim().length === 0) {
          details.text = "Question text cannot be empty.";
        } else {
          updateData.text = text.trim();
        }
      }

      if (options !== undefined) {
        if (!Array.isArray(options) || options.length < 2) {
          details.options = "At least two options are required.";
        } else {
          updateData.options = options.map((o) => String(o).trim());
        }
      }

      if (correctAnswer !== undefined) {
        const currentOptions = updateData.options || existing.options;
        if (typeof correctAnswer !== "string" || !correctAnswer.trim()) {
          details.correctAnswer = "Valid correct answer required.";
        } else if (!currentOptions.includes(correctAnswer.trim())) {
          details.correctAnswer = "Correct answer must match one of the options.";
        } else {
          updateData.correctAnswer = correctAnswer.trim();
        }
      }

      if (difficulty !== undefined) {
        if (!["EASY", "MEDIUM", "HARD"].includes(String(difficulty).toUpperCase())) {
          details.difficulty = "Difficulty must be EASY, MEDIUM, or HARD.";
        } else {
          updateData.difficulty = String(difficulty).toUpperCase();
        }
      }

      if (Object.keys(details).length > 0) {
        return res.status(400).json({ error: "Invalid question update data.", details });
      }

      const updated = await questionRepo.updateQuestion(id, updateData);
      return res.status(200).json({
        message: "Question updated successfully.",
        question: updated,
      });
    } catch (error) {
      console.error("Update question failed:", error);
      return res.status(500).json({ error: "Unable to update question." });
    }
  });

  // FR-07: Remove question before publishing (VAL-F13)
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const existing = await questionRepo.findQuestionById(id);
      if (!existing) {
        return res.status(404).json({ error: "Question not found." });
      }

      const poolId = existing.questionPoolId || existing.poolId;
      if (examRepo) {
        const isLocked = (await examRepo.isQuestionInPublishedExam(id)) || (poolId && (await examRepo.isPoolInPublishedExam(poolId)));
        if (isLocked) {
          return res.status(409).json({
            error: "Questions cannot be deleted after the examination is published.",
            code: "EXAM_ALREADY_PUBLISHED",
          });
        }
      }

      await questionRepo.deleteQuestion(id);
      return res.status(200).json({
        message: "Question deleted successfully.",
        deletedId: id,
      });
    } catch (error) {
      console.error("Delete question failed:", error);
      return res.status(500).json({ error: "Unable to delete question." });
    }
  });

  // List questions for a pool (path parameter)
  router.get("/pool/:poolId", async (req, res) => {
    const { poolId } = req.params;
    try {
      const questions = await questionRepo.listQuestions(poolId);
      return res.status(200).json({ questions });
    } catch (error) {
      console.error("List pool questions failed:", error);
      return res.status(500).json({ error: "Unable to list questions." });
    }
  });

  return router;
}
