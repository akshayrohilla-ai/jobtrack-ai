import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Users, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { scoreCandidate } from '../lib/api'

function MatchBar({ score }) {
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: '6px', background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color, minWidth: '36px', textAlign: 'right' }}>{score}%</span>
    </div>
  )
}

export default function CandidateScorer({ jdAnalysis, shortlist, onShortlist }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const onDrop = useCallback(async (files) => {
    if (!jdAnalysis) { setError('Analyze a job description first before scoring candidates.'); return }
    setLoading(true); setError(null)
    const results = []
    for (const file of files) {
      try {
        const { data } = await scoreCandidate(file, jdAnalysis.required_skills || [], jdAnalysis.nice_to_have || [])
        results.push({ ...data, id: Math.random().toString(36).slice(2) })
      } catch (e) {
        results.push({
          id: Math.random().toString(36).slice(2),
          filename: file.name,
          error: e.response?.data?.detail || 'Failed to parse',
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
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: true
  })

  const shortlistedNames = new Set(shortlist.map(s => s.candidate?.name))

  return (
    <div className="animate-slide-up">
      <div className="card mb-4">
        {!jdAnalysis ? (
          <div className="text-center py-8" style={{ color: 'var(--text-ghost)' }}>
            <Users size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Go to "Job description" tab and analyze a JD first.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--blue-pale)', border: '1px solid #BFDBFE' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--blue-accent)' }}>Scoring against</div>
              <p className="text-sm" style={{ color: '#1D4ED8' }}>{jdAnalysis.summary}</p>
            </div>
            <div {...getRootProps()} className="rounded-xl p-6 text-center cursor-pointer transition-all"
              style={{ border: `2px dashed ${isDragActive ? 'var(--blue-accent)' : 'var(--border)'}`, background: isDragActive ? 'var(--blue-pale)' : 'var(--surface-raised)' }}>
              <input {...getInputProps()} />
              <Upload size={20} className="mx-auto mb-2" style={{ color: isDragActive ? 'var(--blue-accent)' : 'var(--text-ghost)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Drop candidate CVs here or click to upload</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-ghost)' }}>PDF · DOCX · TXT · Multiple files supported</p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span className="animate-spin w-4 h-4 border-2 rounded-full"
                  style={{ borderColor: 'var(--blue-accent)', borderTopColor: 'transparent' }} />Parsing and scoring candidates...
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg mb-4 text-xs"
          style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', color: 'var(--danger)' }}>
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {candidates.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {[...candidates].sort((a, b) => b.score - a.score).map(c => {
            const isShortlisted = shortlistedNames.has(c.candidate?.name)
            const badgeClass = c.score >= 75 ? 'badge-green' : c.score >= 50 ? 'badge-amber' : 'badge-red'
            const initials = c.candidate?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
            return (
              <div key={c.id} className="card" style={isShortlisted ? { borderColor: '#6EE7B7' } : {}}>
                {c.error ? (
                  <div className="text-xs" style={{ color: 'var(--danger)' }}>{c.filename}: {c.error}</div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                          style={{ background: 'var(--blue-accent)' }}>{initials}</div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.candidate?.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.candidate?.title}{c.candidate?.location ? ` · ${c.candidate.location}` : ''}</div>
                        </div>
                      </div>
                      <span className={badgeClass}>{c.label}</span>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs mb-1.5" style={{ color: 'var(--text-ghost)' }}>Match score</div>
                      <MatchBar score={c.score} />
                    </div>
                    <div className="flex flex-wrap mb-3">
                      {c.matched_required?.slice(0, 4).map((s, i) => <span key={i} className="skill-chip-match">{s}</span>)}
                      {c.candidate?.skills?.filter(s => !c.matched_required?.map(r => r.toLowerCase()).includes(s.toLowerCase())).slice(0, 2).map((s, i) => <span key={i} className="skill-chip">{s}</span>)}
                    </div>
                    {isShortlisted ? (
                      <span className="badge-green w-full justify-center py-2"><CheckCircle size={12} />Shortlisted</span>
                    ) : c.score >= 50 ? (
                      <button className="btn-primary w-full justify-center text-xs py-2" onClick={() => onShortlist(c)}>Add to shortlist</button>
                    ) : (
                      <button className="btn-ghost w-full justify-center text-xs py-2" disabled>Not suitable</button>
                    )}
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
