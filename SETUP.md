# JobTrack AI — Setup on a Fresh Machine

Steps to get the project (and Claude Code) running on a new computer — your
home PC, a new laptop, or a GitHub Codespace. Takes ~10 minutes.

## What you need installed first

| Tool | Version | Why |
|------|---------|-----|
| **Git** | any recent | clone the repo |
| **Node.js** | 18+ (LTS) | run the frontend |
| **Python** | 3.11.x | run the backend (pinned in `backend/.python-version`) |
| **Claude Code** | latest | AI coding assistant |

Install Claude Code: see https://claude.com/claude-code

## 1. Clone the repo

```bash
git clone https://github.com/akshayrohilla-ai/jobtrack-ai.git
cd jobtrack-ai
```

## 2. Recreate the secret files (NOT in git)

Two `.env` files hold secrets and are deliberately **not** committed. Recreate
them from your password manager backup (or copy the values from the hosting
dashboards listed at the bottom).

**`backend/.env`** — use `backend/.env.example` as the template:
```
ANTHROPIC_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
ALLOWED_ORIGINS=http://localhost:5173
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RESEND_API_KEY=...
SENTRY_DSN=...            # optional locally
```

**`frontend/.env`** — use `frontend/.env.example` as the template:
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SENTRY_DSN=...       # optional locally
VITE_POSTHOG_KEY=...      # optional locally
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

## 3. Backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend now runs at http://localhost:8000 (health check: `/health`).

## 4. Frontend (React + Vite)

In a **second terminal**:
```bash
cd frontend
npm install
npm run dev
```
Frontend now runs at http://localhost:5173 and talks to the local backend.

## 5. Done

Open http://localhost:5173. Edit code, then commit and push:
```bash
git add -A
git commit -m "your message"
git push
```

## Deployment (automatic)

You don't deploy manually — pushing to `main` auto-deploys:
- **Frontend** → Vercel (jobtrackai.co.in)
- **Backend** → Render

Environment variables for production live in the **Vercel** and **Render**
dashboards, not in these local `.env` files.

## Where every secret/value lives (source of truth)

| Secret | Get it from |
|--------|-------------|
| ANTHROPIC_API_KEY | console.anthropic.com |
| SUPABASE_URL / keys | Supabase → Project Settings → API |
| RAZORPAY_KEY_ID / SECRET | Razorpay → Settings → API Keys (Live) |
| RESEND_API_KEY | Resend dashboard |
| SENTRY_DSN / VITE_SENTRY_DSN | Sentry → project → Settings (Client Keys/DSN) |
| VITE_POSTHOG_KEY | PostHog → Settings → Project (Project token) |

All accounts are under the owner's personal email.
