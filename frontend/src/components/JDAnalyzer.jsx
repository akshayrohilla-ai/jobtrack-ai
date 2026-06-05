import { useState } from 'react'
import { Cpu, AlertCircle } from 'lucide-react'
import { analyzeJD } from '../lib/api'
import { getSessionId } from '../lib/session'

export default function JDAnalyzer({ onAnalyzed }) {
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleAnalyze() {
    if (!jdText.trim() || jdText.length < 50) {
      setError('Please paste a full job description first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await analyzeJD(jdText, getSessionId())
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed. Check your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card">
        <div className="section-label">Paste job description</div>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-900 resize-y min-h-48 focus:outline-none focus:border-gray-400 leading-relaxed"
          placeholder="Paste any job description here. AI will extract required skills, seniority, domain, and experience requirements..."
          value={jdText}
          onChange={e => { setJdText(e.target.value); setResult(null) }}
        />
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
            <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
        <button className="btn-primary w-full justify-center mt-3" onClick={handleAnalyze} disabled={loading || !jdText.trim()}>
          {loading
            ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Analyzing with AI...</>
            : <><Cpu size={15} />Analyze JD with AI</>
          }
        </button>
      </div>

      <div className="card">
        <div className="section-label">Extracted requirements</div>
        {!result ? (
          <p className="text-sm text-gray-400">Paste a JD on the left and click Analyze. AI will extract skills, seniority, and domain.</p>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{result.summary}</p>

            <div className="section-label">Required skills</div>
            <div className="mb-3">
              {result.required_skills?.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
            </div>

            {result.nice_to_have?.length > 0 && (
              <>
                <div className="section-label">Nice to have</div>
                <div className="mb-3">
                  {result.nice_to_have.map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
                </div>
              </>
            )}

            <div className="flex gap-2 flex-wrap mb-4">
              <span className="badge-blue">{result.seniority}</span>
              <span className="badge-blue">{result.years_exp} yrs exp</span>
              <span className="badge-green">{result.domain}</span>
            </div>

            <button
              className="btn-primary w-full justify-center"
              onClick={() => onAnalyzed(result)}
            >
              Score candidates against this JD →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
