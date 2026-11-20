# Software Architecture Document (SAD)
## Online Examination Portal — As-Built Architecture (Phase 2)

**Author:** Manasvi Dr. (Team E6)  
**System:** Online Examination Portal  
**Document Version:** 2.0 (Phase 2 Final)  
**Status:** Approved & Implemented  
**Date:** November 2026  

---

## 1. Executive Summary & Purpose

This Software Architecture Document (SAD) captures the comprehensive architectural design of the **Online Examination Portal** as implemented in Phase 2. The system is an enterprise-grade, secure, web-based examination platform supporting three distinct user roles: **Students (Candidates)**, **Teachers (Instructors)**, and **Administrators**.

The platform provides end-to-end management of the examination lifecycle:
1. **Curriculum & Question Bank Management**: Creating question pools and authoring objective Multiple Choice Questions (MCQs) with difficulty tiers.
2. **Deterministic & Fair Exam Authoring**: Configuring exam duration and availability windows, and automatically selecting fixed question sets upon publishing.
3. **Robust Exam Execution**: Enforcing duration via server-authoritative timestamps, handling answer persistence, and blocking late submissions.
4. **Secure Evaluation & Scheduled Release**: Server-side automated grading with anti-cheating protections and scheduled result publication.
5. **Administrative Oversight & Compliance**: System configuration, dynamic role permissions, and immutable audit logging.

This document updates the preliminary Phase 1 design to reflect the **as-built system**, detailing architectural patterns, component decompositions, data models, state machines, and security controls.

---

## 2. Architectural Principles & Styles

The Online Examination Portal is structured around the following architectural principles:

```
+---------------------------------------------------------------------------------------+
|                                Presentation Layer                                     |
|                   React 19 Single Page Application (Vite Bundler)                     |
+---------------------------------------------------------------------------------------+
                                          |
                                          | HTTPS / REST (JSON) + JWT Bearer
                                          v
+---------------------------------------------------------------------------------------+
|                               API & Routing Layer                                     |
|                      Express 5 Router with Dependency Injection                       |
+---------------------------------------------------------------------------------------+
           |                                  |                             |
           v                                  v                             v
+--------------------+              +--------------------+        +--------------------+
|     Middleware     |              |  Domain Services   |        |  Audit Subsystem   |
| - JWT Auth         |              | - Scoring Engine   |        | - Async Logging    |
| - RBAC Guard       |              | - Random Selection |        | - Non-blocking     |
| - Rate Limiter     |              | - Permissions      |        | - Tamper-resistant |
+--------------------+              +--------------------+        +--------------------+
           \                                  /                             /
            \                                /                             /
             v                              v                             v
+---------------------------------------------------------------------------------------+
|                         Persistence Abstraction Layer                                 |
|                       Repository Pattern (Data Gateways)                              |
|           [UserRepository]     [ExamRepository]     [QuestionRepository]              |
+---------------------------------------------------------------------------------------+
                                          |
                                          | Prisma ORM 7 Engine
                                          v
+---------------------------------------------------------------------------------------+
|                                 Database Layer                                        |
|                          PostgreSQL / Neon Serverless                                 |
+---------------------------------------------------------------------------------------+
```

### 2.1 Layered Modular Architecture
- **Presentation Layer**: Built with React 19, delivering responsive, role-specific views (`LoginPage`, `Dashboard`, `TeacherExamManagement`, `TeacherExamReports`, `StudentExamView`, `AdminPanel`).
- **API & Routing Layer**: Express 5 application delegating endpoints across isolated route handlers (`auth.js`, `exams.js`, `questions.js`, `studentExams.js`, `admin.js`).
- **Domain Services Layer**: Pure business logic separated from HTTP concerns (`objectiveScoring.js`, `questionSelection.js`, `permissions.js`, `settings.js`, `audit.js`).
- **Persistence Abstraction Layer**: Implements the Repository Pattern, completely decoupling database access from business routes.
- **Data Layer**: Relational schema managed by Prisma ORM backed by PostgreSQL (supporting serverless cloud deployments such as Neon).

### 2.2 Dependency Injection for Testability
Every router is a factory function accepting injected dependencies (e.g., `createExamRouter({ examRepo, auditRepo })`, `createApp({ userRepo, jwtSecret })`). This architectural choice enables:
- **Instant Unit and Integration Testing**: Complete suite executes in $< 11$ seconds against fast in-memory repositories without spinning up external containers or databases.
- **Zero Test Collisions**: Independent in-memory state per test case prevents flaky tests and race conditions.
- **Polymorphic Storage**: Swappable persistence backends (in-memory test fakes vs. production Prisma repositories) without altering route handlers.

### 2.3 Server-Authoritative Security Boundary
The client browser is strictly treated as an untrusted presentation layer:
- **Zero Client Grading**: The server independently grades submissions against stored answer keys.
- **Server Clock Duration Enforcement**: Attempt start times and completion times are stamped by the server clock, preventing client-side timer manipulation.
- **Answer Sanitization**: Correct answers are scrubbed from student-facing API responses (`SEC-06`).
- **Non-Repudiation**: Administrative and student lifecycle operations trigger audit log records (NFR-12).

---

## 3. High-Level Architecture Diagram

The diagram below illustrates the end-to-end system topology, component interactions, and data flows across all three user roles:

```mermaid
flowchart TD
    subgraph Clients["Presentation Tier (React 19 SPA)"]
        S_UI["Student Interface\n(Dashboard.jsx, StudentExamView.jsx)"]
        T_UI["Teacher Interface\n(TeacherExamManagement.jsx, TeacherExamReports.jsx)"]
        A_UI["Admin Interface\n(AdminPanel.jsx)"]
    end

    subgraph Gateway["API Gateway & Middleware Tier (Express 5)"]
        MW_Auth["Authentication Middleware\n(verifyToken, assertSecret)"]
        MW_RBAC["Role-Based Access Control\n(requireRole, checkRolePermission)"]
        MW_Rate["Rate Limiter\n(createLoginLimiter)"]
        App["Express Application\n(app.js)"]
    end

    subgraph Routes["Routing Tier"]
        R_Auth["/api/auth\n(auth.js)"]
        R_Exams["/api/exams\n(exams.js)"]
        R_Ques["/api/questions\n(questions.js)"]
        R_Std["/api/student/exams\n(studentExams.js)"]
        R_Admin["/api/admin\n(admin.js)"]
    end

    subgraph Services["Domain Services Tier"]
        S_Score["Objective Scoring Engine\n(objectiveScoring.js)"]
        S_Select["Question Selection & Shuffling\n(questionSelection.js)"]
        S_Perm["Dynamic Permissions Service\n(permissions.js)"]
        S_Sett["System Settings Service\n(settings.js)"]
        S_Audit["Audit Logging Subsystem\n(audit.js)"]
    end

    subgraph Repos["Persistence Abstraction Tier"]
        Repo_User["User Repository\n(userRepository.js)"]
        Repo_Exam["Exam Repository\n(examRepository.js)"]
        Repo_Ques["Question Repository\n(questionRepository.js)"]
    end

    subgraph Storage["Data Tier (PostgreSQL / Neon)"]
        DB[(PostgreSQL Database\nPrisma ORM)]
    end

    S_UI -->|"HTTP + JWT"| App
    T_UI -->|"HTTP + JWT"| App
    A_UI -->|"HTTP + JWT"| App

    App --> MW_Rate
    MW_Rate --> MW_Auth
    MW_Auth --> MW_RBAC

    MW_RBAC --> R_Auth
    MW_RBAC --> R_Exams
    MW_RBAC --> R_Ques
    MW_RBAC --> R_Std
    MW_RBAC --> R_Admin

    R_Exams --> S_Select
    R_Exams --> S_Score
    R_Exams --> S_Audit
    R_Admin --> S_Perm
    R_Admin --> S_Sett
    R_Admin --> S_Audit

    R_Auth --> Repo_User
    R_Exams --> Repo_Exam
    R_Ques --> Repo_Ques
    R_Std --> Repo_Exam
    R_Admin --> Repo_User

    Repo_User --> DB
    Repo_Exam --> DB
    Repo_Ques --> DB
    S_Audit -.->|"Async Log"| DB
```

---

## 4. Component & Module Breakdown

### 4.1 Server Module Hierarchy (`server/src`)

| Module Path | Primary Responsibility | Interface / Key Exports |
|---|---|---|
| `app.js` | Express app assembly, router mounting, global error handler | `createApp({ userRepo, examRepo, questionRepo, jwtSecret, limiter, corsOrigin })` |
| `index.js` | Production entry point, environment loading, database initialization | Initializes Prisma, starts HTTP listener on `PORT` |
| `db.js` | Prisma Client singleton and connection lifecycle | `getPrisma()` |
| `auth/tokens.js` | Cryptographic JWT signing, verification, secret validation | `signToken(user, opts)`, `verifyToken(token, opts)`, `assertSecret(secret)` |
| `auth/rateLimiter.js` | Memory-based rate limiter guarding brute-force logins | `createLoginLimiter({ windowMs, maxAttempts })` |
| `middleware/auth.js` | JWT extraction, verification, role enforcement guards | `authenticate({ secret })`, `requireRole(...roles)` |
| `routes/auth.js` | Login endpoints (`/api/auth/login/:portal`) and profile verification (`/api/auth/me`) | `createAuthRouter({ userRepo, secret, expiresIn, limiter })` |
| `routes/exams.js` | Exam creation, updating, publishing, reports, student attempt lifecycle | `createExamRouter({ examRepo, auditRepo })` |
| `routes/questions.js` | Question pool creation and objective question management | `createQuestionRouter({ questionRepo, examRepo })` |
| `routes/studentExams.js`| Available exam discovery for students | `createStudentExamRouter({ examRepo })` |
| `routes/admin.js` | User provisioning, role switching, system settings, role permissions, audit query | `createAdminRouter({ userRepo, settingsRepo, permissionsRepo, auditRepo })` |
| `services/objectiveScoring.js` | Deterministic MCQ scoring, option-index normalization, evaluation breakdown | `gradeObjectiveExam({ questions, answers })` |
| `services/questionSelection.js` | Uniform sampling without replacement and attempt order shuffling | `selectRandomQuestions(pool, count)`, `shuffleQuestions(questions)` |
| `services/permissions.js` | Role permission matrix and dynamic overrides | `canRolePerform(role, permission)`, `getEffectivePermissions()` |
| `services/settings.js` | Whitelisted system configuration management | `getSettings()`, `updateSetting(key, val, actorId)` |
| `services/audit.js` | Fire-and-forget resilient audit event recorder | `recordAuditLog({ actorId, action, entityType, entityId, details })` |
| `repositories/examRepository.js` | Prisma-backed data gateway for exams, questions, attempts, and reports | `createPrismaExamRepository(prisma)` |
| `repositories/questionRepository.js`| Prisma-backed gateway for question pools and questions | `createPrismaQuestionRepository(prisma)` |
| `repositories/userRepository.js` | Prisma-backed gateway for user accounts and credentials | `createPrismaUserRepository(prisma)` |

### 4.2 Client Module Hierarchy (`client/src`)

| Component / Module | Responsibility |
|---|---|
| `App.jsx` | Top-level state container; determines view based on auth token and user role |
| `LoginPage.jsx` | Role tabs (Student, Teacher, Admin), input validation, login API dispatcher |
| `Dashboard.jsx` | Student examination portal shell: lists available exams, manages timer, coordinates question navigation and submit modal |
| `TeacherExamManagement.jsx` | Exam creation wizard, pool selector, duration/availability timing controls, and publish action |
| `TeacherExamReports.jsx` | Exam performance metrics: average score, pass rates, score distribution, and student attempt lists |
| `StudentExamView.jsx` | Review interface for completed exams and released grades |
| `AdminPanel.jsx` | User management table, role privilege toggles, system settings editor, and audit log viewer |
| `api.js` | Typed HTTP client wrapping `fetch` with token injection and unified error handling |
| `auth.js` | Session storage abstraction (`localStorage`/`sessionStorage`), token lifecycle management |

---

## 5. Detailed System Workflows & Sequence Diagrams

### 5.1 Exam Creation, Random Selection & Publishing Flow (FR-07, FR-08, FR-09, FR-10)

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant Client as Frontend (TeacherExamManagement)
    participant ExamRoute as /api/exams
    participant SelectSvc as questionSelection
    participant ExamRepo as examRepository
    participant DB as PostgreSQL

    Teacher->>Client: Configure Exam (Title, Duration, Availability, Pool, QuestionCount)
    Client->>ExamRoute: POST /api/exams (payload + Bearer Token)
    ExamRoute->>ExamRepo: createExam(data)
    ExamRepo->>DB: INSERT INTO Exam
    DB-->>ExamRoute: Exam Record (Draft)
    ExamRoute-->>Client: 201 Created (Exam Draft)

    Note over Teacher, DB: Publishing Exam & Freezing Question Set
    Teacher->>Client: Click "Publish Exam"
    Client->>ExamRoute: POST /api/exams/:id/publish
    ExamRoute->>ExamRepo: getQuestionPoolQuestions(poolId)
    ExamRepo->>DB: SELECT Questions WHERE poolId
    DB-->>ExamRoute: Available Pool Questions
    ExamRoute->>SelectSvc: selectRandomQuestions(poolQuestions, N)
    SelectSvc-->>ExamRoute: Exactly N Random Questions
    ExamRoute->>ExamRepo: publishExam(examId, selectedQuestionIds)
    ExamRepo->>DB: INSERT INTO ExamQuestion (fixed set) & UPDATE Exam SET isPublished=true
    DB-->>ExamRoute: Success
    ExamRoute-->>Client: 200 OK (Exam Published & Questions Frozen)
```

### 5.2 Student Attempt Lifecycle & Duration Enforcement (FR-12, FR-13, FR-14, FR-15, FR-17, FR-18)

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Client as Frontend (Dashboard)
    participant ExamRoute as /api/exams
    participant ScoreSvc as objectiveScoring
    participant AuditSvc as audit
    participant DB as PostgreSQL

    Student->>Client: Click "Start Exam"
    Client->>ExamRoute: POST /api/exams/:id/start
    Note over ExamRoute: Server clock stamps startedAt.<br/>Ignores client body timestamp.
    ExamRoute->>DB: INSERT INTO ExamAttempt (status: IN_PROGRESS, startedAt: NOW)
    DB-->>ExamRoute: Attempt Created
    ExamRoute-->>Client: 201 Created { attemptId, startedAt, durationMinutes }

    Client->>ExamRoute: GET /api/exams/:id/questions
    Note over ExamRoute: Sanitization: correctAnswer<br/>stripped for STUDENT role (SEC-06)
    ExamRoute-->>Client: 200 OK [Questions without answers]

    Note over Student, Client: Student selects choices. Timer counts down.
    Student->>Client: Click "Submit Exam" (or Timer Reaches 0)
    Client->>ExamRoute: POST /api/exams/:id/attempts { attemptId, answers }

    Note over ExamRoute: Verification Guards:<br/>1. Check attempt exists & IN_PROGRESS<br/>2. Duration check: (now - startedAt) <= duration<br/>3. Verify single submission per student
    ExamRoute->>ScoreSvc: gradeObjectiveExam(storedQuestions, submittedAnswers)
    ScoreSvc-->>ExamRoute: { score, totalMarks, evaluation }

    ExamRoute->>DB: UPDATE ExamAttempt SET status='SUBMITTED', score, submittedAt=NOW
    ExamRoute->>AuditSvc: recordAuditLog(EXAM_SUBMITTED, studentId, examId)
    DB-->>ExamRoute: Persisted Attempt
    ExamRoute-->>Client: 200 OK { message: "Exam submitted", score, totalMarks }
```

### 5.3 Scheduled Result Release Flow (FR-19, SEC-06)

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Client as Frontend (StudentExamView)
    participant ExamRoute as /api/exams
    participant DB as PostgreSQL

    Student->>Client: Request Exam Results
    Client->>ExamRoute: GET /api/exams/:id/results
    ExamRoute->>DB: Query Exam resultReleaseTime & Student Attempt

    alt Current Time < resultReleaseTime
        Note over ExamRoute: Results withheld to prevent collusion (SEC-06)
        ExamRoute-->>Client: 403 Forbidden { available: false, message: "Results release at [timestamp]" }
        Client-->>Student: Display "Results will be released on [Date]"
    else Current Time >= resultReleaseTime
        ExamRoute-->>Client: 200 OK { score, totalMarks, evaluation, released: true }
        Client-->>Student: Display Detailed Grade & Question Review
    end
```

---

## 6. Attempt Lifecycle State Machine

The attempt state machine governs candidate progression from initiation through final grading:

```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED : Exam Available & Published

    NOT_STARTED --> IN_PROGRESS : POST /api/exams/:id/start\n[Server stamps startedAt]

    state IN_PROGRESS {
        [*] --> ANSWERING
        ANSWERING --> ANSWERING : Client records choice in local session
    }

    IN_PROGRESS --> SUBMITTED : POST /api/exams/:id/attempts\n[elapsed <= duration && status == IN_PROGRESS]
    IN_PROGRESS --> EXPIRED_REJECTED : Late Submission\n[elapsed > duration + grace period]
    
    SUBMITTED --> RESULTS_PENDING : now < resultReleaseTime\n[Scores withheld]
    RESULTS_PENDING --> RESULTS_RELEASED : now >= resultReleaseTime\n[Full review visible]
    SUBMITTED --> RESULTS_RELEASED : No release delay set

    EXPIRED_REJECTED --> [*]
    RESULTS_RELEASED --> [*]
```

---

## 7. Data Architecture & Entity Relationships

The data model is defined in Prisma schema (`server/prisma/schema.prisma`) and backed by PostgreSQL:

```mermaid
erDiagram
    User ||--o{ ExamAttempt : "submits"
    User ||--o{ AuditLog : "initiates"
    QuestionPool ||--o{ Question : "contains"
    QuestionPool ||--o{ Exam : "supplies"
    Exam ||--o{ ExamQuestion : "includes"
    Question ||--o{ ExamQuestion : "referenced in"
    Exam ||--o{ ExamAttempt : "attempted via"

    User {
        int id PK
        string email UK
        string name
        string passwordHash
        Role role "STUDENT | TEACHER | ADMIN"
        boolean isActive
        datetime createdAt
    }

    QuestionPool {
        string id PK
        string name UK
        datetime createdAt
    }

    Question {
        string id PK
        string text
        string[] options
        string correctAnswer
        QuestionDifficulty difficulty "EASY | MEDIUM | HARD"
        string questionPoolId FK
        datetime createdAt
        datetime updatedAt
    }

    Exam {
        string id PK
        string title
        int questionCount
        int durationMinutes
        datetime startTime
        datetime endTime
        boolean isPublished
        datetime publishedAt
        datetime resultReleaseTime
        string questionPoolId FK
        datetime createdAt
        datetime updatedAt
    }

    ExamQuestion {
        string id PK
        string examId FK
        string questionId FK
        int orderIndex
    }

    ExamAttempt {
        string id PK
        string examId FK
        int studentId FK
        string status "IN_PROGRESS | SUBMITTED"
        int score
        int totalMarks
        json answers
        json evaluation
        datetime startedAt
        datetime submittedAt
    }

    AuditLog {
        int id PK
        int actorId
        string action
        string entityType
        string entityId
        json details
        datetime createdAt
    }

    SystemSetting {
        string key PK
        string value
        int updatedById
        datetime updatedAt
    }

    RolePermission {
        Role role PK
        string permission PK
        boolean granted
    }
```

### 7.1 Relational Integrity Rules
1. **Cascade & Restrict Policies**:
   - `Exam` to `QuestionPool`: `onDelete: Restrict` prevents accidental deletion of question pools referenced by existing exams.
   - `ExamQuestion` to `Exam`: `onDelete: Cascade` ensures question links are cleaned up if a draft exam is deleted.
   - `ExamQuestion` to `Question`: `onDelete: Restrict` protects questions referenced in active exams from deletion (`VAL-F13`).
   - `ExamAttempt` to `Exam` & `User`: `onDelete: Restrict` guarantees immutable historical records for audits and grading.
2. **Indexing Strategy**:
   - `AuditLog`: Composite indexes on `[createdAt]` and `[actorId]` optimize admin query filtering.
   - `ExamAttempt`: Composite index on `[examId, studentId]` enables O(1) duplicate submission checks and attempt retrieval.
   - `Question`: Composite index on `[questionPoolId, createdAt]` accelerates pool queries and random selection.

---

## 8. Security & Access Control Architecture

### 8.1 Authentication & Token Architecture
- **Cryptographic Signature**: JSON Web Tokens (JWT) signed via HMAC-SHA256 (`HS256`).
- **Enforced Entropy**: System strictly refuses to initialize with secrets shorter than 32 characters (`assertSecret`).
- **Token Claims**: Contains authenticated `userId`, `email`, and `role`. Tokens expire after a configurable duration (default: `24h` / `1h`).
- **Session Rate Limiting**: Repeated failed login attempts are throttled per IP/email using `createLoginLimiter` to mitigate brute-force attacks.

### 8.2 Role-Based Access Control (RBAC) Matrix

| Endpoint Group | Resource / Action | STUDENT | TEACHER | ADMIN | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|---|
| `/api/auth/*` | Login & Profile Me | Allowed | Allowed | Allowed | `authenticate` |
| `/api/student/exams` | View Available Exams | **Allowed** | Denied (403) | Denied (403) | `requireRole('STUDENT')` |
| `/api/exams/:id/start` | Start Attempt | **Allowed** | Denied (403) | Denied (403) | `requireRole('STUDENT')` |
| `/api/exams/:id/attempts` | Submit Exam Attempt | **Allowed** | Denied (403) | Denied (403) | `requireRole('STUDENT')` |
| `/api/exams/:id/results` | View Released Results | **Allowed** | Allowed | Allowed | Gated by `resultReleaseTime` |
| `/api/exams` | Create Draft Exam | Denied (403) | **Allowed** | **Allowed** | `requireRole('TEACHER', 'ADMIN')` |
| `/api/exams/:id/publish` | Publish Exam & Freeze | Denied (403) | **Allowed** | **Allowed** | `requireRole('TEACHER', 'ADMIN')` |
| `/api/exams/:id/report` | View Aggregate Reports | Denied (403) | **Allowed** | **Allowed** | `requireRole('TEACHER', 'ADMIN')` |
| `/api/questions/*` | Create/Edit Questions | Denied (403) | **Allowed** | **Allowed** | `requireRole('TEACHER', 'ADMIN')` |
| `/api/admin/*` | User & Settings Mgmt | Denied (403) | Denied (403) | **Allowed** | `requireRole('ADMIN')` |

### 8.3 Anti-Cheating & Integrity Protections
1. **Information Leakage Prevention (SEC-06)**: Question fetching endpoints dynamically inspect the requester's role. For `STUDENT` requests, `correctAnswer` is omitted from JSON payloads.
2. **Server-Side Scoring**: Submissions pass only the student's selected choices (`{ questionId: selectedOption }`). The score is computed server-side by iterating over the stored question keys. Any client-submitted score is discarded.
3. **Identity Derivation**: `studentId` is strictly extracted from `req.auth.userId`. Body spoofing attacks (e.g. attempting to submit as another user ID) are neutralized.
4. **Duration Enforcement**: The server records `startedAt` during `/start` and rejects submissions where `(currentTime - startedAt) > durationMinutes * 60 * 1000 + gracePeriod`.
5. **Single-Submission Lock**: Exactly one attempt per student per exam is permitted; duplicate submissions return HTTP 409 Conflict.

---

## 9. Non-Functional Quality Attribute Verification

| NFR Identifier | Description | Target SLA | Verified As-Built Capability | Verification Reference |
|---|---|---|---|---|
| **NFR-01** | UI Usability & Simplicity | Clean portal tabs | Tabbed login, clear status badges, intuitive timer | `client/src/Dashboard.jsx` |
| **NFR-02** | Data Persistence Across Restarts | Zero data loss | PostgreSQL ACID durability verified | `server/test/sprint2_manasvi.test.js` |
| **NFR-03** | API Latency & Performance | $\le 3\text{ seconds}$ under normal load | Average response $< 10\text{ ms}$; all routes respond in $< 60\text{ ms}$ | `server/test/nfr03_performance.test.js` |
| **NFR-04** | High System Availability | Continuous uptime during exam windows | 100% successful health and question pings across simulated exam window | `server/test/nfr04_availability.test.js` |
| **NFR-07** | Modular Decoupling | Clean separation of concerns | Repositories swappable; DI across all routes | `docs/architecture-modules.md` |
| **NFR-10** | Scalability & Concurrency | 50 concurrent students | 50 parallel requests handled with 0% error rate | `server/test/nfr10_scalability.test.js` |
| **NFR-11** | Relational Data Integrity | Foreign key consistency | Prisma foreign keys with Restrict/Cascade rules | `server/test/sprint2_manasvi.test.js` |
| **NFR-12** | Audit Trail Compliance | Immutable administrative logging | Non-blocking async audit logging for all critical operations | `server/test/admin.test.js` |
| **B-15** | Comprehensive Security Validation | Zero unauthorized escalations | 100% passing automated penetration and boundary suite | `server/test/b15_security.test.js` |

---

## 10. Architectural Evolution & Deviations Summary

As documented in `docs/deviations-note.md`, the architecture evolved from the preliminary Phase 1 draft to the robust Phase 2 as-built release:
1. **Focus on Deterministic Objective MCQs**: Prioritized objective grading to ensure mathematically certain, instant automated grading and elimination of subjective scoring latency.
2. **Deterministic Random Sampling**: Replaced on-the-fly random questions with a two-phase selection: uniform random sampling at publish time, creating an identical fixed `ExamQuestion` set for all candidates.
3. **Strict State Machine & Timing Enforcement**: Transitioned from client-driven timers to a server-authoritative attempt state machine (`IN_PROGRESS` $\to$ `SUBMITTED`) using server clock timestamps.
4. **Enterprise Administration & Dynamic RBAC**: Incorporated administrative settings, dynamic role permission overrides, and comprehensive audit logging.
