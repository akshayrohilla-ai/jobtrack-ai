# JobTrack AI — Onboarding / Activation Email Sequence

> Owned-channel capture for the cold-start traffic (see `docs/cold-start-strategy.md`).
> Provider: **Resend** (already wired for transactional email). India-first, INR.
> Voice: "The Verdict" editorial, but warm (a founder talking) — calm, specific, **no
> exclamation points, no hype, no fabricated proof**. Loss-aversion framing works.

## The one goal
**Activation = the user runs their first verdict (Evaluate JD).** Everything points there
first; tailor + interview prep + conversion come after. A signup who never runs a verdict has
gotten zero value — this sequence exists to close that gap.

## Sequence overview
- **Trigger:** signup (3 free credits granted, no card).
- **Primary goal:** first verdict run within 7 days; then tailor/prep; then first paid top-up.
- **Length:** 6 sends over ~11 days, **behavior-branched** (see conditions per email).
- **Exit conditions:** unsubscribe; (soft) once a user is active + has paid, move them off the
  activation track.
- **Sender:** a human — `Bharti <bharti@jobtrackai.co.in>`, not no-reply. (Public name is
  "Bharti"; the landing founder's note signs "Founder" — pick one and stay consistent. Recommend
  "Bharti" in email for warmth; swap if you prefer "Founder".)
- **Every marketing email needs an unsubscribe link** + `List-Unsubscribe` header (Resend
  supports it). Email 1 is welcome/transactional-adjacent; 2–6 are lifecycle/marketing.

---

## Email 1 — Welcome + first verdict
**Send:** immediately on signup · **Condition:** all new signups
**Subject:** Your 3 free credits are ready, {{first_name}}
**Preview:** Don't send that CV yet — get the verdict on one job first.

> Welcome to JobTrack AI.
>
> You came here to stop guessing, so here's the fastest way to feel the difference: pick one job
> you're actually considering and get the verdict before you apply.
>
> Paste the job description, and in seconds you'll see an A–F fit grade, a salary read, the skills
> you match, the ones you're missing, and the red flags in the posting.
>
> You have 3 free credits — no card. One verdict is one credit. Spend the first on a role that
> matters.
>
> [Get your first verdict →]
>
> — Bharti, JobTrack AI

**CTA:** Get your first verdict → app (Evaluate JD)

---

## Email 2A — Activation nudge *(hasn't run a verdict)*
**Send:** day 1 · **Condition:** signed up ≥24h ago AND 0 verdicts run
**Subject:** The evening you save before applying
**Preview:** One job, one paste, one honest read. Your credits are waiting.

> Most people spend an evening tailoring a CV for a role they were never a fit for.
>
> JobTrack tells you first. Paste one job description against your CV and you'll know — grade,
> salary, red flags — before you commit the evening.
>
> It takes about a minute, and you still have all 3 free credits.
>
> [Read a job before you apply →]
>
> If something got in the way, just reply — I read every message.
>
> — Bharti

**CTA:** Read a job before you apply → app (Evaluate JD)

## Email 2B — Next step *(already ran a verdict)*
**Send:** day 1 · **Condition:** ≥1 verdict run AND (tailor unused OR prep unused)
**Subject:** You've got the verdict. Now make the CV fit.
**Preview:** Tailor your CV for that exact role, then walk in prepared.

> You ran your first verdict — that's the part most applicants skip.
>
> If the role's worth it, the next two steps are where the effort pays off:
>
> — Tailor your CV for that exact role, and download it ready to send.
> — Prep the interview: likely questions and answers drafted from your own history.
>
> Each is one credit, and you still have free ones to spend.
>
> [Tailor your CV →]
>
> — Bharti

**CTA:** Tailor your CV → app (Tailor CV)

---

## Email 3 — Why I built it (founder's note)
**Send:** day 3 · **Condition:** all
**Subject:** Why I built JobTrack AI
**Preview:** Applying to thirty roles and hearing back from two isn't bad luck.

> A quick, honest note.
>
> I built JobTrack AI because I watched good people — sharp, qualified people — send the same
> generic CV into thirty roles, hear back from two, and then blame themselves.
>
> It usually isn't them. It's the process. The effort goes in before you apply — choosing the
> right roles, shaping the CV, walking in prepared — and that's exactly where most people fly
> blind.
>
> So JobTrack does the part you can't see: it reads the job the way a careful examiner would,
> weighs it against your CV, and hands you a verdict. A grade. A salary read. The red flags.
> Before you spend the evening.
>
> I won't fill this with testimonials I haven't earned yet — we're new. I'd rather give you the
> 3 free credits and let you judge.
>
> If you haven't run one yet, start with a role you're genuinely on the fence about.
>
> [Get the verdict →]
>
> — Bharti, Founder

**CTA:** Get the verdict → app

---

## Email 4 — Tailor + Prep depth
**Send:** day 5 · **Condition:** ≥1 verdict run AND (tailor unused OR prep unused)
**Subject:** The two steps that change the outcome
**Preview:** A tailored CV gets read. A prepped candidate gets the offer.

> A verdict tells you whether to apply. These two tell you how to win it.
>
> Tailor CV — one click rewrites your CV for a specific role, in that role's language, and exports
> a clean DOCX. No more one-size-fits-all.
>
> Interview Prep — likely questions for that exact role, with STAR answers drawn from your own
> experience, plus the questions worth asking them.
>
> Each is one credit. If you've still got free credits, this is where they earn their keep.
>
> [Tailor a CV →]
>
> — Bharti

**CTA:** Tailor a CV → app

---

## Email 5 — Privacy + honest proof (objection handler)
**Send:** day 7 · **Condition:** all (lands hardest for the inactive)
**Subject:** Your CV stays yours
**Preview:** Private to your account, deletable in one click. Here's the deal.

> Two questions people ask before trusting a new tool with their CV.
>
> Is it private? Yes. Your CV stays inside your account. We don't sell it, and you can delete
> everything in one click, anytime.
>
> Is it worth it? We're new, so I won't quote testimonials I haven't earned. Instead I'll do what
> we've done since you signed up: give you credits, no card, and let the verdict speak for itself.
>
> Your free credits are still here — they never expire.
>
> [Open JobTrack AI →]
>
> — Bharti

**CTA:** Open JobTrack AI → app

---

## Email 6A — Gentle convert *(credits spent)*
**Send:** day 11 · **Condition:** credit balance ≤ 1
**Subject:** Out of credits, not out of road
**Preview:** Top up from ₹199. Credits never expire, no subscription.

> You've put your free credits to work — exactly what they were for.
>
> If JobTrack earned a place in your search, here's how to keep going:
>
> — 10 credits — ₹199
> — 30 credits — ₹499 (most people pick this)
>
> No subscription. Credits never expire. You only pay for what you use.
>
> [Top up credits →]
>
> And if it wasn't for you, reply and tell me why — that's worth more to me than the sale.
>
> — Bharti

**CTA:** Top up credits → app (payment modal)

## Email 6B — Last gentle nudge *(never activated)*
**Send:** day 11 · **Condition:** 0 verdicts run AND credit balance = 3
**Subject:** Your 3 free credits are still waiting
**Preview:** One verdict on one job. About a minute. No card.

> Your 3 free credits haven't been touched — and they don't expire, so there's no rush. But I'd
> hate for you to miss the one thing JobTrack is actually for.
>
> Pick a single role you're considering. Paste it. Read the verdict. That's it.
>
> [Get your first verdict →]
>
> — Bharti

**CTA:** Get your first verdict → app

---

## Simplified linear fallback (if you can't branch yet)
If behavioral conditions are too much to build at first, send this fixed order to everyone and
add branching later: **1 (signup) → 2A (day 1) → 3 (day 3) → 4 (day 5) → 5 (day 7) → 6A (day 11)**.
You lose some relevance (e.g. nudging active users to "run your first verdict"), so move to the
branched version as soon as you can read activation state.

## Implementation notes (Resend)
- **Email 1** fires on signup — trigger from the backend right after the user + free credits are
  created (or a Supabase auth hook), via Resend.
- **Emails 2–6** are a daily lifecycle job: a protected backend endpoint (e.g.
  `/internal/lifecycle-emails`) hit once a day by cron-job.org (you already use it for `/health`).
  It queries Supabase for users at each day-offset, reads their activation state (verdicts run,
  tailor/prep used, credit balance), picks the right email, sends via Resend, and records the send
  to stay **idempotent** (a `lifecycle_email_sent` table or per-user/email flags — never double-send).
- Send from a human address; include unsubscribe + `List-Unsubscribe`. Respect an
  `email_opt_out` flag.
- Activation state you need to expose to the job: `verdicts_run_count`, `tailor_used`,
  `prep_used`, `credit_balance`, `created_at`, `email_opt_out`.

## Metrics (track weekly)
- **Activation rate** — % of signups who run ≥1 verdict within 7 days. The north-star for this
  sequence.
- Tailor/prep adoption among activated users.
- First paid top-up rate (₹199/₹499).
- Per-email click→action (opens are unreliable post-Apple MPP — weight clicks and downstream
  actions).
- Reply rate to the founder emails — early qualitative gold while at low volume.
