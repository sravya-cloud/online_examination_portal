# Requirements Handoff and Contribution Notes

This document carries forward the requirements work from the earlier project repository.

## Requirements baseline

- Functional requirements are tracked as FR-01 through FR-24.
- Keep the traceability matrix aligned with functional, non-functional, and security requirements.
- Phase 1 supports objective questions only.
- Candidates taking the same exam receive the same selected question set, with question order shuffled.
- Candidates can revisit questions and change answers before submission.
- Teachers may edit or remove questions only before the exam is published.
- Notifications are out of scope for Phase 1 unless the team explicitly approves a change.
- Reports are available only to authorized teachers and administrators.
- Result release is configured for each exam.
- Admin login, settings, and access permissions are restricted operations.

## Items to confirm with the team

1. The README mentions notifications, while the earlier finalized Phase 1 rules exclude them. Confirm the scope before implementing notifications.
2. Map FR-21 (available examinations), FR-22 (admin login), FR-23 (admin settings), and FR-24 (access permissions) to implementation tasks and tests.
3. The previously noted NFR-03 response-time target is at most 3 seconds under normal load. Confirm the test conditions.
4. The previously noted NFR-06 five-minute target is provisional and requires team approval.

## Contribution scope

- Maintain the functional-requirement baseline and traceability.
- Keep the README, SRS, test plan, architecture, and implementation consistent.
- Include relevant requirement IDs in issue and pull-request descriptions.

See [sprint-backlog.md](sprint-backlog.md) for the proposed two-sprint plan.
