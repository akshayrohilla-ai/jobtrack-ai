import { useEffect } from 'react'
import DemoExplainer from '../components/DemoExplainer'

/*
 * Standalone /demo page (see App.jsx) — hosts the illustrative animated walkthrough.
 * Shareable in directory listings while the real recorded demo is in progress.
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

export default function DemoPage() {
  useEffect(() => {
    const prev = document.title
    document.title = 'JobTrack AI — See it in 30 seconds (demo)'
    return () => { document.title = prev }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Home →</a>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>
        <section style={{ paddingTop: 48, paddingBottom: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brass)', marginBottom: 14 }}>
            How it works
          </div>
          <h1 className="h-page" style={{ fontSize: '2rem', lineHeight: 1.15, marginBottom: 14 }}>
            See it in 30 seconds.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto 28px' }}>
            Upload your CV, paste a job description, and get a verdict — a fit grade, a salary read,
            and the red flags — before you apply. Then tailor your CV and prep the interview.
          </p>
        </section>

        <DemoExplainer />

        <p style={{ fontSize: 12, color: 'var(--text-ghost)', textAlign: 'center', marginTop: 16 }}>
          Illustrative walkthrough with sample data.
        </p>

        <section style={{ textAlign: 'center', padding: '40px 0 64px' }}>
          <a href="/"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--blue-accent)', color: '#F3EDE2', fontSize: 14, fontWeight: 600, padding: '12px 22px', borderRadius: 9 }}>
            Try JobTrack AI free — 3 credits, no card
          </a>
        </section>
      </main>
    </div>
  )
}
