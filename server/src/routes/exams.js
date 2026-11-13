import express from "express";
import { selectRandomQuestions } from "../services/questionSelection.js";

export function createExamRouter({ examRepo }) {
  const router = express.Router();

  // Helper to validate duration and availability period (FR-08)
  function validateExamTiming({ durationMinutes, startTime, endTime, resultReleaseTime }) {
    const details = {};

    let parsedDuration = undefined;
    if (durationMinutes !== undefined && durationMinutes !== null) {
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
        details.durationMinutes = "Duration must be a positive integer in minutes.";
      } else {
        parsedDuration = durationMinutes;
      }
    }

    let parsedStart = undefined;
    if (startTime !== undefined && startTime !== null) {
      const d = new Date(startTime);
      if (isNaN(d.getTime())) {
        details.startTime = "Start time must be a valid ISO date string.";
      } else {
        parsedStart = d;
      }
    }

    let parsedEnd = undefined;
    if (endTime !== undefined && endTime !== null) {
      const d = new Date(endTime);
      if (isNaN(d.getTime())) {
        details.endTime = "End time must be a valid ISO date string.";
      } else {
        parsedEnd = d;
      }
    }

    if (parsedStart && parsedEnd) {
      if (parsedStart.getTime() >= parsedEnd.getTime()) {
        details.endTime = "End time must be strictly after start time.";
      } else if (parsedDuration) {
        const windowMinutes = (parsedEnd.getTime() - parsedStart.getTime()) / (1000 * 60);
        if (parsedDuration > windowMinutes) {
          details.durationMinutes = `Duration (${parsedDuration}m) cannot exceed the availability window (${Math.floor(windowMinutes)}m).`;
        }
      }
    }

    let parsedRelease = undefined;
    if (resultReleaseTime !== undefined && resultReleaseTime !== null) {
      const d = new Date(resultReleaseTime);
      if (isNaN(d.getTime())) {
        details.resultReleaseTime = "Result release time must be a valid ISO date string.";
      } else {
        parsedRelease = d;
      }
    }

    return { details, parsedDuration, parsedStart, parsedEnd, parsedRelease };
  }

  // Create examination (FR-04, FR-08)
  router.post("/", async (req, res) => {
    // Only teachers or administrators can create exams
    if (req.auth?.role !== "TEACHER" && req.auth?.role !== "ADMIN") {
      return res.status(403).json({ error: "Only teachers and administrators can create examinations." });
    }

    const {
      title,
      questionCount,
      questionPoolId,
      durationMinutes,
      startTime,
      endTime,
      resultReleaseTime,
    } = req.body ?? {};

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

    const timing = validateExamTiming({
      durationMinutes: durationMinutes ?? 60,
      startTime,
      endTime,
      resultReleaseTime,
    });
    Object.assign(details, timing.details);

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
        durationMinutes: timing.parsedDuration ?? 60,
        startTime: timing.parsedStart ?? null,
        endTime: timing.parsedEnd ?? null,
        resultReleaseTime: timing.parsedRelease ?? null,
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

  // List examinations
  router.get("/", async (req, res) => {
    try {
      const exams = await examRepo.listExams();
      return res.status(200).json({ exams });
    } catch (error) {
      console.error("List examinations failed:", error);
      return res.status(500).json({ error: "Unable to retrieve examinations." });
    }
  });

  // Get specific examination
  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const exam = await examRepo.findExamById(id);
      if (!exam) {
        return res.status(404).json({ error: "Examination not found." });
      }
      return res.status(200).json({ exam });
    } catch (error) {
      console.error("Get examination failed:", error);
      return res.status(500).json({ error: "Unable to retrieve examination." });
    }
  });

  // FR-08: Configure exam duration and availability period (VAL-F04)
  router.put("/:id", async (req, res) => {
    if (req.auth?.role !== "TEACHER" && req.auth?.role !== "ADMIN") {
      return res.status(403).json({ error: "Only teachers and administrators can configure examinations." });
    }

    const { id } = req.params;
    const {
      title,
      questionCount,
      durationMinutes,
      startTime,
      endTime,
      resultReleaseTime,
    } = req.body ?? {};

    try {
      const exam = await examRepo.findExamById(id);
      if (!exam) {
        return res.status(404).json({ error: "Examination not found." });
      }

      const updateData = {};
      const details = {};

      if (title !== undefined) {
        if (typeof title !== "string" || title.trim().length === 0) {
          details.title = "A non-empty title is required.";
        } else {
          updateData.title = title.trim();
        }
      }

      if (questionCount !== undefined) {
        if (!Number.isInteger(questionCount) || questionCount < 1) {
          details.questionCount = "Question count must be a positive integer.";
        } else {
          updateData.questionCount = questionCount;
        }
      }

      const timing = validateExamTiming({
        durationMinutes: durationMinutes ?? exam.durationMinutes,
        startTime: startTime !== undefined ? startTime : exam.startTime,
        endTime: endTime !== undefined ? endTime : exam.endTime,
        resultReleaseTime: resultReleaseTime !== undefined ? resultReleaseTime : exam.resultReleaseTime,
      });

      if (Object.keys(timing.details).length > 0) {
        Object.assign(details, timing.details);
      } else {
        if (durationMinutes !== undefined) updateData.durationMinutes = timing.parsedDuration;
        if (startTime !== undefined) updateData.startTime = timing.parsedStart;
        if (endTime !== undefined) updateData.endTime = timing.parsedEnd;
        if (resultReleaseTime !== undefined) updateData.resultReleaseTime = timing.parsedRelease;
      }

      if (Object.keys(details).length > 0) {
        return res.status(400).json({ error: "Invalid examination configuration.", details });
      }

      const updated = await examRepo.updateExam(id, updateData);
      return res.status(200).json({
        message: "Examination configured successfully.",
        exam: updated,
      });
    } catch (error) {
      console.error("Configure examination failed:", error);
      return res.status(500).json({ error: "Unable to configure examination." });
    }
  });

  // Publish examination: performs FR-09 (Random selection) and locks FR-10 (Same question set) & FR-07 (Publish lock)
  router.post("/:id/publish", async (req, res) => {
    if (req.auth?.role !== "TEACHER" && req.auth?.role !== "ADMIN") {
      return res.status(403).json({ error: "Only teachers and administrators can publish examinations." });
    }

    const { id } = req.params;
    try {
      const exam = await examRepo.findExamById(id);
      if (!exam) {
        return res.status(404).json({ error: "Examination not found." });
      }

      // Fetch pool and pool questions
      const pool = await examRepo.findQuestionPoolById(exam.questionPoolId);
      if (!pool || !Array.isArray(pool.questions)) {
        return res.status(400).json({ error: "Associated question pool or its questions could not be loaded." });
      }

      // FR-09: Random selection of exactly N questions from pool (VAL-F05)
      let selectedQuestions;
      try {
        selectedQuestions = selectRandomQuestions(pool.questions, exam.questionCount);
      } catch (err) {
        if (err.code === "INSUFFICIENT_POOL_QUESTIONS") {
          return res.status(400).json({
            error: `Question pool only contains ${pool.questions.length} questions, but ${exam.questionCount} are required.`,
            poolSize: pool.questions.length,
            requestedCount: exam.questionCount,
          });
        }
        throw err;
      }

      // FR-10: Fix and persist identical question set for all students (VAL-F05)
      const selectedQuestionIds = selectedQuestions.map((q) => q.id);
      const publishedExam = await examRepo.publishExam(id, selectedQuestionIds);

      return res.status(200).json({
        message: "Examination published successfully. Fixed question set assigned.",
        exam: publishedExam,
        selectedQuestionsCount: selectedQuestionIds.length,
      });
    } catch (error) {
      console.error("Publish examination failed:", error);
      return res.status(500).json({ error: "Unable to publish examination." });
    }
  });

  // FR-10: Display questions of examination (Same question set for all students)
  router.get("/:id/questions", async (req, res) => {
    const { id } = req.params;
    const isStudent = req.auth?.role === "STUDENT";

    try {
      const exam = await examRepo.findExamById(id);
      if (!exam) {
        return res.status(404).json({ error: "Examination not found." });
      }

      if (!exam.isPublished && isStudent) {
        return res.status(403).json({ error: "Examination is not yet published." });
      }

      // Check availability period for students
      if (isStudent) {
        const now = Date.now();
        if (exam.startTime && now < new Date(exam.startTime).getTime()) {
          return res.status(403).json({
            error: "Examination is not yet available.",
            startTime: exam.startTime,
          });
        }
        if (exam.endTime && now > new Date(exam.endTime).getTime()) {
          return res.status(403).json({
            error: "Examination availability window has ended.",
            endTime: exam.endTime,
          });
        }
      }

      const questions = await examRepo.getExamQuestions(id);

      // Sanitize questions for students (prevent answer leakage)
      const payload = isStudent
        ? questions.map(({ id, text, options, difficulty }) => ({
            id,
            text,
            options,
            difficulty,
          }))
        : questions;

      return res.status(200).json({
        examId: id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        totalQuestions: questions.length,
        questions: payload,
      });
    } catch (error) {
      console.error("Get exam questions failed:", error);
      return res.status(500).json({ error: "Unable to retrieve examination questions." });
    }
  });

  // FR-19: Automatic result release at configured time (VAL-F09, VAL-F10; SEC-06)
  router.get("/:id/results", async (req, res) => {
    const { id } = req.params;
    const studentId = req.auth?.userId;
    const isTeacherOrAdmin = req.auth?.role === "TEACHER" || req.auth?.role === "ADMIN";

    try {
      const exam = await examRepo.findExamById(id);
      if (!exam) {
        return res.status(404).json({ error: "Examination not found." });
      }

      const attempt = await examRepo.findAttempt(id, studentId);
      if (!attempt && !isTeacherOrAdmin) {
        return res.status(404).json({ error: "No completed attempt found for this examination." });
      }

      // Check configured result release time
      const now = Date.now();
      const hasReleaseTime = exam.resultReleaseTime !== null && exam.resultReleaseTime !== undefined;
      const isPastReleaseTime = hasReleaseTime ? now >= new Date(exam.resultReleaseTime).getTime() : true;

      // If student checks before release time, hide results (SEC-06)
      if (!isTeacherOrAdmin && !isPastReleaseTime) {
        return res.status(200).json({
          isReleased: false,
          examId: id,
          examTitle: exam.title,
          releaseTime: exam.resultReleaseTime,
          message: "Results are not yet released. Please check back after the scheduled release time.",
        });
      }

      // Result is released or user is authorized teacher/admin
      return res.status(200).json({
        isReleased: true,
        examId: id,
        examTitle: exam.title,
        score: attempt ? attempt.score : null,
        totalMarks: attempt ? attempt.totalMarks : null,
        percentage: attempt && attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0,
        submittedAt: attempt ? attempt.submittedAt : null,
        status: attempt ? attempt.status : "NO_ATTEMPT",
      });
    } catch (error) {
      console.error("Get exam results failed:", error);
      return res.status(500).json({ error: "Unable to retrieve examination results." });
    }
  });

  // FR-20: View examination reports (VAL-F14)
  // Authorized roles: TEACHER, ADMIN only. Students denied with 403.
  router.get("/:id/report", async (req, res) => {
    if (req.auth?.role !== "TEACHER" && req.auth?.role !== "ADMIN") {
      return res.status(403).json({
        error: "Forbidden: only teachers and administrators may view examination reports.",
      });
    }

    const { id } = req.params;
    try {
      const exam = await examRepo.findExamById(id);
      if (!exam) {
        return res.status(404).json({ error: "Examination not found." });
      }

      const attempts = (await examRepo.listAttemptsByExam(id)) || [];
      const questions = (await examRepo.getExamQuestions(id)) || [];

      const totalAttempts = attempts.length;
      let averageScore = 0;
      let highestScore = 0;
      let lowestScore = 0;
      let medianScore = 0;
      let passCount = 0;

      if (totalAttempts > 0) {
        const scores = attempts.map((a) => a.score).sort((a, b) => a - b);
        const sum = scores.reduce((acc, curr) => acc + curr, 0);
        averageScore = Number((sum / totalAttempts).toFixed(2));
        highestScore = scores[scores.length - 1];
        lowestScore = scores[0];

        const mid = Math.floor(scores.length / 2);
        medianScore = scores.length % 2 !== 0 ? scores[mid] : Number(((scores[mid - 1] + scores[mid]) / 2).toFixed(2));

        const passThreshold = (exam.questionCount || 1) * 0.5;
        passCount = attempts.filter((a) => a.score >= passThreshold).length;
      }

      const passRate = totalAttempts > 0 ? Number(((passCount / totalAttempts) * 100).toFixed(1)) : 0;

      // Difficulty distribution
      const difficultyCounts = { EASY: 0, MEDIUM: 0, HARD: 0 };
      questions.forEach((q) => {
        if (q.difficulty && difficultyCounts[q.difficulty] !== undefined) {
          difficultyCounts[q.difficulty]++;
        }
      });

      return res.status(200).json({
        report: {
          examId: id,
          title: exam.title,
          isPublished: exam.isPublished,
          durationMinutes: exam.durationMinutes,
          startTime: exam.startTime,
          endTime: exam.endTime,
          resultReleaseTime: exam.resultReleaseTime,
          totalQuestions: questions.length,
          questionDifficulty: difficultyCounts,
          statistics: {
            totalAttempts,
            averageScore,
            highestScore,
            lowestScore,
            medianScore,
            passCount,
            failCount: totalAttempts - passCount,
            passRate,
          },
          attempts: attempts.map((att) => ({
            id: att.id,
            studentName: att.student?.name || "Candidate",
            score: att.score,
            totalMarks: att.totalMarks,
            submittedAt: att.submittedAt,
          })),
        },
      });
    } catch (error) {
      console.error("Generate exam report failed:", error);
      return res.status(500).json({ error: "Unable to generate examination report." });
    }
  });

  // Record an attempt (Helper for attempt flows & testing)
  router.post("/:id/attempts", async (req, res) => {
    const { id } = req.params;
    const studentId = req.auth?.userId || req.body?.studentId;
    const { score, totalMarks, answers } = req.body ?? {};

    try {
      const attempt = await examRepo.recordAttempt({
        examId: id,
        studentId,
        score: score ?? 0,
        totalMarks: totalMarks ?? 0,
        answers: answers ?? null,
      });
      return res.status(201).json({ message: "Attempt recorded.", attempt });
    } catch (error) {
      console.error("Record attempt failed:", error);
      return res.status(500).json({ error: "Unable to record attempt." });
    }
  });

  return router;
}
