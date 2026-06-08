import { useState, useEffect } from 'react'
import { Cpu, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Star, BookmarkPlus, ChevronDown, ChevronUp, Zap, Lock, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { getSessionId } from '../lib/session'

const GRADE_CONFIG = {
  A: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', label: 'Excellent fit' },
  B: { color: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200',  label: 'Good fit' },
  C: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Partial fit' },
  D: { color: 'text-orange-700',bg: 'bg-orange-50',border: 'border-orange-200',label: 'Poor fit' },
  F: { color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   label: 'Not suitable' },
}

const ACTION_CONFIG = {
  apply_now:            { color: 'badge-green', label: 'Apply now' },
  apply_with_tailoring: { color: 'badge-blue',  label: 'Apply with tailored CV' },
  skip:                 { color: 'badge-red',   label: 'Skip this role' },
  needs_more_info:      { color: 'badge-amber', label: 'Get more info first' },
}

function formatSalary(n) {
  if (!n) return '—'
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`
  return `₹${(n/1000).toFixed(0)}K`
}

function UsageBar({ used, limit }) {
  const remaining = Math.max(0, limit - used)
  const pct = Math.min(100, (used / limit) * 100)
  const color = remaining === 0 ? 'bg-red-500' : remaining === 1 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium ${remaining === 0 ? 'text-red-600' : 'text-gray-500'}`}>
        {remaining} / {limit} left
      </span>
    </div>
  )
}

export default function JDEvaluator({ profile, savedResult, savedJdText, onResultChange, onJdTextChange }) {
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [limitHit, setLimitHit] = useState(false)
  const [usage, setUsage]       = useState(null)
  const [expanded, setExpanded] = useState({ match: true, gaps: true, flags: false, salary: false })

  // Use lifted state from parent
  const result  = savedResult
  const jdText  = savedJdText

  useEffect(() => {
    loadUsage()
  }, [])

  async function loadUsage() {
    try {
      const { data } = await api.get(`/api/evaluate/usage/${getSessionId()}`)
      setUsage(data)
      if (data.evaluations_remaining <= 0) setLimitHit(true)
    } catch { }
  }

  function toggle(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleNewEvaluation() {
    onResultChange(null)
    onJdTextChange('')
    setError(null)
  }

  async function handleEvaluate() {
    if (!jdText.trim() || jdText.length < 50) {
      setError('Paste a complete job description first.')
      return
    }
    setLoading(true)
    setError(null)
    onResultChange(null)
    setLimitHit(false)
    try {
      const { data } = await api.post('/api/evaluate/evaluate-jd', {
        jd_text: jdText,
        session_id: getSessionId(),
        cv_skills: profile?.skills || [],
        cv_title: profile?.title || '',
        cv_years_exp: profile?.years_exp || '',
      })
      onResultChange(data)
      if (data._usage) setUsage(data._usage)
      if (data._usage?.evaluations_remaining <= 0) setLimitHit(true)
    } catch (e) {
      if (e.response?.status === 429) {
        setLimitHit(true)
        setUsage(prev => prev ? { ...prev, evaluations_remaining: 0 } : null)
      } else {
        setError(e.response?.data?.detail || 'Evaluation failed. Make sure your backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const grade = result?.grade
  const gradeConfig = grade ? GRADE_CONFIG[grade] : null
  const actionConfig = result?.recommended_action ? ACTION_CONFIG[result.recommended_action] : null

  return (
    <div>
      {/* Usage indicator */}
      {usage && (
        <div className={`card ${usage.evaluations_remaining <= 1 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={13} className={usage.evaluations_remaining <= 1 ? 'text-amber-600' : 'text-gray-400'} />
              <span className="text-xs font-medium text-gray-600">Free tier — JD evaluations</span>
            </div>
            {usage.evaluations_remaining <= 1 && (
              <span className="badge-amber text-xs">
                {usage.evaluations_remaining === 0 ? 'Limit reached' : '1 evaluation left'}
              </span>
            )}
          </div>
          <UsageBar used={usage.evaluations_used} limit={usage.evaluations_limit} />
        </div>
      )}

      {/* Limit hit wall */}
      {limitHit && (
        <div className="card border-2 border-gray-900 text-center py-8 mt-4">
          <Lock size={28} className="mx-auto mb-3 text-gray-400" />
          <div className="font-medium text-gray-900 mb-1">You've used your 3 free evaluations</div>
          <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
            Upgrade to Pro for unlimited JD evaluations, CV tailoring per role, and STAR interview prep stories.
          </p>
          <div className="inline-flex flex-col items-center gap-2">
            <div className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
              Pro — ₹499/month <span className="text-gray-400 text-xs ml-1">(coming soon)</span>
            </div>
            <p className="text-xs text-gray-400">Payments launching soon · Join the waitlist</p>
          </div>
        </div>
      )}

      {!limitHit && !result && (
        <div className="card mt-4">
          <div className="section-label">Paste job description</div>
          {!profile && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg mb-3 text-xs text-amber-700">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              Upload your CV first on "My profile" for a personalised evaluation.
            </div>
          )}
          {profile && (
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-100 rounded-lg mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-medium flex-shrink-0">
                {profile.initials || '?'}
              </div>
              <span className="text-xs text-gray-600">Evaluating as <strong>{profile.name}</strong> — {profile.title}</span>
            </div>
          )}
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-900 resize-y min-h-48 focus:outline-none focus:border-gray-400 leading-relaxed"
            placeholder="Paste the full job description here. Claude will evaluate the role, score your fit, flag red flags, and estimate salary..."
            value={jdText}
            onChange={e => onJdTextChange(e.target.value)}
          />
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-start gap-2">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}
          <button
            className="btn-primary w-full justify-center mt-3"
            onClick={handleEvaluate}
            disabled={loading || !jdText.trim()}
          >
            {loading
              ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Evaluating with AI...</>
              : <><Cpu size={15} />Evaluate this job</>
            }
          </button>
        </div>
      )}

      {result && gradeConfig && (
        <div className="space-y-3 mt-4">
          {/* Header with profile context + new evaluation button */}
          <div className="flex items-center justify-between">
            {profile && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-medium">
                  {profile.initials || '?'}
                </div>
                <span className="text-xs text-gray-500">Evaluated as <strong>{profile.name}</strong></span>
              </div>
            )}
            {!limitHit && (
              <button onClick={handleNewEvaluation} className="btn-ghost text-xs py-1.5 ml-auto">
                <RefreshCw size={12} />Evaluate another JD
              </button>
            )}
          </div>

          {/* Grade + Action */}
          <div className={`card border ${gradeConfig.border} ${gradeConfig.bg}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${gradeConfig.color}`}>{grade}</div>
                <div>
                  <div className={`font-medium text-sm ${gradeConfig.color}`}>{gradeConfig.label}</div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-lg">{result.grade_reasoning}</p>
                </div>
              </div>
              {actionConfig && (
                <span className={`${actionConfig.color} flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium`}>
                  {actionConfig.label}
                </span>
              )}
            </div>
            {result.recommended_action_reason && (
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">{result.recommended_action_reason}</p>
            )}
          </div>

          {/* Role summary */}
          <div className="card">
            <div className="section-label">Role summary</div>
            <p className="text-sm text-gray-700 leading-relaxed">{result.role_summary}</p>
            {result.company_signals && (
              <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100 leading-relaxed">{result.company_signals}</p>
            )}
          </div>

          {/* CV Match */}
          <div className="card">
            <button className="flex items-center justify-between w-full" onClick={() => toggle('match')}>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-green-600" />
                <span className="section-label mb-0">CV match — {result.cv_match?.matched_skills?.length || 0} skills aligned</span>
              </div>
              {expanded.match ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>
            {expanded.match && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-3">{result.cv_match?.match_summary}</p>
                <div className="flex flex-wrap gap-1">
                  {result.cv_match?.matched_skills?.map((s, i) => (
                    <span key={i} className="skill-chip-match">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gaps */}
          {result.gaps?.length > 0 && (
            <div className="card">
              <button className="flex items-center justify-between w-full" onClick={() => toggle('gaps')}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-amber-600" />
                  <span className="section-label mb-0">Gaps — {result.gaps.length} area{result.gaps.length !== 1 ? 's' : ''} to address</span>
                </div>
                {expanded.gaps ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {expanded.gaps && (
                <div className="mt-3 space-y-2">
                  {result.gaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${gap.importance === 'critical' ? 'badge-red' : 'badge-amber'}`}>
                        {gap.importance === 'critical' ? 'Critical' : 'Nice to have'}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{gap.skill}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{gap.mitigation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flags */}
          {(result.red_flags?.length > 0 || result.green_flags?.length > 0) && (
            <div className="card">
              <button className="flex items-center justify-between w-full" onClick={() => toggle('flags')}>
                <div className="flex items-center gap-2">
                  <Star size={15} className="text-blue-600" />
                  <span className="section-label mb-0">Signals — {result.red_flags?.length || 0} red · {result.green_flags?.length || 0} green</span>
                </div>
                {expanded.flags ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {expanded.flags && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {result.green_flags?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-green-700 mb-2">Green flags</div>
                      <ul className="space-y-1">
                        {result.green_flags.map((f, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-green-500 mt-0.5">✓</span>{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.red_flags?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-red-700 mb-2">Red flags</div>
                      <ul className="space-y-1">
                        {result.red_flags.map((f, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-red-500 mt-0.5">✗</span>{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Salary */}
          <div className="card">
            <button className="flex items-center justify-between w-full" onClick={() => toggle('salary')}>
              <div className="flex items-center gap-2">
                <DollarSign size={15} className="text-gray-600" />
                <span className="section-label mb-0">
                  Salary — {formatSalary(result.salary_range?.min)} – {formatSalary(result.salary_range?.max)} / year
                </span>
              </div>
              {expanded.salary ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>
            {expanded.salary && (
              <div className="mt-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.salary_range?.confidence === 'high' ? 'badge-green' : result.salary_range?.confidence === 'medium' ? 'badge-amber' : 'badge-red'}`}>
                  {result.salary_range?.confidence || 'low'} confidence
                </span>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">{result.salary_range?.reasoning}</p>
              </div>
            )}
          </div>

          {/* Next step */}
          <div className="card">
            <div className="section-label">Next step</div>
            <p className="text-sm text-gray-600 mb-3">{result.recommended_action_reason}</p>
            {(result.recommended_action === 'apply_now' || result.recommended_action === 'apply_with_tailoring') && (
              <button className="btn-primary text-sm">
                <BookmarkPlus size={14} />Add to tracker
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
