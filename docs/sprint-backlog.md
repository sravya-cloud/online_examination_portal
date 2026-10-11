# Proposed Sprint Backlog and Delivery Plan

These dates and estimates are proposed for team review, not confirmed commitments.

## Delivery checkpoints

| Window | Focus | Exit evidence |
|---|---|---|
| 12–16 Oct 2026 | Planning and dry run | Confirm stack, owners, acceptance criteria, and unresolved requirements |
| 19–23 Oct 2026 — Sprint 1 | Core exam-taking flow | End-to-end attempt flow and 1-minute demo |
| 26–30 Oct 2026 — Sprint 2 | Evaluation, results, admin, and hardening | Regression evidence, 2-minute demo, and development freeze |

## Backlog

Story points are estimates for discussion. Assign owners after the team confirms availability.

| ID | Work item | Requirements | Points | Sprint |
|---|---|---|---:|---|
| B-01 | Confirm stack, setup steps, and project structure | Project setup | 3 | Sprint 1 |
| B-02 | Implement student and teacher login | FR-01, FR-02 | 5 | Sprint 1 |
| B-03 | Protect admin login and restricted routes | FR-03, FR-22 | 5 | Sprint 1 |
| B-04 | Configure exam duration, availability, and result release | FR-04, FR-08 | 5 | Sprint 1 |
| B-05 | Build objective question bank with difficulty and pre-publication editing | FR-05–FR-07 | 5 | Sprint 1 |
| B-06 | Show exams available to a candidate | FR-21 | 3 | Sprint 1 |
| B-07 | Select the common question set and shuffle question order | FR-09–FR-11 | 5 | Sprint 1 |
| B-08 | Save answers, allow revisits and changes, and submit manually or on timeout | FR-12–FR-15 | 5 | Sprint 1 |
| B-09 | Test the core attempt flow | Test plan | 3 | Sprint 1 |
| B-10 | Add basic GitHub Actions repository checks | CI | 3 | Sprint 1 |
| B-11 | Evaluate objective answers, calculate scores, and persist attempts | FR-16–FR-18 | 5 | Sprint 2 |
| B-12 | Enforce configured result release and result access | FR-19 | 3 | Sprint 2 |
| B-13 | Generate reports for authorized teachers and admins | FR-20 | 3 | Sprint 2 |
| B-14 | Implement admin settings and access permissions | FR-23, FR-24 | 5 | Sprint 2 |
| B-15 | Validate authentication, authorization, input handling, and exam access | Security requirements | 5 | Sprint 2 |
| B-16 | Run regression tests and close traceability gaps | RTM and test plan | 3 | Sprint 2 |
| B-17 | Update documentation, prepare demos, and freeze development | Delivery | 2 | Both |
| B-18 | Agree acceptance criteria for unresolved NFR targets | NFR-03, NFR-06 | 2 | Planning / Sprint 1 |

## Definition of done

- Acceptance criteria are documented and relevant tests pass.
- Changes are reviewed through a pull request.
- Relevant requirement and security references are included.
- No secrets or credentials are committed.
- Documentation is updated alongside behavior changes.
- Demo evidence is ready for the sprint checkpoint.

## Team setup still required

Create or update the GitHub Project, add backlog items as issues, set estimates and sprint fields, and assign owners after the team confirms capacity. This document proposes the backlog; it does not mean the project items already exist.
