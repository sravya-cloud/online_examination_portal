import { Router } from "express";
import bcrypt from "bcryptjs";
import { signToken } from "../auth/tokens.js";
import { authenticate } from "../middleware/auth.js";

// Valid hash of a random string; compared when the email is unknown so the
// response time does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const PORTALS = {
  student: "STUDENT", // FR-01
  teacher: "TEACHER", // FR-02
  admin: "ADMIN", // FR-22
};

const INVALID = { error: "Invalid email or password" };

export function createAuthRouter({ userRepo, secret, expiresIn, limiter }) {
  const router = Router();

  router.post("/:portal/login", async (req, res, next) => {
    try {
      const role = PORTALS[req.params.portal];
      if (!role) return res.status(404).json({ error: "Not found" });

      const email =
        typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const key = `${req.ip}|${email}`;
      if (limiter.isBlocked(key)) {
        return res
          .status(429)
          .json({ error: "Too many failed attempts. Try again later." });
      }

      const user = await userRepo.findByEmail(email);
      const hash = user ? user.passwordHash : DUMMY_HASH;
      const passwordOk = await bcrypt.compare(password, hash);

      if (!user || !passwordOk || user.role !== role || !user.isActive) {
        limiter.recordFailure(key);
        return res.status(401).json(INVALID);
      }

      limiter.reset(key);
      const token = signToken(user, { secret, expiresIn });
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      return next(err);
    }
  });

  router.get("/me", authenticate({ secret }), async (req, res, next) => {
    try {
      const user = await userRepo.findById(req.auth.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }
      return res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
