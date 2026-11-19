import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { signToken } from "../src/auth/tokens.js";

const SECRET = "test-secret-at-least-thirty-two-chars-long";

const token = (role, id) =>
  signToken({ id, role, email: `${role.toLowerCase()}@example.com` }, { secret: SECRET });

function makeRepos() {
  const users = [
    { id: 1, name: "Admin", email: "admin@example.com", passwordHash: "x", role: "ADMIN", isActive: true, createdAt: new Date() },
    { id: 2, name: "Teacher", email: "teacher@example.com", passwordHash: "x", role: "TEACHER", isActive: true, createdAt: new Date() },
    { id: 3, name: "Student", email: "student@example.com", passwordHash: "x", role: "STUDENT", isActive: true, createdAt: new Date() },
  ];
  const logs = [];
  const settingRows = [];
  const overrides = [];
  return {
    users,
    logs,
    userRepo: {
      async findByEmail(email) { return users.find((u) => u.email === email) || null; },
      async findById(id) { return users.find((u) => u.id === id) || null; },
      async list({ role }) { return users.filter((u) => !role || u.role === role); },
      async create(data) {
        const user = { id: users.length + 1, isActive: true, createdAt: new Date(), ...data };
        users.push(user);
        return user;
      },
      async update(id, data) {
        const index = users.findIndex((u) => u.id === id);
        users[index] = { ...users[index], ...data };
        return users[index];
      },
    },
    auditRepo: {
      async record(entry) { logs.push({ id: logs.length + 1, ...entry }); },
      async list({ action }) { return logs.filter((l) => !action || l.action === action).reverse(); },
    },
    settingsRepo: {
      async listAll() { return settingRows; },
      async upsert(key, value) {
        const row = settingRows.find((r) => r.key === key);
        if (row) row.value = value;
        else settingRows.push({ key, value });
      },
    },
    permissionRepo: {
      async listOverrides() { return overrides; },
      async setOverride(role, permission, granted) {
        const row = overrides.find((o) => o.role === role && o.permission === permission);
        if (row) row.granted = granted;
        else overrides.push({ role, permission, granted });
      },
    },
  };
}

async function startServer(extra = {}) {
  const repos = makeRepos();
  const app = createApp({
    userRepo: repos.userRepo,
    auditRepo: repos.auditRepo,
    settingsRepo: repos.settingsRepo,
    permissionRepo: repos.permissionRepo,
    jwtSecret: SECRET,
    ...extra,
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, who, body) => {
    const headers = { "Content-Type": "application/json" };
    if (who) headers.Authorization = `Bearer ${who}`;
    const res = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };
  return { repos, call, close: () => new Promise((r) => server.close(r)) };
}

const ADMIN = token("ADMIN", 1);

test("FR-03: only administrators can use the admin endpoints", async () => {
  const { call, close } = await startServer();
  try {
    assert.equal((await call("GET", "/api/admin/users")).status, 401);
    assert.equal((await call("GET", "/api/admin/users", token("TEACHER", 2))).status, 403);
    assert.equal((await call("GET", "/api/admin/users", token("STUDENT", 3))).status, 403);
    assert.equal((await call("GET", "/api/admin/settings", token("TEACHER", 2))).status, 403);
    assert.equal((await call("GET", "/api/admin/audit-logs", token("STUDENT", 3))).status, 403);
  } finally { await close(); }
});

test("FR-03: administrator lists users without password hashes and filters by role", async () => {
  const { call, close } = await startServer();
  try {
    const all = await call("GET", "/api/admin/users", ADMIN);
    assert.equal(all.status, 200);
    assert.equal(all.body.users.length, 3);
    assert.ok(all.body.users.every((u) => !("passwordHash" in u)));
    const students = await call("GET", "/api/admin/users?role=STUDENT", ADMIN);
    assert.deepEqual(students.body.users.map((u) => u.role), ["STUDENT"]);
    assert.equal((await call("GET", "/api/admin/users?role=BOSS", ADMIN)).status, 400);
    assert.equal((await call("GET", "/api/admin/users/2", ADMIN)).body.user.email, "teacher@example.com");
    assert.equal((await call("GET", "/api/admin/users/99", ADMIN)).status, 404);
  } finally { await close(); }
});

test("FR-03: administrator creates a user whose password is stored hashed", async () => {
  const { call, close, repos } = await startServer();
  try {
    const res = await call("POST", "/api/admin/users", ADMIN, {
      name: "New Student",
      email: "  New@Example.com ",
      password: "longenough1",
      role: "STUDENT",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, "new@example.com");
    assert.ok(!("passwordHash" in res.body.user));
    const stored = repos.users.find((u) => u.email === "new@example.com");
    assert.notEqual(stored.passwordHash, "longenough1");
    assert.ok(await bcrypt.compare("longenough1", stored.passwordHash));
  } finally { await close(); }
});

test("FR-03: creating a user validates input and rejects duplicate emails", async () => {
  const { call, close } = await startServer();
  try {
    const bad = await call("POST", "/api/admin/users", ADMIN, {
      name: "", email: "nope", password: "short", role: "BOSS",
    });
    assert.equal(bad.status, 400);
    assert.deepEqual(Object.keys(bad.body.details).sort(), ["email", "name", "password", "role"]);
    const dup = await call("POST", "/api/admin/users", ADMIN, {
      name: "Copy", email: "student@example.com", password: "longenough1", role: "STUDENT",
    });
    assert.equal(dup.status, 409);
  } finally { await close(); }
});

test("FR-03: administrator changes a role and disables a user, who can no longer log in", async () => {
  const { call, close } = await startServer();
  try {
    const role = await call("PATCH", "/api/admin/users/3", ADMIN, { role: "TEACHER" });
    assert.equal(role.body.user.role, "TEACHER");
    const off = await call("PATCH", "/api/admin/users/3", ADMIN, { isActive: false });
    assert.equal(off.body.user.isActive, false);
    const login = await call("POST", "/api/auth/teacher/login", undefined, {
      email: "student@example.com", password: "anything",
    });
    assert.equal(login.status, 401);
    const on = await call("PATCH", "/api/admin/users/3", ADMIN, { isActive: true });
    assert.equal(on.body.user.isActive, true);
  } finally { await close(); }
});

test("FR-03: update validation, missing users and self-protection", async () => {
  const { call, close } = await startServer();
  try {
    assert.equal((await call("PATCH", "/api/admin/users/3", ADMIN, {})).status, 400);
    assert.equal((await call("PATCH", "/api/admin/users/3", ADMIN, { role: "BOSS" })).status, 400);
    assert.equal((await call("PATCH", "/api/admin/users/99", ADMIN, { name: "X" })).status, 404);
    assert.equal((await call("PATCH", "/api/admin/users/abc", ADMIN, { name: "X" })).status, 400);
    assert.equal((await call("PATCH", "/api/admin/users/1", ADMIN, { isActive: false })).status, 400);
    assert.equal((await call("PATCH", "/api/admin/users/1", ADMIN, { role: "TEACHER" })).status, 400);
    assert.equal((await call("PATCH", "/api/admin/users/1", ADMIN, { name: "Renamed" })).status, 200);
  } finally { await close(); }
});

test("FR-23: administrator views defaults and changes approved settings only", async () => {
  const { call, close } = await startServer();
  try {
    const initial = await call("GET", "/api/admin/settings", ADMIN);
    assert.equal(initial.body.settings.defaultExamDurationMinutes, 60);
    assert.equal(initial.body.settings.institutionName, "Online Examination Portal");

    const updated = await call("PUT", "/api/admin/settings", ADMIN, {
      institutionName: "PES University",
      defaultExamDurationMinutes: 90,
      supportEmail: "help@example.com",
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.settings.institutionName, "PES University");
    assert.equal(updated.body.settings.defaultExamDurationMinutes, 90);
    assert.equal((await call("GET", "/api/admin/settings", ADMIN)).body.settings.supportEmail, "help@example.com");
  } finally { await close(); }
});

test("FR-23: invalid or unapproved settings are rejected and nothing is saved", async () => {
  const { call, close } = await startServer();
  try {
    const res = await call("PUT", "/api/admin/settings", ADMIN, {
      institutionName: "Valid Name",
      defaultExamDurationMinutes: 5000,
      jwtSecret: "hacked",
      supportEmail: "not-an-email",
    });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.details).sort(), ["defaultExamDurationMinutes", "jwtSecret", "supportEmail"]);
    const after = await call("GET", "/api/admin/settings", ADMIN);
    assert.equal(after.body.settings.institutionName, "Online Examination Portal");
    assert.equal((await call("PUT", "/api/admin/settings", ADMIN, {})).status, 400);
    assert.equal((await call("PUT", "/api/admin/settings", ADMIN, [1])).status, 400);
  } finally { await close(); }
});

test("FR-24: default permissions match the existing role behaviour", async () => {
  const { call, close } = await startServer();
  try {
    const { body } = await call("GET", "/api/admin/permissions", ADMIN);
    assert.equal(body.permissions.TEACHER["question.manage"], true);
    assert.equal(body.permissions.STUDENT["question.manage"], false);
    assert.equal(body.permissions.TEACHER["report.view"], true);
    assert.equal(body.permissions.STUDENT["report.view"], false);
  } finally { await close(); }
});

test("FR-24: a permission change takes effect for the affected role straight away", async () => {
  const questionRepo = { async listQuestions() { return []; }, async listPools() { return []; } };
  const { call, close } = await startServer({ questionRepo, examRepo: {} });
  try {
    const TEACHER = token("TEACHER", 2);
    const before = await call("GET", "/api/questions", TEACHER);
    assert.notEqual(before.status, 403);

    const off = await call("PUT", "/api/admin/permissions", ADMIN, {
      role: "TEACHER", permission: "question.manage", granted: false,
    });
    assert.equal(off.status, 200);
    assert.equal((await call("GET", "/api/questions", TEACHER)).status, 403);

    await call("PUT", "/api/admin/permissions", ADMIN, {
      role: "TEACHER", permission: "question.manage", granted: true,
    });
    assert.notEqual((await call("GET", "/api/questions", TEACHER)).status, 403);

    await call("PUT", "/api/admin/permissions", ADMIN, {
      role: "STUDENT", permission: "question.manage", granted: true,
    });
    assert.notEqual((await call("GET", "/api/questions", token("STUDENT", 3))).status, 403);
  } finally { await close(); }
});

test("FR-24: permission updates are validated and the report permission is enforced", async () => {
  const examRepo = { async findExamById() { return null; } };
  const { call, close } = await startServer({ examRepo });
  try {
    assert.equal((await call("PUT", "/api/admin/permissions", ADMIN, { role: "X", permission: "report.view", granted: true })).status, 400);
    assert.equal((await call("PUT", "/api/admin/permissions", ADMIN, { role: "TEACHER", permission: "nope", granted: true })).status, 400);
    assert.equal((await call("PUT", "/api/admin/permissions", ADMIN, { role: "TEACHER", permission: "report.view", granted: "yes" })).status, 400);

    const TEACHER = token("TEACHER", 2);
    assert.equal((await call("GET", "/api/exams/e1/report", TEACHER)).status, 404);
    await call("PUT", "/api/admin/permissions", ADMIN, { role: "TEACHER", permission: "report.view", granted: false });
    assert.equal((await call("GET", "/api/exams/e1/report", TEACHER)).status, 403);
  } finally { await close(); }
});

test("NFR-12: admin actions are written to the audit log with the acting admin", async () => {
  const { call, close } = await startServer();
  try {
    await call("POST", "/api/admin/users", ADMIN, { name: "A", email: "a@example.com", password: "longenough1", role: "STUDENT" });
    await call("PATCH", "/api/admin/users/3", ADMIN, { role: "TEACHER" });
    await call("PATCH", "/api/admin/users/3", ADMIN, { isActive: false });
    await call("PUT", "/api/admin/settings", ADMIN, { defaultExamDurationMinutes: 45 });
    await call("PUT", "/api/admin/permissions", ADMIN, { role: "TEACHER", permission: "report.view", granted: false });

    const { status, body } = await call("GET", "/api/admin/audit-logs", ADMIN);
    assert.equal(status, 200);
    const actions = body.logs.map((l) => l.action);
    for (const a of ["user.create", "user.update", "user.role_change", "user.disable", "settings.update", "permission.change"]) {
      assert.ok(actions.includes(a), `missing ${a}`);
    }
    assert.ok(body.logs.every((l) => l.actorId === 1));
    const filtered = await call("GET", "/api/admin/audit-logs?action=user.create", ADMIN);
    assert.equal(filtered.body.logs.length, 1);
    assert.ok(!JSON.stringify(body.logs).includes("longenough1"));
  } finally { await close(); }
});

test("NFR-12: exam creation, publishing and submission are audited", async () => {
  const examRepo = {
    async findQuestionPoolById() { return { id: "p1", questions: [{ id: "q1", correctAnswer: "a", options: ["a", "b"] }] }; },
    async createExam(p) { return { id: "e1", ...p }; },
    async findExamById() { return { id: "e1", questionPoolId: "p1", questionCount: 1, isPublished: true, durationMinutes: 60 }; },
    async publishExam() { return { id: "e1", isPublished: true }; },
    async findAttempt() { return { status: "IN_PROGRESS", startedAt: new Date() }; },
    async getExamQuestions() { return [{ id: "q1", correctAnswer: "a", options: ["a", "b"] }]; },
    async recordAttempt(a) { return { id: "at1", ...a }; },
  };
  const { call, close, repos } = await startServer({ examRepo });
  try {
    const TEACHER = token("TEACHER", 2);
    const create = await call("POST", "/api/exams", TEACHER, { title: "Quiz", questionCount: 1, questionPoolId: "p1" });
    assert.equal(create.status, 201);
    assert.equal((await call("POST", "/api/exams/e1/publish", TEACHER)).status, 200);
    const submit = await call("POST", "/api/exams/e1/attempts", token("STUDENT", 3), { answers: { q1: "a" } });
    assert.equal(submit.status, 201);
    const logged = repos.logs.map((l) => `${l.action}:${l.actorId}`);
    assert.deepEqual(logged, ["exam.create:2", "exam.publish:2", "attempt.submit:3"]);
  } finally { await close(); }
});

test("NFR-12: a failing audit store never blocks the admin action", async () => {
  const { call, close, repos } = await startServer();
  repos.auditRepo.record = async () => { throw new Error("db down"); };
  const original = console.error;
  console.error = () => {};
  try {
    const res = await call("POST", "/api/admin/users", ADMIN, { name: "B", email: "b@example.com", password: "longenough1", role: "STUDENT" });
    assert.equal(res.status, 201);
  } finally { console.error = original; await close(); }
});
