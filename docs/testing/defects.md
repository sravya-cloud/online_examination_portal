# Test Defect Log

Log confirmed product defects from test execution here. Do not log an infrastructure symptom as an application defect until it is reproduced in a supported environment.

| ID | Date | Finding | Reproduction / evidence | Severity | Status |
| --- | --- | --- | --- | --- | --- |
| ENV-001 | 19 Nov 2026 | Full local server test run could not reach localhost test servers (`TypeError: fetch failed`); 62 tests were consequently inconclusive. | `npm test` from `server/`; see `system-test-report.md`. | Environment blocker; not classified as a product defect | Rerun in CI or supported local environment |
| UI-001 | 19 Nov 2026 | Client lint reports a React hook dependency warning for `getAnswerStorageKey` and `loadExamResult` in `Dashboard.jsx`. Build succeeds; no lint errors. | `npm run lint` from `client/`. | Low; review whether dependencies should be added or callbacks stabilized | Open |

No confirmed functional product defect was established by this test run. NFR-05/NFR-06 and browser auto-submit remain unverified manual checks, not defects.
