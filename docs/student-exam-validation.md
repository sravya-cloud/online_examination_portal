# Student Exam Validation Sheet

Use this sheet with the merged student exam flow. Do not mark a usability run as passed until an observer has completed it and recorded the result.

## FR-14: automatic submission at expiry (VAL-F07)

Setup a published exam with a short duration and a student account. Start the exam, select answers on at least two questions, and allow the timer to reach zero without pressing Submit.

| Check | Expected result | Result / evidence |
| --- | --- | --- |
| Selected answers survive a page refresh before time expires | Choices are restored from session storage | Pending |
| Timer reaches zero | Submission starts automatically and the UI reports its progress | Pending |
| Submission completes | Attempt is submitted once with the selected answers intact | Pending |
| Submitted attempt is reopened | A second attempt cannot be started for the same exam | Pending |

FR-14's timer and client auto-submit are in the merged student screen; server time and attempt-state enforcement are covered by the shared submit flow. Complete this browser check to verify the end-to-end behavior in the deployed environment.

## FR-16: automatic answer evaluation (VAL-F08)

The automated server tests verify that the saved evaluation marks correct, incorrect, and unanswered questions, and that evaluation is not disclosed before the configured result release time. After release, verify the student result panel lists each question and its status.

## NFR-05: clear navigation and feedback (VAL-N05)

Observer checklist for the major student actions:

| Action | Expected feedback | Pass / notes |
| --- | --- | --- |
| Load dashboard and available exams | Loading state, then exam list or a useful empty/error state | Pending |
| Start an exam | Clear progress/error state, then questions and timer | Pending |
| Select an answer | Selection is visibly retained; saved state is understandable | Pending |
| Move between questions | Previous/Next controls reflect the current position and boundaries | Pending |
| Submit manually | Confirmation appears; result or submission status is clear | Pending |
| Reach the time limit | Automatic submission progress and any failure are clearly reported | Pending |
| Open results before/after release | Pending state before release; score and answer evaluation after release | Pending |

Record observer, date, browser, and any confusing wording or dead ends here:

- Observer:
- Date/browser:
- Findings:

## NFR-06: first-time student completes within five minutes (VAL-N06)

The target and method below follow `docs/nfr-acceptance-criteria.md`. The 5-minute target is provisional pending team approval, as noted in `docs/manasvi-contribution-handoff.md`.

Use two participants who have never used the portal. Prepare a five-question exam and create their accounts in advance. Give no training or help. Start a stopwatch when each participant begins logging in; stop when they submit. Note hesitation or confusion without coaching.

| Anonymous participant | Time | Submitted unaided? | Confusion / observations | Pass (<= 5 min and unaided) |
| --- | --- | --- | --- | --- |
| P1 | Pending | Pending | Pending | Pending |
| P2 | Pending | Pending | Pending | Pending |

Do not fill in participant results without running the trial. NFR-06 remains unverified until both rows have observed results and the team approves the provisional target.
