# Administrator features (FR-03, FR-23, FR-24, NFR-12)

All routes live under `/api/admin`, need a valid token, and are limited to the ADMIN role. Errors use `{ error }` (with `details` for field problems).

## FR-03 Manage users and roles (VAL-F15, VAL-F16, VAL-F18)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/users?role=&limit=&offset=` | List users (never returns password hashes) |
| GET | `/api/admin/users/:id` | One user |
| POST | `/api/admin/users` | Create a user: `name`, `email`, `password` (8 to 72 chars), `role` |
| PATCH | `/api/admin/users/:id` | Change `name`, `role`, `isActive` (disable or enable) or reset `password` |

Rules: emails are unique (409 if taken); passwords are stored as bcrypt hashes; an administrator cannot disable their own account or change their own role, so the portal always keeps an active admin. Disabled users cannot log in. A token issued before the account was disabled stays valid until it expires (1 hour).

## FR-23 System settings (VAL-F21)

`GET /api/admin/settings` returns the current values and the definitions. `PUT /api/admin/settings` changes one or more of the approved settings below. Any other key, or an invalid value, rejects the whole request and saves nothing.

| Key | Rule | Default |
|---|---|---|
| `institutionName` | 1 to 100 characters | Online Examination Portal |
| `supportEmail` | valid email or empty | empty |
| `defaultExamDurationMinutes` | whole number 5 to 300 | 60 |

## FR-24 Role permissions (VAL-F22)

`GET /api/admin/permissions` returns a role by permission table. `PUT /api/admin/permissions` with `{ role, permission, granted }` changes one cell. The next request from that role uses the new value (no restart or re-login). Editable permissions:

| Permission | Enforced on | Default |
|---|---|---|
| `question.manage` | `/api/questions` | TEACHER |
| `report.view` | `GET /api/exams/:id/report` | TEACHER, ADMIN |

Managing users, settings, permissions and the audit log always stays with administrators so an admin cannot lock themselves out.

## NFR-12 Audit log (VAL-N12)

`GET /api/admin/audit-logs?action=&limit=&offset=` returns newest first. Each entry has the acting user id, action, target and details. Passwords and answers are never written to the log. A failure to write a log entry does not block the action.

Recorded actions: `user.create`, `user.update`, `user.role_change`, `user.disable`, `user.enable`, `settings.update`, `permission.change`, `exam.create`, `exam.publish`, `attempt.submit`.

## Data and tests

Migration `20261119000100_add_admin_audit_settings_permissions` adds `AuditLog`, `SystemSetting` and `RolePermission`. Run `npx prisma migrate deploy` after pulling. Tests: `server/test/admin.test.js` (14 tests, fake repositories).

The admin screens are on the administrator dashboard under the Administration tab.
