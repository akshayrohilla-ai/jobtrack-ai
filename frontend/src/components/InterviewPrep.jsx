import { useState } from 'react'
import { Sparkles, Lock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Zap, MessageSquare, ShieldAlert, HelpCircle, Download } from 'lucide-react'
import { prepareInterview } from '../lib/api'
import { useAuth } from '../App'

function downloadInterviewPDF(result, profile, role, company) {
  const name = profile?.name || 'Candidate'
  const roleLabel = role || 'this role'
  const companyLabel = company || ''
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const starColor = { situation: '#7C3AED', task: '#1B6FEB', action: '#059669', result: '#D97706' }
  const starLabel = { situation: 'S — Situation', task: 'T — Task', action: 'A — Action', result: 'R — Result' }

  const questionsHtml = (result.behavioral_questions || []).map((q, i) => `
    <div class="question-card">
      <div class="q-header">
        <div class="q-num">${i + 1}</div>
        <div>
          <div class="q-text">${q.question}</div>
          ${q.why_asked ? `<div class="q-probe">Probing for: ${q.why_asked}</div>` : ''}
        </div>
      </div>
      <div class="star-grid">
        ${['situation','task','action','result'].map(k => q.star_answer?.[k] ? `
          <div class="star-block" style="border-left:3px solid ${starColor[k]}">
            <div class="star-label" style="color:${starColor[k]}">${starLabel[k]}</div>
            <div class="star-text">${q.star_answer[k]}</div>
          </div>` : '').join('')}
      </div>
      ${q.key_phrases?.length ? `
        <div class="phrases-label">Mirror these phrases</div>
        <div class="phrases">${q.key_phrases.map(p => `<span class="phrase">"${p}"</span>`).join('')}</div>` : ''}
    </div>`).join('')

  const redFlagsHtml = (result.red_flags || []).map(rf => `
    <div class="flag-card">
      <div class="flag-topic">${rf.topic}</div>
      <div class="flag-q">Likely question: "${rf.likely_question}"</div>
      <div class="flag-frame">${rf.how_to_frame}</div>
    </div>`).join('')

  const questionsToAskHtml = (result.questions_to_ask || []).map(q => `
    <div class="ask-card">
      <div class="ask-q">"${q.question}"</div>
      <div class="ask-why">${q.why_it_works}</div>
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Interview Prep — ${roleLabel}${companyLabel ? ' at ' + companyLabel : ''}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#1a1a2e; background:white; padding:40px; max-width:820px; margin:0 auto; }
    .header { border-bottom:2px solid #1B6FEB; padding-bottom:18px; margin-bottom:24px; }
    .brand { font-size:12px; color:#1B6FEB; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
    .title { font-size:22px; font-weight:700; color:#0A1628; }
    .meta { font-size:12px; color:#999; margin-top:4px; }
    .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#999; margin:28px 0 12px; }
    .question-card { border:1px solid #e5e7eb; border-radius:10px; padding:18px; margin-bottom:14px; }
    .q-header { display:flex; gap:12px; align-items:flex-start; margin-bottom:14px; }
    .q-num { width:24px; height:24px; border-radius:50%; background:#1B6FEB; color:white; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
    .q-text { font-size:14px; font-weight:600; color:#0A1628; line-height:1.5; }
    .q-probe { font-size:12px; color:#999; margin-top:4px; }
    .star-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
    .star-block { padding:10px 12px; border-radius:6px; background:#f9fafb; }
    .star-label { font-size:11px; font-weight:700; margin-bottom:4px; }
    .star-text { font-size:12px; color:#444; line-height:1.6; }
    .phrases-label { font-size:11px; font-weight:600; color:#999; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
    .phrases { display:flex; flex-wrap:wrap; gap:6px; }
    .phrase { background:#EBF2FF; color:#1D4ED8; border-radius:4px; padding:2px 8px; font-size:11px; border:1px solid #BFDBFE; }
    .flag-card { border:1px solid #FCD34D; border-radius:8px; padding:14px; margin-bottom:10px; background:#FFFBEB; }
    .flag-topic { font-size:13px; font-weight:700; color:#92400E; margin-bottom:4px; }
    .flag-q { font-size:12px; color:#B45309; font-style:italic; margin-bottom:6px; }
    .flag-frame { font-size:13px; color:#444; line-height:1.6; }
    .ask-card { border:1px solid #D1FAE5; border-radius:8px; padding:12px; margin-bottom:8px; background:#F0FDF4; }
    .ask-q { font-size:13px; font-weight:600; color:#065F46; margin-bottom:4px; }
    .ask-why { font-size:12px; color:#6B7280; }
    .coming-soon { margin-top:28px; padding:16px 20px; border:1px dashed #C4B5FD; border-radius:10px; background:#F5F3FF; text-align:center; }
    .cs-title { font-size:13px; font-weight:700; color:#7C3AED; margin-bottom:4px; }
    .cs-desc { font-size:12px; color:#8B5CF6; }
    .footer { margin-top:32px; padding-top:14px; border-top:1px solid #e5e7eb; font-size:11px; color:#bbb; text-align:center; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">JobTrack AI — Interview Prep Pack</div>
    <div class="title">${roleLabel}${companyLabel ? ' at ' + companyLabel : ''}</div>
    <div class="meta">Prepared on ${date} · ${name}</div>
  </div>

  <div class="section-title">Behavioural Questions &amp; STAR Answers</div>
  ${questionsHtml}

  <div class="section-title">Weak Spots — Prepare for These</div>
  ${redFlagsHtml}

  <div class="section-title">Questions to Ask the Interviewer</div>
  ${questionsToAskHtml}

  <div class="coming-soon">
    <div class="cs-title">🧠 Mock Interview Mode — Coming Soon</div>
    <div class="cs-desc">Answer questions in text, get AI feedback on your STAR structure, pacing, and delivery.</div>
  </div>

  <div class="footer">Generated by JobTrack AI · jobtrackai.co.in</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/\s+/g, '-')}-interview-prep-${new Date().toISOString().split('T')[0]}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function STARCard({ q, index }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        className="w-full flex items-start justify-between gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
            style={{ background: 'var(--blue-accent)', minWidth: 24 }}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
            {q.why_asked && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-ghost)' }}>
                Probing for: {q.why_asked}
              </p>
            )}
          </div>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: 'var(--text-ghost)', flexShrink: 0, marginTop: 4 }} />
          : <ChevronDown size={14} style={{ color: 'var(--text-ghost)', flexShrink: 0, marginTop: 4 }} />
        }
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '16px' }}>
          {/* STAR answer */}
          <div className="space-y-3 mb-4">
            {[
              { key: 'situation', label: 'S — Situation', color: '#7C3AED' },
              { key: 'task',      label: 'T — Task',      color: '#1B6FEB' },
              { key: 'action',    label: 'A — Action',    color: '#059669' },
              { key: 'result',    label: 'R — Result',    color: '#D97706' },
            ].map(({ key, label, color }) => (
              q.star_answer?.[key] && (
                <div key={key} className="rounded-lg p-3" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                  <div className="text-xs font-bold mb-1" style={{ color, letterSpacing: '0.05em' }}>{label}</div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{q.star_answer[key]}</p>
                </div>
              )
            ))}
          </div>

          {/* Key phrases to mirror */}
          {q.key_phrases?.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Mirror these phrases
              </div>
              <div className="flex flex-wrap gap-1.5">
                {q.key_phrases.map((p, i) => (
                  <span key={i} className="px-2 py-1 rounded text-xs font-medium"
                    style={{ background: 'rgba(27,111,235,0.12)', color: 'var(--blue-accent)', border: '1px solid rgba(27,111,235,0.2)' }}>
                    "{p}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function InterviewPrep({ profile, rawCvText, evalJdText, evalRole, evalCompany, loading, setLoading, result, setResult }) {
  const { user, creditBalance, setCreditBalance, setShowAuthModal } = useAuth()
  const [error, setError] = useState(null)

  const outOfCredits = user && creditBalance !== null && creditBalance <= 0
  const missingCV = !profile || !rawCvText
  const missingJD = !evalJdText || evalJdText.trim().length < 50
  const canRun = !missingCV && !missingJD && !outOfCredits && !loading

  async function handlePrep() {
    if (!user) { setShowAuthModal(true); return }
    if (!canRun) return
    setLoading(true); setError(null); setResult(null)
    try {
      const { data } = await prepareInterview(rawCvText, evalJdText, evalRole, evalCompany)
      setResult(data)
      if (data._credits?.balance !== undefined) setCreditBalance(data._credits.balance)
    } catch (e) {
      const detail = e.response?.data?.detail
      if (e.response?.status === 402) { setCreditBalance(0); return }
      if (e.response?.status === 401) { setShowAuthModal(true); return }
      setError(typeof detail === 'string' ? detail : 'Interview prep failed. Try again.')
    } finally { setLoading(false) }
  }

  if (!user) return (
    <div className="card text-center py-8 animate-slide-up" style={{ border: '1px dashed var(--border)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--navy-900)' }}>
        <Lock size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Sign in to prepare for interviews</h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>1 credit per prep pack</p>
      <button onClick={() => setShowAuthModal(true)}
        className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: 'var(--blue-accent)' }}>
        Sign in / Sign up
      </button>
    </div>
  )

  return (
    <div className="animate-slide-up space-y-3">

      {/* Credit meter */}
      {creditBalance !== null && (
        <div className="card" style={{ ...(creditBalance <= 1 ? { borderColor: 'var(--warning)', background: 'var(--warning-bg)' } : {}) }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: creditBalance <= 1 ? 'var(--warning)' : 'var(--text-ghost)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Interview prep</span>
            </div>
            {creditBalance <= 1 && <span className="badge-amber">{creditBalance === 0 ? 'No credits' : '1 left'}</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (creditBalance / 2) * 100)}%`, background: creditBalance === 0 ? 'var(--danger)' : creditBalance === 1 ? 'var(--warning)' : 'var(--blue-accent)' }} />
            </div>
            <span className="text-xs font-medium tabular-nums" style={{ color: creditBalance === 0 ? 'var(--danger)' : 'var(--text-muted)', minWidth: '60px', textAlign: 'right' }}>
              {creditBalance} credit{creditBalance !== 1 ? 's' : ''} left
            </span>
          </div>
        </div>
      )}

      {/* Setup / action card */}
      {!result && (
        <div className="card">
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', color: 'var(--navy-900)', marginBottom: '4px' }}>
            Interview prep pack
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Personalised to your CV and this specific job description.
          </p>

          {/* Checklist */}
          <div className="space-y-2 mb-5">
            {[
              { label: 'CV parsed', done: !!profile, hint: 'Upload your CV on My profile tab' },
              { label: 'CV text loaded', done: !!rawCvText, hint: 'Re-upload your CV — needed to generate answers' },
              { label: 'JD evaluated', done: !missingJD, hint: 'Evaluate a job description first' },
            ].map(({ label, done, hint }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: done ? 'var(--success-bg)' : 'var(--surface-raised)', border: `1px solid ${done ? '#6EE7B7' : 'var(--border-light)'}` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: done ? 'var(--success)' : 'var(--border)' }}>
                  {done
                    ? <CheckCircle size={12} style={{ color: 'white' }} />
                    : <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-ghost)', display: 'block' }} />
                  }
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: done ? 'var(--success)' : 'var(--text-secondary)' }}>{label}</span>
                  {!done && <span className="text-xs ml-2" style={{ color: 'var(--text-ghost)' }}>— {hint}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* What you'll get */}
          <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-light)' }}>
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What you get for 1 credit</div>
            <div className="space-y-2">
              {[
                ['5 behavioural questions', 'Tailored to this specific JD, not generic questions'],
                ['Full STAR answers', 'Written from your actual CV — ready to practise, not memorise from scratch'],
                ['Red flag coaching', '2-3 weak spots an interviewer will probe + how to frame them honestly'],
                ['5 smart questions to ask', 'Role-specific — makes you stand out from every other candidate'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-2.5">
                  <CheckCircle size={13} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg mb-4 text-xs"
              style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', color: 'var(--danger)' }}>
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <button
            onClick={handlePrep}
            disabled={!canRun}
            className="btn-primary w-full justify-center"
            style={{ opacity: (!missingCV && !missingJD) ? 1 : 0.5 }}>
            {loading
              ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Preparing your interview pack...</>
              : <><Sparkles size={15} />Generate interview prep — 1 credit</>
            }
          </button>
          {(missingCV || missingJD) && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-ghost)' }}>
              Complete the checklist above to continue
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: 'var(--blue-accent)' }}>
                {profile?.initials || '?'}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Interview prep for <strong style={{ color: 'var(--text-secondary)' }}>{evalRole || 'this role'}</strong>
                {evalCompany ? <span> at <strong style={{ color: 'var(--text-secondary)' }}>{evalCompany}</strong></span> : ''}
              </span>
            </div>
            <button
              onClick={() => downloadInterviewPDF(result, profile, evalRole, evalCompany)}
              className="btn-primary text-xs py-2">
              <Download size={13} />Download prep
            </button>
          </div>

          {/* Behavioural questions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} style={{ color: 'var(--blue-accent)' }} />
              <span className="section-label mb-0">Behavioural questions & STAR answers</span>
            </div>
            <div className="space-y-2">
              {result.behavioral_questions?.map((q, i) => (
                <STARCard key={i} q={q} index={i} />
              ))}
            </div>
          </div>

          {/* Red flags */}
          {result.red_flags?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={14} style={{ color: 'var(--warning)' }} />
                <span className="section-label mb-0">Weak spots — prepare for these</span>
              </div>
              <div className="space-y-2">
                {result.red_flags.map((rf, i) => (
                  <div key={i} className="card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }}>
                    <div className="text-sm font-semibold mb-1" style={{ color: 'var(--warning)' }}>{rf.topic}</div>
                    <div className="text-xs mb-2 italic" style={{ color: 'var(--text-ghost)' }}>
                      Likely question: "{rf.likely_question}"
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rf.how_to_frame}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions to ask */}
          {result.questions_to_ask?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle size={14} style={{ color: 'var(--success)' }} />
                <span className="section-label mb-0">Questions to ask the interviewer</span>
              </div>
              <div className="space-y-2">
                {result.questions_to_ask.map((q, i) => (
                  <div key={i} className="card" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>"{q.question}"</p>
                    <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>{q.why_it_works}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming soon: Mock interview */}
          <div className="card" style={{ background: 'var(--navy-900)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">Mock interview mode</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                    Coming soon
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Answer questions out loud (or in text) and get AI feedback on your STAR structure, pacing, and delivery.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
