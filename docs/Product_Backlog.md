# Product Backlog: Online Examination Portal (Team E6)

Source: `SRS.pdf` v1.0 (FR-01 to FR-24, NFR-01 to NFR-12). Security requirements SEC-01 to SEC-10 are covered inside NFR-01, FR-18, FR-19 and NFR-12.

Replace *Member 1 to 4* with real team members' names before assigning. Story points use a Fibonacci-style scale (1, 2, 3, 5) and are estimates the team can adjust until 19 Oct.

**Totals:** Sprint 1 = 56 points (19 items), Sprint 2 = 53 points (17 items), whole backlog = 109 points (36 items).

## Sprint 1 (19 to 23 Oct): working core flow
Goal: login, question bank, exam creation, and the student attempt flow with manual submit, ready for the 1-minute demo.

| ID | Backlog item | Area | Story Points | Assignee |
|---|---|---|---|---|
| FR-01 | Student login | Authentication | 3 | Member 1 |
| FR-02 | Teacher login | Authentication | 2 | Member 1 |
| FR-22 | Administrator login | Authentication | 2 | Member 1 |
| FR-05 | Upload questions to question bank | Question Bank | 5 | Member 2 |
| FR-06 | Assign difficulty level to questions | Question Bank | 2 | Member 2 |
| FR-07 | Edit or remove questions before publishing | Question Bank | 3 | Member 2 |
| FR-04 | Create examinations | Exam Configuration | 5 | Member 2 |
| FR-08 | Configure exam duration and availability period | Exam Configuration | 3 | Member 2 |
| FR-21 | Display available examinations to students | Exam Attempt | 3 | Member 3 |
| FR-09 | Random selection of questions from pool | Exam Attempt | 5 | Member 3 |
| FR-10 | Same question set for all students | Exam Attempt | 3 | Member 3 |
| FR-11 | Shuffle question order | Exam Attempt | 2 | Member 3 |
| FR-12 | Display questions of active attempt | Exam Attempt | 3 | Member 3 |
| FR-13 | Select and save answers | Exam Attempt | 5 | Member 3 |
| FR-15 | Manual submission | Exam Attempt | 3 | Member 3 |
| NFR-01 | Security: authenticated access and role-based authorization | NFR | 3 | Member 1 |
| NFR-07 | Maintainability: modular components | NFR | 1 | Member 4 |
| NFR-08 | Compatibility: current desktop browsers | NFR | 1 | Member 4 |
| NFR-09 | Testability: validation per requirement | NFR | 2 | Member 4 |

**Sprint 1 total: 56 points**

## Sprint 2 (26 to 30 Oct): evaluation, results, administration, quality
Goal: auto-submit, evaluation, result release, reports, administration, remaining NFRs, documentation, then development freeze.

| ID | Backlog item | Area | Story Points | Assignee |
|---|---|---|---|---|
| FR-14 | Auto-submit on duration expiry | Exam Attempt | 5 | Member 3 |
| FR-16 | Automatic evaluation of objective questions | Evaluation & Results | 5 | Member 4 |
| FR-17 | Calculate exam score | Evaluation & Results | 3 | Member 4 |
| FR-18 | Securely store attempts and answers | Evaluation & Results | 5 | Member 4 |
| FR-19 | Automatic result release at configured time | Evaluation & Results | 5 | Member 4 |
| FR-20 | View examination reports | Reports | 5 | Member 4 |
| FR-03 | Admin: manage users and roles | Administration | 5 | Member 1 |
| FR-23 | Admin: manage system-level settings | Administration | 3 | Member 1 |
| FR-24 | Admin: manage access permissions by role | Administration | 3 | Member 1 |
| NFR-02 | Reliability: no loss of submitted data | NFR | 2 | Member 4 |
| NFR-03 | Performance: common actions within 3 seconds | NFR | 2 | Member 2 |
| NFR-04 | Availability during exam window | NFR | 1 | Member 2 |
| NFR-05 | Usability: clear navigation and feedback | NFR | 2 | Member 3 |
| NFR-06 | Learnability: first-time student finishes within 5 minutes | NFR | 1 | Member 3 |
| NFR-10 | Scalability: more concurrent users | NFR | 1 | Member 2 |
| NFR-11 | Data integrity | NFR | 2 | Member 4 |
| NFR-12 | Auditability: log important actions | NFR | 3 | Member 1 |

**Sprint 2 total: 53 points**

## Item details

### FR-01: Student login
- **Sprint:** 1  |  **Story Points:** 3  |  **Assignee:** Member 1
- **Story:** As a student, I want to log in with valid credentials so that I can access my exams.
- **Acceptance criteria:** Valid credentials open the student dashboard; invalid ones show a clear error (VAL-F01).

### FR-02: Teacher login
- **Sprint:** 1  |  **Story Points:** 2  |  **Assignee:** Member 1
- **Story:** As a teacher, I want to log in with valid credentials so that I can manage questions and exams.
- **Acceptance criteria:** Valid credentials open the teacher dashboard; invalid ones are rejected (VAL-F01).

### FR-22: Administrator login
- **Sprint:** 1  |  **Story Points:** 2  |  **Assignee:** Member 1
- **Story:** As an administrator, I want to log in with valid credentials before using admin functions.
- **Acceptance criteria:** Admin dashboard is reachable only after successful login (VAL-F20).

### FR-05: Upload questions to question bank
- **Sprint:** 1  |  **Story Points:** 5  |  **Assignee:** Member 2
- **Story:** As a teacher, I want to upload questions to the question bank so that exams can use them.
- **Acceptance criteria:** Objective questions with options and correct answer are saved and listed (VAL-F02).

### FR-06: Assign difficulty level to questions
- **Sprint:** 1  |  **Story Points:** 2  |  **Assignee:** Member 2
- **Story:** As a teacher, I want to set a difficulty level on each question.
- **Acceptance criteria:** Every saved question stores a difficulty value that can be viewed (VAL-F03).

### FR-07: Edit or remove questions before publishing
- **Sprint:** 1  |  **Story Points:** 3  |  **Assignee:** Member 2
- **Story:** As a teacher, I want to edit or delete questions until the exam is published.
- **Acceptance criteria:** Edit/delete works before publish and is blocked after publish (VAL-F13).

### FR-04: Create examinations
- **Sprint:** 1  |  **Story Points:** 5  |  **Assignee:** Member 2
- **Story:** As a teacher, I want to create an exam using configured settings.
- **Acceptance criteria:** An exam record is created with title, question count and pool selection (VAL-F04).

### FR-08: Configure exam duration and availability period
- **Sprint:** 1  |  **Story Points:** 3  |  **Assignee:** Member 2
- **Story:** As a teacher, I want to set the exam duration and availability window.
- **Acceptance criteria:** Duration, start and end times are saved and applied to the exam (VAL-F04).

### FR-21: Display available examinations to students
- **Sprint:** 1  |  **Story Points:** 3  |  **Assignee:** Member 3
- **Story:** As a student, I want to see exams that are currently available to me.
- **Acceptance criteria:** Only exams inside their availability window are listed (VAL-F11).

### FR-09: Random selection of questions from pool
- **Sprint:** 1  |  **Story Points:** 5  |  **Assignee:** Member 3
- **Story:** As the system, I randomly pick the configured number of questions when an exam is initialized.
- **Acceptance criteria:** Exactly N questions are chosen at random from the pool (VAL-F05).

### FR-10: Same question set for all students
- **Sprint:** 1  |  **Story Points:** 3  |  **Assignee:** Member 3
- **Story:** As a teacher, I want every student on the same exam to get the same selected questions.
- **Acceptance criteria:** Question set is fixed once per exam and identical for all attempts (VAL-F05).

### FR-11: Shuffle question order
- **Sprint:** 1  |  **Story Points:** 2  |  **Assignee:** Member 3
- **Story:** As a student, I see the selected questions in shuffled order.
- **Acceptance criteria:** Order differs between attempts while the set stays the same (VAL-F06).

### FR-12: Display questions of active attempt
- **Sprint:** 1  |  **Story Points:** 3  |  **Assignee:** Member 3
- **Story:** As a student, I want to see the questions of my active attempt.
- **Acceptance criteria:** Only the active attempt's questions are shown (VAL-F06).

### FR-13: Select and save answers
- **Sprint:** 1  |  **Story Points:** 5  |  **Assignee:** Member 3
- **Story:** As a student, I want to select, save and change answers before submitting.
- **Acceptance criteria:** Answers persist and can be revisited and changed until submission (VAL-F12).

### FR-15: Manual submission
- **Sprint:** 1  |  **Story Points:** 3  |  **Assignee:** Member 3
- **Story:** As a student, I want to submit my exam before time runs out.
- **Acceptance criteria:** Submit locks the attempt and stores the answers (VAL-F07).

### NFR-01: Security: authenticated access and role-based authorization
- **Sprint:** 1  |  **Story Points:** 3  |  **Assignee:** Member 1
- **Story:** The system requires login for protected functions and enforces Student/Teacher/Administrator roles (covers SEC-01 to SEC-04, SEC-07, SEC-09, SEC-10).
- **Acceptance criteria:** Unauthenticated or wrong-role access is denied; sessions expire; errors expose no internals (VAL-N01).

### NFR-07: Maintainability: modular components
- **Sprint:** 1  |  **Story Points:** 1  |  **Assignee:** Member 4
- **Story:** Code is split into modules with documented interfaces.
- **Acceptance criteria:** Modules match the SAD; one module can be changed/tested independently (VAL-N07).

### NFR-08: Compatibility: current desktop browsers
- **Sprint:** 1  |  **Story Points:** 1  |  **Assignee:** Member 4
- **Story:** The web portal works on current major desktop browsers.
- **Acceptance criteria:** Core flows work on latest Chrome, Edge and Firefox (VAL-N08).

### NFR-09: Testability: validation per requirement
- **Sprint:** 1  |  **Story Points:** 2  |  **Assignee:** Member 4
- **Story:** Each requirement has a test method with observable acceptance criteria.
- **Acceptance criteria:** Test cases exist for each FR/NFR per the Test Plan and RTM (VAL-N09).

### FR-14: Auto-submit on duration expiry
- **Sprint:** 2  |  **Story Points:** 5  |  **Assignee:** Member 3
- **Story:** As a student, my attempt is submitted automatically when time ends.
- **Acceptance criteria:** Attempt auto-submits at expiry with saved answers intact (VAL-F07).

### FR-16: Automatic evaluation of objective questions
- **Sprint:** 2  |  **Story Points:** 5  |  **Assignee:** Member 4
- **Story:** As the system, I evaluate answers against configured correct answers.
- **Acceptance criteria:** Each answer is marked right/wrong automatically (VAL-F08).

### FR-17: Calculate exam score
- **Sprint:** 2  |  **Story Points:** 3  |  **Assignee:** Member 4
- **Story:** As the system, I calculate the score from evaluated answers.
- **Acceptance criteria:** Score equals the sum of correct answers per exam rules (VAL-F08).

### FR-18: Securely store attempts and answers
- **Sprint:** 2  |  **Story Points:** 5  |  **Assignee:** Member 4
- **Story:** As the system, I store attempts and submitted answers securely.
- **Acceptance criteria:** Attempts/answers are persisted and cannot be modified by unauthorized users (VAL-S11; SEC-05).

### FR-19: Automatic result release at configured time
- **Sprint:** 2  |  **Story Points:** 5  |  **Assignee:** Member 4
- **Story:** As a student, I see my result when the configured release time arrives.
- **Acceptance criteria:** Results are hidden before release time and visible after it (VAL-F09, VAL-F10; SEC-06).

### FR-20: View examination reports
- **Sprint:** 2  |  **Story Points:** 5  |  **Assignee:** Member 4
- **Story:** As a teacher or administrator, I want to view exam reports.
- **Acceptance criteria:** Authorized roles can open reports; students cannot (VAL-F14).

### FR-03: Admin: manage users and roles
- **Sprint:** 2  |  **Story Points:** 5  |  **Assignee:** Member 1
- **Story:** As an administrator, I want to manage users and assign roles.
- **Acceptance criteria:** Admin can create/update/disable users and set roles (VAL-F15, VAL-F16, VAL-F18).

### FR-23: Admin: manage system-level settings
- **Sprint:** 2  |  **Story Points:** 3  |  **Assignee:** Member 1
- **Story:** As an administrator, I want to manage approved system settings.
- **Acceptance criteria:** Authorized admin can view and change approved settings (VAL-F21).

### FR-24: Admin: manage access permissions by role
- **Sprint:** 2  |  **Story Points:** 3  |  **Assignee:** Member 1
- **Story:** As an administrator, I want to manage access permissions per role.
- **Acceptance criteria:** Permission changes take effect for the affected roles (VAL-F22).

### NFR-02: Reliability: no loss of submitted data
- **Sprint:** 2  |  **Story Points:** 2  |  **Assignee:** Member 4
- **Story:** Submitted answers and attempt data are not lost in normal operation.
- **Acceptance criteria:** Submitted data survives restart and normal use (VAL-N02).

### NFR-03: Performance: common actions within 3 seconds
- **Sprint:** 2  |  **Story Points:** 2  |  **Assignee:** Member 2
- **Story:** Common user actions respond within 3 seconds under normal load.
- **Acceptance criteria:** Measured response for common actions is 3 s or less (VAL-N03).

### NFR-04: Availability during exam window
- **Sprint:** 2  |  **Story Points:** 1  |  **Assignee:** Member 2
- **Story:** The system stays available throughout an exam's availability period.
- **Acceptance criteria:** No unplanned downtime during a test exam window (VAL-N04).

### NFR-05: Usability: clear navigation and feedback
- **Sprint:** 2  |  **Story Points:** 2  |  **Assignee:** Member 3
- **Story:** Navigation, instructions and feedback messages are clear.
- **Acceptance criteria:** Major actions give understandable feedback (VAL-N05).

### NFR-06: Learnability: first-time student finishes within 5 minutes
- **Sprint:** 2  |  **Story Points:** 1  |  **Assignee:** Member 3
- **Story:** A first-time student can start and submit an exam within 5 minutes unaided.
- **Acceptance criteria:** Timed trial with a new user succeeds in 5 min or less (VAL-N06).

### NFR-10: Scalability: more concurrent users
- **Sprint:** 2  |  **Story Points:** 1  |  **Assignee:** Member 2
- **Story:** The system handles more concurrent exam users without workflow change.
- **Acceptance criteria:** Load test with increased users keeps the same workflow (VAL-N10).

### NFR-11: Data integrity
- **Sprint:** 2  |  **Story Points:** 2  |  **Assignee:** Member 4
- **Story:** Questions, answers, attempts, scores and results stay consistent.
- **Acceptance criteria:** No orphaned or inconsistent records after full exam flow (VAL-N11).

### NFR-12: Auditability: log important actions
- **Sprint:** 2  |  **Story Points:** 3  |  **Assignee:** Member 1
- **Story:** Important admin and exam actions are logged (covers SEC-08).
- **Acceptance criteria:** Admin and exam actions appear in an audit log (VAL-N12).
