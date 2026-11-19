import express from "express";
import { selectRandomQuestions, shuffleQuestionsForAttempt } from "../services/questionSelection.js";
import { evaluateObjectiveAnswers } from "../services/objectiveScoring.js";

export function createExamRouter({ examRepo, questionRepo, audit, permissions }) {
  const log = (...args) => (audit ? audit.log(...args) : undefined);
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
      durationMinutes,
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

      const examPayload = {
        title: title.trim(),
        questionCount,
        questionPoolId: normalizedPoolId,
      };
      if (timing.parsedDuration !== undefined) examPayload.durationMinutes = timing.parsedDuration;
      if (timing.parsedStart !== undefined) examPayload.startTime = timing.parsedStart;
      if (timing.parsedEnd !== undefined) examPayload.endTime = timing.parsedEnd;
      if (timing.parsedRelease !== undefined) examPayload.resultReleaseTime = timing.parsedRelease;

      const exam = await examRepo.createExam(examPayload);
      await log(req, "exam.create", "Exam", exam?.id, { title: examPayload.title });

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
    if (req.auth?.role !== "TEACHER" && req.auth?.role !== "ADMIN") {
      return res.status(403).json({ error: "Only teachers and administrators can view examination details." });
    }

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

      const pool = await examRepo.findQuestionPoolById(exam.questionPoolId);
      if (!pool) {
        return res.status(404).json({ error: "Selected question pool was not found." });
      }

      const poolQuestions = pool.questions || (questionRepo ? await questionRepo.listQuestions(exam.questionPoolId) : []);
      if (!Array.isArray(poolQuestions) || poolQuestions.length === 0) {
        return res.status(400).json({ error: "Associated question pool or its questions could not be loaded." });
      }

      let selectedQuestions;
      try {
        selectedQuestions = selectRandomQuestions(poolQuestions, exam.questionCount);
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

      const selectedQuestionIds = selectedQuestions.map((q) => q.id);
      const publishedExam = await examRepo.publishExam(id, selectedQuestionIds);
      await log(req, "exam.publish", "Exam", id, { questions: selectedQuestionIds.length });

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

      if (isStudent) {
        const attempt = await examRepo.findActiveAttempt(id, req.auth.userId);
        if (!attempt) {
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
          return res.status(403).json({ error: "Start an examination attempt before viewing its questions." });
        }
      }

      let questions = await examRepo.getExamQuestions(id);

      // FR-11: Give each student attempt a stable shuffled presentation order.
      // The stored ExamQuestion order remains the common fixed set (FR-10).
      if (isStudent && typeof examRepo.countAttemptsByStudent === "function") {
        const studentId = req.auth?.userId;
        const completedAttempts = await examRepo.countAttemptsByStudent(id, studentId);
        questions = shuffleQuestionsForAttempt(
          questions,
          `${id}:${studentId}:${completedAttempts}`
        );
      }

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

      const now = Date.now();
      const hasReleaseTime = exam.resultReleaseTime !== null && exam.resultReleaseTime !== undefined;
      const isPastReleaseTime = hasReleaseTime ? now >= new Date(exam.resultReleaseTime).getTime() : true;

      if (!isTeacherOrAdmin && !isPastReleaseTime) {
        return res.status(200).json({
          isReleased: false,
          examId: id,
          examTitle: exam.title,
          releaseTime: exam.resultReleaseTime,
          message: "Results are not yet released. Please check back after the scheduled release time.",
        });
      }

      return res.status(200).json({
        isReleased: true,
        examId: id,
        examTitle: exam.title,
        score: attempt ? attempt.score : null,
        totalMarks: attempt ? attempt.totalMarks : null,
        percentage: attempt && attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0,
        evaluation: attempt?.evaluation || null,
        submittedAt: attempt ? attempt.submittedAt : null,
        status: attempt ? attempt.status : "NO_ATTEMPT",
      });
    } catch (error) {
      console.error("Get exam results failed:", error);
      return res.status(500).json({ error: "Unable to retrieve examination results." });
    }
  });

  // FR-20: View examination reports (VAL-F14)
  router.get("/:id/report", async (req, res) => {
    const canViewReports = permissions
      ? await permissions.has(req.auth?.role, "report.view")
      : req.auth?.role === "TEACHER" || req.auth?.role === "ADMIN";
    if (!canViewReports) {
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

      const rawAttempts = (await examRepo.listAttemptsByExam(id)) || [];
      const attempts = rawAttempts.filter(
        (a) => a.status === "SUBMITTED" || (a.status !== "IN_PROGRESS" && a.submittedAt)
      );
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

  // Start an exam attempt (records start time to enforce exam duration)
  router.post("/:id/start", async (req, res) => {
    // 1. Only students can start examinations
    if (req.auth?.role !== "STUDENT") {
      return res.status(403).json({ error: "Only students can start examinations." });
    }

    // Student id comes only from the login token
    const studentId = req.auth?.userId;
    if (!studentId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    try {
      const exam = await examRepo.findExamById(id);
      if (!exam) {
        return res.status(404).json({ error: "Examination not found." });
      }

      // Exam must be published
      if (!exam.isPublished) {
        return res.status(403).json({ error: "Examination is not published." });
      }

      // Exam must be inside its availability window
      const now = Date.now();
      if (exam.startTime && now < new Date(exam.startTime).getTime()) {
        return res.status(403).json({
          error: "Examination is not yet available.",
          startTime: exam.startTime,
        });
      }
      if (exam.endTime && now > new Date(exam.endTime).getTime()) {
        return res.status(403).json({
          error: "Examination availability period has ended.",
          endTime: exam.endTime,
        });
      }

      // Check for already submitted attempt
      const existingAttempt = await examRepo.findAttempt(id, studentId);
      if (existingAttempt) {
        if (existingAttempt.status !== "IN_PROGRESS") {
          return res.status(409).json({ error: "You have already submitted an attempt for this examination." });
        }
        return res.status(200).json({
          message: "Examination already started.",
          attempt: existingAttempt,
        });
      }

      // The server sets startedAt itself using the server clock; client-supplied startedAt is ignored
      const startedAt = new Date();

      let attempt;
      if (typeof examRepo.startAttempt === "function") {
        attempt = await examRepo.startAttempt({ examId: id, studentId, startedAt });
      } else {
        attempt = await examRepo.recordAttempt({
          examId: id,
          studentId,
          score: 0,
          totalMarks: 0,
          status: "IN_PROGRESS",
          startedAt,
        });
      }

      return res.status(201).json({
        message: "Examination started.",
        attempt,
      });
    } catch (error) {
      console.error("Start examination failed:", error);
      return res.status(500).json({ error: "Unable to start examination." });
    }
  });

  // Submit an attempt
  router.post("/:id/attempts", async (req, res) => {
    // 1. Only students can submit
    if (req.auth?.role !== "STUDENT") {
      return res.status(403).json({ error: "Only students can submit examination attempts." });
    }

    // 5. The student id comes only from the login token
    const studentId = req.auth?.userId;
    if (!studentId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    const { answers = {} } = req.body ?? {};

    if (answers === null || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers must be an object keyed by question ID." });
    }

    try {
      const exam = await examRepo.findExamById(id);
      if (!exam) {
        return res.status(404).json({ error: "Examination not found." });
      }

      // 3. The exam must be published and current time must be inside its availability window
      if (!exam.isPublished) {
        return res.status(403).json({ error: "Examination is not published." });
      }

      const now = Date.now();
      if (exam.startTime && now < new Date(exam.startTime).getTime()) {
        return res.status(403).json({
          error: "Examination is not yet available.",
          startTime: exam.startTime,
        });
      }
      if (exam.endTime && now > new Date(exam.endTime).getTime()) {
        return res.status(403).json({
          error: "Examination availability period has ended.",
          endTime: exam.endTime,
        });
      }

      // 4. Submit requires an existing IN_PROGRESS attempt
      const existingAttempt = await examRepo.findAttempt(id, studentId);
      if (!existingAttempt) {
        return res.status(400).json({
          error: "No active examination attempt found. You must start the examination before submitting.",
        });
      }
      if (existingAttempt.status === "SUBMITTED" || existingAttempt.submittedAt) {
        return res.status(409).json({ error: "You have already submitted an attempt for this examination." });
      }
      if (existingAttempt.status !== "IN_PROGRESS") {
        return res.status(400).json({
          error: "No active examination attempt found. You must start the examination before submitting.",
        });
      }

      // 6. Enforce exam duration: reject late submissions
      if (existingAttempt.startedAt && exam.durationMinutes) {
        const startedAtMs = new Date(existingAttempt.startedAt).getTime();
        const durationMs = exam.durationMinutes * 60 * 1000;
        const graceMs = 30 * 1000; // 30-second network latency grace period
        if (now - startedAtMs > durationMs + graceMs) {
          return res.status(403).json({
            error: "Examination duration has expired. Late submissions are not accepted.",
            durationMinutes: exam.durationMinutes,
            startedAt: existingAttempt.startedAt,
          });
        }
      }

      // Score only answers for questions in this exam's fixed question set.
      const questions = (await examRepo.getExamQuestions(id)) || [];
      const selectedQuestionIds = new Set(questions.map((question) => question.id));
      for (const [questionId, answer] of Object.entries(answers)) {
        if (!selectedQuestionIds.has(questionId) || !["string", "number"].includes(typeof answer)) {
          return res.status(400).json({ error: "Answers must reference selected exam questions and contain a choice." });
        }
      }

      const { score, totalMarks, evaluation } = evaluateObjectiveAnswers(questions, answers);

      const attempt = await examRepo.recordAttempt({
        examId: id,
        studentId,
        score,
        totalMarks,
        answers,
        evaluation,
        startedAt: existingAttempt?.startedAt,
      });
      await log(req, "attempt.submit", "Exam", id, { score, totalMarks });

      return res.status(201).json({
        message: "Attempt recorded successfully.",
        attempt,
      });
    } catch (error) {
      console.error("Record attempt failed:", error);
      return res.status(500).json({ error: "Unable to record attempt." });
    }
  });

  return router;
}
