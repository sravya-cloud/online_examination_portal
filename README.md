# Online Examination Portal

## 📌 Project Overview

The **Online Examination Portal** is a web-based system designed to conduct and manage online examinations in a controlled and secure environment.

The system provides separate functionalities for **Students, Teachers, and Administrators**. It supports examination creation, question management, student examination attempts, automatic evaluation, result management, and administrative control.

This repository contains the **Phase 1** work of the project, including the Software Requirements Specification (SRS), requirements validation, test planning, architecture and design specifications, use cases, and related project documentation.

---

## 🎯 Objectives

The main objectives of the Online Examination Portal are to:

- Provide a centralized platform for conducting online examinations.
- Allow teachers to create and manage examinations and questions.
- Allow students to view and attempt available examinations.
- Automatically evaluate objective-type answers.
- Provide students with their examination results.
- Allow administrators to manage users and system settings.
- Provide role-based access to different parts of the system.
- Maintain security and controlled access throughout the examination process.
- Support testing and requirements traceability through validation activities and the Requirements Traceability Matrix (RTM).

---

## 👥 System Actors

The system consists of five main actors:

### 1. Student
- Log in to the portal.
- View available examinations.
- Start an examination.
- Answer and submit questions.
- View examination results.

### 2. Teacher
- Manage the question bank.
- Create and manage examinations.
- Configure examination details.
- View examination-related reports.

### 3. Administrator
- Manage users.
- Manage roles and permissions.
- Manage system-level settings.
- Monitor and administer the portal.

### 4. Authentication Service
- Authenticate users.
- Support secure login and access control.

### 5. Notification Service
- Handle system notifications related to examination activities.

---

## 📝 Examination Rules

The following examination rules are defined in the Phase 1 requirements:

- Random question selection is enabled.
- Every student receives the **same selected set of questions** for a particular examination.
- The order of questions is shuffled.
- Examination duration and availability are configured before the examination starts.
- Result-release timing is configured before the examination starts and applied accordingly.

---

## ⚙️ Main Features

### Student Module
- Log in through the student portal (FR-01).
- See the examinations that are currently available (FR-21).
- Start an exam, answer questions in a per-attempt shuffled order, and submit manually or automatically when time ends (FR-11 to FR-15).
- Answers are scored on the server; results appear only after the configured release time (FR-16 to FR-19).

### Teacher Module
- Add questions to a question pool with a difficulty level, and edit or remove them until the exam is published (FR-05 to FR-07).
- Create exams with duration, availability window and result release time, then publish them to fix the question set (FR-04, FR-08 to FR-10).
- View examination reports (FR-20).

### Administrator Module
- Create users, change roles, and disable or enable accounts (FR-03).
- Change approved system settings (FR-23).
- Change what each role is allowed to do (FR-24).
- Review the audit log of administrator and exam actions (NFR-12).

### Security
- Authentication and authorization.
- Role-based access control.
- Input validation.
- Secure session handling.
- Protection of restricted operations.
- Security validation and planned penetration testing.

---

## 🛠️ Technology Stack

The selected technologies for the project are:

| Component | Technology |
|---|---|
| Frontend | React.js with Vite |
| Backend | Node.js |
| Backend Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Version Control | Git and GitHub |
| Development Environment | Visual Studio Code |

---

## 📁 Project Structure

The repository is organized as follows:

```text
online_examination_portal/
│
├── 1-SRS-and-Work-Breakdown/
├── 2-Test-Planning/
├── 3-Requirements-Engineering/
├── 4-Design-and-Architecture/
├── 5-GitHub-and-Jira-Evidence/
├── 6-GitHub-Copilot/
├── 7-Software-Testing-and-Bug-Fixes/
├── 8-Deployment-and-Environment/
├── 9-Demo/
│
├── client/                  # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/                  # Express backend
│   ├── src/
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── prisma.config.ts
│   └── package.json
│
├── docs/                    # Additional project documents
├── .gitignore
└── README.md
```

---

## 💻 Prerequisites

Ensure the following software is installed before setting up the project:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- PostgreSQL (required for database connectivity)
- Git
- Visual Studio Code (recommended)

---

## 🚀 Installation and Setup

Clone the repository:

```bash
git clone https://github.com/sravya-cloud/online_examination_portal.git
```

Navigate to the project directory:

```bash
cd online_examination_portal
```

### 1. Frontend Setup

Navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

`http://localhost:5173`

### 2. Backend Setup

Open a separate terminal and navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Start the backend development server:

```bash
npm run dev
```

The backend will run at:

`http://localhost:5000`

### 3. Database, demo accounts and tests

In `server/`, copy `.env.example` to `.env` and fill in `DATABASE_URL`, `JWT_SECRET` (32+ characters) and `SEED_PASSWORD` (8+ characters). Each team member uses their own database and `.env`; never commit it or share the connection string.

```bash
cd server
npx prisma generate
npx prisma migrate deploy
npm run seed
npm test
```

`npm run seed` creates `student@example.com`, `teacher@example.com` and `admin@example.com`, all with the seed password. Log in through the portal that matches the role.

### 4. Backend Health Check

To verify that the backend server is running, open:

`http://localhost:5000/api/health`

A successful response should indicate that the backend is running.

---

## 🗄️ Database Configuration

The project uses **PostgreSQL** as its database and **Prisma** as its ORM.

Before establishing a database connection:

1. Install and configure PostgreSQL.
2. Create the project database.
3. Configure the `DATABASE_URL` environment variable in `server/.env`.
4. Ensure the database credentials and connection details are correct.

Example environment configuration:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/online_examination_portal?schema=public"
```

**Note:** Replace the example credentials with your actual PostgreSQL configuration. The `.env` file must not be committed to GitHub.

---

## 🤝 Team Development

This project is developed collaboratively using Git and GitHub.

Team members should:

- Clone the existing project repository.
- Follow the documented installation and setup instructions.
- Work on their assigned features and requirements.
- Use separate development branches for their changes.
- Submit pull requests for code review.
- Maintain project documentation and testing evidence.

---

## 📚 Project Documentation

The repository includes supporting documentation covering:

- Software Requirements Specification (SRS).
- Work breakdown and product backlog.
- Requirements engineering and validation.
- Test planning and test cases.
- System architecture and design.
- GitHub and Jira evidence.
- GitHub Copilot activities.
- Software testing and bug fixes.
- Deployment and environment setup.
- Project demonstrations.

Phase 1 documents:

- [SRS and requirements (FR/NFR, examination rules)](1-SRS-and-Work-Breakdown/README.md)
- [Test planning (functional, security, non-functional and penetration plans)](2-Test-Planning/README.md)
- [Requirements engineering (problem statement, use cases, RTM, feasibility)](3-Requirements-Engineering/README.md)

Implementation documents are in `docs/`:

- `docs/architecture-modules.md`: module layout and rules for adding code.
- `docs/test-traceability.md`: requirement to test table.
- `docs/admin-features.md`: administrator API, settings, permissions and audit log.
- `docs/deviations-note.md`: differences from the submitted SRS, SAD and test plan.
- `docs/demo-script.md`: Sprint 1 and Sprint 2 demo scripts.
- `docs/development-freeze.md`: freeze rules and release checklist.
- `docs/nfr-acceptance-criteria.md`, `docs/browser-compatibility.md`, `docs/b15-security-validation.md` and the `nfr-*` notes: non-functional evidence.

---

**Online Examination Portal — Phase 1**  
*Collaborative Software Engineering Project*