# Demo scripts

Run the app first (`npm run dev` in `server/` and in `client/`) with the seeded accounts and a published exam that has at least five questions. Rehearse each script with a timer.

## Sprint 1: 1-minute working product

Goal: show a student taking an exam end to end.

| Time | Show | Say |
|---|---|---|
| 0:00 to 0:10 | Student portal login | Role-based login, one portal per role |
| 0:10 to 0:20 | Available examinations list | Only exams inside their window appear |
| 0:20 to 0:40 | Start the exam, answer, change one answer, show the timer | Same question set for everyone, shuffled per attempt; answers can be changed |
| 0:40 to 0:55 | Submit | The server scores the attempt; the student cannot submit twice |
| 0:55 to 1:00 | Teacher view of the exam | Created and published by a teacher |

## Sprint 2: 2-minute working product

Goal: show evaluation, results, reports, admin features and quality evidence.

| Time | Show | Say |
|---|---|---|
| 0:00 to 0:20 | Student submits; result hidden before release time | Score computed on the server; results gated by release time (FR-17, FR-19) |
| 0:20 to 0:40 | Teacher opens the examination report | Totals, average and per-question statistics (FR-20) |
| 0:40 to 1:15 | Admin: create a user, change a role, disable a user | User and role management (FR-03) |
| 1:15 to 1:35 | Admin: change a setting and a role permission, then show the teacher losing or gaining access | Settings and permissions take effect immediately (FR-23, FR-24) |
| 1:35 to 1:50 | Admin: audit log | Every admin and exam action is recorded with who did it (NFR-12) |
| 1:50 to 2:00 | GitHub Actions run and `docs/deviations-note.md` | CI runs tests on every pull request; deviations are documented |

## Before recording

- Seed the database and publish a fresh exam; check the result release time is in the future for the hidden-result step.
- Use a clean browser window at a readable zoom level.
- Do not show `.env`, connection strings or passwords on screen.
- Record the screen with the narration; keep each take under the time limit.
