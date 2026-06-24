# JobTrack AI — Directory Submissions (Week-0/1 of cold-start)

> Companion to `docs/cold-start-strategy.md`. The backlink + discovery + AI-citation layer.
> **Two-speed rule:** free AI/startup directories → submit now (homepage is a fine destination).
> Product Hunt / Show HN / G2 / Capterra → wait until demo video + a destination page + ~20 real
> users exist (the communities cohort). Don't burn the PH slot cold.
>
> **Guardrails:** never imply paid features are free (free = CV parse + job search + tracker; 3
> free credits cover one paid run). No fabricated reviews/metrics. Don't name the AI vendor
> publicly — say "frontier AI models" (matches the landing's proof policy).

---

## Readiness scorecard (as of 2026-06-18)

| Ready | Gap |
|---|---|
| Live + taking payments · pricing page · privacy/terms/refund · full logo+favicon set | **No demo video / product screenshots** (blocks PH + most reviews) |
| | **No JSON-LD structured data** on landing (GEO gap — lifts AI-citation rate) |
| | **No destination pages** (`/alternatives/*`, `/for/*`) — single landing only |
| | **Zero users** → skip G2/Capterra reviews until the 10-in-30 protocol is runnable |

**Prep tasks that unlock the expensive tier (do before the PH moment):**
- [x] Add `Organization` + `SoftwareApplication` + `FAQPage` JSON-LD to the landing.
      → done in `frontend/index.html` (3 static `ld+json` blocks; verified parse + build).
- [x] Build `/alternatives/jobscan` (closest direct competitor) — highest-ROI destination page.
      → `frontend/src/pages/JobscanAlternative.jsx`, routed in `App.jsx`, in sitemap.xml.
- [ ] Record a 60s demo: upload CV → paste JD → the verdict. The product *is* the demo. **(yours)**

> Note: the app is a client-rendered SPA. The JSON-LD is **static in index.html** (crawler-safe),
> but the `/alternatives/jobscan` body is client-rendered — Google renders JS fine, but if AI/SEO
> traction matters more later, consider prerendering/SSG for marketing routes. Not blocking now.
> Build verified (`npm run build` clean) and rendered (light/dark, FAQ, table, CTAs) before this note.

---

## Positioning copy (filled, ready to paste — vary by tier, never copy one blob everywhere)

### Reusable bits
- **Product:** JobTrack AI · **URL:** https://jobtrackai.co.in
- **Category:** AI career copilot / CV-vs-job evaluator
- **Closest competitors:** Jobscan (ATS keyword match), Teal & Huntr (trackers), Rezi/Enhancv (builders)
- **Differentiator:** returns a *verdict* (A–F grade + salary read + red flags) **before** you apply;
  India-first INR pricing; credits, no subscription
- **Founder story (2–3 sentences):** Built by a solo founder tired of watching good candidates
  spray generic CVs at thirty roles and hear back from two. The bet: the highest-leverage moment
  is *before* you apply — so an AI should read the job, weigh your CV, and give an honest verdict
  first.

### Variant A — Startup / Launch directories
*(Fazier, Uneed, Microlaunch, Tiny Launch, OpenHunts, PeerPush, Startup Stash, Peerlist, BetaList)*

- **Tagline (<10 words):** Get the verdict before you send your CV.
- **Short (60 char):** An AI verdict on your CV-vs-job fit before you apply.
- **Long (~150 words):**
  > JobTrack AI is the fastest way to know whether a job is worth applying to — before you waste an
  > evening on it. Paste a job description, upload your CV, and in seconds you get a verdict: an A–F
  > fit grade, a salary read, your matched and missing skills, and the red flags in the posting.
  > Then it tailors your CV for that exact role and preps you for the interview.
  >
  > Built for job seekers who do the work before hitting send — the ones tired of applying to thirty
  > roles and hearing back from two. No generic resume spray; a clear-eyed read on each opportunity.
  >
  > We built JobTrack because effort goes in before you apply, and that's exactly where most people
  > fly blind. India-first, INR pricing, credits that never expire.
  >
  > Try it free — 3 credits on signup, no card. https://jobtrackai.co.in
- **Tags:** career, job search, AI resume, CV review, interview prep, India, job seekers

### Variant B — SaaS / Alternative directories
*(SaaSHub, AlternativeTo, SaaSWorthy, ToolsFine, 10words, Slant, Indie Hackers)*

- **Tagline:** The Jobscan alternative that grades the whole application, not just keywords.
- **Short (60 char):** Jobscan alternative: a full CV-vs-job verdict, not a score.
- **Long (~150 words):**
  > JobTrack AI is a focused alternative to Jobscan, Teal, and Rezi — built for job seekers who want
  > a verdict on a role, not just a resume builder or a keyword score. Where Jobscan stops at ATS
  > keyword matching and Teal focuses on tracking, JobTrack reads the actual job description against
  > your CV and returns an A–F fit grade, a salary read, matched vs missing skills, and the red flags
  > in the posting.
  >
  > Key features:
  > • Evaluate JD — a full CV-vs-job verdict in seconds, not just a match percentage
  > • Tailor CV — rewrite your CV for one specific role, export as DOCX
  > • Interview Prep — likely questions + STAR answers for that role
  > • Application tracker (Kanban) and AI job search — free
  > • Credits never expire; no subscription. INR pricing.
  >
  > Start free with 3 credits, no card. https://jobtrackai.co.in
- **Tags:** Jobscan alternative, resume optimizer, ATS, CV review, job application tracker, career tools

### Variant C — AI directories
*(TAAFT, Futurepedia, Toolify, Future Tools, aitools.inc, TopAI.tools, Good AI Tools, AItrendytools, Supertools, AI Tools Guide, AIToolly)*

- **Tagline:** AI that grades your CV against any job — before you apply.
- **Short (60 char):** AI career copilot: grades your CV against a job in seconds.
- **Long (~150 words):**
  > JobTrack AI is an AI career copilot that reads a job description against your CV and returns a
  > verdict — an A–F fit grade, a salary estimate, matched and missing skills, and the red flags in
  > the posting — in seconds. It then uses AI to rewrite your CV for that specific role and generate
  > interview prep with STAR-structured answers.
  >
  > What makes it AI-first:
  > • Evaluate JD — frontier LLMs weigh your CV against the full job description, not just keywords
  > • Tailor CV — AI rewrites your CV for one role and exports a clean DOCX
  > • Interview Prep — AI-generated likely questions + STAR answers (auto-refunds if a run fails)
  > • CV parsing — instant structured profile from any uploaded CV, free
  >
  > Built on frontier AI models. India-first, INR pricing, credits never expire. Free tier plus 3
  > credits on signup, no card required. https://jobtrackai.co.in
- **Tags:** AI career copilot, AI resume, AI CV review, AI interview prep, AI for job seekers, ATS, job search AI

---

## Submission tracker

Status: ☐ todo · ◐ submitted (in queue) · ☑ live (backlink verified) · ✗ rejected/n-a

### Batch 1 — AI directories (Variant C) · submit now · homepage OK
| Directory | DR | Variant | Status | Listing URL | Notes |
|---|---|---|---|---|---|
| There's An AI For That (TAAFT) | 76 | C | ✗ | | **PAID-ONLY as of 2026-06 — min $49, no free tier. SKIPPED.** Possible considered paid bet later (their audience = AI-tool seekers), but not pre-revenue |
| Futurepedia | 70 | C | ✗ | | **PAID-ONLY as of 2026-06 — $247 (sold out) / $497. SKIPPED.** |
| Toolify.ai | 71 | C | ☐ | | |
| Future Tools (futuretools.io) | 69 | C | ☐ | | curated, may not approve |
| Good AI Tools | 66 | C | ☐ | | |
| aitools.inc | 66 | C | ☐ | | |
| TopAI.tools | 60 | C | ☐ | | |
| AItrendytools | 69 | C | ☐ | | |
| Supertools | 61 | C | ☐ | | |
| AI Tools Guide | 77 | C | ☐ | | |
| AIToolly | 69 | C | ☐ | | |

### Batch 2 — Startup / SaaS directories (Variant A/B) · submit now · homepage OK
| Directory | DR | Variant | Status | Listing URL | Notes |
|---|---|---|---|---|---|
| SaaSHub | 77 | B | ◐ | https://www.saashub.com/jobtrack-ai | submitted 2026-06-24, pending approval (free tier, up to 32d). Full listing: logo, tagline, description, pricing, competitors (Jobscan/Teal/Rezi), features, Q&A. Verify later via @jobtrackai.co.in email |
| AlternativeTo | 79 | B | ⏳ | | account created 2026-06-24; **7-day age gate — resubmit after 2026-07-01**. Use Variant B, list as Jobscan/Teal/Rezi alternative |
| Peerlist Launchpad | ~60 | A | ☐ | | **India-founded — priority for ICP** |
| Inc42 | 75 | A | ☐ | | **Indian startup media/directory** |
| Startup Stash | ~50 | A | ☐ | | |
| Indie Hackers (product) | 76 | A | ☑ | indiehackers.com/product/jobtrack-ai (confirm exact slug) | **DONE 2026-06-24.** Product page live: logo, tagline, About/motivation, founder handle "JobTrack_AI". Optional later: build-in-public posts. |
| SaaSWorthy | 65 | B | ☐ | | |
| ToolsFine | 65 | B | ☐ | | |
| 10words | 40 | B | ☐ | | 10-word desc |
| Slant | 75 | B | ☐ | | "best CV review tool" answers |

### Batch 3 — Low-stakes launch boards (Variant A) · submit now or with the moment
| Directory | DR | Variant | Status | Listing URL | Notes |
|---|---|---|---|---|---|
| Fazier | ~30 | A | ☐ | | achievable #1, low competition |
| Uneed | ~40 | A | ☐ | | curated |
| Microlaunch | ~30 | A | ☐ | | month-long visibility |
| Tiny Launch | ~20 | A | ☐ | | fast approval |
| OpenHunts | ~25 | A | ☐ | | indie-friendly |
| PeerPush | ~25 | A | ☐ | | |
| BetaList | 64 | A | ◐ | | **2–4 wk queue — submit early**, frame "early access" |

### Batch 4 — The moment (Variant A/C) · DO NOT submit cold
| Directory | DR | Variant | Status | Notes |
|---|---|---|---|---|
| Product Hunt | 91 | A | ☐ | needs demo video + supporter list + 3-wk warm-up. Tue/Wed/Thu 12:01 AM PT |
| Hacker News (Show HN) | 91 | C | ☐ | only with a genuine technical angle (e.g. streaming AI verdict) |

### Deferred until users exist (reviews gate)
| Directory | DR | Notes |
|---|---|---|
| G2 | 92 | needs 10 reviews for Grid — run 10-in-30 after first cohort |
| Capterra | 93 | reviews-driven; defer |

---

## Per-submission checklist
1. Pick the tier-appropriate variant (A/B/C) — don't paste the same blob twice.
2. Fill form; upload logo (SVG/PNG) + screenshots; add demo video URL when it exists.
3. Submit; log date + status + listing URL in the tracker.
4. Once live, verify dofollow: open listing → inspect your link → no `rel="nofollow"` = dofollow.
5. Re-check quarterly (directories silently flip links to nofollow).

## KPIs (track weekly)
Referring domains · DR · directory listings live · signups from directory referrals (UTM each link)
· AI citations (monthly: ask ChatGPT/Claude/Perplexity "best AI CV review / Jobscan alternative" and
log whether JobTrack appears).
