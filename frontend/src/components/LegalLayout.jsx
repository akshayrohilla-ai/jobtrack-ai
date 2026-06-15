export default function LegalLayout({ title, lastUpdated, children }) {
  return (
    <div style={{ background: '#14110C', minHeight: '100vh', color: '#EFE8DC', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#7A2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="8" width="14" height="10" rx="2" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="13" x2="17" y2="13" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="14.5" cy="16.5" r="2.2" stroke="white" strokeWidth="1.3"/>
                <path d="M16.2 18.2l1.3 1.3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1 }}>JobTrack <span style={{ color: '#C9A86A' }}>AI</span></div>
              <div style={{ fontSize: 9, color: '#ffffff', letterSpacing: '0.15em', fontWeight: 600, marginTop: 3, lineHeight: 1, opacity: 0.7 }}>YOUR AI CAREER COPILOT</div>
            </div>
          </a>
          <a href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>← Back to home</a>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
          {title}
        </h1>
        {lastUpdated && (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 40 }}>
            Last updated: {lastUpdated}
          </p>
        )}
        <div style={{
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.8,
          fontSize: 15,
        }}
          className="legal-content">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms & Conditions', href: '/terms' },
            { label: 'Refund Policy', href: '/refund' },
            { label: 'Contact', href: '/contact' },
          ].map(link => (
            <a key={link.href} href={link.href}
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textDecoration: 'none' }}>
              {link.label}
            </a>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: 0 }}>
          © 2026 JobTrack AI. All rights reserved.
        </p>
      </footer>

      <style>{`
        .legal-content h2 {
          color: white;
          font-size: 18px;
          font-weight: 700;
          margin-top: 36px;
          margin-bottom: 12px;
        }
        .legal-content h3 {
          color: rgba(255,255,255,0.85);
          font-size: 15px;
          font-weight: 600;
          margin-top: 20px;
          margin-bottom: 8px;
        }
        .legal-content p {
          margin-bottom: 14px;
        }
        .legal-content ul {
          padding-left: 20px;
          margin-bottom: 14px;
        }
        .legal-content li {
          margin-bottom: 6px;
        }
        .legal-content a {
          color: #C9A86A;
          text-decoration: none;
        }
        .legal-content a:hover {
          text-decoration: underline;
        }
        .legal-content strong {
          color: rgba(255,255,255,0.9);
        }
      `}</style>
    </div>
  )
}
