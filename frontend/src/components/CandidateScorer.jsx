import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Users, Upload, AlertCircle } from 'lucide-react'
import { scoreCandidate } from '../lib/api'
import { getSessionId } from '../lib/session'

function MatchBar({ score }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-sm font-medium" style={{ color }}>{score}%</span>
    </div>
  )
}

export default function CandidateScorer({ jdAnalysis, shortlist, onShortlist }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onDrop = useCallback(async (files) => {
    if (!jdAnalysis) {
      setError('Analyze a job description first before scoring candidates.')
      return
    }
    setLoading(true)
    setError(null)
    const results = []
    for (const file of files) {
      try {
        const { data } = await scoreCandidate(
          file,
          getSessionId(),
          jdAnalysis.required_skills || [],
          jdAnalysis.nice_to_have || []
        )
        results.push({ ...data, id: Math.random().toString(36).slice(2) })
      } catch (e) {
        results.push({
          id: Math.random().toString(36).slice(2),
          filename: file.name,
          error: e.response?.data?.detail || 'Failed to parse this CV',
          candidate: { name: file.name, title: 'Parse error', skills: [] },
          score: 0, label: 'Error', matched_required: [], matched_nice: []
        })
      }
    }
    setCandidates(prev => [...prev, ...results])
    setLoading(false)
  }, [jdAnalysis])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] },
    multiple: true
  })

  const shortlistedNames = new Set(shortlist.map(s => s.candidate?.name))

  return (
    <div>
      <div className="card mb-4">
        {!jdAnalysis ? (
          <div className="text-center py-6 text-gray-400">
            <Users size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Go to "Job description" tab and analyze a JD first.</p>
          </div>
        ) : (
          <>
            <div className="section-label">Scoring against</div>
            <p className="text-sm text-gray-600 mb-3">{jdAnalysis.summary}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {jdAnalysis.required_skills?.slice(0, 8).map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
            </div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={22} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drop candidate CVs here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">PDF · DOCX · TXT · Multiple files supported</p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                Parsing and scoring candidates...
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 mb-4">
          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {candidates.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {candidates.sort((a, b) => b.score - a.score).map(c => {
            const isShortlisted = shortlistedNames.has(c.candidate?.name)
            const badgeClass = c.score >= 75 ? 'badge-green' : c.score >= 50 ? 'badge-amber' : 'badge-red'
            return (
              <div key={c.id} className={`card ${isShortlisted ? 'border-green-200' : ''}`}>
                {c.error ? (
                  <div className="text-xs text-red-500">{c.filename}: {c.error}</div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-sm">{c.candidate?.name}</div>
                        <div className="text-xs text-gray-400">{c.candidate?.title} · {c.candidate?.location}</div>
                      </div>
                      <span className={badgeClass}>{c.label}</span>
                    </div>
                    <MatchBar score={c.score} />
                    <div className="flex flex-wrap gap-1 mt-3">
                      {c.matched_required?.slice(0, 4).map((s, i) => <span key={i} className="skill-chip-match">{s}</span>)}
                      {c.candidate?.skills?.filter(s => !c.matched_required?.includes(s.toLowerCase())).slice(0, 2).map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
                    </div>
                    <div className="mt-3">
                      {isShortlisted ? (
                        <span className="badge-green flex items-center gap-1 text-xs px-3 py-1.5 w-full justify-center">
                          ✓ Shortlisted
                        </span>
                      ) : c.score >= 50 ? (
                        <button
                          className="btn-primary w-full justify-center text-xs py-2"
                          onClick={() => onShortlist(c)}
                        >
                          Add to shortlist
                        </button>
                      ) : (
                        <button className="btn-ghost w-full justify-center text-xs py-2" disabled>
                          Not suitable
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
