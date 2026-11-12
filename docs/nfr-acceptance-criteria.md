# Agreed Acceptance Criteria for Open NFR Targets (B-18)

These criteria turn the two unmeasured targets into test conditions the whole team agrees on. Proposed by Sravya; teammates confirm in the pull request review.

## NFR-03: common actions respond within 3 seconds (VAL-N03)

- **Environment:** local machine, server and database running locally, one user at a time, with the demo data from the seed script.
- **Common actions:** login, open dashboard, list available exams, start an exam, save an answer, submit an exam, view a result.
- **Method:** time each action 5 times with the browser developer tools (Network tab, time to last byte of the response).
- **Pass:** the average and the slowest of the 5 runs are both 3 seconds or less.
- **Record:** action, 5 timings, pass or fail, in the test report.

## NFR-06: first-time student starts and submits an exam within 5 minutes (VAL-N06)

- **Participant:** someone who has not used the portal, given no help or training.
- **Setup:** an exam with 5 questions and a student account already created.
- **Task:** log in, find the exam, start it, answer all questions, submit.
- **Method:** a teammate observes with a stopwatch and notes where the participant hesitates.
- **Pass:** the participant submits within 5 minutes without asking for help. Run with at least 2 participants.
- **Record:** time taken, points of confusion.

## Sign-off
- [ ] Sravya
- [ ] NehaS
- [ ] NehaJ
- [ ] Manaswi
