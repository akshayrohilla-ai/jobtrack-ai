import { useEffect } from 'react'

/*
 * Marketing destination page: "JobTrack AI — a Jobscan alternative".
 * Standalone, rendered for the /alternatives/jobscan route (see App.jsx).
 * Theme-aware purely via CSS variables (index.css) — no auth, no app state.
 * Competitor claims are kept to widely-true, verifiable facts (honest comparison
 * pages rank; AI engines de-rank lies). Verify Jobscan specifics before edits.
 */

const goHome = () => { window.location.href = '/' }

function Logo() {
  return (
    <div className="flex items-center gap-2.5 cursor-pointer" onClick={goHome}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--blue-accent)' }}>
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="8" width="14" height="10" rx="2" stroke="#F3EDE2" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="#F3EDE2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="3" y1="13" x2="17" y2="13" stroke="#F3EDE2" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="14.5" cy="16.5" r="2.2" stroke="#F3EDE2" strokeWidth="1.3" />
          <path d="M16.2 18.2l1.3 1.3" stroke="#F3EDE2" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
          JobTrack<span style={{ color: 'var(--brass)' }}> AI</span>
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.2em', fontWeight: 600, marginTop: 3, textTransform: 'uppercase' }}>Your AI Career Copilot</div>
      </div>
    </div>
  )
}

const Cta = ({ children }) => (
  <button onClick={goHome}
    className="px-5 py-3 rounded-lg text-sm font-semibold transition-all"
    style={{ background: 'var(--blue-accent)', color: '#F3EDE2' }}
    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
    onMouseLeave={e => (e.currentTarget.style.filter = 'none')}>
    {children}
  </button>
)

// — comparison rows. "us" = JobTrack AI, "them" = Jobscan.
// Kept factual and balanced (Jobscan genuinely wins several rows). Verified against
// jobscan.co + public reviews, June 2026. Re-check before changing any cell — a false
// claim about a competitor is the one real legal exposure here.
const ROWS = [
  ['Primary focus', 'A verdict on whether a role is worth applying to', 'ATS match-rate optimization'],
  ['Headline output', 'A–F fit grade + salary read + red flags', 'An ATS match-rate score'],
  ['Salary read on the role', true, false],
  ['Red flags in the posting', true, false],
  ['Interview prep (STAR answers)', true, false],
  ['Tailor / rewrite CV for a role', 'Yes — DOCX export', 'Yes — One-Click Optimize'],
  ['Cover-letter generator', false, true],
  ['LinkedIn profile optimization', false, true],
  ['Detects the employer’s specific ATS', false, true],
  ['Built-in job search + tracker', true, true],
  ['Pricing model', 'Credits — pay per use, never expire', 'Subscription (from ~$49.95/mo)'],
  ['Currency & focus region', 'INR, India-first', 'USD, US-first'],
  ['Free tier', '3 credits on signup, no card', '5 resume scans / month'],
]

function Cell({ v }) {
  if (v === true) return <span style={{ color: 'var(--blue-accent)', fontWeight: 700 }}>✓</span>
  if (v === false) return <span style={{ color: 'var(--text-ghost)' }}>—</span>
  return <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
}

const FAQS = [
  ['What does JobTrack AI do?', 'It reads a job description against your CV and returns a verdict in seconds — an A–F fit grade, a salary read, your matched and missing skills, and the red flags in the posting. It can then tailor your CV for that role and prep you for the interview.'],
  ['How is it different from Jobscan?', 'Jobscan is built around ATS match-rate optimization — it scores how well your resume matches a posting and helps you raise that score, and it has strengths like cover-letter and LinkedIn tools. JobTrack gives you a verdict instead: a fit grade, a salary read, and the red flags in the posting, so you can decide whether a role is even worth applying to before you spend an evening on it.'],
  ['Is JobTrack AI free?', 'CV upload + parsing, AI job search, and the tracker are free. Evaluating a job, tailoring your CV, and interview prep each cost one credit. New users get 3 free credits on signup, no card — enough for a full first run.'],
  ['How much does it cost?', 'India-first INR pricing: 3 credits free on signup, 10 credits for ₹199, 30 credits for ₹499. Credits never expire and there is no subscription.'],
  ['Is my CV kept private?', 'Yes. Your CV stays private to your account and you can delete it in one click at any time.'],
]

export default function JobscanAlternative() {
  useEffect(() => {
    const prev = document.title
    document.title = 'JobTrack AI — A Jobscan Alternative (CV-vs-Job Verdict, India)'
    return () => { document.title = prev }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Home →</a>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>
        {/* Hero */}
        <section style={{ paddingTop: 56, paddingBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brass)', marginBottom: 14 }}>
            Jobscan alternative
          </div>
          <h1 className="h-page" style={{ fontSize: '2.3rem', lineHeight: 1.12, marginBottom: 18 }}>
            A Jobscan alternative that gives you a verdict — not just a match rate.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 620 }}>
            JobTrack AI reads a job description against your CV and returns a verdict — an A–F fit grade,
            a salary read, your matched and missing skills, and the red flags in the posting — in seconds.
            Then it tailors your CV for that role and preps the interview. Built India-first, priced in INR,
            with credits that never expire.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Cta>Get your free verdict — 3 credits, no card</Cta>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No subscription. Credits never expire.</span>
          </div>
        </section>

        {/* Comparison table */}
        <section style={{ paddingBottom: 16 }}>
          <h2 className="h-section" style={{ marginBottom: 18 }}>JobTrack AI vs Jobscan, side by side</h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.4fr 1.1fr', background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }} />
              <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--blue-accent)' }}>JobTrack AI</div>
              <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Jobscan</div>
            </div>
            {ROWS.map(([label, us, them], i) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.4fr 1.1fr', background: i % 2 ? 'var(--surface)' : 'var(--surface-raised)', borderBottom: i === ROWS.length - 1 ? 'none' : '1px solid var(--border-light)' }}>
                <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ padding: '12px 14px', fontSize: 13 }}><Cell v={us} /></div>
                <div style={{ padding: '12px 14px', fontSize: 13 }}><Cell v={them} /></div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-ghost)', marginTop: 10 }}>
            Based on publicly available information as of June 2026; features and pricing change —
            check jobscan.co for the latest. Jobscan is a trademark of its respective owner; this is
            an independent comparison, not affiliated with or endorsed by Jobscan.
          </p>
        </section>

        {/* When to choose which — honest both-sides */}
        <section style={{ paddingTop: 28, paddingBottom: 8, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)' }}>
            <h3 className="h-section" style={{ fontSize: '1.05rem', marginBottom: 10 }}>Choose JobTrack AI if…</h3>
            <ul style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', paddingLeft: 18, margin: 0 }}>
              <li>You want a go / no-go verdict on a role — fit grade, salary read, red flags — before you apply.</li>
              <li>You'd rather pay per use in INR than hold a monthly subscription.</li>
              <li>You want interview prep alongside CV tailoring.</li>
            </ul>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)' }}>
            <h3 className="h-section" style={{ fontSize: '1.05rem', marginBottom: 10 }}>Choose Jobscan if…</h3>
            <ul style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', paddingLeft: 18, margin: 0 }}>
              <li>You want to maximize a literal ATS match-rate score and detect the employer's exact ATS.</li>
              <li>You need a cover-letter generator and LinkedIn profile optimization.</li>
              <li>You're a US-based applicant comfortable with USD subscription billing.</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ paddingTop: 36, paddingBottom: 8 }}>
          <h2 className="h-section" style={{ marginBottom: 16 }}>Frequently asked</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAQS.map(([q, a]) => (
              <div key={q} style={{ padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>{a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section style={{ textAlign: 'center', padding: '48px 0 64px' }}>
          <h2 className="h-section" style={{ marginBottom: 12 }}>Read the job before you apply to it.</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 22, maxWidth: 460, margin: '0 auto 22px' }}>
            Get an honest verdict on your CV-vs-job fit in seconds. 3 free credits on signup — judge it yourself.
          </p>
          <Cta>Try JobTrack AI free</Cta>
        </section>
      </main>
    </div>
  )
}
