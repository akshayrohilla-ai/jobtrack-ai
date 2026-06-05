# JobTrack AI

A full-stack AI-powered job search and application tracker with a recruiter mode.

**Stack:** React + Vite · FastAPI · PostgreSQL (Supabase) · Anthropic Claude API

---

## Project Structure

```
jobtrack-ai/
├── frontend/        # React + Vite + Tailwind
├── backend/         # FastAPI + Python
└── supabase/        # SQL schema
```

---

## Prerequisites — Install These First

### 1. Node.js (for frontend)
Download from https://nodejs.org — install the LTS version (20+)
Verify: `node -v` and `npm -v`

### 2. Python 3.11+ (for backend)
Download from https://python.org
Verify: `python --version`

### 3. Git
Download from https://git-scm.com
Verify: `git --version`

---

## Accounts to Create (all free)

| Service | URL | Purpose |
|---|---|---|
| Supabase | https://supabase.com | PostgreSQL database |
| Vercel | https://vercel.com | Host frontend |
| Render | https://render.com | Host backend |
| Anthropic | https://console.anthropic.com | AI API key |

Sign up for all four with your GitHub account where possible.

---

## Local Setup — Step by Step

### Step 1 — Clone the repo
```bash
git clone https://github.com/akshayrohilla-ai/jobtrack-ai.git
cd jobtrack-ai
```

### Step 2 — Supabase database setup
1. Go to https://supabase.com → New project → name it `jobtrack-ai`
2. Wait for project to provision (~2 min)
3. Go to SQL Editor → paste the contents of `supabase/schema.sql` → Run
4. Go to Settings → API → copy:
   - Project URL → save as `SUPABASE_URL`
   - anon/public key → save as `SUPABASE_ANON_KEY`
   - service_role key → save as `SUPABASE_SERVICE_KEY`

### Step 3 — Anthropic API key
1. Go to https://console.anthropic.com → API Keys → Create Key
2. Copy it → save as `ANTHROPIC_API_KEY`

### Step 4 — Backend setup
```bash
cd backend
python -m venv venv

# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt

# Create .env file:
cp .env.example .env
# Open .env and fill in your keys

# Run backend:
uvicorn main:app --reload --port 8000
```
Backend will be live at http://localhost:8000
API docs at http://localhost:8000/docs

### Step 5 — Frontend setup
```bash
cd frontend
npm install

# Create .env file:
cp .env.example .env
# VITE_API_URL=http://localhost:8000

npm run dev
```
Frontend will be live at http://localhost:5173

---

## Deploy to Production

### Deploy backend to Render
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (same as your `.env` file)
5. Deploy → copy the URL (e.g. `https://jobtrack-ai.onrender.com`)

### Deploy frontend to Vercel
1. Go to https://vercel.com → New Project → import your GitHub repo
2. Settings:
   - Framework: Vite
   - Root directory: `frontend`
3. Environment variables:
   - `VITE_API_URL` = your Render backend URL
4. Deploy → your app is live

---

## Features

**Job Seeker Mode**
- Upload CV (PDF/DOCX) → AI extracts name, skills, experience, seniority
- Search jobs by title + city → scored against your CV profile
- Apply & Track → Kanban board (Applied → Interview → Offer → Rejected)
- Dashboard → funnel metrics, skill match stats, activity timeline

**Recruiter Mode**
- Paste job description → AI extracts required skills, seniority, domain
- Upload candidate CVs → each scored and ranked against the JD
- Shortlist candidates → manage pipeline

---

## Environment Variables

### Backend `.env`
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:8000
```
