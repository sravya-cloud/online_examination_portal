import { verifyToken } from "../auth/tokens.js";

// NFR-01: protected routes need a valid, unexpired token.
export function authenticate({ secret }) {
  return (req, res, next) => {
    const header = req.get("authorization") || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const payload = verifyToken(token, { secret });
      req.auth = { userId: Number(payload.sub), role: payload.role };
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  };
}

// NFR-01: role-based authorization (Student / Teacher / Administrator).
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "You do not have access to this resource" });
    }
    return next();
  };
}
