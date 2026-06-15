import { useState } from 'react'
import { Cpu, AlertCircle, ArrowRight } from 'lucide-react'
import { analyzeJD } from '../lib/api'

export default function JDAnalyzer({ onAnalyzed }) {
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [result, setResult] = useState(null)

  async function handleAnalyze() {
    if (!jdText.trim() || jdText.length < 50) { setError('Please paste a full job description first.'); return }
    setLoading(true); setError(null)
    try {
      const { data } = await analyzeJD(jdText)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed. Check your backend is running.')
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', color: 'var(--navy-900)' }}>Recruiter mode</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Analyze a job description, then score and rank candidate CVs against it</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <span className="section-label">Paste job description</span>
          <textarea className="textarea-field"
            placeholder="Paste any job description here. AI will extract required skills, seniority, domain, and experience requirements..."
            value={jdText} onChange={e => { setJdText(e.target.value); setResult(null) }} />
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg mt-3 text-xs"
              style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', color: 'var(--danger)' }}>
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}
          <button className="btn-primary w-full justify-center mt-3" onClick={handleAnalyze}
            disabled={loading || !jdText.trim()}>
            {loading
              ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Analyzing with AI...</>
              : <><Cpu size={15} />Analyze JD with AI</>
            }
          </button>
        </div>

        <div className="card">
          <span className="section-label">Extracted requirements</span>
          {!result ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-ghost)' }}>
              Paste a JD and click Analyze. AI will extract skills, seniority, and domain.
            </p>
          ) : (
            <div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>

              <span className="section-label">Required skills</span>
              <div className="mb-3 flex flex-wrap">
                {result.required_skills?.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
              </div>

              {result.nice_to_have?.length > 0 && (
                <>
                  <span className="section-label">Nice to have</span>
                  <div className="mb-3 flex flex-wrap">
                    {result.nice_to_have.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
                  </div>
                </>
              )}

              <div className="flex gap-2 flex-wrap mb-4">
                <span className="badge-blue">{result.seniority}</span>
                <span className="badge-blue">{result.years_exp} yrs exp</span>
                <span className="badge-green">{result.domain}</span>
              </div>

              <button className="btn-primary w-full justify-center" onClick={() => onAnalyzed(result)}>
                Score candidates <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
