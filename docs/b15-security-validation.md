# Security Validation Report (B-15)

## Overview
This document records the verification of system security controls covering authentication, role-based access control (RBAC), input validation, exam access windows, and information leakage prevention (`VAL-S11`, `SEC-01` through `SEC-10`).

## Automated Verification Suite
Implemented in `server/test/b15_security.test.js` and `server/test/auth.test.js`.

### 1. Authentication Enforcement
- Every protected endpoint requires a valid Bearer token signed with HS256 and verified against `process.env.JWT_SECRET`.
- Unauthenticated requests to `/api/exams`, `/api/questions`, reports, and attempts receive `401 Authentication required`.
- Tampered tokens, expired tokens, and wrong signatures are rejected with 401.

### 2. Role-Based Access Control (RBAC) & Privilege Escalation Prevention
- **Exam Management**: Only users with `TEACHER` or `ADMIN` roles can create (`POST /api/exams`), configure (`PUT /api/exams/:id`), or publish (`POST /api/exams/:id/publish`) exams. Students attempting these receive `403 Forbidden`.
- **Question Editing**: Only `TEACHER` and `ADMIN` can update or delete questions (`PUT /api/questions/:id`, `DELETE /api/questions/:id`). Students receive `403 Forbidden`.
- **Examination Reports**: Only `TEACHER` and `ADMIN` can open reports (`GET /api/exams/:id/report`). Students receive `403 Forbidden: only teachers and administrators may view examination reports` (`VAL-F14`).

### 3. Input Validation & Boundary Defense
- Payloads are validated against strict schemas (non-empty strings, positive integer durations, positive question counts, valid ISO-8601 timestamps).
- Inverted availability windows (`startTime >= endTime`) and durations exceeding availability windows are rejected with `400 Bad Request`.
- Malformed JSON payloads return `400 Invalid JSON body` without leaking stack traces or internal environment variables.

### 4. Exam Access Control
- Candidates are blocked from accessing questions prior to the exam `startTime` (`403 Examination is not yet available`).
- Candidates are blocked from accessing questions after the exam `endTime` (`403 Examination availability window has ended`).

### 5. Information Leakage Prevention (`SEC-06`)
- **Question Retrieval**: Student question payloads omit `correctOption`, ensuring candidates cannot inspect client network requests or HTML inspect-element to discover answer keys.
- **Scheduled Result Release**: Attempts checked before `resultReleaseTime` return `{ isReleased: false }` with release timestamp; scores, percentage, and answer evaluations are completely withheld until the scheduled release time arrives.
