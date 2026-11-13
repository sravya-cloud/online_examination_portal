# Requirement to Test Traceability (NFR-09)

Every requirement has a test method and an observable pass condition (VAL-N09). Update the Status column as each feature is merged.

Status key: Done = automated or manual test exists and passes. Planned = test case written, feature not finished.

| Requirement | Test method | Test location | Status |
|---|---|---|---|
| FR-01 Student login | Automated | `server/test/auth.test.js` (each role logs in) | Done |
| FR-02 Teacher login | Automated | `server/test/auth.test.js` | Done |
| FR-22 Administrator login | Automated | `server/test/auth.test.js` | Done |
| FR-07 Edit or remove questions before publishing | Automated | `server/test/sprint1_manaswi.test.js` (VAL-F13: editable before publish, blocked after publish) | Done |
| FR-08 Configure exam duration and availability period | Automated | `server/test/sprint1_manaswi.test.js` (VAL-F04: duration, start/end times persisted and validated) | Done |
| FR-09 Random selection of questions from pool | Automated | `server/test/sprint1_manaswi.test.js` (VAL-F05: uniform selection of N questions) | Done |
| FR-10 Same question set for all students | Automated | `server/test/sprint1_manaswi.test.js` (VAL-F05: question set fixed across student attempts) | Done |
| NFR-01 Authenticated access and roles | Automated | `server/test/auth.test.js` (401, 403, expired and tampered tokens, rate limit) | Done |
| NFR-07 Modularity | Review + automated | `docs/architecture-modules.md`, tests with fake repository | Done |
| NFR-08 Browser compatibility | Manual | `docs/browser-compatibility.md` | Done |
| NFR-09 Testability | Review | This table | Done |
| FR-03, FR-23, FR-24 | | | Planned |
| Other FRs (FR-04 to FR-06, FR-11 to FR-21) | | | Planned |
| Other NFRs (NFR-02 to NFR-06, NFR-10 to NFR-12) | | | Planned |

Each owner adds a row for their requirement when their pull request is raised, naming the test file or manual checklist. A pull request is complete when its requirement row says Done.

Run all server tests with `npm test` in `server/`. CI runs lint, build, syntax and schema checks on every pull request.
