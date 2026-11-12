import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { createLoginLimiter } from "../src/auth/rateLimiter.js";

const SECRET = "x".repeat(40);
const PASSWORD = "correct-horse-battery";

function makeUsers() {
  const hash = bcrypt.hashSync(PASSWORD, 4);
  return [
    { id: 1, email: "student@test.com", name: "S", role: "STUDENT", isActive: true, passwordHash: hash },
    { id: 2, email: "teacher@test.com", name: "T", role: "TEACHER", isActive: true, passwordHash: hash },
    { id: 3, email: "admin@test.com", name: "A", role: "ADMIN", isActive: true, passwordHash: hash },
    { id: 4, email: "off@test.com", name: "Off", role: "STUDENT", isActive: false, passwordHash: hash },
  ];
}

async function start(options = {}) {
  const users = makeUsers();
  const userRepo = {
    findByEmail: async (email) => users.find((u) => u.email === email) || null,
    findById: async (id) => users.find((u) => u.id === id) || null,
  };
  const app = createApp({ userRepo, jwtSecret: SECRET, ...options });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = "GET", body, token } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
  };
  return { call, close: () => server.close() };
}

const login = (call, portal, email, password = PASSWORD) =>
  call(`/api/auth/${portal}/login`, { method: "POST", body: { email, password } });

test("each role can log in through its own portal", async () => {
  const { call, close } = await start();
  try {
    for (const [portal, email, role] of [
      ["student", "student@test.com", "STUDENT"],
      ["teacher", "teacher@test.com", "TEACHER"],
      ["admin", "admin@test.com", "ADMIN"],
    ]) {
      const res = await login(call, portal, email);
      assert.equal(res.status, 200);
      assert.equal(res.body.user.role, role);
      assert.ok(res.body.token);
      assert.equal(JSON.stringify(res.body).includes("passwordHash"), false);
    }
  } finally {
    close();
  }
});

test("email is case-insensitive and trimmed", async () => {
  const { call, close } = await start();
  try {
    const res = await login(call, "student", "  Student@Test.com ");
    assert.equal(res.status, 200);
  } finally {
    close();
  }
});

test("wrong password, unknown user, wrong portal and inactive user all get the same 401", async () => {
  const { call, close } = await start();
  try {
    const results = [
      await login(call, "student", "student@test.com", "wrong-password"),
      await login(call, "student", "nobody@test.com"),
      await login(call, "teacher", "student@test.com"),
      await login(call, "student", "off@test.com"),
    ];
    for (const r of results) {
      assert.equal(r.status, 401);
      assert.deepEqual(r.body, { error: "Invalid email or password" });
    }
  } finally {
    close();
  }
});

test("missing fields return 400 and unknown portal returns 404", async () => {
  const { call, close } = await start();
  try {
    const missing = await call("/api/auth/student/login", { method: "POST", body: { email: "a@b.com" } });
    assert.equal(missing.status, 400);
    const portal = await login(call, "owner", "student@test.com");
    assert.equal(portal.status, 404);
  } finally {
    close();
  }
});

test("/me returns the logged-in user and requires a token", async () => {
  const { call, close } = await start();
  try {
    const { body } = await login(call, "teacher", "teacher@test.com");
    const me = await call("/api/auth/me", { token: body.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, "teacher@test.com");
    assert.equal((await call("/api/auth/me")).status, 401);
  } finally {
    close();
  }
});

test("dashboards enforce roles", async () => {
  const { call, close } = await start();
  try {
    const student = (await login(call, "student", "student@test.com")).body.token;
    assert.equal((await call("/api/student/dashboard", { token: student })).status, 200);
    assert.equal((await call("/api/teacher/dashboard", { token: student })).status, 403);
    assert.equal((await call("/api/admin/dashboard", { token: student })).status, 403);
    assert.equal((await call("/api/student/dashboard")).status, 401);
  } finally {
    close();
  }
});

test("expired and tampered tokens are rejected", async () => {
  const { call, close } = await start();
  try {
    const expired = jwt.sign({ role: "ADMIN" }, SECRET, { subject: "3", expiresIn: -10 });
    const forged = jwt.sign({ role: "ADMIN" }, "y".repeat(40), { subject: "3" });
    assert.equal((await call("/api/admin/dashboard", { token: expired })).status, 401);
    assert.equal((await call("/api/admin/dashboard", { token: forged })).status, 401);
    assert.equal((await call("/api/admin/dashboard", { token: "garbage" })).status, 401);
  } finally {
    close();
  }
});

test("repeated failures are rate limited", async () => {
  const limiter = createLoginLimiter({ maxAttempts: 3 });
  const { call, close } = await start({ limiter });
  try {
    for (let i = 0; i < 3; i++) {
      assert.equal((await login(call, "student", "student@test.com", "bad-password")).status, 401);
    }
    assert.equal((await login(call, "student", "student@test.com")).status, 429);
  } finally {
    close();
  }
});

test("short JWT secrets are refused", () => {
  assert.throws(() => createApp({ userRepo: {}, jwtSecret: "short" }));
});

test("unknown routes return a JSON 404", async () => {
  const { call, close } = await start();
  try {
    const res = await call("/api/nope");
    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: "Not found" });
  } finally {
    close();
  }
});
