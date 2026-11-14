import express from "express";
import cors from "cors";
import { assertSecret } from "./auth/tokens.js";
import { createLoginLimiter } from "./auth/rateLimiter.js";
import { authenticate, requireRole } from "./middleware/auth.js";
import { createAuthRouter } from "./routes/auth.js";
import { createExamRouter } from "./routes/exams.js";
import { createQuestionRouter } from "./routes/questions.js";

export function createApp({
  userRepo,
  examRepo,
  questionRepo,
  jwtSecret,
  jwtExpiresIn = "1h",
  limiter = createLoginLimiter(),
  corsOrigin,
}) {
  assertSecret(jwtSecret);

  const app = express();
  app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    "/api/auth",
    createAuthRouter({
      userRepo,
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
      limiter,
    })
  );

  if (examRepo) {
    app.use(
      "/api/exams",
      authenticate({ secret: jwtSecret }),
      createExamRouter({ examRepo, questionRepo })
    );
  }

  if (questionRepo) {
    app.use(
      "/api/questions",
      authenticate({ secret: jwtSecret }),
      requireRole("TEACHER"),
      createQuestionRouter({ questionRepo, examRepo })
    );
  }

  // Role-protected landing endpoints (NFR-01). Later sprints replace these
  // stubs with the real student, teacher and admin features.
  const guard = (role) => [authenticate({ secret: jwtSecret }), requireRole(role)];
  app.get("/api/student/dashboard", ...guard("STUDENT"), (req, res) =>
    res.json({ portal: "student" })
  );
  app.get("/api/teacher/dashboard", ...guard("TEACHER"), (req, res) =>
    res.json({ portal: "teacher" })
  );
  app.get("/api/admin/dashboard", ...guard("ADMIN"), (req, res) =>
    res.json({ portal: "admin" })
  );

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  });

  return app;
}
