# Note on Deviations from Submitted SRS, SAD, and Test Plan

## Overview
This document satisfies the Deliverables Part-2 requirement: *"Deviations from the submitted document should be documented and explained during the final demo."* It outlines architectural enhancements, scope adjustments, and refined acceptance criteria agreed upon during development.

---

## 1. Functional Requirements & Scope Refinements

| Requirement | Submitted Baseline (SRS v1.0) | Implemented Refinement | Rationale |
|---|---|---|---|
| **Question Types** | Open-ended and objective questions | Strict Phase 1 focus on objective Multiple Choice Questions (MCQs) | Automated marking and instant scoring require deterministic answer options. Subjective grading deferred. |
| **Notifications** | Mentioned in early preliminary overview | Excluded from Phase 1 MVP; confirmed in team handoff (`docs/manasvi-contribution-handoff.md`) | Focus prioritized on robust exam creation, timing, random question selection, attempt flow, and secure result release. |
| **Question Freezing (FR-07)** | General teacher editing capability | Explicit lock preventing edits or deletions once an exam is published (`VAL-F13`) | Guarantees examination integrity; candidates taking an active exam must not encounter questions changing mid-attempt. |
| **Question Selection (FR-09, FR-10)** | Implicit selection from pool | Two-phase determinism: uniform random selection of $N$ questions upon publishing, persisted as fixed `ExamQuestion` set for all students | Preserves fairness so all students face the exact same question set, while question order can be shuffled per attempt. |
| **Result Release (FR-19, SEC-06)** | Generic result view | Configurable `resultReleaseTime` gating; scores withheld until release timestamp arrives | Prevents candidate collusion when candidates take the exam at different times within the availability window. |

---

## 2. Software Architecture & Design (SAD) Refinements

1. **Dependency Injection & In-Memory Repository Abstraction**:
   - Rather than embedding Prisma ORM queries directly into Express route handlers, every database operation is abstracted behind dedicated repository interfaces (`examRepository.js`, `questionRepository.js`, `userRepository.js`).
   - Routers accept injected repositories (`createExamRouter({ examRepo })`), enabling fast in-memory automated testing without requiring a live Postgres instance for CI runs.

2. **Clean Role-Based Middleware**:
   - Centralized authentication (`authenticate`) and role checking (`requireRole`) middleware cleanly enforce role boundaries (`STUDENT`, `TEACHER`, `ADMIN`).

3. **Client-Server Contract**:
   - The React frontend communicates strictly through typed API services (`client/src/api.js`), abstracting session management and header injection.

---

## 3. Test Plan & Non-Functional Requirements Refinements

1. **NFR-03 (Performance SLA)**:
   - The provisional response time target was formally calibrated to $\le 3\text{ seconds}$ under normal load (`VAL-N03`). Verified via automated high-resolution benchmarks in `server/test/nfr03_performance.test.js`, with actual response times $< 10\text{ ms}$.

2. **NFR-10 (Scalability)**:
   - Concurrency benchmark established simulating 50 concurrent candidates fetching questions and submitting attempts simultaneously with 0% dropped connections.

3. **B-15 (Automated Security Validation)**:
   - Security verification was formalized into an automated test suite (`server/test/b15_security.test.js`) verifying 401 unauthenticated denial, 403 role-escalation denial, input sanitization, availability window gating, and answer leakage prevention (`SEC-06`).
