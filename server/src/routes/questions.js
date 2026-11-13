import express from "express";

export function createQuestionRouter({ questionRepo, examRepo }) {
  const router = express.Router();

  // Create a new question in a question pool (Teacher/Admin)
  router.post("/", async (req, res) => {
    const { poolId, text, options, correctOption, difficulty = "MEDIUM" } = req.body ?? {};
    const details = {};

    if (typeof poolId !== "string" || poolId.trim().length === 0) {
      details.poolId = "Question pool ID is required.";
    }
    if (typeof text !== "string" || text.trim().length === 0) {
      details.text = "Question text is required.";
    }
    if (!Array.isArray(options) || options.length < 2) {
      details.options = "At least two options are required.";
    }
    if (!Number.isInteger(correctOption) || correctOption < 0 || (Array.isArray(options) && correctOption >= options.length)) {
      details.correctOption = "A valid correct option index is required.";
    }
    const validDifficulties = ["EASY", "MEDIUM", "HARD"];
    if (difficulty && !validDifficulties.includes(difficulty.toUpperCase())) {
      details.difficulty = "Difficulty must be EASY, MEDIUM, or HARD.";
    }

    if (Object.keys(details).length > 0) {
      return res.status(400).json({ error: "Invalid question details.", details });
    }

    try {
      const question = await questionRepo.createQuestion({
        poolId: poolId.trim(),
        text: text.trim(),
        options: options.map((opt) => String(opt).trim()),
        correctOption,
        difficulty: difficulty.toUpperCase(),
      });
      return res.status(201).json({
        message: "Question created successfully.",
        question,
      });
    } catch (error) {
      console.error("Create question failed:", error);
      return res.status(500).json({ error: "Unable to create question." });
    }
  });

  // FR-07: Edit question before publishing (VAL-F13)
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { text, options, correctOption, difficulty } = req.body ?? {};

    try {
      const existing = await questionRepo.findQuestionById(id);
      if (!existing) {
        return res.status(404).json({ error: "Question not found." });
      }

      // Check if question is locked by an already-published exam
      const isLocked = await examRepo.isQuestionInPublishedExam(id) || await examRepo.isPoolInPublishedExam(existing.poolId);
      if (isLocked) {
        return res.status(409).json({
          error: "Questions cannot be edited after the examination is published.",
          code: "EXAM_ALREADY_PUBLISHED",
        });
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

      if (correctOption !== undefined) {
        const currentOptions = updateData.options || existing.options;
        if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption >= currentOptions.length) {
          details.correctOption = "Valid correct option index required.";
        } else {
          updateData.correctOption = correctOption;
        }
      }

      if (difficulty !== undefined) {
        const validDifficulties = ["EASY", "MEDIUM", "HARD"];
        if (!validDifficulties.includes(String(difficulty).toUpperCase())) {
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

      // Check if question is locked by an already-published exam
      const isLocked = await examRepo.isQuestionInPublishedExam(id) || await examRepo.isPoolInPublishedExam(existing.poolId);
      if (isLocked) {
        return res.status(409).json({
          error: "Questions cannot be deleted after the examination is published.",
          code: "EXAM_ALREADY_PUBLISHED",
        });
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

  // List questions for a pool
  router.get("/pool/:poolId", async (req, res) => {
    const { poolId } = req.params;
    try {
      const questions = await questionRepo.listQuestionsByPool(poolId);
      return res.status(200).json({ questions });
    } catch (error) {
      console.error("List pool questions failed:", error);
      return res.status(500).json({ error: "Unable to list questions." });
    }
  });

  return router;
}
