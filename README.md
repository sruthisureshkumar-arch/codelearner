# CodeLearner LMS - Multi-Language Coding Assessment Platform

*Collaborative project — [Sruthi Sureshkumar](https://github.com/sruthisureshkumar-arch) & [Thaarini](https://github.com/thaarini18)*

> **This fork extends the base LMS with two major systems built by Sruthi:**
> - A **multi-language code execution engine** that dynamically routes submissions to Judge0 (C, C++, Python, Java, JavaScript, C#, Ruby, SQL) and a local SPIM runtime (MIPS Assembly), persisting per-student attempt history in MongoDB
> - An **LLM-powered scaffolding engine** that auto-generates personalized starter templates and enables end-to-end problem authoring, test case definition, and submission tracking natively within the platform

---

A full-stack Learning Management System built for teaching programming — with support for coding questions, automated test case evaluation, and multi-language code execution including MIPS Assembly.

## Features

### For Teachers

- Create and manage courses with a custom join code and enrollment password
- Add coding questions with descriptions, starter code, and model answers
- Define test cases with expected outputs — supports Setup SQL and Append SQL for database questions
- View per-question submission history sorted by roll number
- Gradebook with best scores and attempt counts per student
- Delete courses (removes all associated questions, submissions, and grades)

### For Students

- Join courses using a course code, password, and roll number
- Write and submit code directly in the browser
- Instant feedback with test case results and pass/fail breakdown
- View submission history and grades per course

### Languages Supported

- MIPS Assembly (via local SPIM)
- C, C++, Python, Java, JavaScript, C#, Ruby (via Judge0)
- SQL / SQLite (via Judge0) — with table setup and verification test cases

---

## Tech Stack

| Layer          | Technology                   |
| -------------- | ---------------------------- |
| Frontend       | React 18                     |
| Backend        | Node.js, Express.js          |
| Database       | MongoDB (Mongoose)           |
| Auth           | JWT (7-day expiry), bcryptjs |
| Code execution | Judge0 API, SPIM (MIPS)      |
| LLM Scaffolding | LLM Integration (template generation) |

---

## Project Structure

```
code-learner-lms-main/
└── lms-app/
    ├── backend/
    │   ├── src/
    │   │   ├── controllers/   # auth, course, question, submission, grade
    │   │   ├── models/        # User, Course, Enrollment, Question, Submission, Grade
    │   │   ├── routes/        # REST API routes
    │   │   └── middleware/    # JWT auth middleware
    │   ├── seed.js            # Seeds demo questions into default course
    │   └── seedTestCourse.js  # Seeds TestCourse with 20 demo questions
    └── frontend/
        └── src/
            ├── pages/         # Login, TeacherDashboard, StudentDashboard
            └── App.js         # Multi-course state management
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- SPIM installed for MIPS execution (`brew install spim` on Mac)

### 1. Clone the repo

```bash
git clone https://github.com/sruthisureshkumar-arch/codelearner.git
cd codelearner/code-learner-lms-main/lms-app
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file:

```
MONGO_URI=mongodb://localhost:27017/code-learner-lms
JWT_SECRET=your_secret_key
PORT=5000
```

Start the server:

```bash
node src/server.js
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
```

The app runs at `http://localhost:3000`.

### 4. Seed demo questions (optional)

With the backend running:

```bash
cd backend
node seedTestCourse.js
```

This creates a teacher account (`testcourse_teacher` / `teacher123`) and a course called **TestCourse** with 20 demo questions across MIPS, C, C++, Python, Java, JavaScript, C#, Ruby, and SQL.

Students can join with:
- **Course code:** shown in terminal output after seeding
- **Password:** `teacher123`

---

## API Overview

| Method | Endpoint                        | Description                            |
| ------ | ------------------------------- | -------------------------------------- |
| POST   | `/api/auth/register`            | Register student or teacher            |
| POST   | `/api/auth/login`               | Login                                  |
| POST   | `/api/courses`                  | Create course (teacher)                |
| DELETE | `/api/courses/:code`            | Delete course (teacher)                |
| POST   | `/api/courses/enroll`           | Enroll in a course (student)           |
| GET    | `/api/questions`                | Get questions for active course        |
| POST   | `/api/questions`                | Create question (teacher)              |
| POST   | `/api/submissions`              | Submit code for evaluation             |
| GET    | `/api/submissions/question/:id` | Get submissions per question (teacher) |
| GET    | `/api/grades/:courseId`         | Get gradebook                          |

---

## SQL Test Cases

For SQL questions, test cases support three fields:

- **Setup SQL** — runs before the student's code (e.g. `CREATE TABLE`, `INSERT`)
- **Append SQL** — runs after the student's code (e.g. insert test data, then `SELECT` to verify)
- **Expected output** — pipe-separated rows the SELECT should return (e.g. `Bob|Marketing`)

This allows deterministic grading even when students write their own `CREATE TABLE` statements.
