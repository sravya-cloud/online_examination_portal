import { Router } from "express";

export function createStudentExamRouter({ examRepo }) {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const exams = await examRepo.listAvailableExams();
      return res.json({ exams });
    } catch (error) {
      console.error("List available exams failed:", error);
      return res.status(500).json({
        error: "Unable to retrieve available examinations.",
      });
    }
  });

  return router;
}