import express from "express";

export function createExamRouter({ examRepo }) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const { title, questionCount, questionPoolId } = req.body ?? {};
    const details = {};

    if (typeof title !== "string" || title.trim().length === 0) {
      details.title = "A non-empty title is required.";
    }
    if (!Number.isInteger(questionCount) || questionCount < 1) {
      details.questionCount = "Question count must be a positive integer.";
    }
    if (typeof questionPoolId !== "string" || questionPoolId.trim().length === 0) {
      details.questionPoolId = "A question pool selection is required.";
    }

    if (Object.keys(details).length > 0) {
      return res.status(400).json({
        error: "Invalid examination details.",
        details,
      });
    }

    const normalizedPoolId = questionPoolId.trim();
    try {
      const questionPool = await examRepo.findQuestionPoolById(normalizedPoolId);
      if (!questionPool) {
        return res.status(404).json({ error: "Selected question pool was not found." });
      }

      const exam = await examRepo.createExam({
        title: title.trim(),
        questionCount,
        questionPoolId: normalizedPoolId,
      });

      return res.status(201).json({
        message: "Examination created successfully.",
        exam,
      });
    } catch (error) {
      console.error("Create examination failed:", error);
      return res.status(500).json({ error: "Unable to create examination." });
    }
  });

  return router;
}
