# NFR-11 Data Integrity Check

Issue #36 requires questions, answers, attempts, scores, and results to remain consistent, with no orphaned records after the exam flow (VAL-N11).

`server/test/nfr11_integrity.integration.test.js` exercises a PostgreSQL-backed repository flow: create a student, question pool, exam and questions; publish the fixed question set; record an attempt; then reload the attempt and verify all foreign-key relationships, selected question membership, saved answers, score, and row counts. Test-created rows are removed by ID in `finally` cleanup.

The test runs only when `TEST_DATABASE_URL` points to a dedicated test database. The current main branch's CI does not provision PostgreSQL or run the backend suite; PR #84 adds that CI setup but is still open. Until it is merged, this integration test can be skipped by CI. The active-attempt submission path is also under review in PR #85, so this repository-level test avoids duplicating that route implementation.

Run from `server/` with `TEST_DATABASE_URL` set to a disposable test database, then execute `npm test`.
