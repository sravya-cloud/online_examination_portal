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

## System cases

| Case IDs | Coverage | Status |
| --- | --- | --- |
| SYS-01 to SYS-03 | Authentication/roles, teacher setup, available exams, starting attempts | API test cases exist; full run blocked by localhost transport. |
| SYS-04 to SYS-05 | Student answer selection/navigation and timer-driven auto-submit | Browser run pending; complete `student-exam-validation.md` in a running deployment. |
| SYS-06 | Server-side per-question objective evaluation | Pure evaluation tests passed; API persistence test exists but full route run was blocked. |
| SYS-07 to SYS-08 | Result release and teacher reports | API test cases exist; full run blocked by localhost transport. |
| SYS-09 | Database restart recovery and relational integrity | PostgreSQL integration cases exist; not verified in this local run. CI provides a PostgreSQL service. |
| NFR-05 to NFR-06 | Usability feedback and first-time-user timing | Observer run pending; use the checklist and participant table in `student-exam-validation.md`. |

## Conclusion

The available local evidence confirms the client builds, lint has no errors, and the scoring/evaluation helper tests pass. It does **not** establish that the full server/system suite is green. Rerun the server suite in CI or another environment that permits localhost connections and PostgreSQL, then replace the blocked/pending statuses with the observed results.
