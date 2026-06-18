import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, CheckCircle, TrendingUp, DollarSign, Star, BookmarkPlus, ChevronDown, ChevronUp, Zap, Lock, RefreshCw, Sparkles, Download } from 'lucide-react'
import { createApplication } from '../lib/api'
import { getAuthHeader } from '../lib/supabase'
import { parsePartialJSON } from '../lib/partialJson'
import { useAuth } from '../App'

const GRADE_CONFIG = {
  A: { color: 'var(--success)',  bg: 'var(--success-bg)', border: '#6EE7B7', label: 'Excellent fit',  glow: 'rgba(5,150,105,0.15)' },
  B: { color: 'var(--blue-accent)', bg: 'var(--blue-pale)', border: '#D8B7A8', label: 'Good fit',     glow: 'rgba(122,46,46,0.15)' },
  C: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: '#FCD34D', label: 'Partial fit',    glow: 'rgba(217,119,6,0.15)' },
  D: { color: '#EA580C',        bg: '#FFF7ED',           border: '#FDBA74', label: 'Poor fit',       glow: 'rgba(234,88,12,0.1)' },
  F: { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: '#FCA5A5', label: 'Not suitable',   glow: 'rgba(220,38,38,0.1)' },
}

const ACTION_CONFIG = {
  apply_now:            { badge: 'badge-green', label: '✓ Apply now' },
  apply_with_tailoring: { badge: 'badge-blue',  label: '↑ Apply with tailored CV' },
  skip:                 { badge: 'badge-red',   label: '✗ Skip this role' },
  needs_more_info:      { badge: 'badge-amber', label: '? Get more info first' },
}

function formatSalary(n) {
  if (!n) return '—'
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
  return `₹${(n/1000).toFixed(0)}K`
}

function CreditMeter({ balance }) {
  const limit = 2
  const pct = Math.min(100, (balance / limit) * 100)
  const barColor = balance === 0 ? 'var(--danger)' : balance === 1 ? 'var(--warning)' : 'var(--blue-accent)'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="text-xs font-medium tabular-nums"
        style={{ color: balance === 0 ? 'var(--danger)' : 'var(--text-muted)', minWidth: '60px', textAlign: 'right' }}>
        {balance} credit{balance !== 1 ? 's' : ''} left
      </span>
    </div>
  )
}

function Section({ icon: Icon, iconColor, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card" style={{ marginBottom: '8px' }}>
      <button className="flex items-center justify-between w-full" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: iconColor + '18', border: `1px solid ${iconColor}25` }}>
            <Icon size={13} style={{ color: iconColor }} />
          </div>
          <span className="section-label mb-0">{title}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: 'var(--text-ghost)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-ghost)' }} />}
      </button>
      {open && <div className="mt-4" style={{ paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>{children}</div>}
    </div>
  )
}

// --- PDF Export ---
function exportEvaluationToPDF(result, profile, role, company) {
  const title = role || result.role_summary?.split('.')[0]?.slice(0, 60) || 'Job Evaluation'
  const companyName = company || 'Unknown Company'
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const gc = GRADE_CONFIG[result.grade] || {}

  const gradeColors = { A: '#2F6B4F', B: '#7A2E2E', C: '#9A6B1F', D: '#B5562A', F: '#B23A2A' }
  const gradeColor = gradeColors[result.grade] || '#666'

  const gapsHtml = (result.gaps || []).map(g => `
    <div style="margin-bottom:8px;padding:10px 12px;border-radius:6px;background:#f8f9fa;border-left:3px solid ${g.importance === 'critical' ? '#DC2626' : '#D97706'}">
      <div style="font-weight:600;font-size:13px;color:#1a1a2e">${g.skill} <span style="font-size:11px;font-weight:400;color:${g.importance === 'critical' ? '#DC2626' : '#D97706'}">(${g.importance})</span></div>
      <div style="font-size:12px;color:#666;margin-top:3px">${g.mitigation}</div>
    </div>`).join('')

  const redFlagsHtml = (result.red_flags || []).map(f =>
    `<li style="margin-bottom:4px;color:#DC2626">✗ ${f}</li>`).join('')

  const greenFlagsHtml = (result.green_flags || []).map(f =>
    `<li style="margin-bottom:4px;color:#059669">✓ ${f}</li>`).join('')

  const skillsHtml = (result.cv_match?.matched_skills || []).map(s =>
    `<span style="display:inline-block;background:#F2E6E2;color:#7A2E2E;border-radius:4px;padding:2px 8px;font-size:11px;margin:2px">${s}</span>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>JD Evaluation — ${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: white; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #7A2E2E; padding-bottom: 20px; margin-bottom: 28px; }
    .brand { font-size: 13px; color: #7A2E2E; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
    .job-title { font-size: 22px; font-weight: 700; color: #211E18; }
    .company { font-size: 14px; color: #666; margin-top: 4px; }
    .meta { font-size: 12px; color: #999; margin-top: 4px; }
    .grade-box { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 10px; background: #f8f9fa; border: 1px solid #e5e7eb; margin-bottom: 20px; }
    .grade-letter { font-size: 52px; font-weight: 700; line-height: 1; color: ${gradeColor}; }
    .grade-label { font-size: 18px; font-weight: 600; color: ${gradeColor}; }
    .grade-reasoning { font-size: 13px; color: #444; margin-top: 6px; line-height: 1.6; }
    .next-step { font-size: 12px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 10px; }
    .text-body { font-size: 13px; color: #444; line-height: 1.6; }
    .salary-box { background: #f8f9fa; border-radius: 8px; padding: 14px; }
    .salary-amount { font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    ul { list-style: none; padding: 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #bbb; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">JobTrack AI — JD Evaluation Report</div>
    <div class="job-title">${title}</div>
    <div class="company">${companyName}</div>
    <div class="meta">Evaluated on ${date}${profile?.name ? ` · ${profile.name}` : ''}</div>
  </div>

  <div class="grade-box">
    <div class="grade-letter">${result.grade}</div>
    <div>
      <div class="grade-label">${gc.label || result.grade}</div>
      <div class="grade-reasoning">${result.grade_reasoning || ''}</div>
      ${result.recommended_action_reason ? `<div class="next-step"><strong>Next step:</strong> ${result.recommended_action_reason}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Role Summary</div>
    <div class="text-body">${result.role_summary || ''}</div>
    ${result.company_signals ? `<div class="text-body" style="margin-top:8px;color:#888">${result.company_signals}</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">CV Match — ${result.cv_match?.matched_skills?.length || 0} skills aligned</div>
    <div class="text-body" style="margin-bottom:8px">${result.cv_match?.match_summary || ''}</div>
    <div>${skillsHtml}</div>
  </div>

  ${result.gaps?.length > 0 ? `
  <div class="section">
    <div class="section-title">Gaps — ${result.gaps.length} area${result.gaps.length !== 1 ? 's' : ''} to address</div>
    ${gapsHtml}
  </div>` : ''}

  <div class="two-col">
    ${(result.green_flags?.length > 0 || result.red_flags?.length > 0) ? `
    <div class="section">
      <div class="section-title">Signals</div>
      ${result.green_flags?.length > 0 ? `<ul style="margin-bottom:8px">${greenFlagsHtml}</ul>` : ''}
      ${result.red_flags?.length > 0 ? `<ul>${redFlagsHtml}</ul>` : ''}
    </div>` : '<div></div>'}
    <div class="section">
      <div class="section-title">Salary Estimate</div>
      <div class="salary-box">
        <div class="salary-amount">${formatSalary(result.salary_range?.min)} – ${formatSalary(result.salary_range?.max)} / yr</div>
        <div style="font-size:11px;color:#999;margin-top:4px">${result.salary_range?.confidence || 'low'} confidence</div>
        <div style="font-size:12px;color:#666;margin-top:6px">${result.salary_range?.reasoning || ''}</div>
      </div>
    </div>
  </div>

  <div class="footer">Generated by JobTrack AI · jobtrack-ai-six.vercel.app</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const filename = `jobtrack-evaluation-${(role || companyName).toLowerCase().replace(/\s+/g, '-').slice(0, 30)}-${new Date().toISOString().split('T')[0]}.html`
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function JDEvaluator({ profile, savedResult, savedJdText, savedRole, savedCompany, onResultChange, onJdTextChange, onRoleChange, onCompanyChange, onTrack, applications = [] }) {
  const { user, creditBalance, setCreditBalance, setShowAuthModal } = useAuth()

  const [loading, setLoading]   = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const [error, setError]       = useState(null)
  const [tracking, setTracking] = useState(false)
  const [tracked, setTracked]   = useState(false)

  const outOfCredits = user && creditBalance !== null && creditBalance <= 0

  const derivedTitle = savedRole || savedResult?.role_summary?.split('.')[0]?.slice(0, 80) || ''

  // Duplicate detection using localStorage fingerprint per user
  // Stores first 150 chars of JD text (normalised) so same JD is never double-tracked
  const jdFingerprint = savedJdText?.slice(0, 150).toLowerCase().replace(/\s+/g, ' ').trim() || ''

  function getTrackedSet() {
    if (!user?.id) return new Set()
    try {
      const raw = localStorage.getItem(`jobtrack_tracked_${user.id}`)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  }

  function addToTrackedSet(fp) {
    if (!user?.id || !fp) return
    try {
      const s = getTrackedSet(); s.add(fp)
      localStorage.setItem(`jobtrack_tracked_${user.id}`, JSON.stringify([...s]))
    } catch {}
  }

  const isDuplicate = !tracked && jdFingerprint.length > 50 && getTrackedSet().has(jdFingerprint)

  async function handleEvaluate() {
    if (!user) { setShowAuthModal(true); return }
    if (creditBalance !== null && creditBalance <= 0) return
    if (!savedJdText?.trim() || savedJdText.length < 50) { setError('Paste a complete job description first.'); return }

    setLoading(true); setStreaming(false); setJustCompleted(false); setError(null); onResultChange(null)

    try {
      const headers = await getAuthHeader()
      const API_URL = import.meta.env.VITE_API_URL

      const res = await fetch(`${API_URL}/api/evaluate/evaluate-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          jd_text: savedJdText,
          cv_skills: profile?.skills || [],
          cv_title: profile?.title || '',
          cv_years_exp: profile?.years_exp || '',
        })
      })

      // Errors are returned BEFORE the stream starts, so status is available immediately.
      if (res.status === 401) { setShowAuthModal(true); setError('Session expired. Please sign in again.'); return }
      if (res.status === 402) { setCreditBalance(0); return }
      if (!res.ok) { let d = 'Evaluation failed'; try { d = (await res.json()).detail } catch {} ; throw new Error(d) }

      // Consume the SSE stream: `delta` = progress, `done` = full result, `error` = failure.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let acc = ''            // accumulated model text, parsed progressively
      let finished = false
      while (!finished) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        let sep
        while ((sep = buf.indexOf('\n\n')) !== -1) {
          const frame = buf.slice(0, sep); buf = buf.slice(sep + 2)
          let ev = 'message', dataStr = ''
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) ev = line.slice(6).trim()
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim()
          }
          if (ev === 'delta') {
            setStreaming(true)   // first token arrived — show live progress
            try { acc += JSON.parse(dataStr).t || '' } catch {}
            const partial = parsePartialJSON(acc)
            if (partial) onResultChange(partial)   // render sections as they complete
          } else if (ev === 'done') {
            const data = JSON.parse(dataStr)
            onResultChange(data)                    // authoritative complete result
            if (data._credits?.balance !== undefined) setCreditBalance(data._credits.balance)
            setJustCompleted(true)                  // show the "ready" banner
            finished = true
          } else if (ev === 'error') {
            let d = 'Evaluation failed'; try { d = JSON.parse(dataStr).detail } catch {}
            throw new Error(d)
          }
        }
      }

    } catch (e) {
      onResultChange(null)   // discard any partial render so the form + error show
      setError(e.message || 'Evaluation failed. Make sure your backend is running.')
    } finally { setLoading(false); setStreaming(false) }
  }

  async function handleTrack() {
    setTracking(true)
    try {
      const { data } = await createApplication({
        job_title: derivedTitle || 'Job from evaluation',
        company: savedCompany || 'From JD evaluation',
        location: profile?.location || '',
        match_score: savedResult.grade === 'A' ? 95 : savedResult.grade === 'B' ? 80 : savedResult.grade === 'C' ? 60 : 40,
        notes: savedJdText?.slice(0, 100) || savedResult.recommended_action_reason || ''
      })
      setTracked(true)
      addToTrackedSet(jdFingerprint)
      if (onTrack) onTrack(data)
    } catch { }
    setTracking(false)
  }

  const result = savedResult
  const grade = result?.grade
  const gc = grade ? GRADE_CONFIG[grade] : null
  const ac = result?.recommended_action ? ACTION_CONFIG[result.recommended_action] : null

  return (
    <div className="animate-slide-up space-y-3">

      {/* Credit meter */}
      {user && creditBalance !== null && (
        <div className="card" style={{
          ...(creditBalance <= 1 ? { borderColor: 'var(--warning)', background: 'var(--warning-bg)' } : {})
        }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: creditBalance <= 1 ? 'var(--warning)' : 'var(--text-ghost)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>JD evaluations</span>
            </div>
            {creditBalance <= 1 && (
              <span className="badge-amber">{creditBalance === 0 ? 'No credits' : '1 left'}</span>
            )}
          </div>
          <CreditMeter balance={creditBalance} />
        </div>
      )}

      {/* Not signed in */}
      {!user && !result && (
        <div className="card text-center py-8" style={{ border: '1px dashed var(--border)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'var(--navy-900)' }}>
            <Lock size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Sign in to evaluate jobs</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Free account · 2 evaluations included</p>
          <button onClick={() => setShowAuthModal(true)}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--blue-accent)' }}>
            Sign in / Sign up
          </button>
        </div>
      )}

      {/* Out of credits */}
      {outOfCredits && (
        <div className="card text-center py-10" style={{ border: '2px solid var(--navy-800)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--navy-900)' }}>
            <Lock size={22} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', color: 'var(--navy-900)' }}>
            You've used all your credits
          </h3>
          <p className="text-sm mt-2 mb-6 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
            Top up to keep evaluating jobs and tailoring your CV.
          </p>
          <div className="inline-flex flex-col items-center gap-2">
            <div className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--blue-accent)' }}>
              ₹199 = 10 credits &nbsp;·&nbsp; ₹499 = 30 credits
              <span style={{ opacity: 0.6, fontWeight: 400 }}> (coming soon)</span>
            </div>
          </div>
        </div>
      )}

      {/* Input form */}
      {user && !outOfCredits && !result && (
        <div className="card">
          {!profile && (
            <div className="flex items-start gap-2 p-3 rounded-lg mb-4 text-xs"
              style={{ background: 'var(--warning-bg)', border: '1px solid #FCD34D', color: 'var(--warning)' }}>
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              Upload your CV on "My profile" first for a personalised evaluation.
            </div>
          )}
          {profile && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg mb-4"
              style={{ background: 'var(--blue-pale)', border: '1px solid #BFDBFE' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{ background: 'var(--blue-accent)' }}>
                {profile.initials || profile.name?.split(' ').map(w=>w[0]).join('').slice(0,2) || '?'}
              </div>
              <span className="text-xs" style={{ color: 'var(--blue-accent)' }}>
                Evaluating as <strong>{profile.name}</strong> · {profile.title}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="section-label">Role title <span style={{ color: 'var(--text-ghost)', textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
              <input className="input-field" placeholder="e.g. Senior Business Analyst"
                value={savedRole || ''} onChange={e => onRoleChange(e.target.value)} />
            </div>
            <div>
              <label className="section-label">Company <span style={{ color: 'var(--text-ghost)', textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
              <input className="input-field" placeholder="e.g. Accenture"
                value={savedCompany || ''} onChange={e => onCompanyChange(e.target.value)} />
            </div>
          </div>

          <label className="section-label">Job description</label>
          <textarea className="textarea-field"
            placeholder="Paste the full job description here..."
            value={savedJdText || ''} onChange={e => onJdTextChange(e.target.value)} />

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg mt-3 text-xs"
              style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', color: 'var(--danger)' }}>
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <button className="btn-primary w-full justify-center mt-4" onClick={handleEvaluate}
            disabled={loading || !savedJdText?.trim()}>
            {loading
              ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />{streaming ? 'Analyzing your fit…' : 'Evaluating with AI...'}</>
              : <><Sparkles size={15} />Evaluate this job</>
            }
          </button>
        </div>
      )}

      {/* Results — renders progressively as sections stream in. `gc` may be null
          until the grade arrives, so the grade hero falls back to a skeleton. */}
      {result && (
        <>
          {/* In-progress banner — shown while sections stream in, so the user
              knows it's still working until the green "ready" banner replaces it. */}
          {loading && (
            <div className="card flex items-center gap-2"
              style={{ background: 'var(--blue-pale)', border: '1px solid #BFDBFE' }}>
              <span className="animate-spin w-4 h-4 border-2 rounded-full flex-shrink-0"
                style={{ borderColor: 'var(--blue-accent)', borderTopColor: 'transparent' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--blue-accent)' }}>
                Analyzing your fit… sections appear below as they're ready
              </span>
            </div>
          )}

          {/* Completion banner — clear "done" signal after streaming finishes */}
          {justCompleted && !loading && (
            <div className="card flex items-center gap-2 animate-slide-up"
              style={{ background: 'var(--success-bg)', border: '1px solid #6EE7B7' }}>
              <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                Your JD evaluation is ready
              </span>
            </div>
          )}

          {/* Header row — profile + actions (actions hidden until generation completes) */}
          <div className="flex items-center justify-between">
            {profile && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold text-white"
                  style={{ background: 'var(--blue-accent)' }}>
                  {profile.initials || '?'}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Evaluated as <strong style={{ color: 'var(--text-secondary)' }}>{profile.name}</strong>
                </span>
              </div>
            )}
            {!loading && (
              <div className="flex items-center gap-2 ml-auto">
                {/* PDF Export */}
                <button
                  onClick={() => exportEvaluationToPDF(result, profile, savedRole, savedCompany)}
                  className="btn-secondary text-xs py-1.5">
                  <Download size={12} />Export Report
                </button>
                {!outOfCredits && (
                  <button onClick={() => { onResultChange(null); onJdTextChange(''); setTracked(false); setJustCompleted(false) }}
                    className="btn-ghost text-xs py-1.5">
                    <RefreshCw size={12} />Evaluate another JD
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Grade hero — or skeleton while the grade is still streaming */}
          {gc ? (
            <div className="card animate-grade" style={{
              border: `1px solid ${gc.border}`,
              background: gc.bg,
              boxShadow: `0 0 0 4px ${gc.glow}, 0 2px 8px rgba(0,0,0,0.06)`
            }}>
              <div className="flex items-start gap-5">
                <div className="grade-display animate-grade flex-shrink-0" style={{ color: gc.color }}>
                  {grade}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: gc.color }}>{gc.label}</span>
                    {ac && <span className={ac.badge}>{ac.label}</span>}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {result.grade_reasoning}
                  </p>
                </div>
              </div>
              {result.recommended_action_reason && (
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${gc.border}` }}>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Next step:</strong> {result.recommended_action_reason}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <span className="animate-spin w-4 h-4 border-2 rounded-full"
                  style={{ borderColor: 'var(--blue-accent)', borderTopColor: 'transparent' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Analyzing your fit — building your report…
                </span>
              </div>
            </div>
          )}

          {/* Role summary */}
          {result.role_summary && (
            <div className="card">
              <span className="section-label">Role summary</span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.role_summary}</p>
              {result.company_signals && (
                <p className="text-xs leading-relaxed mt-3 pt-3" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)' }}>
                  {result.company_signals}
                </p>
              )}
            </div>
          )}

          {/* CV Match */}
          {result.cv_match && (
            <Section icon={CheckCircle} iconColor="var(--success)" title={`CV match — ${result.cv_match?.matched_skills?.length || 0} skills aligned`} defaultOpen={true}>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{result.cv_match?.match_summary}</p>
              <div className="flex flex-wrap">
                {result.cv_match?.matched_skills?.map((s, i) => <span key={i} className="skill-chip-match">{s}</span>)}
              </div>
            </Section>
          )}

          {/* Gaps */}
          {result.gaps?.length > 0 && (
            <Section icon={TrendingUp} iconColor="var(--warning)" title={`Gaps — ${result.gaps.length} area${result.gaps.length !== 1 ? 's' : ''} to address`} defaultOpen={true}>
              <div className="space-y-2">
                {result.gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-light)' }}>
                    <span className={gap.importance === 'critical' ? 'badge-red' : 'badge-amber'} style={{ flexShrink: 0 }}>
                      {gap.importance === 'critical' ? 'Critical' : 'Nice to have'}
                    </span>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{gap.skill}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{gap.mitigation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Signals */}
          {(result.red_flags?.length > 0 || result.green_flags?.length > 0) && (
            <Section icon={Star} iconColor="var(--blue-accent)" title={`Signals — ${result.red_flags?.length || 0} red · ${result.green_flags?.length || 0} green`}>
              <div className="grid grid-cols-2 gap-4">
                {result.green_flags?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--success)' }}>Green flags</div>
                    <ul className="space-y-1.5">
                      {result.green_flags.map((f, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--success)', marginTop: '1px' }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.red_flags?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--danger)' }}>Red flags</div>
                    <ul className="space-y-1.5">
                      {result.red_flags.map((f, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--danger)', marginTop: '1px' }}>✗</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Salary */}
          {result.salary_range && (
            <Section icon={DollarSign} iconColor="var(--text-muted)" title={`Salary — ${formatSalary(result.salary_range?.min)} – ${formatSalary(result.salary_range?.max)} / year`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={result.salary_range?.confidence === 'high' ? 'badge-green' : result.salary_range?.confidence === 'medium' ? 'badge-amber' : 'badge-red'}>
                  {result.salary_range?.confidence || 'low'} confidence
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{result.salary_range?.reasoning}</p>
            </Section>
          )}

          {/* Track CTA */}
          {(result.recommended_action === 'apply_now' || result.recommended_action === 'apply_with_tailoring') && (
            <div className="card" style={{ background: 'var(--navy-900)', border: 'none' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Ready to apply?</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {tracked || isDuplicate ? 'Added to your tracker' : 'Save this to your application tracker'}
                  </div>
                </div>
                {tracked || isDuplicate ? (
                  <span className="badge-green"><CheckCircle size={12} />
                    {isDuplicate && !tracked ? 'Already tracked' : 'Tracked'}
                  </span>
                ) : (
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--blue-accent)', color: 'white' }}
                    disabled={tracking} onClick={handleTrack}>
                    {tracking
                      ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      : <BookmarkPlus size={14} />
                    }
                    Add to tracker
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
