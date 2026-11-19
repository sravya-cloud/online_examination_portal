# Requirement to Test Traceability (NFR-09)

Every requirement has a test method and an observable pass condition (VAL-N09). Update the Status column as each feature is merged.

Status key: Done = automated or manual test exists and passes. Planned = test case written, feature not finished.

| Requirement | Test method | Test location | Status |
|---|---|---|---|
| FR-01 Student login | Automated | `server/test/auth.test.js` (each role logs in) | Done |
| FR-02 Teacher login | Automated | `server/test/auth.test.js` | Done |
| FR-22 Administrator login | Automated | `server/test/auth.test.js` | Done |
| FR-04 Create examinations | Automated | `server/test/exams.test.js` | Done |
| FR-05 Upload questions to question bank | Automated | `server/test/questions.test.js` | Done |
| FR-06 Assign difficulty level to questions | Automated | `server/test/questions.test.js` | Done |
| NFR-02 Reliability: no loss of submitted data | PostgreSQL integration | `server/test/nfr02_reliability.test.js` (attempt and answer JSON persist after disconnecting and reconnecting a Prisma client) | Done |
| FR-07 Edit or remove questions before publishing | Automated | `server/test/sprint1_manasvi.test.js` (VAL-F13: editable before publish, blocked after publish) | Done |
| FR-08 Configure exam duration and availability period | Automated | `server/test/sprint1_manasvi.test.js` (VAL-F04: duration, start/end times persisted and validated) | Done |
| FR-09 Random selection of questions from pool | Automated | `server/test/sprint1_manasvi.test.js` (VAL-F05: uniform selection of N questions) | Done |
| FR-10 Same question set for all students | Automated | `server/test/sprint1_manasvi.test.js` (VAL-F05: question set fixed across student attempts) | Done |
| FR-11 Shuffle question order | Automated | `server/test/fr11_shuffle.test.js` (VAL-F06: stable per-attempt shuffle, same selected set, and associated question data) | Done |
| FR-19 Automatic result release at configured time | Automated | `server/test/sprint2_manasvi.test.js` (VAL-F09, VAL-F10; SEC-06: results hidden before release time) | Done |
| FR-20 View examination reports | Automated | `server/test/sprint2_manasvi.test.js` (VAL-F14: authorized roles only; students blocked with 403) | Done |
| FR-03 Admin: manage users and roles | Automated | `server/test/admin.test.js` (VAL-F15, VAL-F16, VAL-F18: create, role change, disable, validation, self-protection) | Done |
| FR-23 Admin: manage system settings | Automated | `server/test/admin.test.js` (VAL-F21: approved settings only, invalid values rejected) | Done |
| FR-24 Admin: manage role permissions | Automated | `server/test/admin.test.js` (VAL-F22: change takes effect on the next request) | Done |
| NFR-12 Auditability | Automated | `server/test/admin.test.js` (VAL-N12: admin and exam actions logged with actor) | Done |
| NFR-01 Authenticated access and roles | Automated | `server/test/auth.test.js` (401, 403, expired and tampered tokens, rate limit) | Done |
| NFR-03 Performance within 3 seconds | Automated | `server/test/nfr03_performance.test.js` (VAL-N03, `docs/nfr-03-performance.md`) | Done |
| NFR-07 Modularity | Review + automated | `docs/architecture-modules.md`, tests with fake repository | Done |
| NFR-08 Browser compatibility | Manual | `docs/browser-compatibility.md` | Done |
| NFR-09 Testability | Review | This table | Done |
| NFR-10 Scalability | Automated | `server/test/nfr10_scalability.test.js` (VAL-N10, `docs/nfr-10-scalability.md`) | Done |
| B-15 Security validation | Automated | `server/test/b15_security.test.js` (`docs/b15-security-validation.md`) | Done |
| FR-12 Display questions of active attempt | Automated | `server/test/sprint2_manasvi.test.js`, `server/test/examDetailsSecurity.test.js` (VAL-F06) | Done |
| FR-13 Select and save answers | Automated + manual | `server/test/sprint2_manasvi.test.js` (answers stored on submit); answers kept in the browser until submit, checked in the demo run | Done |
| FR-15 Manual submission | Automated | `server/test/sprint2_manasvi.test.js` (VAL-F07: submit stores answers, only once per exam) | Done |
| FR-14 Auto-submit on duration expiry | Automated + manual | Server rejects late submissions (`sprint2_manasvi.test.js`); the client submits when the timer reaches zero, checked manually in the demo run | Planned (manual run before demo) |
| FR-16 Automatic evaluation of objective answers | Automated | `server/test/fr17_scoring.test.js` (VAL-F08) | Done |
| FR-17 Calculate exam score | Automated | `server/test/fr17_scoring.test.js` (VAL-F08) | Done |
| FR-18 Securely store attempts and answers | Automated | `server/test/fr18_secure_attempts.test.js` (VAL-S11, SEC-05) | Done |
| FR-21 Display available examinations | Automated | `server/test/studentExams.test.js` (VAL-F11) | Done |
| NFR-04 Availability during exam window | Automated | `server/test/nfr04_availability.test.js` (`docs/nfr-04-availability.md`) | Done |
| NFR-05 Usability | Manual | Demo walkthrough: each major action shows a clear message | Planned (manual run before demo) |
| NFR-06 Learnability (5 minutes) | Manual | Timed trial with a new user, conditions in `docs/nfr-acceptance-criteria.md` | Planned (manual run before demo) |
| NFR-11 Data integrity | PostgreSQL integration | `server/test/nfr11_integrity.integration.test.js` (runs in CI, `docs/nfr-11-data-integrity.md`) | Done |

Each owner adds a row for their requirement when their pull request is raised, naming the test file or manual checklist. A pull request is complete when its requirement row says Done.

Run all server tests with `npm test` in `server/`. CI runs lint, build, syntax and schema checks on every pull request.
