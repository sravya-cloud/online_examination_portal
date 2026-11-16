# NFR-04 Availability Check

Issue #32 requires the system to remain available throughout an exam availability period (VAL-N04).

## Automated check

`server/test/nfr04_availability.test.js` starts the Express application and continuously probes both `/api/health` and the authenticated active-exam question endpoint for a 10-second simulated exam window. It fails on any non-success response, missing question, or insufficient probe count. The test runs with an injected repository, so it does not require a live database or mutate persistent data.

The issue does not specify a test-window duration or deployment target. This check assumes a 10-second simulated window in CI and exercises process/API availability. It does not claim to establish production uptime or availability for a longer deployed exam window; that requires a monitored test against the deployed environment.

Run from `server/` with `npm test`.
