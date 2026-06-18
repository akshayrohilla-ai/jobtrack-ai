import { useEffect } from 'react'

/*
 * Marketing destination page: "JobTrack AI for India job seekers".
 * Use-case / ICP page for the /for/india-job-seekers route (see App.jsx).
 * Standalone, theme-aware via CSS variables (index.css) — no auth, no app state.
 * Only states facts about our own product (free vs credit tiers, INR pricing) — keep
 * in sync with the pricing model. No competitor claims here.
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

const REASONS = [
  ['Priced in INR, pay per use', 'No dollar subscription. 3 free credits on signup (no card), then ₹199 for 10 or ₹499 for 30. Credits never expire — pay for a run only when you need one.'],
  ['Reads the JD, not just keywords', 'Paste any job description and your CV, and you get a verdict in seconds — an A–F fit grade, a salary read, your matched and missing skills, and the red flags in the posting.'],
  ['Catches red flags in a posting', 'Vague responsibilities, mismatched seniority, or a salary that does not add up — surfaced before you spend an evening applying.'],
  ['Tailors your CV for the role', 'Rewrite your CV for one specific role and export a clean DOCX, then prep for the interview with likely questions and STAR answers.'],
]

const STEPS = [
  ['Upload your CV', 'We parse it into a structured profile — free, no credit used.'],
  ['Paste a job description', 'Any role you are considering, from any job board or company site.'],
  ['Get the verdict', 'A fit grade, salary read, matched vs missing skills, and red flags — then tailor your CV and prep the interview.'],
]

const FAQS = [
  ['Is JobTrack AI free to use?', 'CV upload + parsing, AI job search, and the application tracker are free. Evaluating a job against your CV, tailoring your CV, and interview prep each cost one credit. New users get 3 free credits on signup with no card — enough for a full first run.'],
  ['How much does it cost in India?', 'Pricing is in INR: 3 credits free on signup (no card), 10 credits for ₹199, and 30 credits for ₹499. Credits never expire and there is no subscription.'],
  ['Does it work for Indian roles and companies?', 'Yes. Paste any job description — Indian companies, MNCs, startups, or remote-India roles — and JobTrack reads it against your CV. The salary read is shown in context for the role.'],
  ['Is my CV kept private?', 'Yes. Your CV stays private to your account and you can delete it in one click at any time.'],
  ['Do my credits expire?', 'No. Credits never expire, and there is no recurring charge — you only spend a credit when you run a paid action.'],
]

function Card({ title, body }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)' }}>
      <h3 className="h-section" style={{ fontSize: '1.05rem', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{body}</p>
    </div>
  )
}

export default function IndiaJobSeekers() {
  useEffect(() => {
    const prev = document.title
    document.title = 'JobTrack AI for India Job Seekers — Check CV-vs-Job Fit (INR)'
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
            For India job seekers
          </div>
          <h1 className="h-page" style={{ fontSize: '2.3rem', lineHeight: 1.12, marginBottom: 18 }}>
            Built for the Indian job hunt — read the JD before you apply.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 620 }}>
            JobTrack AI is an AI career copilot for job seekers in India. Paste a job description and
            upload your CV, and in seconds you get a verdict — an A–F fit grade, a salary read, your
            matched and missing skills, and the red flags in the posting. Then it tailors your CV for
            the role and preps the interview. Priced in INR, with credits that never expire.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Cta>Get your free verdict — 3 credits, no card</Cta>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No subscription. INR pricing.</span>
          </div>
        </section>

        {/* Why it fits */}
        <section style={{ paddingBottom: 8 }}>
          <h2 className="h-section" style={{ marginBottom: 18 }}>Why it fits the Indian job search</h2>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {REASONS.map(([t, b]) => <Card key={t} title={t} body={b} />)}
          </div>
        </section>

        {/* How it works */}
        <section style={{ paddingTop: 40, paddingBottom: 8 }}>
          <h2 className="h-section" style={{ marginBottom: 18 }}>How it works</h2>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {STEPS.map(([t, b], i) => (
              <div key={t} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--surface)' }}>
                <div className="metric-value" style={{ fontSize: '1.6rem', color: 'var(--blue-accent)', marginBottom: 6 }}>{i + 1}</div>
                <h3 className="h-section" style={{ fontSize: '1rem', marginBottom: 6 }}>{t}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing honesty */}
        <section style={{ paddingTop: 40, paddingBottom: 8 }}>
          <h2 className="h-section" style={{ marginBottom: 16 }}>What's free, what's a credit</h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              ['CV upload + parsing', 'Free'],
              ['AI job search', 'Free'],
              ['Application tracker (Kanban)', 'Free'],
              ['Evaluate a job against your CV', '1 credit'],
              ['Tailor your CV for a role', '1 credit'],
              ['Interview prep', '1 credit'],
            ].map(([label, cost], i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: i % 2 ? 'var(--surface)' : 'var(--surface-raised)', borderBottom: i === 5 ? 'none' : '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: cost === 'Free' ? 'var(--text-muted)' : 'var(--blue-accent)' }}>{cost}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>
            New users get <strong>3 free credits on signup, no card</strong> — enough for a full first
            run. Top up with 10 credits for ₹199 or 30 for ₹499. Credits never expire.
          </p>
        </section>

        {/* FAQ */}
        <section style={{ paddingTop: 40, paddingBottom: 8 }}>
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
