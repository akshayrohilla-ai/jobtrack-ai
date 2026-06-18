# JobTrack AI — Product Marketing Context

> Read this before any marketing/copy task. Keep it current as positioning evolves.

## What it is
**JobTrack AI** (jobtrackai.co.in) — an AI career copilot for job seekers. Live, taking real payments.
**Tagline:** "YOUR AI CAREER COPILOT" · **Hero:** "Don't send that CV yet."
Owner is public-facing as **"Bharti"** (registered as Bharti Rohilla). Founder's note on the landing is signed just **"Founder"** (per owner's preference).

## The core promise
Before you waste an evening applying, an AI reads the job, weighs it against your CV, and hands you a **verdict** — an A–F grade, a salary read, matched skills, and the red flags, in seconds. Then it tailors your CV for that role and preps the interview. The brand frames this as an examiner's grade / dossier ("The Verdict").

## Features & what's free vs paid (GET THIS RIGHT)
| Feature | Cost |
|---|---|
| CV parsing (upload + parse) | **Free** |
| AI job search | **Free & unlimited** |
| Application tracker (Kanban) | **Free** |
| Dashboard / analytics | **Free** |
| **Evaluate JD** (CV-vs-job fit grade) | **1 credit** |
| **Tailor CV** (rewrite for a role, DOCX) | **1 credit** |
| **Interview Prep** (STAR answers etc.) | **1 credit** (auto-refunds on AI failure) |

- New users get **3 free credits on signup, no card** — enough for a full first run (grade + tailor + prep).
- **Never imply JD eval / tailor / interview prep is free.** The "free" tier is CV parse + job search + tracker only.

## Pricing
- 3 credits — **Free** on signup (no card)
- 10 credits — **₹199** (one-off)
- 30 credits — **₹499** (one-off, "Recommended")
- Credits **never expire**. No subscription. INR, India-first.

## What it does NOT do
- ❌ No cover-letter generation · ❌ No Gmail integration / Chrome extension
- Recruiter mode exists but is "coming soon" for non-admins — **not a marketing angle yet.**

## Audience (ICP)
Active job seekers, **India-first** (INR pricing, remote-India roles in sample copy). Skews toward considered applicants — "for the ones who prepare." Mid-level+ knowledge workers (the hero sample is a Senior PM, fintech). Pain: effort goes in *before* hitting send, and that's where they fly blind; generic CV filtered by ATS; interview ambush.

## Brand voice — "The Verdict" (editorial / quiet-luxury)
- Confident, calm, literary. Fraunces serif + DM Sans. Ivory paper, deep ink, single claret accent + brass detail. **No gradients, no hype, no exclamation points.**
- Writes like an examiner's report, not a SaaS ad. Specific over vague. Honest over sensational.
- Loss-aversion framing works ("Don't send that CV *yet*"; "applying to thirty roles and hearing back from two isn't bad luck — it's a bad process").

## Current stage & honest constraints
- **Zero users.** This is the defining constraint. Chicken-and-egg: no users → no testimonials/metrics.
- **The bottleneck is distribution, not the product or the landing page.** Further copy polish has diminishing returns until real traffic arrives.
- **Proof policy: never fabricate testimonials or usage numbers.** Until real users exist, credibility is carried by: the free-trial-as-proof ("we'd rather give you 3 free credits and let you judge"), a signed founder's note, "Built on frontier AI" (generic — vendor not named), and the live sample verdict in the hero.

## Landing page state (frontend/src/pages/LandingPage.jsx)
Strong already. Sections: hero (verdict dossier artifact) → trust strip → problem → how it works → features → "instead of testimonials" honesty band → pricing → founder's note → closing CTA. Privacy objection is addressed (CV stays private, one-click delete). Theme-aware light/dark.

## Channels NOT yet started (the actual work ahead)
Cold-start / first-cohort acquisition: India job-seeker communities (r/developersIndia, r/IndianWorkplace, r/resumes, LinkedIn, college placement + Telegram/WhatsApp groups), build-in-public (the rebrand story), Product Hunt / BetaList / AI-SaaS directories. **Plan written → `docs/cold-start-strategy.md`** (communities-first → first 20–50 real users + honest proof → THEN PH/Show HN; free-credits offer is the wedge; 4-week sprint). Next: execute Week 0/1 + run `directory-submissions` and `emails` for the listing + onboarding pieces.

## Marketing skills available (installed globally)
`coreyhaines31/marketingskills` (copywriting, marketing-psychology, content-strategy, programmatic-seo, seo-audit, ai-seo, marketing-ideas, launch, marketing-plan, ads, emails, cro, pricing, churn-prevention, etc.) and `refoundai/lenny-skills` (founder-sales, startup-ideation, behavioral-product-design, and many product/leadership skills).
