# 1. SRS and Work Breakdown

Phase 1 requirements baseline for the Online Examination Portal (Team E6).
Requirement IDs and wording were finalized by Manasvi D R. The full SRS is in [`SRS.pdf`](../SRS.pdf); the source handoff is [`Manasvi_Requirements_and_RTM.docx`](Manasvi_Requirements_and_RTM.docx).

Related: [Requirements Engineering](../3-Requirements-Engineering/README.md) · [Test Planning](../2-Test-Planning/README.md) · [Sprint plan](../docs/sprint-backlog.md)

## Finalized Examination Rules

- Objective-type questions only.
- Questions are randomly selected from the predefined question pool.
- All students attempting the same examination receive the same selected question set.
- Selected questions are presented in shuffled order.
- Students can revisit and change answers before submission.
- Teachers can edit or remove questions only before the examination is published.
- No notification feature is included in Phase 1.
- Examination reports can be viewed by teachers and authorized administrators.
- Results are automatically released at the configured result-release time.
- The teacher configures the examination duration and availability period.

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | The system shall allow students to log in using valid credentials. |
| FR-02 | The system shall allow teachers to log in using valid credentials. |
| FR-03 | The system shall allow the administrator to manage users and assign or manage system roles according to authorized permissions. |
| FR-04 | The system shall allow teachers to create examinations using the configured examination settings. |
| FR-05 | The system shall allow teachers to upload questions to the question bank. |
| FR-06 | The system shall allow teachers to assign a difficulty level to each question. |
| FR-07 | The system shall allow teachers to edit or remove questions before the associated examination is published. |
| FR-08 | The system shall allow teachers to configure the examination duration and availability period. |
| FR-09 | The system shall randomly select the configured number of questions from the predefined question pool when an examination is initialized. |
| FR-10 | The system shall provide the same selected set of questions to all students attempting the same examination. |
| FR-11 | The system shall present the selected examination questions in shuffled order to students. |
| FR-12 | The system shall display the questions associated with the student's active examination attempt. |
| FR-13 | The system shall allow students to select and save answers during an examination attempt. |
| FR-14 | The system shall automatically submit an examination attempt when the configured examination duration expires. |
| FR-15 | The system shall allow students to manually submit an examination before the configured examination duration expires. |
| FR-16 | The system shall automatically evaluate objective questions using their configured correct answers. |
| FR-17 | The system shall calculate the examination score from the evaluated answers. |
| FR-18 | The system shall securely store examination attempts and their submitted answers. |
| FR-19 | The system shall automatically release examination results at the configured result-release time. |
| FR-20 | The system shall allow authorized teachers and administrators to view examination reports. |
| FR-21 | The system shall display examinations that are currently available to the logged-in student according to the configured availability period. |
| FR-22 | The system shall allow administrators to log in using valid credentials before accessing administrative functions. |
| FR-23 | The system shall allow authorized administrators to manage approved system-level settings. |
| FR-24 | The system shall allow authorized administrators to manage system access permissions according to defined roles. |

## Non-Functional Requirements

| ID | Category | Requirement | Status |
|----|----------|-------------|--------|
| NFR-01 | Security | The system shall require authenticated access for protected functions and enforce role-based authorization for Student, Teacher, and Administrator actions. | Proposed team NFR |
| NFR-02 | Reliability | The system shall preserve submitted examination answers and attempt data without loss during normal operation. | Proposed team NFR |
| NFR-03 | Performance | The system shall respond to common user actions within 3 seconds under normal load. | Proposed measurable target; "normal load" to be defined |
| NFR-04 | Availability | The system shall remain available to authorized users throughout a configured examination availability period, except during planned maintenance. | Proposed team NFR |
| NFR-05 | Usability | The system shall provide clear navigation, readable instructions, and understandable feedback for major user actions. | Proposed team NFR |
| NFR-06 | Learnability | A first-time student shall be able to start and submit an examination within 5 minutes without assistance. | Proposed measurable target; **team approval required** |
| NFR-07 | Maintainability | The system shall use modular components and documented interfaces so individual modules can be modified or tested with minimal impact on unrelated modules. | Proposed team NFR |
| NFR-08 | Compatibility | The web portal shall support the current major version of commonly used desktop web browsers used by target users. | Proposed team NFR |
| NFR-09 | Testability | Each functional and non-functional requirement shall have an associated validation or test method with observable acceptance criteria. | Proposed team NFR |
| NFR-10 | Scalability | The system shall support an increase in concurrent examination users without changing the defined examination workflow. | Proposed team NFR |
| NFR-11 | Data Integrity | The system shall maintain the integrity and consistency of questions, answers, attempts, scores, and released results throughout their lifecycle. | Proposed team NFR |
| NFR-12 | Auditability | The system shall record sufficient information about important administrative and examination actions to support review and troubleshooting. | Proposed team NFR |

## Requirement Quality Checklist

Clear · Unambiguous · Concise · Consistent · Measurable/verifiable · Feasible · Traceable · Atomic

The requirement-to-use-case-to-validation mapping is in the [RTM](../3-Requirements-Engineering/README.md#requirements-traceability-matrix-rtm).
