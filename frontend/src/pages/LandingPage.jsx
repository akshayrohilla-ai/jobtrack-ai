import { useState, useEffect } from 'react'

const FEATURES = [
  {
    icon: '📄',
    title: 'AI CV Parsing',
    desc: 'Upload once. AI extracts your skills, experience, and seniority instantly. Free, always.',
    tag: 'Free',
    tagColor: '#10b981',
  },
  {
    icon: '🎯',
    title: 'JD Evaluation',
    desc: 'Paste any job description. Get an A–F grade, salary estimate, red flags, and a go/no-go verdict.',
    tag: '1 credit',
    tagColor: '#1B6FEB',
  },
  {
    icon: '✨',
    title: 'CV Tailoring',
    desc: 'AI rewrites your CV to match the job description. Download as a formatted DOCX in seconds.',
    tag: '1 credit',
    tagColor: '#1B6FEB',
  },
  {
    icon: '🔍',
    title: 'AI Job Search',
    desc: 'Search jobs by role, location, and seniority. AI matches openings to your CV profile automatically.',
    tag: 'Free',
    tagColor: '#10b981',
  },
  {
    icon: '📊',
    title: 'Application Tracker',
    desc: 'Kanban board to track every application — Applied, Interview, Offer, Rejected. Never lose track.',
    tag: 'Free',
    tagColor: '#10b981',
  },
  {
    icon: '👥',
    title: 'Recruiter Mode',
    desc: 'Score and shortlist candidates against a JD. Export your shortlist as CSV in one click.',
    tag: 'Coming Soon',
    tagColor: '#f59e0b',
    comingSoon: true,
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    desc: 'Your CV and data are yours. Supabase Row-Level Security ensures nobody else can see your data.',
    tag: 'Private',
    tagColor: '#64748b',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Upload your CV',
    desc: 'Drop your PDF or DOCX. Our AI reads every line and builds your profile — skills, experience, seniority.',
  },
  {
    num: '02',
    title: 'Paste a job description',
    desc: 'Found a role? Paste the JD. Get a grade, salary range, matched skills, gaps, and red flags in under 10 seconds.',
  },
  {
    num: '03',
    title: 'Apply with a tailored CV',
    desc: 'One click rewrites your CV to match the job. Download as DOCX and send. Stand out from generic applications.',
  },
]

const PAINS = [
  { emoji: '😩', text: 'Spent hours applying to jobs that ghosted you' },
  { emoji: '🤷', text: 'No idea if your CV even matches the job description' },
  { emoji: '📉', text: 'Generic CV getting filtered out by ATS before a human sees it' },
  { emoji: '🗓️', text: 'Lost track of which jobs you applied to and when' },
]

export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div style={{ background: '#050B18', color: 'white', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(5,11,24,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1B6FEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M2 7h7M2 10h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
              JobTrack <span style={{ color: '#60a5fa' }}>AI</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>Privacy</a>
            <button onClick={onGetStarted}
              style={{ background: '#1B6FEB', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', textAlign: 'center' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(27,111,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '30%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(27,111,235,0.1)', border: '1px solid rgba(27,111,235,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 32, fontSize: 13, color: '#60a5fa' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          AI-powered job search for Indian professionals
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', maxWidth: 900, marginBottom: 24 }}>
          Stop applying blindly —{' '}
          <span style={{ background: 'linear-gradient(135deg, #1B6FEB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            know if a job is worth your time
          </span>{' '}
          before you apply
        </h1>

        {/* Subheadline */}
        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.55)', maxWidth: 600, lineHeight: 1.6, marginBottom: 40 }}>
          AI that reads your CV, grades every job, and tailors your application in seconds.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
          <button onClick={onGetStarted}
            style={{ background: 'linear-gradient(135deg, #1B6FEB, #2563eb)', color: 'white', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 40px rgba(27,111,235,0.4)' }}>
            Start Free — 2 credits on signup
          </button>
          <a href="#how-it-works"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
            See how it works
          </a>
        </div>

        {/* Social proof */}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          No credit card required · CV parsing always free · Top up credits anytime from ₹199
        </p>
      </section>

      {/* Pain points */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, marginBottom: 16, letterSpacing: '-1px' }}>
            Sound familiar?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 48, fontSize: 16 }}>
            Most job seekers waste weeks on applications that were never going to work.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {PAINS.map((p, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
                <span style={{ fontSize: 28 }}>{p.emoji}</span>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.5 }}>{p.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, padding: '20px 32px', background: 'rgba(27,111,235,0.08)', border: '1px solid rgba(27,111,235,0.2)', borderRadius: 16, display: 'inline-block' }}>
            <p style={{ color: '#60a5fa', fontWeight: 600, fontSize: 16, margin: 0 }}>
              JobTrack AI fixes all of this — before you send a single application.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-1px', marginBottom: 12 }}>
              Everything you need to{' '}
              <span style={{ background: 'linear-gradient(135deg, #1B6FEB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                job search smarter
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16 }}>Not harder.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${f.comingSoon ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 20,
                padding: '28px',
                transition: 'border-color 0.2s, transform 0.2s',
                opacity: f.comingSoon ? 0.6 : 1,
                position: 'relative',
              }}
                onMouseEnter={e => { if (!f.comingSoon) { e.currentTarget.style.borderColor = 'rgba(27,111,235,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                onMouseLeave={e => { if (!f.comingSoon) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' } }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>{f.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: `${f.tagColor}20`, color: f.tagColor, border: `1px solid ${f.tagColor}40` }}>
                    {f.tag}
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-1px', marginBottom: 12 }}>
            How it works
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 56, fontSize: 16 }}>
            From CV upload to tailored application in under 2 minutes.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 32, alignItems: 'flex-start', textAlign: 'left', padding: '32px 0', borderBottom: i < STEPS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(27,111,235,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(27,111,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#60a5fa', fontFamily: 'monospace' }}>
                  {step.num}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, marginTop: 12 }}>{step.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credits / Pricing */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-1px', marginBottom: 12 }}>
            Simple, transparent pricing
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 48, fontSize: 16 }}>
            Pay only for what you use. Credits never expire.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
            {[
              { label: 'Free on signup', value: '2 credits', desc: 'No card needed. Try the full product.', highlight: false },
              { label: '₹199', value: '10 credits', desc: 'Perfect for an active job search.', highlight: false },
              { label: '₹499', value: '30 credits', desc: 'Best value. Stock up and apply confidently.', highlight: true },
            ].map((pack, i) => (
              <div key={i} style={{
                background: pack.highlight ? 'linear-gradient(135deg, rgba(27,111,235,0.15), rgba(124,58,237,0.15))' : 'rgba(255,255,255,0.03)',
                border: pack.highlight ? '1.5px solid rgba(27,111,235,0.5)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: '32px 24px', position: 'relative',
              }}>
                {pack.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #1B6FEB, #7C3AED)', borderRadius: 100, padding: '4px 16px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    BEST VALUE
                  </div>
                )}
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{pack.value}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa', marginBottom: 12 }}>{pack.label}</div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>{pack.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px', display: 'inline-block', marginBottom: 48 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
              📄 CV parsing is always <strong style={{ color: 'white' }}>free</strong> · 🎯 JD evaluation = 1 credit · ✨ CV tailoring = 1 credit · 📊 Tracker is always <strong style={{ color: 'white' }}>free</strong>
            </p>
          </div>
          <div>
            <button onClick={onGetStarted}
              style={{ background: 'linear-gradient(135deg, #1B6FEB, #2563eb)', color: 'white', border: 'none', borderRadius: 12, padding: '16px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 40px rgba(27,111,235,0.35)' }}>
              Start Free — 2 credits on signup
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA banner */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, rgba(27,111,235,0.1), rgba(124,58,237,0.1))', border: '1px solid rgba(27,111,235,0.2)', borderRadius: 24, padding: '60px 40px' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>
            Your next job starts with one smart decision
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 }}>
            Join professionals who apply less and land more.
          </p>
          <button onClick={onGetStarted}
            style={{ background: 'linear-gradient(135deg, #1B6FEB, #7C3AED)', color: 'white', border: 'none', borderRadius: 12, padding: '16px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1B6FEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M2 7h7M2 10h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>JobTrack <span style={{ color: '#60a5fa' }}>AI</span></span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'Refund Policy', href: '/refund' },
              { label: 'Contact', href: '/contact' },
            ].map(link => (
              <a key={link.href} href={link.href} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                {link.label}
              </a>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>
            © 2026 JobTrack AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
