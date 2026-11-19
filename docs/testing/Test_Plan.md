# Online Examination Portal Test Plan

**Version:** 1.1
**Prepared:** 19 November 2026
**Status:** Updated test inventory; execution evidence is in `unit-test-report.md` and `system-test-report.md`.

## 1. Purpose and scope

This plan defines how the portal is checked against its functional and non-functional requirements. It covers the React client, Express API, Prisma repositories, PostgreSQL persistence, role-based security, exam lifecycle, scoring, results, and reports. Requirements and test references are tracked in [`../test-traceability.md`](../test-traceability.md).

## 2. Test levels

| Level | Purpose | Evidence |
| --- | --- | --- |
| Unit | Check deterministic helpers such as objective scoring and question selection | Node test files; targeted results in `unit-test-report.md` |
| API / component integration | Exercise Express routes with injected repositories and check auth, validation, and response behavior | `server/test/*.test.js` |
| Database integration | Check persistence, restart recovery, relational integrity, and Prisma migrations against PostgreSQL | `server/test/nfr02_reliability.test.js`, `server/test/nfr11_integrity.integration.test.js`; CI PostgreSQL service |
| System / browser | Verify the complete student and teacher flows in the running app, including timer behavior and result display | Cases in `system-test-report.md` and `student-exam-validation.md` |
| Non-functional | Check response time, availability, concurrency, browser compatibility, usability, and learnability | NFR tests and manual observation records referenced by the traceability matrix |

## 3. Environment

- Node.js 22 (CI configuration); npm dependencies from the committed lockfiles.
- React/Vite client and Express server.
- PostgreSQL 16 in CI; Prisma migrations applied before backend tests.
- Local development URLs are documented in the repository `README.md`.
- Never use real credentials in test evidence. Use the seed or dedicated test accounts and non-production data.

## 4. Entry and exit conditions

**Entry:** code is on the candidate branch; dependencies install from lockfiles; required environment variables and test database are configured; migrations apply cleanly.

**Exit:** relevant automated tests pass; client lint/build and Prisma validation pass; browser-only cases are recorded; any failure is classified in the defect log; no result is called passed without recorded evidence.

## 5. Core system scenarios

| ID | Scenario | Expected result | Evidence / status |
| --- | --- | --- | --- |
| SYS-01 | Authenticate as each role and request role-specific pages | Valid role can access its page; invalid/unauthenticated access is denied | `auth.test.js`; execution recorded in system report |
| SYS-02 | Teacher creates a pool/question and publishes an exam | Valid inputs persist; invalid inputs return clear validation errors | `questions.test.js`, `exams.test.js`, `sprint1_manaswi.test.js` |
| SYS-03 | Student opens available exam and starts an attempt | Only eligible published exam is listed; questions are the persisted exam set | `studentExams.test.js`, `sprint1_manaswi.test.js` |
| SYS-04 | Student answers, navigates, refreshes, and submits | Answers remain associated with the attempt; manual submit confirms and records once | Browser validation sheet; pending live browser run |
| SYS-05 | Timer reaches zero | Client submits automatically with selected answers; duplicate submission is prevented | Browser validation sheet; pending live browser run |
| SYS-06 | Submitted objective answers are evaluated | Correct, incorrect, and unanswered questions are evaluated from server-held question keys | `fr17_scoring.test.js`; API persistence assertion is in same file |
| SYS-07 | Student checks results before and after release time | Score/evaluation are withheld before release and visible after release | `sprint2_manaswi.test.js` |
| SYS-08 | Teacher views exam report | Report is role-restricted and aggregates submitted attempts only | `sprint2_manaswi.test.js` |
| SYS-09 | Attempt survives DB client restart and keeps relational integrity | Persisted attempt/answers remain consistent | NFR-02/NFR-11 PostgreSQL integration tests |

## 6. Non-functional checks

- NFR-03: run the five-action timing protocol and compare both mean and slowest response against 3 seconds.
- NFR-04: run the simulated availability-window test.
- NFR-05: observe clarity of navigation and feedback for the major student actions.
- NFR-06: run the unassisted five-question task with at least two first-time users; record time and confusion points. The 5-minute target remains provisional pending team approval.
- NFR-08: record browser/version and the outcome for each supported desktop browser.
- NFR-10: run the concurrent-user benchmark and record throughput/errors.
- NFR-11: run PostgreSQL consistency checks.

## 7. Execution commands

```text
cd client && npm ci && npm run lint && npm run build
cd server && npm ci && npx prisma generate && npx prisma migrate deploy && npm test
```

CI uses PostgreSQL 16 and performs the backend test, syntax, and Prisma schema checks. See [`../../.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

## 8. Reporting

Record run date, revision, environment, command or manual steps, expected result, actual result, pass/fail/blocked status, and defect ID. Do not treat an environment failure as a product defect unless the failure is reproduced in a supported environment.
