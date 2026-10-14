# 3. Requirements Engineering

Phase 1 analysis for the Online Examination Portal (Team E6).
Contributors: Sravya (problem statement, scope, feasibility), Neha Sachin (actors, use cases), Nehaa Joshi (validation), Manasvi D R (requirement IDs and wording).

Related: [SRS and requirements](../1-SRS-and-Work-Breakdown/README.md) · [Test Planning](../2-Test-Planning/README.md) · [Use-case diagram](../UseCase_Architecture.pdf) · [UML](../ExamPortal_UML.drawio.pdf)

## 1. Problem Statement

Traditional examination processes depend on manual question preparation, physical arrangements, manual evaluation and separate result communication. This takes time, adds administrative effort and makes consistent records hard to maintain.

**Existing problems**
- Manual creation and management of question papers is time-consuming.
- Question banks and difficulty levels are hard to maintain without a centralized system.
- Students may not get a smooth process for viewing, attempting and submitting exams.
- Manual evaluation and result preparation cause delays and errors.
- Records, user roles and reports are not managed in one place.
- Question papers, answers and results are sensitive, so security and access control matter.

**Proposed solution.** A centralized web portal where students attempt examinations, teachers create and manage them, and administrators manage users, roles and system settings. It supports automatic objective-answer evaluation, secure submission storage and controlled result release.

**Problem statement.** Develop an online examination portal that simplifies examination creation, delivery, submission, evaluation and result management while maintaining secure access, reliable records and clear role-based permissions.

## 2. Objectives

- Let students securely log in, view available examinations, attempt questions and submit answers.
- Let teachers upload questions, manage question banks and create examinations.
- Support difficulty levels, random question selection and shuffled question order.
- Automatically evaluate objective answers and calculate scores.
- Let teachers and administrators view authorized examination reports.
- Release results according to the timing configured before the examination.
- Maintain secure examination attempts, user roles and system-level records.
- Provide a basis for functional, security and non-functional validation.

## 3. Scope

**In scope:** student/teacher/administrator login; question upload, difficulty and question-bank management; examination creation with duration, availability and result-release configuration; random selection from a question pool (same set for all students, shuffled order); answering and manual/automatic submission; automatic evaluation of objective questions; controlled result release; user/role management, monitoring and system settings; functional, security, non-functional and penetration-testing plans.

**Out of scope for Phase 1:** implementation and deployment; execution of penetration tests (plan only); notification feature; subjective questions.

## 4. Stakeholders

| Stakeholder | Role | Main needs |
|---|---|---|
| Students | Primary users | Secure login, available exams, smooth attempt, saved answers, released results |
| Teachers | Examination creators/managers | Question-bank management, exam creation, timing configuration, reports |
| Administrators | System managers | User/role management, system settings, examination monitoring |
| Authentication Service | Supporting service | Credential verification and secure authentication |

The student project team is treated as the development team, not a system stakeholder.

## 5. Actors and Responsibilities

| Actor | Responsibilities |
|---|---|
| Student | Logs in, views available examinations, starts examinations, views questions, selects/saves answers, submits, views released results |
| Teacher | Logs in, uploads questions, assigns difficulty, manages the question bank, creates examinations, configures duration/availability/release time, views reports |
| Administrator | Logs in, manages users and roles, monitors examinations, manages system settings |
| Authentication Service | Verifies credentials and supports secure login |

## 6. Use Cases

**Student:** UC-S01 Login · UC-S02 View Available Examinations · UC-S03 Start Examination · UC-S04 View Questions · UC-S05 Select/Save Answers · UC-S06 Submit Examination · UC-S07 View Released Result

**Teacher:** UC-T01 Login · UC-T02 Upload Question · UC-T03 Assign Difficulty Level · UC-T04 Manage Question Bank · UC-T05 Create Examination · UC-T06 Configure Duration and Release Time · UC-T07 View Examination Report

**Administrator:** UC-A01 Login · UC-A02 Manage Users · UC-A03 Manage Roles · UC-A04 Monitor Examinations · UC-A05 Manage System Settings

**System services:** UC-X01 Authenticate User · UC-X02 Select Random Questions · UC-X03 Evaluate Objective Answers · UC-X04 Release Results · ~~UC-X05 Send Notification~~ (removed from Phase 1 scope, see [open items](#8-open-items))

### Use-Case Specification Summary

| ID | Use case | Primary actor | Main flow summary | Postcondition |
|---|---|---|---|---|
| UC-S01 | Login | Student | Submits credentials; Authentication Service verifies; access granted or rejected | User authenticated |
| UC-S02 | View Available Examinations | Student | Shows only exams available to the student; empty state if none | Student can identify available exams |
| UC-S03 | Start Examination | Student | Verifies availability, initializes attempt, selects the configured question set, presents the exam | Attempt started |
| UC-S04 | View Questions | Student | Displays selected questions with navigation; order follows shuffle policy | Student can view required questions |
| UC-S05 | Select/Save Answers | Student | Records selected answers; allows changes before submission | Answers available for submission |
| UC-S06 | Submit Examination | Student | Manual submit, or automatic submit at time expiry; attempt stored securely | Attempt submitted and stored |
| UC-S07 | View Released Result | Student | Checks release status and authorization before showing result | Authorized student views released result |
| UC-T01 | Login | Teacher | Submits credentials; Authentication Service verifies | Teacher authenticated |
| UC-T02 | Upload Question | Teacher | Enters question details; system validates and stores | Valid question stored |
| UC-T03 | Assign Difficulty Level | Teacher | Selects a question and assigns a supported difficulty level | Difficulty recorded |
| UC-T04 | Manage Question Bank | Teacher | Views, edits or removes questions (before publication only) | Question bank updated |
| UC-T05 | Create Examination | Teacher | Enters exam details, configures questions, creates exam after validation | Valid exam created |
| UC-T06 | Configure Duration and Release Time | Teacher | Configures duration, availability and result-release timing before the exam begins | Timing saved |
| UC-T07 | View Examination Report | Teacher | Verifies authorization and displays permitted report | Authorized report displayed |
| UC-A01 | Login | Administrator | Submits credentials and receives authorized access | Administrator authenticated |
| UC-A02 | Manage Users | Administrator | Performs permitted user operations; changes validated and recorded | User change recorded |
| UC-A03 | Manage Roles | Administrator | Assigns or changes roles subject to authorization rules | Role change recorded |
| UC-A04 | Monitor Examinations | Administrator | Displays permitted system-level exam status and information | Authorized monitoring available |
| UC-A05 | Manage System Settings | Administrator | Updates permitted settings; invalid values rejected | Setting updated |
| UC-X01 | Authenticate User | Authentication Service | Verifies credentials and returns result | Portal receives result |
| UC-X02 | Select Random Questions | System | Selects configured number of questions from the permitted pool; same set used for the exam | Question set ready |
| UC-X03 | Evaluate Objective Answers | System | Compares submitted answers with correct answers and calculates score | Answers evaluated |
| UC-X04 | Release Results | System | Checks configured release time and makes authorized results available | Results released per policy |

## 7. Requirements Traceability Matrix (RTM)

FR = Functional Requirement, UC = Use Case, VAL = Validation ID (see [Test Planning](../2-Test-Planning/README.md)).

| Req. ID | Requirement | Use case | Validation |
|---|---|---|---|
| FR-01 | Student login | UC-S01 | VAL-F01 |
| FR-02 | Teacher login | UC-T01 | VAL-F01 |
| FR-03 | Administrator user/role management | UC-A01, UC-A02, UC-A03, UC-A05 | VAL-F01, VAL-F15, VAL-F16, VAL-F18 |
| FR-04 | Create examination | UC-T05 | VAL-F04 |
| FR-05 | Upload questions | UC-T02 | VAL-F02 |
| FR-06 | Assign difficulty level | UC-T03 | VAL-F03 |
| FR-07 | Edit/remove questions before publication | UC-T04 | VAL-F13 |
| FR-08 | Configure exam duration and availability | UC-T06 | VAL-F04 |
| FR-09 | Random question selection | UC-S03, UC-X02 | VAL-F05 |
| FR-10 | Same question set for all students | UC-S03, UC-X02 | VAL-F05 |
| FR-11 | Shuffle question order | UC-S03, UC-S04 | VAL-F06 |
| FR-12 | Display examination questions | UC-S04 | VAL-F06 |
| FR-13 | Select/save answers | UC-S05 | VAL-F12 |
| FR-14 | Automatic submission at time expiry | UC-S06 | VAL-F07 |
| FR-15 | Manual submission | UC-S06 | VAL-F07 |
| FR-16 | Automatic evaluation of objective questions | UC-X03 | VAL-F08 |
| FR-17 | Calculate score | UC-X03 | VAL-F08 |
| FR-18 | Securely store examination attempts | UC-S06 | VAL-S11 |
| FR-19 | Release results at configured time | UC-S07, UC-X04 | VAL-F09, VAL-F10 |
| FR-20 | View examination reports | UC-T07, UC-A04 | VAL-F14, VAL-F17 |
| FR-21 | View available examinations | UC-S02 | VAL-F11 |
| FR-22 | Administrator login | UC-A01 | VAL-F01 |
| FR-23 | Manage system settings | UC-A05 | VAL-F18 |
| FR-24 | Manage access permissions by role | UC-A03 | VAL-F16 |
| NFR-01 | Authenticated access and role-based authorization | Cross-cutting | VAL-S01 to VAL-S09, VAL-P01, VAL-P02 |
| NFR-02 | Reliability | Cross-cutting | VAL-N03 |
| NFR-03 | Performance (3 s under normal load) | Cross-cutting | VAL-N01 |
| NFR-04 | Availability | Cross-cutting | VAL-N05 |
| NFR-05 | Usability | Cross-cutting | VAL-N04 |
| NFR-06 | Learnability (5 min, first-time student) | Cross-cutting | VAL-N04 |
| NFR-07 | Maintainability | Cross-cutting | No validation defined yet |
| NFR-08 | Compatibility | Cross-cutting | VAL-N07 |
| NFR-09 | Testability | Cross-cutting | This RTM |
| NFR-10 | Scalability | Cross-cutting | VAL-N02, VAL-N06 |
| NFR-11 | Data integrity | Cross-cutting | VAL-S11, VAL-N03 |
| NFR-12 | Auditability | Cross-cutting | VAL-S10 |

## 8. Open Items

These need team confirmation before the RTM is frozen:

1. **Notifications.** The final SRS excludes notifications, so UC-X05 and VAL-F19 are dropped here. The top-level README still lists a Notification Service and notifications; align it.
2. **Admin use-case IDs.** The SRS handoff mapped FR-22 to a "UC-A06", FR-23 to UC-A03 and FR-24 to UC-A05, with VAL-F20 to VAL-F22. Those IDs do not exist in the use-case specification (UC-A01 is Admin Login, UC-A03 is Manage Roles, UC-A05 is Manage System Settings). The RTM above uses the use-case spec IDs and existing validations. Manasvi to confirm.
3. **NFR validation mapping.** The handoff mapped NFR-01..12 to VAL-N01..N12, but the validation plan only defines VAL-N01..N07 and they cover different qualities. The NFR rows above are a proposed re-mapping; NFR-07 has no validation yet.
4. **NFR-03.** Define "normal load" (concurrent users) for the 3-second target.
5. **NFR-06.** The 5-minute target is provisional and needs team approval.
6. **Connectivity loss.** Behavior when a student loses connection mid-exam is still undecided.

## 9. Confirmation Questions: Status

| Question | Decision |
|---|---|
| Objective only or subjective too? | Objective only |
| Can students change answers before submission? | Yes |
| What if a student loses connectivity? | **Open** |
| Can teachers edit/remove questions after publishing? | No, only before publication |
| Notification channel? | No notifications in Phase 1 |
| Who can view reports? | Teachers and authorized administrators |
| Automatic or approved result release? | Automatic at the configured time |

## 10. Feasibility Analysis

| Area | Analysis |
|---|---|
| Technical | Achievable with common web technologies, a database, role-based authentication and server-side validation. Main concerns: secure sessions, concurrent attempts, reliable submission storage, controlled result access. |
| Operational | Student, teacher and administrator workflows are clearly separated; a central portal reduces manual work. |
| Economic | Open-source tools and existing academic infrastructure; costs are hosting, maintenance and backups. |
| Schedule | Divisible into authentication, question bank, examination management, student attempt, evaluation, results and administration modules. |
| Security | Role-based access control, secure authentication, input validation, session management, audit logging and protected question/result data are achievable. |
| Legal/Ethical | Protect student information, restrict unauthorized access, keep accurate records, and do not expose questions or results before release. |
