# Deployment and Environment Setup Guide
## Online Examination Portal — Phase 2 Setup & Operations

**Author:** Manasvi Dr. (Team E6)  
**System:** Online Examination Portal  
**Target Environment:** Local Development & Production Cloud (Neon / Render / Vercel)  
**Security Policy:** Strict Zero-Credential Compliance (all secrets parameterized via environment templates)  
**Document Version:** 2.0 (Phase 2 Final)  
**Date:** November 2026  

---

## 1. Overview & System Topology

The Online Examination Portal is structured as a decoupled two-tier web application with a managed relational database:

```
+---------------------------------------------------------------------------------------+
|                               Frontend Client (SPA)                                   |
|                Vite + React 19 Static Bundle (Hosted on Vercel / Netlify)             |
+---------------------------------------------------------------------------------------+
                                          |
                                          | HTTPS / REST API calls
                                          v
+---------------------------------------------------------------------------------------+
|                               Backend API Service                                     |
|               Node.js 20+ / Express 5 API Server (Hosted on Render / Railway)         |
+---------------------------------------------------------------------------------------+
                                          |
                                          | PostgreSQL Wire Protocol (SSL Required)
                                          v
+---------------------------------------------------------------------------------------+
|                                Relational Database                                    |
|              PostgreSQL 15+ / Neon Cloud Serverless Database (@prisma/adapter-pg)     |
+---------------------------------------------------------------------------------------+
```

> [!IMPORTANT]
> **Zero-Credential Compliance Notice**: This repository does not contain live passwords, production database URLs, or real cryptographic secrets. All configurations must be supplied via external environment variables or local `.env` files created from the templates below.

---

## 2. System Prerequisites

Ensure the following tools are installed in your deployment or development environment:

| Requirement | Supported Version | Verification Command | Purpose |
|---|---|---|---|
| **Node.js** | `>= 20.10.0` (LTS recommended) | `node -v` | JavaScript runtime environment |
| **npm** | `>= 10.0.0` | `npm -v` | Package manager |
| **PostgreSQL** | `>= 15.0` (or Neon Cloud Account) | `psql --version` | Relational database engine |
| **Git** | `>= 2.30.0` | `git --version` | Source control |

---

## 3. Environment Variables Configuration (Sanitized Templates)

### 3.1 Backend Environment Configuration (`server/.env`)

Copy the template from `server/.env.example` into `server/.env` and replace placeholders with your environment-specific values:

```bash
# Server Port to listen on (Default: 5000)
PORT=5000

# PostgreSQL Connection String (Format: postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?sslmode=require)
# Replace with your local PostgreSQL or Neon serverless endpoint:
DATABASE_URL="postgresql://db_user:sample_password@ep-sample-pool-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Cryptographic Secret for signing JSON Web Tokens (JWT)
# Security Constraint: MUST be at least 32 characters long.
# Generate a cryptographically secure 64-character secret using:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="replace-with-a-random-hex-string-of-at-least-32-characters"

# Token Lifetime (Default: 24h for normal shifts, 1h for strict security)
JWT_EXPIRES_IN="24h"

# Allowed CORS Origin for production API calls (e.g. your Vercel deployment URL)
# In local development, leave empty or set to http://localhost:5173
CORS_ORIGIN="http://localhost:5173"

# Node Environment Mode ('development' | 'production')
NODE_ENV="production"

# Master password used when provisioning initial demo accounts via `npm run seed`
# Security Constraint: Must be at least 8 characters long.
SEED_PASSWORD="SetYourOwnSecurePassword123!"
```

### 3.2 Frontend Environment Configuration (`client/.env`)

In development, Vite automatically proxies `/api` calls to `http://localhost:5000` via `vite.config.js`.

For custom deployments or staging environments, optionally define `client/.env`:

```bash
# Base URL for API calls (Optional: defaults to relative /api when using reverse proxy)
VITE_API_BASE_URL="/api"
```

---

## 4. Local Development Setup Walkthrough

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/sravya-cloud/online_examination_portal.git
cd online_examination_portal

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Database Provisioning & Schema Migration

Prisma manages all database migrations and client generation.

```bash
# Navigate to the server directory
cd server

# Create your .env file from the example template
cp .env.example .env
# Edit .env with your local PostgreSQL or Neon credentials

# Generate the Prisma Client
npx prisma generate

# Apply pending schema migrations to the database
npx prisma migrate deploy

# (Alternative for local disposable development DB)
# npx prisma db push
```

### Step 3: Seed Initial Accounts

Run the database seed script to provision default accounts for all three roles (**Student**, **Teacher**, and **Admin**):

```bash
# Ensure SEED_PASSWORD is set in server/.env or export it:
export SEED_PASSWORD="StrongDemoPassword123!"

# Execute database seeding
npm run seed
```

This creates the following initial users in your database (all assigned the specified `SEED_PASSWORD`):
- **Student Portal:** `student@example.com`
- **Teacher Portal:** `teacher@example.com`
- **Administrator Portal:** `admin@example.com`

### Step 4: Run the Application Locally

Open two terminal windows:

**Terminal 1 (Backend API Server):**
```bash
cd server
npm run dev
# Server will listen on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite dev server will start at http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser. The Vite proxy forwards all `/api` requests to `http://localhost:5000`.

---

## 5. Production Cloud Deployment Guide

### 5.1 Step 1: Cloud Database Setup (Neon PostgreSQL)

1. Create a free account at [Neon.tech](https://neon.tech).
2. Create a new PostgreSQL project named `online-exam-portal`.
3. Under **Dashboard > Connection Details**, copy the pooled connection string. Ensure `?sslmode=require` is appended.
4. Save this connection string securely in your deployment platform's environment settings as `DATABASE_URL`.

### 5.2 Step 2: Backend API Deployment (e.g. Render / Railway)

1. Connect your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Select **Web Service** with the root directory set to `server`.
3. Configure the build and runtime settings:
   - **Environment:** `Node`
   - **Node Version:** `20`
   - **Build Command:** `npm install && npx prisma migrate deploy`
   - **Start Command:** `npm start`
4. Set the required Environment Variables in the platform dashboard:
   - `DATABASE_URL` = `<your-neon-database-connection-string>`
   - `JWT_SECRET` = `<cryptographically-generated-32+-char-secret>`
   - `JWT_EXPIRES_IN` = `24h`
   - `PORT` = `5000` (or leave default assigned by platform)
   - `CORS_ORIGIN` = `https://your-portal-frontend.vercel.app`
   - `NODE_ENV` = `production`
5. Deploy service and copy the public backend URL (e.g., `https://exam-portal-api.onrender.com`).

### 5.3 Step 3: Frontend Deployment (e.g. Vercel)

1. Connect the repository to [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. If hosting frontend and backend on separate domains, configure API rewrites in `client/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://exam-portal-api.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

4. Deploy the frontend.

---

## 6. Verification & Smoke Testing (Zero Credentials Leaked)

Execute the following smoke tests against the running server:

### Test 1: Health Check Endpoint
```bash
curl -i http://localhost:5000/health
```
**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"ok"}
```

### Test 2: Authentication Check (Login)
```bash
curl -i -X POST http://localhost:5000/api/auth/login/student \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"StrongDemoPassword123!"}'
```
**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{"id":1,"email":"student@example.com","role":"STUDENT"}}
```

### Test 3: Unauthenticated Access Rejection (B-15 / Security)
```bash
curl -i http://localhost:5000/api/student/exams
```
**Expected Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"error":"Authentication required"}
```

---

## 7. Troubleshooting & Common Operational Issues

| Issue / Symptom | Root Cause | Resolution |
|---|---|---|
| `AssertionError: JWT_SECRET must be at least 32 characters long` | The `JWT_SECRET` variable in `.env` is absent or shorter than 32 characters. | Generate a 32+ character random secret using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and update `.env`. |
| `Can't reach database server at ...` | Incorrect `DATABASE_URL` or SSL configuration missing for remote PostgreSQL / Neon. | Append `?sslmode=require` to your `DATABASE_URL` string and verify outbound firewall permissions. |
| `P2002: Unique constraint failed on the fields: (email)` | Attempting to create a user or pool with a name/email that already exists. | Use a unique email or let the seed script use `upsert` rather than duplicate insertion. |
| `403 Forbidden: Privilege escalation blocked` | A user authenticated with `STUDENT` role attempted to call teacher or admin endpoints. | Verify that client tokens correspond to the appropriate role tab. Students cannot manage exams or questions. |
| Client shows CORS Error in Browser Console | `CORS_ORIGIN` in backend `.env` does not match the frontend hosting domain. | Set `CORS_ORIGIN` on the backend to match the exact frontend URL (e.g. `https://your-frontend.vercel.app`). |
