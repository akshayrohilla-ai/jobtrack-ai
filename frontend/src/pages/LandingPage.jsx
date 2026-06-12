import { useState, useEffect } from 'react'

const LogoIcon = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="8" width="14" height="10" rx="2" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="13" x2="17" y2="13" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="14.5" cy="16.5" r="2.2" stroke="white" strokeWidth="1.3"/>
    <path d="M16.2 18.2l1.3 1.3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div style={{ background: '#060C1A', color: 'white', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(6,12,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'all 0.3s',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1B6FEB,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogoIcon size={17} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: '#fff', lineHeight: 1 }}>
                JobTrack<span style={{ color: '#60a5fa' }}>AI</span>
              </div>
              <div style={{ fontSize: 10, color: '#60a5fa', letterSpacing: '0.15em', fontWeight: 700, marginTop: 3, lineHeight: 1 }}>YOUR AI CAREER COPILOT</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none' }}>Privacy</a>
            <button onClick={onGetStarted}
              style={{ background: '#1B6FEB', color: 'white', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(27,111,235,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '28%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(124,58,237,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '25%', right: '20%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(27,111,235,0.1)', border: '1px solid rgba(27,111,235,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 32, fontSize: 13, color: '#93c5fd' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />
          Built for professionals who prepare before they apply
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', maxWidth: 860, margin: '0 auto 22px' }}>
          Don't send that<br />
          <span style={{ background: 'linear-gradient(135deg, #1B6FEB 0%, #7C3AED 50%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            CV yet.
          </span>
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'rgba(255,255,255,0.5)', maxWidth: 540, margin: '0 auto 16px', lineHeight: 1.65 }}>
          Most applicants skip the step that decides whether they get a callback. Check if the job is actually worth your time first.
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.22)', marginBottom: 40, letterSpacing: '0.2px' }}>
          AI reads your CV &nbsp;·&nbsp; grades every JD &nbsp;·&nbsp; tailors your application &nbsp;·&nbsp; preps you for the interview
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
          <button onClick={onGetStarted}
            style={{ background: 'linear-gradient(135deg, #1B6FEB, #2563EB)', color: 'white', border: 'none', borderRadius: 12, padding: '15px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 40px rgba(27,111,235,0.4)' }}>
            Try free — 3 credits, no card
          </button>
          <a href="#how-it-works"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '15px 32px', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
            See how it works
          </a>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>If it's not for you, close the tab. No hard feelings.</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 10 }}>
          By signing up you agree to our{' '}
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.3)' }}>Terms & Conditions</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.3)' }}>Privacy Policy</a>
        </p>
      </section>

      {/* PAIN */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>still doing this?</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12 }}>
            The job search advice<br />that's been failing you
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 44 }}>Applying to 30 jobs and hearing back from 2 isn't bad luck. It's a bad process.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { emoji: '😩', text: 'Spent hours on applications that got zero response' },
              { emoji: '🤷', text: "No idea if your skills even match what they're asking for" },
              { emoji: '📉', text: 'Same generic CV going to every role, getting filtered by ATS' },
              { emoji: '🎤', text: 'Got the interview — walked in underprepared and blanked' },
            ].map((p, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 22, textAlign: 'left' }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{p.emoji}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{p.text}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: '18px 32px', background: 'rgba(27,111,235,0.08)', border: '1px solid rgba(27,111,235,0.2)', borderRadius: 16, display: 'inline-block' }}>
            <p style={{ color: '#60a5fa', fontWeight: 700, fontSize: 16, margin: 0 }}>JobTrack AI fixes this — before you send a single application.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>the process</p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 10 }}>
              Three steps most<br />candidates skip
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>CV to tailored application in under 2 minutes.</p>
          </div>
          {[
            { num: '01', color: '#1B6FEB', bg: 'rgba(27,111,235,0.12)', border: 'rgba(27,111,235,0.3)', textColor: '#60a5fa', title: 'Upload your CV once', desc: 'Drop PDF or DOCX. AI reads every line, extracts your skills, seniority, and experience — no forms to fill.' },
            { num: '02', color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)', textColor: '#a78bfa', title: 'Paste a JD — get a verdict in 10 seconds', desc: 'A–F grade, salary range, matched skills, red flags. Know if it\'s worth your time before you spend it.' },
            { num: '03', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', textColor: '#22d3ee', title: 'Apply tailored — not generic', desc: 'One click rewrites your CV for that specific job. Download as DOCX, send. Then prep your interview answers before anyone else does.' },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 28, alignItems: 'flex-start', padding: '28px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 14, background: step.bg, border: `1px solid ${step.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: step.textColor, fontFamily: 'monospace', marginTop: 4 }}>
                {step.num}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>what actually moves the needle</p>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 10 }}>
              Everything smart<br />job seekers do first
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Not harder. Smarter.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {[
              { icon: '📄', title: 'CV Parsing', tag: 'Free', tagBg: 'rgba(16,185,129,0.12)', tagColor: '#10b981', tagBorder: 'rgba(16,185,129,0.3)', desc: 'Upload once. AI reads every line so you never fill another profile form.' },
              { icon: '🎯', title: 'JD Evaluation', tag: '1 credit', tagBg: 'rgba(27,111,235,0.12)', tagColor: '#60a5fa', tagBorder: 'rgba(27,111,235,0.3)', desc: 'A–F grade, salary range, red flags, and a go/no-go verdict — before you write a cover letter.' },
              { icon: '✨', title: 'CV Tailoring', tag: '1 credit', tagBg: 'rgba(27,111,235,0.12)', tagColor: '#60a5fa', tagBorder: 'rgba(27,111,235,0.3)', desc: 'AI rewrites your CV specifically for that JD. Download as DOCX. Stop sending the same CV to every job.' },
              { icon: '🎤', title: 'Interview Prep', tag: '1 credit', tagBg: 'rgba(27,111,235,0.12)', tagColor: '#60a5fa', tagBorder: 'rgba(27,111,235,0.3)', desc: '5 tailored STAR answers from your CV, red-flag coaching, and 5 smart questions to ask them.' },
              { icon: '🔍', title: 'AI Job Search', tag: 'Free & Unlimited', tagBg: 'rgba(16,185,129,0.12)', tagColor: '#10b981', tagBorder: 'rgba(16,185,129,0.3)', desc: 'Smart LinkedIn search links matched to your CV. No credits, no limit. Job search will never cost you.' },
              { icon: '📊', title: 'Application Tracker', tag: 'Free', tagBg: 'rgba(16,185,129,0.12)', tagColor: '#10b981', tagBorder: 'rgba(16,185,129,0.3)', desc: 'Kanban board — Applied, Interview, Offer, Rejected. Drag and drop. Never lose track of where you stand.' },
            ].map((f, i) => (
              <div key={i}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 26, transition: 'border-color 0.2s, transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(27,111,235,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 30, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{f.title}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: f.tagBg, color: f.tagColor, border: `1px solid ${f.tagBorder}` }}>{f.tag}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>pricing</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12 }}>
            Start free.<br />Only pay if you get value.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 48 }}>Credits never expire. No subscription. No surprises.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 32 }}>
            {[
              { credits: '3 credits', price: 'Free on signup', desc: 'No card needed. Try the full workflow end to end.', highlight: false },
              { credits: '10 credits', price: '₹199', desc: 'Perfect for an active job search sprint.', highlight: false },
              { credits: '30 credits', price: '₹499', desc: 'Stock up and apply to every role with full confidence.', highlight: true },
            ].map((pack, i) => (
              <div key={i} style={{
                background: pack.highlight ? 'linear-gradient(135deg, rgba(27,111,235,0.12), rgba(124,58,237,0.12))' : 'rgba(255,255,255,0.03)',
                border: pack.highlight ? '2px solid rgba(27,111,235,0.45)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '30px 22px', position: 'relative',
              }}>
                {pack.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #1B6FEB, #7C3AED)', borderRadius: 100, padding: '4px 16px', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                    BEST VALUE
                  </div>
                )}
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{pack.credits}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa', marginBottom: 14 }}>{pack.price}</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{pack.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 24px', marginBottom: 36, display: 'inline-block' }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              📄 CV parsing <strong style={{ color: 'white' }}>always free</strong> &nbsp;·&nbsp; 🔍 Job search <strong style={{ color: 'white' }}>always free</strong> &nbsp;·&nbsp; 📊 Tracker <strong style={{ color: 'white' }}>always free</strong><br />
              🎯 JD evaluation = 1 credit &nbsp;·&nbsp; ✨ CV tailoring = 1 credit &nbsp;·&nbsp; 🎤 Interview prep = 1 credit
            </p>
          </div>
          <div>
            <button onClick={onGetStarted}
              style={{ background: 'linear-gradient(135deg, #1B6FEB, #2563EB)', color: 'white', border: 'none', borderRadius: 12, padding: '16px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 40px rgba(27,111,235,0.35)' }}>
              Start free — 3 credits on signup
            </button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, rgba(27,111,235,0.08), rgba(124,58,237,0.08))', border: '1px solid rgba(27,111,235,0.2)', borderRadius: 28, padding: '64px 48px' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 12, lineHeight: 1.12 }}>
            Your next role won't come<br />from sending more CVs.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, marginBottom: 10, fontWeight: 600 }}>It'll come from sending better ones.</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, marginBottom: 36 }}>Join professionals who apply less and land more.</p>
          <button onClick={onGetStarted}
            style={{ background: 'linear-gradient(135deg, #1B6FEB, #7C3AED)', color: 'white', border: 'none', borderRadius: 12, padding: '16px 44px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 40px rgba(124,58,237,0.3)' }}>
            Get started — it's free
          </button>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, marginTop: 18 }}>No card. No catch. If it doesn't help, delete your account in one click.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#1B6FEB,#0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogoIcon size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1 }}>JobTrack<span style={{ color: '#60a5fa' }}>AI</span></div>
              <div style={{ fontSize: 9, color: '#ffffff', letterSpacing: '0.15em', fontWeight: 600, marginTop: 3, lineHeight: 1, opacity: 0.7 }}>YOUR AI CAREER COPILOT</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'Refund Policy', href: '/refund' },
              { label: 'Contact', href: '/contact' },
            ].map(link => (
              <a key={link.href} href={link.href}
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                {link.label}
              </a>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: 0 }}>© 2026 JobTrack AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
