import jwt from "jsonwebtoken";

export const MIN_SECRET_LENGTH = 32;

export function assertSecret(secret) {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long`
    );
  }
}

// NFR-01: sessions expire. Tokens are short-lived and pinned to HS256.
export function signToken(user, { secret, expiresIn = "1h" }) {
  return jwt.sign({ role: user.role }, secret, {
    subject: String(user.id),
    expiresIn,
    algorithm: "HS256",
  });
}

export function verifyToken(token, { secret }) {
  return jwt.verify(token, secret, { algorithms: ["HS256"] });
}
