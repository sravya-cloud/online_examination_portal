# Requirement to Test Traceability (NFR-09)

Every requirement has a test method and an observable pass condition (VAL-N09). Update the Status column as each feature is merged.

Status key: Done = automated or manual test exists and passes. Planned = test case written, feature not finished.

| Requirement | Test method | Test location | Status |
|---|---|---|---|
| FR-01 Student login | Automated | `server/test/auth.test.js` (each role logs in) | Done |
| FR-02 Teacher login | Automated | `server/test/auth.test.js` | Done |
| FR-22 Administrator login | Automated | `server/test/auth.test.js` | Done |
| NFR-01 Authenticated access and roles | Automated | `server/test/auth.test.js` (401, 403, expired and tampered tokens, rate limit) | Done |
| NFR-07 Modularity | Review + automated | `docs/architecture-modules.md`, tests with fake repository | Done |
| NFR-08 Browser compatibility | Manual | `docs/browser-compatibility.md` | Planned |
| NFR-09 Testability | Review | This table | Done |
| FR-03, FR-23, FR-24 | | | Planned |
| FR-04 | Automated | `server/test/exams.test.js` | Done |
| FR-05 | Automated | `server/test/questions.test.js` | Done |
| FR-06 to FR-21 | | | Planned |
| NFR-02 to NFR-06, NFR-10 to NFR-12 | | | Planned |

Each owner adds a row for their requirement when their pull request is raised, naming the test file or manual checklist. A pull request is complete when its requirement row says Done.

Run all server tests with `npm test` in `server/`. CI runs lint, build, syntax and schema checks on every pull request.
