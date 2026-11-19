import { Router } from "express";
import bcrypt from "bcryptjs";
import { APPROVED_SETTINGS, validateSetting } from "../services/settings.js";
import { PERMISSION_CATALOG, ROLES } from "../services/permissions.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function pageParams(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

// Every route here is mounted behind authenticate + requireRole("ADMIN").
export function createAdminRouter({ userRepo, settings, permissions, audit }) {
  const router = Router();

  // ---- FR-03: manage users and roles ----

  router.get("/users", async (req, res, next) => {
    try {
      const role = req.query.role;
      if (role !== undefined && !ROLES.includes(role)) {
        return res.status(400).json({ error: "Role must be STUDENT, TEACHER or ADMIN" });
      }
      const users = await userRepo.list({ role, ...pageParams(req.query) });
      return res.json({ users: users.map(publicUser) });
    } catch (err) {
      return next(err);
    }
  });

  router.get("/users/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user id" });
      const user = await userRepo.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user: publicUser(user) });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/users", async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body ?? {};
      const details = {};
      if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
        details.name = "Name is required (up to 100 characters).";
      }
      const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
      if (!EMAIL.test(cleanEmail)) details.email = "A valid email is required.";
      if (typeof password !== "string" || password.length < 8 || password.length > 72) {
        details.password = "Password must be 8 to 72 characters.";
      }
      if (!ROLES.includes(role)) details.role = "Role must be STUDENT, TEACHER or ADMIN.";
      if (Object.keys(details).length > 0) {
        return res.status(400).json({ error: "Invalid user details.", details });
      }

      if (await userRepo.findByEmail(cleanEmail)) {
        return res.status(409).json({ error: "A user with this email already exists" });
      }

      let user;
      try {
        user = await userRepo.create({
          name: name.trim(),
          email: cleanEmail,
          passwordHash: await bcrypt.hash(password, 10),
          role,
        });
      } catch (err) {
        if (err?.code === "P2002") {
          return res.status(409).json({ error: "A user with this email already exists" });
        }
        throw err;
      }

      await audit.log(req, "user.create", "User", user.id, { email: user.email, role: user.role });
      return res.status(201).json({ user: publicUser(user) });
    } catch (err) {
      return next(err);
    }
  });

  // Update name, role, active state (disable/enable) or reset the password.
  router.patch("/users/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user id" });

      const body = req.body ?? {};
      const data = {};
      const details = {};

      if (body.name !== undefined) {
        if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) {
          details.name = "Name must be 1 to 100 characters.";
        } else data.name = body.name.trim();
      }
      if (body.role !== undefined) {
        if (!ROLES.includes(body.role)) details.role = "Role must be STUDENT, TEACHER or ADMIN.";
        else data.role = body.role;
      }
      if (body.isActive !== undefined) {
        if (typeof body.isActive !== "boolean") details.isActive = "isActive must be true or false.";
        else data.isActive = body.isActive;
      }
      if (body.password !== undefined) {
        if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 72) {
          details.password = "Password must be 8 to 72 characters.";
        } else data.passwordHash = await bcrypt.hash(body.password, 10);
      }
      if (Object.keys(details).length > 0) {
        return res.status(400).json({ error: "Invalid user details.", details });
      }
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "Nothing to update" });
      }

      const existing = await userRepo.findById(id);
      if (!existing) return res.status(404).json({ error: "User not found" });

      // An administrator cannot remove their own access.
      if (id === req.auth.userId) {
        if (data.isActive === false) {
          return res.status(400).json({ error: "You cannot disable your own account" });
        }
        if (data.role !== undefined && data.role !== existing.role) {
          return res.status(400).json({ error: "You cannot change your own role" });
        }
      }

      const user = await userRepo.update(id, data);

      const changed = Object.keys(data).map((k) => (k === "passwordHash" ? "password" : k));
      let action = "user.update";
      if (data.isActive === false) action = "user.disable";
      else if (data.isActive === true && !existing.isActive) action = "user.enable";
      await audit.log(req, action, "User", id, {
        changed,
        role: data.role,
        isActive: data.isActive,
      });
      if (data.role !== undefined && data.role !== existing.role) {
        await audit.log(req, "user.role_change", "User", id, { from: existing.role, to: data.role });
      }
      return res.json({ user: publicUser(user) });
    } catch (err) {
      return next(err);
    }
  });

  // ---- FR-23: system settings ----

  router.get("/settings", async (req, res, next) => {
    try {
      return res.json({
        settings: await settings.getAll(),
        definitions: APPROVED_SETTINGS,
      });
    } catch (err) {
      return next(err);
    }
  });

  router.put("/settings", async (req, res, next) => {
    try {
      const changes = req.body;
      if (!changes || typeof changes !== "object" || Array.isArray(changes) || !Object.keys(changes).length) {
        return res.status(400).json({ error: "Send an object of settings to change" });
      }
      const clean = {};
      const details = {};
      for (const [key, raw] of Object.entries(changes)) {
        const result = validateSetting(key, raw);
        if (result.error) details[key] = result.error;
        else clean[key] = result.value;
      }
      if (Object.keys(details).length > 0) {
        return res.status(400).json({ error: "Invalid settings.", details });
      }

      const before = await settings.getAll();
      await settings.update(clean, req.auth.userId);
      await audit.log(req, "settings.update", "Settings", null, {
        changes: Object.fromEntries(
          Object.entries(clean).map(([k, v]) => [k, { from: before[k], to: v }])
        ),
      });
      return res.json({ settings: await settings.getAll() });
    } catch (err) {
      return next(err);
    }
  });

  // ---- FR-24: role permissions ----

  router.get("/permissions", async (req, res, next) => {
    try {
      return res.json({ permissions: await permissions.matrix(), catalog: PERMISSION_CATALOG });
    } catch (err) {
      return next(err);
    }
  });

  router.put("/permissions", async (req, res, next) => {
    try {
      const { role, permission, granted } = req.body ?? {};
      if (!ROLES.includes(role)) {
        return res.status(400).json({ error: "Role must be STUDENT, TEACHER or ADMIN" });
      }
      if (!(permission in PERMISSION_CATALOG)) {
        return res.status(400).json({ error: "Unknown permission" });
      }
      if (typeof granted !== "boolean") {
        return res.status(400).json({ error: "granted must be true or false" });
      }
      const before = (await permissions.matrix())[role][permission];
      await permissions.set(role, permission, granted);
      await audit.log(req, "permission.change", "Role", role, { permission, from: before, to: granted });
      return res.json({ permissions: await permissions.matrix() });
    } catch (err) {
      return next(err);
    }
  });

  // ---- NFR-12: audit log ----

  router.get("/audit-logs", async (req, res, next) => {
    try {
      const action = typeof req.query.action === "string" ? req.query.action : undefined;
      const logs = await audit.list({ action, ...pageParams(req.query) });
      return res.json({ logs });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
