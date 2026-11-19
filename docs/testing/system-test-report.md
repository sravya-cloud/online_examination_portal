# System Test Report

**Run date:** 19 November 2026
**Revision:** `e51bfdd` (`Complete student exam evaluation and validation`)
**Environment:** Windows local workspace; client build/lint available. Local API tests attempted with Node's test runner. The sandbox did not permit the HTTP requests to the tests' localhost servers.

## Automated execution

| Check | Result | Notes |
| --- | --- | --- |
| Client production build (`client/npm run build`) | PASS | Vite production build completed. |
| Client lint (`client/npm run lint`) | PASS with warning | 0 errors; 1 React hook dependency warning in `client/src/Dashboard.jsx` (missing `getAnswerStorageKey` and `loadExamResult`). |
| Isolated FR-16/FR-17 scoring unit tests | PASS | 4 passed; 0 failed; recorded in `unit-test-report.md`. |
| Full server suite (`server/npm test`) | BLOCKED / INCONCLUSIVE | 73 tests reported: 9 passed, 62 failed with `TypeError: fetch failed` when tests called their localhost API servers, and 2 skipped. The failures share a transport symptom and are not classified as application defects without rerunning in a supported environment. |
| Elevated targeted route tests | NOT RUN | The environment's automatic approval review was unavailable; no attempt was made to bypass it. |

## Follow-up after merging latest main

**Run date:** 19 November 2026
**Revision under test:** local merge of feature commit `d709733` with `origin/main` at `13e346c`
**Command:** `npm test` from `server/`, with local-server access enabled.

| Check | Result | Notes |
| --- | --- | --- |
| Full server suite | PASS | 88 tests: 86 passed, 0 failed, 2 skipped. The PostgreSQL integration tests were skipped because `TEST_DATABASE_URL` was not configured. |

## System cases

| Case IDs | Coverage | Status |
| --- | --- | --- |
| SYS-01 to SYS-03 | Authentication/roles, teacher setup, available exams, starting attempts | API test cases passed in the post-merge full server run. |
| SYS-04 to SYS-05 | Student answer selection/navigation and timer-driven auto-submit | Browser run pending; complete `validation/student-exam-validation.md` in a running deployment. |
| SYS-06 | Server-side per-question objective evaluation | Pure evaluation and API tests passed in the post-merge server run. |
| SYS-07 to SYS-08 | Result release and teacher reports | API test cases passed in the post-merge full server run. |
| SYS-09 | Database restart recovery and relational integrity | PostgreSQL integration cases were skipped because `TEST_DATABASE_URL` was not configured. CI provides a PostgreSQL service. |
| NFR-05 to NFR-06 | Usability feedback and first-time-user timing | Observer run pending; use the checklist and participant table in `validation/student-exam-validation.md`. |

## Conclusion

The post-merge server run passed all 86 executable tests. Two PostgreSQL integration tests remain unverified because `TEST_DATABASE_URL` was not configured. The earlier client build and lint results were recorded at revision `e51bfdd`; browser-based auto-submit, usability, and learnability checks remain pending.
