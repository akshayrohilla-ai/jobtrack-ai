import { useState, useEffect } from 'react'
import { FileText, ClipboardCheck, Wand2, BriefcaseBusiness, Search, Kanban } from 'lucide-react'

/* ──────────────────────────────────────────────────────────────
   "The Verdict" — editorial / quiet-luxury landing.
   Warm ivory paper, deep ink, a single claret accent + brass detail.
   Now theme-aware: light (ivory) + warm-dark (near-black), toggled in
   the nav and persisted under the same `jobtrack_theme` key the app uses,
   so the choice carries through after sign-in.
   ────────────────────────────────────────────────────────────── */

const LIGHT = {
  paper:       '#F3EDE2',
  paperRaised: '#FBF7F0',
  paperSubtle: '#ECE3D3',
  ink:         '#211E18',
  inkSoft:     '#4E483D',
  muted:       '#837B6B',
  ghost:       '#ADA491',
  hairline:    '#E2D8C6',
  hairlineSld: '#D8CDB8',
  claret:      '#7A2E2E',
  claretSoft:  '#97413E',
  brass:       '#A6803C',
  success:     '#2F6B4F',
  navScroll:   'rgba(243,237,226,0.86)',
  panelBg:     '#211E18',
  panelBorder: 'transparent',
  panelText:   '#F3EDE2',
  panelSub:    'rgba(243,237,226,0.62)',
  panelGhost:  'rgba(243,237,226,0.4)',
  matchBg:     'rgba(47,107,79,0.12)',
  flagBg:      'rgba(122,46,46,0.10)',
}
const DARK = {
  paper:       '#14110C',
  paperRaised: '#1C1813',
  paperSubtle: '#221D17',
  ink:         '#EFE8DC',
  inkSoft:     '#C7BDAB',
  muted:       '#948B79',
  ghost:       '#5E574A',
  hairline:    '#2E2820',
  hairlineSld: '#3A352A',
  claret:      '#C97B5C',
  claretSoft:  '#D9926F',
  brass:       '#C9A86A',
  success:     '#5FAE83',
  navScroll:   'rgba(20,17,12,0.86)',
  panelBg:     '#1C1813',
  panelBorder: '#2E2820',
  panelText:   '#EFE8DC',
  panelSub:    '#A89E8C',
  panelGhost:  '#6E6556',
  matchBg:     'rgba(95,174,131,0.14)',
  flagBg:      'rgba(201,123,92,0.14)',
}
const F = "'Fraunces', Georgia, serif"          // editorial display serif
const S = "'DM Sans', system-ui, sans-serif"    // grotesque body / UI

const LogoIcon = ({ size = 17, stroke = '#F3EDE2' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="8" width="14" height="10" rx="2" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="3" y1="13" x2="17" y2="13" stroke={stroke} strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="14.5" cy="16.5" r="2.2" stroke={stroke} strokeWidth="1.3"/>
    <path d="M16.2 18.2l1.3 1.3" stroke={stroke} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const Wordmark = ({ c }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
    <div style={{ width: 34, height: 34, borderRadius: 7, background: c.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <LogoIcon size={17} stroke={c.paper} />
    </div>
    <div>
      <div style={{ fontFamily: S, fontWeight: 600, fontSize: 15, letterSpacing: '-0.2px', color: c.ink, lineHeight: 1 }}>
        JobTrack<span style={{ color: c.claret }}> AI</span>
      </div>
      <div style={{ fontFamily: S, fontSize: 9, color: c.muted, letterSpacing: '0.22em', fontWeight: 600, marginTop: 4, lineHeight: 1, textTransform: 'uppercase' }}>
        Your AI Career Copilot
      </div>
    </div>
  </div>
)

const ThemeToggle = ({ darkMode, onToggle, c }) => (
  <button onClick={onToggle} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${c.hairlineSld}`, background: 'transparent', color: c.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
    onMouseEnter={e => { e.currentTarget.style.background = c.paperRaised; e.currentTarget.style.borderColor = c.muted }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = c.hairlineSld }}>
    {darkMode ? (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    )}
  </button>
)

// Small letter-spaced overline used to open each section
const Eyebrow = ({ children, c, color }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
    <span style={{ width: 24, height: 1, background: c.brass, display: 'inline-block' }} />
    <span style={{ fontFamily: S, fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: color || c.claret }}>{children}</span>
  </div>
)

export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('jobtrack_theme') === 'dark' } catch { return false }
  })
  const c = darkMode ? DARK : LIGHT

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Persist + apply globally (same key the app uses) so the choice
  // survives into the logged-in experience.
  useEffect(() => {
    try {
      if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('jobtrack_theme', 'dark') }
      else { document.documentElement.classList.remove('dark'); localStorage.setItem('jobtrack_theme', 'light') }
    } catch {}
  }, [darkMode])

  return (
    <div style={{ background: c.paper, color: c.ink, fontFamily: S, overflowX: 'hidden', WebkitFontSmoothing: 'antialiased', transition: 'background 0.25s, color 0.25s' }}>

      {/* ─────────────── NAV ─────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? c.navScroll : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? `1px solid ${c.hairline}` : '1px solid transparent',
        transition: 'all 0.3s', padding: '0 28px',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Wordmark c={c} />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="/privacy" style={{ fontFamily: S, color: c.muted, fontSize: 13, textDecoration: 'none' }}>Privacy</a>
            <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode(d => !d)} c={c} />
            <button onClick={onGetStarted}
              style={{ fontFamily: S, background: c.ink, color: c.paper, border: 'none', borderRadius: 6, padding: '10px 22px', fontSize: 13, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.2px' }}>
              Begin
            </button>
          </div>
        </div>
      </nav>

      {/* ─────────────── HERO ─────────────── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '152px 28px 88px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,0.95fr)', gap: 64, alignItems: 'center' }} className="hero-grid">

          {/* Left — the statement */}
          <div>
            <Eyebrow c={c}>For the ones who prepare</Eyebrow>
            <h1 style={{ fontFamily: F, fontWeight: 400, fontSize: 'clamp(46px, 6.4vw, 82px)', lineHeight: 1.02, letterSpacing: '-1.5px', margin: '0 0 26px' }}>
              Don't send that<br />
              CV <span style={{ fontStyle: 'italic', color: c.claret }}>yet.</span>
            </h1>
            <p style={{ fontFamily: S, fontSize: 'clamp(16px, 1.5vw, 19px)', color: c.inkSoft, maxWidth: 452, lineHeight: 1.62, margin: '0 0 14px' }}>
              Most applicants skip the one step that decides the callback. Before you spend an evening on an application, let an AI read the job, weigh it against your CV, and hand you a verdict.
            </p>
            <p style={{ fontFamily: S, fontSize: 13, color: c.muted, margin: '0 0 36px', letterSpacing: '0.2px' }}>
              A grade. A salary read. The red flags. In seconds.
            </p>

            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={onGetStarted}
                style={{ fontFamily: S, background: c.ink, color: c.paper, border: 'none', borderRadius: 6, padding: '15px 30px', fontSize: 15, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.2px' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 22px ${darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(33,30,24,0.22)'}` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                Begin — 3 credits, no card
              </button>
              <a href="#how" style={{ fontFamily: S, fontSize: 15, color: c.ink, textDecoration: 'none', fontWeight: 500, borderBottom: `1px solid ${c.hairlineSld}`, paddingBottom: 3 }}>
                See how it reads a job ↓
              </a>
            </div>

            <p style={{ fontFamily: S, fontSize: 12, color: c.ghost, marginTop: 30, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              No card · Your CV stays private · Credits never expire
            </p>
          </div>

          {/* Right — the signature artifact: an examiner's verdict */}
          <VerdictDossier c={c} darkMode={darkMode} />
        </div>
      </section>

      {/* ─────────────── TRUST STRIP ─────────────── */}
      <div style={{ borderTop: `1px solid ${c.hairline}`, borderBottom: `1px solid ${c.hairline}`, background: c.paperRaised }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '20px 28px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px 38px' }}>
          {['AI reads your CV', 'Grades every job', 'Tailors your application', 'Preps your interview'].map((t, i) => (
            <span key={i} style={{ fontFamily: S, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.muted, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              {i > 0 && <span style={{ color: c.brass }}>·</span>}{t}
            </span>
          ))}
        </div>
      </div>

      {/* ─────────────── PROBLEM ─────────────── */}
      <section style={{ maxWidth: 920, margin: '0 auto', padding: '104px 28px 88px' }}>
        <Eyebrow c={c}>The problem</Eyebrow>
        <h2 style={{ fontFamily: F, fontWeight: 400, fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.18, letterSpacing: '-0.5px', margin: '0 0 18px', maxWidth: 760 }}>
          Applying to thirty roles and hearing back from two isn't bad luck. <span style={{ fontStyle: 'italic', color: c.claret }}>It's a bad process.</span>
        </h2>
        <p style={{ fontFamily: S, fontSize: 17, color: c.inkSoft, maxWidth: 540, lineHeight: 1.62, margin: '0 0 52px' }}>
          The effort goes in before you ever hit send — and that's exactly where most people fly blind.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: 0, borderTop: `1px solid ${c.hairline}` }} className="problem-grid">
          {[
            { n: '01', t: 'Hours spent, nothing back', d: 'Long evenings on applications that vanish into an inbox and never return a word.' },
            { n: '02', t: 'No read on the fit', d: "You can't tell if your experience actually matches what they're asking for." },
            { n: '03', t: 'One CV for every role', d: 'The same generic document going out everywhere, quietly filtered by the ATS.' },
            { n: '04', t: 'The interview ambush', d: 'You finally get the call — then walk in underprepared and freeze on the obvious question.' },
          ].map((p, i) => (
            <div key={i} style={{ padding: '28px 26px 30px', borderBottom: `1px solid ${c.hairline}`, borderRight: i % 2 === 0 ? `1px solid ${c.hairline}` : 'none' }} className="problem-cell">
              <div style={{ fontFamily: F, fontSize: 26, color: c.brass, lineHeight: 1, marginBottom: 14 }}>{p.n}</div>
              <div style={{ fontFamily: S, fontSize: 16, fontWeight: 600, color: c.ink, marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontFamily: S, fontSize: 14, color: c.muted, lineHeight: 1.6 }}>{p.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── HOW IT WORKS ─────────────── */}
      <section id="how" style={{ background: c.paperRaised, borderTop: `1px solid ${c.hairline}`, borderBottom: `1px solid ${c.hairline}` }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '100px 28px' }}>
          <Eyebrow c={c}>The method</Eyebrow>
          <h2 style={{ fontFamily: F, fontWeight: 400, fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.1, letterSpacing: '-0.5px', margin: '0 0 56px', maxWidth: 620 }}>
            Three steps most<br />candidates skip.
          </h2>
          {[
            { num: '01', title: 'Upload your CV, once', desc: 'Drop a PDF or DOCX. The AI reads every line — skills, seniority, the shape of your experience. No forms, no profile to fill.' },
            { num: '02', title: 'Paste a job, get a verdict', desc: 'An A–F grade, a salary read, your matched skills, and the red flags — in seconds. Know whether a role is worth your evening before you spend it.' },
            { num: '03', title: 'Apply tailored, then prepare', desc: 'One click rewrites your CV for that specific role. Download, send — then walk into the interview with answers already drafted from your own history.' },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 12, alignItems: 'start', padding: '30px 0', borderTop: `1px solid ${c.hairline}`, ...(i === arr.length - 1 ? { borderBottom: `1px solid ${c.hairline}` } : {}) }} className="how-row">
              <div style={{ fontFamily: F, fontSize: 40, color: c.claret, lineHeight: 0.9, fontWeight: 300 }}>{step.num}</div>
              <div style={{ paddingTop: 4 }}>
                <h3 style={{ fontFamily: F, fontWeight: 400, fontSize: 23, margin: '0 0 8px', letterSpacing: '-0.3px' }}>{step.title}</h3>
                <p style={{ fontFamily: S, color: c.inkSoft, fontSize: 15.5, lineHeight: 1.62, margin: 0, maxWidth: 580 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── FEATURES ─────────────── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '104px 28px 92px' }}>
        <div style={{ marginBottom: 48 }}>
          <Eyebrow c={c}>What's inside</Eyebrow>
          <h2 style={{ fontFamily: F, fontWeight: 400, fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.1, letterSpacing: '-0.5px', margin: 0, maxWidth: 640 }}>
            Everything the careful<br />candidate does first.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          {[
            { Icon: FileText,         title: 'CV Parsing',          tag: 'Free',            desc: 'Upload once. The AI reads every line so you never fill another profile form. Your CV stays yours — one click deletes everything.' },
            { Icon: ClipboardCheck,   title: 'JD Evaluation',       tag: '1 credit',        desc: 'An A–F grade, salary range, red flags, and a clear go / no-go — before you write a word.' },
            { Icon: Wand2,            title: 'CV Tailoring',        tag: '1 credit',        desc: 'Rewrites your CV for that one specific role. Download as DOCX. No more one-size-fits-all.' },
            { Icon: BriefcaseBusiness, title: 'Interview Prep',     tag: '1 credit',        desc: 'Five tailored STAR answers from your own history, red-flag coaching, and questions to ask them.' },
            { Icon: Search,           title: 'AI Job Search',       tag: 'Free & unlimited', desc: 'Search links matched to your CV. No credits, no ceiling. Finding roles will never cost you.' },
            { Icon: Kanban,           title: 'Application Tracker', tag: 'Free',            desc: 'A quiet Kanban board — Applied, Interview, Offer, Closed. Always know exactly where you stand.' },
          ].map((f, i) => (
            <div key={i}
              style={{ background: c.paperRaised, border: `1px solid ${c.hairline}`, borderRadius: 10, padding: '26px 24px 28px', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.ink; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 14px 30px ${darkMode ? 'rgba(0,0,0,0.35)' : 'rgba(33,30,24,0.07)'}` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.hairline; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, border: `1px solid ${c.hairlineSld}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color: c.claret }}>
                <f.Icon size={19} strokeWidth={1.6} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 9, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: F, fontWeight: 400, fontSize: 20, letterSpacing: '-0.2px' }}>{f.title}</span>
                <span style={{ fontFamily: S, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: f.tag.startsWith('Free') ? c.success : c.brass }}>{f.tag}</span>
              </div>
              <p style={{ fontFamily: S, color: c.muted, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── PRICING ─────────────── */}
      <section style={{ background: c.paperRaised, borderTop: `1px solid ${c.hairline}`, borderBottom: `1px solid ${c.hairline}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Eyebrow c={c}>Pricing</Eyebrow></div>
            <h2 style={{ fontFamily: F, fontWeight: 400, fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.1, letterSpacing: '-0.5px', margin: '0 0 12px' }}>
              Start free. Pay only if it earns it.
            </h2>
            <p style={{ fontFamily: S, color: c.muted, fontSize: 16, margin: 0 }}>Credits never expire. No subscription. No surprises.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 18, marginBottom: 30 }}>
            {[
              { credits: '3 credits', price: 'Free', sub: 'on signup', desc: 'No card needed. Run the full workflow end to end.', rec: false },
              { credits: '10 credits', price: '₹199', sub: 'one-off', desc: 'The right size for an active search sprint.', rec: false },
              { credits: '30 credits', price: '₹499', sub: 'one-off', desc: 'Stock up and apply to every role with full confidence.', rec: true },
            ].map((pack, i) => (
              <div key={i} style={{
                position: 'relative', background: c.paper,
                border: pack.rec ? `1px solid ${c.ink}` : `1px solid ${c.hairline}`,
                borderRadius: 10, padding: '34px 26px 30px',
              }}>
                {pack.rec && <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 2, background: c.brass }} />}
                {pack.rec && (
                  <div style={{ fontFamily: S, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.brass, marginBottom: 14 }}>
                    Recommended
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: F, fontSize: 38, fontWeight: 400, letterSpacing: '-1px', color: c.ink }}>{pack.price}</span>
                  <span style={{ fontFamily: S, fontSize: 13, color: c.ghost }}>{pack.sub}</span>
                </div>
                <div style={{ fontFamily: S, fontSize: 14, fontWeight: 600, color: c.claret, marginBottom: 14 }}>{pack.credits}</div>
                <p style={{ fontFamily: S, color: c.muted, fontSize: 14, lineHeight: 1.55, margin: 0 }}>{pack.desc}</p>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: S, textAlign: 'center', color: c.muted, fontSize: 14, lineHeight: 1.9, margin: '0 0 34px' }}>
            CV parsing, job search, and the tracker are <strong style={{ color: c.ink, fontWeight: 600 }}>always free</strong>.<br />
            JD evaluation, CV tailoring, and interview prep are <strong style={{ color: c.ink, fontWeight: 600 }}>one credit each</strong>.
          </p>
          <div style={{ textAlign: 'center' }}>
            <button onClick={onGetStarted}
              style={{ fontFamily: S, background: c.ink, color: c.paper, border: 'none', borderRadius: 6, padding: '15px 36px', fontSize: 15, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.2px' }}>
              Begin — 3 credits on signup
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────── CLOSING (contrast panel) ─────────────── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 28px' }}>
        <div style={{ background: c.panelBg, border: `1px solid ${c.panelBorder}`, borderRadius: 16, padding: 'clamp(48px, 7vw, 88px) clamp(28px, 6vw, 72px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: 30, height: 1, background: c.brass, margin: '0 auto 26px' }} />
          <h2 style={{ fontFamily: F, fontWeight: 400, fontSize: 'clamp(30px, 4.6vw, 54px)', lineHeight: 1.12, letterSpacing: '-1px', color: c.panelText, margin: '0 0 18px' }}>
            Your next role won't come from<br />sending <span style={{ fontStyle: 'italic', color: c.brass }}>more</span> CVs.
          </h2>
          <p style={{ fontFamily: S, fontSize: 18, color: c.panelSub, margin: '0 0 36px' }}>
            It'll come from sending <span style={{ color: c.panelText, fontWeight: 600 }}>better ones.</span>
          </p>
          <button onClick={onGetStarted}
            style={{ fontFamily: S, background: c.panelText, color: c.panelBg, border: 'none', borderRadius: 6, padding: '15px 38px', fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.2px' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Get started — it's free
          </button>
          <p style={{ fontFamily: S, fontSize: 12, color: c.panelGhost, marginTop: 20 }}>
            No card. No catch. Delete your account in one click if it isn't for you.
          </p>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer style={{ borderTop: `1px solid ${c.hairline}`, padding: '40px 28px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 22 }}>
          <Wordmark c={c} />
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Refund', href: '/refund' },
              { label: 'Contact', href: '/contact' },
            ].map(link => (
              <a key={link.href} href={link.href}
                style={{ fontFamily: S, color: c.muted, fontSize: 13, textDecoration: 'none', letterSpacing: '0.04em' }}
                onMouseEnter={e => e.currentTarget.style.color = c.ink}
                onMouseLeave={e => e.currentTarget.style.color = c.muted}>
                {link.label}
              </a>
            ))}
          </div>
          <p style={{ fontFamily: S, color: c.ghost, fontSize: 12, margin: 0 }}>© 2026 JobTrack AI</p>
        </div>
      </footer>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   The Verdict dossier — the signature hero artifact.
   ────────────────────────────────────────────────────────────── */
function VerdictDossier({ c, darkMode }) {
  const rows = [
    { kind: 'match',  text: 'Product strategy · roadmapping' },
    { kind: 'match',  text: '7 yrs experience vs. 5+ asked' },
    { kind: 'flag',   text: 'No payments-domain background' },
  ]
  return (
    <div style={{ position: 'relative' }} className="dossier-wrap">
      {/* faint paper shadow behind to lift it off the page */}
      <div style={{ position: 'absolute', inset: '14px -10px -16px 16px', background: c.paperSubtle, borderRadius: 12, zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, background: c.paperRaised, border: `1px solid ${c.hairlineSld}`, borderRadius: 12, padding: '26px 26px 22px', boxShadow: `0 24px 60px ${darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(33,30,24,0.10)'}` }}>

        {/* header line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontFamily: S, fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.muted }}>
            Confidential · Application Review
          </span>
          <span style={{ fontFamily: F, fontSize: 13, color: c.ghost }}>№ 4417</span>
        </div>

        {/* role */}
        <div style={{ fontFamily: F, fontSize: 24, fontWeight: 400, letterSpacing: '-0.3px', lineHeight: 1.15, marginBottom: 4 }}>
          Senior Product Manager
        </div>
        <div style={{ fontFamily: S, fontSize: 13, color: c.muted, marginBottom: 20 }}>Fintech · Remote (India)</div>

        <div style={{ height: 1, background: c.hairline, marginBottom: 20 }} />

        {/* verdict + grade stamp */}
        <div style={{ position: 'relative', minHeight: 92 }}>
          <div style={{ fontFamily: S, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.brass, marginBottom: 8 }}>
            The verdict
          </div>
          <div style={{ fontFamily: F, fontStyle: 'italic', fontSize: 20, lineHeight: 1.3, color: c.ink, maxWidth: 188, paddingRight: 8 }}>
            Worth your evening — with two caveats.
          </div>

          {/* the stamp */}
          <div style={{
            position: 'absolute', top: -6, right: -2, width: 92, height: 92, borderRadius: '50%',
            border: `2.5px solid ${c.claret}`, color: c.claret,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(-12deg)', animation: 'stampIn 0.7s cubic-bezier(0.2,0.8,0.2,1) 0.45s both',
            boxShadow: `inset 0 0 0 1px ${darkMode ? 'rgba(201,123,92,0.3)' : 'rgba(122,46,46,0.25)'}`,
          }}>
            <div style={{ fontFamily: F, fontWeight: 500, fontSize: 38, lineHeight: 1 }}>B+</div>
            <div style={{ fontFamily: S, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2 }}>Strong fit</div>
          </div>
        </div>

        <div style={{ height: 1, background: c.hairline, margin: '18px 0' }} />

        {/* signal rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: `inkRise 0.5s ease ${0.7 + i * 0.12}s both` }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: r.kind === 'match' ? c.matchBg : c.flagBg,
                color: r.kind === 'match' ? c.success : c.claret, fontSize: 11, fontWeight: 700,
              }}>{r.kind === 'match' ? '✓' : '!'}</span>
              <span style={{ fontFamily: S, fontSize: 13.5, color: c.inkSoft }}>{r.text}</span>
            </div>
          ))}
        </div>

        {/* footer line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 14, borderTop: `1px solid ${c.hairline}` }}>
          <span style={{ fontFamily: S, fontSize: 12, color: c.muted }}>Salary read · ₹38–46 LPA</span>
          <span style={{ fontFamily: S, fontSize: 11, color: c.ghost, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Graded in 9s · 1 credit</span>
        </div>
      </div>
    </div>
  )
}
