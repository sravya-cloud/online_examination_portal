import express from "express";

export function createQuestionRouter({ questionRepo }) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const { text, options, correctAnswer, questionPoolId } = req.body ?? {};
    const details = {};

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
    if (typeof questionPoolId !== "string" || !questionPoolId.trim()) {
      details.questionPoolId = "A question pool selection is required.";
    }

    if (Object.keys(details).length) {
      return res.status(400).json({ error: "Invalid question details.", details });
    }

    try {
      const poolId = questionPoolId.trim();
      if (!(await questionRepo.findQuestionPoolById(poolId))) {
        return res.status(404).json({ error: "Selected question pool was not found." });
      }
      const question = await questionRepo.createQuestion({
        text: text.trim(),
        options: options.map((option) => option.trim()),
        correctAnswer: correctAnswer.trim(),
        questionPoolId: poolId,
      });
      return res.status(201).json({ message: "Question created successfully.", question });
    } catch (error) {
      console.error("Create question failed:", error);
      return res.status(500).json({ error: "Unable to create question." });
    }
  });

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

  return router;
}
