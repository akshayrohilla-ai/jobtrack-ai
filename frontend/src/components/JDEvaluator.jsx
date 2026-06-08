import { useState, useEffect } from 'react'
import { Cpu, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Star, BookmarkPlus, ChevronDown, ChevronUp, Zap, Lock, RefreshCw, Sparkles } from 'lucide-react'
import { api, createApplication } from '../lib/api'
import { getSessionId } from '../lib/session'

const GRADE_CONFIG = {
  A: { color: 'var(--success)',  bg: 'var(--success-bg)', border: '#6EE7B7', label: 'Excellent fit',  glow: 'rgba(5,150,105,0.15)' },
  B: { color: 'var(--blue-accent)', bg: 'var(--blue-pale)', border: '#93C5FD', label: 'Good fit',     glow: 'rgba(27,111,235,0.15)' },
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

function UsageMeter({ used, limit }) {
  const remaining = Math.max(0, limit - used)
  const pct = Math.min(100, (used / limit) * 100)
  const barColor = remaining === 0 ? 'var(--danger)' : remaining === 1 ? 'var(--warning)' : 'var(--blue-accent)'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color: remaining === 0 ? 'var(--danger)' : 'var(--text-muted)', minWidth: '60px', textAlign: 'right' }}>
        {remaining} / {limit} left
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

export default function JDEvaluator({ profile, savedResult, savedJdText, savedRole, savedCompany, onResultChange, onJdTextChange, onRoleChange, onCompanyChange, onTrack }) {
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [limitHit, setLimitHit] = useState(false)
  const [usage, setUsage]       = useState(null)
  const [tracking, setTracking] = useState(false)
  const [tracked, setTracked]   = useState(false)

  useEffect(() => { loadUsage() }, [])

  async function loadUsage() {
    try {
      const { data } = await api.get(`/api/evaluate/usage/${getSessionId()}`)
      setUsage(data)
      if (data.evaluations_remaining <= 0) setLimitHit(true)
    } catch { }
  }

  async function handleEvaluate() {
    if (!savedJdText?.trim() || savedJdText.length < 50) { setError('Paste a complete job description first.'); return }
    setLoading(true); setError(null); onResultChange(null); setLimitHit(false); setTracked(false)
    try {
      const { data } = await api.post('/api/evaluate/evaluate-jd', {
        jd_text: savedJdText, session_id: getSessionId(),
        cv_skills: profile?.skills || [], cv_title: profile?.title || '', cv_years_exp: profile?.years_exp || '',
      })
      onResultChange(data)
      if (data._usage) setUsage(data._usage)
      if (data._usage?.evaluations_remaining <= 0) setLimitHit(true)
    } catch (e) {
      if (e.response?.status === 429) { setLimitHit(true); setUsage(prev => prev ? { ...prev, evaluations_remaining: 0 } : null) }
      else setError(e.response?.data?.detail || 'Evaluation failed. Make sure your backend is running.')
    } finally { setLoading(false) }
  }

  async function handleTrack() {
    setTracking(true)
    try {
      const { data } = await createApplication({
        session_id: getSessionId(),
        job_title: savedRole || savedResult.role_summary?.split('.')[0]?.slice(0, 80) || 'Job from evaluation',
        company: savedCompany || 'From JD evaluation',
        location: profile?.location || '',
        match_score: savedResult.grade === 'A' ? 95 : savedResult.grade === 'B' ? 80 : savedResult.grade === 'C' ? 60 : 40,
        notes: savedResult.recommended_action_reason || ''
      })
      setTracked(true)
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

      {/* Usage meter */}
      {usage && (
        <div className="card" style={{
          ...(usage.evaluations_remaining <= 1 ? { borderColor: 'var(--warning)', background: 'var(--warning-bg)' } : {})
        }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: usage.evaluations_remaining <= 1 ? 'var(--warning)' : 'var(--text-ghost)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Free tier · JD evaluations</span>
            </div>
            {usage.evaluations_remaining <= 1 && (
              <span className="badge-amber">{usage.evaluations_remaining === 0 ? 'Limit reached' : '1 left'}</span>
            )}
          </div>
          <UsageMeter used={usage.evaluations_used} limit={usage.evaluations_limit} />
        </div>
      )}

      {/* Paywall */}
      {limitHit && (
        <div className="card text-center py-10" style={{ border: '2px solid var(--navy-800)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--navy-900)' }}>
            <Lock size={22} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.25rem', color: 'var(--navy-900)' }}>
            You've used your 2 free evaluations
          </h3>
          <p className="text-sm mt-2 mb-6 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
            Upgrade to Pro for unlimited JD evaluations, CV tailoring per role, and STAR interview prep.
          </p>
          <div className="inline-flex flex-col items-center gap-2">
            <div className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, var(--blue-accent), var(--navy-700))' }}>
              Pro — ₹499/month <span style={{ opacity: 0.6, fontWeight: 400 }}>(coming soon)</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>Credit packs · ₹199 = 10 evaluations · launching soon</p>
          </div>
        </div>
      )}

      {/* Input form */}
      {!limitHit && !result && (
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
              <span className="text-xs" style={{ color: '#1D4ED8' }}>
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
            placeholder="Paste the full job description here. Claude will evaluate the role, score your fit across 6 dimensions, flag red flags, and estimate salary..."
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
              ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Evaluating with AI...</>
              : <><Sparkles size={15} />Evaluate this job</>
            }
          </button>
        </div>
      )}

      {/* Results */}
      {result && gc && (
        <>
          {/* Profile + reset */}
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
            {!limitHit && (
              <button onClick={() => { onResultChange(null); onJdTextChange(''); setTracked(false) }}
                className="btn-ghost text-xs py-1.5 ml-auto">
                <RefreshCw size={12} />Evaluate another JD
              </button>
            )}
          </div>

          {/* Grade hero */}
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

          {/* Role summary */}
          <div className="card">
            <span className="section-label">Role summary</span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.role_summary}</p>
            {result.company_signals && (
              <p className="text-xs leading-relaxed mt-3 pt-3" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)' }}>
                {result.company_signals}
              </p>
            )}
          </div>

          {/* CV Match */}
          <Section icon={CheckCircle} iconColor="var(--success)" title={`CV match — ${result.cv_match?.matched_skills?.length || 0} skills aligned`} defaultOpen={true}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{result.cv_match?.match_summary}</p>
            <div className="flex flex-wrap">
              {result.cv_match?.matched_skills?.map((s, i) => <span key={i} className="skill-chip-match">{s}</span>)}
            </div>
          </Section>

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
          <Section icon={DollarSign} iconColor="var(--text-muted)" title={`Salary — ${formatSalary(result.salary_range?.min)} – ${formatSalary(result.salary_range?.max)} / year`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={result.salary_range?.confidence === 'high' ? 'badge-green' : result.salary_range?.confidence === 'medium' ? 'badge-amber' : 'badge-red'}>
                {result.salary_range?.confidence || 'low'} confidence
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{result.salary_range?.reasoning}</p>
          </Section>

          {/* Track CTA */}
          {(result.recommended_action === 'apply_now' || result.recommended_action === 'apply_with_tailoring') && (
            <div className="card" style={{ background: 'var(--navy-900)', border: 'none' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Ready to apply?</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {tracked ? 'Added to your tracker' : 'Save this to your application tracker'}
                  </div>
                </div>
                {tracked ? (
                  <span className="badge-green"><CheckCircle size={12} />Tracked</span>
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
