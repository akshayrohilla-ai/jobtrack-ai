# CLAUDE.md — JobTrack AI

## Context Navigation

A graphify knowledge graph of this repo lives in `graphify-out/` (gitignored, local only).
Queries are a local graph traversal (~1k tokens, no LLM call) — far cheaper than reading files
to orient. Use it accordingly:

1. **For understanding / navigation** — "how does X work", "where is Y", "what connects Z",
   tracing flows across files — query the graph first: `/graphify query "your question"`.
2. **For exact edit targets** — when you need the precise current bytes of a file to edit it —
   read those specific lines directly. The graph maps structure; it does not replace reading
   the lines you're about to change.
3. **Entrypoints:** `graphify-out/GRAPH_REPORT.md` (god nodes, communities, suggested questions)
   and `graphify-out/graph.html` (interactive). Keep the graph fresh with `/graphify <path> --update`
   after meaningful changes — code re-extraction is free; only changed docs cost tokens.

Guidance for Claude Code when working in this repo. Read this first.

## What this is

**JobTrack AI** (jobtrackai.co.in) — an AI career copilot for job seekers. Live, taking real payments. Owner operates it under personal accounts; registered (Razorpay/PAN) under "Bharti Rohilla" but public-facing copy shows only "Bharti".

**Tagline:** "YOUR AI CAREER COPILOT" · **Hero:** "Don't send that CV yet."

### Core features (seeker mode)
1. **My Profile** — CV upload + parse
2. **Find Jobs** — job search
3. **Evaluate JD** — score CV-vs-job fit before applying (1 credit)
4. **Tailor CV** — rewrite CV for a specific role (1 credit)
5. **Interview Prep** — AI interview prep (1 credit, auto-refunds on AI failure)
6. **Tracker** — Kanban application tracker
7. **Dashboard** — analytics

**Recruiter mode** exists (JD analysis + candidate scoring) but is tagged **"coming soon"** for non-admins.

### What it does NOT do
- ❌ No cover-letter generation
- ❌ No Gmail integration / Chrome extension

## Tech stack

- **Frontend:** React + Vite + Tailwind CSS → **Vercel** (jobtrackai.co.in). Mixes Tailwind classes and inline styles.
- **Backend:** FastAPI (Python 3.11) → **Render**. Entry `backend/main.py`, routers under `/api/*`.
- **DB/Auth:** Supabase (Postgres). RLS enabled on all user tables; backend uses the **service-role key** (bypasses RLS).
- **Payments:** Razorpay (live). **Email:** Resend. **AI:** Anthropic Claude.

## AI models per task — DO NOT GUESS

| Task | File | Model |
|------|------|-------|
| CV parsing | `backend/services/cv_parser.py` | `claude-haiku-4-5-20251001` (free, no credit) |
| Evaluate JD | `backend/routers/evaluate.py` | `claude-sonnet-4-6` |
| Tailor CV | `backend/routers/tailor.py` | `claude-sonnet-4-6` |
| Interview prep | `backend/routers/interview.py` | `claude-sonnet-4-6` |
| Recruiter (analyze JD / score CV) | `backend/services/jd_analyzer.py` | `claude-opus-4-5` |

Opus is **only** in recruiter mode. All seeker paid features use **Sonnet 4.6**. CV parsing uses **Haiku 4.5**.

## Commands

```bash
# Backend (from backend/)
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000          # http://localhost:8000, health: /health

# Frontend (from frontend/)
npm install
npm run dev      # http://localhost:5173
npm run build    # production build (run this to verify before pushing)
```

No automated test suite. **Verify changes with `npm run build` (frontend) and `python -m py_compile` (backend) before pushing.**

## Deployment

Pushing to `main` auto-deploys: **frontend → Vercel**, **backend → Render**. Production env vars live in the Vercel/Render dashboards (NOT in local `.env`). DB migrations are run manually in the Supabase SQL Editor (`supabase/migrations/`).

GitHub Actions: `.github/workflows/security-audit.yml` (npm/pip audit on push — prod deps only) and `db-backup.yml` (daily pg_dump, needs repo secrets `SUPABASE_DB_PASSWORD`/`SUPABASE_DB_HOST`).

## Environment variables

`.env` files are gitignored. See `backend/.env.example` and `frontend/.env.example` for the full list. Backend reads via `os.getenv`; frontend via `import.meta.env.VITE_*`. The frontend never queries Supabase tables directly — only auth — so the anon key is safe in the bundle.

## Invariants — preserve these (from the 2026-06 security audit)

- **Credits:** mutate ONLY via the atomic SECURITY DEFINER RPCs (`spend_credits`, `refund_credits`, `add_purchased_credits` in `supabase/migrations/security_fixes.sql`). Never reintroduce read-then-write credit logic (race condition).
- **Payments:** in `verify-payment`, derive credits from the **server-set Razorpay order notes**, never the client's `pack_id`. Insert `payment_log` first (unique `razorpay_payment_id`) for idempotency.
- **RLS** must stay enabled on all user tables. Backend service key bypasses it; the public anon key must get nothing.
- **Auth/admin:** every backend query filters by `user_id`. Admin gated by hardcoded `ADMIN_USER_ID` in `backend/middleware/admin.py`.
- **Errors:** never return raw `str(e)` to clients — log server-side, return generic messages.
- **Rate limiting:** `backend/middleware/ratelimit.py` `user_or_ip` key (bearer-token hash, IP fallback).

## Monitoring

- **Sentry** — error tracking (frontend + backend), dormant unless DSN env set, PII off. Transient network errors filtered.
- **PostHog** — analytics + session replay (all text/inputs masked for PII). `frontend/src/lib/analytics.js`. Fires `credit_purchased` event on payment.
- **cron-job.org** — pings `/health` every 10 min (keeps Render warm + uptime alert).

## Conventions

- Match surrounding style (Tailwind + inline styles coexist). Note: Tailwind `leading-none`/fixed heights have caused text clipping in the nav before — prefer inline styles there.
- The briefcase+magnifying-glass SVG logo + "YOUR AI CAREER COPILOT" tagline must stay consistent across all surfaces (navbar, landing, legal pages, auth modal, emails).
- Commit only when asked; push only when asked. Verify builds before pushing.

### Design-system utilities (in `frontend/src/index.css` — prefer these over ad-hoc inline)

- **Headings:** `.h-page` (page/feature title) and `.h-section` (sub-heading) — a shared Fraunces scale. Use them instead of inline `fontFamily: 'Fraunces'…fontSize` so heading sizes stop drifting per component. (Adopted on Dashboard + Tracker; roll out to other components incrementally.)
- **Loading:** `.skeleton` (gentle pulse) for content-shaped loaders; Tracker's loading state is the reference. Spinners use a claret ring: `borderColor: var(--blue-accent); borderTopColor: transparent` — never Tailwind `border-t-blue-*` (off-palette).
- **Focus:** buttons have brass `:focus-visible` rings — keep new interactive elements keyboard-visible.
- **Motion:** a global `prefers-reduced-motion` guard neutralises animations — don't fight it.
- **Flat only — no gradients** ("The Verdict" rule). Avatars/pills use solid `var(--blue-accent)`, not `linear-gradient`.

### Brand / share assets (`frontend/public/`)

- Favicon/app-icon set: `briefcase.svg`, `favicon.ico`, `favicon-16/32`, `apple-touch-icon.png` (180, full-bleed claret for iOS), `icon-192/512.png`, `site.webmanifest` — all wired in `index.html`. Regenerate from `briefcase.svg` with sharp if the mark changes.
- `og-image.png` (1200×630) is the editorial Verdict share card (ivory dossier + claret grade stamp), rendered from an SVG via `@resvg/resvg-js` with Fraunces + DM Sans TTFs. Social caches are sticky — re-scrape via the Facebook Sharing Debugger after changes (WhatsApp uses FB's cache).

## Marketing / go-to-market

- **Stage:** live, **zero users**, actively trying to sell. Bottleneck is **distribution**, not the product or landing copy.
- **Context file:** `.agents/product-marketing.md` — product, positioning, pricing, ICP, brand voice. Marketing skills auto-read it; keep it current.
- **Skills installed (global):** `coreyhaines31/marketingskills` (copywriting, marketing-psychology, programmatic-seo, seo-audit, launch, marketing-plan, etc.) + `refoundai/lenny-skills` (founder-sales, startup-ideation, behavioral-product-design).
- **Pricing truth:** free = CV parse + job search only; JD eval / CV tailor / interview prep = **1 credit each**; new users get **3 free credits on signup, no card** (which cover the paid actions for a first run). Never imply JD eval is free.
- **Proof policy:** no fabricated testimonials/metrics, ever. Landing currently substitutes an honest "we'd rather give you 3 free credits and let you judge" band + a signed founder's note; replace with real proof once first users exist.
- **Next planned work:** `cold-start-strategy` — first-cohort acquisition plan (India job-seeker communities, build-in-public, Product Hunt/directory launch sequence).
