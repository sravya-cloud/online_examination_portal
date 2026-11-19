# 2. Test Planning

Phase 1 validation plans for the Online Examination Portal (Team E6), prepared by Nehaa Joshi. The final submission copy is [`Test_Plan.pdf`](../../output/pdf/Test_Plan.pdf); the originally submitted baseline is retained as [`Test_Plan.pdf`](Test_Plan.pdf). Requirement mapping is in the [RTM](../requirements/requirements-engineering-and-rtm.md#7-requirements-traceability-matrix-rtm).

## Requirement Testability Criteria

Clarity · Unambiguity · Completeness · Consistency · Measurability · Testability · Traceability

## Functional Validation Plan

| ID | Feature | Use case | Validation plan |
|---|---|---|---|
| VAL-F01 | Login | UC-S01 / UC-T01 / UC-A01 | Valid users can log in; invalid credentials are rejected. |
| VAL-F02 | Question upload | UC-T02 | Authorized teachers can upload valid questions. |
| VAL-F03 | Difficulty level | UC-T03 | Questions can be assigned and displayed with difficulty levels. |
| VAL-F04 | Exam creation | UC-T05 / UC-T06 | Teachers can create exams with valid settings. |
| VAL-F05 | Random selection | UC-S03 / UC-X02 | The configured number of questions is selected randomly and the same set is used for all students. |
| VAL-F06 | Question order | UC-S03 / UC-S04 | Question order is shuffled as required. |
| VAL-F07 | Exam submission | UC-S06 | Manual and automatic submission work correctly. |
| VAL-F08 | Evaluation | UC-X03 | Objective answers are evaluated correctly. |
| VAL-F09 | Result release | UC-S07 / UC-X04 | Results stay hidden before the configured release time. |
| VAL-F10 | Result viewing | UC-S07 | Authorized students can view released results. |
| VAL-F11 | View available examinations | UC-S02 | Students see only exams available to them, with an appropriate empty state. |
| VAL-F12 | Select/save answers | UC-S05 | Answers are saved, can be changed before submission, and invalid data is not stored. |
| VAL-F13 | Manage question bank | UC-T04 | Edit/removal works before publication; changes after publication are blocked. |
| VAL-F14 | View examination report | UC-T07 | Only authorized teachers can view permitted reports. |
| VAL-F15 | Manage users | UC-A02 | Administrators can perform permitted user operations; unauthorized actions are rejected. |
| VAL-F16 | Manage roles / access permissions | UC-A03 | Role assignment and permission changes follow authorization rules. |
| VAL-F17 | Monitor examinations | UC-A04 | Authorized system-level monitoring without exposing restricted information. Also covers administrator report access (FR-20). |
| VAL-F18 | Manage system settings | UC-A05 | Permitted settings can be updated; invalid values are rejected. |

VAL-F19 (Send Notification) is dropped: notifications are out of scope for Phase 1.

## Security Validation Plan

| ID | Security check |
|---|---|
| VAL-S01 | Students cannot access teacher or administrator functions. |
| VAL-S02 | Teachers cannot access administrator-only functions. |
| VAL-S03 | Unreleased question papers cannot be viewed by students. |
| VAL-S04 | Unreleased results cannot be accessed through direct URLs or requests. |
| VAL-S05 | Invalid inputs are rejected safely. |
| VAL-S06 | SQL injection and other input-manipulation risks are checked. |
| VAL-S07 | Login sessions expire or are invalidated according to policy. |
| VAL-S08 | Repeated failed login attempts are handled appropriately. |
| VAL-S09 | Sensitive information is not unnecessarily displayed in errors. |
| VAL-S10 | Important actions are recorded in an audit trail. |
| VAL-S11 | Examination attempts are stored securely and cannot be altered after submission. |

## Non-Functional Validation Plan

| ID | Quality attribute | Validation plan |
|---|---|---|
| VAL-N01 | Security and authorization (NFR-01) | Verify authentication, role restrictions, session handling, and protected operations; supplement with VAL-S and VAL-P checks. |
| VAL-N02 | Reliability (NFR-02) | Verify submitted answers and attempt data persist through normal operation and database-client reconnection. |
| VAL-N03 | Performance (NFR-03) | Measure common actions five times in the signed local one-user baseline; average and slowest response must be <= 3 seconds. |
| VAL-N04 | Availability (NFR-04) | Probe health and active-exam questions throughout the simulated exam window; document that this is a CI simulation, not production uptime. |
| VAL-N05 | Usability (NFR-05) | Observe whether main actions have clear navigation, instructions, and feedback; record notes. |
| VAL-N06 | Learnability (NFR-06) | Run the signed five-question task with at least two first-time participants; each should submit unaided within five minutes. |
| VAL-N07 | Maintainability (NFR-07) | Review module boundaries, documented interfaces, and independent testing/change isolation. |
| VAL-N08 | Compatibility (NFR-08) | Run core workflows on supported current major desktop browsers. |
| VAL-N09 | Testability (NFR-09) | Audit requirement-to-test traceability and observable pass conditions. |
| VAL-N10 | Scalability (NFR-10) | Run concurrent-user checks and observe workflow stability and data integrity. |
| VAL-N11 | Data integrity (NFR-11) | Compare relational records through critical exam operations and check for orphaned/inconsistent data. |
| VAL-N12 | Auditability (NFR-12) | Verify important admin and exam actions create usable audit records without secrets or answer content. |

## Penetration Testing Plan

Planning only for Phase 1; actual penetration testing is out of scope.

| ID | Area | Planned activity | Expected outcome |
|---|---|---|---|
| VAL-P01 | Authentication | Invalid credentials, empty fields, repeated failed logins, session misuse | Unauthorized users do not gain access |
| VAL-P02 | Authorization | Attempt teacher/admin functions with a student account | Role boundaries enforced |
| VAL-P03 | Input validation | Malformed input and common injection patterns in forms | Unsafe input rejected |
| VAL-P04 | Question confidentiality | Attempt to access question papers before the exam | Questions stay confidential |
| VAL-P05 | Result confidentiality | Attempt to view results before release time | Results stay hidden |
| VAL-P06 | Session | Logout, expiry and reuse of old sessions | Invalid sessions are unusable |
| VAL-P07 | Error handling | Trigger invalid requests and inspect errors | No sensitive technical information exposed |
