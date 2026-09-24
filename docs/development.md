# Development Guide

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  

---

## 1. Prerequisites

- **Node.js:** v22.x or v24.x (Tested with Node v24.12.0)
- **Package Manager:** npm v10+ (Tested with npm v11.6.2)
- **Operating System:** Windows, macOS, or Linux
- **Git:** Installed

---

## 2. Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd business
   ```

2. **Configure Environment:**
   Copy the example environment template:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

3. **Install Dependencies:**
   Install backend and frontend dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

---

## 3. Database Migration & Seeding

1. **Run Database Migrations:**
   ```bash
   npm run migrate
   ```
   *Creates the SQLite database file in `backend/data/marketplace.sqlite` and applies the baseline schema.*

2. **Run Initial Seeding:**
   ```bash
   npm run seed
   ```
   *Seeds the default Super Admin user and the 4 authoritative MVP materials (Sand, Bricks, Black Stone / Aggregate, Murum).*

---

## 4. Running the Development Servers

You can run both backend and frontend from the root workspace:

### Option A: Run concurrently in two terminals
- **Terminal 1 (Backend API on Port 5000):**
  ```bash
  npm run dev:backend
  ```
- **Terminal 2 (Frontend Client on Port 3000):**
  ```bash
  npm run dev:frontend
  ```

### Option B: Individual directory commands
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

---

## 5. Running Automated Tests

To run the automated foundation test suite (health checks, database readiness, auth, role authorization, validation, error formats):

```bash
npm test
```
*(or `npm run test:backend`)*

---

## 6. Building for Production

To verify TypeScript compilation and bundle production assets:

```bash
npm run build
```
- Backend compiles to `backend/dist/`
- Frontend compiles to `frontend/dist/`
