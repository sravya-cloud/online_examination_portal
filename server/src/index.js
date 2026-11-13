import "dotenv/config";
import { createApp } from "./app.js";
import { createPrismaExamRepository } from "./repositories/examRepository.js";
import { createPrismaUserRepository } from "./repositories/userRepository.js";

const PORT = process.env.PORT || 5000;

const app = createApp({
  userRepo: createPrismaUserRepository(),
  examRepo: createPrismaExamRepository(),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  corsOrigin: process.env.CORS_ORIGIN,
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
