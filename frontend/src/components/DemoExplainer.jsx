import { useState, useEffect } from 'react'

/*
 * Animated, auto-looping product walkthrough (illustrative — synthetic data, no login).
 * A stand-in for the real demo video. Theme-aware via CSS variables (index.css).
 * Persona: Ananya Iyer, Senior PM (fintech) — matches the hero sample. No real user data.
 */

function Ic({ n, s = 16 }) {
  const p = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    check: <path d="M5 12l5 5L20 6" />,
    file: <><path d="M14 3v5h5" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /></>,
    flag: <path d="M5 21V4h11l-2 4 2 4H5" />,
    download: <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 20h14" />,
    arrow: <path d="M5 12h13m0 0l-5-5m5 5l-5 5" />,
    pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></>,
    coin: <><circle cx="12" cy="12" r="8.5" /><path d="M10 9.5h3a1.7 1.7 0 0 1 0 3.4h-3m0 0h3.3" /></>,
    chat: <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />,
  }
  return <svg {...p}>{paths[n]}</svg>
}

const CAPS = [
  'Step 1 — Upload your CV. Parsed free.',
  'Step 2 — Paste any job description.',
  'The verdict — grade, salary, skills, red flags.',
  'Tailor your CV for that exact role.',
  'Then prep the interview.',
  '3 free credits, no card. Judge it yourself.',
]
const DUR = 2900

const CSS = `
.de-p{position:absolute;inset:0;opacity:0;transform:translateY(10px);transition:opacity .55s ease,transform .55s ease;pointer-events:none;padding:22px 24px;}
.de-p.on{opacity:1;transform:none;pointer-events:auto;}
.de-chip{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;padding:5px 10px;border-radius:6px;font-weight:500;}
.de-dot{width:8px;height:8px;border-radius:50%;background:var(--border);cursor:pointer;border:none;padding:0;transition:background .3s,width .3s;}
.de-dot.on{background:var(--blue-accent);width:22px;border-radius:5px;}
.de-fr{font-family:'Fraunces',Georgia,serif;font-weight:500;}
@keyframes deProg{from{width:0}to{width:100%}}
@media (prefers-reduced-motion:reduce){.de-p{transition:opacity .2s}}
`

const Mark = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="8" width="14" height="10" rx="2" stroke="#F3EDE2" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="#F3EDE2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="3" y1="13" x2="17" y2="13" stroke="#F3EDE2" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="14.5" cy="16.5" r="2.2" stroke="#F3EDE2" strokeWidth="1.3" />
    <path d="M16.2 18.2l1.3 1.3" stroke="#F3EDE2" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const matchChip = { background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--brass)' }
const neutChip = { background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }

export default function DemoExplainer() {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI(p => (p + 1) % CAPS.length), DUR)
    return () => clearInterval(t)
  }, [i])

  const P = ({ idx, children, center }) => (
    <div className={'de-p' + (i === idx ? ' on' : '')}
      style={center ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' } : undefined}>
      {children}
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 14, maxWidth: 680, margin: '0 auto', color: 'var(--text-primary)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

        {/* App top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'var(--navy-900)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--blue-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mark s={16} /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F3EDE2' }}>JobTrack<span style={{ color: 'var(--brass-soft)' }}> AI</span></div>
              <div style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(243,237,226,0.55)', fontWeight: 600 }}>YOUR AI CAREER COPILOT</div>
            </div>
          </div>
          <div className="de-chip" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--brass-soft)' }}><Ic n="coin" />3 credits</div>
        </div>

        {/* Stage */}
        <div style={{ position: 'relative', height: 336, background: 'var(--bg)' }}>

          {/* 0 — Upload CV */}
          <P idx={0}>
            <div className="de-fr" style={{ fontSize: 19, marginBottom: 4 }}>My Profile</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Upload your CV — we read it in seconds.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px', marginBottom: 14 }}>
              <span style={{ color: 'var(--blue-accent)' }}><Ic n="file" s={20} /></span>
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>Ananya_Iyer_CV.pdf</div>
              <span className="de-chip" style={matchChip}><Ic n="check" />Parsed · free</span>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Ananya Iyer</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 11 }}>Senior Product Manager · Fintech · Bengaluru</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Product strategy', 'Roadmapping', 'SQL', 'A/B testing', 'Stakeholder mgmt'].map(t => (
                  <span key={t} className="de-chip" style={neutChip}>{t}</span>
                ))}
              </div>
            </div>
          </P>

          {/* 1 — Paste JD */}
          <P idx={1}>
            <div className="de-fr" style={{ fontSize: 19, marginBottom: 4 }}>Evaluate JD</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Paste any job description you're considering.</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>Senior Product Manager — Payments</div>
                <span className="de-chip" style={{ background: 'var(--blue-pale)', color: 'var(--blue-accent)' }}><Ic n="pin" />Remote · India</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>Own the payments roadmap end-to-end. Drive experiments, partner with risk and compliance, and scale a high-growth fintech product. The ideal candidate wears many hats…</div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--blue-accent)', color: '#F3EDE2', fontSize: 13.5, fontWeight: 600, padding: '10px 16px', borderRadius: 8 }}>Get the verdict <span style={{ opacity: 0.7, fontWeight: 500 }}>· 1 credit</span> <Ic n="arrow" /></div>
          </P>

          {/* 2 — The Verdict */}
          <P idx={2}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 78, height: 78, borderRadius: '50%', background: 'var(--blue-accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#F3EDE2' }}>
                <div className="de-fr" style={{ fontSize: 30, lineHeight: 1 }}>B+</div>
                <div style={{ fontSize: 8.5, letterSpacing: '0.12em', marginTop: 2, opacity: 0.85 }}>THE VERDICT</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Salary read, at your level</div>
                <div className="de-fr" style={{ fontSize: 20, marginBottom: 8 }}>₹38–46 LPA</div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>You match</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {['Product strategy', 'Roadmapping', 'Experimentation'].map(t => (
                    <span key={t} className="de-chip" style={matchChip}><Ic n="check" />{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Missing</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.8 }}>Payments domain<br />Risk &amp; compliance exp</div>
              </div>
              <div style={{ background: 'var(--blue-pale)', border: '1px solid rgba(122,46,46,0.22)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--blue-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}><Ic n="flag" /> Red flags</div>
                <div style={{ fontSize: 12.5, color: 'var(--blue-accent)', lineHeight: 1.8 }}>"Wears many hats" — scope unclear<br />No salary band listed</div>
              </div>
            </div>
          </P>

          {/* 3 — Tailor CV */}
          <P idx={3}>
            <div className="de-fr" style={{ fontSize: 19, marginBottom: 4 }}>Tailor CV</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Rewritten for this exact role — ready to send.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 13 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Before</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>Led product initiatives across teams and improved key metrics.</div>
              </div>
              <span style={{ color: 'var(--brass)' }}><Ic n="arrow" s={20} /></span>
              <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--blue-accent)', borderRadius: 8, padding: 13 }}>
                <div style={{ fontSize: 11, color: 'var(--blue-accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tailored for payments</div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>Scaled a payments funnel 0→1, running 40+ experiments with risk &amp; compliance.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px', marginTop: 16 }}>
              <span style={{ color: 'var(--blue-accent)' }}><Ic n="file" s={20} /></span>
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>Ananya_Iyer_SeniorPM_Payments.docx</div>
              <span className="de-chip" style={{ background: 'var(--blue-accent)', color: '#F3EDE2' }}><Ic n="download" />Download</span>
            </div>
          </P>

          {/* 4 — Interview Prep */}
          <P idx={4}>
            <div className="de-fr" style={{ fontSize: 19, marginBottom: 4 }}>Interview Prep</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Likely questions, with a STAR structure.</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 13, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--blue-accent)', marginTop: 1 }}><Ic n="chat" s={18} /></span>
                <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5 }}>"Tell me about a product you scaled in a regulated market."</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['Situation', 'Payments app, RBI-regulated.'], ['Task', 'Lift activation, stay compliant.'], ['Action', 'Ran 40+ experiments with risk.'], ['Result', '+32% activation, zero breaches.']].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 11px' }}>
                  <span style={{ color: 'var(--brass)', fontWeight: 600, fontSize: 12 }}>{k}</span>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </P>

          {/* 5 — CTA */}
          <P idx={5} center>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--blue-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Mark s={24} /></div>
            <div className="de-fr" style={{ fontSize: 24, marginBottom: 8 }}>Don't send that CV yet.</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, marginBottom: 18, lineHeight: 1.55 }}>Get the verdict first. 3 free credits on signup, no card — judge it yourself.</div>
            <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--blue-accent)', color: '#F3EDE2', fontSize: 14, fontWeight: 600, padding: '11px 20px', borderRadius: 9 }}>Try JobTrack AI <Ic n="arrow" /></a>
          </P>

        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--border)' }}>
          <div key={i} style={{ height: '100%', background: 'var(--brass)', width: 0, animation: `deProg ${DUR}ms linear forwards` }} />
        </div>
      </div>

      {/* Caption + dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 6px 4px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{CAPS[i]}</div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {CAPS.map((_, n) => (
            <button key={n} className={'de-dot' + (i === n ? ' on' : '')} aria-label={`Go to step ${n + 1}`} onClick={() => setI(n)} />
          ))}
        </div>
      </div>
    </div>
  )
}
