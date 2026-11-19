# Requirement-to-Test Traceability Matrix

This matrix maps the backlog requirements to existing automated or manual checks. A test file existing does not mean the requirement passed: **Pass** means execution evidence is available; **Pending** means the check has not been verified; **Blocked** means an attempted run could not complete in the available environment. Run details are in [`docs/testing/unit-test-report.md`](testing/unit-test-report.md) and [`docs/testing/system-test-report.md`](testing/system-test-report.md).

| Requirement | Test method / evidence | Status |
| --- | --- | --- |
| FR-01 Student login | API tests: `server/test/auth.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-02 Teacher login | API tests: `server/test/auth.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-03 Admin manages users and roles | No matching implementation/test found in current backlog/test inventory | Pending / scope gap |
| FR-04 Create examinations | API tests: `server/test/exams.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-05 Upload questions to question bank | API tests: `server/test/questions.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-06 Assign question difficulty | API tests: `server/test/questions.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-07 Edit/remove questions before publish | API tests: `server/test/sprint1_manaswi.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-08 Configure duration and availability | API tests: `server/test/sprint1_manaswi.test.js`, `server/test/sprint2_manaswi.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-09 Random question selection | Unit/API tests: `server/test/sprint1_manaswi.test.js` | Test exists; full-suite execution blocked |
| FR-10 Same fixed question set for students | API tests: `server/test/sprint1_manaswi.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-11 Shuffle question order | Unit/API tests: `server/test/fr11_shuffle.test.js` | Test exists; full-suite execution blocked |
| FR-12 Display active-attempt questions | API and UI flow; `server/test/sprint1_manaswi.test.js`; manual cases in `docs/student-exam-validation.md` | Browser validation pending; API suite blocked |
| FR-13 Select and save answers | UI flow and `server/test/fr18_secure_attempts.test.js`; manual cases in `docs/student-exam-validation.md` | Browser validation pending; API suite blocked |
| FR-14 Auto-submit at duration expiry | Server duration checks: `server/test/sprint2_manaswi.test.js`; browser case in `docs/student-exam-validation.md` | Server test exists but suite blocked; browser case pending |
| FR-15 Manual submission | Submit UI and `server/test/sprint2_manaswi.test.js` | Browser validation pending; API suite blocked |
| FR-16 Automatic objective evaluation | Pure evaluation unit test: `server/test/fr17_scoring.test.js`; persistence/release tests there and in `server/test/sprint2_manaswi.test.js` | Unit check Pass (4/4 targeted checks); API persistence and release blocked |
| FR-17 Calculate exam score | Pure scoring tests: `server/test/fr17_scoring.test.js` | Unit check Pass (4/4 targeted checks include scoring); API persistence blocked |
| FR-18 Securely store attempts/answers | API/security tests: `server/test/fr18_secure_attempts.test.js`, `server/test/b15_security.test.js`; DB checks in `server/test/nfr02_reliability.test.js` | API suite blocked; database integration not verified |
| FR-19 Automatic result release | API tests: `server/test/sprint2_manaswi.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-20 Teacher examination reports | API tests: `server/test/sprint2_manaswi.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-21 Display available exams | API tests: `server/test/studentExams.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-22 Administrator login | API tests: `server/test/auth.test.js` | Blocked: full API suite hit localhost transport failure |
| FR-23 Admin manages system settings | No matching implementation/test found in current backlog/test inventory | Pending / scope gap |
| FR-24 Admin manages role permissions | No matching implementation/test found in current backlog/test inventory | Pending / scope gap |
| NFR-01 Authenticated access and roles | `server/test/auth.test.js`, `server/test/b15_security.test.js` | Blocked: full API suite hit localhost transport failure |
| NFR-02 Reliability / no data loss | PostgreSQL integration test: `server/test/nfr02_reliability.test.js` | Not verified in this run; requires PostgreSQL |
| NFR-03 Performance within 3 seconds | `server/test/nfr03_performance.test.js`; protocol in `docs/nfr-03-performance.md` | Test exists; execution not verified in this run |
| NFR-04 Availability during exam window | `server/test/nfr04_availability.test.js`; protocol in `docs/nfr-04-availability.md` | Test exists; execution not verified in this run |
| NFR-05 Clear navigation and feedback | Observer checklist in `docs/student-exam-validation.md` | Pending observer run |
| NFR-06 First-time student finishes within 5 minutes | Two-participant trial in `docs/student-exam-validation.md` | Pending real participant trials and team approval of provisional target |
| NFR-07 Modularity | Review note: `docs/architecture-modules.md` | Review evidence exists; no current execution result recorded |
| NFR-08 Desktop browser compatibility | Manual protocol: `docs/browser-compatibility.md` | Evidence needs review/refresh; not rerun in this report |
| NFR-09 Testability / every requirement traceable | This matrix and `docs/testing/Test_Plan.md` | Documentation exists; open rows remain pending/blocked |
| NFR-10 Scalability | `server/test/nfr10_scalability.test.js`; protocol in `docs/nfr-10-scalability.md` | Test exists; execution not verified in this run |
| NFR-11 Data integrity | PostgreSQL integration test: `server/test/nfr11_integrity.integration.test.js` | Not verified in this run; requires PostgreSQL |
| NFR-12 Auditability | No matching audit-log test found in current test inventory | Pending / scope gap |
| B-15 Security validation | `server/test/b15_security.test.js`; `docs/b15-security-validation.md` | API suite blocked: localhost transport failure |

## Run commands

See [`docs/testing/Test_Plan.md`](testing/Test_Plan.md). Update statuses only with recorded evidence. CI's PostgreSQL-backed run is the appropriate verification for the complete server suite when its checks are available.
