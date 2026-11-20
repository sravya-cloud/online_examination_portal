# Module Structure and Interfaces (NFR-07)

The code is split into small modules. Each module has one job and talks to the others through a small, documented interface, so one module can be changed or tested without touching the rest (VAL-N07).

## Server (`server/src`)

| Module | Responsibility | Interface |
|---|---|---|
| `app.js` | Builds the Express app and mounts routes | `createApp({ userRepo, jwtSecret, jwtExpiresIn, limiter, corsOrigin })` returns an Express app |
| `index.js` | Reads environment variables, wires real dependencies, starts the server | none (entry point) |
| `routes/auth.js` | Login endpoints and `GET /api/auth/me` | `createAuthRouter({ userRepo, secret, expiresIn, limiter })` returns a router |
| `middleware/auth.js` | Token check and role check for protected routes | `authenticate({ secret })`, `requireRole(...roles)` |
| `auth/tokens.js` | Create and verify session tokens | `signToken(user, opts)`, `verifyToken(token, opts)`, `assertSecret(secret)` |
| `auth/rateLimiter.js` | Limits repeated failed logins | `createLoginLimiter(opts)` with `isBlocked`, `recordFailure`, `reset` |
| `repositories/userRepository.js` | The only place that reads users from the database | `findByEmail(email)`, `findById(id)` |
| `db.js` | Creates the database client when first needed | `getPrisma()` |

Rules every new module follows:
1. Database access goes through a repository, never directly from a route.
2. A route receives its dependencies as arguments instead of importing them, so tests can pass in a fake.
3. New features add a router in `routes/` and mount it in `app.js`.

Independent testing: `server/test/auth.test.js` runs the whole login flow with an in-memory user repository and no database.

## Client (`client/src`)

| Module | Responsibility |
|---|---|
| `App.jsx` | Chooses between the login page and the dashboard based on the session |
| `LoginPage.jsx` | Role tabs and the login form |
| `Dashboard.jsx` | Role dashboard shell |
| `auth.js` | Session storage and the calls to the server API |

New screens go in their own component file and call the server only through a helper file like `auth.js`.

## Check (VAL-N07)
- Replace `createPrismaUserRepository()` with a fake repository: login tests still pass with no database.
- Each feature owner works in their own route file, so changes do not conflict.
