# Online Examination Portal

## 📌 Project Overview

The **Online Examination Portal** is a web based system designed to conduct and manage online examinations in a controlled and secure environment.

The system provides separate functionalities for **Students, Teachers and Administrators**. It supports examination creation, question management, student examination attempts, automatic evaluation, result management, and administrative control.

This repository contains the **Phase 1** work of the project, including the Software Requirements Specification, validation and test planning, architecture and design specifications, use cases, and related documentation.

---

## 🎯 Objectives

The main objectives of the Online Examination Portal are:

- Provide a centralized platform for conducting online examinations.
- Allow teachers to create and manage examinations and questions.
- Allow students to view and attempt available examinations.
- Automatically evaluate objective-type answers.
- Provide students with their examination results.
- Allow administrators to manage users and system settings.
- Provide role-based access to different parts of the system.
- Maintain security and controlled access throughout the examination process.
- Make the system easy to test and trace requirements using validation and RTM.

---

## 👥 Actors

The system contains five main actors:

### 1. Student
- Log in to the portal.
- View available examinations.
- Start an examination.
- Answer and submit questions.
- View examination results.

### 2. Teacher
- Manage questions.
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

The following examination rules are part of the Phase 1 requirements:

- Random question selection is enabled.
- Every student receives the **same selected set of questions** for an examination.
- The order of questions is shuffled.
- Examination duration and availability are configured before the examination starts.
- Result-release timing is configured before the examination starts and is applied accordingly.

---

## ⚙️ Main Features

### Student Module

- User authentication
- View available examinations
- Start examination
- Answer questions
- Submit examination
- View results
- Receive relevant notifications

### Teacher Module

- Create examinations
- Update examination details
- Manage question bank
- Add, update, and remove questions
- Configure examination settings
- View examination reports

### Administrator Module

- Manage users
- Manage roles
- Manage system settings
- Control administrative access

### Security

- Authentication and authorization
- Role-based access control
- Input validation
- Secure session handling
- Protection of restricted operations
- Security validation and planned penetration testing

---

